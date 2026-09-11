"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  profile_code: string;
  display_name: string;
  external_sender: string;
  modules: string[];
  status: string;
};

const MODULES = [
  { key: "communication-center", title: "Communication Center", description: "Manage Emanon Institute conversations, contact history, follow-up, and external communication." },
  { key: "grant-contacts", title: "Grant Contacts", description: "Manage foundations, agencies, grant writers, funding opportunities, and grant-related contacts." },
  { key: "tablet-project", title: "Tablet Project", description: "Manage schools, sponsors, donors, logistics contacts, stakeholders, and tablet project communication." },
  { key: "vendors", title: "Vendors", description: "Manage prospective and approved vendors, products, services, quotes, and communication." },
  { key: "partners", title: "Partners", description: "Manage strategic, education, technology, nonprofit, and community partners." },
];

export default function OrganizationDashboardPage() {
  const params = useParams<{ profileCode: string }>();
  const profileCode = String(params?.profileCode || "");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadProfile();
  }, [profileCode]);

  async function loadProfile() {
    setLoading(true);
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/entrepreneurs/login";
        return;
      }

      const { data, error } = await supabase
        .from("organization_portal_profiles")
        .select("profile_code,display_name,external_sender,modules,status")
        .eq("auth_user_id", user.id)
        .eq("profile_code", profileCode)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setMessage("This organization profile is not available for your login.");
        return;
      }
      setProfile(data as Profile);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load the organization portal.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-100 p-8"><p className="text-slate-600">Loading organization portal...</p></main>;
  }

  if (!profile) {
    return <main className="min-h-screen bg-slate-100 p-8"><div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow"><h1 className="text-2xl font-extrabold text-[#10246f]">Organization Portal</h1><p className="mt-4 text-slate-700">{message}</p></div></main>;
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#10246f] via-blue-800 to-green-700 p-8 text-white shadow-xl md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-lime-300">Organization Portal</p>
              <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">{profile.display_name}</h1>
              <p className="mt-3 text-xl font-bold">Profile: {profile.profile_code}</p>
              <p className="mt-2 text-white/90">External communication sender: <span className="font-bold">{profile.external_sender}</span></p>
            </div>
            <Link href="/entrepreneurs/login" className="rounded-xl bg-white px-5 py-3 font-extrabold text-[#10246f]">Switch Account</Link>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((module) => (
            <Link
              key={module.key}
              href={`/organizations/${encodeURIComponent(profile.profile_code)}/${module.key}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow transition hover:-translate-y-1 hover:border-green-400 hover:shadow-lg"
            >
              <h2 className="text-2xl font-extrabold text-[#10246f]">{module.title}</h2>
              <p className="mt-3 leading-relaxed text-slate-600">{module.description}</p>
              <span className="mt-6 inline-flex rounded-xl bg-[#10246f] px-4 py-2 font-bold text-white">Open</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
