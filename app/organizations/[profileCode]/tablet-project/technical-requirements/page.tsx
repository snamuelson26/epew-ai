"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = { display_name: string; external_sender: string; entity_id: string };
type Requirements = {
  tablet_size: string;
  operating_system: string;
  connectivity: string;
  battery_requirement: string;
  preferred_storage: string;
  offline_learning: boolean;
  automatic_sync: boolean;
  mdm_required: boolean;
  supported_languages: string[];
  solar_compatible_charging: boolean;
  pilot_min_students: number;
  pilot_max_students: number;
  additional_requirements: string | null;
};

export default function TechnicalRequirementsPage() {
  const params = useParams<{ profileCode: string }>();
  const profileCode = String(params?.profileCode || "");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => { void load(); }, [profileCode]);

  async function load() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/entrepreneurs/login"; return; }
      const { data: p, error } = await supabase.from("organization_portal_profiles").select("display_name,external_sender,entity_id").eq("auth_user_id", user.id).eq("profile_code", profileCode).eq("status", "active").maybeSingle();
      if (error) throw error;
      if (!p) { setNotice("This organization profile is not available for your login."); return; }
      setProfile(p as Profile);
      const { data: project } = await supabase.from("organization_projects").select("id").eq("entity_id", p.entity_id).eq("project_code", "haiti-connected-learning-tablet").maybeSingle();
      if (!project) return;
      const { data: req, error: reqError } = await supabase.from("organization_project_technical_requirements").select("tablet_size,operating_system,connectivity,battery_requirement,preferred_storage,offline_learning,automatic_sync,mdm_required,supported_languages,solar_compatible_charging,pilot_min_students,pilot_max_students,additional_requirements").eq("project_id", project.id).maybeSingle();
      if (reqError) throw reqError;
      if (req) setRequirements(req as Requirements);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Unable to load technical requirements."); }
    finally { setLoading(false); }
  }

  if (loading) return <main className="min-h-screen bg-slate-100 p-8">Loading technical requirements...</main>;

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/tablet-project`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">← Tablet Project</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/tablet-project/technology`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Technology</Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-r from-[#10246f] to-green-700 p-8 text-white shadow-xl md:p-10">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-lime-300">Tablet Project · Official Vendor Standard</p>
          <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">Technical Requirements</h1>
          <p className="mt-3 max-w-4xl text-lg text-white/90">This is the official Emanon baseline specification. Every technology vendor should receive the same requirements for evaluation and quotation.</p>
          <p className="mt-4 font-bold">External identity: Emanon Institute / {profile?.external_sender}</p>
        </section>

        {notice && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">{notice}</div>}

        <section className="rounded-3xl bg-white p-7 shadow">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Requirement label="Tablet Size" value={requirements?.tablet_size || "10–11 inch"} />
            <Requirement label="Operating System" value={requirements?.operating_system || "Android"} />
            <Requirement label="Connectivity" value={requirements?.connectivity || "LTE / eSIM compatible"} />
            <Requirement label="Battery" value={requirements?.battery_requirement || "Large battery"} />
            <Requirement label="Storage" value={requirements?.preferred_storage || "128 GB preferred"} />
            <Requirement label="Offline Learning" value={requirements?.offline_learning ? "Required" : "Not required"} />
            <Requirement label="Automatic Synchronization" value={requirements?.automatic_sync ? "Required" : "Not required"} />
            <Requirement label="Device Management" value={requirements?.mdm_required ? "MDM required" : "Optional"} />
            <Requirement label="Languages" value={(requirements?.supported_languages || ["English", "Haitian Creole", "French"]).join(" · ")} />
            <Requirement label="Solar-Compatible Charging" value={requirements?.solar_compatible_charging ? "Required" : "Optional"} />
            <Requirement label="Pilot Size" value={`${requirements?.pilot_min_students || 50}–${requirements?.pilot_max_students || 100} students`} />
          </div>

          <div className="mt-7 rounded-2xl border-l-4 border-green-600 bg-green-50 p-5">
            <h2 className="text-xl font-extrabold text-[#10246f]">Vendor Evaluation Rule</h2>
            <p className="mt-2 leading-relaxed text-slate-700">A vendor proposal should be evaluated against the same baseline: 10–11 inch Android tablet, LTE/eSIM compatibility, large battery, 128 GB preferred storage, offline learning, automatic synchronization, MDM, English/Haitian Creole/French support, solar-compatible charging, and suitability for a 50–100 student pilot.</p>
          </div>

          {requirements?.additional_requirements && <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-slate-700"><p className="font-extrabold text-slate-900">Additional Notes</p><p className="mt-2 leading-relaxed">{requirements.additional_requirements}</p></div>}
        </section>
      </div>
    </main>
  );
}

function Requirement({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-lg font-extrabold text-slate-900">{value}</p></div>;
}
