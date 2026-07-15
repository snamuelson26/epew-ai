"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MySupportedBusinessesPage() {
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<any>(null);
  const [commitments, setCommitments] = useState<any[]>([]);

  useEffect(() => {
    loadSupportedBusinesses();
  }, []);

  async function loadSupportedBusinesses() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/supporters/login";
      return;
    }

    const { data: supporterData, error: supporterError } = await supabase
      .from("supporters")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (supporterError || !supporterData) {
      window.location.href = "/supporters/login";
      return;
    }

    setSupporter(supporterData);

    const { data, error } = await supabase
      .from("support_commitments")
      .select("*")
      .eq("supporter_email", supporterData.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Supported businesses error:", error);
      setCommitments([]);
    } else {
      setCommitments(data || []);
    }

    setLoading(false);
  }

  const totalUnits = commitments.reduce(
    (sum, item) => sum + Number(item.units || 0),
    0
  );

  const totalAmount = commitments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <p className="text-2xl font-bold">Loading supported businesses...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">
          My Supported Businesses
        </h1>

        <p className="text-xl text-gray-700">
          Track the entrepreneurs, businesses, churches, nonprofit
          organizations, and community projects you support through EPEW.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2">Businesses Supported</h3>
          <p className="text-4xl font-extrabold">{commitments.length}</p>
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

      {commitments.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-3xl font-bold mb-4">
            No supported businesses yet
          </h2>

          <p className="text-xl text-gray-700 mb-6">
            Browse available entrepreneurs and select a participation plan to
            begin supporting a business.
          </p>

          <a
            href="/supporters/entrepreneurs"
            className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold inline-block"
          >
            Browse Available Entrepreneurs
          </a>
        </div>
      ) : (
        <div className="grid xl:grid-cols-2 gap-8">
          {commitments.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold mb-2">
                    {item.business_name || "Business Name Pending"}
                  </h2>

                  <p className="text-lg text-gray-600">
                    Commitment created{" "}
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold h-fit">
                  {item.status || "Active"}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#f5f7fb] rounded-2xl p-5">
                  <p className="font-bold">Participation Type</p>
                  <p className="text-2xl font-extrabold">
                    {item.support_type || "Not Provided"}
                  </p>
                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-5">
                  <p className="font-bold">Units Supported</p>
                  <p className="text-2xl font-extrabold">
                    {item.units || 0}
                  </p>
                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-5">
                  <p className="font-bold">Commitment Amount</p>
                  <p className="text-2xl font-extrabold">
                    ${Number(item.amount || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-5">
                  <p className="font-bold">Payment Status</p>
                  <p className="text-2xl font-extrabold">
                    {item.payment_status || "Pending"}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-6 mb-6">
                <h3 className="text-2xl font-bold mb-3">
                  Participation Benefit
                </h3>

                <p className="text-4xl font-extrabold text-green-700 mb-3">
                  Up to 6% Annually
                </p>

                <a
                  href="/epew-policies"
                  className="text-[#06245c] underline font-bold"
                >
                  See EPEW policies and program performance
                </a>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href={`/supporters/contribution-plans?entrepreneur=${item.entrepreneur_id}`}
                  className="bg-green-700 text-white px-6 py-3 rounded-2xl font-bold"
                >
                  Increase Support
                </a>

                <a
                  href="/supporters/reports"
                  className="bg-[#06245c] text-white px-6 py-3 rounded-2xl font-bold"
                >
                  View Reports
                </a>

                <a
                  href="/supporters/messages"
                  className="border-2 border-[#06245c] text-[#06245c] px-6 py-3 rounded-2xl font-bold"
                >
                  Message EPEW
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}