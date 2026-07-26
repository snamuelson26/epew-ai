import {
  ENTERPRISE_TOOLBAR_BUTTON_DEFAULT_VARIANT,
} from "./constants";

import type {
  EnterpriseFilter,
  EnterpriseToolbarButton,
  EnterpriseToolbarButtonVariant,
  EnterpriseViewMode,
} from "./types";

/**
 * Combines conditional Tailwind classes safely.
 */
export function mergeToolbarClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Resolves the visual variant assigned to a toolbar button.
 */
export function resolveToolbarButtonVariant(
  button: EnterpriseToolbarButton,
): EnterpriseToolbarButtonVariant {
  return (
    button.variant ??
    ENTERPRISE_TOOLBAR_BUTTON_DEFAULT_VARIANT
  );
}

/**
 * Determines whether a toolbar button has an executable destination.
 */
export function isToolbarButtonInteractive(
  button: EnterpriseToolbarButton,
): boolean {
  return Boolean(button.href || button.onClick);
}

/**
 * Determines whether a toolbar button should be unavailable.
 */
export function isToolbarButtonUnavailable(
  button: EnterpriseToolbarButton,
): boolean {
  return Boolean(
    button.disabled ||
      button.loading ||
      !isToolbarButtonInteractive(button),
  );
}

/**
 * Determines whether a toolbar button should be visible based on permissions.
 *
 * Buttons without a required permission remain visible.
 * When permissions are not supplied, filtering is skipped.
 */
export function hasToolbarButtonPermission(
  button: EnterpriseToolbarButton,
  grantedPermissions?: string[],
): boolean {
  if (!button.permission) {
    return true;
  }

  if (!grantedPermissions) {
    return true;
  }

  return grantedPermissions.includes(button.permission);
}

/**
 * Filters toolbar buttons according to the administrator's permissions.
 */
export function filterToolbarButtonsByPermission(
  buttons: EnterpriseToolbarButton[],
  grantedPermissions?: string[],
): EnterpriseToolbarButton[] {
  return buttons.filter((button) =>
    hasToolbarButtonPermission(
      button,
      grantedPermissions,
    ),
  );
}

/**
 * Determines whether a toolbar button opens an external link.
 */
export function isExternalToolbarButton(
  button: EnterpriseToolbarButton,
): boolean {
  return Boolean(button.external && button.href);
}

/**
 * Returns secure attributes for external toolbar links.
 */
export function getToolbarExternalLinkAttributes(
  button: EnterpriseToolbarButton,
): {
  target?: "_blank";
  rel?: "noopener noreferrer";
} {
  if (!isExternalToolbarButton(button)) {
    return {};
  }

  return {
    target: "_blank",
    rel: "noopener noreferrer",
  };
}

/**
 * Returns an accessible label for a toolbar button.
 */
export function getToolbarButtonAriaLabel(
  button: EnterpriseToolbarButton,
): string {
  const state = button.loading
    ? "Loading"
    : button.disabled
      ? "Disabled"
      : "";

  return [button.label, state]
    .filter(Boolean)
    .join(". ");
}

/**
 * Returns a stable React key for a toolbar button.
 */
export function getToolbarButtonKey(
  button: EnterpriseToolbarButton,
): string {
  return `toolbar-button-${button.id}`;
}

/**
 * Returns a stable React key for a filter.
 */
export function getFilterKey(
  filter: EnterpriseFilter,
): string {
  return `toolbar-filter-${filter.id}`;
}

/**
 * Normalizes a filter value into an array.
 */
export function normalizeFilterValue(
  value?: string | string[],
): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

/**
 * Determines whether a filter currently has a selected value.
 */
export function hasActiveFilter(
  filter: EnterpriseFilter,
): boolean {
  return normalizeFilterValue(filter.value).length > 0;
}

/**
 * Counts all active filters.
 */
export function countActiveFilters(
  filters: EnterpriseFilter[] = [],
): number {
  return filters.reduce(
    (total, filter) =>
      total + (hasActiveFilter(filter) ? 1 : 0),
    0,
  );
}

/**
 * Clears every active filter.
 */
export function clearAllFilters(
  filters: EnterpriseFilter[] = [],
): void {
  filters.forEach((filter) => {
    if (!filter.onChange) {
      return;
    }

    filter.onChange(filter.multiple ? [] : "");
  });
}

/**
 * Determines whether the supplied view mode is valid.
 */
export function isEnterpriseViewMode(
  value: string,
): value is EnterpriseViewMode {
  return [
    "table",
    "grid",
    "list",
    "compact",
  ].includes(value as EnterpriseViewMode);
}

/**
 * Normalizes search text before it is used by a page.
 */
export function normalizeSearchValue(
  value: string,
): string {
  return value.replace(/\s+/g, " ").trimStart();
}

/**
 * Determines whether the keyboard event should focus search.
 */
export function shouldActivateSearchShortcut(
  event: KeyboardEvent,
): boolean {
  if (event.key !== "/") {
    return false;
  }

  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  ) {
    return false;
  }

  const target = event.target as HTMLElement | null;

  if (!target) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();

  return ![
    "input",
    "textarea",
    "select",
  ].includes(tagName) && !target.isContentEditable;
}

/**
 * Produces the final toolbar button collection.
 */
export function prepareToolbarButtons(
  buttons: EnterpriseToolbarButton[] = [],
  grantedPermissions?: string[],
): EnterpriseToolbarButton[] {
  return filterToolbarButtonsByPermission(
    buttons,
    grantedPermissions,
  );
}