import { ReactNode } from "react";

/**
 * Enterprise Search Toolbar
 * EPEW Enterprise Admin Design System (EADS)
 * Version: 1.0
 */

export type EnterpriseViewMode =
  | "table"
  | "grid"
  | "list"
  | "compact";

export type EnterpriseToolbarButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export interface EnterpriseFilterOption {
  label: string;
  value: string;
}

export interface EnterpriseFilter {
  id: string;
  label: string;

  options: EnterpriseFilterOption[];

  multiple?: boolean;

  value?: string | string[];

  onChange?: (value: string | string[]) => void;
}

export interface EnterpriseSortOption {
  label: string;
  value: string;
}

export interface EnterpriseToolbarButton {
  id: string;

  label: string;

  icon?: ReactNode;

  variant?: EnterpriseToolbarButtonVariant;

  disabled?: boolean;

  loading?: boolean;

  href?: string;

  external?: boolean;

  badge?: string | number;

  permission?: string;

  onClick?: () => void | Promise<void>;
}

export interface EnterpriseSearchToolbarProps {
  searchValue: string;

  onSearchChange: (value: string) => void;

  placeholder?: string;

  filters?: EnterpriseFilter[];

  sortOptions?: EnterpriseSortOption[];

  selectedSort?: string;

  onSortChange?: (value: string) => void;

  viewMode?: EnterpriseViewMode;

  onViewChange?: (view: EnterpriseViewMode) => void;

  buttons?: EnterpriseToolbarButton[];

  loading?: boolean;

  className?: string;

  showSearch?: boolean;

  showFilters?: boolean;

  showSorting?: boolean;

  showViewSwitcher?: boolean;

  showButtons?: boolean;
}