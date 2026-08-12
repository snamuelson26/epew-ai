-- EPEW EDE — Enterprise Entrepreneur Enrollment & Qualification Center (EEQC)
-- Atomic Organization / Group Enterprise submission.
--
-- One transaction:
-- entrepreneur_applications
--   -> entrepreneur_organization_applications
--   -> entrepreneur_organization_members
--   -> existing ETVMC AFTER INSERT trigger
--
-- If any organization or participant insert fails, PostgreSQL rolls back
-- the complete submission, including ETVMC records created by the trigger.

begin;

create or replace function public.eeqc_submit_organization_application(
  p_application jsonb,
  p_organization jsonb,
  p_participants jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_application_id bigint;
  v_organization_id uuid;
  v_participant jsonb;
  v_participant_count integer;
  v_requested_financing numeric;
  v_expected_jobs integer;
  v_estimated_project_cost numeric;
  v_year_established integer;
  v_application_path text;
begin
  ---------------------------------------------------------------------------
  -- 1. Validate request structure
  ---------------------------------------------------------------------------

  if p_application is null or jsonb_typeof(p_application) <> 'object' then
    raise exception 'Application information is required.';
  end if;

  if p_organization is null or jsonb_typeof(p_organization) <> 'object' then
    raise exception 'Organization information is required.';
  end if;

  if p_participants is null
     or coalesce(jsonb_typeof(p_participants), '') <> 'array' then
    raise exception 'Organization participants must be provided as a list.';
  end if;

  v_participant_count := jsonb_array_length(p_participants);

  if v_participant_count < 3 then
    raise exception
      'Organization applications require at least 3 active participants.';
  end if;

  ---------------------------------------------------------------------------
  -- 2. Validate application classification
  ---------------------------------------------------------------------------

  v_application_path := nullif(
    btrim(p_application ->> 'application_path'),
    ''
  );

  if v_application_path not in (
    'domestic_organization',
    'international_organization'
  ) then
    raise exception 'Invalid organization application path.';
  end if;

  if nullif(btrim(p_application ->> 'user_id'), '') is null then
    raise exception 'Entrepreneur user ID is required.';
  end if;

  if nullif(btrim(p_application ->> 'full_name'), '') is null then
    raise exception 'Applicant full name is required.';
  end if;

  if nullif(btrim(p_application ->> 'email'), '') is null then
    raise exception 'Applicant email is required.';
  end if;

  if nullif(btrim(p_application ->> 'phone'), '') is null then
    raise exception 'Applicant phone is required.';
  end if;

  if nullif(btrim(p_application ->> 'enterprise_country'), '') is null then
    raise exception 'Enterprise country is required.';
  end if;

  ---------------------------------------------------------------------------
  -- 3. Validate organization requirements and financing
  ---------------------------------------------------------------------------

  if nullif(btrim(p_organization ->> 'legal_name'), '') is null then
    raise exception 'Organization legal name is required.';
  end if;

  if nullif(btrim(p_organization ->> 'country'), '') is null then
    raise exception 'Organization country is required.';
  end if;

  if nullif(
    btrim(p_organization ->> 'primary_representative_name'),
    ''
  ) is null then
    raise exception 'Primary representative name is required.';
  end if;

  if nullif(
    btrim(p_organization ->> 'primary_representative_email'),
    ''
  ) is null then
    raise exception 'Primary representative email is required.';
  end if;

  if nullif(btrim(p_organization ->> 'project_name'), '') is null then
    raise exception 'Organization project name is required.';
  end if;

  if nullif(
    btrim(p_organization ->> 'project_description'),
    ''
  ) is null then
    raise exception 'Organization project description is required.';
  end if;

  v_requested_financing :=
    nullif(p_organization ->> 'requested_financing', '')::numeric;

  if v_requested_financing is null
     or v_requested_financing <= 0
     or v_requested_financing > 100000 then
    raise exception
      'Organization requested financing must be greater than $0 and cannot exceed $100,000.';
  end if;

  v_estimated_project_cost :=
    nullif(p_organization ->> 'estimated_project_cost', '')::numeric;

  if v_estimated_project_cost is not null
     and v_estimated_project_cost < 0 then
    raise exception 'Estimated project cost cannot be negative.';
  end if;

  v_expected_jobs :=
    nullif(p_organization ->> 'expected_jobs', '')::integer;

  if v_expected_jobs is not null and v_expected_jobs < 0 then
    raise exception 'Expected jobs cannot be negative.';
  end if;

  v_year_established :=
    nullif(p_organization ->> 'year_established', '')::integer;

  if v_year_established is not null
     and (
       v_year_established < 1800
       or v_year_established >
         extract(year from current_date)::integer
     ) then
    raise exception 'Please provide a valid year established.';
  end if;

  ---------------------------------------------------------------------------
  -- 4. Validate every participant before creating any database record
  ---------------------------------------------------------------------------

  for v_participant in
    select value
    from jsonb_array_elements(p_participants)
  loop
    if nullif(btrim(v_participant ->> 'full_name'), '') is null then
      raise exception 'Every organization participant must include a name.';
    end if;

    if nullif(
      btrim(v_participant ->> 'organizational_title'),
      ''
    ) is null then
      raise exception
        'Every organization participant must include an organization title.';
    end if;

    if nullif(btrim(v_participant ->> 'project_role'), '') is null then
      raise exception
        'Every organization participant must include a project role.';
    end if;

    if nullif(
      btrim(v_participant ->> 'project_responsibility'),
      ''
    ) is null then
      raise exception
        'Every organization participant must include a project responsibility.';
    end if;
  end loop;

  ---------------------------------------------------------------------------
  -- 5. Create main entrepreneur application
  --
  -- The existing AFTER INSERT ETVMC trigger executes inside this same
  -- PostgreSQL transaction. If anything below fails, its records roll back too.
  ---------------------------------------------------------------------------

  insert into public.entrepreneur_applications (
    user_id,
    full_name,
    email,
    phone,

    country_of_citizenship,
    date_of_birth,
    place_of_birth,

    address_country,
    street_address,
    city,
    state,
    zip_code,

    race_ethnicity,
    race_ethnicity_other,

    government_id_path,
    selfie_verification_path,

    business_name,
    business_type,
    business_description,

    applicant_type,
    enterprise_country,
    application_path,

    status,
    review_status,
    qualification_status,
    application_decision,

    units_supported,
    units_required,
    funding_queue_position,
    funding_round,
    estimated_funding_date,
    funding_request
  )
  values (
    (p_application ->> 'user_id')::uuid,
    nullif(btrim(p_application ->> 'full_name'), ''),
    lower(nullif(btrim(p_application ->> 'email'), '')),
    nullif(btrim(p_application ->> 'phone'), ''),

    nullif(btrim(p_application ->> 'country_of_citizenship'), ''),
    nullif(p_application ->> 'date_of_birth', '')::date,
    nullif(btrim(p_application ->> 'place_of_birth'), ''),

    nullif(btrim(p_application ->> 'address_country'), ''),
    nullif(btrim(p_application ->> 'street_address'), ''),
    nullif(btrim(p_application ->> 'city'), ''),
    nullif(btrim(p_application ->> 'state'), ''),
    nullif(btrim(p_application ->> 'zip_code'), ''),

    nullif(btrim(p_application ->> 'race_ethnicity'), ''),
    nullif(btrim(p_application ->> 'race_ethnicity_other'), ''),

    nullif(btrim(p_application ->> 'government_id_path'), ''),
    nullif(btrim(p_application ->> 'selfie_verification_path'), ''),

    nullif(btrim(p_organization ->> 'project_name'), ''),
    coalesce(
      nullif(btrim(p_organization ->> 'project_category'), ''),
      nullif(btrim(p_organization ->> 'organization_type'), '')
    ),
    nullif(btrim(p_organization ->> 'project_description'), ''),

    'organization',
    nullif(btrim(p_application ->> 'enterprise_country'), ''),
    v_application_path,

    'Pending Review',
    'Pending Review',
    'Pending Review',
    'Pending',

    0,
    20,
    null,
    'Not Assigned',
    null,
    v_requested_financing
  )
  returning id into v_application_id;

  ---------------------------------------------------------------------------
  -- 6. Create organization application details
  ---------------------------------------------------------------------------

  insert into public.entrepreneur_organization_applications (
    application_id,

    legal_name,
    display_name,
    organization_type,
    registration_number,

    country,
    street_address,
    city,
    state_region,
    postal_code,

    year_established,
    website,

    primary_representative_name,
    primary_representative_title,
    primary_representative_email,
    primary_representative_phone,

    secondary_representative_name,
    secondary_representative_title,
    secondary_representative_email,
    secondary_representative_phone,

    project_name,
    project_category,
    project_description,
    product_service,
    community_market_served,
    project_location,
    project_stage,
    existing_operations,
    expected_jobs,

    resources_required,
    facility_requirements,
    licenses_permits,

    estimated_project_cost,
    requested_financing,
    intended_use_of_financing,

    participant_count,
    status
  )
  values (
    v_application_id,

    nullif(btrim(p_organization ->> 'legal_name'), ''),
    nullif(btrim(p_organization ->> 'display_name'), ''),
    nullif(btrim(p_organization ->> 'organization_type'), ''),
    nullif(btrim(p_organization ->> 'registration_number'), ''),

    nullif(btrim(p_organization ->> 'country'), ''),
    nullif(btrim(p_organization ->> 'street_address'), ''),
    nullif(btrim(p_organization ->> 'city'), ''),
    nullif(btrim(p_organization ->> 'state_region'), ''),
    nullif(btrim(p_organization ->> 'postal_code'), ''),

    v_year_established,
    nullif(btrim(p_organization ->> 'website'), ''),

    nullif(
      btrim(p_organization ->> 'primary_representative_name'),
      ''
    ),
    nullif(
      btrim(p_organization ->> 'primary_representative_title'),
      ''
    ),
    lower(
      nullif(
        btrim(p_organization ->> 'primary_representative_email'),
        ''
      )
    ),
    nullif(
      btrim(p_organization ->> 'primary_representative_phone'),
      ''
    ),

    nullif(
      btrim(p_organization ->> 'secondary_representative_name'),
      ''
    ),
    nullif(
      btrim(p_organization ->> 'secondary_representative_title'),
      ''
    ),
    lower(
      nullif(
        btrim(p_organization ->> 'secondary_representative_email'),
        ''
      )
    ),
    nullif(
      btrim(p_organization ->> 'secondary_representative_phone'),
      ''
    ),

    nullif(btrim(p_organization ->> 'project_name'), ''),
    nullif(btrim(p_organization ->> 'project_category'), ''),
    nullif(btrim(p_organization ->> 'project_description'), ''),
    nullif(btrim(p_organization ->> 'product_service'), ''),
    nullif(btrim(p_organization ->> 'community_market_served'), ''),
    nullif(btrim(p_organization ->> 'project_location'), ''),
    nullif(btrim(p_organization ->> 'project_stage'), ''),
    nullif(btrim(p_organization ->> 'existing_operations'), ''),
    v_expected_jobs,

    nullif(btrim(p_organization ->> 'resources_required'), ''),
    nullif(btrim(p_organization ->> 'facility_requirements'), ''),
    nullif(btrim(p_organization ->> 'licenses_permits'), ''),

    v_estimated_project_cost,
    v_requested_financing,
    nullif(
      btrim(p_organization ->> 'intended_use_of_financing'),
      ''
    ),

    v_participant_count,
    'Pending Review'
  )
  returning id into v_organization_id;

  ---------------------------------------------------------------------------
  -- 7. Create all organization participants
  ---------------------------------------------------------------------------

  insert into public.entrepreneur_organization_members (
    organization_application_id,
    full_name,
    email,
    phone,
    organizational_title,
    project_role,
    project_responsibility,
    is_primary_representative,
    is_secondary_representative,
    participation_status
  )
  select
    v_organization_id,
    nullif(btrim(member ->> 'full_name'), ''),
    lower(nullif(btrim(member ->> 'email'), '')),
    nullif(btrim(member ->> 'phone'), ''),
    nullif(btrim(member ->> 'organizational_title'), ''),
    nullif(btrim(member ->> 'project_role'), ''),
    nullif(btrim(member ->> 'project_responsibility'), ''),
    coalesce(
      nullif(member ->> 'is_primary_representative', '')::boolean,
      false
    ),
    coalesce(
      nullif(member ->> 'is_secondary_representative', '')::boolean,
      false
    ),
    'active'
  from jsonb_array_elements(p_participants) as members(member);

  ---------------------------------------------------------------------------
  -- 8. Return committed submission identifiers
  ---------------------------------------------------------------------------

  return jsonb_build_object(
    'success', true,
    'application_id', v_application_id,
    'organization_application_id', v_organization_id,
    'applicant_type', 'organization',
    'application_path', v_application_path,
    'participant_count', v_participant_count
  );
end;
$function$;

-- This RPC is backend-only.
-- PostgreSQL functions otherwise receive EXECUTE privileges broadly by default.
revoke all on function public.eeqc_submit_organization_application(
  jsonb,
  jsonb,
  jsonb
) from public;

revoke all on function public.eeqc_submit_organization_application(
  jsonb,
  jsonb,
  jsonb
) from anon;

revoke all on function public.eeqc_submit_organization_application(
  jsonb,
  jsonb,
  jsonb
) from authenticated;

grant execute on function public.eeqc_submit_organization_application(
  jsonb,
  jsonb,
  jsonb
) to service_role;

commit;
