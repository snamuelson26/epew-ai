"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

import Hero from "./components/Hero";
import ExecutiveOverview from "./components/ExecutiveOverview";
import EntrepreneurRoster from "./components/EntrepreneurRoster";
import WaitingList from "./components/WaitingList";
import SupportUnitCenter from "./components/SupportUnitCenter";
import AnnualMeetingCenter from "./components/AnnualMeetingCenter";
import CertificationCenter from "./components/CertificationCenter";
import ParticipantsCenter from "./components/ParticipantsCenter";
import ProgramCenter from "./components/ProgramCenter";

export default function CohortCommandCenterPage() {
  const params = useParams();
  const cohortId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [cohort, setCohort] = useState<any>(null);
  const [meeting, setMeeting] = useState<any>(null);
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const [supporters, setSupporters] = useState<any[]>([]);

  useEffect(() => {
    if (cohortId) {
      loadData();
    }
  }, [cohortId]);

  async function loadData() {
    setLoading(true);

    const { data: cohortData } = await supabase
      .from("cohorts")
      .select("*")
      .eq("id", cohortId)
      .single();

    setCohort(cohortData);

    const { data: meetingData } = await supabase
      .from("annual_meetings")
      .select("*")
      .eq("cohort_id", cohortId)
      .maybeSingle();

    setMeeting(meetingData);

    const { data: entrepreneurData } = await supabase
      .from("cohort_entrepreneurs")
      .select("*")
      .eq("cohort_id", cohortId)
      .order("created_at");

    setEntrepreneurs(entrepreneurData || []);

    const { data: supporterData } = await supabase
      .from("cohort_supporters")
      .select("*")
      .eq("cohort_id", cohortId);

    setSupporters(supporterData || []);

    setLoading(false);
  }

  const entrepreneurProgress = useMemo(() => {
    if (!cohort) return 0;

    return Math.round(
      (entrepreneurs.filter(
        (x) =>
          x.qualification_status === "Qualified" ||
          x.status === "Qualified"
      ).length /
        (cohort.target_entrepreneurs || 50)) *
        100
    );
  }, [entrepreneurs, cohort]);

  const unitProgress = useMemo(() => {
    if (!cohort) return 0;

    const units = entrepreneurs.reduce(
      (sum, item) => sum + Number(item.units_supported || 0),
      0
    );

    return Math.round((units / (cohort.required_units || 1000)) * 100);
  }, [entrepreneurs, cohort]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10">
        <h1 className="text-3xl font-black text-[#06245c]">
          Loading IBOS Cohort Command Center...
        </h1>
      </main>
    );
  }

  if (!cohort) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10">
        <h1 className="text-4xl font-black text-red-700">
          Cohort Not Found
        </h1>
      </main>
    );
  }

  const totalUnits = entrepreneurs.reduce(
    (sum, item) => sum + Number(item.units_supported || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8">
      <Hero
        cohort={cohort}
        entrepreneurProgress={entrepreneurProgress}
        unitProgress={unitProgress}
      />

      <ExecutiveOverview
        qualified={
          entrepreneurs.filter(
            (x) =>
              x.status === "Qualified" ||
              x.qualification_status === "Qualified"
          ).length
        }
        targetEntrepreneurs={cohort.target_entrepreneurs || 50}
        marketplaceApproved={
          entrepreneurs.filter((x) => x.marketplace_status === "Approved")
            .length
        }
        waitingList={entrepreneurs.filter((x) => x.status === "Waiting").length}
        totalUnits={totalUnits}
        requiredUnits={cohort.required_units || 1000}
        supporters={supporters.length}
        jobsProjected={(cohort.target_entrepreneurs || 50) * 8}
        communities={8}
        countries={3}
        launchReadiness={entrepreneurProgress}
      />

      <EntrepreneurRoster
        entrepreneurs={entrepreneurs.filter((x) => x.status !== "Waiting")}
      />

      <WaitingList
        entrepreneurs={entrepreneurs.filter((x) => x.status === "Waiting")}
      />

      <SupportUnitCenter entrepreneurs={entrepreneurs} />

      <AnnualMeetingCenter
        cohort={cohort}
        meeting={meeting}
        entrepreneurs={entrepreneurs}
      />

      <CertificationCenter cohort={cohort} entrepreneurs={entrepreneurs} />

      <ParticipantsCenter entrepreneurs={entrepreneurs} supporters={supporters} />

      <ProgramCenter cohort={cohort} entrepreneurs={entrepreneurs} />

      <div className="mt-10 rounded-3xl bg-white p-10 shadow-xl">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          🚧 Coming Next
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <FutureCard title="IBOS Funding Center" />
          <FutureCard title="IBOS Business Launch Center" />
          <FutureCard title="IBOS Cohort Completion Center" />
          <FutureCard title="IBOS Impact Center" />
          <FutureCard title="IBOS Intelligence Center" />
          <FutureCard title="IBOS Marketing & Media Center" />
          <FutureCard title="IBOS Reports Center" />
          <FutureCard title="Annual Meeting Live Display" />
        </div>
      </div>
    </main>
  );
}

function FutureCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#06245c] bg-[#f5f7fb] p-8 text-center">
      <h3 className="text-2xl font-black text-[#06245c]">{title}</h3>
      <p className="mt-3 text-gray-600">Module Coming Next</p>
    </div>
  );
}