"use client";
import { useEffect, useState } from "react";

export default function CloverReceipt({ memberId, onSaved }: { memberId: string; onSaved: () => Promise<void> }) {
  const [ready, setReady] = useState(false), [order, setOrder] = useState(""), [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/admin/food-fans-clover", { cache: "no-store" }).then(async r => {
      const data = await r.json();
      if (active) setReady(r.ok && data.configured && data.menuMapped);
    }).catch(() => { if (active) setReady(false); });
    return () => { active = false; };
  }, []);
  async function submit(action: "preview" | "import") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/food-fans-clover", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, member_id: memberId, order_id: order.trim(), reason, fulfillment_verified: confirmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Receipt could not be verified.");
      setMessage(action === "preview" ? `${data.qualifying_meals} qualifying meals verified. Confirm that the customer received the meals before importing.` : "Receipt recorded in the permanent rewards ledger.");
      if (action === "import") { setConfirmed(false); await onSaved(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Clover unavailable."); }
    finally { setBusy(false); }
  }
  return <section className="rounded-xl border bg-white p-5">
    <h2 className="text-xl font-bold">Verify a Clover receipt</h2>
    <p className="mt-2">Match this member to the customer on the paid Clover receipt, then confirm meal fulfillment.</p>
    {!ready && <p className="mt-3 rounded bg-amber-50 p-3">Connection pending: secure Clover credentials and approved menu mapping are required.</p>}
    <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); void submit("preview"); }}>
      <label className="block">Clover order ID<input className="block w-full rounded border p-3" required pattern="[A-Z0-9]{13}" maxLength={13} value={order} onChange={e => { setOrder(e.target.value.toUpperCase()); setConfirmed(false); setMessage(""); }} /></label>
      <button className="rounded border px-4 py-3 font-semibold disabled:opacity-50" disabled={!ready || busy}>Verify paid receipt</button>
      <label className="block">Fulfillment verification / receipt evidence<textarea className="block w-full rounded border p-3" maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label>
      <label className="block"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> I verified that this member received the meals on this receipt.</label>
      <button type="button" className="rounded bg-[#06245c] px-4 py-3 font-semibold text-white disabled:opacity-50" disabled={!ready || busy || !confirmed || !reason.trim() || !/^[A-Z0-9]{13}$/.test(order.trim())} onClick={() => void submit("import")}>Import verified meal credits</button>
    </form>
    {message && <p role="status" className="mt-3 rounded bg-slate-50 p-3">{message}</p>}
    <p className="mt-3 text-sm text-slate-600">Refunds, discounts and unmapped items require manager review. This connection does not apply a free-meal discount or issue raffle tickets.</p>
  </section>;
}
