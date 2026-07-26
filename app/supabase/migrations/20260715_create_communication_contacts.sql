begin;

create extension if not exists pgcrypto;

-- =========================================================
-- ENUMS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'communication_entity_type'
  ) then
    create type public.communication_entity_type as enum (
      'church',
      'business',
      'nonprofit',
      'community_organization',
      'school',
      'association',
      'government_office',
      'professional_network',
      'media_organization',
      'other'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'communication_entity_status'
  ) then
    create type public.communication_entity_status as enum (
      'draft',
      'submitted',
      'under_review',
      'needs_correction',
      'approved',
      'rejected',
      'suspended',
      'archived'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'communication_verification_status'
  ) then
    create type public.communication_verification_status as enum (
      'unverified',
      'pending',
      'verified',
      'failed',
      'manual_review'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'communication_member_interest_type'
  ) then
    create type public.communication_member_interest_type as enum (
      'start_business',
      'receive_business_funding',
      'support_entrepreneurs',
      'become_coach',
      'become_partner',
      'attend_information_session',
      'attend_annual_meeting',
      'receive_updates',
      'not_yet_sure',
      'other'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'communication_submission_status'
  ) then
    create type public.communication_submission_status as enum (
      'draft',
      'submitted',
      'validating',
      'awaiting_review',
      'needs_correction',
      'approved',
      'partially_approved',
      'rejected',
      'imported',
      'withdrawn'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'communication_validation_status'
  ) then
    create type public.communication_validation_status as enum (
      'not_checked',
      'valid',
      'invalid',
      'incomplete',
      'possible_duplicate',
      'permission_review',
      'manual_review'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'communication_sos_priority'
  ) then
    create type public.communication_sos_priority as enum (
      'low',
      'medium',
      'high',
      'critical'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'communication_sos_status'
  ) then
    create type public.communication_sos_status as enum (
      'pending',
      'acknowledged',
      'in_review',
      'implementation_required',
      'resolved',
      'dismissed'
    );
  end if;
end
$$;

-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

create or replace function public.generate_communication_entity_code(
  entity_type_input public.communication_entity_type
)
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  entity_prefix text;
  sequence_number bigint;
begin
  entity_prefix :=
    case entity_type_input
      when 'church' then 'CHU'
      when 'business' then 'BUS'
      when 'nonprofit' then 'NPO'
      when 'community_organization' then 'COM'
      when 'school' then 'SCH'
      when 'association' then 'ASC'
      when 'government_office' then 'GOV'
      when 'professional_network' then 'PRN'
      when 'media_organization' then 'MED'
      else 'ORG'
    end;

  select count(*) + 1
  into sequence_number
  from public.communication_entities
  where entity_type = entity_type_input;

  return format(
    'EPEW-%s-%s-%s',
    entity_prefix,
    extract(year from now())::integer,
    lpad(sequence_number::text, 6, '0')
  );
end;
$$;

create or replace function public.generate_secure_entity_token()
returns text
language sql
volatile
as $$
  select encode(gen_random_bytes(32), 'hex');
$$;

create or replace function public.set_communication_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =========================================================
-- COMMUNICATION ENTITIES
-- =========================================================

create table if not exists public.communication_entities (
  id uuid primary key default gen_random_uuid(),

  entity_code text unique,

  entity_type public.communication_entity_type
    not null
    default 'other',

  legal_name text not null,
  display_name text not null,

  phone text null,
  normalized_phone text null,

  email text null,
  normalized_email text null,

  website text null,

  street_address text null,
  address_line_2 text null,
  city text null,
  state text null,
  postal_code text null,
  country text not null default 'United States',

  organization_description text null,
  interest_reason text null,

  estimated_interested_members integer
    not null
    default 0
    check (estimated_interested_members >= 0),

  requests_information_session boolean not null default false,
  requests_campaign_materials boolean not null default false,
  requests_partner_status boolean not null default false,

  preferred_meeting_format text null
    check (
      preferred_meeting_format is null
      or preferred_meeting_format in (
        'virtual',
        'in_person',
        'hybrid',
        'not_selected'
      )
    ),

  preferred_language public.communication_language
    not null
    default 'en',

  preferred_channel public.communication_channel
    not null
    default 'email',

  status public.communication_entity_status
    not null
    default 'draft',

  verification_status public.communication_verification_status
    not null
    default 'unverified',

  public_registration_source text
    not null
    default 'community_registration',

  secure_management_token text
    not null
    unique
    default public.generate_secure_entity_token(),

  secure_token_expires_at timestamptz null,

  member_submission_status public.communication_submission_status
    not null
    default 'draft',

  total_members_submitted integer not null default 0,
  total_members_approved integer not null default 0,
  total_members_rejected integer not null default 0,
  total_members_needing_review integer not null default 0,

  ai_quality_score integer
    not null
    default 0
    check (ai_quality_score between 0 and 100),

  ai_validation_summary text null,
  ai_recommendation text null,

  administrator_review_notes text null,

  reviewed_by uuid null
    references auth.users(id)
    on delete set null,

  reviewed_at timestamptz null,

  approved_by uuid null
    references auth.users(id)
    on delete set null,

  approved_at timestamptz null,

  created_by uuid null
    references auth.users(id)
    on delete set null,

  updated_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  archived_at timestamptz null,

  constraint communication_entities_legal_name_not_blank
    check (length(trim(legal_name)) > 0),

  constraint communication_entities_display_name_not_blank
    check (length(trim(display_name)) > 0)
);

create unique index if not exists
  communication_entities_normalized_email_unique
on public.communication_entities(normalized_email)
where normalized_email is not null
  and status <> 'archived';

create index if not exists
  communication_entities_entity_type_idx
on public.communication_entities(entity_type);

create index if not exists
  communication_entities_status_idx
on public.communication_entities(status);

create index if not exists
  communication_entities_verification_status_idx
on public.communication_entities(verification_status);

create index if not exists
  communication_entities_member_submission_status_idx
on public.communication_entities(member_submission_status);

create index if not exists
  communication_entities_secure_management_token_idx
on public.communication_entities(secure_management_token);

create index if not exists
  communication_entities_created_at_idx
on public.communication_entities(created_at desc);

create or replace function public.prepare_communication_entity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.entity_code is null or trim(new.entity_code) = '' then
    new.entity_code :=
      public.generate_communication_entity_code(new.entity_type);
  end if;

  new.normalized_email :=
    public.normalize_communication_email(new.email);

  new.normalized_phone :=
    public.normalize_communication_phone(new.phone);

  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists
  communication_entities_prepare_trigger
on public.communication_entities;

create trigger communication_entities_prepare_trigger
before insert or update
on public.communication_entities
for each row
execute function public.prepare_communication_entity();

-- =========================================================
-- ENTITY REPRESENTATIVES
-- =========================================================

create table if not exists public.communication_entity_representatives (
  id uuid primary key default gen_random_uuid(),

  entity_id uuid not null
    references public.communication_entities(id)
    on delete cascade,

  communication_contact_id uuid null
    references public.communication_contacts(id)
    on delete set null,

  first_name text not null,
  last_name text not null,

  display_name text not null,

  role_title text null,

  phone text null,
  normalized_phone text null,

  email text null,
  normalized_email text null,

  preferred_language public.communication_language
    not null
    default 'en',

  preferred_channel public.communication_channel
    not null
    default 'email',

  is_primary boolean not null default false,
  can_manage_members boolean not null default true,
  is_community_ambassador boolean not null default false,

  verified_phone boolean not null default false,
  verified_email boolean not null default false,

  permission_sms boolean not null default false,
  permission_email boolean not null default false,
  permission_whatsapp boolean not null default false,

  status text not null default 'active'
    check (
      status in (
        'active',
        'inactive',
        'pending',
        'blocked',
        'archived'
      )
    ),

  created_by uuid null
    references auth.users(id)
    on delete set null,

  updated_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint communication_entity_representatives_first_name_not_blank
    check (length(trim(first_name)) > 0),

  constraint communication_entity_representatives_last_name_not_blank
    check (length(trim(last_name)) > 0),

  constraint communication_entity_representatives_display_name_not_blank
    check (length(trim(display_name)) > 0)
);

create unique index if not exists
  communication_entity_primary_representative_unique
on public.communication_entity_representatives(entity_id)
where is_primary = true
  and status <> 'archived';

create index if not exists
  communication_entity_representatives_entity_idx
on public.communication_entity_representatives(entity_id);

create index if not exists
  communication_entity_representatives_contact_idx
on public.communication_entity_representatives(communication_contact_id);

create index if not exists
  communication_entity_representatives_email_idx
on public.communication_entity_representatives(normalized_email);

create or replace function public.prepare_entity_representative()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.normalized_email :=
    public.normalize_communication_email(new.email);

  new.normalized_phone :=
    public.normalize_communication_phone(new.phone);

  if new.display_name is null or trim(new.display_name) = '' then
    new.display_name :=
      trim(concat_ws(' ', new.first_name, new.last_name));
  end if;

  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists
  communication_entity_representatives_prepare_trigger
on public.communication_entity_representatives;

create trigger communication_entity_representatives_prepare_trigger
before insert or update
on public.communication_entity_representatives
for each row
execute function public.prepare_entity_representative();

-- =========================================================
-- SUBMISSION BATCHES
-- =========================================================

create table if not exists public.communication_entity_submission_batches (
  id uuid primary key default gen_random_uuid(),

  entity_id uuid not null
    references public.communication_entities(id)
    on delete cascade,

  batch_code text not null unique,

  batch_name text null,

  source_type text not null default 'manual'
    check (
      source_type in (
        'manual',
        'csv',
        'excel',
        'api',
        'administrator',
        'other'
      )
    ),

  original_filename text null,

  total_records integer not null default 0,
  valid_records integer not null default 0,
  invalid_records integer not null default 0,
  duplicate_records integer not null default 0,
  permission_review_records integer not null default 0,
  approved_records integer not null default 0,
  rejected_records integer not null default 0,

  status public.communication_submission_status
    not null
    default 'draft',

  ai_validation_summary text null,
  ai_recommendation text null,

  submitted_by_representative_id uuid null
    references public.communication_entity_representatives(id)
    on delete set null,

  submitted_at timestamptz null,

  reviewed_by uuid null
    references auth.users(id)
    on delete set null,

  reviewed_at timestamptz null,

  approved_by uuid null
    references auth.users(id)
    on delete set null,

  approved_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  communication_entity_submission_batches_entity_idx
on public.communication_entity_submission_batches(entity_id);

create index if not exists
  communication_entity_submission_batches_status_idx
on public.communication_entity_submission_batches(status);

create index if not exists
  communication_entity_submission_batches_created_at_idx
on public.communication_entity_submission_batches(created_at desc);

drop trigger if exists
  communication_entity_submission_batches_updated_at_trigger
on public.communication_entity_submission_batches;

create trigger communication_entity_submission_batches_updated_at_trigger
before update
on public.communication_entity_submission_batches
for each row
execute function public.set_communication_updated_at();

-- =========================================================
-- MEMBER SUBMISSIONS
-- =========================================================

create table if not exists public.communication_entity_member_submissions (
  id uuid primary key default gen_random_uuid(),

  entity_id uuid not null
    references public.communication_entities(id)
    on delete cascade,

  batch_id uuid null
    references public.communication_entity_submission_batches(id)
    on delete set null,

  first_name text not null,
  middle_name text null,
  last_name text not null,

  display_name text not null,

  phone text null,
  normalized_phone text null,

  email text null,
  normalized_email text null,

  whatsapp_number text null,
  normalized_whatsapp_number text null,

  preferred_language public.communication_language
    not null
    default 'en',

  preferred_channel public.communication_channel
    not null
    default 'sms',

  city text null,
  state text null,
  country text not null default 'United States',

  interest_type public.communication_member_interest_type
    not null
    default 'not_yet_sure',

  interest_notes text null,

  permission_sms boolean not null default false,
  permission_email boolean not null default false,
  permission_whatsapp boolean not null default false,

  permission_confirmed_by_entity boolean not null default false,
  permission_confirmation_text text null,
  permission_confirmed_at timestamptz null,

  consent_source text null,

  validation_status public.communication_validation_status
    not null
    default 'not_checked',

  phone_validation_status text null,
  email_validation_status text null,

  possible_duplicate_contact_id uuid null
    references public.communication_contacts(id)
    on delete set null,

  duplicate_confidence numeric(5,2) null
    check (
      duplicate_confidence is null
      or duplicate_confidence between 0 and 100
    ),

  quality_score integer not null default 0
    check (quality_score between 0 and 100),

  ai_validation_notes text null,
  ai_recommendation text null,

  review_status public.communication_submission_status
    not null
    default 'draft',

  administrator_review_notes text null,

  approved_contact_id uuid null
    references public.communication_contacts(id)
    on delete set null,

  reviewed_by uuid null
    references auth.users(id)
    on delete set null,

  reviewed_at timestamptz null,

  approved_by uuid null
    references auth.users(id)
    on delete set null,

  approved_at timestamptz null,

  created_by_representative_id uuid null
    references public.communication_entity_representatives(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint communication_entity_member_first_name_not_blank
    check (length(trim(first_name)) > 0),

  constraint communication_entity_member_last_name_not_blank
    check (length(trim(last_name)) > 0),

  constraint communication_entity_member_display_name_not_blank
    check (length(trim(display_name)) > 0),

  constraint communication_entity_member_contact_method_required
    check (
      phone is not null
      or email is not null
      or whatsapp_number is not null
    )
);

create index if not exists
  communication_entity_members_entity_idx
on public.communication_entity_member_submissions(entity_id);

create index if not exists
  communication_entity_members_batch_idx
on public.communication_entity_member_submissions(batch_id);

create index if not exists
  communication_entity_members_review_status_idx
on public.communication_entity_member_submissions(review_status);

create index if not exists
  communication_entity_members_validation_status_idx
on public.communication_entity_member_submissions(validation_status);

create index if not exists
  communication_entity_members_phone_idx
on public.communication_entity_member_submissions(normalized_phone);

create index if not exists
  communication_entity_members_email_idx
on public.communication_entity_member_submissions(normalized_email);

create index if not exists
  communication_entity_members_duplicate_idx
on public.communication_entity_member_submissions(possible_duplicate_contact_id);

create or replace function public.calculate_entity_member_quality_score(
  row_data public.communication_entity_member_submissions
)
returns integer
language plpgsql
stable
as $$
declare
  result integer := 0;
begin
  if row_data.display_name is not null
     and trim(row_data.display_name) <> '' then
    result := result + 15;
  end if;

  if row_data.phone is not null
     and trim(row_data.phone) <> '' then
    result := result + 20;
  end if;

  if row_data.email is not null
     and trim(row_data.email) <> '' then
    result := result + 15;
  end if;

  if row_data.whatsapp_number is not null
     and trim(row_data.whatsapp_number) <> '' then
    result := result + 5;
  end if;

  if row_data.preferred_language is not null then
    result := result + 10;
  end if;

  if row_data.preferred_channel is not null
     and row_data.preferred_channel <> 'none' then
    result := result + 10;
  end if;

  if row_data.permission_sms
     or row_data.permission_email
     or row_data.permission_whatsapp then
    result := result + 15;
  end if;

  if row_data.permission_confirmed_by_entity then
    result := result + 10;
  end if;

  if row_data.possible_duplicate_contact_id is not null then
    result := result - 30;
  end if;

  return greatest(0, least(100, result));
end;
$$;

create or replace function public.prepare_entity_member_submission()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.normalized_email :=
    public.normalize_communication_email(new.email);

  new.normalized_phone :=
    public.normalize_communication_phone(new.phone);

  new.normalized_whatsapp_number :=
    public.normalize_communication_phone(new.whatsapp_number);

  if new.display_name is null or trim(new.display_name) = '' then
    new.display_name :=
      trim(
        concat_ws(
          ' ',
          new.first_name,
          new.middle_name,
          new.last_name
        )
      );
  end if;

  new.quality_score :=
    public.calculate_entity_member_quality_score(new);

  if new.possible_duplicate_contact_id is not null then
    new.validation_status := 'possible_duplicate';
  elsif not (
    new.permission_sms
    or new.permission_email
    or new.permission_whatsapp
  ) then
    new.validation_status := 'permission_review';
  elsif new.quality_score < 60 then
    new.validation_status := 'incomplete';
  elsif new.validation_status = 'not_checked' then
    new.validation_status := 'valid';
  end if;

  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists
  communication_entity_members_prepare_trigger
on public.communication_entity_member_submissions;

create trigger communication_entity_members_prepare_trigger
before insert or update
on public.communication_entity_member_submissions
for each row
execute function public.prepare_entity_member_submission();

-- =========================================================
-- ENTITY UPLOADS
-- =========================================================

create table if not exists public.communication_entity_uploads (
  id uuid primary key default gen_random_uuid(),

  entity_id uuid not null
    references public.communication_entities(id)
    on delete cascade,

  batch_id uuid null
    references public.communication_entity_submission_batches(id)
    on delete set null,

  filename text not null,
  storage_path text not null,
  mime_type text null,
  file_size_bytes bigint null,

  upload_status text not null default 'uploaded'
    check (
      upload_status in (
        'uploaded',
        'processing',
        'processed',
        'failed',
        'archived'
      )
    ),

  records_detected integer not null default 0,
  records_imported integer not null default 0,
  records_rejected integer not null default 0,

  processing_error text null,

  uploaded_by_representative_id uuid null
    references public.communication_entity_representatives(id)
    on delete set null,

  created_at timestamptz not null default now(),
  processed_at timestamptz null
);

create index if not exists
  communication_entity_uploads_entity_idx
on public.communication_entity_uploads(entity_id);

create index if not exists
  communication_entity_uploads_batch_idx
on public.communication_entity_uploads(batch_id);

create index if not exists
  communication_entity_uploads_status_idx
on public.communication_entity_uploads(upload_status);

-- =========================================================
-- ENTITY ACTIVITY LOG
-- =========================================================

create table if not exists public.communication_entity_activity (
  id uuid primary key default gen_random_uuid(),

  entity_id uuid not null
    references public.communication_entities(id)
    on delete cascade,

  representative_id uuid null
    references public.communication_entity_representatives(id)
    on delete set null,

  batch_id uuid null
    references public.communication_entity_submission_batches(id)
    on delete set null,

  member_submission_id uuid null
    references public.communication_entity_member_submissions(id)
    on delete set null,

  activity_type text not null,

  title text not null,
  summary text null,

  metadata jsonb not null default '{}'::jsonb,

  performed_by uuid null
    references auth.users(id)
    on delete set null,

  performed_by_type text not null default 'system'
    check (
      performed_by_type in (
        'system',
        'ai',
        'administrator',
        'representative',
        'public_user'
      )
    ),

  created_at timestamptz not null default now()
);

create index if not exists
  communication_entity_activity_entity_idx
on public.communication_entity_activity(entity_id, created_at desc);

create index if not exists
  communication_entity_activity_type_idx
on public.communication_entity_activity(activity_type);

-- =========================================================
-- AI SOS REQUESTS
-- =========================================================

create table if not exists public.communication_sos_requests (
  id uuid primary key default gen_random_uuid(),

  request_code text not null unique,

  module text not null default 'communication_center',

  entity_id uuid null
    references public.communication_entities(id)
    on delete set null,

  contact_id uuid null
    references public.communication_contacts(id)
    on delete set null,

  conversation_reference text null,

  subject text not null,
  request_summary text not null,

  reason_for_escalation text not null,

  missing_policy_or_capability text null,
  recommended_implementation text null,

  priority public.communication_sos_priority
    not null
    default 'medium',

  status public.communication_sos_status
    not null
    default 'pending',

  target_response_hours integer
    not null
    default 48
    check (
      target_response_hours between 24 and 48
    ),

  due_at timestamptz
    not null
    default (now() + interval '48 hours'),

  ai_confidence_score numeric(5,2) null
    check (
      ai_confidence_score is null
      or ai_confidence_score between 0 and 100
    ),

  administrator_response text null,
  implementation_notes text null,

  assigned_to uuid null
    references auth.users(id)
    on delete set null,

  acknowledged_at timestamptz null,
  resolved_at timestamptz null,

  created_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  communication_sos_requests_status_idx
on public.communication_sos_requests(status);

create index if not exists
  communication_sos_requests_priority_idx
on public.communication_sos_requests(priority);

create index if not exists
  communication_sos_requests_due_at_idx
on public.communication_sos_requests(due_at);

create index if not exists
  communication_sos_requests_entity_idx
on public.communication_sos_requests(entity_id);

drop trigger if exists
  communication_sos_requests_updated_at_trigger
on public.communication_sos_requests;

create trigger communication_sos_requests_updated_at_trigger
before update
on public.communication_sos_requests
for each row
execute function public.set_communication_updated_at();

-- =========================================================
-- BATCH COUNTER REFRESH
-- =========================================================

create or replace function public.refresh_entity_submission_batch_counts(
  batch_uuid uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.communication_entity_submission_batches batch
  set
    total_records = stats.total_records,
    valid_records = stats.valid_records,
    invalid_records = stats.invalid_records,
    duplicate_records = stats.duplicate_records,
    permission_review_records = stats.permission_review_records,
    approved_records = stats.approved_records,
    rejected_records = stats.rejected_records,
    updated_at = now()
  from (
    select
      count(*)::integer as total_records,

      count(*) filter (
        where validation_status = 'valid'
      )::integer as valid_records,

      count(*) filter (
        where validation_status = 'invalid'
      )::integer as invalid_records,

      count(*) filter (
        where validation_status = 'possible_duplicate'
      )::integer as duplicate_records,

      count(*) filter (
        where validation_status = 'permission_review'
      )::integer as permission_review_records,

      count(*) filter (
        where review_status in ('approved', 'imported')
      )::integer as approved_records,

      count(*) filter (
        where review_status = 'rejected'
      )::integer as rejected_records

    from public.communication_entity_member_submissions
    where batch_id = batch_uuid
  ) stats
  where batch.id = batch_uuid;
end;
$$;

create or replace function public.refresh_entity_submission_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_batch_id uuid;
  target_entity_id uuid;
begin
  target_batch_id := coalesce(new.batch_id, old.batch_id);
  target_entity_id := coalesce(new.entity_id, old.entity_id);

  if target_batch_id is not null then
    perform public.refresh_entity_submission_batch_counts(
      target_batch_id
    );
  end if;

  update public.communication_entities entity
  set
    total_members_submitted = stats.total_submitted,
    total_members_approved = stats.total_approved,
    total_members_rejected = stats.total_rejected,
    total_members_needing_review = stats.total_needing_review,
    updated_at = now()
  from (
    select
      count(*)::integer as total_submitted,

      count(*) filter (
        where review_status in ('approved', 'imported')
      )::integer as total_approved,

      count(*) filter (
        where review_status = 'rejected'
      )::integer as total_rejected,

      count(*) filter (
        where validation_status in (
          'possible_duplicate',
          'permission_review',
          'incomplete',
          'manual_review'
        )
        or review_status in (
          'awaiting_review',
          'needs_correction'
        )
      )::integer as total_needing_review

    from public.communication_entity_member_submissions
    where entity_id = target_entity_id
  ) stats
  where entity.id = target_entity_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists
  communication_entity_member_counts_trigger
on public.communication_entity_member_submissions;

create trigger communication_entity_member_counts_trigger
after insert or update or delete
on public.communication_entity_member_submissions
for each row
execute function public.refresh_entity_submission_counts();

-- =========================================================
-- RLS
-- =========================================================

alter table public.communication_entities enable row level security;
alter table public.communication_entity_representatives enable row level security;
alter table public.communication_entity_submission_batches enable row level security;
alter table public.communication_entity_member_submissions enable row level security;
alter table public.communication_entity_uploads enable row level security;
alter table public.communication_entity_activity enable row level security;
alter table public.communication_sos_requests enable row level security;

-- Public entity registration.
create policy
  "Public can register communication entities"
on public.communication_entities
for insert
to anon, authenticated
with check (
  status in ('draft', 'submitted')
);

-- Public access to entity through secure management token.
create policy
  "Public can read entity by secure management token"
on public.communication_entities
for select
to anon, authenticated
using (
  secure_management_token is not null
);

create policy
  "Public can update draft entity"
on public.communication_entities
for update
to anon, authenticated
using (
  status in ('draft', 'needs_correction')
)
with check (
  status in (
    'draft',
    'submitted',
    'needs_correction'
  )
);

create policy
  "Public can create entity representatives"
on public.communication_entity_representatives
for insert
to anon, authenticated
with check (true);

create policy
  "Public can read entity representatives"
on public.communication_entity_representatives
for select
to anon, authenticated
using (true);

create policy
  "Public can update entity representatives"
on public.communication_entity_representatives
for update
to anon, authenticated
using (status <> 'archived')
with check (status <> 'archived');

create policy
  "Public can create submission batches"
on public.communication_entity_submission_batches
for insert
to anon, authenticated
with check (
  status in ('draft', 'submitted')
);

create policy
  "Public can read submission batches"
on public.communication_entity_submission_batches
for select
to anon, authenticated
using (true);

create policy
  "Public can update draft submission batches"
on public.communication_entity_submission_batches
for update
to anon, authenticated
using (
  status in (
    'draft',
    'needs_correction'
  )
)
with check (
  status in (
    'draft',
    'submitted',
    'needs_correction'
  )
);

create policy
  "Public can add entity member submissions"
on public.communication_entity_member_submissions
for insert
to anon, authenticated
with check (
  review_status in ('draft', 'submitted')
);

create policy
  "Public can read entity member submissions"
on public.communication_entity_member_submissions
for select
to anon, authenticated
using (true);

create policy
  "Public can update draft member submissions"
on public.communication_entity_member_submissions
for update
to anon, authenticated
using (
  review_status in (
    'draft',
    'needs_correction'
  )
)
with check (
  review_status in (
    'draft',
    'submitted',
    'needs_correction'
  )
);

create policy
  "Public can create entity uploads"
on public.communication_entity_uploads
for insert
to anon, authenticated
with check (true);

create policy
  "Public can read entity uploads"
on public.communication_entity_uploads
for select
to anon, authenticated
using (true);

create policy
  "Authenticated users can create entity activity"
on public.communication_entity_activity
for insert
to authenticated
with check (true);

create policy
  "Authenticated users can read entity activity"
on public.communication_entity_activity
for select
to authenticated
using (true);

create policy
  "Authenticated users can manage SOS requests"
on public.communication_sos_requests
for all
to authenticated
using (true)
with check (true);

commit;