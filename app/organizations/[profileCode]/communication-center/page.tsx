"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  profile_code: string;
  display_name: string;
  external_sender: string;
  entity_id: string;
};

type Contact = {
  id: string;
  display_name: string | null;
  organization: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  preferred_language: string | null;
  country: string | null;
};

type Event = {
  id: string;
  event_type: string;
  channel: string | null;
  direction: string | null;
  status: string | null;
  title: string | null;
  summary: string | null;
  message_preview: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function when(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function OrganizationCommunicationCenterPage() {
  const params = useParams<{ profileCode: string }>();
  const profileCode = String(params?.profileCode || "");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [arrangeMode, setArrangeMode] = useState("professionalize");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void loadWorkspace();
  }, [profileCode]);

  async function loadWorkspace() {
    setLoading(true);
    setNotice("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/entrepreneurs/login";
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("organization_portal_profiles")
        .select("profile_code,display_name,external_sender,entity_id")
        .eq("auth_user_id", user.id)
        .eq("profile_code", profileCode)
        .eq("status", "active")
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profileData) throw new Error("This organization profile is not available for your login.");

      const p = profileData as Profile;
      setProfile(p);

      const { data: groupRows, error: groupError } = await supabase
        .from("communication_groups")
        .select("id")
        .eq("entity_id", p.entity_id);
      if (groupError) throw groupError;

      const groupIds = (groupRows || []).map((g: { id: string }) => g.id);
      if (!groupIds.length) {
        setContacts([]);
        return;
      }

      const { data: memberRows, error: memberError } = await supabase
        .from("communication_group_members")
        .select("contact_id")
        .in("group_id", groupIds)
        .eq("membership_status", "active");
      if (memberError) throw memberError;

      const contactIds = Array.from(new Set((memberRows || []).map((m: { contact_id: string }) => m.contact_id)));
      if (!contactIds.length) {
        setContacts([]);
        return;
      }

      const { data: contactRows, error: contactError } = await supabase
        .from("communication_contacts")
        .select("id,display_name,organization,job_title,email,phone,preferred_language,country")
        .in("id", contactIds)
        .order("display_name");
      if (contactError) throw contactError;
      setContacts((contactRows || []) as Contact[]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load the Emanon Communication Center.");
    } finally {
      setLoading(false);
    }
  }

  async function openContact(contact: Contact) {
    setSelected(contact);
    setNotice("");
    setSubject("");
    setMessage("");
    const { data, error } = await supabase
      .from("communication_events")
      .select("id,event_type,channel,direction,status,title,summary,message_preview,metadata,created_at")
      .eq("contact_id", contact.id)
      .order("created_at", { ascending: true });
    if (error) {
      setNotice(error.message);
      return;
    }
    setEvents((data || []) as Event[]);
  }

  async function arrangeMessage() {
    if (!message.trim()) {
      setNotice("Enter a message first.");
      return;
    }
    setWorking(true);
    setNotice("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Your EPEW session has expired. Please sign in again.");

      const response = await fetch("/api/organizations/communication/arrange-message", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profileCode, message, instruction: arrangeMode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to arrange message.");
      setMessage(String(data.arranged || message));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to arrange message.");
    } finally {
      setWorking(false);
    }
  }

  async function sendMessage() {
    if (!selected) return;
    if (!selected.email) {
      setNotice("This contact does not have an email address.");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      setNotice("Enter both a subject and a message.");
      return;
    }

    setWorking(true);
    setNotice("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Your EPEW session has expired. Please sign in again.");

      const response = await fetch("/api/organizations/communication/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profileCode, contactId: selected.id, subject, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send message.");

      setNotice(`Sent successfully from ${profile?.display_name || "Emanon Institute"} <${profile?.external_sender}>. Replies return to ${profile?.external_sender}.`);
      setSubject("");
      setMessage("");
      await openContact(selected);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to send message.");
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-100 p-8 text-slate-700">Loading Emanon Communication Center...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/dashboard`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">← Emanon Dashboard</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/grant-contacts`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Grant Contacts</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/tablet-project`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Tablet Project</Link>
        </div>

        <header className="rounded-3xl bg-gradient-to-r from-[#10246f] to-green-700 p-7 text-white shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-lime-300">{profile?.display_name || "Emanon Institute"} · {profileCode}</p>
          <h1 className="mt-2 text-4xl font-black">Communication Center</h1>
          <p className="mt-3 text-lg text-white/90">Names-first communication workspace with complete conversation history.</p>
          <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm font-bold">
            <div>From: Emanon Institute &lt;{profile?.external_sender}&gt;</div>
            <div>Reply-To: {profile?.external_sender}</div>
            <div>Login authentication remains separate from this external sender identity.</div>
          </div>
        </header>

        {notice && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 font-semibold text-blue-900">{notice}</div>}

        <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
          <section className="rounded-3xl bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#10246f]">Contacts</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{contacts.length}</span>
            </div>
            <div className="space-y-2">
              {contacts.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-slate-600">No contacts are currently assigned to Emanon communication groups.</p>}
              {contacts.map((contact) => (
                <button key={contact.id} onClick={() => void openContact(contact)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === contact.id ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-blue-300"}`}>
                  <p className="font-black text-slate-900">{contact.display_name || contact.organization || "Unnamed Contact"}</p>
                  <p className="mt-1 text-sm text-slate-600">{contact.organization || contact.email || "Contact"}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-lg">
            {!selected ? (
              <div className="py-20 text-center">
                <h2 className="text-2xl font-black text-[#10246f]">Open a contact</h2>
                <p className="mt-3 text-slate-600">Select a name to view that person’s complete conversation and send a new message.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-5">
                  <h2 className="text-3xl font-black text-[#10246f]">{selected.display_name || selected.organization}</h2>
                  <p className="mt-1 text-slate-600">{selected.organization} {selected.job_title ? `· ${selected.job_title}` : ""}</p>
                  <p className="mt-2 text-sm text-slate-600">{selected.email || "No email"} · {selected.phone || "No phone"} · {selected.preferred_language || "Language not set"}</p>
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#10246f]">Conversation History</h3>
                  <div className="mt-3 max-h-[360px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
                    {events.length === 0 ? <p className="text-slate-600">No communication history yet.</p> : events.map((event) => (
                      <div key={event.id} className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="font-bold text-slate-900">{event.title || event.event_type}</p>
                          <p className="text-xs text-slate-500">{when(event.created_at)} Eastern</p>
                        </div>
                        <p className="mt-1 text-xs font-bold uppercase text-slate-500">{event.channel || "note"} · {event.direction || "internal"} · {event.status || "recorded"}</p>
                        <p className="mt-2 whitespace-pre-line text-slate-700">{event.summary || event.message_preview || "Communication recorded."}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-xl font-black text-[#10246f]">New Message</h3>
                  <p className="mt-1 text-sm font-bold text-green-700">From: Emanon Institute &lt;{profile?.external_sender}&gt; · Reply-To: {profile?.external_sender}</p>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-4 w-full rounded-xl border border-slate-300 p-3" placeholder="Subject" />
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} className="mt-3 w-full rounded-xl border border-slate-300 p-3" placeholder="Write your message here..." />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select value={arrangeMode} onChange={(e) => setArrangeMode(e.target.value)} className="rounded-xl border px-3 py-2">
                      <option value="professionalize">Professionalize</option>
                      <option value="improve">Improve</option>
                      <option value="shorten">Shorten</option>
                      <option value="translate">Translate</option>
                    </select>
                    <button disabled={working} onClick={() => void arrangeMessage()} className="rounded-xl bg-[#10246f] px-4 py-2 font-bold text-white disabled:bg-slate-400">{working ? "Working..." : "Arrange Message"}</button>
                    <button disabled={working || !selected.email} onClick={() => void sendMessage()} className="rounded-xl bg-green-700 px-5 py-2 font-black text-white disabled:bg-slate-400">Send Email</button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Outbound messages are stored in the contact’s Emanon conversation history. Delivery/open/click events will be added as provider tracking is connected.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
