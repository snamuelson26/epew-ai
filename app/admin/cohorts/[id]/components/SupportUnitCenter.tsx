"use client";

interface SupportUnitItem {
  id: string;
  entrepreneur_name?: string;
  business_name?: string;
  public_business_id?: string;
  units_supported?: number;
  units_required?: number;
  weekly_supporters?: number;
  monthly_supporters?: number;
  annual_supporters?: number;
  projected_qualification_days?: number;
}

export default function SupportUnitCenter({
  entrepreneurs,
}: {
  entrepreneurs: SupportUnitItem[];
}) {
  const totalRequired = entrepreneurs.reduce(
    (sum, item) => sum + Number(item.units_required || 20),
    0
  );

  const totalSupported = entrepreneurs.reduce(
    (sum, item) => sum + Number(item.units_supported || 0),
    0
  );

  const totalMissing = Math.max(totalRequired - totalSupported, 0);

  const weeklyTotal = entrepreneurs.reduce(
    (sum, item) => sum + Number(item.weekly_supporters || 0),
    0
  );

  const monthlyTotal = entrepreneurs.reduce(
    (sum, item) => sum + Number(item.monthly_supporters || 0),
    0
  );

  const annualTotal = entrepreneurs.reduce(
    (sum, item) => sum + Number(item.annual_supporters || 0),
    0
  );

  return (
    <section className="mb-10">
      <div className="mb-6">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          Support Unit Center
        </h2>

        <p className="mt-3 text-2xl leading-relaxed text-gray-700">
          Monitor weekly, monthly, and annual support-unit participation for
          each entrepreneur. IBOS highlights gaps, projected qualification, and
          promotion needs.
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <SummaryCard icon="🧩" title="Total Units" value={`${totalSupported} / ${totalRequired}`} color="blue" />
        <SummaryCard icon="⚠️" title="Missing Units" value={totalMissing} color="orange" />
        <SummaryCard icon="📅" title="Weekly Supporters" value={weeklyTotal} color="green" />
        <SummaryCard icon="⭐" title="Annual Supporters" value={annualTotal} color="purple" />
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#06245c] to-green-700 p-8 text-white">
          <h3 className="text-4xl font-extrabold">
            Entrepreneur Support-Unit Analysis
          </h3>

          <p className="mt-3 text-xl text-blue-100">
            Each entrepreneur requires up to 20 support units before entering
            the Annual Meeting roster.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#f5f7fb]">
              <tr>
                <th className="px-6 py-5 text-left">Business</th>
                <th className="px-6 py-5 text-left">Entrepreneur</th>
                <th className="px-6 py-5 text-center">Units</th>
                <th className="px-6 py-5 text-center">Weekly</th>
                <th className="px-6 py-5 text-center">Monthly</th>
                <th className="px-6 py-5 text-center">Annual</th>
                <th className="px-6 py-5 text-center">Missing</th>
                <th className="px-6 py-5 text-center">Projected Qualification</th>
                <th className="px-6 py-5 text-center">IBOS Status</th>
              </tr>
            </thead>

            <tbody>
              {entrepreneurs.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-20 text-center text-2xl font-bold text-gray-500"
                  >
                    No support-unit data available yet.
                  </td>
                </tr>
              ) : (
                entrepreneurs.map((item) => {
                  const required = Number(item.units_required || 20);
                  const supported = Number(item.units_supported || 0);
                  const missing = Math.max(required - supported, 0);
                  const progress = Math.min(
                    Math.round((supported / required) * 100),
                    100
                  );

                  const status =
                    missing === 0
                      ? "Ready"
                      : missing <= 3
                        ? "Near Qualification"
                        : missing <= 8
                          ? "Promotion Needed"
                          : "Critical Gap";

                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-5">
                        <p className="text-lg font-black text-[#06245c]">
                          {item.business_name || "Business Pending"}
                        </p>

                        <p className="text-sm font-bold text-green-700">
                          {item.public_business_id || "Business ID Pending"}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-lg font-bold">
                        {item.entrepreneur_name || "Entrepreneur Pending"}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <p className="font-black">
                          {supported} / {required}
                        </p>

                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-green-600"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center font-bold">
                        {item.weekly_supporters || 0}
                      </td>

                      <td className="px-6 py-5 text-center font-bold">
                        {item.monthly_supporters || 0}
                      </td>

                      <td className="px-6 py-5 text-center font-bold">
                        {item.annual_supporters || 0}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <span
                          className={`rounded-full px-4 py-2 text-sm font-black ${
                            missing === 0
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {missing}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-center font-bold">
                        {missing === 0
                          ? "Qualified"
                          : `${item.projected_qualification_days || 30} Days`}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border-l-8 border-green-600 bg-green-50 p-8 shadow-xl">
        <h3 className="text-3xl font-extrabold text-[#06245c]">
          IBOS Support Intelligence
        </h3>

        <p className="mt-4 text-xl leading-relaxed text-gray-700">
          IBOS uses support-unit participation to identify entrepreneurs who are
          ready, near qualification, or at risk of missing the Annual Meeting.
          Leadership can use this information to decide when to increase
          promotion, notify supporters, or recommend replacement from the
          waiting list.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <InsightCard
            title="Annual Participation Advantage"
            text="Annual supporters help entrepreneurs reach qualification faster and strengthen the entire cohort funding schedule."
          />

          <InsightCard
            title="Promotion Trigger"
            text="Entrepreneurs with fewer than 12 units should be reviewed for business exposure, social media promotion, and community outreach."
          />

          <InsightCard
            title="Replacement Trigger"
            text="Entrepreneurs with critical gaps near the qualification deadline may require leadership review and waiting-list recommendations."
          />
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  color,
}: {
  icon: string;
  title: string;
  value: string | number;
  color: "green" | "blue" | "orange" | "purple";
}) {
  const border = {
    green: "border-green-600",
    blue: "border-blue-600",
    orange: "border-orange-500",
    purple: "border-purple-600",
  };

  return (
    <div className={`rounded-3xl border-t-8 ${border[color]} bg-white p-7 text-center shadow-xl`}>
      <div className="text-5xl">{icon}</div>

      <p className="mt-4 text-lg font-bold text-gray-600">{title}</p>

      <p className="mt-3 text-4xl font-black text-[#06245c]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Ready"
      ? "bg-green-100 text-green-700"
      : status === "Near Qualification"
        ? "bg-blue-100 text-blue-700"
        : status === "Promotion Needed"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-red-100 text-red-700";

  return (
    <span className={`rounded-full px-4 py-2 text-sm font-black ${styles}`}>
      {status}
    </span>
  );
}

function InsightCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h4 className="text-xl font-extrabold text-[#06245c]">{title}</h4>

      <p className="mt-3 text-lg leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}