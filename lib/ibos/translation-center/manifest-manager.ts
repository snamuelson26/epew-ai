/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Manifest, Registry, Queue, Report, and Certification Manager
 * Version: 1.0.0
 * ============================================================
 */

import fs from "node:fs/promises";
import path from "node:path";

import {
  IBOS_TRANSLATION_OUTPUT_FILES,
  IBOS_TRANSLATION_PATHS,
} from "./config";

import type {
  TranslationCertification,
  TranslationComplianceReport,
  TranslationManifest,
  TranslationNamespace,
  TranslationPage,
  TranslationQueueItem,
  TranslationRoute,
} from "./types";

import type {
  TranslationComplianceEngineResult,
} from "./compliance-engine";

import {
  createStableId,
  formatJson,
  normalizePath,
  nowIso,
  safeParseJson,
} from "./utils";

/**
 * Identifies each persistent Translation Center artifact.
 */
export type TranslationArtifactType =
  | "manifest"
  | "page_registry"
  | "namespace_registry"
  | "translation_queue"
  | "compliance_report"
  | "certification";

/**
 * Describes one file written by the Manifest Manager.
 */
export interface TranslationArtifactWriteRecord {
  id: string;
  type: TranslationArtifactType;
  relativePath: string;
  absolutePath: string;
  created: boolean;
  updated: boolean;
  sizeBytes: number;
  writtenAt: string;
}

/**
 * Result returned after Translation Center artifacts are saved.
 */
export interface TranslationArtifactWriteResult {
  success: boolean;
  operationId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;

  artifacts: TranslationArtifactWriteRecord[];
  createdFiles: string[];
  updatedFiles: string[];
  unchangedFiles: string[];

  errors: string[];
}

/**
 * Result returned when stored Translation Center data is loaded.
 */
export interface TranslationArtifactLoadResult {
  success: boolean;

  manifest: TranslationManifest | null;
  routes: TranslationRoute[];
  pages: TranslationPage[];
  namespaces: TranslationNamespace[];
  queue: TranslationQueueItem[];
  complianceReport: TranslationComplianceReport | null;
  certification: TranslationCertification | null;

  loadedFiles: string[];
  missingFiles: string[];
  invalidFiles: string[];
  errors: string[];
}

/**
 * Manifest Manager configuration.
 */
export interface TranslationManifestManagerOptions {
  projectRoot?: string;

  manifestDirectory?: string;
  registryDirectory?: string;
  reportDirectory?: string;

  createDirectories?: boolean;
  skipUnchangedFiles?: boolean;
  createBackups?: boolean;

  backupDirectory?: string;
  jsonIndentation?: number;
}

/**
 * One resolved artifact location.
 */
interface TranslationArtifactPath {
  type: TranslationArtifactType;
  fileName: string;
  absolutePath: string;
  relativePath: string;
}

/**
 * Default Manifest Manager behavior.
 */
const DEFAULT_OPTIONS: Required<
  Pick<
    TranslationManifestManagerOptions,
    | "createDirectories"
    | "skipUnchangedFiles"
    | "createBackups"
    | "jsonIndentation"
  >
> = {
  createDirectories: true,
  skipUnchangedFiles: true,
  createBackups: false,
  jsonIndentation: 2,
};

/**
 * Returns whether a path exists.
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
 * Creates a directory recursively.
 */
async function ensureDirectory(directoryPath: string): Promise<void> {
  await fs.mkdir(directoryPath, {
    recursive: true,
  });
}

/**
 * Returns a project-relative path.
 */
function toRelativePath(
  projectRoot: string,
  absolutePath: string,
): string {
  return normalizePath(
    path.relative(projectRoot, absolutePath),
  );
}

/**
 * Resolves all storage directories.
 */
function resolveStorageDirectories(
  projectRoot: string,
  options: TranslationManifestManagerOptions,
): {
  manifestDirectory: string;
  registryDirectory: string;
  reportDirectory: string;
  backupDirectory: string;
} {
  const manifestDirectory = path.resolve(
    projectRoot,
    options.manifestDirectory ??
      IBOS_TRANSLATION_PATHS.generatedRoot,
  );

  const registryDirectory = path.resolve(
    projectRoot,
    options.registryDirectory ??
      IBOS_TRANSLATION_PATHS.registryRoot,
  );

  const reportDirectory = path.resolve(
    projectRoot,
    options.reportDirectory ??
      IBOS_TRANSLATION_PATHS.reportRoot,
  );

  const backupDirectory = path.resolve(
    projectRoot,
    options.backupDirectory ??
      path.join(
        IBOS_TRANSLATION_PATHS.manifestRoot,
        "backups",
      ),
  );

  return {
    manifestDirectory,
    registryDirectory,
    reportDirectory,
    backupDirectory,
  };
}

/**
 * Creates all artifact file locations.
 */
function createArtifactPaths(
  projectRoot: string,
  options: TranslationManifestManagerOptions,
): Record<
  TranslationArtifactType,
  TranslationArtifactPath
> {
  const directories = resolveStorageDirectories(
    projectRoot,
    options,
  );

  const createPath = (
    type: TranslationArtifactType,
    directory: string,
    fileName: string,
  ): TranslationArtifactPath => {
    const absolutePath = path.join(directory, fileName);

    return {
      type,
      fileName,
      absolutePath: normalizePath(absolutePath),
      relativePath: toRelativePath(
        projectRoot,
        absolutePath,
      ),
    };
  };

  return {
    manifest: createPath(
      "manifest",
      directories.manifestDirectory,
      IBOS_TRANSLATION_OUTPUT_FILES.manifest,
    ),

    page_registry: createPath(
      "page_registry",
      directories.registryDirectory,
      IBOS_TRANSLATION_OUTPUT_FILES.pageRegistry,
    ),

    namespace_registry: createPath(
      "namespace_registry",
      directories.registryDirectory,
      IBOS_TRANSLATION_OUTPUT_FILES.namespaceRegistry,
    ),

    translation_queue: createPath(
      "translation_queue",
      directories.registryDirectory,
      IBOS_TRANSLATION_OUTPUT_FILES.translationQueue,
    ),

    compliance_report: createPath(
      "compliance_report",
      directories.reportDirectory,
      IBOS_TRANSLATION_OUTPUT_FILES.complianceReport,
    ),

    certification: createPath(
      "certification",
      directories.reportDirectory,
      IBOS_TRANSLATION_OUTPUT_FILES.certification,
    ),
  };
}

/**
 * Ensures every artifact parent directory exists.
 */
async function ensureArtifactDirectories(
  artifactPaths: Record<
    TranslationArtifactType,
    TranslationArtifactPath
  >,
): Promise<void> {
  const directories = new Set(
    Object.values(artifactPaths).map(
      (artifact) => path.dirname(artifact.absolutePath),
    ),
  );

  for (const directory of directories) {
    await ensureDirectory(directory);
  }
}

/**
 * Generates a safe timestamp for filenames.
 */
function createFileTimestamp(): string {
  return nowIso()
    .replaceAll(":", "-")
    .replaceAll(".", "-");
}

/**
 * Creates a backup before replacing an existing artifact.
 */
async function createBackup(input: {
  sourceFile: string;
  projectRoot: string;
  backupDirectory: string;
  artifactType: TranslationArtifactType;
}): Promise<string | null> {
  if (!(await pathExists(input.sourceFile))) {
    return null;
  }

  await ensureDirectory(input.backupDirectory);

  const sourceName = path.basename(input.sourceFile);
  const extension = path.extname(sourceName);
  const baseName = path.basename(sourceName, extension);

  const backupName = [
    baseName,
    input.artifactType,
    createFileTimestamp(),
  ].join("-");

  const backupPath = path.join(
    input.backupDirectory,
    `${backupName}${extension}`,
  );

  await fs.copyFile(
    input.sourceFile,
    backupPath,
  );

  return toRelativePath(
    input.projectRoot,
    backupPath,
  );
}

/**
 * Returns the current file content when available.
 */
async function readExistingContent(
  filePath: string,
): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Writes one JSON artifact.
 */
async function writeJsonArtifact(input: {
  projectRoot: string;
  artifact: TranslationArtifactPath;
  value: unknown;
  indentation: number;
  skipUnchangedFiles: boolean;
  createBackups: boolean;
  backupDirectory: string;
}): Promise<{
  record: TranslationArtifactWriteRecord | null;
  unchanged: boolean;
  backupFile: string | null;
}> {
  const formatted = formatJson(
    input.value,
    input.indentation,
  );

  const existingContent = await readExistingContent(
    input.artifact.absolutePath,
  );

  const existed = existingContent !== null;

  if (
    input.skipUnchangedFiles &&
    existingContent === formatted
  ) {
    return {
      record: null,
      unchanged: true,
      backupFile: null,
    };
  }

  let backupFile: string | null = null;

  if (input.createBackups && existed) {
    backupFile = await createBackup({
      sourceFile: input.artifact.absolutePath,
      projectRoot: input.projectRoot,
      backupDirectory: input.backupDirectory,
      artifactType: input.artifact.type,
    });
  }

  await ensureDirectory(
    path.dirname(input.artifact.absolutePath),
  );

  await fs.writeFile(
    input.artifact.absolutePath,
    formatted,
    "utf8",
  );

  const statistics = await fs.stat(
    input.artifact.absolutePath,
  );

  return {
    record: {
      id: createStableId(
        "translation-artifact-write",
        input.artifact.type,
        input.artifact.relativePath,
        nowIso(),
      ),
      type: input.artifact.type,
      relativePath: input.artifact.relativePath,
      absolutePath: input.artifact.absolutePath,
      created: !existed,
      updated: existed,
      sizeBytes: statistics.size,
      writtenAt: nowIso(),
    },
    unchanged: false,
    backupFile,
  };
}

/**
 * Builds the page registry file content.
 */
function createPageRegistryPayload(input: {
  routes: TranslationRoute[];
  pages: TranslationPage[];
  manifestVersion: string;
}): {
  platform: "EPEW-EDE-IBOS";
  registry: "PAGE_REGISTRY";
  version: string;
  generatedAt: string;
  totalRoutes: number;
  totalPages: number;
  routes: TranslationRoute[];
  pages: TranslationPage[];
} {
  return {
    platform: "EPEW-EDE-IBOS",
    registry: "PAGE_REGISTRY",
    version: input.manifestVersion,
    generatedAt: nowIso(),
    totalRoutes: input.routes.length,
    totalPages: input.pages.length,
    routes: input.routes,
    pages: input.pages,
  };
}

/**
 * Builds the namespace registry file content.
 */
function createNamespaceRegistryPayload(input: {
  namespaces: TranslationNamespace[];
  manifestVersion: string;
}): {
  platform: "EPEW-EDE-IBOS";
  registry: "NAMESPACE_REGISTRY";
  version: string;
  generatedAt: string;
  totalNamespaces: number;
  namespaces: TranslationNamespace[];
} {
  return {
    platform: "EPEW-EDE-IBOS",
    registry: "NAMESPACE_REGISTRY",
    version: input.manifestVersion,
    generatedAt: nowIso(),
    totalNamespaces: input.namespaces.length,
    namespaces: input.namespaces,
  };
}

/**
 * Builds the translation queue file content.
 */
function createQueuePayload(input: {
  queue: TranslationQueueItem[];
  manifestVersion: string;
}): {
  platform: "EPEW-EDE-IBOS";
  registry: "TRANSLATION_QUEUE";
  version: string;
  generatedAt: string;
  totalItems: number;
  pendingItems: number;
  completedItems: number;
  queue: TranslationQueueItem[];
} {
  return {
    platform: "EPEW-EDE-IBOS",
    registry: "TRANSLATION_QUEUE",
    version: input.manifestVersion,
    generatedAt: nowIso(),
    totalItems: input.queue.length,
    pendingItems: input.queue.filter(
      (item) => item.status !== "completed",
    ).length,
    completedItems: input.queue.filter(
      (item) => item.status === "completed",
    ).length,
    queue: input.queue,
  };
}

/**
 * Saves all Translation Center artifacts.
 */
export async function saveTranslationArtifacts(
  complianceResult: TranslationComplianceEngineResult,
  managerOptions: TranslationManifestManagerOptions = {},
): Promise<TranslationArtifactWriteResult> {
  const startedAt = nowIso();
  const startTime = Date.now();

  const options = {
    ...DEFAULT_OPTIONS,
    ...managerOptions,
  };

  const projectRoot = path.resolve(
    managerOptions.projectRoot ?? process.cwd(),
  );

  const artifactPaths = createArtifactPaths(
    projectRoot,
    managerOptions,
  );

  const directories = resolveStorageDirectories(
    projectRoot,
    managerOptions,
  );

  const artifacts: TranslationArtifactWriteRecord[] = [];
  const createdFiles: string[] = [];
  const updatedFiles: string[] = [];
  const unchangedFiles: string[] = [];
  const errors: string[] = [];

  if (options.createDirectories) {
    try {
      await ensureArtifactDirectories(artifactPaths);
    } catch (error) {
      errors.push(
        `Unable to create Translation Center directories: ${
          error instanceof Error
            ? error.message
            : "Unknown directory error."
        }`,
      );
    }
  }

  const artifactValues: Array<{
    artifact: TranslationArtifactPath;
    value: unknown;
  }> = [
    {
      artifact: artifactPaths.manifest,
      value: complianceResult.manifest,
    },
    {
      artifact: artifactPaths.page_registry,
      value: createPageRegistryPayload({
        routes: complianceResult.manifest.routes,
        pages: complianceResult.pages,
        manifestVersion:
          complianceResult.manifest.version,
      }),
    },
    {
      artifact: artifactPaths.namespace_registry,
      value: createNamespaceRegistryPayload({
        namespaces: complianceResult.namespaces,
        manifestVersion:
          complianceResult.manifest.version,
      }),
    },
    {
      artifact: artifactPaths.translation_queue,
      value: createQueuePayload({
        queue: complianceResult.queue,
        manifestVersion:
          complianceResult.manifest.version,
      }),
    },
    {
      artifact: artifactPaths.compliance_report,
      value: complianceResult.report,
    },
    {
      artifact: artifactPaths.certification,
      value: complianceResult.certification,
    },
  ];

  for (const artifactValue of artifactValues) {
    try {
      const writeResult = await writeJsonArtifact({
        projectRoot,
        artifact: artifactValue.artifact,
        value: artifactValue.value,
        indentation: options.jsonIndentation,
        skipUnchangedFiles:
          options.skipUnchangedFiles,
        createBackups: options.createBackups,
        backupDirectory:
          directories.backupDirectory,
      });

      if (writeResult.unchanged) {
        unchangedFiles.push(
          artifactValue.artifact.relativePath,
        );

        continue;
      }

      if (!writeResult.record) {
        continue;
      }

      artifacts.push(writeResult.record);

      if (writeResult.record.created) {
        createdFiles.push(
          writeResult.record.relativePath,
        );
      }

      if (writeResult.record.updated) {
        updatedFiles.push(
          writeResult.record.relativePath,
        );
      }
    } catch (error) {
      errors.push(
        `Unable to write "${artifactValue.artifact.relativePath}": ${
          error instanceof Error
            ? error.message
            : "Unknown artifact-writing error."
        }`,
      );
    }
  }

  const completedAt = nowIso();

  return {
    success: errors.length === 0,
    operationId: createStableId(
      "translation-artifact-operation",
      startedAt,
      complianceResult.manifest.version,
    ),
    startedAt,
    completedAt,
    durationMs: Date.now() - startTime,
    artifacts,
    createdFiles,
    updatedFiles,
    unchangedFiles,
    errors,
  };
}

/**
 * Safely reads and parses one JSON file.
 */
async function readJsonFile<T>(
  filePath: string,
): Promise<
  | {
      success: true;
      data: T;
      missing: false;
      error: null;
    }
  | {
      success: false;
      data: null;
      missing: boolean;
      error: string;
    }
> {
  if (!(await pathExists(filePath))) {
    return {
      success: false,
      data: null,
      missing: true,
      error: `File does not exist: ${normalizePath(filePath)}`,
    };
  }

  try {
    const content = await fs.readFile(filePath, "utf8");
    const parsed = safeParseJson<T>(content);

    if (!parsed.success) {
      return {
        success: false,
        data: null,
        missing: false,
        error: parsed.error,
      };
    }

    return {
      success: true,
      data: parsed.data,
      missing: false,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      missing: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown file-reading error.",
    };
  }
}

/**
 * Loads all previously saved Translation Center artifacts.
 */
export async function loadTranslationArtifacts(
  managerOptions: TranslationManifestManagerOptions = {},
): Promise<TranslationArtifactLoadResult> {
  const projectRoot = path.resolve(
    managerOptions.projectRoot ?? process.cwd(),
  );

  const artifactPaths = createArtifactPaths(
    projectRoot,
    managerOptions,
  );

  const loadedFiles: string[] = [];
  const missingFiles: string[] = [];
  const invalidFiles: string[] = [];
  const errors: string[] = [];

  const manifestResult =
    await readJsonFile<TranslationManifest>(
      artifactPaths.manifest.absolutePath,
    );

  const pageRegistryResult =
    await readJsonFile<{
      routes?: TranslationRoute[];
      pages?: TranslationPage[];
    }>(
      artifactPaths.page_registry.absolutePath,
    );

  const namespaceRegistryResult =
    await readJsonFile<{
      namespaces?: TranslationNamespace[];
    }>(
      artifactPaths.namespace_registry.absolutePath,
    );

  const queueResult =
    await readJsonFile<{
      queue?: TranslationQueueItem[];
    }>(
      artifactPaths.translation_queue.absolutePath,
    );

  const reportResult =
    await readJsonFile<TranslationComplianceReport>(
      artifactPaths.compliance_report.absolutePath,
    );

  const certificationResult =
    await readJsonFile<TranslationCertification>(
      artifactPaths.certification.absolutePath,
    );

  const processResult = (
    artifact: TranslationArtifactPath,
    result: {
      success: boolean;
      missing: boolean;
      error: string | null;
    },
  ): void => {
    if (result.success) {
      loadedFiles.push(artifact.relativePath);
      return;
    }

    if (result.missing) {
      missingFiles.push(artifact.relativePath);
      return;
    }

    invalidFiles.push(artifact.relativePath);

    if (result.error) {
      errors.push(
        `${artifact.relativePath}: ${result.error}`,
      );
    }
  };

  processResult(
    artifactPaths.manifest,
    manifestResult,
  );

  processResult(
    artifactPaths.page_registry,
    pageRegistryResult,
  );

  processResult(
    artifactPaths.namespace_registry,
    namespaceRegistryResult,
  );

  processResult(
    artifactPaths.translation_queue,
    queueResult,
  );

  processResult(
    artifactPaths.compliance_report,
    reportResult,
  );

  processResult(
    artifactPaths.certification,
    certificationResult,
  );

  return {
    success:
      errors.length === 0 &&
      invalidFiles.length === 0,

    manifest: manifestResult.success
      ? manifestResult.data
      : null,

    routes: pageRegistryResult.success
      ? pageRegistryResult.data.routes ?? []
      : manifestResult.success
        ? manifestResult.data.routes
        : [],

    pages: pageRegistryResult.success
      ? pageRegistryResult.data.pages ?? []
      : manifestResult.success
        ? manifestResult.data.pages
        : [],

    namespaces: namespaceRegistryResult.success
      ? namespaceRegistryResult.data.namespaces ?? []
      : manifestResult.success
        ? manifestResult.data.namespaces
        : [],

    queue: queueResult.success
      ? queueResult.data.queue ?? []
      : manifestResult.success
        ? manifestResult.data.queue
        : [],

    complianceReport: reportResult.success
      ? reportResult.data
      : manifestResult.success
        ? manifestResult.data.compliance
        : null,

    certification: certificationResult.success
      ? certificationResult.data
      : null,

    loadedFiles,
    missingFiles,
    invalidFiles,
    errors,
  };
}

/**
 * Loads only the current translation manifest.
 */
export async function loadTranslationManifest(
  managerOptions: TranslationManifestManagerOptions = {},
): Promise<TranslationManifest | null> {
  const projectRoot = path.resolve(
    managerOptions.projectRoot ?? process.cwd(),
  );

  const artifactPaths = createArtifactPaths(
    projectRoot,
    managerOptions,
  );

  const result =
    await readJsonFile<TranslationManifest>(
      artifactPaths.manifest.absolutePath,
    );

  return result.success ? result.data : null;
}

/**
 * Loads only the current translation queue.
 */
export async function loadTranslationQueue(
  managerOptions: TranslationManifestManagerOptions = {},
): Promise<TranslationQueueItem[]> {
  const artifacts = await loadTranslationArtifacts(
    managerOptions,
  );

  return artifacts.queue;
}

/**
 * Loads only the current certification.
 */
export async function loadTranslationCertification(
  managerOptions: TranslationManifestManagerOptions = {},
): Promise<TranslationCertification | null> {
  const projectRoot = path.resolve(
    managerOptions.projectRoot ?? process.cwd(),
  );

  const artifactPaths = createArtifactPaths(
    projectRoot,
    managerOptions,
  );

  const result =
    await readJsonFile<TranslationCertification>(
      artifactPaths.certification.absolutePath,
    );

  return result.success ? result.data : null;
}

/**
 * Deletes all generated Translation Center artifacts.
 *
 * This does not delete source translation files under app/messages.
 */
export async function clearTranslationArtifacts(
  managerOptions: TranslationManifestManagerOptions = {},
): Promise<{
  success: boolean;
  deletedFiles: string[];
  errors: string[];
}> {
  const projectRoot = path.resolve(
    managerOptions.projectRoot ?? process.cwd(),
  );

  const artifactPaths = createArtifactPaths(
    projectRoot,
    managerOptions,
  );

  const deletedFiles: string[] = [];
  const errors: string[] = [];

  for (const artifact of Object.values(artifactPaths)) {
    if (!(await pathExists(artifact.absolutePath))) {
      continue;
    }

    try {
      await fs.unlink(artifact.absolutePath);
      deletedFiles.push(artifact.relativePath);
    } catch (error) {
      errors.push(
        `Unable to delete "${artifact.relativePath}": ${
          error instanceof Error
            ? error.message
            : "Unknown deletion error."
        }`,
      );
    }
  }

  return {
    success: errors.length === 0,
    deletedFiles,
    errors,
  };
}

/**
 * Returns every resolved artifact path.
 */
export function getTranslationArtifactPaths(
  managerOptions: TranslationManifestManagerOptions = {},
): Record<
  TranslationArtifactType,
  TranslationArtifactPath
> {
  const projectRoot = path.resolve(
    managerOptions.projectRoot ?? process.cwd(),
  );

  return createArtifactPaths(
    projectRoot,
    managerOptions,
  );
}