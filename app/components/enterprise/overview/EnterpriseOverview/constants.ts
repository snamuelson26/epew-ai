import type {
  EnterpriseOverviewColumns,
  EnterpriseOverviewStatus,
  EnterpriseOverviewVariant,
} from "./types";

export const OVERVIEW_VARIANT_STYLES: Record<
  EnterpriseOverviewVariant,
  {
    border: string;
    accent: string;
    icon: string;
    glow: string;
    text: string;
  }
> = {
  emerald: {
    border: "border-emerald-500/20 hover:border-emerald-400/40",
    accent: "bg-emerald-400",
    icon: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    glow: "bg-emerald-400/10",
    text: "text-emerald-300",
  },
  gold: {
    border: "border-amber-500/20 hover:border-amber-400/40",
    accent: "bg-amber-300",
    icon: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    glow: "bg-amber-300/10",
    text: "text-amber-200",
  },
  blue: {
    border: "border-blue-500/20 hover:border-blue-400/40",
    accent: "bg-blue-400",
    icon: "border-blue-400/20 bg-blue-400/10 text-blue-300",
    glow: "bg-blue-400/10",
    text: "text-blue-300",
  },
  purple: {
    border: "border-purple-500/20 hover:border-purple-400/40",
    accent: "bg-purple-400",
    icon: "border-purple-400/20 bg-purple-400/10 text-purple-300",
    glow: "bg-purple-400/10",
    text: "text-purple-300",
  },
  red: {
    border: "border-red-500/20 hover:border-red-400/40",
    accent: "bg-red-400",
    icon: "border-red-400/20 bg-red-400/10 text-red-300",
    glow: "bg-red-400/10",
    text: "text-red-300",
  },
  slate: {
    border: "border-slate-700 hover:border-slate-500",
    accent: "bg-slate-400",
    icon: "border-slate-600 bg-slate-800 text-slate-300",
    glow: "bg-slate-400/10",
    text: "text-slate-300",
  },
};

export const OVERVIEW_STATUS_STYLES: Record<
  EnterpriseOverviewStatus,
  {
    label: string;
    dot: string;
    badge: string;
  }
> = {
  excellent: {
    label: "Excellent",
    dot: "bg-emerald-400",
    badge:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  },
  healthy: {
    label: "Healthy",
    dot: "bg-green-400",
    badge: "border-green-400/20 bg-green-400/10 text-green-300",
  },
  active: {
    label: "Active",
    dot: "bg-blue-400",
    badge: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    badge: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  },
  warning: {
    label: "Warning",
    dot: "bg-orange-400",
    badge:
      "border-orange-400/20 bg-orange-400/10 text-orange-300",
  },
  critical: {
    label: "Critical",
    dot: "bg-red-400",
    badge: "border-red-400/20 bg-red-400/10 text-red-300",
  },
  offline: {
    label: "Offline",
    dot: "bg-slate-500",
    badge: "border-slate-600 bg-slate-800 text-slate-400",
  },
  neutral: {
    label: "Neutral",
    dot: "bg-slate-400",
    badge: "border-slate-600 bg-slate-800 text-slate-300",
  },
};

export const OVERVIEW_COLUMN_CLASSES: Record<
  EnterpriseOverviewColumns,
  string
> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6",
};