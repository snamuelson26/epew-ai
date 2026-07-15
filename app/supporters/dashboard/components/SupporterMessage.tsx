"use client";

interface Props {
  participationType?: string;
  nextPaymentDate?: string;
}

export default function SupporterMessage({
  participationType = "weekly",
  nextPaymentDate = "To Be Scheduled",
}: Props) {
  const normalizedType = participationType.toLowerCase();

  if (normalizedType.includes("annual")) {
    return <AnnualSupporterMessage />;
  }

  if (normalizedType.includes("monthly")) {
    return <MonthlySupporterMessage nextPaymentDate={nextPaymentDate} />;
  }

  return <WeeklySupporterMessage nextPaymentDate={nextPaymentDate} />;
}

function WeeklySupporterMessage({
  nextPaymentDate,
}: {
  nextPaymentDate: string;
}) {
  return (
    <section className="mb-10">
      <div className="rounded-3xl border-l-8 border-green-600 bg-green-50 p-10 shadow-2xl">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          💚 A Special Message from EPEW
        </h2>

        <h3 className="mt-6 text-3xl font-extrabold text-green-800">
          Thank You for Your Weekly Participation
        </h3>

        <p className="mt-5 text-2xl leading-relaxed text-gray-700">
          We sincerely appreciate your weekly effort to help entrepreneurs move
          closer to business ownership. Your continued participation helps your
          supported entrepreneur and strengthens the entire entrepreneur group.
        </p>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow">
          <p className="text-xl font-bold text-gray-600">
            Next Weekly Participation
          </p>

          <p className="mt-2 text-4xl font-black text-[#06245c]">
            {nextPaymentDate}
          </p>

          <p className="mt-4 text-xl leading-relaxed text-gray-700">
            This reminder is not only about payment. It is a reminder that your
            weekly participation helps entrepreneurs continue moving through the
            EPEW Entrepreneur Development Journey.
          </p>
        </div>

        <AnnualUpgradeMessage />
      </div>
    </section>
  );
}

function MonthlySupporterMessage({
  nextPaymentDate,
}: {
  nextPaymentDate: string;
}) {
  return (
    <section className="mb-10">
      <div className="rounded-3xl border-l-8 border-blue-600 bg-blue-50 p-10 shadow-2xl">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          💚 A Special Message from EPEW
        </h2>

        <h3 className="mt-6 text-3xl font-extrabold text-blue-800">
          Thank You for Your Monthly Participation
        </h3>

        <p className="mt-5 text-2xl leading-relaxed text-gray-700">
          We appreciate your monthly commitment to entrepreneur development.
          Your participation helps your supported entrepreneur and contributes
          to the progress of the broader entrepreneur cohort.
        </p>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow">
          <p className="text-xl font-bold text-gray-600">
            Next Monthly Participation
          </p>

          <p className="mt-2 text-4xl font-black text-[#06245c]">
            {nextPaymentDate}
          </p>

          <p className="mt-4 text-xl leading-relaxed text-gray-700">
            Your monthly participation helps EPEW continue organizing,
            preparing, and supporting entrepreneurs toward business ownership.
          </p>
        </div>

        <AnnualUpgradeMessage />
      </div>
    </section>
  );
}

function AnnualSupporterMessage() {
  return (
    <section className="mb-10">
      <div className="rounded-3xl border-l-8 border-lime-500 bg-lime-50 p-10 shadow-2xl">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          🌟 Thank You for Choosing Annual Participation
        </h2>

        <p className="mt-6 text-2xl leading-relaxed text-gray-700">
          Your annual commitment helps EPEW organize entrepreneur funding more
          efficiently and supports the development of your entrepreneur group.
          Annual participation helps entrepreneurs move closer to funding,
          business opening, and long-term community impact.
        </p>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow">
          <h3 className="text-3xl font-extrabold text-[#06245c]">
            More Entrepreneurs Need Support
          </h3>

          <p className="mt-4 text-2xl leading-relaxed text-gray-700">
            Additional qualified entrepreneurs are currently preparing for
            funding and are seeking supporters to help them move through the
            EPEW Entrepreneur Development Journey.
          </p>

          <a
            href="/supporters/marketplace"
            className="mt-8 inline-block rounded-2xl bg-[#06245c] px-8 py-4 text-xl font-black text-white hover:bg-green-700"
          >
            Explore the Marketplace
          </a>
        </div>
      </div>
    </section>
  );
}

function AnnualUpgradeMessage() {
  return (
    <div className="mt-8 rounded-3xl bg-white p-8 shadow">
      <h3 className="text-3xl font-extrabold text-[#06245c]">
        🚀 Want to Help Your Entrepreneurs Reach Funding Sooner?
      </h3>

      <p className="mt-4 text-2xl leading-relaxed text-gray-700">
        You may change your participation schedule from weekly or monthly to
        annual participation at any time. Annual participation can help your
        supported entrepreneur reach funding earlier than expected and may also
        help other entrepreneurs in the same annual entrepreneur group move
        forward more efficiently.
      </p>

      <p className="mt-5 text-2xl font-extrabold leading-relaxed text-green-700">
        By shifting to annual participation, you may receive up to 7% annual
        participation benefits, subject to EPEW policies, business performance,
        and program conditions.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href="/supporters/payment-center"
          className="rounded-2xl bg-green-700 px-8 py-4 text-xl font-black text-white hover:bg-green-800"
        >
          Change to Annual Participation
        </a>

        <a
          href="/epew-policies"
          className="rounded-2xl border-2 border-[#06245c] px-8 py-4 text-xl font-black text-[#06245c] hover:bg-[#06245c] hover:text-white"
        >
          Learn More
        </a>
      </div>
    </div>
  );
}