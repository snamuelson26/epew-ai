"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";

import type {
  KpiCardProps,
  KpiStatus,
  KpiStatusConfig,
  KpiVariant,
  KpiVariantConfig,
} from "./types";

const variantConfig: Record<KpiVariant, KpiVariantConfig> = {
  emerald: {
    borderClassName: "border-emerald-500/20 hover:border-emerald-400/40",
    accentClassName: "bg-emerald-400",
    iconClassName:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    glowClassName: "bg-emerald-400/10",
  },
  gold: {
    borderClassName: "border-amber-500/20 hover:border-amber-400/40",
    accentClassName: "bg-amber-300",
    iconClassName: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    glowClassName: "bg-amber-300/10",
  },
  blue: {
    borderClassName: "border-blue-500/20 hover:border-blue-400/40",
    accentClassName: "bg-blue-400",
    iconClassName: "border-blue-400/20 bg-blue-400/10 text-blue-300",
    glowClassName: "bg-blue-400/10",
  },
  purple: {
    borderClassName: "border-purple-500/20 hover:border-purple-400/40",
    accentClassName: "bg-purple-400",
    iconClassName:
      "border-purple-400/20 bg-purple-400/10 text-purple-300",
    glowClassName: "bg-purple-400/10",
  },
  red: {
    borderClassName: "border-red-500/20 hover:border-red-400/40",
    accentClassName: "bg-red-400",
    iconClassName: "border-red-400/20 bg-red-400/10 text-red-300",
    glowClassName: "bg-red-400/10",
  },
  slate: {
    borderClassName: "border-slate-700 hover:border-slate-500",
    accentClassName: "bg-slate-400",
    iconClassName: "border-slate-600 bg-slate-800 text-slate-300",
    glowClassName: "bg-slate-400/10",
  },
};

const statusConfig: Record<KpiStatus, KpiStatusConfig> = {
  excellent: {
    label: "Excellent",
    dotClassName: "bg-emerald-400",
    textClassName: "text-emerald-300",
    badgeClassName:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  },
  healthy: {
    label: "Healthy",
    dotClassName: "bg-green-400",
    textClassName: "text-green-300",
    badgeClassName:
      "border-green-400/20 bg-green-400/10 text-green-300",
  },
  warning: {
    label: "Warning",
    dotClassName: "bg-amber-400",
    textClassName: "text-amber-300",
    badgeClassName: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  },
  critical: {
    label: "Critical",
    dotClassName: "bg-red-400",
    textClassName: "text-red-300",
    badgeClassName: "border-red-400/20 bg-red-400/10 text-red-300",
  },
  offline: {
    label: "Offline",
    dotClassName: "bg-slate-500",
    textClassName: "text-slate-400",
    badgeClassName: "border-slate-600 bg-slate-800 text-slate-400",
  },
  neutral: {
    label: "Neutral",
    dotClassName: "bg-blue-400",
    textClassName: "text-blue-300",
    badgeClassName: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  },
};

function KpiSkeleton({ compact }: { compact: boolean }) {
  return (
    <div
      className={[
        "animate-pulse",
        compact ? "space-y-3" : "space-y-4",
      ].join(" ")}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-slate-700" />
          <div className="h-9 w-32 rounded bg-slate-700" />
        </div>

        <div className="h-11 w-11 rounded-xl bg-slate-700" />
      </div>

      <div className="h-4 w-40 rounded bg-slate-700" />
      <div className="h-3 w-28 rounded bg-slate-700" />
    </div>
  );
}

function TrendIcon({
  direction,
}: {
  direction: "up" | "down" | "stable";
}) {
  if (direction === "up") {
    return <ArrowUpRight className="h-4 w-4" />;
  }

  if (direction === "down") {
    return <ArrowDownRight className="h-4 w-4" />;
  }

  return <Minus className="h-4 w-4" />;
}

function KpiCardContent({
  title,
  value,
  icon,
  description,
  helperText,
  variant = "emerald",
  status,
  statusLabel,
  trend,
  previousValue,
  change,
  changePercent,
  prefix,
  suffix,
  action,
  loading = false,
  compact = false,
  valueClassName = "",
  children,
}: KpiCardProps) {
  const variantStyles = variantConfig[variant];
  const resolvedStatus = status ? statusConfig[status] : null;

  if (loading) {
    return <KpiSkeleton compact={compact} />;
  }

  const hasComparison =
    previousValue !== undefined ||
    change !== undefined ||
    changePercent !== undefined;

  return (
    <>
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-100",
          variantStyles.glowClassName,
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "absolute inset-x-0 top-0 h-1",
          variantStyles.accentClassName,
        ].join(" ")}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {title}
            </p>

            <p
              className={[
                "mt-3 break-words font-black tracking-[-0.04em] text-white",
                compact
                  ? "text-3xl sm:text-4xl"
                  : "text-4xl sm:text-5xl",
                valueClassName,
              ].join(" ")}
            >
              {prefix ? (
                <span className="mr-1 text-[0.65em] text-slate-300">
                  {prefix}
                </span>
              ) : null}

              {value}

              {suffix ? (
                <span className="ml-1 text-[0.5em] font-bold text-slate-400">
                  {suffix}
                </span>
              ) : null}
            </p>
          </div>

          {icon ? (
            <div
              aria-hidden="true"
              className={[
                "flex shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 group-hover:scale-105",
                compact ? "h-11 w-11" : "h-12 w-12",
                variantStyles.iconClassName,
              ].join(" ")}
            >
              {icon}
            </div>
          ) : null}
        </div>

        {description ? (
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {description}
          </p>
        ) : null}

        {(trend || resolvedStatus) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {trend ? (
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                  trend.positive === false
                    ? "border-red-400/20 bg-red-400/10 text-red-300"
                    : trend.direction === "down"
                      ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                      : trend.direction === "stable"
                        ? "border-slate-600 bg-slate-800 text-slate-300"
                        : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
                ].join(" ")}
              >
                <TrendIcon direction={trend.direction} />

                {trend.value !== undefined ? (
                  <span>{trend.value}</span>
                ) : null}

                {trend.label ? <span>{trend.label}</span> : null}
              </span>
            ) : null}

            {resolvedStatus ? (
              <span
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
                  resolvedStatus.badgeClassName,
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "h-2 w-2 rounded-full",
                    resolvedStatus.dotClassName,
                  ].join(" ")}
                />

                {statusLabel ?? resolvedStatus.label}
              </span>
            ) : null}
          </div>
        )}

        {hasComparison ? (
          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-800 pt-4 text-xs sm:grid-cols-3">
            {previousValue !== undefined ? (
              <div>
                <p className="font-semibold uppercase tracking-wide text-slate-500">
                  Previous
                </p>
                <p className="mt-1 font-bold text-slate-300">
                  {previousValue}
                </p>
              </div>
            ) : null}

            {change !== undefined ? (
              <div>
                <p className="font-semibold uppercase tracking-wide text-slate-500">
                  Change
                </p>
                <p className="mt-1 font-bold text-slate-300">{change}</p>
              </div>
            ) : null}

            {changePercent !== undefined ? (
              <div>
                <p className="font-semibold uppercase tracking-wide text-slate-500">
                  Change %
                </p>
                <p className="mt-1 font-bold text-slate-300">
                  {changePercent}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {children ? <div className="mt-4">{children}</div> : null}

        {(helperText || action) && (
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
            {helperText ? (
              <p className="text-xs leading-5 text-slate-500">{helperText}</p>
            ) : (
              <span />
            )}

            {action ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-slate-300 transition-colors group-hover:text-white">
                {action.label ?? "View details"}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

export function KpiCard(props: KpiCardProps) {
  const {
    variant = "emerald",
    action,
    disabled = false,
    compact = false,
    className = "",
  } = props;

  const variantStyles = variantConfig[variant];

  const cardClassName = [
    "group relative isolate h-full overflow-hidden rounded-2xl border bg-slate-900/90 shadow-lg shadow-black/10 backdrop-blur-sm transition-all duration-200",
    compact ? "p-5" : "p-6",
    disabled
      ? "cursor-not-allowed opacity-60"
      : "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20",
    variantStyles.borderClassName,
    action && !disabled
      ? "cursor-pointer focus-within:ring-2 focus-within:ring-emerald-400/60"
      : "",
    className,
  ].join(" ");

  const content = <KpiCardContent {...props} />;

  if (action?.href && !disabled) {
    if (action.external) {
      return (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={action.ariaLabel ?? action.label ?? props.title}
          className={cardClassName}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        href={action.href}
        aria-label={action.ariaLabel ?? action.label ?? props.title}
        className={cardClassName}
      >
        {content}
      </Link>
    );
  }

  if (action?.onClick && !disabled) {
    return (
      <button
        type="button"
        onClick={action.onClick}
        aria-label={action.ariaLabel ?? action.label ?? props.title}
        className={[
          cardClassName,
          "w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
        ].join(" ")}
      >
        {content}
      </button>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}