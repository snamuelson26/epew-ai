import type { ReactNode } from "react";

export type KpiVariant =
  | "emerald"
  | "gold"
  | "blue"
  | "purple"
  | "red"
  | "slate";

export type KpiStatus =
  | "excellent"
  | "healthy"
  | "warning"
  | "critical"
  | "offline"
  | "neutral";

export type KpiTrendDirection =
  | "up"
  | "down"
  | "stable";

export type KpiGridColumns =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;

export interface KpiTrend {
  direction: KpiTrendDirection;
  value?: string | number;
  label?: string;
  positive?: boolean;
}

export interface KpiAction {
  label?: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  ariaLabel?: string;
}

export interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;

  description?: string;
  helperText?: string;

  variant?: KpiVariant;
  status?: KpiStatus;
  statusLabel?: string;

  trend?: KpiTrend;

  previousValue?: string | number;
  change?: string | number;
  changePercent?: string | number;

  prefix?: string;
  suffix?: string;

  action?: KpiAction;

  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;

  className?: string;
  valueClassName?: string;

  children?: ReactNode;
}

export interface KpiGridProps {
  children: ReactNode;
  columns?: KpiGridColumns;
  className?: string;
  gap?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

export interface KpiStatusConfig {
  label: string;
  dotClassName: string;
  textClassName: string;
  badgeClassName: string;
}

export interface KpiVariantConfig {
  borderClassName: string;
  accentClassName: string;
  iconClassName: string;
  glowClassName: string;
}