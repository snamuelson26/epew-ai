create table if not exists public.epew_voice_calls (
  id uuid primary key default gen_random_uuid(),

  twilio_call_sid text unique,
  parent_call_sid text,

  direction text not null
    check (direction in ('inbound', 'outbound')),

  from_number text,
  to_number text,

  application_id bigint
    references public.entrepreneur_applications(id)
    on delete set null,

  meeting_id text
    references public.epew_coach_meetings(id)
    on delete set null,

  agent_role text,
  agent_id text,
  agent_name text,

  department text,
  purpose text,

  call_status text,

  initiated_at timestamptz,
  ringing_at timestamptz,
  answered_at timestamptz,
  ended_at timestamptz,

  recovery_of_call_id uuid
    references public.epew_voice_calls(id)
    on delete set null,

  verification_status text
    default 'unverified'
    check (
      verification_status in (
        'unverified',
        'caller_id_matched',
        'confirmed',
        'verified',
        'failed'
      )
    ),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_epew_voice_calls_application_id
  on public.epew_voice_calls(application_id);

create index if not exists idx_epew_voice_calls_meeting_id
  on public.epew_voice_calls(meeting_id);

create index if not exists idx_epew_voice_calls_from_number
  on public.epew_voice_calls(from_number);

create index if not exists idx_epew_voice_calls_to_number
  on public.epew_voice_calls(to_number);

create index if not exists idx_epew_voice_calls_created_at
  on public.epew_voice_calls(created_at desc);

create index if not exists idx_epew_voice_calls_recent_outbound
  on public.epew_voice_calls(to_number, initiated_at desc)
  where direction = 'outbound';

alter table public.epew_voice_calls
  enable row level security;

comment on table public.epew_voice_calls is
  'Enterprise call history for EPEW inbound and outbound voice communications. Backend/service-role controlled.';

comment on column public.epew_voice_calls.purpose is
  'Business purpose of the call, such as establishment_meeting, support, finance, vendor_coordination, or callback_recovery.';

comment on column public.epew_voice_calls.recovery_of_call_id is
  'Links an inbound return call or recovery call to the original EPEW call when known.';

create or replace function public.epew_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_epew_voice_calls_updated_at
  on public.epew_voice_calls;

create trigger trg_epew_voice_calls_updated_at
before update on public.epew_voice_calls
for each row
execute function public.epew_set_updated_at();
