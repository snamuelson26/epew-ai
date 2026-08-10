"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

const NAMESPACE = "partners";

export default function PartnersPage() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const tr = (key: string) =>
    t(key, { namespace: NAMESPACE });

  const areas = [
    ["🏢", "formation"],
    ["💰", "financial"],
    ["📈", "development"],
    ["🎨", "branding"],
    ["📣", "promotion"],
    ["🎉", "launch"],
  ];

  const serviceSteps = [
    "review",
    "introduction",
    "request",
    "delivery",
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 px-8 py-20 text-white">
          <div className="mx-auto max-w-7xl text-center">
            <div className="mb-14 flex justify-center">
              <Image
                src="/images/partners-hero.png"
                alt={tr("hero.imageAlt")}
                width={1400}
                height={850}
                className="rounded-3xl shadow-2xl"
                priority
              />
            </div>

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
              {tr("ecosystem.title")}
            </h2>

            <p className="mt-8 text-3xl leading-relaxed text-gray-700">
              {tr("ecosystem.paragraph1")}
            </p>

            <p className="mt-8 text-3xl leading-relaxed text-gray-700">
              {tr("ecosystem.paragraph2")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="grid gap-8 lg:grid-cols-2">
            {areas.map(([icon, key]) => (
              <PartnerArea
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
              {tr("service.title")}
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-4">
              {serviceSteps.map((key, index) => (
                <Step
                  key={key}
                  number={String(index + 1)}
                  title={tr(`service.steps.${key}.title`)}
                  text={tr(`service.steps.${key}.text`)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-[#06245c] p-12 text-center text-white shadow-xl">
            <h2 className="text-5xl font-extrabold">
              {tr("strength.title")}
            </h2>

            <p className="mx-auto mt-8 max-w-5xl text-3xl leading-relaxed text-blue-100">
              {tr("strength.description")}
            </p>

            <div className="mt-10 space-y-4 text-4xl font-black text-lime-300">
              <p>{tr("strength.line1")}</p>
              <p>{tr("strength.line2")}</p>
              <p>{tr("strength.line3")}</p>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-5 md:flex-row">
              <Link
                href="/professional-support"
                className="rounded-2xl bg-lime-400 px-10 py-5 text-2xl font-black text-[#06245c] hover:bg-lime-300"
              >
                {tr("strength.supportButton")}
              </Link>

              <Link
                href="/partners/register"
                className="rounded-2xl bg-white px-10 py-5 text-2xl font-black text-[#06245c] hover:bg-gray-200"
              >
                {tr("strength.partnerButton")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function PartnerArea({
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
