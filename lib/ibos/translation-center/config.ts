/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * IBOS Enterprise Translation Service
 * Configuration
 * Version: 1.0.0
 * ============================================================
 */

import type {
  IBOSTranslationServiceIdentity,
  TranslationLanguage,
  TranslationLanguageDefinition,
  TranslationResourceType,
} from "./types";

/**
 * Official IBOS Translation Center service identity.
 */
export const IBOS_TRANSLATION_SERVICE: IBOSTranslationServiceIdentity = {
  serviceId: "ibos-translation-center",
  serviceName: "Enterprise Translation Center",
  serviceCode: "IBOS_TRANSLATION_CENTER",
  version: "1.0.0",
  platform: "EPEW-EDE-IBOS",
  enabled: true,
  registered: true,
};

/**
 * English is the master language and source of truth.
 */
export const IBOS_MASTER_LANGUAGE: TranslationLanguage = "en";

/**
 * Languages officially supported by EPEW-EDE-IBOS.
 */
export const IBOS_LANGUAGE_DEFINITIONS: TranslationLanguageDefinition[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    isMaster: true,
    enabled: true,
  },
  {
    code: "ht",
    name: "Haitian Creole",
    nativeName: "Kreyòl Ayisyen",
    isMaster: false,
    enabled: true,
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    isMaster: false,
    enabled: true,
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    isMaster: false,
    enabled: true,
  },
];

/**
 * Enabled languages used by the scanner, validator,
 * build engine, compliance engine, and dashboard.
 */
export const IBOS_ENABLED_LANGUAGES: TranslationLanguage[] =
  IBOS_LANGUAGE_DEFINITIONS.filter((language) => language.enabled).map(
    (language) => language.code,
  );

/**
 * Root folders used by the Translation Center.
 */
export const IBOS_TRANSLATION_PATHS = {
  appRoot: "app",
  componentRoots: ["app/components"],
  enterpriseRoot: "lib/enterprise",
  messageRoot: "app/messages",
  masterMessageRoot: "app/messages/en",
  manifestRoot: "data/enterprise/ibos/translation-center",
  generatedRoot: "data/enterprise/ibos/translation-center/generated",
  reportRoot: "data/enterprise/ibos/translation-center/reports",
  registryRoot: "data/enterprise/ibos/translation-center/registry",
} as const;

/**
 * Source files analyzed by the scanner.
 */
export const IBOS_SCANNABLE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
] as const;

/**
 * Files that can define Next.js application routes.
 */
export const IBOS_ROUTE_FILE_NAMES = [
  "page.tsx",
  "page.ts",
  "page.jsx",
  "page.js",
] as const;

/**
 * Next.js files monitored by the Translation Center.
 */
export const IBOS_MONITORED_FILE_NAMES = [
  ...IBOS_ROUTE_FILE_NAMES,
  "layout.tsx",
  "layout.ts",
  "layout.jsx",
  "layout.js",
  "template.tsx",
  "template.ts",
  "template.jsx",
  "template.js",
  "loading.tsx",
  "loading.ts",
  "error.tsx",
  "error.ts",
  "not-found.tsx",
  "not-found.ts",
] as const;

/**
 * Directories excluded from project scanning.
 */
export const IBOS_EXCLUDED_DIRECTORIES = [
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  "coverage",
  "dist",
  "build",
  "public",
  "logs",
  "tmp",
  "temp",
] as const;

/**
 * File patterns excluded from scanning.
 */
export const IBOS_EXCLUDED_FILE_PATTERNS = [
  ".test.",
  ".spec.",
  ".stories.",
  ".d.ts",
  ".map",
  ".min.",
] as const;

/**
 * Translation functions recognized in application code.
 */
export const IBOS_TRANSLATION_FUNCTION_NAMES = [
  "t",
  "translate",
  "translation",
  "getTranslation",
  "getMessage",
] as const;

/**
 * Translation hooks and providers recognized by the scanner.
 */
export const IBOS_TRANSLATION_RUNTIME_NAMES = [
  "useLanguage",
  "LanguageProvider",
  "TranslationEngine",
  "useTranslation",
] as const;

/**
 * Resource types actively monitored by the Translation Center.
 */
export const IBOS_MONITORED_RESOURCE_TYPES: TranslationResourceType[] = [
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
  "document",
  "api_response",
  "enterprise_engine",
];

/**
 * Folders that represent authenticated portals.
 */
export const IBOS_PORTAL_ROUTE_SEGMENTS = [
  "admin",
  "entrepreneur",
  "supporter",
  "coach",
  "partner",
] as const;

/**
 * Route groups and technical segments that must not appear
 * in public route URLs.
 */
export const IBOS_IGNORED_ROUTE_SEGMENTS = [
  "(auth)",
  "(public)",
  "(protected)",
  "(dashboard)",
  "(portal)",
  "(marketing)",
  "(enterprise)",
  "_components",
  "_lib",
  "_utils",
] as const;

/**
 * Next.js dynamic route syntax recognized by the scanner.
 */
export const IBOS_DYNAMIC_ROUTE_PATTERNS = {
  standard: /^\[(.+)\]$/,
  catchAll: /^\[\.\.\.(.+)\]$/,
  optionalCatchAll: /^\[\[\.\.\.(.+)\]\]$/,
} as const;

/**
 * Namespace naming rules.
 */
export const IBOS_NAMESPACE_RULES = {
  separator: "-",
  fileExtension: ".json",
  allowNestedNamespaces: false,
  enforceLowercase: true,
  enforceKebabCase: true,
  reservedNamespaces: [
    "common",
    "navigation",
    "footer",
    "forms",
    "errors",
    "notifications",
    "emails",
    "sms",
    "whatsapp",
    "documents",
  ],
} as const;

/**
 * Compliance thresholds.
 */
export const IBOS_COMPLIANCE_THRESHOLDS = {
  deploymentCertificationScore: 100,
  compliantScore: 100,
  actionRequiredMinimumScore: 80,
  minimumTranslationCoverage: 100,
  maximumCriticalIssues: 0,
  maximumErrors: 0,
  maximumMissingNamespaces: 0,
  maximumMissingKeys: 0,
  maximumHardcodedTexts: 0,
  maximumPlaceholderMismatches: 0,
} as const;

/**
 * Priority assigned to automatically generated translation work.
 */
export const IBOS_TRANSLATION_PRIORITY_RULES = {
  missingPageNamespace: "critical",
  missingLanguageFile: "high",
  missingKey: "high",
  placeholderMismatch: "critical",
  invalidJson: "critical",
  hardcodedPublicText: "high",
  hardcodedAuthenticatedText: "medium",
  obsoleteKey: "low",
  duplicateKey: "medium",
} as const;

/**
 * Scanner configuration.
 */
export const IBOS_SCANNER_CONFIG = {
  scanPages: true,
  scanLayouts: true,
  scanTemplates: true,
  scanComponents: true,
  scanEnterpriseEngines: true,
  scanMessageFiles: true,
  scanApiResponses: true,
  scanCommunicationTemplates: true,
  detectHardcodedText: true,
  detectTranslationKeys: true,
  detectNamespaces: true,
  detectImportedComponents: true,
  registerNewPagesAutomatically: true,
  generateManifestAfterScan: true,
  generateComplianceReportAfterScan: true,
} as const;

/**
 * Translation Build Engine configuration.
 */
export const IBOS_BUILD_ENGINE_CONFIG = {
  createMissingLanguageDirectories: true,
  createMissingNamespaceFiles: true,
  preserveExistingTranslations: true,
  preservePlaceholders: true,
  preserveJsonHierarchy: true,
  removeObsoleteKeysAutomatically: false,
  overwriteTranslatedValues: false,
  requireReviewForGeneratedTranslations: true,
  formatJsonOutput: true,
  jsonIndentation: 2,
} as const;

/**
 * Translation Watcher configuration.
 */
export const IBOS_WATCHER_CONFIG = {
  enabled: true,
  watchAppDirectory: true,
  watchComponents: true,
  watchEnterpriseModules: true,
  watchMessageFiles: true,
  rescanOnPageCreated: true,
  rescanOnPageUpdated: true,
  rescanOnComponentUpdated: true,
  rescanOnMessageUpdated: true,
  debounceMilliseconds: 750,
} as const;

/**
 * Manifest and report file names.
 */
export const IBOS_TRANSLATION_OUTPUT_FILES = {
  manifest: "translation-manifest.json",
  pageRegistry: "page-registry.json",
  namespaceRegistry: "namespace-registry.json",
  translationQueue: "translation-queue.json",
  complianceReport: "translation-compliance-report.json",
  certification: "translation-certification.json",
} as const;

/**
 * Complete Translation Center configuration.
 */
export const IBOS_TRANSLATION_CENTER_CONFIG = {
  service: IBOS_TRANSLATION_SERVICE,
  masterLanguage: IBOS_MASTER_LANGUAGE,
  languages: IBOS_LANGUAGE_DEFINITIONS,
  enabledLanguages: IBOS_ENABLED_LANGUAGES,
  paths: IBOS_TRANSLATION_PATHS,
  extensions: IBOS_SCANNABLE_EXTENSIONS,
  routeFiles: IBOS_ROUTE_FILE_NAMES,
  monitoredFiles: IBOS_MONITORED_FILE_NAMES,
  excludedDirectories: IBOS_EXCLUDED_DIRECTORIES,
  excludedFilePatterns: IBOS_EXCLUDED_FILE_PATTERNS,
  translationFunctions: IBOS_TRANSLATION_FUNCTION_NAMES,
  translationRuntimeNames: IBOS_TRANSLATION_RUNTIME_NAMES,
  resourceTypes: IBOS_MONITORED_RESOURCE_TYPES,
  portalSegments: IBOS_PORTAL_ROUTE_SEGMENTS,
  ignoredRouteSegments: IBOS_IGNORED_ROUTE_SEGMENTS,
  dynamicRoutePatterns: IBOS_DYNAMIC_ROUTE_PATTERNS,
  namespaceRules: IBOS_NAMESPACE_RULES,
  compliance: IBOS_COMPLIANCE_THRESHOLDS,
  priorities: IBOS_TRANSLATION_PRIORITY_RULES,
  scanner: IBOS_SCANNER_CONFIG,
  buildEngine: IBOS_BUILD_ENGINE_CONFIG,
  watcher: IBOS_WATCHER_CONFIG,
  outputFiles: IBOS_TRANSLATION_OUTPUT_FILES,
} as const;

export type IBOSTranslationCenterConfig =
  typeof IBOS_TRANSLATION_CENTER_CONFIG;