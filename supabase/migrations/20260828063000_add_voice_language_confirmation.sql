alter table public.epew_voice_sessions
add column if not exists language_confirmed_at timestamptz;

comment on column public.epew_voice_sessions.language_confirmed_at is
  'Timestamp when the caller explicitly selected and confirmed the voice language.';
