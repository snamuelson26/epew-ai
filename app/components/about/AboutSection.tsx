"use client";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

import LocalizedAboutImage from "./LocalizedAboutImage";

export default function AboutSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-[#f5f7fb] py-24">
      <div className="mx-auto max-w-7xl px-6 text-center md:px-8">
        <LocalizedAboutImage
          fileName="about-epew.png"
          fallbackPath="/images/about-epew.png"
          alt={t("about.overview.imageAlt")}
          className="mx-auto h-auto w-full rounded-3xl shadow-2xl"
        />

        <p className="mx-auto mt-14 max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
          {t("about.overview.text")}
        </p>
      </div>
    </section>
  );
}