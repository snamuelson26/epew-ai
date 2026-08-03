"use client";

import Link from "next/link";

export default function EventSessionDetailsPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
      <section className="mb-8 rounded-[2rem] bg-gradient-to-r from-black via-[#06245c] to-green-900 p-10 text-white shadow-2xl">
        <Link
          href="/admin/ibos-centers/event-center/sessions"
          className="text-lg font-black text-lime-300"
        >
          ← Back to Sessions
        </Link>

        <p className="mt-8 text-xl font-black uppercase tracking-[0.45em] text-lime-300">
          Event Command Center
        </p>

        <h1 className="mt-4 text-6xl font-extrabold">
          EPEW Annual Meeting
          <br />
          Queens Session
        </h1>

        <p className="mt-6 max-w-6xl text-2xl leading-relaxed text-blue-100">
          Manage this event session from registration to certificates, ORGDH
          Gives Back raffle, funding queue, stage presentation, and archive.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Participants" value="0 / 50" />
        <Card title="Guests" value="0 / 50" />
        <Card title="Certificates" value="0" />
        <Card title="Stage Completed" value="0" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <ModuleCard title="Participants" description="Assign qualified entrepreneurs to this session." />
        <ModuleCard title="Guest Registration" description="Manage one official guest per entrepreneur." />
        <ModuleCard title="Attendance" description="Check in entrepreneurs and guests." />
        <ModuleCard title="Certificates" description="Generate certificates, QR codes, and registry entries." />
        <ModuleCard title="ORGDH Gives Back" description="Run the official raffle for eligible participants." />
        <ModuleCard title="Funding Queue" description="Create queue positions from priority and raffle results." />
        <ModuleCard title="Stage Manager" description="Control ceremony order and the 45-second presentation timer." />
        <ModuleCard title="Statistics" description="Review live event performance and completion status." />
        <ModuleCard title="Archive" description="Finalize the event and preserve the official record." />
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">
        {title}
      </p>
      <h2 className="mt-4 text-5xl font-extrabold text-[#06245c]">
        {value}
      </h2>
    </div>
  );
}

function ModuleCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl">
      <h3 className="text-3xl font-extrabold text-[#06245c]">{title}</h3>
      <p className="mt-4 text-lg leading-relaxed text-gray-600">
        {description}
      </p>

      <button className="mt-6 rounded-2xl bg-[#06245c] px-6 py-3 font-black text-white hover:bg-blue-900">
        Open
      </button>
    </div>
  );
}