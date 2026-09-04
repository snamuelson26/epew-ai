"use client";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import {
  LanguageSelector,
  useLocale,
} from "@/app/components/enterprise/language";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupporterEntrepreneurAgreementCopy } from "@/app/supporters/agreements/AgreementTranslations";

function safeReturnPath(value: string | null) {
  if (value && value.startsWith("/support/") && !value.startsWith("//")) {
    return value;
  }

  return "/supporters/marketplace";
}

export default function SupporterEntrepreneurParticipationAgreementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const copy = getSupporterEntrepreneurAgreementCopy(locale);
  const returnTo = safeReturnPath(searchParams.get("returnTo"));

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] px-6 py-12 text-[#06245c]">
        <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="bg-[#06245c] px-6 py-10 text-center text-white md:px-10">
            <div className="mb-6 flex justify-center">
              <LanguageSelector
                compact
                showLabel
                showNativeName
                showEnglishName
                className="rounded-xl bg-white p-2 text-[#06245c]"
              />
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push(returnTo)}
                className="rounded-2xl bg-[#06245c] px-8 py-4 text-lg font-black text-white shadow-lg transition hover:bg-green-700"
              >
                ← {copy.returnButton}
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
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
