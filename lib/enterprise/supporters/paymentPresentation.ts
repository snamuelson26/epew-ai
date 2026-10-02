export function checkoutState(session: {payment_status: string; status: string | null}) {
  if (session.payment_status === "paid") return "paid";
  if (session.status === "complete") return "processing";
  if (session.status === "expired") return "expired";
  return "unfinished";
}

export function benefitSchedule(amount: number, rate: number, date: string, months = 12, now = new Date()) {
  const start = new Date(date.endsWith("Z") || /[+-]\d\d:\d\d$/.test(date) ? date : `${date}Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(amount) || amount < 0 || ![6,8].includes(rate) || months !== 12) return null;
  const totalCents = Math.round(amount * rate); // dollars × percent = cents
  const rows = Array.from({length: months}, (_, i) => {
    const end = new Date(start);
    end.setUTCDate(1);
    end.setUTCMonth(start.getUTCMonth() + i + 1);
    const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
    end.setUTCDate(Math.min(start.getUTCDate(), lastDay));
    const cumulative = Math.round(totalCents * (i + 1) / months);
    const previous = Math.round(totalCents * i / months);
    return {month: i + 1, date: end.toISOString(), projectedAmount: (cumulative-previous)/100, projectedCumulative: cumulative/100, elapsed: end <= now};
  });
  return {rate, projectedTotal: totalCents/100, projectedCombined: amount + totalCents/100, estimatedMaturityDate: rows[months-1].date, rows};
}
