"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function EmanonRegisterPage() {
  const token = useSearchParams().get("invite") ?? "";
  const [invite, setInvite] = useState<{ email:string; full_name:string; title:string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("Verifying your invitation...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/emanon/register?invite=${encodeURIComponent(token)}`)
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(); setInvite(data.invite); setMessage(""); })
      .catch(() => setMessage("This invitation is invalid or expired. Please contact Emanon Institute."));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) return setMessage("Passwords do not match.");
    if (password.length < 12) return setMessage("Use at least 12 characters for your password.");
    setBusy(true); setMessage("");
    const response = await fetch("/api/emanon/register", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ invite:token, password }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(data.error ?? "Unable to create the account.");
    window.location.href = "/emanon/login?registered=1";
  }

  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-12 text-[#06245c]">
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
      <p className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-green-700">Emanon Institute</p>
      <h1 className="mb-3 text-center text-4xl font-extrabold">Staff Access Registration</h1>
      {invite && <div className="mb-8 rounded-2xl bg-blue-50 p-5 text-center"><p className="text-2xl font-bold">{invite.full_name}</p><p>{invite.title}</p><p className="font-semibold">{invite.email}</p></div>}
      {message && <p className="mb-6 rounded-xl bg-amber-50 p-4 text-center font-semibold text-amber-900">{message}</p>}
      {invite && <form onSubmit={submit} className="space-y-5">
        <input type="password" autoComplete="new-password" placeholder="Create password (12+ characters)" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-xl border p-4" required />
        <input type="password" autoComplete="new-password" placeholder="Confirm password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="w-full rounded-xl border p-4" required />
        <button disabled={busy} className="w-full rounded-xl bg-[#06245c] p-4 text-xl font-bold text-white disabled:opacity-60">{busy ? "Creating secure access..." : "Activate Emanon Access"}</button>
      </form>}
    </div>
  </main>;
}
