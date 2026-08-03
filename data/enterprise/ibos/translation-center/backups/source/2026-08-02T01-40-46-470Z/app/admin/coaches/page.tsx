"use client";

// =======================================================
// EPEW – EDE – IBOS
// Admin Coach Management Center
// =======================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

type CoachStatus = "available" | "busy" | "away" | "inactive";

interface CoachCard {
  id: string;
  coachCode: string;
  fullName: string;
  email: string | null;
  photoUrl: string | null;
  status: CoachStatus;
  activeEntrepreneurCount: number;
  maximumCapacity: number;
  workloadPercentage: number;
}

interface CoachApiResponse {
  success: boolean;
  data?: CoachCard[];
  message?: string;
}

const STATUS_OPTIONS: Array<{
  value: CoachStatus;
  label: string;
}> = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "away", label: "Away" },
  { value: "inactive", label: "Inactive" },
];

function getStatusLabel(status: CoachStatus): string {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

function getStatusClasses(status: CoachStatus): string {
  switch (status) {
    case "available":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "busy":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "away":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "inactive":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.min(100, Math.max(0, Math.round(value)));
}

function getWorkloadMessage(percentage: number): string {
  if (percentage >= 100) return "At full capacity";
  if (percentage >= 80) return "Near capacity";
  if (percentage >= 50) return "Moderate workload";
  return "Capacity available";
}

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<CoachCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingCoachId, setUpdatingCoachId] = useState<string | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    CoachStatus | "all"
  >("all");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadCoaches = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch("/api/admin/coaches", {
          method: "GET",
          cache: "no-store",
        });

        const result = (await response.json()) as CoachApiResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load the coach directory."
          );
        }

        setCoaches(result.data ?? []);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load the coach directory.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadCoaches();
  }, [loadCoaches]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successMessage]);

  const statistics = useMemo(() => {
    const available = coaches.filter(
      (coach) => coach.status === "available"
    ).length;

    const busy = coaches.filter(
      (coach) => coach.status === "busy"
    ).length;

    const totalActiveEntrepreneurs = coaches.reduce(
      (sum, coach) => sum + coach.activeEntrepreneurCount,
      0
    );

    const totalCapacity = coaches.reduce(
      (sum, coach) => sum + coach.maximumCapacity,
      0
    );

    const availableCapacity = Math.max(
      0,
      totalCapacity - totalActiveEntrepreneurs
    );

    return {
      total: coaches.length,
      available,
      busy,
      totalActiveEntrepreneurs,
      totalCapacity,
      availableCapacity,
    };
  }, [coaches]);

  const filteredCoaches = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return coaches.filter((coach) => {
      const matchesStatus =
        statusFilter === "all" || coach.status === statusFilter;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        coach.fullName.toLowerCase().includes(normalizedSearch) ||
        coach.coachCode.toLowerCase().includes(normalizedSearch) ||
        coach.email?.toLowerCase().includes(normalizedSearch);

      return matchesStatus && Boolean(matchesSearch);
    });
  }, [coaches, searchTerm, statusFilter]);

  async function updateCoachStatus(
    coachId: string,
    status: CoachStatus
  ) {
    try {
      setUpdatingCoachId(coachId);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/admin/coaches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coachId,
          status,
        }),
      });

      const result = (await response.json()) as CoachApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to update coach status."
        );
      }

      setCoaches((currentCoaches) =>
        currentCoaches.map((coach) =>
          coach.id === coachId
            ? {
                ...coach,
                status,
              }
            : coach
        )
      );

      setSuccessMessage("Coach status updated successfully.");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update coach status.";

      setError(message);
    } finally {
      setUpdatingCoachId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-700" />

            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">
                Loading Coach Management Center
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Retrieving the official EPEW coach directory.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
                EPEW – EDE – IBOS
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Coach Management Center
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                Manage the official coach directory, monitor workload,
                control availability, and prepare entrepreneurs for
                assignment.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadCoaches(true)}
              disabled={refreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh Directory
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">Coach Center Error</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Official Coaches"
            value={statistics.total}
            subtitle="Registered in directory"
            icon={<Users className="h-6 w-6" />}
          />

          <StatCard
            title="Available"
            value={statistics.available}
            subtitle="Accepting assignments"
            icon={<UserCheck className="h-6 w-6" />}
          />

          <StatCard
            title="Busy"
            value={statistics.busy}
            subtitle="Limited availability"
            icon={<Activity className="h-6 w-6" />}
          />

          <StatCard
            title="Active Entrepreneurs"
            value={statistics.totalActiveEntrepreneurs}
            subtitle={`Across ${statistics.total} coaches`}
            icon={<BriefcaseBusiness className="h-6 w-6" />}
          />

          <StatCard
            title="Open Capacity"
            value={statistics.availableCapacity}
            subtitle={`Maximum ${statistics.totalCapacity}`}
            icon={<ShieldCheck className="h-6 w-6" />}
          />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Official Coach Directory
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search coaches and manage their current assignment
                availability.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block">
                <span className="sr-only">Search coaches</span>

                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search coach..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:w-64"
                />
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as CoachStatus | "all"
                  )
                }
                className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All statuses</option>

                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {filteredCoaches.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" />

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No coaches found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              No coach matches the current search or status filter.
            </p>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {filteredCoaches.map((coach) => (
              <CoachCardItem
                key={coach.id}
                coach={coach}
                updating={updatingCoachId === coach.id}
                onStatusChange={updateCoachStatus}
              />
            ))}
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-700 p-3 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-emerald-950">
                Assignment Readiness
              </h2>

              <p className="mt-1 text-sm leading-6 text-emerald-900">
                Coaches marked Available may receive automatic
                assignments when automatic assignment is enabled. The
                system should select the eligible coach with the lowest
                active workload and available capacity.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
          {icon}
        </div>
      </div>
    </article>
  );
}

function CoachCardItem({
  coach,
  updating,
  onStatusChange,
}: {
  coach: CoachCard;
  updating: boolean;
  onStatusChange: (
    coachId: string,
    status: CoachStatus
  ) => Promise<void>;
}) {
  const workload = clampPercentage(coach.workloadPercentage);
  const remainingCapacity = Math.max(
    0,
    coach.maximumCapacity - coach.activeEntrepreneurCount
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-2 bg-slate-950" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {coach.photoUrl ? (
              <img
                src={coach.photoUrl}
                alt={coach.fullName}
                className="h-14 w-14 shrink-0 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-emerald-800">
                {getInitials(coach.fullName)}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-950">
                {coach.fullName}
              </h3>

              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {coach.coachCode}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClasses(
              coach.status
            )}`}
          >
            {getStatusLabel(coach.status)}
          </span>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">
              Active entrepreneurs
            </span>

            <span className="font-bold text-slate-900">
              {coach.activeEntrepreneurCount}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">
              Maximum capacity
            </span>

            <span className="font-bold text-slate-900">
              {coach.maximumCapacity}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">
              Remaining capacity
            </span>

            <span className="font-bold text-slate-900">
              {remainingCapacity}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-600">
              Workload
            </span>

            <span className="font-bold text-slate-900">
              {workload}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
              style={{
                width: `${workload}%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {getWorkloadMessage(workload)}
          </p>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Coach Status
            </span>

            <div className="relative">
              <select
                value={coach.status}
                disabled={updating}
                onChange={(event) =>
                  void onStatusChange(
                    coach.id,
                    event.target.value as CoachStatus
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {updating ? (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-700" />
              ) : null}
            </div>
          </label>
        </div>

        {coach.email ? (
          <p className="mt-4 truncate text-xs text-slate-500">
            {coach.email}
          </p>
        ) : (
          <p className="mt-4 text-xs font-medium text-amber-700">
            Email not recorded
          </p>
        )}
      </div>
    </article>
  );
}