/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Source Intelligence Engine
 * Enterprise Source Analyzer
 * Version: 1.0.0
 * ============================================================
 */

import fs from "node:fs/promises";
import path from "node:path";

import type {
  TranslationIssue,
  TranslationIssueSeverity,
  TranslationResourceType,
  TranslationSourceResource,
} from "../types";

import type {
  DiscoveredProjectFile,
  ProjectFileScanResult,
} from "../file-scanner";

import {
  createStableId,
  normalizePath,
  nowIso,
  uniqueValues,
} from "../utils";

import {
  analyzeProjectImports,
  type ImportAnalyzerOptions,
  type ProjectImportAnalysis,
} from "./import-analyzer";

import {
  analyzeProjectTranslationKeys,
  type ProjectTranslationKeyAnalysis,
  type TranslationKeyAnalyzerOptions,
  type TranslationKeyUsage,
} from "./translation-key-analyzer";

import {
  analyzeProjectHardcodedText,
  type HardcodedTextDetectorOptions,
  type HardcodedTextOccurrence,
  type ProjectHardcodedTextAnalysis,
} from "./hardcoded-text-detector";

import {
  buildDependencyGraph,
  type DependencyGraphBuilderOptions,
  type ProjectDependencyGraph,
  type RouteDependencyGraph,
} from "./dependency-graph-builder";

/**
 * Source files supported by the Source Intelligence Engine.
 */
const SOURCE_ANALYSIS_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

/**
 * Files that normally contain source code requiring analysis.
 */
const SOURCE_RESOURCE_TYPES = new Set<TranslationResourceType>([
  "page",
  "layout",
  "template",
  "component",
  "form",
  "dialog",
  "notification",
  "email",
  "sms",
  "whatsapp",
  "api_response",
  "enterprise_engine",
  "unknown",
]);

/**
 * Overall source-intelligence status.
 */
export type SourceIntelligenceStatus =
  | "compliant"
  | "action_required"
  | "non_compliant"
  | "analysis_failed";

/**
 * Translation readiness of one source file.
 */
export interface SourceFileTranslationReadiness {
  id: string;

  sourceFile: string;
  resourceType: TranslationResourceType;

  route: string | null;
  namespace: string | null;
  portal: string | null;

  usesTranslationSystem: boolean;

  translationKeyCount: number;
  dynamicTranslationKeyCount: number;
  hardcodedTextCount: number;
  unresolvedImportCount: number;

  importedComponentCount: number;
  affectedRouteCount: number;

  readinessScore: number;
  status: SourceIntelligenceStatus;

  blockingIssueCount: number;
  warningIssueCount: number;

  recommendations: string[];
}

/**
 * Translation readiness of one application route.
 */
export interface RouteTranslationReadiness {
  id: string;

  route: string;
  namespace: string | null;
  portal: string | null;
  entryFile: string;

  totalSourceFiles: number;
  totalComponents: number;

  translationKeyCount: number;
  dynamicTranslationKeyCount: number;
  hardcodedTextCount: number;
  unresolvedImportCount: number;

  readinessScore: number;
  status: SourceIntelligenceStatus;

  blockingIssueCount: number;
  warningIssueCount: number;

  sourceFiles: string[];
  recommendations: string[];
}

/**
 * Namespace usage information derived from application source.
 */
export interface SourceNamespaceHealth {
  id: string;

  namespace: string;

  routes: string[];
  sourceFiles: string[];

  staticTranslationKeys: string[];
  dynamicTranslationKeyCount: number;
  hardcodedTextCount: number;

  filesUsingNamespace: number;
  routesUsingNamespace: number;

  readinessScore: number;
  status: SourceIntelligenceStatus;

  recommendations: string[];
}

/**
 * Enterprise source-analysis statistics.
 */
export interface SourceIntelligenceStatistics {
  analyzedFiles: number;
  failedFiles: number;

  filesUsingTranslations: number;
  filesWithoutTranslations: number;

  totalImports: number;
  unresolvedInternalImports: number;

  totalTranslationKeyUsages: number;
  uniqueTranslationKeys: number;
  dynamicTranslationKeys: number;

  hardcodedTextOccurrences: number;
  filesWithHardcodedText: number;

  dependencyNodes: number;
  dependencyEdges: number;
  circularDependencies: number;
  orphanFiles: number;
  sharedFiles: number;

  analyzedRoutes: number;
  compliantRoutes: number;
  actionRequiredRoutes: number;
  nonCompliantRoutes: number;

  averageFileReadinessScore: number;
  averageRouteReadinessScore: number;

  complianceScore: number;
  deploymentReady: boolean;
}

/**
 * Options accepted by the Source Intelligence Engine.
 */
export interface SourceAnalyzerOptions {
  projectRoot?: string;

  /**
   * Include only files discovered by the Project File Scanner.
   */
  files?: DiscoveredProjectFile[];

  /**
   * Analyze page files.
   */
  includePages?: boolean;

  /**
   * Analyze layouts and templates.
   */
  includeLayoutsAndTemplates?: boolean;

  /**
   * Analyze reusable UI components.
   */
  includeComponents?: boolean;

  /**
   * Analyze enterprise engines.
   */
  includeEnterpriseModules?: boolean;

  /**
   * Analyze API response files.
   */
  includeApiResponses?: boolean;

  /**
   * Analyze email, SMS, WhatsApp, and notification templates.
   */
  includeCommunicationResources?: boolean;

  /**
   * Fail the analysis when source files cannot be read.
   */
  failOnReadError?: boolean;

  /**
   * Include source-file content supplied by the caller.
   *
   * Keys must use project-relative paths.
   */
  sources?: Record<string, string>;

  importAnalyzer?: ImportAnalyzerOptions;
  translationKeyAnalyzer?: TranslationKeyAnalyzerOptions;
  hardcodedTextDetector?: HardcodedTextDetectorOptions;
  dependencyGraph?: DependencyGraphBuilderOptions;
}

/**
 * Complete result returned by the Source Intelligence Engine.
 */
export interface SourceIntelligenceResult {
  success: boolean;

  analysisId: string;
  platform: "EPEW-EDE-IBOS";
  engine: "SOURCE_INTELLIGENCE_ENGINE";
  version: "1.0.0";

  projectRoot: string;

  startedAt: string;
  completedAt: string;
  durationMs: number;

  analyzedFiles: DiscoveredProjectFile[];
  sourcesLoaded: string[];
  sourceReadErrors: string[];

  importAnalysis: ProjectImportAnalysis;
  translationKeyAnalysis: ProjectTranslationKeyAnalysis;
  hardcodedTextAnalysis: ProjectHardcodedTextAnalysis;
  dependencyGraph: ProjectDependencyGraph;

  sourceResources: TranslationSourceResource[];

  fileReadiness: SourceFileTranslationReadiness[];
  routeReadiness: RouteTranslationReadiness[];
  namespaceHealth: SourceNamespaceHealth[];

  issues: TranslationIssue[];
  recommendations: string[];

  statistics: SourceIntelligenceStatistics;

  status: SourceIntelligenceStatus;
  errors: string[];
}

/**
 * Default analyzer options.
 */
const DEFAULT_OPTIONS: Required<
  Pick<
    SourceAnalyzerOptions,
    | "includePages"
    | "includeLayoutsAndTemplates"
    | "includeComponents"
    | "includeEnterpriseModules"
    | "includeApiResponses"
    | "includeCommunicationResources"
    | "failOnReadError"
  >
> = {
  includePages: true,
  includeLayoutsAndTemplates: true,
  includeComponents: true,
  includeEnterpriseModules: true,
  includeApiResponses: true,
  includeCommunicationResources: true,
  failOnReadError: false,
};

/**
 * Determines whether a discovered file can be analyzed.
 */
function isSourceAnalysisFile(
  file: DiscoveredProjectFile,
): boolean {
  return (
    SOURCE_ANALYSIS_EXTENSIONS.has(file.extension) &&
    SOURCE_RESOURCE_TYPES.has(file.resourceType)
  );
}

/**
 * Determines whether a file is enabled by analyzer options.
 */
function shouldIncludeFile(
  file: DiscoveredProjectFile,
  options: typeof DEFAULT_OPTIONS,
): boolean {
  if (!isSourceAnalysisFile(file)) {
    return false;
  }

  switch (file.resourceType) {
    case "page":
      return options.includePages;

    case "layout":
    case "template":
      return options.includeLayoutsAndTemplates;

    case "component":
    case "form":
    case "dialog":
      return options.includeComponents;

    case "enterprise_engine":
      return options.includeEnterpriseModules;

    case "api_response":
      return options.includeApiResponses;

    case "email":
    case "sms":
    case "whatsapp":
    case "notification":
      return options.includeCommunicationResources;

    default:
      return true;
  }
}

/**
 * Reads source content for every selected file.
 */
async function loadSourceFiles(input: {
  files: DiscoveredProjectFile[];
  suppliedSources: Record<string, string>;
}): Promise<{
  sources: Record<string, string>;
  loadedFiles: string[];
  errors: string[];
}> {
  const sources: Record<string, string> = {
    ...input.suppliedSources,
  };

  const loadedFiles = new Set(
    Object.keys(input.suppliedSources),
  );

  const errors: string[] = [];

  for (const file of input.files) {
    if (sources[file.relativePath] !== undefined) {
      loadedFiles.add(file.relativePath);
      continue;
    }

    try {
      sources[file.relativePath] = await fs.readFile(
        file.absolutePath,
        "utf8",
      );

      loadedFiles.add(file.relativePath);
    } catch (error) {
      errors.push(
        `Unable to read source file "${file.relativePath}": ${
          error instanceof Error
            ? error.message
            : "Unknown file-reading error."
        }`,
      );
    }
  }

  return {
    sources,
    loadedFiles: [...loadedFiles].sort(),
    errors,
  };
}

/**
 * Returns a severity ranking.
 */
function severityRank(
  severity: TranslationIssueSeverity,
): number {
  const ranks: Record<TranslationIssueSeverity, number> = {
    info: 1,
    warning: 2,
    error: 3,
    critical: 4,
  };

  return ranks[severity];
}

/**
 * Creates a Translation Center issue.
 */
function createIssue(input: {
  code: string;
  severity: TranslationIssueSeverity;
  type: TranslationIssue["type"];
  file: string;
  line?: number;
  route?: string;
  namespace?: string;
  key?: string;
  message: string;
  recommendation?: string;
}): TranslationIssue {
  return {
    id: createStableId(
      "source-intelligence-issue",
      input.code,
      input.file,
      input.line,
      input.route,
      input.namespace,
      input.key,
    ),
    code: input.code,
    severity: input.severity,
    type: input.type,
    file: input.file,
    line: input.line,
    route: input.route,
    namespace: input.namespace,
    key: input.key,
    message: input.message,
    recommendation: input.recommendation,
    resolved: false,
    detectedAt: nowIso(),
  };
}

/**
 * Creates issues for unresolved internal imports.
 */
function createImportIssues(
  importAnalysis: ProjectImportAnalysis,
): TranslationIssue[] {
  const issues: TranslationIssue[] = [];

  for (const fileResult of importAnalysis.fileResults) {
    for (const moduleName of fileResult.unresolvedModules) {
      issues.push(
        createIssue({
          code: "IBOS-TR-UNRESOLVED-IMPORT",
          severity: "error",
          type: "configuration_error",
          file: fileResult.sourceFile,
          message: `The internal import "${moduleName}" could not be resolved.`,
          recommendation:
            "Verify the import path, filename, alias configuration, and exported module.",
        }),
      );
    }
  }

  return issues;
}

/**
 * Creates issues for dynamic translation keys.
 */
function createDynamicKeyIssues(
  translationAnalysis: ProjectTranslationKeyAnalysis,
): TranslationIssue[] {
  return translationAnalysis.dynamicKeys.map((dynamicKey) =>
    createIssue({
      code: "IBOS-TR-DYNAMIC-KEY",
      severity: "warning",
      type: "configuration_error",
      file: dynamicKey.sourceFile,
      line: dynamicKey.line,
      route: dynamicKey.route ?? undefined,
      namespace: dynamicKey.namespace ?? undefined,
      message: `Dynamic translation key detected: ${dynamicKey.expression}`,
      recommendation:
        "Use a statically analyzable translation key or register the complete set of possible keys through an approved override.",
    }),
  );
}

/**
 * Converts hardcoded-text findings into Translation Center issues.
 */
function createHardcodedTextIssues(
  occurrences: HardcodedTextOccurrence[],
): TranslationIssue[] {
  return occurrences.map((occurrence) =>
    createIssue({
      code: "IBOS-TR-HARDCODED-TEXT",
      severity: occurrence.severity,
      type: "hardcoded_text",
      file: occurrence.sourceFile,
      line: occurrence.line,
      route: occurrence.route ?? undefined,
      namespace:
        occurrence.suggestedNamespace ?? undefined,
      key: occurrence.suggestedKey,
      message: `Hardcoded user-facing text detected: "${occurrence.text}"`,
      recommendation: `Replace it with ${occurrence.suggestedReplacement} and add "${occurrence.suggestedFullKey}" to the English master namespace.`,
    }),
  );
}

/**
 * Creates circular dependency issues.
 */
function createCircularDependencyIssues(
  graph: ProjectDependencyGraph,
): TranslationIssue[] {
  return graph.circularDependencies.map((cycle) =>
    createIssue({
      code: "IBOS-TR-CIRCULAR-DEPENDENCY",
      severity: "warning",
      type: "configuration_error",
      file: cycle.files[0] ?? "unknown",
      message: `Circular dependency detected: ${cycle.cyclePath.join(
        " → ",
      )}`,
      recommendation:
        "Review the dependency chain and separate shared responsibilities to reduce source-analysis risk.",
    }),
  );
}

/**
 * Creates a missing namespace issue for source files requiring one.
 */
function createMissingNamespaceIssues(
  files: DiscoveredProjectFile[],
): TranslationIssue[] {
  return files
    .filter(
      (file) =>
        file.resourceType === "page" &&
        !file.namespace,
    )
    .map((file) =>
      createIssue({
        code: "IBOS-TR-SOURCE-NAMESPACE-MISSING",
        severity: "critical",
        type: "missing_namespace",
        file: file.relativePath,
        route: file.route ?? undefined,
        message: `No translation namespace is assigned to route "${
          file.route ?? file.relativePath
        }".`,
        recommendation:
          "Generate and register a namespace for this page before deployment.",
      }),
    );
}

/**
 * Sorts issues by severity, file, and line.
 */
function sortIssues(
  issues: TranslationIssue[],
): TranslationIssue[] {
  return [...issues].sort((first, second) => {
    const severityDifference =
      severityRank(second.severity) -
      severityRank(first.severity);

    if (severityDifference !== 0) {
      return severityDifference;
    }

    const fileDifference = first.file.localeCompare(second.file);

    if (fileDifference !== 0) {
      return fileDifference;
    }

    return (first.line ?? 0) - (second.line ?? 0);
  });
}

/**
 * Calculates a score from source-analysis findings.
 */
function calculateReadinessScore(input: {
  hardcodedTexts: number;
  dynamicKeys: number;
  unresolvedImports: number;
  missingNamespace: boolean;
  criticalIssues: number;
  errorIssues: number;
  warningIssues: number;
}): number {
  let score = 100;

  if (input.missingNamespace) {
    score -= 40;
  }

  score -= input.hardcodedTexts * 5;
  score -= input.dynamicKeys * 2;
  score -= input.unresolvedImports * 10;
  score -= input.criticalIssues * 15;
  score -= input.errorIssues * 8;
  score -= input.warningIssues * 2;

  return Math.max(
    0,
    Math.min(100, Math.round(score * 100) / 100),
  );
}

/**
 * Converts a score and issue count into a status.
 */
function determineStatus(input: {
  score: number;
  analysisFailed?: boolean;
  blockingIssues?: number;
}): SourceIntelligenceStatus {
  if (input.analysisFailed) {
    return "analysis_failed";
  }

  if ((input.blockingIssues ?? 0) > 0 || input.score < 80) {
    return "non_compliant";
  }

  if (input.score < 100) {
    return "action_required";
  }

  return "compliant";
}

/**
 * Returns issues belonging to one source file.
 */
function getIssuesForFile(
  issues: TranslationIssue[],
  sourceFile: string,
): TranslationIssue[] {
  return issues.filter((issue) => issue.file === sourceFile);
}

/**
 * Returns hardcoded text for one source file.
 */
function getHardcodedForFile(
  analysis: ProjectHardcodedTextAnalysis,
  sourceFile: string,
): HardcodedTextOccurrence[] {
  return analysis.occurrences.filter(
    (occurrence) => occurrence.sourceFile === sourceFile,
  );
}

/**
 * Returns translation keys for one source file.
 */
function getKeysForFile(
  analysis: ProjectTranslationKeyAnalysis,
  sourceFile: string,
): TranslationKeyUsage[] {
  return analysis.translationKeys.filter(
    (usage) => usage.sourceFile === sourceFile,
  );
}

/**
 * Creates one source-file readiness record.
 */
function createFileReadiness(input: {
  file: DiscoveredProjectFile;
  importAnalysis: ProjectImportAnalysis;
  translationAnalysis: ProjectTranslationKeyAnalysis;
  hardcodedAnalysis: ProjectHardcodedTextAnalysis;
  dependencyGraph: ProjectDependencyGraph;
  issues: TranslationIssue[];
}): SourceFileTranslationReadiness {
  const fileImportResult =
    input.importAnalysis.fileResults.find(
      (result) =>
        result.sourceFile === input.file.relativePath,
    );

  const fileTranslationResult =
    input.translationAnalysis.fileResults.find(
      (result) =>
        result.sourceFile === input.file.relativePath,
    );

  const fileIssues = getIssuesForFile(
    input.issues,
    input.file.relativePath,
  );

  const hardcodedTexts = getHardcodedForFile(
    input.hardcodedAnalysis,
    input.file.relativePath,
  );

  const staticKeys = getKeysForFile(
    input.translationAnalysis,
    input.file.relativePath,
  );

  const dynamicKeys =
    input.translationAnalysis.dynamicKeys.filter(
      (usage) =>
        usage.sourceFile === input.file.relativePath,
    );

  const dependencyNode =
    input.dependencyGraph.nodes.find(
      (node) => node.file === input.file.relativePath,
    );

  const criticalIssues = fileIssues.filter(
    (issue) => issue.severity === "critical",
  ).length;

  const errorIssues = fileIssues.filter(
    (issue) => issue.severity === "error",
  ).length;

  const warningIssues = fileIssues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  const score = calculateReadinessScore({
    hardcodedTexts: hardcodedTexts.length,
    dynamicKeys: dynamicKeys.length,
    unresolvedImports:
      fileImportResult?.unresolvedModules.length ?? 0,
    missingNamespace:
      input.file.resourceType === "page" &&
      !input.file.namespace,
    criticalIssues,
    errorIssues,
    warningIssues,
  });

  const recommendations: string[] = [];

  if (hardcodedTexts.length > 0) {
    recommendations.push(
      `Replace ${hardcodedTexts.length} hardcoded user-facing text occurrence${
        hardcodedTexts.length === 1 ? "" : "s"
      }.`,
    );
  }

  if (dynamicKeys.length > 0) {
    recommendations.push(
      `Review ${dynamicKeys.length} dynamically constructed translation key${
        dynamicKeys.length === 1 ? "" : "s"
      }.`,
    );
  }

  if ((fileImportResult?.unresolvedModules.length ?? 0) > 0) {
    recommendations.push(
      "Resolve all internal imports before translation certification.",
    );
  }

  if (
    input.file.resourceType === "page" &&
    !input.file.namespace
  ) {
    recommendations.push(
      "Assign a translation namespace to this page.",
    );
  }

  return {
    id: createStableId(
      "source-file-readiness",
      input.file.relativePath,
    ),

    sourceFile: input.file.relativePath,
    resourceType: input.file.resourceType,

    route: input.file.route,
    namespace: input.file.namespace,
    portal: input.file.portal,

    usesTranslationSystem:
      fileTranslationResult?.usesTranslationSystem ?? false,

    translationKeyCount: staticKeys.length,
    dynamicTranslationKeyCount: dynamicKeys.length,
    hardcodedTextCount: hardcodedTexts.length,
    unresolvedImportCount:
      fileImportResult?.unresolvedModules.length ?? 0,

    importedComponentCount:
      fileImportResult?.importedComponents.length ?? 0,
    affectedRouteCount:
      dependencyNode?.usedByRoutes.length ?? 0,

    readinessScore: score,
    status: determineStatus({
      score,
      blockingIssues: criticalIssues + errorIssues,
    }),

    blockingIssueCount: criticalIssues + errorIssues,
    warningIssueCount: warningIssues,

    recommendations,
  };
}

/**
 * Returns all files used by one route.
 */
function getRouteFiles(
  routeGraph: RouteDependencyGraph,
): string[] {
  return uniqueValues([
    routeGraph.entryFile,
    ...routeGraph.layoutFiles,
    ...routeGraph.directDependencies,
    ...routeGraph.transitiveDependencies,
  ]).sort();
}

/**
 * Creates one route readiness record.
 */
function createRouteReadiness(input: {
  routeGraph: RouteDependencyGraph;
  fileReadiness: SourceFileTranslationReadiness[];
  translationAnalysis: ProjectTranslationKeyAnalysis;
  hardcodedAnalysis: ProjectHardcodedTextAnalysis;
  importAnalysis: ProjectImportAnalysis;
  issues: TranslationIssue[];
}): RouteTranslationReadiness {
  const sourceFiles = getRouteFiles(input.routeGraph);

  const relatedFileReadiness = input.fileReadiness.filter(
    (record) => sourceFiles.includes(record.sourceFile),
  );

  const relatedKeys = input.translationAnalysis.translationKeys.filter(
    (usage) =>
      usage.route === input.routeGraph.route ||
      sourceFiles.includes(usage.sourceFile),
  );

  const relatedDynamicKeys =
    input.translationAnalysis.dynamicKeys.filter(
      (usage) =>
        usage.route === input.routeGraph.route ||
        sourceFiles.includes(usage.sourceFile),
    );

  const relatedHardcoded =
    input.hardcodedAnalysis.occurrences.filter(
      (occurrence) =>
        occurrence.route === input.routeGraph.route ||
        sourceFiles.includes(occurrence.sourceFile),
    );

  const relatedImportResults =
    input.importAnalysis.fileResults.filter((result) =>
      sourceFiles.includes(result.sourceFile),
    );

  const relatedIssues = input.issues.filter(
    (issue) =>
      issue.route === input.routeGraph.route ||
      sourceFiles.includes(issue.file),
  );

  const criticalIssues = relatedIssues.filter(
    (issue) => issue.severity === "critical",
  ).length;

  const errorIssues = relatedIssues.filter(
    (issue) => issue.severity === "error",
  ).length;

  const warningIssues = relatedIssues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  const unresolvedImports = relatedImportResults.reduce(
    (sum, result) =>
      sum + result.unresolvedModules.length,
    0,
  );

  const averageFileScore =
    relatedFileReadiness.length > 0
      ? relatedFileReadiness.reduce(
          (sum, record) => sum + record.readinessScore,
          0,
        ) / relatedFileReadiness.length
      : 100;

  const routePenaltyScore = calculateReadinessScore({
    hardcodedTexts: relatedHardcoded.length,
    dynamicKeys: relatedDynamicKeys.length,
    unresolvedImports,
    missingNamespace: !input.routeGraph.namespace,
    criticalIssues,
    errorIssues,
    warningIssues,
  });

  const score = Math.round(
    ((averageFileScore + routePenaltyScore) / 2) * 100,
  ) / 100;

  const recommendations: string[] = [];

  if (!input.routeGraph.namespace) {
    recommendations.push(
      "Assign and register a namespace for this route.",
    );
  }

  if (relatedHardcoded.length > 0) {
    recommendations.push(
      `Replace ${relatedHardcoded.length} hardcoded text occurrence${
        relatedHardcoded.length === 1 ? "" : "s"
      } affecting this route.`,
    );
  }

  if (relatedDynamicKeys.length > 0) {
    recommendations.push(
      `Review ${relatedDynamicKeys.length} dynamic translation key${
        relatedDynamicKeys.length === 1 ? "" : "s"
      } affecting this route.`,
    );
  }

  if (unresolvedImports > 0) {
    recommendations.push(
      "Resolve all internal dependencies used by this route.",
    );
  }

  return {
    id: createStableId(
      "route-translation-readiness",
      input.routeGraph.route,
    ),

    route: input.routeGraph.route,
    namespace: input.routeGraph.namespace,
    portal: input.routeGraph.portal,
    entryFile: input.routeGraph.entryFile,

    totalSourceFiles: sourceFiles.length,
    totalComponents: input.routeGraph.componentFiles.length,

    translationKeyCount:
      uniqueValues(
        relatedKeys.map((usage) => usage.fullKey),
      ).length,

    dynamicTranslationKeyCount:
      relatedDynamicKeys.length,

    hardcodedTextCount: relatedHardcoded.length,
    unresolvedImportCount: unresolvedImports,

    readinessScore: score,
    status: determineStatus({
      score,
      blockingIssues: criticalIssues + errorIssues,
    }),

    blockingIssueCount: criticalIssues + errorIssues,
    warningIssueCount: warningIssues,

    sourceFiles,
    recommendations,
  };
}

/**
 * Creates namespace health records from source usage.
 */
function createNamespaceHealth(input: {
  files: DiscoveredProjectFile[];
  translationAnalysis: ProjectTranslationKeyAnalysis;
  hardcodedAnalysis: ProjectHardcodedTextAnalysis;
  routeReadiness: RouteTranslationReadiness[];
}): SourceNamespaceHealth[] {
  const namespaceNames = uniqueValues([
    ...input.files
      .map((file) => file.namespace)
      .filter(
        (namespace): namespace is string =>
          Boolean(namespace),
      ),
    ...input.translationAnalysis.usedNamespaces,
  ]).sort();

  return namespaceNames.map((namespace) => {
    const namespaceKeys =
      input.translationAnalysis.translationKeys.filter(
        (usage) => usage.namespace === namespace,
      );

    const namespaceDynamicKeys =
      input.translationAnalysis.dynamicKeys.filter(
        (usage) => usage.namespace === namespace,
      );

    const namespaceHardcoded =
      input.hardcodedAnalysis.occurrences.filter(
        (occurrence) =>
          occurrence.namespace === namespace ||
          occurrence.suggestedNamespace === namespace,
      );

    const sourceFiles = uniqueValues([
      ...namespaceKeys.map((usage) => usage.sourceFile),
      ...namespaceDynamicKeys.map(
        (usage) => usage.sourceFile,
      ),
      ...namespaceHardcoded.map(
        (occurrence) => occurrence.sourceFile,
      ),
      ...input.files
        .filter((file) => file.namespace === namespace)
        .map((file) => file.relativePath),
    ]).sort();

    const routes = uniqueValues([
      ...input.files
        .filter((file) => file.namespace === namespace)
        .map((file) => file.route)
        .filter((route): route is string => Boolean(route)),
      ...namespaceKeys
        .map((usage) => usage.route)
        .filter((route): route is string => Boolean(route)),
    ]).sort();

    const relatedRouteReadiness =
      input.routeReadiness.filter(
        (route) =>
          route.namespace === namespace ||
          routes.includes(route.route),
      );

    const averageRouteScore =
      relatedRouteReadiness.length > 0
        ? relatedRouteReadiness.reduce(
            (sum, route) =>
              sum + route.readinessScore,
            0,
          ) / relatedRouteReadiness.length
        : 100;

    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (averageRouteScore -
            namespaceHardcoded.length * 3 -
            namespaceDynamicKeys.length * 2) *
            100,
        ) / 100,
      ),
    );

    const recommendations: string[] = [];

    if (namespaceHardcoded.length > 0) {
      recommendations.push(
        `Convert ${namespaceHardcoded.length} hardcoded text occurrence${
          namespaceHardcoded.length === 1 ? "" : "s"
        } into namespace keys.`,
      );
    }

    if (namespaceDynamicKeys.length > 0) {
      recommendations.push(
        "Review dynamically generated keys associated with this namespace.",
      );
    }

    return {
      id: createStableId(
        "source-namespace-health",
        namespace,
      ),

      namespace,

      routes,
      sourceFiles,

      staticTranslationKeys: uniqueValues(
        namespaceKeys.map((usage) => usage.key),
      ).sort(),

      dynamicTranslationKeyCount:
        namespaceDynamicKeys.length,

      hardcodedTextCount: namespaceHardcoded.length,

      filesUsingNamespace: sourceFiles.length,
      routesUsingNamespace: routes.length,

      readinessScore: score,
      status: determineStatus({
        score,
        blockingIssues: namespaceHardcoded.filter(
          (occurrence) =>
            occurrence.severity === "critical" ||
            occurrence.severity === "error",
        ).length,
      }),

      recommendations,
    };
  });
}

/**
 * Converts source-analysis data into TranslationSourceResource records.
 */
function createSourceResources(input: {
  files: DiscoveredProjectFile[];
  importAnalysis: ProjectImportAnalysis;
  translationAnalysis: ProjectTranslationKeyAnalysis;
  hardcodedAnalysis: ProjectHardcodedTextAnalysis;
}): TranslationSourceResource[] {
  return input.files.map((file) => {
    const imports = input.importAnalysis.fileResults.find(
      (result) => result.sourceFile === file.relativePath,
    );

    const translationKeys =
      input.translationAnalysis.translationKeys
        .filter(
          (usage) =>
            usage.sourceFile === file.relativePath,
        )
        .map((usage) => usage.fullKey);

    const hardcodedCount =
      input.hardcodedAnalysis.occurrences.filter(
        (occurrence) =>
          occurrence.sourceFile === file.relativePath,
      ).length;

    return {
      id: createStableId(
        "translation-source-resource",
        file.relativePath,
        file.resourceType,
      ),
      type: file.resourceType,
      file: file.relativePath,
      route: file.route,
      namespace: file.namespace,
      importedComponents: uniqueValues(
        imports?.importedComponents.map(
          (component) => component.componentName,
        ) ?? [],
      ).sort(),
      translationKeys:
        uniqueValues(translationKeys).sort(),
      hardcodedTextCount: hardcodedCount,
      scannedAt: nowIso(),
    };
  });
}

/**
 * Returns the average score for a collection.
 */
function averageScore(
  values: number[],
): number {
  if (values.length === 0) {
    return 100;
  }

  return (
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) /
        values.length) *
        100,
    ) / 100
  );
}

/**
 * Creates enterprise source-analysis statistics.
 */
function createStatistics(input: {
  files: DiscoveredProjectFile[];
  sourceReadErrors: string[];
  importAnalysis: ProjectImportAnalysis;
  translationAnalysis: ProjectTranslationKeyAnalysis;
  hardcodedAnalysis: ProjectHardcodedTextAnalysis;
  dependencyGraph: ProjectDependencyGraph;
  fileReadiness: SourceFileTranslationReadiness[];
  routeReadiness: RouteTranslationReadiness[];
  issues: TranslationIssue[];
}): SourceIntelligenceStatistics {
  const compliantRoutes = input.routeReadiness.filter(
    (route) => route.status === "compliant",
  ).length;

  const actionRequiredRoutes = input.routeReadiness.filter(
    (route) => route.status === "action_required",
  ).length;

  const nonCompliantRoutes = input.routeReadiness.filter(
    (route) =>
      route.status === "non_compliant" ||
      route.status === "analysis_failed",
  ).length;

  const criticalIssues = input.issues.filter(
    (issue) => issue.severity === "critical",
  ).length;

  const errorIssues = input.issues.filter(
    (issue) => issue.severity === "error",
  ).length;

  const averageFileReadinessScore = averageScore(
    input.fileReadiness.map(
      (record) => record.readinessScore,
    ),
  );

  const averageRouteReadinessScore = averageScore(
    input.routeReadiness.map(
      (record) => record.readinessScore,
    ),
  );

  let complianceScore =
    input.routeReadiness.length > 0
      ? averageRouteReadinessScore
      : averageFileReadinessScore;

  complianceScore -= criticalIssues * 5;
  complianceScore -= errorIssues * 2;

  complianceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(complianceScore * 100) / 100,
    ),
  );

  return {
    analyzedFiles: input.files.length,
    failedFiles: input.sourceReadErrors.length,

    filesUsingTranslations:
      input.translationAnalysis.filesUsingTranslations,

    filesWithoutTranslations: Math.max(
      input.files.length -
        input.translationAnalysis.filesUsingTranslations,
      0,
    ),

    totalImports: input.importAnalysis.imports.length,
    unresolvedInternalImports:
      input.importAnalysis.unresolvedModules.length,

    totalTranslationKeyUsages:
      input.translationAnalysis.translationKeys.length,

    uniqueTranslationKeys:
      input.translationAnalysis.uniqueFullKeys.length,

    dynamicTranslationKeys:
      input.translationAnalysis.dynamicKeys.length,

    hardcodedTextOccurrences:
      input.hardcodedAnalysis.totalOccurrences,

    filesWithHardcodedText:
      input.hardcodedAnalysis.filesWithHardcodedText,

    dependencyNodes:
      input.dependencyGraph.totalNodes,

    dependencyEdges:
      input.dependencyGraph.totalEdges,

    circularDependencies:
      input.dependencyGraph.circularDependencies.length,

    orphanFiles:
      input.dependencyGraph.orphanFiles.length,

    sharedFiles:
      input.dependencyGraph.sharedFiles.length,

    analyzedRoutes:
      input.routeReadiness.length,

    compliantRoutes,
    actionRequiredRoutes,
    nonCompliantRoutes,

    averageFileReadinessScore,
    averageRouteReadinessScore,

    complianceScore,

    deploymentReady:
      complianceScore === 100 &&
      criticalIssues === 0 &&
      errorIssues === 0 &&
      input.hardcodedAnalysis.totalOccurrences === 0 &&
      input.translationAnalysis.dynamicKeys.length === 0 &&
      input.importAnalysis.unresolvedModules.length === 0,
  };
}

/**
 * Creates enterprise recommendations.
 */
function createRecommendations(input: {
  statistics: SourceIntelligenceStatistics;
  dependencyGraph: ProjectDependencyGraph;
}): string[] {
  const recommendations: string[] = [];

  if (input.statistics.hardcodedTextOccurrences > 0) {
    recommendations.push(
      `Replace all ${input.statistics.hardcodedTextOccurrences} detected hardcoded user-facing text occurrences.`,
    );
  }

  if (input.statistics.dynamicTranslationKeys > 0) {
    recommendations.push(
      `Review all ${input.statistics.dynamicTranslationKeys} dynamic translation keys and replace them with static keys when possible.`,
    );
  }

  if (input.statistics.unresolvedInternalImports > 0) {
    recommendations.push(
      `Resolve all ${input.statistics.unresolvedInternalImports} unresolved internal imports.`,
    );
  }

  if (input.statistics.circularDependencies > 0) {
    recommendations.push(
      `Review ${input.statistics.circularDependencies} circular dependency chains.`,
    );
  }

  if (input.dependencyGraph.orphanFiles.length > 0) {
    recommendations.push(
      `Review ${input.dependencyGraph.orphanFiles.length} orphan source files that are not connected to any registered route.`,
    );
  }

  if (!input.statistics.deploymentReady) {
    recommendations.push(
      "Run the Compliance Engine after resolving Source Intelligence findings.",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Source Intelligence validation passed. Continue to namespace compliance and deployment certification.",
    );
  }

  return recommendations;
}

/**
 * Performs a complete Source Intelligence analysis.
 */
export async function analyzeProjectSource(
  projectScan: ProjectFileScanResult,
  analyzerOptions: SourceAnalyzerOptions = {},
): Promise<SourceIntelligenceResult> {
  const startedAt = nowIso();
  const startTime = Date.now();

  const options = {
    ...DEFAULT_OPTIONS,
    ...analyzerOptions,
  };

  const projectRoot = normalizePath(
    path.resolve(
      analyzerOptions.projectRoot ??
        projectScan.projectRoot,
    ),
  );

  const sourceFiles = (
    analyzerOptions.files ?? projectScan.files
  )
    .filter((file) =>
      shouldIncludeFile(file, options),
    )
    .sort((first, second) =>
      first.relativePath.localeCompare(
        second.relativePath,
      ),
    );

  const loadedSources = await loadSourceFiles({
    files: sourceFiles,
    suppliedSources: analyzerOptions.sources ?? {},
  });

  const analyzableFiles = sourceFiles.filter(
    (file) =>
      loadedSources.sources[file.relativePath] !== undefined,
  );

  const importAnalysis = analyzeProjectImports({
    files: analyzableFiles,
    sources: loadedSources.sources,
    options: {
      projectRoot,
      ...(analyzerOptions.importAnalyzer ?? {}),
    },
  });

  const translationKeyAnalysis =
    analyzeProjectTranslationKeys({
      files: analyzableFiles,
      sources: loadedSources.sources,
      options:
        analyzerOptions.translationKeyAnalyzer,
    });

  const hardcodedTextAnalysis =
    analyzeProjectHardcodedText({
      files: analyzableFiles,
      sources: loadedSources.sources,
      options:
        analyzerOptions.hardcodedTextDetector,
    });

  const dependencyGraph = buildDependencyGraph({
    files: analyzableFiles,
    importAnalysis,
    options:
      analyzerOptions.dependencyGraph,
  });

  const issues = sortIssues([
    ...createImportIssues(importAnalysis),
    ...createDynamicKeyIssues(
      translationKeyAnalysis,
    ),
    ...createHardcodedTextIssues(
      hardcodedTextAnalysis.occurrences,
    ),
    ...createCircularDependencyIssues(
      dependencyGraph,
    ),
    ...createMissingNamespaceIssues(
      analyzableFiles,
    ),
  ]);

  const fileReadiness = analyzableFiles.map((file) =>
    createFileReadiness({
      file,
      importAnalysis,
      translationAnalysis:
        translationKeyAnalysis,
      hardcodedAnalysis:
        hardcodedTextAnalysis,
      dependencyGraph,
      issues,
    }),
  );

  const routeReadiness =
    dependencyGraph.routeGraphs.map(
      (routeGraph) =>
        createRouteReadiness({
          routeGraph,
          fileReadiness,
          translationAnalysis:
            translationKeyAnalysis,
          hardcodedAnalysis:
            hardcodedTextAnalysis,
          importAnalysis,
          issues,
        }),
    );

  const namespaceHealth =
    createNamespaceHealth({
      files: analyzableFiles,
      translationAnalysis:
        translationKeyAnalysis,
      hardcodedAnalysis:
        hardcodedTextAnalysis,
      routeReadiness,
    });

  const sourceResources =
    createSourceResources({
      files: analyzableFiles,
      importAnalysis,
      translationAnalysis:
        translationKeyAnalysis,
      hardcodedAnalysis:
        hardcodedTextAnalysis,
    });

  const errors = uniqueValues([
    ...loadedSources.errors,
    ...importAnalysis.errors,
    ...translationKeyAnalysis.errors,
    ...hardcodedTextAnalysis.errors,
    ...dependencyGraph.errors,
  ]);

  const statistics = createStatistics({
    files: analyzableFiles,
    sourceReadErrors: loadedSources.errors,
    importAnalysis,
    translationAnalysis:
      translationKeyAnalysis,
    hardcodedAnalysis:
      hardcodedTextAnalysis,
    dependencyGraph,
    fileReadiness,
    routeReadiness,
    issues,
  });

  const recommendations =
    createRecommendations({
      statistics,
      dependencyGraph,
    });

  const analysisFailed =
    analyzerOptions.failOnReadError === true &&
    loadedSources.errors.length > 0;

  const status = determineStatus({
    score: statistics.complianceScore,
    analysisFailed,
    blockingIssues: issues.filter(
      (issue) =>
        issue.severity === "critical" ||
        issue.severity === "error",
    ).length,
  });

  const completedAt = nowIso();

  return {
    success:
      !analysisFailed &&
      errors.length === 0,

    analysisId: createStableId(
      "source-intelligence-analysis",
      projectRoot,
      startedAt,
      analyzableFiles.length,
    ),

    platform: "EPEW-EDE-IBOS",
    engine: "SOURCE_INTELLIGENCE_ENGINE",
    version: "1.0.0",

    projectRoot,

    startedAt,
    completedAt,
    durationMs: Date.now() - startTime,

    analyzedFiles: analyzableFiles,
    sourcesLoaded: loadedSources.loadedFiles,
    sourceReadErrors: loadedSources.errors,

    importAnalysis,
    translationKeyAnalysis,
    hardcodedTextAnalysis,
    dependencyGraph,

    sourceResources,

    fileReadiness,
    routeReadiness,
    namespaceHealth,

    issues,
    recommendations,

    statistics,

    status,
    errors,
  };
}

/**
 * Runs Source Intelligence directly from a list of discovered files.
 */
export async function analyzeDiscoveredFiles(input: {
  files: DiscoveredProjectFile[];
  projectRoot?: string;
  options?: SourceAnalyzerOptions;
}): Promise<SourceIntelligenceResult> {
  const projectRoot = normalizePath(
    path.resolve(
      input.projectRoot ?? process.cwd(),
    ),
  );

  const timestamp = nowIso();

  const projectScan: ProjectFileScanResult = {
    success: true,
    scanId: createStableId(
      "temporary-source-project-scan",
      projectRoot,
      input.files.length,
    ),
    projectRoot,
    startedAt: timestamp,
    completedAt: timestamp,
    durationMs: 0,

    files: input.files,

    routeFiles: input.files.filter(
      (file) => file.resourceType === "page",
    ),

    componentFiles: input.files.filter(
      (file) =>
        file.resourceType === "component" ||
        file.resourceType === "form" ||
        file.resourceType === "dialog" ||
        file.resourceType === "layout" ||
        file.resourceType === "template",
    ),

    messageFiles: input.files.filter(
      (file) => file.extension === ".json",
    ),

    enterpriseFiles: input.files.filter(
      (file) =>
        file.resourceType === "enterprise_engine",
    ),

    errors: [],
  };

  return analyzeProjectSource(projectScan, {
    ...(input.options ?? {}),
    projectRoot,
  });
}

/**
 * Returns readiness information for one source file.
 */
export function findSourceFileReadiness(
  result: SourceIntelligenceResult,
  sourceFile: string,
): SourceFileTranslationReadiness | undefined {
  return result.fileReadiness.find(
    (record) =>
      record.sourceFile === sourceFile,
  );
}

/**
 * Returns readiness information for one route.
 */
export function findRouteReadiness(
  result: SourceIntelligenceResult,
  route: string,
): RouteTranslationReadiness | undefined {
  return result.routeReadiness.find(
    (record) => record.route === route,
  );
}

/**
 * Returns source health for one namespace.
 */
export function findSourceNamespaceHealth(
  result: SourceIntelligenceResult,
  namespace: string,
): SourceNamespaceHealth | undefined {
  return result.namespaceHealth.find(
    (record) =>
      record.namespace === namespace,
  );
}

/**
 * Returns all noncompliant source files.
 */
export function getNonCompliantSourceFiles(
  result: SourceIntelligenceResult,
): SourceFileTranslationReadiness[] {
  return result.fileReadiness.filter(
    (record) =>
      record.status !== "compliant",
  );
}

/**
 * Returns all noncompliant routes.
 */
export function getNonCompliantRoutes(
  result: SourceIntelligenceResult,
): RouteTranslationReadiness[] {
  return result.routeReadiness.filter(
    (record) =>
      record.status !== "compliant",
  );
}

/**
 * Returns blocking Source Intelligence issues.
 */
export function getBlockingSourceIssues(
  result: SourceIntelligenceResult,
): TranslationIssue[] {
  return result.issues.filter(
    (issue) =>
      issue.severity === "critical" ||
      issue.severity === "error",
  );
}

/**
 * Returns every route affected by hardcoded text.
 */
export function getRoutesWithHardcodedText(
  result: SourceIntelligenceResult,
): RouteTranslationReadiness[] {
  return result.routeReadiness.filter(
    (route) =>
      route.hardcodedTextCount > 0,
  );
}

/**
 * Returns every source namespace requiring action.
 */
export function getNamespacesRequiringSourceAction(
  result: SourceIntelligenceResult,
): SourceNamespaceHealth[] {
  return result.namespaceHealth.filter(
    (namespace) =>
      namespace.status !== "compliant",
  );
}