"use client";

import {
  ENTERPRISE_TOOLBAR_CONTROL_CLASSES,
  ENTERPRISE_TOOLBAR_EMPTY_FILTER_LABEL,
} from "./constants";

import {
  hasActiveFilter,
  mergeToolbarClasses,
  normalizeFilterValue,
} from "./helpers";

import type {
  EnterpriseFilter,
} from "./types";

interface FilterDropdownProps {
  filter: EnterpriseFilter;
  disabled?: boolean;
  className?: string;
}

export function FilterDropdown({
  filter,
  disabled = false,
  className,
}: FilterDropdownProps) {
  const selectedValues = normalizeFilterValue(
    filter.value,
  );

  const active = hasActiveFilter(filter);

  function handleSingleChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ): void {
    filter.onChange?.(event.target.value);
  }

  function handleMultipleChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ): void {
    const values = Array.from(
      event.target.selectedOptions,
    ).map((option) => option.value);

    filter.onChange?.(values);
  }

  return (
    <div
      className={mergeToolbarClasses(
        "relative min-w-[170px]",
        className,
      )}
    >
      <label
        htmlFor={`enterprise-filter-${filter.id}`}
        className="sr-only"
      >
        {filter.label}
      </label>

      <select
        id={`enterprise-filter-${filter.id}`}
        multiple={filter.multiple}
        value={
          filter.multiple
            ? selectedValues
            : selectedValues[0] ?? ""
        }
        onChange={
          filter.multiple
            ? handleMultipleChange
            : handleSingleChange
        }
        disabled={disabled || !filter.onChange}
        className={mergeToolbarClasses(
          ENTERPRISE_TOOLBAR_CONTROL_CLASSES,
          "w-full appearance-none px-3",
          filter.multiple
            ? "min-h-28 py-2"
            : "pr-9",
          active &&
            "border-emerald-500/30 bg-emerald-500/[0.08]",
          (disabled || !filter.onChange) &&
            "cursor-not-allowed opacity-50",
        )}
        aria-label={filter.label}
      >
        {!filter.multiple ? (
          <option value="">
            {filter.label}:{" "}
            {ENTERPRISE_TOOLBAR_EMPTY_FILTER_LABEL}
          </option>
        ) : null}

        {filter.options.map((option) => (
          <option
            key={`${filter.id}-${option.value}`}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {!filter.multiple ? (
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
          aria-hidden="true"
        >
          ▼
        </span>
      ) : null}

      {active ? (
        <span
          className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500 px-1 text-[9px] font-bold text-emerald-950"
          aria-label={`${selectedValues.length} selected`}
        >
          {selectedValues.length}
        </span>
      ) : null}
    </div>
  );
}