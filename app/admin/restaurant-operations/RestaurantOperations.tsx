"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { entryKinds, workStatuses } from "@/lib/restaurant-operations/validation";

type Task = { id: string; title: string; description: string; owner_label: string; status: string; due_at: string | null; start_at: string | null; completed_at: string | null; workstream_code: string | null; approval_status: string; notes: string; blocker: string; next_action: string; updated_at: string };
type Entry = { id: string; task_id: string; entry_kind: string; body: string; evidence_url: string | null; corrects_entry_id: string | null; actor_email: string; created_at: string };
type Audit = { id: string; table_name: string; operation: string; executor: string; reason: string; occurred_at: string; old_record: unknown; new_record: unknown };
type Implementation = { id: string; event_name: string; event_description: string; actor_name: string; executed_by: string; occurred_at: string; metadata: unknown };
type WorkFile = { id: string; task_id: string; file_name: string; size_bytes: number; reason: string; uploaded_by_email: string; created_at: string };
type Snapshot = {
  master: Record<string, unknown>;
  campaigns: { epew_support_campaign_id: string; relationship_status: string; notes: string }[];
  tasks: Task[]; entries: Entry[]; audit: Audit[]; implementation: Implementation[]; files: WorkFile[]; history_limit: number;
};
const endpoint = "/api/admin/restaurant-operations/FFR-001";
const field = "w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900";
const button = "rounded-lg bg-[#06245c] px-5 py-3 font-semibold text-white disabled:opacity-50";
const pretty = (s: string) => s.replaceAll("_", " ");
const date = (s: string) => new Date(s).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });
const localDate = (s: string | null) => s ? new Date(Date.parse(s) - new Date(s).getTimezoneOffset()*60000).toISOString().slice(0,16) : "";
async function readSnapshot(): Promise<Snapshot> {
  const response = await fetch(endpoint, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to load restaurant records.");
  return result;
}

export default function RestaurantOperations() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [kind, setKind] = useState("progress");
  const pending = useRef<{ signature: string; id: string } | null>(null);
  const load = useCallback(async () => {
    setData(await readSnapshot());
  }, []);
  useEffect(() => {
    let active = true;
    readSnapshot().then(result => { if (active) setData(result); }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load records."); });
    return () => { active = false; };
  }, []);

  async function save(values: Record<string, unknown>, form: HTMLFormElement) {
    setBusy(true); setError(""); setNotice("");
    const signature = JSON.stringify(values);
    if (pending.current?.signature !== signature) pending.current = { signature, id: crypto.randomUUID() };
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, request_id: pending.current.id }) });
      const result = await response.json();
      if (!response.ok || result.saved !== true) throw new Error(result.error || "The save was not confirmed.");
      pending.current = null;
      form.reset();
      setNotice("Saved in EPEW with an audit entry.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save. Retry with the same details."); }
    finally { setBusy(false); }
  }

  const task = data?.tasks.find(t => t.id === taskId);
  return <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
    <header><Link className="block mb-3 text-blue-800 underline" href="/admin/food-fans-network">Network records, raffle and expansion reports</Link>
      <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Food Fans Marketplace</p>
      <h1 className="mt-2 text-3xl font-bold text-[#06245c]">FFR-001 · Cambria Heights Launch</h1>
      <Link className="mt-3 inline-block font-semibold text-blue-800 underline" href="/admin/food-fans-rewards">Open Food Fans Rewards Membership</Link>
      <p className="mt-2 text-slate-600">Restaurant master record, work tracking, and audit history. All displayed times use New York time.</p>
    </header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error} <button type="button" className="ml-3 underline" disabled={busy} onClick={() => { setError(""); load().catch(e => setError(e.message)); }}>Reload records</button></div>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
    {!data ? <p>{error ? "Records have not loaded." : "Loading restaurant records…"}</p> : <>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Restaurant master</h2>
        <dl className="mt-5 grid gap-5 md:grid-cols-2">
          {[
            ["Restaurant unit ID", "restaurant_unit_id"], ["Supplied support campaign ID", "epew_support_campaign_id"],
            ["Business", "business_name"], ["Location", "location_name"], ["Address", "address"], ["Phone", "phone"],
            ["Brand", "brand"], ["Network", "network"], ["Operational status", "operational_status"],
            ["Marketplace status", "marketplace_status"], ["Launch status", "marketplace_launch_status"],
            ["Support URL", "support_url"], ["Website URL", "website_url"], ["Ordering URL", "ordering_url"],
            ["POS provider", "pos_provider"], ["Approved opening date", "approved_opening_date"], ["Operating hours", "operating_hours"],
          ].map(([label, key]) => <div key={key}><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium">{data.master[key] == null ? "Pending verification / approval" : typeof data.master[key] === "object" ? JSON.stringify(data.master[key]) : String(data.master[key])}</dd></div>)}
        </dl>
        <p className="mt-5 text-sm text-slate-600">A website URL is not proof of a working ordering or checkout connection. Restaurant and campaign identifiers are separate.</p>
        <details className="mt-4"><summary className="cursor-pointer font-medium">Verification notes and unresolved items</summary><pre className="mt-3 overflow-auto whitespace-pre-wrap text-sm">{JSON.stringify({ verification: data.master.field_verification, unresolved: data.master.unresolved_items }, null, 2)}</pre></details>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Campaign links · one physical store</h2>
        <div className="mt-4 space-y-4">{data.campaigns.map(c => <div key={c.epew_support_campaign_id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{c.epew_support_campaign_id} · {pretty(c.relationship_status)}</p><p className="mt-1 text-sm text-slate-600">{c.notes}</p></div>)}</div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Create a work item</h2>
        <p className="mt-2 text-sm text-slate-600">An owner label records responsibility; it does not grant account access.</p>
        <form className="mt-5 grid gap-4" onSubmit={e => {
          e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); const due = String(f.get("due_at") || "");
          void save({ action: "create_task", title: f.get("title"), description: f.get("description"), owner: f.get("owner"), reason: f.get("reason"), ...(due ? { due_at: new Date(due).toISOString() } : {}) }, form);
        }}>
          <label>Title<input name="title" required maxLength={200} className={field} /></label>
          <label>Scope and expected outcome<textarea name="description" required maxLength={4000} className={field} rows={3} /></label>
          <div className="grid gap-4 md:grid-cols-2"><label>Responsible person or role<input name="owner" required maxLength={200} className={field} /></label><label>Due date (your device’s local time)<input name="due_at" type="datetime-local" className={field} /></label></div>
          <label>Reason / authorization reference<textarea name="reason" required maxLength={4000} className={field} rows={2} /></label>
          <div><button className={button} disabled={busy}>Create work item</button></div>
        </form>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Launch workstreams and work register</h2>
        <p className="mt-2 text-sm text-slate-600">Latest {data.history_limit} tasks. Completed work still requires evidence and review where applicable.</p>
        {!data.tasks.length && <p className="mt-4">No work items recorded yet.</p>}
        <div className="mt-4 space-y-3">{data.tasks.map(t => <button type="button" key={t.id} onClick={() => setTaskId(t.id)} className={`block w-full rounded-xl border p-4 text-left ${taskId === t.id ? "border-blue-700 bg-blue-50" : "border-slate-200"}`}><span className="font-semibold">{t.title}</span><span className="ml-3 rounded bg-slate-100 px-2 py-1 text-sm">{pretty(t.status)}</span><p className="mt-2 text-sm">{t.description}</p><p className="mt-2 text-sm text-slate-600">Owner: {t.owner_label} · Start: {t.start_at ? date(t.start_at) : "Not set"} · Due: {t.due_at ? date(t.due_at) : "Not set"} · Approval: {pretty(t.approval_status)}
        {t.completed_at && <span className="block">Completed: {date(t.completed_at)}</span>}
        {t.blocker && <span className="block text-red-800">Blocker: {t.blocker}</span>}
        <span className="block">Next: {t.next_action || "Not set"}</span></p></button>)}</div>
        {task && <div className="mt-6 grid gap-6 border-t pt-6 lg:grid-cols-2">
          <form className="space-y-4" key={`status-${task.id}-${task.updated_at}`} onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); void save({ action: "update_task", task_id: task.id, expected_updated_at: task.updated_at, status: f.get("status"), reason: f.get("reason"), owner:f.get("owner"), notes:f.get("notes"), approval_status:f.get("approval_status"), blocker:f.get("blocker"), next_action:f.get("next_action"), start_at:f.get("start_at")?new Date(String(f.get("start_at"))).toISOString():"", due_at:f.get("due_at")?new Date(String(f.get("due_at"))).toISOString():"" }, form); }}>
            <h3 className="font-semibold">Update status · {task.title}</h3>
            <label className="block">Status<select name="status" defaultValue={task.status} className={field}>{workStatuses.map(s => <option key={s} value={s}>{pretty(s)}</option>)}</select></label>
            <label className="block">Assigned person / role<input name="owner" required maxLength={200} defaultValue={task.owner_label} className={field}/></label>
            <label className="block">Start (device local time)<input name="start_at" type="datetime-local" defaultValue={localDate(task.start_at)} className={field}/></label>
            <label className="block">Due (device local time)<input name="due_at" type="datetime-local" defaultValue={localDate(task.due_at)} className={field}/></label>
            <p className="text-sm">Completion date: {task.completed_at?date(task.completed_at):"Set automatically when completed"}</p>
            <label className="block">Approval status<select name="approval_status" defaultValue={task.approval_status} className={field}>{["not_requested","pending","approved","rejected"].map(v=><option key={v} value={v}>{pretty(v)}</option>)}</select></label>
            <label className="block">Notes<textarea name="notes" maxLength={4000} defaultValue={task.notes} className={field}/></label>
            <label className="block">Blocker<textarea name="blocker" maxLength={4000} defaultValue={task.blocker} className={field}/></label>
            <label className="block">Next action<textarea name="next_action" maxLength={4000} defaultValue={task.next_action} className={field}/></label>
            <label className="block">Progress and reason<textarea name="reason" required maxLength={4000} className={field} rows={3} /></label>
            <button className={button} disabled={busy}>Save status</button>
          </form>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); void save({ action: "add_entry", task_id: task.id, kind, reason: f.get("reason"), evidence_url: f.get("evidence_url"), ...(kind === "correction" ? { corrects_entry_id: f.get("corrects_entry_id") } : {}) }, form); }}>
            <h3 className="font-semibold">Add a work entry · {task.title}</h3>
            <label className="block">Entry type<select value={kind} onChange={e => setKind(e.target.value)} className={field}>{entryKinds.map(k => <option key={k} value={k}>{pretty(k)}</option>)}</select></label>
            {kind === "correction" && <label className="block">Original entry<select name="corrects_entry_id" required className={field}><option value="">Choose an entry</option>{data.entries.filter(e => e.task_id === task.id).map(e => <option key={e.id} value={e.id}>{date(e.created_at)} · {e.body.slice(0,80)}</option>)}</select></label>}
            <label className="block">Details and reason<textarea name="reason" required maxLength={4000} className={field} rows={3} /></label>
            <label className="block">Evidence link (HTTPS)<input name="evidence_url" type="url" pattern="https://.*" required={kind === "evidence"} maxLength={2000} className={field} /><span className="text-xs text-slate-500">Use an approved reference; do not include passwords, tokens, or payment details.</span></label>
            <button className={button} disabled={busy}>Record entry</button>
          </form>
        </div>}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Private evidence files</h2>
        <p className="mt-2 text-sm text-slate-600">Select a workstream above to attach supporting documents. Downloads require administrator access.</p>
        {task && <form className="mt-4 space-y-4" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const body=new FormData(form);body.set("task_id",task.id);setBusy(true);setError("");setNotice("");try{const r=await fetch(endpoint+"/files",{method:"POST",body});const result=await r.json();if(!r.ok||!result.saved)throw new Error(result.error||"Upload not confirmed.");form.reset();setNotice("Private evidence file saved with an audit entry.");await load();}catch(e){setError(e instanceof Error?e.message:"Upload failed.");}finally{setBusy(false);}}}>
          <p className="font-semibold">Attach to {task.title}</p><label className="block">File (up to 20 MB)<input name="file" required type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.docx,.xlsx" className={field}/></label>
          <label className="block">Evidence description<textarea name="reason" required maxLength={4000} className={field}/></label><button disabled={busy} className={button}>Upload private evidence</button>
        </form>}
        <ul className="mt-4 space-y-3">{data.files.map(f=><li key={f.id} className="rounded border p-3"><a className="font-medium text-blue-800 underline" href={endpoint+"/files/"+f.id} target="_blank" rel="noopener noreferrer">{f.file_name}</a><p>{f.reason}</p><p className="text-xs text-slate-500">{data.tasks.find(t=>t.id===f.task_id)?.title||f.task_id} · {f.uploaded_by_email} · {date(f.created_at)} · {Math.ceil(f.size_bytes/1024)} KB</p></li>)}</ul>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Work history</h2><p className="mt-2 text-sm text-slate-600">Latest {data.history_limit} entries. Corrections reference the original entry and never replace it.</p>
        {!data.entries.length && <p className="mt-4">No entries yet.</p>}
        <ol className="mt-4 space-y-4">{data.entries.map(e => <li key={e.id} className="border-l-4 border-emerald-600 pl-4"><p className="font-semibold">{pretty(e.entry_kind)} · {data.tasks.find(t => t.id === e.task_id)?.title || e.task_id}</p><p className="mt-1 whitespace-pre-wrap">{e.body}</p>{e.evidence_url && <a className="mt-1 block break-all text-blue-800 underline" href={e.evidence_url} target="_blank" rel="noopener noreferrer">Evidence reference</a>}<p className="mt-1 text-sm text-slate-500">{e.actor_email} · {date(e.created_at)}</p>{e.corrects_entry_id && <p className="text-xs text-slate-500">Corrects entry {e.corrects_entry_id}</p>}</li>)}</ol>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Implementation records</h2>
        <p className="mt-2 text-sm text-slate-600">Latest {data.history_limit} operational records, including technical setup and verification.</p>
        <ol className="mt-4 space-y-4">{data.implementation.map(i => <li key={i.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{i.event_name}</p><p className="mt-1 whitespace-pre-wrap">{i.event_description}</p><p className="mt-1 text-sm text-slate-500">{i.actor_name || i.executed_by} · {date(i.occurred_at)}</p><details className="mt-2 text-sm"><summary className="cursor-pointer">Verification details</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify(i.metadata, null, 2)}</pre></details></li>)}</ol>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Audit timeline</h2><p className="mt-2 text-sm text-slate-600">Latest {data.history_limit} changes. The full history is retained in EPEW.</p>
        <ol className="mt-4 space-y-4">{data.audit.map(a => <li key={a.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{a.operation} · {a.table_name.replace("epew_restaurant_", "").replaceAll("_", " ")}</p><p className="mt-1 whitespace-pre-wrap">{a.reason}</p><p className="mt-1 text-sm text-slate-500">{a.executor} · {date(a.occurred_at)}</p><details className="mt-2 text-sm"><summary className="cursor-pointer">Before and after</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify({ before: a.old_record, after: a.new_record }, null, 2)}</pre></details></li>)}</ol>
      </section>
    </>}
  </div>;
}
