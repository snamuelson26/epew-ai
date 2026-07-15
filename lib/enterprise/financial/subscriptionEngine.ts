import { EnterpriseEngine } from "../core/engine";
import { EnterpriseContext, Contribution } from "../core/types";

export interface SubscriptionResult {
  supporterId: string;
  subscriptionStatus: "active" | "inactive";
}

export class SubscriptionEngine extends EnterpriseEngine<
  Contribution,
  SubscriptionResult
> {
  constructor() {
    super("Subscription Engine");
  }

  protected async execute(
    context: EnterpriseContext,
    contribution: Contribution
  ): Promise<SubscriptionResult> {
    return {
      supporterId: contribution.supporterId,
      subscriptionStatus:
        contribution.status === "paid" ? "active" : "inactive",
    };
  }
}

export const subscriptionEngine = new SubscriptionEngine();