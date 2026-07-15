"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupporterPaymentCenterPage() {
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<any>(null);
  const [commitments, setCommitments] = useState<any[]>([]);

  useEffect(() => {
    loadPaymentCenter();
  }, []);

  async function loadPaymentCenter() {
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

    const { data } = await supabase
      .from("support_commitments")
      .select("*")
      .eq("supporter_email", supporterData.email)
      .order("created_at", { ascending: false });

    setCommitments(data || []);
    setLoading(false);
  }

  const totalCommitment = commitments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const pendingPayments = commitments.filter(
    (item) => item.payment_status === "Pending"
  );

  const activeCommitments = commitments.filter(
    (item) => item.status === "Active" || item.status === "active"
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <p className="text-2xl font-bold">Loading payment center...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">Payment Center</h1>

        <p className="text-xl text-gray-700">
          Manage your supporter payment activity, pending commitments, and
          future payment methods.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2">Current Balance</h3>
          <p className="text-4xl font-extrabold">$0.00</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2">Pending Payments</h3>
          <p className="text-4xl font-extrabold">{pendingPayments.length}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2">Active Commitments</h3>
          <p className="text-4xl font-extrabold">{activeCommitments.length}</p>
        </div>

        <div className="bg-green-50 border-2 border-green-500 rounded-3xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2">Total Commitment</h3>
          <p className="text-4xl font-extrabold text-green-700">
            ${totalCommitment.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 mb-8">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-6">Upcoming Contributions</h2>

          {commitments.length === 0 ? (
            <p className="text-xl text-gray-700">
              No payment commitments found.
            </p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-3">Business</th>
                    <th>Type</th>
                    <th>Units</th>
                    <th>Amount</th>
                    <th>Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {commitments.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">
                        {item.business_name || "Not Provided"}
                      </td>
                      <td>{item.support_type || "Not Provided"}</td>
                      <td>{item.units || 0}</td>
                      <td>${Number(item.amount || 0).toLocaleString()}</td>
                      <td>{item.payment_status || "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              className="bg-green-700 text-white px-8 py-4 rounded-2xl text-xl font-bold"
            >
              Pay Now
            </button>

            <button
              type="button"
              className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold"
            >
              View Payment History
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-6">Payment Methods</h2>

          <div className="space-y-4 text-lg mb-8">
            <div className="bg-[#f5f7fb] rounded-2xl p-5">
              <p className="font-bold">Credit Card</p>
              <p className="text-gray-700">Coming soon with Stripe.</p>
            </div>

            <div className="bg-[#f5f7fb] rounded-2xl p-5">
              <p className="font-bold">Debit Card</p>
              <p className="text-gray-700">Coming soon with Stripe.</p>
            </div>

            <div className="bg-[#f5f7fb] rounded-2xl p-5">
              <p className="font-bold">ACH Bank Transfer</p>
              <p className="text-gray-700">Future payment option.</p>
            </div>
          </div>

          <button
            type="button"
            className="w-full bg-[#06245c] text-white py-4 rounded-2xl text-xl font-bold"
          >
            Manage Payment Methods
          </button>
        </div>
      </div>

      <div className="bg-green-50 border-2 border-green-500 rounded-3xl shadow-xl p-10 mb-8">
        <h2 className="text-3xl font-bold mb-8">Participation Benefit</h2>

        <div className="text-center">
          <p className="text-6xl font-extrabold text-green-700 mb-6">
            Up to 6% Annually
          </p>

          <a
            href="/epew-policies"
            className="text-lg text-[#06245c] underline hover:text-green-700 font-bold"
          >
            See EPEW policies and program performance
          </a>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10">
        <h2 className="text-3xl font-bold mb-6">Future Stripe Integration</h2>

        <div className="grid md:grid-cols-2 gap-5 text-lg">
          <p>✅ Stripe Checkout</p>
          <p>✅ Stripe Customer Portal</p>
          <p>✅ Recurring Payments</p>
          <p>✅ Invoices</p>
          <p>✅ Receipts</p>
          <p>✅ Failed Payment Recovery</p>
        </div>
      </div>
    </main>
  );
}