"use client";

import Link from "next/link";
import type { EnterpriseHeroAction } from "./types";

interface HeroActionsProps {
  actions: EnterpriseHeroAction[];
}

const actionStyles: Record<
  NonNullable<EnterpriseHeroAction["variant"]>,
  string
> = {
  primary:
    "border-emerald-300/50 bg-emerald-400 text-slate-950 hover:bg-emerald-300 focus-visible:ring-emerald-300",
  secondary:
    "border-amber-300/40 bg-amber-300 text-slate-950 hover:bg-amber-200 focus-visible:ring-amber-300",
  ghost:
    "border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/15 focus-visible:ring-white/50",
  danger:
    "border-red-300/40 bg-red-500 text-white hover:bg-red-400 focus-visible:ring-red-300",
};

function LoadingIndicator() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

export function HeroActions({ actions }: HeroActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {actions.map((action, index) => {
        const variant = action.variant ?? "ghost";

        const className = [
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-lg",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm",
          actionStyles[variant],
        ].join(" ");

        const content = (
          <>
            {action.loading ? (
              <LoadingIndicator />
            ) : action.icon ? (
              <span
                aria-hidden="true"
                className="flex shrink-0 items-center justify-center"
              >
                {action.icon}
              </span>
            ) : null}

            <span>{action.loading ? "Processing..." : action.label}</span>
          </>
        );

        if (action.href && !action.disabled && !action.loading) {
          if (action.external) {
            return (
              <a
                key={`${action.label}-${index}`}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={action.ariaLabel ?? action.label}
                className={className}
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={`${action.label}-${index}`}
              href={action.href}
              aria-label={action.ariaLabel ?? action.label}
              className={className}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={`${action.label}-${index}`}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            aria-label={action.ariaLabel ?? action.label}
            aria-busy={action.loading}
            className={className}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}