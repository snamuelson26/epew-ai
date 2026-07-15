"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminAnalyticsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [supporters, setSupporters] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);

    const { data: apps } = await supabase
      .from("entrepreneur_applications")
      .select("*");

    const { data: supporterData } = await supabase
      .from("supporters")
      .select("*");

    const { data: coachData } = await supabase
      .from("coach_candidates")
      .select("*");

    const { data: reportData } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .in("status", ["Business Opened", "Quarterly Reporting"]);

    setApplications(apps || []);
    setSupporters(supporterData || []);
    setCoaches(coachData || []);
    setReports(reportData || []);
    setLoading(false);
  }

  const totalEntrepreneurs = applications.length;
  const totalSupporters = supporters.length;
  const totalCoaches = coaches.length;

  const fundedBusinesses = applications.filter(
    (app) =>
      app.status === "Funding Approved" ||
      app.status === "Business Opened" ||
      app.status === "Quarterly Reporting"
  ).length;

  const totalApprovedFunding = applications.reduce(
    (sum, app) => sum + Number(app.approved_amount || 0),
    0
  );

  const totalPlatformFees = applications.reduce(
    (sum, app) => sum + Number(app.platform_fee || 0),
    0
  );

  const totalWorkingCapital = applications.reduce(
    (sum, app) => sum + Number(app.working_capital_request || 0),
    0
  );

  const totalQuarterlyReports = reports.length;

  const pendingApplications = applications.filter(
    (app) =>
      !app.status ||
      app.status === "Application Submitted" ||
      app.status === "Pending"
  ).length;

  const fundingApproved = applications.filter(
    (app) => app.status === "Funding Approved"
  ).length;

  const businessOpened = applications.filter(
    (app) => app.status === "Business Opened"
  ).length;

  const quarterlyReporting = applications.filter(
    (app) => app.status === "Quarterly Reporting"
  ).length;

  const fundsReleased = applications.filter((app) =>
    [
      app.business_setup_admin_status,
      app.promotion_admin_status,
      app.rent_admin_status,
      app.equipment_admin_status,
      app.inventory_admin_status,
      app.other_admin_status,
      app.remaining_balance_admin_status,
    ].includes("Fund Released")
  ).length;

  const coachVerifiedCategories = applications.reduce((sum, app) => {
    const statuses = [
      app.business_setup_coach_status,
      app.promotion_coach_status,
      app.rent_coach_status,
      app.equipment_coach_status,
      app.inventory_coach_status,
      app.other_coach_status,
      app.remaining_balance_coach_status,
    ];

    return sum + statuses.filter((status) => status === "Verified").length;
  }, 0);

  const releasedCategories = applications.reduce((sum, app) => {
    const statuses = [
      app.business_setup_admin_status,
      app.promotion_admin_status,
      app.rent_admin_status,
      app.equipment_admin_status,
      app.inventory_admin_status,
      app.other_admin_status,
      app.remaining_balance_admin_status,
    ];

    return sum + statuses.filter((status) => status === "Fund Released").length;
  }, 0);

  const totalCategories = applications.length * 7;
  const releaseProgress =
    totalCategories === 0
      ? 0
      : Math.round((releasedCategories / totalCategories) * 100);

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Analytics Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Analytics Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Monitor EPEW growth, funding activity, coach verification, business
        progress, and platform performance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Entrepreneurs
          </h2>
          <p className="text-4xl font-extrabold text-[#06245c] mt-4">
            {totalEntrepreneurs}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Supporters
          </h2>
          <p className="text-4xl font-extrabold text-green-700 mt-4">
            {totalSupporters}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Coaches
          </h2>
          <p className="text-4xl font-extrabold text-blue-700 mt-4">
            {totalCoaches}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Funded Businesses
          </h2>
          <p className="text-4xl font-extrabold text-purple-700 mt-4">
            {fundedBusinesses}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Approved Funding
          </h2>
          <p className="text-4xl font-extrabold text-green-700 mt-4">
            ${totalApprovedFunding.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Platform Fees
          </h2>
          <p className="text-4xl font-extrabold text-purple-700 mt-4">
            ${totalPlatformFees.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Working Capital
          </h2>
          <p className="text-4xl font-extrabold text-blue-700 mt-4">
            ${totalWorkingCapital.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Quarterly Reports
          </h2>
          <p className="text-4xl font-extrabold text-red-700 mt-4">
            {totalQuarterlyReports}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Funding Release Progress
        </h2>

        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
          <div
            className="bg-green-600 h-8 text-white font-bold text-center"
            style={{ width: `${releaseProgress}%` }}
          >
            {releaseProgress}%
          </div>
        </div>

        <p className="mt-4 text-gray-700">
          {releasedCategories} of {totalCategories} category funds released.
        </p>
      </div>

      <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Platform Status Summary
        </h2>

        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Metric</th>
              <th className="text-left p-4">Value</th>
              <th className="text-left p-4">Meaning</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              <td className="p-4 font-bold">Pending Applications</td>
              <td className="p-4">{pendingApplications}</td>
              <td className="p-4">Applications waiting for review.</td>
            </tr>

            <tr className="border-b">
              <td className="p-4 font-bold">Funding Approved</td>
              <td className="p-4">{fundingApproved}</td>
              <td className="p-4">Businesses approved for funding.</td>
            </tr>

            <tr className="border-b">
              <td className="p-4 font-bold">Coach Verified Categories</td>
              <td className="p-4">{coachVerifiedCategories}</td>
              <td className="p-4">Categories verified by coaches.</td>
            </tr>

            <tr className="border-b">
              <td className="p-4 font-bold">Funds Released Categories</td>
              <td className="p-4">{releasedCategories}</td>
              <td className="p-4">Categories where funds were released.</td>
            </tr>

            <tr className="border-b">
              <td className="p-4 font-bold">Business Opened</td>
              <td className="p-4">{businessOpened}</td>
              <td className="p-4">Businesses marked as opened.</td>
            </tr>

            <tr>
              <td className="p-4 font-bold">Quarterly Reporting</td>
              <td className="p-4">{quarterlyReporting}</td>
              <td className="p-4">Businesses in reporting phase.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}