-- EPEW Entrepreneur Communication System
-- Phase 1: Potential supporter relationship and communication foundation.
-- First live entrepreneur: Food Fans Restaurant (FFR-001).

create table if not exists public.epew_entrepreneur_communication_contacts (
  id uuid primary key default gen_random_uuid(),
  entrepreneur_user_id uuid not null,
  entrepreneur_application_id text,
  entrepreneur_code text,
  business_code text,
  business_name text,
  prospect_name text not null,
  phone text,
  email text,
  preferred_language text not null default 'en'
    check (preferred_language in ('en', 'ht', 'fr', 'es')),
  relationship text,
  conversation_notes text,
  status text not null default 'potential_supporter'
    check (status in ('potential_supporter', 'interested', 'supported', 'not_interested', 'paused')),
  weekly_follow_up_enabled boolean not null default true,
  next_follow_up_at timestamptz,
  last_contacted_at timestamptz,
  opted_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_epew_entrepreneur_comm_contacts_owner
  on public.epew_entrepreneur_communication_contacts (entrepreneur_user_id, created_at desc);

create index if not exists idx_epew_entrepreneur_comm_contacts_business
  on public.epew_entrepreneur_communication_contacts (business_code, status);

create index if not exists idx_epew_entrepreneur_comm_contacts_follow_up
  on public.epew_entrepreneur_communication_contacts (next_follow_up_at)
  where weekly_follow_up_enabled = true
    and status in ('potential_supporter', 'interested');

create table if not exists public.epew_entrepreneur_communication_messages (
  id uuid primary key default gen_random_uuid(),
  entrepreneur_user_id uuid not null,
  contact_id uuid not null references public.epew_entrepreneur_communication_contacts(id) on delete cascade,
  business_code text,
  message_type text not null default 'supporter_follow_up'
    check (message_type in ('introduction', 'supporter_follow_up', 'campaign_update', 'thank_you', 'community_idea_request')),
  language text not null default 'en'
    check (language in ('en', 'ht', 'fr', 'es')),
  subject text,
  body text not null,
  sender_voice text not null default 'entrepreneur'
    check (sender_voice = 'entrepreneur'),
  delivery_channel text
    check (delivery_channel is null or delivery_channel in ('email', 'sms', 'whatsapp')),
  delivery_status text not null default 'draft'
    check (delivery_status in ('draft', 'queued', 'sent', 'delivered', 'failed', 'cancelled')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_epew_entrepreneur_comm_messages_contact
  on public.epew_entrepreneur_communication_messages (contact_id, created_at desc);

create index if not exists idx_epew_entrepreneur_comm_messages_owner
  on public.epew_entrepreneur_communication_messages (entrepreneur_user_id, created_at desc);

alter table public.epew_entrepreneur_communication_contacts enable row level security;
alter table public.epew_entrepreneur_communication_messages enable row level security;

drop policy if exists "Entrepreneurs manage own communication contacts"
  on public.epew_entrepreneur_communication_contacts;
create policy "Entrepreneurs manage own communication contacts"
  on public.epew_entrepreneur_communication_contacts
  for all
  to authenticated
  using (entrepreneur_user_id = auth.uid())
  with check (entrepreneur_user_id = auth.uid());

drop policy if exists "Entrepreneurs manage own communication messages"
  on public.epew_entrepreneur_communication_messages;
create policy "Entrepreneurs manage own communication messages"
  on public.epew_entrepreneur_communication_messages
  for all
  to authenticated
  using (entrepreneur_user_id = auth.uid())
  with check (entrepreneur_user_id = auth.uid());

comment on table public.epew_entrepreneur_communication_contacts is
  'Entrepreneur-owned relationship list for potential supporters and community contacts. Participation is voluntary.';

comment on table public.epew_entrepreneur_communication_messages is
  'Messages prepared in the entrepreneur voice. EPEW assists with preparation, translation, scheduling, delivery, and tracking.';
