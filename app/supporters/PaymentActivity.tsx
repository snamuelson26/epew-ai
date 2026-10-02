"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { benefitSchedule } from "@/lib/enterprise/supporters/paymentPresentation";

type Payment = {id:string;businessName:string;amount:number;status:string;frequency:string;paidDate:string;schedule:ReturnType<typeof benefitSchedule>};
type PaymentRequest = {id:string;businessName:string;total_amount:number;unit_count:number;status:string;created_at:string;checkoutState:string};
const money = (value:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
const date = (value:string) => new Date(value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value)?value:`${value}Z`).toLocaleDateString("en-US");
export default function PaymentActivity({compact=false}:{compact?:boolean}) {
  const [data,setData] = useState<{transactions:Payment[];requests:PaymentRequest[]}|null>(null);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState<string|null>(null);
  async function load() {
    setError("");
    try {
      const res=await fetch("/api/supporters/transactions",{cache:"no-store"});
      const result=await res.json();
      if(!res.ok) throw new Error(result.error||"Unable to load transactions.");
      setData(result);
    } catch(e) {setError(e instanceof Error?e.message:"Unable to load transactions.");}
  }
  useEffect(()=>{void load();},[]);
  async function act(id:string,action:string) {
    if(action==="cancel" && !window.confirm("Cancel this unpaid checkout? Submitted payments cannot be cancelled here.")) return;
    setBusy(id);setMessage("");setError("");
    try {
      const res=await fetch("/api/supporters/transactions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({intentId:id,action})});
      const result=await res.json();
      if(!res.ok) throw new Error(result.error||"Unable to check payment.");
      if(result.url) {window.location.assign(result.url);return;}
      setMessage(result.message);await load();
    } catch(e) {setError(e instanceof Error?e.message:"Unable to check payment.");}
    finally {setBusy(null);}
  }
  return <section className="my-6 rounded-2xl bg-white p-5 text-[#06245c] shadow sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">My transactions</h2><button className="rounded border px-4 py-2" onClick={()=>void load()}>Refresh records</button></div>
    <p className="mt-2">Only confirmed payments appear as paid. Submitted bank payments may still be processing.</p>
    {error&&<p role="alert" className="my-4 rounded bg-red-50 p-4 text-red-800">{error}</p>}
    {message&&<p role="status" className="my-4 rounded bg-blue-50 p-4">{message}</p>}
    {!data&&!error&&<p role="status">Loading transactions…</p>}
    {data?.transactions.length===0&&<p className="my-4 font-semibold">No confirmed transaction is recorded yet.</p>}
    {(compact?data?.transactions.slice(0,3):data?.transactions)?.map(p=><article key={p.id} className="my-5 rounded-xl border p-4">
      <h3 className="text-xl font-bold">{p.businessName} — {money(Number(p.amount))}</h3>
      <p>Status: {p.status} · Payment record date: {date(p.paidDate)} · {p.frequency}</p>
      <p className="break-all text-sm">Reference: {p.id}</p>
      {p.schedule&&<>
        <p className="mt-3 font-semibold">Up to {p.schedule.rate}% annual participation benefit: {money(p.schedule.projectedTotal)}</p>
        <p>Contribution plus maximum projected benefit: {money(p.schedule.projectedCombined)}</p>
        <p>Maturity date (estimated): {date(p.schedule.estimatedMaturityDate)}</p>
        <p className="mt-2 text-sm">Estimate: 12 months from the payment record date. Final eligibility is subject to your agreement. Benefits are not guaranteed. Projections are not credited earnings or an available balance.</p>
        {!compact&&<details className="mt-4"><summary className="cursor-pointer font-bold">Monthly projected breakdown</summary><div className="overflow-x-auto"><table className="mt-3 w-full text-left"><thead><tr><th>Month ending</th><th>Projected addition</th><th>Projected total</th><th>Period</th></tr></thead><tbody>{p.schedule.rows.map(r=><tr key={r.month} className="border-t"><td className="py-2">{date(r.date)}</td><td>{money(r.projectedAmount)}</td><td>{money(r.projectedCumulative)}</td><td>{r.elapsed?"Elapsed — projection only":"Upcoming"}</td></tr>)}</tbody></table></div></details>}
      </>}
    </article>)}
    {data?.requests.map(r=><article key={r.id} className="my-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-bold">{r.businessName} — {money(Number(r.total_amount))}</h3>
      <p>{date(r.created_at)} · {r.unit_count} unit(s) · One-time payment</p>
      <p className="my-2 font-semibold">{r.status==="cancelled"?"Cancelled unpaid checkout":r.checkoutState==="processing"?"Payment submitted — awaiting bank/payment confirmation. Do not pay again.":r.checkoutState==="paid"?"Payment confirmed by Stripe — portal record is synchronizing. Do not pay again.":r.checkoutState==="expired"?"Checkout expired — no payment confirmed for this request.":r.status==="payment_failed"?"Payment failed — check status before retrying":"Finish your transaction or cancel — check status first if you already submitted payment."}</p>
      {r.status!=="cancelled"&&<div className="flex flex-wrap gap-3">{[["check","Check payment status"],...(["processing","paid"].includes(r.checkoutState)?[]:[["finish","Finish transaction"],["cancel","Cancel unpaid checkout"]])].map(([action,label])=><button key={action} disabled={busy!==null} onClick={()=>void act(r.id,action)} className="rounded-lg border bg-white px-4 py-2 font-semibold disabled:opacity-50">{busy===r.id?"Checking…":label}</button>)}</div>}
    </article>)}
    {compact&&<Link className="mt-4 inline-block font-bold underline" href="/supporters/payment-center">Open Payment Center and monthly breakdown</Link>}
  </section>;
}
