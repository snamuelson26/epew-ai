"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSupportersPage() {
  const [supporters, setSupporters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupporters();
  }, []);

  async function loadSupporters() {
    setLoading(true);

    const { data, error } = await supabase
      .from("supporters")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setSupporters([]);
      setLoading(false);
      return;
    }

    setSupporters(data || []);
    setLoading(false);
  }

  function statusColor(status: string) {
    if (status === "Active") return "bg-green-100 text-green-800";
    if (status === "Pending") return "bg-yellow-100 text-yellow-800";
    if (status === "Suspended") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  }

  const activeSupporters = supporters.filter((s) => s.status === "Active").length;

  const totalUnits = supporters.reduce(
    (sum, s) => sum + Number(s.units_supported || s.units || 0),
    0
  );

  const totalCommitment = totalUnits * 100;

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Supporters...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Supporters
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage EPEW supporters, contribution units, participation status,
        contact information, and supporter activity.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Card title="Total Supporters" value={supporters.length} color="text-[#06245c]" />
        <Card title="Active Supporters" value={activeSupporters} color="text-green-700" />
        <Card title="Units Supported" value={totalUnits} color="text-blue-700" />
        <Card title="Weekly Commitment" value={`$${totalCommitment.toLocaleString()}`} color="text-purple-700" />
      </div>

      {supporters.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No supporters registered yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Supporter</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Phone</th>
                <th className="text-left p-4">Location</th>
                <th className="text-left p-4">Units</th>
                <th className="text-left p-4">Commitment</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {supporters.map((supporter) => {
                const units = Number(
                  supporter.units_supported || supporter.units || 0
                );

                return (
                  <tr key={supporter.id} className="border-b">
                    <td className="p-4 font-bold">
                      {supporter.full_name ||
                        supporter.name ||
                        "Unnamed Supporter"}
                    </td>

                    <td className="p-4">{supporter.email || "-"}</td>

                    <td className="p-4">{supporter.phone || "-"}</td>

                    <td className="p-4">
                      {supporter.location ||
                        supporter.city ||
                        supporter.state ||
                        "-"}
                    </td>

                    <td className="p-4 font-bold">{units}</td>

                    <td className="p-4 font-bold">
                      ${(units * 100).toLocaleString()}/week
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                          supporter.status || "Pending"
                        )}`}
                      >
                        {supporter.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h2 className="text-lg font-bold text-gray-600">{title}</h2>
      <p className={`text-4xl font-extrabold mt-4 ${color}`}>{value}</p>
    </div>
  );
}