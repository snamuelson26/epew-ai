/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * IBOS Enterprise Translation Service
 * Shared Utilities
 * Version: 1.0.0
 * ============================================================
 */

import path from "node:path";

import {
  IBOS_DYNAMIC_ROUTE_PATTERNS,
  IBOS_EXCLUDED_DIRECTORIES,
  IBOS_EXCLUDED_FILE_PATTERNS,
  IBOS_IGNORED_ROUTE_SEGMENTS,
  IBOS_MASTER_LANGUAGE,
  IBOS_NAMESPACE_RULES,
  IBOS_PORTAL_ROUTE_SEGMENTS,
  IBOS_SCANNABLE_EXTENSIONS,
} from "./config";

import type {
  TranslationComplianceStatus,
  TranslationIssueSeverity,
  TranslationLanguage,
  TranslationStatus,
} from "./types";

/**
 * Generic JSON-compatible value used by the Translation Center.
 */
export type TranslationJsonValue =
  | string
  | number
  | boolean
  | null
  | TranslationJsonValue[]
  | TranslationJsonObject;

export interface TranslationJsonObject {
  [key: string]: TranslationJsonValue;
}

/**
 * Flattened translation key/value record.
 */
export type FlattenedTranslationRecord = Record<string, string>;

/**
 * Converts Windows separators to POSIX separators.
 */
export function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/");
}

/**
 * Converts an absolute path into a path relative to the project root.
 */
export function toProjectRelativePath(
  projectRoot: string,
  absolutePath: string,
): string {
  return normalizePath(path.relative(projectRoot, absolutePath));
}

/**
 * Determines whether a path contains an excluded directory.
 */
export function isExcludedDirectory(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  const segments = normalized.split("/").filter(Boolean);

  return segments.some((segment) =>
    IBOS_EXCLUDED_DIRECTORIES.includes(
      segment as (typeof IBOS_EXCLUDED_DIRECTORIES)[number],
    ),
  );
}

/**
 * Determines whether a file matches an excluded file pattern.
 */
export function isExcludedFile(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  const fileName = normalized.split("/").at(-1) ?? normalized;

  return IBOS_EXCLUDED_FILE_PATTERNS.some((pattern) =>
    fileName.includes(pattern),
  );
}

/**
 * Determines whether a file extension can be scanned.
 */
export function isScannableFile(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase();

  return IBOS_SCANNABLE_EXTENSIONS.includes(
    extension as (typeof IBOS_SCANNABLE_EXTENSIONS)[number],
  );
}

/**
 * Determines whether a file should be scanned.
 */
export function shouldScanFile(filePath: string): boolean {
  return (
    isScannableFile(filePath) &&
    !isExcludedDirectory(filePath) &&
    !isExcludedFile(filePath)
  );
}

/**
 * Removes a file extension from a path or filename.
 */
export function removeFileExtension(value: string): string {
  return value.replace(/\.[^.]+$/, "");
}

/**
 * Converts arbitrary text into lowercase kebab-case.
 */
export function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s/]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Converts a kebab-case, snake_case, or route segment into a title.
 */
export function toTitleCase(value: string): string {
  const cleaned = value
    .replace(/^\[\[?\.\.\./, "")
    .replace(/\]\]?$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Home";
  }

  return cleaned
    .split(" ")
    .map((word) => {
      if (!word) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Returns true when the segment is a Next.js route group.
 *
 * Example:
 * (public)
 * (auth)
 * (dashboard)
 */
export function isRouteGroupSegment(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

/**
 * Returns true when a segment is a Next.js parallel route.
 *
 * Example:
 * @modal
 */
export function isParallelRouteSegment(segment: string): boolean {
  return segment.startsWith("@");
}

/**
 * Returns true when the segment is an intercepted route.
 *
 * Examples:
 * (.)
 * (..)
 * (...)
 * (..)(..)
 */
export function isInterceptedRouteSegment(segment: string): boolean {
  return (
    segment.startsWith("(.)") ||
    segment.startsWith("(..)") ||
    segment.startsWith("(...)")
  );
}

/**
 * Returns true when the route segment should not appear in the URL.
 */
export function shouldIgnoreRouteSegment(segment: string): boolean {
  return (
    !segment ||
    isRouteGroupSegment(segment) ||
    isParallelRouteSegment(segment) ||
    isInterceptedRouteSegment(segment) ||
    IBOS_IGNORED_ROUTE_SEGMENTS.includes(
      segment as (typeof IBOS_IGNORED_ROUTE_SEGMENTS)[number],
    )
  );
}

/**
 * Determines whether a route segment is dynamic.
 */
export function isDynamicRouteSegment(segment: string): boolean {
  return (
    IBOS_DYNAMIC_ROUTE_PATTERNS.standard.test(segment) ||
    IBOS_DYNAMIC_ROUTE_PATTERNS.catchAll.test(segment) ||
    IBOS_DYNAMIC_ROUTE_PATTERNS.optionalCatchAll.test(segment)
  );
}

/**
 * Returns a readable dynamic route parameter name.
 */
export function getDynamicRouteParameter(segment: string): string | null {
  const optionalCatchAllMatch = segment.match(
    IBOS_DYNAMIC_ROUTE_PATTERNS.optionalCatchAll,
  );

  if (optionalCatchAllMatch?.[1]) {
    return optionalCatchAllMatch[1];
  }

  const catchAllMatch = segment.match(
    IBOS_DYNAMIC_ROUTE_PATTERNS.catchAll,
  );

  if (catchAllMatch?.[1]) {
    return catchAllMatch[1];
  }

  const standardMatch = segment.match(
    IBOS_DYNAMIC_ROUTE_PATTERNS.standard,
  );

  if (standardMatch?.[1]) {
    return standardMatch[1];
  }

  return null;
}

/**
 * Converts an App Router page file into its application route.
 *
 * Example:
 * app/(public)/about/page.tsx
 * becomes:
 * /about
 */
export function pageFileToRoute(
  appRoot: string,
  pageFile: string,
): string {
  const normalizedAppRoot = normalizePath(appRoot).replace(/\/+$/, "");
  const normalizedPageFile = normalizePath(pageFile);

  let relativePath = normalizedPageFile;

  const appRootIndex = normalizedPageFile.indexOf(
    `${normalizedAppRoot}/`,
  );

  if (appRootIndex >= 0) {
    relativePath = normalizedPageFile.slice(
      appRootIndex + normalizedAppRoot.length + 1,
    );
  }

  const directory = normalizePath(path.posix.dirname(relativePath));

  const routeSegments = directory
    .split("/")
    .filter(Boolean)
    .filter((segment) => !shouldIgnoreRouteSegment(segment));

  if (routeSegments.length === 0) {
    return "/";
  }

  return `/${routeSegments.join("/")}`.replace(/\/+/g, "/");
}

/**
 * Determines whether a route contains a dynamic segment.
 */
export function isDynamicRoute(route: string): boolean {
  return route
    .split("/")
    .filter(Boolean)
    .some((segment) => isDynamicRouteSegment(segment));
}

/**
 * Extracts the portal name from a route.
 *
 * Example:
 * /admin/translation-center
 * returns:
 * admin
 */
export function getPortalFromRoute(route: string): string | null {
  const segments = route.split("/").filter(Boolean);

  const portal = segments.find((segment) =>
    IBOS_PORTAL_ROUTE_SEGMENTS.includes(
      segment as (typeof IBOS_PORTAL_ROUTE_SEGMENTS)[number],
    ),
  );

  return portal ?? null;
}

/**
 * Determines whether a route requires authentication.
 */
export function routeRequiresAuthentication(route: string): boolean {
  return getPortalFromRoute(route) !== null;
}

/**
 * Determines whether a route is publicly accessible.
 */
export function isPublicRoute(route: string): boolean {
  return !routeRequiresAuthentication(route);
}

/**
 * Generates a namespace from a route.
 *
 * Examples:
 * /                        -> homepage
 * /about                   -> about
 * /how-epew-works          -> how-epew-works
 * /admin/translation-center -> admin-translation-center
 */
export function routeToNamespace(route: string): string {
  if (route === "/" || route.trim() === "") {
    return "homepage";
  }

  const namespace = route
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      const dynamicParameter = getDynamicRouteParameter(segment);

      if (dynamicParameter) {
        return `by-${toKebabCase(dynamicParameter)}`;
      }

      return toKebabCase(segment);
    })
    .filter(Boolean)
    .join(IBOS_NAMESPACE_RULES.separator);

  return namespace || "homepage";
}

/**
 * Validates a namespace against the IBOS namespace rules.
 */
export function isValidNamespace(namespace: string): boolean {
  if (!namespace.trim()) {
    return false;
  }

  if (
    IBOS_NAMESPACE_RULES.enforceLowercase &&
    namespace !== namespace.toLowerCase()
  ) {
    return false;
  }

  if (
    IBOS_NAMESPACE_RULES.enforceKebabCase &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(namespace)
  ) {
    return false;
  }

  if (
    !IBOS_NAMESPACE_RULES.allowNestedNamespaces &&
    namespace.includes("/")
  ) {
    return false;
  }

  return true;
}

/**
 * Converts a namespace into its JSON filename.
 */
export function namespaceToFileName(namespace: string): string {
  return `${namespace}${IBOS_NAMESPACE_RULES.fileExtension}`;
}

/**
 * Generates a readable page title from a route.
 */
export function routeToTitle(route: string): string {
  if (route === "/" || route.trim() === "") {
    return "Home";
  }

  const segments = route.split("/").filter(Boolean);
  const finalSegment = segments.at(-1);

  return toTitleCase(finalSegment ?? "Home");
}

/**
 * Generates a stable deterministic identifier.
 *
 * This utility avoids requiring an external UUID package.
 */
export function createStableId(
  prefix: string,
  ...parts: Array<string | number | boolean | null | undefined>
): string {
  const source = parts
    .filter(
      (part): part is string | number | boolean =>
        part !== null && part !== undefined,
    )
    .map(String)
    .join("::");

  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const normalizedHash = (hash >>> 0).toString(36);

  return `${toKebabCase(prefix)}-${normalizedHash}`;
}

/**
 * Returns the current time as an ISO string.
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Clamps a numeric value between a minimum and maximum.
 */
export function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Calculates a percentage safely.
 */
export function calculatePercentage(
  completed: number,
  total: number,
  precision = 2,
): number {
  if (total <= 0) {
    return 100;
  }

  const percentage = clamp((completed / total) * 100, 0, 100);
  const multiplier = 10 ** precision;

  return Math.round(percentage * multiplier) / multiplier;
}

/**
 * Determines a translation status from key statistics.
 */
export function determineTranslationStatus(input: {
  fileExists: boolean;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: number;
  invalidKeys: number;
  pendingReview?: boolean;
}): TranslationStatus {
  if (!input.fileExists) {
    return "missing";
  }

  if (input.invalidKeys > 0) {
    return "invalid";
  }

  if (input.missingKeys > 0) {
    return input.translatedKeys > 0 ? "in_progress" : "missing";
  }

  if (input.pendingReview) {
    return "pending_review";
  }

  if (
    input.totalKeys > 0 &&
    input.translatedKeys >= input.totalKeys
  ) {
    return "complete";
  }

  return "in_progress";
}

/**
 * Determines a compliance status from a numeric score.
 */
export function determineComplianceStatus(
  score: number,
): TranslationComplianceStatus {
  if (score >= 100) {
    return "compliant";
  }

  if (score >= 80) {
    return "action_required";
  }

  return "non_compliant";
}

/**
 * Returns a severity ranking used for sorting.
 */
export function getSeverityRank(
  severity: TranslationIssueSeverity,
): number {
  const ranking: Record<TranslationIssueSeverity, number> = {
    critical: 4,
    error: 3,
    warning: 2,
    info: 1,
  };

  return ranking[severity];
}

/**
 * Sorts severities from critical to informational.
 */
export function sortBySeverity<
  T extends { severity: TranslationIssueSeverity },
>(items: T[]): T[] {
  return [...items].sort(
    (first, second) =>
      getSeverityRank(second.severity) -
      getSeverityRank(first.severity),
  );
}

/**
 * Detects placeholders from translation strings.
 *
 * Supported examples:
 * {{name}}
 * {name}
 * %{name}
 * ${name}
 */
export function extractPlaceholders(value: string): string[] {
  const placeholders = new Set<string>();

  const patterns = [
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
    /(?<!\{)\{\s*([a-zA-Z0-9_.-]+)\s*\}(?!\})/g,
    /%\{\s*([a-zA-Z0-9_.-]+)\s*\}/g,
    /\$\{\s*([a-zA-Z0-9_.-]+)\s*\}/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(value)) !== null) {
      const placeholder = match[1];

      if (placeholder) {
        placeholders.add(placeholder);
      }
    }
  }

  return [...placeholders].sort();
}

/**
 * Determines whether two placeholder collections match exactly.
 */
export function placeholdersMatch(
  masterPlaceholders: string[],
  translatedPlaceholders: string[],
): boolean {
  const master = [...new Set(masterPlaceholders)].sort();
  const translated = [...new Set(translatedPlaceholders)].sort();

  return (
    master.length === translated.length &&
    master.every(
      (placeholder, index) => placeholder === translated[index],
    )
  );
}

/**
 * Flattens a nested JSON translation object.
 *
 * Example:
 * {
 *   hero: {
 *     title: "Welcome"
 *   }
 * }
 *
 * becomes:
 * {
 *   "hero.title": "Welcome"
 * }
 */
export function flattenTranslationObject(
  value: TranslationJsonValue,
  parentKey = "",
  output: FlattenedTranslationRecord = {},
): FlattenedTranslationRecord {
  if (typeof value === "string") {
    if (parentKey) {
      output[parentKey] = value;
    }

    return output;
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    if (parentKey) {
      output[parentKey] = String(value ?? "");
    }

    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const nextKey = parentKey
        ? `${parentKey}.${index}`
        : String(index);

      flattenTranslationObject(item, nextKey, output);
    });

    return output;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextKey = parentKey ? `${parentKey}.${key}` : key;

    flattenTranslationObject(nestedValue, nextKey, output);
  }

  return output;
}

/**
 * Returns every leaf key contained in a translation object.
 */
export function getTranslationKeys(
  value: TranslationJsonValue,
): string[] {
  return Object.keys(flattenTranslationObject(value)).sort();
}

/**
 * Returns the keys present in the master language but missing
 * from the target language.
 */
export function getMissingTranslationKeys(
  master: TranslationJsonValue,
  target: TranslationJsonValue,
): string[] {
  const masterKeys = new Set(getTranslationKeys(master));
  const targetKeys = new Set(getTranslationKeys(target));

  return [...masterKeys]
    .filter((key) => !targetKeys.has(key))
    .sort();
}

/**
 * Returns keys found in a target language but absent
 * from the master language.
 */
export function getObsoleteTranslationKeys(
  master: TranslationJsonValue,
  target: TranslationJsonValue,
): string[] {
  const masterKeys = new Set(getTranslationKeys(master));
  const targetKeys = new Set(getTranslationKeys(target));

  return [...targetKeys]
    .filter((key) => !masterKeys.has(key))
    .sort();
}

/**
 * Safely reads a translation value by dotted key path.
 */
export function getValueByKeyPath(
  value: TranslationJsonValue,
  keyPath: string,
): TranslationJsonValue | undefined {
  const segments = keyPath.split(".").filter(Boolean);

  let current: TranslationJsonValue | undefined = value;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);

      if (!Number.isInteger(index)) {
        return undefined;
      }

      current = current[index];
      continue;
    }

    if (
      current === null ||
      typeof current !== "object" ||
      !(segment in current)
    ) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

/**
 * Creates a deep clone of a JSON-compatible translation value.
 */
export function cloneTranslationJson<T extends TranslationJsonValue>(
  value: T,
): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Creates a target-language structure from the English master.
 *
 * Existing translations are preserved. Missing string values are
 * initialized with an empty string so they can enter the queue.
 */
export function synchronizeTranslationStructure(
  master: TranslationJsonValue,
  target?: TranslationJsonValue,
): TranslationJsonValue {
  if (typeof master === "string") {
    return typeof target === "string" ? target : "";
  }

  if (
    master === null ||
    typeof master === "number" ||
    typeof master === "boolean"
  ) {
    return target !== undefined ? target : master;
  }

  if (Array.isArray(master)) {
    const targetArray = Array.isArray(target) ? target : [];

    return master.map((item, index) =>
      synchronizeTranslationStructure(item, targetArray[index]),
    );
  }

  const targetObject =
    target !== null &&
    typeof target === "object" &&
    !Array.isArray(target)
      ? target
      : {};

  const synchronized: TranslationJsonObject = {};

  for (const [key, masterValue] of Object.entries(master)) {
    synchronized[key] = synchronizeTranslationStructure(
      masterValue,
      targetObject[key],
    );
  }

  return synchronized;
}

/**
 * Detects empty translated values.
 */
export function isMissingTranslationValue(
  value: TranslationJsonValue | undefined,
): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

/**
 * Determines whether the supplied language is the master language.
 */
export function isMasterLanguage(
  language: TranslationLanguage,
): boolean {
  return language === IBOS_MASTER_LANGUAGE;
}

/**
 * Escapes text before including it in a regular expression.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Removes JavaScript and TypeScript comments while preserving
 * the approximate number of lines for issue reporting.
 */
export function stripSourceComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) =>
      comment.replace(/[^\n]/g, " "),
    )
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/**
 * Returns the one-based line and column for a string index.
 */
export function getLineAndColumn(
  source: string,
  index: number,
): {
  line: number;
  column: number;
} {
  const safeIndex = clamp(index, 0, source.length);
  const precedingText = source.slice(0, safeIndex);
  const lines = precedingText.split("\n");

  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

/**
 * Determines whether a string appears to be user-facing.
 *
 * This intentionally excludes imports, URLs, class names,
 * technical identifiers, and very short symbolic strings.
 */
export function appearsUserFacingText(value: string): boolean {
  const text = value.trim();

  if (text.length < 2) {
    return false;
  }

  if (/^(https?:\/\/|mailto:|tel:|\/|\.\/|\.\.\/)/i.test(text)) {
    return false;
  }

  if (/^[a-zA-Z0-9_.:/@-]+$/.test(text) && !text.includes(" ")) {
    return false;
  }

  if (/^(true|false|null|undefined)$/i.test(text)) {
    return false;
  }

  if (/^[A-Z0-9_-]+$/.test(text) && !text.includes(" ")) {
    return false;
  }

  if (/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)$/i.test(text)) {
    return false;
  }

  if (/^[#.[\]():;,{}<>+=*|&!?-]+$/.test(text)) {
    return false;
  }

  return /[a-zA-ZÀ-ÿ]/.test(text);
}

/**
 * Removes duplicate primitive values while preserving order.
 */
export function uniqueValues<T extends string | number>(
  values: T[],
): T[] {
  return [...new Set(values)];
}

/**
 * Produces a predictable JSON string for generated files.
 */
export function formatJson(
  value: unknown,
  indentation = 2,
): string {
  return `${JSON.stringify(value, null, indentation)}\n`;
}

/**
 * Safely parses JSON and returns a structured result.
 */
export function safeParseJson<T = TranslationJsonValue>(
  content: string,
):
  | {
      success: true;
      data: T;
      error: null;
    }
  | {
      success: false;
      data: null;
      error: string;
    } {
  try {
    return {
      success: true,
      data: JSON.parse(content) as T,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown JSON parsing error.",
    };
  }
}