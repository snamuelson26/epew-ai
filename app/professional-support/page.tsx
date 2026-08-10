"use client";

import { useEffect } from "react";
import Link from "next/link";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

const NAMESPACE = "professional-support";

export default function ProfessionalSupportPage() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const tr = (key: string) =>
    t(key, { namespace: NAMESPACE });

  const services = [
    ["🏢", "formation"],
    ["💰", "financial"],
    ["📈", "development"],
    ["🎨", "branding"],
    ["📣", "marketing"],
    ["🎉", "launch"],
    ["🎥", "media"],
    ["🤝", "community"],
  ];

  const coachSteps = [
    "approval",
    "coach",
    "support",
    "growth",
  ];

  const modelSteps = [
    "idea",
    "develop",
    "prepare",
    "ede",
    "ibos",
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 px-8 py-20 text-white">
          <div className="mx-auto max-w-7xl text-center">
            <p className="text-xl font-black uppercase tracking-widest text-lime-300">
              {tr("hero.eyebrow")}
            </p>

            <h1 className="mt-5 text-6xl font-extrabold leading-tight">
              {tr("hero.title")}
            </h1>

            <p className="mx-auto mt-8 max-w-5xl text-3xl leading-relaxed text-blue-100">
              {tr("hero.description")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-16">
          <div className="rounded-3xl bg-white p-12 shadow-xl">
            <h2 className="text-5xl font-extrabold">
              {tr("intro.title")}
            </h2>

            <p className="mt-8 text-3xl leading-relaxed text-gray-700">
              {tr("intro.paragraph1")}
            </p>

            <p className="mt-8 text-3xl leading-relaxed text-gray-700">
              {tr("intro.paragraph2")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="grid gap-8 lg:grid-cols-2">
            {services.map(([icon, key]) => (
              <SupportCard
                key={key}
                icon={icon}
                title={tr(`services.${key}.title`)}
                text={tr(`services.${key}.text`)}
              />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-white p-12 shadow-xl">
            <h2 className="text-5xl font-extrabold">
              {tr("coach.title")}
            </h2>

            <p className="mt-8 text-3xl leading-relaxed text-gray-700">
              {tr("coach.description")}
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-4">
              {coachSteps.map((key, index) => (
                <Step
                  key={key}
                  number={String(index + 1)}
                  title={tr(`coach.steps.${key}.title`)}
                  text={tr(`coach.steps.${key}.text`)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-white p-12 shadow-xl">
            <h2 className="text-5xl font-extrabold">
              {tr("model.title")}
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-5">
              {modelSteps.map((key, index) => (
                <Step
                  key={key}
                  number={String(index + 1)}
                  title={tr(`model.steps.${key}.title`)}
                  text={tr(`model.steps.${key}.text`)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-[#06245c] p-12 text-center text-white shadow-xl">
            <h2 className="text-5xl font-extrabold">
              {tr("commitment.title")}
            </h2>

            <div className="mt-10 space-y-4 text-4xl font-black text-lime-300">
              <p>{tr("commitment.line1")}</p>
              <p>{tr("commitment.line2")}</p>
              <p>{tr("commitment.line3")}</p>
              <p>{tr("commitment.line4")}</p>
            </div>

            <p className="mx-auto mt-10 max-w-5xl text-2xl leading-relaxed text-blue-100">
              {tr("commitment.description")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-5 md:flex-row">
              <Link
                href="/entrepreneurs"
                className="rounded-2xl bg-lime-400 px-10 py-5 text-2xl font-black text-[#06245c] hover:bg-lime-300"
              >
                {tr("commitment.entrepreneurButton")}
              </Link>

              <Link
                href="/how-it-works"
                className="rounded-2xl bg-white px-10 py-5 text-2xl font-black text-[#06245c] hover:bg-gray-200"
              >
                {tr("commitment.learnButton")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function SupportCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-10 shadow-xl">
      <div className="text-6xl">{icon}</div>
      <h3 className="mt-5 text-3xl font-extrabold text-[#06245c]">
        {title}
      </h3>
      <p className="mt-5 text-2xl leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-6 shadow-md">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-2xl font-black text-white">
        {number}
      </div>
      <h3 className="mt-5 text-2xl font-extrabold text-[#06245c]">
        {title}
      </h3>
      <p className="mt-3 text-lg leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}
