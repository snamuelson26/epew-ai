-- ============================================================
-- EPEW SUPPORTER FLOW
-- Align supporter support records with the live entrepreneurs
-- table used by the Supporter Marketplace.
-- ============================================================

-- ------------------------------------------------------------
-- SUPPORT INTENTS
-- ------------------------------------------------------------

alter table public.epew_support_intents
  add column if not exists referred_entrepreneur_id uuid
    references public.entrepreneurs(id)
    on delete set null;

alter table public.epew_support_intents
  add column if not exists supporter_selected_entrepreneur_id uuid
    references public.entrepreneurs(id)
    on delete set null;

-- Existing application references become optional context only.
-- They are no longer the canonical Marketplace relationship.

-- ------------------------------------------------------------
-- SELECTION CASES
-- ------------------------------------------------------------

alter table public.epew_support_selection_cases
  add column if not exists referral_entrepreneur_id uuid
    references public.entrepreneurs(id)
    on delete set null;

alter table public.epew_support_selection_cases
  add column if not exists selected_entrepreneur_id uuid
    references public.entrepreneurs(id)
    on delete set null;

-- ------------------------------------------------------------
-- FINAL ALLOCATIONS
-- ------------------------------------------------------------

alter table public.epew_support_allocations
  add column if not exists entrepreneur_id uuid
    references public.entrepreneurs(id)
    on delete restrict;

-- The application ID was originally required, but the Marketplace
-- has no direct application_id relationship.
alter table public.epew_support_allocations
  alter column entrepreneur_application_id drop not null;

-- Once live data exists, entrepreneur_id will be the canonical
-- required entrepreneur relationship enforced by application logic.

-- ------------------------------------------------------------
-- SUPPORTER INTRODUCTIONS
-- ------------------------------------------------------------

alter table public.epew_support_introductions
  add column if not exists entrepreneur_id uuid
    references public.entrepreneurs(id)
    on delete restrict;

alter table public.epew_support_introductions
  alter column entrepreneur_application_id drop not null;

-- ------------------------------------------------------------
-- THANK-YOU MESSAGES
-- ------------------------------------------------------------

alter table public.epew_support_thank_you_messages
  add column if not exists entrepreneur_id uuid
    references public.entrepreneurs(id)
    on delete restrict;

alter table public.epew_support_thank_you_messages
  alter column entrepreneur_application_id drop not null;

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------

create index if not exists idx_epew_support_intents_referred_entrepreneur
  on public.epew_support_intents(referred_entrepreneur_id);

create index if not exists idx_epew_support_intents_selected_entrepreneur
  on public.epew_support_intents(supporter_selected_entrepreneur_id);

create index if not exists idx_epew_support_selection_referral_entrepreneur
  on public.epew_support_selection_cases(referral_entrepreneur_id);

create index if not exists idx_epew_support_selection_selected_entrepreneur
  on public.epew_support_selection_cases(selected_entrepreneur_id);

create index if not exists idx_epew_support_allocations_entrepreneur_uuid
  on public.epew_support_allocations(entrepreneur_id);

create index if not exists idx_epew_support_introductions_entrepreneur_uuid
  on public.epew_support_introductions(entrepreneur_id);

create index if not exists idx_epew_support_thank_you_entrepreneur_uuid
  on public.epew_support_thank_you_messages(entrepreneur_id);

comment on column public.epew_support_allocations.entrepreneur_id is
  'Canonical entrepreneur relationship for Supporter Marketplace allocations. References public.entrepreneurs(id).';
