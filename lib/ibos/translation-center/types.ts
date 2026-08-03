/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * IBOS Enterprise Translation Service
 * Shared Types
 * Version: 1.0.0
 * ============================================================
 */

/**
 * Languages officially supported by the EPEW-EDE-IBOS
 * multilingual architecture.
 *
 * English is the master language and source of truth.
 */
export const IBOS_TRANSLATION_LANGUAGES = [
  "en",
  "ht",
  "fr",
  "es",
] as const;

export type TranslationLanguage =
  (typeof IBOS_TRANSLATION_LANGUAGES)[number];

/**
 * Official language metadata used by the Translation Center,
 * dashboard, scanner, validator, and build engine.
 */
export interface TranslationLanguageDefinition {
  code: TranslationLanguage;
  name: string;
  nativeName: string;
  isMaster: boolean;
  enabled: boolean;
}

/**
 * Operational status of a translation resource.
 */
export type TranslationStatus =
  | "complete"
  | "in_progress"
  | "pending_review"
  | "missing"
  | "invalid"
  | "error";

/**
 * Overall compliance classification.
 */
export type TranslationComplianceStatus =
  | "compliant"
  | "action_required"
  | "non_compliant";

/**
 * Severity assigned to a translation issue.
 */
export type TranslationIssueSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

/**
 * Types of source resources discovered by the scanner.
 */
export type TranslationResourceType =
  | "page"
  | "layout"
  | "template"
  | "component"
  | "form"
  | "dialog"
  | "notification"
  | "email"
  | "sms"
  | "whatsapp"
  | "document"
  | "api_response"
  | "enterprise_engine"
  | "unknown";

/**
 * Translation Center service identity registered with IBOS.
 */
export interface IBOSTranslationServiceIdentity {
  serviceId: string;
  serviceName: string;
  serviceCode: "IBOS_TRANSLATION_CENTER";
  version: string;
  platform: "EPEW-EDE-IBOS";
  enabled: boolean;
  registered: boolean;
}

/**
 * Language status for a specific page or namespace.
 */
export interface TranslationLanguageStatus {
  language: TranslationLanguage;
  status: TranslationStatus;
  fileExists: boolean;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: number;
  obsoleteKeys: number;
  invalidKeys: number;
  coveragePercentage: number;
}

/**
 * A route discovered from the Next.js App Router.
 */
export interface TranslationRoute {
  id: string;
  route: string;
  title: string;
  sourceFile: string;
  namespace: string | null;
  isDynamic: boolean;
  isPublic: boolean;
  requiresAuthentication: boolean;
  portal: string | null;
  discoveredAt: string;
}

/**
 * A page registered with the Translation Center.
 */
export interface TranslationPage {
  id: string;
  route: string;
  title: string;
  namespace: string | null;
  sourceFile: string;
  resourceType: TranslationResourceType;
  languages: Record<
    TranslationLanguage,
    TranslationLanguageStatus
  >;
  complianceStatus: TranslationComplianceStatus;
  complianceScore: number;
  registeredAt: string;
  lastScannedAt: string;
}

/**
 * Translation namespace discovered in the master-language folder.
 */
export interface TranslationNamespace {
  id: string;
  namespace: string;
  masterLanguage: TranslationLanguage;
  masterFile: string | null;
  languageFiles: Partial<
    Record<TranslationLanguage, string>
  >;
  totalMasterKeys: number;
  languages: Record<
    TranslationLanguage,
    TranslationLanguageStatus
  >;
  complianceStatus: TranslationComplianceStatus;
  complianceScore: number;
  discoveredAt: string;
  lastValidatedAt: string;
}

/**
 * Translation key registered from a JSON namespace.
 */
export interface TranslationKey {
  id: string;
  namespace: string;
  key: string;
  fullPath: string;
  masterValue: string;
  placeholders: string[];
  translations: Partial<
    Record<TranslationLanguage, string>
  >;
  status: Record<
    TranslationLanguage,
    TranslationStatus
  >;
}

/**
 * A source file discovered during project scanning.
 */
export interface TranslationSourceResource {
  id: string;
  type: TranslationResourceType;
  file: string;
  route: string | null;
  namespace: string | null;
  importedComponents: string[];
  translationKeys: string[];
  hardcodedTextCount: number;
  scannedAt: string;
}

/**
 * General issue detected by the scanner or validator.
 */
export interface TranslationIssue {
  id: string;
  code: string;
  severity: TranslationIssueSeverity;
  type:
    | "missing_namespace"
    | "missing_file"
    | "missing_key"
    | "obsolete_key"
    | "duplicate_key"
    | "invalid_json"
    | "placeholder_mismatch"
    | "hardcoded_text"
    | "unregistered_page"
    | "unmapped_component"
    | "configuration_error";
  file: string;
  line?: number;
  route?: string;
  namespace?: string;
  key?: string;
  language?: TranslationLanguage;
  message: string;
  recommendation?: string;
  resolved: boolean;
  detectedAt: string;
  resolvedAt?: string;
}

/**
 * Hardcoded user-facing text found in source code.
 */
export interface HardcodedTextIssue {
  id: string;
  file: string;
  line: number;
  column?: number;
  text: string;
  route?: string;
  component?: string;
  suggestedNamespace: string;
  suggestedKey: string;
  severity: TranslationIssueSeverity;
  resolved: boolean;
  detectedAt: string;
}

/**
 * Translation work item created automatically by the system.
 */
export interface TranslationQueueItem {
  id: string;
  priority: "low" | "medium" | "high" | "critical";
  type:
    | "translate_namespace"
    | "translate_key"
    | "create_namespace"
    | "review_translation"
    | "replace_hardcoded_text"
    | "resolve_compliance_issue";
  namespace?: string;
  key?: string;
  language?: TranslationLanguage;
  route?: string;
  file?: string;
  title: string;
  description: string;
  status:
    | "pending"
    | "processing"
    | "review_required"
    | "completed"
    | "failed";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Statistics displayed by the Translation Center dashboard.
 */
export interface TranslationStatistics {
  totalPages: number;
  registeredPages: number;
  compliantPages: number;
  nonCompliantPages: number;

  totalComponents: number;
  scannedComponents: number;

  totalNamespaces: number;
  compliantNamespaces: number;
  missingNamespaces: number;

  supportedLanguages: number;
  totalTranslationKeys: number;
  translatedKeys: number;
  missingKeys: number;
  obsoleteKeys: number;
  duplicateKeys: number;
  invalidKeys: number;
  placeholderMismatches: number;
  hardcodedTexts: number;

  translationCoverage: number;
  complianceScore: number;
  deploymentReady: boolean;
}

/**
 * Translation compliance report for the entire platform.
 */
export interface TranslationComplianceReport {
  reportId: string;
  platform: "EPEW-EDE-IBOS";
  generatedAt: string;
  status: TranslationComplianceStatus;
  score: number;
  deploymentReady: boolean;
  statistics: TranslationStatistics;
  issues: TranslationIssue[];
  recommendations: string[];
}

/**
 * Complete manifest generated by the Translation Center.
 */
export interface TranslationManifest {
  manifestId: string;
  platform: "EPEW-EDE-IBOS";
  service: IBOSTranslationServiceIdentity;
  version: string;
  masterLanguage: TranslationLanguage;
  supportedLanguages: TranslationLanguage[];
  generatedAt: string;

  routes: TranslationRoute[];
  pages: TranslationPage[];
  resources: TranslationSourceResource[];
  namespaces: TranslationNamespace[];
  keys: TranslationKey[];
  queue: TranslationQueueItem[];
  issues: TranslationIssue[];

  statistics: TranslationStatistics;
  compliance: TranslationComplianceReport;
}

/**
 * Result returned after a project scan.
 */
export interface TranslationScanResult {
  success: boolean;
  scanId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  manifest: TranslationManifest;
  errors: string[];
}

/**
 * Result returned after translation validation.
 */
export interface TranslationValidationResult {
  success: boolean;
  validatedAt: string;
  namespacesValidated: number;
  keysValidated: number;
  issues: TranslationIssue[];
  compliance: TranslationComplianceReport;
}

/**
 * Result returned by the Translation Build Engine.
 */
export interface TranslationBuildResult {
  success: boolean;
  buildId: string;
  startedAt: string;
  completedAt: string;
  generatedFiles: string[];
  updatedFiles: string[];
  skippedFiles: string[];
  queueItemsCreated: number;
  errors: string[];
}

/**
 * Translation deployment certification.
 */
export interface TranslationCertification {
  certificationId: string;
  platform: "EPEW-EDE-IBOS";
  issued: boolean;
  issuedAt?: string;
  complianceScore: number;
  manifestVersion: string;
  languages: TranslationLanguage[];
  certifiedNamespaces: number;
  certifiedPages: number;
  blockingIssues: TranslationIssue[];
}