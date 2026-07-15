import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
  status: "paid" | "failed" | "pending" | "refunded";
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
  const paid = status === "paid";

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
      },
    ]);

  if (transactionError) {
    throw transactionError;
  }

  if (supporterId && paid) {
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", supporterId);
  }

  if (entrepreneurId && paid && units > 0) {
    const { data: entrepreneur } = await supabaseAdmin
      .from("entrepreneurs")
      .select("units_supported,campaign_goal")
      .eq("id", entrepreneurId)
      .maybeSingle();

    const currentUnits = Number(entrepreneur?.units_supported || 0);
    const newUnits = currentUnits + units;
    const campaignGoal = Number(entrepreneur?.campaign_goal || 0);
    const amountRaised = newUnits * 100;
    const fundingProgress =
      campaignGoal > 0 ? Math.min((amountRaised / campaignGoal) * 100, 100) : 0;

    await supabaseAdmin
      .from("entrepreneurs")
      .update({
        units_supported: newUnits,
        amount_raised: amountRaised,
        funding_progress: fundingProgress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entrepreneurId);
  }

  return { success: true };
}