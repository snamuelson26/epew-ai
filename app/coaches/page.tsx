"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function CoachesPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-[#06245c]">
        {/* HERO */}
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <Image
              src="/images/coaches-hero.png"
              alt="Coach mentoring entrepreneurs"
              width={1600}
              height={900}
              className="w-full rounded-3xl shadow-2xl object-cover mb-16"
              priority
            />

            <h1 className="text-7xl font-extrabold mb-8">
              Your Coach. Your Guide. Your Accountability Partner.
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-12">
              Every entrepreneur is assigned a trained EPEW Business Coach who
              serves as a trusted guide throughout the entrepreneurial journey.
            </p>

            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <Link
                href="/coaches/login"
                className="bg-[#06245c] text-white px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
              >
                Coach Login
              </Link>

              <Link
                href="/coaches/apply"
                className="bg-green-600 text-white px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
              >
                Apply as a Coach
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
                  alt="Coach supporting entrepreneur"
                  width={900}
                  height={900}
                  className="rounded-3xl shadow-2xl w-full h-auto"
                />
              </div>

              <div>
                <h2 className="text-6xl font-extrabold mb-10">
                  No Entrepreneur Should Walk the Journey Alone.
                </h2>

                <p className="text-3xl text-gray-700 leading-relaxed mb-8">
                  Every entrepreneur deserves someone who believes in their
                  potential, understands their challenges, and helps them stay
                  focused on the path to success.
                </p>

                <p className="text-3xl text-gray-700 leading-relaxed">
                  An EPEW Coach becomes a trusted advisor, mentor, facilitator,
                  and accountability partner who helps entrepreneurs move
                  confidently from idea to successful business ownership.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT DOES A COACH DO */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              What Does an EPEW Coach Do?
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              A business coach partners with entrepreneurs to develop their
              business ideas, clarify their vision, establish strategic goals,
              and build actionable plans that move them toward business success.
            </p>
          </div>
        </section>

        {/* COACH ROLES */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-extrabold mb-10">
                The Role of an EPEW Coach
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                Our trained coaches serve as strategic advisors, facilitators,
                and accountability partners who empower entrepreneurs to unlock
                their potential, strengthen their skills, overcome roadblocks,
                and drive sustainable growth.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <CoachCard
                icon="🧭"
                title="Strategic Advisor"
                text="Helping entrepreneurs make informed business decisions and strengthen their business direction."
              />

              <CoachCard
                icon="🏢"
                title="Business Development Partner"
                text="Transforming ideas into structured business opportunities through planning and preparation."
              />

              <CoachCard
                icon="🤝"
                title="Facilitator"
                text="Connecting entrepreneurs with professional support, service requests, and ecosystem resources."
              />

              <CoachCard
                icon="📋"
                title="Accountability Partner"
                text="Helping entrepreneurs stay focused on milestones, responsibilities, readiness, and commitments."
              />

              <CoachCard
                icon="🌱"
                title="Leadership Mentor"
                text="Developing confidence, leadership skills, entrepreneurial thinking, and responsible decision-making."
              />

              <CoachCard
                icon="🤖"
                title="IBOS Coordinator"
                text="Using IBOS to monitor progress, update milestones, coordinate workflows, and track entrepreneur readiness."
              />
            </div>
          </div>
        </section>

        {/* WHAT COACHES HELP ACCOMPLISH */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-extrabold mb-10">
                What Coaches Help Entrepreneurs Accomplish
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                EPEW coaches help entrepreneurs move from ideas to organized,
                prepared, and business-ready opportunities.
              </p>
            </div>

            <div className="bg-[#f5f7fb] rounded-3xl shadow-2xl p-12">
              <div className="grid md:grid-cols-3 gap-8 text-2xl text-gray-700">
                <p>✅ Develop business ideas</p>
                <p>✅ Clarify business vision</p>
                <p>✅ Build strategic goals</p>
                <p>✅ Prepare business plans</p>
                <p>✅ Coordinate professional services</p>
                <p>✅ Monitor entrepreneur progress</p>
                <p>✅ Prepare funding readiness</p>
                <p>✅ Guide business launch</p>
                <p>✅ Strengthen businesses</p>
              </div>
            </div>
          </div>
        </section>

                {/* COACH JOURNEY */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              The EPEW Coach Journey
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-16">
              EPEW coaches guide entrepreneurs through a structured development
              journey from assignment to business growth.
            </p>

            <div className="grid md:grid-cols-5 gap-6">
              <StepCard
                number="1"
                title="Assignment"
                text="An entrepreneur is matched with an EPEW Coach."
              />

              <StepCard
                number="2"
                title="Discovery"
                text="The coach learns the entrepreneur’s goals, vision, strengths, and challenges."
              />

              <StepCard
                number="3"
                title="Development"
                text="The entrepreneur receives coaching, preparation, and business development support."
              />

              <StepCard
                number="4"
                title="Readiness"
                text="The coach helps prepare the entrepreneur for funding readiness and business launch."
              />

              <StepCard
                number="5"
                title="Growth"
                text="The coach continues supporting accountability and business progress."
              />
            </div>
          </div>
        </section>

        {/* COACHING PHILOSOPHY */}
        <section className="py-24 bg-[#06245c] text-white">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              The EPEW Coaching Philosophy
            </h2>

            <p className="text-3xl text-blue-100 leading-relaxed">
              We believe entrepreneurs succeed when they receive consistent
              guidance, accountability, preparation, encouragement, and
              professional support. EPEW coaches do not build businesses for
              entrepreneurs. They develop entrepreneurs who build successful
              businesses.
            </p>
          </div>
        </section>

        {/* COACH QUALIFICATIONS */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-extrabold mb-10">
                Who Can Become an EPEW Coach?
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
                title="Business Professionals"
                text="Professionals with experience in business, management, operations, finance, or consulting."
              />

              <CoachCard
                icon="🏢"
                title="Entrepreneurs"
                text="Experienced entrepreneurs who understand the challenges of building and growing a business."
              />

              <CoachCard
                icon="🎓"
                title="Educators"
                text="Teachers, trainers, and mentors who know how to guide people through learning and development."
              />

              <CoachCard
                icon="🌍"
                title="Community Leaders"
                text="Leaders committed to strengthening communities through entrepreneurship and economic opportunity."
              />

              <CoachCard
                icon="🧓"
                title="Retired Executives"
                text="Retired professionals who want to use their experience to guide new entrepreneurs."
              />

              <CoachCard
                icon="🤝"
                title="Service-Minded Professionals"
                text="Individuals passionate about helping entrepreneurs unlock potential and build sustainable businesses."
              />
            </div>
          </div>
        </section>

        {/* COACH RESPONSIBILITIES */}
        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-extrabold mb-10">
                Coach Responsibilities
              </h2>

              <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
                EPEW coaches support entrepreneurs through guidance,
                accountability, milestone review, and coordinated preparation.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-12">
              <div className="grid md:grid-cols-3 gap-8 text-2xl text-gray-700">
                <p>✅ Guide entrepreneurs</p>
                <p>✅ Monitor progress</p>
                <p>✅ Conduct interviews</p>
                <p>✅ Review questionnaires</p>
                <p>✅ Coordinate professional support</p>
                <p>✅ Approve milestones</p>
                <p>✅ Prepare funding readiness</p>
                <p>✅ Encourage accountability</p>
                <p>✅ Support business growth</p>
              </div>
            </div>
          </div>
        </section>

        {/* COACH IMPACT */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <Image
              src="/images/coach-impact.png"
              alt="Coach Impact"
              width={1400}
              height={900}
              className="rounded-3xl shadow-2xl mx-auto mb-16"
            />

            <h2 className="text-6xl font-extrabold mb-10">
              Every Great Entrepreneur Has Someone Who Believed in Them.
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
                The Coach’s Commitment
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
              No Entrepreneur Should Walk the Journey Alone.
            </h2>

            <div className="space-y-5 text-4xl font-black text-lime-300">
              <p>The entrepreneur brings the vision.</p>
              <p>The coach develops the entrepreneur.</p>
              <p>EPEW provides the ecosystem.</p>
              <p>Together, we build successful businesses.</p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-7xl font-extrabold mb-10">
              Become an EPEW Coach
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
                Apply as a Coach
              </Link>

              <Link
                href="/coaches/login"
                className="border-2 border-[#06245c] text-[#06245c] px-14 py-6 rounded-2xl text-2xl font-bold hover:bg-[#06245c] hover:text-white transition"
              >
                Coach Login
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