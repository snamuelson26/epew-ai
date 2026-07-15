"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminFinancePage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinanceData();
  }, []);

  async function loadFinanceData() {
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

  const fundedBusinesses = applications.filter(
    (app) =>
      app.status === "Funding Approved" ||
      app.status === "Business Opened" ||
      app.status === "Quarterly Reporting"
  );

  const totalApproved = fundedBusinesses.reduce(
    (sum, app) => sum + Number(app.approved_amount || 0),
    0
  );

  const totalPlatformFees = fundedBusinesses.reduce(
    (sum, app) => sum + Number(app.platform_fee || 0),
    0
  );

  const totalContributionsReceived = totalApproved + totalPlatformFees;

  const totalDisbursement = totalApproved;

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Finance Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Finance Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage total contributions received, platform fees, approved funding,
        and business disbursements.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Total Contributions Received
          </h2>
          <p className="text-4xl font-extrabold text-[#06245c] mt-4">
            ${totalContributionsReceived.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Platform Fees Collected
          </h2>
          <p className="text-4xl font-extrabold text-green-700 mt-4">
            ${totalPlatformFees.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Approved Business Funding
          </h2>
          <p className="text-4xl font-extrabold text-blue-700 mt-4">
            ${totalApproved.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Net Disbursement
          </h2>
          <p className="text-4xl font-extrabold text-purple-700 mt-4">
            ${totalDisbursement.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-8 border-yellow-500 p-6 rounded-2xl mb-10">

  <h2 className="font-bold text-xl">
    Internal EPEW Note
  </h2>

  <p className="mt-2">
    Weeks 1 and 2 are reserved for EPEW platform preparation and are not
    displayed to entrepreneurs.
  </p>

  <p className="mt-2">
    Entrepreneur funding begins at Week 3.
  </p>

  <p className="mt-2">
    Entrepreneurs are managed in groups of 50.
  </p>

</div>

      {fundedBusinesses.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No approved finance activity yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Business</th>
                <th className="text-left p-4">Entrepreneur</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Total Contributions</th>
                <th className="text-left p-4">Platform Fee</th>
                <th className="text-left p-4">Approved Funding</th>
                <th className="text-left p-4">Net Disbursement</th>
              </tr>
            </thead>

            <tbody>
              {fundedBusinesses.map((app) => {
                const approved = Number(app.approved_amount || 0);
                const fee = Number(app.platform_fee || 0);
                const total = approved + fee;
                const net = approved;

                return (
                  <tr key={app.id} className="border-b">
                    <td className="p-4 font-bold">
                      {app.business_name || "Unnamed Business"}
                    </td>

                    <td className="p-4">
                      {app.full_name || "Unnamed Entrepreneur"}
                    </td>

                    <td className="p-4">{app.status || "-"}</td>

                    <td className="p-4 font-bold">
                      ${total.toLocaleString()}
                    </td>

                    <td className="p-4 text-green-700 font-bold">
                      ${fee.toLocaleString()}
                    </td>

                    <td className="p-4 text-blue-700 font-bold">
                      ${approved.toLocaleString()}
                    </td>

                    <td className="p-4 text-purple-700 font-bold">
                      ${net.toLocaleString()}
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