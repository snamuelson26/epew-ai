"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminCohortsPage() {
  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCohorts();
  }, []);

  async function loadCohorts() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("cohorts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setMessage(error.message);
      setCohorts([]);
    } else {
      setCohorts(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <p className="text-2xl font-bold">Loading Cohort Manager...</p>
      </main>
    );
  }

  const activeCohorts = cohorts.filter(
    (item) => item.status !== "Completed" && item.status !== "Archived"
  ).length;

  const totalEntrepreneurs = cohorts.reduce(
    (sum, item) => sum + Number(item.qualified || 0),
    0
  );

  const totalUnits = cohorts.reduce(
    (sum, item) => sum + Number(item.total_units || 0),
    0
  );

  const meetingsScheduled = cohorts.filter(
    (item) => item.annual_meeting_date
  ).length;

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <section className="mb-8 rounded-3xl bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 p-10 text-white shadow-2xl">
        <p className="text-xl font-black uppercase tracking-widest text-lime-300">
          EPEW Intelligent Business Operating System
        </p>

        <h1 className="mt-4 text-6xl font-extrabold">
          Admin Cohort Manager
        </h1>

        <p className="mt-6 max-w-5xl text-2xl leading-relaxed text-blue-100">
          Manage entrepreneur cohorts, Annual Meetings, support units, waiting
          lists, funding schedules, business launches, and quarterly reporting
          from one command center.
        </p>
      </section>

      {message && (
        <div className="mb-8 rounded-2xl border-2 border-red-500 bg-red-100 p-5 text-xl font-bold text-red-700">
          {message}
        </div>
      )}

      <section className="mb-8 grid gap-6 md:grid-cols-4">
        <StatCard title="Active Cohorts" value={activeCohorts} icon="👥" />
        <StatCard
          title="Qualified Entrepreneurs"
          value={totalEntrepreneurs}
          icon="✅"
        />
        <StatCard title="Support Units" value={totalUnits} icon="🧩" />
        <StatCard
          title="Annual Meetings"
          value={meetingsScheduled}
          icon="⭐"
        />
      </section>

      <section className="mb-8 rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-extrabold">
              Cohort Operating System
            </h2>

            <p className="mt-3 text-xl leading-relaxed text-gray-700">
              Each cohort represents a group of up to 50 qualified entrepreneurs
              and up to 1,000 support units. The Annual Meeting is generated
              when the cohort is ready.
            </p>
          </div>

          <button
            onClick={loadCohorts}
            className="rounded-2xl bg-[#06245c] px-8 py-4 text-xl font-bold text-white hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
      </section>

      {cohorts.length === 0 ? (
        <section className="rounded-3xl bg-white p-12 text-center shadow-xl">
          <h2 className="text-4xl font-extrabold">No cohorts found yet.</h2>

          <p className="mx-auto mt-5 max-w-3xl text-2xl leading-relaxed text-gray-700">
            Once cohorts are created in Supabase, they will appear here for
            Annual Meeting preparation, funding scheduling, and business launch
            management.
          </p>
        </section>
      ) : (
        <section className="grid gap-8">
          {cohorts.map((cohort) => (
            <CohortCard key={cohort.id} cohort={cohort} />
          ))}
        </section>
      )}
    </main>
  );
}

function CohortCard({ cohort }: { cohort: any }) {
  const targetEntrepreneurs = Number(cohort.target_entrepreneurs || 50);
  const qualified = Number(cohort.qualified || 0);
  const totalUnits = Number(cohort.total_units || 0);
  const requiredUnits = Number(cohort.required_units || 1000);
  const waitingList = Number(cohort.waiting_list || 0);
  const marketplaceApproved = Number(cohort.marketplace_approved || 0);

  const entrepreneurProgress =
    targetEntrepreneurs > 0
      ? Math.min(Math.round((qualified / targetEntrepreneurs) * 100), 100)
      : 0;

  const unitProgress =
    requiredUnits > 0
      ? Math.min(Math.round((totalUnits / requiredUnits) * 100), 100)
      : 0;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="bg-gradient-to-r from-[#06245c] to-green-700 p-8 text-white">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-black uppercase tracking-widest text-lime-300">
              Cohort
            </p>

            <h2 className="mt-2 text-5xl font-extrabold">
              {cohort.cohort_number || "Cohort Pending"}
            </h2>

            <p className="mt-3 text-2xl text-blue-100">
              Status: {cohort.status || "Preparing"}
            </p>
          </div>

          <Link
            href={`/admin/cohorts/${cohort.id}`}
            className="rounded-2xl bg-white px-8 py-4 text-xl font-black text-[#06245c] hover:bg-lime-300"
          >
            Manage Cohort
          </Link>
        </div>
      </div>

      <div className="p-8">
        <div className="grid gap-6 md:grid-cols-4">
          <InfoBox
            title="Entrepreneurs"
            value={`${qualified} / ${targetEntrepreneurs}`}
            icon="👨‍💼"
          />

          <InfoBox
            title="Support Units"
            value={`${totalUnits} / ${requiredUnits}`}
            icon="🧩"
          />

          <InfoBox
            title="Marketplace Approved"
            value={marketplaceApproved}
            icon="🏢"
          />

          <InfoBox title="Waiting List" value={waitingList} icon="⏳" />
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <ProgressBlock
            title="Entrepreneur Qualification Progress"
            value={entrepreneurProgress}
            description={`${qualified} of ${targetEntrepreneurs} entrepreneurs qualified`}
          />

          <ProgressBlock
            title="Support Unit Progress"
            value={unitProgress}
            description={`${totalUnits} of ${requiredUnits} support units completed`}
          />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <DetailBox
            title="Annual Meeting Date"
            value={
              cohort.annual_meeting_date
                ? new Date(cohort.annual_meeting_date).toLocaleDateString()
                : "To Be Announced"
            }
          />

          <DetailBox
            title="Funding Start"
            value={
              cohort.funding_start
                ? new Date(cohort.funding_start).toLocaleDateString()
                : "Pending"
            }
          />

          <DetailBox
            title="Funding End"
            value={
              cohort.funding_end
                ? new Date(cohort.funding_end).toLocaleDateString()
                : "Pending"
            }
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-7 text-center shadow-xl">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-gray-600">{title}</h3>
      <p className="mt-3 text-5xl font-black text-[#06245c]">{value}</p>
    </div>
  );
}

function InfoBox({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-6 text-center shadow">
      <div className="text-5xl">{icon}</div>
      <p className="mt-4 text-lg font-bold text-gray-600">{title}</p>
      <p className="mt-3 text-3xl font-black text-[#06245c]">{value}</p>
    </div>
  );
}

function ProgressBlock({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-7 shadow">
      <div className="mb-4 flex justify-between gap-4">
        <h3 className="text-2xl font-extrabold">{title}</h3>
        <p className="text-2xl font-black text-green-700">{value}%</p>
      </div>

      <div className="h-5 overflow-hidden rounded-full bg-gray-300">
        <div
          className="h-full rounded-full bg-green-600"
          style={{ width: `${value}%` }}
        />
      </div>

      <p className="mt-4 text-lg text-gray-700">{description}</p>
    </div>
  );
}

function DetailBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <p className="text-lg font-bold text-gray-500">{title}</p>
      <p className="mt-3 text-2xl font-black text-[#06245c]">{value}</p>
    </div>
  );
}