import { EnterpriseEngine } from "../core/engine";
import { EnterpriseContext, Contribution } from "../core/types";

export interface RevenueResult {
  supporterId: string;
  totalContributionAdded: number;
  unitsAdded: number;
}

export class RevenueEngine extends EnterpriseEngine<
  Contribution,
  RevenueResult
> {
  constructor() {
    super("Revenue Engine");
  }

  protected async execute(
    context: EnterpriseContext,
    contribution: Contribution
  ): Promise<RevenueResult> {
    return {
      supporterId: contribution.supporterId,
      totalContributionAdded: contribution.amount,
      unitsAdded: contribution.units,
    };
  }
}

export const revenueEngine = new RevenueEngine();