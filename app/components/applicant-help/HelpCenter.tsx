"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LanguageSelector, useLocale } from "@/app/components/enterprise/language";
import { helpCopy } from "@/lib/applicant-help/copy";
import { categories, statuses } from "@/lib/applicant-help/validation";

type Application = { id: number; business_name: string; full_name: string };
type HelpCase = {
 id: string; application_id: number; applicant_name: string; business_name: string;
 category: typeof categories[number]; status: typeof statuses[number]; responsible_team: "technical" | "finance" | "program";
 description: string; help_needed: string; updated_at: string; overdue: boolean;
 events: { id: string; actor_kind: string; body: string; status: string; created_at: string }[];
};
export default function HelpCenter({ staff = false, coach = false }: { staff?: boolean; coach?: boolean }) {
 const { locale } = useLocale(); const t = helpCopy[locale];
 const [data, setData] = useState<{ applications: Application[]; cases: HelpCase[] }>({ applications: [], cases: [] });
 const [state, setState] = useState("loading"), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
 const [application, setApplication] = useState(""), [category, setCategory] = useState<typeof categories[number]>("other");
 const [description, setDescription] = useState(""), [needed, setNeeded] = useState("");
 const [drafts, setDrafts] = useState<Record<string, string>>({}), [nextStatuses, setNextStatuses] = useState<Record<string, string>>({});
 const attempt = useRef({ fingerprint: "", key: "" });
 const load = useCallback(async () => {
  try {
   const response = await fetch(`/api/entrepreneurs/help${staff ? "?scope=staff" : ""}`, { cache: "no-store" });
   if (response.status === 401) { setState("login"); return; }
   if (!response.ok) { setState(response.status === 403 ? "denied" : "failed"); return; }
   const result = await response.json(); setData(result); setState("ready");
   setApplication(previous => previous || String(result.applications[0]?.id || ""));
  } catch { setState("failed"); }
 }, [staff]);
 useEffect(() => {
  const timeout = setTimeout(() => { void load(); }, 0);
  const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
  return () => { clearTimeout(timeout); clearInterval(timer); };
 }, [load]);
 async function send(values: Record<string, unknown>, completed: () => void) {
  setBusy(true); setNotice("");
  try {
   const response = await fetch("/api/entrepreneurs/help", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
   if (!response.ok) { setNotice(response.status === 429 ? t.rate : response.status === 403 ? t.denied : t.failed); return; }
   const result = await response.json(); if (!result.saved || !result.id) { setNotice(t.failed); return; }
   completed(); setNotice(t.saved); await load();
  } catch { setNotice(t.failed); } finally { setBusy(false); }
 }
 function create(event: React.FormEvent) {
  event.preventDefault();
  const values = { action: "create", application_id: Number(application), category, description, help_needed: needed, locale };
  const fingerprint = JSON.stringify(values);
  if (attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
  void send({ ...values, request_key: attempt.current.key }, () => { setDescription(""); setNeeded(""); attempt.current = { fingerprint: "", key: "" }; });
 }
 const input = "mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-950";
 const button = "rounded-xl bg-blue-950 px-5 py-3 font-bold text-white disabled:opacity-50";
 const home = coach ? "/coaches/agent-workspace" : staff ? "/admin" : "/entrepreneurs/dashboard";
 const login = coach ? "/coaches/login" : staff ? "/admin/login" : "/entrepreneurs/login";
 return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6"><div className="mx-auto max-w-4xl space-y-6">
  <nav className="flex flex-wrap items-center justify-between gap-4"><Link href={home} className="font-bold text-blue-950 underline">{t.dashboard}</Link><LanguageSelector compact /></nav>
  <header className="rounded-3xl bg-blue-950 p-6 text-white sm:p-8"><h1 className="text-3xl font-bold">{staff ? t.staffTitle : t.title}</h1><p className="mt-3 leading-relaxed">{staff ? t.staffIntro : t.intro}</p></header>
  {notice && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4">{notice}</p>}
  {state === "loading" && <p role="status">{t.loading}</p>}
  {state === "login" && <section className="space-y-4 rounded-2xl bg-white p-6"><p>{t.loginNote}</p><Link className={button + " inline-block"} href={login}>{t.login}</Link><Link className="block underline" href="/entrepreneurs/forgot-password">{t.reset}</Link><a className="block underline" href="mailto:welcome@epew.us">{t.contact}</a></section>}
  {(state === "failed" || state === "denied") && <p role="alert">{state === "denied" ? t.denied : t.failed}</p>}
  {state !== "login" && <button onClick={() => void load()} disabled={busy} className="font-bold text-blue-900 underline">{t.refresh}</button>}
  {state === "ready" && <>
   {staff ? <p className="rounded-xl bg-white p-4 font-bold">{t.openCount}: {data.cases.filter(c => c.status !== "resolved").length} · {t.dueCount}: {data.cases.filter(c => c.overdue).length}</p> : data.applications.length ?
    <form onSubmit={create} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
     <label className="block font-semibold">{t.application}<select required className={input} value={application} onChange={e => setApplication(e.target.value)}>{data.applications.map(a => <option key={a.id} value={a.id}>#{a.id} · {a.business_name || a.full_name}</option>)}</select></label>
     <label className="block font-semibold">{t.category}<select className={input} value={category} onChange={e => setCategory(e.target.value as typeof category)}>{categories.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</select></label>
     <label className="block font-semibold">{t.description}<textarea required minLength={10} maxLength={3000} rows={4} className={input} value={description} onChange={e => setDescription(e.target.value)} /></label>
     <label className="block font-semibold">{t.needed}<textarea required minLength={5} maxLength={1500} rows={3} className={input} value={needed} onChange={e => setNeeded(e.target.value)} /></label>
     <p className="text-sm text-slate-600">{t.privacy}</p><button className={button} disabled={busy}>{busy ? t.saving : t.submit}</button>
    </form> : <p className="rounded-xl bg-white p-5">{t.noApps}</p>}
   <section className="space-y-5"><h2 className="text-2xl font-bold">{t.history}</h2>{!data.cases.length && <p>{t.empty}</p>}
    {data.cases.map(c => <article key={c.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
     <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-bold">{t.categories[c.category]}</h3><p className="mt-1 text-sm">#{c.application_id} · {c.business_name}{staff ? ` · ${c.applicant_name}` : ""}</p></div><span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-bold">{t.statuses[c.status]}</span></div>
     <p className="break-all text-xs text-slate-600">{t.reference}: {c.id}</p>
     {staff && <p className="text-sm">{t.team}: {t.teams[c.responsible_team]}{c.overdue && <strong className="ml-3 text-amber-800">{t.overdue}</strong>}</p>}
     <div className="space-y-3">{c.events.map(e => <div key={e.id} className={`rounded-xl p-4 ${e.actor_kind === "staff" ? "bg-blue-50" : "bg-slate-50"}`}><p className="text-xs font-bold">{e.actor_kind === "staff" ? t.staff : t.applicant} · {new Date(e.created_at).toLocaleString(locale)}</p><p className="mt-2 whitespace-pre-wrap break-words">{e.body}</p></div>)}</div>
     {c.status === "resolved" && !staff && <p className="text-sm">{t.reopenNote}</p>}
     <form className="space-y-3" onSubmit={e => { e.preventDefault(); void send({ action: staff ? "update" : c.status === "resolved" ? "reopen" : "reply", case_id: c.id, body: drafts[c.id] || "", status: nextStatuses[c.id] || c.status }, () => setDrafts(previous => ({ ...previous, [c.id]: "" }))); }}>
      <label className="block font-semibold">{staff ? t.staffReply : t.reply}<textarea required maxLength={5000} rows={3} className={input} value={drafts[c.id] || ""} onChange={e => setDrafts(previous => ({ ...previous, [c.id]: e.target.value }))} /></label>
      {staff && <label className="block font-semibold">{t.status}<select className={input} value={nextStatuses[c.id] || c.status} onChange={e => setNextStatuses(previous => ({ ...previous, [c.id]: e.target.value }))}>{statuses.map(s => <option key={s} value={s}>{t.statuses[s]}</option>)}</select></label>}
      <button className={button} disabled={busy}>{busy ? t.saving : staff ? t.update : c.status === "resolved" ? t.reopen : t.send}</button>
     </form>
    </article>)}<p className="text-sm text-slate-500">{t.latest}</p>
   </section>
  </>}
 </div></main>;
}
