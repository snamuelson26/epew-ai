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
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function SortDropdown({
  options,
  value = "",
  onChange,
  disabled = false,
  className,
  label = "Sort",
}: SortDropdownProps) {
  function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ): void {
    onChange?.(event.target.value);
  }

  return (
    <div
      className={mergeToolbarClasses(
        "relative min-w-[180px]",
        className,
      )}
    >
      <label
        htmlFor="enterprise-sort-dropdown"
        className="sr-only"
      >
        {label}
      </label>

      <select
        id="enterprise-sort-dropdown"
        value={value}
        onChange={handleChange}
        disabled={disabled || !onChange}
        className={mergeToolbarClasses(
          ENTERPRISE_TOOLBAR_CONTROL_CLASSES,
          "w-full appearance-none px-3 pr-9",
          value &&
            "border-sky-500/30 bg-sky-500/[0.08]",
          (disabled || !onChange) &&
            "cursor-not-allowed opacity-50",
        )}
        aria-label={label}
      >
        <option value="">
          {label}: Default
        </option>

        {options.map((option) => (
          <option
            key={`sort-${option.value}`}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
        aria-hidden="true"
      >
        ▼
      </span>
    </div>
  );
}