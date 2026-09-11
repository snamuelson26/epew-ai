"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  profile_code: string;
  display_name: string;
  external_sender: string;
  entity_id: string;
  status: string;
};

type Group = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  member_count: number | null;
};

const MODULE_INFO: Record<string, { title: string; groupSlug: string; description: string }> = {
  "communication-center": {
    title: "Communication Center",
    groupSlug: "",
    description: "Central communication workspace for Emanon Institute. Messages, contacts, follow-up, and external communication will remain organized under EMANON-001.",
  },
  "grant-contacts": {
    title: "Grant Contacts",
    groupSlug: "emanon-001-grant-contacts",
    description: "Foundations, grant agencies, grant writers, funding opportunities, and grant-related communication.",
  },
  "tablet-project": {
    title: "Tablet Project",
    groupSlug: "emanon-001-tablet-project",
    description: "Schools, sponsors, donors, logistics contacts, project stakeholders, and communication for the Tablet Project.",
  },
  vendors: {
    title: "Vendors",
    groupSlug: "emanon-001-vendors",
    description: "Prospective and approved vendors, quotes, products, services, and vendor communication.",
  },
  partners: {
    title: "Partners",
    groupSlug: "emanon-001-partners",
    description: "Strategic, education, technology, nonprofit, and community partners.",
  },
};

export default function OrganizationModulePage() {
  const params = useParams<{ profileCode: string; module: string }>();
  const profileCode = String(params?.profileCode || "");
  const moduleKey = String(params?.module || "");
  const info = useMemo(() => MODULE_INFO[moduleKey] || null, [moduleKey]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void load();
  }, [profileCode, moduleKey]);

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/entrepreneurs/login";
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("organization_portal_profiles")
        .select("profile_code,display_name,external_sender,entity_id,status")
        .eq("auth_user_id", user.id)
        .eq("profile_code", profileCode)
        .eq("status", "active")
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        setMessage("This organization profile is not available for your login.");
        return;
      }

      setProfile(profileData as Profile);

      if (info?.groupSlug) {
        const { data: groupData } = await supabase
          .from("communication_groups")
          .select("id,name,slug,description,member_count")
          .eq("entity_id", profileData.entity_id)
          .eq("slug", info.groupSlug)
          .maybeSingle();
        if (groupData) setGroup(groupData as Group);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load this organization module.");
    } finally {
      setLoading(false);
    }
  }

  if (!info) {
    return <main className="min-h-screen bg-slate-100 p-8"><div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow"><h1 className="text-2xl font-extrabold">Module not found</h1></div></main>;
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-100 p-8"><p className="text-slate-600">Loading {info.title}...</p></main>;
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/dashboard`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">← Organization Dashboard</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/communication-center`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Communication Center</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/grant-contacts`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Grant Contacts</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/tablet-project`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Tablet Project</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/vendors`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Vendors</Link>
          <Link href={`/organizations/${encodeURIComponent(profileCode)}/partners`} className="rounded-xl bg-white px-4 py-2 font-bold text-[#10246f] shadow">Partners</Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-r from-[#10246f] to-green-700 p-8 text-white shadow-xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-lime-300">{profile?.display_name || "Organization"} · {profileCode}</p>
          <h1 className="mt-2 text-4xl font-extrabold">{info.title}</h1>
          <p className="mt-4 max-w-4xl text-lg text-white/90">{info.description}</p>
          {profile?.external_sender && <p className="mt-4 font-bold">External sender: {profile.external_sender}</p>}
        </section>

        {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">{message}</div>}

        <section className="rounded-3xl bg-white p-7 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-[#10246f]">{group?.name || info.title}</h2>
              <p className="mt-2 text-slate-600">{group?.description || info.description}</p>
            </div>
            {group && <div className="rounded-2xl bg-slate-100 px-5 py-3 text-center"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Contacts</p><p className="text-3xl font-extrabold text-[#10246f]">{group.member_count || 0}</p></div>}
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-extrabold text-slate-900">Contacts</h3><p className="mt-2 text-sm text-slate-600">Maintain names, organizations, email addresses, phone numbers, roles, and communication preferences.</p></div>
            <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-extrabold text-slate-900">Conversation History</h3><p className="mt-2 text-sm text-slate-600">Keep communication history organized under the Emanon Institute profile.</p></div>
            <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-extrabold text-slate-900">Follow-Up</h3><p className="mt-2 text-sm text-slate-600">Prepare follow-up actions and future communication for this Emanon module.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
