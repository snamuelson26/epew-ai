-- Canonical, service-only appointment recipients. Date/time-only legacy fields
-- use the same America/New_York convention as the existing booking/call flow.
create view public.epew_all_appointment_recipients with (security_invoker = true) as
with appointments as (
 select 'interview:'||a.id as source_key, a.id as application_id,
   (a.interview_date+a.interview_time) at time zone 'America/New_York' as starts_at,
   a.email, a.full_name as recipient_name, coalesce(r.communication_language,'en') as language,
   'Interview'::text as title, 'https://www.epew.us/entrepreneurs/dashboard'::text as portal_url
 from public.entrepreneur_applications a
 left join public.entrepreneur_reminder_contacts r on r.application_id=a.id
 where lower(a.interview_status)='scheduled' and a.interview_time is not null
   and coalesce(r.application_reminders_active,true)
 union all
 select 'orientation:'||a.id,a.id,(a.orientation_date+a.orientation_time) at time zone 'America/New_York',
   a.email,a.full_name,coalesce(r.communication_language,'en'),'Orientation','https://www.epew.us/entrepreneurs/dashboard'
 from public.entrepreneur_applications a
 left join public.entrepreneur_reminder_contacts r on r.application_id=a.id
 where lower(a.orientation_status)='scheduled' and a.orientation_time is not null
   and coalesce(r.application_reminders_active,true)
 union all
 select 'coach:'||m.id,m.application_id,m.scheduled_at,coalesce(nullif(r.email,''),a.email),a.full_name,
   coalesce(m.preferred_language,r.communication_language,'en'),replace(coalesce(m.meeting_type,'Coach meeting'),'_',' '),
   'https://www.epew.us/entrepreneurs/dashboard'
 from public.epew_coach_meetings m join public.entrepreneur_applications a on a.id=m.application_id
 left join public.entrepreneur_reminder_contacts r on r.application_id=a.id
 where lower(m.meeting_status) in ('scheduled','confirmed') and m.completed_at is null and m.started_at is null
   and coalesce(r.application_reminders_active,true)
 union all
 select 'supporter:'||m.id,null,m.scheduled_at,s.email,s.full_name,coalesce(m.preferred_language,'en'),
   'Supporter welcome meeting','https://www.epew.us/supporters/dashboard'
 from public.epew_supporter_welcome_meetings m join public.supporters s on s.id=m.supporter_id
 where lower(m.meeting_status) in ('scheduled','confirmed') and m.started_at is null and m.completed_at is null
 union all
 select 'organization:'||m.id,null,m.meeting_at,c.email,c.display_name,coalesce(c.preferred_language::text,'en'),m.title,
   'https://www.epew.us'
 from public.organization_meetings_followups m join public.communication_contacts c on c.id=m.contact_id
 where lower(m.status) in ('scheduled','confirmed','planned') and c.permission_email is not false
 union all
 select 'partner:'||d.id,d.application_id,d.scheduled_at,a.email,a.full_name,coalesce(r.communication_language,'en'),d.subject,
   'https://www.epew.us/entrepreneurs/dashboard'
 from public.etvmc_partner_discussions d join public.entrepreneur_applications a on a.id=d.application_id
 left join public.entrepreneur_reminder_contacts r on r.application_id=a.id
 where lower(d.current_status) in ('scheduled','confirmed') and d.completed_at is null
   and coalesce(r.application_reminders_active,true)
 union all
 -- Some administrator-scheduled interviews live on the marketplace record.
 -- The application-backed copy is preferred to avoid double reminders.
 select 'business-interview:'||e.id,e.source_application_id,
   (e.interview_date+e.interview_time) at time zone 'America/New_York',e.email,e.full_name,'en','Interview',
   'https://www.epew.us/entrepreneurs/dashboard'
 from public.entrepreneurs e
 where lower(e.interview_status)='scheduled' and e.interview_time is not null
 and not exists(select 1 from public.entrepreneur_applications a where
   (a.id=e.source_application_id or lower(a.email)=lower(e.email)) and lower(a.interview_status)='scheduled'
   and a.interview_date=e.interview_date and a.interview_time=e.interview_time)
)
select distinct source_key,application_id,starts_at,lower(trim(email)) as email,recipient_name,language,title,portal_url
from appointments where starts_at is not null;
revoke all on public.epew_all_appointment_recipients from public,anon,authenticated;
grant select on public.epew_all_appointment_recipients to service_role;
create table public.epew_appointment_message_optouts(phone text not null,channel text not null check(channel in ('sms','whatsapp')),created_at timestamptz not null default now(),primary key(phone,channel));
create table public.epew_appointment_message_config(key text primary key,value jsonb not null,updated_at timestamptz not null default now());
create table public.epew_appointment_message_deliveries(
 id uuid primary key default gen_random_uuid(),source_key text not null,starts_at timestamptz not null,
 channel text not null check(channel in ('sms','whatsapp')),phone text not null,
 hours_before integer not null check(hours_before in(168,24,1)),due_at timestamptz not null,payload jsonb not null,
 status text not null default 'pending' check(status in ('pending','processing','accepted','delivered','read','failed','unknown','cancelled','expired','blocked')),
 attempts integer not null default 0,claimed_at timestamptz,next_attempt_at timestamptz not null default now(),
 provider_message_id text unique,error_code text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(source_key,starts_at,channel,phone,hours_before)
);
do $$ declare t text; begin foreach t in array array['epew_appointment_message_optouts','epew_appointment_message_config','epew_appointment_message_deliveries'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('create policy service_only on public.%I for all to service_role using(true) with check(true)',t);
end loop; end $$;
create index appointment_messages_due on public.epew_appointment_message_deliveries(due_at,next_attempt_at) where status in('pending','blocked');
create view public.epew_appointment_mobile_recipients with(security_invoker=true) as
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
 where r.priority_channel='sms' and r.weekly_information_consent and r.application_reminders_active
)
select distinct r.* from recipients r where r.phone ~ '^\+[1-9][0-9]{7,14}$'
 and not exists(select 1 from public.epew_appointment_message_optouts o where o.phone=r.phone and o.channel=r.channel);
revoke all on public.epew_appointment_mobile_recipients from public,anon,authenticated;
grant select on public.epew_appointment_mobile_recipients to service_role;
create function public.epew_prepare_appointment_messages() returns integer language plpgsql security invoker set search_path=public as $$
declare n integer; begin
 insert into public.epew_appointment_message_deliveries(source_key,starts_at,channel,phone,hours_before,due_at,payload)
 select a.source_key,a.starts_at,a.channel,a.phone,h.hours,a.starts_at-make_interval(hours=>h.hours),to_jsonb(a)
 from public.epew_appointment_mobile_recipients a cross join(values(168),(24),(1)) h(hours)
 where a.starts_at>now() and a.starts_at<now()+interval '1 year' and a.starts_at-make_interval(hours=>h.hours)>=now()-interval '1 minute'
 on conflict(source_key,starts_at,channel,phone,hours_before) do nothing;
 get diagnostics n=row_count;
 update public.epew_appointment_message_deliveries d set status='cancelled' where status in('pending','blocked') and not exists(
 select 1 from public.epew_appointment_mobile_recipients a where a.source_key=d.source_key and a.starts_at=d.starts_at and a.phone=d.phone and a.channel=d.channel);
 update public.epew_appointment_message_deliveries set status='expired' where status in('pending','blocked') and (starts_at<=now() or due_at<now()-interval '30 minutes');
 -- Twilio message creation has no idempotency key. Never blindly resend an
 -- uncertain submission after a worker crash; its signed callback can recover it.
 update public.epew_appointment_message_deliveries set status='unknown',error_code='acknowledgement_missing' where status='processing' and claimed_at<now()-interval '5 minutes';
 return n; end $$;
create function public.epew_claim_appointment_messages() returns setof public.epew_appointment_message_deliveries language sql security invoker set search_path=public as $$
 update public.epew_appointment_message_deliveries set status='processing',claimed_at=now(),attempts=attempts+1
 where id in(select id from public.epew_appointment_message_deliveries where status in('pending','blocked') and next_attempt_at<=now() and due_at<=now() and due_at>now()-interval '30 minutes' and starts_at>now() and attempts<10 order by due_at for update skip locked limit 10) returning *;
$$;
revoke all on function public.epew_prepare_appointment_messages(),public.epew_claim_appointment_messages() from public,anon,authenticated;
grant execute on function public.epew_prepare_appointment_messages(),public.epew_claim_appointment_messages() to service_role;
