-- ============================================================
-- EPEW SUPPORTER SYSTEM
-- Atomic Support Allocation
--
-- Purpose:
-- Finalize paid annual Supporter units against one entrepreneur
-- without allowing concurrent requests to over-allocate units.
--
-- Supports:
--   1. self_selected
--   2. epew_selected
--
-- Phase 1:
--   $5,200 per unit
--   one-time annual payment
--   12-month participation term
--   up to 8% participation benefit
-- ============================================================

create or replace function public.epew_finalize_support_allocation(
  p_support_intent_id uuid,
  p_entrepreneur_id uuid,
  p_selection_case_id uuid default null,
  p_selection_reason text default null,
  p_referral_preference_applied boolean default false
)
returns public.epew_support_allocations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intent public.epew_support_intents%rowtype;
  v_case public.epew_support_selection_cases%rowtype;
  v_entrepreneur public.entrepreneurs%rowtype;
  v_existing public.epew_support_allocations%rowtype;
  v_allocation public.epew_support_allocations%rowtype;

  v_available_units integer;
  v_new_units_supported integer;
  v_new_units_remaining integer;
begin
  -- ----------------------------------------------------------
  -- 1. Lock the Support Intent.
  -- ----------------------------------------------------------

  select *
    into v_intent
  from public.epew_support_intents
  where id = p_support_intent_id
  for update;

  if not found then
    raise exception 'Support intent % was not found.', p_support_intent_id;
  end if;

  -- A Support Intent cannot be allocated before payment.
  if v_intent.paid_at is null then
    raise exception
      'Support intent % has not been paid.',
      p_support_intent_id;
  end if;

  if v_intent.status not in (
    'paid_selection_pending',
    'selection_in_progress',
    'allocated'
  ) then
    raise exception
      'Support intent % cannot be allocated from status %.',
      p_support_intent_id,
      v_intent.status;
  end if;

  -- ----------------------------------------------------------
  -- 2. Idempotency.
  --
  -- If this intent was already allocated to this entrepreneur,
  -- return the existing allocation instead of creating another.
  -- ----------------------------------------------------------

  select *
    into v_existing
  from public.epew_support_allocations
  where support_intent_id = p_support_intent_id
    and entrepreneur_id = p_entrepreneur_id
    and status = 'active'
  order by created_at asc
  limit 1;

  if found then
    return v_existing;
  end if;

  -- Phase 1 is one-business allocation.
  if exists (
    select 1
    from public.epew_support_allocations
    where support_intent_id = p_support_intent_id
      and status = 'active'
  ) then
    raise exception
      'Support intent % already has an active allocation.',
      p_support_intent_id;
  end if;

  -- ----------------------------------------------------------
  -- 3. Validate and lock the Selection Case when supplied.
  -- ----------------------------------------------------------

  if p_selection_case_id is not null then
    select *
      into v_case
    from public.epew_support_selection_cases
    where id = p_selection_case_id
      and support_intent_id = p_support_intent_id
    for update;

    if not found then
      raise exception
        'Selection case % does not belong to support intent %.',
        p_selection_case_id,
        p_support_intent_id;
    end if;

    if v_case.status not in (
      'paid_selection_pending',
      'selection_in_progress',
      'entrepreneur_selected',
      'allocation_completed'
    ) then
      raise exception
        'Selection case % cannot be allocated from status %.',
        p_selection_case_id,
        v_case.status;
    end if;
  end if;

  -- EPEW-selected support must have a Selection Case.
  if v_intent.selection_method = 'epew_selected'
     and p_selection_case_id is null then
    raise exception
      'EPEW-selected support intent % requires a selection case.',
      p_support_intent_id;
  end if;

  -- ----------------------------------------------------------
  -- 4. Lock the entrepreneur.
  --
  -- This row lock prevents two concurrent Supporters from
  -- consuming the same remaining units.
  -- ----------------------------------------------------------

  select *
    into v_entrepreneur
  from public.entrepreneurs
  where id = p_entrepreneur_id
  for update;

  if not found then
    raise exception
      'Entrepreneur % was not found.',
      p_entrepreneur_id;
  end if;

  -- ----------------------------------------------------------
  -- 5. Eligibility gates.
  -- ----------------------------------------------------------

  if coalesce(v_entrepreneur.qualified, false) is not true then
    raise exception
      'Entrepreneur % is not qualified for Supporter allocation.',
      p_entrepreneur_id;
  end if;

  if coalesce(v_entrepreneur.marketplace_visibility, false) is not true then
    raise exception
      'Entrepreneur % is not currently Marketplace-visible.',
      p_entrepreneur_id;
  end if;

  -- Direct-business checkout must still point to the business
  -- originally chosen by the Supporter.
  if v_intent.selection_method = 'self_selected'
     and v_intent.supporter_selected_entrepreneur_id is distinct from p_entrepreneur_id then
    raise exception
      'Entrepreneur % does not match the Supporter-selected entrepreneur for intent %.',
      p_entrepreneur_id,
      p_support_intent_id;
  end if;

  -- ----------------------------------------------------------
  -- 6. Determine live available capacity.
  --
  -- Prefer units_remaining when populated. If legacy data has
  -- no value there, derive it from units_required - supported.
  -- ----------------------------------------------------------

  v_available_units :=
    coalesce(
      v_entrepreneur.units_remaining,
      greatest(
        coalesce(v_entrepreneur.units_required, 20)
        - coalesce(v_entrepreneur.units_supported, 0),
        0
      )
    );

  if v_available_units < v_intent.unit_count then
    raise exception
      'Entrepreneur % has only % unit(s) remaining; % unit(s) are required.',
      p_entrepreneur_id,
      v_available_units,
      v_intent.unit_count;
  end if;

  -- ----------------------------------------------------------
  -- 7. Reserve the entrepreneur units while the row is locked.
  -- ----------------------------------------------------------

  v_new_units_supported :=
    coalesce(v_entrepreneur.units_supported, 0)
    + v_intent.unit_count;

  v_new_units_remaining :=
    v_available_units
    - v_intent.unit_count;

  update public.entrepreneurs
  set
    units_supported = v_new_units_supported,
    units_remaining = v_new_units_remaining,
    community_units_supported =
      coalesce(community_units_supported, 0) + v_intent.unit_count,
    updated_at = now()
  where id = p_entrepreneur_id;

  -- ----------------------------------------------------------
  -- 8. Create the permanent Support Allocation.
  -- ----------------------------------------------------------

  insert into public.epew_support_allocations (
    support_intent_id,
    selection_case_id,
    supporter_id,
    entrepreneur_id,
    business_name,
    units,
    unit_price,
    allocated_amount,
    support_term_months,
    participation_benefit_rate,
    selection_method,
    referral_preference_applied,
    status,
    allocated_at
  )
  values (
    v_intent.id,
    p_selection_case_id,
    v_intent.supporter_id,
    v_entrepreneur.id,
    v_entrepreneur.business_name,
    v_intent.unit_count,
    v_intent.unit_price,
    v_intent.total_amount,
    v_intent.support_term_months,
    v_intent.participation_benefit_rate,
    v_intent.selection_method,
    coalesce(p_referral_preference_applied, false),
    'active',
    now()
  )
  returning *
    into v_allocation;

  -- ----------------------------------------------------------
  -- 9. Complete the EPEW Selection Case when applicable.
  -- ----------------------------------------------------------

  if p_selection_case_id is not null then
    update public.epew_support_selection_cases
    set
      remaining_units = 0,
      selected_entrepreneur_id = v_entrepreneur.id,
      selected_business_name = v_entrepreneur.business_name,
      selection_reason = coalesce(
        nullif(trim(p_selection_reason), ''),
        'Qualified entrepreneur selected and support allocation completed.'
      ),
      status = 'allocation_completed',
      selection_completed_at = now(),
      updated_at = now()
    where id = p_selection_case_id;
  end if;

  -- ----------------------------------------------------------
  -- 10. Mark the Support Intent fully allocated.
  -- ----------------------------------------------------------

  update public.epew_support_intents
  set
    status = 'allocated',
    updated_at = now()
  where id = p_support_intent_id;

  -- ----------------------------------------------------------
  -- 11. Create communication workflow records.
  --
  -- These records do NOT send messages themselves.
  -- They establish the work that the communication layer
  -- will later publish/send.
  -- ----------------------------------------------------------

  insert into public.epew_support_introductions (
    allocation_id,
    supporter_id,
    entrepreneur_id,
    supporter_letter_status,
    entrepreneur_notification_status
  )
  values (
    v_allocation.id,
    v_intent.supporter_id,
    v_entrepreneur.id,
    'pending',
    'pending'
  )
  on conflict (allocation_id) do nothing;

  insert into public.epew_support_thank_you_messages (
    allocation_id,
    supporter_id,
    entrepreneur_id,
    status
  )
  values (
    v_allocation.id,
    v_intent.supporter_id,
    v_entrepreneur.id,
    'available'
  )
  on conflict (allocation_id) do nothing;

  return v_allocation;
end;
$$;

comment on function public.epew_finalize_support_allocation(
  uuid,
  uuid,
  uuid,
  text,
  boolean
) is
'Atomically finalizes a paid EPEW annual Supporter allocation, locks entrepreneur capacity, prevents unit over-allocation, completes an optional 48-hour EPEW selection case, and prepares introduction/thank-you workflow records.';

-- Backend/service execution only.
revoke all on function public.epew_finalize_support_allocation(
  uuid,
  uuid,
  uuid,
  text,
  boolean
) from public;

revoke all on function public.epew_finalize_support_allocation(
  uuid,
  uuid,
  uuid,
  text,
  boolean
) from anon;

revoke all on function public.epew_finalize_support_allocation(
  uuid,
  uuid,
  uuid,
  text,
  boolean
) from authenticated;

grant execute on function public.epew_finalize_support_allocation(
  uuid,
  uuid,
  uuid,
  text,
  boolean
) to service_role;
