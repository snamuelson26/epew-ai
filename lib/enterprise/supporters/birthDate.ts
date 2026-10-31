export type BirthDateParts = { day: string; month: string; year: string };
export function splitBirthDate(value: string): BirthDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  return match ? { day: String(Number(match[3])), month: String(Number(match[2])), year: match[1] } : { day: '', month: '', year: '' };
}
export function birthDateFromParts(parts: BirthDateParts, today = new Date()): string {
  if (!/^\d{4}$/.test(parts.year) || !/^\d{1,2}$/.test(parts.month) || !/^\d{1,2}$/.test(parts.day)) return '';
  const year = Number(parts.year), month = Number(parts.month), day = Number(parts.day);
  if (year < 1 || month < 1 || month > 12 || day < 1) return '';
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > days[month - 1]) return '';
  const iso = `${parts.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return iso > current ? '' : iso;
}
