-- Canonical, service-only appointment recipients. Date/time-only legacy fields
-- use the same America/New_York convention as the existing booking/call flow.
create view public.epew_appointment_recipients with (security_invoker = true) as
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
from appointments where starts_at is not null and nullif(trim(email),'') is not null;
revoke all on public.epew_appointment_recipients from public,anon,authenticated;
grant select on public.epew_appointment_recipients to service_role;

create table public.epew_appointment_reminders (
 id uuid primary key default gen_random_uuid(),
 source_key text not null, starts_at timestamptz not null, email text not null,
 hours_before integer not null check(hours_before in (168,24,1)),
 due_at timestamptz not null, payload jsonb not null,
 status text not null default 'pending' check(status in ('pending','processing','sent','failed','cancelled','expired','suppressed')),
 attempts integer not null default 0, next_attempt_at timestamptz not null default now(),
 claimed_at timestamptz, sent_at timestamptz, provider_message_id text, error_message text,
 created_at timestamptz not null default now(),
 unique(source_key,starts_at,email,hours_before)
);
alter table public.epew_appointment_reminders enable row level security;
create policy appointment_reminders_service_only on public.epew_appointment_reminders for all to service_role using (true) with check (true);
revoke all on public.epew_appointment_reminders from public,anon,authenticated;
grant all on public.epew_appointment_reminders to service_role;
create index epew_appointment_reminders_due on public.epew_appointment_reminders(due_at,next_attempt_at)
 where status in ('pending','processing');

create function public.epew_prepare_appointment_reminders() returns integer
language plpgsql security invoker set search_path=public as $$
declare inserted integer;
begin
 insert into public.epew_appointment_reminders(source_key,starts_at,email,hours_before,due_at,payload)
 select a.source_key,a.starts_at,a.email,h.hours,a.starts_at-make_interval(hours=>h.hours),to_jsonb(a)
 from public.epew_appointment_recipients a cross join (values(168),(24),(1)) h(hours)
 where a.starts_at>now() and a.starts_at<now()+interval '1 year'
 -- Do not send already-missed reminder stages for a short-notice booking.
 and a.starts_at-make_interval(hours=>h.hours)>=now()-interval '1 minute'
 on conflict(source_key,starts_at,email,hours_before) do nothing;
 get diagnostics inserted=row_count;
 update public.epew_appointment_reminders r set status='cancelled'
 where r.status in ('pending','processing') and not exists (
 select 1 from public.epew_appointment_recipients a where a.source_key=r.source_key and a.starts_at=r.starts_at and a.email=r.email);
 update public.epew_appointment_reminders set status='expired'
 where status in ('pending','processing') and (starts_at<=now() or due_at<now()-interval '30 minutes');
 return inserted;
end $$;
revoke all on function public.epew_prepare_appointment_reminders() from public,anon,authenticated;
grant execute on function public.epew_prepare_appointment_reminders() to service_role;

create function public.epew_claim_appointment_reminders() returns setof public.epew_appointment_reminders
language sql security invoker set search_path=public as $$
 update public.epew_appointment_reminders r set status='processing',claimed_at=now(),attempts=attempts+1
 where id in (select id from public.epew_appointment_reminders
 where ((status='pending' and next_attempt_at<=now()) or (status='processing' and claimed_at<now()-interval '5 minutes'))
 and due_at<=now() and due_at>now()-interval '30 minutes' and starts_at>now() and attempts<5
 order by due_at for update skip locked limit 20)
 returning r.*;
$$;
revoke all on function public.epew_claim_appointment_reminders() from public,anon,authenticated;
grant execute on function public.epew_claim_appointment_reminders() to service_role;

-- Activation is separate, after the application endpoint has deployed.
create schema if not exists epew_private;
revoke all on schema epew_private from public,anon,authenticated;
create function epew_private.trigger_appointment_reminders() returns bigint
language plpgsql security invoker set search_path=pg_catalog as $$
declare secret text; request_id bigint;
begin
 select decrypted_secret into secret from vault.decrypted_secrets where name='EPEW_CRON_SECRET' limit 1;
 if secret is null then raise exception 'Appointment scheduler secret is missing'; end if;
 select net.http_get(url:='https://www.epew.us/api/internal/meetings/process-reminders',
 headers:=jsonb_build_object('Authorization','Bearer '||secret),timeout_milliseconds:=60000) into request_id;
 return request_id;
end $$;
revoke all on function epew_private.trigger_appointment_reminders() from public,anon,authenticated;
