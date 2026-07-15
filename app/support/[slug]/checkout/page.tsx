"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ContributionFrequency = "weekly" | "monthly" | "annual";

const FUNDING_GOAL = 100_000;
const TOTAL_UNITS_AVAILABLE = 20;
const ANNUAL_COMMITMENT_PER_UNIT = 5_200;

const PAYMENT_PLANS = {
  weekly: {
    title: "Weekly",
    amountPerUnit: 100,
    description: "Automatic billing every week",
  },

  monthly: {
    title: "Monthly",
    amountPerUnit: 433.34,
    description: "Automatic billing every month",
  },

  annual: {
    title: "Annual",
    amountPerUnit: 5_200,
    description: "Automatic billing every year",
  },
} as const;

export default function SupportCheckoutPage() {
  const params = useParams();
  const router = useRouter();

  const businessId = Array.isArray(params.slug)
    ? params.slug[0]
    : String(params.slug || "");

  const [business, setBusiness] = useState<any>(null);
  const [supporter, setSupporter] = useState<any>(null);

  const [units, setUnits] = useState(1);

  const [frequency, setFrequency] =
    useState<ContributionFrequency>("weekly");

  const [acknowledged, setAcknowledged] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (businessId) {
      loadCheckout();
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
        const nextPath = encodeURIComponent(
          `/support/${businessId}/checkout`
        );

        router.push(
          `/supporters/login?next=${nextPath}`
        );

        return;
      }

      const {
        data: supporterData,
        error: supporterError,
      } = await supabase
        .from("supporters")
        .select("*")
        .or(
          `user_id.eq.${user.id},email.eq.${user.email}`
        )
        .maybeSingle();

      if (supporterError) {
        throw new Error(
          `Unable to load supporter profile: ${supporterError.message}`
        );
      }

      if (!supporterData) {
        const nextPath = encodeURIComponent(
          `/support/${businessId}/checkout`
        );

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
        throw new Error(
          `Unable to load business: ${businessError.message}`
        );
      }

      if (!businessData) {
        setBusiness(null);
        setErrorMessage("Business not found.");
        setLoading(false);

        return;
      }

      setBusiness(businessData);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load the checkout page.";

      console.error("Checkout load error:", error);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  const businessName =
    business?.business_name || "Business";

  const entrepreneurName =
    business?.full_name ||
    business?.name ||
    "Entrepreneur";

  const unitsAvailable =
    Number(business?.units_required || 0) > 0
      ? Number(business.units_required)
      : TOTAL_UNITS_AVAILABLE;

  const unitsSupported = Math.max(
    Number(business?.units_supported || 0),
    0
  );

  const unitsRemaining = Math.max(
    unitsAvailable - unitsSupported,
    0
  );

  useEffect(() => {
    if (unitsRemaining > 0 && units > unitsRemaining) {
      setUnits(unitsRemaining);
    }
  }, [unitsRemaining, units]);

  const selectedPlan =
    PAYMENT_PLANS[frequency];

  const todayCharge = useMemo(() => {
    return Number(
      (
        selectedPlan.amountPerUnit *
        Math.max(units, 0)
      ).toFixed(2)
    );
  }, [
    selectedPlan.amountPerUnit,
    units,
  ]);

  const annualCommitment = useMemo(() => {
    return (
      Math.max(units, 0) *
      ANNUAL_COMMITMENT_PER_UNIT
    );
  }, [units]);

  const unitsRemainingAfterSelection =
    Math.max(unitsRemaining - units, 0);

  const totalUnitsAfterSelection =
    unitsSupported + units;

  const annualCommitmentAfterSelection =
    totalUnitsAfterSelection *
    ANNUAL_COMMITMENT_PER_UNIT;

  const fundingProgressAfterSelection =
    Math.min(
      (annualCommitmentAfterSelection /
        FUNDING_GOAL) *
        100,
      100
    );

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
      setErrorMessage(
        "The selected business could not be found."
      );

      return;
    }

    if (!supporter) {
      setErrorMessage(
        "Your supporter profile could not be found."
      );

      return;
    }

    if (unitsRemaining < 1) {
      setErrorMessage(
        "All available units for this entrepreneur have already been supported."
      );

      return;
    }

    if (
      !Number.isInteger(units) ||
      units < 1 ||
      units > unitsRemaining
    ) {
      setErrorMessage(
        `Please select between 1 and ${unitsRemaining} available unit${
          unitsRemaining === 1 ? "" : "s"
        }.`
      );

      return;
    }

    if (!acknowledged) {
      setErrorMessage(
        "Please accept the EPEW Participation Agreement and recurring-payment authorization."
      );

      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/stripe/create-checkout-session",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            entrepreneurId: String(business.id),

            entrepreneurName,

            businessId:
              business.public_business_id ||
              businessId,

            businessName,

            supporterId: supporter.id,

            units,

            frequency,
          }),
        }
      );

      const responseText =
        await response.text();

      let result: {
        url?: string;
        error?: string;
        unitsRemaining?: number;
      } = {};

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          "The checkout server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to create the Stripe checkout session."
        );
      }

      if (!result.url) {
        throw new Error(
          "Stripe did not return a secure checkout URL."
        );
      }

      window.location.href = result.url;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to open Stripe Checkout.";

      console.error(
        "Stripe checkout error:",
        error
      );

      setErrorMessage(message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-8">
        <h1 className="text-4xl font-extrabold text-[#06245c]">
          Loading EPEW Stripe Checkout...
        </h1>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <section className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-xl">
          <h1 className="text-4xl font-extrabold">
            Business Not Found
          </h1>

          <p className="mt-5 text-xl text-gray-700">
            {errorMessage ||
              "The selected business could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/supporters/marketplace"
              )
            }
            className="mt-8 rounded-2xl bg-[#06245c] px-8 py-4 text-xl font-bold text-white"
          >
            Return to Marketplace
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.35em] text-green-700">
            EPEW Secure Stripe Checkout
          </p>

          <h1 className="mt-4 text-5xl font-extrabold">
            Support {businessName}
          </h1>

          <p className="mt-4 text-2xl text-gray-700">
            Entrepreneur:{" "}
            <span className="font-black">
              {entrepreneurName}
            </span>
          </p>

          {errorMessage && (
            <div className="mt-7 rounded-2xl border-2 border-red-500 bg-red-50 p-5 text-lg font-bold text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <section className="rounded-3xl bg-[#f5f7fb] p-8">
              <h2 className="text-3xl font-extrabold">
                Business Funding
              </h2>

              <div className="mt-7 space-y-5">
                <DetailRow
                  label="Funding Goal"
                  value={formatCurrency(
                    FUNDING_GOAL
                  )}
                />

                <DetailRow
                  label="Units Available"
                  value={unitsAvailable.toString()}
                />

                <DetailRow
                  label="Units Supported"
                  value={unitsSupported.toString()}
                />

                <DetailRow
                  label="Units Remaining"
                  value={unitsRemaining.toString()}
                />
              </div>

              <div className="mt-8 rounded-3xl border-l-8 border-green-600 bg-green-50 p-6">
                <h3 className="text-2xl font-extrabold">
                  Official EPEW Unit Standard
                </h3>

                <p className="mt-4 text-lg text-gray-700">
                  One support unit represents a
                  complete annual commitment of:
                </p>

                <p className="mt-4 text-4xl font-black text-green-700">
                  $5,200.00
                </p>

                <div className="mt-5 space-y-2 text-lg text-gray-700">
                  <p>
                    Weekly:{" "}
                    <strong>$100.00</strong>
                  </p>

                  <p>
                    Monthly:{" "}
                    <strong>$433.34</strong>
                  </p>

                  <p>
                    Annual:{" "}
                    <strong>$5,200.00</strong>
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-[#f5f7fb] p-8">
              <h2 className="text-3xl font-extrabold">
                Choose Your Participation
              </h2>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {(
                  Object.keys(
                    PAYMENT_PLANS
                  ) as ContributionFrequency[]
                ).map((planKey) => {
                  const plan =
                    PAYMENT_PLANS[planKey];

                  const selected =
                    frequency === planKey;

                  return (
                    <button
                      key={planKey}
                      type="button"
                      onClick={() => {
                        setFrequency(planKey);
                        setErrorMessage("");
                      }}
                      className={`rounded-2xl border-2 p-5 text-left transition ${
                        selected
                          ? "border-[#06245c] bg-[#06245c] text-white shadow-lg"
                          : "border-gray-200 bg-white text-[#06245c] hover:border-green-600"
                      }`}
                    >
                      <span className="block text-xl font-black">
                        {plan.title}
                      </span>

                      <span
                        className={`mt-3 block text-2xl font-black ${
                          selected
                            ? "text-lime-300"
                            : "text-green-700"
                        }`}
                      >
                        {formatCurrency(
                          plan.amountPerUnit
                        )}
                      </span>

                      <span className="mt-2 block text-sm">
                        Per unit
                      </span>

                      <span className="mt-3 block text-sm font-bold">
                        {plan.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                <label
                  htmlFor="units"
                  className="text-lg font-black"
                >
                  Number of Units
                </label>

                {unitsRemaining > 0 ? (
                  <select
                    id="units"
                    value={units}
                    onChange={(event) => {
                      setUnits(
                        Number(
                          event.target.value
                        )
                      );

                      setErrorMessage("");
                    }}
                    className="mt-3 w-full rounded-2xl border-2 border-gray-300 bg-white p-4 text-xl font-bold outline-none focus:border-green-600"
                  >
                    {Array.from(
                      {
                        length: unitsRemaining,
                      },
                      (_, index) => index + 1
                    ).map((unitOption) => (
                      <option
                        key={unitOption}
                        value={unitOption}
                      >
                        {unitOption} Unit
                        {unitOption === 1
                          ? ""
                          : "s"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-3 rounded-2xl bg-red-50 p-5 font-bold text-red-700">
                    No units remain available.
                  </div>
                )}
              </div>

              <div className="mt-8 rounded-3xl bg-white p-7 shadow">
                <h3 className="text-2xl font-extrabold">
                  Enterprise Financial Summary
                </h3>

                <div className="mt-6 space-y-4">
                  <DetailRow
                    label="Funding Goal"
                    value={formatCurrency(
                      FUNDING_GOAL
                    )}
                  />

                  <DetailRow
                    label="Units Selected"
                    value={units.toString()}
                  />

                  <DetailRow
                    label="Annual Commitment"
                    value={formatCurrency(
                      annualCommitment
                    )}
                  />

                  <DetailRow
                    label="Payment Frequency"
                    value={
                      selectedPlan.title
                    }
                  />

                  <DetailRow
                    label="Today's Charge"
                    value={formatCurrency(
                      todayCharge
                    )}
                  />

                  <DetailRow
                    label="Units Remaining After Selection"
                    value={unitsRemainingAfterSelection.toString()}
                  />

                  <DetailRow
                    label="Funding Progress After Selection"
                    value={`${fundingProgressAfterSelection.toFixed(
                      2
                    )}%`}
                  />

                  <DetailRow
                    label="Automatic Renewal"
                    value="Enabled"
                  />
                </div>
              </div>

              <div className="mt-8 rounded-3xl border-2 border-yellow-400 bg-yellow-50 p-6 text-yellow-900">
                <h3 className="text-xl font-extrabold">
                  Recurring Payment Authorization
                </h3>

                <p className="mt-4 leading-relaxed">
                  Weekly, Monthly, and Annual
                  participation plans are automatic
                  recurring subscriptions. Your
                  selected payment method will be
                  charged according to the selected
                  schedule and will renew
                  automatically unless canceled in
                  accordance with EPEW policies.
                </p>
              </div>

              <label className="mt-7 flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => {
                    setAcknowledged(
                      event.target.checked
                    );

                    setErrorMessage("");
                  }}
                  className="mt-1 h-6 w-6"
                />

                <span className="leading-relaxed text-gray-700">
                  I have read and agree to the EPEW
                  Participation Agreement and
                  recurring-payment authorization. I
                  understand that participation is not
                  an investment, bank deposit,
                  security, or guaranteed financial
                  product.
                </span>
              </label>

              <button
                type="button"
                onClick={
                  continueToStripeCheckout
                }
                disabled={
                  submitting ||
                  !acknowledged ||
                  unitsRemaining < 1
                }
                className="mt-8 w-full rounded-2xl bg-green-700 py-5 text-2xl font-black text-white shadow-lg transition hover:bg-[#06245c] disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {submitting
                  ? "Opening Secure Stripe Checkout..."
                  : "Continue to Secure Payment"}
              </button>

              <p className="mt-5 text-center text-sm font-semibold text-gray-500">
                Secure recurring payments are
                processed by Stripe.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-2 border-b border-gray-200 pb-4 sm:flex-row">
      <span className="font-bold text-gray-600">
        {label}
      </span>

      <span className="text-lg font-black text-[#06245c]">
        {value}
      </span>
    </div>
  );
}