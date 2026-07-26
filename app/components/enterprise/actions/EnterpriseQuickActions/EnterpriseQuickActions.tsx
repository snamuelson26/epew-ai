"use client";

import { ActionGroup } from "./ActionGroup";

import {
  ENTERPRISE_ACTION_EMPTY_MESSAGE,
  ENTERPRISE_ACTION_GRID_CLASSES,
  ENTERPRISE_ACTION_LOADING_ITEMS,
} from "./constants";

import {
  countActions,
  getActionGroupKey,
  mergeActionClasses,
  prepareActionGroups,
} from "./helpers";

import type {
  EnterpriseQuickActionsProps,
} from "./types";

type EnterpriseQuickActionsComponentProps =
  EnterpriseQuickActionsProps & {
    grantedPermissions?: string[];
    title?: string;
    description?: string;
    showActionCount?: boolean;
  };

export function EnterpriseQuickActions({
  groups,
  loading = false,
  className,
  columns = 3,
  showDescriptions = true,
  showCategoryTitles = true,
  emptyMessage = ENTERPRISE_ACTION_EMPTY_MESSAGE,
  grantedPermissions,
  title = "Quick Actions",
  description = "Access the most important administrative tools and workflows.",
  showActionCount = true,
}: EnterpriseQuickActionsComponentProps) {
  const preparedGroups = prepareActionGroups(
    groups,
    grantedPermissions,
  );

  const totalActions = countActions(preparedGroups);

  if (loading) {
    return (
      <section
        className={mergeActionClasses(
          "rounded-3xl border border-white/10 bg-white/[0.025] p-5 shadow-2xl shadow-black/10 sm:p-6",
          className,
        )}
        aria-busy="true"
        aria-label="Loading quick actions"
      >
        <QuickActionsHeader
          title={title}
          description={description}
          actionCount={0}
          showActionCount={false}
        />

        <div
          className={mergeActionClasses(
            "mt-6 grid gap-4",
            ENTERPRISE_ACTION_GRID_CLASSES[columns],
          )}
        >
          {Array.from({
            length: ENTERPRISE_ACTION_LOADING_ITEMS,
          }).map((_, index) => (
            <QuickActionSkeleton key={`quick-action-skeleton-${index}`} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className={mergeActionClasses(
        "rounded-3xl border border-white/10 bg-white/[0.025] p-5 shadow-2xl shadow-black/10 sm:p-6",
        className,
      )}
      aria-labelledby="enterprise-quick-actions-title"
    >
      <QuickActionsHeader
        title={title}
        description={description}
        actionCount={totalActions}
        showActionCount={showActionCount}
      />

      {preparedGroups.length === 0 ? (
        <QuickActionsEmptyState message={emptyMessage} />
      ) : (
        <div className="mt-7 space-y-8">
          {preparedGroups.map((group) => (
            <ActionGroup
              key={getActionGroupKey(group)}
              group={group}
              columns={columns}
              showDescription={showDescriptions}
              showCategoryTitle={showCategoryTitles}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface QuickActionsHeaderProps {
  title: string;
  description?: string;
  actionCount: number;
  showActionCount: boolean;
}

function QuickActionsHeader({
  title,
  description,
  actionCount,
  showActionCount,
}: QuickActionsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="enterprise-quick-actions-title"
            className="text-xl font-semibold tracking-tight text-white"
          >
            {title}
          </h2>

          {showActionCount ? (
            <span className="inline-flex min-h-6 items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              {actionCount}
            </span>
          ) : null}
        </div>

        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        ) : null}
      </div>

      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-slate-400">
        <span
          className="h-2 w-2 rounded-full bg-emerald-400"
          aria-hidden="true"
        />
        Enterprise tools
      </div>
    </div>
  );
}

interface QuickActionsEmptyStateProps {
  message: string;
}

function QuickActionsEmptyState({
  message,
}: QuickActionsEmptyStateProps) {
  return (
    <div className="mt-6 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-slate-400"
        aria-hidden="true"
      >
        +
      </div>

      <h3 className="mt-4 text-sm font-semibold text-white">
        No actions available
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        {message}
      </p>
    </div>
  );
}

function QuickActionSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-4"
      aria-hidden="true"
    >
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-white/[0.07]" />

        <div className="min-w-0 flex-1">
          <div className="h-4 w-2/5 rounded bg-white/[0.08]" />
          <div className="mt-3 h-3 w-full rounded bg-white/[0.05]" />
          <div className="mt-2 h-3 w-3/4 rounded bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}