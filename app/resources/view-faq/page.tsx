import Link from "next/link";

export default function ViewFaqPage() {
  return (
    <main className="min-h-screen bg-white text-[#06245c]">
      <section className="bg-[#f5f7fb] py-24">
        <div className="mx-auto max-w-6xl px-8 text-center">
          <h1 className="text-6xl font-extrabold md:text-7xl">
            Frequently Asked Questions
          </h1>

          <p className="mx-auto mt-8 max-w-5xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
            Find clear information about entrepreneur participation,
            supporter participation, Personal Coach guidance, the
            Entrepreneur Development Ecosystem, and the EPEW program.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-6xl gap-8 px-8 md:grid-cols-2">
          <Link
            href="/resources/entrepreneur-faq"
            className="rounded-3xl bg-[#f5f7fb] p-10 shadow-xl transition hover:shadow-2xl"
          >
            <h2 className="text-4xl font-extrabold">
              Entrepreneur FAQ
            </h2>

            <p className="mt-5 text-2xl leading-relaxed text-gray-700">
              Learn about eligibility, enrollment, coaching,
              preparation, qualification, funding readiness, and
              business launch.
            </p>
          </Link>

          <Link
            href="/resources/supporter-faq"
            className="rounded-3xl bg-[#f5f7fb] p-10 shadow-xl transition hover:shadow-2xl"
          >
            <h2 className="text-4xl font-extrabold">
              Supporter FAQ
            </h2>

            <p className="mt-5 text-2xl leading-relaxed text-gray-700">
              Learn about participation, community support,
              transparency, reporting, benefits, and business impact.
            </p>
          </Link>
        </div>
      </section>

      <section className="bg-[#06245c] py-20 text-white">
        <div className="mx-auto max-w-5xl px-8 text-center">
          <h2 className="text-4xl font-extrabold md:text-5xl">
            Still Have Questions?
          </h2>

          <p className="mt-6 text-2xl leading-relaxed text-blue-100">
            Explore the complete EPEW Resources Center or contact our
            team for additional information.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-5 md:flex-row">
            <Link
              href="/resources"
              className="rounded-2xl bg-green-600 px-10 py-5 text-2xl font-bold text-white transition hover:bg-green-700"
            >
              Return to Resources
            </Link>

            <Link
              href="/contact"
              className="rounded-2xl border-2 border-white px-10 py-5 text-2xl font-bold text-white transition hover:bg-white hover:text-[#06245c]"
            >
              Contact EPEW
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}