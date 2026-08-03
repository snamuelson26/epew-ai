"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminBusinessOpeningsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinessOpenings();
  }, []);

  async function loadBusinessOpenings() {
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

  async function updateApplication(id: number, updates: any) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadBusinessOpenings();
  }

  function statusColor(status: string) {
    if (
      status === "Completed" ||
      status === "Business Opened" ||
      status === "Quarterly Reporting"
    ) {
      return "bg-green-100 text-green-800";
    }

    if (status === "In Progress") return "bg-blue-100 text-blue-800";
    if (status === "Ready for Opening") return "bg-purple-100 text-purple-800";
    if (status === "On Hold" || status === "Rejected") return "bg-red-100 text-red-800";

    return "bg-yellow-100 text-yellow-800";
  }

  function addMonths(dateString: string, months: number) {
    if (!dateString) return "";

    const date = new Date(dateString);
    date.setMonth(date.getMonth() + months);

    return date.toISOString().split("T")[0];
  }

  function isFundingCompleted(app: any) {
    const adminStatuses = [
      app.business_setup_admin_status,
      app.promotion_admin_status,
      app.rent_admin_status,
      app.equipment_admin_status,
      app.inventory_admin_status,
      app.other_admin_status,
      app.remaining_balance_admin_status,
    ];

    return adminStatuses.every((status) => status === "Fund Released");
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Business Openings...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Business Openings
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage business opening dates, grand opening status, opening checklist,
        funding completion, and quarterly report schedules.
      </p>

      {applications.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No businesses available for opening review yet.
          </h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {applications.map((app) => {
            const fundingCompleted = isFundingCompleted(app);

            return (
              <div key={app.id} className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-4xl font-extrabold text-[#06245c]">
                      {app.business_name || "Unnamed Business"}
                    </h2>

                    <p className="text-lg text-gray-700 mt-2">
                      Entrepreneur:{" "}
                      <span className="font-bold">{app.full_name || "-"}</span>
                    </p>
                  </div>

                  <span
                    className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                      app.opening_status || app.status
                    )}`}
                  >
                    {app.opening_status || app.status || "Pending"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <h3 className="font-bold text-gray-600">Funding Completed</h3>
                    <p className="text-2xl font-extrabold mt-3">
                      {fundingCompleted ? "Yes" : "No"}
                    </p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <h3 className="font-bold text-gray-600">Opening Date</h3>
                    <input
                      type="date"
                      defaultValue={app.business_opening_date || ""}
                      className="border rounded-xl p-3 mt-3 w-full"
                      onBlur={(e) =>
                        updateApplication(app.id, {
                          business_opening_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <h3 className="font-bold text-gray-600">Grand Opening</h3>
                    <p className="text-2xl font-extrabold text-blue-700 mt-3">
                      {app.grand_opening_status || "Pending"}
                    </p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <h3 className="font-bold text-gray-600">Quarterly Reports</h3>
                    <p className="text-lg font-bold text-[#06245c] mt-3">
                      Auto-created after opening
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-8 border-blue-600 p-6 rounded-2xl mb-8">
                  <h3 className="font-bold text-xl text-[#06245c] mb-3">
                    Opening Checklist
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <p>✅ Business setup reviewed</p>
                    <p>✅ Promotion reviewed</p>
                    <p>✅ Rent/location reviewed</p>
                    <p>✅ Equipment reviewed</p>
                    <p>✅ Inventory reviewed</p>
                    <p>✅ Funding release reviewed</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-8 border-yellow-500 p-6 rounded-2xl mb-8">
                  <h3 className="font-bold text-xl text-[#06245c] mb-4">
                    Opening Notes
                  </h3>

                  <textarea
                    id={`opening-notes-${app.id}`}
                    className="border rounded-xl p-4 w-full min-h-[140px]"
                    defaultValue={app.opening_notes || ""}
                    placeholder="Opening notes, pending requirements, launch concerns, or final observations..."
                  />

                  <button
                    onClick={() => {
                      const input = document.getElementById(
                        `opening-notes-${app.id}`
                      ) as HTMLTextAreaElement;

                      updateApplication(app.id, {
                        opening_notes: input.value,
                      });
                    }}
                    className="bg-[#06245c] text-white px-6 py-3 rounded-xl font-bold mt-4"
                  >
                    Save Opening Notes
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      updateApplication(app.id, {
                        opening_status: "In Progress",
                      })
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                  >
                    Opening In Progress
                  </button>

                  <button
                    onClick={() =>
                      updateApplication(app.id, {
                        opening_status: "Ready for Opening",
                      })
                    }
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl"
                  >
                    Ready for Opening
                  </button>

                  <button
                    onClick={() => {
                      const openingDate =
                        app.business_opening_date ||
                        new Date().toISOString().split("T")[0];

                      updateApplication(app.id, {
                        status: "Business Opened",
                        opening_status: "Business Opened",
                        business_opening_date: openingDate,
                        q1_report_due: addMonths(openingDate, 3),
                        q2_report_due: addMonths(openingDate, 6),
                        q3_report_due: addMonths(openingDate, 9),
                        q4_report_due: addMonths(openingDate, 12),
                        quarterly_report_status: "Pending",
                      });
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl"
                  >
                    Mark Business Opened
                  </button>

                  <button
                    onClick={() =>
                      updateApplication(app.id, {
                        status: "Quarterly Reporting",
                        opening_status: "Completed",
                      })
                    }
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
                  >
                    Move to Quarterly Reporting
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}