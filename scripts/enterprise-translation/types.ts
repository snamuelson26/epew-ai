export type SupportedLocale = "en" | "ht" | "fr" | "es";

export type HardcodedTextType =
  | "jsx-text"
  | "jsx-expression"
  | "jsx-attribute"
  | "metadata"
  | "unknown";

export interface TranslationScannerConfig {
  projectRoot: string;

  appDirectory: string;

  componentDirectories: string[];

  messagesDirectory: string;

  outputDirectory: string;

  supportedLocales: SupportedLocale[];

  excludedDirectories: string[];

  excludedRoutePrefixes: string[];

  visibleAttributes: string[];

  translationFunctionNames: string[];

  namespaceHookNames: string[];
}

export interface SourceLocation {
  line: number;
  column: number;
}

export interface HardcodedTextIssue {
  file: string;

  route: string | null;

  type: HardcodedTextType;

  text: string;

  location: SourceLocation;

  element?: string;

  attribute?: string;

  severity: "warning" | "error";
}

export interface TranslationKeyUsage {
  file: string;

  route: string | null;

  namespace: string | null;

  key: string;

  location: SourceLocation;
}

export interface NamespaceUsage {
  file: string;

  route: string | null;

  namespace: string;

  location: SourceLocation;
}

export interface TranslationNamespaceFile {
  locale: SupportedLocale;

  namespace: string;

  file: string;

  keyCount: number;

  keys: string[];

  validJson: boolean;

  error?: string;
}

export interface RouteInventoryItem {
  route: string;

  namespace: string;

  pageFile: string;

  sourceFiles: string[];

  detectedNamespaces: string[];

  translationKeysUsed: string[];

  hardcodedTextCount: number;

  missingLocaleFiles: SupportedLocale[];

  complianceScore: number;

  status: "compliant" | "review-required" | "non-compliant";
}

export interface ProjectStatistics {
  pagesDiscovered: number;

  sourceFilesScanned: number;

  componentFilesScanned: number;

  namespacesDiscovered: number;

  translationFilesDiscovered: number;

  translationKeysDefined: number;

  translationKeysUsed: number;

  hardcodedTextIssues: number;

  missingLanguageFiles: number;

  invalidJsonFiles: number;

  overallComplianceScore: number;
}

export interface TranslationManifest {
  schemaVersion: "1.0";

  project: {
    name: string;

    root: string;

    generatedAt: string;

    scannerVersion: string;
  };

  languages: SupportedLocale[];

  statistics: ProjectStatistics;

  routes: RouteInventoryItem[];

  namespaces: TranslationNamespaceFile[];

  hardcodedText: HardcodedTextIssue[];

  translationKeyUsage: TranslationKeyUsage[];

  namespaceUsage: NamespaceUsage[];

  warnings: string[];
}