-- Private event history. No sending, consent grants, or automatic resubscription.
create table public.epew_sent_events (
  event_key text primary key,
  field text not null,
  event text not null,
  message_id uuid,
  channel text,
  payload jsonb not null,
  received_at timestamptz not null default now()
);
alter table public.epew_sent_events enable row level security;
revoke all on public.epew_sent_events from public, anon, authenticated;
grant select, insert on public.epew_sent_events to service_role;
create policy service_read on public.epew_sent_events for select to service_role using(true);
create policy service_insert on public.epew_sent_events for insert to service_role with check(true);
create index epew_sent_message_events on public.epew_sent_events(message_id,received_at);

create function public.epew_record_sent_event(
  p_key text, p_field text, p_event text, p_message_id uuid,
  p_channel text, p_payload jsonb, p_stop_phone text
) returns void language plpgsql security invoker set search_path='' as $$
begin
  if p_payload->'value'->>'account_id' is distinct from '6318afbb-beb3-4007-ae43-dc1af34241ab'
    then raise exception 'Account mismatch'; end if;
  insert into public.epew_sent_events(event_key,field,event,message_id,channel,payload)
    values(p_key,p_field,p_event,p_message_id,p_channel,p_payload)
    on conflict(event_key) do nothing;
  if p_stop_phone is not null then
    if p_stop_phone !~ '^\+[1-9][0-9]{7,14}$' or p_channel not in ('sms','whatsapp')
      or p_field <> 'message' or p_event <> 'message.received'
      then raise exception 'Invalid suppression'; end if;
    insert into public.epew_appointment_message_optouts(phone,channel)
      values(p_stop_phone,p_channel) on conflict(phone,channel) do nothing;
  end if;
end $$;
revoke all on function public.epew_record_sent_event(text,text,text,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.epew_record_sent_event(text,text,text,uuid,text,jsonb,text) to service_role;
