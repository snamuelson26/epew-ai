"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type SupportStatusResponse = {
  found?: boolean;
  pending?: boolean;
  transactionId?: string;
  supportIntentId?: string;
  paymentStatus?: string | null;
  selectionMethod?: string | null;
  supportStatus?: string | null;
  units?: number;
  amount?: number;
  selectionDueAt?: string | null;
  entrepreneur?: {
    id: string;
    full_name: string | null;
    business_name: string | null;
    public_business_id: string | null;
  } | null;
  error?: string;
};

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-8 py-24 text-[#06245c]">
          <p className="text-3xl font-black">
            Confirming your EPEW annual support...
          </p>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  const sessionId =
    searchParams.get("session_id") || "";

  const [loading, setLoading] =
    useState(true);

  const [status, setStatus] =
    useState<SupportStatusResponse | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    void loadAnnualSupportStatus();
  }, [sessionId]);

  async function loadAnnualSupportStatus() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/supporters/annual-support/status?session_id=${encodeURIComponent(
          sessionId
        )}`,
        {
          cache: "no-store",
        }
      );

      const result =
        (await response.json()) as SupportStatusResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to confirm annual support status."
        );
      }

      setStatus(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to confirm annual support status.";

      console.error(
        "Payment success status error:",
        error
      );

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-8 py-24 text-[#06245c]">
        <p className="text-3xl font-black">
          Confirming your EPEW annual support...
        </p>
      </main>
    );
  }

  if (!sessionId) {
    return (
      <GenericSuccessMessage />
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-8 py-24 text-[#06245c]">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-12 text-center shadow-2xl">
          <div className="mb-6 text-7xl">
            ✅
          </div>

          <h1 className="text-5xl font-extrabold">
            Payment Received
          </h1>

          <p className="mt-8 text-2xl leading-relaxed text-gray-700">
            Thank you for your EPEW annual support.
          </p>

          <p className="mt-6 text-lg text-gray-600">
            We were unable to display the detailed support status
            on this page, but you can view your Supporter Portal
            for the latest information.
          </p>

          <div className="mt-10">
            <Link
              href="/supporters/dashboard"
              className="inline-block rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-bold text-white hover:bg-green-700"
            >
              Go to Supporter Portal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Stripe may redirect the supporter to this page before the
   * webhook has finished creating the EPEW transaction record.
   */
  if (
    status?.pending ||
    !status?.found
  ) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-8 py-24 text-[#06245c]">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-12 text-center shadow-2xl">
          <div className="mb-6 text-7xl">
            ✅
          </div>

          <h1 className="text-5xl font-extrabold">
            Payment Received
          </h1>

          <p className="mt-8 text-2xl leading-relaxed text-gray-700">
            Thank you for your EPEW annual support.
          </p>

          <div className="mt-8 rounded-3xl bg-blue-50 p-7 text-left">
            <h2 className="text-2xl font-black text-[#06245c]">
              We Are Finalizing Your Support Record
            </h2>

            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Your secure payment has returned successfully. EPEW
              is finalizing the payment record now. Your Supporter
              Portal will reflect the completed support shortly.
            </p>
          </div>

          <div className="mt-10">
            <Link
              href="/supporters/dashboard"
              className="inline-block rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-bold text-white hover:bg-green-700"
            >
              Go to Supporter Portal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const units =
    Number(status.units || 0);

  const amount =
    Number(status.amount || 0);

  const isEpewSelected =
    status.selectionMethod ===
    "epew_selected";

  if (isEpewSelected) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-8 py-24 text-[#06245c]">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-12 text-center shadow-2xl">
          <div className="mb-6 text-7xl">
            💚
          </div>

          <p className="text-lg font-black uppercase tracking-[0.3em] text-green-700">
            EPEW Annual Support
          </p>

          <h1 className="mt-4 text-5xl font-extrabold">
            Thank You for Your Support
          </h1>

          <p className="mx-auto mt-8 max-w-4xl text-2xl leading-relaxed text-gray-700">
            Your one-time annual support payment has been received
            successfully.
          </p>

          <div className="mx-auto mt-8 max-w-3xl rounded-3xl bg-[#f5f7fb] p-8">
            <DetailRow
              label="Support Units"
              value={units.toString()}
            />

            <DetailRow
              label="Annual Support"
              value={formatCurrency(amount)}
            />

            <DetailRow
              label="Payment"
              value="One-Time Annual Payment"
            />

            <DetailRow
              label="Business Selection"
              value="EPEW Selection"
            />
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-3xl border-2 border-green-300 bg-green-50 p-8 text-left">
            <h2 className="text-3xl font-black text-[#06245c]">
              EPEW Is Selecting Your Entrepreneur
            </h2>

            <p className="mt-5 text-xl leading-relaxed text-gray-700">
              EPEW will now review qualified businesses and select
              an entrepreneur for your support.
            </p>

            <p className="mt-5 text-xl font-bold leading-relaxed text-[#06245c]">
              Your entrepreneur and business will appear in your
              Supporter Portal within 48 hours.
            </p>

            <p className="mt-5 text-lg leading-relaxed text-gray-700">
              Once the match is completed, EPEW will send you a
              special thank-you message and introduce you to the
              entrepreneur you are supporting.
            </p>
          </div>

          <div className="mt-10 flex flex-col justify-center gap-5 md:flex-row">
            <Link
              href="/supporters/dashboard"
              className="rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-bold text-white hover:bg-green-700"
            >
              Go to Supporter Portal
            </Link>

            <Link
              href="/supporters/marketplace"
              className="rounded-2xl bg-green-600 px-10 py-5 text-2xl font-bold text-white hover:bg-[#06245c]"
            >
              Explore Entrepreneurs
            </Link>
          </div>

          <p className="mt-8 text-lg font-bold text-green-700">
            Participation benefits are not guaranteed and are subject
            to EPEW program terms.
          </p>
        </div>
      </main>
    );
  }

  const entrepreneur =
    status.entrepreneur;

  const businessName =
    entrepreneur?.business_name ||
    "Your Selected Business";

  const entrepreneurName =
    entrepreneur?.full_name ||
    "EPEW Entrepreneur";

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-8 py-24 text-[#06245c]">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-12 text-center shadow-2xl">
        <div className="mb-6 text-7xl">
          ✅
        </div>

        <p className="text-lg font-black uppercase tracking-[0.3em] text-green-700">
          EPEW Annual Support
        </p>

        <h1 className="mt-4 text-5xl font-extrabold">
          Your Support Is Confirmed
        </h1>

        <p className="mx-auto mt-8 max-w-4xl text-2xl leading-relaxed text-gray-700">
          Thank you for supporting{" "}
          <strong>{businessName}</strong>.
        </p>

        <div className="mx-auto mt-8 max-w-3xl rounded-3xl bg-[#f5f7fb] p-8 text-left">
          <DetailRow
            label="Business"
            value={businessName}
          />

          <DetailRow
            label="Entrepreneur"
            value={entrepreneurName}
          />

          <DetailRow
            label="Support Units"
            value={units.toString()}
          />

          <DetailRow
            label="Annual Support"
            value={formatCurrency(amount)}
          />

          <DetailRow
            label="Payment"
            value="One-Time Annual Payment"
          />
        </div>

        <p className="mx-auto mt-8 max-w-4xl text-xl leading-relaxed text-gray-700">
          Your support is now part of the EPEW community support
          record for this business.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-5 md:flex-row">
          <Link
            href="/supporters/dashboard"
            className="rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-bold text-white hover:bg-green-700"
          >
            Go to Supporter Portal
          </Link>

          {entrepreneur?.public_business_id && (
            <Link
              href={`/business/${entrepreneur.public_business_id}`}
              className="rounded-2xl bg-green-600 px-10 py-5 text-2xl font-bold text-white hover:bg-[#06245c]"
            >
              View Supported Business
            </Link>
          )}
        </div>

        <p className="mt-8 text-lg font-bold text-green-700">
          Participation benefits are not guaranteed and are subject
          to EPEW program terms.
        </p>
      </div>
    </main>
  );
}

function GenericSuccessMessage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-8 py-24 text-[#06245c]">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-12 text-center shadow-2xl">
        <div className="mb-6 text-7xl">
          ✅
        </div>

        <h1 className="text-5xl font-extrabold">
          Payment Successful
        </h1>

        <p className="mt-8 text-2xl leading-relaxed text-gray-700">
          Thank you for supporting an entrepreneur through the EPEW
          Entrepreneur Development Ecosystem.
        </p>

        <div className="mt-10">
          <Link
            href="/supporters/dashboard"
            className="inline-block rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-bold text-white hover:bg-green-700"
          >
            Go to Supporter Portal
          </Link>
        </div>
      </div>
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
