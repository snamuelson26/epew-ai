import type { ReactNode } from "react";

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
  | "ghost";

export interface EnterpriseFilterOption {
  label: string;
  value: string;
  disabled?: boolean;
  count?: number;
}

export interface EnterpriseFilter {
  id: string;
  label: string;
  value: string;
  options: EnterpriseFilterOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  clearValue?: string;
  ariaLabel?: string;
}

export interface EnterpriseSortOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface EnterpriseToolbarButton {
  id?: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void | Promise<void>;
  variant?: EnterpriseToolbarButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  badge?: string | number;
  ariaLabel?: string;
  external?: boolean;
  permission?: string;
  hidden?: boolean;
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
  onViewChange?: (mode: EnterpriseViewMode) => void;

  buttons?: EnterpriseToolbarButton[];

  loading?: boolean;
  className?: string;

  showSearch?: boolean;
  showFilters?: boolean;
  showSorting?: boolean;
  showViewSwitcher?: boolean;
  showButtons?: boolean;

  grantedPermissions?: string[];

  searchLoading?: boolean;
  searchDebounceMs?: number;

  disabled?: boolean;

  title?: string;
  description?: string;

  showClearFilters?: boolean;
}