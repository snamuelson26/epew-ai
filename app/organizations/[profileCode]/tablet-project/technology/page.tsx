"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = { profile_code: string; display_name: string; external_sender: string; entity_id: string };
type Project = { id: string; name: string };
type TechnologyContact = {
  id: string;
  company: string;
  contact_person: string | null;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  technology_category: string;
  request_summary: string | null;
  proposal_quote_received: boolean;
  cost: number | null;
  pilot_suitability: string | null;
  technical_compatibility: string | null;
  status: string;
  next_action: string | null;
  documents: unknown;
  contact_id: string | null;
};

type EventRow = { id: string; event_type: string; channel: string | null; direction: string | null; status: string | null; title: string | null; summary: string | null; message_preview: string | null; created_at: string };

const AREAS = ["Tablet Hardware", "Connectivity", "Solar & Power", "Learning Technology", "Device Management & Security"];

export default function TechnologyWorkspace() {
  const params = useParams<{ profileCode: string }>();
  const searchParams = useSearchParams();
  const profileCode = String(params?.profileCode || "");
  const requestedArea = searchParams.get("area") || "Tablet Hardware";
  const initialArea = AREAS.includes(requestedArea) ? requestedArea : "Tablet Hardware";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<TechnologyContact[]>([]);
  const [area, setArea] = useState(initialArea);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => { setArea(initialArea); }, [initialArea]);
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
      const { data: pr } = await supabase.from("organization_projects").select("id,name").eq("entity_id", p.entity_id).eq("project_code", "haiti-connected-learning-tablet").maybeSingle();
      if (!pr) return;
      setProject(pr as Project);
      const { data: rows, error: techError } = await supabase.from("organization_project_technology_contacts").select("id,company,contact_person,role_title,email,phone,technology_category,request_summary,proposal_quote_received,cost,pilot_suitability,technical_compatibility,status,next_action,documents,contact_id").eq("project_id", pr.id).order("company");
      if (techError) throw techError;
      setContacts((rows || []) as TechnologyContact[]);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Unable to load Technology workspace."); }
    finally { setLoading(false); }
  }

  async function openContact(row: TechnologyContact) {
    setSelectedId(row.id);
    setEvents([]);
    if (!row.contact_id) return;
    const { data } = await supabase.from("communication_events").select("id,event_type,channel,direction,status,title,summary,message_preview,created_at").eq("contact_id", row.contact_id).order("created_at", { ascending: true });
    setEvents((data || []) as EventRow[]);
  }

  const visible = useMemo(() => contacts.filter((row) => row.technology_category === area), [contacts, area]);
  const selected = contacts.find((row) => row.id === selectedId) || null;

  if (loading) return <main className="min-h-screen bg-slate-100 p-8">Loading Technology workspace...</main>;

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/tablet-project`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">← Tablet Project</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/tablet-project/technical-requirements`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Technical Requirements</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/communication-center`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Communication Center</Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-r from-[#10246f] to-green-700 p-8 text-white shadow-xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-lime-300">Tablet Project → Technology</p>
          <h1 className="mt-2 text-4xl font-extrabold">Technology Relationship Workspace</h1>
          <p className="mt-3 text-lg text-white/90">{project?.name || "Haiti Connected Learning & Tablet Project"}</p>
          <p className="mt-4 font-bold">External identity: Emanon Institute / {profile?.external_sender}</p>
        </section>

        {notice && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">{notice}</div>}

        <section className="rounded-3xl bg-white p-6 shadow">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {AREAS.map((name) => <button key={name} type="button" onClick={() => { setArea(name); setSelectedId(null); setEvents([]); }} className={`rounded-2xl border p-4 text-left font-extrabold transition ${area === name ? "border-green-500 bg-green-50 text-[#10246f]" : "border-slate-200 text-slate-700 hover:border-blue-300"}`}>{name}<span className="mt-2 block text-sm font-bold text-green-700">{contacts.filter((row) => row.technology_category === name).length} contacts</span></button>)}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-sm font-extrabold uppercase tracking-[0.2em] text-green-700">Focused Area</p><h2 className="mt-1 text-3xl font-extrabold text-[#10246f]">{area}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{visible.length}</span></div>
            {visible.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">No contacts have been added to this technology area yet.</p> : <div className="space-y-3">{visible.map((row) => <button key={row.id} type="button" onClick={() => openContact(row)} className={`w-full rounded-2xl border p-5 text-left transition ${selectedId === row.id ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-blue-300"}`}><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-xl font-extrabold text-slate-900">{row.company}</p><p className="mt-1 text-slate-600">{row.contact_person || "No contact person yet"}{row.role_title ? ` · ${row.role_title}` : ""}</p><p className="mt-1 text-sm text-slate-500">{row.email || row.phone || ""}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-800">{row.status}</span></div><div className="mt-4 grid gap-3 md:grid-cols-3"><Field label="What We Asked For" value={row.request_summary || "—"} /><Field label="Proposal / Quote" value={row.proposal_quote_received ? "Received" : "Pending"} /><Field label="Cost" value={row.cost == null ? "—" : `$${Number(row.cost).toLocaleString()}`} /><Field label="Pilot Suitability" value={row.pilot_suitability || "—"} /><Field label="Technical Compatibility" value={row.technical_compatibility || "—"} /><Field label="Next Action" value={row.next_action || "—"} /></div></button>)}</div>}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow">
            {!selected ? <div><h2 className="text-2xl font-extrabold text-[#10246f]">Technology Contact</h2><p className="mt-3 text-slate-600">Open a company to see its practical relationship details and communication history.</p></div> : <div className="space-y-6"><div><p className="text-sm font-extrabold uppercase tracking-wider text-green-700">{selected.technology_category}</p><h2 className="mt-1 text-3xl font-extrabold text-[#10246f]">{selected.company}</h2><p className="mt-2 text-slate-600">{selected.contact_person || "—"}{selected.role_title ? ` · ${selected.role_title}` : ""}</p></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Email" value={selected.email || "—"} /><Field label="Phone" value={selected.phone || "—"} /><Field label="Status" value={selected.status} /><Field label="Documents" value={Array.isArray(selected.documents) ? `${selected.documents.length} attached` : "0 attached"} /></div><div><h3 className="text-xl font-extrabold text-[#10246f]">Full Communication History</h3><div className="mt-3 space-y-3">{events.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-slate-600">No communication events are linked yet.</p> : events.map((event) => <div key={event.id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><p className="font-extrabold text-slate-900">{event.title || event.event_type}</p><span className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</span></div><p className="mt-2 text-sm text-slate-700">{event.summary || event.message_preview || "No summary"}</p><p className="mt-2 text-xs font-bold text-slate-500">{event.channel || "activity"} · {event.direction || "—"} · {event.status || "—"}</p></div>)}</div></div></div>}
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div>;
}
