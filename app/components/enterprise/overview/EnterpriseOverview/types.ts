import type { ReactNode } from "react";

export type EnterpriseOverviewVariant =
  | "emerald"
  | "gold"
  | "blue"
  | "purple"
  | "red"
  | "slate";

export type EnterpriseOverviewStatus =
  | "excellent"
  | "healthy"
  | "active"
  | "pending"
  | "warning"
  | "critical"
  | "offline"
  | "neutral";

export type EnterpriseOverviewColumns = 1 | 2 | 3 | 4 | 5 | 6;

export interface EnterpriseOverviewAction {
  label: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  ariaLabel?: string;
  icon?: ReactNode;
}

export interface EnterpriseOverviewItemData {
  id?: string;
  label: string;
  value: string | number;
  description?: string;
  helperText?: string;
  icon?: ReactNode;

  variant?: EnterpriseOverviewVariant;
  status?: EnterpriseOverviewStatus;
  statusLabel?: string;

  trend?: string;
  trendPositive?: boolean;

  prefix?: string;
  suffix?: string;

  action?: EnterpriseOverviewAction;
  loading?: boolean;
  disabled?: boolean;
}

export interface OverviewItemProps extends EnterpriseOverviewItemData {
  compact?: boolean;
  className?: string;
}

export interface OverviewCardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  badge?: string;
  action?: EnterpriseOverviewAction;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export interface EnterpriseOverviewProps {
  title?: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  badge?: string;

  items: EnterpriseOverviewItemData[];

  columns?: EnterpriseOverviewColumns;
  variant?: EnterpriseOverviewVariant;
  action?: EnterpriseOverviewAction;

  className?: string;
  compact?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  ariaLabel?: string;
}