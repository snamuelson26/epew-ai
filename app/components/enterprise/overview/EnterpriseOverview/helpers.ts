import type {
  EnterpriseOverviewItemData,
  EnterpriseOverviewStatus,
  EnterpriseOverviewVariant,
} from "./types";

export function resolveOverviewVariant(
  variant?: EnterpriseOverviewVariant,
): EnterpriseOverviewVariant {
  return variant ?? "emerald";
}

export function resolveOverviewStatus(
  status?: EnterpriseOverviewStatus,
): EnterpriseOverviewStatus | null {
  return status ?? null;
}

export function getOverviewItemKey(
  item: EnterpriseOverviewItemData,
  index: number,
): string {
  return item.id ?? `${item.label}-${index}`;
}

export function formatOverviewValue(
  value: string | number,
  prefix?: string,
  suffix?: string,
): string {
  return `${prefix ?? ""}${value}${suffix ?? ""}`;
}