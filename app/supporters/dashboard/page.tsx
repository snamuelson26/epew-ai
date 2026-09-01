"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import Hero from "./components/Hero";
import EntrepreneurPortfolio from "./components/EntrepreneurPortfolio";
import AnnualSupportStatus from "./components/AnnualSupportStatus";
import Legacy from "./components/Legacy";

import { SupportCommitment, Supporter } from "./components/types";

export default function SupporterDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<Supporter | null>(null);
  const [projection, setProjection] = useState<any>(null);
  const [commitments, setCommitments] = useState<SupportCommitment[]>([]);
  const [selectedBusiness, setSelectedBusiness] =
    useState<any>(null);

  useEffect(() => {
    loadSupporterDashboard();
  }, []);

  async function loadSupporterDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/supporters/login";
      return;
    }

    const { data: supporterData, error: supporterError } = await supabase
      .from("supporters")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (supporterError || !supporterData) {
      setSupporter(null);
      setProjection(null);
      setCommitments([]);
      setSelectedBusiness(null);
      setLoading(false);
      return;
    }

    setSupporter(supporterData);

    if (supporterData.selected_business_id) {
      try {
        const response = await fetch(
          `/api/public/businesses/${encodeURIComponent(
            supporterData.selected_business_id
          )}`,
          {
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (
          response.ok &&
          result?.business
        ) {
          setSelectedBusiness(
            result.business
          );
        } else {
          setSelectedBusiness(null);
        }
      } catch (error) {
        console.error(
          "Unable to load selected entrepreneur:",
          error
        );

        setSelectedBusiness(null);
      }
    } else {
      setSelectedBusiness(null);
    }

    const { data: projectionData, error: projectionError } = await supabase
      .from("supporter_projections")
      .select("*")
      .eq("supporter_id", supporterData.id)
      .maybeSingle();

    if (projectionError) {
      console.log("Supporter projection error:", projectionError);
      setProjection(null);
    } else {
      setProjection(projectionData);
    }

    const { data: commitmentData, error: commitmentError } = await supabase
      .from("support_commitments")
      .select("*")
      .eq("supporter_email", supporterData.email)
      .order("created_at", { ascending: false });

    if (commitmentError) {
      console.log("Commitment error:", commitmentError);
      setCommitments([]);
    } else {
      setCommitments((commitmentData || []) as SupportCommitment[]);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/supporters/login";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10">
        <p className="text-2xl font-bold text-[#06245c]">
          Loading Main Supporter Portal...
        </p>
      </main>
    );
  }

  if (!supporter) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <div className="rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="mb-4 text-4xl font-extrabold">
            Supporter Profile Not Found
          </h1>

          <p className="mb-6 text-xl text-gray-700">
            Your login is active, but no supporter profile is connected to this
            account yet.
          </p>

          <a
            href="/supporters/register"
            className="inline-block rounded-2xl bg-[#06245c] px-8 py-4 text-xl font-bold text-white"
          >
            Create Supporter Profile
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <section className="mb-10">
        <Hero
          supporter={supporter}
          onLogout={handleLogout}
        />
      </section>

      <section className="mb-10">
        <EntrepreneurPortfolio
          commitments={commitments}
          selectedBusiness={selectedBusiness}
        />
      </section>

      <section className="mb-10">
        <AnnualSupportStatus />
      </section>

      <section>
        <Legacy />
      </section>
    </main>
  );
}