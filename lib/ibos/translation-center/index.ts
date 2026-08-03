/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Public IBOS Export Registry
 * Version: 1.0.0
 * ============================================================
 */

/**
 * Main Translation Center
 */
export {
  buildTranslationCenter,
  certifyTranslationCenter,
  getPendingTranslationWork,
  getPriorityTranslationWork,
  runTranslationCenter,
  scanTranslationCenter,
  translationCenterPassed,
  validateTranslationCenter,
} from "./translation-center";

export type {
  TranslationCenterExecutionMode,
  TranslationCenterExecutionStatus,
  TranslationCenterExecutionSummary,
  TranslationCenterOptions,
  TranslationCenterPhaseTiming,
  TranslationCenterResult,
} from "./translation-center";

/**
 * File Scanner
 */
export {
  discoveredFilesToSourceResources,
  isFrameworkTranslationFile,
  scanApplicationPages,
  scanProjectFiles,
  scanTranslationMessageFiles,
} from "./file-scanner";

export type {
  DiscoveredProjectFile,
  ProjectFileScannerOptions,
  ProjectFileScanResult,
} from "./file-scanner";

/**
 * Route Scanner
 */
export {
  calculatePageRegistryCoverage,
  findPageByNamespace,
  findRouteByPath,
  getNonCompliantPages,
  getRegisteredRouteNamespaces,
  getRoutesByPortal,
  scanRoutes,
  scanRoutesFromProjectFiles,
} from "./route-scanner";

export type {
  RouteScanResult,
  RouteScannerOptions,
} from "./route-scanner";

/**
 * Namespace Scanner
 */
export {
  calculateLanguageCoverage,
  findNamespace,
  getKeysForNamespace,
  getNamespaceNames,
  getNamespacesWithMissingFiles,
  scanNamespaces,
  scanNamespacesFromFiles,
} from "./namespace-scanner";

export type {
  DiscoveredNamespaceFile,
  NamespaceScanResult,
  NamespaceScannerOptions,
} from "./namespace-scanner";

/**
 * Source Intelligence Engine
 */
export * from "./source-intelligence";

/**
 * Compliance Engine
 */
export {
  getComplianceBlockingIssues,
  getNamespacesRequiringComplianceAction,
  getPagesRequiringComplianceAction,
  getQueueItemsForLanguage,
  getQueueItemsForNamespace,
  isTranslationCertified,
  runTranslationCompliance,
} from "./compliance-engine";

export type {
  NamespaceComplianceResult,
  PageComplianceResult,
  TranslationComplianceEngineResult,
  TranslationComplianceInput,
} from "./compliance-engine";

/**
 * Manifest Manager
 */
export {
  clearTranslationArtifacts,
  getTranslationArtifactPaths,
  loadTranslationArtifacts,
  loadTranslationCertification,
  loadTranslationManifest,
  loadTranslationQueue,
  saveTranslationArtifacts,
} from "./manifest-manager";

export type {
  TranslationArtifactLoadResult,
  TranslationArtifactType,
  TranslationArtifactWriteRecord,
  TranslationArtifactWriteResult,
  TranslationManifestManagerOptions,
} from "./manifest-manager";

/**
 * Configuration
 */
export {
  IBOS_BUILD_ENGINE_CONFIG,
  IBOS_COMPLIANCE_THRESHOLDS,
  IBOS_DYNAMIC_ROUTE_PATTERNS,
  IBOS_ENABLED_LANGUAGES,
  IBOS_EXCLUDED_DIRECTORIES,
  IBOS_EXCLUDED_FILE_PATTERNS,
  IBOS_IGNORED_ROUTE_SEGMENTS,
  IBOS_LANGUAGE_DEFINITIONS,
  IBOS_MASTER_LANGUAGE,
  IBOS_MONITORED_FILE_NAMES,
  IBOS_MONITORED_RESOURCE_TYPES,
  IBOS_NAMESPACE_RULES,
  IBOS_PORTAL_ROUTE_SEGMENTS,
  IBOS_ROUTE_FILE_NAMES,
  IBOS_SCANNABLE_EXTENSIONS,
  IBOS_SCANNER_CONFIG,
  IBOS_TRANSLATION_CENTER_CONFIG,
  IBOS_TRANSLATION_FUNCTION_NAMES,
  IBOS_TRANSLATION_OUTPUT_FILES,
  IBOS_TRANSLATION_PATHS,
  IBOS_TRANSLATION_PRIORITY_RULES,
  IBOS_TRANSLATION_RUNTIME_NAMES,
  IBOS_TRANSLATION_SERVICE,
  IBOS_WATCHER_CONFIG,
} from "./config";

export type {
  IBOSTranslationCenterConfig,
} from "./config";

/**
 * Shared Types
 */
export type {
  HardcodedTextIssue,
  IBOSTranslationServiceIdentity,
  TranslationBuildResult,
  TranslationCertification,
  TranslationComplianceReport,
  TranslationComplianceStatus,
  TranslationIssue,
  TranslationIssueSeverity,
  TranslationKey,
  TranslationLanguage,
  TranslationLanguageDefinition,
  TranslationLanguageStatus,
  TranslationManifest,
  TranslationNamespace,
  TranslationPage,
  TranslationQueueItem,
  TranslationResourceType,
  TranslationRoute,
  TranslationScanResult,
  TranslationSourceResource,
  TranslationStatistics,
  TranslationStatus,
  TranslationValidationResult,
} from "./types";

/**
 * Shared Utilities
 */
export {
  appearsUserFacingText,
  calculatePercentage,
  clamp,
  cloneTranslationJson,
  createStableId,
  determineComplianceStatus,
  determineTranslationStatus,
  escapeRegExp,
  extractPlaceholders,
  flattenTranslationObject,
  formatJson,
  getDynamicRouteParameter,
  getLineAndColumn,
  getMissingTranslationKeys,
  getObsoleteTranslationKeys,
  getPortalFromRoute,
  getSeverityRank,
  getTranslationKeys,
  getValueByKeyPath,
  isDynamicRoute,
  isDynamicRouteSegment,
  isExcludedDirectory,
  isExcludedFile,
  isInterceptedRouteSegment,
  isMasterLanguage,
  isMissingTranslationValue,
  isParallelRouteSegment,
  isPublicRoute,
  isRouteGroupSegment,
  isScannableFile,
  isValidNamespace,
  namespaceToFileName,
  normalizePath,
  nowIso,
  pageFileToRoute,
  placeholdersMatch,
  removeFileExtension,
  routeRequiresAuthentication,
  routeToNamespace,
  routeToTitle,
  safeParseJson,
  shouldIgnoreRouteSegment,
  shouldScanFile,
  sortBySeverity,
  stripSourceComments,
  synchronizeTranslationStructure,
  toKebabCase,
  toProjectRelativePath,
  toTitleCase,
  uniqueValues,
} from "./utils";

export type {
  FlattenedTranslationRecord,
  TranslationJsonObject,
  TranslationJsonValue,
} from "./utils";