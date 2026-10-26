-- Sending remains disabled in application configuration. This migration only
-- adds provider isolation, durable message binding and event projection.
alter table public.epew_appointment_message_deliveries
  add column provider text not null default 'twilio' check(provider in ('twilio','sent')),
  add column sent_event_updated_at timestamptz;

create function public.epew_sent_event_time(p_value text) returns timestamptz
language plpgsql stable security invoker set search_path='' as $$
begin
  if p_value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T' or p_value !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' then return null; end if;
  return p_value::timestamptz;
exception when others then return null; end $$;

create function public.epew_project_sent_appointment(p_message_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare d public.epew_appointment_message_deliveries; e record; mapped text;
begin
  select * into d from public.epew_appointment_message_deliveries
    where provider='sent' and provider_message_id=p_message_id::text for update;
  if not found then return; end if;
  select x.event, public.epew_sent_event_time(x.payload->'value'->>'updated_at') as event_time
    into e from public.epew_sent_events x
    where x.message_id=p_message_id and x.field='message'
      and (x.channel in (d.channel,'auto','sent') or x.channel is null)
      and x.event in ('message.queued','message.routed','message.sent','message.scheduled',
        'message.delivered','message.read','message.failed','message.filtered','message.blocked','message.cancelled')
      and public.epew_sent_event_time(x.payload->'value'->>'updated_at') is not null
    order by public.epew_sent_event_time(x.payload->'value'->>'updated_at') desc,
      case x.event when 'message.read' then 3 when 'message.delivered' then 2 else 1 end desc,
      x.received_at desc limit 1;
  if not found or (d.sent_event_updated_at is not null and e.event_time<d.sent_event_updated_at) then return; end if;
  mapped=case e.event when 'message.read' then 'read' when 'message.delivered' then 'delivered'
    when 'message.failed' then 'unknown' when 'message.filtered' then 'failed'
    when 'message.blocked' then 'failed' when 'message.cancelled' then 'cancelled' else 'accepted' end;
  -- Delivery/read evidence cannot be regressed by delayed pipeline callbacks.
  if d.status='read' or (d.status='delivered' and mapped<>'read') then return; end if;
  update public.epew_appointment_message_deliveries set status=mapped,
    error_code=case e.event when 'message.failed' then 'sent_route_failed_requires_reconciliation'
      when 'message.filtered' then 'sent_policy_filtered' when 'message.blocked' then 'sent_account_blocked' else null end,
    sent_event_updated_at=e.event_time,updated_at=now() where id=d.id;
end $$;

create function public.epew_reserve_sent_appointment(p_delivery_id uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare d public.epew_appointment_message_deliveries;
begin
  select * into d from public.epew_appointment_message_deliveries where id=p_delivery_id for update;
  if not found or d.status<>'processing' or d.provider_message_id is not null
    or (d.provider<>'sent' and d.attempts>1) then return false; end if;
  update public.epew_appointment_message_deliveries set provider='sent',updated_at=now() where id=d.id;
  return true;
end $$;

create function public.epew_bind_sent_appointment(p_delivery_id uuid,p_message_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
  update public.epew_appointment_message_deliveries set provider_message_id=p_message_id::text,
    status=case when status in ('processing','unknown') then 'accepted' else status end,
    error_code=null,updated_at=now()
    where id=p_delivery_id and provider='sent'
      and status in ('processing','unknown','accepted','delivered','read')
      and (provider_message_id is null or provider_message_id=p_message_id::text);
  if not found then raise exception 'Delivery cannot be bound'; end if;
  -- The provider may have called back before its send response was received.
  perform public.epew_project_sent_appointment(p_message_id);
end $$;

create function public.epew_project_sent_event_trigger() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if new.field='message' and new.message_id is not null then
    perform public.epew_project_sent_appointment(new.message_id);
  end if;
  return new;
end $$;
create trigger project_sent_appointment after insert on public.epew_sent_events
for each row execute function public.epew_project_sent_event_trigger();

revoke all on function public.epew_sent_event_time(text),public.epew_project_sent_appointment(uuid),
  public.epew_reserve_sent_appointment(uuid),public.epew_bind_sent_appointment(uuid,uuid),
  public.epew_project_sent_event_trigger() from public,anon,authenticated;
grant execute on function public.epew_sent_event_time(text),public.epew_project_sent_appointment(uuid),
  public.epew_reserve_sent_appointment(uuid),public.epew_bind_sent_appointment(uuid,uuid),
  public.epew_project_sent_event_trigger() to service_role;
