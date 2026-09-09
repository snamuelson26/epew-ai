"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ApplicationIdentity = {
  id: number | string;
  full_name?: string | null;
  business_name?: string | null;
  entrepreneur_photo_url?: string | null;
  business_photo_url?: string | null;
};

type BusinessIdentity = {
  full_name?: string | null;
  business_name?: string | null;
  public_business_id?: string | null;
  entrepreneur_code?: string | null;
  business_code?: string | null;
  entrepreneur_photo?: string | null;
  business_logo?: string | null;
};

export default function EntrepreneurIdentityBar() {
  const [application, setApplication] = useState<ApplicationIdentity | null>(null);
  const [business, setBusiness] = useState<BusinessIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadIdentity();
  }, []);

  async function loadIdentity() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: applications, error: applicationError } = await supabase
        .from("entrepreneur_applications")
        .select("id, full_name, business_name, entrepreneur_photo_url, business_photo_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (applicationError || !applications?.length) {
        setLoading(false);
        return;
      }

      const currentApplication = applications[0] as ApplicationIdentity;
      setApplication(currentApplication);

      const { data: businessRows } = await supabase
        .from("entrepreneurs")
        .select(
          "full_name, business_name, public_business_id, entrepreneur_code, business_code, entrepreneur_photo, business_logo",
        )
        .eq("source_application_id", currentApplication.id)
        .limit(1);

      if (businessRows?.length) {
        setBusiness(businessRows[0] as BusinessIdentity);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/entrepreneurs/login";
  }

  if (loading) {
    return null;
  }

  const entrepreneurName = business?.full_name || application?.full_name || "Entrepreneur";
  const businessName = business?.business_name || application?.business_name || "Business Profile";
  const accountNumber =
    business?.public_business_id || business?.business_code || business?.entrepreneur_code || "Pending";
  const entrepreneurPhoto = business?.entrepreneur_photo || application?.entrepreneur_photo_url || null;
  const businessLogo = business?.business_logo || application?.business_photo_url || null;
  const verified = Boolean(business?.public_business_id);

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-green-600 bg-slate-100">
            {entrepreneurPhoto ? (
              <img
                src={entrepreneurPhoto}
                alt={entrepreneurName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-extrabold text-slate-500">
                {entrepreneurName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-extrabold text-slate-900">
                {entrepreneurName}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                  verified
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {verified ? "✓ Verified Entrepreneur" : "Identity Pending"}
              </span>
            </div>

            <p className="mt-1 truncate font-bold text-[#10246f]">
              {businessName}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Business Account: <span className="font-extrabold text-slate-900">{accountNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:mr-48 xl:mr-56">
          <div className="flex h-16 min-w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3">
            {businessLogo ? (
              <img
                src={businessLogo}
                alt={`${businessName} logo`}
                className="max-h-14 max-w-32 object-contain"
              />
            ) : (
              <span className="text-center text-xs font-bold text-slate-500">
                Business Logo<br />Pending
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-5 py-3 font-extrabold text-white shadow transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
