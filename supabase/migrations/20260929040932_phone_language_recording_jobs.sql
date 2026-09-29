begin;
create table if not exists public.epew_phone_recording_jobs (
  recording_sid text primary key check (recording_sid ~ '^RE[0-9a-fA-F]{32}$'),
  call_sid text not null,
  application_id bigint not null references public.entrepreneur_applications(id),
  status text not null default 'processing' check (status in ('processing','ready','failed')),
  original_text text,
  english_text text,
  created_at timestamptz not null default now()
);
alter table public.epew_phone_recording_jobs enable row level security;
revoke all on public.epew_phone_recording_jobs from anon, authenticated;
grant select, insert, update, delete on public.epew_phone_recording_jobs to service_role;
comment on table public.epew_phone_recording_jobs is 'Backend-only short-answer transcription results. Audio is deleted from Twilio after processing; original text is retained for interview audit.';
commit;
