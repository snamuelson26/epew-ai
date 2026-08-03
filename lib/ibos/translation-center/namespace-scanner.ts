/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * IBOS Enterprise Translation Service
 * Namespace Scanner
 * Version: 1.0.0
 * ============================================================
 */

import fs from "node:fs/promises";
import path from "node:path";

import {
  IBOS_ENABLED_LANGUAGES,
  IBOS_MASTER_LANGUAGE,
  IBOS_TRANSLATION_PATHS,
} from "./config";

import type {
  TranslationIssue,
  TranslationKey,
  TranslationLanguage,
  TranslationLanguageStatus,
  TranslationNamespace,
} from "./types";

import type {
  DiscoveredProjectFile,
  ProjectFileScanResult,
} from "./file-scanner";

import {
  calculatePercentage,
  createStableId,
  determineComplianceStatus,
  determineTranslationStatus,
  extractPlaceholders,
  flattenTranslationObject,
  formatJson,
  getMissingTranslationKeys,
  getObsoleteTranslationKeys,
  getValueByKeyPath,
  isMissingTranslationValue,
  namespaceToFileName,
  normalizePath,
  nowIso,
  safeParseJson,
  toProjectRelativePath,
} from "./utils";

import type {
  FlattenedTranslationRecord,
  TranslationJsonValue,
} from "./utils";

/**
 * Translation file discovered for one language and namespace.
 */
export interface DiscoveredNamespaceFile {
  id: string;
  namespace: string;
  language: TranslationLanguage;
  absolutePath: string;
  relativePath: string;
  fileName: string;
  exists: boolean;
  validJson: boolean;
  content: TranslationJsonValue | null;
  flattenedContent: FlattenedTranslationRecord;
  totalKeys: number;
  error: string | null;
  scannedAt: string;
}

/**
 * Options accepted by the namespace scanner.
 */
export interface NamespaceScannerOptions {
  projectRoot?: string;

  /**
   * Optional list of route namespaces.
   *
   * Namespaces referenced by routes are included even when their
   * English master file does not exist.
   */
  registeredRouteNamespaces?: string[];

  /**
   * Existing namespace records preserved when possible.
   */
  existingNamespaces?: TranslationNamespace[];

  /**
   * Existing key registry records preserved when possible.
   */
  existingKeys?: TranslationKey[];

  /**
   * Create a missing English master file automatically.
   *
   * This option defaults to false because a master namespace should
   * normally be reviewed before being created.
   */
  createMissingMasterFiles?: boolean;

  /**
   * Create missing target-language files using the English hierarchy.
   *
   * This option defaults to false during scanning. File generation
   * belongs primarily to the Translation Build Engine.
   */
  createMissingTargetFiles?: boolean;
}

/**
 * Result returned by the namespace scanner.
 */
export interface NamespaceScanResult {
  success: boolean;
  scanId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;

  files: DiscoveredNamespaceFile[];
  namespaces: TranslationNamespace[];
  keys: TranslationKey[];
  issues: TranslationIssue[];

  discoveredNamespaceNames: string[];
  masterNamespaces: string[];
  routeOnlyNamespaces: string[];
  missingMasterNamespaces: string[];
  missingLanguageFiles: Array<{
    namespace: string;
    language: TranslationLanguage;
    expectedFile: string;
  }>;

  invalidJsonFiles: DiscoveredNamespaceFile[];
  compliantNamespaces: TranslationNamespace[];
  nonCompliantNamespaces: TranslationNamespace[];

  createdFiles: string[];
  errors: string[];
}

/**
 * Internal namespace grouping structure.
 */
interface NamespaceFileGroup {
  namespace: string;
  files: Partial<
    Record<TranslationLanguage, DiscoveredNamespaceFile>
  >;
}

/**
 * Default scanner options.
 */
const DEFAULT_NAMESPACE_SCANNER_OPTIONS: Required<
  Pick<
    NamespaceScannerOptions,
    "createMissingMasterFiles" | "createMissingTargetFiles"
  >
> = {
  createMissingMasterFiles: false,
  createMissingTargetFiles: false,
};

/**
 * Determines whether a string is a supported language.
 */
function isTranslationLanguage(
  value: string,
): value is TranslationLanguage {
  return IBOS_ENABLED_LANGUAGES.includes(
    value as TranslationLanguage,
  );
}

/**
 * Determines whether a path exists.
 */
async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a parent directory when it does not exist.
 */
async function ensureDirectory(directoryPath: string): Promise<void> {
  await fs.mkdir(directoryPath, {
    recursive: true,
  });
}

/**
 * Extracts the language from a message file path.
 *
 * Example:
 * app/messages/fr/about.json
 *
 * returns:
 * fr
 */
function getLanguageFromMessageFile(
  relativePath: string,
): TranslationLanguage | null {
  const normalized = normalizePath(relativePath);
  const messageRoot = normalizePath(
    IBOS_TRANSLATION_PATHS.messageRoot,
  );

  if (!normalized.startsWith(`${messageRoot}/`)) {
    return null;
  }

  const pathAfterRoot = normalized.slice(
    messageRoot.length + 1,
  );

  const [languageSegment] = pathAfterRoot.split("/");

  if (
    !languageSegment ||
    !isTranslationLanguage(languageSegment)
  ) {
    return null;
  }

  return languageSegment;
}

/**
 * Extracts the namespace from a message file path.
 *
 * Example:
 * app/messages/en/about.json
 *
 * returns:
 * about
 */
function getNamespaceFromMessageFile(
  relativePath: string,
): string | null {
  const fileName = path.basename(relativePath);

  if (!fileName.toLowerCase().endsWith(".json")) {
    return null;
  }

  const namespace = fileName.replace(/\.json$/i, "").trim();

  return namespace || null;
}

/**
 * Determines whether a discovered file belongs to the translation
 * message directories.
 */
function isTranslationMessageFile(
  file: DiscoveredProjectFile,
): boolean {
  return (
    file.extension === ".json" &&
    getLanguageFromMessageFile(file.relativePath) !== null &&
    getNamespaceFromMessageFile(file.relativePath) !== null
  );
}

/**
 * Reads and parses one translation JSON file.
 */
async function inspectNamespaceFile(
  projectRoot: string,
  file: DiscoveredProjectFile,
): Promise<DiscoveredNamespaceFile | null> {
  const language = getLanguageFromMessageFile(
    file.relativePath,
  );

  const namespace = getNamespaceFromMessageFile(
    file.relativePath,
  );

  if (!language || !namespace) {
    return null;
  }

  const scannedAt = nowIso();

  try {
    const rawContent = await fs.readFile(
      file.absolutePath,
      "utf8",
    );

    const parsed = safeParseJson<TranslationJsonValue>(
      rawContent,
    );

    if (!parsed.success) {
      return {
        id: createStableId(
          "namespace-file",
          language,
          namespace,
          file.relativePath,
        ),
        namespace,
        language,
        absolutePath: file.absolutePath,
        relativePath: file.relativePath,
        fileName: file.fileName,
        exists: true,
        validJson: false,
        content: null,
        flattenedContent: {},
        totalKeys: 0,
        error: parsed.error,
        scannedAt,
      };
    }

    const flattenedContent = flattenTranslationObject(
      parsed.data,
    );

    return {
      id: createStableId(
        "namespace-file",
        language,
        namespace,
        file.relativePath,
      ),
      namespace,
      language,
      absolutePath: file.absolutePath,
      relativePath: file.relativePath,
      fileName: file.fileName,
      exists: true,
      validJson: true,
      content: parsed.data,
      flattenedContent,
      totalKeys: Object.keys(flattenedContent).length,
      error: null,
      scannedAt,
    };
  } catch (error) {
    return {
      id: createStableId(
        "namespace-file",
        language,
        namespace,
        file.relativePath,
      ),
      namespace,
      language,
      absolutePath: file.absolutePath,
      relativePath: file.relativePath,
      fileName: file.fileName,
      exists: false,
      validJson: false,
      content: null,
      flattenedContent: {},
      totalKeys: 0,
      error:
        error instanceof Error
          ? error.message
          : "Unknown file-reading error.",
      scannedAt,
    };
  }
}

/**
 * Returns the expected path for a namespace file.
 */
function getExpectedNamespaceFilePath(
  projectRoot: string,
  language: TranslationLanguage,
  namespace: string,
): {
  absolutePath: string;
  relativePath: string;
} {
  const relativePath = normalizePath(
    path.join(
      IBOS_TRANSLATION_PATHS.messageRoot,
      language,
      namespaceToFileName(namespace),
    ),
  );

  return {
    absolutePath: normalizePath(
      path.resolve(projectRoot, relativePath),
    ),
    relativePath,
  };
}

/**
 * Creates a missing namespace file.
 */
async function createNamespaceFile(
  projectRoot: string,
  language: TranslationLanguage,
  namespace: string,
  content: TranslationJsonValue,
): Promise<string> {
  const expectedPath = getExpectedNamespaceFilePath(
    projectRoot,
    language,
    namespace,
  );

  await ensureDirectory(
    path.dirname(expectedPath.absolutePath),
  );

  await fs.writeFile(
    expectedPath.absolutePath,
    formatJson(content),
    "utf8",
  );

  return expectedPath.relativePath;
}

/**
 * Groups discovered files by namespace.
 */
function groupNamespaceFiles(
  files: DiscoveredNamespaceFile[],
): NamespaceFileGroup[] {
  const groups = new Map<string, NamespaceFileGroup>();

  for (const file of files) {
    const current =
      groups.get(file.namespace) ?? {
        namespace: file.namespace,
        files: {},
      };

    current.files[file.language] = file;
    groups.set(file.namespace, current);
  }

  return [...groups.values()].sort((first, second) =>
    first.namespace.localeCompare(second.namespace),
  );
}

/**
 * Returns all namespace names from translation files and routes.
 */
function getAllNamespaceNames(
  groups: NamespaceFileGroup[],
  registeredRouteNamespaces: string[],
): string[] {
  return [
    ...new Set([
      ...groups.map((group) => group.namespace),
      ...registeredRouteNamespaces.filter(Boolean),
    ]),
  ].sort();
}

/**
 * Builds a lookup map for namespace groups.
 */
function createNamespaceGroupMap(
  groups: NamespaceFileGroup[],
): Map<string, NamespaceFileGroup> {
  return new Map(
    groups.map((group) => [
      group.namespace,
      group,
    ]),
  );
}

/**
 * Creates a missing-file issue.
 */
function createMissingFileIssue(input: {
  namespace: string;
  language: TranslationLanguage;
  expectedFile: string;
  isMaster: boolean;
}): TranslationIssue {
  return {
    id: createStableId(
      "translation-issue",
      "missing-file",
      input.namespace,
      input.language,
      input.expectedFile,
    ),
    code: input.isMaster
      ? "IBOS-TR-MASTER-FILE-MISSING"
      : "IBOS-TR-LANGUAGE-FILE-MISSING",
    severity: input.isMaster ? "critical" : "error",
    type: "missing_file",
    file: input.expectedFile,
    namespace: input.namespace,
    language: input.language,
    message: input.isMaster
      ? `The English master file for namespace "${input.namespace}" is missing.`
      : `The ${input.language.toUpperCase()} translation file for namespace "${input.namespace}" is missing.`,
    recommendation: input.isMaster
      ? `Create "${input.expectedFile}" and define the complete English master hierarchy.`
      : `Create "${input.expectedFile}" using the exact English master hierarchy.`,
    resolved: false,
    detectedAt: nowIso(),
  };
}

/**
 * Creates an invalid-JSON issue.
 */
function createInvalidJsonIssue(
  file: DiscoveredNamespaceFile,
): TranslationIssue {
  return {
    id: createStableId(
      "translation-issue",
      "invalid-json",
      file.relativePath,
    ),
    code: "IBOS-TR-INVALID-JSON",
    severity: "critical",
    type: "invalid_json",
    file: file.relativePath,
    namespace: file.namespace,
    language: file.language,
    message: `Invalid JSON was detected in "${file.relativePath}".`,
    recommendation:
      file.error ??
      "Correct the JSON syntax before translation validation continues.",
    resolved: false,
    detectedAt: nowIso(),
  };
}

/**
 * Creates a missing-key issue.
 */
function createMissingKeyIssue(input: {
  namespace: string;
  language: TranslationLanguage;
  file: string;
  key: string;
}): TranslationIssue {
  return {
    id: createStableId(
      "translation-issue",
      "missing-key",
      input.namespace,
      input.language,
      input.key,
    ),
    code: "IBOS-TR-MISSING-KEY",
    severity: "error",
    type: "missing_key",
    file: input.file,
    namespace: input.namespace,
    language: input.language,
    key: input.key,
    message: `Translation key "${input.key}" is missing from ${input.language.toUpperCase()} namespace "${input.namespace}".`,
    recommendation:
      "Add the key using the exact English master hierarchy and preserve all placeholders.",
    resolved: false,
    detectedAt: nowIso(),
  };
}

/**
 * Creates an obsolete-key issue.
 */
function createObsoleteKeyIssue(input: {
  namespace: string;
  language: TranslationLanguage;
  file: string;
  key: string;
}): TranslationIssue {
  return {
    id: createStableId(
      "translation-issue",
      "obsolete-key",
      input.namespace,
      input.language,
      input.key,
    ),
    code: "IBOS-TR-OBSOLETE-KEY",
    severity: "warning",
    type: "obsolete_key",
    file: input.file,
    namespace: input.namespace,
    language: input.language,
    key: input.key,
    message: `Obsolete key "${input.key}" exists in ${input.language.toUpperCase()} namespace "${input.namespace}" but not in the English master.`,
    recommendation:
      "Review and remove the obsolete key after confirming it is no longer referenced.",
    resolved: false,
    detectedAt: nowIso(),
  };
}

/**
 * Creates a placeholder-mismatch issue.
 */
function createPlaceholderMismatchIssue(input: {
  namespace: string;
  language: TranslationLanguage;
  file: string;
  key: string;
  masterPlaceholders: string[];
  translatedPlaceholders: string[];
}): TranslationIssue {
  return {
    id: createStableId(
      "translation-issue",
      "placeholder-mismatch",
      input.namespace,
      input.language,
      input.key,
    ),
    code: "IBOS-TR-PLACEHOLDER-MISMATCH",
    severity: "critical",
    type: "placeholder_mismatch",
    file: input.file,
    namespace: input.namespace,
    language: input.language,
    key: input.key,
    message: [
      `Placeholder mismatch detected for key "${input.key}" in ${input.language.toUpperCase()} namespace "${input.namespace}".`,
      `Expected: ${input.masterPlaceholders.join(", ") || "none"}.`,
      `Found: ${input.translatedPlaceholders.join(", ") || "none"}.`,
    ].join(" "),
    recommendation:
      "Preserve every English placeholder exactly in the translated value.",
    resolved: false,
    detectedAt: nowIso(),
  };
}

/**
 * Determines whether placeholder lists match.
 */
function haveMatchingPlaceholders(
  masterPlaceholders: string[],
  translatedPlaceholders: string[],
): boolean {
  if (
    masterPlaceholders.length !==
    translatedPlaceholders.length
  ) {
    return false;
  }

  return masterPlaceholders.every(
    (placeholder, index) =>
      placeholder === translatedPlaceholders[index],
  );
}

/**
 * Builds language statistics for one namespace.
 */
function createLanguageStatus(input: {
  language: TranslationLanguage;
  masterFile: DiscoveredNamespaceFile | undefined;
  targetFile: DiscoveredNamespaceFile | undefined;
}): TranslationLanguageStatus {
  const {
    language,
    masterFile,
    targetFile,
  } = input;

  const totalMasterKeys =
    masterFile?.validJson && masterFile.content
      ? masterFile.totalKeys
      : 0;

  if (language === IBOS_MASTER_LANGUAGE) {
    const fileExists = Boolean(masterFile?.exists);
    const validJson = Boolean(masterFile?.validJson);

    return {
      language,
      status: determineTranslationStatus({
        fileExists,
        totalKeys: totalMasterKeys,
        translatedKeys:
          fileExists && validJson
            ? totalMasterKeys
            : 0,
        missingKeys: 0,
        invalidKeys:
          fileExists && !validJson ? 1 : 0,
      }),
      fileExists,
      totalKeys: totalMasterKeys,
      translatedKeys:
        fileExists && validJson
          ? totalMasterKeys
          : 0,
      missingKeys: 0,
      obsoleteKeys: 0,
      invalidKeys:
        fileExists && !validJson ? 1 : 0,
      coveragePercentage:
        fileExists && validJson ? 100 : 0,
    };
  }

  const fileExists = Boolean(targetFile?.exists);
  const validJson = Boolean(targetFile?.validJson);

  if (
    !masterFile?.content ||
    !masterFile.validJson ||
    !targetFile?.content ||
    !validJson
  ) {
    return {
      language,
      status: determineTranslationStatus({
        fileExists,
        totalKeys: totalMasterKeys,
        translatedKeys: 0,
        missingKeys: totalMasterKeys,
        invalidKeys:
          fileExists && !validJson ? 1 : 0,
      }),
      fileExists,
      totalKeys: totalMasterKeys,
      translatedKeys: 0,
      missingKeys: totalMasterKeys,
      obsoleteKeys: 0,
      invalidKeys:
        fileExists && !validJson ? 1 : 0,
      coveragePercentage: 0,
    };
  }

  const missingKeys = getMissingTranslationKeys(
    masterFile.content,
    targetFile.content,
  );

  const obsoleteKeys = getObsoleteTranslationKeys(
    masterFile.content,
    targetFile.content,
  );

  const masterFlattened =
    masterFile.flattenedContent;

  const targetFlattened =
    targetFile.flattenedContent;

  const untranslatedExistingKeys = Object.keys(
    masterFlattened,
  ).filter((key) => {
    if (!(key in targetFlattened)) {
      return false;
    }

    return isMissingTranslationValue(
      getValueByKeyPath(targetFile.content!, key),
    );
  });

  const translatedKeys = Math.max(
    totalMasterKeys -
      missingKeys.length -
      untranslatedExistingKeys.length,
    0,
  );

  const totalMissingValues =
    missingKeys.length +
    untranslatedExistingKeys.length;

  return {
    language,
    status: determineTranslationStatus({
      fileExists,
      totalKeys: totalMasterKeys,
      translatedKeys,
      missingKeys: totalMissingValues,
      invalidKeys: 0,
    }),
    fileExists,
    totalKeys: totalMasterKeys,
    translatedKeys,
    missingKeys: totalMissingValues,
    obsoleteKeys: obsoleteKeys.length,
    invalidKeys: 0,
    coveragePercentage: calculatePercentage(
      translatedKeys,
      totalMasterKeys,
    ),
  };
}

/**
 * Calculates namespace compliance.
 */
function calculateNamespaceComplianceScore(
  languages: Record<
    TranslationLanguage,
    TranslationLanguageStatus
  >,
  placeholderMismatchCount: number,
): number {
  const averageCoverage =
    IBOS_ENABLED_LANGUAGES.reduce(
      (sum, language) =>
        sum +
        languages[language].coveragePercentage,
      0,
    ) / IBOS_ENABLED_LANGUAGES.length;

  let score = averageCoverage;

  const missingFiles =
    IBOS_ENABLED_LANGUAGES.filter(
      (language) =>
        !languages[language].fileExists,
    ).length;

  const invalidFiles =
    IBOS_ENABLED_LANGUAGES.reduce(
      (sum, language) =>
        sum + languages[language].invalidKeys,
      0,
    );

  const obsoleteKeys =
    IBOS_ENABLED_LANGUAGES.reduce(
      (sum, language) =>
        sum + languages[language].obsoleteKeys,
      0,
    );

  score -= missingFiles * 10;
  score -= invalidFiles * 20;
  score -= placeholderMismatchCount * 5;
  score -= Math.min(obsoleteKeys, 10) * 0.5;

  return Math.max(
    0,
    Math.min(100, Math.round(score * 100) / 100),
  );
}

/**
 * Builds TranslationKey records from an English master file.
 */
function createTranslationKeyRecords(input: {
  namespace: string;
  group: NamespaceFileGroup | undefined;
  existingKeys: TranslationKey[];
}): TranslationKey[] {
  const {
    namespace,
    group,
    existingKeys,
  } = input;

  const masterFile =
    group?.files[IBOS_MASTER_LANGUAGE];

  if (
    !masterFile?.validJson ||
    !masterFile.content
  ) {
    return [];
  }

  const masterFlattened =
    masterFile.flattenedContent;

  return Object.entries(masterFlattened)
    .map(([key, masterValue]) => {
      const existing = existingKeys.find(
        (record) =>
          record.namespace === namespace &&
          record.key === key,
      );

      const translations: TranslationKey["translations"] =
        {};

      const statuses =
        {} as TranslationKey["status"];

      for (const language of IBOS_ENABLED_LANGUAGES) {
        const languageFile =
          group?.files[language];

        const translatedValue =
          languageFile?.flattenedContent[key];

        if (translatedValue !== undefined) {
          translations[language] = translatedValue;
        }

        if (language === IBOS_MASTER_LANGUAGE) {
          statuses[language] = "complete";
          continue;
        }

        if (
          !languageFile?.exists ||
          !languageFile.validJson
        ) {
          statuses[language] = "missing";
          continue;
        }

        if (
          translatedValue === undefined ||
          translatedValue.trim() === ""
        ) {
          statuses[language] = "missing";
          continue;
        }

        const masterPlaceholders =
          extractPlaceholders(masterValue);

        const translatedPlaceholders =
          extractPlaceholders(translatedValue);

        statuses[language] =
          haveMatchingPlaceholders(
            masterPlaceholders,
            translatedPlaceholders,
          )
            ? "complete"
            : "invalid";
      }

      return {
        id:
          existing?.id ??
          createStableId(
            "translation-key",
            namespace,
            key,
          ),
        namespace,
        key,
        fullPath: `${namespace}.${key}`,
        masterValue,
        placeholders: extractPlaceholders(
          masterValue,
        ),
        translations,
        status: statuses,
      };
    })
    .sort((first, second) =>
      first.key.localeCompare(second.key),
    );
}

/**
 * Generates validation issues for one namespace.
 */
function createNamespaceIssues(input: {
  projectRoot: string;
  namespace: string;
  group: NamespaceFileGroup | undefined;
}): TranslationIssue[] {
  const {
    projectRoot,
    namespace,
    group,
  } = input;

  const issues: TranslationIssue[] = [];

  const masterFile =
    group?.files[IBOS_MASTER_LANGUAGE];

  for (const language of IBOS_ENABLED_LANGUAGES) {
    const file = group?.files[language];

    const expectedPath = getExpectedNamespaceFilePath(
      projectRoot,
      language,
      namespace,
    );

    if (!file?.exists) {
      issues.push(
        createMissingFileIssue({
          namespace,
          language,
          expectedFile: expectedPath.relativePath,
          isMaster:
            language === IBOS_MASTER_LANGUAGE,
        }),
      );

      continue;
    }

    if (!file.validJson) {
      issues.push(createInvalidJsonIssue(file));
    }
  }

  if (
    !masterFile?.exists ||
    !masterFile.validJson ||
    !masterFile.content
  ) {
    return issues;
  }

  for (const language of IBOS_ENABLED_LANGUAGES) {
    if (language === IBOS_MASTER_LANGUAGE) {
      continue;
    }

    const targetFile = group?.files[language];

    if (
      !targetFile?.exists ||
      !targetFile.validJson ||
      !targetFile.content
    ) {
      continue;
    }

    const missingKeys = getMissingTranslationKeys(
      masterFile.content,
      targetFile.content,
    );

    for (const key of missingKeys) {
      issues.push(
        createMissingKeyIssue({
          namespace,
          language,
          file: targetFile.relativePath,
          key,
        }),
      );
    }

    const obsoleteKeys = getObsoleteTranslationKeys(
      masterFile.content,
      targetFile.content,
    );

    for (const key of obsoleteKeys) {
      issues.push(
        createObsoleteKeyIssue({
          namespace,
          language,
          file: targetFile.relativePath,
          key,
        }),
      );
    }

    for (const [
      key,
      masterValue,
    ] of Object.entries(
      masterFile.flattenedContent,
    )) {
      const translatedValue =
        targetFile.flattenedContent[key];

      if (
        translatedValue === undefined ||
        translatedValue.trim() === ""
      ) {
        continue;
      }

      const masterPlaceholders =
        extractPlaceholders(masterValue);

      const translatedPlaceholders =
        extractPlaceholders(translatedValue);

      if (
        !haveMatchingPlaceholders(
          masterPlaceholders,
          translatedPlaceholders,
        )
      ) {
        issues.push(
          createPlaceholderMismatchIssue({
            namespace,
            language,
            file: targetFile.relativePath,
            key,
            masterPlaceholders,
            translatedPlaceholders,
          }),
        );
      }
    }
  }

  return issues;
}

/**
 * Creates one TranslationNamespace record.
 */
function createNamespaceRecord(input: {
  namespace: string;
  group: NamespaceFileGroup | undefined;
  issues: TranslationIssue[];
  existingNamespace?: TranslationNamespace;
}): TranslationNamespace {
  const {
    namespace,
    group,
    issues,
    existingNamespace,
  } = input;

  const masterFile =
    group?.files[IBOS_MASTER_LANGUAGE];

  const languageFiles: Partial<
    Record<TranslationLanguage, string>
  > = {};

  for (const language of IBOS_ENABLED_LANGUAGES) {
    const file = group?.files[language];

    if (file?.exists) {
      languageFiles[language] =
        file.relativePath;
    }
  }

  const languages =
    {} as Record<
      TranslationLanguage,
      TranslationLanguageStatus
    >;

  for (const language of IBOS_ENABLED_LANGUAGES) {
    languages[language] =
      createLanguageStatus({
        language,
        masterFile,
        targetFile: group?.files[language],
      });
  }

  const placeholderMismatchCount =
    issues.filter(
      (issue) =>
        issue.type === "placeholder_mismatch",
    ).length;

  const complianceScore =
    calculateNamespaceComplianceScore(
      languages,
      placeholderMismatchCount,
    );

  return {
    id:
      existingNamespace?.id ??
      createStableId(
        "translation-namespace",
        namespace,
      ),
    namespace,
    masterLanguage: IBOS_MASTER_LANGUAGE,
    masterFile:
      masterFile?.exists
        ? masterFile.relativePath
        : null,
    languageFiles,
    totalMasterKeys:
      masterFile?.validJson
        ? masterFile.totalKeys
        : 0,
    languages,
    complianceStatus:
      determineComplianceStatus(complianceScore),
    complianceScore,
    discoveredAt:
      existingNamespace?.discoveredAt ??
      nowIso(),
    lastValidatedAt: nowIso(),
  };
}

/**
 * Inspects all translation files found by the project scanner.
 */
async function inspectProjectMessageFiles(
  projectScan: ProjectFileScanResult,
): Promise<{
  files: DiscoveredNamespaceFile[];
  errors: string[];
}> {
  const files: DiscoveredNamespaceFile[] = [];
  const errors: string[] = [];

  for (const file of projectScan.messageFiles) {
    if (!isTranslationMessageFile(file)) {
      continue;
    }

    try {
      const inspected =
        await inspectNamespaceFile(
          projectScan.projectRoot,
          file,
        );

      if (inspected) {
        files.push(inspected);
      }
    } catch (error) {
      errors.push(
        `Unable to inspect translation file "${file.relativePath}": ${
          error instanceof Error
            ? error.message
            : "Unknown namespace scanning error."
        }`,
      );
    }
  }

  return {
    files: files.sort((first, second) => {
      const namespaceComparison =
        first.namespace.localeCompare(
          second.namespace,
        );

      if (namespaceComparison !== 0) {
        return namespaceComparison;
      }

      return first.language.localeCompare(
        second.language,
      );
    }),
    errors,
  };
}

/**
 * Creates files requested by scanner options.
 */
async function createRequestedMissingFiles(input: {
  projectRoot: string;
  namespaceNames: string[];
  groupMap: Map<string, NamespaceFileGroup>;
  createMissingMasterFiles: boolean;
  createMissingTargetFiles: boolean;
}): Promise<{
  createdFiles: string[];
  errors: string[];
}> {
  const createdFiles: string[] = [];
  const errors: string[] = [];

  for (const namespace of input.namespaceNames) {
    const group = input.groupMap.get(namespace);
    const masterFile =
      group?.files[IBOS_MASTER_LANGUAGE];

    if (
      input.createMissingMasterFiles &&
      !masterFile?.exists
    ) {
      try {
        const createdFile =
          await createNamespaceFile(
            input.projectRoot,
            IBOS_MASTER_LANGUAGE,
            namespace,
            {},
          );

        createdFiles.push(createdFile);
      } catch (error) {
        errors.push(
          `Unable to create English master namespace "${namespace}": ${
            error instanceof Error
              ? error.message
              : "Unknown file-creation error."
          }`,
        );
      }
    }

    if (
      !input.createMissingTargetFiles ||
      !masterFile?.content ||
      !masterFile.validJson
    ) {
      continue;
    }

    for (const language of IBOS_ENABLED_LANGUAGES) {
      if (language === IBOS_MASTER_LANGUAGE) {
        continue;
      }

      const targetFile = group?.files[language];

      if (targetFile?.exists) {
        continue;
      }

      try {
        const createdFile =
          await createNamespaceFile(
            input.projectRoot,
            language,
            namespace,
            masterFile.content,
          );

        createdFiles.push(createdFile);
      } catch (error) {
        errors.push(
          `Unable to create ${language.toUpperCase()} namespace "${namespace}": ${
            error instanceof Error
              ? error.message
              : "Unknown file-creation error."
          }`,
        );
      }
    }
  }

  return {
    createdFiles,
    errors,
  };
}

/**
 * Scans every translation namespace from a project file scan.
 */
export async function scanNamespaces(
  projectScan: ProjectFileScanResult,
  scannerOptions: NamespaceScannerOptions = {},
): Promise<NamespaceScanResult> {
  const startedAt = nowIso();
  const startTime = Date.now();

  const projectRoot = path.resolve(
    scannerOptions.projectRoot ??
      projectScan.projectRoot,
  );

  const options = {
    ...DEFAULT_NAMESPACE_SCANNER_OPTIONS,
    ...scannerOptions,
    projectRoot,
  };

  const errors: string[] = [];
  const issues: TranslationIssue[] = [];

  const inspected =
    await inspectProjectMessageFiles(
      projectScan,
    );

  errors.push(...inspected.errors);

  const groups = groupNamespaceFiles(
    inspected.files,
  );

  const groupMap = createNamespaceGroupMap(
    groups,
  );

  const registeredRouteNamespaces =
    scannerOptions.registeredRouteNamespaces ?? [];

  const namespaceNames = getAllNamespaceNames(
    groups,
    registeredRouteNamespaces,
  );

  const created =
    await createRequestedMissingFiles({
      projectRoot,
      namespaceNames,
      groupMap,
      createMissingMasterFiles:
        options.createMissingMasterFiles,
      createMissingTargetFiles:
        options.createMissingTargetFiles,
    });

  errors.push(...created.errors);

  const namespaces: TranslationNamespace[] = [];
  const keys: TranslationKey[] = [];

  for (const namespace of namespaceNames) {
    const group = groupMap.get(namespace);

    const namespaceIssues =
      createNamespaceIssues({
        projectRoot,
        namespace,
        group,
      });

    issues.push(...namespaceIssues);

    const existingNamespace =
      scannerOptions.existingNamespaces?.find(
        (record) =>
          record.namespace === namespace,
      );

    namespaces.push(
      createNamespaceRecord({
        namespace,
        group,
        issues: namespaceIssues,
        existingNamespace,
      }),
    );

    keys.push(
      ...createTranslationKeyRecords({
        namespace,
        group,
        existingKeys:
          scannerOptions.existingKeys ?? [],
      }),
    );
  }

  const masterNamespaces =
    namespaceNames.filter((namespace) =>
      Boolean(
        groupMap.get(namespace)?.files[
          IBOS_MASTER_LANGUAGE
        ]?.exists,
      ),
    );

  const routeOnlyNamespaces =
    registeredRouteNamespaces
      .filter(
        (namespace) =>
          !groups.some(
            (group) =>
              group.namespace === namespace,
          ),
      )
      .sort();

  const missingMasterNamespaces =
    namespaceNames.filter(
      (namespace) =>
        !groupMap.get(namespace)?.files[
          IBOS_MASTER_LANGUAGE
        ]?.exists,
    );

  const missingLanguageFiles: NamespaceScanResult["missingLanguageFiles"] =
    [];

  for (const namespace of namespaceNames) {
    for (const language of IBOS_ENABLED_LANGUAGES) {
      const file =
        groupMap.get(namespace)?.files[language];

      if (file?.exists) {
        continue;
      }

      const expectedPath =
        getExpectedNamespaceFilePath(
          projectRoot,
          language,
          namespace,
        );

      missingLanguageFiles.push({
        namespace,
        language,
        expectedFile:
          expectedPath.relativePath,
      });
    }
  }

  const invalidJsonFiles =
    inspected.files.filter(
      (file) => !file.validJson,
    );

  const compliantNamespaces =
    namespaces.filter(
      (namespace) =>
        namespace.complianceStatus ===
        "compliant",
    );

  const nonCompliantNamespaces =
    namespaces.filter(
      (namespace) =>
        namespace.complianceStatus !==
        "compliant",
    );

  const completedAt = nowIso();

  return {
    success:
      errors.length === 0 &&
      invalidJsonFiles.length === 0,
    scanId: createStableId(
      "namespace-scan",
      startedAt,
      namespaceNames.length,
    ),
    startedAt,
    completedAt,
    durationMs: Date.now() - startTime,
    files: inspected.files,
    namespaces: namespaces.sort(
      (first, second) =>
        first.namespace.localeCompare(
          second.namespace,
        ),
    ),
    keys: keys.sort((first, second) =>
      first.fullPath.localeCompare(
        second.fullPath,
      ),
    ),
    issues,
    discoveredNamespaceNames:
      namespaceNames,
    masterNamespaces,
    routeOnlyNamespaces,
    missingMasterNamespaces,
    missingLanguageFiles,
    invalidJsonFiles,
    compliantNamespaces,
    nonCompliantNamespaces,
    createdFiles: created.createdFiles,
    errors,
  };
}

/**
 * Scans namespaces directly from a collection of discovered
 * project files.
 */
export async function scanNamespacesFromFiles(
  files: DiscoveredProjectFile[],
  projectRoot = process.cwd(),
  options: NamespaceScannerOptions = {},
): Promise<NamespaceScanResult> {
  const normalizedProjectRoot =
    normalizePath(path.resolve(projectRoot));

  const projectScan: ProjectFileScanResult = {
    success: true,
    scanId: createStableId(
      "temporary-project-scan",
      normalizedProjectRoot,
      files.length,
    ),
    projectRoot: normalizedProjectRoot,
    startedAt: nowIso(),
    completedAt: nowIso(),
    durationMs: 0,
    files,
    routeFiles: files.filter(
      (file) =>
        file.resourceType === "page",
    ),
    componentFiles: files.filter(
      (file) =>
        file.resourceType === "component" ||
        file.resourceType === "form" ||
        file.resourceType === "dialog" ||
        file.resourceType === "layout" ||
        file.resourceType === "template",
    ),
    messageFiles: files.filter(
      isTranslationMessageFile,
    ),
    enterpriseFiles: files.filter(
      (file) =>
        file.resourceType ===
        "enterprise_engine",
    ),
    errors: [],
  };

  return scanNamespaces(
    projectScan,
    {
      ...options,
      projectRoot:
        options.projectRoot ??
        normalizedProjectRoot,
    },
  );
}

/**
 * Returns all discovered namespace names.
 */
export function getNamespaceNames(
  namespaces: TranslationNamespace[],
): string[] {
  return namespaces
    .map((namespace) => namespace.namespace)
    .sort();
}

/**
 * Returns one namespace by name.
 */
export function findNamespace(
  namespaces: TranslationNamespace[],
  namespaceName: string,
): TranslationNamespace | undefined {
  return namespaces.find(
    (namespace) =>
      namespace.namespace === namespaceName,
  );
}

/**
 * Returns all keys for one namespace.
 */
export function getKeysForNamespace(
  keys: TranslationKey[],
  namespaceName: string,
): TranslationKey[] {
  return keys.filter(
    (key) =>
      key.namespace === namespaceName,
  );
}

/**
 * Returns every namespace that is missing at least one
 * required language file.
 */
export function getNamespacesWithMissingFiles(
  namespaces: TranslationNamespace[],
): TranslationNamespace[] {
  return namespaces.filter((namespace) =>
    IBOS_ENABLED_LANGUAGES.some(
      (language) =>
        !namespace.languages[language]
          .fileExists,
    ),
  );
}

/**
 * Returns the average coverage for one language across all
 * namespaces.
 */
export function calculateLanguageCoverage(
  namespaces: TranslationNamespace[],
  language: TranslationLanguage,
): number {
  if (namespaces.length === 0) {
    return 100;
  }

  const totalCoverage = namespaces.reduce(
    (sum, namespace) =>
      sum +
      namespace.languages[language]
        .coveragePercentage,
    0,
  );

  return Math.round(
    (totalCoverage / namespaces.length) * 100,
  ) / 100;
}