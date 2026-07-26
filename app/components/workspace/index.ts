/**
 * EPEW-EDE-IBOS
 * Enterprise Workspace Framework
 *
 * File:
 * app/components/workspace/index.ts
 *
 * Purpose:
 * Single public entry point for the Enterprise Workspace Framework.
 *
 * Every workspace imports from here instead of importing
 * individual files directly.
 *
 * Example:
 *
 * import {
 *   WorkspaceAssignment,
 *   WORKSPACE_ROLE_BRANDING,
 *   hasPermission,
 *   formatDate,
 *   buildWorkspaceNavigation,
 * } from "@/components/workspace";
 */

/* ==========================================================================
   TYPES
   ========================================================================== */

export * from "./types";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

export * from "./constants";

/* ==========================================================================
   PERMISSIONS
   ========================================================================== */

export * from "./permissions";

/* ==========================================================================
   UTILITIES
   ========================================================================== */

export * from "./utils";

// Resolve ambiguous re-exports by explicitly exporting these types from ./types
export type { PaginatedResult, SortDirection } from "./types";