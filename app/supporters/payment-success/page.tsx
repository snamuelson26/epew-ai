"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
type Status = {found?:boolean;pending?:boolean;paymentStatus?:string;message?:string;error?:string;amount?:number;transactionId?:string};
export default function PaymentSuccessPage(){return <Suspense fallback={<p>Checking payment…</p>}><PaymentResult /></Suspense>;}
function PaymentResult(){
  const params=useSearchParams();const sessionId=params.get("session_id")||"";
  const [result,setResult]=useState<Status|null>(null);const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  async function check(){
    if(!sessionId)return;
    setLoading(true);setError("");
    try{const response=await fetch(`/api/supporters/annual-support/status?session_id=${encodeURIComponent(sessionId)}`,{cache:"no-store"});const value=await response.json();if(!response.ok)throw new Error(value.error||"Unable to verify payment.");setResult(value);}
    catch(e){setError(e instanceof Error?e.message:"Unable to verify payment.");}finally{setLoading(false);}
  }
  useEffect(()=>{void check();},[sessionId]);
  const confirmed=result?.found===true&&result.paymentStatus==="paid"&&!error;
  return <section className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-[#06245c] shadow sm:p-10">
    <h1 className="text-3xl font-bold">{loading?"Checking your payment…":confirmed?"Payment confirmed":!sessionId?"Payment reference missing":"Payment verification"}</h1>
    {error&&<p role="alert" className="mt-5 text-red-700">{error} We cannot confirm this payment yet.</p>}
    {confirmed?<><p className="mt-5">Your payment of {new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(result?.amount||0)} is recorded in your portal.</p><p className="mt-3 break-all">Transaction: {result?.transactionId}</p></>:<p className="mt-5">{result?.message||"A return from checkout is not proof of payment. Check your payment status before paying again. Bank payments may still be processing."}</p>}
    <div className="mt-6 flex flex-wrap gap-4"><Link className="rounded-xl bg-[#06245c] px-5 py-3 font-bold text-white" href="/supporters/payment-center">View my transactions</Link>{sessionId&&!confirmed&&<button disabled={loading} className="rounded-xl border px-5 py-3 disabled:opacity-50" onClick={()=>void check()}>Check payment again</button>}</div>
  </section>;
}
