-- ============================================================
-- EPEW Prospect Database
-- Purpose:
--   Store verified prospective contacts who interact with EPEW
--   before becoming registered members.
--
-- Initial source:
--   Inbound EPEW telephone calls
--
-- Future sources may include:
--   website, events, referrals, campaigns, partner outreach
-- ============================================================

create table if not exists public.epew_prospects (
  id uuid primary key default gen_random_uuid(),

  -- Identity / contact information
  first_name text,
  last_name text,
  full_name text,

  caller_id_phone text,
  confirmed_phone text,
  email text,

  -- Verification state
  name_verified boolean not null default false,
  phone_verified boolean not null default false,
  email_verified boolean not null default false,
  contact_information_verified boolean not null default false,

  -- Language / source
  preferred_language text,
  source_channel text not null default 'phone',
  source_detail text,

  -- Prospect interests
  interests text[] not null default '{}'::text[],

  -- Possible values:
  -- general_epew
  -- entrepreneur
  -- supporter
  -- partner
  -- vendor

  primary_interest text,

  -- Outreach / campaign permission
  outreach_consent boolean,
  outreach_consent_at timestamptz,
  outreach_consent_channel text,
  outreach_consent_source text,

  -- Prospect lifecycle
  prospect_status text not null default 'new',
  campaign_status text not null default 'not_enrolled',
  follow_up_required boolean not null default false,
  follow_up_at timestamptz,

  -- Call / communication references
  first_call_sid text,
  latest_call_sid text,

  -- Notes / future extensibility
  notes text,
  metadata jsonb not null default '{}'::jsonb,

  -- Contact history timestamps
  first_contact_at timestamptz not null default now(),
  last_contact_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Data-quality constraints
-- ------------------------------------------------------------

alter table public.epew_prospects
  drop constraint if exists epew_prospects_preferred_language_check;

alter table public.epew_prospects
  add constraint epew_prospects_preferred_language_check
  check (
    preferred_language is null
    or preferred_language in ('en', 'ht', 'es', 'fr')
  );

alter table public.epew_prospects
  drop constraint if exists epew_prospects_primary_interest_check;

alter table public.epew_prospects
  add constraint epew_prospects_primary_interest_check
  check (
    primary_interest is null
    or primary_interest in (
      'general_epew',
      'entrepreneur',
      'supporter',
      'partner',
      'vendor'
    )
  );

alter table public.epew_prospects
  drop constraint if exists epew_prospects_status_check;

alter table public.epew_prospects
  add constraint epew_prospects_status_check
  check (
    prospect_status in (
      'new',
      'collecting_contact_information',
      'verification_pending',
      'verified',
      'engaged',
      'follow_up_required',
      'converted',
      'inactive'
    )
  );

-- ------------------------------------------------------------
-- Useful indexes
-- ------------------------------------------------------------

create index if not exists idx_epew_prospects_confirmed_phone
  on public.epew_prospects (confirmed_phone);

create index if not exists idx_epew_prospects_caller_id_phone
  on public.epew_prospects (caller_id_phone);

create index if not exists idx_epew_prospects_email_lower
  on public.epew_prospects (lower(email))
  where email is not null;

create index if not exists idx_epew_prospects_primary_interest
  on public.epew_prospects (primary_interest);

create index if not exists idx_epew_prospects_status
  on public.epew_prospects (prospect_status);

create index if not exists idx_epew_prospects_outreach_consent
  on public.epew_prospects (outreach_consent)
  where outreach_consent = true;

create index if not exists idx_epew_prospects_interests
  on public.epew_prospects using gin (interests);

-- ------------------------------------------------------------
-- Security
--
-- Prospect data contains personal contact information.
-- Keep it backend-only for now.
-- ------------------------------------------------------------

alter table public.epew_prospects enable row level security;

comment on table public.epew_prospects is
  'EPEW prospective-contact database for verified non-member contacts and future outreach segmentation. Backend-only unless explicit role policies are added later.';

comment on column public.epew_prospects.interests is
  'Public EPEW interest categories selected by the prospect: general_epew, entrepreneur, supporter, partner, vendor.';

comment on column public.epew_prospects.outreach_consent is
  'Whether the prospect explicitly agreed to future EPEW outreach. Campaign eligibility must respect this field.';
