-- EPEW EDE — Enterprise Entrepreneur Enrollment & Qualification Center (EEQC)
-- Application foundation for Individual, Organization, and International Special Request paths.

begin;

-- ---------------------------------------------------------------------------
-- 1. Extend the existing entrepreneur application header
-- ---------------------------------------------------------------------------

alter table public.entrepreneur_applications
  add column if not exists applicant_type text,
  add column if not exists enterprise_country text,
  add column if not exists application_path text,
  add column if not exists international_special_request_status text;

update public.entrepreneur_applications
set applicant_type = 'individual'
where applicant_type is null;

update public.entrepreneur_applications
set application_path = 'domestic_individual'
where application_path is null;

alter table public.entrepreneur_applications
  alter column applicant_type set default 'individual';

alter table public.entrepreneur_applications
  add constraint entrepreneur_applications_applicant_type_check
  check (applicant_type in ('individual', 'organization'));

alter table public.entrepreneur_applications
  add constraint entrepreneur_applications_application_path_check
  check (
    application_path in (
      'domestic_individual',
      'domestic_organization',
      'international_organization'
    )
  );

create index if not exists idx_entrepreneur_applications_applicant_type
  on public.entrepreneur_applications (applicant_type);

create index if not exists idx_entrepreneur_applications_application_path
  on public.entrepreneur_applications (application_path);

create index if not exists idx_entrepreneur_applications_enterprise_country
  on public.entrepreneur_applications (enterprise_country);


-- ---------------------------------------------------------------------------
-- 2. Organization / Group Enterprise application details
-- ---------------------------------------------------------------------------

create table if not exists public.entrepreneur_organization_applications (
  id uuid primary key default gen_random_uuid(),

  application_id bigint not null unique
    references public.entrepreneur_applications(id)
    on delete cascade,

  legal_name text not null,
  display_name text,
  organization_type text,
  registration_number text,

  country text not null,
  street_address text,
  city text,
  state_region text,
  postal_code text,

  year_established integer,
  website text,

  primary_representative_name text not null,
  primary_representative_title text,
  primary_representative_email text not null,
  primary_representative_phone text,

  secondary_representative_name text,
  secondary_representative_title text,
  secondary_representative_email text,
  secondary_representative_phone text,

  project_name text not null,
  project_category text,
  project_description text not null,
  product_service text,
  community_market_served text,
  project_location text,
  project_stage text,
  existing_operations text,
  expected_jobs integer,

  resources_required text,
  facility_requirements text,
  licenses_permits text,

  estimated_project_cost numeric(14,2),
  requested_financing numeric(14,2),
  intended_use_of_financing text,

  participant_count integer not null default 0,

  status text not null default 'Pending Review',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint entrepreneur_org_requested_financing_check
    check (
      requested_financing is null
      or (
        requested_financing >= 0
        and requested_financing <= 100000
      )
    ),

  constraint entrepreneur_org_participant_count_check
    check (participant_count >= 0),

  constraint entrepreneur_org_expected_jobs_check
    check (expected_jobs is null or expected_jobs >= 0)
);

create index if not exists idx_entrepreneur_org_application_id
  on public.entrepreneur_organization_applications (application_id);

create index if not exists idx_entrepreneur_org_country
  on public.entrepreneur_organization_applications (country);

create index if not exists idx_entrepreneur_org_status
  on public.entrepreneur_organization_applications (status);


-- ---------------------------------------------------------------------------
-- 3. Organization participants
-- ---------------------------------------------------------------------------

create table if not exists public.entrepreneur_organization_members (
  id uuid primary key default gen_random_uuid(),

  organization_application_id uuid not null
    references public.entrepreneur_organization_applications(id)
    on delete cascade,

  full_name text not null,
  email text,
  phone text,

  organizational_title text,
  project_role text,
  project_responsibility text,

  is_primary_representative boolean not null default false,
  is_secondary_representative boolean not null default false,

  participation_status text not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint entrepreneur_org_member_status_check
    check (
      participation_status in (
        'active',
        'inactive',
        'removed',
        'pending'
      )
    )
);

create index if not exists idx_entrepreneur_org_members_org
  on public.entrepreneur_organization_members (organization_application_id);

create index if not exists idx_entrepreneur_org_members_email
  on public.entrepreneur_organization_members (email);


-- ---------------------------------------------------------------------------
-- 4. International Individual Special Requests
-- ---------------------------------------------------------------------------

create table if not exists public.entrepreneur_international_special_requests (
  id uuid primary key default gen_random_uuid(),

  full_name text not null,
  email text not null,
  phone text,

  business_name text not null,
  country text not null,

  years_operating numeric(6,2),
  registration_status text,
  registration_number text,
  business_address text,
  website text,

  product_service text not null,
  current_operations text,
  request_reason text not null,

  supporting_evidence text,

  status text not null default 'Pending Review',
  review_notes text,

  reviewed_by uuid,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint entrepreneur_intl_special_status_check
    check (
      status in (
        'Pending Review',
        'Additional Information Requested',
        'Approved',
        'Rejected',
        'Application Invitation Sent'
      )
    ),

  constraint entrepreneur_intl_special_years_check
    check (years_operating is null or years_operating >= 0)
);

create index if not exists idx_entrepreneur_intl_special_email
  on public.entrepreneur_international_special_requests (email);

create index if not exists idx_entrepreneur_intl_special_country
  on public.entrepreneur_international_special_requests (country);

create index if not exists idx_entrepreneur_intl_special_status
  on public.entrepreneur_international_special_requests (status);


-- ---------------------------------------------------------------------------
-- 5. Enable RLS on new EEQC tables
-- Policies will be added in a dedicated security migration after workflow/UI review.
-- ---------------------------------------------------------------------------

alter table public.entrepreneur_organization_applications enable row level security;
alter table public.entrepreneur_organization_members enable row level security;
alter table public.entrepreneur_international_special_requests enable row level security;

commit;
