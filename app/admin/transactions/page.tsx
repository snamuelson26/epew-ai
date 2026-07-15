"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [businessName, setBusinessName] = useState("");
  const [entrepreneurName, setEntrepreneurName] = useState("");
  const [transactionType, setTransactionType] = useState("Contribution Received");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("Completed");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setTransactions(data || []);
    setLoading(false);
  }

  async function createTransaction() {
    if (!transactionType || !amount) {
      alert("Please enter transaction type and amount.");
      return;
    }

    const { error } = await supabase.from("admin_transactions").insert([
      {
        business_name: businessName,
        entrepreneur_name: entrepreneurName,
        transaction_type: transactionType,
        amount: Number(amount),
        status,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setBusinessName("");
    setEntrepreneurName("");
    setTransactionType("Contribution Received");
    setAmount("");
    setStatus("Completed");
    loadTransactions();
  }

  const totalContributions = transactions
    .filter((t) => t.transaction_type === "Contribution Received")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalPlatformFees = transactions
    .filter((t) => t.transaction_type === "Platform Fee")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalDisbursements = transactions
    .filter((t) => t.transaction_type === "Business Disbursement")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Transactions Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Transactions Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Track contributions received, platform fees, business disbursements,
        and payment activity.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Contributions Received
          </h2>
          <p className="text-4xl font-extrabold text-[#06245c] mt-4">
            ${totalContributions.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Platform Fees
          </h2>
          <p className="text-4xl font-extrabold text-green-700 mt-4">
            ${totalPlatformFees.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Business Disbursements
          </h2>
          <p className="text-4xl font-extrabold text-blue-700 mt-4">
            ${totalDisbursements.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Add Transaction
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <input
            className="border rounded-xl p-4"
            placeholder="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />

          <input
            className="border rounded-xl p-4"
            placeholder="Entrepreneur Name"
            value={entrepreneurName}
            onChange={(e) => setEntrepreneurName(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
          >
            <option>Contribution Received</option>
            <option>Platform Fee</option>
            <option>Business Disbursement</option>
            <option>Refund</option>
            <option>Adjustment</option>
          </select>

          <input
            className="border rounded-xl p-4"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Completed</option>
            <option>Pending</option>
            <option>Failed</option>
            <option>Cancelled</option>
          </select>
        </div>

        <button
          onClick={createTransaction}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Transaction
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No transactions recorded yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Business</th>
                <th className="text-left p-4">Entrepreneur</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b">
                  <td className="p-4">
                    {transaction.created_at
                      ? new Date(transaction.created_at).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="p-4 font-bold">
                    {transaction.business_name || "-"}
                  </td>

                  <td className="p-4">
                    {transaction.entrepreneur_name || "-"}
                  </td>

                  <td className="p-4">
                    {transaction.transaction_type}
                  </td>

                  <td className="p-4 font-bold">
                    ${Number(transaction.amount || 0).toLocaleString()}
                  </td>

                  <td className="p-4">
                    {transaction.status || "Completed"}
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