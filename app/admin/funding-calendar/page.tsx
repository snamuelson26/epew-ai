"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminFundingCalendarPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [weekNumber, setWeekNumber] = useState("");
  const [calendarDate, setCalendarDate] = useState("");
  const [calendarType, setCalendarType] = useState("Entrepreneur Funding");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadCalendar();
  }, []);

  async function loadCalendar() {
    setLoading(true);

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setApplications([]);
      setLoading(false);
      return;
    }

    setApplications(data || []);
    setLoading(false);
  }

  async function updateCalendar(id: number, updates: any) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadCalendar();
  }

  function statusColor(status: string) {
    if (status === "Business Opened" || status === "Quarterly Reporting") {
      return "bg-green-100 text-green-800";
    }

    if (status === "Funding Approved") {
      return "bg-blue-100 text-blue-800";
    }

    if (status === "Funding Committee Approved") {
      return "bg-purple-100 text-purple-800";
    }

    if (status === "Funding Readiness Review") {
      return "bg-yellow-100 text-yellow-800";
    }

    if (status === "Rejected" || status === "Funding Committee Rejected") {
      return "bg-red-100 text-red-800";
    }

    return "bg-gray-100 text-gray-800";
  }

  const platformPrepWeeks = 2;
  const entrepreneurFundingWeeks = 50;
  const totalCycleWeeks = 52;

  const fundedApplications = applications.filter(
    (app) =>
      app.status === "Funding Approved" ||
      app.status === "Business Opened" ||
      app.status === "Quarterly Reporting"
  );

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Funding Calendar...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Funding Calendar
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage weekly funding schedules, platform preparation weeks,
        entrepreneur funding weeks, business opening dates, and quarterly report
        dates.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Total Funding Cycle
          </h2>
          <p className="text-4xl font-extrabold text-[#06245c] mt-4">
            {totalCycleWeeks} Weeks
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Platform Preparation
          </h2>
          <p className="text-4xl font-extrabold text-purple-700 mt-4">
            {platformPrepWeeks} Weeks
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Entrepreneur Funding
          </h2>
          <p className="text-4xl font-extrabold text-green-700 mt-4">
            {entrepreneurFundingWeeks} Weeks
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Funded Businesses
          </h2>
          <p className="text-4xl font-extrabold text-blue-700 mt-4">
            {fundedApplications.length}
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-8 border-yellow-500 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          Internal Calendar Rule
        </h2>

        <p className="mt-2 text-gray-700">
          Weeks 1 and 2 are reserved for EPEW platform preparation. Entrepreneur
          funding begins at Week 3 and continues through Week 52.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No calendar records available yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Funding Week</th>
                <th className="text-left p-4">Business</th>
                <th className="text-left p-4">Entrepreneur</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Funding Date</th>
                <th className="text-left p-4">Opening Date</th>
                <th className="text-left p-4">Q1 Report</th>
                <th className="text-left p-4">Q2 Report</th>
                <th className="text-left p-4">Q3 Report</th>
                <th className="text-left p-4">Q4 Report</th>
              </tr>
            </thead>

            <tbody>
              {applications.map((app, index) => {
                const fundingWeek = index + 3;

                return (
                  <tr key={app.id} className="border-b">
                    <td className="p-4 font-bold">Week {fundingWeek}</td>

                    <td className="p-4 font-bold">
                      {app.business_name || "Unnamed Business"}
                    </td>

                    <td className="p-4">{app.full_name || "-"}</td>

                    <td className="p-4">
                      <span
                        className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                          app.status
                        )}`}
                      >
                        {app.status || "Pending"}
                      </span>
                    </td>

                    <td className="p-4">
                      <input
                        type="date"
                        defaultValue={app.funding_date || ""}
                        className="border rounded-xl p-3"
                        onBlur={(e) =>
                          updateCalendar(app.id, {
                            funding_date: e.target.value,
                          })
                        }
                      />
                    </td>

                    <td className="p-4">
                      <input
                        type="date"
                        defaultValue={app.business_opening_date || ""}
                        className="border rounded-xl p-3"
                        onBlur={(e) =>
                          updateCalendar(app.id, {
                            business_opening_date: e.target.value,
                          })
                        }
                      />
                    </td>

                    <td className="p-4">{app.q1_report_due || "-"}</td>
                    <td className="p-4">{app.q2_report_due || "-"}</td>
                    <td className="p-4">{app.q3_report_due || "-"}</td>
                    <td className="p-4">{app.q4_report_due || "-"}</td>
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