"use client";

import { useEffect } from "react";
import Link from "next/link";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

const NAMESPACE = "vendors";

const serviceAreas = [
  ["💼", "business"],
  ["💻", "technology"],
  ["📣", "marketing"],
  ["🏗️", "construction"],
  ["🧰", "equipment"],
  ["🛠️", "specialized"],
];

const qualificationItems = [
  "experience",
  "credentials",
  "insurance",
  "serviceArea",
  "capacity",
  "standards",
];

const benefitItems = [
  "opportunities",
  "matching",
  "growth",
  "performance",
];

export default function VendorsPage() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const tr = (key: string) =>
    t(key, { namespace: NAMESPACE });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 px-8 py-20 text-white">
          <div className="mx-auto max-w-7xl text-center">
            <p className="text-xl font-black uppercase tracking-widest text-lime-300">
              {tr("hero.eyebrow")}
            </p>

            <h1 className="mx-auto mt-5 max-w-6xl text-5xl font-extrabold leading-tight md:text-6xl">
              {tr("hero.title")}
            </h1>

            <p className="mx-auto mt-8 max-w-5xl text-2xl leading-relaxed text-blue-100 md:text-3xl">
              {tr("hero.description")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-5 md:flex-row">
              <Link
                href="/vendors/apply"
                className="rounded-2xl bg-lime-400 px-10 py-5 text-2xl font-black text-[#06245c] transition hover:bg-lime-300"
              >
                {tr("cta.applyButton")}
              </Link>

              <Link
                href="/vendors/login"
                className="rounded-2xl bg-white px-10 py-5 text-2xl font-black text-[#06245c] transition hover:bg-gray-200"
              >
                {tr("cta.loginButton")}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-16">
          <div className="rounded-3xl bg-white p-12 shadow-xl">
            <h2 className="text-5xl font-extrabold">
              {tr("about.title")}
            </h2>

            <p className="mt-8 text-2xl leading-relaxed text-gray-700 md:text-3xl">
              {tr("about.paragraph1")}
            </p>

            <p className="mt-8 text-2xl leading-relaxed text-gray-700 md:text-3xl">
              {tr("about.paragraph2")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="grid gap-8 lg:grid-cols-2">
            {serviceAreas.map(([icon, key]) => (
              <VendorArea
                key={key}
                icon={icon}
                title={tr(`areas.${key}.title`)}
                text={tr(`areas.${key}.text`)}
              />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-white p-12 shadow-xl">
            <h2 className="text-5xl font-extrabold">
              {tr("qualification.title")}
            </h2>

            <p className="mt-6 max-w-5xl text-2xl leading-relaxed text-gray-700">
              {tr("qualification.description")}
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {qualificationItems.map((key) => (
                <div
                  key={key}
                  className="rounded-2xl border border-gray-200 bg-[#f5f7fb] p-6"
                >
                  <p className="text-xl font-bold leading-relaxed text-gray-700">
                    ✓ {tr(`qualification.items.${key}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-[#06245c] p-12 text-white shadow-xl">
            <div className="text-center">
              <h2 className="text-5xl font-extrabold">
                {tr("benefits.title")}
              </h2>

              <p className="mx-auto mt-7 max-w-5xl text-2xl leading-relaxed text-blue-100">
                {tr("benefits.description")}
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {benefitItems.map((key) => (
                <div
                  key={key}
                  className="rounded-3xl bg-white p-8 text-[#06245c]"
                >
                  <h3 className="text-3xl font-extrabold">
                    {tr(`benefits.items.${key}.title`)}
                  </h3>

                  <p className="mt-4 text-xl leading-relaxed text-gray-700">
                    {tr(`benefits.items.${key}.text`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-20">
          <div className="rounded-3xl bg-white p-12 text-center shadow-xl">
            <h2 className="text-5xl font-extrabold">
              {tr("cta.title")}
            </h2>

            <p className="mx-auto mt-7 max-w-5xl text-2xl leading-relaxed text-gray-700">
              {tr("cta.description")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-5 md:flex-row">
              <Link
                href="/vendors/apply"
                className="rounded-2xl bg-green-600 px-10 py-5 text-2xl font-black text-white transition hover:bg-[#06245c]"
              >
                {tr("cta.applyButton")}
              </Link>

              <Link
                href="/vendors/login"
                className="rounded-2xl border-2 border-[#06245c] px-10 py-5 text-2xl font-black text-[#06245c] transition hover:bg-[#06245c] hover:text-white"
              >
                {tr("cta.loginButton")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function VendorArea({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-9 shadow-xl">
      <div className="text-5xl">{icon}</div>

      <h3 className="mt-5 text-3xl font-extrabold text-[#06245c]">
        {title}
      </h3>

      <p className="mt-4 text-xl leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}
