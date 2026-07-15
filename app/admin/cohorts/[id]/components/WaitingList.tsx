"use client";

interface WaitingEntrepreneur {
  id: string;
  entrepreneur_name?: string;
  business_name?: string;
  coach_name?: string;
  units_supported?: number;
  units_required?: number;
  marketplace_status?: string;
  qualification_status?: string;
  projected_days?: number;
}

export default function WaitingList({
  entrepreneurs,
}: {
  entrepreneurs: WaitingEntrepreneur[];
}) {
  return (
    <section className="mb-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-5xl font-extrabold text-[#06245c]">
            Waiting List Center
          </h2>

          <p className="mt-3 text-2xl text-gray-700">
            Entrepreneurs waiting to join this cohort. IBOS continuously
            evaluates readiness and recommends replacements when needed.
          </p>
        </div>

        <div className="rounded-2xl bg-orange-500 px-6 py-4 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-wider">
            Waiting
          </p>

          <p className="text-4xl font-black">
            {entrepreneurs.length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-orange-500 text-white">
              <tr>
                <th className="px-6 py-5 text-left">Position</th>
                <th className="px-6 py-5 text-left">Entrepreneur</th>
                <th className="px-6 py-5 text-left">Business</th>
                <th className="px-6 py-5 text-left">Coach</th>
                <th className="px-6 py-5 text-center">Units</th>
                <th className="px-6 py-5 text-center">Marketplace</th>
                <th className="px-6 py-5 text-center">Qualification</th>
                <th className="px-6 py-5 text-center">
                  Projected Qualification
                </th>
                <th className="px-6 py-5 text-center">
                  IBOS Recommendation
                </th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {entrepreneurs.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-20 text-center text-2xl font-bold text-gray-500"
                  >
                    No entrepreneurs are currently on the waiting list.
                  </td>
                </tr>
              ) : (
                entrepreneurs.map((item, index) => {
                  const progress =
                    ((item.units_supported || 0) /
                      (item.units_required || 20)) *
                    100;

                  return (
                    <tr
                      key={item.id}
                      className="border-b transition hover:bg-orange-50"
                    >
                      <td className="px-6 py-5">
                        <div className="text-2xl font-black text-[#06245c]">
                          #{index + 51}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="font-bold text-[#06245c]">
                          {item.entrepreneur_name}
                        </div>
                      </td>

                      <td className="px-6 py-5 font-semibold">
                        {item.business_name}
                      </td>

                      <td className="px-6 py-5">
                        {item.coach_name || "Pending"}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <div className="font-bold">
                          {item.units_supported || 0}/
                          {item.units_required || 20}
                        </div>

                        <div className="mt-2 h-2 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-orange-500"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <Badge
                          value={
                            item.marketplace_status ||
                            "Pending"
                          }
                          color="blue"
                        />
                      </td>

                      <td className="px-6 py-5 text-center">
                        <Badge
                          value={
                            item.qualification_status ||
                            "Preparing"
                          }
                          color="green"
                        />
                      </td>

                      <td className="px-6 py-5 text-center">
                        <div className="font-bold text-green-700">
                          {item.projected_days || 30} Days
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center">
                        {progress >= 90 ? (
                          <span className="rounded-full bg-green-100 px-3 py-2 text-sm font-bold text-green-700">
                            Promote
                          </span>
                        ) : progress >= 75 ? (
                          <span className="rounded-full bg-yellow-100 px-3 py-2 text-sm font-bold text-yellow-700">
                            Increase Promotion
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-2 text-sm font-bold text-red-700">
                            Needs Support
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <div className="flex justify-center gap-2">
                          <button className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-[#06245c]">
                            Promote
                          </button>

                          <button className="rounded-xl bg-[#06245c] px-4 py-2 text-sm font-bold text-white hover:bg-orange-500">
                            Notify
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border-l-8 border-orange-500 bg-orange-50 p-8 shadow-lg">
        <h3 className="text-3xl font-extrabold text-[#06245c]">
          IBOS Waiting List Intelligence
        </h3>

        <p className="mt-4 text-xl leading-relaxed text-gray-700">
          IBOS continuously monitors entrepreneurs who are not yet in the
          Annual Meeting roster. It analyzes support-unit completion,
          qualification readiness, marketplace approval, and projected
          qualification dates to recommend potential replacements.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <SummaryCard
            title="Ready for Promotion"
            value="0"
            color="green"
          />

          <SummaryCard
            title="Need Promotion"
            value="0"
            color="orange"
          />

          <SummaryCard
            title="Critical Support Gap"
            value="0"
            color="red"
          />
        </div>
      </div>
    </section>
  );
}

function Badge({
  value,
  color,
}: {
  value: string;
  color: "green" | "blue";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-2 text-sm font-bold ${styles[color]}`}
    >
      {value}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "green" | "orange" | "red";
}) {
  const bg = {
    green: "bg-green-600",
    orange: "bg-orange-500",
    red: "bg-red-600",
  };

  return (
    <div className={`${bg[color]} rounded-2xl p-6 text-white shadow-xl`}>
      <p className="text-sm font-bold uppercase tracking-wider">
        {title}
      </p>

      <p className="mt-3 text-5xl font-black">
        {value}
      </p>
    </div>
  );
}