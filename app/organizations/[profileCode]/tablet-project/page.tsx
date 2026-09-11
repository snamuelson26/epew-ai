"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = { profile_code: string; display_name: string; external_sender: string; entity_id: string };
type Project = { id: string; name: string; pilot_status: string | null; status: string };

const AREAS = [
  ["Tablet Hardware", "Manufacturer, model, specifications, samples, pricing, warranty, parts, branding, LTE/eSIM, cases, keyboards, and charging."],
  ["Connectivity", "Digicel, Natcom, Starlink and other providers; SIM plans, data pricing, coverage, school connectivity, hotspots, hubs, and sponsored connectivity."],
  ["Solar & Power", "Power banks, solar charging, school charging stations, batteries, routers, backup power, and maintenance."],
  ["Learning Technology", "LMS, offline course storage, automatic sync, local content server, multilingual content, testing, assignments, and student progress."],
  ["Device Management & Security", "MDM, remote configuration, app installation, inventory, serial numbers, lost/stolen controls, filtering, updates, and remote wipe."],
] as const;

export default function TabletProjectHub() {
  const params = useParams<{ profileCode: string }>();
  const profileCode = String(params?.profileCode || "");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => { void load(); }, [profileCode]);

  async function load() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/entrepreneurs/login"; return; }
      const { data: p, error } = await supabase.from("organization_portal_profiles").select("profile_code,display_name,external_sender,entity_id").eq("auth_user_id", user.id).eq("profile_code", profileCode).eq("status", "active").maybeSingle();
      if (error) throw error;
      if (!p) { setNotice("This organization profile is not available for your login."); return; }
      setProfile(p as Profile);
      const { data: pr } = await supabase.from("organization_projects").select("id,name,pilot_status,status").eq("entity_id", p.entity_id).eq("project_code", "haiti-connected-learning-tablet").maybeSingle();
      if (pr) {
        setProject(pr as Project);
        const { data: tech } = await supabase.from("organization_project_technology_contacts").select("technology_category").eq("project_id", pr.id);
        const next: Record<string, number> = {};
        for (const row of tech || []) next[String(row.technology_category)] = (next[String(row.technology_category)] || 0) + 1;
        setCounts(next);
      }
    } catch (e) { setNotice(e instanceof Error ? e.message : "Unable to load the Tablet Project."); }
    finally { setLoading(false); }
  }

  if (loading) return <main className="min-h-screen bg-slate-100 p-8">Loading Tablet Project...</main>;

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/dashboard`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">← Emanon Dashboard</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/communication-center`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Communication Center</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/grant-contacts`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Grant Contacts</Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-r from-[#10246f] to-green-700 p-8 text-white shadow-xl md:p-10">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-lime-300">{profile?.display_name || "Emanon Institute"} · {profileCode}</p>
          <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">Tablet Project</h1>
          <p className="mt-3 text-xl font-bold">{project?.name || "Haiti Connected Learning & Tablet Project"}</p>
          <p className="mt-3 max-w-4xl text-white/90">Technology is managed inside the Tablet Project. Hardware, connectivity, solar/power, learning technology, and device management all feed into one project record.</p>
          <p className="mt-4 font-bold">External identity: Emanon Institute / {profile?.external_sender}</p>
        </section>

        {notice && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">{notice}</div>}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/tablet-project/technology`} className="rounded-3xl border border-slate-200 bg-white p-6 shadow transition hover:-translate-y-1 hover:border-green-400">
            <p className="text-sm font-extrabold uppercase tracking-wider text-green-700">Tablet Project →</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#10246f]">Technology</h2>
            <p className="mt-3 text-slate-600">Open all five technology workspaces and manage companies, contacts, requests, quotes, costs, pilot suitability, compatibility, status, next actions, documents, and communication history.</p>
            <span className="mt-5 inline-flex rounded-xl bg-[#10246f] px-4 py-2 font-bold text-white">Open Technology</span>
          </Link>

          <Link href={`/organizations/${encodeURIComponent(profileCode)}/tablet-project/technical-requirements`} className="rounded-3xl border border-slate-200 bg-white p-6 shadow transition hover:-translate-y-1 hover:border-green-400">
            <p className="text-sm font-extrabold uppercase tracking-wider text-green-700">Official Standard</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#10246f]">Technical Requirements</h2>
            <p className="mt-3 text-slate-600">The official Emanon specification used consistently with manufacturers, telecoms, power providers, learning-platform vendors, and device-management vendors.</p>
            <span className="mt-5 inline-flex rounded-xl bg-green-700 px-4 py-2 font-bold text-white">View Requirements</span>
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
            <p className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Pilot</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#10246f]">50–100 Students</h2>
            <p className="mt-3 text-slate-600">Current pilot status: <span className="font-extrabold">{project?.pilot_status || "Planning"}</span>.</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-7 shadow">
          <div className="mb-5"><p className="text-sm font-extrabold uppercase tracking-[0.2em] text-green-700">Hierarchy</p><h2 className="mt-1 text-3xl font-extrabold text-[#10246f]">Tablet Project → Technology</h2></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {AREAS.map(([title, description]) => (
              <Link key={title} href={`/organizations/${encodeURIComponent(profileCode)}/tablet-project/technology?area=${encodeURIComponent(title)}`} className="rounded-2xl border border-slate-200 p-5 transition hover:border-green-500 hover:bg-green-50">
                <h3 className="font-extrabold text-[#10246f]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                <p className="mt-4 text-sm font-bold text-green-700">{counts[title] || 0} contacts</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
