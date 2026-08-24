alter table public.epew_coach_meetings
  add column if not exists twilio_call_sid text,
  add column if not exists twilio_call_status text,
  add column if not exists twilio_call_started_at timestamptz,
  add column if not exists twilio_call_answered_at timestamptz,
  add column if not exists twilio_call_ended_at timestamptz;

create index if not exists idx_epew_coach_meetings_twilio_call_sid
  on public.epew_coach_meetings (twilio_call_sid)
  where twilio_call_sid is not null;
