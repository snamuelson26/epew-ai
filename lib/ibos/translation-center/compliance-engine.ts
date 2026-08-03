/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Enterprise Compliance Engine
 * Version: 1.0.0
 * ============================================================
 */

import {
  IBOS_COMPLIANCE_THRESHOLDS,
  IBOS_ENABLED_LANGUAGES,
  IBOS_TRANSLATION_SERVICE,
} from "./config";

import type {
  TranslationCertification,
  TranslationComplianceReport,
  TranslationComplianceStatus,
  TranslationIssue,
  TranslationIssueSeverity,
  TranslationLanguage,
  TranslationManifest,
  TranslationNamespace,
  TranslationPage,
  TranslationQueueItem,
  TranslationStatistics,
} from "./types";

import type { RouteScanResult } from "./route-scanner";
import type { NamespaceScanResult } from "./namespace-scanner";

import type {
  SourceIntelligenceResult,
  SourceIntelligenceStatus,
} from "./source-intelligence";

import {
  createStableId,
  determineComplianceStatus,
  nowIso,
  sortBySeverity,
  uniqueValues,
} from "./utils";

/**
 * Compliance engine version.
 */
export const IBOS_TRANSLATION_COMPLIANCE_VERSION = "1.0.0";

/**
 * Complete input accepted by the compliance engine.
 */
export interface TranslationComplianceInput {
  routeScan: RouteScanResult;
  namespaceScan: NamespaceScanResult;
  sourceIntelligence: SourceIntelligenceResult;

  existingQueue?: TranslationQueueItem[];
  manifestVersion?: string;
}

/**
 * Page compliance result before it is merged into the manifest.
 */
export interface PageComplianceResult {
  pageId: string;
  route: string;
  namespace: string | null;

  score: number;
  status: TranslationComplianceStatus;

  blockingIssues: number;
  warningIssues: number;

  recommendations: string[];
}

/**
 * Namespace compliance result before it is merged into the manifest.
 */
export interface NamespaceComplianceResult {
  namespaceId: string;
  namespace: string;

  score: number;
  status: TranslationComplianceStatus;

  blockingIssues: number;
  warningIssues: number;

  recommendations: string[];
}

/**
 * Final result returned by the compliance engine.
 */
export interface TranslationComplianceEngineResult {
  success: boolean;

  complianceId: string;
  platform: "EPEW-EDE-IBOS";
  engine: "TRANSLATION_COMPLIANCE_ENGINE";
  version: string;

  generatedAt: string;

  pages: TranslationPage[];
  namespaces: TranslationNamespace[];

  pageResults: PageComplianceResult[];
  namespaceResults: NamespaceComplianceResult[];

  issues: TranslationIssue[];
  queue: TranslationQueueItem[];

  statistics: TranslationStatistics;
  report: TranslationComplianceReport;
  certification: TranslationCertification;

  manifest: TranslationManifest;

  errors: string[];
}

/**
 * Returns whether an issue blocks deployment certification.
 */
function isBlockingIssue(issue: TranslationIssue): boolean {
  return (
    issue.severity === "critical" ||
    issue.severity === "error"
  );
}

/**
 * Returns a normalized issue identity used for deduplication.
 */
function getIssueIdentity(issue: TranslationIssue): string {
  return [
    issue.code,
    issue.type,
    issue.file,
    issue.line ?? "",
    issue.route ?? "",
    issue.namespace ?? "",
    issue.language ?? "",
    issue.key ?? "",
  ].join("::");
}

/**
 * Removes duplicate issues from all Translation Center engines.
 */
function deduplicateIssues(
  issues: TranslationIssue[],
): TranslationIssue[] {
  const records = new Map<string, TranslationIssue>();

  for (const issue of issues) {
    const identity = getIssueIdentity(issue);

    if (!records.has(identity)) {
      records.set(identity, issue);
      continue;
    }

    const existing = records.get(identity);

    if (!existing) {
      continue;
    }

    const severityRank: Record<
      TranslationIssueSeverity,
      number
    > = {
      info: 1,
      warning: 2,
      error: 3,
      critical: 4,
    };

    if (
      severityRank[issue.severity] >
      severityRank[existing.severity]
    ) {
      records.set(identity, issue);
    }
  }

  return sortBySeverity([...records.values()]);
}

/**
 * Returns issues associated with one route.
 */
function getIssuesForRoute(
  issues: TranslationIssue[],
  route: string,
  sourceFiles: string[],
): TranslationIssue[] {
  const sourceFileSet = new Set(sourceFiles);

  return issues.filter(
    (issue) =>
      issue.route === route ||
      sourceFileSet.has(issue.file),
  );
}

/**
 * Returns issues associated with one namespace.
 */
function getIssuesForNamespace(
  issues: TranslationIssue[],
  namespace: string,
): TranslationIssue[] {
  return issues.filter(
    (issue) => issue.namespace === namespace,
  );
}

/**
 * Returns the Source Intelligence status penalty.
 */
function getSourceStatusPenalty(
  status: SourceIntelligenceStatus | undefined,
): number {
  switch (status) {
    case "analysis_failed":
      return 40;

    case "non_compliant":
      return 25;

    case "action_required":
      return 10;

    case "compliant":
    default:
      return 0;
  }
}

/**
 * Calculates page compliance using route, namespace, and source data.
 */
function calculatePageCompliance(input: {
  page: TranslationPage;
  namespace: TranslationNamespace | undefined;
  sourceIntelligence: SourceIntelligenceResult;
  issues: TranslationIssue[];
}): PageComplianceResult {
  const routeReadiness =
    input.sourceIntelligence.routeReadiness.find(
      (record) => record.route === input.page.route,
    );

  const routeGraph =
    input.sourceIntelligence.dependencyGraph.routeGraphs.find(
      (record) => record.route === input.page.route,
    );

  const sourceFiles = routeGraph
    ? [
        routeGraph.entryFile,
        ...routeGraph.layoutFiles,
        ...routeGraph.directDependencies,
        ...routeGraph.transitiveDependencies,
      ]
    : [input.page.sourceFile];

  const relatedIssues = getIssuesForRoute(
    input.issues,
    input.page.route,
    uniqueValues(sourceFiles),
  );

  const blockingIssues = relatedIssues.filter(
    isBlockingIssue,
  ).length;

  const warningIssues = relatedIssues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  let score = 100;

  if (!input.page.namespace) {
    score -= 50;
  }

  if (!input.namespace) {
    score -= 35;
  } else {
    score =
      score * 0.45 +
      input.namespace.complianceScore * 0.55;
  }

  if (routeReadiness) {
    score =
      score * 0.55 +
      routeReadiness.readinessScore * 0.45;

    score -= getSourceStatusPenalty(
      routeReadiness.status,
    );
  } else {
    score -= 15;
  }

  score -= blockingIssues * 8;
  score -= warningIssues * 1.5;

  score = Math.max(
    0,
    Math.min(100, Math.round(score * 100) / 100),
  );

  const recommendations: string[] = [];

  if (!input.page.namespace) {
    recommendations.push(
      "Assign a translation namespace to this page.",
    );
  }

  if (input.page.namespace && !input.namespace) {
    recommendations.push(
      `Create the "${input.page.namespace}" namespace in every supported language.`,
    );
  }

  if (
    input.namespace &&
    input.namespace.complianceStatus !== "compliant"
  ) {
    recommendations.push(
      `Resolve all missing files, keys, invalid values, and placeholder problems in "${input.namespace}".`,
    );
  }

  if (
    routeReadiness &&
    routeReadiness.hardcodedTextCount > 0
  ) {
    recommendations.push(
      `Replace ${routeReadiness.hardcodedTextCount} hardcoded text occurrence${
        routeReadiness.hardcodedTextCount === 1
          ? ""
          : "s"
      } affecting this route.`,
    );
  }

  if (
    routeReadiness &&
    routeReadiness.dynamicTranslationKeyCount > 0
  ) {
    recommendations.push(
      "Review all dynamically constructed translation keys affecting this route.",
    );
  }

  return {
    pageId: input.page.id,
    route: input.page.route,
    namespace: input.page.namespace,
    score,
    status: determineComplianceStatus(score),
    blockingIssues,
    warningIssues,
    recommendations,
  };
}

/**
 * Calculates compliance for one namespace.
 */
function calculateNamespaceCompliance(input: {
  namespace: TranslationNamespace;
  sourceIntelligence: SourceIntelligenceResult;
  issues: TranslationIssue[];
}): NamespaceComplianceResult {
  const sourceHealth =
    input.sourceIntelligence.namespaceHealth.find(
      (record) =>
        record.namespace === input.namespace.namespace,
    );

  const relatedIssues = getIssuesForNamespace(
    input.issues,
    input.namespace.namespace,
  );

  const blockingIssues = relatedIssues.filter(
    isBlockingIssue,
  ).length;

  const warningIssues = relatedIssues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  const missingFiles = IBOS_ENABLED_LANGUAGES.filter(
    (language) =>
      !input.namespace.languages[language].fileExists,
  ).length;

  const missingKeys = IBOS_ENABLED_LANGUAGES.reduce(
    (sum, language) =>
      sum +
      input.namespace.languages[language].missingKeys,
    0,
  );

  const invalidKeys = IBOS_ENABLED_LANGUAGES.reduce(
    (sum, language) =>
      sum +
      input.namespace.languages[language].invalidKeys,
    0,
  );

  let score = input.namespace.complianceScore;

  if (sourceHealth) {
    score =
      score * 0.7 +
      sourceHealth.readinessScore * 0.3;

    score -= getSourceStatusPenalty(sourceHealth.status);
  }

  score -= missingFiles * 8;
  score -= Math.min(missingKeys, 20) * 1.5;
  score -= invalidKeys * 5;
  score -= blockingIssues * 5;
  score -= warningIssues;

  score = Math.max(
    0,
    Math.min(100, Math.round(score * 100) / 100),
  );

  const recommendations: string[] = [];

  if (missingFiles > 0) {
    recommendations.push(
      `Create ${missingFiles} missing language file${
        missingFiles === 1 ? "" : "s"
      }.`,
    );
  }

  if (missingKeys > 0) {
    recommendations.push(
      `Add ${missingKeys} missing translation key${
        missingKeys === 1 ? "" : "s"
      }.`,
    );
  }

  if (invalidKeys > 0) {
    recommendations.push(
      `Correct ${invalidKeys} invalid translation value${
        invalidKeys === 1 ? "" : "s"
      }.`,
    );
  }

  if (sourceHealth?.hardcodedTextCount) {
    recommendations.push(
      `Convert ${sourceHealth.hardcodedTextCount} hardcoded text occurrence${
        sourceHealth.hardcodedTextCount === 1 ? "" : "s"
      } into "${input.namespace.namespace}" namespace keys.`,
    );
  }

  return {
    namespaceId: input.namespace.id,
    namespace: input.namespace.namespace,
    score,
    status: determineComplianceStatus(score),
    blockingIssues,
    warningIssues,
    recommendations,
  };
}

/**
 * Applies compliance results to page records.
 */
function updatePages(
  pages: TranslationPage[],
  results: PageComplianceResult[],
): TranslationPage[] {
  const resultMap = new Map(
    results.map((result) => [result.pageId, result]),
  );

  return pages.map((page) => {
    const result = resultMap.get(page.id);

    if (!result) {
      return page;
    }

    return {
      ...page,
      complianceScore: result.score,
      complianceStatus: result.status,
      lastScannedAt: nowIso(),
    };
  });
}

/**
 * Applies compliance results to namespace records.
 */
function updateNamespaces(
  namespaces: TranslationNamespace[],
  results: NamespaceComplianceResult[],
): TranslationNamespace[] {
  const resultMap = new Map(
    results.map((result) => [
      result.namespaceId,
      result,
    ]),
  );

  return namespaces.map((namespace) => {
    const result = resultMap.get(namespace.id);

    if (!result) {
      return namespace;
    }

    return {
      ...namespace,
      complianceScore: result.score,
      complianceStatus: result.status,
      lastValidatedAt: nowIso(),
    };
  });
}

/**
 * Creates a translation queue item from one issue.
 */
function createQueueItemFromIssue(
  issue: TranslationIssue,
  existingQueue: TranslationQueueItem[],
): TranslationQueueItem {
  const existing = existingQueue.find(
    (queueItem) =>
      queueItem.file === issue.file &&
      queueItem.namespace === issue.namespace &&
      queueItem.key === issue.key &&
      queueItem.language === issue.language &&
      queueItem.status !== "completed",
  );

  if (existing) {
    return {
      ...existing,
      updatedAt: nowIso(),
    };
  }

  let type: TranslationQueueItem["type"] =
    "resolve_compliance_issue";

  if (issue.type === "missing_namespace") {
    type = "create_namespace";
  } else if (
    issue.type === "missing_file" ||
    issue.type === "missing_key"
  ) {
    type = "translate_namespace";
  } else if (issue.type === "hardcoded_text") {
    type = "replace_hardcoded_text";
  } else if (
    issue.type === "placeholder_mismatch" ||
    issue.type === "invalid_json"
  ) {
    type = "review_translation";
  }

  const priority: TranslationQueueItem["priority"] =
    issue.severity === "critical"
      ? "critical"
      : issue.severity === "error"
        ? "high"
        : issue.severity === "warning"
          ? "medium"
          : "low";

  const timestamp = nowIso();

  return {
    id: createStableId(
      "translation-queue-item",
      issue.code,
      issue.file,
      issue.namespace,
      issue.language,
      issue.key,
    ),
    priority,
    type,
    namespace: issue.namespace,
    key: issue.key,
    language: issue.language,
    route: issue.route,
    file: issue.file,
    title: issue.message,
    description:
      issue.recommendation ??
      "Review and resolve this Translation Center issue.",
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Builds the current enterprise translation queue.
 */
function buildTranslationQueue(
  issues: TranslationIssue[],
  existingQueue: TranslationQueueItem[],
): TranslationQueueItem[] {
  const unresolvedIssues = issues.filter(
    (issue) => !issue.resolved,
  );

  const generated = unresolvedIssues.map((issue) =>
    createQueueItemFromIssue(issue, existingQueue),
  );

  const completedExisting = existingQueue.filter(
    (item) => item.status === "completed",
  );

  const queue = [...generated, ...completedExisting];

  const priorityRank: Record<
    TranslationQueueItem["priority"],
    number
  > = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return queue.sort((first, second) => {
    const priorityDifference =
      priorityRank[second.priority] -
      priorityRank[first.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return first.createdAt.localeCompare(second.createdAt);
  });
}

/**
 * Counts unique translation keys from the namespace registry.
 */
function countTranslationKeys(
  namespaces: TranslationNamespace[],
): number {
  return namespaces.reduce(
    (sum, namespace) =>
      sum + namespace.totalMasterKeys,
    0,
  );
}

/**
 * Creates complete Translation Center statistics.
 */
function createTranslationStatistics(input: {
  pages: TranslationPage[];
  namespaces: TranslationNamespace[];
  sourceIntelligence: SourceIntelligenceResult;
  issues: TranslationIssue[];
}): TranslationStatistics {
  const totalTranslationKeys =
    countTranslationKeys(input.namespaces);

  const missingKeys = input.namespaces.reduce(
    (sum, namespace) =>
      sum +
      IBOS_ENABLED_LANGUAGES.reduce(
        (languageSum, language) =>
          languageSum +
          namespace.languages[language].missingKeys,
        0,
      ),
    0,
  );

  const obsoleteKeys = input.namespaces.reduce(
    (sum, namespace) =>
      sum +
      IBOS_ENABLED_LANGUAGES.reduce(
        (languageSum, language) =>
          languageSum +
          namespace.languages[language].obsoleteKeys,
        0,
      ),
    0,
  );

  const invalidKeys = input.namespaces.reduce(
    (sum, namespace) =>
      sum +
      IBOS_ENABLED_LANGUAGES.reduce(
        (languageSum, language) =>
          languageSum +
          namespace.languages[language].invalidKeys,
        0,
      ),
    0,
  );

  const translatedKeys = input.namespaces.reduce(
    (sum, namespace) =>
      sum +
      IBOS_ENABLED_LANGUAGES.reduce(
        (languageSum, language) =>
          languageSum +
          namespace.languages[language].translatedKeys,
        0,
      ),
    0,
  );

  const totalPossibleTranslations =
    totalTranslationKeys * IBOS_ENABLED_LANGUAGES.length;

  const translationCoverage =
    totalPossibleTranslations > 0
      ? Math.round(
          (translatedKeys / totalPossibleTranslations) *
            10000,
        ) / 100
      : 100;

  const averagePageScore =
    input.pages.length > 0
      ? input.pages.reduce(
          (sum, page) => sum + page.complianceScore,
          0,
        ) / input.pages.length
      : 100;

  const averageNamespaceScore =
    input.namespaces.length > 0
      ? input.namespaces.reduce(
          (sum, namespace) =>
            sum + namespace.complianceScore,
          0,
        ) / input.namespaces.length
      : 100;

  const blockingIssues = input.issues.filter(
    isBlockingIssue,
  );

  let complianceScore =
    averagePageScore * 0.45 +
    averageNamespaceScore * 0.35 +
    input.sourceIntelligence.statistics.complianceScore *
      0.2;

  complianceScore -= blockingIssues.length * 2;

  complianceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(complianceScore * 100) / 100,
    ),
  );

  const placeholderMismatches = input.issues.filter(
    (issue) =>
      issue.type === "placeholder_mismatch",
  ).length;

  const duplicateKeys = input.issues.filter(
    (issue) => issue.type === "duplicate_key",
  ).length;

  const missingNamespaces = input.pages.filter(
    (page) =>
      !page.namespace ||
      !input.namespaces.some(
        (namespace) =>
          namespace.namespace === page.namespace,
      ),
  ).length;

  const deploymentReady =
    complianceScore >=
      IBOS_COMPLIANCE_THRESHOLDS.deploymentCertificationScore &&
    blockingIssues.length === 0 &&
    missingNamespaces <=
      IBOS_COMPLIANCE_THRESHOLDS.maximumMissingNamespaces &&
    missingKeys <=
      IBOS_COMPLIANCE_THRESHOLDS.maximumMissingKeys &&
    input.sourceIntelligence.statistics
      .hardcodedTextOccurrences <=
      IBOS_COMPLIANCE_THRESHOLDS.maximumHardcodedTexts &&
    placeholderMismatches <=
      IBOS_COMPLIANCE_THRESHOLDS
        .maximumPlaceholderMismatches;

  return {
    totalPages: input.pages.length,
    registeredPages: input.pages.length,

    compliantPages: input.pages.filter(
      (page) =>
        page.complianceStatus === "compliant",
    ).length,

    nonCompliantPages: input.pages.filter(
      (page) =>
        page.complianceStatus !== "compliant",
    ).length,

    totalComponents:
      input.sourceIntelligence.dependencyGraph.nodes.filter(
        (node) =>
          node.kind === "component" ||
          node.kind === "form" ||
          node.kind === "dialog",
      ).length,

    scannedComponents:
      input.sourceIntelligence.fileReadiness.filter(
        (record) =>
          record.resourceType === "component" ||
          record.resourceType === "form" ||
          record.resourceType === "dialog",
      ).length,

    totalNamespaces: input.namespaces.length,

    compliantNamespaces: input.namespaces.filter(
      (namespace) =>
        namespace.complianceStatus === "compliant",
    ).length,

    missingNamespaces,

    supportedLanguages: IBOS_ENABLED_LANGUAGES.length,

    totalTranslationKeys,
    translatedKeys,
    missingKeys,
    obsoleteKeys,
    duplicateKeys,
    invalidKeys,
    placeholderMismatches,

    hardcodedTexts:
      input.sourceIntelligence.statistics
        .hardcodedTextOccurrences,

    translationCoverage,
    complianceScore,
    deploymentReady,
  };
}

/**
 * Creates enterprise recommendations.
 */
function createComplianceRecommendations(input: {
  statistics: TranslationStatistics;
  issues: TranslationIssue[];
}): string[] {
  const recommendations: string[] = [];

  if (input.statistics.missingNamespaces > 0) {
    recommendations.push(
      `Create ${input.statistics.missingNamespaces} missing namespace${
        input.statistics.missingNamespaces === 1
          ? ""
          : "s"
      }.`,
    );
  }

  if (input.statistics.missingKeys > 0) {
    recommendations.push(
      `Add ${input.statistics.missingKeys} missing translation key${
        input.statistics.missingKeys === 1 ? "" : "s"
      }.`,
    );
  }

  if (input.statistics.hardcodedTexts > 0) {
    recommendations.push(
      `Replace ${input.statistics.hardcodedTexts} hardcoded user-facing text occurrence${
        input.statistics.hardcodedTexts === 1
          ? ""
          : "s"
      }.`,
    );
  }

  if (input.statistics.placeholderMismatches > 0) {
    recommendations.push(
      `Correct ${input.statistics.placeholderMismatches} placeholder mismatch${
        input.statistics.placeholderMismatches === 1
          ? ""
          : "es"
      }.`,
    );
  }

  if (input.statistics.invalidKeys > 0) {
    recommendations.push(
      `Correct ${input.statistics.invalidKeys} invalid translation value${
        input.statistics.invalidKeys === 1 ? "" : "s"
      }.`,
    );
  }

  const blockingIssues = input.issues.filter(
    isBlockingIssue,
  ).length;

  if (blockingIssues > 0) {
    recommendations.push(
      `Resolve all ${blockingIssues} blocking compliance issue${
        blockingIssues === 1 ? "" : "s"
      } before certification.`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Translation compliance is complete. The platform is eligible for deployment certification.",
    );
  }

  return recommendations;
}

/**
 * Creates the official enterprise compliance report.
 */
function createComplianceReport(input: {
  statistics: TranslationStatistics;
  issues: TranslationIssue[];
  recommendations: string[];
}): TranslationComplianceReport {
  return {
    reportId: createStableId(
      "translation-compliance-report",
      nowIso(),
      input.statistics.complianceScore,
    ),
    platform: "EPEW-EDE-IBOS",
    generatedAt: nowIso(),
    status: determineComplianceStatus(
      input.statistics.complianceScore,
    ),
    score: input.statistics.complianceScore,
    deploymentReady:
      input.statistics.deploymentReady,
    statistics: input.statistics,
    issues: input.issues,
    recommendations: input.recommendations,
  };
}

/**
 * Creates translation deployment certification.
 */
function createCertification(input: {
  statistics: TranslationStatistics;
  issues: TranslationIssue[];
  manifestVersion: string;
  pages: TranslationPage[];
  namespaces: TranslationNamespace[];
}): TranslationCertification {
  const blockingIssues = input.issues.filter(
    isBlockingIssue,
  );

  const issued =
    input.statistics.deploymentReady &&
    blockingIssues.length === 0;

  return {
    certificationId: createStableId(
      "translation-certification",
      input.manifestVersion,
      input.statistics.complianceScore,
    ),
    platform: "EPEW-EDE-IBOS",
    issued,
    issuedAt: issued ? nowIso() : undefined,
    complianceScore:
      input.statistics.complianceScore,
    manifestVersion: input.manifestVersion,
    languages: [
      ...IBOS_ENABLED_LANGUAGES,
    ] as TranslationLanguage[],
    certifiedNamespaces: issued
      ? input.namespaces.length
      : input.namespaces.filter(
          (namespace) =>
            namespace.complianceStatus === "compliant",
        ).length,
    certifiedPages: issued
      ? input.pages.length
      : input.pages.filter(
          (page) =>
            page.complianceStatus === "compliant",
        ).length,
    blockingIssues,
  };
}

/**
 * Runs complete enterprise translation compliance validation.
 */
export function runTranslationCompliance(
  input: TranslationComplianceInput,
): TranslationComplianceEngineResult {
  const generatedAt = nowIso();
  const manifestVersion =
    input.manifestVersion ??
    `1.0.${Date.now()}`;

  const errors = uniqueValues([
    ...input.routeScan.errors,
    ...input.namespaceScan.errors,
    ...input.sourceIntelligence.errors,
  ]);

  const issues = deduplicateIssues([
    ...input.namespaceScan.issues,
    ...input.sourceIntelligence.issues,
  ]);

  const pageResults = input.routeScan.pages.map(
    (page) =>
      calculatePageCompliance({
        page,
        namespace:
          input.namespaceScan.namespaces.find(
            (namespace) =>
              namespace.namespace === page.namespace,
          ),
        sourceIntelligence:
          input.sourceIntelligence,
        issues,
      }),
  );

  const namespaceResults =
    input.namespaceScan.namespaces.map(
      (namespace) =>
        calculateNamespaceCompliance({
          namespace,
          sourceIntelligence:
            input.sourceIntelligence,
          issues,
        }),
    );

  const pages = updatePages(
    input.routeScan.pages,
    pageResults,
  );

  const namespaces = updateNamespaces(
    input.namespaceScan.namespaces,
    namespaceResults,
  );

  const queue = buildTranslationQueue(
    issues,
    input.existingQueue ?? [],
  );

  const statistics = createTranslationStatistics({
    pages,
    namespaces,
    sourceIntelligence:
      input.sourceIntelligence,
    issues,
  });

  const recommendations =
    createComplianceRecommendations({
      statistics,
      issues,
    });

  const report = createComplianceReport({
    statistics,
    issues,
    recommendations,
  });

  const certification = createCertification({
    statistics,
    issues,
    manifestVersion,
    pages,
    namespaces,
  });

  const manifest: TranslationManifest = {
    manifestId: createStableId(
      "translation-manifest",
      manifestVersion,
      generatedAt,
    ),
    platform: "EPEW-EDE-IBOS",
    service: IBOS_TRANSLATION_SERVICE,
    version: manifestVersion,
    masterLanguage: "en",
    supportedLanguages: [
      ...IBOS_ENABLED_LANGUAGES,
    ],
    generatedAt,

    routes: input.routeScan.routes,
    pages,
    resources:
      input.sourceIntelligence.sourceResources,
    namespaces,
    keys: input.namespaceScan.keys,
    queue,
    issues,

    statistics,
    compliance: report,
  };

  return {
    success:
      errors.length === 0 &&
      issues.filter(isBlockingIssue).length === 0,

    complianceId: createStableId(
      "translation-compliance",
      manifestVersion,
      generatedAt,
    ),

    platform: "EPEW-EDE-IBOS",
    engine: "TRANSLATION_COMPLIANCE_ENGINE",
    version:
      IBOS_TRANSLATION_COMPLIANCE_VERSION,

    generatedAt,

    pages,
    namespaces,

    pageResults,
    namespaceResults,

    issues,
    queue,

    statistics,
    report,
    certification,

    manifest,

    errors,
  };
}

/**
 * Returns only compliance-blocking issues.
 */
export function getComplianceBlockingIssues(
  result: TranslationComplianceEngineResult,
): TranslationIssue[] {
  return result.issues.filter(isBlockingIssue);
}

/**
 * Returns pages requiring action.
 */
export function getPagesRequiringComplianceAction(
  result: TranslationComplianceEngineResult,
): TranslationPage[] {
  return result.pages.filter(
    (page) =>
      page.complianceStatus !== "compliant",
  );
}

/**
 * Returns namespaces requiring action.
 */
export function getNamespacesRequiringComplianceAction(
  result: TranslationComplianceEngineResult,
): TranslationNamespace[] {
  return result.namespaces.filter(
    (namespace) =>
      namespace.complianceStatus !== "compliant",
  );
}

/**
 * Returns queue items for one language.
 */
export function getQueueItemsForLanguage(
  result: TranslationComplianceEngineResult,
  language: TranslationLanguage,
): TranslationQueueItem[] {
  return result.queue.filter(
    (item) =>
      item.language === language,
  );
}

/**
 * Returns queue items for one namespace.
 */
export function getQueueItemsForNamespace(
  result: TranslationComplianceEngineResult,
  namespace: string,
): TranslationQueueItem[] {
  return result.queue.filter(
    (item) =>
      item.namespace === namespace,
  );
}

/**
 * Returns whether the platform has passed translation certification.
 */
export function isTranslationCertified(
  result: TranslationComplianceEngineResult,
): boolean {
  return result.certification.issued;
}