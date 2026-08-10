"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const NAMESPACE = "how-it-works";

export default function HowItWorksPage() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const tr = (key: string) =>
    t(key, { namespace: NAMESPACE });

  const processSteps = [1, 2, 3, 4, 5].map(
    (number) => ({
      number: String(number),
      title: tr(
        `process.steps.step${number}.title`,
      ),
      description: tr(
        `process.steps.step${number}.description`,
      ),
    }),
  );

  const modelSteps = [1, 2, 3, 4, 5].map(
    (number) => ({
      number: String(number),
      title: tr(
        `developmentModel.steps.step${number}.title`,
      ),
      description: tr(
        `developmentModel.steps.step${number}.description`,
      ),
    }),
  );

  const results = [
    "result.successfulEntrepreneur",
    "result.successfulBusiness",
    "result.newJobs",
    "result.strongerFamilies",
    "result.strongerCommunities",
    "result.lastingWealth",
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="bg-white px-8 py-20 text-center">
          <div className="mx-auto max-w-7xl">
            <Image
              src="/images/epew-process.png"
              alt={tr("hero.imageAlt")}
              width={1600}
              height={1000}
              className="mx-auto mb-16 rounded-3xl shadow-2xl"
              priority
            />

            <h1 className="mb-6 text-5xl font-extrabold md:text-7xl">
              {tr("hero.title")}
            </h1>

            <h2 className="mb-12 text-3xl font-bold md:text-4xl">
              {tr("hero.subtitle")}
            </h2>

            <div className="mx-auto max-w-6xl text-left">
              <ul className="space-y-8 text-2xl leading-relaxed text-gray-700 md:text-3xl">
                {processSteps.map((step) => (
                  <li key={step.number}>
                    <strong>
                      {step.number}. {step.title}
                    </strong>
                    <br />
                    {step.description}
                  </li>
                ))}
              </ul>

              <div className="mt-16 rounded-3xl border-l-8 border-green-600 bg-green-50 p-10">
                <h3 className="mb-6 text-4xl font-extrabold text-green-800">
                  {tr("result.title")}
                </h3>

                <ul className="space-y-4 text-2xl font-semibold text-gray-700">
                  {results.map((key) => (
                    <li key={key}>{tr(key)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-24">
          <h2 className="mb-10 text-center text-5xl font-extrabold md:text-6xl">
            {tr("developmentModel.title")}
          </h2>

          <p className="mx-auto mb-16 max-w-6xl text-center text-2xl leading-relaxed text-gray-700 md:text-3xl">
            {tr("developmentModel.description")}
          </p>

          <div className="grid gap-6 md:grid-cols-5">
            {modelSteps.map((step) => (
              <div
                key={step.number}
                className="rounded-3xl bg-white p-8 text-center shadow-xl"
              >
                <div className="mb-6 text-6xl font-extrabold text-green-600">
                  {step.number}
                </div>

                <h3 className="mb-4 text-2xl font-black">
                  {step.title}
                </h3>

                <p className="text-lg leading-relaxed text-gray-700">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white px-8 py-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="mb-10 text-5xl font-extrabold md:text-6xl">
              {tr("systems.title")}
            </h2>

            <div className="grid gap-10 md:grid-cols-3">
              <Card
                icon="🏛️"
                title={tr("systems.epew.title")}
                subtitle={tr("systems.epew.subtitle")}
                text={tr("systems.epew.text")}
              />

              <Card
                icon="🌍"
                title={tr("systems.ede.title")}
                subtitle={tr("systems.ede.subtitle")}
                text={tr("systems.ede.text")}
              />

              <Card
                icon="🤖"
                title={tr("systems.ibos.title")}
                subtitle={tr("systems.ibos.subtitle")}
                text={tr("systems.ibos.text")}
              />
            </div>
          </div>
        </section>

        <section className="bg-[#06245c] px-8 py-24 text-white">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="mb-8 text-5xl font-extrabold md:text-6xl">
              {tr("cta.title")}
            </h2>

            <p className="mb-12 text-2xl leading-relaxed text-blue-100 md:text-3xl">
              {tr("cta.description")}
            </p>

            <div className="flex flex-col justify-center gap-8 md:flex-row">
              <Link
                href="/entrepreneurs"
                className="rounded-2xl bg-green-600 px-12 py-5 text-2xl font-bold hover:bg-green-700"
              >
                {tr("cta.entrepreneurButton")}
              </Link>

              <Link
                href="/supporters"
                className="rounded-2xl bg-white px-12 py-5 text-2xl font-bold text-[#06245c] hover:bg-gray-200"
              >
                {tr("cta.supporterButton")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Card({
  icon,
  title,
  subtitle,
  text,
}: {
  icon: string;
  title: string;
  subtitle: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-10 shadow-lg">
      <div className="mb-5 text-6xl">{icon}</div>

      <h3 className="text-4xl font-extrabold">
        {title}
      </h3>

      <p className="mt-2 text-xl font-bold text-green-700">
        {subtitle}
      </p>

      <p className="mt-6 text-lg leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}
