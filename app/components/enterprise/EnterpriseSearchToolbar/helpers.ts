import {
  ENTERPRISE_TOOLBAR_BUTTON_DEFAULT_VARIANT,
  ENTERPRISE_VIEW_MODES,
} from "./constants";

import type {
  EnterpriseFilter,
  EnterpriseToolbarButton,
  EnterpriseToolbarButtonVariant,
  EnterpriseViewMode,
} from "./types";

export function mergeToolbarClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function normalizeSearchValue(
  value: string,
): string {
  return value.trimStart();
}

export function normalizeFilterValue(
  value: string | null | undefined,
): string {
  return value ?? "";
}

export function getFilterKey(
  filter: EnterpriseFilter,
): string {
  return filter.id;
}

export function hasActiveFilter(
  filter: EnterpriseFilter,
): boolean {
  const currentValue = normalizeFilterValue(
    filter.value,
  );

  const clearValue = normalizeFilterValue(
    filter.clearValue,
  );

  return currentValue !== clearValue;
}

export function countActiveFilters(
  filters: EnterpriseFilter[],
): number {
  return filters.filter(hasActiveFilter).length;
}

export function clearAllFilters(
  filters: EnterpriseFilter[],
): void {
  for (const filter of filters) {
    if (filter.disabled) {
      continue;
    }

    filter.onChange(
      normalizeFilterValue(filter.clearValue),
    );
  }
}

export function getToolbarButtonKey(
  button: EnterpriseToolbarButton,
): string {
  return (
    button.id ??
    button.href ??
    button.label
  );
}

export function getToolbarButtonAriaLabel(
  button: EnterpriseToolbarButton,
): string {
  return button.ariaLabel ?? button.label;
}

export function resolveToolbarButtonVariant(
  button: EnterpriseToolbarButton,
): EnterpriseToolbarButtonVariant {
  return (
    button.variant ??
    ENTERPRISE_TOOLBAR_BUTTON_DEFAULT_VARIANT
  );
}

export function isExternalToolbarButton(
  button: EnterpriseToolbarButton,
): boolean {
  if (button.external !== undefined) {
    return button.external;
  }

  return Boolean(
    button.href?.startsWith("http://") ||
      button.href?.startsWith("https://"),
  );
}

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

export function isToolbarButtonUnavailable(
  button: EnterpriseToolbarButton,
): boolean {
  return Boolean(
    button.disabled ||
      button.loading ||
      button.hidden,
  );
}

export function isToolbarButtonInteractive(
  button: EnterpriseToolbarButton,
): boolean {
  if (isToolbarButtonUnavailable(button)) {
    return false;
  }

  return Boolean(
    button.href ||
      button.onClick,
  );
}

export function hasToolbarButtonPermission(
  button: EnterpriseToolbarButton,
  grantedPermissions?: string[],
): boolean {
  if (!button.permission) {
    return true;
  }

  if (!grantedPermissions) {
    return false;
  }

  return grantedPermissions.includes(
    button.permission,
  );
}

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

export function prepareToolbarButtons(
  buttons: EnterpriseToolbarButton[],
  grantedPermissions?: string[],
): EnterpriseToolbarButton[] {
  return filterToolbarButtonsByPermission(
    buttons,
    grantedPermissions,
  ).filter((button) => !button.hidden);
}

export function isEnterpriseViewMode(
  value: string,
): value is EnterpriseViewMode {
  return ENTERPRISE_VIEW_MODES.includes(
    value as EnterpriseViewMode,
  );
}

export function shouldActivateSearchShortcut(
  event: KeyboardEvent,
): boolean {
  const target = event.target;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return false;
  }

  if (
    target instanceof HTMLElement &&
    target.isContentEditable
  ) {
    return false;
  }

  return (
    event.key === "/" &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey
  );
}