/**
 * EPEW-EDE-IBOS
 * Enterprise Workspace Framework
 *
 * File:
 * app/components/workspace/utils.ts
 *
 * Purpose:
 * Provides shared utility functions for every enterprise workspace:
 *
 * - Coach Workspace
 * - Partner Workspace
 * - Supporter Workspace
 * - Vendor Workspace
 * - Administrator Workspace
 *
 * Responsibilities:
 *
 * - Date and time formatting
 * - Assignment countdown calculations
 * - Assignment sorting and grouping
 * - Status and priority presentation
 * - Navigation construction
 * - Permission-aware navigation filtering
 * - Breadcrumb generation
 * - Dashboard metric calculations
 * - Search normalization and matching
 * - Pagination
 * - Safe text and number formatting
 *
 * This file contains reusable functions only.
 */

import {
  ASSIGNMENT_COUNTDOWN_THRESHOLDS,
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_STYLES,
  DATE_FORMATS,
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  DEFAULT_TIME_FORMAT,
  NOTIFICATION_STATUS_LABELS,
  NOTIFICATION_TYPE_ICONS,
  NOTIFICATION_TYPE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  PRIORITY_WEIGHTS,
  RECORD_STATUS_LABELS,
  RECORD_STATUS_STYLES,
  WORKSPACE_BASE_PATHS,
  WORKSPACE_MODULE_DESCRIPTIONS,
  WORKSPACE_MODULE_ICONS,
  WORKSPACE_MODULE_LABELS,
  WORKSPACE_OPERATIONAL_MODULES,
  WORKSPACE_PRIMARY_MODULES,
  WORKSPACE_ROLE_BRANDING,
  WORKSPACE_SHARED_MODULES,
} from "./constants";

import {
  canAccessWorkspaceModule,
  canPerformWorkspaceAction,
  createWorkspacePermission,
  type PermissionCheckOptions,
} from "./permissions";

import type {
  AssignmentSort,
  AssignmentStatus,
  ExtendedWorkspaceModule,
  ExtendedWorkspaceRole,
  NotificationStatus,
  NotificationType,
  PriorityLevel,
  RecordStatus,
  WorkspaceAction,
  WorkspaceAssignment,
  WorkspaceMetric,
  WorkspaceModule,
  WorkspaceNavigationItem,
  WorkspacePermission,
  WorkspaceRole,
  WorkspaceUser,
} from "./types";

/* ==========================================================================
   INTERNAL UTILITY TYPES
   ========================================================================== */

export type DateInput = Date | string | number | null | undefined;

export type SortDirection = "asc" | "desc";

export type CountdownUrgency =
  | "expired"
  | "critical"
  | "urgent"
  | "warning"
  | "normal"
  | "none";

export interface AssignmentCountdown {
  deadline: Date | null;
  now: Date;
  isExpired: boolean;
  totalMilliseconds: number;
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  urgency: CountdownUrgency;
  label: string;
  compactLabel: string;
}

export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  previousPage: number | null;
  nextPage: number | null;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMetadata;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  module?: ExtendedWorkspaceModule;
  isCurrent?: boolean;
}

export interface WorkspaceNavigationBuildOptions {
  includeSharedModules?: boolean;
  includeOperationalModules?: boolean;
  includeSettings?: boolean;
  includeDashboard?: boolean;
  modules?: readonly ExtendedWorkspaceModule[];
  permissionOptions?: PermissionCheckOptions;
  badgeCounts?: Partial<Record<ExtendedWorkspaceModule, number>>;
}

export interface SearchableValue {
  [key: string]: unknown;
}

export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

export interface CompletionSummary {
  completed: number;
  total: number;
  remaining: number;
  percentage: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

interface AssignmentLike {
  id?: string;
  title?: string;
  status?: AssignmentStatus | string;
  priority?: PriorityLevel | string;
  acknowledgmentDeadline?: DateInput;
  dueDate?: DateInput;
  deadline?: DateInput;
  assignedAt?: DateInput;
  createdAt?: DateInput;
  updatedAt?: DateInput;
  completedAt?: DateInput;
}

interface MetricLike {
  value?: number | string | null;
  previousValue?: number | string | null;
}

/* ==========================================================================
   BASIC VALUE HELPERS
   ========================================================================== */

export function isDefined<T>(
  value: T | null | undefined
): value is T {
  return value !== null && value !== undefined;
}

export function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export function asTrimmedString(
  value: unknown,
  fallback = ""
): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return fallback;
}

export function safeArray<T>(
  value: readonly T[] | null | undefined
): T[] {
  return Array.isArray(value) ? [...value] : [];
}

export function uniqueValues<T>(
  values: readonly T[]
): T[] {
  return Array.from(new Set(values));
}

export function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}

export function roundTo(
  value: number,
  decimalPlaces = 0
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimalPlaces;

  return Math.round(
    (value + Number.EPSILON) * factor
  ) / factor;
}

export function sleep(
  milliseconds: number
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, milliseconds));
  });
}

/* ==========================================================================
   STRING FORMATTING
   ========================================================================== */

export function capitalize(
  value: string
): string {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  return (
    normalized.charAt(0).toUpperCase() +
    normalized.slice(1)
  );
}

export function titleCase(
  value: string
): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => capitalize(word.toLowerCase()))
    .join(" ");
}

export function sentenceCase(
  value: string
): string {
  const normalized = value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();

  return capitalize(normalized);
}

export function truncateText(
  value: string,
  maximumLength: number,
  suffix = "…"
): string {
  if (maximumLength <= 0) {
    return "";
  }

  const normalized = value.trim();

  if (normalized.length <= maximumLength) {
    return normalized;
  }

  const availableLength = Math.max(
    0,
    maximumLength - suffix.length
  );

  return `${normalized.slice(0, availableLength).trimEnd()}${suffix}`;
}

export function initials(
  value: string,
  maximumCharacters = 2
): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, Math.max(1, maximumCharacters))
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function slugify(
  value: string
): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatIdentifier(
  value: string | number | null | undefined,
  prefix?: string
): string {
  if (!isDefined(value) || String(value).trim() === "") {
    return "—";
  }

  const normalized = String(value).trim();

  return prefix
    ? `${prefix}-${normalized}`
    : normalized;
}

/* ==========================================================================
   CLASS NAME HELPER
   ========================================================================== */

export function cn(
  ...values: Array<
    | string
    | false
    | null
    | undefined
    | Record<string, boolean | null | undefined>
  >
): string {
  const classes: string[] = [];

  for (const value of values) {
    if (!value) {
      continue;
    }

    if (typeof value === "string") {
      classes.push(value);
      continue;
    }

    for (const [className, enabled] of Object.entries(
      value
    )) {
      if (enabled) {
        classes.push(className);
      }
    }
  }

  return classes.join(" ");
}

/* ==========================================================================
   DATE PARSING AND VALIDATION
   ========================================================================== */

export function toDate(
  value: DateInput
): Date | null {
  if (!isDefined(value)) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : new Date(value.getTime());
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

export function isValidDate(
  value: DateInput
): boolean {
  return toDate(value) !== null;
}

export function startOfDay(
  value: DateInput
): Date | null {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  return date;
}

export function endOfDay(
  value: DateInput
): Date | null {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  date.setHours(23, 59, 59, 999);

  return date;
}

export function addMilliseconds(
  value: DateInput,
  milliseconds: number
): Date | null {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  return new Date(
    date.getTime() + milliseconds
  );
}

export function addMinutes(
  value: DateInput,
  minutes: number
): Date | null {
  return addMilliseconds(
    value,
    minutes * 60_000
  );
}

export function addHours(
  value: DateInput,
  hours: number
): Date | null {
  return addMilliseconds(
    value,
    hours * 3_600_000
  );
}

export function addDays(
  value: DateInput,
  days: number
): Date | null {
  return addMilliseconds(
    value,
    days * 86_400_000
  );
}

export function differenceInMilliseconds(
  later: DateInput,
  earlier: DateInput
): number {
  const laterDate = toDate(later);
  const earlierDate = toDate(earlier);

  if (!laterDate || !earlierDate) {
    return 0;
  }

  return laterDate.getTime() - earlierDate.getTime();
}

export function differenceInMinutes(
  later: DateInput,
  earlier: DateInput
): number {
  return Math.floor(
    differenceInMilliseconds(later, earlier) /
      60_000
  );
}

export function differenceInHours(
  later: DateInput,
  earlier: DateInput
): number {
  return Math.floor(
    differenceInMilliseconds(later, earlier) /
      3_600_000
  );
}

export function differenceInDays(
  later: DateInput,
  earlier: DateInput
): number {
  return Math.floor(
    differenceInMilliseconds(later, earlier) /
      86_400_000
  );
}

export function isDateBefore(
  first: DateInput,
  second: DateInput
): boolean {
  const firstDate = toDate(first);
  const secondDate = toDate(second);

  if (!firstDate || !secondDate) {
    return false;
  }

  return firstDate.getTime() < secondDate.getTime();
}

export function isDateAfter(
  first: DateInput,
  second: DateInput
): boolean {
  const firstDate = toDate(first);
  const secondDate = toDate(second);

  if (!firstDate || !secondDate) {
    return false;
  }

  return firstDate.getTime() > secondDate.getTime();
}

export function isSameDay(
  first: DateInput,
  second: DateInput
): boolean {
  const firstDate = toDate(first);
  const secondDate = toDate(second);

  if (!firstDate || !secondDate) {
    return false;
  }

  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
}

export function isToday(
  value: DateInput,
  now: DateInput = new Date()
): boolean {
  return isSameDay(value, now);
}

/* ==========================================================================
   DATE FORMATTING
   ========================================================================== */

function getDateFormatOptions(
  format: string
): Intl.DateTimeFormatOptions {
  switch (format) {
    case DATE_FORMATS.shortDate:
      return {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      };

    case DATE_FORMATS.longDate:
      return {
        month: "long",
        day: "numeric",
        year: "numeric",
      };

    case DATE_FORMATS.shortDateTime:
      return {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      };

    case DATE_FORMATS.longDateTime:
      return {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      };

    case DATE_FORMATS.timeOnly:
      return {
        hour: "numeric",
        minute: "2-digit",
      };

    case DATE_FORMATS.timeWithSeconds:
      return {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      };

    case DATE_FORMATS.monthYear:
      return {
        month: "long",
        year: "numeric",
      };

    case DATE_FORMATS.mediumDateTime:
      return {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      };

    case DATE_FORMATS.mediumDate:
    default:
      return {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
  }
}

export function formatDate(
  value: DateInput,
  format: string = DEFAULT_DATE_FORMAT,
  locale = "en-US",
  timeZone?: string
): string {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  if (format === DATE_FORMATS.isoDate) {
    return date.toISOString().slice(0, 10);
  }

  if (format === DATE_FORMATS.isoDateTime) {
    return date.toISOString();
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      ...getDateFormatOptions(format),
      ...(timeZone ? { timeZone } : {}),
    }).format(date);
  } catch {
    return date.toLocaleDateString(locale);
  }
}

export function formatDateTime(
  value: DateInput,
  locale = "en-US",
  timeZone?: string
): string {
  return formatDate(
    value,
    DEFAULT_DATETIME_FORMAT,
    locale,
    timeZone
  );
}

export function formatTime(
  value: DateInput,
  locale = "en-US",
  timeZone?: string
): string {
  return formatDate(
    value,
    DEFAULT_TIME_FORMAT,
    locale,
    timeZone
  );
}

export function formatRelativeTime(
  value: DateInput,
  now: DateInput = new Date(),
  locale = "en-US"
): string {
  const date = toDate(value);
  const reference = toDate(now);

  if (!date || !reference) {
    return "—";
  }

  const difference =
    date.getTime() - reference.getTime();

  const absoluteDifference = Math.abs(difference);

  const formatter = new Intl.RelativeTimeFormat(
    locale,
    {
      numeric: "auto",
    }
  );

  if (absoluteDifference < 60_000) {
    return formatter.format(
      Math.round(difference / 1_000),
      "second"
    );
  }

  if (absoluteDifference < 3_600_000) {
    return formatter.format(
      Math.round(difference / 60_000),
      "minute"
    );
  }

  if (absoluteDifference < 86_400_000) {
    return formatter.format(
      Math.round(difference / 3_600_000),
      "hour"
    );
  }

  if (absoluteDifference < 2_592_000_000) {
    return formatter.format(
      Math.round(difference / 86_400_000),
      "day"
    );
  }

  if (absoluteDifference < 31_536_000_000) {
    return formatter.format(
      Math.round(difference / 2_592_000_000),
      "month"
    );
  }

  return formatter.format(
    Math.round(difference / 31_536_000_000),
    "year"
  );
}

/* ==========================================================================
   ASSIGNMENT DEADLINE AND COUNTDOWN
   ========================================================================== */

export function getAssignmentDeadline(
  assignment: AssignmentLike
): Date | null {
  return (
    toDate(assignment.acknowledgmentDeadline) ??
    toDate(assignment.dueDate) ??
    toDate(assignment.deadline)
  );
}

export function isAssignmentExpired(
  assignment: AssignmentLike,
  now: DateInput = new Date()
): boolean {
  const deadline =
    getAssignmentDeadline(assignment);

  const currentDate = toDate(now);

  if (!deadline || !currentDate) {
    return false;
  }

  if (
    assignment.status === "completed" ||
    assignment.status === "cancelled" ||
    assignment.status === "declined"
  ) {
    return false;
  }

  return deadline.getTime() <= currentDate.getTime();
}

export function isAssignmentOverdue(
  assignment: AssignmentLike,
  now: DateInput = new Date()
): boolean {
  if (
    assignment.status === "completed" ||
    assignment.status === "cancelled" ||
    assignment.status === "declined" ||
    assignment.status === "expired"
  ) {
    return false;
  }

  return isAssignmentExpired(
    assignment,
    now
  );
}

export function getCountdownUrgency(
  totalMilliseconds: number
): CountdownUrgency {
  if (totalMilliseconds <= 0) {
    return "expired";
  }

  const totalMinutes =
    totalMilliseconds / 60_000;

  const totalHours =
    totalMilliseconds / 3_600_000;

  if (
    totalMinutes <=
    ASSIGNMENT_COUNTDOWN_THRESHOLDS.criticalMinutes
  ) {
    return "critical";
  }

  if (
    totalHours <=
    ASSIGNMENT_COUNTDOWN_THRESHOLDS.urgentHours
  ) {
    return "urgent";
  }

  if (
    totalHours <=
    ASSIGNMENT_COUNTDOWN_THRESHOLDS.warningHours
  ) {
    return "warning";
  }

  return "normal";
}

export function formatCountdownLabel(
  totalMilliseconds: number,
  compact = false
): string {
  if (totalMilliseconds <= 0) {
    return compact ? "Expired" : "Response deadline expired";
  }

  const totalSeconds = Math.floor(
    totalMilliseconds / 1_000
  );

  const days = Math.floor(
    totalSeconds / 86_400
  );

  const hours = Math.floor(
    (totalSeconds % 86_400) / 3_600
  );

  const minutes = Math.floor(
    (totalSeconds % 3_600) / 60
  );

  const seconds = totalSeconds % 60;

  if (compact) {
    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }

    return `${Math.max(0, seconds)}s`;
  }

  if (days > 1) {
    return `${days} days and ${hours} hours remaining`;
  }

  if (days === 1) {
    return `1 day and ${hours} hours remaining`;
  }

  if (hours > 1) {
    return `${hours} hours and ${minutes} minutes remaining`;
  }

  if (hours === 1) {
    return `1 hour and ${minutes} minutes remaining`;
  }

  if (minutes > 1) {
    return `${minutes} minutes remaining`;
  }

  if (minutes === 1) {
    return "1 minute remaining";
  }

  return "Less than 1 minute remaining";
}

export function calculateCountdown(
  deadlineInput: DateInput,
  nowInput: DateInput = new Date()
): AssignmentCountdown {
  const deadline = toDate(deadlineInput);
  const now = toDate(nowInput) ?? new Date();

  if (!deadline) {
    return {
      deadline: null,
      now,
      isExpired: false,
      totalMilliseconds: 0,
      totalSeconds: 0,
      totalMinutes: 0,
      totalHours: 0,
      totalDays: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      urgency: "none",
      label: "No deadline",
      compactLabel: "No deadline",
    };
  }

  const rawMilliseconds =
    deadline.getTime() - now.getTime();

  const remainingMilliseconds =
    Math.max(0, rawMilliseconds);

  const totalSeconds = Math.floor(
    remainingMilliseconds / 1_000
  );

  const totalMinutes = Math.floor(
    totalSeconds / 60
  );

  const totalHours = Math.floor(
    totalMinutes / 60
  );

  const totalDays = Math.floor(
    totalHours / 24
  );

  const days = Math.floor(
    totalSeconds / 86_400
  );

  const hours = Math.floor(
    (totalSeconds % 86_400) / 3_600
  );

  const minutes = Math.floor(
    (totalSeconds % 3_600) / 60
  );

  const seconds = totalSeconds % 60;

  return {
    deadline,
    now,
    isExpired: rawMilliseconds <= 0,
    totalMilliseconds: remainingMilliseconds,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
    days,
    hours,
    minutes,
    seconds,
    urgency: getCountdownUrgency(
      rawMilliseconds
    ),
    label: formatCountdownLabel(
      rawMilliseconds
    ),
    compactLabel: formatCountdownLabel(
      rawMilliseconds,
      true
    ),
  };
}

export function getAssignmentCountdown(
  assignment: AssignmentLike,
  now: DateInput = new Date()
): AssignmentCountdown {
  return calculateCountdown(
    getAssignmentDeadline(assignment),
    now
  );
}

/* ==========================================================================
   STATUS AND PRIORITY UTILITIES
   ========================================================================== */

export function getRecordStatusLabel(
  status: RecordStatus | string | null | undefined
): string {
  if (!status) {
    return "Unknown";
  }

  return (
    RECORD_STATUS_LABELS[
      status as RecordStatus
    ] ?? titleCase(status)
  );
}

export function getAssignmentStatusLabel(
  status:
    | AssignmentStatus
    | string
    | null
    | undefined
): string {
  if (!status) {
    return "Unknown";
  }

  return (
    ASSIGNMENT_STATUS_LABELS[
      status as AssignmentStatus
    ] ?? titleCase(status)
  );
}

export function getPriorityLabel(
  priority:
    | PriorityLevel
    | string
    | null
    | undefined
): string {
  if (!priority) {
    return PRIORITY_LABELS.normal;
  }

  return (
    PRIORITY_LABELS[
      priority as PriorityLevel
    ] ?? titleCase(priority)
  );
}

export function getRecordStatusStyle(
  status:
    | RecordStatus
    | string
    | null
    | undefined
) {
  if (
    status &&
    status in RECORD_STATUS_STYLES
  ) {
    return RECORD_STATUS_STYLES[
      status as RecordStatus
    ];
  }

  return RECORD_STATUS_STYLES.pending;
}

export function getAssignmentStatusStyle(
  status:
    | AssignmentStatus
    | string
    | null
    | undefined
) {
  if (
    status &&
    status in ASSIGNMENT_STATUS_STYLES
  ) {
    return ASSIGNMENT_STATUS_STYLES[
      status as AssignmentStatus
    ];
  }

  return ASSIGNMENT_STATUS_STYLES.pending;
}

export function getPriorityStyle(
  priority:
    | PriorityLevel
    | string
    | null
    | undefined
) {
  if (
    priority &&
    priority in PRIORITY_STYLES
  ) {
    return PRIORITY_STYLES[
      priority as PriorityLevel
    ];
  }

  return PRIORITY_STYLES.normal;
}

export function getNotificationTypeLabel(
  type:
    | NotificationType
    | string
    | null
    | undefined
): string {
  if (!type) {
    return "Notification";
  }

  return (
    NOTIFICATION_TYPE_LABELS[
      type as NotificationType
    ] ?? titleCase(type)
  );
}

export function getNotificationTypeIcon(
  type:
    | NotificationType
    | string
    | null
    | undefined
): string {
  if (
    type &&
    type in NOTIFICATION_TYPE_ICONS
  ) {
    return NOTIFICATION_TYPE_ICONS[
      type as NotificationType
    ];
  }

  return "Bell";
}

export function getNotificationStatusLabel(
  status:
    | NotificationStatus
    | string
    | null
    | undefined
): string {
  if (!status) {
    return "Unknown";
  }

  return (
    NOTIFICATION_STATUS_LABELS[
      status as NotificationStatus
    ] ?? titleCase(status)
  );
}

/* ==========================================================================
   ASSIGNMENT SORTING
   ========================================================================== */

function compareValues(
  first: unknown,
  second: unknown
): number {
  if (
    first === null ||
    first === undefined
  ) {
    return second === null ||
      second === undefined
      ? 0
      : 1;
  }

  if (
    second === null ||
    second === undefined
  ) {
    return -1;
  }

  if (
    typeof first === "number" &&
    typeof second === "number"
  ) {
    return first - second;
  }

  const firstDate = toDate(
    first as DateInput
  );

  const secondDate = toDate(
    second as DateInput
  );

  if (
    firstDate &&
    secondDate &&
    (first instanceof Date ||
      second instanceof Date ||
      typeof first === "string" ||
      typeof second === "string")
  ) {
    return (
      firstDate.getTime() -
      secondDate.getTime()
    );
  }

  return String(first).localeCompare(
    String(second),
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

export function sortAssignments<T extends AssignmentLike>(
  assignments: readonly T[],
  sort: AssignmentSort
): T[] {
  const directionMultiplier =
    sort.direction === "desc" ? -1 : 1;

  return [...assignments].sort(
    (first, second) => {
      if (sort.field === "priority") {
        const firstWeight =
          PRIORITY_WEIGHTS[
            (first.priority ??
              "normal") as PriorityLevel
          ] ?? 0;

        const secondWeight =
          PRIORITY_WEIGHTS[
            (second.priority ??
              "normal") as PriorityLevel
          ] ?? 0;

        return (
          (firstWeight - secondWeight) *
          directionMultiplier
        );
      }

   if (sort.field === "assignedAt") {
  return (
    compareValues(
      first.assignedAt,
      second.assignedAt
    ) * directionMultiplier
  );
}

      const firstValue =
        first[
          sort.field as keyof AssignmentLike
        ];

      const secondValue =
        second[
          sort.field as keyof AssignmentLike
        ];

      return (
        compareValues(
          firstValue,
          secondValue
        ) * directionMultiplier
      );
    }
  );
}

export function sortAssignmentsByUrgency<
  T extends AssignmentLike,
>(
  assignments: readonly T[],
  now: DateInput = new Date()
): T[] {
  return [...assignments].sort(
    (first, second) => {
      const firstDeadline =
        getAssignmentDeadline(first);

      const secondDeadline =
        getAssignmentDeadline(second);

      if (!firstDeadline && !secondDeadline) {
        const firstPriority =
          PRIORITY_WEIGHTS[
            (first.priority ??
              "normal") as PriorityLevel
          ] ?? 0;

        const secondPriority =
          PRIORITY_WEIGHTS[
            (second.priority ??
              "normal") as PriorityLevel
          ] ?? 0;

        return secondPriority - firstPriority;
      }

      if (!firstDeadline) {
        return 1;
      }

      if (!secondDeadline) {
        return -1;
      }

      const firstExpired =
        isAssignmentExpired(first, now);

      const secondExpired =
        isAssignmentExpired(second, now);

      if (
        firstExpired &&
        !secondExpired
      ) {
        return -1;
      }

      if (
        !firstExpired &&
        secondExpired
      ) {
        return 1;
      }

      const deadlineComparison =
        firstDeadline.getTime() -
        secondDeadline.getTime();

      if (deadlineComparison !== 0) {
        return deadlineComparison;
      }

      const firstPriority =
        PRIORITY_WEIGHTS[
          (first.priority ??
            "normal") as PriorityLevel
        ] ?? 0;

      const secondPriority =
        PRIORITY_WEIGHTS[
          (second.priority ??
            "normal") as PriorityLevel
        ] ?? 0;

      return secondPriority - firstPriority;
    }
  );
}

export function groupAssignmentsByStatus<
  T extends AssignmentLike,
>(
  assignments: readonly T[]
): Record<string, T[]> {
  return assignments.reduce<Record<string, T[]>>(
    (groups, assignment) => {
      const status =
        assignment.status ?? "unknown";

      if (!groups[status]) {
        groups[status] = [];
      }

      groups[status].push(assignment);

      return groups;
    },
    {}
  );
}

export function groupAssignmentsByPriority<
  T extends AssignmentLike,
>(
  assignments: readonly T[]
): Record<PriorityLevel, T[]> {
  const groups: Record<
    PriorityLevel,
    T[]
  > = {
    low: [],
    normal: [],
    high: [],
    urgent: [],
    critical: [],
  };

  for (const assignment of assignments) {
    const priority =
      assignment.priority &&
      assignment.priority in groups
        ? (assignment.priority as PriorityLevel)
        : "normal";

    groups[priority].push(assignment);
  }

  return groups;
}

export function filterPendingAssignments<
  T extends AssignmentLike,
>(
  assignments: readonly T[]
): T[] {
  return assignments.filter(
    (assignment) =>
      assignment.status === "pending"
  );
}

export function filterActiveAssignments<
  T extends AssignmentLike,
>(
  assignments: readonly T[]
): T[] {
  return assignments.filter(
    (assignment) =>
      assignment.status === "accepted" ||
      assignment.status === "in_progress"
  );
}

export function filterCompletedAssignments<
  T extends AssignmentLike,
>(
  assignments: readonly T[]
): T[] {
  return assignments.filter(
    (assignment) =>
      assignment.status === "completed"
  );
}

export function filterOverdueAssignments<
  T extends AssignmentLike,
>(
  assignments: readonly T[],
  now: DateInput = new Date()
): T[] {
  return assignments.filter(
    (assignment) =>
      isAssignmentOverdue(
        assignment,
        now
      )
  );
}

/* ==========================================================================
   WORKSPACE ROLE AND MODULE UTILITIES
   ========================================================================== */

export function getWorkspaceBasePath(
  role: ExtendedWorkspaceRole
): string {
  if (
    role in WORKSPACE_BASE_PATHS
  ) {
    return WORKSPACE_BASE_PATHS[
      role as WorkspaceRole
    ];
  }

  return "/workspace";
}

export function getWorkspacePrimaryModule(
  role: ExtendedWorkspaceRole
): ExtendedWorkspaceModule {
  if (
    role in WORKSPACE_PRIMARY_MODULES
  ) {
    return WORKSPACE_PRIMARY_MODULES[
      role as WorkspaceRole
    ];
  }

  return "dashboard";
}

export function getWorkspaceRoleBranding(
  role: ExtendedWorkspaceRole
) {
  if (
    role in WORKSPACE_ROLE_BRANDING
  ) {
    return WORKSPACE_ROLE_BRANDING[
      role as WorkspaceRole
    ];
  }

  return WORKSPACE_ROLE_BRANDING.coach;
}

export function getWorkspaceModuleLabel(
  module: ExtendedWorkspaceModule
): string {
  if (
    module in WORKSPACE_MODULE_LABELS
  ) {
    return WORKSPACE_MODULE_LABELS[
      module as WorkspaceModule
    ];
  }

  return titleCase(module);
}

export function getWorkspaceModuleDescription(
  module: ExtendedWorkspaceModule
): string {
  if (
    module in WORKSPACE_MODULE_DESCRIPTIONS
  ) {
    return WORKSPACE_MODULE_DESCRIPTIONS[
      module as WorkspaceModule
    ];
  }

  return `Manage ${getWorkspaceModuleLabel(
    module
  ).toLowerCase()} activity.`;
}

export function getWorkspaceModuleIcon(
  module: ExtendedWorkspaceModule
): string {
  if (
    module in WORKSPACE_MODULE_ICONS
  ) {
    return WORKSPACE_MODULE_ICONS[
      module as WorkspaceModule
    ];
  }

  return "PanelsTopLeft";
}

export function getWorkspaceModulePath(
  role: ExtendedWorkspaceRole,
  module: ExtendedWorkspaceModule
): string {
  const basePath =
    getWorkspaceBasePath(role);

  if (module === "dashboard") {
    return basePath;
  }

  return `${basePath}/${slugify(module)}`;
}

export function getActiveWorkspaceModule(
  pathname: string,
  role: ExtendedWorkspaceRole
): ExtendedWorkspaceModule {
  const normalizedPath = pathname
    .split("?")[0]
    .replace(/\/+$/, "");

  const basePath =
    getWorkspaceBasePath(role).replace(
      /\/+$/,
      ""
    );

  if (
    normalizedPath === basePath ||
    normalizedPath === `${basePath}/`
  ) {
    return "dashboard";
  }

  const relativePath = normalizedPath
    .replace(basePath, "")
    .replace(/^\/+/, "");

  const firstSegment =
    relativePath.split("/")[0];

  if (!firstSegment) {
    return "dashboard";
  }

  return firstSegment as ExtendedWorkspaceModule;
}

/* ==========================================================================
   WORKSPACE NAVIGATION
   ========================================================================== */

function createNavigationItem(
  role: ExtendedWorkspaceRole,
  module: ExtendedWorkspaceModule,
  badgeCount?: number
): WorkspaceNavigationItem {
  const permission =
    createWorkspacePermission(
      module,
      "view"
    );

  return {
    id: module,
    label:
      getWorkspaceModuleLabel(module),
    description:
      getWorkspaceModuleDescription(module),
    href:
      getWorkspaceModulePath(
        role,
        module
      ),
    icon:
      getWorkspaceModuleIcon(module),
    module,
    requiredPermission: permission,
    badge:
      typeof badgeCount === "number" &&
      badgeCount > 0
        ? badgeCount
        : undefined,
  };
}

export function getDefaultWorkspaceModules(
  role: ExtendedWorkspaceRole,
  options: Pick<
    WorkspaceNavigationBuildOptions,
    | "includeSharedModules"
    | "includeOperationalModules"
    | "includeSettings"
    | "includeDashboard"
  > = {}
): ExtendedWorkspaceModule[] {
  const {
    includeSharedModules = true,
    includeOperationalModules = true,
    includeSettings = true,
    includeDashboard = true,
  } = options;

  const modules: ExtendedWorkspaceModule[] =
    [];

  if (includeDashboard) {
    modules.push("dashboard");
  }

  if (
    includeOperationalModules &&
    role in WORKSPACE_OPERATIONAL_MODULES
  ) {
    modules.push(
      ...WORKSPACE_OPERATIONAL_MODULES[
        role as WorkspaceRole
      ]
    );
  }

  if (includeSharedModules) {
    modules.push(
      ...WORKSPACE_SHARED_MODULES
    );
  }

  const uniqueModules =
    uniqueValues(modules);

  return uniqueModules.filter(
    (module) =>
      includeSettings ||
      module !== "settings"
  );
}

export function buildWorkspaceNavigation(
  role: ExtendedWorkspaceRole,
  options: WorkspaceNavigationBuildOptions = {}
): WorkspaceNavigationItem[] {
  const modules =
    options.modules ??
    getDefaultWorkspaceModules(
      role,
      options
    );

  const badgeCounts =
    options.badgeCounts ?? {};

  return uniqueValues(modules).map(
    (module) =>
      createNavigationItem(
        role,
        module,
        badgeCounts[module]
      )
  );
}

export function filterWorkspaceNavigation(
  navigation:
    readonly WorkspaceNavigationItem[],
  role: ExtendedWorkspaceRole,
  options: PermissionCheckOptions = {}
): WorkspaceNavigationItem[] {
  return navigation
    .filter((item) => {
      if (item.hidden) {
        return false;
      }

      if (item.requiredPermission) {
        const parts =
          item.requiredPermission.split(
            ":"
          );

        const module = parts[0] as
          ExtendedWorkspaceModule;

        const action =
          (parts[1] ??
            "view") as WorkspaceAction;

        return canPerformWorkspaceAction(
          role,
          module,
          action,
          options
        );
      }

      if (item.module) {
        return canAccessWorkspaceModule(
          role,
          item.module,
          options
        );
      }

      return true;
    })
    .map((item) => ({
      ...item,
      children: item.children
        ? filterWorkspaceNavigation(
            item.children,
            role,
            options
          )
        : undefined,
    }));
}

export function buildAccessibleWorkspaceNavigation(
  role: ExtendedWorkspaceRole,
  options: WorkspaceNavigationBuildOptions = {}
): WorkspaceNavigationItem[] {
  return filterWorkspaceNavigation(
    buildWorkspaceNavigation(
      role,
      options
    ),
    role,
    options.permissionOptions
  );
}

/* ==========================================================================
   BREADCRUMBS
   ========================================================================== */

export function buildWorkspaceBreadcrumbs(
  role: ExtendedWorkspaceRole,
  module?: ExtendedWorkspaceModule,
  recordTitle?: string
): BreadcrumbItem[] {
  const basePath =
    getWorkspaceBasePath(role);

  const roleBranding =
    getWorkspaceRoleBranding(role);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: roleBranding.shortTitle,
      href: basePath,
      module: "dashboard",
      isCurrent:
        !module ||
        module === "dashboard",
    },
  ];

  if (
    module &&
    module !== "dashboard"
  ) {
    breadcrumbs.push({
      label:
        getWorkspaceModuleLabel(module),
      href:
        getWorkspaceModulePath(
          role,
          module
        ),
      module,
      isCurrent: !recordTitle,
    });
  }

  if (recordTitle) {
    breadcrumbs.push({
      label: recordTitle,
      isCurrent: true,
    });
  }

  return breadcrumbs;
}

/* ==========================================================================
   DASHBOARD CALCULATIONS
   ========================================================================== */

export function calculatePercentage(
  value: number,
  total: number,
  decimalPlaces = 0
): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return 0;
  }

  return clamp(
    roundTo(
      (value / total) * 100,
      decimalPlaces
    ),
    0,
    100
  );
}

export function calculateCompletionSummary(
  completed: number,
  total: number
): CompletionSummary {
  const safeCompleted = Math.max(
    0,
    Number.isFinite(completed)
      ? completed
      : 0
  );

  const safeTotal = Math.max(
    0,
    Number.isFinite(total)
      ? total
      : 0
  );

  return {
    completed: Math.min(
      safeCompleted,
      safeTotal
    ),
    total: safeTotal,
    remaining: Math.max(
      safeTotal - safeCompleted,
      0
    ),
    percentage:
      calculatePercentage(
        safeCompleted,
        safeTotal
      ),
  };
}

export function calculateMetricChange(
  currentValue: number,
  previousValue: number
): {
  difference: number;
  percentage: number;
  direction:
    | "increase"
    | "decrease"
    | "unchanged";
} {
  const difference =
    currentValue - previousValue;

  if (previousValue === 0) {
    return {
      difference,
      percentage:
        currentValue === 0 ? 0 : 100,
      direction:
        difference > 0
          ? "increase"
          : difference < 0
            ? "decrease"
            : "unchanged",
    };
  }

  const percentage = roundTo(
    (difference /
      Math.abs(previousValue)) *
      100,
    1
  );

  return {
    difference,
    percentage,
    direction:
      difference > 0
        ? "increase"
        : difference < 0
          ? "decrease"
          : "unchanged",
  };
}

export function formatMetricValue(
  value: number | string | null | undefined,
  format:
    | "number"
    | "currency"
    | "percentage"
    | "text" = "number",
  locale = "en-US",
  currency = "USD"
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (format === "text") {
    return String(value);
  }

  const numberValue =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(numberValue)) {
    return String(value);
  }

  if (format === "currency") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numberValue);
  }

  if (format === "percentage") {
    return new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(numberValue / 100);
  }

  return new Intl.NumberFormat(locale).format(
    numberValue
  );
}

export function sortMetrics<
  T extends { order?: number }
>(
  metrics: readonly T[]
): T[] {
  return [...metrics].sort(
    (first, second) =>
      (first.order ?? 0) -
      (second.order ?? 0)
  );
}

/* ==========================================================================
   SEARCH UTILITIES
   ========================================================================== */

export function normalizeSearchText(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().toLowerCase();
  }

  if (Array.isArray(value)) {
    return value
      .map(normalizeSearchText)
      .join(" ");
  }

  if (typeof value === "object") {
    return Object.values(
      value as Record<string, unknown>
    )
      .map(normalizeSearchText)
      .join(" ");
  }

  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function tokenizeSearchQuery(
  query: string
): string[] {
  return uniqueValues(
    normalizeSearchText(query)
      .split(/\s+/)
      .filter(Boolean)
  );
}

export function matchesSearchQuery(
  value: unknown,
  query: string
): boolean {
  const tokens =
    tokenizeSearchQuery(query);

  if (tokens.length === 0) {
    return true;
  }

  const searchableText =
    normalizeSearchText(value);

  return tokens.every((token) =>
    searchableText.includes(token)
  );
}

export function filterBySearchQuery<T>(
  records: readonly T[],
  query: string,
  fields?: readonly (keyof T)[]
): T[] {
  const normalizedQuery =
    normalizeSearchText(query);

  if (!normalizedQuery) {
    return [...records];
  }

  return records.filter((record) => {
    if (
      !fields ||
      fields.length === 0
    ) {
      return matchesSearchQuery(
        record,
        normalizedQuery
      );
    }

    const searchableValues =
      fields.map(
        (field) => record[field]
      );

    return matchesSearchQuery(
      searchableValues,
      normalizedQuery
    );
  });
}

export function scoreSearchMatch(
  value: unknown,
  query: string
): number {
  const text =
    normalizeSearchText(value);

  const normalizedQuery =
    normalizeSearchText(query);

  if (
    !text ||
    !normalizedQuery
  ) {
    return 0;
  }

  if (text === normalizedQuery) {
    return 100;
  }

  if (
    text.startsWith(normalizedQuery)
  ) {
    return 80;
  }

  if (
    text.includes(normalizedQuery)
  ) {
    return 60;
  }

  const tokens =
    tokenizeSearchQuery(query);

  const matchedTokens =
    tokens.filter((token) =>
      text.includes(token)
    ).length;

  return tokens.length === 0
    ? 0
    : Math.round(
        (matchedTokens /
          tokens.length) *
          50
      );
}

export function sortSearchResultsByRelevance<T>(
  records: readonly T[],
  query: string,
  valueSelector: (record: T) => unknown
): T[] {
  return [...records].sort(
    (first, second) =>
      scoreSearchMatch(
        valueSelector(second),
        query
      ) -
      scoreSearchMatch(
        valueSelector(first),
        query
      )
  );
}

export function highlightSearchMatches(
  value: string,
  query: string
): HighlightSegment[] {
  const tokens =
    tokenizeSearchQuery(query);

  if (tokens.length === 0) {
    return [
      {
        text: value,
        highlighted: false,
      },
    ];
  }

  const escapedTokens = tokens.map(
    (token) =>
      token.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )
  );

  const expression = new RegExp(
    `(${escapedTokens.join("|")})`,
    "gi"
  );

  return value
    .split(expression)
    .filter((segment) => segment !== "")
    .map((segment) => ({
      text: segment,
      highlighted: tokens.includes(
        normalizeSearchText(segment)
      ),
    }));
}

/* ==========================================================================
   GENERIC SORTING
   ========================================================================== */

export function sortByField<T>(
  records: readonly T[],
  field: keyof T,
  direction: SortDirection = "asc"
): T[] {
  const multiplier =
    direction === "desc" ? -1 : 1;

  return [...records].sort(
    (first, second) =>
      compareValues(
        first[field],
        second[field]
      ) * multiplier
  );
}

export function sortBySelector<T>(
  records: readonly T[],
  selector: (record: T) => unknown,
  direction: SortDirection = "asc"
): T[] {
  const multiplier =
    direction === "desc" ? -1 : 1;

  return [...records].sort(
    (first, second) =>
      compareValues(
        selector(first),
        selector(second)
      ) * multiplier
  );
}

/* ==========================================================================
   GROUPING
   ========================================================================== */

export function groupBy<T, K extends PropertyKey>(
  records: readonly T[],
  selector: (record: T) => K
): Record<K, T[]> {
  return records.reduce(
    (groups, record) => {
      const key =
        selector(record);

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(record);

      return groups;
    },
    {} as Record<K, T[]>
  );
}

export function countBy<
  T,
  K extends PropertyKey,
>(
  records: readonly T[],
  selector: (record: T) => K
): Record<K, number> {
  return records.reduce(
    (counts, record) => {
      const key =
        selector(record);

      counts[key] =
        (counts[key] ?? 0) + 1;

      return counts;
    },
    {} as Record<K, number>
  );
}

/* ==========================================================================
   PAGINATION
   ========================================================================== */

export function calculatePagination(
  totalItems: number,
  page = DEFAULT_PAGE_NUMBER,
  pageSize = DEFAULT_PAGE_SIZE
): PaginationMetadata {
  const safeTotalItems = Math.max(
    0,
    Math.floor(totalItems)
  );

  const safePageSize = Math.max(
    1,
    Math.floor(pageSize)
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      safeTotalItems /
        safePageSize
    )
  );

  const safePage = clamp(
    Math.floor(page),
    1,
    totalPages
  );

  const startIndex =
    safeTotalItems === 0
      ? 0
      : (safePage - 1) *
        safePageSize;

  const endIndex =
    safeTotalItems === 0
      ? 0
      : Math.min(
          startIndex +
            safePageSize,
          safeTotalItems
        );

  return {
    page: safePage,
    pageSize: safePageSize,
    totalItems: safeTotalItems,
    totalPages,
    startIndex,
    endIndex,
    hasPreviousPage:
      safePage > 1,
    hasNextPage:
      safePage < totalPages,
    previousPage:
      safePage > 1
        ? safePage - 1
        : null,
    nextPage:
      safePage < totalPages
        ? safePage + 1
        : null,
  };
}

export function paginate<T>(
  records: readonly T[],
  page = DEFAULT_PAGE_NUMBER,
  pageSize = DEFAULT_PAGE_SIZE
): PaginatedResult<T> {
  const pagination =
    calculatePagination(
      records.length,
      page,
      pageSize
    );

  return {
    items: records.slice(
      pagination.startIndex,
      pagination.endIndex
    ),
    pagination,
  };
}

export function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  maximumVisiblePages = 7
): number[] {
  const safeTotalPages = Math.max(
    1,
    totalPages
  );

  const safeCurrentPage = clamp(
    currentPage,
    1,
    safeTotalPages
  );

  const safeMaximum = Math.max(
    1,
    maximumVisiblePages
  );

  if (
    safeTotalPages <= safeMaximum
  ) {
    return Array.from(
      {
        length: safeTotalPages,
      },
      (_, index) => index + 1
    );
  }

  const half = Math.floor(
    safeMaximum / 2
  );

  let start = Math.max(
    1,
    safeCurrentPage - half
  );

  let end =
    start + safeMaximum - 1;

  if (end > safeTotalPages) {
    end = safeTotalPages;
    start =
      end - safeMaximum + 1;
  }

  return Array.from(
    {
      length: end - start + 1,
    },
    (_, index) => start + index
  );
}

/* ==========================================================================
   NUMBER AND CURRENCY FORMATTING
   ========================================================================== */

export function formatNumber(
  value: number | null | undefined,
  locale = "en-US",
  options: Intl.NumberFormatOptions = {}
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    locale,
    options
  ).format(value);
}

export function formatCompactNumber(
  value: number | null | undefined,
  locale = "en-US"
): string {
  return formatNumber(
    value,
    locale,
    {
      notation: "compact",
      maximumFractionDigits: 1,
    }
  );
}

export function formatCurrency(
  value: number | null | undefined,
  currency = "USD",
  locale = "en-US"
): string {
  return formatNumber(
    value,
    locale,
    {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }
  );
}

export function formatPercentage(
  value: number | null | undefined,
  locale = "en-US",
  decimalPlaces = 0
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits:
      decimalPlaces,
    maximumFractionDigits:
      decimalPlaces,
  }).format(value / 100);
}

/* ==========================================================================
   FILE UTILITIES
   ========================================================================== */

export function bytesToReadableSize(
  bytes: number,
  decimalPlaces = 1
): string {
  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const unitIndex = Math.min(
    Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    ),
    units.length - 1
  );

  const size =
    bytes /
    1024 ** unitIndex;

  return `${roundTo(
    size,
    decimalPlaces
  )} ${units[unitIndex]}`;
}

export function getFileExtension(
  filename: string
): string {
  const normalized =
    filename.trim();

  const lastPeriod =
    normalized.lastIndexOf(".");

  if (
    lastPeriod < 0 ||
    lastPeriod ===
      normalized.length - 1
  ) {
    return "";
  }

  return normalized
    .slice(lastPeriod + 1)
    .toLowerCase();
}

export function removeFileExtension(
  filename: string
): string {
  const lastPeriod =
    filename.lastIndexOf(".");

  if (lastPeriod <= 0) {
    return filename;
  }

  return filename.slice(
    0,
    lastPeriod
  );
}

/* ==========================================================================
   URL AND QUERY UTILITIES
   ========================================================================== */

export function buildQueryString(
  values: Record<
    string,
    string | number | boolean | null | undefined
  >
): string {
  const searchParams =
    new URLSearchParams();

  for (const [key, value] of Object.entries(
    values
  )) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    searchParams.set(
      key,
      String(value)
    );
  }

  const query =
    searchParams.toString();

  return query
    ? `?${query}`
    : "";
}

export function appendQueryParameters(
  url: string,
  values: Record<
    string,
    string | number | boolean | null | undefined
  >
): string {
  const query =
    buildQueryString(values);

  if (!query) {
    return url;
  }

  return url.includes("?")
    ? `${url}&${query.slice(1)}`
    : `${url}${query}`;
}

/* ==========================================================================
   USER DISPLAY UTILITIES
   ========================================================================== */

export function getWorkspaceUserDisplayName(
  user: WorkspaceUser | null | undefined
): string {
  if (!user) {
    return "Workspace User";
  }

  const possibleUser =
    user as WorkspaceUser & {
      displayName?: string;
      fullName?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    };

  if (
    isNonEmptyString(
      possibleUser.displayName
    )
  ) {
    return possibleUser.displayName;
  }

  if (
    isNonEmptyString(
      possibleUser.fullName
    )
  ) {
    return possibleUser.fullName;
  }

  const combinedName = [
    possibleUser.firstName,
    possibleUser.lastName,
  ]
    .filter(isNonEmptyString)
    .join(" ");

  if (combinedName) {
    return combinedName;
  }

  if (
    isNonEmptyString(
      possibleUser.email
    )
  ) {
    return possibleUser.email;
  }

  return "Workspace User";
}

export function getWorkspaceUserInitials(
  user: WorkspaceUser | null | undefined
): string {
  return initials(
    getWorkspaceUserDisplayName(user)
  );
}

/* ==========================================================================
   OBJECT UTILITIES
   ========================================================================== */

export function omitUndefined<
  T extends Record<string, unknown>,
>(
  value: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entryValue]) =>
        entryValue !== undefined
    )
  ) as Partial<T>;
}

export function pick<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  value: T,
  keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    if (key in value) {
      result[key] = value[key];
    }
  }

  return result;
}

export function omit<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  value: T,
  keys: readonly K[]
): Omit<T, K> {
  const excluded =
    new Set<keyof T>(keys);

  return Object.fromEntries(
    Object.entries(value).filter(
      ([key]) =>
        !excluded.has(key as keyof T)
    )
  ) as Omit<T, K>;
}

/* ==========================================================================
   IDENTIFIER UTILITIES
   ========================================================================== */

export function createTemporaryId(
  prefix = "workspace"
): string {
  const timestamp =
    Date.now().toString(36);

  const random =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return `${slugify(
    prefix
  )}-${timestamp}-${random}`;
}

export function createReferenceNumber(
  prefix: string,
  value?: string | number
): string {
  const normalizedPrefix =
    prefix
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const suffix =
    value ??
    Date.now().toString(36).toUpperCase();

  return `${normalizedPrefix}-${suffix}`;
}

/* ==========================================================================
   VALIDATION UTILITIES
   ========================================================================== */

export function isValidEmail(
  value: string
): boolean {
  const normalized =
    value.trim();

  if (!normalized) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    normalized
  );
}

export function isValidPhoneNumber(
  value: string
): boolean {
  const normalized =
    value.replace(/[^\d+]/g, "");

  return /^\+?\d{7,15}$/.test(
    normalized
  );
}

export function normalizePhoneNumber(
  value: string
): string {
  const trimmed = value.trim();

  const hasLeadingPlus =
    trimmed.startsWith("+");

  const digits =
    trimmed.replace(/\D/g, "");

  return hasLeadingPlus
    ? `+${digits}`
    : digits;
}

/* ==========================================================================
   DATE RANGE UTILITIES
   ========================================================================== */

export function createDateRange(
  startInput: DateInput,
  endInput: DateInput
): DateRange | null {
  const start = toDate(startInput);
  const end = toDate(endInput);

  if (!start || !end) {
    return null;
  }

  if (
    start.getTime() <=
    end.getTime()
  ) {
    return {
      start,
      end,
    };
  }

  return {
    start: end,
    end: start,
  };
}

export function isDateWithinRange(
  value: DateInput,
  range: DateRange,
  inclusive = true
): boolean {
  const date = toDate(value);

  if (!date) {
    return false;
  }

  const time = date.getTime();
  const start =
    range.start.getTime();
  const end =
    range.end.getTime();

  return inclusive
    ? time >= start &&
        time <= end
    : time > start &&
        time < end;
}

/* ==========================================================================
   ASSIGNMENT SUMMARY UTILITIES
   ========================================================================== */

export function calculateAssignmentSummary<
  T extends AssignmentLike,
>(
  assignments: readonly T[],
  now: DateInput = new Date()
): {
  total: number;
  pending: number;
  active: number;
  completed: number;
  declined: number;
  expired: number;
  overdue: number;
  completionPercentage: number;
} {
  const total =
    assignments.length;

  const pending =
    assignments.filter(
      (assignment) =>
        assignment.status === "pending"
    ).length;

  const active =
    assignments.filter(
      (assignment) =>
        assignment.status === "accepted" ||
        assignment.status ===
          "in_progress"
    ).length;

  const completed =
    assignments.filter(
      (assignment) =>
        assignment.status ===
        "completed"
    ).length;

  const declined =
    assignments.filter(
      (assignment) =>
        assignment.status ===
        "declined"
    ).length;

  const expired =
    assignments.filter(
      (assignment) =>
        assignment.status ===
          "expired" ||
        isAssignmentExpired(
          assignment,
          now
        )
    ).length;

  const overdue =
    assignments.filter(
      (assignment) =>
        isAssignmentOverdue(
          assignment,
          now
        )
    ).length;

  return {
    total,
    pending,
    active,
    completed,
    declined,
    expired,
    overdue,
    completionPercentage:
      calculatePercentage(
        completed,
        total
      ),
  };
}

/* ==========================================================================
   PERMISSION-AWARE ACTION UTILITIES
   ========================================================================== */

export function getAllowedWorkspaceActions(
  role: ExtendedWorkspaceRole,
  module: ExtendedWorkspaceModule,
  actions: readonly WorkspaceAction[],
  options: PermissionCheckOptions = {}
): WorkspaceAction[] {
  return actions.filter((action) =>
    canPerformWorkspaceAction(
      role,
      module,
      action,
      options
    )
  );
}

export function createActionPermission(
  module: ExtendedWorkspaceModule,
  action: WorkspaceAction
): WorkspacePermission {
  return createWorkspacePermission(
    module,
    action
  );
}

/* ==========================================================================
   ERROR UTILITIES
   ========================================================================== */

export function getErrorMessage(
  error: unknown,
  fallback =
    "Something went wrong. Please try again."
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (
      error as {
        message?: unknown;
      }
    ).message === "string"
  ) {
    return (
      error as {
        message: string;
      }
    ).message;
  }

  return fallback;
}

export function isAbortError(
  error: unknown
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

/* ==========================================================================
   ARRAY MOVEMENT UTILITIES
   ========================================================================== */

export function moveArrayItem<T>(
  values: readonly T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...values];

  if (
    fromIndex < 0 ||
    fromIndex >= result.length ||
    toIndex < 0 ||
    toIndex >= result.length ||
    fromIndex === toIndex
  ) {
    return result;
  }

  const [movedItem] =
    result.splice(fromIndex, 1);

  result.splice(
    toIndex,
    0,
    movedItem
  );

  return result;
}

/* ==========================================================================
   DEBOUNCE AND THROTTLE
   ========================================================================== */

export function debounce<
  TArguments extends unknown[],
>(
  callback: (
    ...arguments_: TArguments
  ) => void,
  delay: number
): ((
  ...arguments_: TArguments
) => void) & {
  cancel: () => void;
} {
  let timeout:
    | ReturnType<typeof setTimeout>
    | undefined;

  const debounced = (
    ...arguments_: TArguments
  ) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      callback(...arguments_);
    }, Math.max(0, delay));
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  return debounced;
}

export function throttle<
  TArguments extends unknown[],
>(
  callback: (
    ...arguments_: TArguments
  ) => void,
  interval: number
): ((
  ...arguments_: TArguments
) => void) & {
  cancel: () => void;
} {
  let lastExecution = 0;

  let timeout:
    | ReturnType<typeof setTimeout>
    | undefined;

  let pendingArguments:
    | TArguments
    | undefined;

  const execute = () => {
    lastExecution = Date.now();

    if (pendingArguments) {
      callback(...pendingArguments);
      pendingArguments = undefined;
    }
  };

  const throttled = (
    ...arguments_: TArguments
  ) => {
    pendingArguments =
      arguments_;

    const elapsed =
      Date.now() - lastExecution;

    const remaining =
      Math.max(
        0,
        interval - elapsed
      );

    if (remaining === 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }

      execute();
      return;
    }

    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = undefined;
        execute();
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }

    pendingArguments =
      undefined;
  };

  return throttled;
}

/* ==========================================================================
   SAFE JSON UTILITIES
   ========================================================================== */

export function safeJsonParse<T>(
  value: string,
  fallback: T
): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(
  value: unknown,
  fallback = "{}"
): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

/* ==========================================================================
   WORKSPACE LOCAL STORAGE UTILITIES
   ========================================================================== */

export function getStorageItem<T>(
  key: string,
  fallback: T
): T {
  if (
    typeof window === "undefined"
  ) {
    return fallback;
  }

  try {
    const value =
      window.localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return safeJsonParse(
      value,
      fallback
    );
  } catch {
    return fallback;
  }
}

export function setStorageItem(
  key: string,
  value: unknown
): boolean {
  if (
    typeof window === "undefined"
  ) {
    return false;
  }

  try {
    window.localStorage.setItem(
      key,
      safeJsonStringify(value)
    );

    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(
  key: string
): boolean {
  if (
    typeof window === "undefined"
  ) {
    return false;
  }

  try {
    window.localStorage.removeItem(
      key
    );

    return true;
  } catch {
    return false;
  }
}

/* ==========================================================================
   TYPE-SAFE STATUS RESOLUTION
   ========================================================================== */

export function resolveStatusStyle(
  status:
    | RecordStatus
    | AssignmentStatus
    | string
    | null
    | undefined,
  category:
    | "record"
    | "assignment" = "record"
) {
  if (category === "assignment") {
    return getAssignmentStatusStyle(
      status
    );
  }

  return getRecordStatusStyle(
    status
  );
}

/* ==========================================================================
   DEVELOPMENT ASSERTIONS
   ========================================================================== */

export function assertNever(
  value: never,
  message =
    "Unexpected value encountered."
): never {
  throw new Error(
    `${message} Received: ${String(
      value
    )}`
  );
}