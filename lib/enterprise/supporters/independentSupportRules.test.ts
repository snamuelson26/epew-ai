import test from "node:test";
import assert from "node:assert/strict";
import { independentTerms } from "./independentSupportRules";
test("one-time contributions start at $500 and allow additional cents", () => {
  assert.throws(() =>
    independentTerms({ frequency: "one-time", amount: "499.99" }),
  );
  assert.deepEqual(
    independentTerms({
      frequency: "one-time",
      amount: "500",
      additionalAmount: "25.50",
    }),
    {
      frequency: "one-time",
      units: 0,
      baseCents: 50000,
      additionalCents: 2550,
      totalCents: 52550,
    },
  );
});
test("approved independent recurring prices remain separate from the one-time extra", () => {
  assert.equal(
    independentTerms({ frequency: "weekly", units: 2, additionalAmount: "50" })
      .baseCents,
    20000,
  );
  assert.deepEqual(
    independentTerms({
      frequency: "monthly",
      units: 1,
      additionalAmount: "50",
    }),
    {
      frequency: "monthly",
      units: 1,
      baseCents: 40000,
      additionalCents: 5000,
      totalCents: 45000,
    },
  );
});
test("reject fractional units, negative extras, invalid precision, infinity and unsupported frequencies", () => {
  for (const input of [
    { frequency: "weekly", units: 1.5 },
    { frequency: "monthly", units: 0 },
    { frequency: "monthly", units: 1, additionalAmount: -1 },
    { frequency: "one-time", amount: Infinity },
    { frequency: "one-time", amount: "500.001" },
    { frequency: "annual", units: 1 },
    { frequency: "one-time", amount: "999999.99", additionalAmount: "1" },
  ])
    assert.throws(() => independentTerms(input));
});
