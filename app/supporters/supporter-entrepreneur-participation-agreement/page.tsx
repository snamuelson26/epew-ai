"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SupportedLocale } from "@/app/components/enterprise/language";
import { getSupporterEntrepreneurAgreementCopy } from "@/app/supporters/agreements/AgreementTranslations";

const LANGUAGE_OPTIONS: Array<{ code: SupportedLocale; label: string }> = [
  { code: "en", label: "🇺🇸 English" },
  { code: "ht", label: "🇭🇹 Kreyòl Ayisyen" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "es", label: "🇪🇸 Español" },
];

const ACCEPTANCE_COPY: Record<
  SupportedLocale,
  {
    checkbox: string;
    error: string;
    acceptReturn: string;
  }
> = {
  en: {
    checkbox:
      "I have read and agree to the Supporter–Entrepreneur Participation Agreement. I understand that the payment option, Support Units, participation benefit, and obligations applicable to my support transaction are governed by this Agreement and the option shown on the support transaction page.",
    error:
      "Please read and accept the Supporter–Entrepreneur Participation Agreement before continuing.",
    acceptReturn: "Accept and Return to Support Transaction",
  },
  ht: {
    checkbox:
      "Mwen li epi mwen dakò ak Akò Patisipasyon ant Sipòtè ak Antreprenè a. Mwen konprann opsyon peman, Inite Sipò, benefis patisipasyon ak obligasyon ki aplikab pou tranzaksyon sipò mwen an gouvène pa Akò sa a ak opsyon ki parèt sou paj tranzaksyon sipò a.",
    error:
      "Tanpri li epi aksepte Akò Patisipasyon ant Sipòtè ak Antreprenè a anvan ou kontinye.",
    acceptReturn: "Aksepte epi retounen nan tranzaksyon sipò a",
  },
  fr: {
    checkbox:
      "J’ai lu et j’accepte la Convention de participation Supporteur–Entrepreneur. Je comprends que l’option de paiement, les Unités de soutien, l’avantage de participation et les obligations applicables à ma transaction de soutien sont régis par cette Convention et par l’option affichée sur la page de transaction de soutien.",
    error:
      "Veuillez lire et accepter la Convention de participation Supporteur–Entrepreneur avant de continuer.",
    acceptReturn: "Accepter et retourner à la transaction de soutien",
  },
  es: {
    checkbox:
      "He leído y acepto el Acuerdo de Participación entre el Colaborador y el Emprendedor. Comprendo que la opción de pago, las Unidades de Apoyo, el beneficio de participación y las obligaciones aplicables a mi transacción se rigen por este Acuerdo y por la opción mostrada en la página de la transacción de apoyo.",
    error:
      "Lea y acepte el Acuerdo de Participación entre el Colaborador y el Emprendedor antes de continuar.",
    acceptReturn: "Aceptar y volver a la transacción de apoyo",
  },
};

function safeReturnPath(value: string | null) {
  if (value && value.startsWith("/support/") && !value.startsWith("//")) {
    return value;
  }

  return "/supporters/marketplace";
}

export default function SupporterEntrepreneurParticipationAgreementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const [accepted, setAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const copy = getSupporterEntrepreneurAgreementCopy(locale);
  const acceptanceCopy = ACCEPTANCE_COPY[locale];
  const returnTo = safeReturnPath(searchParams.get("returnTo"));

  function acceptAndReturn() {
    setErrorMessage("");

    if (!accepted) {
      setErrorMessage(acceptanceCopy.error);
      return;
    }

    try {
      window.sessionStorage.setItem(
        `epew_supporter_entrepreneur_agreement:${returnTo}`,
        "accepted"
      );
    } catch {
      // The transaction can still continue if browser session storage is unavailable.
    }

    router.push(returnTo);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-12 text-[#06245c]">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="bg-[#06245c] px-6 py-10 text-center text-white md:px-10">
          <div className="mb-6 flex justify-center">
            <select
              aria-label="Agreement language"
              value={locale}
              onChange={(event) => {
                setLocale(event.target.value as SupportedLocale);
                setErrorMessage("");
              }}
              className="rounded-xl border border-white/40 bg-white px-4 py-3 text-base font-bold text-[#06245c]"
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm font-black uppercase tracking-[0.3em] text-lime-300 md:text-base">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">
            {copy.title}
          </h1>
        </div>

        <div className="space-y-8 px-6 py-10 text-lg leading-relaxed text-gray-700 md:px-10">
          {copy.intro?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          {copy.sections.map((section) => (
            <AgreementSection key={section.title} title={section.title}>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-4 first:mt-0">
                  {paragraph}
                </p>
              ))}

              {section.bullets && (
                <ul className="mt-4 list-disc space-y-2 pl-7">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </AgreementSection>
          ))}

          <div className="rounded-3xl border-2 border-green-200 bg-green-50 p-6 text-green-900">
            <p className="font-black">{copy.versionTitle}</p>
            <p className="mt-2">{copy.versionBody}</p>
          </div>

          <label className="flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-slate-200 bg-white p-6 text-lg leading-relaxed text-slate-700">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => {
                setAccepted(event.target.checked);
                setErrorMessage("");
              }}
              className="mt-1 h-6 w-6 shrink-0"
            />
            <span>{acceptanceCopy.checkbox}</span>
          </label>

          {errorMessage && (
            <p className="rounded-xl bg-red-50 p-4 text-lg font-bold text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <button
              type="button"
              onClick={() => router.push(returnTo)}
              className="rounded-2xl border-2 border-[#06245c] bg-white px-8 py-4 text-lg font-black text-[#06245c] transition hover:bg-slate-100"
            >
              ← {copy.returnButton}
            </button>

            <button
              type="button"
              onClick={acceptAndReturn}
              disabled={!accepted}
              className="rounded-2xl bg-[#06245c] px-10 py-5 text-xl font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {acceptanceCopy.acceptReturn}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function AgreementSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-[#f9fbfd] p-6">
      <h2 className="text-2xl font-black text-[#06245c]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
