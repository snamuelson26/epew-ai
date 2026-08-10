"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

const NAMESPACE = "supporters";

export default function SupportersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-2xl font-bold text-slate-700">
            …
          </div>
        </main>
      }
    >
      <SupportersPageContent />
    </Suspense>
  );
}

function SupportersPageContent() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const tr = (key: string) =>
    t(key, { namespace: NAMESPACE });

  const searchParams = useSearchParams();
  const campaign = searchParams.get("campaign") || "";

  useEffect(() => {
    if (campaign) {
      localStorage.setItem("epew_campaign_source", campaign);
      localStorage.setItem("epew_supported_entrepreneur", campaign);
    }
  }, [campaign]);

  const supporterRegisterLink = campaign
    ? `/supporters/register?campaign=${campaign}`
    : "/supporters/register";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-[#06245c]">
        {/* HERO IMAGE */}
        <section className="bg-white">
          <Image
            src="/images/supporter-hero.png"
            alt={tr("hero.imageAlt")}
            width={1600}
            height={900}
            className="w-full h-auto object-cover"
            priority
          />
        </section>

        {/* HERO CONTENT */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <h1 className="text-7xl md:text-6xl font-extrabold leading-tight mb-12">
              {tr("hero.titleLine1")}
              <br />
              {tr("hero.titleLine2")}
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-5xl mx-auto mb-14">
          {tr("hero.description")}
        </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <Link
                href={supporterRegisterLink}
                className="bg-green-600 text-white px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
              >
                {tr("hero.supportButton")}
              </Link>

              <Link
                href="/videos"
                className="border-2 border-[#06245c] text-[#06245c] px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] hover:text-white transition"
              >
                {tr("hero.videosButton")}
              </Link>
            </div>
          </div>
        </section>

        {/* WHO IS A SUPPORTER */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-extrabold mb-10">
                {tr("who.title")}
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                {tr("who.description")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <SupportCard
                icon="🤝"
                title={tr("who.cards.community.title")}
                text={tr("who.cards.community.text")}
              />

              <SupportCard
                icon="🚀"
                title={tr("who.cards.growth.title")}
                text={tr("who.cards.growth.text")}
              />

              <SupportCard
                icon="🌍"
                title={tr("who.cards.impact.title")}
                text={tr("who.cards.impact.text")}
              />
            </div>
          </div>
        </section>

        {/* WHY BECOME A SUPPORTER */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-extrabold mb-10">
                {tr("whySupport.title")}
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                {tr("whySupport.description")}
              </p>
            </div>

            <Image
              src="/images/why-supporters-matter.png"
              alt={tr("whySupport.imageAlt")}
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <div className="grid md:grid-cols-3 gap-10">
              <SupportCard
                icon="💡"
                title={tr("whySupport.cards.ideas.title")}
                text={tr("whySupport.cards.ideas.text")}
              />

              <SupportCard
                icon="🏢"
                title={tr("whySupport.cards.launch.title")}
                text={tr("whySupport.cards.launch.text")}
              />

              <SupportCard
                icon="👨‍👩‍👧"
                title={tr("whySupport.cards.families.title")}
                text={tr("whySupport.cards.families.text")}
              />

              <SupportCard
                icon="📈"
                title={tr("whySupport.cards.economic.title")}
                text={tr("whySupport.cards.economic.text")}
              />

              <SupportCard
                icon="🌱"
                title={tr("whySupport.cards.longTerm.title")}
                text={tr("whySupport.cards.longTerm.text")}
              />

              <SupportCard
                icon="🌍"
                title={tr("whySupport.cards.movement.title")}
                text={tr("whySupport.cards.movement.text")}
              />
            </div>
          </div>
        </section>

        {/* WHO CAN BECOME A SUPPORTER */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-extrabold mb-10">
                {tr("eligibility.title")}
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                {tr("eligibility.description")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <SupportCard
                icon="💼"
                title={tr("eligibility.cards.entrepreneurs.title")}
                text={tr("eligibility.cards.entrepreneurs.text")}
              />

              <SupportCard
                icon="🎓"
                title={tr("eligibility.cards.students.title")}
                text={tr("eligibility.cards.students.text")}
              />

              <SupportCard
                icon="👷"
                title={tr("eligibility.cards.workers.title")}
                text={tr("eligibility.cards.workers.text")}
              />

              <SupportCard
                icon="👨‍🏫"
                title={tr("eligibility.cards.coaches.title")}
                text={tr("eligibility.cards.coaches.text")}
              />

              <SupportCard
                icon="👴"
                title={tr("eligibility.cards.retired.title")}
                text={tr("eligibility.cards.retired.text")}
              />

              <SupportCard
                icon="🌎"
                title={tr("eligibility.cards.anyone.title")}
                text={tr("eligibility.cards.anyone.text")}
              />
            </div>
          </div>
        </section>

        {/* HOW SUPPORTERS PARTICIPATE */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              {tr("participation.title")}
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-16">
              {tr("participation.description")}
            </p>

            <Image
              src="/images/how-supporters-participate.png"
              alt={tr("participation.imageAlt")}
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-20"
            />

            <div className="grid md:grid-cols-5 gap-6">
              <StepCard
                number="1"
                title={tr("participation.steps.register.title")}
                text={tr("participation.steps.register.text")}
              />

              <StepCard
                number="2"
                title={tr("participation.steps.choose.title")}
                text={tr("participation.steps.choose.text")}
              />

              <StepCard
                number="3"
                title={tr("participation.steps.support.title")}
                text={tr("participation.steps.support.text")}
              />

              <StepCard
                number="4"
                title={tr("participation.steps.follow.title")}
                text={tr("participation.steps.follow.text")}
              />

              <StepCard
                number="5"
                title={tr("participation.steps.impact.title")}
                text={tr("participation.steps.impact.text")}
              />
            </div>
          </div>
        </section>

                {/* WHY THE ECOSYSTEM NEEDS SUPPORTERS */}

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">

            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div>

                <Image
                  src="/images/supporters-ecosystem.png"
                  alt={tr("ecosystem.imageAlt")}
                  width={900}
                  height={900}
                  className="rounded-3xl shadow-2xl"
                />

              </div>

              <div>

                <h2 className="text-6xl font-extrabold mb-10">
                  {tr("ecosystem.title")}
                </h2>

                <p className="text-3xl text-gray-700 leading-relaxed mb-8">
                  {tr("ecosystem.paragraph1")}
                </p>

                <p className="text-3xl text-gray-700 leading-relaxed">
                  {tr("ecosystem.paragraph2")}
                </p>

              </div>

            </div>

            <div className="grid md:grid-cols-3 gap-10 mt-20">

              <SupportCard
                icon="📚"
                title={tr("ecosystem.cards.preparation.title")}
                text={tr("ecosystem.cards.preparation.text")}
              />

              <SupportCard
                icon="🏢"
                title={tr("ecosystem.cards.development.title")}
                text={tr("ecosystem.cards.development.text")}
              />

              <SupportCard
                icon="👨‍💼"
                title={tr("ecosystem.cards.services.title")}
                text={tr("ecosystem.cards.services.text")}
              />

              <SupportCard
                icon="🎉"
                title={tr("ecosystem.cards.launch.title")}
                text={tr("ecosystem.cards.launch.text")}
              />

              <SupportCard
                icon="🌱"
                title={tr("ecosystem.cards.growth.title")}
                text={tr("ecosystem.cards.growth.text")}
              />

              <SupportCard
                icon="🚀"
                title={tr("ecosystem.cards.longTerm.title")}
                text={tr("ecosystem.cards.longTerm.text")}
              />

            </div>

          </div>
        </section>

        {/* COMMUNITY IMPACT */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <Image
              src="/images/supporters-impact.png"
              alt={tr("impact.imageAlt")}
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <h2 className="text-6xl font-extrabold mb-10">
              {tr("impact.title")}
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              {tr("impact.description")}
            </p>

          </div>

        </section>

        {/* PARTICIPATION BENEFITS */}

        <section className="py-24 bg-white">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <h2 className="text-6xl font-extrabold mb-10">
              {tr("benefits.title")}
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-16">
              {tr("benefits.description")}
            </p>

            <div className="bg-[#06245c] rounded-3xl p-12 text-white shadow-2xl">

              <h3 className="text-6xl font-black text-lime-300 mb-8">
                {tr("benefits.rate")}
              </h3>

              <p className="text-3xl leading-relaxed">
                {tr("benefits.rateDescription")}
              </p>

              <p className="mt-10 text-xl text-blue-100 leading-relaxed">
                {tr("benefits.disclaimer")}
              </p>

            </div>

          </div>

        </section>

        {/* WHY PEOPLE CHOOSE EPEW */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8">

            <div className="text-center mb-20">

              <h2 className="text-6xl font-extrabold mb-10">
                {tr("whyEpew.title")}
              </h2>

            </div>

            <div className="grid md:grid-cols-3 gap-10">

              <SupportCard
                icon="✔️"
                title={tr("whyEpew.cards.structured.title")}
                text={tr("whyEpew.cards.structured.text")}
              />

              <SupportCard
                icon="🔍"
                title={tr("whyEpew.cards.transparent.title")}
                text={tr("whyEpew.cards.transparent.text")}
              />

              <SupportCard
                icon="🤝"
                title={tr("whyEpew.cards.accountable.title")}
                text={tr("whyEpew.cards.accountable.text")}
              />

              <SupportCard
                icon="🌎"
                title={tr("whyEpew.cards.community.title")}
                text={tr("whyEpew.cards.community.text")}
              />

              <SupportCard
                icon="🚀"
                title={tr("whyEpew.cards.entrepreneur.title")}
                text={tr("whyEpew.cards.entrepreneur.text")}
              />

              <SupportCard
                icon="🏆"
                title={tr("whyEpew.cards.vision.title")}
                text={tr("whyEpew.cards.vision.text")}
              />

            </div>

          </div>

        </section>

        {/* OFFICIAL PROMISE */}

        <section className="py-24 bg-[#06245c] text-white">

          <div className="max-w-6xl mx-auto px-8 text-center">

            <h2 className="text-6xl font-extrabold mb-12">
              {tr("promise.title")}
            </h2>

            <div className="space-y-5 text-4xl font-black text-lime-300">

              <p>{tr("promise.line1")}</p>

              <p>{tr("promise.line2")}</p>

              <p>{tr("promise.line3")}</p>

              <p>{tr("promise.line4")}</p>

            </div>

          </div>

        </section>

        {/* FINAL CTA */}

        <section className="py-24 bg-white">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <h2 className="text-7xl font-extrabold mb-10">
              {tr("cta.title")}
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-5xl mx-auto mb-14">
              {tr("cta.description")}
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-8">

              <Link
                href={supporterRegisterLink}
                className="bg-[#06245c] text-white px-14 py-6 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
              >
                {tr("cta.supportButton")}
              </Link>

              <Link
                href="/how-it-works"
                className="border-2 border-[#06245c] text-[#06245c] px-14 py-6 rounded-2xl text-2xl font-bold hover:bg-[#06245c] hover:text-white transition"
              >
                {tr("cta.learnButton")}
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
    <div className="bg-white rounded-3xl p-10 shadow-xl text-center">
      <div className="text-6xl mb-6">{icon}</div>
      <h3 className="text-3xl font-extrabold mb-6">{title}</h3>
      <p className="text-2xl text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-700 text-white text-3xl font-black mx-auto mb-6">
        {number}
      </div>

      <h3 className="text-3xl font-extrabold mb-4">{title}</h3>

      <p className="text-xl text-gray-700 leading-relaxed">
        {text}
      </p>
    </div>
  );
}