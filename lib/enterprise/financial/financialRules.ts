/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Financial Core
 * ------------------------------------------------------------
 * Official EPEW Enterprise Financial Rules
 *
 * This file is the single source of truth for:
 * - Funding goals
 * - Unit values
 * - Billing frequencies
 * - Annual commitments
 * - Contribution balances
 * - Funding progress
 * - Commitment progress
 * ============================================================
 */

export const EPEW_FINANCIAL_STANDARD = {
  FUNDING_GOAL_CENTS: 10_000_000, // $100,000
  UNITS_AVAILABLE_PER_ENTREPRENEUR: 20,

  WEEKLY_UNIT_AMOUNT_CENTS: 10_000, // $100.00
  MONTHLY_UNIT_AMOUNT_CENTS: 43_333, // $433.33
  ANNUAL_UNIT_AMOUNT_CENTS: 520_000, // $5,200.00

  WEEKS_PER_YEAR: 52,
  MONTHS_PER_YEAR: 12,
} as const;

export type ContributionFrequency =
  | "weekly"
  | "monthly"
  | "annual";

export interface EntrepreneurFinancialSummary {
  fundingGoal: number;
  unitsAvailable: number;
  unitsSupported: number;
  unitsRemaining: number;
  annualCommitment: number;
  totalContributionsSupported: number;
  contributionRemaining: number;
  fundingProgress: number;
  commitmentProgress: number;
}

export interface SupporterCommitmentSummary {
  unitsSupported: number;
  annualCommitment: number;
  contributionPaid: number;
  contributionRemaining: number;
  commitmentProgress: number;
}

export function centsToDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function dollarsToCents(dollars: number): number {
  return Math.round(Number(dollars || 0) * 100);
}

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 100);
}

export function getUnitBillingAmountCents(
  frequency: ContributionFrequency
): number {
  switch (frequency) {
    case "weekly":
      return EPEW_FINANCIAL_STANDARD.WEEKLY_UNIT_AMOUNT_CENTS;

    case "monthly":
      return EPEW_FINANCIAL_STANDARD.MONTHLY_UNIT_AMOUNT_CENTS;

    case "annual":
      return EPEW_FINANCIAL_STANDARD.ANNUAL_UNIT_AMOUNT_CENTS;

    default: {
      const exhaustiveCheck: never = frequency;
      throw new Error(
        `Unsupported contribution frequency: ${exhaustiveCheck}`
      );
    }
  }
}

export function calculatePaymentAmountCents(
  units: number,
  frequency: ContributionFrequency
): number {
  const safeUnits = Math.max(Math.floor(Number(units || 0)), 0);

  return safeUnits * getUnitBillingAmountCents(frequency);
}

export function calculateAnnualCommitmentCents(
  unitsSupported: number
): number {
  const safeUnits = Math.max(
    Math.floor(Number(unitsSupported || 0)),
    0
  );

  return (
    safeUnits *
    EPEW_FINANCIAL_STANDARD.ANNUAL_UNIT_AMOUNT_CENTS
  );
}

export function calculateUnitsRemaining(
  unitsSupported: number
): number {
  const safeUnits = Math.max(
    Math.floor(Number(unitsSupported || 0)),
    0
  );

  return Math.max(
    EPEW_FINANCIAL_STANDARD.UNITS_AVAILABLE_PER_ENTREPRENEUR -
      safeUnits,
    0
  );
}

export function calculateContributionRemainingCents(
  annualCommitmentCents: number,
  contributionPaidCents: number
): number {
  return Math.max(
    Math.round(annualCommitmentCents) -
      Math.round(contributionPaidCents),
    0
  );
}

export function calculateFundingProgress(
  annualCommitmentCents: number
): number {
  const fundingGoalCents =
    EPEW_FINANCIAL_STANDARD.FUNDING_GOAL_CENTS;

  if (fundingGoalCents <= 0) {
    return 0;
  }

  return clampPercentage(
    Number(
      (
        (annualCommitmentCents / fundingGoalCents) *
        100
      ).toFixed(2)
    )
  );
}

export function calculateCommitmentProgress(
  contributionPaidCents: number,
  annualCommitmentCents: number
): number {
  if (annualCommitmentCents <= 0) {
    return 0;
  }

  return clampPercentage(
    Number(
      (
        (contributionPaidCents / annualCommitmentCents) *
        100
      ).toFixed(2)
    )
  );
}

export function buildEntrepreneurFinancialSummary({
  unitsSupported,
  totalContributionsSupported,
}: {
  unitsSupported: number;
  totalContributionsSupported: number;
}): EntrepreneurFinancialSummary {
  const annualCommitmentCents =
    calculateAnnualCommitmentCents(unitsSupported);

  const totalContributionsSupportedCents =
    dollarsToCents(totalContributionsSupported);

  const contributionRemainingCents =
    calculateContributionRemainingCents(
      annualCommitmentCents,
      totalContributionsSupportedCents
    );

  return {
    fundingGoal: centsToDollars(
      EPEW_FINANCIAL_STANDARD.FUNDING_GOAL_CENTS
    ),

    unitsAvailable:
      EPEW_FINANCIAL_STANDARD.UNITS_AVAILABLE_PER_ENTREPRENEUR,

    unitsSupported: Math.max(
      Math.floor(Number(unitsSupported || 0)),
      0
    ),

    unitsRemaining: calculateUnitsRemaining(unitsSupported),

    annualCommitment: centsToDollars(
      annualCommitmentCents
    ),

    totalContributionsSupported: centsToDollars(
      totalContributionsSupportedCents
    ),

    contributionRemaining: centsToDollars(
      contributionRemainingCents
    ),

    fundingProgress: calculateFundingProgress(
      annualCommitmentCents
    ),

    commitmentProgress: calculateCommitmentProgress(
      totalContributionsSupportedCents,
      annualCommitmentCents
    ),
  };
}

export function buildSupporterCommitmentSummary({
  unitsSupported,
  contributionPaid,
}: {
  unitsSupported: number;
  contributionPaid: number;
}): SupporterCommitmentSummary {
  const annualCommitmentCents =
    calculateAnnualCommitmentCents(unitsSupported);

  const contributionPaidCents =
    dollarsToCents(contributionPaid);

  const contributionRemainingCents =
    calculateContributionRemainingCents(
      annualCommitmentCents,
      contributionPaidCents
    );

  return {
    unitsSupported: Math.max(
      Math.floor(Number(unitsSupported || 0)),
      0
    ),

    annualCommitment: centsToDollars(
      annualCommitmentCents
    ),

    contributionPaid: centsToDollars(
      contributionPaidCents
    ),

    contributionRemaining: centsToDollars(
      contributionRemainingCents
    ),

    commitmentProgress: calculateCommitmentProgress(
      contributionPaidCents,
      annualCommitmentCents
    ),
  };
}