create table if not exists public.epew_voice_sessions (
  call_sid text primary key,
  state text not null,
  language text not null default 'en',

  caller_phone text,

  application_id bigint,
  entrepreneur_name text,

  coach_id uuid,
  coach_name text,

  meeting_id text,

  scheduling_attempt integer not null default 0,

  spoken_availability text,

  scheduling_choices jsonb not null default '[]'::jsonb,

  selected_choice_id text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.epew_voice_sessions
  enable row level security;

create index if not exists
  idx_epew_voice_sessions_state
  on public.epew_voice_sessions(state);

create index if not exists
  idx_epew_voice_sessions_caller_phone
  on public.epew_voice_sessions(caller_phone);

create index if not exists
  idx_epew_voice_sessions_application_id
  on public.epew_voice_sessions(application_id);

create index if not exists
  idx_epew_voice_sessions_updated_at
  on public.epew_voice_sessions(updated_at desc);

comment on table public.epew_voice_sessions is
  'Backend-only phone V2 voice session state for EPEW Twilio calls.';

comment on column public.epew_voice_sessions.call_sid is
  'Twilio CallSid used as the unique voice-session identifier.';

comment on column public.epew_voice_sessions.scheduling_choices is
  'Temporary appointment choices generated during phone scheduling.';

comment on column public.epew_voice_sessions.metadata is
  'Backend-only extensible phone session metadata.';
