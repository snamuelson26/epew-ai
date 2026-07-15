"use client";

interface Entrepreneur {
  id: string;
  photo_url?: string | null;
  entrepreneur_name?: string;
  business_name?: string;
  public_business_id?: string;
  coach_name?: string;
  units_supported?: number;
  units_required?: number;
  marketplace_status?: string;
  qualification_status?: string;
  funding_status?: string;
  launch_status?: string;
}

export default function EntrepreneurRoster({
  entrepreneurs,
}: {
  entrepreneurs: Entrepreneur[];
}) {
  return (
    <section id="entrepreneurs" className="mb-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-5xl font-extrabold text-[#06245c]">
            Entrepreneur Command Center
          </h2>

          <p className="mt-3 text-2xl text-gray-700">
            Monitor every entrepreneur preparing for the Annual Meeting,
            funding schedule, and business launch.
          </p>
        </div>

        <div className="rounded-2xl bg-[#06245c] px-6 py-4 text-white shadow-lg">
          <p className="text-sm font-bold uppercase tracking-wider">
            Entrepreneurs
          </p>

          <p className="text-4xl font-black">
            {entrepreneurs.length} / 50
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#06245c] text-white">
              <tr>
                <th className="px-6 py-5 text-left">Photo</th>
                <th className="px-6 py-5 text-left">Entrepreneur</th>
                <th className="px-6 py-5 text-left">Business</th>
                <th className="px-6 py-5 text-left">Coach</th>
                <th className="px-6 py-5 text-center">Units</th>
                <th className="px-6 py-5 text-center">Marketplace</th>
                <th className="px-6 py-5 text-center">Qualified</th>
                <th className="px-6 py-5 text-center">Funding</th>
                <th className="px-6 py-5 text-center">Launch</th>
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
                    No entrepreneurs assigned to this cohort yet.
                  </td>
                </tr>
              ) : (
                entrepreneurs.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-5">
                      <img
                        src={
                          item.photo_url ||
                          "/images/default-avatar.png"
                        }
                        alt=""
                        className="h-14 w-14 rounded-full object-cover border"
                      />
                    </td>

                    <td className="px-6 py-5">
                      <div className="font-bold text-[#06245c] text-lg">
                        {item.entrepreneur_name || "Pending"}
                      </div>

                      <div className="text-sm text-gray-500">
                        {item.public_business_id || ""}
                      </div>
                    </td>

                    <td className="px-6 py-5 font-semibold">
                      {item.business_name || "-"}
                    </td>

                    <td className="px-6 py-5">
                      {item.coach_name || "Not Assigned"}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="font-bold">
                        {item.units_supported || 0}/
                        {item.units_required || 20}
                      </div>

                      <div className="mt-2 h-2 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-green-600"
                          style={{
                            width: `${
                              ((item.units_supported || 0) /
                                (item.units_required || 20)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <StatusBadge
                        value={
                          item.marketplace_status || "Pending"
                        }
                        color="blue"
                      />
                    </td>

                    <td className="px-6 py-5 text-center">
                      <StatusBadge
                        value={
                          item.qualification_status ||
                          "Preparing"
                        }
                        color="green"
                      />
                    </td>

                    <td className="px-6 py-5 text-center">
                      <StatusBadge
                        value={
                          item.funding_status || "Pending"
                        }
                        color="purple"
                      />
                    </td>

                    <td className="px-6 py-5 text-center">
                      <StatusBadge
                        value={
                          item.launch_status ||
                          "Not Scheduled"
                        }
                        color="orange"
                      />
                    </td>

                    <td className="px-6 py-5 text-center">
                      <button className="rounded-xl bg-[#06245c] px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({
  value,
  color,
}: {
  value: string;
  color: "green" | "blue" | "orange" | "purple";
}) {
  const styles = {
    green:
      "bg-green-100 text-green-700",
    blue:
      "bg-blue-100 text-blue-700",
    orange:
      "bg-orange-100 text-orange-700",
    purple:
      "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-2 text-sm font-bold ${styles[color]}`}
    >
      {value}
    </span>
  );
}