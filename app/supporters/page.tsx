"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function SupportersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-2xl font-bold text-slate-700">
            Loading...
          </div>
        </main>
      }
    >
      <SupportersPageContent />
    </Suspense>
  );
}

function SupportersPageContent() {
  
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
            alt="EPEW Supporters"
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
              Support Entrepreneurs.
              <br />
              Strengthen Communities.
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-5xl mx-auto mb-14">
              Supporters are the foundation and the engine of the EPEW
              Entrepreneur Development Ecosystem. Your participation helps
              transform ideas into successful businesses that create jobs,
              strengthen families, and build stronger communities.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <Link
                href={supporterRegisterLink}
                className="bg-green-600 text-white px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
              >
                Become a Supporter
              </Link>

              <Link
                href="/videos"
                className="border-2 border-[#06245c] text-[#06245c] px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] hover:text-white transition"
              >
                View Videos & Stories
              </Link>
            </div>
          </div>
        </section>

        {/* WHO IS A SUPPORTER */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-extrabold mb-10">
                Who Is a Supporter?
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                A Supporter is someone who believes in entrepreneurs and wants
                to help transform business ideas into successful businesses.
                Supporters participate in a structured ecosystem that prepares
                entrepreneurs, coordinates professional services, supports
                funding readiness, and strengthens communities.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <SupportCard
                icon="🤝"
                title="Community Participation"
                text="Supporters participate in helping entrepreneurs move from ideas to business development, preparation, and launch."
              />

              <SupportCard
                icon="🚀"
                title="Entrepreneur Growth"
                text="Your participation supports coaching, structure, professional services, visibility, and responsible business growth."
              />

              <SupportCard
                icon="🌍"
                title="Community Impact"
                text="Successful businesses can create jobs, strengthen families, and contribute to long-term community development."
              />
            </div>
          </div>
        </section>

        {/* WHY BECOME A SUPPORTER */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-extrabold mb-10">
                Why Become a Supporter?
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                Supporters make entrepreneurship possible. They help create the
                foundation that allows entrepreneurs to prepare, launch, grow,
                and create lasting impact.
              </p>
            </div>

            <Image
              src="/images/why-supporters-matter.png"
              alt="Why Supporters Matter"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <div className="grid md:grid-cols-3 gap-10">
              <SupportCard
                icon="💡"
                title="Help Ideas Become Businesses"
                text="Your participation helps entrepreneurs receive the support needed to move from vision to business readiness."
              />

              <SupportCard
                icon="🏢"
                title="Help Businesses Launch"
                text="Supporters help entrepreneurs access structure, coaching, visibility, and professional preparation."
              />

              <SupportCard
                icon="👨‍👩‍👧"
                title="Strengthen Families"
                text="When entrepreneurs succeed, families gain opportunities, stability, confidence, and long-term growth."
              />

              <SupportCard
                icon="📈"
                title="Support Economic Development"
                text="Strong businesses create jobs, services, opportunity, and local economic activity."
              />

              <SupportCard
                icon="🌱"
                title="Build Long-Term Impact"
                text="Supporters help create businesses that can grow beyond launch and continue serving communities."
              />

              <SupportCard
                icon="🌍"
                title="Be Part of a Movement"
                text="EPEW is building a global entrepreneur development model that communities can adopt to reduce poverty through entrepreneurship."
              />
            </div>
          </div>
        </section>

        {/* WHO CAN BECOME A SUPPORTER */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-extrabold mb-10">
                Who Can Become a Supporter?
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                Anyone who believes in entrepreneurship, community development,
                and business growth can become a supporter.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <SupportCard
                icon="💼"
                title="Entrepreneurs"
                text="Entrepreneurs can support other entrepreneurs and help grow the ecosystem."
              />

              <SupportCard
                icon="🎓"
                title="Students"
                text="Students can participate in learning entrepreneurship and supporting future business leaders."
              />

              <SupportCard
                icon="👷"
                title="Workers"
                text="Workers can participate in helping entrepreneurs create jobs and opportunity."
              />

              <SupportCard
                icon="👨‍🏫"
                title="Coaches"
                text="Coaches can support the ecosystem while guiding entrepreneurs toward readiness."
              />

              <SupportCard
                icon="👴"
                title="Retired Individuals"
                text="Retired individuals can use their experience and participation to support entrepreneurs."
              />

              <SupportCard
                icon="🌎"
                title="Anyone Who Believes"
                text="Anyone who believes in entrepreneurship, families, communities, and economic opportunity can become a supporter."
              />
            </div>
          </div>
        </section>

        {/* HOW SUPPORTERS PARTICIPATE */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              How Supporters Participate
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-16">
              EPEW follows a structured participation process designed to
              promote transparency, accountability, entrepreneur preparation,
              and community impact.
            </p>

            <Image
              src="/images/how-supporters-participate.png"
              alt="How Supporters Participate"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-20"
            />

            <div className="grid md:grid-cols-5 gap-6">
              <StepCard
                number="1"
                title="Register"
                text="Create your supporter account."
              />

              <StepCard
                number="2"
                title="Choose"
                text="Choose your participation option."
              />

              <StepCard
                number="3"
                title="Support"
                text="Support entrepreneurs in the ecosystem."
              />

              <StepCard
                number="4"
                title="Follow"
                text="Receive updates and follow progress."
              />

              <StepCard
                number="5"
                title="Impact"
                text="Help build stronger communities."
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
                  alt="Supporters strengthen the ecosystem"
                  width={900}
                  height={900}
                  className="rounded-3xl shadow-2xl"
                />

              </div>

              <div>

                <h2 className="text-6xl font-extrabold mb-10">
                  Every Entrepreneur Needs a Community Behind Them
                </h2>

                <p className="text-3xl text-gray-700 leading-relaxed mb-8">
                  Successful businesses are rarely built alone.
                  Every entrepreneur benefits from encouragement,
                  preparation, professional guidance,
                  and a community that believes in their vision.
                </p>

                <p className="text-3xl text-gray-700 leading-relaxed">
                  Founding Supporters make entrepreneurship possible by helping
                  create the environment where businesses can launch,
                  grow, and create lasting community impact.
                </p>

              </div>

            </div>

            <div className="grid md:grid-cols-3 gap-10 mt-20">

              <SupportCard
                icon="📚"
                title="Preparation"
                text="Support entrepreneur preparation before funding."
              />

              <SupportCard
                icon="🏢"
                title="Business Development"
                text="Help entrepreneurs organize and strengthen their businesses."
              />

              <SupportCard
                icon="👨‍💼"
                title="Professional Services"
                text="Support coordinated services that prepare entrepreneurs for success."
              />

              <SupportCard
                icon="🎉"
                title="Business Launch"
                text="Help entrepreneurs successfully open their businesses."
              />

              <SupportCard
                icon="🌱"
                title="Community Growth"
                text="Every successful entrepreneur strengthens the local community."
              />

              <SupportCard
                icon="🚀"
                title="Long-Term Success"
                text="Support businesses beyond opening day through continued growth."
              />

            </div>

          </div>
        </section>

        {/* COMMUNITY IMPACT */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <Image
              src="/images/supporters-impact.png"
              alt="Community Impact"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <h2 className="text-6xl font-extrabold mb-10">
              Your Participation Creates Community Impact
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              Every entrepreneur supported through EPEW has the potential to
              create jobs, strengthen families, provide valuable services,
              and contribute to stronger communities and lasting economic growth.
            </p>

          </div>

        </section>

        {/* PARTICIPATION BENEFITS */}

        <section className="py-24 bg-white">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <h2 className="text-6xl font-extrabold mb-10">
              Participation Benefits
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-16">
              Supporters participate in entrepreneur success,
              community development,
              and the growth of businesses throughout the EPEW ecosystem.
            </p>

            <div className="bg-[#06245c] rounded-3xl p-12 text-white shadow-2xl">

              <h3 className="text-6xl font-black text-lime-300 mb-8">
                Up To 6%
              </h3>

              <p className="text-3xl leading-relaxed">
                Qualified supporters may receive annual participation benefits
                of up to 6%, subject to program policies and business performance.
              </p>

              <p className="mt-10 text-xl text-blue-100 leading-relaxed">
                Participation benefits are not guaranteed.
                They depend on business performance,
                entrepreneur success,
                and EPEW program policies.
              </p>

            </div>

          </div>

        </section>

        {/* WHY PEOPLE CHOOSE EPEW */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8">

            <div className="text-center mb-20">

              <h2 className="text-6xl font-extrabold mb-10">
                Why People Choose EPEW
              </h2>

            </div>

            <div className="grid md:grid-cols-3 gap-10">

              <SupportCard
                icon="✔️"
                title="Structured"
                text="Every entrepreneur follows a clear development process."
              />

              <SupportCard
                icon="🔍"
                title="Transparent"
                text="Supporters can follow entrepreneur progress throughout the journey."
              />

              <SupportCard
                icon="🤝"
                title="Accountable"
                text="Entrepreneurs provide quarterly reporting and ongoing accountability."
              />

              <SupportCard
                icon="🌎"
                title="Community Driven"
                text="Communities become active participants in entrepreneurship."
              />

              <SupportCard
                icon="🚀"
                title="Entrepreneur Focused"
                text="Everything is designed to help entrepreneurs succeed."
              />

              <SupportCard
                icon="🏆"
                title="Long-Term Vision"
                text="Building businesses that continue creating value for years to come."
              />

            </div>

          </div>

        </section>

        {/* OFFICIAL PROMISE */}

        <section className="py-24 bg-[#06245c] text-white">

          <div className="max-w-6xl mx-auto px-8 text-center">

            <h2 className="text-6xl font-extrabold mb-12">
              The Official EPEW Promise
            </h2>

            <div className="space-y-5 text-4xl font-black text-lime-300">

              <p>You believe in entrepreneurs.</p>

              <p>We prepare entrepreneurs.</p>

              <p>We provide the ecosystem.</p>

              <p>Together, we build successful businesses.</p>

            </div>

          </div>

        </section>

        {/* FINAL CTA */}

        <section className="py-24 bg-white">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <h2 className="text-7xl font-extrabold mb-10">
              Become a Founding Supporter Today
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-5xl mx-auto mb-14">
              Your participation helps transform ideas into businesses,
              businesses into opportunities,
              and opportunities into stronger communities.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-8">

              <Link
                href={supporterRegisterLink}
                className="bg-[#06245c] text-white px-14 py-6 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
              >
                Become a Supporter
              </Link>

              <Link
                href="/how-it-works"
                className="border-2 border-[#06245c] text-[#06245c] px-14 py-6 rounded-2xl text-2xl font-bold hover:bg-[#06245c] hover:text-white transition"
              >
                Learn How EPEW Works
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