"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const APPLICATION_OPENING_DATE = new Date(
  "2026-07-29T00:00:00-04:00",
);

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOpen: boolean;
};

function getCountdown(): Countdown {
  const difference =
    APPLICATION_OPENING_DATE.getTime() - Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isOpen: true,
    };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor(
      (difference / (1000 * 60 * 60)) % 24,
    ),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isOpen: false,
  };
}

export default function HomePage() {
  const [countdown, setCountdown] = useState<Countdown>(
    getCountdown(),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const openingDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
      }).format(APPLICATION_OPENING_DATE),
    [],
  );

  return (
    <>
      <Navbar />

      <main className="bg-white text-[#06245c]">
        <section className="bg-[#06245c] px-6 py-4 text-center text-white">
          <p className="text-lg font-extrabold md:text-2xl">
            🚀 EPEW Public Preview Is Now Live
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-100 md:text-lg">
            Entrepreneur applications open on July 29, 2026.
            Explore the platform and prepare your business idea.
          </p>
        </section>

        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 text-center md:px-8">
            <div className="mb-12 flex justify-center md:mb-14">
              <Image
                src="/images/hero-main.png"
                alt="EPEW entrepreneur development platform"
                width={1300}
                height={760}
                className="rounded-3xl shadow-2xl"
                priority
              />
            </div>

            <div className="mx-auto mb-14 max-w-6xl rounded-3xl border-4 border-amber-400 bg-gradient-to-r from-[#06245c] via-blue-900 to-green-700 p-8 text-white shadow-2xl md:p-12">
              <p className="text-lg font-extrabold uppercase tracking-[0.25em] text-lime-300 md:text-2xl">
                Founding Entrepreneur Cohort 2026
              </p>

              {countdown.isOpen ? (
                <>
                  <h2 className="mt-5 text-4xl font-black md:text-7xl">
                    🎉 Applications Are Now Open
                  </h2>

                  <p className="mx-auto mt-5 max-w-3xl text-xl leading-relaxed text-blue-100 md:text-2xl">
                    Begin your Entrepreneur Development Ecosystem
                    journey today.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-5 text-4xl font-black md:text-6xl">
                    Entrepreneur Applications Open In
                  </h2>

                  <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                    <CountdownCard
                      value={countdown.days}
                      label="Days"
                    />
                    <CountdownCard
                      value={countdown.hours}
                      label="Hours"
                    />
                    <CountdownCard
                      value={countdown.minutes}
                      label="Minutes"
                    />
                    <CountdownCard
                      value={countdown.seconds}
                      label="Seconds"
                    />
                  </div>

                  <p className="mt-8 text-xl font-bold text-lime-200 md:text-3xl">
                    {openingDateLabel}
                  </p>
                </>
              )}

              <p className="mx-auto mt-8 max-w-4xl text-lg leading-relaxed text-white/90 md:text-2xl">
                Explore the program, watch our introduction, and
                prepare your business idea before applications open.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-5 md:flex-row">
                {countdown.isOpen ? (
                  <Link
                    href="/entrepreneurs/enroll"
                    className="w-full rounded-2xl bg-amber-400 px-10 py-5 text-xl font-extrabold text-[#06245c] transition hover:bg-amber-300 md:w-auto md:text-2xl"
                  >
                    Start Your Entrepreneur Journey
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-2xl bg-amber-400 px-10 py-5 text-xl font-extrabold text-[#06245c] opacity-90 md:w-auto md:text-2xl"
                  >
                    Applications Open July 29, 2026
                  </button>
                )}

                <Link
                  href="/entrepreneurs"
                  className="w-full rounded-2xl border-2 border-white px-10 py-5 text-xl font-extrabold text-white transition hover:bg-white hover:text-[#06245c] md:w-auto md:text-2xl"
                >
                  Explore the Entrepreneur Development Ecosystem
                </Link>
              </div>
            </div>

            <h1 className="mb-8 text-5xl font-extrabold leading-tight md:text-7xl">
              Growing Businesses.
              <br />
              Strengthening Communities.
              <br />
              Creating Lasting Wealth.
            </h1>

            <div className="mx-auto mb-12 max-w-6xl space-y-6 text-2xl leading-relaxed text-gray-700 md:text-3xl">
              <p className="font-bold text-[#06245c]">
                See how entrepreneurship grows businesses, strengthens
                communities, and creates lasting wealth.
              </p>

              <p>
                Understand how mutual participation and community
                support help entrepreneurs overcome the obstacles of
                individual development. Together, we prepare
                entrepreneurs, launch successful businesses, create
                jobs, and build stronger communities for generations
                to come.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
              {countdown.isOpen ? (
                <Link
                  href="/entrepreneurs/enroll"
                  className="rounded-2xl bg-green-600 px-12 py-5 text-2xl font-bold text-white transition hover:bg-green-700"
                >
                  Start Your Entrepreneur Journey
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-2xl bg-amber-400 px-12 py-5 text-2xl font-bold text-[#06245c]"
                >
                  Applications Open July 29, 2026
                </button>
              )}

              <Link
                href="/about"
                className="rounded-2xl border-2 border-[#06245c] px-12 py-5 text-2xl font-bold text-[#06245c] transition hover:bg-[#06245c] hover:text-white"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#f5f7fb] py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <p className="text-xl font-extrabold uppercase tracking-widest text-green-700">
              Public Preview
            </p>

            <h2 className="mt-3 text-5xl font-extrabold md:text-6xl">
              Explore EPEW Before Applications Open
            </h2>

            <p className="mx-auto mt-8 max-w-5xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
              Use the countdown period to understand the program,
              explore the Entrepreneur Development Ecosystem, and
              prepare your business idea.
            </p>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              <PreviewCard
                icon="📘"
                title="Learn About the Program"
                text="Understand how EPEW, EDE, and IBOS work together to guide entrepreneurs from idea to business launch."
              />
              <PreviewCard
                icon="🎥"
                title="Watch the Introduction"
                text="Learn how entrepreneurship, mutual participation, and community support create stronger businesses and lasting wealth."
              />
              <PreviewCard
                icon="💡"
                title="Prepare Your Business Idea"
                text="Begin organizing your vision, proposed product or service, goals, customers, and community impact."
              />
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-10 text-5xl font-extrabold md:text-6xl">
              Every Successful Business Begins with an Idea.
            </h2>

            <p className="mx-auto max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
              At EPEW, we believe ideas exist everywhere. What many
              entrepreneurs need is a coordinated ecosystem that
              helps transform that idea into a structured, funded,
              and successful business.
            </p>
          </div>
        </section>

        <section className="bg-[#f5f7fb] py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-10 text-5xl font-extrabold md:text-6xl">
              The EPEW Development Model
            </h2>

            <p className="mx-auto mb-16 max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
              EPEW develops entrepreneurs by guiding ideas through
              preparation, professional support, funding readiness,
              and business launch.
            </p>

            <div className="grid gap-6 md:grid-cols-5">
              <ModelCard
                icon="💡"
                title="1. The Entrepreneur Brings the Idea"
                text="The entrepreneur brings the vision, passion, and determination to build something meaningful."
              />
              <ModelCard
                icon="🏛️"
                title="2. EPEW Develops the Idea"
                text="EPEW transforms ideas into structured business opportunities through personal guidance, planning, and preparation."
              />
              <ModelCard
                icon="💰"
                title="3. EPEW Prepares & Connects Funding"
                text="EPEW prepares entrepreneurs and connects them with the structured funding system needed to launch their businesses."
              />
              <ModelCard
                icon="🌍"
                title="4. EPEW Provides the EDE"
                text="The Entrepreneur Development Ecosystem provides Personal Coaches, professional teams, supporters, and partners."
              />
              <ModelCard
                icon="⚙️"
                title="5. IBOS Coordinates the Journey"
                text="IBOS manages workflows, progress, communications, milestones, and funding readiness."
              />
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-10 text-5xl font-extrabold md:text-6xl">
              EPEW • EDE • IBOS
            </h2>

            <p className="mx-auto mb-16 max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
              EPEW develops the Entrepreneur Development Ecosystem
              and delivers it through the Intelligent Business
              Operating System.
            </p>

            <div className="grid gap-10 md:grid-cols-3">
              <PillarCard
                icon="🏛️"
                title="EPEW"
                subtitle="The Organization"
                text="EPEW creates opportunities, develops programs, builds partnerships, and leads the ecosystem."
              />
              <PillarCard
                icon="🌍"
                title="EDE"
                subtitle="The Ecosystem"
                text="The Entrepreneur Development Ecosystem develops entrepreneurs through Personal Coaches, services, support, and growth."
              />
              <PillarCard
                icon="⚙️"
                title="IBOS"
                subtitle="The Operating System"
                text="IBOS coordinates the journey, automates workflows, tracks progress, and connects the ecosystem."
              />
            </div>
          </div>
        </section>

        <section className="bg-[#f5f7fb] py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-10 text-5xl font-bold md:text-6xl">
              Entrepreneur Development Ecosystem
            </h2>

            <p className="mx-auto mb-16 max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
              EDE connects entrepreneurs, Personal Coaches,
              supporters, professional teams, and partners into one
              coordinated system focused on business development and
              long-term wealth creation.
            </p>

            <Image
              src="/images/ecosystem.png"
              alt="EPEW Entrepreneur Development Ecosystem"
              width={1300}
              height={850}
              className="mx-auto rounded-3xl shadow-2xl"
            />
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-10 text-5xl font-bold md:text-6xl">
              Your Entrepreneur Journey
            </h2>

            <p className="mx-auto mb-16 max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
              From idea to Personal Coach guidance, preparation,
              funding readiness, business opening, and growth, EPEW
              helps entrepreneurs move forward with structure and
              confidence.
            </p>

            <Image
              src="/images/epew-process.png"
              alt="EPEW Entrepreneur Journey"
              width={1300}
              height={850}
              className="mx-auto rounded-3xl shadow-2xl"
            />
          </div>
        </section>

        <section className="bg-[#f5f7fb] py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-8 text-5xl font-bold md:text-6xl">
              EPEW Presentation Video
            </h2>

            <p className="mx-auto mb-16 max-w-5xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
              Learn how EPEW develops entrepreneurs, strengthens
              businesses, and supports long-term community growth.
            </p>

            <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl shadow-2xl">
              <iframe
                className="aspect-video w-full"
                src="https://www.youtube.com/embed/ZR_L6Vx0p-U"
                title="EPEW Presentation Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        <section className="bg-[#06245c] py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-16 text-5xl font-bold text-white md:text-6xl">
              Why Entrepreneurs Choose EPEW
            </h2>

            <div className="grid gap-8 md:grid-cols-4">
              <WhyCard
                title="Business Development"
                text="We help entrepreneurs develop their ideas into structured business opportunities."
              />
              <WhyCard
                title="Professional Support"
                text="Entrepreneurs receive guidance, services, and support to build properly."
              />
              <WhyCard
                title="Structured Funding System"
                text="EPEW prepares entrepreneurs for access to a structured funding system after successful qualification."
              />
              <WhyCard
                title="Long-Term Growth"
                text="The journey continues after launch through reporting, support, and growth."
              />
            </div>
          </div>
        </section>

        <section className="bg-green-50 py-24">
          <div className="mx-auto max-w-7xl px-8">
            <div className="rounded-3xl border-4 border-green-500 bg-white p-12 text-center shadow-2xl">
              <h2 className="mb-10 text-5xl font-extrabold text-green-900 md:text-6xl">
                You Remain the Leader
              </h2>

              <div className="space-y-4 text-2xl font-bold text-green-950 md:text-3xl">
                <p>You are the owner.</p>
                <p>You make the decisions.</p>
                <p>You build the vision.</p>
                <p>EPEW does not run your business.</p>
                <p>
                  EPEW provides the ecosystem that helps your business
                  succeed.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-10 text-5xl font-extrabold md:text-6xl">
              A Global Entrepreneur Development Model
            </h2>

            <p className="mx-auto max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
              EPEW is building a global model that communities,
              organizations, institutions, nonprofits, and countries
              can adopt to help reduce poverty through
              entrepreneurship. Every idea can become a business when
              it receives structure, guidance, support, and funding.
            </p>
          </div>
        </section>

        <section className="bg-[#06245c] py-24 text-white">
          <div className="mx-auto max-w-6xl px-8 text-center">
            <h2 className="mb-12 text-5xl font-extrabold md:text-6xl">
              The EPEW Promise
            </h2>

            <div className="space-y-5 text-3xl font-black text-lime-300 md:text-4xl">
              <p>You bring the vision.</p>
              <p>We develop the idea.</p>
              <p>We provide the ecosystem.</p>
              <p>
                We prepare you and connect you with the structured
                funding system.
              </p>
            </div>

            <p className="mt-12 text-2xl leading-relaxed text-blue-100 md:text-3xl">
              Together, we build successful businesses, strengthen
              communities, and create lasting wealth.
            </p>

            <div className="mt-14">
              {countdown.isOpen ? (
                <Link
                  href="/entrepreneurs/enroll"
                  className="inline-flex rounded-2xl bg-green-600 px-12 py-5 text-2xl font-bold text-white transition hover:bg-green-700"
                >
                  Start Your Entrepreneur Journey
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-2xl bg-amber-400 px-12 py-5 text-2xl font-bold text-[#06245c]"
                >
                  Applications Open July 29, 2026
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function CountdownCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/10 p-5 backdrop-blur-sm md:p-7">
      <p className="text-4xl font-black text-white md:text-6xl">
        {String(value).padStart(2, "0")}
      </p>

      <p className="mt-2 text-sm font-extrabold uppercase tracking-widest text-lime-300 md:text-lg">
        {label}
      </p>
    </div>
  );
}

function PreviewCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
      <div className="text-6xl">{icon}</div>

      <h3 className="mt-5 text-3xl font-extrabold">
        {title}
      </h3>

      <p className="mt-4 text-xl leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}

function ModelCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
      <div className="mb-5 text-6xl">{icon}</div>

      <h3 className="mb-4 text-2xl font-extrabold">
        {title}
      </h3>

      <p className="text-lg leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}

function PillarCard({
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
    <div className="rounded-3xl bg-[#f5f7fb] p-10 text-center shadow-xl">
      <div className="mb-6 text-7xl">{icon}</div>

      <h3 className="text-5xl font-extrabold">{title}</h3>

      <p className="mt-3 text-2xl font-bold text-green-700">
        {subtitle}
      </p>

      <p className="mt-6 text-2xl leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}

function WhyCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl">
      <h3 className="mb-6 text-3xl font-bold text-[#06245c]">
        {title}
      </h3>

      <p className="text-2xl leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}