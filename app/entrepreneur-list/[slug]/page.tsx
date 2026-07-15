import Image from "next/image";

export default function EntrepreneurDetailPage() {
  return (
    <main className="bg-white text-[#06245c]">

      {/* HERO */}
      <section className="py-24 bg-[#f5f7fb]">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-14 items-center">

          <Image
            src="/images/entrepreneur-sample-1.png"
            alt="Entrepreneur"
            width={700}
            height={700}
            className="rounded-3xl shadow-2xl"
            priority
          />

          <div>
            <h1 className="text-7xl font-extrabold mb-8">
              Doe Coffee Shop
            </h1>

            <p className="text-3xl text-gray-700 mb-6">
              John Doe • Restaurant • Brooklyn, NY
            </p>

            <p className="text-3xl text-gray-700 leading-relaxed mb-10">
              A community-focused coffee shop preparing to create jobs,
              serve local families, and strengthen neighborhood business growth.
            </p>

            <a
              href="/support"
              className="bg-[#06245c] text-white px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition inline-block"
            >
              Support This Entrepreneur
            </a>
          </div>

        </div>
      </section>

      {/* VIDEO PRESENTATION */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 text-center">

          <h2 className="text-6xl font-bold mb-12">
            Business Presentation
          </h2>

          <div className="aspect-video bg-[#06245c] rounded-3xl shadow-2xl flex items-center justify-center mb-12">
            <p className="text-4xl text-white font-bold">
              Video Presentation Placeholder
            </p>
          </div>

          <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
            Watch this entrepreneur explain the business idea,
            the community need, the launch plan, and how supporter
            participation can help move the business forward.
          </p>

        </div>
      </section>

      {/* SUPPORT PROGRESS */}
      <section className="py-24 bg-[#f5f7fb]">
        <div className="max-w-6xl mx-auto px-8 text-center">

          <h2 className="text-6xl font-bold mb-12">
            Support Progress
          </h2>

          <div className="bg-white rounded-3xl p-14 shadow-2xl">

            <div className="flex justify-between text-3xl font-bold mb-6">
              <span>14 / 20 Units Supported</span>
              <span>70%</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-8 mb-10">
              <div className="bg-green-600 h-8 rounded-full" style={{ width: "70%" }} />
            </div>

            <p className="text-2xl text-gray-700 leading-relaxed">
              This entrepreneur remains listed until the current
              20-unit support goal is completed.
            </p>

          </div>

        </div>
      </section>

      {/* BUSINESS DETAILS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-10">

          <div className="bg-[#f5f7fb] rounded-3xl p-10 shadow-xl">
            <h3 className="text-4xl font-bold mb-6">
              Business Goal
            </h3>
            <p className="text-2xl text-gray-700 leading-relaxed">
              Open a neighborhood coffee shop that serves quality products,
              creates local jobs, and builds a welcoming community space.
            </p>
          </div>

          <div className="bg-[#f5f7fb] rounded-3xl p-10 shadow-xl">
            <h3 className="text-4xl font-bold mb-6">
              Community Impact
            </h3>
            <p className="text-2xl text-gray-700 leading-relaxed">
              This business aims to support local employment,
              community connection, and neighborhood economic activity.
            </p>
          </div>

          <div className="bg-[#f5f7fb] rounded-3xl p-10 shadow-xl">
            <h3 className="text-4xl font-bold mb-6">
              Coach Status
            </h3>
            <p className="text-2xl text-gray-700 leading-relaxed">
              This entrepreneur is working through the EPEW preparation
              and validation process with coach guidance.
            </p>
          </div>

        </div>
      </section>

      {/* PARTICIPATION OPTIONS */}
      <section className="py-24 bg-[#06245c] text-white">
        <div className="max-w-7xl mx-auto px-8 text-center">

          <h2 className="text-6xl font-bold mb-12">
            Choose Participation Option
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            <div className="bg-white text-[#06245c] rounded-3xl p-10 shadow-xl">
              <h3 className="text-4xl font-bold mb-6">Weekly</h3>
              <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                Participate through weekly structured contribution options.
              </p>
              <p className="text-2xl font-bold text-green-700">
                Up to 6% annual participation benefit
              </p>
            </div>

            <div className="bg-white text-[#06245c] rounded-3xl p-10 shadow-xl">
              <h3 className="text-4xl font-bold mb-6">Monthly</h3>
              <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                Participate through monthly structured contribution options.
              </p>
              <p className="text-2xl font-bold text-green-700">
                Up to 6% annual participation benefit
              </p>
            </div>

            <div className="bg-white text-[#06245c] rounded-3xl p-10 shadow-xl border-4 border-[#f4c542]">
              <h3 className="text-4xl font-bold mb-6">Annual</h3>
              <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                Participate with 52 units one-time annual participation.
              </p>
              <p className="text-2xl font-bold text-green-700">
                Up to 7% annual participation benefit consideration
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* NOTICE */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-8 text-center">

          <h2 className="text-5xl font-bold mb-10">
            Important Notice
          </h2>

          <p className="text-2xl text-gray-700 leading-relaxed">
            EPEW is not an investment platform. Participation benefits
            are not guaranteed and depend on entrepreneur performance,
            business activity, ecosystem conditions, and program structure.
          </p>

        </div>
      </section>

    </main>
  );
}