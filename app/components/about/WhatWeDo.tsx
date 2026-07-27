"use client";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

import { WHAT_WE_DO_CARDS } from "./constants";
import LocalizedAboutImage from "./LocalizedAboutImage";

export default function WhatWeDo() {
  const { t } = useLanguage();

  return (
    <section className="bg-[#f5f7fb] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <LocalizedAboutImage
          fileName="what-we-do.png"
          fallbackPath="/images/what-we-do.png"
          alt={t("about.whatWeDo.imageAlt")}
          className="mx-auto mb-16 h-auto w-full rounded-3xl shadow-2xl"
        />

        <div className="mb-16 text-center">
          <h2 className="mb-10 text-5xl font-bold text-[#06245c] md:text-6xl">
            {t("about.whatWeDo.title")}
          </h2>

          <p className="mx-auto max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
            {t("about.whatWeDo.text")}
          </p>
        </div>

        <div className="mb-16 rounded-3xl bg-[#06245c] px-6 py-10 text-center shadow-xl md:px-10">
          <p className="text-2xl font-bold text-white md:text-4xl">
            {t("about.whatWeDo.journey.idea")}
            <span className="mx-3 text-green-400">→</span>
            {t("about.whatWeDo.journey.structure")}
            <span className="mx-3 text-green-400">→</span>
            {t("about.whatWeDo.journey.launch")}
            <span className="mx-3 text-green-400">→</span>
            {t("about.whatWeDo.journey.growth")}
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {WHAT_WE_DO_CARDS.map((card) => (
            <article
              key={card.titleKey}
              className="rounded-3xl bg-white p-10 text-center shadow-xl"
            >
              <div
                aria-hidden="true"
                className="mb-7 text-6xl"
              >
                {card.icon}
              </div>

              <h3 className="mb-6 text-3xl font-bold text-[#06245c]">
                {t(card.titleKey)}
              </h3>

              <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
                {t(card.textKey)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}