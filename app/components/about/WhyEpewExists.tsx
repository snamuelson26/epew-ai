"use client";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

import LocalizedAboutImage from "./LocalizedAboutImage";

export default function WhyEpewExists() {
  const { t } = useLanguage();

  return (
    <section className="bg-[#06245c] py-24">
      <div className="mx-auto max-w-7xl px-6 text-center md:px-8">
        <LocalizedAboutImage
          fileName="why-epew-exists.png"
          fallbackPath="/images/why-epew-exists.png"
          alt={t("about.why.imageAlt")}
          className="mx-auto h-auto w-full rounded-3xl shadow-2xl"
        />

        <h2 className="mt-16 text-5xl font-bold text-white md:text-6xl">
          {t("about.why.title")}
        </h2>

        <p className="mx-auto mt-10 max-w-6xl text-2xl leading-relaxed text-white md:text-3xl">
          {t("about.why.text")}
        </p>
      </div>
    </section>
  );
}