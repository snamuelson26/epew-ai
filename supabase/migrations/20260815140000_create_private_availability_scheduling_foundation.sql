-- =========================================================
-- EPEW – EDE – IBOS
-- Private Availability & Scheduling Engine Foundation
-- =========================================================

create table if not exists public.epew_participant_availability (
  id uuid primary key default gen_random_uuid(),

  application_id bigint null
    references public.entrepreneur_applications(id)
    on delete cascade,

  participant_user_id uuid null,

  participant_type text not null default 'entrepreneur',

  participant_name text null,
  participant_email text null,

  meeting_type text not null default 'entrepreneur_first_meeting',

  coach_assignment_id uuid null
    references public.coach_assignments(id)
    on delete set null,

  coach_id uuid null
    references public.epew_coaches(id)
    on delete set null,

  window_start_date date not null,
  window_end_date date not null,

  check (
    window_end_date >= window_start_date
    and window_end_date <= window_start_date + 6
  ),

  status text not null default 'collecting'
    check (
      status in (
        'collecting',
        'submitted',
        'matching',
        'matched',
        'scheduled',
        'expired',
        'cancelled'
      )
    ),

  participant_context_notes text null,

  work_schedule_context text null,
  financial_context_response text null,
  financial_context_level text null
    check (
      financial_context_level is null
      or financial_context_level in (
        'stable',
        'somewhat_tight',
        'difficult',
        'very_difficult',
        'prefer_not_to_answer'
      )
    ),

  personal_context_consent boolean not null default false,

  submitted_at timestamptz null,
  matched_at timestamptz null,
  scheduled_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  idx_epew_participant_availability_application
  on public.epew_participant_availability(application_id);

create index if not exists
  idx_epew_participant_availability_user
  on public.epew_participant_availability(participant_user_id);

create index if not exists
  idx_epew_participant_availability_coach
  on public.epew_participant_availability(coach_id);

create table if not exists public.epew_participant_availability_windows (
  id uuid primary key default gen_random_uuid(),

  availability_id uuid not null
    references public.epew_participant_availability(id)
    on delete cascade,

  available_date date not null,

  available_from time not null,
  available_until time not null,

  is_overnight boolean not null default false,

  participant_note text null,

  created_at timestamptz not null default now(),

  check (
    is_overnight = true
    or available_until > available_from
  )
);

create index if not exists
  idx_epew_availability_windows_parent
  on public.epew_participant_availability_windows(availability_id);

create index if not exists
  idx_epew_availability_windows_date
  on public.epew_participant_availability_windows(available_date);

create table if not exists public.epew_private_schedule_matches (
  id uuid primary key default gen_random_uuid(),

  availability_id uuid not null
    references public.epew_participant_availability(id)
    on delete cascade,

  application_id bigint null
    references public.entrepreneur_applications(id)
    on delete cascade,

  coach_assignment_id uuid null
    references public.coach_assignments(id)
    on delete set null,

  coach_id uuid null
    references public.epew_coaches(id)
    on delete set null,

  meeting_type text not null default 'entrepreneur_first_meeting',

  proposed_start_at timestamptz not null,
  reserved_until timestamptz not null,

  reservation_minutes integer not null default 60
    check (
      reservation_minutes > 0
      and reservation_minutes <= 60
    ),

  status text not null default 'available'
    check (
      status in (
        'available',
        'selected',
        'expired',
        'withdrawn',
        'conflict',
        'scheduled'
      )
    ),

  exposed_to_participant boolean not null default false,

  matched_by text not null default 'EMCC Scheduling Engine',

  matched_at timestamptz not null default now(),

  selected_by_user_id uuid null,
  selected_by_role text null,
  selected_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    reserved_until > proposed_start_at
  )
);

create index if not exists
  idx_epew_private_schedule_matches_availability
  on public.epew_private_schedule_matches(availability_id);

create index if not exists
  idx_epew_private_schedule_matches_coach_time
  on public.epew_private_schedule_matches(
    coach_id,
    proposed_start_at
  );

create index if not exists
  idx_epew_private_schedule_matches_application
  on public.epew_private_schedule_matches(application_id);

-- =========================================================
-- RLS
-- =========================================================

alter table public.epew_participant_availability
  enable row level security;

alter table public.epew_participant_availability_windows
  enable row level security;

alter table public.epew_private_schedule_matches
  enable row level security;

-- Participant can view their own availability request
drop policy if exists
  "participant_read_own_availability"
  on public.epew_participant_availability;

create policy
  "participant_read_own_availability"
  on public.epew_participant_availability
  for select
  to authenticated
  using (
    participant_user_id = auth.uid()
  );

-- Availability creation and modification are backend-controlled.
-- Participants submit availability through the EPEW scheduling API.
-- This prevents direct modification of Coach assignment, Coach identity,
-- workflow status, scheduling authority, or other protected fields.

-- Participant availability windows are visible only through
-- a parent availability record belonging to that participant.
drop policy if exists
  "participant_read_own_availability_windows"
  on public.epew_participant_availability_windows;

create policy
  "participant_read_own_availability_windows"
  on public.epew_participant_availability_windows
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.epew_participant_availability pa
      where pa.id = availability_id
        and pa.participant_user_id = auth.uid()
    )
  );

-- Availability-window creation, modification, and deletion
-- are backend-controlled through the EPEW scheduling API.
-- Participants retain read access to their own submitted windows.

-- Participant sees ONLY matched slots explicitly approved
-- for exposure by EMCC. Full Coach calendar is never exposed.
drop policy if exists
  "participant_read_exposed_schedule_matches"
  on public.epew_private_schedule_matches;

create policy
  "participant_read_exposed_schedule_matches"
  on public.epew_private_schedule_matches
  for select
  to authenticated
  using (
    exposed_to_participant = true
    and status in ('available', 'selected', 'scheduled')
    and exists (
      select 1
      from public.epew_participant_availability pa
      where pa.id = availability_id
        and pa.participant_user_id = auth.uid()
    )
  );

-- No ordinary authenticated insert/update/delete policy is
-- created for private schedule matches.
-- Matching and reservation are backend controlled.

-- =========================================================
-- updated_at maintenance
-- =========================================================

create or replace function public.epew_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
  trg_epew_participant_availability_updated_at
  on public.epew_participant_availability;

create trigger
  trg_epew_participant_availability_updated_at
before update on public.epew_participant_availability
for each row
execute function public.epew_set_updated_at();

drop trigger if exists
  trg_epew_private_schedule_matches_updated_at
  on public.epew_private_schedule_matches;

create trigger
  trg_epew_private_schedule_matches_updated_at
before update on public.epew_private_schedule_matches
for each row
execute function public.epew_set_updated_at();

comment on table public.epew_participant_availability is
'EPEW participant-submitted availability for private EMCC appointment matching. Availability does not expose the Coach calendar.';

comment on table public.epew_participant_availability_windows is
'Participant-provided day and time ranges, including overnight availability, used by EMCC to find compatible appointment choices.';

comment on table public.epew_private_schedule_matches is
'Backend-generated appointment choices resulting from private matching between participant availability and internal representative availability. Only explicitly exposed matching slots are visible to the participant.';
