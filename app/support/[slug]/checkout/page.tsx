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

  const [referrerName, setReferrerName] =
    useState("");

  const [referrerBusinessName, setReferrerBusinessName] =
    useState("");

  const [acknowledged, setAcknowledged] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

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
        setErrorMessage(
          "Business not found."
        );

        return;
      }

      setBusiness(businessData);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load the checkout page.";

      console.error(
        "Annual support checkout load error:",
        error
      );

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  const businessName =
    business?.business_name ||
    "Business";

  const entrepreneurName =
    business?.full_name ||
    business?.name ||
    "EPEW Entrepreneur";

  const unitsAvailable =
    Number(business?.units_required || 0) > 0
      ? Number(business.units_required)
      : TOTAL_UNITS_AVAILABLE;

  const unitsSupported =
    Math.max(
      Number(
        business?.units_supported || 0
      ),
      0
    );

  const unitsRemaining =
    Math.max(
      unitsAvailable - unitsSupported,
      0
    );

  useEffect(() => {
    if (
      unitsRemaining > 0 &&
      units > unitsRemaining
    ) {
      setUnits(unitsRemaining);
    }
  }, [unitsRemaining, units]);

  const totalAnnualSupport =
    useMemo(() => {
      return (
        Math.max(units, 0) *
        ANNUAL_SUPPORT_PER_UNIT
      );
    }, [units]);

  const unitsRemainingAfterSelection =
    Math.max(
      unitsRemaining - units,
      0
    );

  const totalUnitsAfterSelection =
    unitsSupported + units;

  const supportTotalAfterSelection =
    totalUnitsAfterSelection *
    ANNUAL_SUPPORT_PER_UNIT;

  const fundingProgressAfterSelection =
    Math.min(
      (
        supportTotalAfterSelection /
        FUNDING_GOAL
      ) * 100,
      100
    );

  function formatCurrency(
    amount: number
  ) {
    return amount.toLocaleString(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
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
          unitsRemaining === 1
            ? ""
            : "s"
        }.`
      );

      return;
    }

    if (!acknowledged) {
      setErrorMessage(
        "Please review and accept the EPEW annual participation terms before continuing."
      );

      return;
    }

    setSubmitting(true);

    try {
      const response =
        await fetch(
          "/api/supporters/annual-support/checkout",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              supporterId:
                supporter.id,

              units,

              selectionMethod:
                "self_selected",

              allocationPreference:
                "one_business",

              selectedEntrepreneurId:
                String(business.id),

              referrerName:
                referrerName.trim() ||
                undefined,

              referredBusinessName:
                referrerBusinessName.trim() ||
                undefined,

              referralSource:
                referrerName.trim() ||
                referrerBusinessName.trim()
                  ? "supporter_entered"
                  : undefined,
            }),
          }
        );

      const responseText =
        await response.text();

      let result: {
        checkoutUrl?: string;
        sessionId?: string;
        supportIntentId?: string;
        error?: string;
      } = {};

      try {
        result =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};
      } catch {
        throw new Error(
          "The checkout server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to create the annual support checkout."
        );
      }

      if (!result.checkoutUrl) {
        throw new Error(
          "Stripe did not return a secure checkout URL."
        );
      }

      window.location.href =
        result.checkoutUrl;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to open Stripe Checkout.";

      console.error(
        "Annual Stripe checkout error:",
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
          Loading EPEW Annual Support...
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
            EPEW Annual Support
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
                Business Support
              </h2>

              <div className="mt-7 space-y-5">
                <DetailRow
                  label="Annual Funding Goal"
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
                  EPEW Annual Support Unit
                </h3>

                <p className="mt-4 text-lg leading-relaxed text-gray-700">
                  One EPEW Support Unit represents
                  one full year of support.
                </p>

                <p className="mt-4 text-5xl font-black text-green-700">
                  $5,200
                </p>

                <p className="mt-2 text-lg font-bold text-gray-700">
                  per unit — one-time payment
                </p>

                <div className="mt-6 rounded-2xl bg-white p-5">
                  <p className="text-lg font-bold text-gray-700">
                    Annual participation benefit
                  </p>

                  <p className="mt-2 text-3xl font-black text-[#06245c]">
                    Up to {PARTICIPATION_BENEFIT_RATE}%
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    Participation benefits are
                    subject to EPEW program terms
                    and are not guaranteed.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-[#f5f7fb] p-8">
              <h2 className="text-3xl font-extrabold">
                Choose Your Annual Support
              </h2>

              <p className="mt-3 text-lg leading-relaxed text-gray-700">
                Select how many annual Support
                Units you would like to provide
                for this business.
              </p>

              <div className="mt-8">
                <label
                  htmlFor="units"
                  className="text-lg font-black"
                >
                  Number of Support Units
                </label>

                {unitsRemaining > 0 ? (
                  <select
                    id="units"
                    value={units}
                    onChange={(
                      event
                    ) => {
                      setUnits(
                        Number(
                          event.target
                            .value
                        )
                      );

                      setErrorMessage(
                        ""
                      );
                    }}
                    className="mt-3 w-full rounded-2xl border-2 border-gray-300 bg-white p-4 text-xl font-bold outline-none focus:border-green-600"
                  >
                    {Array.from(
                      {
                        length:
                          unitsRemaining,
                      },
                      (_, index) =>
                        index + 1
                    ).map(
                      (
                        unitOption
                      ) => (
                        <option
                          key={
                            unitOption
                          }
                          value={
                            unitOption
                          }
                        >
                          {
                            unitOption
                          }{" "}
                          Unit
                          {unitOption ===
                          1
                            ? ""
                            : "s"}{" "}
                          —{" "}
                          {formatCurrency(
                            unitOption *
                              ANNUAL_SUPPORT_PER_UNIT
                          )}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <div className="mt-3 rounded-2xl bg-red-50 p-5 font-bold text-red-700">
                    No units remain
                    available.
                  </div>
                )}
              </div>

              <div className="mt-8 rounded-3xl bg-white p-7 shadow">
                <h3 className="text-2xl font-extrabold">
                  Your Annual Support
                </h3>

                <div className="mt-6 space-y-4">
                  <DetailRow
                    label="Support Units"
                    value={units.toString()}
                  />

                  <DetailRow
                    label="Price Per Unit"
                    value={formatCurrency(
                      ANNUAL_SUPPORT_PER_UNIT
                    )}
                  />

                  <DetailRow
                    label="Payment"
                    value="One-Time Annual Payment"
                  />

                  <DetailRow
                    label="Support Term"
                    value="1 Year"
                  />

                  <DetailRow
                    label="Annual Participation Benefit"
                    value={`Up to ${PARTICIPATION_BENEFIT_RATE}%`}
                  />

                  <DetailRow
                    label="Total Due Today"
                    value={formatCurrency(
                      totalAnnualSupport
                    )}
                  />

                  <DetailRow
                    label="Units Remaining After Support"
                    value={unitsRemainingAfterSelection.toString()}
                  />

                  <DetailRow
                    label="Funding Progress After Support"
                    value={`${fundingProgressAfterSelection.toFixed(
                      2
                    )}%`}
                  />
                </div>
              </div>

              <div className="mt-8 rounded-3xl border-2 border-blue-200 bg-blue-50 p-6">
                <h3 className="text-xl font-extrabold">
                  Were You Referred to EPEW?
                </h3>

                <p className="mt-2 leading-relaxed text-gray-700">
                  This information is optional.
                  If someone referred you, please
                  tell us who they are and their
                  business name if you know it.
                </p>

                <label className="mt-6 block font-bold">
                  Name of the Person Who
                  Referred You
                </label>

                <input
                  type="text"
                  value={referrerName}
                  onChange={(event) =>
                    setReferrerName(
                      event.target.value
                    )
                  }
                  placeholder="Optional"
                  className="mt-2 w-full rounded-2xl border-2 border-gray-300 bg-white p-4 text-lg outline-none focus:border-green-600"
                />

                <label className="mt-5 block font-bold">
                  Referrer&apos;s Business Name
                </label>

                <input
                  type="text"
                  value={
                    referrerBusinessName
                  }
                  onChange={(event) =>
                    setReferrerBusinessName(
                      event.target.value
                    )
                  }
                  placeholder="Optional"
                  className="mt-2 w-full rounded-2xl border-2 border-gray-300 bg-white p-4 text-lg outline-none focus:border-green-600"
                />
              </div>

              <div className="mt-8 rounded-3xl border-2 border-green-300 bg-green-50 p-6">
                <h3 className="text-xl font-extrabold">
                  One-Time Annual Payment
                </h3>

                <p className="mt-4 leading-relaxed text-gray-700">
                  Your selected Support Units
                  will be paid in one payment for
                  the full one-year support
                  period. There is no weekly or
                  monthly billing and no
                  automatic renewal for this
                  support.
                </p>
              </div>

              <label className="mt-7 flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => {
                    setAcknowledged(
                      event.target
                        .checked
                    );

                    setErrorMessage(
                      ""
                    );
                  }}
                  className="mt-1 h-6 w-6"
                />

                <span className="leading-relaxed text-gray-700">
                  I have reviewed and agree
                  to the EPEW Participation
                  Agreement. I understand that
                  this is a one-time annual
                  support payment, that
                  participation benefits are
                  not guaranteed, and that
                  participation is not a bank
                  deposit or guaranteed
                  financial product.
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
                  ? "Opening Secure Payment..."
                  : `Continue to Payment — ${formatCurrency(
                      totalAnnualSupport
                    )}`}
              </button>

              <p className="mt-5 text-center text-sm font-semibold text-gray-500">
                Secure one-time payment is
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
