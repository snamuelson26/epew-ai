"use client";

import { FormEvent, useState } from "react";
import { usePathname } from "next/navigation";

function safeRedirect(basePath: string) {
  const requested = new URLSearchParams(window.location.search).get("redirect");
  return requested?.startsWith("/emanon/oauth/") && !requested.startsWith("//")
    ? requested
    : requested?.startsWith(`${basePath}/`) && !requested.startsWith("//")
    ? requested
    : `${basePath}/communication-center`;
}

export default function EmanonLoginPage() {
  const isOrgdh = usePathname().startsWith("/orgdh/");
  const basePath = isOrgdh ? "/orgdh" : "/emanon";
  const organizationName = isOrgdh ? "ORGDH Network" : "Emanon Institute";
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");const redirectTo=safeRedirect(basePath);try{const response=await fetch("/api/emanon/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:email.trim().toLowerCase(),password,redirectTo,organizationCode:redirectTo.startsWith("/emanon/oauth/")?undefined:(isOrgdh?"ORGDH-NETWORK":"EMANON-INSTITUTE")})});const data=await response.json();if(!response.ok){return setMessage(data.error??"Unable to sign in.");}window.location.href=data.redirectTo??`${basePath}/communication-center`;}catch{setMessage("The EPEW login service could not be reached. Please check your connection and try again.");}finally{setBusy(false);}}
  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-12 text-[#06245c]"><div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-2xl"><p className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-green-700">{organizationName}</p><h1 className="mb-8 text-center text-4xl font-extrabold">Communication Center Login</h1>{message&&<p className="mb-5 rounded-xl bg-red-50 p-4 text-center font-semibold text-red-700">{message}</p>}<form onSubmit={submit} className="space-y-5"><input type="email" placeholder={`Official ${organizationName} email`} value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-xl border p-4" required/><input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-xl border p-4" required/><button disabled={busy} className="w-full rounded-xl bg-[#06245c] p-4 text-xl font-bold text-white disabled:opacity-60">{busy?"Signing in...":"Sign In"}</button></form></div></main>;
}
