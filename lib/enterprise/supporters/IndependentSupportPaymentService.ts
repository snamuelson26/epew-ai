import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : (value?.id ?? null);

async function record(
  planId: string,
  key: string,
  amount: number,
  initial: boolean,
  customer: string | null,
  subscription: string | null,
  session: string | null,
  invoice: string | null,
) {
  const { error } = await supabaseAdmin.rpc("epew_record_independent_payment", {
    p_plan: planId,
    p_key: key,
    p_amount: amount,
    p_initial: initial,
    p_customer: customer,
    p_subscription: subscription,
    p_session: session,
    p_invoice: invoice,
  });
  if (error) throw new Error("Independent payment could not be recorded");
  const { error: allocationError } = await supabaseAdmin.rpc(
    "epew_allocate_independent_payments",
  );
  if (allocationError) throw new Error("Independent allocation pending retry");
}
export async function independentCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  if (session.currency !== "usd")
    throw new Error("Unexpected contribution currency");
  const plan = session.metadata?.independent_plan_id;
  if (!plan) throw new Error("Missing contribution plan");
  const invoice = idOf(session.invoice);
  const subscription = idOf(session.subscription);
  if (subscription && !invoice) throw new Error("Missing subscription invoice");
  await record(
    plan,
    invoice ?? session.id,
    session.amount_total ?? 0,
    true,
    idOf(session.customer),
    subscription,
    session.id,
    invoice,
  );
}
export async function independentInvoice(invoice: Stripe.Invoice) {
  // Existing webhook endpoints may still emit the older Invoice shape.
  const legacy = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
  const subscriptionId = idOf(
    invoice.parent?.subscription_details?.subscription ?? legacy.subscription,
  );
  if (!subscriptionId) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.metadata.support_flow !== "independent") return;
  if (invoice.status !== "paid" || invoice.currency !== "usd") return;
  await record(
    subscription.metadata.independent_plan_id,
    invoice.id,
    invoice.amount_paid,
    invoice.billing_reason === "subscription_create",
    idOf(invoice.customer),
    subscriptionId,
    null,
    invoice.id,
  );
}
export async function independentSubscription(
  subscription: Stripe.Subscription,
) {
  if (subscription.metadata.support_flow !== "independent") return;
  const status =
    subscription.status === "canceled"
      ? "cancelled"
      : ["past_due", "unpaid"].includes(subscription.status)
        ? "past_due"
        : null;
  if (!status) return;
  const { error } = await supabaseAdmin
    .from("epew_independent_support_plans")
    .update({ status })
    .eq("id", subscription.metadata.independent_plan_id);
  if (error) throw error;
}

/** Reconcile settled invoices as a recovery path if an invoice webhook is delayed. */
export async function reconcileIndependentSupport() {
  const { data: plans, error } = await supabaseAdmin
    .from("epew_independent_support_plans")
    .select("id,stripe_subscription_id,last_checked_at,created_at")
    .not("stripe_subscription_id", "is", null)
    .in("status", ["active", "past_due", "cancelled"])
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(20);
  if (error) throw error;
  let checked = 0;
  for (const plan of plans ?? []) {
    const started = new Date().toISOString();
    const since =
      Math.floor(
        new Date(plan.last_checked_at ?? plan.created_at).getTime() / 1000,
      ) - 86400;
    for await (const invoice of stripe.invoices.list({
      subscription: plan.stripe_subscription_id,
      status: "paid",
      created: { gte: since },
      limit: 100,
    })) {
      await independentInvoice(invoice);
    }
    await independentSubscription(
      await stripe.subscriptions.retrieve(plan.stripe_subscription_id),
    );
    const { error: updateError } = await supabaseAdmin
      .from("epew_independent_support_plans")
      .update({ last_checked_at: started })
      .eq("id", plan.id);
    if (updateError) throw updateError;
    checked += 1;
  }
  return checked;
}
