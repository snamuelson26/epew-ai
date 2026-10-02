import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { processAnnualSupportCheckout } from "./AnnualSupportPaymentService";
import { checkoutState } from "./paymentPresentation";

export async function verifyOwnedCheckout(session: Stripe.Checkout.Session, supporterId: string) {
  if (session.metadata?.supporter_id !== supporterId) throw new Error("Payment does not belong to this supporter.");
  if (session.currency !== "usd") throw new Error("Unsupported payment currency.");
  const state = checkoutState(session);
  if (state === "paid" && session.metadata?.support_flow === "annual_one_time") {
    const intent = await supabaseAdmin.from("epew_support_intents").select("status").eq("id",session.metadata.support_intent_id).eq("supporter_id",supporterId).maybeSingle();
    if(intent.error) throw intent.error;
    if(intent.data?.status !== "allocated") await processAnnualSupportCheckout(session);
  }
  const {data: transaction, error} = await supabaseAdmin.from("supporter_transactions")
    .select("id,status").eq("supporter_id", supporterId).eq("stripe_checkout_session_id",session.id).maybeSingle();
  if (error) throw error;
  return {state, recorded: transaction?.status === "paid", transactionId: transaction?.id || null};
}

// Legacy intents did not persist the Checkout Session ID. Match exact, server-owned
// metadata in a bounded creation window; never select by email or amount alone.
export async function findIntentCheckout(intent: {id: string; supporter_id: string; created_at: string}) {
  const created = Math.floor(new Date(intent.created_at).getTime()/1000);
  const sessions = await stripe.checkout.sessions.list({created: {gte: created-60, lte: created+600},limit:100});
  if (sessions.has_more) throw new Error("Payment lookup needs staff review; do not pay again.");
  const matches = sessions.data.filter(s => s.metadata?.support_intent_id === intent.id && s.metadata?.supporter_id === intent.supporter_id);
  if (matches.length !== 1) throw new Error("Unable to identify one checkout safely. Please contact EPEW before paying again.");
  return matches[0];
}
