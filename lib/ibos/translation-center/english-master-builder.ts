/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * English Master Builder
 * Version: 1.0.0
 * ============================================================
 *
 * PURPOSE
 * -------
 * Builds and maintains the English master translation namespaces
 * from Source Intelligence hardcoded-text findings.
 *
 * English is the source of truth for:
 *
 * - Haitian Creole
 * - French
 * - Spanish
 *
 * The builder processes the entire project automatically.
 * It does not require page-by-page namespace creation.
 */

import fs from "node:fs/promises";
import path from "node:path";

import type {
  HardcodedTextOccurrence,
  ProjectHardcodedTextAnalysis,
} from "./source-intelligence/hardcoded-text-detector";

import {
  createStableId,
  normalizePath,
  nowIso,
  uniqueValues,
} from "./utils";

/**
 * Official builder version.
 */
export const IBOS_ENGLISH_MASTER_BUILDER_VERSION =
  "1.0.0";

/**
 * English master language.
 */
export const IBOS_MASTER_LANGUAGE = "en" as const;

/**
 * Status of one English master entry.
 */
export type EnglishMasterEntryStatus =
  | "created"
  | "updated"
  | "preserved"
  | "conflict"
  | "skipped"
  | "failed";

/**
 * Reason an occurrence could not be added automatically.
 */
export type EnglishMasterReviewReason =
  | "missing_source_file"
  | "missing_namespace"
  | "missing_key"
  | "empty_text"
  | "conflicting_value"
  | "invalid_namespace_file"
  | "unsupported_finding"
  | "excluded_file"
  | "write_failed";

/**
 * One English master translation entry.
 */
export interface EnglishMasterEntry {
  id: string;

  namespace: string;
  key: string;
  fullKey: string;

  value: string;

  sourceFile: string;
  route: string | null;
  componentName: string | null;

  occurrenceId: string;

  line: number;
  column: number;

  confidence: number;

  status: EnglishMasterEntryStatus;

  existingValue: string | null;
  conflict: boolean;
}

/**
 * One item requiring review.
 */
export interface EnglishMasterReviewItem {
  id: string;

  occurrenceId: string;

  sourceFile: string;
  route: string | null;

  namespace: string | null;
  key: string | null;

  text: string;

  line: number;
  column: number;

  reason: EnglishMasterReviewReason;
  explanation: string;

  createdAt: string;
}

/**
 * Result for one English namespace.
 */
export interface EnglishNamespaceBuildResult {
  namespace: string;

  file: string;

  existedBeforeBuild: boolean;

  created: boolean;
  updated: boolean;
  unchanged: boolean;

  entriesProcessed: number;
  keysCreated: number;
  keysUpdated: number;
  keysPreserved: number;
  conflicts: number;

  entries: EnglishMasterEntry[];

  errors: string[];
}

/**
 * Complete English Master Builder output.
 */
export interface EnglishMasterBuildResult {
  success: boolean;

  buildId: string;

  platform: "EPEW-EDE-IBOS";
  engine: "ENGLISH_MASTER_BUILDER";
  version: string;

  startedAt: string;
  completedAt: string;
  durationMs: number;

  projectRoot: string;
  messagesRoot: string;

  analyzedOccurrences: number;
  processedOccurrences: number;

  namespacesProcessed: number;
  namespacesCreated: number;
  namespacesUpdated: number;
  namespacesUnchanged: number;

  keysCreated: number;
  keysUpdated: number;
  keysPreserved: number;

  conflicts: number;
  reviewItemsCreated: number;

  generatedFiles: string[];
  updatedFiles: string[];
  unchangedFiles: string[];

  namespaceResults: EnglishNamespaceBuildResult[];

  reviewQueue: EnglishMasterReviewItem[];

  errors: string[];
}

/**
 * Optional shared-component namespace rule.
 */
export interface EnglishMasterNamespaceRule {
  namespace: string;

  /**
   * File patterns assigned to this shared namespace.
   */
  filePatterns?: RegExp[];

  /**
   * Component-name patterns assigned to this namespace.
   */
  componentPatterns?: RegExp[];

  /**
   * Route patterns assigned to this namespace.
   */
  routePatterns?: RegExp[];
}

/**
 * English Master Builder configuration.
 */
export interface EnglishMasterBuilderOptions {
  projectRoot?: string;

  /**
   * Translation-message root.
   */
  messagesRoot?: string;

  /**
   * Preserve existing English values by default.
   */
  preserveExistingValues?: boolean;

  /**
   * Replace an existing value only when explicitly enabled.
   */
  updateExistingValues?: boolean;

  /**
   * Create namespace files that do not exist.
   */
  createMissingNamespaceFiles?: boolean;

  /**
   * Write files to disk.
   *
   * When false, the builder operates as a preview.
   */
  applyChanges?: boolean;

  /**
   * Optional file restrictions.
   */
  includeFiles?: string[];

  /**
   * Files excluded from automatic generation.
   */
  excludeFilePatterns?: RegExp[];

  /**
   * Minimum confidence accepted for generation.
   */
  minimumConfidence?: number;

  /**
   * Additional namespace-classification rules.
   */
  namespaceRules?: EnglishMasterNamespaceRule[];

  /**
   * Save the English Master review queue.
   */
  saveReviewQueue?: boolean;

  /**
   * Review queue location.
   */
  reviewQueuePath?: string;
}

/**
 * Internal normalized options.
 */
interface ResolvedEnglishMasterBuilderOptions {
  projectRoot: string;
  messagesRoot: string;

  preserveExistingValues: boolean;
  updateExistingValues: boolean;

  createMissingNamespaceFiles: boolean;
  applyChanges: boolean;

  includeFiles: Set<string> | null;
  excludeFilePatterns: RegExp[];

  minimumConfidence: number;

  namespaceRules: EnglishMasterNamespaceRule[];

  saveReviewQueue: boolean;
  reviewQueuePath: string;
}

/**
 * Default shared enterprise namespaces.
 *
 * Route pages keep their route namespace.
 * Reusable components receive a shared namespace.
 */
const DEFAULT_NAMESPACE_RULES: EnglishMasterNamespaceRule[] = [
  {
    namespace: "footer",
    filePatterns: [
      /(?:^|\/)footer\.(?:tsx?|jsx?)$/i,
      /(?:^|\/)site-footer\.(?:tsx?|jsx?)$/i,
      /(?:^|\/)global-footer\.(?:tsx?|jsx?)$/i,
    ],
    componentPatterns: [
      /^footer$/i,
      /footer/i,
    ],
  },

  {
    namespace: "navigation",
    filePatterns: [
      /(?:^|\/)navbar\.(?:tsx?|jsx?)$/i,
      /(?:^|\/)navigation\.(?:tsx?|jsx?)$/i,
      /(?:^|\/)nav\.(?:tsx?|jsx?)$/i,
      /(?:^|\/)sidebar\.(?:tsx?|jsx?)$/i,
      /(?:^|\/)header\.(?:tsx?|jsx?)$/i,
    ],
    componentPatterns: [
      /navbar/i,
      /navigation/i,
      /^nav$/i,
      /sidebar/i,
      /^header$/i,
    ],
  },

  {
    namespace: "legal",
    filePatterns: [
      /(?:^|\/)legal(?:\/|\.|$)/i,
      /terms-of-use/i,
      /privacy-policy/i,
      /cookie-policy/i,
    ],
    routePatterns: [
      /^\/legal(?:\/|$)/i,
      /^\/terms(?:\/|$)/i,
      /^\/privacy(?:\/|$)/i,
    ],
  },

  {
    namespace: "forms",
    filePatterns: [
      /(?:^|\/)form(?:s)?(?:\/|\.|$)/i,
      /form-field/i,
      /input-field/i,
    ],
    componentPatterns: [
      /form/i,
      /input/i,
      /field/i,
    ],
  },

  {
    namespace: "buttons",
    filePatterns: [
      /(?:^|\/)button(?:s)?\.(?:tsx?|jsx?)$/i,
    ],
    componentPatterns: [
      /button/i,
    ],
  },

  {
    namespace: "dialogs",
    filePatterns: [
      /(?:^|\/)dialog(?:s)?(?:\/|\.|$)/i,
      /(?:^|\/)modal(?:s)?(?:\/|\.|$)/i,
    ],
    componentPatterns: [
      /dialog/i,
      /modal/i,
    ],
  },

  {
    namespace: "notifications",
    filePatterns: [
      /(?:^|\/)notification(?:s)?(?:\/|\.|$)/i,
      /(?:^|\/)alert(?:s)?(?:\/|\.|$)/i,
      /(?:^|\/)toast(?:s)?(?:\/|\.|$)/i,
    ],
    componentPatterns: [
      /notification/i,
      /alert/i,
      /toast/i,
    ],
  },

  {
    namespace: "common",
    filePatterns: [
      /(?:^|\/)common(?:\/|\.|$)/i,
      /(?:^|\/)shared(?:\/|\.|$)/i,
      /(?:^|\/)ui(?:\/|\.|$)/i,
    ],
  },
];

/**
 * Default builder settings.
 */
const DEFAULT_OPTIONS = {
  messagesRoot: "app/messages",

  preserveExistingValues: true,
  updateExistingValues: false,

  createMissingNamespaceFiles: true,
applyChanges: false,

  minimumConfidence: 0.5,

  saveReviewQueue: true,

  reviewQueuePath:
    "data/enterprise/ibos/translation-center/registry/english-master-review-queue.json",
} as const;

/**
 * Returns whether a file or directory exists.
 */
async function pathExists(
  targetPath: string,
): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a directory recursively.
 */
async function ensureDirectory(
  directoryPath: string,
): Promise<void> {
  await fs.mkdir(directoryPath, {
    recursive: true,
  });
}

/**
 * Returns a project-relative path.
 */
function toProjectRelativePath(
  projectRoot: string,
  absolutePath: string,
): string {
  return normalizePath(
    path.relative(projectRoot, absolutePath),
  );
}

/**
 * Normalizes visible English text.
 */
function normalizeMasterValue(
  value: string,
): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

/**
 * Normalizes namespace names.
 */
function normalizeNamespace(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

/**
 * Converts a dotted translation key to safe segments.
 */
function normalizeTranslationKey(
  value: string,
): string {
  return value
    .split(".")
    .map((segment) =>
      segment
        .trim()
        .replace(/[^A-Za-z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_+/g, "_"),
    )
    .filter(Boolean)
    .join(".");
}

/**
 * Converts route syntax to a namespace.
 */
function routeToNamespace(
  route: string,
): string {
  if (route === "/") {
    return "homepage";
  }

  const namespace = route
    .replace(/^\/+|\/+$/g, "")
    .replace(/\[\.\.\.([^\]]+)\]/g, "by-$1")
    .replace(/\[\[\.\.\.([^\]]+)\]\]/g, "by-$1")
    .replace(/\[([^\]]+)\]/g, "by-$1")
    .replace(/[^A-Za-z0-9/_-]+/g, "-")
    .replace(/\//g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  return namespace || "homepage";
}

/**
 * Converts a source path into a fallback namespace.
 */
function sourceFileToNamespace(
  sourceFile: string,
): string {
  const normalized = normalizePath(sourceFile);

  const withoutExtension = normalized.replace(
    /\.(?:tsx?|jsx?|mjs|cjs)$/i,
    "",
  );

  const withoutAppPrefix = withoutExtension.replace(
    /^app\//,
    "",
  );

  const withoutComponentsPrefix =
    withoutAppPrefix.replace(
      /(?:^|\/)components?\//gi,
      "",
    );

  const withoutSpecialFileName =
    withoutComponentsPrefix.replace(
      /(?:^|\/)(?:page|layout|template|loading|error|not-found)$/i,
      "",
    );

  return (
    normalizeNamespace(
      withoutSpecialFileName
        .replace(/\[\.\.\.([^\]]+)\]/g, "by-$1")
        .replace(/\[\[\.\.\.([^\]]+)\]\]/g, "by-$1")
        .replace(/\[([^\]]+)\]/g, "by-$1")
        .replace(/\//g, "-"),
    ) || "common"
  );
}

/**
 * Determines whether a rule matches an occurrence.
 */
function namespaceRuleMatches(
  occurrence: HardcodedTextOccurrence,
  rule: EnglishMasterNamespaceRule,
): boolean {
  const file = normalizePath(
    occurrence.sourceFile,
  );

  const component =
    occurrence.componentName ?? "";

  const route =
    occurrence.route ?? "";

  return (
    (rule.filePatterns?.some((pattern) =>
      pattern.test(file),
    ) ??
      false) ||
    (rule.componentPatterns?.some((pattern) =>
      pattern.test(component),
    ) ??
      false) ||
    (rule.routePatterns?.some((pattern) =>
      pattern.test(route),
    ) ??
      false)
  );
}

/**
 * Resolves the final namespace for a finding.
 */
function resolveOccurrenceNamespace(input: {
  occurrence: HardcodedTextOccurrence;
  rules: EnglishMasterNamespaceRule[];
}): string | null {
  for (const rule of input.rules) {
    if (
      namespaceRuleMatches(
        input.occurrence,
        rule,
      )
    ) {
      return normalizeNamespace(
        rule.namespace,
      );
    }
  }

  const suggestedNamespace =
    input.occurrence.suggestedNamespace ??
    input.occurrence.namespace;

  if (suggestedNamespace?.trim()) {
    return normalizeNamespace(
      suggestedNamespace,
    );
  }

  if (input.occurrence.route) {
    return routeToNamespace(
      input.occurrence.route,
    );
  }

  if (input.occurrence.sourceFile) {
    return sourceFileToNamespace(
      input.occurrence.sourceFile,
    );
  }

  return null;
}

/**
 * Returns whether an occurrence is excluded.
 */
function occurrenceIsExcluded(
  occurrence: HardcodedTextOccurrence,
  options: ResolvedEnglishMasterBuilderOptions,
): boolean {
  const sourceFile = normalizePath(
    occurrence.sourceFile,
  );

  if (
    options.includeFiles &&
    !options.includeFiles.has(sourceFile)
  ) {
    return true;
  }

  return options.excludeFilePatterns.some(
    (pattern) => pattern.test(sourceFile),
  );
}

/**
 * Returns the value of one nested key.
 */
function getNestedValue(
  object: Record<string, unknown>,
  dottedKey: string,
): unknown {
  const segments = dottedKey
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);

  let current: unknown = object;

  for (const segment of segments) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      return undefined;
    }

    current = (
      current as Record<string, unknown>
    )[segment];
  }

  return current;
}

/**
 * Sets one nested value.
 */
function setNestedValue(input: {
  object: Record<string, unknown>;
  dottedKey: string;
  value: string;
}): void {
  const segments = input.dottedKey
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return;
  }

  let current = input.object;

  for (
    let index = 0;
    index < segments.length - 1;
    index += 1
  ) {
    const segment = segments[index];

    if (!segment) {
      continue;
    }

    const existing = current[segment];

    if (
      !existing ||
      typeof existing !== "object" ||
      Array.isArray(existing)
    ) {
      current[segment] = {};
    }

    current =
      current[segment] as Record<
        string,
        unknown
      >;
  }

  const finalSegment =
    segments.at(-1);

  if (!finalSegment) {
    return;
  }

  current[finalSegment] = input.value;
}

/**
 * Reads a namespace JSON file.
 */
async function readNamespaceFile(
  filePath: string,
): Promise<{
  exists: boolean;
  data: Record<string, unknown>;
  error: string | null;
}> {
  if (!(await pathExists(filePath))) {
    return {
      exists: false,
      data: {},
      error: null,
    };
  }

  try {
    const content = await fs.readFile(
      filePath,
      "utf8",
    );

    const parsed: unknown =
      JSON.parse(content);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {
        exists: true,
        data: {},
        error:
          "The namespace file does not contain a JSON object.",
      };
    }

    return {
      exists: true,
      data:
        parsed as Record<
          string,
          unknown
        >,
      error: null,
    };
  } catch (error) {
    return {
      exists: true,
      data: {},
      error:
        error instanceof Error
          ? error.message
          : "Unknown namespace JSON error.",
    };
  }
}

/**
 * Writes a formatted namespace file.
 */
async function writeNamespaceFile(
  filePath: string,
  data: Record<string, unknown>,
): Promise<void> {
  await ensureDirectory(
    path.dirname(filePath),
  );

  await fs.writeFile(
    filePath,
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

/**
 * Creates a review item.
 */
function createReviewItem(input: {
  occurrence: HardcodedTextOccurrence;
  namespace: string | null;
  key: string | null;
  reason: EnglishMasterReviewReason;
  explanation: string;
}): EnglishMasterReviewItem {
  return {
    id: createStableId(
      "english-master-review",
      input.occurrence.id,
      input.reason,
      input.namespace ?? "unassigned",
      input.key ?? "unassigned",
    ),

    occurrenceId:
      input.occurrence.id,

    sourceFile:
      input.occurrence.sourceFile,

    route:
      input.occurrence.route,

    namespace:
      input.namespace,

    key:
      input.key,

    text:
      input.occurrence.text,

    line:
      input.occurrence.line,

    column:
      input.occurrence.column,

    reason:
      input.reason,

    explanation:
      input.explanation,

    createdAt:
      nowIso(),
  };
}

/**
 * Resolves the final builder options.
 */
function resolveOptions(
  options: EnglishMasterBuilderOptions,
): ResolvedEnglishMasterBuilderOptions {
  const projectRoot = path.resolve(
    options.projectRoot ??
      process.cwd(),
  );

  return {
    projectRoot,

    messagesRoot:
      options.messagesRoot ??
      DEFAULT_OPTIONS.messagesRoot,

    preserveExistingValues:
      options.preserveExistingValues ??
      DEFAULT_OPTIONS.preserveExistingValues,

    updateExistingValues:
      options.updateExistingValues ??
      DEFAULT_OPTIONS.updateExistingValues,

    createMissingNamespaceFiles:
      options.createMissingNamespaceFiles ??
      DEFAULT_OPTIONS.createMissingNamespaceFiles,

    applyChanges:
      options.applyChanges ??
      DEFAULT_OPTIONS.applyChanges,

    includeFiles:
      options.includeFiles
        ? new Set(
            options.includeFiles.map(
              normalizePath,
            ),
          )
        : null,

    excludeFilePatterns:
      options.excludeFilePatterns ??
      [],

    minimumConfidence:
      options.minimumConfidence ??
      DEFAULT_OPTIONS.minimumConfidence,

    namespaceRules: [
      ...(options.namespaceRules ?? []),
      ...DEFAULT_NAMESPACE_RULES,
    ],

    saveReviewQueue:
      options.saveReviewQueue ??
      DEFAULT_OPTIONS.saveReviewQueue,

    reviewQueuePath:
      options.reviewQueuePath ??
      DEFAULT_OPTIONS.reviewQueuePath,
  };
}

/**
 * Groups occurrences by resolved namespace.
 */
function groupOccurrencesByNamespace(input: {
  analysis: ProjectHardcodedTextAnalysis;
  options: ResolvedEnglishMasterBuilderOptions;
  reviewQueue: EnglishMasterReviewItem[];
}): Map<
  string,
  HardcodedTextOccurrence[]
> {
  const groups = new Map<
    string,
    HardcodedTextOccurrence[]
  >();

  for (const occurrence of input.analysis.occurrences) {
    if (
      occurrenceIsExcluded(
        occurrence,
        input.options,
      )
    ) {
      input.reviewQueue.push(
        createReviewItem({
          occurrence,
          namespace: null,
          key:
            occurrence.suggestedKey ??
            null,
          reason: "excluded_file",
          explanation:
            "The source file was excluded from automatic English master generation.",
        }),
      );

      continue;
    }

    if (
      occurrence.confidence <
      input.options.minimumConfidence
    ) {
      input.reviewQueue.push(
        createReviewItem({
          occurrence,
          namespace: null,
          key:
            occurrence.suggestedKey ??
            null,
          reason:
            "unsupported_finding",
          explanation: `The finding confidence ${occurrence.confidence.toFixed(
            2,
          )} is below the English Master Builder threshold ${input.options.minimumConfidence.toFixed(
            2,
          )}.`,
        }),
      );

      continue;
    }

    const value =
      normalizeMasterValue(
        occurrence.text,
      );

    if (!value) {
      input.reviewQueue.push(
        createReviewItem({
          occurrence,
          namespace: null,
          key:
            occurrence.suggestedKey ??
            null,
          reason: "empty_text",
          explanation:
            "The finding does not contain usable English text.",
        }),
      );

      continue;
    }

    const namespace =
      resolveOccurrenceNamespace({
        occurrence,
        rules:
          input.options.namespaceRules,
      });

    if (!namespace) {
      input.reviewQueue.push(
        createReviewItem({
          occurrence,
          namespace: null,
          key:
            occurrence.suggestedKey ??
            null,
          reason:
            "missing_namespace",
          explanation:
            "The builder could not determine a namespace for this source finding.",
        }),
      );

      continue;
    }

    const key =
      normalizeTranslationKey(
        occurrence.suggestedKey,
      );

    if (!key) {
      input.reviewQueue.push(
        createReviewItem({
          occurrence,
          namespace,
          key: null,
          reason: "missing_key",
          explanation:
            "The builder could not determine a valid translation key.",
        }),
      );

      continue;
    }

    groups.set(
      namespace,
      groups.get(namespace) ?? [],
    );

    groups
      .get(namespace)
      ?.push(occurrence);
  }

  return groups;
}

/**
 * Builds one English namespace.
 */
async function buildEnglishNamespace(input: {
  namespace: string;
  occurrences: HardcodedTextOccurrence[];
  options: ResolvedEnglishMasterBuilderOptions;
  reviewQueue: EnglishMasterReviewItem[];
}): Promise<EnglishNamespaceBuildResult> {
  const namespacePath = path.resolve(
    input.options.projectRoot,
    input.options.messagesRoot,
    IBOS_MASTER_LANGUAGE,
    `${input.namespace}.json`,
  );

  const namespaceFile =
    toProjectRelativePath(
      input.options.projectRoot,
      namespacePath,
    );

  const readResult =
    await readNamespaceFile(
      namespacePath,
    );

  const result: EnglishNamespaceBuildResult = {
    namespace:
      input.namespace,

    file:
      namespaceFile,

    existedBeforeBuild:
      readResult.exists,

    created:
      false,

    updated:
      false,

    unchanged:
      false,

    entriesProcessed:
      input.occurrences.length,

    keysCreated:
      0,

    keysUpdated:
      0,

    keysPreserved:
      0,

    conflicts:
      0,

    entries:
      [],

    errors:
      [],
  };

  if (readResult.error) {
    result.errors.push(
      readResult.error,
    );

    for (const occurrence of input.occurrences) {
      input.reviewQueue.push(
        createReviewItem({
          occurrence,
          namespace:
            input.namespace,
          key:
            occurrence.suggestedKey,
          reason:
            "invalid_namespace_file",
          explanation: `The English namespace file is invalid: ${readResult.error}`,
        }),
      );
    }

    return result;
  }

  if (
    !readResult.exists &&
    !input.options.createMissingNamespaceFiles
  ) {
    for (const occurrence of input.occurrences) {
      input.reviewQueue.push(
        createReviewItem({
          occurrence,
          namespace:
            input.namespace,
          key:
            occurrence.suggestedKey,
          reason:
            "missing_namespace",
          explanation:
            "The English namespace file does not exist, and automatic file creation is disabled.",
        }),
      );
    }

    return result;
  }

  const masterObject =
    readResult.data;

  let changed = false;

  /**
   * Deduplicate identical namespace/key combinations.
   */
  const uniqueEntries = new Map<
    string,
    HardcodedTextOccurrence
  >();

  for (const occurrence of input.occurrences) {
    const normalizedKey =
      normalizeTranslationKey(
        occurrence.suggestedKey,
      );

    if (!normalizedKey) {
      continue;
    }

    const existingOccurrence =
      uniqueEntries.get(
        normalizedKey,
      );

    if (!existingOccurrence) {
      uniqueEntries.set(
        normalizedKey,
        occurrence,
      );

      continue;
    }

    const existingValue =
      normalizeMasterValue(
        existingOccurrence.text,
      );

    const incomingValue =
      normalizeMasterValue(
        occurrence.text,
      );

    if (
      existingValue !== incomingValue
    ) {
      input.reviewQueue.push(
        createReviewItem({
          occurrence,
          namespace:
            input.namespace,
          key:
            normalizedKey,
          reason:
            "conflicting_value",
          explanation: `The key "${normalizedKey}" was generated for multiple English values: "${existingValue}" and "${incomingValue}".`,
        }),
      );
    }
  }

  for (const [
    key,
    occurrence,
  ] of uniqueEntries.entries()) {
    const value =
      normalizeMasterValue(
        occurrence.text,
      );

    const existingValue =
      getNestedValue(
        masterObject,
        key,
      );

    const existingString =
      typeof existingValue === "string"
        ? existingValue
        : null;

    const entry: EnglishMasterEntry = {
      id: createStableId(
        "english-master-entry",
        input.namespace,
        key,
        occurrence.id,
      ),

      namespace:
        input.namespace,

      key,

      fullKey:
        `${input.namespace}.${key}`,

      value,

      sourceFile:
        occurrence.sourceFile,

      route:
        occurrence.route,

      componentName:
        occurrence.componentName,

      occurrenceId:
        occurrence.id,

      line:
        occurrence.line,

      column:
        occurrence.column,

      confidence:
        occurrence.confidence,

      status:
        "skipped",

      existingValue:
        existingString,

      conflict:
        false,
    };

    if (existingValue === undefined) {
      setNestedValue({
        object:
          masterObject,
        dottedKey:
          key,
        value,
      });

      entry.status =
        "created";

      result.keysCreated += 1;

      changed = true;

      result.entries.push(entry);

      continue;
    }

    if (
      typeof existingValue !== "string"
    ) {
      entry.status =
        "conflict";

      entry.conflict =
        true;

      result.conflicts += 1;

      input.reviewQueue.push(
        createReviewItem({
          occurrence,
          namespace:
            input.namespace,
          key,
          reason:
            "conflicting_value",
          explanation:
            `The key "${key}" already exists but is not a string value.`,
        }),
      );

      result.entries.push(entry);

      continue;
    }

    if (
      existingValue === value
    ) {
      entry.status =
        "preserved";

      result.keysPreserved += 1;

      result.entries.push(entry);

      continue;
    }

    if (
      input.options.updateExistingValues &&
      !input.options.preserveExistingValues
    ) {
      setNestedValue({
        object:
          masterObject,
        dottedKey:
          key,
        value,
      });

      entry.status =
        "updated";

      result.keysUpdated += 1;

      changed = true;

      result.entries.push(entry);

      continue;
    }

    entry.status =
      "conflict";

    entry.conflict =
      true;

    result.conflicts += 1;

    input.reviewQueue.push(
      createReviewItem({
        occurrence,
        namespace:
          input.namespace,
        key,
        reason:
          "conflicting_value",
        explanation:
          `The existing English value "${existingValue}" differs from the detected value "${value}". The existing value was preserved.`,
      }),
    );

    result.entries.push(entry);
  }

  if (!input.options.applyChanges) {
    result.created =
      !readResult.exists &&
      changed;

    result.updated =
      readResult.exists &&
      changed;

    result.unchanged =
      !changed;

    return result;
  }

  if (
    !readResult.exists &&
    changed
  ) {
    try {
      await writeNamespaceFile(
        namespacePath,
        masterObject,
      );

      result.created =
        true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown English namespace write error.";

      result.errors.push(
        message,
      );

      for (const occurrence of input.occurrences) {
        input.reviewQueue.push(
          createReviewItem({
            occurrence,
            namespace:
              input.namespace,
            key:
              occurrence.suggestedKey,
            reason:
              "write_failed",
            explanation:
              message,
          }),
        );
      }
    }

    return result;
  }

  if (
    readResult.exists &&
    changed
  ) {
    try {
      await writeNamespaceFile(
        namespacePath,
        masterObject,
      );

      result.updated =
        true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown English namespace write error.";

      result.errors.push(
        message,
      );
    }

    return result;
  }

  if (
    !readResult.exists &&
    !changed &&
    input.options.createMissingNamespaceFiles
  ) {
    try {
      await writeNamespaceFile(
        namespacePath,
        masterObject,
      );

      result.created =
        true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown empty namespace write error.";

      result.errors.push(
        message,
      );
    }

    return result;
  }

  result.unchanged = true;

  return result;
}

/**
 * Saves the English Master review queue.
 */
async function saveEnglishMasterReviewQueue(input: {
  projectRoot: string;
  reviewQueuePath: string;
  reviewQueue: EnglishMasterReviewItem[];
}): Promise<string> {
  const absolutePath = path.resolve(
    input.projectRoot,
    input.reviewQueuePath,
  );

  await ensureDirectory(
    path.dirname(absolutePath),
  );

  await fs.writeFile(
    absolutePath,
    `${JSON.stringify(
      {
        platform:
          "EPEW-EDE-IBOS",

        registry:
          "ENGLISH_MASTER_REVIEW_QUEUE",

        generatedAt:
          nowIso(),

        totalItems:
          input.reviewQueue.length,

        items:
          input.reviewQueue,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return toProjectRelativePath(
    input.projectRoot,
    absolutePath,
  );
}

/**
 * Builds English master namespaces for the entire platform.
 */
export async function buildEnglishMaster(
  analysis: ProjectHardcodedTextAnalysis,
  builderOptions: EnglishMasterBuilderOptions = {},
): Promise<EnglishMasterBuildResult> {
  const startedAt =
    nowIso();

  const startTime =
    Date.now();

  const options =
    resolveOptions(
      builderOptions,
    );

  const buildId =
    createStableId(
      "english-master-build",
      options.projectRoot,
      startedAt,
      analysis.totalOccurrences,
    );

  const reviewQueue: EnglishMasterReviewItem[] =
    [];

  const groups =
    groupOccurrencesByNamespace({
      analysis,
      options,
      reviewQueue,
    });

  const namespaceResults: EnglishNamespaceBuildResult[] =
    [];

  for (const [
    namespace,
    occurrences,
  ] of [...groups.entries()].sort(
    ([firstNamespace], [secondNamespace]) =>
      firstNamespace.localeCompare(
        secondNamespace,
      ),
  )) {
    const namespaceResult =
      await buildEnglishNamespace({
        namespace,
        occurrences,
        options,
        reviewQueue,
      });

    namespaceResults.push(
      namespaceResult,
    );
  }

  const generatedFiles =
    namespaceResults
      .filter(
        (result) =>
          result.created,
      )
      .map(
        (result) =>
          result.file,
      );

  const updatedFiles =
    namespaceResults
      .filter(
        (result) =>
          result.updated,
      )
      .map(
        (result) =>
          result.file,
      );

  const unchangedFiles =
    namespaceResults
      .filter(
        (result) =>
          result.unchanged,
      )
      .map(
        (result) =>
          result.file,
      );

  const errors =
    namespaceResults.flatMap(
      (result) =>
        result.errors.map(
          (error) =>
            `${result.file}: ${error}`,
        ),
    );

  if (
    options.saveReviewQueue
  ) {
    try {
      const queueFile =
        await saveEnglishMasterReviewQueue({
          projectRoot:
            options.projectRoot,

          reviewQueuePath:
            options.reviewQueuePath,

          reviewQueue,
        });

      updatedFiles.push(
        queueFile,
      );
    } catch (error) {
      errors.push(
        error instanceof Error
          ? `Unable to save English Master review queue: ${error.message}`
          : "Unable to save English Master review queue.",
      );
    }
  }

  const completedAt =
    nowIso();

  return {
    success:
      errors.length === 0,

    buildId,

    platform:
      "EPEW-EDE-IBOS",

    engine:
      "ENGLISH_MASTER_BUILDER",

    version:
      IBOS_ENGLISH_MASTER_BUILDER_VERSION,

    startedAt,
    completedAt,

    durationMs:
      Date.now() - startTime,

    projectRoot:
      normalizePath(
        options.projectRoot,
      ),

    messagesRoot:
      normalizePath(
        options.messagesRoot,
      ),

    analyzedOccurrences:
      analysis.totalOccurrences,

    processedOccurrences:
      namespaceResults.reduce(
        (total, result) =>
          total +
          result.entriesProcessed,
        0,
      ),

    namespacesProcessed:
      namespaceResults.length,

    namespacesCreated:
      namespaceResults.filter(
        (result) =>
          result.created,
      ).length,

    namespacesUpdated:
      namespaceResults.filter(
        (result) =>
          result.updated,
      ).length,

    namespacesUnchanged:
      namespaceResults.filter(
        (result) =>
          result.unchanged,
      ).length,

    keysCreated:
      namespaceResults.reduce(
        (total, result) =>
          total +
          result.keysCreated,
        0,
      ),

    keysUpdated:
      namespaceResults.reduce(
        (total, result) =>
          total +
          result.keysUpdated,
        0,
      ),

    keysPreserved:
      namespaceResults.reduce(
        (total, result) =>
          total +
          result.keysPreserved,
        0,
      ),

    conflicts:
      namespaceResults.reduce(
        (total, result) =>
          total +
          result.conflicts,
        0,
      ),

    reviewItemsCreated:
      reviewQueue.length,

    generatedFiles:
      uniqueValues(
        generatedFiles,
      ).sort(),

    updatedFiles:
      uniqueValues(
        updatedFiles,
      ).sort(),

    unchangedFiles:
      uniqueValues(
        unchangedFiles,
      ).sort(),

    namespaceResults,

    reviewQueue,

    errors:
      uniqueValues(
        errors,
      ),
  };
}

/**
 * Runs the English Master Builder as a preview.
 */
export async function previewEnglishMaster(
  analysis: ProjectHardcodedTextAnalysis,
  options: Omit<
    EnglishMasterBuilderOptions,
    "applyChanges"
  > = {},
): Promise<EnglishMasterBuildResult> {
  return buildEnglishMaster(
    analysis,
    {
      ...options,
      applyChanges: false,
    },
  );
}

/**
 * Applies English master generation.
 */
export async function applyEnglishMaster(
  analysis: ProjectHardcodedTextAnalysis,
  options: Omit<
    EnglishMasterBuilderOptions,
    "applyChanges"
  > = {},
): Promise<EnglishMasterBuildResult> {
  return buildEnglishMaster(
    analysis,
    {
      ...options,
      applyChanges: true,
    },
  );
}

/**
 * Returns namespaces created during the build.
 */
export function getCreatedEnglishNamespaces(
  result: EnglishMasterBuildResult,
): EnglishNamespaceBuildResult[] {
  return result.namespaceResults.filter(
    (namespaceResult) =>
      namespaceResult.created,
  );
}

/**
 * Returns namespaces updated during the build.
 */
export function getUpdatedEnglishNamespaces(
  result: EnglishMasterBuildResult,
): EnglishNamespaceBuildResult[] {
  return result.namespaceResults.filter(
    (namespaceResult) =>
      namespaceResult.updated,
  );
}

/**
 * Returns English Master conflicts.
 */
export function getEnglishMasterConflicts(
  result: EnglishMasterBuildResult,
): EnglishMasterEntry[] {
  return result.namespaceResults.flatMap(
    (namespaceResult) =>
      namespaceResult.entries.filter(
        (entry) =>
          entry.conflict,
      ),
  );
}