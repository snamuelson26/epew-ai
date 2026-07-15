/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Financial Core
 * ------------------------------------------------------------
 * Financial Engine
 *
 * Official orchestrator for confirmed supporter contributions.
 * ============================================================
 */

import { EnterpriseEngine } from "../core/engine";
import { EnterpriseContext, Contribution } from "../core/types";
import { EVENTS, ENGINES } from "../core/constants";
import {
  createEnterpriseEvent,
  publishEnterpriseEvent,
} from "../core/eventBus";

import { transactionEngine } from "./transactionEngine";
import { participationEngine } from "./participationEngine";
import { subscriptionEngine } from "./subscriptionEngine";
import { revenueEngine } from "./revenueEngine";

import { updateSupporterProjection } from "../projections/supporterProjection";

export interface FinancialEngineResult {
  transactionId: string;
  participationId: string;
  participationAction: "created" | "updated";
  supporterId: string;
  entrepreneurId: string;
  amount: number;
  units: number;
  supporterProjection: any;
  eventPublished: boolean;
}

export class FinancialEngine extends EnterpriseEngine<
  Contribution,
  FinancialEngineResult
> {
  constructor() {
    super("Financial Engine");
  }

  protected async execute(
    context: EnterpriseContext,
    contribution: Contribution
  ): Promise<FinancialEngineResult> {
    const transactionResult = await transactionEngine.run(context, contribution);

    if (!transactionResult.success || !transactionResult.data) {
      throw new Error(transactionResult.message);
    }

    const participationResult = await participationEngine.run(
      context,
      contribution
    );

    if (!participationResult.success || !participationResult.data) {
      throw new Error(participationResult.message);
    }

    const subscriptionResult = await subscriptionEngine.run(
      context,
      contribution
    );

    if (!subscriptionResult.success) {
      throw new Error(subscriptionResult.message);
    }

    const revenueResult = await revenueEngine.run(context, contribution);

    if (!revenueResult.success) {
      throw new Error(revenueResult.message);
    }

    const supporterProjection =
      await updateSupporterProjection(contribution);

    const event = createEnterpriseEvent({
      name: EVENTS.SUPPORTER_CONTRIBUTION_CONFIRMED,
      source: ENGINES.FINANCIAL,
      context,
      payload: {
        transactionId: transactionResult.data.transactionId,
        participationId: participationResult.data.participationId,
        participationAction: participationResult.data.action,
        supporterId: contribution.supporterId,
        entrepreneurId: contribution.entrepreneurId,
        amount: contribution.amount,
        units: contribution.units,
        frequency: contribution.frequency,
        status: contribution.status,
        supporterProjection,
        stripeCheckoutSessionId: contribution.stripeCheckoutSessionId,
        stripeSubscriptionId: contribution.stripeSubscriptionId,
      },
    });

    const publishedEvent = await publishEnterpriseEvent(event);

    return {
      transactionId: transactionResult.data.transactionId,
      participationId: participationResult.data.participationId,
      participationAction: participationResult.data.action,
      supporterId: contribution.supporterId,
      entrepreneurId: contribution.entrepreneurId,
      amount: contribution.amount,
      units: contribution.units,
      supporterProjection,
      eventPublished: publishedEvent.status === "completed",
    };
  }
}

export const financialEngine = new FinancialEngine();