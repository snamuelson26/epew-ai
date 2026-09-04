"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const FUNDING_GOAL = 100_000;
const TOTAL_UNITS_AVAILABLE = 20;
const ANNUAL_SUPPORT_PER_UNIT = 5_200;
const PARTICIPATION_BENEFIT_RATE = 8;

export default function SupportCheckoutPage() {
  const params = useParams();
  const router = useRouter();

  const businessId = Array.isArray(params.slug)
    ? params.slug[0]
    : String(params.slug || "");

  const [business, setBusiness] = useState<any>(null);
  const [supporter, setSupporter] = useState<any>(null);
  const [units, setUnits] = useState(1);
  const [referrerName, setReferrerName] = useState("");
  const [referrerBusinessName, setReferrerBusinessName] = useState("");
  const [entrepreneurAgreementAccepted, setEntrepreneurAgreementAccepted] =
    useState(false);
  const [epewAgreementAccepted, setEpewAgreementAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (businessId) {
      void loadCheckout();
    }
  }, [businessId]);

  async function loadCheckout() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        const nextPath = encodeURIComponent(`/support/${businessId}/checkout`);
        router.push(`/supporters/login?next=${nextPath}`);
        return;
      }

      const {
        data: supporterData,
        error: supporterError,
      } = await supabase
        .from("supporters")
        .select("*")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (supporterError) {
        throw new Error(
          `Unable to load supporter profile: ${supporterError.message}`
        );
      }

      if (!supporterData) {
        const nextPath = encodeURIComponent(`/support/${businessId}/checkout`);
        router.push(
          `/supporters/register?business_id=${businessId}&next=${nextPath}`
        );
        return;
      }

      setSupporter(supporterData);

      const {
        data: businessData,
        error: businessError,
      } = await supabase
        .from("entrepreneurs")
        .select("*")
        .eq("public_business_id", businessId)
        .maybeSingle();

      if (businessError) {
        throw new Error(`Unable to load business: ${businessError.message}`);
      }

      if (!businessData) {
        setBusiness(null);
        setErrorMessage("Business not found.");
        return;
      }

      setBusiness(businessData);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load the checkout page.";

      console.error("Annual support checkout load error:", error);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  const businessName = business?.business_name || "Business";

  const entrepreneurName =
    business?.full_name || business?.name || "EPEW Entrepreneur";

  const entrepreneurPhoto =
    business?.entrepreneur_photo ||
    business?.entrepreneur_photo_url ||
    business?.photo_url ||
    business?.profile_photo_url ||
    "";

  const businessLogo =
    business?.business_logo ||
    business?.business_logo_url ||
    business?.logo_url ||
    "";

  const unitsAvailable =
    Number(business?.units_required || 0) > 0
      ? Number(business.units_required)
      : TOTAL_UNITS_AVAILABLE;

  const unitsSupported = Math.max(Number(business?.units_supported || 0), 0);
  const unitsRemaining = Math.max(unitsAvailable - unitsSupported, 0);

  useEffect(() => {
    if (unitsRemaining > 0 && units > unitsRemaining) {
      setUnits(unitsRemaining);
    }
  }, [unitsRemaining, units]);

  const totalAnnualSupport = useMemo(() => {
    return Math.max(units, 0) * ANNUAL_SUPPORT_PER_UNIT;
  }, [units]);

  const unitsRemainingAfterSelection = Math.max(unitsRemaining - units, 0);
  const totalUnitsAfterSelection = unitsSupported + units;
  const supportTotalAfterSelection =
    totalUnitsAfterSelection * ANNUAL_SUPPORT_PER_UNIT;

  const fundingProgressAfterSelection = Math.min(
    (supportTotalAfterSelection / FUNDING_GOAL) * 100,
    100
  );

  const supportReturnPath = `/support/${businessId}/checkout`;
  const encodedSupportReturnPath = encodeURIComponent(supportReturnPath);

  function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function continueToStripeCheckout() {
    setErrorMessage("");

    if (!business) {
      setErrorMessage("The selected business could not be found.");
      return;
    }

    if (!supporter) {
      setErrorMessage("Your supporter profile could not be found.");
      return;
    }

    if (unitsRemaining < 1) {
      setErrorMessage(
        "All available units for this entrepreneur have already been supported."
      );
      return;
    }

    if (!Number.isInteger(units) || units < 1 || units > unitsRemaining) {
      setErrorMessage(
        `Please select between 1 and ${unitsRemaining} available unit${
          unitsRemaining === 1 ? "" : "s"
        }.`
      );
      return;
    }

    if (!entrepreneurAgreementAccepted) {
      setErrorMessage(
        "Please review and accept the Supporter–Entrepreneur Participation Agreement before continuing."
      );
      return;
    }

    if (!epewAgreementAccepted) {
      setErrorMessage(
        "Please review and accept the EPEW Supporter Platform Participation Agreement before continuing."
      );
      return;
    }

    setSubmitting(true);

    try {
      const agreementResponse = await fetch(
        "/api/supporters/platform-participation-agreement/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accepted: true }),
        }
      );

      const agreementText = await agreementResponse.text();
      let agreementResult: { error?: string } = {};

      try {
        agreementResult = agreementText ? JSON.parse(agreementText) : {};
      } catch {
        throw new Error("The agreement server returned an invalid response.");
      }

      if (!agreementResponse.ok) {
        throw new Error(
          agreementResult.error ||
            "Unable to record the EPEW Supporter Platform Participation Agreement acceptance."
        );
      }

      const response = await fetch("/api/supporters/annual-support/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supporterId: supporter.id,
          units,
          selectionMethod: "self_selected",
          allocationPreference: "one_business",
          selectedEntrepreneurId: String(business.id),
          referrerName: referrerName.trim() || undefined,
          referredBusinessName: referrerBusinessName.trim() || undefined,
          referralSource:
            referrerName.trim() || referrerBusinessName.trim()
              ? "supporter_entered"
              : undefined,
        }),
      });

      const responseText = await response.text();

      let result: {
        checkoutUrl?: string;
        sessionId?: string;
        supportIntentId?: string;
        error?: string;
      } = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("The checkout server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to create the annual support checkout."
        );
      }

      if (!result.checkoutUrl) {
        throw new Error("Stripe did not return a secure checkout URL.");
      }

      window.location.href = result.checkoutUrl;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to open Stripe Checkout.";

      console.error("Annual Stripe checkout error:", error);
      setErrorMessage(message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-8">
        <h1 className="text-4xl font-extrabold text-[#06245c]">
          Loading EPEW Annual Support...
        </h1>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <section className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-xl">
          <h1 className="text-4xl font-extrabold">Business Not Found</h1>

          <p className="mt-5 text-xl text-gray-700">
            {errorMessage || "The selected business could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/supporters/marketplace")}
            className="mt-8 rounded-2xl bg-[#06245c] px-8 py-4 text-xl font-bold text-white"
          >
            Return to Marketplace
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fa] px-4 py-8 text-[#06245c] md:py-12">
      <section className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="bg-[#06245c] px-6 py-8 text-center text-white md:px-10">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-lime-300 md:text-base">
              EPEW Annual Support
            </p>

            <div className="mt-6 flex items-center justify-center gap-5 md:gap-8">
              {entrepreneurPhoto ? (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-xl md:h-36 md:w-36">
                  <img
                    src={entrepreneurPhoto}
                    alt={entrepreneurName}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}

              {businessLogo ? (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white p-3 shadow-xl md:h-36 md:w-36">
                  <img
                    src={businessLogo}
                    alt={`${businessName} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : null}
            </div>

            <h1 className="mt-6 text-3xl font-black md:text-5xl">
              Support {businessName}
            </h1>

            <p className="mt-2 text-lg text-blue-100 md:text-xl">
              Entrepreneur:{" "}
              <span className="font-black text-white">{entrepreneurName}</span>
            </p>
          </div>

          <div className="px-5 py-7 md:px-10 md:py-10">
            {errorMessage && (
              <div className="mb-7 rounded-2xl border-2 border-red-300 bg-red-50 p-5 text-center font-bold text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <div className="rounded-2xl bg-[#f5f7fb] p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Funding Goal
                </p>
                <p className="mt-2 text-xl font-black md:text-2xl">$100,000</p>
              </div>

              <div className="rounded-2xl bg-[#f5f7fb] p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Units Available
                </p>
                <p className="mt-2 text-xl font-black md:text-2xl">
                  {unitsAvailable}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f5f7fb] p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Unit Price
                </p>
                <p className="mt-2 text-xl font-black md:text-2xl">$5,200</p>
              </div>

              <div className="rounded-2xl bg-green-50 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                  Participation Benefit
                </p>
                <p className="mt-2 text-xl font-black text-green-700 md:text-2xl">
                  Up to {PARTICIPATION_BENEFIT_RATE}%
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">
                Support Options for This Entrepreneur
              </p>
              <p className="mt-2 text-2xl font-black text-[#06245c]">
                Annual Paid-in-Full Support Only
              </p>
              <p className="mx-auto mt-2 max-w-2xl font-semibold text-gray-700">
                This entrepreneur does not accept Weekly or Monthly support. Only full Annual Support Units are available for this support transaction.
              </p>
            </div>

            <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg md:p-8">
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                  Choose Your Support
                </p>

                <h2 className="mt-2 text-3xl font-black md:text-4xl">
                  Annual Support Units
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-relaxed text-gray-600">
                  Select the number of annual support units you would like to provide for this business.
                </p>
              </div>

              <div className="mx-auto mt-7 max-w-xl">
                {unitsRemaining > 0 ? (
                  <select
                    id="units"
                    value={units}
                    onChange={(event) => {
                      setUnits(Number(event.target.value));
                      setErrorMessage("");
                    }}
                    className="w-full rounded-2xl border-2 border-gray-300 bg-white p-4 text-center text-xl font-black outline-none transition focus:border-green-600"
                  >
                    {Array.from(
                      { length: unitsRemaining },
                      (_, index) => index + 1
                    ).map((unitOption) => (
                      <option key={unitOption} value={unitOption}>
                        {unitOption} Unit{unitOption === 1 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-2xl bg-red-50 p-5 text-center font-bold text-red-700">
                    No units remain available.
                  </div>
                )}
              </div>

              <div className="mx-auto mt-7 max-w-xl rounded-3xl bg-[#06245c] px-6 py-7 text-center text-white shadow-lg">
                <p className="text-sm font-bold uppercase tracking-wider text-blue-200">
                  Total Support Today
                </p>
                <p className="mt-2 text-4xl font-black md:text-5xl">
                  {formatCurrency(totalAnnualSupport)}
                </p>
                <p className="mt-3 text-blue-100">
                  {units} annual support unit{units === 1 ? "" : "s"} • One-time payment
                </p>
              </div>

              <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#f5f7fb] p-4 text-center">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Units Remaining
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {unitsRemainingAfterSelection}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f5f7fb] p-4 text-center">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Funding Progress
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {fundingProgressAfterSelection.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="mx-auto mt-4 max-w-xl overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full bg-green-600 transition-all"
                  style={{ width: `${fundingProgressAfterSelection}%` }}
                />
              </div>
            </section>

            <section className="mt-7 rounded-3xl border border-blue-200 bg-blue-50 p-6 md:p-7">
              <h3 className="text-xl font-black">Were You Referred to EPEW?</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Optional — complete this only if someone referred you.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="referrerName" className="block text-sm font-bold">
                    Referrer&apos;s Name
                  </label>
                  <input
                    id="referrerName"
                    type="text"
                    value={referrerName}
                    onChange={(event) => setReferrerName(event.target.value)}
                    placeholder="Optional"
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-white p-4 outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="referrerBusinessName"
                    className="block text-sm font-bold"
                  >
                    Referrer&apos;s Business
                  </label>
                  <input
                    id="referrerBusinessName"
                    type="text"
                    value={referrerBusinessName}
                    onChange={(event) =>
                      setReferrerBusinessName(event.target.value)
                    }
                    placeholder="Optional"
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-white p-4 outline-none focus:border-green-600"
                  />
                </div>
              </div>
            </section>

            <div className="mt-7 rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
              <h3 className="text-xl font-black">One-Time Annual Payment</h3>
              <p className="mx-auto mt-2 max-w-2xl leading-relaxed text-gray-700">
                Your selected Support Units are paid in one payment for the full one-year support period. There is no weekly or monthly billing and no automatic renewal for this support.
              </p>
            </div>

            <div className="mt-7 rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 rounded-2xl bg-blue-50 p-5 text-center">
                <p className="font-black text-[#06245c]">
                  Review the approved Supporter–Entrepreneur agreement before accepting.
                </p>
                <a
                  href={`/supporters/supporter-entrepreneur-participation-agreement?returnTo=${encodedSupportReturnPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block font-black text-blue-700 underline underline-offset-4 hover:text-green-700"
                >
                  Open Supporter–Entrepreneur Participation Agreement
                </a>
              </div>

              <label className="flex cursor-pointer items-start gap-4">
                <input
                  type="checkbox"
                  checked={entrepreneurAgreementAccepted}
                  onChange={(event) => {
                    setEntrepreneurAgreementAccepted(event.target.checked);
                    setErrorMessage("");
                  }}
                  className="mt-1 h-6 w-6 shrink-0"
                />

                <span className="leading-relaxed text-gray-700">
                  I have reviewed and agree to the Supporter–Entrepreneur Participation Agreement. I understand that I am selecting {units} full annual Support Unit{units === 1 ? "" : "s"} at $5,200 per unit as a one-time payment, with an annual participation benefit of up to 8%. Participation benefits are not guaranteed and depend on applicable program terms and business performance.
                </span>
              </label>
            </div>

            <div className="mt-7 rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 rounded-2xl bg-green-50 p-5 text-center">
                <p className="font-black text-[#06245c]">
                  Review the agreement between you and EPEW before accepting.
                </p>
                <a
                  href={`/supporters/platform-participation-agreement?returnTo=${encodedSupportReturnPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block font-black text-blue-700 underline underline-offset-4 hover:text-green-700"
                >
                  Open EPEW Supporter Platform Participation Agreement
                </a>
              </div>

              <label className="flex cursor-pointer items-start gap-4">
                <input
                  type="checkbox"
                  checked={epewAgreementAccepted}
                  onChange={(event) => {
                    setEpewAgreementAccepted(event.target.checked);
                    setErrorMessage("");
                  }}
                  className="mt-1 h-6 w-6 shrink-0"
                />

                <span className="leading-relaxed text-gray-700">
                  I have reviewed and agree to the EPEW Supporter Platform Participation Agreement with <strong>EPEW (EKERO Partners Empower Wealth LLC)</strong>. I understand EPEW&apos;s platform, administrative, payment-coordination, recordkeeping, and mediation roles, and I understand that EPEW does not assume the Entrepreneur&apos;s restitution, repayment, or other contractual obligations.
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={continueToStripeCheckout}
              disabled={
                submitting ||
                !entrepreneurAgreementAccepted ||
                !epewAgreementAccepted ||
                unitsRemaining < 1
              }
              className="mt-7 w-full rounded-2xl bg-green-700 px-6 py-5 text-xl font-black text-white shadow-xl transition hover:bg-[#06245c] disabled:cursor-not-allowed disabled:bg-gray-400 md:text-2xl"
            >
              {submitting
                ? "Opening Secure Payment..."
                : `Continue to Payment — ${formatCurrency(totalAnnualSupport)}`}
            </button>

            <p className="mt-4 text-center text-sm font-semibold text-gray-500">
              Secure payment is processed by Stripe.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
