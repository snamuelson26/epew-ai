create table if not exists public.vendor_candidates (
  id uuid primary key default gen_random_uuid(),

  legal_name text,
  business_name text,
  display_name text,
  contact_name text,

  email text not null,
  phone text,
  website text,

  country text,
  state_region text,
  city text,

  language1 text,
  language1_speaking text,
  language1_writing text,

  language2 text,
  language2_speaking text,
  language2_writing text,

  language3 text,
  language3_speaking text,
  language3_writing text,

  service_category text,
  service_details text,
  years_in_business text,
  certifications text,
  coverage_area text,

  maximum_active_jobs integer not null default 5,
  accepts_automatic_matching boolean not null default true,

  why_join text,

  status text not null default 'Pending'
    check (
      status in (
        'Pending',
        'Interview Scheduled',
        'Approved',
        'Rejected',
        'Invitation Sent',
        'Active',
        'Archived'
      )
    ),

  vendor_interview_date date,
  vendor_interview_notes text,

  created_at timestamptz not null default now()
);

create table if not exists public.vendor_invites (
  id uuid primary key default gen_random_uuid(),

  invite_code text not null unique,
  candidate_id uuid references public.vendor_candidates(id) on delete set null,

  email text not null,
  business_name text,
  contact_name text,

  status text not null default 'Pending'
    check (
      status in (
        'Pending',
        'Used',
        'Expired',
        'Revoked'
      )
    ),
  expires_at timestamptz,
  used_at timestamptz,

  created_at timestamptz not null default now()
);

alter table public.vendor_candidates enable row level security;
alter table public.vendor_invites enable row level security;

drop policy if exists "Public can submit vendor applications"
on public.vendor_candidates;

create policy "Public can submit vendor applications"
on public.vendor_candidates
for insert
to anon, authenticated
with check (
  status = 'Pending'
  and vendor_interview_date is null
  and vendor_interview_notes is null
);

drop policy if exists "Admins can manage vendor candidates"
on public.vendor_candidates;

create policy "Admins can manage vendor candidates"
on public.vendor_candidates
for all
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists "Admins can manage vendor invites"
on public.vendor_invites;

create policy "Admins can manage vendor invites"
on public.vendor_invites
for all
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

create index if not exists vendor_candidates_status_idx
  on public.vendor_candidates(status);

create index if not exists vendor_candidates_email_idx
  on public.vendor_candidates(email);

create index if not exists vendor_candidates_created_at_idx
  on public.vendor_candidates(created_at desc);

create index if not exists vendor_invites_candidate_id_idx
  on public.vendor_invites(candidate_id);

create index if not exists vendor_invites_email_idx
  on public.vendor_invites(email);
