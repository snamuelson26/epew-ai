"use client";

import { FilterDropdown } from "./FilterDropdown";
import { SearchInput } from "./SearchInput";
import { SortDropdown } from "./SortDropdown";
import { ToolbarButton } from "./ToolbarButton";
import { ViewSwitcher } from "./ViewSwitcher";

import {
  ENTERPRISE_SEARCH_DEFAULT_PLACEHOLDER,
  ENTERPRISE_TOOLBAR_CONTAINER_CLASSES,
  ENTERPRISE_TOOLBAR_LOADING_LABEL,
} from "./constants";

import {
  clearAllFilters,
  countActiveFilters,
  getFilterKey,
  getToolbarButtonKey,
  mergeToolbarClasses,
  prepareToolbarButtons,
} from "./helpers";

import type {
  EnterpriseSearchToolbarProps,
} from "./types";

type EnterpriseSearchToolbarComponentProps =
  EnterpriseSearchToolbarProps & {
    grantedPermissions?: string[];
    searchLoading?: boolean;
    searchDebounceMs?: number;
    disabled?: boolean;
    title?: string;
    description?: string;
    showClearFilters?: boolean;
  };

export function EnterpriseSearchToolbar({
  searchValue,
  onSearchChange,
  placeholder = ENTERPRISE_SEARCH_DEFAULT_PLACEHOLDER,
  filters = [],
  sortOptions = [],
  selectedSort = "",
  onSortChange,
  viewMode = "table",
  onViewChange,
  buttons = [],
  loading = false,
  className,
  showSearch = true,
  showFilters = true,
  showSorting = true,
  showViewSwitcher = true,
  showButtons = true,
  grantedPermissions,
  searchLoading = false,
  searchDebounceMs,
  disabled = false,
  title = "Search and Controls",
  description = "Search, filter, sort, and manage the current records.",
  showClearFilters = true,
}: EnterpriseSearchToolbarComponentProps) {
  const visibleButtons = prepareToolbarButtons(
    buttons,
    grantedPermissions,
  );

  const activeFilterCount =
    countActiveFilters(filters);

  const hasPrimaryControls =
    showSearch ||
    (showButtons && visibleButtons.length > 0);

  const hasSecondaryControls =
    (showFilters && filters.length > 0) ||
    (showSorting && sortOptions.length > 0) ||
    (showViewSwitcher && Boolean(onViewChange));

  function handleClearFilters(): void {
    if (disabled || loading) {
      return;
    }

    clearAllFilters(filters);
  }

  if (loading) {
    return (
      <section
        className={mergeToolbarClasses(
          ENTERPRISE_TOOLBAR_CONTAINER_CLASSES,
          className,
        )}
        aria-busy="true"
        aria-label={ENTERPRISE_TOOLBAR_LOADING_LABEL}
      >
        <ToolbarHeader
          title={title}
          description={description}
          activeFilterCount={0}
        />

        <ToolbarSkeleton />
      </section>
    );
  }

  return (
    <section
      className={mergeToolbarClasses(
        ENTERPRISE_TOOLBAR_CONTAINER_CLASSES,
        className,
      )}
      aria-labelledby="enterprise-search-toolbar-title"
    >
      <ToolbarHeader
        title={title}
        description={description}
        activeFilterCount={activeFilterCount}
      />

      {hasPrimaryControls ? (
        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          {showSearch ? (
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder={placeholder}
              debounceMs={searchDebounceMs}
              disabled={disabled}
              loading={searchLoading}
              className="w-full xl:max-w-2xl"
            />
          ) : null}

          {showButtons &&
          visibleButtons.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {visibleButtons.map((button) => (
                <ToolbarButton
                  key={getToolbarButtonKey(button)}
                  button={
                    disabled
                      ? {
                          ...button,
                          disabled: true,
                        }
                      : button
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasSecondaryControls ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {showFilters
              ? filters.map((filter) => (
                  <FilterDropdown
                    key={getFilterKey(filter)}
                    filter={filter}
                    disabled={disabled}
                  />
                ))
              : null}

            {showClearFilters &&
            activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={handleClearFilters}
                disabled={disabled}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-slate-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear filters
                <span className="ml-2 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold">
                  {activeFilterCount}
                </span>
              </button>
            ) : null}

            {showSorting &&
            sortOptions.length > 0 ? (
              <SortDropdown
                options={sortOptions}
                value={selectedSort}
                onChange={onSortChange}
                disabled={disabled}
              />
            ) : null}
          </div>

          {showViewSwitcher &&
          onViewChange ? (
            <ViewSwitcher
              value={viewMode}
              onChange={onViewChange}
              disabled={disabled}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

interface ToolbarHeaderProps {
  title: string;
  description?: string;
  activeFilterCount: number;
}

function ToolbarHeader({
  title,
  description,
  activeFilterCount,
}: ToolbarHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="enterprise-search-toolbar-title"
            className="text-lg font-semibold tracking-tight text-white"
          >
            {title}
          </h2>

          {activeFilterCount > 0 ? (
            <span className="inline-flex min-h-6 items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              {activeFilterCount} active
            </span>
          ) : null}
        </div>

        {description ? (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        ) : null}
      </div>

      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-slate-400">
        <span
          className="h-2 w-2 rounded-full bg-emerald-400"
          aria-hidden="true"
        />
        Enterprise controls
      </div>
    </div>
  );
}

function ToolbarSkeleton() {
  return (
    <div className="mt-5 animate-pulse space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="h-11 flex-1 rounded-xl bg-white/[0.06]" />

        <div className="flex gap-2">
          <div className="h-11 w-28 rounded-xl bg-white/[0.06]" />
          <div className="h-11 w-28 rounded-xl bg-white/[0.06]" />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="h-11 w-44 rounded-xl bg-white/[0.05]" />
          <div className="h-11 w-44 rounded-xl bg-white/[0.05]" />
          <div className="h-11 w-44 rounded-xl bg-white/[0.05]" />
        </div>

        <div className="h-11 w-48 rounded-xl bg-white/[0.05]" />
      </div>
    </div>
  );
}