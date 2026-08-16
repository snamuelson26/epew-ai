alter table public.epew_participant_availability
  add column if not exists scheduling_review_started_at timestamptz,
  add column if not exists scheduling_review_eligible_at timestamptz,
  add column if not exists scheduling_review_deadline_at timestamptz,
  add column if not exists scheduling_review_completed_at timestamptz;
