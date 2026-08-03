"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminEcosystemDashboardPage() {
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

  const marketplaceVisible = applications.filter(
    (app) => app.marketplace_visibility === "Visible"
  ).length;

  const highRiskBusinesses = applications.filter(
    (app) => app.business_risk_level === "High Risk"
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

  const complianceScore =
    applications.length === 0
      ? 100
      : Math.max(0, 100 - highRiskBusinesses * 10);

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Ecosystem Dashboard...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        EPEW Ecosystem Dashboard
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Monitor the complete EPEW ecosystem, including entrepreneurs,
        supporters, coaches, partners, funding progress, marketplace visibility,
        business openings, quarterly reporting, and compliance risk.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <DashboardCard title="Entrepreneurs" value={totalEntrepreneurs} color="text-[#06245c]" />
        <DashboardCard title="Supporters" value={totalSupporters} color="text-green-700" />
        <DashboardCard title="Coaches" value={totalCoaches} color="text-blue-700" />
        <DashboardCard title="Partners" value={totalPartners} color="text-purple-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <DashboardCard title="Funded Businesses" value={fundedBusinesses} color="text-green-700" />
        <DashboardCard title="Businesses Opened" value={businessesOpened} color="text-blue-700" />
        <DashboardCard title="Quarterly Reporting" value={quarterlyReporting} color="text-purple-700" />
        <DashboardCard title="Marketplace Visible" value={marketplaceVisible} color="text-yellow-700" />
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
          title="High Risk Businesses"
          value={highRiskBusinesses}
          color="text-red-700"
        />

        <DashboardCard
          title="Compliance Score"
          value={`${complianceScore}%`}
          color="text-blue-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] mb-6">
            Funding Progress
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
            {releasedCategories} of {totalCategories} funding categories have
            been released.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] mb-6">
            EPEW Model Snapshot
          </h2>

          <div className="space-y-3 text-gray-700">
            <p>✅ 20 contribution units support each entrepreneur.</p>
            <p>✅ Each unit contributes $100 weekly.</p>
            <p>✅ The cycle runs for 52 weeks.</p>
            <p>✅ 50 participants can generate $100,000 weekly funding.</p>
            <p>✅ Funds are released by approved business category.</p>
          </div>
        </div>
      </div>

      <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Ecosystem Status Summary
        </h2>

        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Area</th>
              <th className="text-left p-4">Count / Value</th>
              <th className="text-left p-4">Meaning</th>
            </tr>
          </thead>

          <tbody>
            <SummaryRow
              area="Entrepreneur Pipeline"
              value={totalEntrepreneurs}
              meaning="Total entrepreneurs in the EPEW system."
            />

            <SummaryRow
              area="Supporter Base"
              value={totalSupporters}
              meaning="Total supporters registered in the ecosystem."
            />

            <SummaryRow
              area="Coach Network"
              value={totalCoaches}
              meaning="Coach candidates or approved coaches available."
            />

            <SummaryRow
              area="Partner Network"
              value={totalPartners}
              meaning="Partner candidates or approved partners available."
            />

            <SummaryRow
              area="Funding Progress"
              value={`${fundingProgress}%`}
              meaning="Progress of category-by-category fund releases."
            />

            <SummaryRow
              area="Compliance Risk"
              value={`${highRiskBusinesses} high risk`}
              meaning="Businesses requiring immediate compliance attention."
            />
          </tbody>
        </table>
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

function SummaryRow({
  area,
  value,
  meaning,
}: {
  area: string;
  value: string | number;
  meaning: string;
}) {
  return (
    <tr className="border-b">
      <td className="p-4 font-bold">{area}</td>
      <td className="p-4">{value}</td>
      <td className="p-4">{meaning}</td>
    </tr>
  );
}