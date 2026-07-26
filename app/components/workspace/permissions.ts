/**
 * EPEW-EDE-IBOS
 * Enterprise Workspace Framework
 *
 * File:
 * app/components/workspace/permissions.ts
 *
 * Purpose:
 * Centralizes role-based access rules for every enterprise workspace.
 *
 * Supported workspaces:
 *
 * - Coach Workspace
 * - Partner Workspace
 * - Supporter Workspace
 * - Vendor Workspace
 * - Administrator Workspace
 *
 * Permission format:
 *
 * module:action
 *
 * Examples:
 *
 * assignments:view
 * assignments:accept
 * entrepreneurs:update
 * reports:export
 * users:manage
 *
 * Important:
 *
 * This file defines authorization policy for interface visibility and
 * shared application logic.
 *
 * Sensitive API routes and server actions must still verify permissions
 * on the server before processing protected operations.
 */

import {
  WORKSPACE_ACTIONS,
  WORKSPACE_MODULES,
  type ExtendedWorkspaceModule,
  type ExtendedWorkspaceRole,
  type PermissionMap,
  type WorkspaceAction,
  type WorkspaceModule,
  type WorkspacePermission,
  type WorkspaceRole,
  type WorkspaceUser,
} from "./types";

/* ==========================================================================
   INTERNAL TYPES
   ========================================================================== */

export type PermissionRequirementMode = "all" | "any";

export interface PermissionCheckOptions {
  /**
   * Additional permissions assigned directly to a user.
   */
  userPermissions?: readonly WorkspacePermission[];

  /**
   * Permissions explicitly denied for a user.
   *
   * Denials always take precedence over role and user-level grants.
   */
  deniedPermissions?: readonly WorkspacePermission[];

  /**
   * When true, administrators automatically receive access to every
   * registered module and action.
   *
   * Default: true
   */
  administratorHasFullAccess?: boolean;
}

export interface PermissionRequirement {
  permissions: readonly WorkspacePermission[];
  mode?: PermissionRequirementMode;
}

export interface PermissionCheckResult {
  allowed: boolean;
  role: ExtendedWorkspaceRole | null;
  permission: WorkspacePermission;
  source:
    | "administrator"
    | "role"
    | "user"
    | "denied"
    | "unknown_role"
    | "missing";
}

export interface PermissionValidationResult {
  valid: boolean;
  permission: string;
  module?: string;
  action?: string;
  error?: string;
}

/* ==========================================================================
   REUSABLE ACTION GROUPS
   ========================================================================== */

const VIEW_ONLY_ACTIONS = ["view"] as const satisfies readonly WorkspaceAction[];

const VIEW_AND_MESSAGE_ACTIONS = [
  "view",
  "message",
] as const satisfies readonly WorkspaceAction[];

const STANDARD_CREATE_UPDATE_ACTIONS = [
  "view",
  "create",
  "update",
] as const satisfies readonly WorkspaceAction[];

const STANDARD_CONTENT_ACTIONS = [
  "view",
  "create",
  "update",
  "upload",
  "download",
] as const satisfies readonly WorkspaceAction[];

const STANDARD_REPORT_ACTIONS = [
  "view",
  "create",
  "update",
  "upload",
  "download",
  "export",
] as const satisfies readonly WorkspaceAction[];

const STANDARD_ASSIGNMENT_ACTIONS = [
  "view",
  "accept",
  "decline",
  "complete",
  "message",
] as const satisfies readonly WorkspaceAction[];

const MANAGER_ASSIGNMENT_ACTIONS = [
  "view",
  "create",
  "update",
  "assign",
  "accept",
  "decline",
  "complete",
  "reassign",
  "approve",
  "reject",
  "escalate",
  "message",
  "manage",
] as const satisfies readonly WorkspaceAction[];

const FULL_ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
  "assign",
  "accept",
  "decline",
  "complete",
  "reassign",
  "approve",
  "reject",
  "escalate",
  "message",
  "upload",
  "download",
  "export",
  "manage",
] as const satisfies readonly WorkspaceAction[];

/* ==========================================================================
   ROLE PERMISSION MAPS
   ========================================================================== */

/**
 * Coach permissions
 *
 * Coaches may manage their assigned entrepreneurs and the operational work
 * connected to those assignments.
 *
 * Coaches do not receive platform-wide administrative authority.
 */
export const COACH_PERMISSION_MAP: PermissionMap = {
  dashboard: [...VIEW_ONLY_ACTIONS],

  assignments: [...STANDARD_ASSIGNMENT_ACTIONS],

  entrepreneurs: [
    "view",
    "update",
    "message",
    "upload",
    "download",
  ],

  communications: [
    "view",
    "create",
    "update",
    "message",
  ],

  interviews: [
    "view",
    "create",
    "update",
    "complete",
    "message",
    "upload",
    "download",
  ],

  development: [
    "view",
    "create",
    "update",
    "complete",
    "message",
    "upload",
    "download",
  ],

  readiness: [
    "view",
    "create",
    "update",
    "complete",
    "approve",
    "reject",
    "message",
    "upload",
    "download",
  ],

  reports: [...STANDARD_REPORT_ACTIONS],

  documents: [...STANDARD_CONTENT_ACTIONS],

  notifications: [
    "view",
    "update",
  ],

  timeline: [...VIEW_ONLY_ACTIONS],

  calendar: [
    "view",
    "create",
    "update",
    "delete",
  ],

  tasks: [
    "view",
    "create",
    "update",
    "complete",
  ],

  search: [...VIEW_ONLY_ACTIONS],

  activity: [...VIEW_ONLY_ACTIONS],

  settings: [
    "view",
    "update",
  ],
};

/**
 * Partner permissions
 *
 * Partners may manage their assigned organizations, projects, service
 * requests, resource coordination, reports, and related communications.
 */
export const PARTNER_PERMISSION_MAP: PermissionMap = {
  dashboard: [...VIEW_ONLY_ACTIONS],

  assignments: [...STANDARD_ASSIGNMENT_ACTIONS],

  organizations: [
    "view",
    "update",
    "message",
    "upload",
    "download",
  ],

  projects: [
    "view",
    "create",
    "update",
    "complete",
    "message",
    "upload",
    "download",
  ],

  communications: [
    "view",
    "create",
    "update",
    "message",
  ],

  reports: [...STANDARD_REPORT_ACTIONS],

  documents: [...STANDARD_CONTENT_ACTIONS],

  notifications: [
    "view",
    "update",
  ],

  timeline: [...VIEW_ONLY_ACTIONS],

  calendar: [
    "view",
    "create",
    "update",
    "delete",
  ],

  tasks: [
    "view",
    "create",
    "update",
    "complete",
  ],

  search: [...VIEW_ONLY_ACTIONS],

  activity: [...VIEW_ONLY_ACTIONS],

  settings: [
    "view",
    "update",
  ],
};

/**
 * Supporter permissions
 *
 * Supporters may review and manage their own participation activity,
 * supported businesses, commitments, benefits, communications, and reports.
 */
export const SUPPORTER_PERMISSION_MAP: PermissionMap = {
  dashboard: [...VIEW_ONLY_ACTIONS],

  assignments: [
    "view",
    "accept",
    "decline",
    "complete",
    "message",
  ],

  businesses: [
    "view",
    "message",
    "download",
  ],

  benefits: [
    "view",
    "download",
  ],

  communications: [
    "view",
    "create",
    "message",
  ],

  reports: [
    "view",
    "download",
    "export",
  ],

  documents: [
    "view",
    "upload",
    "download",
  ],

  notifications: [
    "view",
    "update",
  ],

  timeline: [...VIEW_ONLY_ACTIONS],

  calendar: [
    "view",
    "create",
    "update",
    "delete",
  ],

  tasks: [
    "view",
    "create",
    "update",
    "complete",
  ],

  search: [...VIEW_ONLY_ACTIONS],

  activity: [...VIEW_ONLY_ACTIONS],

  settings: [
    "view",
    "update",
  ],
};

/**
 * Vendor permissions
 *
 * Vendors may manage assigned orders, delivery obligations, installations,
 * launch-support work, documents, reports, and operational communications.
 */
export const VENDOR_PERMISSION_MAP: PermissionMap = {
  dashboard: [...VIEW_ONLY_ACTIONS],

  assignments: [...STANDARD_ASSIGNMENT_ACTIONS],

  orders: [
    "view",
    "update",
    "accept",
    "decline",
    "complete",
    "message",
    "upload",
    "download",
  ],

  deliveries: [
    "view",
    "create",
    "update",
    "complete",
    "message",
    "upload",
    "download",
  ],

  installations: [
    "view",
    "create",
    "update",
    "complete",
    "message",
    "upload",
    "download",
  ],

  communications: [
    "view",
    "create",
    "update",
    "message",
  ],

  reports: [...STANDARD_REPORT_ACTIONS],

  documents: [...STANDARD_CONTENT_ACTIONS],

  notifications: [
    "view",
    "update",
  ],

  timeline: [...VIEW_ONLY_ACTIONS],

  calendar: [
    "view",
    "create",
    "update",
    "delete",
  ],

  tasks: [
    "view",
    "create",
    "update",
    "complete",
  ],

  search: [...VIEW_ONLY_ACTIONS],

  activity: [...VIEW_ONLY_ACTIONS],

  settings: [
    "view",
    "update",
  ],
};

/**
 * Administrator permissions
 *
 * Administrators have enterprise-wide authority across all registered
 * workspace modules and actions.
 */
export const ADMINISTRATOR_PERMISSION_MAP: PermissionMap =
  Object.fromEntries(
    WORKSPACE_MODULES.map((module) => [
      module,
      [...FULL_ACTIONS],
    ])
  ) as PermissionMap;

/* ==========================================================================
   MASTER ROLE PERMISSION MAP
   ========================================================================== */

export const WORKSPACE_ROLE_PERMISSION_MAP: Record<
  WorkspaceRole,
  PermissionMap
> = {
  coach: COACH_PERMISSION_MAP,
  partner: PARTNER_PERMISSION_MAP,
  supporter: SUPPORTER_PERMISSION_MAP,
  vendor: VENDOR_PERMISSION_MAP,
  administrator: ADMINISTRATOR_PERMISSION_MAP,
};

/* ==========================================================================
   ROLE MODULE ACCESS
   ========================================================================== */

/**
 * Lists modules that each role may enter.
 *
 * A module is considered accessible when the role has at least one action
 * registered for that module.
 */
export const WORKSPACE_ROLE_MODULE_ACCESS: Record<
  WorkspaceRole,
  readonly WorkspaceModule[]
> = {
  coach: [
    "dashboard",
    "assignments",
    "entrepreneurs",
    "communications",
    "interviews",
    "development",
    "readiness",
    "reports",
    "documents",
    "notifications",
    "timeline",
    "calendar",
    "tasks",
    "search",
    "activity",
    "settings",
  ],

  partner: [
    "dashboard",
    "assignments",
    "organizations",
    "projects",
    "communications",
    "reports",
    "documents",
    "notifications",
    "timeline",
    "calendar",
    "tasks",
    "search",
    "activity",
    "settings",
  ],

  supporter: [
    "dashboard",
    "assignments",
    "businesses",
    "benefits",
    "communications",
    "reports",
    "documents",
    "notifications",
    "timeline",
    "calendar",
    "tasks",
    "search",
    "activity",
    "settings",
  ],

  vendor: [
    "dashboard",
    "assignments",
    "orders",
    "deliveries",
    "installations",
    "communications",
    "reports",
    "documents",
    "notifications",
    "timeline",
    "calendar",
    "tasks",
    "search",
    "activity",
    "settings",
  ],

  administrator: [...WORKSPACE_MODULES],
};

/* ==========================================================================
   PERMISSION CREATION
   ========================================================================== */

/**
 * Creates a type-safe workspace permission string.
 *
 * Example:
 *
 * createWorkspacePermission("assignments", "accept")
 *
 * Returns:
 *
 * "assignments:accept"
 */
export function createWorkspacePermission(
  module: ExtendedWorkspaceModule,
  action: WorkspaceAction
): WorkspacePermission {
  return `${module}:${action}`;
}

/**
 * Converts a module/action permission map into a flat permission array.
 */
export function flattenPermissionMap(
  permissionMap: PermissionMap
): WorkspacePermission[] {
  const permissions = Object.entries(permissionMap).flatMap(
    ([module, actions]) =>
      (actions ?? []).map((action) =>
        createWorkspacePermission(
          module as ExtendedWorkspaceModule,
          action
        )
      )
  );

  return removeDuplicatePermissions(permissions);
}

/**
 * Returns every registered workspace permission.
 */
export function getAllWorkspacePermissions(): WorkspacePermission[] {
  return WORKSPACE_MODULES.flatMap((module) =>
    WORKSPACE_ACTIONS.map((action) =>
      createWorkspacePermission(module, action)
    )
  );
}

/* ==========================================================================
   ROLE VALIDATION
   ========================================================================== */

/**
 * Determines whether a value is a registered workspace role.
 */
export function isWorkspaceRole(
  role: string | null | undefined
): role is WorkspaceRole {
  if (!role) {
    return false;
  }

  return (
    role === "coach" ||
    role === "partner" ||
    role === "supporter" ||
    role === "vendor" ||
    role === "administrator"
  );
}

/**
 * Determines whether a value is a registered workspace module.
 */
export function isWorkspaceModule(
  module: string | null | undefined
): module is WorkspaceModule {
  if (!module) {
    return false;
  }

  return (WORKSPACE_MODULES as readonly string[]).includes(module);
}

/**
 * Determines whether a value is a registered workspace action.
 */
export function isWorkspaceAction(
  action: string | null | undefined
): action is WorkspaceAction {
  if (!action) {
    return false;
  }

  return (WORKSPACE_ACTIONS as readonly string[]).includes(action);
}

/* ==========================================================================
   PERMISSION PARSING AND VALIDATION
   ========================================================================== */

/**
 * Splits a permission into its module and action parts.
 */
export function parseWorkspacePermission(
  permission: string
): {
  module: string;
  action: string;
} | null {
  const separatorIndex = permission.lastIndexOf(":");

  if (
    separatorIndex <= 0 ||
    separatorIndex === permission.length - 1
  ) {
    return null;
  }

  const module = permission.slice(0, separatorIndex);
  const action = permission.slice(separatorIndex + 1);

  if (!module || !action) {
    return null;
  }

  return {
    module,
    action,
  };
}

/**
 * Validates the syntax and registered action of a permission.
 *
 * Extended modules are allowed so future modules can be introduced without
 * immediately changing all shared component types.
 */
export function validateWorkspacePermission(
  permission: string
): PermissionValidationResult {
  const parsed = parseWorkspacePermission(permission);

  if (!parsed) {
    return {
      valid: false,
      permission,
      error:
        'Permission must use the format "module:action".',
    };
  }

  if (!isWorkspaceAction(parsed.action)) {
    return {
      valid: false,
      permission,
      module: parsed.module,
      action: parsed.action,
      error: `Unknown workspace action: ${parsed.action}`,
    };
  }

  return {
    valid: true,
    permission,
    module: parsed.module,
    action: parsed.action,
  };
}

/**
 * Type guard for workspace permission strings.
 */
export function isWorkspacePermission(
  permission: string
): permission is WorkspacePermission {
  return validateWorkspacePermission(permission).valid;
}

/* ==========================================================================
   ROLE PERMISSION RETRIEVAL
   ========================================================================== */

/**
 * Returns the permission map assigned to a role.
 *
 * Unknown future roles return an empty map until explicitly registered.
 */
export function getPermissionMapForRole(
  role: ExtendedWorkspaceRole | null | undefined
): PermissionMap {
  if (!role || !isWorkspaceRole(role)) {
    return {};
  }

  return WORKSPACE_ROLE_PERMISSION_MAP[role];
}

/**
 * Returns a flat permission array for a role.
 */
export function getPermissionsForRole(
  role: ExtendedWorkspaceRole | null | undefined
): WorkspacePermission[] {
  return flattenPermissionMap(getPermissionMapForRole(role));
}

/**
 * Returns the actions a role may perform in a module.
 */
export function getAllowedActionsForRole(
  role: ExtendedWorkspaceRole | null | undefined,
  module: ExtendedWorkspaceModule
): WorkspaceAction[] {
  const permissionMap = getPermissionMapForRole(role);
  return [...(permissionMap[module] ?? [])];
}

/**
 * Returns modules available to a role.
 */
export function getAccessibleModulesForRole(
  role: ExtendedWorkspaceRole | null | undefined
): ExtendedWorkspaceModule[] {
  if (!role || !isWorkspaceRole(role)) {
    return [];
  }

  return [...WORKSPACE_ROLE_MODULE_ACCESS[role]];
}

/* ==========================================================================
   CORE PERMISSION CHECKS
   ========================================================================== */

/**
 * Checks whether a role has a permission.
 *
 * Denied permissions always take precedence.
 * User permissions supplement role permissions.
 * Administrators receive full access by default.
 */
export function checkWorkspacePermission(
  role: ExtendedWorkspaceRole | null | undefined,
  permission: WorkspacePermission,
  options: PermissionCheckOptions = {}
): PermissionCheckResult {
  const {
    userPermissions = [],
    deniedPermissions = [],
    administratorHasFullAccess = true,
  } = options;

  if (deniedPermissions.includes(permission)) {
    return {
      allowed: false,
      role: role ?? null,
      permission,
      source: "denied",
    };
  }

  if (!role) {
    return {
      allowed: false,
      role: null,
      permission,
      source: "unknown_role",
    };
  }

  if (
    role === "administrator" &&
    administratorHasFullAccess
  ) {
    return {
      allowed: true,
      role,
      permission,
      source: "administrator",
    };
  }

  if (userPermissions.includes(permission)) {
    return {
      allowed: true,
      role,
      permission,
      source: "user",
    };
  }

  if (!isWorkspaceRole(role)) {
    return {
      allowed: false,
      role,
      permission,
      source: "unknown_role",
    };
  }

  const rolePermissions = getPermissionsForRole(role);

  if (rolePermissions.includes(permission)) {
    return {
      allowed: true,
      role,
      permission,
      source: "role",
    };
  }

  return {
    allowed: false,
    role,
    permission,
    source: "missing",
  };
}

/**
 * Boolean convenience wrapper for permission checks.
 */
export function hasPermission(
  role: ExtendedWorkspaceRole | null | undefined,
  permission: WorkspacePermission,
  options: PermissionCheckOptions = {}
): boolean {
  return checkWorkspacePermission(
    role,
    permission,
    options
  ).allowed;
}

/**
 * Checks permission using separate module and action values.
 */
export function canPerformWorkspaceAction(
  role: ExtendedWorkspaceRole | null | undefined,
  module: ExtendedWorkspaceModule,
  action: WorkspaceAction,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    createWorkspacePermission(module, action),
    options
  );
}

/**
 * Determines whether a role can enter a module.
 *
 * A role may access a module when it has at least one registered action for
 * that module or when the administrator override applies.
 */
export function canAccessWorkspaceModule(
  role: ExtendedWorkspaceRole | null | undefined,
  module: ExtendedWorkspaceModule,
  options: PermissionCheckOptions = {}
): boolean {
  const {
    administratorHasFullAccess = true,
    userPermissions = [],
    deniedPermissions = [],
  } = options;

  if (
    role === "administrator" &&
    administratorHasFullAccess
  ) {
    return true;
  }

  const modulePrefix = `${module}:`;

  const hasExplicitDenialForEveryAction = WORKSPACE_ACTIONS.every(
    (action) =>
      deniedPermissions.includes(
        createWorkspacePermission(module, action)
      )
  );

  if (hasExplicitDenialForEveryAction) {
    return false;
  }

  const userHasModulePermission = userPermissions.some(
    (permission) =>
      permission.startsWith(modulePrefix) &&
      !deniedPermissions.includes(permission)
  );

  if (userHasModulePermission) {
    return true;
  }

  return getAllowedActionsForRole(role, module).some(
    (action) =>
      !deniedPermissions.includes(
        createWorkspacePermission(module, action)
      )
  );
}

/* ==========================================================================
   MULTIPLE PERMISSION CHECKS
   ========================================================================== */

/**
 * Checks whether a role has every required permission.
 */
export function hasAllPermissions(
  role: ExtendedWorkspaceRole | null | undefined,
  permissions: readonly WorkspacePermission[],
  options: PermissionCheckOptions = {}
): boolean {
  if (permissions.length === 0) {
    return true;
  }

  return permissions.every((permission) =>
    hasPermission(role, permission, options)
  );
}

/**
 * Checks whether a role has at least one required permission.
 */
export function hasAnyPermission(
  role: ExtendedWorkspaceRole | null | undefined,
  permissions: readonly WorkspacePermission[],
  options: PermissionCheckOptions = {}
): boolean {
  if (permissions.length === 0) {
    return false;
  }

  return permissions.some((permission) =>
    hasPermission(role, permission, options)
  );
}

/**
 * Evaluates a reusable permission requirement.
 */
export function satisfiesPermissionRequirement(
  role: ExtendedWorkspaceRole | null | undefined,
  requirement: PermissionRequirement,
  options: PermissionCheckOptions = {}
): boolean {
  const mode = requirement.mode ?? "all";

  if (mode === "any") {
    return hasAnyPermission(
      role,
      requirement.permissions,
      options
    );
  }

  return hasAllPermissions(
    role,
    requirement.permissions,
    options
  );
}

/* ==========================================================================
   USER-BASED PERMISSION CHECKS
   ========================================================================== */

/**
 * Checks a permission directly against a WorkspaceUser.
 */
export function userHasPermission(
  user: WorkspaceUser | null | undefined,
  permission: WorkspacePermission,
  deniedPermissions: readonly WorkspacePermission[] = []
): boolean {
  if (!user) {
    return false;
  }

  return hasPermission(user.role, permission, {
    userPermissions: user.permissions ?? [],
    deniedPermissions,
  });
}

/**
 * Checks whether a user has every required permission.
 */
export function userHasAllPermissions(
  user: WorkspaceUser | null | undefined,
  permissions: readonly WorkspacePermission[],
  deniedPermissions: readonly WorkspacePermission[] = []
): boolean {
  if (!user) {
    return false;
  }

  return hasAllPermissions(user.role, permissions, {
    userPermissions: user.permissions ?? [],
    deniedPermissions,
  });
}

/**
 * Checks whether a user has at least one required permission.
 */
export function userHasAnyPermission(
  user: WorkspaceUser | null | undefined,
  permissions: readonly WorkspacePermission[],
  deniedPermissions: readonly WorkspacePermission[] = []
): boolean {
  if (!user) {
    return false;
  }

  return hasAnyPermission(user.role, permissions, {
    userPermissions: user.permissions ?? [],
    deniedPermissions,
  });
}

/**
 * Checks whether a user may access a module.
 */
export function userCanAccessModule(
  user: WorkspaceUser | null | undefined,
  module: ExtendedWorkspaceModule,
  deniedPermissions: readonly WorkspacePermission[] = []
): boolean {
  if (!user) {
    return false;
  }

  return canAccessWorkspaceModule(user.role, module, {
    userPermissions: user.permissions ?? [],
    deniedPermissions,
  });
}

/* ==========================================================================
   PERMISSION FILTERING
   ========================================================================== */

/**
 * Removes duplicate permissions while preserving insertion order.
 */
export function removeDuplicatePermissions(
  permissions: readonly WorkspacePermission[]
): WorkspacePermission[] {
  return Array.from(new Set(permissions));
}

/**
 * Combines multiple permission arrays.
 */
export function mergePermissions(
  ...permissionGroups: readonly WorkspacePermission[][]
): WorkspacePermission[] {
  return removeDuplicatePermissions(
    permissionGroups.flat()
  );
}

/**
 * Removes denied permissions from a granted permission list.
 */
export function excludeDeniedPermissions(
  permissions: readonly WorkspacePermission[],
  deniedPermissions: readonly WorkspacePermission[]
): WorkspacePermission[] {
  const denied = new Set(deniedPermissions);

  return permissions.filter(
    (permission) => !denied.has(permission)
  );
}

/**
 * Returns the effective permission set for a role and optional user grants.
 */
export function getEffectivePermissions(
  role: ExtendedWorkspaceRole | null | undefined,
  userPermissions: readonly WorkspacePermission[] = [],
  deniedPermissions: readonly WorkspacePermission[] = [],
  administratorHasFullAccess = true
): WorkspacePermission[] {
  const rolePermissions =
    role === "administrator" &&
    administratorHasFullAccess
      ? getAllWorkspacePermissions()
      : getPermissionsForRole(role);

  return excludeDeniedPermissions(
  mergePermissions(
    [...rolePermissions],
    [...userPermissions]
  ),
  [...deniedPermissions]
);
}

/**
 * Filters a permission list by module.
 */
export function filterPermissionsByModule(
  permissions: readonly WorkspacePermission[],
  module: ExtendedWorkspaceModule
): WorkspacePermission[] {
  const prefix = `${module}:`;

  return permissions.filter((permission) =>
    permission.startsWith(prefix)
  );
}

/**
 * Filters modules based on role access.
 */
export function filterAccessibleModules(
  role: ExtendedWorkspaceRole | null | undefined,
  modules: readonly ExtendedWorkspaceModule[],
  options: PermissionCheckOptions = {}
): ExtendedWorkspaceModule[] {
  return modules.filter((module) =>
    canAccessWorkspaceModule(role, module, options)
  );
}

/**
 * Filters arbitrary items that define a required permission.
 */
export function filterByPermission<
  T extends {
    requiredPermission?: WorkspacePermission;
  },
>(
  role: ExtendedWorkspaceRole | null | undefined,
  items: readonly T[],
  options: PermissionCheckOptions = {}
): T[] {
  return items.filter((item) => {
    if (!item.requiredPermission) {
      return true;
    }

    return hasPermission(
      role,
      item.requiredPermission,
      options
    );
  });
}

/**
 * Filters arbitrary items that define multiple required permissions.
 */
export function filterByPermissions<
  T extends {
    requiredPermissions?: readonly WorkspacePermission[];
    permissionMode?: PermissionRequirementMode;
  },
>(
  role: ExtendedWorkspaceRole | null | undefined,
  items: readonly T[],
  options: PermissionCheckOptions = {}
): T[] {
  return items.filter((item) => {
    const permissions = item.requiredPermissions;

    if (!permissions || permissions.length === 0) {
      return true;
    }

    return satisfiesPermissionRequirement(
      role,
      {
        permissions,
        mode: item.permissionMode ?? "all",
      },
      options
    );
  });
}

/* ==========================================================================
   COMMON PERMISSION CONSTANTS
   ========================================================================== */

export const WORKSPACE_PERMISSIONS = {
  dashboard: {
    view: createWorkspacePermission("dashboard", "view"),
  },

  assignments: {
    view: createWorkspacePermission("assignments", "view"),
    create: createWorkspacePermission("assignments", "create"),
    update: createWorkspacePermission("assignments", "update"),
    delete: createWorkspacePermission("assignments", "delete"),
    assign: createWorkspacePermission("assignments", "assign"),
    accept: createWorkspacePermission("assignments", "accept"),
    decline: createWorkspacePermission("assignments", "decline"),
    complete: createWorkspacePermission("assignments", "complete"),
    reassign: createWorkspacePermission(
      "assignments",
      "reassign"
    ),
    approve: createWorkspacePermission("assignments", "approve"),
    reject: createWorkspacePermission("assignments", "reject"),
    escalate: createWorkspacePermission(
      "assignments",
      "escalate"
    ),
    message: createWorkspacePermission("assignments", "message"),
    manage: createWorkspacePermission("assignments", "manage"),
  },

  entrepreneurs: {
    view: createWorkspacePermission("entrepreneurs", "view"),
    create: createWorkspacePermission("entrepreneurs", "create"),
    update: createWorkspacePermission("entrepreneurs", "update"),
    delete: createWorkspacePermission("entrepreneurs", "delete"),
    approve: createWorkspacePermission(
      "entrepreneurs",
      "approve"
    ),
    reject: createWorkspacePermission("entrepreneurs", "reject"),
    message: createWorkspacePermission(
      "entrepreneurs",
      "message"
    ),
    upload: createWorkspacePermission("entrepreneurs", "upload"),
    download: createWorkspacePermission(
      "entrepreneurs",
      "download"
    ),
    manage: createWorkspacePermission("entrepreneurs", "manage"),
  },

  organizations: {
    view: createWorkspacePermission("organizations", "view"),
    create: createWorkspacePermission("organizations", "create"),
    update: createWorkspacePermission("organizations", "update"),
    delete: createWorkspacePermission("organizations", "delete"),
    message: createWorkspacePermission(
      "organizations",
      "message"
    ),
    upload: createWorkspacePermission("organizations", "upload"),
    download: createWorkspacePermission(
      "organizations",
      "download"
    ),
    manage: createWorkspacePermission("organizations", "manage"),
  },

  businesses: {
    view: createWorkspacePermission("businesses", "view"),
    create: createWorkspacePermission("businesses", "create"),
    update: createWorkspacePermission("businesses", "update"),
    delete: createWorkspacePermission("businesses", "delete"),
    approve: createWorkspacePermission("businesses", "approve"),
    reject: createWorkspacePermission("businesses", "reject"),
    message: createWorkspacePermission("businesses", "message"),
    upload: createWorkspacePermission("businesses", "upload"),
    download: createWorkspacePermission("businesses", "download"),
    manage: createWorkspacePermission("businesses", "manage"),
  },

  orders: {
    view: createWorkspacePermission("orders", "view"),
    create: createWorkspacePermission("orders", "create"),
    update: createWorkspacePermission("orders", "update"),
    delete: createWorkspacePermission("orders", "delete"),
    accept: createWorkspacePermission("orders", "accept"),
    decline: createWorkspacePermission("orders", "decline"),
    complete: createWorkspacePermission("orders", "complete"),
    message: createWorkspacePermission("orders", "message"),
    upload: createWorkspacePermission("orders", "upload"),
    download: createWorkspacePermission("orders", "download"),
    manage: createWorkspacePermission("orders", "manage"),
  },

  users: {
    view: createWorkspacePermission("users", "view"),
    create: createWorkspacePermission("users", "create"),
    update: createWorkspacePermission("users", "update"),
    delete: createWorkspacePermission("users", "delete"),
    approve: createWorkspacePermission("users", "approve"),
    reject: createWorkspacePermission("users", "reject"),
    manage: createWorkspacePermission("users", "manage"),
  },

  communications: {
    view: createWorkspacePermission("communications", "view"),
    create: createWorkspacePermission(
      "communications",
      "create"
    ),
    update: createWorkspacePermission(
      "communications",
      "update"
    ),
    delete: createWorkspacePermission(
      "communications",
      "delete"
    ),
    message: createWorkspacePermission(
      "communications",
      "message"
    ),
    manage: createWorkspacePermission(
      "communications",
      "manage"
    ),
  },

  interviews: {
    view: createWorkspacePermission("interviews", "view"),
    create: createWorkspacePermission("interviews", "create"),
    update: createWorkspacePermission("interviews", "update"),
    delete: createWorkspacePermission("interviews", "delete"),
    complete: createWorkspacePermission(
      "interviews",
      "complete"
    ),
    message: createWorkspacePermission("interviews", "message"),
    upload: createWorkspacePermission("interviews", "upload"),
    download: createWorkspacePermission(
      "interviews",
      "download"
    ),
    manage: createWorkspacePermission("interviews", "manage"),
  },

  development: {
    view: createWorkspacePermission("development", "view"),
    create: createWorkspacePermission("development", "create"),
    update: createWorkspacePermission("development", "update"),
    delete: createWorkspacePermission("development", "delete"),
    complete: createWorkspacePermission(
      "development",
      "complete"
    ),
    message: createWorkspacePermission(
      "development",
      "message"
    ),
    upload: createWorkspacePermission("development", "upload"),
    download: createWorkspacePermission(
      "development",
      "download"
    ),
    manage: createWorkspacePermission("development", "manage"),
  },

  readiness: {
    view: createWorkspacePermission("readiness", "view"),
    create: createWorkspacePermission("readiness", "create"),
    update: createWorkspacePermission("readiness", "update"),
    delete: createWorkspacePermission("readiness", "delete"),
    complete: createWorkspacePermission("readiness", "complete"),
    approve: createWorkspacePermission("readiness", "approve"),
    reject: createWorkspacePermission("readiness", "reject"),
    message: createWorkspacePermission("readiness", "message"),
    upload: createWorkspacePermission("readiness", "upload"),
    download: createWorkspacePermission(
      "readiness",
      "download"
    ),
    manage: createWorkspacePermission("readiness", "manage"),
  },

  projects: {
    view: createWorkspacePermission("projects", "view"),
    create: createWorkspacePermission("projects", "create"),
    update: createWorkspacePermission("projects", "update"),
    delete: createWorkspacePermission("projects", "delete"),
    complete: createWorkspacePermission("projects", "complete"),
    message: createWorkspacePermission("projects", "message"),
    upload: createWorkspacePermission("projects", "upload"),
    download: createWorkspacePermission("projects", "download"),
    manage: createWorkspacePermission("projects", "manage"),
  },

  benefits: {
    view: createWorkspacePermission("benefits", "view"),
    create: createWorkspacePermission("benefits", "create"),
    update: createWorkspacePermission("benefits", "update"),
    delete: createWorkspacePermission("benefits", "delete"),
    approve: createWorkspacePermission("benefits", "approve"),
    reject: createWorkspacePermission("benefits", "reject"),
    download: createWorkspacePermission("benefits", "download"),
    manage: createWorkspacePermission("benefits", "manage"),
  },

  deliveries: {
    view: createWorkspacePermission("deliveries", "view"),
    create: createWorkspacePermission("deliveries", "create"),
    update: createWorkspacePermission("deliveries", "update"),
    delete: createWorkspacePermission("deliveries", "delete"),
    complete: createWorkspacePermission(
      "deliveries",
      "complete"
    ),
    message: createWorkspacePermission("deliveries", "message"),
    upload: createWorkspacePermission("deliveries", "upload"),
    download: createWorkspacePermission(
      "deliveries",
      "download"
    ),
    manage: createWorkspacePermission("deliveries", "manage"),
  },

  installations: {
    view: createWorkspacePermission("installations", "view"),
    create: createWorkspacePermission(
      "installations",
      "create"
    ),
    update: createWorkspacePermission(
      "installations",
      "update"
    ),
    delete: createWorkspacePermission(
      "installations",
      "delete"
    ),
    complete: createWorkspacePermission(
      "installations",
      "complete"
    ),
    message: createWorkspacePermission(
      "installations",
      "message"
    ),
    upload: createWorkspacePermission(
      "installations",
      "upload"
    ),
    download: createWorkspacePermission(
      "installations",
      "download"
    ),
    manage: createWorkspacePermission(
      "installations",
      "manage"
    ),
  },

  approvals: {
    view: createWorkspacePermission("approvals", "view"),
    create: createWorkspacePermission("approvals", "create"),
    update: createWorkspacePermission("approvals", "update"),
    approve: createWorkspacePermission("approvals", "approve"),
    reject: createWorkspacePermission("approvals", "reject"),
    escalate: createWorkspacePermission(
      "approvals",
      "escalate"
    ),
    manage: createWorkspacePermission("approvals", "manage"),
  },

  compliance: {
    view: createWorkspacePermission("compliance", "view"),
    create: createWorkspacePermission("compliance", "create"),
    update: createWorkspacePermission("compliance", "update"),
    approve: createWorkspacePermission("compliance", "approve"),
    reject: createWorkspacePermission("compliance", "reject"),
    escalate: createWorkspacePermission(
      "compliance",
      "escalate"
    ),
    export: createWorkspacePermission("compliance", "export"),
    manage: createWorkspacePermission("compliance", "manage"),
  },

  analytics: {
    view: createWorkspacePermission("analytics", "view"),
    download: createWorkspacePermission("analytics", "download"),
    export: createWorkspacePermission("analytics", "export"),
    manage: createWorkspacePermission("analytics", "manage"),
  },

  reports: {
    view: createWorkspacePermission("reports", "view"),
    create: createWorkspacePermission("reports", "create"),
    update: createWorkspacePermission("reports", "update"),
    delete: createWorkspacePermission("reports", "delete"),
    approve: createWorkspacePermission("reports", "approve"),
    reject: createWorkspacePermission("reports", "reject"),
    upload: createWorkspacePermission("reports", "upload"),
    download: createWorkspacePermission("reports", "download"),
    export: createWorkspacePermission("reports", "export"),
    manage: createWorkspacePermission("reports", "manage"),
  },

  documents: {
    view: createWorkspacePermission("documents", "view"),
    create: createWorkspacePermission("documents", "create"),
    update: createWorkspacePermission("documents", "update"),
    delete: createWorkspacePermission("documents", "delete"),
    approve: createWorkspacePermission("documents", "approve"),
    reject: createWorkspacePermission("documents", "reject"),
    upload: createWorkspacePermission("documents", "upload"),
    download: createWorkspacePermission(
      "documents",
      "download"
    ),
    manage: createWorkspacePermission("documents", "manage"),
  },

  notifications: {
    view: createWorkspacePermission("notifications", "view"),
    update: createWorkspacePermission("notifications", "update"),
    delete: createWorkspacePermission("notifications", "delete"),
    manage: createWorkspacePermission("notifications", "manage"),
  },

  timeline: {
    view: createWorkspacePermission("timeline", "view"),
    create: createWorkspacePermission("timeline", "create"),
    update: createWorkspacePermission("timeline", "update"),
    export: createWorkspacePermission("timeline", "export"),
    manage: createWorkspacePermission("timeline", "manage"),
  },

  calendar: {
    view: createWorkspacePermission("calendar", "view"),
    create: createWorkspacePermission("calendar", "create"),
    update: createWorkspacePermission("calendar", "update"),
    delete: createWorkspacePermission("calendar", "delete"),
    manage: createWorkspacePermission("calendar", "manage"),
  },

  tasks: {
    view: createWorkspacePermission("tasks", "view"),
    create: createWorkspacePermission("tasks", "create"),
    update: createWorkspacePermission("tasks", "update"),
    delete: createWorkspacePermission("tasks", "delete"),
    assign: createWorkspacePermission("tasks", "assign"),
    complete: createWorkspacePermission("tasks", "complete"),
    reassign: createWorkspacePermission("tasks", "reassign"),
    manage: createWorkspacePermission("tasks", "manage"),
  },

  search: {
    view: createWorkspacePermission("search", "view"),
    export: createWorkspacePermission("search", "export"),
    manage: createWorkspacePermission("search", "manage"),
  },

  activity: {
    view: createWorkspacePermission("activity", "view"),
    export: createWorkspacePermission("activity", "export"),
    manage: createWorkspacePermission("activity", "manage"),
  },

  settings: {
    view: createWorkspacePermission("settings", "view"),
    update: createWorkspacePermission("settings", "update"),
    manage: createWorkspacePermission("settings", "manage"),
  },
} as const;

/* ==========================================================================
   COMMON PERMISSION REQUIREMENTS
   ========================================================================== */

export const ASSIGNMENT_RESPONSE_PERMISSION_REQUIREMENT: PermissionRequirement =
  {
    permissions: [
      WORKSPACE_PERMISSIONS.assignments.accept,
      WORKSPACE_PERMISSIONS.assignments.decline,
    ],
    mode: "any",
  };

export const ASSIGNMENT_MANAGEMENT_PERMISSION_REQUIREMENT: PermissionRequirement =
  {
    permissions: [
      WORKSPACE_PERMISSIONS.assignments.create,
      WORKSPACE_PERMISSIONS.assignments.assign,
      WORKSPACE_PERMISSIONS.assignments.reassign,
      WORKSPACE_PERMISSIONS.assignments.manage,
    ],
    mode: "any",
  };

export const REPORT_CREATION_PERMISSION_REQUIREMENT: PermissionRequirement =
  {
    permissions: [
      WORKSPACE_PERMISSIONS.reports.create,
      WORKSPACE_PERMISSIONS.reports.update,
    ],
    mode: "any",
  };

export const DOCUMENT_MANAGEMENT_PERMISSION_REQUIREMENT: PermissionRequirement =
  {
    permissions: [
      WORKSPACE_PERMISSIONS.documents.upload,
      WORKSPACE_PERMISSIONS.documents.update,
      WORKSPACE_PERMISSIONS.documents.manage,
    ],
    mode: "any",
  };

/* ==========================================================================
   ROLE CAPABILITY HELPERS
   ========================================================================== */

export function canViewDashboard(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.dashboard.view,
    options
  );
}

export function canViewAssignments(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.assignments.view,
    options
  );
}

export function canAcceptAssignments(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.assignments.accept,
    options
  );
}

export function canDeclineAssignments(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.assignments.decline,
    options
  );
}

export function canCompleteAssignments(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.assignments.complete,
    options
  );
}

export function canReassignAssignments(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.assignments.reassign,
    options
  );
}

export function canManageAssignments(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return satisfiesPermissionRequirement(
    role,
    ASSIGNMENT_MANAGEMENT_PERMISSION_REQUIREMENT,
    options
  );
}

export function canSendWorkspaceMessages(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.communications.message,
    options
  );
}

export function canUploadDocuments(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.documents.upload,
    options
  );
}

export function canDownloadDocuments(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.documents.download,
    options
  );
}

export function canExportReports(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.reports.export,
    options
  );
}

export function canManageUsers(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.users.manage,
    options
  );
}

export function canManageCompliance(
  role: ExtendedWorkspaceRole | null | undefined,
  options: PermissionCheckOptions = {}
): boolean {
  return hasPermission(
    role,
    WORKSPACE_PERMISSIONS.compliance.manage,
    options
  );
}

/* ==========================================================================
   SAFE DEFAULTS
   ========================================================================== */

export const EMPTY_PERMISSION_MAP: PermissionMap = {};

export const NO_WORKSPACE_PERMISSIONS:
  readonly WorkspacePermission[] = [];

export const DEFAULT_PERMISSION_REQUIREMENT_MODE:
  PermissionRequirementMode = "all";

/* ==========================================================================
   DEVELOPMENT VALIDATION
   ========================================================================== */

/**
 * Reviews the configured role permission maps and returns configuration
 * problems.
 *
 * This can be used during development or in tests.
 */
export function validateRolePermissionConfiguration(): string[] {
  const errors: string[] = [];

  for (const [role, permissionMap] of Object.entries(
    WORKSPACE_ROLE_PERMISSION_MAP
  )) {
    for (const [module, actions] of Object.entries(
      permissionMap
    )) {
      if (!isWorkspaceModule(module)) {
        errors.push(
          `Role "${role}" contains unknown module "${module}".`
        );
      }

      for (const action of actions ?? []) {
        if (!isWorkspaceAction(action)) {
          errors.push(
            `Role "${role}" contains unknown action "${String(
              action
            )}" for module "${module}".`
          );
        }
      }
    }
  }

  return errors;
}

/**
 * Throws during development when the role permission configuration is
 * invalid.
 */
export function assertValidRolePermissionConfiguration(): void {
  const errors = validateRolePermissionConfiguration();

  if (errors.length > 0) {
    throw new Error(
      [
        "Invalid Enterprise Workspace permission configuration:",
        ...errors.map((error) => `- ${error}`),
      ].join("\n")
    );
  }
}