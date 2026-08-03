"use client";


import { useTranslation } from "@/app/components/enterprise/language";
import Link from "next/link";

export default function EventSessionDetailsPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
      <section className="mb-8 rounded-[2rem] bg-gradient-to-r from-black via-[#06245c] to-green-900 p-10 text-white shadow-2xl">
        <Link
          href="/admin/ibos-centers/event-center/sessions"
          className="text-lg font-black text-lime-300"
        >
          {t("content.back_to_sessions")}
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
        <ModuleCard title="Participants" description={t("attributes.description.assign_qualified_entrepreneurs_to_this_session")} />
        <ModuleCard title="Guest Registration" description={t("attributes.description.manage_one_official_guest_per_entrepreneur")} />
        <ModuleCard title="Attendance" description={t("attributes.description.check_in_entrepreneurs_and_guests")} />
        <ModuleCard title="Certificates" description={t("attributes.description.generate_certificates_qr_codes_and_registry_entries")} />
        <ModuleCard title="ORGDH Gives Back" description={t("attributes.description.run_the_official_raffle_for_eligible_participants")} />
        <ModuleCard title="Funding Queue" description={t("attributes.description.create_queue_positions_from_priority_and_raffle_results")} />
        <ModuleCard title="Stage Manager" description={t("attributes.description.control_ceremony_order_and_the_45_second_presentation")} />
        <ModuleCard title="Statistics" description={t("attributes.description.review_live_event_performance_and_completion_status")} />
        <ModuleCard title="Archive" description={t("attributes.description.finalize_the_event_and_preserve_the_official_record")} />
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