"use client";

export default function CertificationCenter({
  cohort,
  entrepreneurs,
}: {
  cohort: any;
  entrepreneurs: any[];
}) {
  const certifiedEntrepreneurs = entrepreneurs.filter(
    (item) =>
      item.status === "Qualified" ||
      item.qualification_status === "Qualified" ||
      Number(item.units_supported || 0) >= Number(item.units_required || 20)
  );

  const totalCSUs = entrepreneurs.reduce(
    (sum, item) => sum + Number(item.units_supported || 0),
    0
  );

  const projectedJobs = certifiedEntrepreneurs.length * 8;

  return (
    <section className="mb-10">
      <div className="rounded-3xl bg-white p-10 shadow-2xl">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          🏆 Annual Meeting Certification Center
        </h2>

        <p className="mt-5 text-2xl leading-relaxed text-gray-700">
          The Annual Meeting confers two official certifications
          simultaneously: Business Launch Certification for each entrepreneur
          and Cohort Certification for the full group.
        </p>

        <div className="mt-10 grid gap-8 xl:grid-cols-2">
          <CertificationCard
            icon="🚀"
            title="Business Launch Certification"
            awardedTo="Individual Entrepreneur"
            purpose="Certifies that the entrepreneur has completed the Entrepreneur Development Program and is authorized to enter the Business Launch Phase."
            items={[
              "Entrepreneur Name",
              "Business Name",
              "Business ID",
              "Annual Meeting Number",
              "Cohort Number",
              "Business Launch Certification Number",
              "Date of Certification",
              "Leadership Signatures",
            ]}
          />

          <CertificationCard
            icon="👥"
            title="Cohort Certification"
            awardedTo="Entire Cohort"
            purpose="Certifies that the cohort has collectively achieved operational readiness for coordinated business launch through the EPEW Entrepreneur Development Ecosystem."
            items={[
              "Cohort Number",
              "Annual Meeting Number",
              "Number of Certified Entrepreneurs",
              "Total Community Support Units",
              "Projected Businesses",
              "Projected Jobs",
              "Communities Represented",
              "Countries Represented",
              "Date of Certification",
              "Leadership Signatures",
            ]}
          />
        </div>

        <div className="mt-10 rounded-3xl bg-[#f5f7fb] p-8">
          <h3 className="text-4xl font-extrabold text-[#06245c]">
            Certification Readiness Summary
          </h3>

          <div className="mt-8 grid gap-6 md:grid-cols-4">
            <SummaryBox
              title="Certified Entrepreneurs"
              value={`${certifiedEntrepreneurs.length} / ${
                cohort?.target_entrepreneurs || 50
              }`}
              icon="👨‍💼"
            />

            <SummaryBox
              title="Community Support Units"
              value={totalCSUs}
              icon="🧩"
            />

            <SummaryBox
              title="Projected Businesses"
              value={certifiedEntrepreneurs.length}
              icon="🏢"
            />

            <SummaryBox
              title="Projected Jobs"
              value={`${projectedJobs}+`}
              icon="💼"
            />
          </div>
        </div>

        <div className="mt-10 rounded-3xl border-l-8 border-green-600 bg-green-50 p-8">
          <h3 className="text-3xl font-extrabold text-[#06245c]">
            IBOS Certification Principle
          </h3>

          <p className="mt-4 text-xl leading-relaxed text-gray-700">
            IBOS measures readiness, identifies risks, and prepares
            certification records. Leadership makes the final decision to
            certify entrepreneurs and authorize the cohort to transition from
            Entrepreneur Development into Business Launch.
          </p>
        </div>

        <div className="mt-10 rounded-3xl bg-gradient-to-r from-[#06245c] to-green-700 p-8 text-white">
          <h3 className="text-4xl font-extrabold">
            Ecosystem Milestone
          </h3>

          <p className="mt-5 text-2xl leading-relaxed text-blue-100">
            The Annual Meeting does not only certify entrepreneurs. It certifies
            an ecosystem milestone. One entrepreneur launching a business is a
            success. A certified cohort launching together is economic
            development.
          </p>
        </div>
      </div>
    </section>
  );
}

function CertificationCard({
  icon,
  title,
  awardedTo,
  purpose,
  items,
}: {
  icon: string;
  title: string;
  awardedTo: string;
  purpose: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-8 shadow-lg">
      <div className="text-6xl">{icon}</div>

      <h3 className="mt-5 text-4xl font-extrabold text-[#06245c]">
        {title}
      </h3>

      <p className="mt-4 text-xl font-black text-green-700">
        Awarded To: {awardedTo}
      </p>

      <p className="mt-5 text-xl leading-relaxed text-gray-700">
        {purpose}
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6">
        <h4 className="text-2xl font-extrabold text-[#06245c]">
          Certificate Includes
        </h4>

        <ul className="mt-5 space-y-3 text-lg text-gray-700">
          {items.map((item) => (
            <li key={item}>✅ {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SummaryBox({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow">
      <div className="text-5xl">{icon}</div>

      <p className="mt-4 text-lg font-bold text-gray-600">
        {title}
      </p>

      <p className="mt-3 text-4xl font-black text-[#06245c]">
        {value}
      </p>
    </div>
  );
}