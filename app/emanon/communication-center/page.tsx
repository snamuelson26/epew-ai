"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";

type Member = {
  id: string;
  organization_id: string;
  display_name: string;
  title: string;
  role_code: string;
  permissions: Record<string, boolean>;
};
type Message = {
  id: string;
  sender_member_id: string;
  message_type: string;
  subject: string | null;
  body: string;
  assignment_due_at: string | null;
  follow_up_at: string | null;
  attachments: Array<{ name: string; path: string }>;
  created_at: string;
  receipts?: Array<{ delivered_at: string; opened_at: string | null; member?: { display_name: string; email: string } }>;
  sender?: { display_name: string; title: string };
};
type Contact = {
  id: string;
  email: string;
  display_name: string;
  title: string;
  conversation_id: string;
};

export default function EmanonCommunicationCenter() {
  const isOrgdh = usePathname().startsWith("/orgdh/");
  const organizationCode = isOrgdh ? "ORGDH-NETWORK" : "EMANON-INSTITUTE";
  const organizationName = isOrgdh ? "ORGDH Network" : "Emanon Institute";
  const basePath = isOrgdh ? "/orgdh" : "/emanon";
  const [member, setMember] = useState<Member | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("message");
  const [due, setDue] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!conversationId || !member) return;
    const channel = supabase
      .channel(`emanon-direct-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emanon_messages", filter: `conversation_id=eq.${conversationId}` },
        () => void loadMessages(conversationId, member.id),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, member]);
  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `${basePath}/login`;
      return;
    }
    const { data: m } = await supabase
      .from("emanon_staff_members")
      .select("id,organization_id,display_name,title,role_code,permissions")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    if (!m) {
      window.location.href = `${basePath}/login`;
      return;
    }
    const { data: organization } = await supabase
      .from("emanon_organizations")
      .select("organization_code")
      .eq("id", m.organization_id)
      .maybeSingle();
    if (organization?.organization_code !== organizationCode) {
      await supabase.auth.signOut();
      window.location.href = `${basePath}/login`;
      return;
    }
    setMember(m);
    const { data: conversations, error: conversationsError } = await supabase
      .from("emanon_conversations")
      .select("id")
      .eq("organization_id", m.organization_id)
      .eq("conversation_type", "direct");
    if (conversationsError) {
      setNotice(conversationsError.message);
      return;
    }
    const conversationIds = (conversations ?? []).map((item) => item.id);
    if (!conversationIds.length) return;
    const { data: links, error: linksError } = await supabase
      .from("emanon_conversation_members")
      .select(
        "conversation_id,member:emanon_staff_members!member_id(id,email,display_name,title)",
      )
      .in("conversation_id", conversationIds)
      .neq("member_id", m.id);
    if (linksError) {
      setNotice(linksError.message);
      return;
    }
    const availableContacts = (links ?? [])
      .map((link) => {
        const contact = Array.isArray(link.member)
          ? link.member[0]
          : link.member;
        return contact
          ? { ...contact, conversation_id: link.conversation_id }
          : null;
      })
      .filter((contact): contact is Contact => contact !== null)
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
    setContacts(availableContacts);
    const initialContact = availableContacts[0];
    if (!initialContact) return;
    setSelectedContactId(initialContact.id);
    setConversationId(initialContact.conversation_id);
    await loadMessages(initialContact.conversation_id, m.id);
  }
  async function selectContact(contactId: string) {
    if (!member) return;
    const contact = contacts.find((item) => item.id === contactId);
    if (!contact) return;
    setSelectedContactId(contact.id);
    setConversationId(contact.conversation_id);
    setMessages([]);
    setNotice("");
    await loadMessages(contact.conversation_id, member.id);
  }
  async function loadMessages(cid: string, memberId: string) {
    const { data, error } = await supabase
      .from("emanon_messages")
      .select(
        "*,sender:emanon_staff_members!sender_member_id(display_name,title),receipts:emanon_message_receipts(delivered_at,opened_at,member:emanon_staff_members!member_id(display_name,email))",
      )
      .eq("conversation_id", cid)
      .order("created_at");
    if (error) {
      setNotice(error.message);
      return;
    }
    setMessages((data ?? []) as Message[]);
    const incoming = (data ?? [])
      .filter((item) => item.sender_member_id !== memberId)
      .map((item) => ({
        message_id: item.id,
        member_id: memberId,
        opened_at: new Date().toISOString(),
      }));
    if (incoming.length)
      await supabase
        .from("emanon_message_receipts")
        .upsert(incoming, { onConflict: "message_id,member_id" });
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!member || !conversationId || !body.trim()) return;
    setBusy(true);
    setNotice("");
    const attachments: Array<{ name: string; path: string }> = [];
    for (const file of Array.from(files ?? [])) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${member.organization_id}/${member.id}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage
        .from("emanon-communications")
        .upload(path, file);
      if (error) {
        setBusy(false);
        return setNotice(`Attachment failed: ${error.message}`);
      }
      attachments.push({ name: file.name, path });
    }
    const { error } = await supabase
      .from("emanon_messages")
      .insert({
        organization_id: member.organization_id,
        conversation_id: conversationId,
        sender_member_id: member.id,
        message_type: type,
        subject: subject.trim() || null,
        body: body.trim(),
        assignment_due_at:
          type === "assignment" && due ? new Date(due).toISOString() : null,
        follow_up_at: followUp ? new Date(followUp).toISOString() : null,
        attachments,
      });
    if (error) {
      setBusy(false);
      return setNotice(error.message);
    }
    setSubject("");
    setBody("");
    setDue("");
    setFollowUp("");
    setFiles(null);
    setBusy(false);
    await loadMessages(conversationId, member.id);
  }
  async function download(path: string) {
    const { data, error } = await supabase.storage
      .from("emanon-communications")
      .createSignedUrl(path, 120);
    if (error) return setNotice(error.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  async function logout() {
    setLoggingOut(true);
    setNotice("");
    try {
      const response = await fetch("/api/emanon/logout", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.error ?? "Unable to log out. Please try again.");
        setLoggingOut(false);
        return;
      }
      window.location.href = `${basePath}/login`;
    } catch {
      setNotice("The logout service could not be reached. Please try again.");
      setLoggingOut(false);
    }
  }
  if (!member)
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-center text-2xl font-bold text-[#06245c]">
        Loading {organizationName} Communication Center...
      </main>
    );
  const isDirector = member.role_code === "program_director" || member.role_code === "general_marketing_director";
  const selectedContact = contacts.find(
    (contact) => contact.id === selectedContactId,
  );
  return (
    <main className="min-h-screen bg-[#f5f7fb] p-4 text-[#06245c] md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-3xl bg-white p-6 shadow">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-green-700">
                {isOrgdh ? "ORGDH Network · Business Promotion & Media Services" : "Emanon Institute · Innovative Educational System"}
              </p>
              <h1 className="text-4xl font-extrabold">
                Communication Center
              </h1>
              <p className="mt-2 text-gray-700">
                {member.display_name} · {member.title}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={loggingOut}
              className="rounded-xl border-2 border-[#06245c] px-5 py-3 font-bold text-[#06245c] transition hover:bg-[#06245c] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>
        </header>
        {contacts.length > 0 && (
          <section className="mb-6 rounded-2xl bg-white p-5 shadow">
            <label className="block font-bold text-[#06245c]">
              Recipient / Contact
              <select
                value={selectedContactId}
                onChange={(event) => void selectContact(event.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-blue-200 bg-white p-4 text-base font-semibold text-gray-900"
              >
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.display_name} — {contact.title} — {contact.email}
                  </option>
                ))}
              </select>
            </label>
            {selectedContact && (
              <p className="mt-3 text-sm text-gray-600">
                Private one-to-one {organizationName} conversation with{" "}
                <strong>{selectedContact.display_name}</strong>
              </p>
            )}
          </section>
        )}
        {!conversationId && (
          <section className="rounded-2xl bg-amber-50 p-6 font-semibold text-amber-900">
            Your secure account is active. The direct conversation will appear
            automatically after the other authorized {organizationName} team member
            activates their account.
          </section>
        )}
        {conversationId && (
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <section className="rounded-3xl bg-white p-6 shadow">
              <h2 className="mb-1 text-2xl font-bold">
                Full Conversation History
              </h2>
              {selectedContact && (
                <p className="mb-5 text-sm text-gray-600">
                  {member.display_name} ↔ {selectedContact.display_name}
                </p>
              )}
              <div className="max-h-[650px] space-y-4 overflow-y-auto">
                {messages.length === 0 && (
                  <p className="text-gray-600">No messages yet.</p>
                )}
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`rounded-2xl border p-4 ${message.sender_member_id === member.id ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"}`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold">
                          From: {message.sender?.display_name ?? `${organizationName} Staff`}
                        </p>
                        <p className="text-sm text-gray-600">
                          To:{" "}
                          {message.sender_member_id === member.id
                            ? selectedContact?.display_name ?? `${organizationName} Staff`
                            : member.display_name}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase">
                        {message.message_type.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="font-bold">
                      Subject: {message.subject || "No subject"}
                    </h3>
                    <p className="whitespace-pre-wrap text-gray-800">
                      {message.body}
                    </p>
                    {message.assignment_due_at && (
                      <p className="mt-2 text-sm font-semibold">
                        Due:{" "}
                        {new Date(message.assignment_due_at).toLocaleString()}
                      </p>
                    )}
                    {message.follow_up_at && (
                      <p className="mt-1 text-sm font-semibold">
                        Follow-up:{" "}
                        {new Date(message.follow_up_at).toLocaleString()}
                      </p>
                    )}
                    {message.attachments?.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => void download(file.path)}
                        className="mr-2 mt-3 rounded-lg bg-white px-3 py-2 text-sm font-bold underline"
                      >
                        Open {file.name}
                      </button>
                    ))}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                      <span>{new Date(message.created_at).toLocaleString()}</span>
                      {message.sender_member_id === member.id && (
                        <span className="font-semibold">
                          {message.receipts?.some((receipt) => receipt.opened_at)
                            ? "Read"
                            : message.receipts?.length
                              ? "Delivered"
                              : "Sent"}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section className="rounded-3xl bg-white p-6 shadow">
              <h2 className="mb-5 text-2xl font-bold">New Communication</h2>
              {notice && (
                <p className="mb-4 rounded-xl bg-amber-50 p-3 font-semibold text-amber-900">
                  {notice}
                </p>
              )}
              <form onSubmit={submit} className="space-y-4">
                <label className="block text-sm font-bold">
                  Recipient
                  <select
                    value={selectedContactId}
                    onChange={(event) => void selectContact(event.target.value)}
                    className="mt-1 w-full rounded-xl border p-3 font-semibold"
                  >
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.display_name} — {contact.email}
                      </option>
                    ))}
                  </select>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="message">Direct Message</option>
                  <option value="report">Report</option>
                  {isDirector && <option value="assignment">Assignment</option>}
                  {isDirector && (
                    <option value="follow_up">Follow-up Instruction</option>
                  )}
                  <option value="proposal">Proposal</option>
                  <option value="urgent_update">Urgent Update</option>
                </select>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full rounded-xl border p-3"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message, report, assignment, or instructions..."
                  rows={8}
                  className="w-full rounded-xl border p-3"
                  required
                />
                {type === "assignment" && (
                  <label className="block text-sm font-bold">
                    Assignment due date
                    <input
                      type="datetime-local"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                      className="mt-1 w-full rounded-xl border p-3"
                    />
                  </label>
                )}
                <label className="block text-sm font-bold">
                  Follow-up date (optional)
                  <input
                    type="datetime-local"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-3"
                  />
                </label>
                <label className="block text-sm font-bold">
                  Attachments and proposals
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    className="mt-1 w-full rounded-xl border p-3"
                  />
                </label>
                <button
                  disabled={busy}
                  className="w-full rounded-xl bg-[#06245c] p-4 text-lg font-bold text-white disabled:opacity-60"
                >
                  {busy
                    ? "Sending..."
                    : selectedContact
                      ? `Send to ${selectedContact.display_name}`
                      : "Send Message"}
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
