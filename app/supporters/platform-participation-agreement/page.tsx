"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const copy = getSupporterEpewAgreementCopy(locale);
  const returnParam = searchParams.get("returnTo");
  const hasSupportReturn = Boolean(
    returnParam && returnParam.startsWith("/support/") && !returnParam.startsWith("//")
  );
  const returnTo = safeReturnPath(returnParam);

  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
          headers: {
            "Content-Type": "application/json",
          },
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
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-16 text-[#06245c]">
      <div className="mx-auto max-w-6xl">
        <section className="mb-10 rounded-3xl bg-[#06245c] p-10 text-white shadow-2xl">
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

          <p className="mb-3 text-lg font-bold uppercase tracking-[0.18em] text-green-300">
            {copy.eyebrow}
          </p>

          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            {copy.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl leading-relaxed text-slate-200">
            {copy.subtitle}
          </p>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-2xl md:p-12">
          <div className="max-h-[1100px] space-y-8 overflow-y-auto rounded-3xl border border-slate-200 bg-[#f8fafc] p-8 text-xl leading-relaxed text-slate-700 md:p-10">
            {copy.sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-4 first:mt-0">
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <ul className="list-disc space-y-2 pl-8">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <label className="mt-10 flex items-start gap-4 rounded-2xl border-2 border-slate-200 p-6 text-xl leading-relaxed text-slate-700">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => {
                setAccepted(event.target.checked);
                setErrorMessage("");
              }}
              className="mt-1 h-6 w-6"
            />

            <span>{copy.checkboxText}</span>
          </label>

          {errorMessage && (
            <p className="mt-5 rounded-xl bg-red-50 p-4 text-lg font-bold text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center justify-center gap-4 md:flex-row">
            {hasSupportReturn && (
              <button
                type="button"
                onClick={() => router.push(returnTo)}
                disabled={submitting}
                className="rounded-2xl border-2 border-[#06245c] bg-white px-8 py-4 text-lg font-black text-[#06245c] transition hover:bg-slate-100 disabled:opacity-50"
              >
                ← {copy.returnButton}
              </button>
            )}

            <button
              type="button"
              onClick={continueAfterAcceptance}
              disabled={!accepted || submitting}
              className="rounded-2xl bg-[#06245c] px-10 py-5 text-xl font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
