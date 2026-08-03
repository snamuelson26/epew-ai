"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FundingQueuePage() {
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .order("units_supported", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setEntrepreneurs(data || []);
    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        status,
      })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    alert("Status updated.");
    loadQueue();
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Funding Queue...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">

      <h1 className="text-5xl font-extrabold text-[#06245c] mb-10">
        EPEW Funding Queue Manager
      </h1>

      <div className="bg-yellow-50 border-l-8 border-yellow-500 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl">
          Internal EPEW Note
        </h2>

        <p className="mt-2">
          Weeks 1–2 are reserved for EPEW platform preparation and are not
          displayed to entrepreneurs.
        </p>

        <p className="mt-2">
          Entrepreneurs are managed in groups of 50.
        </p>
      </div>

      <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">

        <table className="w-full">

          <thead>
            <tr className="border-b">

              <th className="text-left p-4">Position</th>
              <th className="text-left p-4">Entrepreneur</th>
              <th className="text-left p-4">Business</th>
              <th className="text-left p-4">Units</th>
              <th className="text-left p-4">Round</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>

            </tr>
          </thead>

          <tbody>

            {entrepreneurs.map((app, index) => (

              <tr key={app.id} className="border-b">

                <td className="p-4 font-bold">
                  #{index + 1}
                </td>

                <td className="p-4">
                  {app.full_name}
                </td>

                <td className="p-4">
                  {app.business_name}
                </td>

                <td className="p-4">
                  {app.units_supported || 0} /
                  {app.units_required || 20}
                </td>

                <td className="p-4">
                  {app.funding_round || "-"}
                </td>

                <td className="p-4">
                  {app.status}
                </td>

                <td className="p-4 flex gap-2 flex-wrap">

                  <button
                    onClick={() =>
                      updateStatus(
                        app.id,
                        "Funding Approved"
                      )
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-xl"
                  >
                    Funding Approved
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(
                        app.id,
                        "Business Opened"
                      )
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                  >
                    Business Opened
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(
                        app.id,
                        "Quarterly Reporting"
                      )
                    }
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl"
                  >
                    Quarterly Reporting
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}