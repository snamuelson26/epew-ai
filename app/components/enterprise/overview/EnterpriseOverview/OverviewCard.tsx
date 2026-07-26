"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { OverviewCardProps } from "./types";

export function OverviewCard({
  title,
  description,
  icon,
  badge,
  action,
  children,
  className = "",
  compact = false,
}: OverviewCardProps) {
  const actionContent = (
    <>
      {action?.icon ? (
        <span aria-hidden="true">{action.icon}</span>
      ) : null}

      <span>{action?.label}</span>
      <ArrowRight className="h-4 w-4" />
    </>
  );

  return (
    <section
      className={[
        "overflow-hidden rounded-[24px] border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/10 backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      {(title || description || icon || badge || action) && (
        <header
          className={[
            "flex flex-col gap-4 border-b border-slate-800 sm:flex-row sm:items-center sm:justify-between",
            compact ? "px-5 py-4" : "px-6 py-5",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                {icon}
              </div>
            ) : null}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {title ? (
                  <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                    {title}
                  </h2>
                ) : null}

                {badge ? (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-300">
                    {badge}
                  </span>
                ) : null}
              </div>

              {description ? (
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {action ? (
            action.href ? (
              action.external ? (
                <a
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={action.ariaLabel ?? action.label}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
                >
                  {actionContent}
                </a>
              ) : (
                <Link
                  href={action.href}
                  aria-label={action.ariaLabel ?? action.label}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
                >
                  {actionContent}
                </Link>
              )
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                aria-label={action.ariaLabel ?? action.label}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
              >
                {actionContent}
              </button>
            )
          ) : null}
        </header>
      )}

      <div className={compact ? "p-4" : "p-5 sm:p-6"}>{children}</div>
    </section>
  );
}