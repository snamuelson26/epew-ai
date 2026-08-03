/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Main Enterprise Orchestrator
 * Version: 1.0.0
 * ============================================================
 */

import path from "node:path";

import {
  scanProjectFiles,
  type ProjectFileScannerOptions,
  type ProjectFileScanResult,
} from "./file-scanner";

import {
  scanRoutesFromProjectFiles,
  type RouteScannerOptions,
  type RouteScanResult,
} from "./route-scanner";

import {
  scanNamespaces,
  type NamespaceScannerOptions,
  type NamespaceScanResult,
} from "./namespace-scanner";

import {
  analyzeProjectSource,
  type SourceAnalyzerOptions,
  type SourceIntelligenceResult,
} from "./source-intelligence";

import {
  runSafeCodeTransformer,
  type SafeCodeTransformerResult,
} from "./safe-code-transformer";

import {
  runTranslationCompliance,
  type TranslationComplianceEngineResult,
} from "./compliance-engine";

import {
  loadTranslationArtifacts,
  saveTranslationArtifacts,
  type TranslationArtifactLoadResult,
  type TranslationArtifactWriteResult,
  type TranslationManifestManagerOptions,
} from "./manifest-manager";

import type {
  TranslationCertification,
  TranslationComplianceReport,
  TranslationManifest,
  TranslationNamespace,
  TranslationPage,
  TranslationQueueItem,
  TranslationRoute,
  TranslationStatistics,
} from "./types";

import {
  createStableId,
  normalizePath,
  nowIso,
  uniqueValues,
} from "./utils";

/**
 * Official orchestrator version.
 */
export const IBOS_TRANSLATION_CENTER_VERSION = "1.0.0";

/**
 * Translation Center execution mode.
 */
export type TranslationCenterExecutionMode =
  | "scan"
  | "validate"
  | "build"
  | "certify";

/**
 * Translation Center execution status.
 */
export type TranslationCenterExecutionStatus =
  | "completed"
  | "completed_with_issues"
  | "failed";

/**
 * Configuration accepted by the main Translation Center.
 */
export interface TranslationCenterOptions {
  projectRoot?: string;

  /**
   * Determines the objective of the current execution.
   */
  mode?: TranslationCenterExecutionMode;

  /**
   * Load previous registries, queue items, and manifest data.
   */
  loadPreviousState?: boolean;

  /**
   * Save the generated Translation Center artifacts.
   */
  saveArtifacts?: boolean;

  /**
   * Generate missing English namespace files.
   *
   * This should normally remain false until the page and
   * namespace mapping is reviewed.
   */
  createMissingMasterFiles?: boolean;

  /**
   * Generate missing HT, FR, and ES namespace files.
   */
  createMissingTargetFiles?: boolean;

  /**
   * Optional manifest version.
   */
  manifestVersion?: string;

  fileScanner?: ProjectFileScannerOptions;
  routeScanner?: RouteScannerOptions;
  namespaceScanner?: NamespaceScannerOptions;
  sourceAnalyzer?: SourceAnalyzerOptions;
  manifestManager?: TranslationManifestManagerOptions;
}

/**
 * Timing information for one Translation Center phase.
 */
export interface TranslationCenterPhaseTiming {
  phase:
  | "load_previous_state"
  | "file_scan"
  | "initial_route_scan"
  | "namespace_scan"
  | "final_route_scan"
  | "source_intelligence"
  | "safe_code_transformation"
  | "compliance"
  | "artifact_save";

  startedAt: string;
  completedAt: string;
  durationMs: number;
  success: boolean;
}

/**
 * Summary displayed by command-line tools and dashboards.
 */
export interface TranslationCenterExecutionSummary {
  totalPages: number;
  totalRoutes: number;
  totalNamespaces: number;
  supportedLanguages: number;

  totalTranslationKeys: number;
  missingTranslationKeys: number;
  hardcodedTexts: number;
  placeholderMismatches: number;

  complianceScore: number;
  translationCoverage: number;

  pendingQueueItems: number;
  blockingIssues: number;

  deploymentReady: boolean;
  certificationIssued: boolean;
}

/**
 * Complete Translation Center execution result.
 */
export interface TranslationCenterResult {
  success: boolean;

  executionId: string;
  platform: "EPEW-EDE-IBOS";
  engine: "ENTERPRISE_TRANSLATION_CENTER";
  version: string;

  mode: TranslationCenterExecutionMode;
  status: TranslationCenterExecutionStatus;

  projectRoot: string;

  startedAt: string;
  completedAt: string;
  durationMs: number;

  previousState: TranslationArtifactLoadResult | null;

  projectScan: ProjectFileScanResult;
  routeScan: RouteScanResult;
  namespaceScan: NamespaceScanResult;
  sourceIntelligence: SourceIntelligenceResult;
  safeCodeTransformation: SafeCodeTransformerResult | null;
  compliance: TranslationComplianceEngineResult;

  artifactWrite: TranslationArtifactWriteResult | null;

  manifest: TranslationManifest;
  certification: TranslationCertification;
  complianceReport: TranslationComplianceReport;
  statistics: TranslationStatistics;

  routes: TranslationRoute[];
  pages: TranslationPage[];
  namespaces: TranslationNamespace[];
  queue: TranslationQueueItem[];

  summary: TranslationCenterExecutionSummary;
  phaseTimings: TranslationCenterPhaseTiming[];

  recommendations: string[];
  errors: string[];
}

/**
 * Default orchestration behavior.
 */
const DEFAULT_OPTIONS: Required<
  Pick<
    TranslationCenterOptions,
    | "mode"
    | "loadPreviousState"
    | "saveArtifacts"
    | "createMissingMasterFiles"
    | "createMissingTargetFiles"
  >
> = {
  mode: "scan",
  loadPreviousState: true,
  saveArtifacts: true,
  createMissingMasterFiles: false,
  createMissingTargetFiles: false,
};

/**
 * Runs one timed Translation Center phase.
 */
async function runPhase<T>(
  phase: TranslationCenterPhaseTiming["phase"],
  operation: () => Promise<T>,
): Promise<{
  result: T;
  timing: TranslationCenterPhaseTiming;
}> {
  const startedAt = nowIso();
  const startTime = Date.now();

  try {
    const result = await operation();

    return {
      result,
      timing: {
        phase,
        startedAt,
        completedAt: nowIso(),
        durationMs: Date.now() - startTime,
        success: true,
      },
    };
  } catch (error) {
    const completedAt = nowIso();

    const message =
      error instanceof Error
        ? error.message
        : "Unknown Translation Center phase error.";

    throw Object.assign(new Error(message), {
      phaseTiming: {
        phase,
        startedAt,
        completedAt,
        durationMs: Date.now() - startTime,
        success: false,
      } satisfies TranslationCenterPhaseTiming,
    });
  }
}

/**
 * Creates a manifest version when none is supplied.
 */
function createManifestVersion(
  requestedVersion?: string,
): string {
  if (requestedVersion?.trim()) {
    return requestedVersion.trim();
  }

  const timestamp = new Date();

  const year = timestamp.getUTCFullYear();
  const month = String(timestamp.getUTCMonth() + 1).padStart(2, "0");
  const day = String(timestamp.getUTCDate()).padStart(2, "0");
  const hour = String(timestamp.getUTCHours()).padStart(2, "0");
  const minute = String(timestamp.getUTCMinutes()).padStart(2, "0");
  const second = String(timestamp.getUTCSeconds()).padStart(2, "0");

  return `${year}.${month}.${day}-${hour}${minute}${second}`;
}

/**
 * Returns namespaces referenced by the discovered routes.
 */
function getRouteNamespaces(
  routeScan: RouteScanResult,
): string[] {
  return uniqueValues(
    routeScan.routes
      .map((route) => route.namespace)
      .filter(
        (namespace): namespace is string =>
          Boolean(namespace),
      ),
  ).sort();
}

/**
 * Returns namespace names discovered from translation files.
 */
function getAvailableNamespaces(
  namespaceScan: NamespaceScanResult,
): string[] {
  return namespaceScan.namespaces
    .filter((namespace) => namespace.masterFile !== null)
    .map((namespace) => namespace.namespace)
    .sort();
}

/**
 * Creates the compact Translation Center summary.
 */
function createExecutionSummary(
  compliance: TranslationComplianceEngineResult,
): TranslationCenterExecutionSummary {
  const blockingIssues = compliance.issues.filter(
    (issue) =>
      issue.severity === "critical" ||
      issue.severity === "error",
  ).length;

  return {
    totalPages: compliance.statistics.totalPages,
    totalRoutes: compliance.manifest.routes.length,
    totalNamespaces: compliance.statistics.totalNamespaces,
    supportedLanguages:
      compliance.statistics.supportedLanguages,

    totalTranslationKeys:
      compliance.statistics.totalTranslationKeys,

    missingTranslationKeys:
      compliance.statistics.missingKeys,

    hardcodedTexts:
      compliance.statistics.hardcodedTexts,

    placeholderMismatches:
      compliance.statistics.placeholderMismatches,

    complianceScore:
      compliance.statistics.complianceScore,

    translationCoverage:
      compliance.statistics.translationCoverage,

    pendingQueueItems: compliance.queue.filter(
      (item) => item.status !== "completed",
    ).length,

    blockingIssues,

    deploymentReady:
      compliance.statistics.deploymentReady,

    certificationIssued:
      compliance.certification.issued,
  };
}

/**
 * Creates high-level recommendations from the complete execution.
 */
function createExecutionRecommendations(input: {
  mode: TranslationCenterExecutionMode;
  projectScan: ProjectFileScanResult;
  routeScan: RouteScanResult;
  namespaceScan: NamespaceScanResult;
  sourceIntelligence: SourceIntelligenceResult;
  compliance: TranslationComplianceEngineResult;
  artifactWrite: TranslationArtifactWriteResult | null;
}): string[] {
  const recommendations: string[] = [];

  if (input.projectScan.errors.length > 0) {
    recommendations.push(
      "Review Project File Scanner errors before relying on the complete page registry.",
    );
  }

  if (input.routeScan.routesWithoutNamespaces.length > 0) {
    recommendations.push(
      `Assign namespaces to ${input.routeScan.routesWithoutNamespaces.length} route${
        input.routeScan.routesWithoutNamespaces.length === 1
          ? ""
          : "s"
      }.`,
    );
  }

  if (
    input.routeScan.routesWithMissingNamespaceFiles.length > 0
  ) {
    recommendations.push(
      `Create English master namespaces for ${input.routeScan.routesWithMissingNamespaceFiles.length} registered route${
        input.routeScan.routesWithMissingNamespaceFiles.length === 1
          ? ""
          : "s"
      }.`,
    );
  }

  if (input.namespaceScan.missingLanguageFiles.length > 0) {
    recommendations.push(
      `Create ${input.namespaceScan.missingLanguageFiles.length} missing language file${
        input.namespaceScan.missingLanguageFiles.length === 1
          ? ""
          : "s"
      }.`,
    );
  }

  if (
    input.sourceIntelligence.statistics.hardcodedTextOccurrences > 0
  ) {
    recommendations.push(
      `Replace ${input.sourceIntelligence.statistics.hardcodedTextOccurrences} hardcoded user-facing text occurrence${
        input.sourceIntelligence.statistics
          .hardcodedTextOccurrences === 1
          ? ""
          : "s"
      }.`,
    );
  }

  if (
    input.sourceIntelligence.statistics.dynamicTranslationKeys > 0
  ) {
    recommendations.push(
      `Review ${input.sourceIntelligence.statistics.dynamicTranslationKeys} dynamic translation key${
        input.sourceIntelligence.statistics
          .dynamicTranslationKeys === 1
          ? ""
          : "s"
      }.`,
    );
  }

  recommendations.push(
    ...input.compliance.report.recommendations,
  );

  if (
    input.artifactWrite &&
    !input.artifactWrite.success
  ) {
    recommendations.push(
      "Correct artifact storage errors so the dashboard can load the latest Translation Center state.",
    );
  }

  if (
    input.mode === "certify" &&
    !input.compliance.certification.issued
  ) {
    recommendations.push(
      "Certification was not issued because one or more deployment requirements remain unresolved.",
    );
  }

  if (
    input.compliance.statistics.deploymentReady &&
    input.compliance.certification.issued
  ) {
    recommendations.push(
      "Translation validation passed. The platform is ready for multilingual deployment.",
    );
  }

  return uniqueValues(recommendations);
}

/**
 * Determines the final execution status.
 */
function determineExecutionStatus(input: {
  errors: string[];
  compliance: TranslationComplianceEngineResult;
  artifactWrite: TranslationArtifactWriteResult | null;
}): TranslationCenterExecutionStatus {
  if (
    input.errors.length > 0 ||
    (input.artifactWrite && !input.artifactWrite.success)
  ) {
    return "failed";
  }

  if (
    !input.compliance.statistics.deploymentReady ||
    input.compliance.issues.length > 0
  ) {
    return "completed_with_issues";
  }

  return "completed";
}

/**
 * Runs the complete EPEW-EDE-IBOS Translation Center.
 *
 * Execution flow:
 *
 * Project File Scan
 *      ↓
 * Initial Route Scan
 *      ↓
 * Namespace Scan
 *      ↓
 * Final Route Scan
 *      ↓
 * Source Intelligence
 *      ↓
 * Compliance Engine
 *      ↓
 * Manifest and Registry Save
 */
export async function runTranslationCenter(
  translationCenterOptions: TranslationCenterOptions = {},
): Promise<TranslationCenterResult> {
  const startedAt = nowIso();
  const startTime = Date.now();

  const options = {
    ...DEFAULT_OPTIONS,
    ...translationCenterOptions,
  };

  const projectRoot = normalizePath(
    path.resolve(
      translationCenterOptions.projectRoot ??
        process.cwd(),
    ),
  );

  const executionId = createStableId(
    "enterprise-translation-center-run",
    projectRoot,
    startedAt,
    options.mode,
  );

  const manifestVersion = createManifestVersion(
    translationCenterOptions.manifestVersion,
  );

  const phaseTimings: TranslationCenterPhaseTiming[] = [];
  const executionErrors: string[] = [];

  let previousState: TranslationArtifactLoadResult | null = null;

  if (options.loadPreviousState) {
    try {
      const phase = await runPhase(
        "load_previous_state",
        () =>
          loadTranslationArtifacts({
            projectRoot,
            ...(translationCenterOptions.manifestManager ?? {}),
          }),
      );

      previousState = phase.result;
      phaseTimings.push(phase.timing);
    } catch (error) {
      const timing = (
        error as Error & {
          phaseTiming?: TranslationCenterPhaseTiming;
        }
      ).phaseTiming;

      if (timing) {
        phaseTimings.push(timing);
      }

      executionErrors.push(
        `Unable to load previous Translation Center state: ${
          error instanceof Error
            ? error.message
            : "Unknown state-loading error."
        }`,
      );
    }
  }

  const projectScanPhase = await runPhase(
    "file_scan",
    () =>
      scanProjectFiles({
        projectRoot,
        ...(translationCenterOptions.fileScanner ?? {}),
      }),
  );

  phaseTimings.push(projectScanPhase.timing);

  const projectScan = projectScanPhase.result;

  const initialRoutePhase = await runPhase(
    "initial_route_scan",
    async () =>
      scanRoutesFromProjectFiles(projectScan, {
        ...(translationCenterOptions.routeScanner ?? {}),
        existingRoutes:
          translationCenterOptions.routeScanner
            ?.existingRoutes ??
          previousState?.routes ??
          [],
        existingPages:
          translationCenterOptions.routeScanner
            ?.existingPages ??
          previousState?.pages ??
          [],
        availableNamespaces:
          translationCenterOptions.routeScanner
            ?.availableNamespaces ??
          previousState?.namespaces.map(
            (namespace) => namespace.namespace,
          ) ??
          [],
      }),
  );

  phaseTimings.push(initialRoutePhase.timing);

  const initialRouteScan = initialRoutePhase.result;

  const registeredRouteNamespaces =
    getRouteNamespaces(initialRouteScan);

  const namespacePhase = await runPhase(
    "namespace_scan",
    () =>
      scanNamespaces(projectScan, {
        projectRoot,
        ...(translationCenterOptions.namespaceScanner ?? {}),
        registeredRouteNamespaces,
        existingNamespaces:
          translationCenterOptions.namespaceScanner
            ?.existingNamespaces ??
          previousState?.namespaces ??
          [],
        existingKeys:
          translationCenterOptions.namespaceScanner
            ?.existingKeys ??
          previousState?.manifest?.keys ??
          [],
        createMissingMasterFiles:
          translationCenterOptions.namespaceScanner
            ?.createMissingMasterFiles ??
          options.createMissingMasterFiles,
        createMissingTargetFiles:
          translationCenterOptions.namespaceScanner
            ?.createMissingTargetFiles ??
          options.createMissingTargetFiles,
      }),
  );

  phaseTimings.push(namespacePhase.timing);

  const namespaceScan = namespacePhase.result;

  const finalRoutePhase = await runPhase(
    "final_route_scan",
    async () =>
      scanRoutesFromProjectFiles(projectScan, {
        ...(translationCenterOptions.routeScanner ?? {}),
        existingRoutes:
          initialRouteScan.routes,
        existingPages:
          initialRouteScan.pages,
        availableNamespaces:
          getAvailableNamespaces(namespaceScan),
      }),
  );

  phaseTimings.push(finalRoutePhase.timing);

  const routeScan = finalRoutePhase.result;

  const sourceIntelligencePhase = await runPhase(
    "source_intelligence",
    () =>
      analyzeProjectSource(projectScan, {
        projectRoot,
        ...(translationCenterOptions.sourceAnalyzer ?? {}),
      }),
  );

  phaseTimings.push(sourceIntelligencePhase.timing);

  const sourceIntelligence =
    sourceIntelligencePhase.result;

  let safeCodeTransformation: SafeCodeTransformerResult | null =
  null;

if (options.mode === "build") {
 const safeCodePhase = await runPhase(
  "safe_code_transformation",
  () =>
    runSafeCodeTransformer(
      sourceIntelligence.hardcodedTextAnalysis,
      {
        projectRoot,

  includeFiles: [
  "app/components/Footer.tsx",
  "app/components/Navbar.tsx",
  "app/how-it-works/page.tsx",
  "app/marketplace/page.tsx",
  "app/coaches/apply/page.tsx",
  "app/admin/messages/page.tsx",
  "app/admin/notifications/page.tsx",
  "app/admin/support-tickets/page.tsx",
  "app/admin/vendors/page.tsx",
  "app/admin/funding-readiness/page.tsx",
],

applyChanges: true,

generateEnglishNamespaces: true,
generateTargetNamespaces: true,
createBackups: true,
      },
    ),
);

  safeCodeTransformation = safeCodePhase.result;
  phaseTimings.push(safeCodePhase.timing);
}

  const compliancePhase = await runPhase(
    "compliance",
    async () =>
      runTranslationCompliance({
        routeScan,
        namespaceScan,
        sourceIntelligence,
        existingQueue:
          previousState?.queue ?? [],
        manifestVersion,
      }),
  );

  phaseTimings.push(compliancePhase.timing);

  const compliance = compliancePhase.result;

  let artifactWrite: TranslationArtifactWriteResult | null =
    null;

  if (options.saveArtifacts) {
    try {
      const artifactPhase = await runPhase(
        "artifact_save",
        () =>
          saveTranslationArtifacts(compliance, {
            projectRoot,
            ...(translationCenterOptions.manifestManager ?? {}),
          }),
      );

      artifactWrite = artifactPhase.result;
      phaseTimings.push(artifactPhase.timing);
    } catch (error) {
      const timing = (
        error as Error & {
          phaseTiming?: TranslationCenterPhaseTiming;
        }
      ).phaseTiming;

      if (timing) {
        phaseTimings.push(timing);
      }

      executionErrors.push(
        `Unable to save Translation Center artifacts: ${
          error instanceof Error
            ? error.message
            : "Unknown artifact-save error."
        }`,
      );
    }
  }

  const errors = uniqueValues([
    ...executionErrors,
    ...projectScan.errors,
    ...routeScan.errors,
    ...namespaceScan.errors,
    ...sourceIntelligence.errors,
    ...compliance.errors,
    ...(artifactWrite?.errors ?? []),
  ]);

  const summary = createExecutionSummary(compliance);

  const recommendations =
    createExecutionRecommendations({
      mode: options.mode,
      projectScan,
      routeScan,
      namespaceScan,
      sourceIntelligence,
      compliance,
      artifactWrite,
    });

  const status = determineExecutionStatus({
    errors,
    compliance,
    artifactWrite,
  });

  const completedAt = nowIso();

  return {
  success:
    status !== "failed" &&
    compliance.success,

  executionId,
  platform: "EPEW-EDE-IBOS",
  engine: "ENTERPRISE_TRANSLATION_CENTER",
  version: IBOS_TRANSLATION_CENTER_VERSION,

  mode: options.mode,
  status,

  projectRoot,

  startedAt,
  completedAt,
  durationMs: Date.now() - startTime,

  previousState,

  projectScan,
  routeScan,
  namespaceScan,
  sourceIntelligence,
  safeCodeTransformation,
  compliance,

  artifactWrite,

  manifest: compliance.manifest,
  certification: compliance.certification,
  complianceReport: compliance.report,
  statistics: compliance.statistics,

  routes: compliance.manifest.routes,
  pages: compliance.pages,
  namespaces: compliance.namespaces,
  queue: compliance.queue,

  summary,
  phaseTimings,

  recommendations,
  errors,
};
}

/**
 * Runs a read-only Translation Center scan.
 *
 * No missing files are generated.
 */
export async function scanTranslationCenter(
  options: Omit<
    TranslationCenterOptions,
    "mode"
  > = {},
): Promise<TranslationCenterResult> {
  return runTranslationCenter({
    ...options,
    mode: "scan",
    createMissingMasterFiles: false,
    createMissingTargetFiles: false,
  });
}

/**
 * Runs translation validation and saves reports.
 */
export async function validateTranslationCenter(
  options: Omit<
    TranslationCenterOptions,
    "mode"
  > = {},
): Promise<TranslationCenterResult> {
  return runTranslationCenter({
    ...options,
    mode: "validate",
  });
}

/**
 * Runs the Translation Center Build process.
 *
 * Missing HT, FR, and ES files can be created using the
 * English master hierarchy.
 */
export async function buildTranslationCenter(
  options: Omit<
    TranslationCenterOptions,
    "mode"
  > = {},
): Promise<TranslationCenterResult> {
  return runTranslationCenter({
    ...options,
    mode: "build",
    createMissingTargetFiles:
      options.createMissingTargetFiles ?? true,
  });
}

/**
 * Runs deployment certification.
 */
export async function certifyTranslationCenter(
  options: Omit<
    TranslationCenterOptions,
    "mode"
  > = {},
): Promise<TranslationCenterResult> {
  return runTranslationCenter({
    ...options,
    mode: "certify",
  });
}

/**
 * Returns whether the latest execution passed certification.
 */
export function translationCenterPassed(
  result: TranslationCenterResult,
): boolean {
  return (
    result.certification.issued &&
    result.statistics.deploymentReady &&
    result.status === "completed"
  );
}

/**
 * Returns the translation work that remains pending.
 */
export function getPendingTranslationWork(
  result: TranslationCenterResult,
): TranslationQueueItem[] {
  return result.queue.filter(
    (item) => item.status !== "completed",
  );
}

/**
 * Returns critical and high-priority translation work.
 */
export function getPriorityTranslationWork(
  result: TranslationCenterResult,
): TranslationQueueItem[] {
  return result.queue.filter(
    (item) =>
      item.status !== "completed" &&
      (item.priority === "critical" ||
        item.priority === "high"),
  );
}