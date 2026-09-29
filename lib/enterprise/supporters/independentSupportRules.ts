export type IndependentFrequency = "one-time" | "weekly" | "monthly";
export function independentTerms(input: {
  frequency?: unknown;
  units?: unknown;
  amount?: unknown;
  additionalAmount?: unknown;
}) {
  const frequency = input.frequency;
  if (
    frequency !== "one-time" &&
    frequency !== "weekly" &&
    frequency !== "monthly"
  )
    throw new Error("Choose one-time, weekly, or monthly support.");
  const money = (value: unknown) => {
    const raw = String(value ?? "0");
    if (!/^\d+(\.\d{1,2})?$/.test(raw))
      throw new Error("Enter an amount with no more than two decimal places.");
    const cents = Math.round(Number(raw) * 100);
    if (!Number.isSafeInteger(cents) || cents > 99_999_999)
      throw new Error("Amount is too large.");
    return cents;
  };
  const units = frequency === "one-time" ? 0 : Number(input.units);
  if (
    frequency !== "one-time" &&
    (!Number.isInteger(units) || units < 1 || units > 20)
  )
    throw new Error("Choose between 1 and 20 units.");
  const baseCents =
    frequency === "one-time"
      ? money(input.amount)
      : units * (frequency === "weekly" ? 10_000 : 40_000);
  if (frequency === "one-time" && baseCents < 50_000)
    throw new Error("One-time support starts at $500.");
  const additionalCents = money(input.additionalAmount);
  if (baseCents + additionalCents > 99_999_999)
    throw new Error("Total amount is too large.");
  return {
    frequency,
    units,
    baseCents,
    additionalCents,
    totalCents: baseCents + additionalCents,
  };
}
