-- Emanon/EPEW Resend inbound communication foundation.
alter table public.epew_entrepreneur_communication_messages
  add column if not exists direction text not null default 'outbound',
  add column if not exists provider_email_id text,
  add column if not exists provider_message_id text,
  add column if not exists sender_email text,
  add column if not exists recipient_emails jsonb not null default '[]'::jsonb,
  add column if not exists html_body text,
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists received_at timestamptz;

alter table public.epew_entrepreneur_communication_messages
  drop constraint if exists epew_entrepreneur_communication_messages_message_type_check,
  add constraint epew_entrepreneur_communication_messages_message_type_check
    check (message_type in ('introduction','supporter_follow_up','campaign_update','thank_you','community_idea_request','inbound_reply')),
  drop constraint if exists epew_entrepreneur_communication_messages_sender_voice_check,
  add constraint epew_entrepreneur_communication_messages_sender_voice_check
    check (sender_voice in ('entrepreneur','contact')),
  drop constraint if exists epew_entrepreneur_communication_messages_delivery_status_check,
  add constraint epew_entrepreneur_communication_messages_delivery_status_check
    check (delivery_status in ('draft','queued','sending','sent','delivered','received','failed','cancelled')),
  add constraint epew_entrepreneur_communication_messages_direction_check
    check (direction in ('outbound','inbound'));

create unique index if not exists uq_epew_entrepreneur_comm_messages_provider_email
  on public.epew_entrepreneur_communication_messages (provider_email_id)
  where provider_email_id is not null;

create index if not exists idx_epew_entrepreneur_comm_messages_conversation
  on public.epew_entrepreneur_communication_messages (contact_id, created_at asc);

create table if not exists public.epew_inbound_email_events (
  id uuid primary key default gen_random_uuid(),
  provider_email_id text not null unique,
  provider_message_id text,
  sender_email text,
  recipient_emails jsonb not null default '[]'::jsonb,
  subject text,
  status text not null default 'unmatched'
    check (status in ('unmatched','matched','rejected','failed')),
  reason text,
  contact_id uuid references public.epew_entrepreneur_communication_contacts(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_epew_inbound_email_events_status
  on public.epew_inbound_email_events (status, created_at desc);

alter table public.epew_inbound_email_events enable row level security;
revoke all on table public.epew_inbound_email_events from anon, authenticated;

comment on table public.epew_inbound_email_events is
  'Service-only audit queue for Resend inbound mail that could not be attached automatically.';
