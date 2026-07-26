import type {
  EnterpriseToolbarButtonVariant,
  EnterpriseViewMode,
} from "./types";

export const ENTERPRISE_SEARCH_DEBOUNCE_MS = 300;

export const ENTERPRISE_SEARCH_DEFAULT_PLACEHOLDER =
  "Search records...";

export const ENTERPRISE_SEARCH_SHORTCUT = "/";

export const ENTERPRISE_TOOLBAR_LOADING_LABEL =
  "Loading enterprise search controls";

export const ENTERPRISE_TOOLBAR_EMPTY_FILTER_LABEL =
  "All";

export const ENTERPRISE_TOOLBAR_NO_BUTTONS_MESSAGE =
  "No toolbar actions are available.";

export const ENTERPRISE_TOOLBAR_BUTTON_DEFAULT_VARIANT: EnterpriseToolbarButtonVariant =
  "secondary";

export const ENTERPRISE_TOOLBAR_CONTAINER_CLASSES =
  "rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl";

export const ENTERPRISE_TOOLBAR_CONTROL_CLASSES =
  "min-h-11 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-slate-200 outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50";

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
      "border-emerald-400/30 bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70",
    badge:
      "border-slate-950/10 bg-slate-950/10 text-slate-950",
    spinner:
      "border-slate-950/30 border-t-slate-950",
  },

  secondary: {
    button:
      "border-white/10 bg-white/[0.05] text-slate-200 hover:border-white/20 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/50",
    badge:
      "border-white/10 bg-black/20 text-slate-300",
    spinner:
      "border-white/20 border-t-white",
  },

  success: {
    button:
      "border-green-400/30 bg-green-500/15 text-green-300 hover:bg-green-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/50",
    badge:
      "border-green-400/20 bg-green-500/10 text-green-300",
    spinner:
      "border-green-300/20 border-t-green-300",
  },

  warning: {
    button:
      "border-amber-400/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
    badge:
      "border-amber-400/20 bg-amber-500/10 text-amber-300",
    spinner:
      "border-amber-300/20 border-t-amber-300",
  },

  danger: {
    button:
      "border-red-400/30 bg-red-500/15 text-red-300 hover:bg-red-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50",
    badge:
      "border-red-400/20 bg-red-500/10 text-red-300",
    spinner:
      "border-red-300/20 border-t-red-300",
  },

  ghost: {
    button:
      "border-transparent bg-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/40",
    badge:
      "border-white/10 bg-white/[0.04] text-slate-400",
    spinner:
      "border-white/20 border-t-white",
  },
};