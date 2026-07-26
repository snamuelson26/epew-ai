"use client";

import {
  ENTERPRISE_VIEW_MODE_ICONS,
  ENTERPRISE_VIEW_MODE_LABELS,
  ENTERPRISE_VIEW_MODES,
} from "./constants";

import { mergeToolbarClasses } from "./helpers";

import type { EnterpriseViewMode } from "./types";

interface ViewSwitcherProps {
  value: EnterpriseViewMode;
  onChange: (mode: EnterpriseViewMode) => void;
  disabled?: boolean;
  className?: string;
}

export function ViewSwitcher({
  value,
  onChange,
  disabled = false,
  className,
}: ViewSwitcherProps) {
  return (
    <div
      className={mergeToolbarClasses(
        "inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1",
        className,
      )}
      role="group"
      aria-label="View mode"
    >
      {ENTERPRISE_VIEW_MODES.map((mode) => {
        const active = value === mode;

        return (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mode)}
            aria-pressed={active}
            aria-label={ENTERPRISE_VIEW_MODE_LABELS[mode]}
            title={ENTERPRISE_VIEW_MODE_LABELS[mode]}
            className={mergeToolbarClasses(
              "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
              active
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:bg-white/10 hover:text-white",
              disabled &&
                "cursor-not-allowed opacity-50",
            )}
          >
            <span
              className="mr-1"
              aria-hidden="true"
            >
              {ENTERPRISE_VIEW_MODE_ICONS[mode]}
            </span>

            <span className="hidden lg:inline">
              {ENTERPRISE_VIEW_MODE_LABELS[mode]}
            </span>
          </button>
        );
      })}
    </div>
  );
}