"use client";

interface Props {
  totalUnits: number;
  totalContributions: number;
  benefitsAvailable: number;
  paymentStatus?: string;
}

export default function SupportingInformation({
  totalUnits,
  totalContributions,
  benefitsAvailable,
  paymentStatus = "Current",
}: Props) {
  return (
    <section className="mb-10">
      <div className="rounded-3xl bg-white p-10 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-5xl font-extrabold text-[#06245c]">
            Supporting Information
          </h2>

          <p className="mt-4 text-2xl leading-relaxed text-gray-700">
            Financial information is provided for transparency. The primary
            focus of EPEW is entrepreneur development, business creation,
            stronger communities, and lasting prosperity.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon="🧩"
            title="Units Supported"
            value={totalUnits.toString()}
          />

          <InfoCard
            icon="💵"
            title="Total Contributions"
            value={`$${totalContributions.toLocaleString()}`}
          />

          <InfoCard
            icon="💚"
            title="Benefits Available"
            value={`$${benefitsAvailable.toLocaleString()}`}
          />

          <InfoCard
            icon="✅"
            title="Payment Status"
            value={paymentStatus}
          />
        </div>

        <div className="mt-10 rounded-3xl border-l-8 border-green-600 bg-green-50 p-8">
          <h3 className="text-3xl font-extrabold text-[#06245c]">
            Participation Benefits
          </h3>

          <p className="mt-4 text-xl leading-relaxed text-gray-700">
            Participation benefits are determined according to EPEW policies,
            business performance, and participation terms. Benefits are not
            guaranteed and may vary from one entrepreneur to another.
          </p>

          <a
            href="/epew-policies"
            className="mt-6 inline-block rounded-2xl bg-[#06245c] px-8 py-4 text-xl font-black text-white hover:bg-green-700"
          >
            View EPEW Policies
          </a>
        </div>

        <div className="mt-10 rounded-3xl bg-[#f5f7fb] p-8">
          <h3 className="text-3xl font-extrabold text-[#06245c]">
            Financial Transparency
          </h3>

          <ul className="mt-5 space-y-4 text-xl leading-relaxed text-gray-700">
            <li>
              ✅ All supporter contributions are tracked through your private
              portal.
            </li>

            <li>
              ✅ Quarterly reports help you follow entrepreneur progress after
              business opening.
            </li>

            <li>
              ✅ Participation benefits become available according to program
              performance and applicable EPEW policies.
            </li>

            <li>
              ✅ You may submit benefit requests or eligible refund requests
              directly through your entrepreneur portfolio.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-7 text-center shadow-md">
      <div className="text-5xl">{icon}</div>

      <h3 className="mt-4 text-lg font-bold text-gray-600">
        {title}
      </h3>

      <p className="mt-3 text-4xl font-extrabold text-[#06245c]">
        {value}
      </p>
    </div>
  );
}