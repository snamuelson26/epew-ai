alter table public.epew_participant_availability
  drop constraint if exists epew_participant_availability_status_check;

alter table public.epew_participant_availability
  add constraint epew_participant_availability_status_check
  check (
    status = any (
      array[
        'collecting'::text,
        'submitted'::text,
        'matching'::text,
        'scheduling_review'::text,
        'manual_review_required'::text,
        'matched'::text,
        'scheduled'::text,
        'expired'::text,
        'cancelled'::text
      ]
    )
  );
