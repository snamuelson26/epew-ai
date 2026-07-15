"use client";

interface Props {
  entrepreneursEmpowered: number;
  businessesSupported: number;
  businessesOpened: number;
  communitiesStrengthened: number;
  jobsCreated: number;
  grandOpeningsCelebrated: number;
  quarterlyReportsReceived: number;
  participationBenefitsAvailable: number;
}

export default function ImpactSummary({
  entrepreneursEmpowered,
  businessesSupported,
  businessesOpened,
  communitiesStrengthened,
  jobsCreated,
  grandOpeningsCelebrated,
  quarterlyReportsReceived,
  participationBenefitsAvailable,
}: Props) {
  return (
    <section className="mb-10">
      <div className="mb-8">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          EPEW Impact Summary
        </h2>

        <p className="mt-3 text-2xl text-gray-600">
          Your participation is helping entrepreneurs build businesses,
          strengthen communities, and create lasting prosperity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <ImpactCard
          icon="👨‍💼"
          title="Entrepreneurs Empowered"
          value={entrepreneursEmpowered}
          color="green"
        />

        <ImpactCard
          icon="🏢"
          title="Businesses Supported"
          value={businessesSupported}
          color="blue"
        />

        <ImpactCard
          icon="🟢"
          title="Businesses Opened"
          value={businessesOpened}
          color="emerald"
        />

        <ImpactCard
          icon="🌍"
          title="Communities Strengthened"
          value={communitiesStrengthened}
          color="cyan"
        />

        <ImpactCard
          icon="💼"
          title="Jobs Created"
          value={jobsCreated}
          color="orange"
        />

        <ImpactCard
          icon="🎉"
          title="Grand Openings Celebrated"
          value={grandOpeningsCelebrated}
          color="purple"
        />

        <ImpactCard
          icon="📄"
          title="Quarterly Reports Received"
          value={quarterlyReportsReceived}
          color="indigo"
        />

        <ImpactCard
          icon="💚"
          title="Participation Benefits Available"
          value={`$${participationBenefitsAvailable.toLocaleString()}`}
          color="green"
        />

      </div>
    </section>
  );
}

function ImpactCard({
  icon,
  title,
  value,
  color,
}: {
  icon: string;
  title: string;
  value: string | number;
  color: string;
}) {
  const colors: Record<string, string> = {
    green: "border-green-600",
    blue: "border-blue-600",
    emerald: "border-emerald-600",
    cyan: "border-cyan-600",
    orange: "border-orange-600",
    purple: "border-purple-600",
    indigo: "border-indigo-600",
  };

  return (
    <div
      className={`bg-white rounded-3xl shadow-xl border-t-8 ${colors[color]} p-7 hover:shadow-2xl transition`}
    >
      <div className="text-5xl">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-600 leading-snug">
        {title}
      </h3>

      <p className="mt-3 text-5xl font-extrabold text-[#06245c]">
        {value}
      </p>
    </div>
  );
}