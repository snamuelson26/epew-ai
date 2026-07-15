"use client";

import Link from "next/link";

export default function Hero({
  cohort,
  entrepreneurProgress,
  unitProgress,
}: {
  cohort: any;
  entrepreneurProgress: number;
  unitProgress: number;
}) {
  const meetingDate = cohort?.annual_meeting_date
    ? new Date(cohort.annual_meeting_date).toLocaleDateString()
    : "To Be Announced";

  const fundingStart = cohort?.funding_start
    ? new Date(cohort.funding_start).toLocaleDateString()
    : "Pending";

  const fundingEnd = cohort?.funding_end
    ? new Date(cohort.funding_end).toLocaleDateString()
    : "Pending";

  return (
    <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 text-white shadow-2xl">
      <div className="p-10">
        <Link
          href="/admin/cohorts"
          className="inline-block text-lg font-black text-lime-300 hover:text-white"
        >
          ← Back to Cohort Manager
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
          <div>
            <p className="text-xl font-black uppercase tracking-widest text-lime-300">
              IBOS Cohort Command Center
            </p>

            <h1 className="mt-5 text-6xl font-extrabold leading-tight">
              Cohort {cohort?.cohort_number || "Pending"}
            </h1>

            <p className="mt-5 text-2xl font-bold text-blue-100">
              {cohort?.status || "Preparing"}
            </p>

            <p className="mt-6 max-w-5xl text-2xl leading-relaxed text-blue-100">
              The Intelligent Business Operating System for planning,
              coordinating, funding, launching, and monitoring every
              entrepreneur cohort.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#entrepreneurs"
                className="rounded-2xl bg-white px-8 py-4 text-xl font-black text-[#06245c] hover:bg-lime-300"
              >
                Entrepreneurs
              </a>

              <a
                href="#annual-meeting"
                className="rounded-2xl bg-lime-300 px-8 py-4 text-xl font-black text-[#06245c] hover:bg-white"
              >
                Annual Meeting
              </a>

              <a
                href="#ibos-intelligence"
                className="rounded-2xl border-2 border-white px-8 py-4 text-xl font-black text-white hover:bg-white hover:text-[#06245c]"
              >
                IBOS Intelligence
              </a>
            </div>
          </div>

          <div className="rounded-3xl bg-white/10 p-8 shadow-2xl ring-1 ring-white/20">
            <h2 className="text-3xl font-extrabold text-lime-300">
              Command Status
            </h2>

            <div className="mt-6 space-y-5">
              <HeroMetric
                label="Entrepreneur Progress"
                value={`${entrepreneurProgress}%`}
              />

              <HeroMetric label="Support Unit Progress" value={`${unitProgress}%`} />

              <HeroMetric label="Annual Meeting" value={meetingDate} />

              <HeroMetric
                label="Funding Window"
                value={`${fundingStart} - ${fundingEnd}`}
              />

              <HeroMetric
                label="Meeting Format"
                value={cohort?.meeting_type || "Hybrid"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        <ProgressFooter
          title="Entrepreneur Qualification"
          value={entrepreneurProgress}
        />

        <ProgressFooter title="Support Unit Completion" value={unitProgress} />
      </div>
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-5">
      <p className="text-lg font-bold text-blue-100">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function ProgressFooter({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-black/20 p-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-black">{title}</h3>
        <p className="text-2xl font-black text-lime-300">{value}%</p>
      </div>

      <div className="h-5 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-lime-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}