"use client";

// =======================================================
// EPEW – EDE – IBOS
// Pending Coach Assignments Card
// =======================================================

import { useCallback, useEffect, useState } from "react";

type PendingAssignment = {
  id: string;
  entrepreneur_id: string;
  coach_id: string | null;
  coach_name: string | null;
  coach_email: string | null;
  assigned_at: string | null;
  acknowledgment_deadline: string | null;
  acknowledgment_status: string | null;
  assignment_status: string | null;
  first_contact_due_at: string | null;
};

type PendingAssignmentsResponse = {
  success: boolean;
  data?: PendingAssignment[];
  message?: string;
};

function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getTimeRemaining(deadline: string | null): string {
  if (!deadline) {
    return "No deadline provided";
  }

  const deadlineDate = new Date(deadline);

  if (Number.isNaN(deadlineDate.getTime())) {
    return "Deadline unavailable";
  }

  const difference = deadlineDate.getTime() - Date.now();

  if (difference <= 0) {
    return "Acknowledgment overdue";
  }

  const totalMinutes = Math.floor(difference / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}

export default function PendingAssignmentsCard() {
  const [assignments, setAssignments] = useState<
    PendingAssignment[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await fetch(
        "/api/coach-assignments/pending",
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result =
        (await response.json()) as PendingAssignmentsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to load pending assignments."
        );
      }

      setAssignments(result.data ?? []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load pending assignments.";

      setErrorMessage(message);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Coach Assignment Center
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Pending Assignments
            </h2>
          </div>

          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="mt-6 space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Coach Assignment Center
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Pending Assignments
        </h2>

        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">
            Assignments could not be loaded.
          </p>

          <p className="mt-1 text-sm text-red-700">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => void loadAssignments()}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Coach Assignment Center
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Pending Assignments
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Review the entrepreneurs assigned to you and
            acknowledge each assignment before its deadline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-amber-700">
              {assignments.length}
            </p>

            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Pending
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAssignments()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-lg font-bold text-emerald-800">
            No pending assignments
          </p>

          <p className="mt-2 text-sm text-emerald-700">
            You have acknowledged all assignments currently
            assigned to you.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {assignments.map((assignment) => (
            <article
              key={assignment.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-300 hover:bg-white"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      New Entrepreneur Assignment
                    </h3>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
                      {assignment.acknowledgment_status ??
                        "Pending"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    Entrepreneur ID
                  </p>

                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {assignment.entrepreneur_id}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Acknowledgment Deadline
                  </p>

                  <p className="mt-1 font-bold text-amber-900">
                    {getTimeRemaining(
                      assignment.acknowledgment_deadline
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assigned
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(assignment.assigned_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acknowledge By
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(
                      assignment.acknowledgment_deadline
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    First Contact Due
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(
                      assignment.first_contact_due_at
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assignment Status
                  </p>

                  <p className="mt-1 text-sm font-medium capitalize text-slate-800">
                    {assignment.assignment_status ??
                      "Assigned"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  Accept and decline controls will be connected
                  during the next acknowledgment-action step.
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}