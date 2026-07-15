"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EntrepreneurFundingStatusPage() {
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFundingStatus();
  }, []);

  async function loadFundingStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/entrepreneurs/login");
      return;
    }

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setApplication(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">Loading funding status...</p>
      </main>
    );
  }

  const fundingGoal = application?.funding_request || 100000;
  const unitsRequired = application?.units_required || 20;
  const unitsCommitted = application?.units_supported || 0;
  const unitsRemaining = Math.max(unitsRequired - unitsCommitted, 0);
  const progress =
    unitsRequired > 0 ? Math.round((unitsCommitted / unitsRequired) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
          <h1 className="text-6xl font-extrabold mb-5">
            Funding Status
          </h1>

          <p className="text-2xl text-gray-700">
            Review your EPEW funding progress, queue position, qualification status,
            and projected funding readiness.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <p className="text-4xl font-bold text-green-700">
              ${Number(fundingGoal).toLocaleString()}
            </p>
            <p className="text-xl font-bold text-gray-700 mt-3">Funding Goal</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <p className="text-4xl font-bold text-green-700">
              {unitsCommitted} / {unitsRequired}
            </p>
            <p className="text-xl font-bold text-gray-700 mt-3">Units Committed</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <p className="text-4xl font-bold text-green-700">
              {progress}%
            </p>
            <p className="text-xl font-bold text-gray-700 mt-3">Funding Progress</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
          <h2 className="text-4xl font-bold mb-8">Progress Overview</h2>

          <div className="w-full bg-gray-200 rounded-full h-6 mb-8">
            <div
              className="bg-green-600 h-6 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-2xl text-gray-700">
            <p><strong>Business Name:</strong> {application?.business_name || "Not Available"}</p>
            <p><strong>Entrepreneur ID:</strong> {application?.entrepreneur_id || "Pending"}</p>
            <p><strong>Units Required:</strong> {unitsRequired}</p>
            <p><strong>Units Remaining:</strong> {unitsRemaining}</p>
            <p><strong>Number of Supporters:</strong> {application?.number_of_supporters || "Pending"}</p>
            <p><strong>Queue Position:</strong> {application?.funding_queue_position ? `#${application.funding_queue_position}` : "Pending"}</p>
            <p><strong>Coach Assigned:</strong> {application?.coach_name || "Not Assigned"}</p>
            <p><strong>Qualification Status:</strong> {application?.status || "Pending Review"}</p>
            <p><strong>Projected Funding Date:</strong> {application?.estimated_funding_date || "Pending"}</p>
          </div>
        </div>

        <div className="bg-[#06245c] text-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-6">Next Funding Steps</h2>

          <ul className="space-y-4 text-2xl text-gray-200">
            <li>✅ Continue preparing your business profile.</li>
            <li>✅ Follow coach guidance and complete required steps.</li>
            <li>✅ Build supporter participation toward your required units.</li>
            <li>✅ Watch your queue position and projected funding date.</li>
          </ul>
        </div>

      </div>
    </main>
  );
}