-- ============================================================
-- EPEW Supporter Referral / Credit Attribution
-- ============================================================

alter table public.supporters
  add column if not exists campaign_source text,
  add column if not exists referred_by_supporter_id uuid,
  add column if not exists referrer_code text;

alter table public.supporter_transactions
  add column if not exists referrer_supporter_id uuid,
  add column if not exists referrer_code text,
  add column if not exists referral_source text;

-- Public supporter IDs are used in credited EPEW links.
create unique index if not exists supporters_supporter_id_unique_idx
  on public.supporters (supporter_id)
  where supporter_id is not null;

create index if not exists supporters_referred_by_supporter_id_idx
  on public.supporters (referred_by_supporter_id);

create index if not exists supporter_transactions_referrer_supporter_id_idx
  on public.supporter_transactions (referrer_supporter_id);

create index if not exists supporter_transactions_referrer_code_idx
  on public.supporter_transactions (referrer_code);

alter table public.supporters
  drop constraint if exists supporters_referred_by_supporter_id_fkey;

alter table public.supporters
  add constraint supporters_referred_by_supporter_id_fkey
  foreign key (referred_by_supporter_id)
  references public.supporters(id)
  on delete set null;

alter table public.supporter_transactions
  drop constraint if exists supporter_transactions_referrer_supporter_id_fkey;

alter table public.supporter_transactions
  add constraint supporter_transactions_referrer_supporter_id_fkey
  foreign key (referrer_supporter_id)
  references public.supporters(id)
  on delete set null;
