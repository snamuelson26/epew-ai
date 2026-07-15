"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Entrepreneur = {
  id: string;
  full_name?: string | null;
  business_name?: string | null;
  entrepreneur_code?: string | null;
};

export default function SupporterLearnPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-8">
          <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
            <p className="text-xl font-bold text-slate-700">
              Loading supporter information...
            </p>
          </div>
        </main>
      }
    >
      <SupporterLearnContent />
    </Suspense>
  );
}

function SupporterLearnContent() {
  const searchParams = useSearchParams();
  const campaign = searchParams.get("campaign") || "";

  const [entrepreneur, setEntrepreneur] =
    useState<Entrepreneur | null>(null);

  useEffect(() => {
    void saveCampaignSource();
  }, [campaign]);

  async function saveCampaignSource() {
    if (!campaign) {
      return;
    }

    localStorage.setItem(
      "epew_campaign_source",
      campaign,
    );

    localStorage.setItem(
      "epew_supported_entrepreneur",
      campaign,
    );

    const { data, error } = await supabase
      .from("entrepreneurs")
      .select(
        "id, full_name, business_name, entrepreneur_code",
      )
      .eq("entrepreneur_code", campaign)
      .maybeSingle();

    if (error) {
      console.error(
        "Unable to load campaign entrepreneur:",
        error,
      );
      return;
    }

    if (data) {
      setEntrepreneur(data as Entrepreneur);
    }
  }

  const registerLink = campaign
    ? `/supporters/register?campaign=${encodeURIComponent(
        campaign,
      )}`
    : "/supporters/register";

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-green-700 px-6 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-lg font-black uppercase tracking-widest text-lime-300">
            EPEW Founding Supporter Program
          </p>

          <h1 className="mt-3 text-5xl font-black">
            Learn Before You Register
          </h1>

          <p className="mt-5 max-w-4xl text-xl leading-relaxed">
            Before becoming a Founding Supporter, learn how
            EPEW works, how your participation helps
            entrepreneurs, and how your support remains
            connected to the entrepreneur who invited you.
          </p>

          {entrepreneur && (
            <div className="mt-8 rounded-2xl border border-lime-400 bg-black/20 p-5">
              <p className="text-sm font-bold uppercase text-lime-300">
                You were invited through
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {entrepreneur.business_name ||
                  "Business Name Pending"}
              </h2>

              <p className="mt-1 text-blue-100">
                Led by{" "}
                {entrepreneur.full_name ||
                  "EPEW Entrepreneur"}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-3xl font-black text-slate-900">
            What Is EPEW?
          </h2>

          <p className="mt-4 text-lg leading-relaxed text-slate-700">
            Ekero Partners Empower Wealth is a community
            entrepreneurship ecosystem that helps entrepreneurs
            build community, prepare their businesses, reach
            funding readiness, open their businesses, and grow
            over the long term.
          </p>

          <p className="mt-4 text-lg font-bold text-green-800">
            Build Your Community. Build Your Business. Build
            Your Wealth.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-3xl font-black text-slate-900">
              What Is a Founding Supporter?
            </h2>

            <div className="mt-5 space-y-4 text-lg text-slate-700">
              <p>
                A Founding Supporter is someone who believes
                in an entrepreneur before the business opens.
              </p>

              <p>
                Your support helps the entrepreneur reach the
                Community Leadership Goal of 20 Community
                Support Units.
              </p>

              <p>
                When the business opens, Founding Supporters
                are recognized as part of the entrepreneur&apos;s
                permanent legacy.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow">
            <h2 className="text-3xl font-black text-green-900">
              Participation Benefit
            </h2>

            <p className="mt-4 text-lg leading-relaxed text-green-950">
              As a Founding Supporter, you may receive
              participation benefits of up to{" "}
              <strong>6% annually</strong>, subject to business
              performance and EPEW policies.
            </p>

            <p className="mt-4 text-lg leading-relaxed text-green-950">
              Your support creates jobs, strengthens
              communities, and helps build the next generation
              of entrepreneurs.
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-3xl font-black text-slate-900">
            Watch the EPEW Supporter Video
          </h2>

          <div className="mt-5 flex min-h-[260px] items-center justify-center rounded-2xl bg-slate-900 text-white">
            <div className="text-center">
              <p className="text-5xl">▶️</p>

              <p className="mt-3 text-xl font-bold">
                Supporter Program Video Coming Soon
              </p>

              <p className="mt-2 text-slate-300">
                This section will explain the EPEW supporter
                journey.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-3xl font-black text-slate-900">
            Your Connection Is Preserved
          </h2>

          <p className="mt-4 text-lg leading-relaxed text-slate-700">
            Because you arrived through this campaign, IBOS
            remembers the entrepreneur who invited you. When
            you register and begin supporting, your
            participation remains connected to that
            entrepreneur.
          </p>

          <div className="mt-5 rounded-xl bg-blue-50 p-4 text-blue-800">
            <p className="font-bold">
              Campaign Source:{" "}
              {campaign || "No campaign source found"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow">
          <h2 className="text-3xl font-black text-green-900">
            The EPEW Community Pledge
          </h2>

          <div className="mt-5 space-y-3 text-lg text-green-950">
            <p>
              ✅ I believe in this entrepreneur&apos;s vision.
            </p>

            <p>
              ✅ I believe successful businesses are built
              through community.
            </p>

            <p>
              ✅ I believe my support can help create
              opportunity.
            </p>

            <p>
              ✅ I understand that participation benefits are
              not guaranteed.
            </p>
          </div>

          <Link
            href={registerLink}
            className="mt-8 inline-block rounded-xl bg-green-700 px-8 py-5 text-xl font-black text-white hover:bg-green-800"
          >
            Register as a Founding Supporter →
          </Link>
        </section>

        <section className="rounded-2xl bg-blue-950 p-6 text-white shadow">
          <h2 className="text-2xl font-black">
            Powered by IBOS — I Am My Own Boss
          </h2>

          <p className="mt-3 text-blue-100">
            Community → Leadership → Business → Wealth
          </p>
        </section>
      </div>
    </main>
  );
}