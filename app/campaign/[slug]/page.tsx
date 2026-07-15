"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Entrepreneur = {
  id: string;
  full_name?: string | null;
  business_name?: string | null;
  business_description?: string | null;
  business_category?: string | null;
  city?: string | null;
  state?: string | null;
  entrepreneur_code?: string | null;
  campaign_slug?: string | null;
  funding_goal?: number | null;
  campaign_visitors?: number | null;
  community_units_supported?: number | null;
  community_units_required?: number | null;
  leadership_credit?: number | null;
};

export default function CampaignPage() {
  const params = useParams();
  const slug = String(params?.slug || "");

  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCampaign();
  }, [slug]);

  async function loadCampaign() {
    setLoading(true);

    const { data, error } = await supabase
      .from("entrepreneurs")
      .select("*")
      .or(`campaign_slug.eq.${slug},entrepreneur_code.eq.${slug}`)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setMessage("Campaign not found.");
      setLoading(false);
      return;
    }

    const campaignCode = data.entrepreneur_code || slug;

    localStorage.setItem("epew_campaign_source", campaignCode);
    localStorage.setItem("epew_supported_entrepreneur", campaignCode);

    setEntrepreneur(data);

    await supabase
      .from("entrepreneurs")
      .update({
        campaign_visitors: Number(data.campaign_visitors || 0) + 1,
      })
      .eq("id", data.id);

    setLoading(false);
  }

  const unitsSupported = Number(entrepreneur?.community_units_supported || 0);
  const unitsRequired = Number(entrepreneur?.community_units_required || 20);
  const remaining = Math.max(0, unitsRequired - unitsSupported);

  const progress =
    unitsRequired > 0
      ? Math.min(100, Math.round((unitsSupported / unitsRequired) * 100))
      : 0;

  const goalReached = unitsSupported >= unitsRequired;

  const fundingGoal = useMemo(() => {
    return `$${Number(entrepreneur?.funding_goal || 100000).toLocaleString()}`;
  }, [entrepreneur]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <p className="text-slate-600">Loading campaign...</p>
      </main>
    );
  }

  if (!entrepreneur) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-slate-900">Campaign Page</h1>
          <p className="mt-3 text-slate-600">{message}</p>
        </div>
      </main>
    );
  }

  const campaignCode = entrepreneur.entrepreneur_code || slug;

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-green-700 px-6 py-12 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-lg font-black uppercase tracking-widest text-lime-300">
              EPEW Campaign
            </p>

            <h1 className="mt-3 text-5xl font-black">
              {entrepreneur.business_name || "Entrepreneur Campaign"}
            </h1>

            <p className="mt-3 text-2xl font-bold text-blue-100">
              Led by {entrepreneur.full_name || "EPEW Entrepreneur"}
            </p>

            <p className="mt-5 max-w-3xl text-xl">
              This entrepreneur is building more than a business. They are
              building a community, creating opportunity, and moving toward
              lasting wealth.
            </p>
          </div>

          <div className="rounded-3xl border border-lime-400 bg-black/20 p-6">
            <h2 className="text-3xl font-black text-lime-300">
              Become a Founding Supporter
            </h2>

            <p className="mt-4 text-xl">
              Every successful business begins with someone who believes before
              the doors open.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <section className="grid gap-6 md:grid-cols-3">
          <Metric label="Supported" value={unitsSupported} />
          <Metric label="Required" value={unitsRequired} />
          <Metric label="Remaining" value={remaining} />
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Community Leadership Goal
              </h2>
              <p className="mt-1 text-slate-600">
                20 Community Support Units before funding management.
              </p>
            </div>

            <div className="rounded-full bg-blue-100 px-4 py-2 font-bold text-blue-700">
              {progress}%
            </div>
          </div>

          <div className="mt-5 h-4 rounded-full bg-slate-200">
            <div
              className="h-4 rounded-full bg-green-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-2xl font-black text-slate-900">
              Entrepreneur Story
            </h2>

            <p className="mt-4 text-lg font-bold text-green-800">
              {entrepreneur.business_name || "Business Name"}
            </p>

            <p className="mt-1 text-lg italic text-slate-800">
              Building Credit. Building Business. Building Wealth.
            </p>

            <p className="mt-6 text-lg leading-relaxed text-slate-800">
              {entrepreneur.business_description ||
                "This entrepreneur is preparing to launch a business that serves the community, creates opportunity, and contributes to long-term economic growth."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Info
                label="Business Category"
                value={entrepreneur.business_category || "Not provided"}
              />
              <Info
                label="Location"
                value={`${entrepreneur.city || "Community"}${
                  entrepreneur.state ? `, ${entrepreneur.state}` : ""
                }`}
              />
              <Info label="Funding Approval" value={`Up to ${fundingGoal}`} />
              <Info
                label="Campaign Status"
                value={goalReached ? "Goal Achieved" : "Active"}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow">
            <h2 className="text-3xl font-black text-green-900">
              Why Become a Founding Supporter?
            </h2>

            <div className="mt-6 space-y-5 text-green-950">
              <BenefitItem
                title="You become part of this entrepreneur's success story."
                text="You will be recognized as a Founding Supporter and be part of their journey and legacy."
              />

              <BenefitItem
                title="You help launch a real business that serves its community."
                text="Your support helps turn a vision into a business that creates value, serves people, and builds opportunity."
              />

              <BenefitItem
                title="You may receive participation benefits of up to 6% annually,"
                text="subject to business performance and EPEW policies."
              />

              <BenefitItem
                title="Your support creates jobs, strengthens communities, and helps build the next generation of entrepreneurs."
                text=""
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                The EPEW Community Pledge
              </h2>

              <div className="mt-4 space-y-2 text-slate-800">
                <p>✅ I believe in this entrepreneur's vision.</p>
                <p>✅ I believe successful businesses are built through community.</p>
                <p>✅ I believe my support can help create opportunity.</p>
              </div>
            </div>

            <div>
              <Link
                href={`/supporters?campaign=${campaignCode}`}
                className="block rounded-xl bg-green-700 px-8 py-5 text-center text-xl font-black text-white hover:bg-green-800"
              >
                Learn About Becoming a Founding Supporter →
              </Link>

              <p className="mt-3 text-center text-sm font-semibold text-slate-600">
                🔒 Secure • Simple • Impactful
              </p>

              <p className="mt-2 text-center text-sm text-slate-600">
                Your campaign source is connected to this entrepreneur.
              </p>
            </div>
          </div>
        </section>

        {goalReached && (
          <section className="rounded-2xl border border-lime-300 bg-lime-50 p-6 shadow">
            <h2 className="text-2xl font-black text-green-900">
              Mission Accomplished — Support Continues
            </h2>

            <p className="mt-3 text-lg text-green-900">
              This entrepreneur has completed the Community Leadership Goal. New
              support received through this link will help another entrepreneur
              in the same funding group who still needs support. This
              entrepreneur continues receiving Community Leadership Credit.
            </p>
          </section>
        )}

        <section className="rounded-2xl bg-blue-950 p-6 text-white shadow">
          <h2 className="text-2xl font-black">
            Build Your Community. Build Your Business. Build Your Wealth.
          </h2>

          <p className="mt-3 text-blue-100">
            Powered by IBOS — I Am My Own Boss.
          </p>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <h3 className="mt-2 text-5xl font-black text-slate-900">{value}</h3>
      <p className="mt-1 text-sm text-slate-600">Community Support Units</p>
    </div>
  );
}

function BenefitItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-b border-green-200 pb-4 last:border-b-0">
      <p className="text-lg font-black text-green-900">{title}</p>
      {text && <p className="mt-1 text-base leading-relaxed">{text}</p>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}