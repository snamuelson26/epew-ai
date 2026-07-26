"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
Archive,
BarChart3,
Bot,
Building2,
ContactRound,
MailCheck,
Radio,
UsersRound,
CalendarDays,
CheckCircle2,
ChevronLeft,
ChevronRight,
CircleAlert,
Download,
Filter,
FolderKanban,
Globe2,
LayoutGrid,
List,
Loader2,
Mail,
MessageCircle,
MessageSquare,
MoreHorizontal,
Plus,
RefreshCw,
Search,
Send,
ShieldCheck,
Smartphone,
Sparkles,
Trash2,
Users,
WandSparkles,
X,
} from "lucide-react";

import {
  archiveCommunicationGroup,
  deleteCommunicationGroup,
  getCommunicationGroups,
  restoreCommunicationGroup,
} from "@/lib/communication/groups";

import { HeroSection } from "@/app/components/enterprise/layout/HeroSection";
import { KpiCard, KpiGrid } from "@/app/components/enterprise/kpi";
import { EnterpriseOverview } from "@/app/components/enterprise/overview";

import type {
  CommunicationGroupFilters,
  CommunicationGroupListItem,
  CommunicationGroupMode,
  CommunicationGroupQueryResult,
  CommunicationGroupSort,
  CommunicationGroupStatus,
} from "@/lib/types/communication-groups";

import {
  COMMUNICATION_CHANNEL_OPTIONS,
  COMMUNICATION_GROUP_MODE_OPTIONS,
  COMMUNICATION_GROUP_TYPE_OPTIONS,
  COMMUNICATION_LANGUAGE_OPTIONS,
  COMMUNICATION_STATUS_OPTIONS,
  formatCommunicationChannel,
  formatCommunicationGroupMode,
  formatCommunicationGroupType,
  formatCommunicationLanguage,
} from "@/lib/types/communication-groups";

// ============================================================
// TYPES
// ============================================================

type ViewMode = "table" | "cards";

interface ActionMenuState {
  groupId: string | null;
}

interface NoticeState {
  type: "success" | "error";
  message: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const PAGE_SIZE = 12;

const INITIAL_FILTERS: CommunicationGroupFilters = {
  search: "",
  group_type: "all",
  group_mode: "all",
  status: "all",
  preferred_channel: "all",
  preferred_language: "all",
  partner_code: "all",
  campaign_ready: "all",
};

const INITIAL_SORT: CommunicationGroupSort = {
  field: "created_at",
  direction: "desc",
};

// ============================================================
// PAGE
// ============================================================

export default function CommunicationGroupsPage() {
  const [result, setResult] =
    useState<CommunicationGroupQueryResult | null>(null);

  const [filters, setFilters] =
    useState<CommunicationGroupFilters>(INITIAL_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<CommunicationGroupFilters>(INITIAL_FILTERS);

  const [sort, setSort] =
    useState<CommunicationGroupSort>(INITIAL_SORT);

  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  const [actionMenu, setActionMenu] =
    useState<ActionMenuState>({
      groupId: null,
    });

  const [processingGroupId, setProcessingGroupId] =
    useState<string | null>(null);

  const [notice, setNotice] = useState<NoticeState | null>(null);

  // ==========================================================
  // DATA LOADING
  // ==========================================================

  const loadGroups = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getCommunicationGroups({
        filters: appliedFilters,
        sort,
        page,
        pageSize: PAGE_SIZE,
      });

      if (!response.success || !response.data) {
        setNotice({
          type: "error",
          message:
            response.error ??
            "The Communication Groups Center could not be loaded.",
        });

        setResult(null);
      } else {
        setResult(response.data);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [appliedFilters, page, sort],
  );

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    const closeMenu = () => {
      setActionMenu({
        groupId: null,
      });
    };

    window.addEventListener("click", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, []);

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const groups = result?.groups ?? [];
  const statistics = result?.statistics;
  const pagination = result?.pagination;

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (appliedFilters.search) count += 1;

    if (
      appliedFilters.group_type &&
      appliedFilters.group_type !== "all"
    ) {
      count += 1;
    }

    if (
      appliedFilters.group_mode &&
      appliedFilters.group_mode !== "all"
    ) {
      count += 1;
    }

    if (
      appliedFilters.status &&
      appliedFilters.status !== "all"
    ) {
      count += 1;
    }

    if (
      appliedFilters.preferred_channel &&
      appliedFilters.preferred_channel !== "all"
    ) {
      count += 1;
    }

    if (
      appliedFilters.preferred_language &&
      appliedFilters.preferred_language !== "all"
    ) {
      count += 1;
    }

    if (
      typeof appliedFilters.campaign_ready === "boolean"
    ) {
      count += 1;
    }

    return count;
  }, [appliedFilters]);

  // ==========================================================
  // ACTIONS
  // ==========================================================

  function applyFilters() {
    setPage(1);
    setAppliedFilters(filters);
    setShowFilters(false);
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setPage(1);
    setShowFilters(false);
  }

  function updateSearch(value: string) {
    setFilters((current) => ({
      ...current,
      search: value,
    }));
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters((current) => ({
      ...current,
      search: filters.search,
    }));
  }

  async function handleArchive(group: CommunicationGroupListItem) {
    setProcessingGroupId(group.id);
    setActionMenu({
      groupId: null,
    });

    const response = await archiveCommunicationGroup(group.id);

    if (response.success) {
      setNotice({
        type: "success",
        message: `${group.name} was archived.`,
      });

      await loadGroups(true);
    } else {
      setNotice({
        type: "error",
        message:
          response.error ??
          "The communication group could not be archived.",
      });
    }

    setProcessingGroupId(null);
  }

  async function handleRestore(group: CommunicationGroupListItem) {
    setProcessingGroupId(group.id);
    setActionMenu({
      groupId: null,
    });

    const response = await restoreCommunicationGroup(group.id);

    if (response.success) {
      setNotice({
        type: "success",
        message: `${group.name} was restored.`,
      });

      await loadGroups(true);
    } else {
      setNotice({
        type: "error",
        message:
          response.error ??
          "The communication group could not be restored.",
      });
    }

    setProcessingGroupId(null);
  }

  async function handleDelete(group: CommunicationGroupListItem) {
    if (
      !window.confirm(
        `Delete "${group.name}" permanently?\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    setProcessingGroupId(group.id);
    setActionMenu({
      groupId: null,
    });

    const response = await deleteCommunicationGroup(group.id);

    if (response.success) {
      setNotice({
        type: "success",
        message: `${group.name} was deleted.`,
      });

      await loadGroups(true);
    } else {
      setNotice({
        type: "error",
        message:
          response.error ??
          "The communication group could not be deleted.",
      });
    }

    setProcessingGroupId(null);
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

        <div className="mx-auto max-w-7xl px-6 pt-8">
  <HeroSection
    badge={{
      label: "Enterprise Communication Center",
      icon: <Sparkles className="h-4 w-4" />,
    }}
    eyebrow="EPEW-EDE-IBOS"
    title="Communication Groups"
    description="Create, organize, automate, and manage official communication groups across the EPEW Enterprise ecosystem."
    variant="emerald"
    actions={[
      {
        label: "Create Group",
        icon: <Plus className="h-4 w-4" />,
        variant: "primary",
      },
      {
        label: "Analytics",
        icon: <BarChart3 className="h-4 w-4" />,
        variant: "secondary",
      },
      {
        label: "Refresh",
        icon: <RefreshCw className="h-4 w-4" />,
        onClick: () => window.location.reload(),
        variant: "ghost",
      },
    ]}
  />

  <div className="mt-8">
    <KpiGrid columns={4}>
      <KpiCard
        title="Communication Groups"
        value={8}
        icon={<Users className="h-6 w-6" />}
        variant="emerald"
        status="healthy"
        description="Official communication groups"
        trend={{
          direction: "up",
          value: "+2",
          label: "This Week",
        }}
      />

      <KpiCard
        title="Total Members"
        value="12,845"
        icon={<MessageSquare className="h-6 w-6" />}
        variant="blue"
        status="excellent"
        description="Active members"
        trend={{
          direction: "up",
          value: "14%",
        }}
      />

      <KpiCard
        title="Campaigns"
        value="26"
        icon={<Send className="h-6 w-6" />}
        variant="gold"
        status="healthy"
        description="Campaigns created"
      />

      <KpiCard
        title="Ready to Send"
        value="7"
        icon={<CheckCircle2 className="h-6 w-6" />}
        variant="purple"
        status="excellent"
        description="Approved campaigns"
      />
    </KpiGrid>
  </div>
</div>

<div className="mx-auto mt-8 max-w-7xl px-6">
  <EnterpriseOverview
    title="Communication Overview"
    description="Current communication capacity, audience readiness, and system operations across the EPEW ecosystem."
    eyebrow="Enterprise Operational Summary"
    badge="Live"
    columns={6}
    items={[
      {
        label: "Official Contacts",
        value: "12,845",
        description: "Approved communication contacts",
        icon: <ContactRound className="h-5 w-5" />,
        variant: "emerald",
        status: "healthy",
        trend: "+248 this week",
      },
      {
        label: "Organizations",
        value: 317,
        description: "Registered entities and churches",
        icon: <Building2 className="h-5 w-5" />,
        variant: "blue",
        status: "active",
      },
      {
        label: "Campaigns",
        value: 26,
        description: "Created communication campaigns",
        icon: <Radio className="h-5 w-5" />,
        variant: "gold",
        status: "healthy",
      },
      {
        label: "Messages Delivered",
        value: "182,417",
        description: "Successfully delivered messages",
        icon: <MailCheck className="h-5 w-5" />,
        variant: "purple",
        status: "excellent",
      },
      {
        label: "Automation",
        value: "Operational",
        description: "Communication workflows active",
        icon: <Bot className="h-5 w-5" />,
        variant: "emerald",
        status: "healthy",
      },
      {
        label: "Audience Reach",
        value: "94%",
        description: "Contacts available for campaigns",
        icon: <UsersRound className="h-5 w-5" />,
        variant: "blue",
        status: "excellent",
      },
    ]}
  />
</div>
      {/* ====================================================
          HERO
      ==================================================== */}

      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-[1600px] px-5 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                <Users className="h-4 w-4" />
                Enterprise Communication Center
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Communication Groups
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Organize every contact into intelligent, reusable
                audiences for SMS, WhatsApp, email, event invitations,
                automated reminders, and enterprise campaigns.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/communication-center/groups/create"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400"
              >
                <Plus className="h-5 w-5" />
                Create Group
              </Link>

              <Link
                href="/admin/communication-center/groups/create?mode=smart"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm font-bold text-amber-200 transition hover:bg-amber-400/20"
              >
                <WandSparkles className="h-5 w-5" />
                Smart Group Wizard
              </Link>

              <button
                type="button"
                onClick={() => void loadGroups(true)}
                disabled={refreshing}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-5 w-5 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1600px] space-y-8 px-5 py-8 sm:px-8 lg:px-10">
        {/* ==================================================
            NOTICE
        ================================================== */}

        {notice ? (
          <div
            className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${
              notice.type === "success"
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                : "border-red-400/25 bg-red-400/10 text-red-100"
            }`}
          >
            <div className="flex items-start gap-3">
              {notice.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              )}

              <p className="text-sm font-semibold">{notice.message}</p>
            </div>

            <button
              type="button"
              onClick={() => setNotice(null)}
              className="rounded-lg p-1 transition hover:bg-white/10"
              aria-label="Dismiss message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatisticCard
            label="Total Groups"
            value={statistics?.total_groups ?? 0}
            icon={FolderKanban}
          />

          <StatisticCard
            label="Smart Groups"
            value={statistics?.smart_groups ?? 0}
            icon={Sparkles}
          />

          <StatisticCard
            label="Static Groups"
            value={statistics?.static_groups ?? 0}
            icon={Users}
          />

          <StatisticCard
            label="Active Memberships"
            value={statistics?.total_memberships ?? 0}
            icon={ShieldCheck}
          />

          <StatisticCard
            label="Campaign Ready"
            value={statistics?.campaign_ready_groups ?? 0}
            icon={Send}
          />

          <StatisticCard
            label="New This Week"
            value={statistics?.new_groups_this_week ?? 0}
            icon={CalendarDays}
          />
        </section>

        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                Quick Actions
              </p>

              <h2 className="mt-1 text-xl font-black text-white">
                Group Management Tools
              </h2>
            </div>

            <Link
              href="/admin/communication-center/assistant"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300 transition hover:text-emerald-200"
            >
              <Bot className="h-4 w-4" />
              Open Communication Assistant
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <QuickAction
              href="/admin/communication-center/groups/create"
              label="Create Group"
              icon={Plus}
            />

            <QuickAction
              href="/admin/communication-center/contacts"
              label="Import Members"
              icon={Download}
            />

            <QuickAction
              href="/admin/communication-center/groups/create?mode=smart"
              label="Smart Wizard"
              icon={WandSparkles}
            />

            <QuickAction
              href="/admin/communication-center/contacts?review=duplicates"
              label="Duplicates"
              icon={Users}
            />

            <QuickAction
              href="/admin/communication-center/groups/merge"
              label="Merge Groups"
              icon={FolderKanban}
            />

            <QuickAction
              href="/admin/communication-center/groups/export"
              label="Export"
              icon={Download}
            />

            <QuickAction
              href="/admin/communication-center/assistant"
              label="Assistant"
              icon={Bot}
            />
          </div>
        </section>

        {/* ==================================================
            SEARCH AND TOOLBAR
        ================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/10">
          <div className="border-b border-white/10 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <form
                onSubmit={submitSearch}
                className="flex w-full max-w-2xl items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    type="search"
                    value={filters.search ?? ""}
                    onChange={(event) =>
                      updateSearch(event.target.value)
                    }
                    placeholder="Search group name, description, or slug..."
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10"
                  />
                </div>

                <button
                  type="submit"
                  className="h-12 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-slate-200"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters((value) => !value)}
                  className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <Filter className="h-4 w-4" />
                  Filters

                  {activeFilterCount > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[10px] font-black text-slate-950">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>

                <select
                  value={`${sort.field}:${sort.direction}`}
                  onChange={(event) => {
                    const [field, direction] =
                      event.target.value.split(":");

                    setSort({
                      field:
                        field as CommunicationGroupSort["field"],
                      direction:
                        direction as CommunicationGroupSort["direction"],
                    });

                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-white/10 bg-slate-900 px-4 text-sm font-semibold text-white outline-none"
                >
                  <option value="created_at:desc">
                    Newest First
                  </option>
                  <option value="created_at:asc">
                    Oldest First
                  </option>
                  <option value="name:asc">Name A–Z</option>
                  <option value="name:desc">Name Z–A</option>
                  <option value="member_count:desc">
                    Most Members
                  </option>
                  <option value="member_count:asc">
                    Fewest Members
                  </option>
                  <option value="updated_at:desc">
                    Recently Updated
                  </option>
                </select>

                <div className="flex rounded-xl border border-white/10 bg-slate-900 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`rounded-lg p-2 transition ${
                      viewMode === "table"
                        ? "bg-emerald-400 text-slate-950"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                    aria-label="Table view"
                  >
                    <List className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    className={`rounded-lg p-2 transition ${
                      viewMode === "cards"
                        ? "bg-emerald-400 text-slate-950"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                    aria-label="Card view"
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {showFilters ? (
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                onApply={applyFilters}
                onClear={clearFilters}
              />
            ) : null}
          </div>

          {/* ==================================================
              CONTENT
          ================================================== */}

          {loading ? (
            <LoadingState />
          ) : groups.length === 0 ? (
            <EmptyState
              hasFilters={activeFilterCount > 0}
              onClear={clearFilters}
            />
          ) : viewMode === "table" ? (
            <GroupsTable
              groups={groups}
              actionMenu={actionMenu}
              setActionMenu={setActionMenu}
              processingGroupId={processingGroupId}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onDelete={handleDelete}
            />
          ) : (
            <GroupsGrid
              groups={groups}
              actionMenu={actionMenu}
              setActionMenu={setActionMenu}
              processingGroupId={processingGroupId}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onDelete={handleDelete}
            />
          )}

          {/* ==================================================
              PAGINATION
          ================================================== */}

          {pagination && groups.length > 0 ? (
            <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-400">
                Showing{" "}
                <span className="font-bold text-white">
                  {(pagination.page - 1) * pagination.pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-white">
                  {Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.total,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-bold text-white">
                  {pagination.total}
                </span>{" "}
                groups
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    pagination.page >= pagination.totalPages
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        pagination.totalPages,
                        current + 1,
                      ),
                    )
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

// ============================================================
// STATISTIC CARD
// ============================================================

function StatisticCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black text-white">
            {value.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-emerald-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-24 flex-col justify-between rounded-xl border border-white/10 bg-slate-950/50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/25 hover:bg-emerald-400/5"
    >
      <Icon className="h-5 w-5 text-emerald-300 transition group-hover:scale-110" />

      <span className="mt-4 text-sm font-bold text-slate-200">
        {label}
      </span>
    </Link>
  );
}

// ============================================================
// FILTER PANEL
// ============================================================

function FilterPanel({
  filters,
  setFilters,
  onApply,
  onClear,
}: {
  filters: CommunicationGroupFilters;
  setFilters: React.Dispatch<
    React.SetStateAction<CommunicationGroupFilters>
  >;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FilterSelect
          label="Group Type"
          value={filters.group_type ?? "all"}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              group_type:
                value as CommunicationGroupFilters["group_type"],
            }))
          }
          options={[
            {
              label: "All Types",
              value: "all",
            },
            ...COMMUNICATION_GROUP_TYPE_OPTIONS,
          ]}
        />

        <FilterSelect
          label="Group Mode"
          value={filters.group_mode ?? "all"}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              group_mode:
                value as CommunicationGroupFilters["group_mode"],
            }))
          }
          options={[
            {
              label: "All Modes",
              value: "all",
            },
            ...COMMUNICATION_GROUP_MODE_OPTIONS,
          ]}
        />

        <FilterSelect
          label="Status"
          value={filters.status ?? "all"}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              status:
                value as CommunicationGroupFilters["status"],
            }))
          }
          options={[
            {
              label: "All Statuses",
              value: "all",
            },
            ...COMMUNICATION_STATUS_OPTIONS,
          ]}
        />

        <FilterSelect
          label="Channel"
          value={filters.preferred_channel ?? "all"}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              preferred_channel:
                value as CommunicationGroupFilters["preferred_channel"],
            }))
          }
          options={COMMUNICATION_CHANNEL_OPTIONS}
        />

        <FilterSelect
          label="Language"
          value={filters.preferred_language ?? "all"}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              preferred_language:
                value as CommunicationGroupFilters["preferred_language"],
            }))
          }
          options={[
            {
              label: "All Languages",
              value: "all",
            },
            ...COMMUNICATION_LANGUAGE_OPTIONS,
          ]}
        />

        <FilterSelect
          label="Campaign Ready"
          value={
            typeof filters.campaign_ready === "boolean"
              ? String(filters.campaign_ready)
              : "all"
          }
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              campaign_ready:
                value === "all" ? "all" : value === "true",
            }))
          }
          options={[
            {
              label: "All Groups",
              value: "all",
            },
            {
              label: "Campaign Ready",
              value: "true",
            },
            {
              label: "Not Ready",
              value: "false",
            },
          ]}
        />
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Clear Filters
        </button>

        <button
          type="button"
          onClick={onApply}
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    label: string;
    value: string;
  }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-400/40"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ============================================================
// TABLE VIEW
// ============================================================

function GroupsTable({
  groups,
  actionMenu,
  setActionMenu,
  processingGroupId,
  onArchive,
  onRestore,
  onDelete,
}: {
  groups: CommunicationGroupListItem[];
  actionMenu: ActionMenuState;
  setActionMenu: React.Dispatch<
    React.SetStateAction<ActionMenuState>
  >;
  processingGroupId: string | null;
  onArchive: (group: CommunicationGroupListItem) => void;
  onRestore: (group: CommunicationGroupListItem) => void;
  onDelete: (group: CommunicationGroupListItem) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1250px] w-full">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.025] text-left">
            <TableHeading>Group</TableHeading>
            <TableHeading>Type</TableHeading>
            <TableHeading>Members</TableHeading>
            <TableHeading>Channel</TableHeading>
            <TableHeading>Language</TableHeading>
            <TableHeading>Status</TableHeading>
            <TableHeading>Last Campaign</TableHeading>
            <TableHeading>Created</TableHeading>
            <TableHeading align="right">Actions</TableHeading>
          </tr>
        </thead>

        <tbody>
          {groups.map((group) => (
            <tr
              key={group.id}
              className="border-b border-white/5 transition hover:bg-white/[0.035]"
            >
              <td className="px-5 py-5">
                <div className="flex min-w-64 items-start gap-3">
                  <GroupModeIcon mode={group.group_mode} />

                  <div>
                    <Link
                      href={`/admin/communication-center/groups/${group.id}`}
                      className="font-black text-white transition hover:text-emerald-300"
                    >
                      {group.name}
                    </Link>

                    <p className="mt-1 line-clamp-1 max-w-sm text-xs text-slate-500">
                      {group.description ||
                        "No description has been provided."}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.is_system_group ? (
                        <MiniBadge label="System" />
                      ) : null}

                      {group.is_protected ? (
                        <MiniBadge label="Protected" />
                      ) : null}

                      {(group.active_rule_count ?? 0) > 0 ? (
                        <MiniBadge
                          label={`${group.active_rule_count} active ${
                            group.active_rule_count === 1
                              ? "rule"
                              : "rules"
                          }`}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-5 py-5">
                <span className="text-sm font-semibold text-slate-300">
                  {formatCommunicationGroupType(group.group_type)}
                </span>

                <p className="mt-1 text-xs text-slate-500">
                  {formatCommunicationGroupMode(group.group_mode)}
                </p>
              </td>

              <td className="px-5 py-5">
                <p className="text-lg font-black text-white">
                  {group.member_count.toLocaleString()}
                </p>

                <p
                  className={`mt-1 text-xs font-bold ${
                    group.campaign_ready
                      ? "text-emerald-300"
                      : "text-amber-300"
                  }`}
                >
                  {group.campaign_ready
                    ? "Campaign ready"
                    : "Preparation required"}
                </p>
              </td>

              <td className="px-5 py-5">
                <ChannelBadge channel={group.preferred_channel} />
              </td>

              <td className="px-5 py-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Globe2 className="h-4 w-4 text-slate-500" />
                  {formatCommunicationLanguage(
                    group.preferred_language,
                  )}
                </div>
              </td>

              <td className="px-5 py-5">
                <StatusBadge status={group.status} />
              </td>

              <td className="px-5 py-5">
                {group.last_campaign_name ? (
                  <div>
                    <p className="max-w-48 truncate text-sm font-bold text-slate-200">
                      {group.last_campaign_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(group.last_campaign_date)}
                    </p>
                  </div>
                ) : (
                  <span className="text-sm text-slate-600">
                    No campaigns
                  </span>
                )}
              </td>

              <td className="px-5 py-5">
                <p className="text-sm font-semibold text-slate-300">
                  {formatDate(group.created_at)}
                </p>
              </td>

              <td className="relative px-5 py-5 text-right">
                <GroupActionMenu
                  group={group}
                  isOpen={actionMenu.groupId === group.id}
                  isProcessing={processingGroupId === group.id}
                  onToggle={(event) => {
                    event.stopPropagation();

                    setActionMenu((current) => ({
                      groupId:
                        current.groupId === group.id
                          ? null
                          : group.id,
                    }));
                  }}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableHeading({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

// ============================================================
// CARD VIEW
// ============================================================

function GroupsGrid({
  groups,
  actionMenu,
  setActionMenu,
  processingGroupId,
  onArchive,
  onRestore,
  onDelete,
}: {
  groups: CommunicationGroupListItem[];
  actionMenu: ActionMenuState;
  setActionMenu: React.Dispatch<
    React.SetStateAction<ActionMenuState>
  >;
  processingGroupId: string | null;
  onArchive: (group: CommunicationGroupListItem) => void;
  onRestore: (group: CommunicationGroupListItem) => void;
  onDelete: (group: CommunicationGroupListItem) => void;
}) {
  return (
    <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <article
          key={group.id}
          className="relative rounded-2xl border border-white/10 bg-slate-950/55 p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/20"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <GroupModeIcon mode={group.group_mode} />

              <div>
                <Link
                  href={`/admin/communication-center/groups/${group.id}`}
                  className="text-lg font-black text-white transition hover:text-emerald-300"
                >
                  {group.name}
                </Link>

                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {formatCommunicationGroupType(group.group_type)}
                </p>
              </div>
            </div>

            <GroupActionMenu
              group={group}
              isOpen={actionMenu.groupId === group.id}
              isProcessing={processingGroupId === group.id}
              onToggle={(event) => {
                event.stopPropagation();

                setActionMenu((current) => ({
                  groupId:
                    current.groupId === group.id ? null : group.id,
                }));
              }}
              onArchive={onArchive}
              onRestore={onRestore}
              onDelete={onDelete}
            />
          </div>

          <p className="mt-5 min-h-12 line-clamp-2 text-sm leading-6 text-slate-400">
            {group.description ||
              "No description has been provided for this communication group."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <CardMetric
              label="Members"
              value={group.member_count.toLocaleString()}
            />

            <CardMetric
              label="Active Rules"
              value={String(group.active_rule_count ?? 0)}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ChannelBadge channel={group.preferred_channel} />
            <StatusBadge status={group.status} />

            {group.is_protected ? (
              <MiniBadge label="Protected" />
            ) : null}
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-500">Language</span>

              <span className="font-bold text-slate-300">
                {formatCommunicationLanguage(
                  group.preferred_language,
                )}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-500">Campaign Readiness</span>

              <span
                className={`font-bold ${
                  group.campaign_ready
                    ? "text-emerald-300"
                    : "text-amber-300"
                }`}
              >
                {group.campaign_ready ? "Ready" : "Action Required"}
              </span>
            </div>
          </div>

          <Link
            href={`/admin/communication-center/groups/${group.id}`}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:border-emerald-400/25 hover:bg-emerald-400/10 hover:text-emerald-200"
          >
            Open Group
          </Link>
        </article>
      ))}
    </div>
  );
}

function CardMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

// ============================================================
// ACTION MENU
// ============================================================

function GroupActionMenu({
  group,
  isOpen,
  isProcessing,
  onToggle,
  onArchive,
  onRestore,
  onDelete,
}: {
  group: CommunicationGroupListItem;
  isOpen: boolean;
  isProcessing: boolean;
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onArchive: (group: CommunicationGroupListItem) => void;
  onRestore: (group: CommunicationGroupListItem) => void;
  onDelete: (group: CommunicationGroupListItem) => void;
}) {
  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={onToggle}
        disabled={isProcessing}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Actions for ${group.name}`}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal className="h-5 w-5" />
        )}
      </button>

      {isOpen ? (
        <div
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-2 text-left shadow-2xl shadow-black/50"
        >
          <ActionLink
            href={`/admin/communication-center/groups/${group.id}`}
            label="Open Group"
            icon={FolderKanban}
          />

          <ActionLink
            href={`/admin/communication-center/groups/${group.id}/members`}
            label="Manage Members"
            icon={Users}
          />

          <ActionLink
            href={`/admin/communication-center/campaigns/create?groupId=${group.id}`}
            label="Create Campaign"
            icon={Send}
          />

          <ActionLink
            href={`/admin/communication-center/groups/${group.id}/analytics`}
            label="View Analytics"
            icon={LayoutGrid}
          />

          <div className="my-2 border-t border-white/10" />

          {group.status === "archived" ? (
            <ActionButton
              label="Restore Group"
              icon={RefreshCw}
              onClick={() => onRestore(group)}
            />
          ) : (
            <ActionButton
              label="Archive Group"
              icon={Archive}
              onClick={() => onArchive(group)}
              disabled={group.is_protected}
            />
          )}

          <ActionButton
            label="Delete Group"
            icon={Trash2}
            onClick={() => onDelete(group)}
            danger
            disabled={group.is_protected || group.is_system_group}
          />
        </div>
      ) : null}
    </div>
  );
}

function ActionLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-4 w-4 text-slate-500" />
      {label}
    </Link>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  danger = false,
  disabled = false,
}: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
        danger
          ? "text-red-300 hover:bg-red-400/10"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ============================================================
// BADGES AND ICONS
// ============================================================

function GroupModeIcon({
  mode,
}: {
  mode: CommunicationGroupMode;
}) {
  const configuration = {
    static: {
      icon: Users,
      className:
        "border-sky-400/20 bg-sky-400/10 text-sky-300",
    },
    smart: {
      icon: Sparkles,
      className:
        "border-amber-400/20 bg-amber-400/10 text-amber-300",
    },
    system: {
      icon: ShieldCheck,
      className:
        "border-purple-400/20 bg-purple-400/10 text-purple-300",
    },
  };

  const selected = configuration[mode];
  const Icon = selected.icon;

  return (
    <div
      className={`rounded-xl border p-3 ${selected.className}`}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: CommunicationGroupStatus;
}) {
  const classes: Record<CommunicationGroupStatus, string> = {
    active:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    draft:
      "border-amber-400/20 bg-amber-400/10 text-amber-300",
    inactive:
      "border-slate-400/20 bg-slate-400/10 text-slate-300",
    archived:
      "border-red-400/20 bg-red-400/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function ChannelBadge({
  channel,
}: {
  channel: CommunicationGroupListItem["preferred_channel"];
}) {
  const Icon =
    channel === "sms"
      ? Smartphone
      : channel === "whatsapp"
        ? MessageCircle
        : channel === "email"
          ? Mail
          : Send;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-black text-sky-300">
      <Icon className="h-3.5 w-3.5" />
      {formatCommunicationChannel(channel)}
    </span>
  );
}

function MiniBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
      {label}
    </span>
  );
}

// ============================================================
// STATES
// ============================================================

function LoadingState() {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center gap-4 px-5 py-16 text-center">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-300">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>

      <div>
        <p className="font-black text-white">
          Loading communication groups
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Preparing audiences, statistics, and campaign readiness.
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center px-5 py-16 text-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-400">
        <Users className="h-10 w-10" />
      </div>

      <h3 className="mt-5 text-xl font-black text-white">
        {hasFilters
          ? "No groups match these filters"
          : "No communication groups found"}
      </h3>

      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {hasFilters
          ? "Change or clear the current filters to display additional communication groups."
          : "Create the first reusable audience for SMS, WhatsApp, email, reminders, or event invitations."}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Clear Filters
          </button>
        ) : null}

        <Link
          href="/admin/communication-center/groups/create"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// UTILITIES
// ============================================================

function formatDate(value?: string | null): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}