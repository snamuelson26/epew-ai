"use client";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

import { VALUE_CARDS } from "./constants";
import LocalizedAboutImage from "./LocalizedAboutImage";

export default function Values() {
  const { t } = useLanguage();

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <LocalizedAboutImage
          fileName="our-value.png"
          fallbackPath="/images/our-value.png"
          alt={t("about.values.imageAlt")}
          className="mx-auto mb-16 h-auto w-full rounded-3xl shadow-2xl"
        />

        <div className="mb-20 text-center">
          <h2 className="mb-10 text-5xl font-bold text-[#06245c] md:text-6xl">
            {t("about.values.title")}
          </h2>

          <p className="mx-auto max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
            {t("about.values.text")}
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {VALUE_CARDS.map((value) => (
            <article
              key={value.titleKey}
              className="rounded-3xl bg-[#f5f7fb] p-10 text-center shadow-xl"
            >
              <div
                aria-hidden="true"
                className="mb-8 text-7xl"
              >
                {value.icon}
              </div>

              <h3 className="mb-6 text-3xl font-bold text-[#06245c]">
                {t(value.titleKey)}
              </h3>

              <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
                {t(value.textKey)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}