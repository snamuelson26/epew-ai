"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ENTERPRISE_ACTION_VARIANT_CLASSES,
} from "./constants";

import {
  getActionAriaLabel,
  getExternalLinkAttributes,
  isActionUnavailable,
  mergeActionClasses,
  resolveActionVariant,
} from "./helpers";

import type {
  EnterpriseQuickAction,
} from "./types";

interface ActionCardProps {
  action: EnterpriseQuickAction;
  showDescription?: boolean;
}

export function ActionCard({
  action,
  showDescription = true,
}: ActionCardProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  const variant = resolveActionVariant(action);
  const styles = ENTERPRISE_ACTION_VARIANT_CLASSES[variant];

  const unavailable =
    isActionUnavailable(action) || isExecuting;

  const loading = action.loading || isExecuting;

  async function executeAction(): Promise<void> {
    if (unavailable || !action.onClick) {
      return;
    }

    try {
      setIsExecuting(true);
      await action.onClick();
    } finally {
      setIsExecuting(false);
    }
  }

  function handleButtonClick(): void {
    if (action.confirmation) {
      const confirmationMessage = [
        action.confirmation.title,
        action.confirmation.description,
      ]
        .filter(Boolean)
        .join("\n\n");

      const approved = window.confirm(confirmationMessage);

      if (!approved) {
        return;
      }
    }

    void executeAction();
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {action.icon ? (
            <div
              className={mergeActionClasses(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                styles.icon,
              )}
              aria-hidden="true"
            >
              {action.icon}
            </div>
          ) : null}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-white">
                {action.title}
              </h3>

              {action.badge !== undefined &&
              action.badge !== null ? (
                <span
                  className={mergeActionClasses(
                    "inline-flex min-h-5 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    styles.badge,
                  )}
                >
                  {action.badge}
                </span>
              ) : null}
            </div>

            {showDescription && action.description ? (
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">
                {action.description}
              </p>
            ) : null}
          </div>
        </div>

        {loading ? (
          <span
            className="mt-1 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white"
            aria-hidden="true"
          />
        ) : (
          <span
            className="mt-0.5 shrink-0 text-slate-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-300"
            aria-hidden="true"
          >
            →
          </span>
        )}
      </div>

      {action.shortcut ? (
        <div className="mt-4 flex justify-end">
          <kbd className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-medium text-slate-500">
            {action.shortcut}
          </kbd>
        </div>
      ) : null}
    </>
  );

  const sharedClasses = mergeActionClasses(
    "group relative block w-full overflow-hidden rounded-2xl border p-4 text-left",
    "transition duration-200 ease-out",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    styles.container,
    unavailable
      ? "cursor-not-allowed opacity-50"
      : "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20",
  );

  if (action.href) {
    if (unavailable) {
      return (
        <div
          className={sharedClasses}
          aria-disabled="true"
          aria-label={getActionAriaLabel(action)}
        >
          {content}
        </div>
      );
    }

    const externalAttributes =
      getExternalLinkAttributes(action);

    return (
      <Link
        href={action.href}
        className={sharedClasses}
        aria-label={getActionAriaLabel(action)}
        {...externalAttributes}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={sharedClasses}
      disabled={unavailable}
      onClick={handleButtonClick}
      aria-label={getActionAriaLabel(action)}
      aria-busy={loading}
    >
      {content}
    </button>
  );
}