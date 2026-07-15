"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="bg-white text-[#06245c]">
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <div className="flex justify-center mb-14">
              <Image
                src="/images/hero-epew.png"
                alt="Ekero Partners Empower Wealth"
                width={1300}
                height={760}
                className="rounded-3xl shadow-2xl"
                priority
              />
            </div>

            <h1 className="text-6xl md:text-7xl font-extrabold mb-10">
              About Ekero Partners Empower Wealth
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              EPEW develops entrepreneurs through a coordinated Entrepreneur
              Development Ecosystem designed to transform ideas into successful
              businesses, stronger communities, and lasting wealth.
            </p>
          </div>
        </section>

        <section className="bg-[#f5f7fb] py-24">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <Image
              src="/images/about-epew.png"
              alt="About EPEW"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto"
            />

            <h2 className="text-6xl font-extrabold mt-16 mb-10">
              Who We Are
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              EPEW is more than a business support platform. It is a structured
              entrepreneurship development model created to help people develop
              business ideas, receive professional guidance, prepare for funding,
              open businesses, create jobs, and build wealth through
              entrepreneurship.
            </p>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              Every Successful Business Begins with an Idea
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              Ideas exist everywhere. What many entrepreneurs need is structure,
              guidance, professional support, funding readiness, and a
              coordinated ecosystem that helps transform their idea into a
              successful business.
            </p>
          </div>
        </section>

        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              The EPEW Development Model
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-16">
              EPEW guides entrepreneurs through a complete development process
              from idea to business readiness, funding connection, launch, and
              long-term growth.
            </p>

            <div className="grid md:grid-cols-5 gap-6">
              <ModelCard
                icon="💡"
                title="1. The Entrepreneur Brings the Idea"
                text="Every successful business begins with an idea. The entrepreneur brings the vision, passion, and determination."
              />

              <ModelCard
                icon="🏛️"
                title="2. EPEW Develops the Idea"
                text="EPEW helps transform ideas into structured business opportunities through coaching, planning, and guidance."
              />

              <ModelCard
                icon="💰"
                title="3. EPEW Prepares and Connects Funding"
                text="EPEW prepares entrepreneurs and connects them with the funding needed to launch and grow their businesses."
              />

              <ModelCard
                icon="🌍"
                title="4. EPEW Provides the EDE"
                text="The Entrepreneur Development Ecosystem brings together coaches, professional teams, supporters, partners, and resources."
              />

              <ModelCard
                icon="🤖"
                title="5. IBOS Coordinates the Journey"
                text="IBOS manages workflows, communications, service requests, milestones, progress tracking, and funding readiness."
              />
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              EPEW • EDE • IBOS
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-16">
              EPEW develops the Entrepreneur Development Ecosystem and delivers
              it through the Intelligent Business Operating System.
            </p>

            <div className="grid md:grid-cols-3 gap-10">
              <PillarCard
                icon="🏛️"
                title="EPEW"
                subtitle="The Organization"
                text="EPEW provides the vision, leadership, programs, partnerships, and standards that guide the ecosystem."
              />

              <PillarCard
                icon="🌍"
                title="EDE"
                subtitle="The Ecosystem"
                text="The Entrepreneur Development Ecosystem brings together the people, services, systems, and resources entrepreneurs need."
              />

              <PillarCard
                icon="🤖"
                title="IBOS"
                subtitle="The Operating System"
                text="IBOS coordinates the journey, manages workflows, tracks progress, and connects entrepreneurs with support."
              />
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <Image
              src="/images/our-mission.png"
              alt="Our Mission"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto"
            />

            <h2 className="text-6xl font-extrabold mt-16 mb-10">
              Our Mission
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              Our mission is to develop entrepreneurs by providing coaching,
              professional guidance, business development, community support,
              and funding readiness so they can transform ideas into successful
              businesses.
            </p>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <Image
              src="/images/our-vision.png"
              alt="Our Vision"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto"
            />

            <h2 className="text-6xl font-extrabold mt-16 mb-10">
              Our Vision
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              Our vision is to build a global Entrepreneur Development Model
              that communities, organizations, nonprofits, institutions, and
              countries can adopt to help reduce poverty through
              entrepreneurship.
            </p>
          </div>
        </section>

        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8">
            <Image
              src="/images/our-value.png"
              alt="Our Values"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <div className="text-center mb-20">
              <h2 className="text-6xl font-extrabold mb-10">Our Values</h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                EPEW is guided by principles that promote responsible
                entrepreneurship, transparency, collaboration, accountability,
                and sustainable community-centered growth.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <ValueCard
                icon="🤝"
                title="Collaboration"
                text="Stronger businesses are built through shared effort, professional support, and community participation."
              />

              <ValueCard
                icon="📊"
                title="Accountability"
                text="Entrepreneurs move forward with structure, responsibility, measurable progress, and clear expectations."
              />

              <ValueCard
                icon="🌱"
                title="Sustainability"
                text="We focus on long-term business development, not short-term opportunity."
              />

              <ValueCard
                icon="🧭"
                title="Integrity"
                text="EPEW promotes fairness, honesty, transparency, and ethical business development."
              />

              <ValueCard
                icon="🚀"
                title="Empowerment"
                text="We help entrepreneurs gain the tools, confidence, support, and structure needed to succeed."
              />

              <ValueCard
                icon="🌍"
                title="Community Impact"
                text="Every successful business can create jobs, strengthen families, and contribute to stronger communities."
              />
            </div>
          </div>
        </section>

        <section className="bg-[#06245c] py-24 text-white">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <Image
              src="/images/why-epew-exists.png"
              alt="Why EPEW Exists"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto"
            />

            <h2 className="text-6xl font-extrabold mt-16 mb-10">
              Why EPEW Exists
            </h2>

            <p className="text-3xl text-blue-100 leading-relaxed max-w-6xl mx-auto">
              EPEW exists because many people have ideas, but not everyone has
              access to the structure, guidance, professional support, and
              funding pathway needed to turn those ideas into successful
              businesses.
            </p>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-12">
              The EPEW Promise
            </h2>

            <div className="space-y-5 text-4xl font-black text-green-700">
              <p>You bring the vision.</p>
              <p>We develop the idea.</p>
              <p>We provide the ecosystem.</p>
              <p>We prepare you and connect you with the funding needed.</p>
            </div>

            <p className="mt-12 text-3xl leading-relaxed text-gray-700">
              Together, we build successful businesses, strengthen communities,
              and create lasting wealth.
            </p>
          </div>
        </section>

        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <Image
              src="/images/join-the-epew.png"
              alt="Join the EPEW Ecosystem"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <h2 className="text-7xl font-extrabold mb-12">
              Join the EPEW Ecosystem
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-5xl mx-auto mb-14">
              Whether you are an entrepreneur, supporter, coach, or partner,
              EPEW invites you to become part of a coordinated ecosystem focused
              on business development, community growth, and lasting wealth.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <Link
                href="/entrepreneurs"
                className="bg-[#06245c] text-white px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
              >
                Become an Entrepreneur
              </Link>

              <Link
                href="/supporters"
                className="bg-green-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
              >
                Become a Supporter
              </Link>

              <Link
                href="/coaches"
                className="border-2 border-[#06245c] text-[#06245c] px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-[#06245c] hover:text-white transition"
              >
                Become a Coach
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <h2 className="text-5xl font-bold mb-10">
              Important Disclosure
            </h2>

            <p className="text-2xl text-gray-700 leading-relaxed">
              EPEW is not an investment platform. Contributions are structured
              as community participation. Participation benefits are not
              guaranteed and depend on business performance and program
              conditions.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
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
    <div className="bg-white rounded-3xl p-6 shadow-xl text-center">
      <div className="text-6xl mb-5">{icon}</div>
      <h3 className="text-2xl font-extrabold mb-4">{title}</h3>
      <p className="text-lg text-gray-700 leading-relaxed">{text}</p>
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
    <div className="bg-[#f5f7fb] rounded-3xl p-10 shadow-xl text-center">
      <div className="text-7xl mb-6">{icon}</div>
      <h3 className="text-5xl font-extrabold">{title}</h3>
      <p className="text-2xl font-bold text-green-700 mt-3">{subtitle}</p>
      <p className="text-2xl text-gray-700 leading-relaxed mt-6">{text}</p>
    </div>
  );
}

function ValueCard({
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
      <div className="text-7xl mb-8">{icon}</div>
      <h3 className="text-3xl font-bold mb-6">{title}</h3>
      <p className="text-2xl text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}