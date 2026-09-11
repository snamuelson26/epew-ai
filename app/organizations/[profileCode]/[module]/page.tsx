"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = { profile_code: string; display_name: string; external_sender: string; entity_id: string; status: string };
type Contact = { id: string; display_name: string | null; organization: string | null; job_title: string | null; email: string | null; phone: string | null; country: string | null; preferred_language: string | null; website?: string | null; status: string | null };
type Relationship = { id: string; contact_id: string; relationship_type: string; relationship_stage: string; priority: string; next_action: string | null; follow_up_at: string | null; project_codes: string[] | null; notes: string | null };
type Event = { id: string; contact_id: string; event_type: string; channel: string | null; direction: string | null; status: string | null; title: string | null; summary: string | null; message_preview: string | null; metadata: Record<string, unknown> | null; created_at: string };
type Grant = { id: string; grant_name: string; funder_name: string | null; amount_available: number | null; eligibility: string | null; deadline: string | null; application_url: string | null; documents_required: string[] | null; requested_amount: number | null; loi_status: string | null; application_status: string; submission_date: string | null; response_date: string | null; follow_up_at: string | null };
type Project = { id: string; project_code: string; name: string; description: string | null; status: string; technical_requirements: string | null; pilot_status: string | null; next_action: string | null };
type DocumentRow = { id: string; title: string; document_type: string; status: string; external_url: string | null; storage_path: string | null; notes: string | null; created_at: string };
type Meeting = { id: string; title: string; contact_id: string | null; meeting_at: string | null; meeting_link: string | null; status: string; notes: string | null; next_action: string | null; follow_up_at: string | null };

const RELATIONSHIP_TYPES = ["Grant & Foundation", "Philanthropist/Donor", "Tablet Manufacturer", "Telecommunications", "Solar/Energy", "Education Partner", "Technology Partner", "Government/Ministry", "School Partner", "Student", "Parent/Guardian", "Teacher/Staff", "Vendor", "Other"];
const STAGES = ["New Contact", "Contacted", "Responded", "Meeting", "Proposal/Application", "Negotiation/Review", "Approved/Partnered", "Closed/Declined"];

const MODULE_INFO: Record<string, { title: string; groupSlug?: string; description: string }> = {
  "communication-center": { title: "Communication Center", description: "Emanon Institute relationship-management and follow-up center." },
  "grant-contacts": { title: "Grant Contacts", groupSlug: "emanon-001-grant-contacts", description: "Funders, grant opportunities, eligibility, deadlines, applications, documents, requested amounts, and follow-up." },
  "tablet-project": { title: "Tablet Project", groupSlug: "emanon-001-tablet-project", description: "Manufacturers, telecoms, solar providers, logistics, schools, sponsors, technical requirements, and pilot status." },
  vendors: { title: "Vendors", groupSlug: "emanon-001-vendors", description: "Quotes, products and services, approvals, negotiation history, documents, and next actions." },
  partners: { title: "Partners", groupSlug: "emanon-001-partners", description: "Strategic, education, nonprofit, technology, and implementation partners by relationship stage." },
  documents: { title: "Documents", description: "Proposals, grant packages, tablet specifications, quotations, contracts, nonprofit records, budgets, presentations, and signed agreements." },
  "meetings-followups": { title: "Meetings / Follow-Ups", description: "Meeting requests, Zoom links, dates, notes, next actions, reminders, and follow-up history." },
};

function money(value: number | null) {
  return value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function when(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

export default function OrganizationModulePage() {
  const params = useParams<{ profileCode: string; module: string }>();
  const profileCode = String(params?.profileCode || "");
  const moduleKey = String(params?.module || "");
  const info = useMemo(() => MODULE_INFO[moduleKey] || null, [moduleKey]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [arrangeMode, setArrangeMode] = useState("professionalize");
  const [followUp, setFollowUp] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => { void load(); }, [profileCode, moduleKey]);

  async function load() {
    setLoading(true); setNotice("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/entrepreneurs/login"; return; }
      const { data: profileData, error } = await supabase.from("organization_portal_profiles").select("profile_code,display_name,external_sender,entity_id,status").eq("auth_user_id", user.id).eq("profile_code", profileCode).eq("status", "active").maybeSingle();
      if (error) throw error;
      if (!profileData) { setNotice("This organization profile is not available for your login."); return; }
      const p = profileData as Profile; setProfile(p);

      const { data: groupRows } = await supabase.from("communication_groups").select("id,slug").eq("entity_id", p.entity_id);
      let groupIds = (groupRows || []).map((g: any) => String(g.id));
      if (info?.groupSlug) groupIds = (groupRows || []).filter((g: any) => g.slug === info.groupSlug).map((g: any) => String(g.id));
      let contactIds: string[] = [];
      if (groupIds.length) {
        const { data: memberRows } = await supabase.from("communication_group_members").select("contact_id").in("group_id", groupIds).eq("membership_status", "active");
        contactIds = Array.from(new Set((memberRows || []).map((m: any) => String(m.contact_id))));
      }
      if (contactIds.length) {
        const { data: contactRows } = await supabase.from("communication_contacts").select("id,display_name,organization,job_title,email,phone,country,preferred_language,status").in("id", contactIds).order("display_name");
        setContacts((contactRows || []) as Contact[]);
      } else setContacts([]);

      const [relationshipRes, grantRes, projectRes, documentRes, meetingRes] = await Promise.all([
        supabase.from("organization_relationships").select("id,contact_id,relationship_type,relationship_stage,priority,next_action,follow_up_at,project_codes,notes").eq("entity_id", p.entity_id).order("updated_at", { ascending: false }),
        supabase.from("organization_grants").select("id,grant_name,funder_name,amount_available,eligibility,deadline,application_url,documents_required,requested_amount,loi_status,application_status,submission_date,response_date,follow_up_at").eq("entity_id", p.entity_id).order("deadline", { ascending: true }),
        supabase.from("organization_projects").select("id,project_code,name,description,status,technical_requirements,pilot_status,next_action").eq("entity_id", p.entity_id).order("name"),
        supabase.from("organization_documents").select("id,title,document_type,status,external_url,storage_path,notes,created_at").eq("entity_id", p.entity_id).order("created_at", { ascending: false }),
        supabase.from("organization_meetings_followups").select("id,title,contact_id,meeting_at,meeting_link,status,notes,next_action,follow_up_at").eq("entity_id", p.entity_id).order("meeting_at", { ascending: true }),
      ]);
      setRelationships((relationshipRes.data || []) as Relationship[]);
      setGrants((grantRes.data || []) as Grant[]);
      setProjects((projectRes.data || []) as Project[]);
      setDocuments((documentRes.data || []) as DocumentRow[]);
      setMeetings((meetingRes.data || []) as Meeting[]);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Unable to load this Emanon workspace."); }
    finally { setLoading(false); }
  }

  async function openContact(id: string) {
    setSelectedId(id); setNotice("");
    const { data } = await supabase.from("communication_events").select("id,contact_id,event_type,channel,direction,status,title,summary,message_preview,metadata,created_at").eq("contact_id", id).order("created_at", { ascending: true });
    setEvents((data || []) as Event[]);
    const r = relationships.find((x) => x.contact_id === id);
    setFollowUp(r?.follow_up_at ? new Date(r.follow_up_at).toISOString().slice(0, 16) : "");
  }

  async function saveRelationshipField(field: "relationship_type" | "relationship_stage" | "priority", value: string) {
    if (!profile || !selectedId) return;
    const existing = relationships.find((x) => x.contact_id === selectedId);
    const payload = { entity_id: profile.entity_id, contact_id: selectedId, relationship_type: existing?.relationship_type || "Other", relationship_stage: existing?.relationship_stage || "New Contact", priority: existing?.priority || "Normal", [field]: value, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("organization_relationships").upsert(payload, { onConflict: "entity_id,contact_id" });
    if (error) setNotice(error.message); else { setNotice("Relationship updated."); await load(); setSelectedId(selectedId); }
  }

  async function saveFollowUp() {
    if (!profile || !selectedId) return;
    const existing = relationships.find((x) => x.contact_id === selectedId);
    const { error } = await supabase.from("organization_relationships").upsert({ entity_id: profile.entity_id, contact_id: selectedId, relationship_type: existing?.relationship_type || "Other", relationship_stage: existing?.relationship_stage || "New Contact", priority: existing?.priority || "Normal", follow_up_at: followUp ? new Date(followUp).toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: "entity_id,contact_id" });
    setNotice(error ? error.message : "Follow-up saved.");
    if (!error) await load();
  }

  async function arrangeMessage() {
    if (!messageDraft.trim()) { setNotice("Enter a message first."); return; }
    setWorking(true); setNotice("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch("/api/organizations/communication/arrange-message", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` }, body: JSON.stringify({ profileCode, message: messageDraft, instruction: arrangeMode }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to arrange message.");
      setMessageDraft(String(data.arranged || messageDraft));
    } catch (e) { setNotice(e instanceof Error ? e.message : "Unable to arrange message."); }
    finally { setWorking(false); }
  }

  if (!info) return <main className="min-h-screen bg-slate-100 p-8"><div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow"><h1 className="text-2xl font-extrabold">Module not found</h1></div></main>;
  if (loading) return <main className="min-h-screen bg-slate-100 p-8"><p className="text-slate-600">Loading {info.title}...</p></main>;

  const selected = contacts.find((c) => c.id === selectedId) || null;
  const relationship = selectedId ? relationships.find((r) => r.contact_id === selectedId) || null : null;
  const contactMeetings = selectedId ? meetings.filter((m) => m.contact_id === selectedId) : [];

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/dashboard`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">← Emanon Dashboard</Link>
          {["communication-center","grant-contacts","tablet-project","vendors","partners","documents","meetings-followups"].map((key) => <Link key={key} href={`/organizations/${encodeURIComponent(profileCode)}/${key}`} className={`rounded-xl px-4 py-2 font-bold shadow ${moduleKey === key ? "bg-[#10246f] text-white" : "bg-white text-[#10246f]"}`}>{MODULE_INFO[key].title}</Link>)}
        </div>

        <section className="rounded-3xl bg-gradient-to-r from-[#10246f] to-green-700 p-8 text-white shadow-xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-lime-300">{profile?.display_name || "Emanon Institute"} · {profileCode}</p>
          <h1 className="mt-2 text-4xl font-extrabold">{info.title}</h1>
          <p className="mt-3 max-w-4xl text-lg text-white/90">{info.description}</p>
          <p className="mt-4 font-bold">External identity: Emanon Institute / {profile?.external_sender}</p>
        </section>

        {notice && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">{notice}</div>}

        {moduleKey === "communication-center" && (
          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <section className="rounded-3xl bg-white p-5 shadow">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-extrabold text-[#10246f]">Contacts</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{contacts.length}</span></div>
              <div className="space-y-2">
                {contacts.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-slate-600">No Emanon contacts have been added to an Emanon group yet.</p>}
                {contacts.map((c) => <button key={c.id} onClick={() => openContact(c.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === c.id ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-blue-300"}`}><p className="font-extrabold text-slate-900">{c.display_name || c.organization || "Unnamed Contact"}</p><p className="mt-1 text-sm text-slate-600">{c.organization || c.job_title || c.email || "Contact"}</p></button>)}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow">
              {!selected ? <div className="py-16 text-center"><h2 className="text-2xl font-extrabold text-[#10246f]">Open a contact</h2><p className="mt-3 text-slate-600">Choose any name to see the complete relationship and conversation history.</p></div> : <div className="space-y-6">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between"><div><h2 className="text-3xl font-extrabold text-[#10246f]">{selected.display_name || selected.organization}</h2><p className="mt-1 text-slate-600">{selected.organization} {selected.job_title ? `· ${selected.job_title}` : ""}</p><p className="mt-2 text-sm text-slate-600">{selected.email || "No email"} · {selected.phone || "No phone"} · {selected.country || "Country not set"} · {selected.preferred_language || "Language not set"}</p></div><div className="grid gap-2 sm:grid-cols-3"><select value={relationship?.relationship_type || "Other"} onChange={(e) => saveRelationshipField("relationship_type", e.target.value)} className="rounded-xl border p-2 text-sm font-bold">{RELATIONSHIP_TYPES.map(x => <option key={x}>{x}</option>)}</select><select value={relationship?.relationship_stage || "New Contact"} onChange={(e) => saveRelationshipField("relationship_stage", e.target.value)} className="rounded-xl border p-2 text-sm font-bold">{STAGES.map(x => <option key={x}>{x}</option>)}</select><select value={relationship?.priority || "Normal"} onChange={(e) => saveRelationshipField("priority", e.target.value)} className="rounded-xl border p-2 text-sm font-bold"><option>High</option><option>Normal</option><option>Low</option></select></div></div>

                <div><h3 className="text-xl font-extrabold text-[#10246f]">Conversation History</h3><div className="mt-3 max-h-96 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">{events.length === 0 ? <p className="text-slate-600">No communication history yet.</p> : events.map(e => <div key={e.id} className="rounded-xl bg-white p-4 shadow-sm"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold text-slate-900">{e.title || e.event_type}</p><p className="text-xs text-slate-500">{when(e.created_at)}</p></div><p className="mt-1 text-xs font-bold uppercase text-slate-500">{e.channel || "note"} · {e.direction || "internal"} · {e.status || "recorded"}</p><p className="mt-2 text-slate-700">{e.summary || e.message_preview || "Communication recorded."}</p></div>)}</div></div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5"><h3 className="text-xl font-extrabold text-[#10246f]">AI Arrange Message</h3><p className="mt-1 text-sm font-bold text-green-700">From: Emanon Institute &lt;{profile?.external_sender}&gt;</p><textarea value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)} rows={7} className="mt-3 w-full rounded-xl border border-slate-300 p-3" placeholder="Write your message here..."/><div className="mt-3 flex flex-wrap gap-2"><select value={arrangeMode} onChange={(e) => setArrangeMode(e.target.value)} className="rounded-xl border px-3 py-2"><option value="professionalize">Professionalize</option><option value="improve">Improve</option><option value="shorten">Shorten</option><option value="translate">Translate</option></select><button disabled={working} onClick={arrangeMessage} className="rounded-xl bg-[#10246f] px-4 py-2 font-bold text-white">{working ? "Arranging..." : "Arrange Message"}</button></div><p className="mt-3 text-xs text-slate-500">Sending will always use the Emanon external identity. Delivery/read tracking appears in conversation history when the connected delivery channel provides it.</p></div>
                  <div className="rounded-2xl border border-slate-200 p-5"><h3 className="text-xl font-extrabold text-[#10246f]">Follow-Up & Meetings</h3><label className="mt-3 block text-sm font-bold text-slate-700">Scheduled follow-up</label><input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"/><button onClick={saveFollowUp} className="mt-3 rounded-xl bg-green-700 px-4 py-2 font-bold text-white">Save Follow-Up</button><div className="mt-5 space-y-2">{contactMeetings.length === 0 ? <p className="text-sm text-slate-500">No meetings recorded yet.</p> : contactMeetings.map(m => <div key={m.id} className="rounded-xl bg-slate-50 p-3"><p className="font-bold">{m.title}</p><p className="text-sm text-slate-600">{when(m.meeting_at)} · {m.status}</p>{m.next_action && <p className="mt-1 text-sm">Next: {m.next_action}</p>}</div>)}</div></div>
                </div>
              </div>}
            </section>
          </div>
        )}

        {moduleKey === "grant-contacts" && <section className="rounded-3xl bg-white p-6 shadow"><h2 className="text-2xl font-extrabold text-[#10246f]">Grant Management</h2><p className="mt-2 text-slate-600">Track each opportunity from research and LOI through application, review, response, and follow-up.</p><div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-3">Funder / Grant</th><th className="p-3">Available</th><th className="p-3">Deadline</th><th className="p-3">Eligibility</th><th className="p-3">LOI</th><th className="p-3">Requested</th><th className="p-3">Application</th><th className="p-3">Follow-Up</th></tr></thead><tbody>{grants.length === 0 ? <tr><td colSpan={8} className="p-6 text-center text-slate-500">No grant opportunities recorded yet.</td></tr> : grants.map(g => <tr key={g.id} className="border-b align-top"><td className="p-3 font-bold">{g.funder_name || "Funder"}<div className="font-normal text-slate-600">{g.grant_name}</div></td><td className="p-3">{money(g.amount_available)}</td><td className="p-3">{g.deadline || "—"}</td><td className="max-w-xs p-3">{g.eligibility || "—"}</td><td className="p-3">{g.loi_status || "—"}</td><td className="p-3">{money(g.requested_amount)}</td><td className="p-3 font-bold">{g.application_status}</td><td className="p-3">{when(g.follow_up_at)}</td></tr>)}</tbody></table></div></section>}

        {moduleKey === "tablet-project" && <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-3xl bg-white p-6 shadow"><h2 className="text-2xl font-extrabold text-[#10246f]">Haiti Connected Learning & Tablet Project</h2><p className="mt-2 text-slate-600">Central project workspace for manufacturers, telecoms, solar/energy, logistics, participating schools, sponsors, and implementation partners.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{["Tablet Manufacturers","Telecommunications","Solar / Energy","Logistics","Schools","Sponsors","Technical Requirements","Pilot Status"].map(x => <div key={x} className="rounded-2xl border border-slate-200 p-4 font-bold text-slate-800">{x}</div>)}</div></section><section className="rounded-3xl bg-white p-6 shadow"><h2 className="text-2xl font-extrabold text-[#10246f]">Project Record</h2>{projects.filter(p => p.project_code === "haiti-connected-learning-tablet").map(p => <div key={p.id} className="mt-4 space-y-3"><p><span className="font-bold">Status:</span> {p.status}</p><p><span className="font-bold">Technical requirements:</span> {p.technical_requirements || "Not recorded yet"}</p><p><span className="font-bold">Pilot status:</span> {p.pilot_status || "Not recorded yet"}</p><p><span className="font-bold">Next action:</span> {p.next_action || "Not recorded yet"}</p></div>)}</section></div>}

        {(moduleKey === "vendors" || moduleKey === "partners") && <section className="rounded-3xl bg-white p-6 shadow"><h2 className="text-2xl font-extrabold text-[#10246f]">{info.title} Relationship List</h2><p className="mt-2 text-slate-600">Open the Communication Center for full history. This workspace keeps the specialized relationship list focused on stage, priority, and next action.</p><div className="mt-5 grid gap-3">{contacts.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-slate-500">No {info.title.toLowerCase()} have been added yet.</p> : contacts.map(c => { const r = relationships.find(x => x.contact_id === c.id); return <div key={c.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]"><div><p className="font-extrabold">{c.display_name || c.organization}</p><p className="text-sm text-slate-600">{c.organization || c.email}</p></div><div><p className="text-xs font-bold uppercase text-slate-500">Stage</p><p className="font-bold">{r?.relationship_stage || "New Contact"}</p></div><div><p className="text-xs font-bold uppercase text-slate-500">Priority</p><p className="font-bold">{r?.priority || "Normal"}</p></div><div><p className="text-xs font-bold uppercase text-slate-500">Next Action</p><p>{r?.next_action || "Not set"}</p></div></div>})}</div></section>}

        {moduleKey === "documents" && <section className="rounded-3xl bg-white p-6 shadow"><h2 className="text-2xl font-extrabold text-[#10246f]">Emanon Document Center</h2><p className="mt-2 text-slate-600">Documents remain connected to the institution and can also be tied to a contact, grant, or project.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{documents.length === 0 ? <p className="text-slate-500">No documents recorded yet.</p> : documents.map(d => <div key={d.id} className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-bold uppercase text-green-700">{d.document_type}</p><h3 className="mt-1 font-extrabold text-slate-900">{d.title}</h3><p className="mt-2 text-sm text-slate-600">{d.status} · {when(d.created_at)}</p>{d.notes && <p className="mt-2 text-sm">{d.notes}</p>}{d.external_url && <a href={d.external_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex font-bold text-blue-700">Open Document</a>}</div>)}</div></section>}

        {moduleKey === "meetings-followups" && <section className="rounded-3xl bg-white p-6 shadow"><h2 className="text-2xl font-extrabold text-[#10246f]">Meetings & Follow-Up Queue</h2><p className="mt-2 text-slate-600">One place to see what Emanon must do next, what is scheduled, and what is waiting for a response.</p><div className="mt-5 space-y-3">{meetings.length === 0 && relationships.filter(r => r.follow_up_at).length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-slate-500">No meetings or follow-ups are scheduled yet.</p> : <>{meetings.map(m => <div key={m.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold">{m.title}</h3><p className="mt-1 text-sm text-slate-600">Meeting: {when(m.meeting_at)} · Status: {m.status}</p></div>{m.meeting_link && <a href={m.meeting_link} target="_blank" rel="noreferrer" className="rounded-xl bg-[#10246f] px-4 py-2 font-bold text-white">Open Meeting</a>}</div>{m.next_action && <p className="mt-3"><span className="font-bold">Next action:</span> {m.next_action}</p>}{m.follow_up_at && <p className="mt-1"><span className="font-bold">Follow-up:</span> {when(m.follow_up_at)}</p>}</div>)}{relationships.filter(r => r.follow_up_at).map(r => { const c = contacts.find(x => x.id === r.contact_id); return <div key={`f-${r.id}`} className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="font-extrabold">Follow up with {c?.display_name || c?.organization || "contact"}</p><p className="mt-1 text-sm">{when(r.follow_up_at)} · {r.relationship_type} · {r.relationship_stage}</p>{r.next_action && <p className="mt-2">Next: {r.next_action}</p>}</div>})}</>}</div></section>}
      </div>
    </main>
  );
}
