"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useEpewLanguage } from "@/app/components/EpewLanguage";
import {
  independentTerms,
  type IndependentFrequency,
} from "@/lib/enterprise/supporters/independentSupportRules";
const copy = {
  en: {
    title: "Independent Support",
    intro:
      "Choose how you contribute. EPEW selects an eligible entrepreneur to receive your support.",
    once: "One time — $500 minimum",
    weekly: "Weekly — $100 per unit",
    monthly: "Monthly — $400 per unit",
    units: "Number of units",
    amount: "One-time amount (USD)",
    extra: "Optional additional funds (USD)",
    extraNote:
      "Additional funds are charged once with this payment. They are not added to future weekly or monthly payments.",
    due: "Due today",
    recurring: "Regular recurring contribution",
    accept:
      "I authorize this payment and EPEW’s selection of the entrepreneur. For weekly or monthly support, I authorize recurring payments until I cancel.",
    pay: "Continue to secure payment",
    history: "My contribution history",
    pending: "EPEW selection pending",
    empty:
      "No confirmed payments yet. After checkout, confirmation may take a moment.",
    refresh: "Refresh payment status",
    stop: "Stop future payments",
    stopped: "Future payments stopped",
    plans: "My recurring plans",
    confirm:
      "Stop all future payments for this plan? Payments already made remain recorded.",
    back: "Back to dashboard",
    annual: "View the existing annual support option",
    details:
      "All amounts are in U.S. dollars. EPEW records the amount actually paid; extra funds do not create additional annual support units.",
    error: "Unable to complete this request. Please try again.",
    total: "Paid",
    extraPaid: "Additional funds included",
  },
  ht: {
    title: "Sipò Endepandan",
    intro:
      "Chwazi fason ou kontribye. EPEW chwazi yon antreprenè ki kalifye pou resevwa sipò ou.",
    once: "Yon sèl fwa — omwen $500",
    weekly: "Chak semèn — $100 pa inite",
    monthly: "Chak mwa — $400 pa inite",
    units: "Kantite inite",
    amount: "Montan yon sèl fwa (USD)",
    extra: "Lajan anplis, si ou vle (USD)",
    extraNote:
      "N ap chaje lajan anplis la yon sèl fwa ak peman sa a. Li pa antre nan peman chak semèn oswa chak mwa ki vin apre yo.",
    due: "Pou peye jodi a",
    recurring: "Kontribisyon regilye",
    accept:
      "Mwen otorize peman sa a ak chwa antreprenè EPEW fè a. Pou sipò chak semèn oswa chak mwa, mwen otorize peman regilye jiskaske mwen anile.",
    pay: "Kontinye nan peman sekirize",
    history: "Istwa kontribisyon mwen",
    pending: "N ap tann chwa EPEW",
    empty: "Pa gen peman konfime ankò. Konfimasyon an ka pran yon ti moman.",
    refresh: "Mete estati peman ajou",
    stop: "Sispann pwochen peman yo",
    stopped: "Pwochen peman yo sispann",
    plans: "Plan kontribisyon regilye mwen",
    confirm:
      "Sispann tout pwochen peman pou plan sa a? Peman ki deja fèt yo ap rete nan dosye a.",
    back: "Retounen nan tablo bò",
    annual: "Gade opsyon sipò anyèl la",
    details:
      "Tout montan yo an dola ameriken. EPEW anrejistre montan ki peye a; lajan anplis pa kreye lòt inite sipò anyèl.",
    error: "Nou pa kapab fini demann sa a. Eseye ankò.",
    total: "Peye",
    extraPaid: "Lajan anplis ki ladan",
  },
  fr: {
    title: "Soutien indépendant",
    intro:
      "Choisissez votre contribution. EPEW sélectionne un entrepreneur admissible pour recevoir votre soutien.",
    once: "Une fois — minimum 500 $",
    weekly: "Chaque semaine — 100 $ par unité",
    monthly: "Chaque mois — 400 $ par unité",
    units: "Nombre d’unités",
    amount: "Montant unique (USD)",
    extra: "Fonds supplémentaires facultatifs (USD)",
    extraNote:
      "Les fonds supplémentaires sont prélevés une seule fois avec ce paiement, sans être ajoutés aux paiements suivants.",
    due: "À payer aujourd’hui",
    recurring: "Contribution récurrente régulière",
    accept:
      "J’autorise ce paiement et le choix de l’entrepreneur par EPEW. Pour le soutien hebdomadaire ou mensuel, j’autorise les paiements récurrents jusqu’à leur annulation.",
    pay: "Continuer vers le paiement sécurisé",
    history: "Historique de mes contributions",
    pending: "Sélection EPEW en attente",
    empty:
      "Aucun paiement confirmé. La confirmation peut prendre un moment après le paiement.",
    refresh: "Actualiser les paiements",
    stop: "Arrêter les prochains paiements",
    stopped: "Prochains paiements arrêtés",
    plans: "Mes contributions récurrentes",
    confirm:
      "Arrêter les prochains paiements de ce plan ? Les paiements effectués restent enregistrés.",
    back: "Retour au tableau de bord",
    annual: "Voir l’option de soutien annuel existante",
    details:
      "Montants en dollars américains. EPEW enregistre le montant payé ; les fonds supplémentaires ne créent pas d’unités annuelles supplémentaires.",
    error: "Impossible de terminer cette demande. Veuillez réessayer.",
    total: "Payé",
    extraPaid: "Supplément inclus",
  },
  es: {
    title: "Apoyo independiente",
    intro:
      "Elija cómo contribuir. EPEW selecciona un emprendedor elegible para recibir su apoyo.",
    once: "Una vez — mínimo $500",
    weekly: "Semanal — $100 por unidad",
    monthly: "Mensual — $400 por unidad",
    units: "Número de unidades",
    amount: "Importe único (USD)",
    extra: "Fondos adicionales opcionales (USD)",
    extraNote:
      "Los fondos adicionales se cobran una sola vez con este pago. No se añaden a los pagos futuros.",
    due: "A pagar hoy",
    recurring: "Contribución recurrente regular",
    accept:
      "Autorizo este pago y la selección del emprendedor por EPEW. Para el apoyo semanal o mensual, autorizo pagos recurrentes hasta que los cancele.",
    pay: "Continuar al pago seguro",
    history: "Historial de contribuciones",
    pending: "Selección EPEW pendiente",
    empty:
      "Todavía no hay pagos confirmados. La confirmación puede tardar un momento.",
    refresh: "Actualizar pagos",
    stop: "Detener pagos futuros",
    stopped: "Pagos futuros detenidos",
    plans: "Mis planes recurrentes",
    confirm:
      "¿Detener los pagos futuros de este plan? Los pagos realizados permanecen registrados.",
    back: "Volver al panel",
    annual: "Ver la opción de apoyo anual existente",
    details:
      "Importes en dólares estadounidenses. EPEW registra el importe pagado; los fondos adicionales no crean unidades anuales adicionales.",
    error: "No se pudo completar la solicitud. Inténtelo de nuevo.",
    total: "Pagado",
    extraPaid: "Fondos adicionales incluidos",
  },
};
type Plan = {
  id: string;
  frequency: IndependentFrequency;
  units: number;
  base_cents: number;
  status: string;
};
type Payment = {
  id: string;
  amount_cents: number;
  additional_cents: number;
  business_name: string | null;
  paid_at: string;
};
export default function IndependentSupport() {
  const { language } = useEpewLanguage();
  const t = copy[language] ?? copy.en;
  const [frequency, setFrequency] = useState<IndependentFrequency>("one-time");
  const [units, setUnits] = useState("1");
  const [amount, setAmount] = useState("500");
  const [extra, setExtra] = useState("0");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const money = (cents: number) =>
    new Intl.NumberFormat(language === "ht" ? "fr-HT" : language, {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/supporters/independent-support", {
        cache: "no-store",
      });
      const data = await r.json();
      if (!r.ok) throw new Error();
      setPlans(data.plans ?? []);
      setPayments(data.payments ?? []);
    } catch {
      setError(t.error);
    }
  }, [t.error]);
  useEffect(() => {
    let active = true;
    fetch("/api/supporters/independent-support", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (active) {
          setPlans(data.plans ?? []);
          setPayments(data.payments ?? []);
        }
      })
      .catch(() => {
        if (active) setError(t.error);
      });
    return () => {
      active = false;
    };
  }, [t.error]);
  let terms;
  try {
    terms = independentTerms({
      frequency,
      units,
      amount,
      additionalAmount: extra || "0",
    });
  } catch {
    /* Invalid fields disable checkout. */
  }
  async function submit(planId?: string) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/supporters/independent-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          planId
            ? { action: "cancel", planId }
            : {
                frequency,
                units,
                amount,
                additionalAmount: extra || "0",
                accepted,
              },
        ),
      });
      const data = await r.json();
      if (!r.ok) throw new Error();
      if (data.url) window.location.assign(data.url);
      else await load();
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }
  const input = "mt-2 w-full rounded-xl border border-slate-300 p-3 text-lg";
  return (
    <main className="mx-auto max-w-5xl p-5 md:p-10 text-[#06245c]">
      <Link href="/supporters/dashboard" className="underline">
        {t.back}
      </Link>
      <h1 className="mt-6 text-4xl md:text-5xl font-extrabold">{t.title}</h1>
      <p className="mt-4 text-xl">{t.intro}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-8 space-y-6 rounded-3xl bg-white p-6 shadow-md"
      >
        <fieldset className="grid gap-3 md:grid-cols-3">
          <legend className="sr-only">{t.title}</legend>
          {(
            [
              ["one-time", t.once],
              ["weekly", t.weekly],
              ["monthly", t.monthly],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border-2 p-4 font-bold ${frequency === value ? "border-green-700 bg-green-50" : "border-slate-200"}`}
            >
              <input
                type="radio"
                name="frequency"
                value={value}
                checked={frequency === value}
                onChange={() => {
                  setFrequency(value);
                  setAccepted(false);
                }}
                className="mr-2"
              />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="grid gap-5 md:grid-cols-2">
          {frequency === "one-time" ? (
            <label className="font-bold">
              {t.amount}
              <input
                className={input}
                type="number"
                min="500"
                max="999999.99"
                step="0.01"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAccepted(false);
                }}
              />
            </label>
          ) : (
            <label className="font-bold">
              {t.units}
              <input
                className={input}
                type="number"
                min="1"
                max="20"
                step="1"
                required
                value={units}
                onChange={(e) => {
                  setUnits(e.target.value);
                  setAccepted(false);
                }}
              />
            </label>
          )}
          <label className="font-bold">
            {t.extra}
            <input
              className={input}
              type="number"
              min="0"
              step="0.01"
              value={extra}
              onChange={(e) => {
                setExtra(e.target.value);
                setAccepted(false);
              }}
            />
          </label>
        </div>
        <p>{t.extraNote}</p>
        <div className="rounded-xl bg-slate-100 p-5">
          <p className="text-2xl font-extrabold">
            {t.due}: {terms ? money(terms.totalCents) : "—"}
          </p>
          {frequency !== "one-time" && (
            <p className="mt-2">
              {t.recurring}: {terms ? money(terms.baseCents) : "—"} /{" "}
              {frequency === "weekly"
                ? t.weekly.split("—")[0]
                : t.monthly.split("—")[0]}
            </p>
          )}
        </div>
        <label className="flex gap-3">
          <input
            type="checkbox"
            required
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0"
          />
          <span>{t.accept}</span>
        </label>
        <p className="text-sm text-slate-600">{t.details}</p>
        {error && (
          <p role="alert" className="font-bold text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={busy || !terms || !accepted}
          className="rounded-xl bg-green-700 px-6 py-4 font-bold text-white disabled:opacity-50"
        >
          {busy ? "…" : t.pay}
        </button>
      </form>
      <section className="mt-10">
        <h2 className="text-3xl font-bold">{t.history}</h2>
        <button onClick={() => void load()} className="my-4 underline">
          {t.refresh}
        </button>
        {payments.length === 0 ? (
          <p>{t.empty}</p>
        ) : (
          payments.map((p) => (
            <article key={p.id} className="mb-3 rounded-xl bg-white p-5">
              <p className="font-bold">
                {t.total}: {money(p.amount_cents)}
              </p>
              <p>{p.business_name ?? t.pending}</p>
              <p>
                {t.extraPaid}: {money(p.additional_cents)}
              </p>
              <time>{new Date(p.paid_at).toLocaleDateString()}</time>
            </article>
          ))
        )}
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-bold">{t.plans}</h2>
        {plans
          .filter((p) => p.frequency !== "one-time" && p.status !== "pending")
          .map((p) => (
            <article key={p.id} className="mt-3 rounded-xl bg-white p-5">
              <p>
                {p.frequency === "weekly" ? t.weekly : t.monthly} · {p.units} ·{" "}
                {money(p.base_cents)}
              </p>
              {p.status === "cancelled" ? (
                <p>{t.stopped}</p>
              ) : (
                <button
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t.confirm)) void submit(p.id);
                  }}
                  className="mt-3 font-bold text-red-700 underline"
                >
                  {t.stop}
                </button>
              )}
            </article>
          ))}
      </section>
      <Link
        href="/supporters/annual-support"
        className="mt-8 inline-block underline"
      >
        {t.annual}
      </Link>
    </main>
  );
}
