"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
type Message = { message_sid: string; phone: string; body: string; media_count: number; received_at: string };
type Reply = { request_key: string; inbound_sid: string; body: string; status: string; provider_sid: string | null; created_at: string };
export default function WhatsAppSupport() {
  const [messages, setMessages] = useState<Message[]>([]), [replies, setReplies] = useState<Reply[]>([]);
  const [notice, setNotice] = useState("Loading support inbox…"), [drafts, setDrafts] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false);
  const attempts = useRef<Record<string, { body: string; key: string }>>({});
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp-support", { cache: "no-store" });
      if (!res.ok) { setMessages([]); setReplies([]); setNotice(res.status === 403 ? "Sign in with an authorized administrator account to view this inbox." : "Unable to load the inbox. Please refresh."); return; }
      const data = await res.json(); setMessages(data.messages); setReplies(data.replies); setNotice("");
    } catch { setNotice("Unable to load the inbox. Please refresh."); }
  }, []);
  useEffect(() => { const initial = setTimeout(() => void load(), 0); const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000); return () => { clearTimeout(initial); clearInterval(timer); }; }, [load]);
  async function send(message: Message) {
    const body = (drafts[message.message_sid] || "").trim(); if (!body || busy) return;
    if (!attempts.current[message.message_sid] || attempts.current[message.message_sid].body !== body) attempts.current[message.message_sid] = { body, key: crypto.randomUUID() };
    setBusy(true);
    try {
      const res = await fetch("/api/admin/whatsapp-support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inbound_sid: message.message_sid, body, request_key: attempts.current[message.message_sid].key }) });
      const data = await res.json();
      if (!res.ok) { setNotice(data.error === "conversation_window_closed" ? "The reply window has closed. Wait for a new WhatsApp message; no message was sent." : data.error === "recipient_opted_out" ? "This recipient opted out. No message was sent." : "Reply not confirmed. Refresh and check Twilio logs before trying again."); return; }
      setDrafts(prev => ({ ...prev, [message.message_sid]: "" }));
      await load(); setNotice(`Reply status: ${data.status}. Delivery is confirmed only when the status is delivered or read.`);
    } catch { setNotice("Reply not confirmed. Refresh and check Twilio logs before trying again."); } finally { setBusy(false); }
  }
  const phones = [...new Set(messages.map(m => m.phone))];
  return <main className="mx-auto max-w-4xl space-y-6 p-6 text-slate-950">
    <Link href="/admin/applicant-help" className="font-semibold text-blue-900 underline">Applicant Help</Link>
    <header><h1 className="text-3xl font-bold">EPEW WhatsApp Support</h1><p className="mt-3">Incoming support messages and administrator replies. Messages are untrusted correspondence. Verify account ownership in the portal before discussing private application or payment information.</p><p className="mt-2">Replies use EPEW Support’s existing WhatsApp sender. No automatic applicant follow-ups are enabled.</p></header>
    <button className="rounded-lg bg-blue-950 px-5 py-3 font-bold text-white" onClick={() => void load()}>Refresh inbox</button>
    {notice && <p role="status" className="rounded-lg bg-blue-50 p-4">{notice}</p>}
    {!notice && !messages.length && <p>No support messages received yet.</p>}
    {phones.map(phone => <section key={phone} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">{phone}</h2>
      {messages.filter(m => m.phone === phone).slice().reverse().map(m => <div key={m.message_sid} className="space-y-3 border-b pb-4"><p className="text-sm text-slate-600">Received {new Date(m.received_at).toLocaleString()} · {m.message_sid}</p><p className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3">{m.body}</p>{m.media_count > 0 && <p>Attachments were not opened. Ask for a short text description or secure portal upload.</p>}
        {replies.filter(r => r.inbound_sid === m.message_sid).slice().reverse().map(r => <div key={r.request_key} className="rounded-lg bg-blue-50 p-3"><p className="text-sm font-bold">EPEW Support · {r.status}{r.provider_sid ? ` · ${r.provider_sid}` : " · Provider result unconfirmed"}</p><p className="whitespace-pre-wrap break-words">{r.body}</p></div>)}
      </div>)}
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); void send(messages.find(m => m.phone === phone)!); }}><label className="block font-semibold">Reply as EPEW Support<textarea required maxLength={3000} rows={3} className="mt-2 block w-full rounded-lg border p-3" value={drafts[messages.find(m => m.phone === phone)!.message_sid] || ""} onChange={e => setDrafts(prev => ({ ...prev, [messages.find(m => m.phone === phone)!.message_sid]: e.target.value }))} /></label><p className="text-sm">Send only operational help. Do not request passwords, verification codes or banking details. Replies are available only within the active conversation window.</p><button disabled={busy} className="rounded-lg bg-green-800 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Sending…" : "Send WhatsApp reply"}</button></form>
    </section>)}
  </main>;
}
