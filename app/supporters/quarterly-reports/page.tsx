"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function QuarterlyReportsPage() {
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<any>(null);

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
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8">
        <p className="text-2xl font-bold text-[#06245c]">
          Loading quarterly reports...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">

      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">
          Quarterly Reports
        </h1>

        <p className="text-xl text-gray-700">
          Review quarterly business performance reports and progress updates
          from entrepreneurs, churches, nonprofit organizations, and community
          projects supported through EPEW.
        </p>
      </div>

      {/* Quarter Cards */}

      <div className="grid md:grid-cols-2 gap-8 mb-8">

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-4">
            Quarter 1 Report
          </h2>

          <p className="text-lg text-gray-700 mb-6">
            January - March
          </p>

          <div className="bg-[#f5f7fb] rounded-2xl p-6">
            <p className="font-bold text-xl mb-2">
              Status
            </p>

            <p className="text-lg text-gray-700">
              Reports will appear after entrepreneur submissions are activated.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-4">
            Quarter 2 Report
          </h2>

          <p className="text-lg text-gray-700 mb-6">
            April - June
          </p>

          <div className="bg-[#f5f7fb] rounded-2xl p-6">
            <p className="font-bold text-xl mb-2">
              Status
            </p>

            <p className="text-lg text-gray-700">
              Reports will appear after entrepreneur submissions are activated.
            </p>
          </div>
        </div>

      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-4">
            Quarter 3 Report
          </h2>

          <p className="text-lg text-gray-700 mb-6">
            July - September
          </p>

          <div className="bg-[#f5f7fb] rounded-2xl p-6">
            <p className="font-bold text-xl mb-2">
              Status
            </p>

            <p className="text-lg text-gray-700">
              Reports will appear after entrepreneur submissions are activated.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-4">
            Quarter 4 Report
          </h2>

          <p className="text-lg text-gray-700 mb-6">
            October - December
          </p>

          <div className="bg-[#f5f7fb] rounded-2xl p-6">
            <p className="font-bold text-xl mb-2">
              Status
            </p>

            <p className="text-lg text-gray-700">
              Reports will appear after entrepreneur submissions are activated.
            </p>
          </div>
        </div>

      </div>

      {/* Performance Summary */}

      <div className="bg-green-50 border-2 border-green-500 rounded-3xl shadow-xl p-10 mb-8">

        <h2 className="text-3xl font-bold mb-8">
          Performance Summary
        </h2>

        <div className="grid md:grid-cols-2 gap-6 text-lg">

          <p>
            <strong>Businesses Supported:</strong> Future feature
          </p>

          <p>
            <strong>Jobs Created:</strong> Future feature
          </p>

          <p>
            <strong>Communities Impacted:</strong> Future feature
          </p>

          <p>
            <strong>Participation Benefits:</strong> Subject to EPEW policies
          </p>

        </div>

      </div>

      {/* Future Enhancements */}

      <div className="bg-white rounded-3xl shadow-xl p-10">

        <h2 className="text-3xl font-bold mb-6">
          Future Quarterly Report Features
        </h2>

        <div className="space-y-4 text-xl">

          <p>✅ Revenue Growth</p>

          <p>✅ Jobs Created</p>

          <p>✅ Business Grade</p>

          <p>✅ Grand Opening Dates</p>

          <p>✅ Photos and Videos</p>

          <p>✅ Success Stories</p>

          <p>✅ Community Impact</p>

        </div>

      </div>

    </main>
  );
}