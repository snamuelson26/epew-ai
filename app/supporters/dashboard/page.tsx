"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import Hero from "./components/Hero";
import ImpactSummary from "./components/ImpactSummary";
import CommunityImpact from "./components/CommunityImpact";
import EntrepreneurCohort from "./components/EntrepreneurCohort";
import JourneyTimeline from "./components/JourneyTimeline";
import Invitations from "./components/Invitations";
import Newsroom from "./components/Newsroom";
import EntrepreneurPortfolio from "./components/EntrepreneurPortfolio";
import SupportingInformation from "./components/SupportingInformation";
import SupporterMessage from "./components/SupporterMessage";
import Legacy from "./components/Legacy";

import { SupportCommitment, Supporter } from "./components/types";

export default function SupporterDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<Supporter | null>(null);
  const [projection, setProjection] = useState<any>(null);
  const [commitments, setCommitments] = useState<SupportCommitment[]>([]);

  useEffect(() => {
    loadSupporterDashboard();
  }, []);

  async function loadSupporterDashboard() {
    setLoading(true);

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

    if (supporterError || !supporterData) {
      setSupporter(null);
      setProjection(null);
      setCommitments([]);
      setLoading(false);
      return;
    }

    setSupporter(supporterData);

    const { data: projectionData, error: projectionError } = await supabase
      .from("supporter_projections")
      .select("*")
      .eq("supporter_id", supporterData.id)
      .maybeSingle();

    if (projectionError) {
      console.log("Supporter projection error:", projectionError);
      setProjection(null);
    } else {
      setProjection(projectionData);
    }

    const { data: commitmentData, error: commitmentError } = await supabase
      .from("support_commitments")
      .select("*")
      .eq("supporter_email", supporterData.email)
      .order("created_at", { ascending: false });

    if (commitmentError) {
      console.log("Commitment error:", commitmentError);
      setCommitments([]);
    } else {
      setCommitments((commitmentData || []) as SupportCommitment[]);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/supporters/login";
  }

  const dashboardStats = useMemo(() => {
    const totalUnits = Number(projection?.total_units || 0);

    const totalContributions = Number(
      projection?.total_contributions || 0
    );

    const businessesSupported = Number(
      projection?.businesses_supported || 0
    );

    const entrepreneursEmpowered = businessesSupported;

    const activeCommitments = Number(
      projection?.active_commitments || 0
    );

    const benefitsAvailable = commitments.reduce(
      (sum, item) => sum + Number(item.benefits_available || 0),
      0
    );

    const businessesOpened = commitments.filter(
      (item) =>
        item.business_status === "Business Opened" ||
        item.business_status === "Operating"
    ).length;

    const communitiesStrengthened = new Set(
      commitments
        .map((item) => item.community || item.country)
        .filter(Boolean)
    ).size;

    const jobsCreated = commitments.reduce(
      (sum, item) => sum + Number(item.jobs_created || 0),
      0
    );

    const quarterlyReportsReceived = commitments.reduce(
      (sum, item) => sum + Number(item.quarterly_reports_count || 0),
      0
    );

    const grandOpeningsCelebrated = commitments.filter(
      (item) => item.grand_opening_date
    ).length;

    const primaryParticipationType =
      commitments[0]?.support_type || "weekly";

    return {
      totalUnits,
      totalContributions,
      activeCommitments,
      benefitsAvailable,
      businessesSupported,
      entrepreneursEmpowered,
      businessesOpened,
      communitiesStrengthened,
      jobsCreated,
      quarterlyReportsReceived,
      grandOpeningsCelebrated,
      primaryParticipationType,
    };
  }, [projection, commitments]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10">
        <p className="text-2xl font-bold text-[#06245c]">
          Loading Main Supporter Portal...
        </p>
      </main>
    );
  }

  if (!supporter) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <div className="rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="mb-4 text-4xl font-extrabold">
            Supporter Profile Not Found
          </h1>

          <p className="mb-6 text-xl text-gray-700">
            Your login is active, but no supporter profile is connected to this
            account yet.
          </p>

          <a
            href="/supporters/register"
            className="inline-block rounded-2xl bg-[#06245c] px-8 py-4 text-xl font-bold text-white"
          >
            Create Supporter Profile
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <Hero supporter={supporter} onLogout={handleLogout} />

      <ImpactSummary
        entrepreneursEmpowered={dashboardStats.entrepreneursEmpowered}
        businessesSupported={dashboardStats.businessesSupported}
        businessesOpened={dashboardStats.businessesOpened}
        communitiesStrengthened={dashboardStats.communitiesStrengthened}
        jobsCreated={dashboardStats.jobsCreated}
        grandOpeningsCelebrated={dashboardStats.grandOpeningsCelebrated}
        quarterlyReportsReceived={dashboardStats.quarterlyReportsReceived}
        participationBenefitsAvailable={dashboardStats.benefitsAvailable}
      />

      <CommunityImpact
        entrepreneurGroup={50}
        communities={Math.max(dashboardStats.communitiesStrengthened, 8)}
        countries={3}
        jobsCreated={Math.max(dashboardStats.jobsCreated, 50)}
      />

      <EntrepreneurCohort
        cohortYear={new Date().getFullYear()}
        entrepreneurGroup={50}
        qualified={18}
        annualMeetingDate="To Be Announced"
        fundingStatus="Preparing Annual Meeting"
      />

      <JourneyTimeline currentStage="Annual Meeting" />

      <Invitations />

      <Newsroom />

      <EntrepreneurPortfolio commitments={commitments} />

      <SupportingInformation
        totalUnits={dashboardStats.totalUnits}
        totalContributions={dashboardStats.totalContributions}
        benefitsAvailable={dashboardStats.benefitsAvailable}
        paymentStatus="Current"
      />

      <SupporterMessage
        participationType={dashboardStats.primaryParticipationType}
        nextPaymentDate="To Be Scheduled"
      />

      <Legacy />
    </main>
  );
}