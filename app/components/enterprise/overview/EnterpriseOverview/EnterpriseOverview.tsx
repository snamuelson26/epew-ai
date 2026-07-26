import { LayoutDashboard } from "lucide-react";

import {
  OVERVIEW_COLUMN_CLASSES,
  OVERVIEW_VARIANT_STYLES,
} from "./constants";
import { getOverviewItemKey } from "./helpers";
import { OverviewCard } from "./OverviewCard";
import { OverviewItem } from "./OverviewItem";
import type { EnterpriseOverviewProps } from "./types";

export function EnterpriseOverview({
  title = "Enterprise Overview",
  description = "A consolidated operational summary of this enterprise module.",
  eyebrow,
  icon = <LayoutDashboard className="h-5 w-5" />,
  badge,
  items,
  columns = 4,
  variant = "emerald",
  action,
  className = "",
  compact = false,
  loading = false,
  emptyTitle = "No overview data available",
  emptyDescription = "Operational summary data will appear here when available.",
  ariaLabel = "Enterprise overview",
}: EnterpriseOverviewProps) {
  const variantStyles = OVERVIEW_VARIANT_STYLES[variant];

  if (loading) {
    return (
      <OverviewCard
        title={title}
        description={description}
        icon={icon}
        badge={badge}
        className={className}
        compact={compact}
      >
        <div
          aria-label={`${ariaLabel} loading`}
          className={[
            "grid",
            OVERVIEW_COLUMN_CLASSES[columns],
            compact ? "gap-3" : "gap-4",
          ].join(" ")}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <OverviewItem
              key={`overview-loading-${index}`}
              label="Loading"
              value="—"
              loading
              compact={compact}
            />
          ))}
        </div>
      </OverviewCard>
    );
  }

  return (
    <OverviewCard
      title={title}
      description={description}
      icon={icon}
      badge={badge}
      action={action}
      className={className}
      compact={compact}
    >
      {eyebrow ? (
        <p
          className={[
            "mb-4 text-xs font-black uppercase tracking-[0.18em]",
            variantStyles.text,
          ].join(" ")}
        >
          {eyebrow}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-6 py-12 text-center"
        >
          <h3 className="text-lg font-bold text-white">{emptyTitle}</h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div
          aria-label={ariaLabel}
          className={[
            "grid",
            OVERVIEW_COLUMN_CLASSES[columns],
            compact ? "gap-3" : "gap-4",
          ].join(" ")}
        >
          {items.map((item, index) => (
            <OverviewItem
              key={getOverviewItemKey(item, index)}
              {...item}
              compact={compact}
            />
          ))}
        </div>
      )}
    </OverviewCard>
  );
}