"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LanguageSelector, useLocale } from '@/app/components/enterprise/language';
import { directedTerms, type DirectedFrequency } from '@/lib/enterprise/supporters/directedSupportRules';

const copy = {
 en: { title: 'Support Food Fans Restaurant', intro: 'FFR-002 supports the same Cambria Heights store as FFR-001. Choose your payment schedule.', weekly: 'Weekly — $100 per unit', monthly: 'Monthly — $433.34 per unit', annual: 'Annual — $5,200 per unit', once: 'Lump sum — $500 or more', units: 'Number of units', amount: 'Lump-sum amount (USD)', due: 'Due today', recurring: 'Weekly and monthly payments renew automatically until cancelled. Manage or stop future payments in My recurring plans.', onceNote: 'Your lump sum is charged once. It does not renew automatically.', accept: 'I confirm support for Food Fans Restaurant (FFR-002), the amount shown, and the payment schedule above.', pay: 'Continue to secure payment', opening: 'Opening checkout…', history: 'My payments and recurring plans', submitted: 'Payment submitted. Checking confirmation…', confirmed: 'Payment confirmed and recorded.', pending: 'Payment is not yet confirmed. Check your payment history before paying again.', cancelled: 'Checkout cancelled. No payment is confirmed by this page.', error: 'Unable to open checkout. Please sign in and try again.', cash: 'This page records your cash contributions to FFR-002. It does not issue a paid-in-full annual-unit certificate for a partial contribution.', another: 'Add another contribution', full: 'Prefer paid-in-full support? Open FFR-001.' },
 ht: { title: 'Sipòte Food Fans Restaurant', intro: 'FFR-002 sipòte menm restoran Cambria Heights la ak FFR-001. Chwazi orè peman ou.', weekly: 'Chak semèn — $100 pa inite', monthly: 'Chak mwa — $433.34 pa inite', annual: 'Chak ane — $5,200 pa inite', once: 'Yon sèl peman — $500 oswa plis', units: 'Kantite inite', amount: 'Montan yon sèl peman (USD)', due: 'Pou peye jodi a', recurring: 'Peman chak semèn ak chak mwa renouvle otomatikman jiskaske ou anile yo. Jere oswa sispann pwochen peman yo nan plan regilye ou yo.', onceNote: 'Yon sèl peman sa a pa renouvle otomatikman.', accept: 'Mwen konfime sipò pou Food Fans Restaurant (FFR-002), montan ki parèt la ak orè peman ki anwo a.', pay: 'Kontinye nan peman sekirize', opening: 'Ap ouvri peman…', history: 'Peman mwen ak plan regilye mwen', submitted: 'Peman soumèt. N ap verifye konfimasyon an…', confirmed: 'Peman konfime epi anrejistre.', pending: 'Peman poko konfime. Tcheke istwa peman ou anvan ou peye ankò.', cancelled: 'Paj peman an anile. Paj sa a pa konfime okenn peman.', error: 'Nou pa kapab ouvri peman an. Konekte epi eseye ankò.', cash: 'Paj sa a anrejistre kontribisyon lajan ou pou FFR-002. Li pa bay yon sètifika inite anyèl peye anplen pou yon kontribisyon pasyèl.', another: 'Ajoute yon lòt kontribisyon', full: 'Ou prefere sipò peye anplen? Ouvri FFR-001.' },
 fr: { title: 'Soutenez Food Fans Restaurant', intro: 'FFR-002 soutient le même restaurant de Cambria Heights que FFR-001. Choisissez votre échéancier.', weekly: 'Chaque semaine — 100 $ par unité', monthly: 'Chaque mois — 433,34 $ par unité', annual: 'Chaque année — 5 200 $ par unité', once: 'Versement unique — 500 $ ou plus', units: 'Nombre d’unités', amount: 'Montant du versement unique (USD)', due: 'À payer aujourd’hui', recurring: 'Les paiements hebdomadaires et mensuels sont renouvelés automatiquement jusqu’à annulation. Gérez ou arrêtez les paiements futurs dans vos plans récurrents.', onceNote: 'Ce versement est unique, sans renouvellement automatique.', accept: 'Je confirme mon soutien à Food Fans Restaurant (FFR-002), le montant affiché et l’échéancier ci-dessus.', pay: 'Continuer vers le paiement sécurisé', opening: 'Ouverture du paiement…', history: 'Mes paiements et plans récurrents', submitted: 'Paiement soumis. Vérification en cours…', confirmed: 'Paiement confirmé et enregistré.', pending: 'Le paiement n’est pas encore confirmé. Consultez votre historique avant de payer à nouveau.', cancelled: 'Paiement annulé. Cette page ne confirme aucun paiement.', error: 'Impossible d’ouvrir le paiement. Connectez-vous et réessayez.', cash: 'Cette page enregistre vos contributions à FFR-002. Une contribution partielle ne donne pas lieu à un certificat d’unité annuelle payée intégralement.', another: 'Ajouter une contribution', full: 'Vous préférez payer intégralement ? Ouvrez FFR-001.' },
 es: { title: 'Apoye a Food Fans Restaurant', intro: 'FFR-002 apoya al mismo restaurante de Cambria Heights que FFR-001. Elija su calendario de pagos.', weekly: 'Semanal — $100 por unidad', monthly: 'Mensual — $433.34 por unidad', annual: 'Anual — $5,200 por unidad', once: 'Pago único — $500 o más', units: 'Número de unidades', amount: 'Importe del pago único (USD)', due: 'Total hoy', recurring: 'Los pagos semanales y mensuales se renuevan automáticamente hasta su cancelación. Gestione o detenga los pagos futuros en sus planes recurrentes.', onceNote: 'Este pago se cobra una sola vez, sin renovación automática.', accept: 'Confirmo mi apoyo a Food Fans Restaurant (FFR-002), el importe mostrado y el calendario indicado arriba.', pay: 'Continuar al pago seguro', opening: 'Abriendo pago…', history: 'Mis pagos y planes recurrentes', submitted: 'Pago enviado. Verificando confirmación…', confirmed: 'Pago confirmado y registrado.', pending: 'El pago aún no está confirmado. Consulte su historial antes de pagar de nuevo.', cancelled: 'Pago cancelado. Esta página no confirma ningún pago.', error: 'No se pudo abrir el pago. Inicie sesión e inténtelo de nuevo.', cash: 'Esta página registra sus contribuciones a FFR-002. Una contribución parcial no genera un certificado de unidad anual pagada en su totalidad.', another: 'Añadir otra contribución', full: '¿Prefiere pagar en su totalidad? Abra FFR-001.' },
};
export default function FlexibleSupport() {
 const { locale } = useLocale(); const t = copy[locale]; const search = useSearchParams();
 const [frequency, setFrequency] = useState<DirectedFrequency>(search.get('frequency') === 'one-time' ? 'one-time' : 'weekly');
 const [units, setUnits] = useState(1); const [amount, setAmount] = useState('500');
 const [accepted, setAccepted] = useState(false); const [busy, setBusy] = useState(false);
 const [error, setError] = useState(''); const [payment, setPayment] = useState('');
 let cents = 0; let valid = false;
 try { cents = directedTerms({ frequency, units, amount }).baseCents; valid = true; } catch { /* Inline validation on submit. */ }
 const session = search.get('session_id');
 useEffect(() => {
   if (!session) return;
   let active = true;
   fetch(`/api/supporters/directed-support?session_id=${encodeURIComponent(session)}`, { cache: 'no-store' })
    .then(r => r.json()).then(p => { if (active) setPayment(p.recorded ? 'confirmed' : 'pending'); })
    .catch(() => { if (active) setPayment('pending'); });
   return () => { active = false; };
 }, [session]);
 async function submit(event: React.FormEvent) {
   event.preventDefault(); setError('');
   try {
     directedTerms({ frequency, units, amount }); setBusy(true);
     if (frequency === 'annual') { window.location.assign(`/support/FFR-002/checkout?annual=full&units=${units}`); return; }
     const r = await fetch('/api/supporters/directed-support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId: 'FFR-002', frequency, units, amount, accepted }) });
     if (r.status === 401) { window.location.assign('/supporters/login?business_id=FFR-002&next=%2Fsupport%2FFFR-002%2Fcheckout'); return; }
     const p = await r.json(); if (!r.ok || !p.url) throw new Error(p.error || t.error);
     window.location.assign(p.url);
   } catch (e) { setError(e instanceof Error ? e.message : t.error); setBusy(false); }
 }
 return <main className="min-h-screen bg-[#f3f6fa] px-4 py-10 text-[#06245c]">
  <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl md:p-10">
   <div className="mb-6 flex justify-end"><LanguageSelector compact showEnglishName={false} /></div>
   <p className="font-bold text-green-700">FFR-002 · Cambria Heights, NY</p>
   <h1 className="mt-3 text-3xl font-black">{t.title}</h1><p className="mt-4">{t.intro}</p>
   {search.get('payment') === 'submitted' && <p role="status" className="mt-4 rounded-xl bg-blue-50 p-4">{payment === 'confirmed' ? t.confirmed : payment === 'pending' ? t.pending : t.submitted}</p>}
   {session && payment === 'confirmed' && <a href="/support/FFR-002/checkout?frequency=one-time" className="mt-4 inline-block rounded-xl bg-green-700 px-5 py-3 font-bold text-white">{t.another}</a>}
   {search.get('payment') === 'cancelled' && <p role="status" className="mt-4">{t.cancelled}</p>}
   <form onSubmit={submit} className="mt-6 space-y-5">
    <fieldset className="space-y-3"><legend className="sr-only">{t.intro}</legend>
     {(['weekly','monthly','annual','one-time'] as const).map(f => <label key={f} className="flex cursor-pointer gap-3 rounded-xl border p-4 font-bold"><input type="radio" name="frequency" value={f} checked={frequency === f} onChange={() => { setFrequency(f); setAccepted(false); setError(''); }} />{f === 'one-time' ? t.once : t[f]}</label>)}
    </fieldset>
    {frequency === 'one-time' ? <label className="block font-bold">{t.amount}<input type="number" min="500" max="999999.99" step="0.01" required value={amount} onChange={e => { setAmount(e.target.value); setAccepted(false); }} className="mt-2 w-full rounded-xl border p-3" /></label> : <label className="block font-bold">{t.units}<input type="number" min="1" max="20" step="1" required value={units} onChange={e => { setUnits(Number(e.target.value)); setAccepted(false); }} className="mt-2 w-full rounded-xl border p-3" /></label>}
    <div className="rounded-xl bg-[#06245c] p-5 text-white"><p>{t.due}</p><p className="text-3xl font-black">{(cents / 100).toLocaleString(locale, { style: 'currency', currency: 'USD' })}</p></div>
    <p>{frequency === 'one-time' || frequency === 'annual' ? t.onceNote : t.recurring}</p>
    <label className="flex gap-3"><input type="checkbox" required checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" /><span>{t.accept}</span></label>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    <button disabled={!accepted || busy || !valid || !!session} className="w-full rounded-xl bg-green-700 p-4 text-lg font-bold text-white disabled:bg-gray-400">{busy ? t.opening : t.pay}</button>
   </form>
   <p className="mt-6 text-sm text-slate-600">{t.cash}</p>
   <Link href="/supporters/independent-support" className="mt-5 block font-bold underline">{t.history}</Link>
   <Link href="/support/FFR-001" className="mt-4 block underline">{t.full}</Link>
  </section>
 </main>;
}
