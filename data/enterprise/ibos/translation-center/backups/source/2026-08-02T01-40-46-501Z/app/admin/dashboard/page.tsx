"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminDashboardPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [supporters, setSupporters] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
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

    const { data: partnerData } = await supabase
      .from("partner_candidates")
      .select("*");

    setApplications(apps || []);
    setSupporters(supporterData || []);
    setCoaches(coachData || []);
    setPartners(partnerData || []);
    setLoading(false);
  }

  const totalEntrepreneurs = applications.length;
  const totalSupporters = supporters.length;
  const totalCoaches = coaches.length;
  const totalPartners = partners.length;

  const fundingQueue = applications.filter(
    (app) =>
      app.status === "Funding Queue" ||
      app.status === "Funding Readiness Review" ||
      app.status === "Funding Committee Approved"
  ).length;

  const fundedBusinesses = applications.filter(
    (app) =>
      app.status === "Funding Approved" ||
      app.status === "Business Opened" ||
      app.status === "Quarterly Reporting"
  ).length;

  const businessesOpened = applications.filter(
    (app) => app.status === "Business Opened"
  ).length;

  const quarterlyReporting = applications.filter(
    (app) => app.status === "Quarterly Reporting"
  ).length;

  const highRiskBusinesses = applications.filter(
    (app) => app.business_risk_level === "High Risk"
  ).length;

  const overdueReports = applications.filter(
    (app) => app.quarterly_report_status === "Overdue"
  ).length;

  const pendingMarketplace = applications.filter(
    (app) =>
      app.presentation_status === "Pending" ||
      app.video_status === "Pending" ||
      app.marketplace_visibility === "Hidden"
  ).length;

  const totalApprovedFunding = applications.reduce(
    (sum, app) => sum + Number(app.approved_amount || 0),
    0
  );

  const totalPlatformFees = applications.reduce(
    (sum, app) => sum + Number(app.platform_fee || 0),
    0
  );

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

  const fundingProgress =
    totalCategories === 0
      ? 0
      : Math.round((releasedCategories / totalCategories) * 100);

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        EPEW Admin Dashboard
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Main command center for the EPEW ecosystem, funding operations,
        marketplace review, compliance, reporting, and business development.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <DashboardCard title="Entrepreneurs" value={totalEntrepreneurs} color="text-[#06245c]" />
        <DashboardCard title="Supporters" value={totalSupporters} color="text-green-700" />
        <DashboardCard title="Coaches" value={totalCoaches} color="text-blue-700" />
        <DashboardCard title="Partners" value={totalPartners} color="text-purple-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <DashboardCard title="Funding Queue" value={fundingQueue} color="text-yellow-700" />
        <DashboardCard title="Funded Businesses" value={fundedBusinesses} color="text-green-700" />
        <DashboardCard title="Businesses Opened" value={businessesOpened} color="text-blue-700" />
        <DashboardCard title="Quarterly Reporting" value={quarterlyReporting} color="text-purple-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <DashboardCard
          title="Approved Funding"
          value={`$${totalApprovedFunding.toLocaleString()}`}
          color="text-green-700"
        />

        <DashboardCard
          title="Platform Fees"
          value={`$${totalPlatformFees.toLocaleString()}`}
          color="text-purple-700"
        />

        <DashboardCard
          title="High Risk"
          value={highRiskBusinesses}
          color="text-red-700"
        />

        <DashboardCard
          title="Overdue Reports"
          value={overdueReports}
          color="text-red-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] mb-6">
            Funding Release Progress
          </h2>

          <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
            <div
              className="bg-green-600 h-8 text-white font-bold text-center"
              style={{ width: `${fundingProgress}%` }}
            >
              {fundingProgress}%
            </div>
          </div>

          <p className="mt-4 text-gray-700">
            {releasedCategories} of {totalCategories} category releases
            completed.
          </p>

          <Link
            href="/admin/funding-committee"
            className="inline-block mt-6 bg-[#06245c] text-white px-6 py-3 rounded-xl font-bold"
          >
            Open Funding Progression
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] mb-6">
            Critical Alerts
          </h2>

          <div className="space-y-4">
            <AlertRow
              label="High Risk Businesses"
              value={highRiskBusinesses}
              href="/admin/quarterly-reporting"
            />

            <AlertRow
              label="Overdue Reports"
              value={overdueReports}
              href="/admin/quarterly-reporting"
            />

            <AlertRow
              label="Marketplace Pending Review"
              value={pendingMarketplace}
              href="/admin/marketplace"
            />

            <AlertRow
              label="Funding Queue Items"
              value={fundingQueue}
              href="/admin/funding-queue"
            />
          </div>
        </div>
      </div>

      <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Quick Admin Access
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QuickLink title="Funding Queue" href="/admin/funding-queue" />
          <QuickLink title="Funding Progression" href="/admin/funding-committee" />
          <QuickLink title="Marketplace" href="/admin/marketplace" />
          <QuickLink title="Quarterly Reporting" href="/admin/quarterly-reporting" />
          <QuickLink title="Finance" href="/admin/finance" />
          <QuickLink title="Transactions" href="/admin/transactions" />
          <QuickLink title="Documents" href="/admin/documents" />
          <QuickLink title="Vendors" href="/admin/vendors" />
          <QuickLink title="Business Openings" href="/admin/business-openings" />
          <QuickLink title="Audit Center" href="/admin/audit-center" />
          <QuickLink title="Analytics" href="/admin/analytics" />
          <QuickLink title="Settings" href="/admin/settings" />
        </div>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h2 className="text-lg font-bold text-gray-600">{title}</h2>
      <p className={`text-4xl font-extrabold mt-4 ${color}`}>{value}</p>
    </div>
  );
}

function AlertRow({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex justify-between items-center bg-[#f5f7fb] rounded-2xl p-4 hover:bg-gray-200"
    >
      <span className="font-bold text-gray-700">{label}</span>
      <span
        className={`px-4 py-2 rounded-xl font-bold ${
          value > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
        }`}
      >
        {value}
      </span>
    </Link>
  );
}

function QuickLink({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="bg-[#06245c] text-white rounded-xl p-4 font-bold text-center hover:bg-blue-900"
    >
      {title}
    </Link>
  );
}
