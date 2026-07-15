"use client";

export default function ExecutiveOverview({
  qualified,
  targetEntrepreneurs,
  marketplaceApproved,
  waitingList,
  totalUnits,
  requiredUnits,
  supporters,
  jobsProjected,
  communities,
  countries,
  launchReadiness,
}: {
  qualified: number;
  targetEntrepreneurs: number;
  marketplaceApproved: number;
  waitingList: number;
  totalUnits: number;
  requiredUnits: number;
  supporters: number;
  jobsProjected: number;
  communities: number;
  countries: number;
  launchReadiness: number;
}) {
  return (
    <section className="mb-8">
      <div className="mb-6">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          Executive Overview
        </h2>

        <p className="mt-3 text-2xl leading-relaxed text-gray-700">
          A high-level operating view of this cohort&apos;s readiness,
          participation strength, support-unit completion, and projected
          community impact.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          icon="👨‍💼"
          title="Entrepreneurs Qualified"
          value={`${qualified} / ${targetEntrepreneurs}`}
          note="Annual Meeting roster progress"
          color="green"
        />

        <OverviewCard
          icon="🏢"
          title="Marketplace Approved"
          value={marketplaceApproved}
          note="Visible and ready for support"
          color="blue"
        />

        <OverviewCard
          icon="⏳"
          title="Waiting List"
          value={waitingList}
          note="Potential replacements"
          color="orange"
        />

        <OverviewCard
          icon="🧩"
          title="Support Units"
          value={`${totalUnits} / ${requiredUnits}`}
          note="Cohort support-unit completion"
          color="purple"
        />

        <OverviewCard
          icon="💚"
          title="Supporters"
          value={supporters}
          note="Connected to this cohort"
          color="green"
        />

        <OverviewCard
          icon="💼"
          title="Projected Jobs"
          value={`${jobsProjected}+`}
          note="Expected when cohort completes"
          color="orange"
        />

        <OverviewCard
          icon="🌍"
          title="Communities"
          value={communities}
          note="Projected communities strengthened"
          color="blue"
        />

        <OverviewCard
          icon="🚀"
          title="Launch Readiness"
          value={`${launchReadiness}%`}
          note="Estimated operational readiness"
          color="purple"
        />
      </div>

      <div className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
        <h3 className="text-3xl font-extrabold text-[#06245c]">
          IBOS Operating Summary
        </h3>

        <p className="mt-4 text-2xl leading-relaxed text-gray-700">
          This cohort is preparing up to{" "}
          <strong>{targetEntrepreneurs} entrepreneurs</strong> to open{" "}
          <strong>{targetEntrepreneurs} businesses</strong>. IBOS monitors
          qualification, support-unit completion, waiting-list readiness, launch
          preparation, and projected community impact to support leadership
          decision-making.
        </p>
      </div>
    </section>
  );
}

function OverviewCard({
  icon,
  title,
  value,
  note,
  color,
}: {
  icon: string;
  title: string;
  value: string | number;
  note: string;
  color: "green" | "blue" | "orange" | "purple";
}) {
  const borderColor = {
    green: "border-green-600",
    blue: "border-blue-600",
    orange: "border-orange-500",
    purple: "border-purple-600",
  };

  return (
    <div
      className={`rounded-3xl border-t-8 ${borderColor[color]} bg-white p-7 shadow-xl`}
    >
      <div className="text-5xl">{icon}</div>

      <h3 className="mt-5 text-lg font-bold text-gray-600">{title}</h3>

      <p className="mt-3 text-4xl font-black text-[#06245c]">{value}</p>

      <p className="mt-3 text-base leading-relaxed text-gray-500">{note}</p>
    </div>
  );
}