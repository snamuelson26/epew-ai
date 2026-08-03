/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Source Intelligence Engine
 * Public Export Registry
 * Version: 1.0.0
 * ============================================================
 */

/**
 * Import Analyzer
 */
export {
  analyzeFileImports,
  analyzeProjectImports,
  getComponentNameFromFile,
  getImportedComponentsForFile,
  getImportingFiles,
  getResolvedImportsForFile,
} from "./import-analyzer";

export type {
  FileImportAnalysis,
  ImportedComponentRecord,
  ImportAnalyzerOptions,
  ProjectImportAnalysis,
  SourceImportBinding,
  SourceImportKind,
  SourceImportRecord,
} from "./import-analyzer";

/**
 * Translation Key Analyzer
 */
export {
  analyzeFileTranslationKeys,
  analyzeProjectTranslationKeys,
  findMissingRegisteredKeys,
  findUnusedRegisteredKeys,
  getFilesUsingTranslationKey,
  getLocalKeysForNamespace,
  getTranslationKeysForFile,
  getTranslationKeysForNamespace,
  getTranslationKeysForRoute,
  getTranslationRuntimeOnlyFiles,
} from "./translation-key-analyzer";

export type {
  DynamicTranslationKeyUsage,
  FileTranslationKeyAnalysis,
  ProjectTranslationKeyAnalysis,
  TranslationKeyAnalyzerOptions,
  TranslationKeyUsage,
  TranslationNamespaceUsage,
  TranslationUsageKind,
} from "./translation-key-analyzer";

/**
 * Hardcoded Text Detector
 */
export {
  analyzeFileHardcodedText,
  analyzeProjectHardcodedText,
  createSuggestedTranslationEntries,
  getFilesWithHardcodedText,
  getHardcodedTextBySeverity,
  getHardcodedTextForFile,
  getHardcodedTextForNamespace,
  getHardcodedTextForRoute,
} from "./hardcoded-text-detector";

export type {
  FileHardcodedTextAnalysis,
  HardcodedTextDetectorOptions,
  HardcodedTextKind,
  HardcodedTextOccurrence,
  HardcodedTextReviewStatus,
  HardcodedTextSeverity,
  ProjectHardcodedTextAnalysis,
} from "./hardcoded-text-detector";

/**
 * Dependency Graph Builder
 */
export {
  buildDependencyGraph,
  calculateFileChangeImpact,
  fileDependsOn,
  findDependencyNode,
  findRouteDependencyGraph,
  getCircularDependenciesForFile,
  getComponentsForRoute,
  getDirectDependencies,
  getDirectDependents,
  getFileDependencyTree,
  getOrphanDependencyNodes,
  getRoutesUsingFile,
  getSharedDependencyNodes,
} from "./dependency-graph-builder";

export type {
  CircularDependency,
  DependencyEdgeKind,
  DependencyEdgeStrength,
  DependencyGraphBuilderOptions,
  DependencyGraphEdge,
  DependencyGraphNode,
  DependencyNodeKind,
  FileDependencyTree,
  ProjectDependencyGraph,
  RouteDependencyGraph,
} from "./dependency-graph-builder";

/**
 * Enterprise Source Analyzer
 */
export {
  analyzeDiscoveredFiles,
  analyzeProjectSource,
  findRouteReadiness,
  findSourceFileReadiness,
  findSourceNamespaceHealth,
  getBlockingSourceIssues,
  getNamespacesRequiringSourceAction,
  getNonCompliantRoutes,
  getNonCompliantSourceFiles,
  getRoutesWithHardcodedText,
} from "./source-analyzer";

export type {
  RouteTranslationReadiness,
  SourceAnalyzerOptions,
  SourceFileTranslationReadiness,
  SourceIntelligenceResult,
  SourceIntelligenceStatistics,
  SourceIntelligenceStatus,
  SourceNamespaceHealth,
} from "./source-analyzer";