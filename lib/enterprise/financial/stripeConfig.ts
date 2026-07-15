/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS)
 * Stripe Configuration
 * ============================================================
 */

export const STRIPE_PRODUCTS = {
  WEEKLY: {
    interval: "week",
    amount: 10000, // cents ($100.00)
    nickname: "Weekly Support Unit",
  },

  MONTHLY: {
    interval: "month",
    amount: 43334, // cents ($433.34)
    nickname: "Monthly Support Unit",
  },

  ANNUAL: {
    interval: "year",
    amount: 520000, // cents ($5,200.00)
    nickname: "Annual Support Unit",
  },
} as const;

export function getStripePlan(
  frequency: "weekly" | "monthly" | "annual"
) {
  switch (frequency) {
    case "weekly":
      return STRIPE_PRODUCTS.WEEKLY;

    case "monthly":
      return STRIPE_PRODUCTS.MONTHLY;

    case "annual":
      return STRIPE_PRODUCTS.ANNUAL;

    default:
      throw new Error("Invalid contribution frequency.");
  }
}