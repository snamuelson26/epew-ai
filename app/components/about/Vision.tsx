"use client";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";
import LocalizedAboutImage from "./LocalizedAboutImage";

export default function Vision() {
  const { t } = useLanguage();

  return (
    <section className="bg-[#f5f7fb] py-24">
      <div className="mx-auto max-w-7xl px-6 text-center md:px-8">
        <LocalizedAboutImage
          fileName="our-vision.png"
          fallbackPath="/images/our-vision.png"
          alt={t("about.vision.imageAlt")}
          className="mx-auto h-auto w-full rounded-3xl shadow-2xl"
        />

        <h2 className="mt-16 text-5xl font-bold text-[#06245c] md:text-6xl">
          {t("about.vision.title")}
        </h2>

        <p className="mx-auto mt-10 max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
          {t("about.vision.description")}
        </p>
      </div>
    </section>
  );
}