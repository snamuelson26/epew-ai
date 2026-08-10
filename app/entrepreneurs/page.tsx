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

const NAMESPACE = "entrepreneurs";

export default function EntrepreneursPage() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const tr = (key: string) =>
    t(key, { namespace: NAMESPACE });

  const developmentModel = [
    {
      number: "1",
      title: tr("developmentModel.steps.step1.title"),
      text: tr("developmentModel.steps.step1.text"),
    },
    {
      number: "2",
      title: tr("developmentModel.steps.step2.title"),
      text: tr("developmentModel.steps.step2.text"),
    },
    {
      number: "3",
      title: tr("developmentModel.steps.step3.title"),
      text: tr("developmentModel.steps.step3.text"),
    },
    {
      number: "4",
      title: tr("developmentModel.steps.step4.title"),
      text: tr("developmentModel.steps.step4.text"),
    },
    {
      number: "5",
      title: tr("developmentModel.steps.step5.title"),
      text: tr("developmentModel.steps.step5.text"),
    },
    {
      number: "6",
      title: tr("developmentModel.steps.step6.title"),
      text: tr("developmentModel.steps.step6.text"),
    },
    {
      number: "7",
      title: tr("developmentModel.steps.step7.title"),
      text: tr("developmentModel.steps.step7.text"),
    },
    {
      number: "8",
      title: tr("developmentModel.steps.step8.title"),
      text: tr("developmentModel.steps.step8.text"),
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-[#06245c]">

        {/* HERO */}

        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-8 text-center">

            <div className="flex justify-center mb-14">
              <Image
                src="/images/entrepreneur-hero.png"
                alt={tr("hero.imageAlt")}
                width={1400}
                height={850}
                className="rounded-3xl shadow-2xl"
                priority
              />
            </div>

            <h1 className="text-7xl font-extrabold mb-10">
              {tr("hero.title")}
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              {tr("hero.description")}
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-8 mt-14">
              <Link
                href="/entrepreneurs/enroll"
                className="bg-green-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-green-700 transition"
              >
                {tr("hero.entrepreneurButton")}
              </Link>

              <Link
                href="/videos"
                className="bg-[#06245c] text-white px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-blue-700 transition"
              >
                {tr("hero.videoButton")}
              </Link>
            </div>

          </div>
        </section>

        {/* YOUR DREAM */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8">

            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div>

                <h2 className="text-6xl font-extrabold mb-10">
                  {tr("dream.title")}
                </h2>

                <p className="text-3xl text-gray-700 leading-relaxed mb-8">
                  {tr("dream.paragraph1")}
                </p>

                <p className="text-3xl text-gray-700 leading-relaxed">
                  {tr("dream.paragraph2")}
                </p>

              </div>

              <div>

                <Image
  src="/images/entrepreneur-dream.png"
  alt={tr("dream.imageAlt")}
  width={1000}
  height={700}
  className="rounded-3xl shadow-2xl w-full h-auto"
/>

</div>   {/* closes the right column */}
</div>   {/* closes the grid */}
</div>   {/* closes max-w-7xl */}
</section>

        {/* FUNDING */}

        <section className="py-24 bg-white">

          <div className="max-w-7xl mx-auto px-8">

            <Image
              src="/images/100k-banner.png"
              alt={tr("funding.imageAlt")}
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <div className="text-center">

              <h2 className="text-6xl font-extrabold mb-10">
                {tr("funding.title")}
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                {tr("funding.description")}
              </p>

            </div>

          </div>

        </section>

        {/* OFFICIAL DEVELOPMENT MODEL */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <h2 className="text-6xl font-extrabold mb-10">
              {tr("developmentModel.title")}
            </h2>

            <p className="text-3xl text-gray-700 max-w-6xl mx-auto leading-relaxed mb-16">
              {tr("developmentModel.description")}
            </p>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
              {developmentModel.map((step) => (
                <div
                  key={step.number}
                  className="bg-white rounded-3xl shadow-xl p-8 text-left"
                >
                  <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center text-3xl font-black mb-6">
                    {step.number}
                  </div>

                  <h3 className="text-2xl font-extrabold mb-5">
                    {step.title}
                  </h3>

                  <p className="text-xl text-gray-700 leading-relaxed">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>

          </div>

        </section>

                {/* ENTREPRENEUR DEVELOPMENT ECOSYSTEM */}

        <section className="py-24 bg-white">

          <div className="max-w-7xl mx-auto px-8">

            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div>

                <Image
                  src="/images/ecosystem.png"
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

              <FeatureCard
                icon="👨‍🏫"
                title={tr("ecosystem.features.coach.title")}
                text={tr("ecosystem.features.coach.text")}
              />

              <FeatureCard
                icon="🏢"
                title={tr("ecosystem.features.teams.title")}
                text={tr("ecosystem.features.teams.text")}
              />

              <FeatureCard
                icon="🌐"
                title={tr("ecosystem.features.digital.title")}
                text={tr("ecosystem.features.digital.text")}
              />

              <FeatureCard
                icon="🤝"
                title={tr("ecosystem.features.supporters.title")}
                text={tr("ecosystem.features.supporters.text")}
              />

              <FeatureCard
                icon="🌍"
                title={tr("ecosystem.features.partners.title")}
                text={tr("ecosystem.features.partners.text")}
              />

              <FeatureCard
                icon="🤖"
                title={tr("ecosystem.features.ibos.title")}
                text={tr("ecosystem.features.ibos.text")}
              />

            </div>

          </div>

        </section>

        {/* COACH GUIDED SYSTEM */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8">

            <Image
              src="/images/coach-guided.png"
              alt={tr("coachGuided.imageAlt")}
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <div className="text-center mb-20">

              <h2 className="text-6xl font-extrabold mb-10">
                {tr("coachGuided.title")}
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                Your assigned coach serves as your primary guide throughout your
                entrepreneur journey. The coach helps you prepare, organize,
                understand expectations, and connect with the support needed to move forward.
              </p>

            </div>

            <div className="grid md:grid-cols-2 gap-12">

              <div className="bg-white rounded-3xl p-12 shadow-2xl">

                <h3 className="text-4xl font-bold mb-8">
                  {tr("coachGuided.helpTitle")}
                </h3>

                <ul className="space-y-6 text-2xl text-gray-700">
                  <li>✅ {tr("coachGuided.help.idea")}</li>
                  <li>✅ {tr("coachGuided.help.interview")}</li>
                  <li>✅ {tr("coachGuided.help.budget")}</li>
                  <li>✅ {tr("coachGuided.help.structure")}</li>
                  <li>✅ {tr("coachGuided.help.services")}</li>
                  <li>✅ {tr("coachGuided.help.funding")}</li>
                  <li>✅ {tr("coachGuided.help.launch")}</li>
                </ul>

              </div>

              <div className="bg-white rounded-3xl p-12 shadow-2xl">

                <h3 className="text-4xl font-bold mb-8">
                  {tr("coachGuided.validationTitle")}
                </h3>

                <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                  Every entrepreneur follows a structured preparation and validation
                  process before entering the funding queue. This helps ensure business
                  readiness, accountability, and long-term success.
                </p>

                <div className="bg-[#06245c] rounded-2xl p-8">
                  <p className="text-2xl text-white font-semibold leading-relaxed">
                    No entrepreneur enters the funding process without completing
                    the EPEW preparation journey.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* YOU REMAIN THE LEADER */}

        <section className="py-24 bg-white">

          <div className="max-w-7xl mx-auto px-8">

            <div className="rounded-3xl border-4 border-green-500 bg-green-50 p-12 shadow-2xl text-center">

              <h2 className="text-6xl font-extrabold text-green-900 mb-10">
                {tr("leader.title")}
              </h2>

              <div className="space-y-4 text-3xl font-bold text-green-950">
                <p>{tr("leader.owner")}</p>
                <p>{tr("leader.decisions")}</p>
                <p>{tr("leader.vision")}</p>
                <p>{tr("leader.notRun")}</p>
                <p>{tr("leader.ecosystem")}</p>
              </div>

            </div>

          </div>

        </section>

        {/* ENTREPRENEUR JOURNEY */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <Image
              src="/images/entrepreneur-journey.png"
              alt={tr("journey.imageAlt")}
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <h2 className="text-6xl font-extrabold mb-10">
              {tr("journey.title")}
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-16">
              EPEW helps entrepreneurs move from idea to preparation,
              from preparation to funding readiness,
              and from launch to long-term growth.
            </p>

            <div className="grid md:grid-cols-5 gap-6">

              <JourneyCard
                number="1"
                title={tr("journey.steps.apply.title")}
                text={tr("journey.steps.apply.text")}
              />

              <JourneyCard
                number="2"
                title={tr("journey.steps.coach.title")}
                text={tr("journey.steps.coach.text")}
              />

              <JourneyCard
                number="3"
                title={tr("journey.steps.prepare.title")}
                text={tr("journey.steps.prepare.text")}
              />

              <JourneyCard
                number="4"
                title={tr("journey.steps.funding.title")}
                text={tr("journey.steps.funding.text")}
              />

              <JourneyCard
                number="5"
                title={tr("journey.steps.launch.title")}
                text={tr("journey.steps.launch.text")}
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

            <p className="mt-12 text-3xl text-blue-100 leading-relaxed">
              Together, we build successful businesses,
              strengthen communities,
              and create lasting wealth.
            </p>

          </div>

        </section>

        {/* CTA */}

        <section className="py-24 bg-white">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <h2 className="text-7xl font-extrabold mb-12">
              Start {tr("journey.title")}
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-5xl mx-auto mb-14">
              Your business idea is the beginning. EPEW provides the ecosystem
              to help transform it into a successful business.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-8">
              <Link
                href="/entrepreneurs/enroll"
                className="bg-[#06245c] text-white px-14 py-6 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
              >
                {tr("cta.applyButton")}
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

function FeatureCard({
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

function JourneyCard({
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

      <p className="text-xl text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}