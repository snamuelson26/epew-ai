"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type CampaignBusiness = {
  id: string;
  public_business_id: string | null;
  business_name: string | null;
  full_name: string | null;
  business_description: string | null;
  business_category: string | null;
  city: string | null;
  state: string | null;
  funding_goal: number | null;
  community_units_supported: number | null;
  community_units_required: number | null;
  campaign_status: string | null;
};

type Contact = {
  id: string;
  prospect_name: string;
  phone: string | null;
  email: string | null;
  preferred_language: string | null;
  relationship: string | null;
  status: string;
};

type MessageMeta = {
  contact_id: string;
  delivery_status: string;
  scheduled_for: string | null;
  sent_at: string | null;
};

const OFFICIAL_FUNDING_APPROVAL = 100000;

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ht: "Kreyòl Ayisyen",
  fr: "Français",
  es: "Español",
};

function formatStatus(value: string | null | undefined) {
  if (!value) return "Not started";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatEastern(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function EntrepreneurCampaignPage() {
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<CampaignBusiness | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, MessageMeta>>({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setNotice("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      window.location.href = "/entrepreneurs/login";
      return;
    }

    const { data: application, error: appError } = await supabase
      .from("entrepreneur_applications")
      .select("id,user_id,full_name,business_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appError || !application) {
      setNotice(appError?.message || "Unable to load your entrepreneur application.");
      setLoading(false);
      return;
    }

    const { data: businessData, error: businessError } = await supabase
      .from("entrepreneurs")
      .select("id,public_business_id,business_name,full_name,business_description,business_category,city,state,funding_goal,community_units_supported,community_units_required,campaign_status")
      .eq("source_application_id", application.id)
      .eq("qualified", true)
      .order("marketplace_visibility", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (businessError || !businessData) {
      setNotice(businessError?.message || "Your campaign business is not ready yet.");
    } else {
      setBusiness(businessData as CampaignBusiness);
    }

    const { data: contactData, error: contactError } = await supabase
      .from("epew_entrepreneur_communication_contacts")
      .select("id,prospect_name,phone,email,preferred_language,relationship,status")
      .eq("entrepreneur_user_id", user.id)
      .order("created_at", { ascending: false });

    if (contactError) {
      setNotice(contactError.message);
    }

    const loadedContacts = (contactData || []) as Contact[];
    setContacts(loadedContacts);

    if (loadedContacts.length > 0) {
      const ids = loadedContacts.map((contact) => contact.id);
      const { data: messageData } = await supabase
        .from("epew_entrepreneur_communication_messages")
        .select("contact_id,delivery_status,scheduled_for,sent_at,created_at")
        .in("contact_id", ids)
        .eq("message_type", "introduction")
        .order("created_at", { ascending: false });

      const byContact: Record<string, MessageMeta> = {};
      for (const item of messageData || []) {
        if (!byContact[item.contact_id]) {
          byContact[item.contact_id] = {
            contact_id: item.contact_id,
            delivery_status: item.delivery_status,
            scheduled_for: item.scheduled_for,
            sent_at: item.sent_at,
          };
        }
      }
      setMessages(byContact);
    }

    setLoading(false);
  }

  const supported = Number(business?.community_units_supported || 0);
  const required = Number(business?.community_units_required || 20);
  const remaining = Math.max(0, required - supported);
  const progress = required > 0 ? Math.min(100, Math.round((supported / required) * 100)) : 0;

  const supportUrl = useMemo(() => {
    const code = business?.public_business_id || "FFR-001";
    return `/support/${code}`;
  }, [business]);

  if (loading) {
    return <main className="min-h-screen bg-slate-100 p-6 text-slate-700">Loading your campaign...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-blue-950 to-green-700 p-6 text-white shadow-xl md:p-8">
          <p className="text-sm font-black uppercase tracking-widest text-lime-300">Private Entrepreneur Campaign View</p>
          <h1 className="mt-2 text-4xl font-black">{business?.business_name || "My Campaign"}</h1>
          <p className="mt-2 text-lg text-white/90">Manage your campaign progress and the people you personally contacted for support.</p>
        </header>

        {notice && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 font-semibold text-blue-800">{notice}</div>}

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Supported Units" value={supported} />
          <Metric label="Required Units" value={required} />
          <Metric label="Remaining Units" value={remaining} />
          <Metric label="Campaign Progress" value={`${progress}%`} />
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg md:p-8">
          <div className="grid gap-5 md:grid-cols-3">
            <Info label="Business" value={business?.business_name || "Food Fans Restaurant"} />
            <Info label="Business ID" value={business?.public_business_id || "FFR-001"} />
            <Info label="Funding Approval" value={`$${OFFICIAL_FUNDING_APPROVAL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          </div>

          <div className="mt-6 h-4 rounded-full bg-slate-200">
            <div className="h-4 rounded-full bg-green-600" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/entrepreneurs/supporters" className="rounded-xl bg-green-700 px-5 py-3 font-black text-white hover:bg-green-800">+ Add Potential Supporter</Link>
            <Link href={supportUrl} className="rounded-xl border-2 border-blue-950 px-5 py-3 font-black text-blue-950 hover:bg-blue-950 hover:text-white">View Public Support Page</Link>
          </div>
        </section>

        <section className="rounded-3xl border-2 border-blue-200 bg-white p-6 shadow-lg md:p-8">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-blue-700">Campaign Contact List</p>
            <h2 className="mt-1 text-3xl font-black text-blue-950">My Potential Supporters</h2>
            <p className="mt-2 text-slate-600">These are the people you personally talked to and added to receive campaign messages. This list is private to you.</p>
          </div>

          {contacts.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-slate-700">No potential supporters have been added yet.</div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="text-sm uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-3">Name</th>
                    <th className="border-b border-slate-200 px-3 py-3">Contact</th>
                    <th className="border-b border-slate-200 px-3 py-3">Language</th>
                    <th className="border-b border-slate-200 px-3 py-3">Relationship</th>
                    <th className="border-b border-slate-200 px-3 py-3">Support Status</th>
                    <th className="border-b border-slate-200 px-3 py-3">Message Status</th>
                    <th className="border-b border-slate-200 px-3 py-3">Scheduled / Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => {
                    const message = messages[contact.id];
                    const dateValue = message?.sent_at || message?.scheduled_for;
                    return (
                      <tr key={contact.id} className="align-top">
                        <td className="border-b border-slate-100 px-3 py-4 font-black text-slate-900">{contact.prospect_name}</td>
                        <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                          {contact.phone && <div>{contact.phone}</div>}
                          {contact.email && <div className="break-all">{contact.email}</div>}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-4 text-slate-700">{LANGUAGE_LABELS[contact.preferred_language || "en"] || contact.preferred_language || "English"}</td>
                        <td className="border-b border-slate-100 px-3 py-4 text-slate-700">{contact.relationship || "—"}</td>
                        <td className="border-b border-slate-100 px-3 py-4"><span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-800">{formatStatus(contact.status)}</span></td>
                        <td className="border-b border-slate-100 px-3 py-4"><span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-800">{formatStatus(message?.delivery_status)}</span></td>
                        <td className="border-b border-slate-100 px-3 py-4 text-slate-700">{dateValue ? `${formatEastern(dateValue)} Eastern` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-center shadow">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black text-blue-950">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-blue-950">{value}</p>
    </div>
  );
}
