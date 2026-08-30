import Stripe from "stripe";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  EPEW_FINANCIAL_STANDARD,
  centsToDollars,
} from "@/lib/enterprise/financial/financialRules";

type AnnualSelectionMethod =
  | "self_selected"
  | "epew_selected";

export interface AnnualSupportPaymentResult {
  supportIntentId: string;
  transactionId: string;
  selectionMethod: AnnualSelectionMethod;
  selectionCaseId: string | null;
  allocationId: string | null;
  selectionDueAt: string | null;
}

export async function processAnnualSupportCheckout(
  session: Stripe.Checkout.Session
): Promise<AnnualSupportPaymentResult> {
  const metadata = session.metadata || {};

  const supportIntentId =
    metadata.support_intent_id?.trim() || "";

  const supporterId =
    metadata.supporter_id?.trim() || "";

  const selectionMethod =
    metadata.selection_method as AnnualSelectionMethod;

  const units =
    Math.floor(
      Number(metadata.units || 0)
    );

  if (!supportIntentId) {
    throw new Error(
      "Annual support checkout is missing support_intent_id."
    );
  }

  if (!supporterId) {
    throw new Error(
      "Annual support checkout is missing supporter_id."
    );
  }

  if (
    selectionMethod !== "self_selected" &&
    selectionMethod !== "epew_selected"
  ) {
    throw new Error(
      "Annual support checkout has an invalid selection method."
    );
  }

  if (
    !Number.isInteger(units) ||
    units < 1
  ) {
    throw new Error(
      "Annual support checkout has an invalid unit count."
    );
  }

  /*
   * Checkout Session completed does not automatically mean
   * every payment method has settled. Phase 1 uses card payment,
   * so require Stripe to report the session as paid.
   */
  if (session.payment_status !== "paid") {
    throw new Error(
      `Annual support payment is not paid. Stripe status: ${session.payment_status}`
    );
  }

  const expectedAmountCents =
    units *
    EPEW_FINANCIAL_STANDARD
      .ANNUAL_UNIT_AMOUNT_CENTS;

  const stripeAmountCents =
    Number(session.amount_total || 0);

  if (
    stripeAmountCents !==
    expectedAmountCents
  ) {
    throw new Error(
      "Annual support payment amount does not match the official EPEW unit amount."
    );
  }

  /*
   * Load the support intent from EPEW.
   * Browser/Stripe metadata alone does not establish the official
   * support terms.
   */
  const {
    data: supportIntent,
    error: supportIntentError,
  } = await supabaseAdmin
    .from("epew_support_intents")
    .select(
      "id,supporter_id,unit_count,unit_price,total_amount,support_term_months,payment_frequency,participation_benefit_rate,selection_method,allocation_preference,supporter_selected_entrepreneur_id,referred_entrepreneur_id,referred_business_name,status,paid_at"
    )
    .eq("id", supportIntentId)
    .maybeSingle();

  if (
    supportIntentError ||
    !supportIntent
  ) {
    throw new Error(
      "Annual support intent could not be found."
    );
  }

  if (
    supportIntent.supporter_id !==
    supporterId
  ) {
    throw new Error(
      "Annual support supporter does not match the support intent."
    );
  }

  if (
    Number(supportIntent.unit_count) !==
    units
  ) {
    throw new Error(
      "Annual support unit count does not match the support intent."
    );
  }

  if (
    supportIntent.selection_method !==
    selectionMethod
  ) {
    throw new Error(
      "Annual support selection method does not match the support intent."
    );
  }

  const officialUnitPrice =
    centsToDollars(
      EPEW_FINANCIAL_STANDARD
        .ANNUAL_UNIT_AMOUNT_CENTS
    );

  const officialTotalAmount =
    centsToDollars(
      expectedAmountCents
    );

  if (
    Number(supportIntent.unit_price) !==
      officialUnitPrice ||
    Number(supportIntent.total_amount) !==
      officialTotalAmount ||
    Number(
      supportIntent.support_term_months
    ) !== 12 ||
    supportIntent.payment_frequency !==
      "one_time"
  ) {
    throw new Error(
      "Annual support intent does not match the current EPEW annual support standard."
    );
  }

  /*
   * Stripe can retry webhooks. Reuse an existing annual-support
   * transaction if this Checkout Session was already processed.
   */
  const {
    data: existingTransaction,
    error: existingTransactionError,
  } = await supabaseAdmin
    .from("supporter_transactions")
    .select("id")
    .eq(
      "stripe_checkout_session_id",
      session.id
    )
    .maybeSingle();

  if (existingTransactionError) {
    throw existingTransactionError;
  }

  let transactionId =
    existingTransaction?.id || "";

  const paidAt =
    supportIntent.paid_at ||
    new Date().toISOString();

  let selectionDueAt:
    | string
    | null = null;

  if (
    selectionMethod ===
    "epew_selected"
  ) {
    const deadline =
      new Date(paidAt);

    deadline.setHours(
      deadline.getHours() + 48
    );

    selectionDueAt =
      deadline.toISOString();
  }

  if (!transactionId) {
    const {
      data: transaction,
      error: transactionError,
    } = await supabaseAdmin
      .from("supporter_transactions")
      .insert({
        supporter_id:
          supporterId,

        /*
         * For EPEW-selected support, this remains NULL until
         * the qualified entrepreneur is selected.
         */
        entrepreneur_id:
          selectionMethod ===
          "self_selected"
            ? supportIntent.supporter_selected_entrepreneur_id
            : null,

        stripe_checkout_session_id:
          session.id,

        stripe_payment_intent_id:
          typeof session.payment_intent ===
          "string"
            ? session.payment_intent
            : null,

        stripe_customer_id:
          typeof session.customer ===
          "string"
            ? session.customer
            : null,

        amount:
          officialTotalAmount,

        units,

        frequency:
          "one-time",

        payment_type:
          "one-time",

        status:
          "paid",

        support_intent_id:
          supportIntentId,

        annual_benefit_rate:
          Number(
            supportIntent.participation_benefit_rate ||
              8
          ),

        selection_method:
          selectionMethod,

        selection_due_at:
          selectionDueAt,
      })
      .select("id")
      .single();

    if (
      transactionError ||
      !transaction
    ) {
      throw new Error(
        `Unable to record annual support transaction: ${
          transactionError?.message ||
          "Unknown transaction error."
        }`
      );
    }

    transactionId =
      transaction.id;
  }

  /*
   * EPEW-SELECTED SUPPORT
   *
   * Payment comes first.
   * No entrepreneur is permanently assigned here.
   */
  if (
    selectionMethod ===
    "epew_selected"
  ) {
    const {
      error: intentUpdateError,
    } = await supabaseAdmin
      .from("epew_support_intents")
      .update({
        status:
          "paid_selection_pending",

        paid_at:
          paidAt,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", supportIntentId);

    if (intentUpdateError) {
      throw intentUpdateError;
    }

    const {
      data: existingCase,
      error: existingCaseError,
    } = await supabaseAdmin
      .from(
        "epew_support_selection_cases"
      )
      .select("id,selection_due_at")
      .eq(
        "support_intent_id",
        supportIntentId
      )
      .maybeSingle();

    if (existingCaseError) {
      throw existingCaseError;
    }

    if (existingCase) {
      return {
        supportIntentId,
        transactionId,
        selectionMethod,
        selectionCaseId:
          existingCase.id,
        allocationId: null,
        selectionDueAt:
          existingCase.selection_due_at,
      };
    }

    const {
      data: selectionCase,
      error: selectionCaseError,
    } = await supabaseAdmin
      .from(
        "epew_support_selection_cases"
      )
      .insert({
        support_intent_id:
          supportIntentId,

        supporter_id:
          supporterId,

        requested_units:
          units,

        remaining_units:
          units,

        referral_entrepreneur_id:
          supportIntent.referred_entrepreneur_id ||
          null,

        status:
          "paid_selection_pending",

        paid_at:
          paidAt,

        selection_due_at:
          selectionDueAt,

        selection_metadata: {
          payment_confirmed:
            true,

          stripe_checkout_session_id:
            session.id,

          allocation_preference:
            supportIntent.allocation_preference,

          referred_business_name:
            supportIntent.referred_business_name ||
            null,
        },

        auto_processed:
          false,

        admin_override:
          false,
      })
      .select("id,selection_due_at")
      .single();

    if (
      selectionCaseError ||
      !selectionCase
    ) {
      throw new Error(
        `Unable to create 48-hour EPEW selection case: ${
          selectionCaseError?.message ||
          "Unknown selection error."
        }`
      );
    }

    return {
      supportIntentId,
      transactionId,
      selectionMethod,
      selectionCaseId:
        selectionCase.id,
      allocationId: null,
      selectionDueAt:
        selectionCase.selection_due_at,
    };
  }

  /*
   * SELF-SELECTED SUPPORT
   *
   * The Supporter already chose a qualified Marketplace business,
   * so allocation may be created immediately after payment.
   */
  /*
   * SELF-SELECTED SUPPORT
   *
   * The Supporter already chose the business.
   *
   * We still use the same atomic PostgreSQL allocation function
   * used by EPEW Smart Selection. This protects the final units
   * from concurrent purchases and performs the authoritative
   * qualification/capacity check while the entrepreneur row is
   * locked.
   */
  const entrepreneurId =
    supportIntent.supporter_selected_entrepreneur_id;

  if (!entrepreneurId) {
    throw new Error(
      "Self-selected annual support has no selected entrepreneur."
    );
  }

  /*
   * The atomic function requires confirmation that EPEW has
   * recorded the successful payment.
   *
   * Do not downgrade an intent that was already allocated during
   * a previous Stripe webhook delivery.
   */
  if (
    supportIntent.status !==
    "allocated"
  ) {
    const {
      error: paidIntentError,
    } = await supabaseAdmin
      .from("epew_support_intents")
      .update({
        status:
          "paid_selection_pending",

        paid_at:
          paidAt,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", supportIntentId);

    if (paidIntentError) {
      throw paidIntentError;
    }
  }

  const {
    data: allocationData,
    error: allocationError,
  } = await supabaseAdmin.rpc(
    "epew_finalize_support_allocation",
    {
      p_support_intent_id:
        supportIntentId,

      p_entrepreneur_id:
        entrepreneurId,

      p_selection_case_id:
        null,

      p_selection_reason:
        "The Supporter selected this qualified EPEW Marketplace business directly.",

      p_referral_preference_applied:
        false,
    }
  );

  if (allocationError) {
    throw new Error(
      `Unable to finalize self-selected annual support allocation: ${allocationError.message}`
    );
  }

  const allocation =
    Array.isArray(allocationData)
      ? allocationData[0]
      : allocationData;

  const allocationId =
    allocation?.id;

  if (
    !allocationId ||
    typeof allocationId !==
      "string"
  ) {
    throw new Error(
      "Atomic annual support allocation completed without returning an allocation ID."
    );
  }

  return {
    supportIntentId,
    transactionId,
    selectionMethod,
    selectionCaseId: null,
    allocationId,
    selectionDueAt: null,
  };
}
