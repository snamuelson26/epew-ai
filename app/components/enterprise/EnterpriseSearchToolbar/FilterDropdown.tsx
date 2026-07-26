"use client";

import {
  ENTERPRISE_TOOLBAR_CONTROL_CLASSES,
  ENTERPRISE_TOOLBAR_EMPTY_FILTER_LABEL,
} from "./constants";

import {
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
  const selectedValue = normalizeFilterValue(
    filter.value,
  );

  const isDisabled =
    disabled || Boolean(filter.disabled);

  return (
    <label
      className={mergeToolbarClasses(
        "flex min-w-0 flex-col gap-1.5",
        className,
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {filter.label}
      </span>

      <select
        value={selectedValue}
        onChange={(event) =>
          filter.onChange(event.target.value)
        }
        disabled={isDisabled}
        aria-label={
          filter.ariaLabel ??
          `Filter by ${filter.label}`
        }
        className={mergeToolbarClasses(
          ENTERPRISE_TOOLBAR_CONTROL_CLASSES,
          "min-w-44 cursor-pointer px-3",
        )}
      >
        <option
          value={normalizeFilterValue(
            filter.clearValue,
          )}
        >
          {filter.placeholder ??
            ENTERPRISE_TOOLBAR_EMPTY_FILTER_LABEL}
        </option>

        {filter.options.map((option) => (
          <option
            key={`${filter.id}-${option.value}`}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
            {option.count !== undefined
              ? ` (${option.count})`
              : ""}
          </option>
        ))}
      </select>
    </label>
  );
}