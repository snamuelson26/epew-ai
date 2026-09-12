"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EmanonLoginPage() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");const {data,error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});if(error||!data.user){setBusy(false);return setMessage(error?.message??"Unable to sign in.");}const {data:member}=await supabase.from("emanon_staff_members").select("id").eq("user_id",data.user.id).eq("status","active").maybeSingle();if(!member){await supabase.auth.signOut();setBusy(false);return setMessage("This account does not have active Emanon Institute access.");}window.location.href="/emanon/communication-center";}
  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-12 text-[#06245c]"><div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-2xl"><p className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-green-700">Emanon Institute</p><h1 className="mb-8 text-center text-4xl font-extrabold">Communication Center Login</h1>{message&&<p className="mb-5 rounded-xl bg-red-50 p-4 text-center font-semibold text-red-700">{message}</p>}<form onSubmit={submit} className="space-y-5"><input type="email" placeholder="Official Emanon email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-xl border p-4" required/><input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-xl border p-4" required/><button disabled={busy} className="w-full rounded-xl bg-[#06245c] p-4 text-xl font-bold text-white disabled:opacity-60">{busy?"Signing in...":"Sign In"}</button></form></div></main>;
}
