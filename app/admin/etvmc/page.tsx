"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MetricCardProps = {
  title: string;
  value: number;
  color: string;
  href?: string;
};

type TaskRecord = {
  id: string;
  task_number?: number | null;
  title?: string | null;
  current_status?: string | null;
  next_required_action?: string | null;
  created_at?: string | null;
};

type JobRecord = {
  id: string;
  job_number?: number | null;
  title?: string | null;
  current_status?: string | null;
  next_required_action?: string | null;
  created_at?: string | null;
};

type PaymentRecord = {
  id: string;
  payment_number?: number | null;
  payable_amount?: number | string | null;
  current_status?: string | null;
  finance_handoff_status?: string | null;
  created_at?: string | null;
};

export default function AdminETVMCPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [taskCount, setTaskCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [bidCount, setBidCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [eligiblePaymentCount, setEligiblePaymentCount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [exceptionCount, setExceptionCount] = useState(0);
  const [disputeCount, setDisputeCount] = useState(0);

  const [recentTasks, setRecentTasks] = useState<TaskRecord[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobRecord[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    loadETVMC();
  }, []);

  async function loadETVMC() {
    setLoading(true);
    setLoadError("");

    try {
      const [
        tasksResult,
        jobsResult,
        bidsResult,
        assignmentsResult,
        submissionsResult,
        eligiblePaymentsResult,
        paidPaymentsResult,
        exceptionsResult,
        disputesResult,
        recentTasksResult,
        recentJobsResult,
        recentPaymentsResult,
      ] = await Promise.all([
        supabase
          .from("etvmc_tasks")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("etvmc_jobs")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("etvmc_vendor_bids")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("etvmc_assignments")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("etvmc_work_submissions")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("etvmc_vendor_payment_eligibility")
          .select("id", { count: "exact", head: true })
          .eq("current_status", "eligible"),

        supabase
          .from("etvmc_vendor_payment_eligibility")
          .select("id", { count: "exact", head: true })
          .eq("current_status", "paid"),

        supabase
          .from("etvmc_exceptions")
          .select("id", { count: "exact", head: true })
          .neq("current_status", "resolved")
          .neq("current_status", "cancelled"),

        supabase
          .from("etvmc_disputes")
          .select("id", { count: "exact", head: true })
          .neq("current_status", "resolved")
          .neq("current_status", "withdrawn")
          .neq("current_status", "cancelled"),

        supabase
          .from("etvmc_tasks")
          .select(
            "id, task_number, title, current_status, next_required_action, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(5),

        supabase
          .from("etvmc_jobs")
          .select(
            "id, job_number, title, current_status, next_required_action, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(5),

        supabase
          .from("etvmc_vendor_payment_eligibility")
          .select(
            "id, payment_number, payable_amount, current_status, finance_handoff_status, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const results = [
        tasksResult,
        jobsResult,
        bidsResult,
        assignmentsResult,
        submissionsResult,
        eligiblePaymentsResult,
        paidPaymentsResult,
        exceptionsResult,
        disputesResult,
        recentTasksResult,
        recentJobsResult,
        recentPaymentsResult,
      ];

      const firstError = results.find((result) => result.error)?.error;

      if (firstError) {
        console.error("ETVMC dashboard load error:", firstError);
        setLoadError(firstError.message || "Unable to load ETVMC dashboard.");
      }

      setTaskCount(tasksResult.count || 0);
      setJobCount(jobsResult.count || 0);
      setBidCount(bidsResult.count || 0);
      setAssignmentCount(assignmentsResult.count || 0);
      setSubmissionCount(submissionsResult.count || 0);
      setEligiblePaymentCount(eligiblePaymentsResult.count || 0);
      setPaidCount(paidPaymentsResult.count || 0);
      setExceptionCount(exceptionsResult.count || 0);
      setDisputeCount(disputesResult.count || 0);

      setRecentTasks((recentTasksResult.data || []) as TaskRecord[]);
      setRecentJobs((recentJobsResult.data || []) as JobRecord[]);
      setRecentPayments(
        (recentPaymentsResult.data || []) as PaymentRecord[]
      );
    } catch (error) {
      console.error(error);
      setLoadError("Unable to load ETVMC dashboard.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10">
        <div className="text-2xl font-bold text-[#06245c]">
          Loading Enterprise Task & Vendor Management Center...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-6 md:p-10">
      <div className="mb-10">
        <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">
          EPEW Enterprise Development Environment
        </p>

        <h1 className="mb-4 text-4xl font-extrabold text-[#06245c] md:text-5xl">
          Enterprise Task & Vendor Management Center
        </h1>

        <p className="max-w-5xl text-lg text-gray-700">
          Governance center for the complete outsourced-work lifecycle:
          task creation, Partner coordination, job preparation, Vendor
          bidding, negotiation, assignment, work submission, review,
          completion, payment eligibility, and Finance handoff.
        </p>
      </div>

      {loadError ? (
        <div className="mb-8 rounded-2xl border-l-8 border-red-600 bg-red-50 p-6">
          <h2 className="font-bold text-red-800">
            Some ETVMC information could not be loaded
          </h2>
          <p className="mt-2 text-red-700">{loadError}</p>
        </div>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-5 text-2xl font-extrabold text-[#06245c]">
          Operations Overview
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Enterprise Tasks"
            value={taskCount}
            color="text-[#06245c]"
          />

          <MetricCard
            title="Jobs"
            value={jobCount}
            color="text-blue-700"
          />

          <MetricCard
            title="Vendor Bids"
            value={bidCount}
            color="text-purple-700"
          />

          <MetricCard
            title="Assignments"
            value={assignmentCount}
            color="text-indigo-700"
          />

          <MetricCard
            title="Work Submissions"
            value={submissionCount}
            color="text-cyan-700"
          />

          <MetricCard
            title="Payment Eligible"
            value={eligiblePaymentCount}
            color="text-green-700"
          />

          <MetricCard
            title="Paid"
            value={paidCount}
            color="text-emerald-700"
          />

          <MetricCard
            title="Open Exceptions"
            value={exceptionCount}
            color={exceptionCount > 0 ? "text-red-700" : "text-green-700"}
          />
        </div>
      </section>

      <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border-l-8 border-[#06245c] bg-white p-8 shadow-xl">
          <h2 className="mb-4 text-2xl font-extrabold text-[#06245c]">
            Enterprise Rule — No Orphaned Work
          </h2>

          <p className="text-gray-700">
            Every active Task, Job, Assignment, review, revision,
            payment action, exception, and dispute must identify a
            current responsible party and the next required action.
          </p>
        </div>

        <div className="rounded-3xl border-l-8 border-purple-600 bg-white p-8 shadow-xl">
          <h2 className="mb-4 text-2xl font-extrabold text-[#06245c]">
            Communication Boundary
          </h2>

          <p className="text-gray-700">
            Entrepreneurs communicate with the Coordinating Partner.
            Vendors communicate with the Coordinating Partner.
            Direct Entrepreneur-to-Vendor communication is not part of
            the ETVMC workflow.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-5 text-2xl font-extrabold text-[#06245c]">
          Enterprise Work Lifecycle
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <LifecycleStep
            number="01"
            title="Task"
            description="Coach identifies required business work."
          />

          <LifecycleStep
            number="02"
            title="Partner"
            description="Coordinating Partner reviews and prepares the Job."
          />

          <LifecycleStep
            number="03"
            title="Bidding"
            description="Qualified Vendors submit confidential bids."
          />

          <LifecycleStep
            number="04"
            title="Assignment"
            description="Best-value Vendor accepts negotiated terms."
          />

          <LifecycleStep
            number="05"
            title="Review"
            description="Partner quality review followed by Entrepreneur review."
          />

          <LifecycleStep
            number="06"
            title="Payment"
            description="ETVMC eligibility followed by Finance release."
          />
        </div>
      </section>

      <section className="mb-10 grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="border-b px-8 py-6">
            <h2 className="text-2xl font-extrabold text-[#06245c]">
              Recent Enterprise Tasks
            </h2>
          </div>

          {recentTasks.length === 0 ? (
            <EmptyState message="No Enterprise Tasks have been created yet." />
          ) : (
            <div className="overflow-x-auto p-6">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="p-3">Task</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Next Required Action</th>
                  </tr>
                </thead>

                <tbody>
                  {recentTasks.map((task) => (
                    <tr key={task.id} className="border-b align-top">
                      <td className="p-3">
                        <p className="font-bold text-[#06245c]">
                          {task.title || "Enterprise Task"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Task #{task.task_number || "-"}
                        </p>
                      </td>

                      <td className="p-3">
                        <StatusBadge status={task.current_status} />
                      </td>

                      <td className="p-3 text-sm text-gray-700">
                        {task.next_required_action || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="border-b px-8 py-6">
            <h2 className="text-2xl font-extrabold text-[#06245c]">
              Recent Jobs
            </h2>
          </div>

          {recentJobs.length === 0 ? (
            <EmptyState message="No ETVMC Jobs have been prepared yet." />
          ) : (
            <div className="overflow-x-auto p-6">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="p-3">Job</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Next Required Action</th>
                  </tr>
                </thead>

                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="border-b align-top">
                      <td className="p-3">
                        <p className="font-bold text-[#06245c]">
                          {job.title || "ETVMC Job"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Job #{job.job_number || "-"}
                        </p>
                      </td>

                      <td className="p-3">
                        <StatusBadge status={job.current_status} />
                      </td>

                      <td className="p-3 text-sm text-gray-700">
                        {job.next_required_action || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mb-10 grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl xl:col-span-2">
          <div className="border-b px-8 py-6">
            <h2 className="text-2xl font-extrabold text-[#06245c]">
              Vendor Payment Control
            </h2>
          </div>

          {recentPayments.length === 0 ? (
            <EmptyState message="No Vendor payment eligibility records exist yet." />
          ) : (
            <div className="overflow-x-auto p-6">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="p-3">Payment</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">ETVMC Status</th>
                    <th className="p-3">Finance Handoff</th>
                  </tr>
                </thead>

                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment.id} className="border-b">
                      <td className="p-3 font-bold text-[#06245c]">
                        #{payment.payment_number || "-"}
                      </td>

                      <td className="p-3 font-bold text-green-700">
                        {formatCurrency(payment.payable_amount)}
                      </td>

                      <td className="p-3">
                        <StatusBadge status={payment.current_status} />
                      </td>

                      <td className="p-3">
                        <StatusBadge
                          status={payment.finance_handoff_status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-2xl font-extrabold text-[#06245c]">
            Governance Alerts
          </h2>

          <AlertRow
            label="Open Exceptions"
            value={exceptionCount}
          />

          <AlertRow
            label="Open Disputes"
            value={disputeCount}
          />

          <AlertRow
            label="Payments Eligible"
            value={eligiblePaymentCount}
            positive
          />

          <AlertRow
            label="Completed Payments"
            value={paidCount}
            positive
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-3xl font-extrabold text-[#06245c]">
          ETVMC Control Centers
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ControlLink
            title="All Tasks"
            description="Enterprise work requirements and ownership."
          />

          <ControlLink
            title="Jobs"
            description="Job preparation, pricing, publishing, and status."
          />

          <ControlLink
            title="Bids & Negotiations"
            description="Vendor bidding and Partner negotiation."
          />

          <ControlLink
            title="Assignments"
            description="Vendor assignments and execution."
          />

          <ControlLink
            title="Work Review"
            description="Partner and Entrepreneur review workflow."
          />

          <ControlLink
            title="Payments"
            description="Eligibility and Finance handoff."
          />

          <ControlLink
            title="Exceptions & Disputes"
            description="Operational exceptions and governance cases."
          />

          <ControlLink
            title="Audit"
            description="Immutable ETVMC operational history."
          />
        </div>

        <p className="mt-6 text-sm text-gray-500">
          These control-center cards will become drill-down pages during
          the next Phase 1D steps.
        </p>
      </section>
    </main>
  );
}

function MetricCard({
  title,
  value,
  color,
  href,
}: MetricCardProps) {
  const content = (
    <div className="h-full rounded-3xl bg-white p-7 shadow-xl transition hover:-translate-y-0.5">
      <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500">
        {title}
      </h3>

      <p className={`mt-4 text-4xl font-extrabold ${color}`}>
        {value}
      </p>
    </div>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

function LifecycleStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg">
      <p className="text-xs font-extrabold uppercase tracking-widest text-blue-500">
        {number}
      </p>

      <h3 className="mt-2 text-xl font-extrabold text-[#06245c]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-gray-600">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const normalized = (status || "unknown").toLowerCase();

  let style = "bg-gray-100 text-gray-700";

  if (
    normalized.includes("paid") ||
    normalized.includes("eligible") ||
    normalized.includes("completed") ||
    normalized.includes("approved")
  ) {
    style = "bg-green-100 text-green-800";
  } else if (
    normalized.includes("dispute") ||
    normalized.includes("blocked") ||
    normalized.includes("failed") ||
    normalized.includes("rejected")
  ) {
    style = "bg-red-100 text-red-800";
  } else if (
    normalized.includes("hold") ||
    normalized.includes("pending") ||
    normalized.includes("review") ||
    normalized.includes("negotiation")
  ) {
    style = "bg-yellow-100 text-yellow-800";
  } else if (
    normalized.includes("assigned") ||
    normalized.includes("submitted") ||
    normalized.includes("bidding") ||
    normalized.includes("finance")
  ) {
    style = "bg-blue-100 text-blue-800";
  }

  return (
    <span
      className={`inline-block rounded-xl px-3 py-2 text-xs font-bold ${style}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function AlertRow({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
}) {
  const activeClass = positive
    ? "bg-blue-100 text-blue-800"
    : "bg-red-100 text-red-800";

  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl border p-4">
      <span className="font-bold text-gray-700">{label}</span>

      <span
        className={`rounded-xl px-4 py-2 font-extrabold ${
          value > 0
            ? activeClass
            : "bg-green-100 text-green-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="p-10 text-center">
      <p className="text-lg font-bold text-gray-500">{message}</p>
    </div>
  );
}

function ControlLink({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-5">
      <h3 className="font-extrabold text-[#06245c]">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function formatStatus(status?: string | null) {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
