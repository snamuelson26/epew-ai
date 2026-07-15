"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ParticipationAgreementPage() {
  const params = useParams();
  const businessId = typeof params?.slug === "string" ? params.slug : "";

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [units, setUnits] = useState(1);
  const [frequency, setFrequency] = useState("weekly");

  useEffect(() => {
    if (businessId) loadBusiness();
  }, [businessId]);

  async function loadBusiness() {
    setLoading(true);

    const { data } = await supabase
      .from("entrepreneurs")
      .select("*")
      .eq("public_business_id", businessId)
      .maybeSingle();

    setBusiness(data);
    setLoading(false);
  }

  const weeklyUnitAmount = 100;
  const weeksPerYear = 52;

  const weeklyTotal = units * weeklyUnitAmount;
  const annualTotal = weeklyTotal * weeksPerYear;
  const monthlyTotal = annualTotal / 12;

  const selectedPaymentAmount =
    frequency === "weekly"
      ? weeklyTotal
      : frequency === "monthly"
      ? monthlyTotal
      : annualTotal;

  const selectedFrequencyLabel =
    frequency === "weekly"
      ? "week"
      : frequency === "monthly"
      ? "month"
      : "year";

  const selectedPaymentLabel =
    frequency === "annual"
      ? "Annual One-Time Payment"
      : frequency === "monthly"
      ? "Monthly Automatic Payment"
      : "Weekly Automatic Payment";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <p className="text-2xl font-bold">Loading participation agreement...</p>
      </main>
    );
  }

  const businessName = business?.business_name || "Business Name";
  const entrepreneurName = business?.full_name || "EPEW Entrepreneur";
  const city = business?.city || "City";
  const state = business?.state || "State";
  const category = business?.business_category || "Business Category";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-8">
          <div className="rounded-3xl bg-white p-14 shadow-2xl">
            <h1 className="mb-10 text-center text-6xl font-extrabold">
              Supporter–Entrepreneur Participation Agreement
            </h1>

            <div className="mb-12 rounded-3xl bg-[#f5f7fb] p-10 shadow-xl">
              <h2 className="mb-6 text-4xl font-bold">You Are Supporting</h2>

              <p className="mb-3 text-lg font-black uppercase tracking-wide text-green-700">
                Business ID: {businessId}
              </p>

              <p className="mb-3 text-3xl font-bold">{businessName}</p>

              <p className="mb-3 text-2xl text-gray-700">
                Entrepreneur: {entrepreneurName}
              </p>

              <p className="text-2xl text-gray-700">
                {city}, {state} • {category}
              </p>
            </div>

            <div className="mb-12 rounded-3xl border-l-8 border-green-600 bg-green-50 p-10">
              <h2 className="mb-6 text-4xl font-bold">Participation Units</h2>

              <p className="mb-6 text-xl font-semibold text-gray-700">
                You may change the number of units and select the payment
                frequency before submitting your participation request.
              </p>

              <label className="mb-3 block text-2xl font-bold">
                Number of Units
              </label>

              <input
                type="number"
                min="1"
                value={units}
                onChange={(e) => setUnits(Number(e.target.value) || 1)}
                className="mb-3 w-full rounded-2xl border-2 border-gray-300 px-6 py-5 text-2xl"
              />

              <p className="mb-6 text-lg font-semibold text-green-700">
                Edit this number to support more than one unit.
              </p>

              <label className="mb-3 mt-8 block text-2xl font-bold">
                Automatic Payment Frequency
              </label>

              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="mb-3 w-full cursor-pointer rounded-2xl border-2 border-gray-300 bg-white px-6 py-5 text-2xl"
              >
                <option value="weekly">Weekly Automatic Payment</option>
                <option value="monthly">Monthly Automatic Payment</option>
                <option value="annual">Annual One-Time Payment</option>
              </select>

              <p className="mb-8 text-lg font-semibold text-green-700">
                Open this menu to choose weekly, monthly, or annual support.
              </p>

              <p className="text-2xl text-gray-700">
                Price Per Unit: <strong>$100 per week</strong>
              </p>

              <p className="mt-4 text-2xl text-gray-700">
                Weekly Support Amount:{" "}
                <strong>${weeklyTotal.toLocaleString()} per week</strong>
              </p>

              <p className="mt-4 text-2xl text-gray-700">
                Monthly Automatic Payment:{" "}
                <strong>
                  ${monthlyTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  per month
                </strong>
              </p>

              <p className="mt-5 text-3xl font-bold text-green-700">
                Annual Support Commitment: ${annualTotal.toLocaleString()}
              </p>

              <div className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
                <h3 className="mb-5 text-3xl font-bold text-[#06245c]">
                  Participation Benefit Consideration
                </h3>

                <p className="mb-4 text-2xl leading-relaxed text-gray-700">
                  Weekly or monthly automatic participation may be considered
                  for up to a 6% annual participation benefit based on business
                  performance, program structure, and ecosystem conditions.
                </p>

                <p className="text-2xl font-bold leading-relaxed text-green-700">
                  Annual one-time participation may be considered for up to a 7%
                  annual participation benefit consideration.
                </p>

                <p className="mt-5 text-xl leading-relaxed text-gray-600">
                  Participation benefits are not guaranteed and depend on
                  entrepreneur performance, business activity, and program
                  conditions.
                </p>
              </div>
            </div>

            <div className="mb-12 max-h-[600px] space-y-6 overflow-y-scroll rounded-3xl border border-gray-300 bg-[#f5f7fb] p-10 text-xl leading-relaxed text-gray-700">
              <h2 className="text-4xl font-bold text-[#06245c]">
                Agreement Terms
              </h2>

              <p>
                This Agreement is made through the platform operated by Ekero
                Partners Empower Wealth (EPEW).
              </p>

              <p>
                EPEW acts solely as a platform organizer, entrepreneur
                development coordinator, and administrative support system.
              </p>

              <p>
                The purpose of this Agreement is to allow the Supporter to
                participate in the Entrepreneur’s community participation
                campaign through the EPEW platform.
              </p>

              <p>
                EPEW is not a lender, bank, broker-dealer, financial investor,
                financial advisor, or public securities exchange.
              </p>

              <p>
                Participation decisions are made voluntarily and independently by
                the Supporter.
              </p>

              <p>
                EPEW does not guarantee profitability, business success,
                repayment, financial return, or participation outcome.
              </p>
            </div>

            <div className="mb-12 space-y-6">
              <label className="flex items-start gap-4 text-2xl leading-relaxed text-gray-700">
                <input type="checkbox" required className="mt-1 h-6 w-6" />
                <span>
                  I agree to activate the selected support payment option:{" "}
                  <strong>{selectedPaymentLabel}</strong> in the amount of{" "}
                  <strong>
                    ${selectedPaymentAmount.toLocaleString(undefined, {
                      minimumFractionDigits: frequency === "monthly" ? 2 : 0,
                      maximumFractionDigits: frequency === "monthly" ? 2 : 0,
                    })}
                  </strong>{" "}
                  every <strong>{selectedFrequencyLabel}</strong>, representing
                  a total annual support commitment of{" "}
                  <strong>${annualTotal.toLocaleString()}</strong>.
                </span>
              </label>

              <label className="flex items-start gap-4 text-2xl leading-relaxed text-gray-700">
                <input type="checkbox" required className="mt-1 h-6 w-6" />
                <span>
                  I have read and understand the Supporter–Entrepreneur
                  Participation Agreement.
                </span>
              </label>

              <label className="flex items-start gap-4 text-2xl leading-relaxed text-gray-700">
                <input type="checkbox" required className="mt-1 h-6 w-6" />
                <span>
                  I understand that EPEW does not guarantee business success,
                  repayment, financial return, or participation outcome.
                </span>
              </label>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/support/${businessId}/participation-submitted?units=${units}&frequency=${frequency}&business_id=${businessId}`;
                }}
                className="rounded-2xl bg-[#06245c] px-16 py-6 text-3xl font-bold text-white transition hover:bg-green-600"
              >
                Submit Participation Request
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}