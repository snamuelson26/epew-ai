"use client";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

export default function Disclosure() {
  const { t } = useLanguage();

  return (
    <section className="bg-[#f5f7fb] py-24">
      <div className="mx-auto max-w-6xl px-6 text-center md:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-xl md:p-14">
          <h2 className="mb-10 text-4xl font-bold text-[#06245c] md:text-5xl">
            {t("about.disclosure.title")}
          </h2>

          <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
            {t("about.disclosure.text")}
          </p>
        </div>
      </div>
    </section>
  );
}