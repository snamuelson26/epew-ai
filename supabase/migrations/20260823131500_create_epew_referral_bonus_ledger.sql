create table if not exists public.epew_referral_bonus_ledger (
  id uuid primary key default gen_random_uuid(),

  transaction_id uuid not null
    references public.supporter_transactions(id)
    on delete cascade,

  supporter_id uuid not null
    references public.supporters(id)
    on delete cascade,

  entrepreneur_id uuid null
    references public.entrepreneurs(id)
    on delete set null,

  supporter_member_id uuid null
    references public.epew_referral_members(id)
    on delete set null,

  qualifying_units integer not null
    check (qualifying_units > 0),

  bonus_year integer not null,

  generation_1_member_id uuid null
    references public.epew_referral_members(id)
    on delete set null,

  generation_1_amount numeric(12,2) not null default 0,

  generation_2_member_id uuid null
    references public.epew_referral_members(id)
    on delete set null,

  generation_2_amount numeric(12,2) not null default 0,

  generation_3_member_id uuid null
    references public.epew_referral_members(id)
    on delete set null,

  generation_3_amount numeric(12,2) not null default 0,

  total_bonus_amount numeric(12,2) not null default 0,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'qualified',
        'approved',
        'paid',
        'reversed',
        'cancelled'
      )
    ),

  qualified_at timestamptz null,
  approved_at timestamptz null,
  paid_at timestamptz null,
  reversed_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists
  epew_referral_bonus_ledger_transaction_unique_idx
on public.epew_referral_bonus_ledger (transaction_id);

create index if not exists
  epew_referral_bonus_ledger_bonus_year_idx
on public.epew_referral_bonus_ledger (bonus_year);

create index if not exists
  epew_referral_bonus_ledger_generation_1_idx
on public.epew_referral_bonus_ledger (generation_1_member_id);

create index if not exists
  epew_referral_bonus_ledger_generation_2_idx
on public.epew_referral_bonus_ledger (generation_2_member_id);

create index if not exists
  epew_referral_bonus_ledger_generation_3_idx
on public.epew_referral_bonus_ledger (generation_3_member_id);

alter table public.epew_referral_bonus_ledger
  enable row level security;
