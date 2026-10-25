-- Apply only after Samuel approves the complete release. No legacy consent backfill.
alter table public.entrepreneur_reminder_contacts
  add column email_information_consent boolean not null default false,
  add column sms_consent boolean not null default false,
  add column sms_consent_phone text,
  add column sms_consented_at timestamptz,
  add column sms_consent_source text,
  add column sms_consent_language text,
  add column sms_disclosure_version text,
  add column sms_disclosure text,
  add column sms_preference_updated_at timestamptz,
  add constraint explicit_sms_evidence check (not sms_consent or (
    phone is not null and sms_consent_phone is not null and sms_consent_phone = phone and
    sms_consent_phone ~ '^\+[1-9][0-9]{7,14}$' and
    sms_consented_at is not null and sms_consent_source is not null and
    sms_consent_language is not null and sms_disclosure_version is not null and
    sms_disclosure is not null and sms_preference_updated_at is not null));

create table public.epew_sms_consent_events (
  id bigint generated always as identity primary key,
  contact_id uuid not null,
  user_id uuid,
  phone text,
  granted boolean not null,
  consented_at timestamptz,
  recorded_at timestamptz not null default now(),
  source text not null,
  language text not null,
  disclosure_version text not null,
  disclosure text not null
);
alter table public.epew_sms_consent_events enable row level security;
revoke all on public.epew_sms_consent_events from public, anon, authenticated;
grant select, insert on public.epew_sms_consent_events to service_role;
grant usage, select on sequence public.epew_sms_consent_events_id_seq to service_role;
create policy service_read_insert on public.epew_sms_consent_events for select to service_role using(true);
create policy service_insert on public.epew_sms_consent_events for insert to service_role with check(true);

create function public.epew_record_sms_consent() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if new.sms_preference_updated_at is not null then
    if tg_op='INSERT' or new.sms_preference_updated_at is distinct from old.sms_preference_updated_at then
      insert into public.epew_sms_consent_events(contact_id,user_id,phone,granted,consented_at,source,language,disclosure_version,disclosure)
      values(new.id,new.user_id,new.phone,new.sms_consent,new.sms_consented_at,new.sms_consent_source,new.sms_consent_language,new.sms_disclosure_version,new.sms_disclosure);
    end if;
  end if;
  return new;
end $$;
create trigger record_sms_consent after insert or update on public.entrepreneur_reminder_contacts
for each row execute function public.epew_record_sms_consent();
revoke all on function public.epew_record_sms_consent() from public,anon,authenticated;
grant execute on function public.epew_record_sms_consent() to service_role;

create index explicit_sms_phone on public.entrepreneur_reminder_contacts(sms_consent_phone) where sms_consent;
create index sms_consent_actor_latest on public.epew_sms_consent_events(user_id,id desc);
create function public.epew_can_send_application_sms(p_phone text) returns boolean
language sql stable security invoker set search_path='' as $$
  select coalesce(p_phone ~ '^\+[1-9][0-9]{7,14}$', false)
    and exists(select 1 from public.entrepreneur_reminder_contacts r
      where r.sms_consent_phone=p_phone and r.phone=p_phone and r.sms_consent
        and r.sms_consented_at is not null and r.sms_preference_updated_at is not null
        and r.sms_consent_source='https://epew.us/entrepreneurs/communication-preferences'
        and r.sms_disclosure_version='epew-application-sms-2026-10-25-v1'
        and r.user_id is not null and r.status='active'
        and r.id=(select e.contact_id from public.epew_sms_consent_events e
          where e.user_id=r.user_id order by e.id desc limit 1))
    and not exists(select 1 from public.epew_appointment_message_optouts o
      where o.phone=p_phone and o.channel='sms');
$$;
revoke all on function public.epew_can_send_application_sms(text) from public,anon,authenticated;
grant execute on function public.epew_can_send_application_sms(text) to service_role;

create or replace view public.epew_appointment_mobile_recipients with(security_invoker=true) as
with recipients as (
 select a.*,channel.channel,
 regexp_replace(case when channel.channel='whatsapp' then coalesce(nullif(c.normalized_whatsapp_number,''),nullif(c.whatsapp_number,''),c.normalized_phone,c.phone)
 else coalesce(nullif(c.normalized_phone,''),c.phone) end,'[[:space:]().-]','','g') as phone
 from public.epew_all_appointment_recipients a join public.communication_contacts c on (
 lower(trim(c.email))=a.email
 or (c.user_id is not null and c.user_id=(select x.user_id from public.entrepreneur_applications x where x.id=a.application_id))
 or (a.source_key like 'supporter:%' and c.user_id is not null and exists(select 1 from public.epew_supporter_welcome_meetings m where 'supporter:'||m.id=a.source_key and m.supporter_user_id=c.user_id))
 or (a.source_key like 'organization:%' and exists(select 1 from public.organization_meetings_followups m where 'organization:'||m.id=a.source_key and m.contact_id=c.id))
 )
 cross join (values('sms'),('whatsapp')) channel(channel)
 where ((channel.channel='sms' and c.permission_sms) or (channel.channel='whatsapp' and c.permission_whatsapp))
 union all
 select a.*,'sms',regexp_replace(r.phone,'[[:space:]().-]','','g')
 from public.epew_all_appointment_recipients a join public.entrepreneur_reminder_contacts r on r.application_id=a.application_id
 where r.sms_consent and r.application_reminders_active
)
select distinct r.* from recipients r where (r.channel<>'sms' or public.epew_can_send_application_sms(r.phone)) and r.phone ~ '^\+[1-9][0-9]{7,14}$'
 and not exists(select 1 from public.epew_appointment_message_optouts o where o.phone=r.phone and o.channel=r.channel);
revoke all on public.epew_appointment_mobile_recipients from public,anon,authenticated;
grant select on public.epew_appointment_mobile_recipients to service_role;
