-- =========================================================
-- EPEW – EDE – IBOS
-- EMCC No-Show Recovery Automation
-- =========================================================

create table if not exists public.epew_no_show_recovery_cases (
  id uuid primary key default gen_random_uuid(),

  meeting_id text not null unique
    references public.epew_coach_meetings(id)
    on delete cascade,

  application_id bigint not null
    references public.entrepreneur_applications(id)
    on delete cascade,

  coach_assignment_id uuid null
    references public.coach_assignments(id)
    on delete set null,

  entrepreneur_user_id uuid null,

  participant_name text null,
  participant_email text not null,

  status text not null default 'active'
    check (
      status in (
        'active',
        'rescheduled',
        'completed',
        'closed_due_to_inactivity',
        'cancelled'
      )
    ),

  no_show_detected_at timestamptz not null,
  recovery_started_at timestamptz not null,
  recovery_deadline_at timestamptz not null,

  next_required_action text not null
    default 'submit_new_availability',

  rescheduled_at timestamptz null,
  closed_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  idx_epew_no_show_recovery_active
  on public.epew_no_show_recovery_cases(
    status,
    recovery_deadline_at
  );

-- =========================================================
-- Backend communication outbox
-- =========================================================

create table if not exists public.epew_communication_outbox (
  id uuid primary key default gen_random_uuid(),

  application_id bigint null
    references public.entrepreneur_applications(id)
    on delete set null,

  recovery_case_id uuid null
    references public.epew_no_show_recovery_cases(id)
    on delete cascade,

  recipient_email text not null,
  recipient_name text null,

  message_type text not null,
  subject text not null,

  template_key text not null,

  payload jsonb not null default '{}'::jsonb,

  due_at timestamptz not null default now(),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'processing',
        'sent',
        'failed',
        'cancelled'
      )
    ),

  idempotency_key text not null unique,

  attempt_count integer not null default 0,
  last_attempt_at timestamptz null,
  sent_at timestamptz null,
  error_message text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  idx_epew_communication_outbox_pending
  on public.epew_communication_outbox(
    status,
    due_at
  );

alter table public.epew_no_show_recovery_cases
  enable row level security;

alter table public.epew_communication_outbox
  enable row level security;

-- Backend only.
-- No ordinary authenticated policies are intentionally created.

-- =========================================================
-- updated_at
-- =========================================================

drop trigger if exists
  trg_epew_no_show_recovery_updated_at
  on public.epew_no_show_recovery_cases;

create trigger
  trg_epew_no_show_recovery_updated_at
before update on public.epew_no_show_recovery_cases
for each row
execute function public.epew_set_updated_at();

drop trigger if exists
  trg_epew_communication_outbox_updated_at
  on public.epew_communication_outbox;

create trigger
  trg_epew_communication_outbox_updated_at
before update on public.epew_communication_outbox
for each row
execute function public.epew_set_updated_at();

-- =========================================================
-- No-show detector
-- 15-minute grace period
-- =========================================================

create or replace function public.epew_process_establishment_meeting_no_shows()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_detected integer := 0;
  v_reminders integer := 0;
  v_closed integer := 0;
begin

  -- -------------------------------------------------------
  -- 1. Mark missed Establishment Meetings after 15 minutes
  -- -------------------------------------------------------

  with missed as (
    update public.epew_coach_meetings m
    set
      meeting_status = 'no_show',
      updated_at = v_now
    where
      m.meeting_type = 'entrepreneur_first_meeting'
      and m.meeting_status in ('scheduled', 'ready_to_start')
      and m.started_at is null
      and m.scheduled_at is not null
      and m.scheduled_at <= v_now - interval '15 minutes'
    returning
      m.id,
      m.application_id,
      m.coach_assignment_id,
      m.entrepreneur_user_id,
      m.scheduled_at
  ),
  created_cases as (
    insert into public.epew_no_show_recovery_cases (
      meeting_id,
      application_id,
      coach_assignment_id,
      entrepreneur_user_id,
      participant_name,
      participant_email,
      status,
      no_show_detected_at,
      recovery_started_at,
      recovery_deadline_at,
      next_required_action
    )
    select
      missed.id,
      missed.application_id,
      missed.coach_assignment_id,
      missed.entrepreneur_user_id,
      app.full_name,
      app.email,
      'active',
      v_now,
      v_now,
      v_now + interval '7 days',
      'submit_new_availability'
    from missed
    join public.entrepreneur_applications app
      on app.id = missed.application_id
    where app.email is not null
    on conflict (meeting_id) do nothing
    returning *
  )
  select count(*)
  into v_detected
  from created_cases;

  -- -------------------------------------------------------
  -- 2. Update Coach assignment
  -- -------------------------------------------------------

  update public.coach_assignments ca
  set
    first_interview_status = 'no_show'
  where exists (
    select 1
    from public.epew_no_show_recovery_cases r
    where
      r.coach_assignment_id = ca.id
      and r.status = 'active'
      and r.no_show_detected_at >= v_now - interval '2 minutes'
  );

  -- -------------------------------------------------------
  -- 3. Permanent operational history
  -- -------------------------------------------------------

  insert into public.epew_operational_history (
    application_id,
    entrepreneur_user_id,
    event_type,
    event_name,
    event_description,
    previous_status,
    new_status,
    occurred_at,

    actor_role,
    actor_type,
    actor_name,

    decision_made_by_role,
    decision_made_by_type,
    decision_made_by_name,
    decision_organization,
    decision_reason,
    decision_at,

    executed_by,
    recorded_by,
    source_system,

    reference_type,
    reference_id,

    metadata
  )
  select
    r.application_id,
    r.entrepreneur_user_id,

    'meeting_no_show',
    'Establishment Meeting No Show Detected',
    'The scheduled Establishment Meeting did not start within the 15-minute grace period.',

    'scheduled',
    'no_show',

    r.no_show_detected_at,

    'system',
    'system_automation',
    'EMCC No-Show Detector',

    'system',
    'system_automation',
    'EMCC Scheduling Engine',
    'EPEW',

    'The participant did not start the Establishment Meeting within the 15-minute grace period.',

    r.no_show_detected_at,

    'epew_process_establishment_meeting_no_shows',
    'EPEW EDE / IBOS',
    'EMCC Scheduling Engine',

    'coach_meeting',
    r.meeting_id,

    jsonb_build_object(
      'recoveryCaseId', r.id,
      'recoveryDeadlineAt', r.recovery_deadline_at,
      'gracePeriodMinutes', 15,
      'nextRequiredAction', 'submit_new_availability'
    )

  from public.epew_no_show_recovery_cases r

  where
    not exists (
      select 1
      from public.epew_operational_history h
      where
        h.reference_type = 'coach_meeting'
        and h.reference_id = r.meeting_id
        and h.event_type = 'meeting_no_show'
    );

  -- -------------------------------------------------------
  -- 4. Initial missed appointment / Day 7 email
  -- -------------------------------------------------------

  insert into public.epew_communication_outbox (
    application_id,
    recovery_case_id,
    recipient_email,
    recipient_name,
    message_type,
    subject,
    template_key,
    payload,
    due_at,
    idempotency_key
  )
  select
    r.application_id,
    r.id,
    r.participant_email,
    r.participant_name,

    'establishment_meeting_no_show',

    'We Missed You at Your EPEW Establishment Meeting',

    'establishment_meeting_no_show',

    jsonb_build_object(
      'daysRemaining', 7,
      'meetingId', r.meeting_id,
      'recoveryDeadlineAt', r.recovery_deadline_at,
      'action', 'choose_your_best_time'
    ),

    r.no_show_detected_at,

    'no-show:' || r.meeting_id || ':day-7'

  from public.epew_no_show_recovery_cases r

  where r.status = 'active'

  on conflict (idempotency_key) do nothing;

  -- -------------------------------------------------------
  -- 5. Daily countdown reminders: Day 6 through Day 1
  -- -------------------------------------------------------

  with reminder_days as (
    select
      r.*,
      greatest(
        1,
        least(
          6,
          ceil(
            extract(
              epoch from (
                r.recovery_deadline_at - v_now
              )
            ) / 86400.0
          )::integer
        )
      ) as days_remaining
    from public.epew_no_show_recovery_cases r
    where
      r.status = 'active'
      and v_now >= r.recovery_started_at + interval '23 hours'
      and v_now < r.recovery_deadline_at
  ),
  inserted_reminders as (
    insert into public.epew_communication_outbox (
      application_id,
      recovery_case_id,
      recipient_email,
      recipient_name,
      message_type,
      subject,
      template_key,
      payload,
      due_at,
      idempotency_key
    )
    select
      r.application_id,
      r.id,
      r.participant_email,
      r.participant_name,

      'establishment_meeting_recovery_reminder',

      case
        when r.days_remaining = 1
          then 'Final Reminder — 1 Day Remaining to Continue Your EPEW Application'
        else
          'EPEW Reminder — ' ||
          r.days_remaining ||
          ' Days Remaining to Reschedule'
      end,

      'establishment_meeting_recovery_reminder',

      jsonb_build_object(
        'daysRemaining', r.days_remaining,
        'meetingId', r.meeting_id,
        'recoveryDeadlineAt', r.recovery_deadline_at,
        'action', 'choose_your_best_time'
      ),

      v_now,

      'no-show:' ||
      r.meeting_id ||
      ':day-' ||
      r.days_remaining::text

    from reminder_days r

    on conflict (idempotency_key) do nothing

    returning id
  )
  select count(*)
  into v_reminders
  from inserted_reminders;

  -- -------------------------------------------------------
  -- 6. Close recovery after 7 days of no response
  -- -------------------------------------------------------

  with closed_cases as (
    update public.epew_no_show_recovery_cases r
    set
      status = 'closed_due_to_inactivity',
      next_required_action = 'reapply',
      closed_at = v_now
    where
      r.status = 'active'
      and r.recovery_deadline_at <= v_now
    returning *
  )
  select count(*)
  into v_closed
  from closed_cases;

  -- Current application record is retained for audit,
  -- but the active application process is closed.
  update public.entrepreneur_applications app
  set
    status = 'closed_due_to_inactivity'
  where exists (
    select 1
    from public.epew_no_show_recovery_cases r
    where
      r.application_id = app.id
      and r.status = 'closed_due_to_inactivity'
      and r.closed_at >= v_now - interval '2 minutes'
  );

  -- Release the Coach assignment after recovery expires.
  update public.coach_assignments ca
  set
    assignment_status = 'ended'
  where exists (
    select 1
    from public.epew_no_show_recovery_cases r
    where
      r.coach_assignment_id = ca.id
      and r.status = 'closed_due_to_inactivity'
      and r.closed_at >= v_now - interval '2 minutes'
  );

  -- Queue final closure email.
  insert into public.epew_communication_outbox (
    application_id,
    recovery_case_id,
    recipient_email,
    recipient_name,
    message_type,
    subject,
    template_key,
    payload,
    due_at,
    idempotency_key
  )
  select
    r.application_id,
    r.id,
    r.participant_email,
    r.participant_name,

    'application_closed_due_to_inactivity',

    'Your EPEW Application Has Been Closed',

    'application_closed_due_to_inactivity',

    jsonb_build_object(
      'meetingId', r.meeting_id,
      'action', 'reapply'
    ),

    v_now,

    'no-show:' || r.meeting_id || ':closed'

  from public.epew_no_show_recovery_cases r

  where r.status = 'closed_due_to_inactivity'

  on conflict (idempotency_key) do nothing;

  return jsonb_build_object(
    'processedAt', v_now,
    'noShowsDetected', v_detected,
    'remindersQueued', v_reminders,
    'applicationsClosed', v_closed
  );
end;
$$;

revoke all
on function public.epew_process_establishment_meeting_no_shows()
from public, anon, authenticated;

grant execute
on function public.epew_process_establishment_meeting_no_shows()
to service_role;

-- =========================================================
-- Cron: run once every minute
-- =========================================================

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'epew-emcc-no-show-recovery-every-minute'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'epew-emcc-no-show-recovery-every-minute',
  '* * * * *',
  'select public.epew_process_establishment_meeting_no_shows();'
);

comment on table public.epew_no_show_recovery_cases is
'EMCC seven-day recovery process after a participant misses an Establishment Meeting.';

comment on table public.epew_communication_outbox is
'Backend-only queue for EPEW communications generated by automated enterprise workflows.';
