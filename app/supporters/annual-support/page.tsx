"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { supabase } from "@/lib/supabase";

const ANNUAL_SUPPORT_PER_UNIT = 5_200;
const PARTICIPATION_BENEFIT_RATE = 8;

export default function AnnualSupportPage() {
  const router = useRouter();

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
    void loadSupporter();
  }, []);

  async function loadSupporter() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const nextPath =
        encodeURIComponent(
          "/supporters/annual-support"
        );

      router.push(
        `/supporters/login?next=${nextPath}`
      );

      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("supporters")
      .select("*")
      .or(
        `user_id.eq.${user.id},email.eq.${user.email}`
      )
      .maybeSingle();

    if (error || !data) {
      router.push(
        "/supporters/register"
      );

      return;
    }

    setSupporter(data);
    setLoading(false);
  }

  const totalAnnualSupport =
    useMemo(() => {
      return (
        Math.max(units, 0) *
        ANNUAL_SUPPORT_PER_UNIT
      );
    }, [units]);

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

  async function continueToPayment() {
    setErrorMessage("");

    if (!supporter) {
      setErrorMessage(
        "Your supporter profile could not be found."
      );

      return;
    }

    if (
      !Number.isInteger(units) ||
      units < 1
    ) {
      setErrorMessage(
        "Please select at least one Support Unit."
      );

      return;
    }

    if (!acknowledged) {
      setErrorMessage(
        "Please review and accept the EPEW annual participation terms."
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
                "epew_selected",

              allocationPreference:
                "one_business",

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
          : "Unable to open secure payment.";

      console.error(
        "EPEW-selected annual support checkout error:",
        error
      );

      setErrorMessage(message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-8">
          <p className="text-3xl font-black text-[#06245c]">
            Loading Annual Support...
          </p>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] px-6 py-12 text-[#06245c]">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 p-10 text-white shadow-2xl">
            <p className="text-lg font-black uppercase tracking-[0.3em] text-lime-300">
              EPEW Annual Support
            </p>

            <h1 className="mt-4 text-5xl font-black md:text-6xl">
              Let EPEW Choose a Qualified Business for You
            </h1>

            <p className="mt-6 max-w-5xl text-2xl leading-relaxed text-blue-100">
              Choose how many Support Units you would like to provide.
              After your one-time annual payment is completed, EPEW will
              select a qualified entrepreneur for your support within
              48 hours.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-8 rounded-2xl border-2 border-red-500 bg-red-50 p-5 text-lg font-bold text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
            <section className="rounded-3xl bg-white p-8 shadow-xl">
              <h2 className="text-3xl font-black">
                Annual Support Details
              </h2>

              <div className="mt-8 rounded-3xl border-l-8 border-green-600 bg-green-50 p-7">
                <p className="text-lg font-bold text-gray-700">
                  1 EPEW Support Unit
                </p>

                <p className="mt-3 text-5xl font-black text-green-700">
                  $5,200
                </p>

                <p className="mt-2 text-xl font-bold text-gray-700">
                  one-time payment for one year
                </p>
              </div>

              <div className="mt-7 rounded-3xl bg-[#f5f7fb] p-7">
                <p className="text-lg font-bold text-gray-700">
                  Annual Participation Benefit
                </p>

                <p className="mt-2 text-4xl font-black text-[#06245c]">
                  Up to {PARTICIPATION_BENEFIT_RATE}%
                </p>

                <p className="mt-3 leading-relaxed text-gray-600">
                  Participation benefits are subject to EPEW program
                  terms and are not guaranteed.
                </p>
              </div>

              <div className="mt-7 rounded-3xl border-2 border-blue-200 bg-blue-50 p-7">
                <h3 className="text-2xl font-black">
                  How EPEW Selection Works
                </h3>

                <p className="mt-4 leading-relaxed text-gray-700">
                  Your annual payment is completed first. EPEW then
                  reviews qualified businesses and selects an
                  entrepreneur for your support.
                </p>

                <p className="mt-4 font-bold leading-relaxed text-[#06245c]">
                  Your selected entrepreneur and business will appear
                  in your Supporter Portal within 48 hours.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-8 shadow-xl">
              <h2 className="text-3xl font-black">
                Choose Your Support
              </h2>

              <label
                htmlFor="units"
                className="mt-7 block text-lg font-black"
              >
                Number of Support Units
              </label>

              <input
                id="units"
                type="number"
                min="1"
                step="1"
                value={units}
                onChange={(event) => {
                  const nextUnits =
                    Math.max(
                      1,
                      Math.floor(
                        Number(
                          event.target.value ||
                            1
                        )
                      )
                    );

                  setUnits(nextUnits);
                  setErrorMessage("");
                }}
                className="mt-3 w-full rounded-2xl border-2 border-gray-300 p-4 text-2xl font-black outline-none focus:border-green-600"
              />

              <div className="mt-8 rounded-3xl bg-[#f5f7fb] p-7">
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
                  label="Support Term"
                  value="1 Year"
                />

                <DetailRow
                  label="Payment Frequency"
                  value="One-Time"
                />

                <DetailRow
                  label="Annual Participation Benefit"
                  value={`Up to ${PARTICIPATION_BENEFIT_RATE}%`}
                />

                <div className="mt-6 rounded-2xl bg-green-50 p-6 text-center">
                  <p className="text-lg font-bold text-gray-700">
                    Total Due Today
                  </p>

                  <p className="mt-2 text-5xl font-black text-green-700">
                    {formatCurrency(
                      totalAnnualSupport
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border-2 border-blue-200 bg-blue-50 p-7">
                <h3 className="text-2xl font-black">
                  Were You Referred to EPEW?
                </h3>

                <p className="mt-3 leading-relaxed text-gray-700">
                  This is optional. Referral information may help EPEW
                  give first consideration to that person&apos;s
                  qualified business.
                </p>

                <label className="mt-6 block font-bold">
                  Name of the Person Who Referred You
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
                  That Person&apos;s Business Name
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

              <div className="mt-8 rounded-3xl border-2 border-yellow-300 bg-yellow-50 p-6">
                <h3 className="text-xl font-black">
                  Important
                </h3>

                <p className="mt-3 leading-relaxed text-gray-700">
                  Referral information is a preference only. EPEW will
                  not assign support to an entrepreneur who is not
                  qualified or otherwise eligible to receive support.
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
                  I agree to the EPEW Participation Agreement. I
                  understand that this is a one-time annual support
                  payment, that EPEW will select a qualified
                  entrepreneur for my support within 48 hours, and that
                  participation benefits are not guaranteed.
                </span>
              </label>

              <button
                type="button"
                onClick={continueToPayment}
                disabled={
                  submitting ||
                  !acknowledged
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
                Secure one-time payment is processed by Stripe.
              </p>
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </>
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
    <div className="flex flex-col justify-between gap-2 border-b border-gray-200 py-4 sm:flex-row">
      <span className="font-bold text-gray-600">
        {label}
      </span>

      <span className="text-lg font-black text-[#06245c]">
        {value}
      </span>
    </div>
  );
}
