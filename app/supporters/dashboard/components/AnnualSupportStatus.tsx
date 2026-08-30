"use client";

import { useEffect, useState } from "react";

interface SelectionCase {
  id: string;
  support_intent_id: string;
  requested_units: number;
  remaining_units: number;
  status: string;
  paid_at: string;
  selection_due_at: string;
  selection_started_at?: string | null;
  selection_completed_at?: string | null;
  selected_entrepreneur_id?: string | null;
  selected_business_name?: string | null;
  selection_reason?: string | null;
}

interface AnnualAllocation {
  id: string;
  support_intent_id: string;
  selection_case_id?: string | null;
  entrepreneur_id?: string | null;
  business_name?: string | null;
  units: number;
  unit_price: number;
  allocated_amount: number;
  support_term_months: number;
  participation_benefit_rate: number;
  selection_method: string;
  status: string;
  allocated_at: string;

  entrepreneur?: {
    id: string;
    full_name: string | null;
    business_name: string | null;
    public_business_id: string | null;
  } | null;
}

interface DashboardResponse {
  success: boolean;

  selectionCases?: SelectionCase[];

  allocations?: AnnualAllocation[];

  message?: string;
}

export default function AnnualSupportStatus() {
  const [loading, setLoading] =
    useState(true);

  const [selectionCases, setSelectionCases] =
    useState<SelectionCase[]>([]);

  const [allocations, setAllocations] =
    useState<AnnualAllocation[]>([]);

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const response = await fetch(
        "/api/supporters/annual-support/dashboard",
        {
          cache: "no-store",
        }
      );

      const result =
        (await response.json()) as DashboardResponse;

      if (!response.ok || !result.success) {
        console.error(
          "Annual support dashboard status:",
          result.message
        );

        return;
      }

      setSelectionCases(
        result.selectionCases || []
      );

      setAllocations(
        result.allocations || []
      );
    } catch (error) {
      console.error(
        "Unable to load annual support dashboard status:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return null;
  }

  const pendingCases =
    selectionCases.filter(
      (selectionCase) =>
        selectionCase.status ===
          "paid_selection_pending" ||
        selectionCase.status ===
          "selection_in_progress" ||
        selectionCase.status ===
          "entrepreneur_selected" ||
        selectionCase.status ===
          "manual_review"
    );

  if (
    pendingCases.length === 0 &&
    allocations.length === 0
  ) {
    return null;
  }

  return (
    <section className="mb-10">
      {pendingCases.length > 0 && (
        <div className="mb-8 rounded-3xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-white p-10 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-green-700 text-5xl text-white shadow-lg">
              💚
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.2em] text-green-700">
                Annual Support Confirmed
              </p>

              <h2 className="mt-2 text-4xl font-extrabold text-[#06245c]">
                EPEW Is Selecting Your Entrepreneur
              </h2>

              <p className="mt-4 max-w-4xl text-xl leading-relaxed text-gray-700">
                Your annual support payment has been received.
                EPEW is reviewing qualified entrepreneurs and
                businesses for your support.
              </p>

              <p className="mt-4 text-xl font-black text-[#06245c]">
                Your selected entrepreneur and business will
                appear in your Supporter Portal within 48 hours.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <InfoBox
              label="Selection Status"
              value={formatSelectionStatus(
                pendingCases[0].status
              )}
            />

            <InfoBox
              label="Support Units"
              value={String(
                pendingCases[0].requested_units
              )}
            />

            <InfoBox
              label="Selection Deadline"
              value={formatDateTime(
                pendingCases[0].selection_due_at
              )}
            />
          </div>

          {pendingCases.length > 1 && (
            <p className="mt-6 rounded-2xl bg-blue-50 p-5 font-bold text-[#06245c]">
              You currently have{" "}
              {pendingCases.length} annual support
              selections being processed by EPEW.
            </p>
          )}
        </div>
      )}

      {allocations.length > 0 && (
        <div className="rounded-3xl bg-white p-10 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.2em] text-green-700">
            Your Annual Support
          </p>

          <h2 className="mt-2 text-5xl font-extrabold text-[#06245c]">
            Meet the Entrepreneurs You Are Supporting
          </h2>

          <p className="mt-4 max-w-4xl text-2xl leading-relaxed text-gray-700">
            EPEW has connected your annual support with
            these entrepreneurs and businesses.
          </p>

          <div className="mt-10 grid gap-8 xl:grid-cols-2">
            {allocations.map(
              (allocation) => (
                <AllocationCard
                  key={allocation.id}
                  allocation={allocation}
                />
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function AllocationCard({
  allocation,
}: {
  allocation: AnnualAllocation;
}) {
  const entrepreneur =
    allocation.entrepreneur;

  const businessName =
    entrepreneur?.business_name ||
    allocation.business_name ||
    "EPEW Business";

  const entrepreneurName =
    entrepreneur?.full_name ||
    "EPEW Entrepreneur";

  const publicBusinessId =
    entrepreneur?.public_business_id ||
    null;

  return (
    <article className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-8 shadow-lg">
      <div className="flex items-start gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-[#06245c] text-4xl text-white">
          🏢
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.15em] text-green-700">
            Your Supported Business
          </p>

          <h3 className="mt-2 text-3xl font-black text-[#06245c]">
            {businessName}
          </h3>

          <p className="mt-2 text-xl text-gray-700">
            {entrepreneurName}
          </p>

          <p className="mt-1 font-bold text-gray-500">
            Founder & Entrepreneur
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <InfoBox
          label="Support Units"
          value={String(
            allocation.units
          )}
        />

        <InfoBox
          label="Annual Support"
          value={formatCurrency(
            Number(
              allocation.allocated_amount ||
                0
            )
          )}
        />

        <InfoBox
          label="Support Term"
          value={`${allocation.support_term_months} Months`}
        />

        <InfoBox
          label="Participation Benefit"
          value={`Up to ${Number(
            allocation.participation_benefit_rate ||
              0
          )}%`}
        />
      </div>

      <div className="mt-7 rounded-2xl bg-green-50 p-5">
        <p className="font-black text-green-800">
          EPEW Match Completed
        </p>

        <p className="mt-2 leading-relaxed text-gray-700">
          Your annual support has been connected
          with this qualified EPEW business.
        </p>
      </div>

      {publicBusinessId && (
        <a
          href={`/business/${publicBusinessId}`}
          className="mt-7 inline-block rounded-2xl bg-[#06245c] px-8 py-4 text-lg font-black text-white hover:bg-green-700"
        >
          View Business
        </a>
      )}
    </article>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-extrabold text-[#06245c]">
        {value}
      </p>
    </div>
  );
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

function formatDateTime(
  value: string
) {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Within 48 Hours";
  }

  return date.toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function formatSelectionStatus(
  status: string
) {
  switch (status) {
    case "paid_selection_pending":
      return "Payment Received";

    case "selection_in_progress":
      return "Selection in Progress";

    case "entrepreneur_selected":
      return "Entrepreneur Selected";

    case "manual_review":
      return "EPEW Review";

    default:
      return "Processing";
  }
}
