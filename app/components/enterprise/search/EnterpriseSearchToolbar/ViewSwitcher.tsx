"use client";

import {
  ENTERPRISE_VIEW_MODE_ICONS,
  ENTERPRISE_VIEW_MODE_LABELS,
  ENTERPRISE_VIEW_MODES,
} from "./constants";

import {
  mergeToolbarClasses,
} from "./helpers";

import type {
  EnterpriseViewMode,
} from "./types";

interface ViewSwitcherProps {
  value?: EnterpriseViewMode;
  onChange?: (view: EnterpriseViewMode) => void;
  disabled?: boolean;
  className?: string;
}

export function ViewSwitcher({
  value = "table",
  onChange,
  disabled = false,
  className,
}: ViewSwitcherProps) {
  return (
    <div
      className={mergeToolbarClasses(
        "inline-flex items-center overflow-hidden rounded-xl border border-white/10 bg-black/20",
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
            onClick={() => onChange?.(mode)}
            title={ENTERPRISE_VIEW_MODE_LABELS[mode]}
            aria-label={ENTERPRISE_VIEW_MODE_LABELS[mode]}
            aria-pressed={active}
            className={mergeToolbarClasses(
              "flex min-h-11 min-w-11 items-center justify-center border-r border-white/10 px-3 text-sm transition-all duration-200 last:border-r-0",
              active
                ? "bg-emerald-500/15 text-emerald-300"
                : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
              disabled &&
                "cursor-not-allowed opacity-50",
            )}
          >
            <span
              className="text-base"
              aria-hidden="true"
            >
              {ENTERPRISE_VIEW_MODE_ICONS[mode]}
            </span>
          </button>
        );
      })}
    </div>
  );
}