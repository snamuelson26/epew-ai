-- =========================================================
-- EPEW – EDE – IBOS
-- Repeated Establishment Meeting No-Show Recovery Cycles
-- =========================================================

-- Remove legacy one-recovery-per-meeting restriction.
alter table public.epew_no_show_recovery_cases
drop constraint if exists epew_no_show_recovery_cases_meeting_id_key;

-- Preserve recovery history efficiently.
create index if not exists
  idx_epew_no_show_recovery_meeting_history
on public.epew_no_show_recovery_cases (
  meeting_id,
  created_at desc
);

-- Only one OPEN recovery cycle may exist for a meeting.
create unique index if not exists
  idx_epew_no_show_recovery_one_open_per_meeting
on public.epew_no_show_recovery_cases (meeting_id)
where status in ('active', 'responded');

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
  -- 1. Mark newly missed Establishment Meetings.
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
      and m.scheduled_at <= v_now - interval '10 minutes'
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
    where
      app.email is not null
      and not exists (
        select 1
        from public.epew_no_show_recovery_cases existing
        where
          existing.meeting_id = missed.id
          and existing.status in ('active', 'responded')
      )
    returning *
  )
  select count(*)
  into v_detected
  from created_cases;

  -- -------------------------------------------------------
  -- 2. Repair already-stranded repeated no-shows.
  -- -------------------------------------------------------

  with stranded as (
    select
      m.id as meeting_id,
      m.application_id,
      m.coach_assignment_id,
      m.entrepreneur_user_id,
      app.full_name,
      app.email
    from public.epew_coach_meetings m
    join public.entrepreneur_applications app
      on app.id = m.application_id
    where
      m.meeting_type = 'entrepreneur_first_meeting'
      and m.meeting_status = 'no_show'
      and app.email is not null
      and not exists (
        select 1
        from public.epew_no_show_recovery_cases open_case
        where
          open_case.meeting_id = m.id
          and open_case.status in ('active', 'responded')
      )
      and (
        select prior.status
        from public.epew_no_show_recovery_cases prior
        where prior.meeting_id = m.id
        order by prior.created_at desc
        limit 1
      ) = 'rescheduled'
  ),
  repaired_cases as (
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
      stranded.meeting_id,
      stranded.application_id,
      stranded.coach_assignment_id,
      stranded.entrepreneur_user_id,
      stranded.full_name,
      stranded.email,
      'active',
      v_now,
      v_now,
      v_now + interval '7 days',
      'submit_new_availability'
    from stranded
    returning *
  )
  select
    v_detected + count(*)
  into v_detected
  from repaired_cases;

  -- -------------------------------------------------------
  -- 3. Update Coach assignment.
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
  -- 4. Permanent operational history.
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
    'The scheduled Establishment Meeting did not start within the 10-minute grace period.',

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

    'The participant did not start the Establishment Meeting within the 10-minute grace period.',

    r.no_show_detected_at,

    'epew_process_establishment_meeting_no_shows',
    'EPEW EDE / IBOS',
    'EMCC Scheduling Engine',

    'coach_meeting',
    r.meeting_id,

    jsonb_build_object(
      'recoveryCaseId', r.id,
      'recoveryDeadlineAt', r.recovery_deadline_at,
      'gracePeriodMinutes', 10,
      'nextRequiredAction', 'submit_new_availability'
    )

  from public.epew_no_show_recovery_cases r

  where
    not exists (
      select 1
      from public.epew_operational_history h
      where
        h.event_type = 'meeting_no_show'
        and h.metadata ->> 'recoveryCaseId' = r.id::text
    );

  -- -------------------------------------------------------
  -- 5. Initial Day 7 no-show email.
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
      'recoveryCaseId', r.id,
      'recoveryDeadlineAt', r.recovery_deadline_at,
      'action', 'choose_your_best_time'
    ),

    r.no_show_detected_at,

    'no-show:' || r.id::text || ':day-7'

  from public.epew_no_show_recovery_cases r

  where
    r.status = 'active'
    and r.no_show_detected_at >= v_now - interval '2 minutes'
    and not exists (
      select 1
      from public.epew_communication_outbox existing_outbox
      where
        existing_outbox.idempotency_key =
          'no-show:' || r.id::text || ':day-7'
        or (
          existing_outbox.idempotency_key =
            'no-show:' || r.meeting_id || ':day-7'
          and existing_outbox.recovery_case_id = r.id
        )
    )

  on conflict (idempotency_key) do nothing;

  -- -------------------------------------------------------
  -- 6. Daily countdown reminders.
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
        'recoveryCaseId', r.id,
        'recoveryDeadlineAt', r.recovery_deadline_at,
        'action', 'choose_your_best_time'
      ),

      v_now,

      'no-show:' ||
      r.id::text ||
      ':day-' ||
      r.days_remaining::text

    from reminder_days r
    where not exists (
      select 1
      from public.epew_communication_outbox existing_outbox
      where
        existing_outbox.idempotency_key =
          'no-show:' ||
          r.id::text ||
          ':day-' ||
          r.days_remaining::text
        or (
          existing_outbox.idempotency_key =
            'no-show:' ||
            r.meeting_id ||
            ':day-' ||
            r.days_remaining::text
          and existing_outbox.recovery_case_id = r.id
        )
    )

    on conflict (idempotency_key) do nothing

    returning id
  )
  select count(*)
  into v_reminders
  from inserted_reminders;

  -- -------------------------------------------------------
  -- 7. Close recovery after 7 days.
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

  -- -------------------------------------------------------
  -- 8. Final closure email.
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

    'application_closed_due_to_inactivity',

    'Your EPEW Application Has Been Closed',

    'application_closed_due_to_inactivity',

    jsonb_build_object(
      'meetingId', r.meeting_id,
      'recoveryCaseId', r.id,
      'action', 'reapply'
    ),

    v_now,

    'no-show:' || r.id::text || ':closed'

  from public.epew_no_show_recovery_cases r

  where
    r.status = 'closed_due_to_inactivity'
    and r.closed_at >= v_now - interval '2 minutes'

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

-- Run once now to repair any stranded repeated no-shows.
select public.epew_process_establishment_meeting_no_shows();
