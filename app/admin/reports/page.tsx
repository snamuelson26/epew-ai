"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .in("status", ["Business Opened", "Quarterly Reporting"])
      .order("business_opening_date", { ascending: false });

    if (error) {
      console.log(error);
      setReports([]);
      setLoading(false);
      return;
    }

    setReports(data || []);
    setLoading(false);
  }

  function getReportColor(status: string | null) {
    if (status === "Submitted") return "bg-green-100 text-green-800";
    if (status === "Upcoming") return "bg-blue-100 text-blue-800";
    if (status === "Overdue") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Reports Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Reports Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage quarterly reports, compliance status, coach follow-ups, and
        funded business reporting.
      </p>

      <div className="bg-yellow-50 border-l-8 border-yellow-500 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          Internal Reporting Rule
        </h2>

        <p className="mt-2 text-gray-700">
          After a business opens, quarterly reports are required every 3 months.
          Reports help EPEW track progress, compliance, business health, and
          supporter confidence.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No quarterly reports yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Business</th>
                <th className="text-left p-4">Entrepreneur</th>
                <th className="text-left p-4">Opening Date</th>
                <th className="text-left p-4">Q1 Report</th>
                <th className="text-left p-4">Q2 Report</th>
                <th className="text-left p-4">Q3 Report</th>
                <th className="text-left p-4">Q4 Report</th>
                <th className="text-left p-4">Current Status</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((app) => (
                <tr key={app.id} className="border-b">
                  <td className="p-4 font-bold">
                    {app.business_name || "Unnamed Business"}
                  </td>

                  <td className="p-4">
                    {app.full_name || "Unnamed Entrepreneur"}
                  </td>

                  <td className="p-4">
                    {app.business_opening_date || "-"}
                  </td>

                  <td className="p-4">
                    {app.q1_report_due || "-"}
                  </td>

                  <td className="p-4">
                    {app.q2_report_due || "-"}
                  </td>

                  <td className="p-4">
                    {app.q3_report_due || "-"}
                  </td>

                  <td className="p-4">
                    {app.q4_report_due || "-"}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${getReportColor(
                        app.quarterly_report_status
                      )}`}
                    >
                      {app.quarterly_report_status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}