"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminQuarterlyReportingPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
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
      setBusinesses([]);
      setLoading(false);
      return;
    }

    setBusinesses(data || []);
    setLoading(false);
  }

  async function updateBusiness(id: number, updates: any) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadReports();
  }

  function statusColor(status: string) {
    if (status === "Submitted" || status === "Completed" || status === "Admin Reviewed") {
      return "bg-green-100 text-green-800";
    }

    if (status === "Under Review" || status === "Coach Reviewed") {
      return "bg-blue-100 text-blue-800";
    }

    if (status === "Overdue" || status === "High Risk") {
      return "bg-red-100 text-red-800";
    }

    if (status === "Medium Risk") {
      return "bg-yellow-100 text-yellow-800";
    }

    return "bg-yellow-100 text-yellow-800";
  }

  function riskColor(risk: string) {
    if (risk === "Low Risk") return "bg-green-100 text-green-800";
    if (risk === "Medium Risk") return "bg-yellow-100 text-yellow-800";
    if (risk === "High Risk") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  }

  const reportsSubmitted = businesses.filter(
    (b) => b.quarterly_report_status === "Submitted"
  ).length;

  const reportsPending = businesses.filter(
    (b) => !b.quarterly_report_status || b.quarterly_report_status === "Pending"
  ).length;

  const reportsOverdue = businesses.filter(
    (b) => b.quarterly_report_status === "Overdue"
  ).length;

  const coachReviewsPending = businesses.filter(
    (b) => b.coach_report_review_status === "Pending"
  ).length;

  const highRiskBusinesses = businesses.filter(
    (b) => b.business_risk_level === "High Risk"
  ).length;

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Quarterly Reporting Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Quarterly Reporting Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Track funded business reports, coach reviews, admin reviews, risk level,
        business health, and quarterly compliance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Businesses Reporting
          </h2>
          <p className="text-4xl font-extrabold text-[#06245c] mt-4">
            {businesses.length}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Submitted
          </h2>
          <p className="text-4xl font-extrabold text-green-700 mt-4">
            {reportsSubmitted}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Pending
          </h2>
          <p className="text-4xl font-extrabold text-yellow-700 mt-4">
            {reportsPending}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Overdue
          </h2>
          <p className="text-4xl font-extrabold text-red-700 mt-4">
            {reportsOverdue}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Coach Review
          </h2>
          <p className="text-4xl font-extrabold text-blue-700 mt-4">
            {coachReviewsPending}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            High Risk
          </h2>
          <p className="text-4xl font-extrabold text-red-700 mt-4">
            {highRiskBusinesses}
          </p>
        </div>
      </div>

      {businesses.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No businesses in quarterly reporting yet.
          </h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {businesses.map((business) => (
            <div key={business.id} className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-4xl font-extrabold text-[#06245c]">
                    {business.business_name || "Unnamed Business"}
                  </h2>

                  <p className="text-lg text-gray-700 mt-2">
                    Entrepreneur:{" "}
                    <span className="font-bold">
                      {business.full_name || "-"}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span
                    className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                      business.quarterly_report_status || "Pending"
                    )}`}
                  >
                    {business.quarterly_report_status || "Pending"}
                  </span>

                  <span
                    className={`px-4 py-2 rounded-xl font-bold ${riskColor(
                      business.business_risk_level || "Low Risk"
                    )}`}
                  >
                    {business.business_risk_level || "Low Risk"}
                  </span>
                </div>
              </div>

              <div className="overflow-auto rounded-2xl border mb-8">
                <table className="w-full min-w-[1000px] bg-white">
                  <thead>
                    <tr className="border-b bg-[#f5f7fb]">
                      <th className="text-left p-4">Opening Date</th>
                      <th className="text-left p-4">Q1 Due</th>
                      <th className="text-left p-4">Q2 Due</th>
                      <th className="text-left p-4">Q3 Due</th>
                      <th className="text-left p-4">Q4 Due</th>
                      <th className="text-left p-4">Coach Review</th>
                      <th className="text-left p-4">Admin Review</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="border-b">
                      <td className="p-4">
                        {business.business_opening_date || "-"}
                      </td>
                      <td className="p-4">{business.q1_report_due || "-"}</td>
                      <td className="p-4">{business.q2_report_due || "-"}</td>
                      <td className="p-4">{business.q3_report_due || "-"}</td>
                      <td className="p-4">{business.q4_report_due || "-"}</td>
                      <td className="p-4">
                        {business.coach_report_review_status || "Pending"}
                      </td>
                      <td className="p-4">
                        {business.admin_report_review_status || "Pending"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#f5f7fb] rounded-2xl p-6">
                  <h3 className="font-bold text-gray-600">Revenue Trend</h3>
                  <p className="text-2xl font-extrabold text-green-700 mt-3">
                    {business.revenue_trend || "Not Updated"}
                  </p>
                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-6">
                  <h3 className="font-bold text-gray-600">Customer Growth</h3>
                  <p className="text-2xl font-extrabold text-blue-700 mt-3">
                    {business.customer_growth || "Not Updated"}
                  </p>
                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-6">
                  <h3 className="font-bold text-gray-600">Compliance</h3>
                  <p className="text-2xl font-extrabold text-purple-700 mt-3">
                    {business.compliance_status || "Pending"}
                  </p>
                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-6">
                  <h3 className="font-bold text-gray-600">Quarterly Score</h3>
                  <p className="text-2xl font-extrabold text-[#06245c] mt-3">
                    {business.quarterly_score || 0}/100
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-8 border-yellow-500 p-6 rounded-2xl mb-8">
                <h3 className="font-bold text-xl text-[#06245c] mb-4">
                  Report Notes
                </h3>

                <textarea
                  id={`report-notes-${business.id}`}
                  className="border rounded-xl p-4 w-full min-h-[140px]"
                  defaultValue={business.quarterly_report_notes || ""}
                  placeholder="Report comments, coach observations, admin review notes, risks, or clarification requests..."
                />

                <button
                  onClick={() => {
                    const input = document.getElementById(
                      `report-notes-${business.id}`
                    ) as HTMLTextAreaElement;

                    updateBusiness(business.id, {
                      quarterly_report_notes: input.value,
                    });
                  }}
                  className="bg-[#06245c] text-white px-6 py-3 rounded-xl font-bold mt-4"
                >
                  Save Notes
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    updateBusiness(business.id, {
                      quarterly_report_status: "Submitted",
                    })
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded-xl"
                >
                  Submit Report
                </button>

                <button
                  onClick={() =>
                    updateBusiness(business.id, {
                      quarterly_report_status: "Under Review",
                      coach_report_review_status: "Coach Reviewed",
                    })
                  }
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                  Coach Reviewed
                </button>

                <button
                  onClick={() =>
                    updateBusiness(business.id, {
                      quarterly_report_status: "Admin Reviewed",
                      admin_report_review_status: "Admin Reviewed",
                    })
                  }
                  className="bg-purple-600 text-white px-4 py-2 rounded-xl"
                >
                  Admin Reviewed
                </button>

                <button
                  onClick={() =>
                    updateBusiness(business.id, {
                      quarterly_report_status: "Clarification Requested",
                    })
                  }
                  className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
                >
                  Request Clarification
                </button>

                <button
                  onClick={() =>
                    updateBusiness(business.id, {
                      quarterly_report_status: "Overdue",
                      business_risk_level: "High Risk",
                    })
                  }
                  className="bg-red-600 text-white px-4 py-2 rounded-xl"
                >
                  Mark Overdue
                </button>

                <button
                  onClick={() =>
                    updateBusiness(business.id, {
                      quarterly_report_status: "Completed",
                      business_risk_level: "Low Risk",
                    })
                  }
                  className="bg-green-700 text-white px-4 py-2 rounded-xl"
                >
                  Mark Completed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}