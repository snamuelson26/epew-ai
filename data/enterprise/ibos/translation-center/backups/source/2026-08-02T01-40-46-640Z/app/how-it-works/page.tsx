"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function HowItWorksPage() {
  const steps = [
    [
      "1",
      "The Entrepreneur Brings the Idea",
      "Every successful business begins with an idea. The entrepreneur brings the vision, passion, and determination.",
    ],
    [
      "2",
      "EPEW Develops the Idea",
      "EPEW transforms the idea into a structured business opportunity through coaching, planning, and professional guidance.",
    ],
    [
      "3",
      "EPEW Prepares the Entrepreneur",
      "EPEW prepares the entrepreneur for business ownership, funding readiness, and long-term growth.",
    ],
    [
      "4",
      "EPEW Provides the Ecosystem",
      "EPEW provides the Entrepreneur Development Ecosystem with coaches, professional support, supporters, and partners.",
    ],
    [
      "5",
      "IBOS Coordinates the Journey",
      "IBOS coordinates preparation, services, milestones, communications, funding readiness, and business growth.",
    ],
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="bg-white px-8 py-20 text-center">
          <div className="mx-auto max-w-7xl">
            <Image
              src="/images/epew-process.png"
              alt="How EPEW Helps Entrepreneurs Build Real Businesses"
              width={1600}
              height={1000}
              className="mx-auto mb-16 rounded-3xl shadow-2xl"
              priority
            />

            <h1 className="mb-12 text-7xl font-extrabold">
              How EPEW Works
            </h1>

            <div className="mx-auto max-w-6xl text-left">
              <h2 className="mb-10 text-center text-4xl font-bold">
                The Official EPEW Development Process
              </h2>

              <ul className="space-y-8 text-3xl leading-relaxed text-gray-700">
                <li>
                  <strong>1. The Entrepreneur Brings the Idea</strong>
                  <br />
                  Every successful business begins with an idea. The entrepreneur
                  brings the vision, passion, and determination to build
                  something meaningful.
                </li>

                <li>
                  <strong>2. EPEW Develops the Idea</strong>
                  <br />
                  EPEW develops the idea into a structured business opportunity
                  through education, coaching, planning, professional guidance,
                  and business development.
                </li>

                <li>
                  <strong>
                    3. EPEW Prepares the Entrepreneur and Connects Funding
                  </strong>
                  <br />
                  EPEW prepares the entrepreneur for business ownership, funding
                  readiness, and connects them with the funding needed to launch
                  and grow.
                </li>

                <li>
                  <strong>
                    4. EPEW Provides the Entrepreneur Development Ecosystem
                    (EDE)
                  </strong>
                  <br />
                  The EDE brings together coaches, professional teams, Founding
                  Supporters, Certified Growth Partners, technology, and
                  coordinated resources into one complete support system.
                </li>

                <li>
                  <strong>5. IBOS Coordinates the Journey</strong>
                  <br />
                  IBOS coordinates preparation, professional services, business
                  development, milestones, communications, service requests,
                  funding readiness, and long-term business growth.
                </li>
              </ul>

              <div className="mt-16 rounded-3xl border-l-8 border-green-600 bg-green-50 p-10">
                <h3 className="mb-6 text-4xl font-extrabold text-green-800">
                  The Result
                </h3>

                <ul className="space-y-4 text-2xl font-semibold text-gray-700">
                  <li>✅ Successful Entrepreneur</li>
                  <li>✅ Successful Business</li>
                  <li>✅ New Jobs</li>
                  <li>✅ Stronger Families</li>
                  <li>✅ Stronger Communities</li>
                  <li>✅ Lasting Wealth</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-24">
          <h2 className="mb-10 text-center text-6xl font-extrabold">
            The EPEW Development Model
          </h2>

          <p className="mx-auto mb-16 max-w-6xl text-center text-3xl leading-relaxed text-gray-700">
            The development model below shows how EPEW transforms an
            entrepreneur’s idea into a successful business through preparation,
            coordinated support, professional services, the Entrepreneur
            Development Ecosystem, and IBOS.
          </p>

          <div className="grid gap-6 md:grid-cols-5">
            {steps.map(([number, title, text]) => (
              <div
                key={number}
                className="rounded-3xl bg-white p-8 text-center shadow-xl"
              >
                <div className="mb-6 text-6xl font-extrabold text-green-600">
                  {number}
                </div>
                <h3 className="mb-4 text-2xl font-black">{title}</h3>
                <p className="text-lg leading-relaxed text-gray-700">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white px-8 py-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="mb-10 text-6xl font-extrabold">
              EPEW • EDE • IBOS
            </h2>

            <div className="grid gap-10 md:grid-cols-3">
              <Card
                icon="🏛️"
                title="EPEW"
                subtitle="The Organization"
                text="EPEW develops the programs, partnerships, standards, and opportunities that support entrepreneurs."
              />

              <Card
                icon="🌍"
                title="EDE"
                subtitle="The Ecosystem"
                text="The Entrepreneur Development Ecosystem brings coaching, professional support, partners, and community together."
              />

              <Card
                icon="🤖"
                title="IBOS"
                subtitle="The Operating System"
                text="IBOS coordinates the journey, tracks progress, manages workflows, and supports funding readiness."
              />
            </div>
          </div>
        </section>

        <section className="bg-[#06245c] px-8 py-24 text-white">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="mb-8 text-6xl font-extrabold">
              One Ecosystem. Clear Steps. Shared Growth.
            </h2>

            <p className="mb-12 text-3xl leading-relaxed text-blue-100">
              EPEW helps entrepreneurs move from idea to structure, from
              preparation to funding readiness, and from business launch to
              long-term growth.
            </p>

            <div className="flex flex-col justify-center gap-8 md:flex-row">
              <Link
                href="/entrepreneurs"
                className="rounded-2xl bg-green-600 px-12 py-5 text-2xl font-bold hover:bg-green-700"
              >
                Apply as Entrepreneur
              </Link>

              <Link
                href="/supporters"
                className="rounded-2xl bg-white px-12 py-5 text-2xl font-bold text-[#06245c] hover:bg-gray-200"
              >
                Become a Supporter
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
    <div className="rounded-3xl bg-[#f5f7fb] p-10 shadow-xl">
      <div className="mb-6 text-7xl">{icon}</div>
      <h3 className="text-5xl font-extrabold">{title}</h3>
      <p className="mt-3 text-2xl font-bold text-green-700">{subtitle}</p>
      <p className="mt-6 text-2xl leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}