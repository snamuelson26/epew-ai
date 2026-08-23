create table if not exists public.epew_referral_visitors (
  visitor_id uuid primary key,

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),

  /*
   * A visitor begins a new referral-eligibility cycle after
   * 90 consecutive days without visiting EPEW.
   */
  cycle_started_at timestamptz not null default now(),

  cycle_source text not null,

  cycle_referrer_member_id uuid null
    references public.epew_referral_members(id)
    on delete set null,

  cycle_referrer_code text null,

  visit_count bigint not null default 1
    check (visit_count >= 1),

  last_landing_path text null,
  last_business_id text null,

  converted_supporter_id uuid null
    references public.supporters(id)
    on delete set null,

  converted_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_referral_visitors_cycle_source_check
  check (
    (
      cycle_source = 'direct'
      and cycle_referrer_member_id is null
      and cycle_referrer_code is null
    )
    or
    (
      cycle_source = 'referral'
      and cycle_referrer_member_id is not null
      and cycle_referrer_code is not null
    )
  )
);

create index if not exists
  epew_referral_visitors_last_seen_idx
on public.epew_referral_visitors (last_seen_at);

create index if not exists
  epew_referral_visitors_cycle_referrer_idx
on public.epew_referral_visitors (cycle_referrer_member_id);

create index if not exists
  epew_referral_visitors_converted_supporter_idx
on public.epew_referral_visitors (converted_supporter_id);

alter table public.epew_referral_visitors
  enable row level security;
