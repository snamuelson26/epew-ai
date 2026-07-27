"use client";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

import { MODEL_CARDS } from "./constants";
import LocalizedAboutImage from "./LocalizedAboutImage";

export default function Model() {
  const { t } = useLanguage();

  return (
    <section className="bg-[#f5f7fb] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <LocalizedAboutImage
          fileName="our-model.png"
          fallbackPath="/images/our-model.png"
          alt={t("about.model.imageAlt")}
          className="mx-auto mb-16 h-auto w-full rounded-3xl shadow-2xl"
        />

        <div className="mb-20 text-center">
          <h2 className="mb-10 text-5xl font-bold text-[#06245c] md:text-6xl">
            {t("about.model.title")}
          </h2>

          <p className="mx-auto max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
            {t("about.model.text")}
          </p>
        </div>

        <div className="mb-14 grid gap-10 md:grid-cols-2">
          {MODEL_CARDS.map((card) => (
            <article
              key={card.titleKey}
              className="rounded-3xl bg-white p-10 text-center shadow-xl"
            >
              <div
                aria-hidden="true"
                className="mb-8 text-7xl"
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

        <aside className="rounded-3xl border-l-8 border-green-500 bg-[#06245c] p-10 shadow-xl">
          <h3 className="mb-6 text-3xl font-bold text-white">
            {t("about.model.notice.title")}
          </h3>

          <p className="text-xl leading-relaxed text-gray-100 md:text-2xl">
            {t("about.model.notice.text")}
          </p>
        </aside>
      </div>
    </section>
  );
}