"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupporterReportsPage() {
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<any>(null);
  const [projection, setProjection] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/supporters/login";
      return;
    }

    const { data: supporterData } = await supabase
      .from("supporters")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!supporterData) {
      window.location.href = "/supporters/login";
      return;
    }

    setSupporter(supporterData);

    const { data: projectionData } = await supabase
      .from("supporter_projections")
      .select("*")
      .eq("supporter_id", supporterData.id)
      .maybeSingle();

    setProjection(projectionData);

    const { data: transactionData } = await supabase
      .from("supporter_transactions")
      .select("*")
      .eq("supporter_id", supporterData.id)
      .order("created_at", { ascending: false });

    setTransactions(transactionData || []);
    setLoading(false);
  }

  const totalUnits = Number(projection?.total_units || 0);
  const totalCommitment = Number(projection?.total_contributions || 0);
  const activeCommitments = Number(projection?.active_commitments || 0);
  const pendingPayments = transactions.filter(
    (item) => item.status === "pending"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <p className="text-2xl font-bold">Loading reports...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <div className="mb-8 rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="mb-3 text-5xl font-extrabold">Reports</h1>

        <p className="text-xl text-gray-700">
          Review your EPEW participation history, commitment summary, and
          reporting information.
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <Card title="Total Units" value={totalUnits.toLocaleString()} />
        <Card title="Total Commitment" value={`$${totalCommitment.toLocaleString()}`} />
        <Card title="Active Commitments" value={activeCommitments.toLocaleString()} />
        <Card title="Pending Payments" value={pendingPayments.toLocaleString()} />
      </div>

      <div className="mb-8 rounded-3xl border-2 border-green-500 bg-green-50 p-10 shadow-xl">
        <h2 className="mb-8 text-3xl font-bold">
          Annual Participation Summary
        </h2>

        <div className="grid gap-6 text-lg md:grid-cols-2">
          <p>
            <strong>Supporter:</strong>{" "}
            {supporter?.full_name || "Not Provided"}
          </p>

          <p>
            <strong>Supporter ID:</strong>{" "}
            {supporter?.supporter_id || "Not Assigned"}
          </p>

          <p>
            <strong>Email:</strong> {supporter?.email || "Not Provided"}
          </p>

          <p>
            <strong>Reporting Year:</strong> {new Date().getFullYear()}
          </p>

          <p>
            <strong>Total Contributions:</strong>{" "}
            ${totalCommitment.toLocaleString()}
          </p>

          <p>
            <strong>Total Units:</strong> {totalUnits.toLocaleString()}
          </p>

          <p>
            <strong>Active Commitments:</strong>{" "}
            {activeCommitments.toLocaleString()}
          </p>

          <p>
            <strong>Status:</strong> Subject to EPEW policies and program
            performance
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-3xl bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-3xl font-bold">Contribution History</h2>

        {transactions.length === 0 ? (
          <p className="text-xl">No contribution history found.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-3">Date</th>
                  <th>Units</th>
                  <th>Frequency</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td>{item.units || 0}</td>
                    <td>{item.frequency || "Not Provided"}</td>
                    <td>${Number(item.amount || 0).toLocaleString()}</td>
                    <td>{item.status || "paid"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl">
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="text-4xl font-extrabold">{value}</p>
    </div>
  );
}