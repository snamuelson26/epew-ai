"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupporterDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<any>(null);
  const [commitments, setCommitments] = useState<any[]>([]);

  useEffect(() => {
    loadSupporterDashboard();
  }, []);

  async function loadSupporterDashboard() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/supporters/login";
      return;
    }

    const { data: supporterData, error: supporterError } = await supabase
      .from("supporters")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (supporterError) {
      console.log("Supporter not found:", supporterError);
      setLoading(false);
      return;
    }

    if (!supporterData) {
      console.log("No supporter profile connected to this user.");
      setLoading(false);
      return;
    }

    setSupporter(supporterData);

    const { data: commitmentData, error: commitmentError } = await supabase
      .from("support_commitments")
      .select("*")
      .eq("supporter_email", supporterData.email)
      .order("created_at", { ascending: false });

    if (commitmentError) {
      console.log("Commitment error:", commitmentError);
      setCommitments([]);
    } else {
      setCommitments(commitmentData || []);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/supporters/login";
  }

  const totalUnits = commitments.reduce(
    (sum, item) => sum + Number(item.units || 0),
    0
  );

  const totalAmount = commitments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const businessesSupported = new Set(
    commitments.map((item) => item.entrepreneur_id)
  ).size;

  if (!supporter) {
  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10">
        <h1 className="text-4xl font-extrabold mb-4">
          Supporter Profile Not Connected
        </h1>

        <p className="text-xl text-gray-700 mb-6">
          Your login is active, but your supporter profile is not connected to this account.
        </p>

        <p className="text-lg text-gray-600 mb-6">
          Please check that the <strong>user_id</strong> in the supporters table matches the Auth User UID for this email.
        </p>

        <a
          href="/supporters/register"
          className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold inline-block"
        >
          Create or Reconnect Supporter Profile
        </a>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-extrabold mb-3">
            Supporter Dashboard
          </h1>

          <p className="text-xl text-gray-700">
            Manage your EPEW participation, support commitments, and funding
            activity.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold"
        >
          Logout
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h2 className="text-4xl font-extrabold mb-6">
          {supporter?.full_name || "Supporter"}
        </h2>

        <div className="grid md:grid-cols-2 gap-4 text-lg">
          <p>
            <strong>Supporter ID:</strong>{" "}
            {supporter?.supporter_id || "Not Assigned"}
          </p>

          <p>
            <strong>Status:</strong> {supporter?.status || "Active"}
          </p>

          <p>
            <strong>Email:</strong> {supporter?.email || "Not Provided"}
          </p>

          <p>
            <strong>Phone:</strong> {supporter?.phone || "Not Provided"}
          </p>

          <p>
            <strong>Country of Citizenship:</strong>{" "}
            {supporter?.country_of_citizenship || "Not Provided"}
          </p>

          <p>
            <strong>Date of Birth:</strong>{" "}
            {supporter?.date_of_birth
              ? new Date(supporter.date_of_birth).toLocaleDateString()
              : "Not Provided"}
          </p>

          <p>
            <strong>Country:</strong> {supporter?.country || "Not Provided"}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {supporter?.street_address || "Not Provided"}
          </p>

          <p>
            <strong>City:</strong> {supporter?.city || "Not Provided"}
          </p>

          <p>
            <strong>State:</strong> {supporter?.state || "Not Provided"}
          </p>

          <p>
            <strong>Zip Code:</strong>{" "}
            {supporter?.zip_code || "Not Provided"}
          </p>

          <p>
            <strong>Member Since:</strong>{" "}
            {supporter?.created_at
              ? new Date(supporter.created_at).toLocaleDateString()
              : "Not Available"}
          </p>
        </div>
      </div>

      <div className="bg-green-50 border-2 border-green-500 rounded-3xl shadow-xl p-10 mb-8">
        <h2 className="text-3xl font-bold text-[#06245c] mb-8">
          Participation Benefit
        </h2>

        <div className="text-center">
          <p className="text-6xl font-extrabold text-green-700 mb-6">
            Up to 6% Annually
          </p>

          <p className="text-xl text-gray-700 mb-4">
            Benefits are not guaranteed and depend on EPEW policies, program
            performance, and participation terms.
          </p>

          <a
            href="/epew-policies"
            className="text-lg text-[#06245c] underline hover:text-green-700 font-medium"
          >
            See EPEW policies and program performance
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2">Businesses Supported</h3>
          <p className="text-4xl font-extrabold">{businessesSupported}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2">Total Units</h3>
          <p className="text-4xl font-extrabold">{totalUnits}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2">Total Commitment</h3>
          <p className="text-4xl font-extrabold">
            ${totalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <h2 className="text-3xl font-bold mb-6">My Support Commitments</h2>

        {commitments.length === 0 ? (
          <p className="text-xl">No support commitments found.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-3">Date</th>
                  <th>Business Name</th>
                  <th>Support Type</th>
                  <th>Units</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                </tr>
              </thead>

              <tbody>
                {commitments.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td>{item.business_name || item.entrepreneur_id}</td>
                    <td>{item.support_type || "Not Provided"}</td>
                    <td>{item.units || 0}</td>
                    <td>${Number(item.amount || 0).toLocaleString()}</td>
                    <td>{item.payment_status || item.status || "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
  <a
    href="/marketplace"
    className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold"
  >
    Browse Marketplace
  </a>

  <a
    href="/supporters/my-supported-businesses"
    className="bg-green-700 text-white px-8 py-4 rounded-2xl text-xl font-bold"
  >
    My EPEW Participation
  </a>

  <a
    href="/supporters/register"
    className="bg-gray-700 text-white px-8 py-4 rounded-2xl text-xl font-bold"
  >
    Update Supporter Profile
  </a>
</div>
    </main>
  );
}