"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function EntrepreneursPage() {
  const developmentModel = [
    {
      number: "1",
      title: "The Entrepreneur Brings the Idea",
      text: "Every successful business begins with an idea. The entrepreneur brings the vision, passion, determination, and commitment to build something meaningful.",
    },
    {
      number: "2",
      title: "EPEW Develops the Idea",
      text: "EPEW transforms the idea into a structured business opportunity through education, coaching, planning, professional guidance, and business development.",
    },
    {
      number: "3",
      title: "EPEW Prepares the Entrepreneur",
      text: "Entrepreneurs receive the preparation, knowledge, coaching, and guidance needed to become business-ready and funding-ready.",
    },
    {
      number: "4",
      title: "EPEW Connects the Entrepreneur with Funding",
      text: "Once entrepreneurs are prepared, EPEW connects them with the funding needed to launch and grow their businesses.",
    },
    {
      number: "5",
      title: "EPEW Provides the Entrepreneur Development Ecosystem (EDE)",
      text: "The Entrepreneur Development Ecosystem brings together coaches, professional teams, Founding Supporters, Certified Growth Partners, intelligent technology, and coordinated resources into one complete support system.",
    },
    {
      number: "6",
      title: "EPEW Helps You Open Your Business",
      text: "EPEW coordinates the professional services, launch preparation, business opening, promotion, and grand opening so entrepreneurs begin operations with confidence.",
    },
    {
      number: "7",
      title: "IBOS Coordinates the Journey",
      text: "The Intelligent Business Operating System coordinates every stage of entrepreneur development by managing workflows, communications, service requests, milestones, progress tracking, business readiness, funding readiness, and long-term business operations.",
    },
    {
      number: "8",
      title: "EPEW Helps Strengthen Your Business",
      text: "Entrepreneurship does not end at opening day. EPEW continues supporting entrepreneurs through coaching, professional services, quarterly reporting, promotion, intelligent technology, and long-term business growth.",
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
                alt="Become an Entrepreneur"
                width={1400}
                height={850}
                className="rounded-3xl shadow-2xl"
                priority
              />
            </div>

            <h1 className="text-7xl font-extrabold mb-10">
              Build Your Business Through EPEW
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              Every successful business begins with an idea.
              EPEW develops entrepreneurs through a coordinated
              Entrepreneur Development Ecosystem that transforms
              ideas into successful businesses.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-8 mt-14">
              <Link
                href="/entrepreneurs/enroll"
                className="bg-green-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-green-700 transition"
              >
                Become an Entrepreneur
              </Link>

              <Link
                href="/videos"
                className="bg-[#06245c] text-white px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-blue-700 transition"
              >
                Watch Introduction Video
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
                  Every Great Business Begins With One Idea
                </h2>

                <p className="text-3xl text-gray-700 leading-relaxed mb-8">
                  Your idea has the potential to transform your future,
                  create jobs, strengthen your family,
                  and improve your community.
                </p>

                <p className="text-3xl text-gray-700 leading-relaxed">
                  At EPEW, we believe entrepreneurs are developed—not simply funded. 
                  Through preparation, professional guidance, coordinated support, 
                  and the Entrepreneur Development Ecosystem, ideas become successful businesses.
                </p>

              </div>

              <div>

                <Image
  src="/images/entrepreneur-dream.png"
  alt="Entrepreneur Dream"
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
              alt="Funding Opportunity"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <div className="text-center">

              <h2 className="text-6xl font-extrabold mb-10">
                Preparation Comes Before Funding
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                EPEW prepares entrepreneurs first.
                When entrepreneurs become business-ready,
                EPEW connects them with the funding needed
                to launch and grow successful businesses.
              </p>

            </div>

          </div>

        </section>

        {/* OFFICIAL DEVELOPMENT MODEL */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <h2 className="text-6xl font-extrabold mb-10">
              The Official EPEW Entrepreneur Development Model
            </h2>

            <p className="text-3xl text-gray-700 max-w-6xl mx-auto leading-relaxed mb-16">
              EPEW follows a structured entrepreneur development model
              that prepares entrepreneurs,
              coordinates professional support,
              connects funding,
              and strengthens businesses through the Entrepreneur
              Development Ecosystem.
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
                  alt="Entrepreneur Development Ecosystem"
                  width={900}
                  height={900}
                  className="rounded-3xl shadow-2xl"
                />

              </div>

              <div>

                <h2 className="text-6xl font-extrabold mb-10">
                  You Are Supported by a Complete Ecosystem
                </h2>

                <p className="text-3xl text-gray-700 leading-relaxed mb-8">
                  From the moment you are approved, you become part of a coordinated
                  Entrepreneur Development Ecosystem dedicated to helping your business
                  succeed.
                </p>

                <p className="text-3xl text-gray-700 leading-relaxed">
                  The ecosystem brings together coaching, professional support,
                  Founding Supporters, Certified Growth Partners, digital tools,
                  funding readiness, and long-term business growth.
                </p>

              </div>

            </div>

            <div className="grid md:grid-cols-3 gap-10 mt-20">

              <FeatureCard
                icon="👨‍🏫"
                title="Dedicated Coach"
                text="Your coach guides your development journey and helps coordinate the support you need."
              />

              <FeatureCard
                icon="🏢"
                title="Professional Teams"
                text="Professional teams support business formation, branding, promotion, planning, and launch preparation."
              />

              <FeatureCard
                icon="🌐"
                title="Digital Business Presence"
                text="Every approved entrepreneur receives a permanent public Business Welcome Page."
              />

              <FeatureCard
                icon="🤝"
                title="Founding Supporters"
                text="Build a community of people who believe in your vision and want to support your business story."
              />

              <FeatureCard
                icon="🌍"
                title="Certified Growth Partners"
                text="Access specialized expertise through partners that strengthen your business development."
              />

              <FeatureCard
                icon="🤖"
                title="IBOS Coordination"
                text="IBOS coordinates workflows, milestones, service requests, communications, and funding readiness."
              />

            </div>

          </div>

        </section>

        {/* COACH GUIDED SYSTEM */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8">

            <Image
              src="/images/coach-guided.png"
              alt="Coach Guided System"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <div className="text-center mb-20">

              <h2 className="text-6xl font-extrabold mb-10">
                Coach-Guided Development
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
                  What Coaches Help With
                </h3>

                <ul className="space-y-6 text-2xl text-gray-700">
                  <li>✅ Business idea refinement</li>
                  <li>✅ Interview and readiness preparation</li>
                  <li>✅ Budget preparation and planning</li>
                  <li>✅ Business structure readiness</li>
                  <li>✅ Professional service coordination</li>
                  <li>✅ Funding readiness preparation</li>
                  <li>✅ Launch preparation and accountability</li>
                </ul>

              </div>

              <div className="bg-white rounded-3xl p-12 shadow-2xl">

                <h3 className="text-4xl font-bold mb-8">
                  Structured Validation Process
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
                You Remain the Leader
              </h2>

              <div className="space-y-4 text-3xl font-bold text-green-950">
                <p>You are the owner.</p>
                <p>You make the decisions.</p>
                <p>You build the vision.</p>
                <p>EPEW does not run your business.</p>
                <p>EPEW provides the ecosystem that helps your business succeed.</p>
              </div>

            </div>

          </div>

        </section>

        {/* ENTREPRENEUR JOURNEY */}

        <section className="py-24 bg-[#f5f7fb]">

          <div className="max-w-7xl mx-auto px-8 text-center">

            <Image
              src="/images/entrepreneur-journey.png"
              alt="Entrepreneur Journey"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <h2 className="text-6xl font-extrabold mb-10">
              Your Entrepreneur Journey
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-16">
              EPEW helps entrepreneurs move from idea to preparation,
              from preparation to funding readiness,
              and from launch to long-term growth.
            </p>

            <div className="grid md:grid-cols-5 gap-6">

              <JourneyCard
                number="1"
                title="Apply"
                text="Submit your entrepreneur application."
              />

              <JourneyCard
                number="2"
                title="Coach"
                text="Meet your assigned coach."
              />

              <JourneyCard
                number="3"
                title="Prepare"
                text="Develop your business and complete preparation."
              />

              <JourneyCard
                number="4"
                title="Funding"
                text="Become funding-ready and enter the queue."
              />

              <JourneyCard
                number="5"
                title="Launch"
                text="Open and begin growing your business."
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
              <p>You bring the vision.</p>
              <p>We develop the idea.</p>
              <p>We provide the ecosystem.</p>
              <p>We help you get the funding needed to launch your business.</p>
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
              Start Your Entrepreneur Journey
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
                Apply as an Entrepreneur
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