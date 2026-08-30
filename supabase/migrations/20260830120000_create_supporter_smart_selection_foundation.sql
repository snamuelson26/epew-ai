-- ============================================================
-- EPEW SUPPORTER SMART SELECTION
-- Phase 1A — Annual One-Time Support Foundation
--
-- Core rules:
--   1 unit = $5,200
--   term = 12 months
--   payment frequency = one-time only
--   participation benefit = up to 8% annually
--
-- When selection_method = 'epew_selected':
--   payment occurs FIRST;
--   entrepreneur/business assignment occurs within 48 hours.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. SUPPORT INTENT
-- Created before Stripe checkout.
-- ============================================================

create table if not exists public.epew_support_intents (
  id uuid primary key default gen_random_uuid(),

  supporter_id uuid
    references public.supporters(id)
    on delete set null,

  -- Annual support terms
  unit_count integer not null
    check (unit_count > 0),

  unit_price numeric(12,2) not null default 5200.00
    check (unit_price = 5200.00),

  total_amount numeric(14,2) not null
    check (total_amount > 0),

  support_term_months integer not null default 12
    check (support_term_months = 12),

  payment_frequency text not null default 'one_time'
    check (payment_frequency = 'one_time'),

  participation_benefit_rate numeric(5,2) not null default 8.00
    check (participation_benefit_rate = 8.00),

  -- How the supporter wants the business selected
  selection_method text not null
    check (
      selection_method in (
        'self_selected',
        'epew_selected'
      )
    ),

  -- Optional referral information
  referrer_name text,
  referrer_user_id uuid
    references auth.users(id)
    on delete set null,

  referred_entrepreneur_application_id bigint
    references public.entrepreneur_applications(id)
    on delete set null,

  referred_business_name text,

  referral_source text,

  -- Used only if the supporter selects a business directly
  supporter_selected_entrepreneur_application_id bigint
    references public.entrepreneur_applications(id)
    on delete set null,

  -- Multiple units may later be allocated as one group or distributed.
  allocation_preference text not null default 'one_business'
    check (
      allocation_preference in (
        'one_business',
        'multiple_businesses'
      )
    ),

  status text not null default 'created'
    check (
      status in (
        'created',
        'payment_pending',
        'paid_selection_pending',
        'selection_in_progress',
        'allocated',
        'cancelled',
        'payment_failed',
        'refunded'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payment_started_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,

  -- Server must always verify:
  -- total_amount = unit_count * 5200
  constraint epew_support_intents_total_check
    check (total_amount = unit_count * unit_price)
);

-- ============================================================
-- 2. LINK EXISTING SUPPORTER TRANSACTIONS TO SUPPORT INTENT
-- We keep supporter_transactions as the payment source of truth.
-- ============================================================

alter table public.supporter_transactions
  add column if not exists support_intent_id uuid
    references public.epew_support_intents(id)
    on delete set null;

alter table public.supporter_transactions
  add column if not exists annual_benefit_rate numeric(5,2);

alter table public.supporter_transactions
  add column if not exists selection_method text;

alter table public.supporter_transactions
  add column if not exists selection_due_at timestamptz;

-- ============================================================
-- 3. EPEW 48-HOUR SELECTION CASE
-- Created after successful payment when EPEW chooses.
-- No permanent business allocation exists yet.
-- ============================================================

create table if not exists public.epew_support_selection_cases (
  id uuid primary key default gen_random_uuid(),

  support_intent_id uuid not null unique
    references public.epew_support_intents(id)
    on delete cascade,

  supporter_id uuid
    references public.supporters(id)
    on delete set null,

  requested_units integer not null
    check (requested_units > 0),

  remaining_units integer not null
    check (remaining_units >= 0),

  -- Optional referral gets FIRST CONSIDERATION,
  -- but never overrides eligibility.
  referral_entrepreneur_application_id bigint
    references public.entrepreneur_applications(id)
    on delete set null,

  referral_checked boolean not null default false,
  referral_eligible boolean,
  referral_decision_reason text,

  status text not null default 'paid_selection_pending'
    check (
      status in (
        'paid_selection_pending',
        'selection_in_progress',
        'entrepreneur_selected',
        'allocation_completed',
        'manual_review',
        'cancelled'
      )
    ),

  paid_at timestamptz not null,

  -- Must normally equal paid_at + 48 hours.
  selection_due_at timestamptz not null,

  selection_started_at timestamptz,
  selection_completed_at timestamptz,

  selected_entrepreneur_application_id bigint
    references public.entrepreneur_applications(id)
    on delete set null,

  selected_business_name text,

  selection_reason text,

  -- Internal explainability/audit data.
  selection_score numeric(8,3),
  selection_metadata jsonb not null default '{}'::jsonb,

  auto_processed boolean not null default false,
  admin_override boolean not null default false,
  admin_override_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_support_selection_remaining_check
    check (remaining_units <= requested_units),

  constraint epew_support_selection_deadline_check
    check (selection_due_at >= paid_at)
);

-- ============================================================
-- 4. FINAL SUPPORT ALLOCATION
-- Created ONLY after an entrepreneur/business is actually chosen.
--
-- For EPEW-selected support this must not be created merely
-- because payment was received.
-- ============================================================

create table if not exists public.epew_support_allocations (
  id uuid primary key default gen_random_uuid(),

  support_intent_id uuid not null
    references public.epew_support_intents(id)
    on delete restrict,

  selection_case_id uuid
    references public.epew_support_selection_cases(id)
    on delete set null,

  supporter_id uuid
    references public.supporters(id)
    on delete set null,

  entrepreneur_application_id bigint not null
    references public.entrepreneur_applications(id)
    on delete restrict,

  business_name text,

  units integer not null
    check (units > 0),

  unit_price numeric(12,2) not null default 5200.00
    check (unit_price = 5200.00),

  allocated_amount numeric(14,2) not null
    check (allocated_amount > 0),

  support_term_months integer not null default 12
    check (support_term_months = 12),

  participation_benefit_rate numeric(5,2) not null default 8.00
    check (participation_benefit_rate = 8.00),

  selection_method text not null
    check (
      selection_method in (
        'self_selected',
        'epew_selected'
      )
    ),

  referral_preference_applied boolean not null default false,

  status text not null default 'active'
    check (
      status in (
        'active',
        'cancelled',
        'refunded',
        'completed'
      )
    ),

  allocated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_support_allocations_amount_check
    check (allocated_amount = units * unit_price)
);

-- ============================================================
-- 5. SUPPORTER INTRODUCTION
-- Tracks placement of the entrepreneur in the Supporter Portal
-- and the EPEW thank-you/introduction communication.
-- ============================================================

create table if not exists public.epew_support_introductions (
  id uuid primary key default gen_random_uuid(),

  allocation_id uuid not null unique
    references public.epew_support_allocations(id)
    on delete cascade,

  supporter_id uuid
    references public.supporters(id)
    on delete set null,

  entrepreneur_application_id bigint not null
    references public.entrepreneur_applications(id)
    on delete restrict,

  portal_published_at timestamptz,

  supporter_letter_status text not null default 'pending'
    check (
      supporter_letter_status in (
        'pending',
        'queued',
        'sent',
        'failed'
      )
    ),

  supporter_letter_sent_at timestamptz,

  entrepreneur_notification_status text not null default 'pending'
    check (
      entrepreneur_notification_status in (
        'pending',
        'queued',
        'sent',
        'failed'
      )
    ),

  entrepreneur_notification_sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 6. ENTREPRENEUR-TRIGGERED THANK YOU
-- Entrepreneur presses "Send Thank You".
-- EPEW Communication Center sends the actual message.
-- ============================================================

create table if not exists public.epew_support_thank_you_messages (
  id uuid primary key default gen_random_uuid(),

  allocation_id uuid not null unique
    references public.epew_support_allocations(id)
    on delete cascade,

  supporter_id uuid
    references public.supporters(id)
    on delete set null,

  entrepreneur_application_id bigint not null
    references public.entrepreneur_applications(id)
    on delete restrict,

  status text not null default 'available'
    check (
      status in (
        'available',
        'requested',
        'queued',
        'sent',
        'failed'
      )
    ),

  entrepreneur_requested_at timestamptz,

  message_subject text,
  message_body text,

  sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_epew_support_intents_supporter
  on public.epew_support_intents(supporter_id);

create index if not exists idx_epew_support_intents_status
  on public.epew_support_intents(status);

create index if not exists idx_epew_support_intents_referral_business
  on public.epew_support_intents(referred_entrepreneur_application_id);

create index if not exists idx_supporter_transactions_support_intent
  on public.supporter_transactions(support_intent_id);

create index if not exists idx_epew_support_selection_due
  on public.epew_support_selection_cases(selection_due_at)
  where status in (
    'paid_selection_pending',
    'selection_in_progress'
  );

create index if not exists idx_epew_support_selection_supporter
  on public.epew_support_selection_cases(supporter_id);

create index if not exists idx_epew_support_allocations_supporter
  on public.epew_support_allocations(supporter_id);

create index if not exists idx_epew_support_allocations_entrepreneur
  on public.epew_support_allocations(entrepreneur_application_id);

create index if not exists idx_epew_support_allocations_intent
  on public.epew_support_allocations(support_intent_id);

-- ============================================================
-- ROW LEVEL SECURITY
--
-- Phase 1A is backend controlled.
-- No broad authenticated-user policies are added yet.
-- Portal-specific read policies will be added when we build
-- the Supporter and Entrepreneur portal interfaces.
-- ============================================================

alter table public.epew_support_intents
  enable row level security;

alter table public.epew_support_selection_cases
  enable row level security;

alter table public.epew_support_allocations
  enable row level security;

alter table public.epew_support_introductions
  enable row level security;

alter table public.epew_support_thank_you_messages
  enable row level security;

-- ============================================================
-- DOCUMENTATION
-- ============================================================

comment on table public.epew_support_intents is
  'Annual EPEW supporter intent. Phase 1 supports one-time annual payments only: $5,200 per unit, 12 months, up to 8% participation benefit.';

comment on table public.epew_support_selection_cases is
  '48-hour post-payment business-selection workflow for supporters who choose EPEW to select the entrepreneur.';

comment on table public.epew_support_allocations is
  'Permanent allocation connecting paid supporter units to an entrepreneur after selection is finalized.';

comment on table public.epew_support_introductions is
  'Tracks Supporter Portal entrepreneur placement, supporter introduction letter, and entrepreneur notification.';

comment on table public.epew_support_thank_you_messages is
  'Tracks entrepreneur-triggered thank-you communication to the supporter.';
