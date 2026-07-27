"use client";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="w-full bg-white">
      <img
        src="/images/about/en/hero-epew.png"
        alt={t("about.hero.imageAlt")}
        className="block h-auto w-full object-cover"
      />
    </section>
  );
}