"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Contact = {
  id: string;
  prospect_name: string;
  preferred_language: string | null;
  conversation_notes: string | null;
};

type Message = {
  id: string;
  contact_id: string;
  message_type: string | null;
  language: string | null;
  subject: string | null;
  body: string | null;
  delivery_status: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(value: string | null) {
  if (!value) return "Prepared";
  return value.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function EntrepreneurCommunicationPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void loadContacts();
  }, []);

  useEffect(() => {
    if (selectedId) void loadConversation(selectedId);
    else setMessages([]);
  }, [selectedId]);

  async function loadContacts() {
    setLoading(true);
    setNotice("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      window.location.href = "/entrepreneurs/login";
      return;
    }

    const { data, error } = await supabase
      .from("epew_entrepreneur_communication_contacts")
      .select("id,prospect_name,preferred_language,conversation_notes")
      .eq("entrepreneur_user_id", user.id)
      .order("prospect_name", { ascending: true });

    if (error) {
      setNotice(error.message);
      setLoading(false);
      return;
    }

    const unique = new Map<string, Contact>();
    for (const contact of (data || []) as Contact[]) {
      const key = (contact.prospect_name || "").trim().toLowerCase();
      if (key && !unique.has(key)) unique.set(key, contact);
    }

    const list = Array.from(unique.values());
    setContacts(list);
    if (list.length > 0) setSelectedId(list[0].id);
    setLoading(false);
  }

  async function loadConversation(contactId: string) {
    setHistoryLoading(true);
    setNotice("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("epew_entrepreneur_communication_messages")
      .select("id,contact_id,message_type,language,subject,body,delivery_status,scheduled_for,sent_at,created_at")
      .eq("entrepreneur_user_id", user.id)
      .eq("contact_id", contactId)
      .order("created_at", { ascending: true });

    if (error) {
      setNotice(error.message);
      setMessages([]);
    } else {
      setMessages((data || []) as Message[]);
    }

    setHistoryLoading(false);
  }

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedId) || null,
    [contacts, selectedId],
  );

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 md:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-green-700 p-6 text-white shadow-xl md:p-8">
          <p className="text-sm font-black uppercase tracking-widest text-lime-300">
            Personal Communication Secretary
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Communication Center</h1>
          <p className="mt-2 max-w-3xl text-white/90">
            Open a contact to review your private conversation and complete communication history with that person.
          </p>
        </header>

        {notice && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800">
            {notice}
          </div>
        )}

        <section className="grid min-h-[620px] overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-[300px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 px-5 py-5">
              <h2 className="text-lg font-black text-blue-950">Contacts</h2>
              <p className="mt-1 text-sm text-slate-500">Select a name to open the conversation.</p>
            </div>

            <div className="max-h-[540px] overflow-y-auto p-2">
              {loading ? (
                <p className="p-4 text-slate-500">Loading contacts...</p>
              ) : contacts.length === 0 ? (
                <p className="p-4 text-slate-500">No communication contacts yet.</p>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedId(contact.id)}
                    className={`w-full rounded-xl px-4 py-3 text-left font-bold transition ${
                      selectedId === contact.id
                        ? "bg-blue-950 text-white shadow"
                        : "text-slate-800 hover:bg-blue-100"
                    }`}
                  >
                    {contact.prospect_name}
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col bg-white">
            {!selectedContact ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-500">
                Select a contact name to open the private conversation history.
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200 px-5 py-5 md:px-7">
                  <h2 className="text-2xl font-black text-slate-900">{selectedContact.prospect_name}</h2>
                  <p className="mt-1 text-sm text-slate-500">Private entrepreneur communication history</p>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50 p-5 md:p-7">
                  {selectedContact.conversation_notes && (
                    <div className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-slate-800">
                      <p className="text-xs font-black uppercase tracking-wide text-amber-700">Conversation Note</p>
                      <p className="mt-2 whitespace-pre-wrap leading-relaxed">{selectedContact.conversation_notes}</p>
                    </div>
                  )}

                  {historyLoading ? (
                    <p className="text-slate-500">Loading conversation history...</p>
                  ) : messages.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
                      No messages have been recorded for this contact yet.
                    </div>
                  ) : (
                    messages.map((message) => (
                      <article key={message.id} className="ml-auto max-w-3xl rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                              {message.message_type ? statusLabel(message.message_type) : "Message"}
                            </p>
                            {message.subject && <h3 className="mt-1 text-lg font-black text-slate-900">{message.subject}</h3>}
                          </div>
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                            {statusLabel(message.delivery_status)}
                          </span>
                        </div>

                        {message.body && (
                          <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-slate-800">{message.body}</p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                          {message.language && <span>Language: {message.language.toUpperCase()}</span>}
                          {message.sent_at && <span>Sent: {formatDate(message.sent_at)} ET</span>}
                          {!message.sent_at && message.scheduled_for && <span>Scheduled: {formatDate(message.scheduled_for)} ET</span>}
                          {!message.sent_at && !message.scheduled_for && message.created_at && <span>Prepared: {formatDate(message.created_at)} ET</span>}
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-200 bg-white p-5 md:p-6">
                  <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-5">
                    <p className="font-black text-blue-950">Personal Secretary Message Controls</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      Message arranging, entrepreneur review, scheduling, automatic follow-up, and send controls will operate here for this selected contact so the conversation remains together in one place.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/entrepreneurs/dashboard" className="rounded-xl bg-blue-950 px-5 py-3 text-center font-bold text-white hover:bg-blue-800">
            ← Back to Entrepreneur Portal
          </Link>
          <Link href="/entrepreneurs/supporters" className="rounded-xl bg-green-700 px-5 py-3 text-center font-bold text-white hover:bg-green-800">
            Manage Potential Supporters
          </Link>
        </div>
      </div>
    </main>
  );
}
