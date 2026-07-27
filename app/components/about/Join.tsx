"use client";

import Link from "next/link";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

import { JOIN_LINKS } from "./constants";
import LocalizedAboutImage from "./LocalizedAboutImage";

export default function Join() {
  const { t } = useLanguage();

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 text-center md:px-8">
        <LocalizedAboutImage
          fileName="join-epew.png"
          fallbackPath="/images/join-epew.png"
          alt={t("about.join.imageAlt")}
          className="mx-auto h-auto w-full rounded-3xl shadow-2xl"
        />

        <h2 className="mt-16 text-5xl font-bold text-[#06245c] md:text-6xl">
          {t("about.join.title")}
        </h2>

        <p className="mx-auto mt-10 max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
          {t("about.join.text")}
        </p>

        <div className="mt-12 flex flex-col justify-center gap-5 sm:flex-row sm:flex-wrap">
          {JOIN_LINKS.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                index === 0
                  ? "rounded-2xl bg-green-600 px-9 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-green-700"
                  : "rounded-2xl bg-[#06245c] px-9 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-[#0a347d]"
              }
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}