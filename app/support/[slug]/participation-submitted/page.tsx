"use client";

import { useSearchParams } from "next/navigation";

export default function ParticipationSubmittedPage() {
  const searchParams = useSearchParams();

  const businessId = searchParams.get("business_id") || "";
  const units = Number(searchParams.get("units") || 1);
  const frequency = searchParams.get("frequency") || "weekly";

  const weeklyUnitAmount = 100;
  const weeklyTotal = units * weeklyUnitAmount;
  const annualTotal = weeklyTotal * 52;
  const monthlyTotal = annualTotal / 12;

  const frequencyLabel =
    frequency === "annual"
      ? "Annual One-Time Payment"
      : frequency === "monthly"
      ? "Monthly Automatic Payment"
      : "Weekly Automatic Payment";

  const paymentAmount =
    frequency === "annual"
      ? annualTotal
      : frequency === "monthly"
      ? monthlyTotal
      : weeklyTotal;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-8 text-center">
          <div className="rounded-3xl bg-white p-14 shadow-2xl">
            <div className="mb-8 text-7xl">✅</div>

            <h1 className="mb-10 text-6xl font-extrabold">
              Participation Request Submitted
            </h1>

            <p className="mb-8 text-3xl leading-relaxed text-gray-700">
              Thank you. Your support participation request has been received.
            </p>

            <div className="mb-10 rounded-3xl bg-[#f5f7fb] p-10 text-left shadow-xl">
              <h2 className="mb-6 text-4xl font-bold">
                Participation Summary
              </h2>

              <p className="mb-4 text-2xl text-gray-700">
                <strong>Business ID:</strong> {businessId || "Pending"}
              </p>

              <p className="mb-4 text-2xl text-gray-700">
                <strong>Units Selected:</strong> {units}
              </p>

              <p className="mb-4 text-2xl text-gray-700">
                <strong>Payment Frequency:</strong> {frequencyLabel}
              </p>

              <p className="mb-4 text-2xl text-gray-700">
                <strong>Payment Amount:</strong>{" "}
                ${paymentAmount.toLocaleString(undefined, {
                  minimumFractionDigits: frequency === "monthly" ? 2 : 0,
                  maximumFractionDigits: frequency === "monthly" ? 2 : 0,
                })}
              </p>

              <p className="text-2xl font-bold text-green-700">
                <strong>Annual Support Commitment:</strong>{" "}
                ${annualTotal.toLocaleString()}
              </p>
            </div>

            <p className="mb-8 text-2xl leading-relaxed text-gray-700">
              The next step is account and payment verification. Once your
              payment setup is confirmed, your support progress may begin
              appearing on your supporter portal and the entrepreneur’s progress
              tracking system.
            </p>

            <div className="mb-10 rounded-3xl bg-[#f5f7fb] p-10 shadow-xl">
              <h2 className="mb-6 text-4xl font-bold">What Happens Next?</h2>

              <ul className="space-y-5 text-left text-2xl text-gray-700">
                <li>✅ Your participation request is recorded.</li>
                <li>✅ Your supporter account may be created or verified.</li>
                <li>✅ Automatic payment setup may be verified.</li>
                <li>
                  ✅ The entrepreneur’s support progress may update after
                  payment confirmation.
                </li>
                <li>
                  ✅ Your supporter portal will show this business under your
                  supported entrepreneurs.
                </li>
              </ul>
            </div>

            <div className="mb-12 rounded-3xl bg-[#f5f7fb] p-10 shadow-xl">
              <p className="mb-6 text-xl leading-relaxed text-gray-700">
                EPEW does not guarantee business success, repayment, financial
                return, or participation outcome. Participation decisions are
                voluntary and made directly in support of the entrepreneur.
              </p>

              <p className="mb-6 text-xl leading-relaxed text-gray-700">
                What EPEW does guarantee is its commitment to help train, guide,
                organize, and provide entrepreneur development resources
                intended to help entrepreneurs improve their preparation and
                opportunity for success.
              </p>

              <p className="text-2xl font-bold leading-relaxed text-[#06245c]">
                Please visit the entrepreneur marketplace to discover additional
                entrepreneurs that may also deserve your support.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-6 md:flex-row">
              <a
                href={
                  businessId
                    ? `/supporters/register?business_id=${businessId}&units=${units}&frequency=${frequency}`
                    : "/supporters/register"
                }
                className="rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-bold text-white transition hover:bg-green-600"
              >
                Create Supporter Account
              </a>

              <a
                href="/supporters/marketplace"
                className="rounded-2xl border-2 border-green-600 px-10 py-5 text-2xl font-bold text-green-700 transition hover:bg-green-600 hover:text-white"
              >
                Explore More Entrepreneurs
              </a>

              <a
                href="/resources/view-faq"
                className="rounded-2xl border-2 border-[#06245c] px-10 py-5 text-2xl font-bold text-[#06245c] transition hover:bg-[#06245c] hover:text-white"
              >
                View FAQ
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}