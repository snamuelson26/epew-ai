"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import {
  OVERVIEW_STATUS_STYLES,
  OVERVIEW_VARIANT_STYLES,
} from "./constants";
import {
  resolveOverviewStatus,
  resolveOverviewVariant,
} from "./helpers";
import type { OverviewItemProps } from "./types";

function OverviewItemSkeleton({ compact }: { compact: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "animate-pulse space-y-3",
        compact ? "p-4" : "p-5",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-slate-700" />
          <div className="h-8 w-20 rounded bg-slate-700" />
        </div>

        <div className="h-10 w-10 rounded-xl bg-slate-700" />
      </div>

      <div className="h-3 w-32 rounded bg-slate-700" />
    </div>
  );
}

function OverviewItemContent({
  label,
  value,
  description,
  helperText,
  icon,
  variant = "emerald",
  status,
  statusLabel,
  trend,
  trendPositive = true,
  prefix,
  suffix,
  action,
  loading = false,
  compact = false,
}: OverviewItemProps) {
  const resolvedVariant = resolveOverviewVariant(variant);
  const resolvedStatus = resolveOverviewStatus(status);
  const variantStyles = OVERVIEW_VARIANT_STYLES[resolvedVariant];
  const statusStyles = resolvedStatus
    ? OVERVIEW_STATUS_STYLES[resolvedStatus]
    : null;

  if (loading) {
    return <OverviewItemSkeleton compact={compact} />;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full blur-3xl opacity-70 transition-opacity duration-200 group-hover:opacity-100",
          variantStyles.glow,
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "absolute inset-y-0 left-0 w-1",
          variantStyles.accent,
        ].join(" ")}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
              {label}
            </p>

            <p
              className={[
                "mt-2 break-words font-black tracking-[-0.035em] text-white",
                compact ? "text-2xl" : "text-3xl",
              ].join(" ")}
            >
              {prefix ? (
                <span className="mr-1 text-[0.7em] text-slate-400">
                  {prefix}
                </span>
              ) : null}

              {value}

              {suffix ? (
                <span className="ml-1 text-[0.55em] font-bold text-slate-400">
                  {suffix}
                </span>
              ) : null}
            </p>
          </div>

          {icon ? (
            <div
              aria-hidden="true"
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105",
                variantStyles.icon,
              ].join(" ")}
            >
              {icon}
            </div>
          ) : null}
        </div>

        {description ? (
          <p className="mt-2 text-sm leading-5 text-slate-400">
            {description}
          </p>
        ) : null}

        {(trend || statusStyles) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {trend ? (
              <span
                className={[
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                  trendPositive
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border-red-400/20 bg-red-400/10 text-red-300",
                ].join(" ")}
              >
                {trendPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}

                {trend}
              </span>
            ) : null}

            {statusStyles ? (
              <span
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
                  statusStyles.badge,
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "h-2 w-2 rounded-full",
                    statusStyles.dot,
                  ].join(" ")}
                />

                {statusLabel ?? statusStyles.label}
              </span>
            ) : null}
          </div>
        )}

        {(helperText || action) && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
            {helperText ? (
              <p className="text-xs leading-5 text-slate-500">
                {helperText}
              </p>
            ) : (
              <span />
            )}

            {action ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-slate-300 transition-colors group-hover:text-white">
                {action.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

export function OverviewItem(props: OverviewItemProps) {
  const {
    variant = "emerald",
    action,
    disabled = false,
    compact = false,
    className = "",
  } = props;

  const variantStyles =
    OVERVIEW_VARIANT_STYLES[resolveOverviewVariant(variant)];

  const containerClassName = [
    "group relative isolate h-full overflow-hidden rounded-2xl border bg-slate-950/75 shadow-sm transition-all duration-200",
    compact ? "p-4" : "p-5",
    disabled
      ? "cursor-not-allowed opacity-60"
      : "hover:-translate-y-0.5 hover:bg-slate-950 hover:shadow-lg",
    variantStyles.border,
    action && !disabled ? "cursor-pointer" : "",
    className,
  ].join(" ");

  const content = <OverviewItemContent {...props} />;

  if (action?.href && !disabled) {
    if (action.external) {
      return (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={action.ariaLabel ?? action.label}
          className={containerClassName}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        href={action.href}
        aria-label={action.ariaLabel ?? action.label}
        className={containerClassName}
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
        aria-label={action.ariaLabel ?? action.label}
        className={[
          containerClassName,
          "w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
        ].join(" ")}
      >
        {content}
      </button>
    );
  }

  return <article className={containerClassName}>{content}</article>;
}