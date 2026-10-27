import { getStripePlan } from '../financial/stripeConfig';

export type DirectedFrequency = 'weekly' | 'monthly' | 'annual' | 'one-time';
export function directedTerms(input: { frequency?: unknown; units?: unknown; amount?: unknown }) {
  const frequency = input.frequency;
  if (frequency !== 'weekly' && frequency !== 'monthly' && frequency !== 'annual' && frequency !== 'one-time')
    throw new Error('Choose weekly, monthly, annual, or lump-sum support.');
  if (frequency === 'one-time') {
    const raw = String(input.amount ?? '');
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error('Enter a dollar amount with at most two decimal places.');
    const baseCents = Math.round(Number(raw) * 100);
    if (!Number.isSafeInteger(baseCents) || baseCents < 50_000 || baseCents > 99_999_999)
      throw new Error('Lump-sum support starts at $500 (maximum $999,999.99).');
    return { frequency, units: 0, baseCents, interval: null } as const;
  }
  const units = Number(input.units);
  if (!Number.isInteger(units) || units < 1 || units > 20) throw new Error('Choose between 1 and 20 units.');
  const plan = getStripePlan(frequency);
  return { frequency, units, baseCents: units * plan.amount, interval: frequency === 'annual' ? null : plan.interval } as const;
}
