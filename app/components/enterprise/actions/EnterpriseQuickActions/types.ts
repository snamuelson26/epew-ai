import { ReactNode } from "react";

/**
 * Enterprise Quick Actions
 * EPEW Enterprise Admin Design System (EADS)
 * Version: 1.0
 */

export type EnterpriseActionCategory =
  | "create"
  | "manage"
  | "reports"
  | "tools"
  | "ai"
  | "system";

export type EnterpriseActionVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export interface EnterpriseQuickAction {
  id: string;

  title: string;

  description?: string;

  icon?: ReactNode;

  category: EnterpriseActionCategory;

  variant?: EnterpriseActionVariant;

  href?: string;

  onClick?: () => void | Promise<void>;

  permission?: string;

  disabled?: boolean;

  loading?: boolean;

  badge?: string | number;

  shortcut?: string;

  external?: boolean;

  confirmation?: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
  };
}

export interface EnterpriseActionGroup {
  id: string;

  title: string;

  description?: string;

  category: EnterpriseActionCategory;

  actions: EnterpriseQuickAction[];
}

export interface EnterpriseQuickActionsProps {
  groups: EnterpriseActionGroup[];

  loading?: boolean;

  className?: string;

  columns?: 2 | 3 | 4;

  showDescriptions?: boolean;

  showCategoryTitles?: boolean;

  emptyMessage?: string;
}
export * from "./EnterpriseQuickActions";
