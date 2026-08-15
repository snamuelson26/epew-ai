alter table public.epew_coach_meetings
  add column if not exists coach_recommendations text,
  add column if not exists work_required_before_next_meeting text,
  add column if not exists requirements_reviewed_with_entrepreneur boolean not null default false,
  add column if not exists entrepreneur_understands_required_work boolean not null default false,
  add column if not exists entrepreneur_understands_next_meeting_review boolean not null default false;;
