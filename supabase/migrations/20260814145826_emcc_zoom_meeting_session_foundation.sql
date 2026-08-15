alter table public.epew_coach_meetings
  add column if not exists meeting_provider text not null default 'internal',
  add column if not exists zoom_meeting_id text,
  add column if not exists zoom_meeting_uuid text,
  add column if not exists zoom_join_url text,
  add column if not exists zoom_registration_url text,
  add column if not exists zoom_meeting_status text,
  add column if not exists zoom_participant_joined_at timestamptz,
  add column if not exists zoom_coach_joined_at timestamptz,
  add column if not exists zoom_rtms_enabled boolean not null default false,
  add column if not exists zoom_rtms_session_id text,
  add column if not exists zoom_live_transcript_status text not null default 'not_started',
  add column if not exists zoom_recording_id text,
  add column if not exists zoom_recording_status text not null default 'not_available',
  add column if not exists zoom_recording_url text,
  add column if not exists zoom_transcript_status text not null default 'not_available',
  add column if not exists zoom_transcript_processed_at timestamptz,
  add column if not exists coach_session_status text not null default 'not_started',
  add column if not exists coach_session_started_at timestamptz,
  add column if not exists coach_session_ended_at timestamptz,
  add column if not exists meeting_runtime_context jsonb not null default '{}'::jsonb,
  add column if not exists meeting_conversation_state jsonb not null default '{}'::jsonb,
  add column if not exists meeting_action_log jsonb not null default '[]'::jsonb;

alter table public.epew_coach_meetings
  drop constraint if exists epew_coach_meetings_meeting_provider_check,
  add constraint epew_coach_meetings_meeting_provider_check
    check (meeting_provider in ('internal','zoom','phone','in_person')),
  drop constraint if exists epew_coach_meetings_live_transcript_status_check,
  add constraint epew_coach_meetings_live_transcript_status_check
    check (zoom_live_transcript_status in ('not_started','starting','live','paused','completed','failed')),
  drop constraint if exists epew_coach_meetings_recording_status_check,
  add constraint epew_coach_meetings_recording_status_check
    check (zoom_recording_status in ('not_available','pending','processing','available','failed')),
  drop constraint if exists epew_coach_meetings_transcript_status_check,
  add constraint epew_coach_meetings_transcript_status_check
    check (zoom_transcript_status in ('not_available','live','pending','processing','available','failed')),
  drop constraint if exists epew_coach_meetings_coach_session_status_check,
  add constraint epew_coach_meetings_coach_session_status_check
    check (coach_session_status in ('not_started','preparing','ready','joining','active','closing','post_processing','completed','failed')),
  drop constraint if exists epew_coach_meetings_runtime_context_object_check,
  add constraint epew_coach_meetings_runtime_context_object_check
    check (jsonb_typeof(meeting_runtime_context) = 'object'),
  drop constraint if exists epew_coach_meetings_conversation_state_object_check,
  add constraint epew_coach_meetings_conversation_state_object_check
    check (jsonb_typeof(meeting_conversation_state) = 'object'),
  drop constraint if exists epew_coach_meetings_action_log_array_check,
  add constraint epew_coach_meetings_action_log_array_check
    check (jsonb_typeof(meeting_action_log) = 'array');

create index if not exists epew_coach_meetings_zoom_meeting_id_idx
  on public.epew_coach_meetings (zoom_meeting_id)
  where zoom_meeting_id is not null;

create index if not exists epew_coach_meetings_coach_session_status_idx
  on public.epew_coach_meetings (coach_session_status);

create schema if not exists emcc_private;
revoke all on schema emcc_private from public, anon, authenticated;

create table if not exists emcc_private.zoom_meeting_secrets (
  meeting_id text primary key references public.epew_coach_meetings(id) on delete cascade,
  zoom_host_url text,
  zoom_passcode text,
  zoom_start_url text,
  sdk_session_token text,
  rtms_access_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zoom_meeting_secrets_rtms_context_object_check
    check (jsonb_typeof(rtms_access_context) = 'object')
);

revoke all on all tables in schema emcc_private from public, anon, authenticated;
grant usage on schema emcc_private to service_role;
grant select, insert, update, delete on emcc_private.zoom_meeting_secrets to service_role;

comment on table emcc_private.zoom_meeting_secrets is
  'Backend-only Zoom credentials and runtime secrets for EPEW EMCC coach meetings. Never expose to entrepreneur clients.';;
