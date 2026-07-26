"use client";

import {
  ENTERPRISE_TOOLBAR_CONTROL_CLASSES,
} from "./constants";

import {
  mergeToolbarClasses,
} from "./helpers";

import type {
  EnterpriseSortOption,
} from "./types";

interface SortDropdownProps {
  options: EnterpriseSortOption[];
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function SortDropdown({
  options,
  value,
  onChange,
  disabled = false,
  className,
  label = "Sort by",
}: SortDropdownProps) {
  return (
    <label
      className={mergeToolbarClasses(
        "flex min-w-0 flex-col gap-1.5",
        className,
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        disabled={disabled || !onChange}
        aria-label={label}
        className={mergeToolbarClasses(
          ENTERPRISE_TOOLBAR_CONTROL_CLASSES,
          "min-w-44 cursor-pointer px-3",
        )}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}