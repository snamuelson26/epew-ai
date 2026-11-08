"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Payment = { id: string; supporter: string; amount: number | string | null; units: number | null; frequency: string | null; status: string | null; recordedAt: string | null };
type Ledger = { business: { name: string; code: string | null }; transactions: Payment[]; count: number; page: number; pageSize: number };
const money = (value: number | string | null) => value === null ? "Not recorded" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
function date(value: string | null) {
  if (!value) return "Not recorded";
  const instant = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  if (Number.isNaN(Date.parse(instant))) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(instant));
}
export default function SupporterPayments() {
  const [data, setData] = useState<Ledger | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [applicationId, setApplicationId] = useState("");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  useEffect(() => {
    let active = true;
    const id = chosenId ?? new URLSearchParams(window.location.search).get("applicationId") ?? "";
    fetch(`/api/entrepreneurs/supporter-payments?applicationId=${encodeURIComponent(id)}&page=${page}`, { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!active) return;
        setAccounts(result.accounts || []);
        setNeedsSignIn(response.status === 401);
        if (!response.ok) throw new Error(result.error || "Unable to load payment records.");
        if (active) {
          setApplicationId(result.applicationId || "");
          setError("");
          setData(result.selectionRequired ? null : result);
        }
      })
      .catch(error => { if (active) { setData(null); setError(error.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision, chosenId]);
  const back = `/entrepreneurs/dashboard${applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : ""}`;
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:p-10">
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href={back} className="font-bold text-blue-800 underline">Back to my dashboard</Link>
      <section className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-3xl font-extrabold">My Supporters &amp; Payments</h1>
        {data && <p className="mt-3 text-xl font-bold">{data.business.name}{data.business.code ? ` — ${data.business.code}` : ""}</p>}
        <p className="mt-3 text-slate-600">Recorded support transactions for this business. Amounts are USD. Dates show when each transaction was recorded, in New York time; they are not bank settlement dates. Pending payments are not received funds.</p>
        <button onClick={() => { setLoading(true); setRevision(value => value + 1); }} disabled={loading} className="mt-4 rounded-xl bg-blue-800 px-5 py-3 font-bold text-white disabled:opacity-50">Refresh records</button>
      </section>
      {loading && <p role="status">Loading payment records…</p>}
      {error && <section role="alert" className="rounded-xl bg-red-50 p-5 text-red-900"><p>{error}</p>{needsSignIn && <Link href="/entrepreneurs/login" className="mt-3 inline-block underline">Sign in to the entrepreneur portal</Link>}</section>}
      {accounts.length > 0 && <section className="rounded-2xl bg-white p-5 shadow">
        <label className="block font-bold">Choose your business
          <select disabled={loading} value={accounts.some(account => account.id === (chosenId ?? applicationId)) ? (chosenId ?? applicationId) : ""} onChange={event => {
            const id = event.target.value;
            setData(null); setError(""); setLoading(true); setPage(1); setChosenId(id);
            const url = new URL(window.location.href);
            if (id) url.searchParams.set("applicationId", id); else url.searchParams.delete("applicationId");
            window.history.replaceState(null, "", url);
          }} className="mt-2 block w-full rounded-xl border p-3">
            <option value="">Select a business</option>
            {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </label>
        <p className="mt-2 text-slate-600">Only businesses belonging to this login are listed.</p>
      </section>}
      {!loading && !data && !error && accounts.length === 0 && <p>No entrepreneur businesses are linked to this login. <Link className="underline" href="/entrepreneurs/dashboard">Return to your dashboard</Link>.</p>}
      {!loading && data && <section className="overflow-hidden rounded-2xl bg-white shadow">
        <div className="p-5"><p className="font-bold">{data.count} recorded transactions</p><p className="mt-1 text-slate-600">This history lists payment records, not prospect contacts or future commitments. Refunds and unsuccessful payments retain their recorded status.</p></div>
        {!data.transactions.length ? <p className="p-5">No payment records found for this business{page > 1 ? " on this page" : ""}.</p> : <div className="overflow-x-auto"><table className="w-full text-left">
          <caption className="sr-only">Supporters, amounts, transaction dates and payment statuses</caption>
          <thead className="bg-slate-200"><tr>{["Supporter", "Amount (USD)", "Recorded date (New York)", "Payment status", "Frequency", "Units"].map(label => <th key={label} scope="col" className="p-4">{label}</th>)}</tr></thead>
          <tbody>{data.transactions.map(payment => <tr key={payment.id} className="border-t border-slate-200"><td className="p-4 font-semibold">{payment.supporter}</td><td className="p-4">{money(payment.amount)}</td><td className="p-4">{date(payment.recordedAt)}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-sm font-bold ${payment.status === "paid" ? "bg-green-100 text-green-900" : "bg-slate-100 text-slate-800"}`}>{payment.status?.replaceAll("_", " ") || "Not recorded"}</span></td><td className="p-4">{payment.frequency?.replaceAll("_", " ") || "Not recorded"}</td><td className="p-4">{payment.units ?? "Not recorded"}</td></tr>)}</tbody>
        </table></div>}
        <nav aria-label="Transaction pages" className="flex items-center justify-between gap-4 border-t p-5">
          <button disabled={loading || page <= 1} onClick={() => { setLoading(true); setPage(value => value - 1); }} className="rounded-lg border px-4 py-2 disabled:opacity-40">Previous</button>
          <span>Page {page} of {Math.max(1, Math.ceil(data.count / data.pageSize))}</span>
          <button disabled={loading || page * data.pageSize >= data.count} onClick={() => { setLoading(true); setPage(value => value + 1); }} className="rounded-lg border px-4 py-2 disabled:opacity-40">Next</button>
        </nav>
      </section>}
    </div>
  </main>;
}
