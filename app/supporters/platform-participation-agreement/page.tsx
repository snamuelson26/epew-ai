"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupportedLocale } from "@/app/components/enterprise/language";
import { getSupporterEpewAgreementCopy } from "@/app/supporters/agreements/AgreementTranslations";

const LANGUAGE_OPTIONS: Array<{ code: SupportedLocale; label: string }> = [
  { code: "en", label: "🇺🇸 English" },
  { code: "ht", label: "🇭🇹 Kreyòl Ayisyen" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "es", label: "🇪🇸 Español" },
];

function safeReturnPath(value: string | null) {
  if (value && value.startsWith("/support/") && !value.startsWith("//")) {
    return value;
  }

  return "/supporters/dashboard";
}

export default function SupporterPlatformParticipationAgreementPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const copy = getSupporterEpewAgreementCopy(locale);

  const [returnTo, setReturnTo] = useState("/supporters/dashboard");
  const [hasSupportReturn, setHasSupportReturn] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const returnParam = new URLSearchParams(window.location.search).get("returnTo");
    const validSupportReturn = Boolean(
      returnParam && returnParam.startsWith("/support/") && !returnParam.startsWith("//")
    );

    setHasSupportReturn(validSupportReturn);
    setReturnTo(safeReturnPath(returnParam));
  }, []);

  async function continueAfterAcceptance() {
    setErrorMessage("");

    if (!accepted) {
      setErrorMessage(copy.acceptanceError || "Agreement acceptance is required.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/supporters/platform-participation-agreement/accept",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accepted: true }),
        }
      );

      const responseText = await response.text();
      let result: { error?: string } = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(copy.acceptanceServerError);
      }

      if (!response.ok) {
        throw new Error(result.error || copy.acceptanceServerError);
      }

      if (hasSupportReturn) {
        try {
          window.sessionStorage.setItem(
            `epew_supporter_platform_agreement:${returnTo}`,
            "accepted"
          );
        } catch {
          // The server acceptance remains authoritative if session storage is unavailable.
        }
      }

      router.push(returnTo);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : copy.acceptanceServerError || "Unable to record agreement acceptance."
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-3 py-4 text-[#06245c] sm:px-5 sm:py-6 md:px-6 md:py-12">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <section className="bg-[#06245c] px-5 py-6 text-white sm:px-7 sm:py-8 md:px-10 md:py-10">
          <div className="mb-4 flex justify-center md:mb-6">
            <select
              aria-label="Agreement language"
              value={locale}
              onChange={(event) => {
                setLocale(event.target.value as SupportedLocale);
                setErrorMessage("");
              }}
              className="w-full max-w-xs rounded-xl border border-white/40 bg-white px-4 py-3 text-base font-bold text-[#06245c]"
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>

          <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-green-300 sm:text-base md:mb-3 md:text-lg md:tracking-[0.18em]">
            {copy.eyebrow}
          </p>

          <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-6xl">
            {copy.title}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-slate-200 sm:text-lg md:mt-6 md:max-w-4xl md:text-xl">
            {copy.subtitle}
          </p>
        </section>

        <section className="px-4 py-5 sm:px-6 sm:py-7 md:p-12">
          <div className="space-y-7 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 text-base leading-relaxed text-slate-700 sm:p-6 sm:text-lg md:rounded-3xl md:p-10 md:text-xl">
            {copy.sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-2xl font-black text-[#06245c] sm:text-3xl md:mb-4">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 first:mt-0 md:mt-4">
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <ul className="list-disc space-y-2 pl-6 sm:pl-8">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <label className="mt-7 flex items-start gap-3 rounded-2xl border-2 border-slate-200 p-4 text-base leading-relaxed text-slate-700 sm:p-5 sm:text-lg md:mt-10 md:gap-4 md:p-6 md:text-xl">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => {
                setAccepted(event.target.checked);
                setErrorMessage("");
              }}
              className="mt-1 h-6 w-6 shrink-0"
            />

            <span>{copy.checkboxText}</span>
          </label>

          {errorMessage && (
            <p className="mt-5 rounded-xl bg-red-50 p-4 text-base font-bold text-red-700 sm:text-lg">
              {errorMessage}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 md:mt-8 md:flex-row md:items-center md:justify-center md:gap-4">
            {hasSupportReturn && (
              <button
                type="button"
                onClick={() => router.push(returnTo)}
                disabled={submitting}
                className="w-full rounded-2xl border-2 border-[#06245c] bg-white px-5 py-4 text-base font-black text-[#06245c] transition hover:bg-slate-100 disabled:opacity-50 md:w-auto md:px-8 md:text-lg"
              >
                ← {copy.returnButton}
              </button>
            )}

            <button
              type="button"
              onClick={continueAfterAcceptance}
              disabled={!accepted || submitting}
              className="w-full rounded-2xl bg-[#06245c] px-6 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:px-10 md:py-5 md:text-xl"
            >
              {submitting
                ? "..."
                : hasSupportReturn
                  ? copy.acceptReturnButton
                  : copy.acceptContinueButton}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
