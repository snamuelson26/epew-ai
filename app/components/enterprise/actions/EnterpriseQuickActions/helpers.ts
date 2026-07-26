import {
  ENTERPRISE_ACTION_CATEGORY_ORDER,
  ENTERPRISE_ACTION_DEFAULT_VARIANT,
} from "./constants";

import type {
  EnterpriseActionCategory,
  EnterpriseActionGroup,
  EnterpriseActionVariant,
  EnterpriseQuickAction,
} from "./types";

/**
 * Combines conditional Tailwind class names safely.
 */
export function mergeActionClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Resolves the visual variant assigned to an action.
 */
export function resolveActionVariant(
  action: EnterpriseQuickAction,
): EnterpriseActionVariant {
  return action.variant ?? ENTERPRISE_ACTION_DEFAULT_VARIANT;
}

/**
 * Determines whether an action has an executable destination.
 */
export function isActionInteractive(
  action: EnterpriseQuickAction,
): boolean {
  return Boolean(action.href || action.onClick);
}

/**
 * Determines whether an action should be treated as unavailable.
 */
export function isActionUnavailable(
  action: EnterpriseQuickAction,
): boolean {
  return Boolean(
    action.disabled ||
      action.loading ||
      !isActionInteractive(action),
  );
}

/**
 * Determines whether an action should be visible based on permissions.
 *
 * When no permission is assigned to the action, it remains visible.
 * When no permissions array is supplied, permission filtering is skipped.
 */
export function hasActionPermission(
  action: EnterpriseQuickAction,
  grantedPermissions?: string[],
): boolean {
  if (!action.permission) {
    return true;
  }

  if (!grantedPermissions) {
    return true;
  }

  return grantedPermissions.includes(action.permission);
}

/**
 * Filters actions according to the administrator's granted permissions.
 */
export function filterActionsByPermission(
  actions: EnterpriseQuickAction[],
  grantedPermissions?: string[],
): EnterpriseQuickAction[] {
  return actions.filter((action) =>
    hasActionPermission(action, grantedPermissions),
  );
}

/**
 * Removes empty groups after permission filtering.
 */
export function filterActionGroupsByPermission(
  groups: EnterpriseActionGroup[],
  grantedPermissions?: string[],
): EnterpriseActionGroup[] {
  return groups
    .map((group) => ({
      ...group,
      actions: filterActionsByPermission(
        group.actions,
        grantedPermissions,
      ),
    }))
    .filter((group) => group.actions.length > 0);
}

/**
 * Returns the standard display order for an action category.
 */
export function getActionCategoryOrder(
  category: EnterpriseActionCategory,
): number {
  const index =
    ENTERPRISE_ACTION_CATEGORY_ORDER.indexOf(category);

  return index === -1
    ? ENTERPRISE_ACTION_CATEGORY_ORDER.length
    : index;
}

/**
 * Sorts groups according to the official EADS category order.
 */
export function sortActionGroups(
  groups: EnterpriseActionGroup[],
): EnterpriseActionGroup[] {
  return [...groups].sort((left, right) => {
    const categoryDifference =
      getActionCategoryOrder(left.category) -
      getActionCategoryOrder(right.category);

    if (categoryDifference !== 0) {
      return categoryDifference;
    }

    return left.title.localeCompare(right.title);
  });
}

/**
 * Returns a stable React key for an action.
 */
export function getActionKey(
  action: EnterpriseQuickAction,
): string {
  return `${action.category}-${action.id}`;
}

/**
 * Returns a stable React key for an action group.
 */
export function getActionGroupKey(
  group: EnterpriseActionGroup,
): string {
  return `${group.category}-${group.id}`;
}

/**
 * Returns an accessible label for an action.
 */
export function getActionAriaLabel(
  action: EnterpriseQuickAction,
): string {
  const state = action.loading ? "Loading" : action.disabled ? "Disabled" : "";

  return [action.title, action.description, state]
    .filter(Boolean)
    .join(". ");
}

/**
 * Determines whether an action opens an external destination.
 */
export function isExternalAction(
  action: EnterpriseQuickAction,
): boolean {
  return Boolean(action.external && action.href);
}

/**
 * Returns the secure link attributes for an action.
 */
export function getExternalLinkAttributes(
  action: EnterpriseQuickAction,
): {
  target?: "_blank";
  rel?: "noopener noreferrer";
} {
  if (!isExternalAction(action)) {
    return {};
  }

  return {
    target: "_blank",
    rel: "noopener noreferrer",
  };
}

/**
 * Counts all visible actions across all groups.
 */
export function countActions(
  groups: EnterpriseActionGroup[],
): number {
  return groups.reduce(
    (total, group) => total + group.actions.length,
    0,
  );
}

/**
 * Produces the final normalized group collection used by the component.
 */
export function prepareActionGroups(
  groups: EnterpriseActionGroup[],
  grantedPermissions?: string[],
): EnterpriseActionGroup[] {
  const permittedGroups = filterActionGroupsByPermission(
    groups,
    grantedPermissions,
  );

  return sortActionGroups(permittedGroups);
}