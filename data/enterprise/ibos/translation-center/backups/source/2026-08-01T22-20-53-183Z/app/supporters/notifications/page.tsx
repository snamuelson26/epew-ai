"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<any>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
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
          Loading notifications...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">
          Notifications
        </h1>

        <p className="text-xl text-gray-700">
          Stay informed about entrepreneur progress, contribution reminders,
          reports, and important EPEW announcements.
        </p>
      </div>

      {/* Funding Updates */}

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <h2 className="text-3xl font-bold mb-6">
          Funding Updates
        </h2>

        <div className="space-y-5">

          <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-6">
            <p className="font-bold text-xl mb-2">
              Entrepreneur Progress
            </p>

            <p className="text-lg text-gray-700">
              Entrepreneurs you support will provide quarterly progress reports
              and milestone updates.
            </p>
          </div>

          <div className="bg-blue-50 border-l-8 border-blue-600 rounded-2xl p-6">
            <p className="font-bold text-xl mb-2">
              Grand Opening Notifications
            </p>

            <p className="text-lg text-gray-700">
              Receive notifications when businesses complete funding and launch.
            </p>
          </div>

        </div>
      </div>

      {/* Payment Reminders */}

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <h2 className="text-3xl font-bold mb-6">
          Payment Reminders
        </h2>

        <div className="space-y-5">

          <div className="bg-yellow-50 border-l-8 border-yellow-500 rounded-2xl p-6">
            <p className="font-bold text-xl mb-2">
              Upcoming Contributions
            </p>

            <p className="text-lg text-gray-700">
              Scheduled payment reminders and commitment notices will appear
              here.
            </p>
          </div>

        </div>
      </div>

      {/* Reports */}

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <h2 className="text-3xl font-bold mb-6">
          Reports and Statements
        </h2>

        <div className="space-y-5">

          <div className="bg-purple-50 border-l-8 border-purple-600 rounded-2xl p-6">
            <p className="font-bold text-xl mb-2">
              Quarterly Reports
            </p>

            <p className="text-lg text-gray-700">
              Quarterly business reports and participation summaries will be
              available here.
            </p>
          </div>

        </div>
      </div>

      {/* EPEW Announcements */}

      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-6">
          EPEW Announcements
        </h2>

        <div className="space-y-5">

          <div className="bg-[#f5f7fb] rounded-2xl p-6">
            <p className="font-bold text-xl mb-2">
              Welcome to the EPEW Ecosystem
            </p>

            <p className="text-lg text-gray-700">
              Thank you for participating in the entrepreneur and community
              development ecosystem.
            </p>
          </div>

          <div className="bg-[#f5f7fb] rounded-2xl p-6">
            <p className="font-bold text-xl mb-2">
              Participation Benefit Notice
            </p>

            <p className="text-lg text-gray-700">
              Eligible supporters may qualify for participation benefits of up
              to 6% annually. Benefits are subject to EPEW policies and program
              performance and are not guaranteed.
            </p>
          </div>

        </div>
      </div>

    </main>
  );
}