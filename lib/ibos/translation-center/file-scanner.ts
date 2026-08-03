/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * IBOS Enterprise Translation Service
 * Project File Scanner
 * Version: 1.0.0
 * ============================================================
 */

import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import {
  IBOS_MONITORED_FILE_NAMES,
  IBOS_ROUTE_FILE_NAMES,
  IBOS_TRANSLATION_PATHS,
} from "./config";

import type {
  TranslationResourceType,
  TranslationSourceResource,
} from "./types";

import {
  createStableId,
  getPortalFromRoute,
  isDynamicRoute,
  isPublicRoute,
  normalizePath,
  nowIso,
  pageFileToRoute,
  routeRequiresAuthentication,
  routeToNamespace,
  shouldScanFile,
  toProjectRelativePath,
} from "./utils";

/**
 * Represents a discovered source file before it is analyzed
 * for translation keys, imports, and hardcoded text.
 */
export interface DiscoveredProjectFile {
  id: string;
  absolutePath: string;
  relativePath: string;
  fileName: string;
  extension: string;
  resourceType: TranslationResourceType;
  route: string | null;
  namespace: string | null;
  isRouteFile: boolean;
  isDynamicRoute: boolean;
  isPublic: boolean;
  requiresAuthentication: boolean;
  portal: string | null;
  sizeBytes: number;
  createdAt: string | null;
  modifiedAt: string | null;
  discoveredAt: string;
}

/**
 * Result returned after the project filesystem is scanned.
 */
export interface ProjectFileScanResult {
  success: boolean;
  scanId: string;
  projectRoot: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  files: DiscoveredProjectFile[];
  routeFiles: DiscoveredProjectFile[];
  componentFiles: DiscoveredProjectFile[];
  messageFiles: DiscoveredProjectFile[];
  enterpriseFiles: DiscoveredProjectFile[];
  errors: string[];
}

/**
 * Scanner options.
 */
export interface ProjectFileScannerOptions {
  projectRoot?: string;
  includeAppDirectory?: boolean;
  includeComponents?: boolean;
  includeEnterpriseModules?: boolean;
  includeMessageFiles?: boolean;
}

/**
 * Default scanner options.
 */
const DEFAULT_SCANNER_OPTIONS: Required<ProjectFileScannerOptions> = {
  projectRoot: process.cwd(),
  includeAppDirectory: true,
  includeComponents: true,
  includeEnterpriseModules: true,
  includeMessageFiles: true,
};

/**
 * Determines whether a filesystem path exists.
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
 * Returns a file extension in lowercase.
 */
function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * Determines whether a file is a Next.js route page.
 */
function isRoutePageFile(fileName: string): boolean {
  return IBOS_ROUTE_FILE_NAMES.includes(
    fileName as (typeof IBOS_ROUTE_FILE_NAMES)[number],
  );
}

/**
 * Determines whether a file is monitored as a framework file.
 */
function isMonitoredFrameworkFile(fileName: string): boolean {
  return IBOS_MONITORED_FILE_NAMES.includes(
    fileName as (typeof IBOS_MONITORED_FILE_NAMES)[number],
  );
}

/**
 * Determines whether a file is located inside the message folder.
 */
function isMessageFile(relativePath: string): boolean {
  const normalized = normalizePath(relativePath);

  return (
    normalized.startsWith(`${IBOS_TRANSLATION_PATHS.messageRoot}/`) &&
    normalized.endsWith(".json")
  );
}

/**
 * Determines whether a file is located inside an enterprise module.
 */
function isEnterpriseFile(relativePath: string): boolean {
  const normalized = normalizePath(relativePath);

  return normalized.startsWith(
    `${IBOS_TRANSLATION_PATHS.enterpriseRoot}/`,
  );
}

/**
 * Determines whether a file is located inside a component folder.
 */
function isComponentFile(relativePath: string): boolean {
  const normalized = normalizePath(relativePath);

  return IBOS_TRANSLATION_PATHS.componentRoots.some((componentRoot) => {
    const normalizedRoot = normalizePath(componentRoot);

    return (
      normalized === normalizedRoot ||
      normalized.startsWith(`${normalizedRoot}/`)
    );
  });
}

/**
 * Determines the Translation Center resource type for a file.
 */
function determineResourceType(
  relativePath: string,
  fileName: string,
): TranslationResourceType {
  const normalized = normalizePath(relativePath);

  if (isRoutePageFile(fileName)) {
    return "page";
  }

  if (fileName.startsWith("layout.")) {
    return "layout";
  }

  if (fileName.startsWith("template.")) {
    return "template";
  }

  if (isMessageFile(normalized)) {
    return "document";
  }

  if (normalized.includes("/emails/")) {
    return "email";
  }

  if (normalized.includes("/sms/")) {
    return "sms";
  }

  if (normalized.includes("/whatsapp/")) {
    return "whatsapp";
  }

  if (
    normalized.includes("/notifications/") ||
    normalized.includes("/notification/")
  ) {
    return "notification";
  }

  if (
    normalized.includes("/forms/") ||
    /form\.(tsx|ts|jsx|js)$/i.test(fileName)
  ) {
    return "form";
  }

  if (
    normalized.includes("/dialogs/") ||
    normalized.includes("/modals/") ||
    /(dialog|modal)\.(tsx|ts|jsx|js)$/i.test(fileName)
  ) {
    return "dialog";
  }

  if (
    normalized.startsWith("app/api/") ||
    normalized.includes("/api/")
  ) {
    return "api_response";
  }

  if (isEnterpriseFile(normalized)) {
    return "enterprise_engine";
  }

  if (
    isComponentFile(normalized) ||
    /\.(tsx|jsx)$/i.test(fileName)
  ) {
    return "component";
  }

  return "unknown";
}

/**
 * Generates a namespace for a translation JSON file.
 *
 * Example:
 * app/messages/en/homepage.json
 * returns:
 * homepage
 */
function messageFileToNamespace(relativePath: string): string | null {
  if (!isMessageFile(relativePath)) {
    return null;
  }

  const fileName = path.basename(relativePath);
  const namespace = fileName.replace(/\.json$/i, "");

  return namespace || null;
}

/**
 * Returns route information for framework route files.
 */
function getRouteMetadata(
  projectRoot: string,
  absolutePath: string,
  relativePath: string,
  fileName: string,
): {
  route: string | null;
  namespace: string | null;
  isDynamic: boolean;
  isPublic: boolean;
  requiresAuthentication: boolean;
  portal: string | null;
} {
  const isPage = isRoutePageFile(fileName);

  if (!isPage) {
    const namespace = messageFileToNamespace(relativePath);

    return {
      route: null,
      namespace,
      isDynamic: false,
      isPublic: false,
      requiresAuthentication: false,
      portal: null,
    };
  }

  const appRootAbsolute = path.resolve(
    projectRoot,
    IBOS_TRANSLATION_PATHS.appRoot,
  );

  const route = pageFileToRoute(appRootAbsolute, absolutePath);
  const namespace = routeToNamespace(route);

  return {
    route,
    namespace,
    isDynamic: isDynamicRoute(route),
    isPublic: isPublicRoute(route),
    requiresAuthentication: routeRequiresAuthentication(route),
    portal: getPortalFromRoute(route),
  };
}

/**
 * Reads one directory recursively.
 */
async function walkDirectory(
  directoryPath: string,
  output: string[],
  errors: string[],
): Promise<void> {
 let entries: import("node:fs").Dirent<string>[] = [];

try {
  entries = await fs.readdir(directoryPath, {
    withFileTypes: true,
    encoding: "utf8",
  });
  } catch (error) {
    errors.push(
      `Unable to read directory "${normalizePath(directoryPath)}": ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );

    return;
  }

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (!shouldScanFile(path.join(absolutePath, "placeholder.ts"))) {
        continue;
      }

      await walkDirectory(absolutePath, output, errors);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!shouldScanFile(absolutePath)) {
      continue;
    }

    output.push(absolutePath);
  }
}

/**
 * Resolves scanner roots from configuration and options.
 */
function getScannerRoots(
  projectRoot: string,
  options: Required<ProjectFileScannerOptions>,
): string[] {
  const roots = new Set<string>();

  if (options.includeAppDirectory) {
    roots.add(
      path.resolve(projectRoot, IBOS_TRANSLATION_PATHS.appRoot),
    );
  }

  if (options.includeComponents) {
    for (const componentRoot of IBOS_TRANSLATION_PATHS.componentRoots) {
      roots.add(path.resolve(projectRoot, componentRoot));
    }
  }

  if (options.includeEnterpriseModules) {
    roots.add(
      path.resolve(projectRoot, IBOS_TRANSLATION_PATHS.enterpriseRoot),
    );
  }

  if (options.includeMessageFiles) {
    roots.add(
      path.resolve(projectRoot, IBOS_TRANSLATION_PATHS.messageRoot),
    );
  }

  return [...roots];
}

/**
 * Removes nested duplicate roots.
 *
 * Example:
 * app
 * app/components
 *
 * Only app needs to be scanned because it already includes
 * app/components.
 */
function removeNestedRoots(roots: string[]): string[] {
  const normalizedRoots = roots
    .map((root) => path.resolve(root))
    .sort((first, second) => first.length - second.length);

  return normalizedRoots.filter((candidate, index) => {
    return !normalizedRoots.some((possibleParent, parentIndex) => {
      if (index === parentIndex) {
        return false;
      }

      const relative = path.relative(possibleParent, candidate);

      return (
        relative !== "" &&
        !relative.startsWith("..") &&
        !path.isAbsolute(relative)
      );
    });
  });
}

/**
 * Builds one discovered project-file record.
 */
async function buildDiscoveredFile(
  projectRoot: string,
  absolutePath: string,
): Promise<DiscoveredProjectFile> {
  const statistics = await fs.stat(absolutePath);
  const relativePath = toProjectRelativePath(
    projectRoot,
    absolutePath,
  );
  const fileName = path.basename(absolutePath);
  const resourceType = determineResourceType(
    relativePath,
    fileName,
  );

  const routeMetadata = getRouteMetadata(
    projectRoot,
    absolutePath,
    relativePath,
    fileName,
  );

  return {
    id: createStableId(
      "translation-file",
      relativePath,
      resourceType,
    ),
    absolutePath: normalizePath(absolutePath),
    relativePath,
    fileName,
    extension: getFileExtension(fileName),
    resourceType,
    route: routeMetadata.route,
    namespace: routeMetadata.namespace,
    isRouteFile: isRoutePageFile(fileName),
    isDynamicRoute: routeMetadata.isDynamic,
    isPublic: routeMetadata.isPublic,
    requiresAuthentication:
      routeMetadata.requiresAuthentication,
    portal: routeMetadata.portal,
    sizeBytes: statistics.size,
    createdAt: statistics.birthtime
      ? statistics.birthtime.toISOString()
      : null,
    modifiedAt: statistics.mtime
      ? statistics.mtime.toISOString()
      : null,
    discoveredAt: nowIso(),
  };
}

/**
 * Removes duplicate file paths.
 */
function deduplicatePaths(filePaths: string[]): string[] {
  const unique = new Set(
    filePaths.map((filePath) => path.resolve(filePath)),
  );

  return [...unique];
}

/**
 * Sorts files consistently by relative path.
 */
function sortDiscoveredFiles(
  files: DiscoveredProjectFile[],
): DiscoveredProjectFile[] {
  return [...files].sort((first, second) =>
    first.relativePath.localeCompare(second.relativePath),
  );
}

/**
 * Scans the project and discovers all relevant files.
 */
export async function scanProjectFiles(
  scannerOptions: ProjectFileScannerOptions = {},
): Promise<ProjectFileScanResult> {
  const options: Required<ProjectFileScannerOptions> = {
    ...DEFAULT_SCANNER_OPTIONS,
    ...scannerOptions,
    projectRoot:
      scannerOptions.projectRoot ?? DEFAULT_SCANNER_OPTIONS.projectRoot,
  };

  const projectRoot = path.resolve(options.projectRoot);
  const startedAt = nowIso();
  const startTime = Date.now();
  const scanId = createStableId(
    "project-file-scan",
    projectRoot,
    startedAt,
  );

  const errors: string[] = [];
  const discoveredPaths: string[] = [];
  const files: DiscoveredProjectFile[] = [];

  const configuredRoots = getScannerRoots(projectRoot, options);
  const scannerRoots = removeNestedRoots(configuredRoots);

  for (const root of scannerRoots) {
    if (!(await pathExists(root))) {
      errors.push(
        `Configured scan root does not exist: "${normalizePath(root)}"`,
      );
      continue;
    }

    await walkDirectory(root, discoveredPaths, errors);
  }

  const uniquePaths = deduplicatePaths(discoveredPaths);

  for (const absolutePath of uniquePaths) {
    try {
      const discoveredFile = await buildDiscoveredFile(
        projectRoot,
        absolutePath,
      );

      files.push(discoveredFile);
    } catch (error) {
      errors.push(
        `Unable to inspect file "${normalizePath(absolutePath)}": ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  const sortedFiles = sortDiscoveredFiles(files);

  const routeFiles = sortedFiles.filter(
    (file) => file.resourceType === "page",
  );

  const componentFiles = sortedFiles.filter(
    (file) =>
      file.resourceType === "component" ||
      file.resourceType === "form" ||
      file.resourceType === "dialog" ||
      file.resourceType === "layout" ||
      file.resourceType === "template",
  );

  const messageFiles = sortedFiles.filter((file) =>
    isMessageFile(file.relativePath),
  );

  const enterpriseFiles = sortedFiles.filter(
    (file) => file.resourceType === "enterprise_engine",
  );

  const completedAt = nowIso();

  return {
    success: errors.length === 0,
    scanId,
    projectRoot: normalizePath(projectRoot),
    startedAt,
    completedAt,
    durationMs: Date.now() - startTime,
    files: sortedFiles,
    routeFiles,
    componentFiles,
    messageFiles,
    enterpriseFiles,
    errors,
  };
}

/**
 * Converts discovered files into base Translation Center
 * source-resource records.
 *
 * Translation keys, imported components, and hardcoded text
 * will be populated by the source analyzer in a later file.
 */
export function discoveredFilesToSourceResources(
  files: DiscoveredProjectFile[],
): TranslationSourceResource[] {
  return files.map((file) => ({
    id: createStableId(
      "translation-resource",
      file.relativePath,
      file.resourceType,
    ),
    type: file.resourceType,
    file: file.relativePath,
    route: file.route,
    namespace: file.namespace,
    importedComponents: [],
    translationKeys: [],
    hardcodedTextCount: 0,
    scannedAt: file.discoveredAt,
  }));
}

/**
 * Returns only the application page files.
 */
export async function scanApplicationPages(
  projectRoot = process.cwd(),
): Promise<DiscoveredProjectFile[]> {
  const result = await scanProjectFiles({
    projectRoot,
    includeAppDirectory: true,
    includeComponents: false,
    includeEnterpriseModules: false,
    includeMessageFiles: false,
  });

  return result.routeFiles;
}

/**
 * Returns only translation JSON files.
 */
export async function scanTranslationMessageFiles(
  projectRoot = process.cwd(),
): Promise<DiscoveredProjectFile[]> {
  const result = await scanProjectFiles({
    projectRoot,
    includeAppDirectory: false,
    includeComponents: false,
    includeEnterpriseModules: false,
    includeMessageFiles: true,
  });

  return result.messageFiles;
}

/**
 * Returns whether a discovered file is a monitored
 * Next.js framework file.
 */
export function isFrameworkTranslationFile(
  file: DiscoveredProjectFile,
): boolean {
  return isMonitoredFrameworkFile(file.fileName);
}