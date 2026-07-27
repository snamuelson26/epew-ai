"use client";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";
import LocalizedAboutImage from "./LocalizedAboutImage";

export default function Mission() {
  const { t } = useLanguage();

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 text-center md:px-8">
        <LocalizedAboutImage
          fileName="our-mission.png"
          fallbackPath="/images/our-mission.png"
          alt={t("about.mission.imageAlt")}
          className="mx-auto h-auto w-full rounded-3xl shadow-2xl"
        />

        <h2 className="mt-16 text-5xl font-bold text-[#06245c] md:text-6xl">
          {t("about.mission.title")}
        </h2>

        <p className="mx-auto mt-10 max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
          {t("about.mission.description")}
        </p>
      </div>
    </section>
  );
}