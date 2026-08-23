create table if not exists public.epew_referral_attributions (
  id uuid primary key default gen_random_uuid(),

  visitor_id uuid not null,

  referrer_member_id uuid not null
    references public.epew_referral_members(id)
    on delete cascade,

  referrer_code text not null,

  landing_business_id text null,
  landing_path text null,

  first_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
    default (now() + interval '90 days'),

  converted_supporter_id uuid null
    references public.supporters(id)
    on delete set null,

  converted_at timestamptz null,

  status text not null default 'active'
    check (
      status in (
        'active',
        'converted',
        'expired',
        'invalid'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists
  epew_referral_attributions_active_visitor_unique_idx
on public.epew_referral_attributions (visitor_id)
where status = 'active';

create index if not exists
  epew_referral_attributions_referrer_member_idx
on public.epew_referral_attributions (referrer_member_id);

create index if not exists
  epew_referral_attributions_referrer_code_idx
on public.epew_referral_attributions (upper(referrer_code));

create index if not exists
  epew_referral_attributions_expires_at_idx
on public.epew_referral_attributions (expires_at);

create index if not exists
  epew_referral_attributions_converted_supporter_idx
on public.epew_referral_attributions (converted_supporter_id);

alter table public.epew_referral_attributions
  enable row level security;
