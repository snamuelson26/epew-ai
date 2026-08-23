create table if not exists public.epew_referral_members (
  id uuid primary key default gen_random_uuid(),

  user_id uuid null
    references auth.users(id)
    on delete set null,

  member_type text not null
    check (
      member_type in (
        'supporter',
        'entrepreneur',
        'vendor',
        'partner',
        'coach'
      )
    ),

  source_record_id uuid null,

  display_name text,
  email text,

  referral_code text not null,

  referred_by_member_id uuid null
    references public.epew_referral_members(id)
    on delete set null,

  status text not null default 'active'
    check (
      status in (
        'active',
        'inactive',
        'suspended'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists
  epew_referral_members_referral_code_unique_idx
on public.epew_referral_members (upper(referral_code));

create unique index if not exists
  epew_referral_members_user_id_unique_idx
on public.epew_referral_members (user_id)
where user_id is not null;

create unique index if not exists
  epew_referral_members_source_unique_idx
on public.epew_referral_members (
  member_type,
  source_record_id
)
where source_record_id is not null;

create index if not exists
  epew_referral_members_referred_by_idx
on public.epew_referral_members (
  referred_by_member_id
);

create index if not exists
  epew_referral_members_email_idx
on public.epew_referral_members (
  lower(email)
)
where email is not null;

alter table public.epew_referral_members
  enable row level security;
