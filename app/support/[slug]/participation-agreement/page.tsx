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
  const monthlyUnitAmount = 433.34;
  const weeksPerYear = 52;

  const weeklyTotal = units * weeklyUnitAmount;
  const annualTotal = weeklyTotal * weeksPerYear;
  const monthlyTotal = units * monthlyUnitAmount;

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
      <main className="min-h-screen bg-[#f5f7fb] p-6 text-[#06245c] sm:p-8">
        <p className="text-xl font-bold sm:text-2xl">Loading participation agreement...</p>
      </main>
    );
  }

  const businessName = business?.business_name || "Business Name";
  const entrepreneurName = business?.full_name || "EPEW Entrepreneur";
  const city = business?.city || "City";
  const state = business?.state || "State";
  const category = business?.business_category || "Business Category";

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-3 py-4 text-[#06245c] sm:px-5 sm:py-6 md:px-6 md:py-12">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <section className="bg-[#06245c] px-5 py-6 text-center text-white sm:px-7 sm:py-8 md:px-10 md:py-10">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-6xl">
            Supporter–Entrepreneur Participation Agreement
          </h1>
        </section>

        <section className="px-4 py-5 sm:px-6 sm:py-7 md:p-12">
          <div className="rounded-2xl bg-[#f5f7fb] p-4 shadow-sm sm:p-6 md:rounded-3xl md:p-10">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">You Are Supporting</h2>

            <p className="mb-2 text-sm font-black uppercase tracking-wide text-green-700 sm:text-base md:text-lg">
              Business ID: {businessId}
            </p>

            <p className="mb-2 text-2xl font-bold sm:text-3xl">{businessName}</p>

            <p className="mb-2 text-lg text-gray-700 sm:text-xl md:text-2xl">
              Entrepreneur: {entrepreneurName}
            </p>

            <p className="text-lg text-gray-700 sm:text-xl md:text-2xl">
              {city}, {state} • {category}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border-l-4 border-green-600 bg-green-50 p-4 sm:p-6 md:mt-8 md:rounded-3xl md:border-l-8 md:p-10">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">Participation Units</h2>

            <p className="mb-5 text-base font-semibold leading-relaxed text-gray-700 sm:text-lg md:text-xl">
              Select the number of participation units and your preferred payment option before submitting your participation request. Each participation unit represents a $5,200 annual support commitment.
            </p>

            <label className="mb-2 block text-lg font-bold sm:text-xl md:text-2xl">
              Number of Units
            </label>

            <input
              type="number"
              min="1"
              value={units}
              onChange={(e) => setUnits(Number(e.target.value) || 1)}
              className="mb-2 w-full rounded-2xl border-2 border-gray-300 px-4 py-4 text-lg sm:text-xl md:px-6 md:py-5 md:text-2xl"
            />

            <p className="mb-5 text-sm font-semibold text-green-700 sm:text-base md:text-lg">
              Edit this number to support more than one unit.
            </p>

            <label className="mb-2 mt-6 block text-lg font-bold sm:text-xl md:mt-8 md:text-2xl">
              Automatic Payment Frequency
            </label>

            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="mb-2 w-full cursor-pointer rounded-2xl border-2 border-gray-300 bg-white px-4 py-4 text-lg sm:text-xl md:px-6 md:py-5 md:text-2xl"
            >
              <option value="weekly">Weekly Automatic Payment</option>
              <option value="monthly">Monthly Automatic Payment</option>
              <option value="annual">Annual One-Time Payment</option>
            </select>

            <p className="mb-6 text-sm font-semibold text-green-700 sm:text-base md:text-lg">
              Open this menu to choose weekly, monthly, or annual support.
            </p>

            <div className="space-y-3 text-base text-gray-700 sm:text-lg md:text-2xl">
              <p>
                Price Per Unit: <strong>$100 per week</strong>
              </p>

              <p>
                Weekly Support Amount: <strong>${weeklyTotal.toLocaleString()} per week</strong>
              </p>

              <p>
                Monthly Automatic Payment:{" "}
                <strong>
                  ${monthlyTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  per month
                </strong>
              </p>
            </div>

            <p className="mt-5 text-2xl font-bold text-green-700 sm:text-3xl">
              Annual Support Commitment: ${annualTotal.toLocaleString()}
            </p>

            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6 md:mt-8 md:rounded-3xl md:p-8 md:shadow-xl">
              <h3 className="mb-4 text-2xl font-bold text-[#06245c] sm:text-3xl">
                Participation Benefit Consideration
              </h3>

              <p className="mb-4 text-base leading-relaxed text-gray-700 sm:text-lg md:text-2xl">
                Weekly or monthly participation may qualify for an annual participation benefit of up to 6%, depending on business performance and applicable EPEW policies and regulations.
              </p>

              <p className="text-base font-bold leading-relaxed text-green-700 sm:text-lg md:text-2xl">
                A participation unit paid in full through the annual one-time payment option may qualify for an annual participation benefit of up to 8%, depending on business performance and applicable EPEW policies and regulations.
              </p>

              <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base md:text-xl">
                Participation benefits are not guaranteed.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5 rounded-2xl border border-gray-300 bg-[#f5f7fb] p-4 text-base leading-relaxed text-gray-700 sm:p-6 sm:text-lg md:mt-8 md:rounded-3xl md:p-10 md:text-xl">
            <h2 className="text-2xl font-bold text-[#06245c] sm:text-3xl md:text-4xl">
              Agreement Terms
            </h2>

            <p>
              This Supporter–Entrepreneur Participation Agreement is entered into directly between the Supporter and the Entrepreneur identified in this Agreement.
            </p>

            <p>
              The Supporter voluntarily agrees to provide financial support to the Entrepreneur&apos;s business according to the participation option, number of units, payment schedule, and other terms selected in this Agreement.
            </p>

            <p>
              The Entrepreneur agrees to participate in the EPEW Entrepreneur Development Ecosystem and to operate the supported business in accordance with applicable program requirements, reporting obligations, and business responsibilities.
            </p>

            <p className="font-bold text-[#06245c]">
              EPEW is not a party to this Agreement.
            </p>

            <p>
              EPEW provides the platform, administrative services, program administration, payment-processing coordination, recordkeeping, entrepreneur development services, and applicable policies and procedures used by the Supporter and Entrepreneur.
            </p>

            <h3 className="pt-2 text-xl font-bold text-[#06245c] sm:text-2xl">
              EPEW Mediation and Support Role
            </h3>

            <p>
              If circumstances arise in which the Entrepreneur is unable to fulfill an obligation under this Agreement, EPEW may serve as a neutral mediator and administrative facilitator between the Entrepreneur and the Supporter.
            </p>

            <p>
              EPEW will assist the parties with communication, review of the circumstances, and identification of a reasonable resolution consistent with applicable EPEW policies and regulations.
            </p>

            <p className="font-bold">
              EPEW is not responsible for restitution, repayment, reimbursement, or satisfaction of any financial obligation owed by the Entrepreneur to the Supporter.
            </p>

            <p>
              The Entrepreneur remains responsible for fulfilling the Entrepreneur&apos;s obligations under this Agreement. EPEW mediation or assistance does not transfer those obligations to EPEW.
            </p>

            <p>
              EPEW will continue providing available coaching, business development assistance, administrative support, and ecosystem resources intended to help the Entrepreneur improve the business&apos;s opportunity for success.
            </p>

            <p>
              EPEW also works to help Entrepreneurs and Supporters strengthen their financial position, expand economic opportunities, and pursue long-term wealth growth through entrepreneurship, support, and collaboration. No particular wealth increase or financial outcome is guaranteed.
            </p>

            <p>
              The Supporter understands that participation is voluntary support and that participation benefits depend on the performance of the supported business and applicable EPEW policies and regulations.
            </p>

            <p>
              The Entrepreneur does not guarantee a particular business result, participation benefit, repayment outcome, or level of profitability.
            </p>

            <p>
              The Supporter acknowledges that business activity involves risk and independently chooses whether to provide support to the Entrepreneur.
            </p>
          </div>

          <div className="mt-7 space-y-5 sm:mt-8 md:space-y-6">
            <label className="flex items-start gap-3 text-base leading-relaxed text-gray-700 sm:text-lg md:gap-4 md:text-2xl">
              <input type="checkbox" required className="mt-1 h-6 w-6 shrink-0" />
              <span>
                I agree to activate the selected support payment option: <strong>{selectedPaymentLabel}</strong> in the amount of <strong>${selectedPaymentAmount.toLocaleString(undefined, {
                  minimumFractionDigits: frequency === "monthly" ? 2 : 0,
                  maximumFractionDigits: frequency === "monthly" ? 2 : 0,
                })}</strong> every <strong>{selectedFrequencyLabel}</strong>, representing a total annual support commitment of <strong>${annualTotal.toLocaleString()}</strong>.
              </span>
            </label>

            <label className="flex items-start gap-3 text-base leading-relaxed text-gray-700 sm:text-lg md:gap-4 md:text-2xl">
              <input type="checkbox" required className="mt-1 h-6 w-6 shrink-0" />
              <span>
                I have read and understand the Supporter–Entrepreneur Participation Agreement.
              </span>
            </label>

            <label className="flex items-start gap-3 text-base leading-relaxed text-gray-700 sm:text-lg md:gap-4 md:text-2xl">
              <input type="checkbox" required className="mt-1 h-6 w-6 shrink-0" />
              <span>
                I understand that participation benefits are not guaranteed and depend on the performance of the supported business and applicable EPEW policies and regulations.
              </span>
            </label>
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                window.location.href = `/support/${businessId}/participation-submitted?units=${units}&frequency=${frequency}&business_id=${businessId}`;
              }}
              className="w-full rounded-2xl bg-[#06245c] px-6 py-4 text-lg font-bold text-white transition hover:bg-green-600 sm:text-xl md:w-auto md:px-12 md:py-5 md:text-2xl"
            >
              Submit Participation Request
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
