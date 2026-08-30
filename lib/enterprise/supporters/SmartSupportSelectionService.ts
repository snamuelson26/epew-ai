import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SelectionCaseStatus =
  | "paid_selection_pending"
  | "selection_in_progress"
  | "entrepreneur_selected"
  | "allocation_completed"
  | "manual_review"
  | "cancelled";

interface SelectionCase {
  id: string;
  support_intent_id: string;
  supporter_id: string | null;
  requested_units: number;
  remaining_units: number;
  referral_entrepreneur_id: string | null;
  referral_checked: boolean;
  referral_eligible: boolean | null;
  referral_decision_reason: string | null;
  status: SelectionCaseStatus;
  paid_at: string;
  selection_due_at: string;
  selected_entrepreneur_id: string | null;
}

interface CandidateEntrepreneur {
  id: string;
  business_name: string | null;
  qualified: boolean | null;
  marketplace_visibility: boolean | null;
  units_required: number | null;
  units_supported: number | null;
  units_remaining: number | null;
}

export interface SmartSupportSelectionResult {
  success: boolean;
  selectionCaseId: string;
  supportIntentId: string;
  entrepreneurId: string | null;
  businessName: string | null;
  allocationId: string | null;
  referralApplied: boolean;
  status:
    | "allocation_completed"
    | "manual_review"
    | "already_completed";
  reason: string;
}

function getAvailableUnits(
  entrepreneur: CandidateEntrepreneur
): number {
  if (
    entrepreneur.units_remaining !== null &&
    entrepreneur.units_remaining !== undefined
  ) {
    return Math.max(
      Number(entrepreneur.units_remaining),
      0
    );
  }

  return Math.max(
    Number(
      entrepreneur.units_required ?? 20
    ) -
      Number(
        entrepreneur.units_supported ?? 0
      ),
    0
  );
}

function isEligible(
  entrepreneur: CandidateEntrepreneur,
  requestedUnits: number
): boolean {
  return (
    entrepreneur.qualified === true &&
    entrepreneur.marketplace_visibility === true &&
    getAvailableUnits(entrepreneur) >=
      requestedUnits
  );
}

async function placeInManualReview(
  selectionCaseId: string,
  reason: string
): Promise<void> {
  /*
   * Never overwrite a case that another processor has already
   * completed or cancelled.
   */
  const { error } = await supabaseAdmin
    .from("epew_support_selection_cases")
    .update({
      status: "manual_review",
      selection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectionCaseId)
    .in("status", [
      "paid_selection_pending",
      "selection_in_progress",
      "manual_review",
    ]);

  if (error) {
    throw error;
  }
}

async function finalizeAllocation({
  selectionCase,
  entrepreneur,
  reason,
  referralApplied,
}: {
  selectionCase: SelectionCase;
  entrepreneur: CandidateEntrepreneur;
  reason: string;
  referralApplied: boolean;
}): Promise<string> {
  const {
    data,
    error,
  } = await supabaseAdmin.rpc(
    "epew_finalize_support_allocation",
    {
      p_support_intent_id:
        selectionCase.support_intent_id,

      p_entrepreneur_id:
        entrepreneur.id,

      p_selection_case_id:
        selectionCase.id,

      p_selection_reason:
        reason,

      p_referral_preference_applied:
        referralApplied,
    }
  );

  if (error) {
    throw error;
  }

  const allocation =
    Array.isArray(data)
      ? data[0]
      : data;

  const allocationId =
    allocation?.id;

  if (
    !allocationId ||
    typeof allocationId !== "string"
  ) {
    throw new Error(
      "Atomic support allocation completed without returning an allocation ID."
    );
  }

  return allocationId;
}

export async function processSmartSupportSelection(
  selectionCaseId: string
): Promise<SmartSupportSelectionResult> {
  /*
   * Load the paid 48-hour selection case.
   */
  const {
    data: selectionCase,
    error: selectionCaseError,
  } = await supabaseAdmin
    .from("epew_support_selection_cases")
    .select(
      "id,support_intent_id,supporter_id,requested_units,remaining_units,referral_entrepreneur_id,referral_checked,referral_eligible,referral_decision_reason,status,paid_at,selection_due_at,selected_entrepreneur_id"
    )
    .eq("id", selectionCaseId)
    .maybeSingle();

  if (
    selectionCaseError ||
    !selectionCase
  ) {
    throw new Error(
      "EPEW Supporter selection case could not be found."
    );
  }

  const currentCase =
    selectionCase as SelectionCase;

  /*
   * Idempotency:
   * if the case was already completed, return the existing allocation.
   */
  if (
    currentCase.status ===
    "allocation_completed"
  ) {
    const {
      data: existingAllocation,
      error: existingAllocationError,
    } = await supabaseAdmin
      .from("epew_support_allocations")
      .select(
        "id,entrepreneur_id,business_name"
      )
      .eq(
        "support_intent_id",
        currentCase.support_intent_id
      )
      .eq("status", "active")
      .maybeSingle();

    if (existingAllocationError) {
      throw existingAllocationError;
    }

    return {
      success: true,
      selectionCaseId:
        currentCase.id,
      supportIntentId:
        currentCase.support_intent_id,
      entrepreneurId:
        existingAllocation?.entrepreneur_id ||
        currentCase.selected_entrepreneur_id ||
        null,
      businessName:
        existingAllocation?.business_name ||
        null,
      allocationId:
        existingAllocation?.id ||
        null,
      referralApplied: false,
      status: "already_completed",
      reason:
        "This EPEW selection case was already completed.",
    };
  }

  if (
    currentCase.status ===
    "cancelled"
  ) {
    throw new Error(
      "Cancelled EPEW selection cases cannot be processed."
    );
  }

  /*
   * Mark selection work as started.
   */
  const now =
    new Date().toISOString();

  const {
    error: startError,
  } = await supabaseAdmin
    .from("epew_support_selection_cases")
    .update({
      status:
        "selection_in_progress",
      selection_started_at:
        now,
      updated_at:
        now,
    })
    .eq("id", currentCase.id)
    .in("status", [
      "paid_selection_pending",
      "selection_in_progress",
      "manual_review",
    ]);

  if (startError) {
    throw startError;
  }

  const requestedUnits =
    Number(
      currentCase.requested_units
    );

  /*
   * ==========================================================
   * STEP 1 — REFERRAL FIRST CONSIDERATION
   *
   * A referral is a preference only.
   * It never overrides qualification, Marketplace eligibility,
   * or available support-unit capacity.
   * ==========================================================
   */
  if (
    currentCase.referral_entrepreneur_id
  ) {
    const {
      data: referredEntrepreneur,
      error: referredError,
    } = await supabaseAdmin
      .from("entrepreneurs")
      .select(
        "id,business_name,qualified,marketplace_visibility,units_required,units_supported,units_remaining"
      )
      .eq(
        "id",
        currentCase.referral_entrepreneur_id
      )
      .maybeSingle();

    if (referredError) {
      throw referredError;
    }

    const referralEligible =
      referredEntrepreneur
        ? isEligible(
            referredEntrepreneur as CandidateEntrepreneur,
            requestedUnits
          )
        : false;

    const referralReason =
      !referredEntrepreneur
        ? "The referred business could not be found in the EPEW Marketplace."
        : referralEligible
          ? "The referred business was qualified, Marketplace-visible, and had sufficient support-unit capacity."
          : "The referred business did not satisfy all current EPEW qualification, Marketplace, and unit-capacity requirements.";

    const {
      error: referralAuditError,
    } = await supabaseAdmin
      .from(
        "epew_support_selection_cases"
      )
      .update({
        referral_checked:
          true,
        referral_eligible:
          referralEligible,
        referral_decision_reason:
          referralReason,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", currentCase.id);

    if (referralAuditError) {
      throw referralAuditError;
    }

    if (
      referralEligible &&
      referredEntrepreneur
    ) {
      try {
        const reason =
          "Referral received first consideration. The referred business satisfied EPEW qualification, Marketplace visibility, and unit-capacity requirements.";

        const allocationId =
          await finalizeAllocation({
            selectionCase:
              currentCase,
            entrepreneur:
              referredEntrepreneur as CandidateEntrepreneur,
            reason,
            referralApplied:
              true,
          });

        return {
          success: true,
          selectionCaseId:
            currentCase.id,
          supportIntentId:
            currentCase.support_intent_id,
          entrepreneurId:
            referredEntrepreneur.id,
          businessName:
            referredEntrepreneur.business_name ||
            null,
          allocationId,
          referralApplied:
            true,
          status:
            "allocation_completed",
          reason,
        };
      } catch (error) {
        /*
         * Capacity may have changed between candidate evaluation
         * and the atomic database lock. In that case, continue
         * safely to the qualified EPEW candidate pool.
         */
        console.warn(
          "Referred entrepreneur could not be atomically allocated. Continuing with qualified candidate pool.",
          error
        );
      }
    }
  }

  /*
   * ==========================================================
   * STEP 2 — QUALIFIED MARKETPLACE POOL
   * ==========================================================
   */
  const {
    data: candidateData,
    error: candidateError,
  } = await supabaseAdmin
    .from("entrepreneurs")
    .select(
      "id,business_name,qualified,marketplace_visibility,units_required,units_supported,units_remaining"
    )
    .eq("qualified", true)
    .eq(
      "marketplace_visibility",
      true
    );

  if (candidateError) {
    throw candidateError;
  }

  const candidates =
    (
      candidateData ||
      []
    )
      .map(
        (candidate) =>
          candidate as CandidateEntrepreneur
      )
      .filter(
        (candidate) =>
          isEligible(
            candidate,
            requestedUnits
          )
      )
      .sort(
        (a, b) => {
          /*
           * Fairness rule:
           * businesses with fewer already-supported units
           * receive priority.
           */
          const supportedDifference =
            Number(
              a.units_supported ?? 0
            ) -
            Number(
              b.units_supported ?? 0
            );

          if (
            supportedDifference !== 0
          ) {
            return supportedDifference;
          }

          /*
           * Stable deterministic tie-breaker.
           */
          return a.id.localeCompare(
            b.id
          );
        }
      );

  if (
    candidates.length === 0
  ) {
    const reason =
      `No qualified Marketplace entrepreneur currently has capacity for all ${requestedUnits} requested support unit(s). EPEW review is required.`;

    await placeInManualReview(
      currentCase.id,
      reason
    );

    return {
      success: false,
      selectionCaseId:
        currentCase.id,
      supportIntentId:
        currentCase.support_intent_id,
      entrepreneurId: null,
      businessName: null,
      allocationId: null,
      referralApplied: false,
      status: "manual_review",
      reason,
    };
  }

  /*
   * ==========================================================
   * STEP 3 — TRY CANDIDATES IN FAIR ORDER
   *
   * The PostgreSQL function performs the authoritative,
   * row-locked capacity check. If one candidate loses capacity
   * during a concurrent allocation, try the next candidate.
   * ==========================================================
   */
  const allocationErrors:
    string[] = [];

  for (
    const candidate of candidates
  ) {
    const reason =
      "EPEW Smart Selection chose an eligible qualified Marketplace business using the Phase 1 fairness rule: businesses with fewer previously supported units receive priority.";

    try {
      const allocationId =
        await finalizeAllocation({
          selectionCase:
            currentCase,
          entrepreneur:
            candidate,
          reason,
          referralApplied:
            false,
        });

      return {
        success: true,
        selectionCaseId:
          currentCase.id,
        supportIntentId:
          currentCase.support_intent_id,
        entrepreneurId:
          candidate.id,
        businessName:
          candidate.business_name ||
          null,
        allocationId,
        referralApplied:
          false,
        status:
          "allocation_completed",
        reason,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      allocationErrors.push(
        `${candidate.id}: ${message}`
      );
    }
  }

  /*
   * Every candidate became unavailable or failed the final
   * atomic allocation check. Do not force an unsafe assignment.
   */
  const reason =
    "Qualified candidates were identified, but no candidate could safely complete the final atomic allocation. EPEW review is required.";

  await placeInManualReview(
    currentCase.id,
    reason
  );

  console.error(
    "Smart Support Selection atomic allocation failures:",
    allocationErrors
  );

  return {
    success: false,
    selectionCaseId:
      currentCase.id,
    supportIntentId:
      currentCase.support_intent_id,
    entrepreneurId: null,
    businessName: null,
    allocationId: null,
    referralApplied: false,
    status: "manual_review",
    reason,
  };
}
