import type { ReactNode } from "react";

export type EnterpriseHeroVariant =
  | "emerald"
  | "gold"
  | "blue"
  | "purple"
  | "slate";

export type EnterpriseHeroActionVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

export interface EnterpriseHeroBadge {
  label: string;
  icon?: ReactNode;
}

export interface EnterpriseHeroAction {
  label: string;
  href?: string;
  icon?: ReactNode;
  variant?: EnterpriseHeroActionVariant;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  external?: boolean;
  ariaLabel?: string;
}

export interface EnterpriseHeroStat {
  label: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  status?: "default" | "success" | "warning" | "danger" | "info";
}

export interface HeroSectionProps {
  badge?: EnterpriseHeroBadge;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: EnterpriseHeroAction[];
  stats?: EnterpriseHeroStat[];
  variant?: EnterpriseHeroVariant;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
  showPattern?: boolean;
}