-- =========================================================
-- EPEW – EDE – IBOS
-- Private Coach Schedule Foundation
-- =========================================================

create table if not exists public.epew_coach_schedule_windows (
  id uuid primary key default gen_random_uuid(),

  coach_id uuid not null
    references public.epew_coaches(id)
    on delete cascade,

  day_of_week integer not null
    check (day_of_week between 0 and 6),

  available_from time not null,
  available_until time not null,

  is_overnight boolean not null default false,

  timezone text not null default 'America/New_York',

  is_active boolean not null default true,

  effective_from date null,
  effective_until date null,

  created_by text not null default 'EPEW Administration',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    (
      is_overnight = false
      and available_until > available_from
    )
    or
    (
      is_overnight = true
      and available_until <= available_from
    )
  ),

  check (
    effective_until is null
    or effective_from is null
    or effective_until >= effective_from
  )
);

create index if not exists
  idx_epew_coach_schedule_windows_coach
  on public.epew_coach_schedule_windows(coach_id);

create index if not exists
  idx_epew_coach_schedule_windows_day
  on public.epew_coach_schedule_windows(
    coach_id,
    day_of_week,
    is_active
  );

-- ---------------------------------------------------------
-- Private Coach schedule blocks
-- Used for appointments, personal blocks, time off,
-- administrative blocks, or temporary unavailability.
-- ---------------------------------------------------------

create table if not exists public.epew_coach_schedule_blocks (
  id uuid primary key default gen_random_uuid(),

  coach_id uuid not null
    references public.epew_coaches(id)
    on delete cascade,

  blocked_from timestamptz not null,
  blocked_until timestamptz not null,

  block_type text not null default 'unavailable'
    check (
      block_type in (
        'unavailable',
        'personal',
        'administrative',
        'time_off',
        'other'
      )
    ),

  private_reason text null,

  is_active boolean not null default true,

  created_by text not null default 'EPEW Administration',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    blocked_until > blocked_from
  )
);

create index if not exists
  idx_epew_coach_schedule_blocks_coach_time
  on public.epew_coach_schedule_blocks(
    coach_id,
    blocked_from,
    blocked_until
  );

-- =========================================================
-- RLS
-- =========================================================

alter table public.epew_coach_schedule_windows
  enable row level security;

alter table public.epew_coach_schedule_blocks
  enable row level security;

-- IMPORTANT:
-- No ordinary authenticated-user policies are created.
--
-- Coach schedules are private operational records.
-- Participants must never query or inspect these tables.
--
-- EMCC backend services use the service-role connection
-- to perform private matching.

-- =========================================================
-- updated_at
-- =========================================================

drop trigger if exists
  trg_epew_coach_schedule_windows_updated_at
  on public.epew_coach_schedule_windows;

create trigger
  trg_epew_coach_schedule_windows_updated_at
before update on public.epew_coach_schedule_windows
for each row
execute function public.epew_set_updated_at();

drop trigger if exists
  trg_epew_coach_schedule_blocks_updated_at
  on public.epew_coach_schedule_blocks;

create trigger
  trg_epew_coach_schedule_blocks_updated_at
before update on public.epew_coach_schedule_blocks
for each row
execute function public.epew_set_updated_at();

comment on table public.epew_coach_schedule_windows is
'Private recurring Coach scheduling availability used only by EMCC. Full Coach availability must never be exposed to participants.';

comment on table public.epew_coach_schedule_blocks is
'Private Coach unavailable periods used by EMCC when generating participant appointment matches.';
