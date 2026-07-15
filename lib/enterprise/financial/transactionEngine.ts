/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Financial Core
 * ------------------------------------------------------------
 * Transaction Engine
 *
 * Official owner of supporter financial transactions.
 * ============================================================
 */

import { EnterpriseEngine } from "../core/engine";
import { EnterpriseContext, Contribution } from "../core/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface TransactionResult {
  transactionId: string;
}

export class TransactionEngine extends EnterpriseEngine<
  Contribution,
  TransactionResult
> {
  constructor() {
    super("Transaction Engine");
  }

  protected async execute(
    context: EnterpriseContext,
    contribution: Contribution
  ): Promise<TransactionResult> {

    const { data, error } = await supabaseAdmin
      .from("supporter_transactions")
      .insert({
        supporter_id: contribution.supporterId,

        entrepreneur_id: contribution.entrepreneurId,

        stripe_checkout_session_id:
          contribution.stripeCheckoutSessionId,

        stripe_payment_intent_id:
          contribution.stripePaymentIntentId,

        stripe_customer_id:
          contribution.stripeCustomerId,

        stripe_subscription_id:
          contribution.stripeSubscriptionId,

        amount: contribution.amount,

        units: contribution.units,

        frequency: contribution.frequency,

        payment_type: contribution.paymentType,

        status: contribution.status,

        created_at: contribution.createdAt,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return {
      transactionId: data.id,
    };
  }
}

export const transactionEngine =
  new TransactionEngine();