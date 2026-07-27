"use client";

import Image from "next/image";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

export default function Partners() {
  const { t } = useLanguage();

  return (
    <section className="bg-[#f5f7fb] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-20 text-center">
          <h2 className="mb-10 text-5xl font-bold text-[#06245c] md:text-6xl">
            {t("about.partners.title")}
          </h2>

          <p className="mx-auto max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
            {t("about.partners.text")}
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <article className="rounded-3xl bg-white p-10 text-center shadow-xl">
            <Image
              src="/images/kleernest-logo.png"
              alt={t("about.partners.kleernest.imageAlt")}
              width={500}
              height={300}
              className="mx-auto mb-8 h-40 w-auto object-contain"
            />

            <h3 className="mb-6 text-3xl font-bold text-[#06245c]">
              {t("about.partners.kleernest.title")}
            </h3>

            <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
              {t("about.partners.kleernest.text")}
            </p>
          </article>

          <article className="rounded-3xl bg-white p-10 text-center shadow-xl">
            <Image
              src="/images/orgdh-network.png"
              alt={t("about.partners.orgdh.imageAlt")}
              width={500}
              height={300}
              className="mx-auto mb-8 h-40 w-auto object-contain"
            />

            <h3 className="mb-6 text-3xl font-bold text-[#06245c]">
              {t("about.partners.orgdh.title")}
            </h3>

            <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
              {t("about.partners.orgdh.text")}
            </p>
          </article>
        </div>

        <div className="mt-14 rounded-3xl bg-[#06245c] p-10 text-center shadow-xl">
          <h3 className="mb-6 text-3xl font-bold text-white">
            {t("about.partners.together.title")}
          </h3>

          <p className="mx-auto max-w-5xl text-xl leading-relaxed text-gray-100 md:text-2xl">
            {t("about.partners.together.text")}
          </p>
        </div>
      </div>
    </section>
  );
}