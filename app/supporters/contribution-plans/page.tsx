"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import StripeCheckoutButton from "@/app/components/StripeCheckoutButton";

type Frequency =
  | "weekly"
  | "monthly"
  | "annual"
  | "one-time";

export default function ContributionPlansPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
          <p className="text-2xl font-bold">
            Loading contribution plans...
          </p>
        </main>
      }
    >
      <ContributionPlansContent />
    </Suspense>
  );
}

function ContributionPlansContent() {
  const searchParams = useSearchParams();
  const entrepreneurId =
    searchParams.get("entrepreneur") || "";

  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<any>(null);
  const [entrepreneur, setEntrepreneur] =
    useState<any>(null);

  const [frequency, setFrequency] =
    useState<Frequency>("weekly");

  const [units, setUnits] = useState(1);

  useEffect(() => {
    void loadPageData();
  }, [entrepreneurId]);

  async function loadPageData() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/supporters/login";
      return;
    }

    const { data: supporterData, error: supporterError } =
      await supabase
        .from("supporters")
        .select("*")
        .or(
          `user_id.eq.${user.id},email.eq.${user.email}`,
        )
        .maybeSingle();

    if (supporterError || !supporterData) {
      alert("Supporter profile not found.");
      window.location.href = "/supporters/login";
      return;
    }

    setSupporter(supporterData);

    if (entrepreneurId) {
      const {
        data: entrepreneurData,
        error: entrepreneurError,
      } = await supabase
        .from("entrepreneurs")
        .select("*")
        .eq("id", entrepreneurId)
        .maybeSingle();

      if (entrepreneurError || !entrepreneurData) {
        alert("Entrepreneur not found.");
        setEntrepreneur(null);
      } else {
        setEntrepreneur(entrepreneurData);
      }
    } else {
      setEntrepreneur(null);
    }

    setLoading(false);
  }

  function calculateAmount() {
    if (frequency === "weekly") {
      return units * 100;
    }

    if (frequency === "monthly") {
      return units * 400;
    }

    if (frequency === "annual") {
      return units * 5200;
    }

    return units * 100;
  }

  const amount = calculateAmount();

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <p className="text-2xl font-bold">
          Loading contribution plans...
        </p>
      </main>
    );
  }

  const businessName =
    entrepreneur?.business_name || "Business Name";

  const entrepreneurName =
    entrepreneur?.full_name ||
    entrepreneur?.name ||
    "Entrepreneur";

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="mb-8 rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="mb-3 text-5xl font-extrabold">
          Contribution Plans
        </h1>

        <p className="text-xl text-gray-700">
          Choose how you would like to participate in
          supporting an entrepreneur through the EPEW
          ecosystem.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="mb-6 text-3xl font-bold">
            Selected Entrepreneur
          </h2>

          {entrepreneur ? (
            <div className="space-y-4 text-lg">
              <p>
                <strong>Business Name:</strong>{" "}
                {businessName}
              </p>

              <p>
                <strong>Entrepreneur:</strong>{" "}
                {entrepreneurName}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {entrepreneur.business_category ||
                  "Other"}
              </p>

              <p>
                <strong>Description:</strong>{" "}
                {entrepreneur.business_description ||
                  "No description provided."}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {entrepreneur.status || "Under Review"}
              </p>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-xl font-bold">
                No entrepreneur selected.
              </p>

              <a
                href="/supporters/marketplace"
                className="inline-block rounded-2xl bg-[#06245c] px-6 py-3 font-bold text-white"
              >
                Browse Entrepreneurs
              </a>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="mb-6 text-3xl font-bold">
            Select Participation Plan
          </h2>

          <div className="mb-8 space-y-4">
            {[
              {
                label: "Weekly",
                value: "weekly",
                text: "$100 per unit / week",
              },
              {
                label: "Monthly",
                value: "monthly",
                text: "$400 per unit / month",
              },
              {
                label: "Annual",
                value: "annual",
                text: "$5,200 per unit / year",
              },
              {
                label: "One-Time",
                value: "one-time",
                text: "$100 per unit once",
              },
            ].map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() =>
                  setFrequency(
                    plan.value as Frequency,
                  )
                }
                className={`w-full rounded-2xl border-2 p-5 text-left text-xl font-bold ${
                  frequency === plan.value
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.label}

                <span className="mt-1 block text-sm font-normal text-gray-600">
                  {plan.text}
                </span>
              </button>
            ))}
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-lg font-bold">
              Number of Units
            </label>

            <input
              type="number"
              min="1"
              value={units}
              onChange={(e) =>
                setUnits(
                  Math.max(
                    1,
                    Number(e.target.value || 1),
                  ),
                )
              }
              className="w-full rounded-2xl border p-4 text-lg"
            />
          </div>

          <div className="mb-8 rounded-3xl bg-[#f5f7fb] p-6">
            <p className="mb-2 text-lg font-bold">
              Estimated Commitment
            </p>

            <p className="text-5xl font-extrabold text-green-700">
              ${amount.toLocaleString()}
            </p>

            <p className="mt-3 text-gray-600">
              This amount is based on the selected
              participation plan and number of units.
            </p>
          </div>

          {entrepreneur && supporter ? (
            <StripeCheckoutButton
              entrepreneurId={entrepreneur.id}
              entrepreneurName={entrepreneurName}
              businessName={businessName}
              supporterId={supporter.id}
              units={units}
              frequency={frequency}
            />
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-2xl bg-gray-400 py-4 text-xl font-bold text-white"
            >
              Select Entrepreneur First
            </button>
          )}
        </div>
      </div>
    </main>
  );
}