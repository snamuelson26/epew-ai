create extension if not exists pgcrypto;

create table if not exists public.emanon_organizations (
  id uuid primary key default gen_random_uuid(),
  organization_code text not null unique,
  legal_name text not null,
  display_name text not null,
  profile_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emanon_staff_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.emanon_organizations(id) on delete cascade,
  email text not null,
  full_name text not null,
  title text not null,
  role_code text not null check (role_code in ('program_director','strategic_partnerships_director')),
  permissions jsonb not null default '{}'::jsonb,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists public.emanon_staff_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.emanon_organizations(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  sender_identity_id uuid references public.epew_communication_sender_identities(id) on delete set null,
  email text not null,
  display_name text not null,
  title text not null,
  role_code text not null check (role_code in ('program_director','strategic_partnerships_director')),
  permissions jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','suspended','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists public.emanon_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.emanon_organizations(id) on delete cascade,
  conversation_type text not null default 'direct' check (conversation_type in ('direct','program')),
  title text not null,
  created_by uuid references public.emanon_staff_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emanon_conversation_members (
  conversation_id uuid not null references public.emanon_conversations(id) on delete cascade,
  member_id uuid not null references public.emanon_staff_members(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, member_id)
);

create table if not exists public.emanon_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.emanon_organizations(id) on delete cascade,
  conversation_id uuid not null references public.emanon_conversations(id) on delete cascade,
  sender_member_id uuid not null references public.emanon_staff_members(id) on delete restrict,
  message_type text not null default 'message' check (message_type in ('message','report','assignment','follow_up','proposal')),
  subject text,
  body text not null,
  parent_message_id uuid references public.emanon_messages(id) on delete set null,
  assignment_due_at timestamptz,
  follow_up_at timestamptz,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emanon_message_receipts (
  message_id uuid not null references public.emanon_messages(id) on delete cascade,
  member_id uuid not null references public.emanon_staff_members(id) on delete cascade,
  delivered_at timestamptz not null default now(),
  opened_at timestamptz,
  primary key (message_id, member_id)
);

create index if not exists idx_emanon_messages_conversation_created on public.emanon_messages(conversation_id, created_at);
create index if not exists idx_emanon_staff_members_org on public.emanon_staff_members(organization_id);

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.emanon_current_member_id(target_org uuid)
returns uuid language sql stable security definer set search_path = public, auth
as $$
  select id from public.emanon_staff_members
  where organization_id = target_org and user_id = auth.uid() and status = 'active'
  limit 1
$$;
revoke all on function private.emanon_current_member_id(uuid) from public;
grant execute on function private.emanon_current_member_id(uuid) to authenticated;

create or replace function private.emanon_is_conversation_member(target_conversation uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$
  select exists (
    select 1 from public.emanon_conversation_members cm
    join public.emanon_staff_members sm on sm.id = cm.member_id
    where cm.conversation_id = target_conversation and sm.user_id = auth.uid() and sm.status = 'active'
  )
$$;
revoke all on function private.emanon_is_conversation_member(uuid) from public;
grant execute on function private.emanon_is_conversation_member(uuid) to authenticated;

alter table public.emanon_organizations enable row level security;
alter table public.emanon_staff_invites enable row level security;
alter table public.emanon_staff_members enable row level security;
alter table public.emanon_conversations enable row level security;
alter table public.emanon_conversation_members enable row level security;
alter table public.emanon_messages enable row level security;
alter table public.emanon_message_receipts enable row level security;

create policy emanon_org_member_select on public.emanon_organizations for select to authenticated
using (private.emanon_current_member_id(id) is not null);
create policy emanon_staff_same_org_select on public.emanon_staff_members for select to authenticated
using (private.emanon_current_member_id(organization_id) is not null);
create policy emanon_conversation_participant_select on public.emanon_conversations for select to authenticated
using (private.emanon_is_conversation_member(id));
create policy emanon_conversation_members_select on public.emanon_conversation_members for select to authenticated
using (private.emanon_is_conversation_member(conversation_id));
create policy emanon_messages_select on public.emanon_messages for select to authenticated
using (private.emanon_is_conversation_member(conversation_id));
create policy emanon_messages_insert on public.emanon_messages for insert to authenticated
with check (
  private.emanon_is_conversation_member(conversation_id)
  and sender_member_id = private.emanon_current_member_id(organization_id)
);
create policy emanon_receipts_select on public.emanon_message_receipts for select to authenticated
using (private.emanon_is_conversation_member((select conversation_id from public.emanon_messages where id = message_id)));
create policy emanon_receipts_insert on public.emanon_message_receipts for insert to authenticated
with check (member_id = (select id from public.emanon_staff_members where user_id = auth.uid() limit 1));
create policy emanon_receipts_update on public.emanon_message_receipts for update to authenticated
using (member_id = (select id from public.emanon_staff_members where user_id = auth.uid() limit 1))
with check (member_id = (select id from public.emanon_staff_members where user_id = auth.uid() limit 1));

grant select on public.emanon_organizations, public.emanon_staff_members, public.emanon_conversations, public.emanon_conversation_members, public.emanon_messages, public.emanon_message_receipts to authenticated;
grant insert on public.emanon_messages, public.emanon_message_receipts to authenticated;
grant update (opened_at) on public.emanon_message_receipts to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('emanon-communications','emanon-communications',false,26214400)
on conflict (id) do update set public=false, file_size_limit=26214400;

create policy emanon_attachment_insert on storage.objects for insert to authenticated
with check (
  bucket_id='emanon-communications'
  and exists (select 1 from public.emanon_staff_members sm where sm.user_id=auth.uid() and sm.organization_id::text=(storage.foldername(name))[1] and sm.status='active')
);
create policy emanon_attachment_select on storage.objects for select to authenticated
using (
  bucket_id='emanon-communications'
  and exists (select 1 from public.emanon_staff_members sm where sm.user_id=auth.uid() and sm.organization_id::text=(storage.foldername(name))[1] and sm.status='active')
);

with org as (
  insert into public.emanon_organizations (organization_code,legal_name,display_name,profile_metadata)
  values ('EMANON-INSTITUTE','Emanon Institute','Emanon Institute',jsonb_build_object('program','Innovative Educational System','email','admin@emanoninstitute.org','website','https://emanoninstitute.org'))
  on conflict (organization_code) do update set updated_at=now()
  returning id
), resolved_org as (
  select id from org union all select id from public.emanon_organizations where organization_code='EMANON-INSTITUTE' limit 1
)
insert into public.emanon_staff_invites (organization_id,email,full_name,title,role_code,permissions,token_hash,expires_at)
select id,'programdirector@emanoninstitute.org','Aryal Edusp','Program Director','program_director',
  '{"send_messages":true,"receive_messages":true,"view_history":true,"issue_assignments":true,"issue_follow_ups":true,"receive_attachments":true,"manage_program_communication":true}'::jsonb,
  '0c45906f7ee330c1ff99acb29fb7ce993bbe161a995f29aa88d8f04ca31540bf',now()+interval '14 days' from resolved_org
on conflict (organization_id,email) do update set token_hash=excluded.token_hash,status='pending',expires_at=excluded.expires_at,permissions=excluded.permissions,title=excluded.title;

with org as (select id from public.emanon_organizations where organization_code='EMANON-INSTITUTE')
insert into public.emanon_staff_invites (organization_id,email,full_name,title,role_code,permissions,token_hash,expires_at)
select id,'partnership@emanoninstitute.org','Raella Noslen','Director of Strategic Partnerships & Program Development','strategic_partnerships_director',
  '{"send_messages":true,"receive_messages":true,"view_history":true,"submit_reports":true,"receive_assignments":true,"receive_follow_ups":true,"send_attachments":true,"funding_and_strategic_collaboration_only":true}'::jsonb,
  '48b748cfbfe550ebaee1fad6561ddcc8f0ca140baac411a889163e65786d4a8d',now()+interval '14 days' from org
on conflict (organization_id,email) do update set token_hash=excluded.token_hash,status='pending',expires_at=excluded.expires_at,permissions=excluded.permissions,title=excluded.title;
