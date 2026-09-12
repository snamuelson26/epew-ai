create table if not exists public.epew_communication_sender_identities (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null unique,
  organization_name text not null,
  display_name text not null,
  title text,
  department text,
  email_address text not null unique,
  reply_to_address text not null,
  inbound_processing_address text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.epew_communication_sender_identities enable row level security;
revoke all on table public.epew_communication_sender_identities from anon, authenticated;
grant all on table public.epew_communication_sender_identities to service_role;

insert into public.epew_communication_sender_identities (
  identity_key,
  organization_name,
  display_name,
  title,
  department,
  email_address,
  reply_to_address,
  inbound_processing_address,
  metadata
)
values (
  'emanon_program_director',
  'Emanon Institute',
  'Aryal Edusp',
  'Program Director',
  'Innovative Educational System',
  'programdirector@emanoninstitute.org',
  'programdirector@emanoninstitute.org',
  'programdirector@inbound.emanoninstitute.org',
  '{"official":true,"outbound_provider":"resend","mailbox_provider":"existing_emanon_mail"}'::jsonb
)
on conflict (identity_key) do update set
  organization_name = excluded.organization_name,
  display_name = excluded.display_name,
  title = excluded.title,
  department = excluded.department,
  email_address = excluded.email_address,
  reply_to_address = excluded.reply_to_address,
  inbound_processing_address = excluded.inbound_processing_address,
  is_active = true,
  metadata = excluded.metadata,
  updated_at = now();

alter table public.epew_entrepreneur_communication_messages
  add column if not exists sender_identity_id uuid references public.epew_communication_sender_identities(id) on delete set null,
  add column if not exists provider_status text,
  add column if not exists delivery_status_updated_at timestamptz;

create index if not exists idx_epew_entrepreneur_comm_messages_sender_identity
  on public.epew_entrepreneur_communication_messages(sender_identity_id, created_at desc);

alter table public.epew_email_deliveries
  add column if not exists sender_identity_id uuid references public.epew_communication_sender_identities(id) on delete set null,
  add column if not exists provider_status text,
  add column if not exists delivery_status_updated_at timestamptz;

create index if not exists idx_epew_email_deliveries_provider_message
  on public.epew_email_deliveries(provider_message_id)
  where provider_message_id is not null;

create table if not exists public.epew_email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  webhook_event_id text not null unique,
  provider_email_id text not null,
  event_type text not null,
  normalized_status text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_epew_email_delivery_events_provider_email
  on public.epew_email_delivery_events(provider_email_id, created_at desc);

alter table public.epew_email_delivery_events enable row level security;
revoke all on table public.epew_email_delivery_events from anon, authenticated;
grant all on table public.epew_email_delivery_events to service_role;
