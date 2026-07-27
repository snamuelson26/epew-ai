"use client";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

import { APPROACH_STEPS } from "./constants";
import LocalizedAboutImage from "./LocalizedAboutImage";

export default function Approach() {
  const { t } = useLanguage();

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <LocalizedAboutImage
          fileName="our-approach.png"
          fallbackPath="/images/our-approach.png"
          alt={t("about.approach.imageAlt")}
          className="mx-auto mb-16 h-auto w-full rounded-3xl shadow-2xl"
        />

        <div className="mb-20 text-center">
          <h2 className="mb-10 text-5xl font-bold text-[#06245c] md:text-6xl">
            {t("about.approach.title")}
          </h2>

          <p className="mx-auto max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
            {t("about.approach.text")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {APPROACH_STEPS.map((step) => (
            <article
              key={step.number}
              className="rounded-3xl bg-[#f5f7fb] p-10 shadow-xl"
            >
              <div className="mb-6 text-5xl font-extrabold text-green-600">
                {step.number}
              </div>

              <h3 className="mb-6 text-3xl font-bold text-[#06245c]">
                {t(step.titleKey)}
              </h3>

              <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
                {t(step.textKey)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}