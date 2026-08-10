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

const NAMESPACE = "coaches";

export default function CoachesPage() {
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

      <main className="min-h-screen bg-white text-[#06245c]">
        {/* HERO */}
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <Image
              src="/images/coaches-hero.png"
              alt={tr("hero.imageAlt")}
              width={1600}
              height={900}
              className="w-full rounded-3xl shadow-2xl object-cover mb-16"
              priority
            />

            <h1 className="text-7xl font-extrabold mb-8">
              {tr("hero.title")}
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-12">
              {tr("hero.description")}
            </p>

            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <Link
                href="/coaches/login"
                className="bg-[#06245c] text-white px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
              >
                {tr("hero.loginButton")}
              </Link>

              <Link
                href="/coaches/apply"
                className="bg-green-600 text-white px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
              >
                {tr("hero.applyButton")}
              </Link>
            </div>
          </div>
        </section>

        {/* NEVER ALONE */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <Image
                  src="/images/coach-support.png"
                  alt={tr("neverAlone.imageAlt")}
                  width={900}
                  height={900}
                  className="rounded-3xl shadow-2xl w-full h-auto"
                />
              </div>

              <div>
                <h2 className="text-6xl font-extrabold mb-10">
                  {tr("neverAlone.title")}
                </h2>

                <p className="text-3xl text-gray-700 leading-relaxed mb-8">
                  {tr("neverAlone.paragraph1")}
                </p>

                <p className="text-3xl text-gray-700 leading-relaxed">
                  {tr("neverAlone.paragraph2")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT DOES A COACH DO */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              {tr("whatCoachDoes.title")}
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              {tr("whatCoachDoes.description")}
            </p>
          </div>
        </section>

        {/* COACH ROLES */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-extrabold mb-10">
                {tr("roles.title")}
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                {tr("roles.description")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <CoachCard
                icon="🧭"
                title={tr("roles.cards.advisor.title")}
                text={tr("roles.cards.advisor.text")}
              />

              <CoachCard
                icon="🏢"
                title={tr("roles.cards.development.title")}
                text={tr("roles.cards.development.text")}
              />

              <CoachCard
                icon="🤝"
                title={tr("roles.cards.facilitator.title")}
                text={tr("roles.cards.facilitator.text")}
              />

              <CoachCard
                icon="📋"
                title={tr("roles.cards.accountability.title")}
                text={tr("roles.cards.accountability.text")}
              />

              <CoachCard
                icon="🌱"
                title={tr("roles.cards.leadership.title")}
                text={tr("roles.cards.leadership.text")}
              />

              <CoachCard
                icon="🤖"
                title={tr("roles.cards.ibos.title")}
                text={tr("roles.cards.ibos.text")}
              />
            </div>
          </div>
        </section>

        {/* WHAT COACHES HELP ACCOMPLISH */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-extrabold mb-10">
                {tr("accomplish.title")}
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                {tr("accomplish.description")}
              </p>
            </div>

            <div className="bg-[#f5f7fb] rounded-3xl shadow-2xl p-12">
              <div className="grid md:grid-cols-3 gap-8 text-2xl text-gray-700">
                <p>✅ {tr("accomplish.items.idea")}</p>
                <p>✅ {tr("accomplish.items.vision")}</p>
                <p>✅ {tr("accomplish.items.goals")}</p>
                <p>✅ {tr("accomplish.items.plans")}</p>
                <p>✅ {tr("accomplish.items.services")}</p>
                <p>✅ {tr("accomplish.items.progress")}</p>
                <p>✅ {tr("accomplish.items.funding")}</p>
                <p>✅ {tr("accomplish.items.launch")}</p>
                <p>✅ {tr("accomplish.items.strengthen")}</p>
              </div>
            </div>
          </div>
        </section>

                {/* COACH JOURNEY */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              {tr("journey.title")}
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-16">
              {tr("journey.description")}
            </p>

            <div className="grid md:grid-cols-5 gap-6">
              <StepCard
                number="1"
                title={tr("journey.steps.assignment.title")}
                text={tr("journey.steps.assignment.text")}
              />

              <StepCard
                number="2"
                title={tr("journey.steps.discovery.title")}
                text={tr("journey.steps.discovery.text")}
              />

              <StepCard
                number="3"
                title={tr("journey.steps.development.title")}
                text={tr("journey.steps.development.text")}
              />

              <StepCard
                number="4"
                title={tr("journey.steps.readiness.title")}
                text={tr("journey.steps.readiness.text")}
              />

              <StepCard
                number="5"
                title={tr("journey.steps.growth.title")}
                text={tr("journey.steps.growth.text")}
              />
            </div>
          </div>
        </section>

        {/* COACHING PHILOSOPHY */}
        <section className="py-24 bg-[#06245c] text-white">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              {tr("philosophy.title")}
            </h2>

            <p className="text-3xl text-blue-100 leading-relaxed">
              {tr("philosophy.description")}
            </p>
          </div>
        </section>

        {/* COACH QUALIFICATIONS */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-extrabold mb-10">
                {tr("qualifications.title")}
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                EPEW welcomes qualified individuals who have experience,
                professionalism, leadership, and a passion for helping
                entrepreneurs succeed.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <CoachCard
                icon="💼"
                title={tr("qualifications.cards.business.title")}
                text={tr("qualifications.cards.business.text")}
              />

              <CoachCard
                icon="🏢"
                title={tr("qualifications.cards.entrepreneurs.title")}
                text={tr("qualifications.cards.entrepreneurs.text")}
              />

              <CoachCard
                icon="🎓"
                title={tr("qualifications.cards.educators.title")}
                text={tr("qualifications.cards.educators.text")}
              />

              <CoachCard
                icon="🌍"
                title={tr("qualifications.cards.community.title")}
                text={tr("qualifications.cards.community.text")}
              />

              <CoachCard
                icon="🧓"
                title={tr("qualifications.cards.retired.title")}
                text={tr("qualifications.cards.retired.text")}
              />

              <CoachCard
                icon="🤝"
                title={tr("qualifications.cards.service.title")}
                text={tr("qualifications.cards.service.text")}
              />
            </div>
          </div>
        </section>

        {/* COACH RESPONSIBILITIES */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-extrabold mb-10">
                {tr("responsibilities.title")}
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                EPEW coaches support entrepreneurs through guidance,
                accountability, milestone review, and coordinated preparation.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-12">
              <div className="grid md:grid-cols-3 gap-8 text-2xl text-gray-700">
                <p>✅ {tr("responsibilities.items.guide")}</p>
                <p>✅ {tr("responsibilities.items.monitor")}</p>
                <p>✅ {tr("responsibilities.items.interviews")}</p>
                <p>✅ {tr("responsibilities.items.questionnaires")}</p>
                <p>✅ {tr("responsibilities.items.support")}</p>
                <p>✅ {tr("responsibilities.items.milestones")}</p>
                <p>✅ {tr("accomplish.items.funding")}</p>
                <p>✅ {tr("responsibilities.items.accountability")}</p>
                <p>✅ {tr("responsibilities.items.growth")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* COACH IMPACT */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <Image
              src="/images/coach-impact.png"
              alt={tr("impact.imageAlt")}
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <h2 className="text-6xl font-extrabold mb-10">
              {tr("impact.title")}
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              Behind every successful entrepreneur is someone who encouraged
              them, challenged them, guided them, and helped them keep moving
              forward. EPEW coaches help create stronger businesses, stronger
              families, and stronger communities.
            </p>
          </div>
        </section>

        {/* COACH COMMITMENT */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-6xl mx-auto px-8">
            <div className="rounded-3xl border-l-8 border-green-600 bg-white p-12 shadow-2xl">
              <h2 className="text-6xl font-extrabold mb-10 text-center">
                {tr("commitment.title")}
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed text-center">
                As an EPEW Coach, I commit to guiding entrepreneurs with
                integrity, professionalism, accountability, respect, and
                encouragement. I will help entrepreneurs prepare for success
                while empowering them to lead their own businesses with
                confidence and responsibility.
              </p>
            </div>
          </div>
        </section>

        {/* OFFICIAL COACH STATEMENT */}
        <section className="py-24 bg-[#06245c] text-white">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-12">
              {tr("statement.title")}
            </h2>

            <div className="space-y-5 text-4xl font-black text-lime-300">
              <p>{tr("statement.line1")}</p>
              <p>{tr("statement.line2")}</p>
              <p>{tr("statement.line3")}</p>
              <p>{tr("statement.line4")}</p>
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
              Help develop entrepreneurs. Help strengthen communities. Help
              transform lives through entrepreneurship.
            </p>

            <div className="flex flex-col md:flex-row gap-8 justify-center">
              <Link
                href="/coaches/apply"
                className="bg-[#06245c] text-white px-14 py-6 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
              >
                {tr("hero.applyButton")}
              </Link>

              <Link
                href="/coaches/login"
                className="border-2 border-[#06245c] text-[#06245c] px-14 py-6 rounded-2xl text-2xl font-bold hover:bg-[#06245c] hover:text-white transition"
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

function CoachCard({
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

      <p className="text-xl text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}