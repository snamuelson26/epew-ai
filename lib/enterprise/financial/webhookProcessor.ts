/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Financial Core
 * ------------------------------------------------------------
 * Webhook Processor
 *
 * Converts verified Stripe webhook objects into official
 * Enterprise Contribution records.
 * ============================================================
 */

import Stripe from "stripe";
import { Contribution } from "../core/types";
import { CONTRIBUTION_FREQUENCY, PAYMENT_STATUS } from "../core/constants";

export function contributionFromCheckoutSession(
  session: Stripe.Checkout.Session
): Contribution {
  const metadata = session.metadata || {};

  return {
    supporterId: metadata.supporter_id || "",
    entrepreneurId: metadata.entrepreneur_id || "",
    businessId: metadata.business_name || null,

    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null,
    stripeInvoiceId:
      typeof session.invoice === "string"
        ? session.invoice
        : null,
    stripeCustomerId:
      typeof session.customer === "string" ? session.customer : null,
    stripeSubscriptionId:
      typeof session.subscription === "string"
        ? session.subscription
        : null,

    amount: Number(session.amount_total || 0) / 100,
    units: Number(metadata.units || 0),
    frequency:
      (metadata.frequency as Contribution["frequency"]) ||
      CONTRIBUTION_FREQUENCY.ONE_TIME,
    status: PAYMENT_STATUS.PAID,
    paymentType:
      session.mode === "subscription" ? "recurring" : "one-time",
    createdAt: new Date().toISOString(),
    metadata: {
      entrepreneurName: metadata.entrepreneur_name || "",
      businessName: metadata.business_name || "",
      platform: metadata.platform || "EPEW",
      model: metadata.model || "EDE",
      system: metadata.system || "IBOS",
    },
  };
}