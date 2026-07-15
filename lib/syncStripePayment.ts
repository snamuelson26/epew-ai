import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PaymentStatus = "paid" | "failed" | "pending" | "refunded";

type SyncStripePaymentInput = {
  supporterId?: string | null;
  entrepreneurId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeInvoiceId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  amount: number;
  units: number;
  frequency: string;
  paymentType: string;
  status: PaymentStatus;
};

export async function syncStripePayment({
  supporterId,
  entrepreneurId,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
  stripeInvoiceId,
  stripeCustomerId,
  stripeSubscriptionId,
  amount,
  units,
  frequency,
  paymentType,
  status,
}: SyncStripePaymentInput) {
  const now = new Date().toISOString();
  const isPaid = status === "paid";

  // 1. Record payment history
  const { error: transactionError } = await supabaseAdmin
    .from("supporter_transactions")
    .insert([
      {
        supporter_id: supporterId || null,
        entrepreneur_id: entrepreneurId || null,
        stripe_checkout_session_id: stripeCheckoutSessionId || null,
        stripe_payment_intent_id: stripePaymentIntentId || null,
        stripe_invoice_id: stripeInvoiceId || null,
        stripe_customer_id: stripeCustomerId || null,
        stripe_subscription_id: stripeSubscriptionId || null,
        amount,
        units,
        frequency,
        payment_type: paymentType,
        status,
        updated_at: now,
      },
    ]);

  if (transactionError) {
    throw transactionError;
  }

  // Failed, pending, or refunded payments are logged only.
  if (!isPaid) {
    return { success: true, synced: "transaction_only" };
  }

  // 2. Update supporter account
  if (supporterId) {
    const { data: supporter } = await supabaseAdmin
      .from("supporters")
      .select("lifetime_contributions,total_units_supported")
      .eq("id", supporterId)
      .maybeSingle();

    await supabaseAdmin
      .from("supporters")
      .update({
        stripe_customer_id: stripeCustomerId || undefined,
        stripe_subscription_id: stripeSubscriptionId || undefined,
        payment_status: "active",
        lifetime_contributions:
          Number(supporter?.lifetime_contributions || 0) + amount,
        total_units_supported:
          Number(supporter?.total_units_supported || 0) + units,
        updated_at: now,
      })
      .eq("id", supporterId);
  }

  // 3. Update supporter participation
  if (supporterId && entrepreneurId && units > 0) {
    const weeklyAmount = units * 100;
    const monthlyAmount = weeklyAmount * 4;
    const annualCommitment = weeklyAmount * 52;

    const { data: participation } = await supabaseAdmin
      .from("supporter_participations")
      .select("id")
      .eq("supporter_id", supporterId)
      .eq("entrepreneur_id", entrepreneurId)
      .maybeSingle();

    if (participation) {
      await supabaseAdmin
        .from("supporter_participations")
        .update({
          units,
          weekly_amount: weeklyAmount,
          monthly_amount: monthlyAmount,
          annual_commitment: annualCommitment,
          payment_frequency: frequency,
          automatic_payment_active: true,
          participation_status: "Active",
          participation_agreement_accepted: true,
          updated_at: now,
        })
        .eq("id", participation.id);
    } else {
      await supabaseAdmin.from("supporter_participations").insert([
        {
          supporter_id: supporterId,
          entrepreneur_id: entrepreneurId,
          units,
          weekly_amount: weeklyAmount,
          monthly_amount: monthlyAmount,
          annual_commitment: annualCommitment,
          payment_frequency: frequency,
          automatic_payment_active: true,
          participation_status: "Active",
          participation_agreement_accepted: true,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  }

  // 4. Update entrepreneur campaign/funding state
  if (entrepreneurId && units > 0) {
    const { data: entrepreneur, error: entrepreneurError } = await supabaseAdmin
      .from("entrepreneurs")
      .select(
        `
        id,
        status,
        coach_status,
        units_supported,
        units_required,
        total_units_goal,
        units_remaining,
        campaign_status,
        marketplace_status,
        marketplace_visibility,
        funding_status,
        funding_queue_active
      `
      )
      .eq("id", entrepreneurId)
      .maybeSingle();

    if (entrepreneurError) {
      throw entrepreneurError;
    }

    if (entrepreneur) {
      const currentUnitsSupported = Number(entrepreneur.units_supported || 0);
      const unitsRequired = Number(
        entrepreneur.units_required ||
          entrepreneur.total_units_goal ||
          entrepreneur.units_remaining ||
          20
      );

      const newUnitsSupported = currentUnitsSupported + units;
      const newUnitsRemaining = Math.max(unitsRequired - newUnitsSupported, 0);
      const fundingGoalReached = newUnitsSupported >= unitsRequired;

      const isApproved = entrepreneur.status === "Approved";
      const coachReady = entrepreneur.coach_status === "Funding Readiness";
      const eligibleForQueue = fundingGoalReached && isApproved && coachReady;

      await supabaseAdmin
        .from("entrepreneurs")
        .update({
          units_supported: newUnitsSupported,
          units_remaining: newUnitsRemaining,
          campaign_status: fundingGoalReached
            ? "Funding Goal Reached"
            : entrepreneur.campaign_status || "Campaign Active",
          marketplace_status: fundingGoalReached
            ? "Funding Goal Reached"
            : entrepreneur.marketplace_status || "Visible",
          marketplace_visibility:
            entrepreneur.marketplace_visibility === false ? false : true,
          funding_status: eligibleForQueue
            ? "Funding Queue"
            : entrepreneur.funding_status || "Funding Readiness",
          funding_queue_active: eligibleForQueue,
          updated_at: now,
        })
        .eq("id", entrepreneurId);

      // 5. Automatically create or update funding queue record
      if (eligibleForQueue) {
        const { data: existingQueue } = await supabaseAdmin
          .from("funding_queue")
          .select("id")
          .eq("entrepreneur_id", entrepreneurId)
          .maybeSingle();

        if (existingQueue) {
          await supabaseAdmin
            .from("funding_queue")
            .update({
              queue_status: "Waiting",
              qualification_status: "Qualified",
            })
            .eq("id", existingQueue.id);
        } else {
          await supabaseAdmin.from("funding_queue").insert([
            {
              entrepreneur_id: entrepreneurId,
              queue_status: "Waiting",
              qualification_status: "Qualified",
              annual_meeting_group: "Pending Assignment",
            },
          ]);
        }
      }
    }
  }

  return {
    success: true,
    synced: "transaction_supporter_participation_entrepreneur_queue",
  };
}