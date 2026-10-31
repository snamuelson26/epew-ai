'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useEpewLanguage } from '@/app/components/EpewLanguage';
import { birthDateFromParts, splitBirthDate, type BirthDateParts } from '@/lib/enterprise/supporters/birthDate';
const labels = {
  en: { title: 'Date of birth', day: 'Day', month: 'Month', year: 'Year', help: 'Enter your day, month, and four-digit year of birth.', error: 'Enter a complete, valid date of birth that is not in the future.' },
  ht: { title: 'Dat nesans', day: 'Jou', month: 'Mwa', year: 'Ane', help: 'Antre jou, mwa ak ane nesans ou ak kat chif.', error: 'Antre yon dat nesans konplè ki valab epi ki pa nan lavni.' },
  fr: { title: 'Date de naissance', day: 'Jour', month: 'Mois', year: 'Année', help: 'Indiquez le jour, le mois et l’année de naissance sur quatre chiffres.', error: 'Indiquez une date de naissance complète, valide et non future.' },
  es: { title: 'Fecha de nacimiento', day: 'Día', month: 'Mes', year: 'Año', help: 'Indique el día, el mes y el año de nacimiento con cuatro cifras.', error: 'Indique una fecha de nacimiento completa, válida y no futura.' },
};
export default function DateOfBirthFields({ value, onChange, onValidityChange, required = true }: { value: string; onChange: (value: string) => void; onValidityChange?: (valid: boolean) => void; required?: boolean }) {
  const { language } = useEpewLanguage(); const t = labels[language]; const id = useId();
  const [parts, setParts] = useState(() => splitBirthDate(value)); const lastValue = useRef(value);
  useEffect(() => { if (value !== lastValue.current) { lastValue.current = value; setParts(splitBirthDate(value)); } }, [value]);
  const empty = !parts.day && !parts.month && !parts.year;
  const iso = birthDateFromParts(parts); const valid = !!iso || (!required && empty);
  useEffect(() => { onValidityChange?.(valid); }, [valid, onValidityChange]);
  function update(field: keyof BirthDateParts, text: string) {
    const next = { ...parts, [field]: text }; setParts(next);
    const date = birthDateFromParts(next); lastValue.current = date; onChange(date);
  }
  const input = 'mt-1 w-full min-w-0 rounded-xl border bg-white p-3 text-lg';
  return <fieldset className="min-w-0 md:col-span-2" aria-describedby={`${id}-help`}>
    <legend className="font-semibold">{t.title}{required ? ' *' : ''}</legend>
    <div className="mt-2 grid grid-cols-[1fr_1.5fr_1fr] gap-3">
      <label>{t.day}<select className={input} autoComplete="bday-day" required={required} value={parts.day} onChange={e => update('day', e.target.value)}><option value="">—</option>{Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>
      <label>{t.month}<select className={input} autoComplete="bday-month" required={required} value={parts.month} onChange={e => update('month', e.target.value)}><option value="">—</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} — {language === 'ht' ? ['janvye','fevriye','mas','avril','me','jen','jiyè','out','septanm','oktòb','novanm','desanm'][i] : new Intl.DateTimeFormat(language, { month: 'long' }).format(new Date(2000, i, 1))}</option>)}</select></label>
      <label>{t.year}<input className={input} type="text" inputMode="numeric" autoComplete="bday-year" placeholder="YYYY" maxLength={4} pattern="[0-9]{4}" required={required} value={parts.year} aria-invalid={!empty && !valid} onChange={e => update('year', e.target.value.replace(/\D/g, '').slice(0, 4))}/></label>
    </div>
    <p id={`${id}-help`} className="mt-2 text-sm text-slate-600">{t.help}</p>
    {!empty && !valid && <p role="status" className="mt-2 text-sm text-red-700">{t.error}</p>}
  </fieldset>;
}
