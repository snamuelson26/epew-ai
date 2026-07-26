"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ENTERPRISE_TOOLBAR_BUTTON_VARIANT_CLASSES,
} from "./constants";

import {
  getToolbarButtonAriaLabel,
  getToolbarExternalLinkAttributes,
  isToolbarButtonUnavailable,
  mergeToolbarClasses,
  resolveToolbarButtonVariant,
} from "./helpers";

import type {
  EnterpriseToolbarButton,
} from "./types";

interface ToolbarButtonProps {
  button: EnterpriseToolbarButton;
}

export function ToolbarButton({
  button,
}: ToolbarButtonProps) {
  const [executing, setExecuting] = useState(false);

  const variant = resolveToolbarButtonVariant(button);

  const styles =
    ENTERPRISE_TOOLBAR_BUTTON_VARIANT_CLASSES[
      variant
    ];

  const loading =
    button.loading || executing;

  const unavailable =
    isToolbarButtonUnavailable(button) ||
    executing;

  async function execute(): Promise<void> {
    if (!button.onClick || unavailable) {
      return;
    }

    try {
      setExecuting(true);
      await button.onClick();
    } finally {
      setExecuting(false);
    }
  }

  const sharedClasses = mergeToolbarClasses(
    "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all duration-200",
    styles.button,
    unavailable
      ? "cursor-not-allowed opacity-50"
      : "hover:-translate-y-0.5",
  );

  const content = (
    <>
      {loading ? (
        <span
          className={mergeToolbarClasses(
            "h-4 w-4 animate-spin rounded-full border-2",
            styles.spinner,
          )}
        />
      ) : (
        button.icon
      )}

      <span>{button.label}</span>

      {button.badge !== undefined &&
        button.badge !== null && (
          <span
            className={mergeToolbarClasses(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              styles.badge,
            )}
          >
            {button.badge}
          </span>
        )}
    </>
  );

  if (button.href) {
    return (
      <Link
        href={button.href}
        className={sharedClasses}
        aria-label={getToolbarButtonAriaLabel(
          button,
        )}
        {...getToolbarExternalLinkAttributes(
          button,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={() => void execute()}
      className={sharedClasses}
      aria-label={getToolbarButtonAriaLabel(
        button,
      )}
    >
      {content}
    </button>
  );
}