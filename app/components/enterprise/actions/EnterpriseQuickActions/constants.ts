import type {
  EnterpriseActionCategory,
  EnterpriseActionVariant,
} from "./types";

/**
 * Enterprise Quick Actions
 * Shared constants for the EPEW Enterprise Admin Design System.
 */

export const ENTERPRISE_ACTION_CATEGORY_LABELS: Record<
  EnterpriseActionCategory,
  string
> = {
  create: "Create",
  manage: "Manage",
  reports: "Reports",
  tools: "Tools",
  ai: "Assistant",
  system: "System",
};

export const ENTERPRISE_ACTION_CATEGORY_ORDER: EnterpriseActionCategory[] = [
  "create",
  "manage",
  "reports",
  "tools",
  "ai",
  "system",
];

export const ENTERPRISE_ACTION_VARIANT_CLASSES: Record<
  EnterpriseActionVariant,
  {
    container: string;
    icon: string;
    badge: string;
  }
> = {
  primary: {
    container:
      "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400/60 hover:bg-emerald-500/15",
    icon: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20",
  },

  secondary: {
    container:
      "border-sky-500/30 bg-sky-500/10 hover:border-sky-400/60 hover:bg-sky-500/15",
    icon: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20",
    badge: "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/20",
  },

  success: {
    container:
      "border-green-500/30 bg-green-500/10 hover:border-green-400/60 hover:bg-green-500/15",
    icon: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20",
    badge: "bg-green-500/15 text-green-200 ring-1 ring-green-500/20",
  },

  warning: {
    container:
      "border-amber-500/30 bg-amber-500/10 hover:border-amber-400/60 hover:bg-amber-500/15",
    icon: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20",
    badge: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/20",
  },

  danger: {
    container:
      "border-red-500/30 bg-red-500/10 hover:border-red-400/60 hover:bg-red-500/15",
    icon: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20",
    badge: "bg-red-500/15 text-red-200 ring-1 ring-red-500/20",
  },

  neutral: {
    container:
      "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
    icon: "bg-white/[0.06] text-slate-300 ring-1 ring-white/10",
    badge: "bg-white/[0.06] text-slate-300 ring-1 ring-white/10",
  },
};

export const ENTERPRISE_ACTION_DEFAULT_VARIANT: EnterpriseActionVariant =
  "neutral";

export const ENTERPRISE_ACTION_DEFAULT_COLUMNS = 3 as const;

export const ENTERPRISE_ACTION_GRID_CLASSES = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
} as const;

export const ENTERPRISE_ACTION_EMPTY_MESSAGE =
  "No quick actions are currently available.";

export const ENTERPRISE_ACTION_LOADING_ITEMS = 6;