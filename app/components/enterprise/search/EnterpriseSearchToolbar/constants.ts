import type {
  EnterpriseToolbarButtonVariant,
  EnterpriseViewMode,
} from "./types";

/**
 * Enterprise Search Toolbar
 * Shared constants for the EPEW Enterprise Admin Design System.
 */

export const ENTERPRISE_SEARCH_DEFAULT_PLACEHOLDER =
  "Search records...";

export const ENTERPRISE_SEARCH_DEBOUNCE_MS = 300;

export const ENTERPRISE_SEARCH_SHORTCUT = "/";

export const ENTERPRISE_VIEW_MODES: EnterpriseViewMode[] = [
  "table",
  "grid",
  "list",
  "compact",
];

export const ENTERPRISE_VIEW_MODE_LABELS: Record<
  EnterpriseViewMode,
  string
> = {
  table: "Table",
  grid: "Grid",
  list: "List",
  compact: "Compact",
};

export const ENTERPRISE_VIEW_MODE_ICONS: Record<
  EnterpriseViewMode,
  string
> = {
  table: "▦",
  grid: "▦",
  list: "☷",
  compact: "≡",
};

export const ENTERPRISE_TOOLBAR_BUTTON_DEFAULT_VARIANT: EnterpriseToolbarButtonVariant =
  "neutral";

export const ENTERPRISE_TOOLBAR_BUTTON_VARIANT_CLASSES: Record<
  EnterpriseToolbarButtonVariant,
  {
    button: string;
    badge: string;
    spinner: string;
  }
> = {
  primary: {
    button:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/60 hover:bg-emerald-500/15",
    badge:
      "border-emerald-500/20 bg-emerald-500/15 text-emerald-200",
    spinner: "border-emerald-200/20 border-t-emerald-200",
  },

  secondary: {
    button:
      "border-sky-500/30 bg-sky-500/10 text-sky-200 hover:border-sky-400/60 hover:bg-sky-500/15",
    badge:
      "border-sky-500/20 bg-sky-500/15 text-sky-200",
    spinner: "border-sky-200/20 border-t-sky-200",
  },

  success: {
    button:
      "border-green-500/30 bg-green-500/10 text-green-200 hover:border-green-400/60 hover:bg-green-500/15",
    badge:
      "border-green-500/20 bg-green-500/15 text-green-200",
    spinner: "border-green-200/20 border-t-green-200",
  },

  warning: {
    button:
      "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:border-amber-400/60 hover:bg-amber-500/15",
    badge:
      "border-amber-500/20 bg-amber-500/15 text-amber-200",
    spinner: "border-amber-200/20 border-t-amber-200",
  },

  danger: {
    button:
      "border-red-500/30 bg-red-500/10 text-red-200 hover:border-red-400/60 hover:bg-red-500/15",
    badge:
      "border-red-500/20 bg-red-500/15 text-red-200",
    spinner: "border-red-200/20 border-t-red-200",
  },

  neutral: {
    button:
      "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
    badge:
      "border-white/10 bg-white/[0.06] text-slate-300",
    spinner: "border-white/20 border-t-white",
  },
};

export const ENTERPRISE_TOOLBAR_CONTAINER_CLASSES =
  "rounded-3xl border border-white/10 bg-white/[0.025] p-4 shadow-2xl shadow-black/10 sm:p-5";

export const ENTERPRISE_TOOLBAR_CONTROL_CLASSES =
  "min-h-11 rounded-xl border border-white/10 bg-black/20 text-sm text-white outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20";

export const ENTERPRISE_TOOLBAR_EMPTY_FILTER_LABEL =
  "All options";

export const ENTERPRISE_TOOLBAR_LOADING_LABEL =
  "Loading toolbar";

export const ENTERPRISE_TOOLBAR_NO_BUTTONS_MESSAGE =
  "No toolbar actions are currently available.";