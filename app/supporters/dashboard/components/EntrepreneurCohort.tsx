"use client";

interface Props {
  cohortYear?: number;
  entrepreneurGroup?: number;
  qualified?: number;
  annualMeetingDate?: string;
  fundingStatus?: string;
}

export default function EntrepreneurCohort({
  cohortYear = new Date().getFullYear(),
  entrepreneurGroup = 50,
  qualified = 18,
  annualMeetingDate = "To Be Announced",
  fundingStatus = "Preparing Annual Meeting",
}: Props) {
  return (
    <section className="mb-10">

      <div className="bg-white rounded-3xl shadow-2xl p-10">

        <h2 className="text-5xl font-extrabold text-[#06245c] mb-5">
          👥 My Entrepreneur Cohort
        </h2>

        <p className="text-2xl text-gray-700 leading-relaxed mb-10">
          Every supporter becomes part of an annual entrepreneur cohort.
          Together we prepare up to <strong>{entrepreneurGroup} entrepreneurs</strong>
          to launch <strong>{entrepreneurGroup} businesses</strong> through the
          EPEW Entrepreneur Development Ecosystem.
        </p>

        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-6 mb-10">

          <CohortCard
            icon="👨‍💼"
            title="Entrepreneur Group"
            value={`${entrepreneurGroup} Entrepreneurs`}
            color="green"
          />

          <CohortCard
            icon="⭐"
            title="Qualified"
            value={`${qualified} Qualified`}
            color="blue"
          />

          <CohortCard
            icon="📅"
            title="Annual Meeting"
            value={annualMeetingDate}
            color="orange"
          />

          <CohortCard
            icon="🚀"
            title="Funding Status"
            value={fundingStatus}
            color="purple"
          />

        </div>

        <div className="bg-[#f5f7fb] rounded-3xl p-8 mb-8">

          <h3 className="text-3xl font-extrabold text-[#06245c] mb-5">
            Why the Annual Meeting Matters
          </h3>

          <div className="space-y-4 text-xl text-gray-700 leading-relaxed">

            <p>
              The Annual Meeting is the official gathering of qualified
              entrepreneurs, supporters, coaches, and EPEW leadership.
            </p>

            <p>
              During this event, entrepreneurs meet the supporters helping
              them succeed, and supporters meet the entrepreneurs they are
              helping develop.
            </p>

            <p>
              EPEW presents the entrepreneur cohort, reviews ecosystem
              progress, and announces the approximate funding schedule for
              businesses expected to open during the coming year.
            </p>

            <p className="font-bold text-green-700">
              This is the beginning of every entrepreneur's journey toward
              business ownership.
            </p>

          </div>

        </div>

        <div className="grid md:grid-cols-3 gap-6">

          <InfoCard
            icon="🎯"
            title="Annual Goal"
            value={`${entrepreneurGroup} Businesses`}
          />

          <InfoCard
            icon="🌍"
            title="Mission"
            value="Entrepreneurs • Businesses • Communities"
          />

          <InfoCard
            icon="🏆"
            title="Expected Outcome"
            value="Lasting Prosperity"
          />

        </div>

      </div>

    </section>
  );
}

function CohortCard({
  icon,
  title,
  value,
  color,
}: {
  icon: string;
  title: string;
  value: string;
  color: "green" | "blue" | "orange" | "purple";
}) {
  const border = {
    green: "border-green-600",
    blue: "border-blue-600",
    orange: "border-orange-500",
    purple: "border-purple-600",
  };

  return (
    <div
      className={`bg-white border-t-8 ${border[color]} rounded-3xl shadow-lg p-7`}
    >
      <div className="text-5xl mb-5">{icon}</div>

      <h3 className="text-xl font-bold text-gray-600">
        {title}
      </h3>

      <p className="mt-3 text-3xl font-extrabold text-[#06245c]">
        {value}
      </p>
    </div>
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
    <div className="bg-gradient-to-r from-[#06245c] to-green-700 rounded-3xl p-8 text-white">

      <div className="text-5xl mb-4">
        {icon}
      </div>

      <h3 className="text-2xl font-bold mb-3">
        {title}
      </h3>

      <p className="text-xl text-blue-100 leading-relaxed">
        {value}
      </p>

    </div>
  );
}