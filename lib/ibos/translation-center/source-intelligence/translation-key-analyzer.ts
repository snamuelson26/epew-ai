/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Source Intelligence Engine
 * Translation Key Analyzer
 * Version: 1.0.0
 * ============================================================
 */

import type { DiscoveredProjectFile } from "../file-scanner";

import {
  IBOS_TRANSLATION_FUNCTION_NAMES,
  IBOS_TRANSLATION_RUNTIME_NAMES,
} from "../config";

import {
  createStableId,
  getLineAndColumn,
  uniqueValues,
} from "../utils";

/**
 * Translation usage patterns recognized by the analyzer.
 */
export type TranslationUsageKind =
  | "function_call"
  | "hook_call"
  | "runtime_call"
  | "component"
  | "dynamic_key";

/**
 * One translation key reference discovered in source code.
 */
export interface TranslationKeyUsage {
  id: string;
  sourceFile: string;
  route: string | null;
  namespace: string | null;
  key: string;
  fullKey: string;
  rawKey: string;
  functionName: string;
  usageKind: TranslationUsageKind;
  line: number;
  column: number;
  isDynamic: boolean;
  isNamespaceQualified: boolean;
  rawExpression: string;
}

/**
 * One translation namespace reference found in source code.
 */
export interface TranslationNamespaceUsage {
  id: string;
  sourceFile: string;
  namespace: string;
  line: number;
  column: number;
  source: string;
}

/**
 * One dynamically constructed translation key.
 *
 * Dynamic keys require manual review because they cannot always
 * be validated against static JSON files.
 */
export interface DynamicTranslationKeyUsage {
  id: string;
  sourceFile: string;
  route: string | null;
  namespace: string | null;
  functionName: string;
  expression: string;
  line: number;
  column: number;
  reason: string;
}

/**
 * Result returned after analyzing one file.
 */
export interface FileTranslationKeyAnalysis {
  success: boolean;
  sourceFile: string;
  route: string | null;
  suggestedNamespace: string | null;
  translationKeys: TranslationKeyUsage[];
  namespaceUsages: TranslationNamespaceUsage[];
  dynamicKeys: DynamicTranslationKeyUsage[];
  translationFunctions: string[];
  runtimeReferences: string[];
  usesTranslationSystem: boolean;
  errors: string[];
}

/**
 * Result returned after analyzing multiple project files.
 */
export interface ProjectTranslationKeyAnalysis {
  success: boolean;
  analyzedFiles: number;
  filesUsingTranslations: number;
  translationKeys: TranslationKeyUsage[];
  namespaceUsages: TranslationNamespaceUsage[];
  dynamicKeys: DynamicTranslationKeyUsage[];
  fileResults: FileTranslationKeyAnalysis[];
  uniqueFullKeys: string[];
  usedNamespaces: string[];
  translationFunctions: string[];
  runtimeReferences: string[];
  errors: string[];
}

/**
 * Analyzer options.
 */
export interface TranslationKeyAnalyzerOptions {
  /**
   * Additional translation function names.
   *
   * Examples:
   * t
   * translate
   * translation
   */
  translationFunctionNames?: string[];

  /**
   * Additional translation runtime identifiers.
   */
  runtimeNames?: string[];

  /**
   * Detect namespace declarations in hooks such as:
   *
   * useTranslations("homepage")
   * useTranslation("homepage")
   */
  detectHookNamespaces?: boolean;

  /**
   * Detect JSX translation components such as:
   *
   * <Trans i18nKey="homepage.hero.title" />
   */
  detectTranslationComponents?: boolean;

  /**
   * Include dynamic translation expressions.
   */
  includeDynamicKeys?: boolean;

  /**
   * When a key has no explicit namespace, use the namespace
   * already assigned to the discovered source file.
   */
  applySuggestedNamespace?: boolean;
}

/**
 * Default analyzer behavior.
 */
const DEFAULT_OPTIONS: Required<
  Pick<
    TranslationKeyAnalyzerOptions,
    | "detectHookNamespaces"
    | "detectTranslationComponents"
    | "includeDynamicKeys"
    | "applySuggestedNamespace"
  >
> = {
  detectHookNamespaces: true,
  detectTranslationComponents: true,
  includeDynamicKeys: true,
  applySuggestedNamespace: true,
};

/**
 * Translation hooks recognized by default.
 */
const DEFAULT_TRANSLATION_HOOK_NAMES = [
  "useTranslation",
  "useTranslations",
  "useLanguage",
  "useLocale",
];

/**
 * Translation component names recognized by default.
 */
const DEFAULT_TRANSLATION_COMPONENT_NAMES = [
  "Trans",
  "Translation",
  "LocalizedText",
];

/**
 * Valid translation-key format.
 *
 * Examples:
 * hero.title
 * homepage.hero.title
 * funding_queue.empty_state.message
 */
const STATIC_TRANSLATION_KEY_PATTERN =
  /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/;

/**
 * Escapes a string before using it in a regular expression.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Removes duplicate values while preserving order.
 */
function deduplicateStrings(values: string[]): string[] {
  return uniqueValues(
    values.map((value) => value.trim()).filter(Boolean),
  );
}

/**
 * Returns the complete translation function list.
 */
function getTranslationFunctionNames(
  options?: TranslationKeyAnalyzerOptions,
): string[] {
  return deduplicateStrings([
    ...IBOS_TRANSLATION_FUNCTION_NAMES,
    ...(options?.translationFunctionNames ?? []),
  ]);
}

/**
 * Returns the complete translation runtime list.
 */
function getTranslationRuntimeNames(
  options?: TranslationKeyAnalyzerOptions,
): string[] {
  return deduplicateStrings([
    ...IBOS_TRANSLATION_RUNTIME_NAMES,
    ...(options?.runtimeNames ?? []),
  ]);
}

/**
 * Determines whether a translation key is statically analyzable.
 */
function isStaticTranslationKey(value: string): boolean {
  return STATIC_TRANSLATION_KEY_PATTERN.test(value.trim());
}

/**
 * Splits a key into namespace and local key.
 *
 * A key is considered explicitly namespace-qualified when its first
 * segment matches the source file's assigned namespace.
 *
 * Example:
 *
 * source namespace: homepage
 * full key: homepage.hero.title
 *
 * namespace: homepage
 * key: hero.title
 */
function splitTranslationKey(input: {
  rawKey: string;
  suggestedNamespace: string | null;
  applySuggestedNamespace: boolean;
}): {
  namespace: string | null;
  key: string;
  fullKey: string;
  isNamespaceQualified: boolean;
} {
  const rawKey = input.rawKey.trim();

  if (
    input.suggestedNamespace &&
    rawKey.startsWith(`${input.suggestedNamespace}.`)
  ) {
    return {
      namespace: input.suggestedNamespace,
      key: rawKey.slice(input.suggestedNamespace.length + 1),
      fullKey: rawKey,
      isNamespaceQualified: true,
    };
  }

  const segments = rawKey.split(".").filter(Boolean);

  if (
    segments.length > 2 &&
    input.suggestedNamespace === null
  ) {
    const [possibleNamespace, ...keySegments] = segments;

    return {
      namespace: possibleNamespace ?? null,
      key: keySegments.join("."),
      fullKey: rawKey,
      isNamespaceQualified: true,
    };
  }

  if (
    input.applySuggestedNamespace &&
    input.suggestedNamespace
  ) {
    return {
      namespace: input.suggestedNamespace,
      key: rawKey,
      fullKey: `${input.suggestedNamespace}.${rawKey}`,
      isNamespaceQualified: false,
    };
  }

  return {
    namespace: null,
    key: rawKey,
    fullKey: rawKey,
    isNamespaceQualified: false,
  };
}

/**
 * Creates one static translation usage record.
 */
function createTranslationKeyUsage(input: {
  file: DiscoveredProjectFile;
  rawKey: string;
  functionName: string;
  usageKind: TranslationUsageKind;
  line: number;
  column: number;
  rawExpression: string;
  applySuggestedNamespace: boolean;
}): TranslationKeyUsage {
  const keyParts = splitTranslationKey({
    rawKey: input.rawKey,
    suggestedNamespace: input.file.namespace,
    applySuggestedNamespace:
      input.applySuggestedNamespace,
  });

  return {
    id: createStableId(
      "translation-key-usage",
      input.file.relativePath,
      keyParts.fullKey,
      input.functionName,
      input.line,
      input.column,
    ),
    sourceFile: input.file.relativePath,
    route: input.file.route,
    namespace: keyParts.namespace,
    key: keyParts.key,
    fullKey: keyParts.fullKey,
    rawKey: input.rawKey,
    functionName: input.functionName,
    usageKind: input.usageKind,
    line: input.line,
    column: input.column,
    isDynamic: false,
    isNamespaceQualified:
      keyParts.isNamespaceQualified,
    rawExpression: input.rawExpression,
  };
}

/**
 * Creates one dynamic translation key record.
 */
function createDynamicTranslationKey(input: {
  file: DiscoveredProjectFile;
  functionName: string;
  expression: string;
  line: number;
  column: number;
  reason: string;
}): DynamicTranslationKeyUsage {
  return {
    id: createStableId(
      "dynamic-translation-key",
      input.file.relativePath,
      input.functionName,
      input.expression,
      input.line,
      input.column,
    ),
    sourceFile: input.file.relativePath,
    route: input.file.route,
    namespace: input.file.namespace,
    functionName: input.functionName,
    expression: input.expression,
    line: input.line,
    column: input.column,
    reason: input.reason,
  };
}

/**
 * Extracts translation calls using string literals.
 *
 * Supported examples:
 *
 * t("hero.title")
 * translate('homepage.hero.title')
 * translation(`dashboard.title`)
 */
function extractStaticFunctionCalls(input: {
  source: string;
  file: DiscoveredProjectFile;
  functionNames: string[];
  applySuggestedNamespace: boolean;
}): TranslationKeyUsage[] {
  const usages: TranslationKeyUsage[] = [];

  for (const functionName of input.functionNames) {
    const escapedFunctionName = escapeRegExp(functionName);

    const pattern = new RegExp(
      `\\b${escapedFunctionName}\\s*\\(\\s*(["'\`])([^"'\\\`]+)\\1`,
      "g",
    );

    let match: RegExpExecArray | null;

    while ((match = pattern.exec(input.source)) !== null) {
      const rawKey = match[2]?.trim();

      if (!rawKey || !isStaticTranslationKey(rawKey)) {
        continue;
      }

      const position = getLineAndColumn(
        input.source,
        match.index,
      );

      usages.push(
        createTranslationKeyUsage({
          file: input.file,
          rawKey,
          functionName,
          usageKind: "function_call",
          line: position.line,
          column: position.column,
          rawExpression: match[0],
          applySuggestedNamespace:
            input.applySuggestedNamespace,
        }),
      );
    }
  }

  return usages;
}

/**
 * Extracts dynamic function calls.
 *
 * Supported examples:
 *
 * t(key)
 * t(`hero.${section}`)
 * translate(namespace + ".title")
 */
function extractDynamicFunctionCalls(input: {
  source: string;
  file: DiscoveredProjectFile;
  functionNames: string[];
}): DynamicTranslationKeyUsage[] {
  const usages: DynamicTranslationKeyUsage[] = [];

  for (const functionName of input.functionNames) {
    const escapedFunctionName = escapeRegExp(functionName);

    const pattern = new RegExp(
      `\\b${escapedFunctionName}\\s*\\(\\s*([^\\n\\r,)]+)`,
      "g",
    );

    let match: RegExpExecArray | null;

    while ((match = pattern.exec(input.source)) !== null) {
      const expression = match[1]?.trim();

      if (!expression) {
        continue;
      }

      const firstCharacter = expression.charAt(0);

      if (
        firstCharacter === `"` ||
        firstCharacter === `'`
      ) {
        continue;
      }

      if (
        firstCharacter === "`" &&
        !expression.includes("${")
      ) {
        continue;
      }

      const position = getLineAndColumn(
        input.source,
        match.index,
      );

      usages.push(
        createDynamicTranslationKey({
          file: input.file,
          functionName,
          expression,
          line: position.line,
          column: position.column,
          reason:
            "The translation key is constructed dynamically and cannot be fully validated through static analysis.",
        }),
      );
    }
  }

  return usages;
}

/**
 * Detects namespace declarations from translation hooks.
 *
 * Supported examples:
 *
 * useTranslations("homepage")
 * useTranslation("admin-dashboard")
 */
function extractHookNamespaceUsages(input: {
  source: string;
  file: DiscoveredProjectFile;
}): TranslationNamespaceUsage[] {
  const usages: TranslationNamespaceUsage[] = [];

  for (const hookName of DEFAULT_TRANSLATION_HOOK_NAMES) {
    const pattern = new RegExp(
      `\\b${escapeRegExp(
        hookName,
      )}\\s*\\(\\s*(["'\`])([^"'\\\`]+)\\1\\s*\\)`,
      "g",
    );

    let match: RegExpExecArray | null;

    while ((match = pattern.exec(input.source)) !== null) {
      const namespace = match[2]?.trim();

      if (!namespace || !isStaticTranslationKey(namespace)) {
        continue;
      }

      const position = getLineAndColumn(
        input.source,
        match.index,
      );

      usages.push({
        id: createStableId(
          "translation-namespace-usage",
          input.file.relativePath,
          namespace,
          hookName,
          position.line,
        ),
        sourceFile: input.file.relativePath,
        namespace,
        line: position.line,
        column: position.column,
        source: hookName,
      });
    }
  }

  return usages;
}

/**
 * Extracts translation keys from JSX translation components.
 *
 * Supported examples:
 *
 * <Trans i18nKey="homepage.hero.title" />
 * <Translation translationKey="about.title" />
 * <LocalizedText keyName="dashboard.heading" />
 */
function extractTranslationComponentUsages(input: {
  source: string;
  file: DiscoveredProjectFile;
  applySuggestedNamespace: boolean;
}): TranslationKeyUsage[] {
  const usages: TranslationKeyUsage[] = [];

  const componentNames = DEFAULT_TRANSLATION_COMPONENT_NAMES
    .map(escapeRegExp)
    .join("|");

  const attributeNames = [
    "i18nKey",
    "translationKey",
    "keyName",
    "messageKey",
  ]
    .map(escapeRegExp)
    .join("|");

  const pattern = new RegExp(
    `<(?:${componentNames})\\b[^>]*\\b(${attributeNames})\\s*=\\s*(?:["']([^"']+)["']|\\{\\s*["']([^"']+)["']\\s*\\})`,
    "g",
  );

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input.source)) !== null) {
    const attributeName = match[1] ?? "translationKey";
    const rawKey = (match[2] ?? match[3])?.trim();

    if (!rawKey || !isStaticTranslationKey(rawKey)) {
      continue;
    }

    const position = getLineAndColumn(
      input.source,
      match.index,
    );

    usages.push(
      createTranslationKeyUsage({
        file: input.file,
        rawKey,
        functionName: attributeName,
        usageKind: "component",
        line: position.line,
        column: position.column,
        rawExpression: match[0],
        applySuggestedNamespace:
          input.applySuggestedNamespace,
      }),
    );
  }

  return usages;
}

/**
 * Detects references to translation infrastructure.
 *
 * Examples:
 *
 * LanguageProvider
 * TranslationEngine
 * useLanguage
 */
function detectRuntimeReferences(
  source: string,
  runtimeNames: string[],
): string[] {
  return runtimeNames.filter((runtimeName) => {
    const pattern = new RegExp(
      `\\b${escapeRegExp(runtimeName)}\\b`,
    );

    return pattern.test(source);
  });
}

/**
 * Detects translation function names used in a source file.
 */
function detectTranslationFunctions(
  source: string,
  functionNames: string[],
): string[] {
  return functionNames.filter((functionName) => {
    const pattern = new RegExp(
      `\\b${escapeRegExp(functionName)}\\s*\\(`,
    );

    return pattern.test(source);
  });
}

/**
 * Removes duplicate static translation usage records.
 */
function deduplicateTranslationKeyUsages(
  usages: TranslationKeyUsage[],
): TranslationKeyUsage[] {
  const records = new Map<string, TranslationKeyUsage>();

  for (const usage of usages) {
    const key = [
      usage.sourceFile,
      usage.fullKey,
      usage.line,
      usage.column,
      usage.usageKind,
    ].join("::");

    if (!records.has(key)) {
      records.set(key, usage);
    }
  }

  return [...records.values()].sort((first, second) => {
    if (first.line !== second.line) {
      return first.line - second.line;
    }

    return first.column - second.column;
  });
}

/**
 * Removes duplicate namespace usages.
 */
function deduplicateNamespaceUsages(
  usages: TranslationNamespaceUsage[],
): TranslationNamespaceUsage[] {
  const records = new Map<
    string,
    TranslationNamespaceUsage
  >();

  for (const usage of usages) {
    const key = [
      usage.sourceFile,
      usage.namespace,
      usage.line,
      usage.column,
    ].join("::");

    if (!records.has(key)) {
      records.set(key, usage);
    }
  }

  return [...records.values()].sort((first, second) => {
    if (first.line !== second.line) {
      return first.line - second.line;
    }

    return first.column - second.column;
  });
}

/**
 * Removes duplicate dynamic-key records.
 */
function deduplicateDynamicKeys(
  usages: DynamicTranslationKeyUsage[],
): DynamicTranslationKeyUsage[] {
  const records = new Map<
    string,
    DynamicTranslationKeyUsage
  >();

  for (const usage of usages) {
    const key = [
      usage.sourceFile,
      usage.functionName,
      usage.expression,
      usage.line,
      usage.column,
    ].join("::");

    if (!records.has(key)) {
      records.set(key, usage);
    }
  }

  return [...records.values()].sort((first, second) => {
    if (first.line !== second.line) {
      return first.line - second.line;
    }

    return first.column - second.column;
  });
}

/**
 * Analyzes translation-key usage in one source file.
 */
export function analyzeFileTranslationKeys(input: {
  source: string;
  file: DiscoveredProjectFile;
  options?: TranslationKeyAnalyzerOptions;
}): FileTranslationKeyAnalysis {
  const options = {
    ...DEFAULT_OPTIONS,
    ...(input.options ?? {}),
  };

  const translationFunctionNames =
    getTranslationFunctionNames(input.options);

  const runtimeNames =
    getTranslationRuntimeNames(input.options);

  const errors: string[] = [];
  const translationKeys: TranslationKeyUsage[] = [];
  const namespaceUsages: TranslationNamespaceUsage[] = [];
  const dynamicKeys: DynamicTranslationKeyUsage[] = [];

  try {
    translationKeys.push(
      ...extractStaticFunctionCalls({
        source: input.source,
        file: input.file,
        functionNames: translationFunctionNames,
        applySuggestedNamespace:
          options.applySuggestedNamespace,
      }),
    );

    if (options.detectTranslationComponents) {
      translationKeys.push(
        ...extractTranslationComponentUsages({
          source: input.source,
          file: input.file,
          applySuggestedNamespace:
            options.applySuggestedNamespace,
        }),
      );
    }

    if (options.detectHookNamespaces) {
      namespaceUsages.push(
        ...extractHookNamespaceUsages({
          source: input.source,
          file: input.file,
        }),
      );
    }

    if (options.includeDynamicKeys) {
      dynamicKeys.push(
        ...extractDynamicFunctionCalls({
          source: input.source,
          file: input.file,
          functionNames: translationFunctionNames,
        }),
      );
    }
  } catch (error) {
    errors.push(
      `Unable to analyze translation keys in "${input.file.relativePath}": ${
        error instanceof Error
          ? error.message
          : "Unknown translation-key analysis error."
      }`,
    );
  }

  const uniqueTranslationKeys =
    deduplicateTranslationKeyUsages(
      translationKeys,
    );

  const uniqueNamespaceUsages =
    deduplicateNamespaceUsages(namespaceUsages);

  const uniqueDynamicKeys =
    deduplicateDynamicKeys(dynamicKeys);

  const translationFunctions =
    detectTranslationFunctions(
      input.source,
      translationFunctionNames,
    );

  const runtimeReferences =
    detectRuntimeReferences(
      input.source,
      runtimeNames,
    );

  return {
    success: errors.length === 0,
    sourceFile: input.file.relativePath,
    route: input.file.route,
    suggestedNamespace: input.file.namespace,
    translationKeys: uniqueTranslationKeys,
    namespaceUsages: uniqueNamespaceUsages,
    dynamicKeys: uniqueDynamicKeys,
    translationFunctions,
    runtimeReferences,
    usesTranslationSystem:
      uniqueTranslationKeys.length > 0 ||
      uniqueNamespaceUsages.length > 0 ||
      uniqueDynamicKeys.length > 0 ||
      translationFunctions.length > 0 ||
      runtimeReferences.length > 0,
    errors,
  };
}

/**
 * Analyzes translation-key usage across multiple source files.
 *
 * The source map must use project-relative paths as keys.
 */
export function analyzeProjectTranslationKeys(input: {
  files: DiscoveredProjectFile[];
  sources: Record<string, string>;
  options?: TranslationKeyAnalyzerOptions;
}): ProjectTranslationKeyAnalysis {
  const fileResults: FileTranslationKeyAnalysis[] = [];
  const errors: string[] = [];

  for (const file of input.files) {
    const source = input.sources[file.relativePath];

    if (source === undefined) {
      errors.push(
        `Source content was not provided for "${file.relativePath}".`,
      );

      continue;
    }

    const result = analyzeFileTranslationKeys({
      source,
      file,
      options: input.options,
    });

    fileResults.push(result);
    errors.push(...result.errors);
  }

  const translationKeys =
    fileResults.flatMap(
      (result) => result.translationKeys,
    );

  const namespaceUsages =
    fileResults.flatMap(
      (result) => result.namespaceUsages,
    );

  const dynamicKeys =
    fileResults.flatMap(
      (result) => result.dynamicKeys,
    );

  return {
    success: errors.length === 0,
    analyzedFiles: fileResults.length,
    filesUsingTranslations:
      fileResults.filter(
        (result) => result.usesTranslationSystem,
      ).length,
    translationKeys,
    namespaceUsages,
    dynamicKeys,
    fileResults,
    uniqueFullKeys: uniqueValues(
      translationKeys.map((usage) => usage.fullKey),
    ).sort(),
    usedNamespaces: uniqueValues(
      [
        ...translationKeys
          .map((usage) => usage.namespace)
          .filter(
            (namespace): namespace is string =>
              Boolean(namespace),
          ),
        ...namespaceUsages.map(
          (usage) => usage.namespace,
        ),
      ],
    ).sort(),
    translationFunctions: uniqueValues(
      fileResults.flatMap(
        (result) => result.translationFunctions,
      ),
    ).sort(),
    runtimeReferences: uniqueValues(
      fileResults.flatMap(
        (result) => result.runtimeReferences,
      ),
    ).sort(),
    errors,
  };
}

/**
 * Returns all translation keys used by one source file.
 */
export function getTranslationKeysForFile(
  analysis: ProjectTranslationKeyAnalysis,
  sourceFile: string,
): TranslationKeyUsage[] {
  return analysis.translationKeys.filter(
    (usage) => usage.sourceFile === sourceFile,
  );
}

/**
 * Returns all translation keys used by one route.
 */
export function getTranslationKeysForRoute(
  analysis: ProjectTranslationKeyAnalysis,
  route: string,
): TranslationKeyUsage[] {
  return analysis.translationKeys.filter(
    (usage) => usage.route === route,
  );
}

/**
 * Returns all translation keys used by one namespace.
 */
export function getTranslationKeysForNamespace(
  analysis: ProjectTranslationKeyAnalysis,
  namespace: string,
): TranslationKeyUsage[] {
  return analysis.translationKeys.filter(
    (usage) => usage.namespace === namespace,
  );
}

/**
 * Returns unique key names used inside one namespace.
 *
 * The namespace prefix is removed.
 */
export function getLocalKeysForNamespace(
  analysis: ProjectTranslationKeyAnalysis,
  namespace: string,
): string[] {
  return uniqueValues(
    analysis.translationKeys
      .filter(
        (usage) => usage.namespace === namespace,
      )
      .map((usage) => usage.key),
  ).sort();
}

/**
 * Returns source files using a specific translation key.
 */
export function getFilesUsingTranslationKey(
  analysis: ProjectTranslationKeyAnalysis,
  fullKey: string,
): string[] {
  return uniqueValues(
    analysis.translationKeys
      .filter((usage) => usage.fullKey === fullKey)
      .map((usage) => usage.sourceFile),
  ).sort();
}

/**
 * Returns keys referenced by source code but absent from the
 * registered translation-key collection.
 */
export function findMissingRegisteredKeys(
  analysis: ProjectTranslationKeyAnalysis,
  registeredFullKeys: string[],
): TranslationKeyUsage[] {
  const registeredKeySet = new Set(registeredFullKeys);

  return analysis.translationKeys.filter(
    (usage) => !registeredKeySet.has(usage.fullKey),
  );
}

/**
 * Returns registered translation keys that are not referenced
 * anywhere in the analyzed source code.
 */
export function findUnusedRegisteredKeys(
  analysis: ProjectTranslationKeyAnalysis,
  registeredFullKeys: string[],
): string[] {
  const usedKeySet = new Set(
    analysis.translationKeys.map(
      (usage) => usage.fullKey,
    ),
  );

  return registeredFullKeys
    .filter((fullKey) => !usedKeySet.has(fullKey))
    .sort();
}

/**
 * Returns files that use the translation runtime but contain no
 * statically detected translation keys.
 *
 * This can identify components using indirect or dynamic keys.
 */
export function getTranslationRuntimeOnlyFiles(
  analysis: ProjectTranslationKeyAnalysis,
): FileTranslationKeyAnalysis[] {
  return analysis.fileResults.filter(
    (result) =>
      result.usesTranslationSystem &&
      result.translationKeys.length === 0,
  );
}