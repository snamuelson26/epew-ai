create table if not exists public.epew_agreement_acceptances (
  id uuid primary key default gen_random_uuid(),

  user_id uuid,
  supporter_id uuid,
  entrepreneur_id uuid,
  business_id text,

  agreement_type text not null,
  agreement_title text not null,
  agreement_version text not null,
  agreement_content_hash text,
  legal_entity text not null,
  effective_at timestamptz,

  counterparty_type text,
  counterparty_id text,

  accepted boolean not null default false,
  accepted_at timestamptz,

  acceptance_method text not null default 'electronic_checkbox',

  ip_address text,
  user_agent text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_epew_agreement_acceptances_user_id
  on public.epew_agreement_acceptances (user_id);

create index if not exists idx_epew_agreement_acceptances_supporter_id
  on public.epew_agreement_acceptances (supporter_id);

create index if not exists idx_epew_agreement_acceptances_entrepreneur_id
  on public.epew_agreement_acceptances (entrepreneur_id);

create index if not exists idx_epew_agreement_acceptances_type_version
  on public.epew_agreement_acceptances (agreement_type, agreement_version);

create index if not exists idx_epew_agreement_acceptances_accepted_at
  on public.epew_agreement_acceptances (accepted_at);

create unique index if not exists idx_epew_agreement_acceptances_unique_acceptance
  on public.epew_agreement_acceptances (
    user_id,
    agreement_type,
    agreement_version,
    coalesce(counterparty_id, '')
  )
  where accepted = true;

alter table public.epew_agreement_acceptances
  enable row level security;

comment on table public.epew_agreement_acceptances is
  'Enterprise audit record for EPEW agreement acceptances, including Supporter-EPEW, Supporter-Entrepreneur, and Entrepreneur-EPEW agreements.';

comment on column public.epew_agreement_acceptances.legal_entity is
  'Official EPEW legal entity name applicable to the agreement, currently EPEW (EKERO Partners Empower Wealth LLC).';

comment on column public.epew_agreement_acceptances.agreement_type is
  'Agreement relationship/type, such as supporter_epew, supporter_entrepreneur, or entrepreneur_epew.';

comment on column public.epew_agreement_acceptances.agreement_version is
  'Immutable version identifier of the agreement text accepted by the participant.';

comment on column public.epew_agreement_acceptances.agreement_content_hash is
  'Cryptographic hash of the exact agreement content accepted, when available.';

comment on column public.epew_agreement_acceptances.effective_at is
  'Date and time when the accepted agreement version became effective.';
