/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Source Intelligence Engine
 * Import Analyzer
 * Version: 1.0.0
 * ============================================================
 */

import path from "node:path";

import type { DiscoveredProjectFile } from "../file-scanner";

import {
  createStableId,
  getLineAndColumn,
  normalizePath,
  removeFileExtension,
  toProjectRelativePath,
  uniqueValues,
} from "../utils";

/**
 * The kinds of imports recognized by the Source Intelligence Engine.
 */
export type SourceImportKind =
  | "default"
  | "named"
  | "namespace"
  | "side_effect"
  | "dynamic"
  | "require";

/**
 * One imported binding.
 *
 * Examples:
 *
 * import Hero from "@/components/Hero";
 *
 * localName: Hero
 * importedName: default
 *
 * import { Button as PrimaryButton } from "@/components/Button";
 *
 * localName: PrimaryButton
 * importedName: Button
 */
export interface SourceImportBinding {
  localName: string;
  importedName: string;
  kind: SourceImportKind;
  isTypeOnly: boolean;
}

/**
 * One import statement discovered in a source file.
 */
export interface SourceImportRecord {
  id: string;
  sourceFile: string;
  sourceModule: string;
  importKind: SourceImportKind;
  bindings: SourceImportBinding[];
  isTypeOnly: boolean;
  isRelative: boolean;
  isAlias: boolean;
  isExternal: boolean;
  isDynamic: boolean;
  isResolved: boolean;
  resolvedFile: string | null;
  line: number;
  column: number;
  rawStatement: string;
}

/**
 * Component-oriented import information.
 */
export interface ImportedComponentRecord {
  id: string;
  sourceFile: string;
  componentName: string;
  importedName: string;
  sourceModule: string;
  resolvedFile: string | null;
  isDefaultImport: boolean;
  isTypeOnly: boolean;
  line: number;
  column: number;
}

/**
 * Complete import-analysis result for one source file.
 */
export interface FileImportAnalysis {
  success: boolean;
  sourceFile: string;
  imports: SourceImportRecord[];
  importedComponents: ImportedComponentRecord[];
  resolvedFiles: string[];
  unresolvedModules: string[];
  externalModules: string[];
  errors: string[];
}

/**
 * Complete project import-analysis result.
 */
export interface ProjectImportAnalysis {
  success: boolean;
  analyzedFiles: number;
  imports: SourceImportRecord[];
  importedComponents: ImportedComponentRecord[];
  fileResults: FileImportAnalysis[];
  unresolvedModules: string[];
  externalModules: string[];
  errors: string[];
}

/**
 * Options used by the import analyzer.
 */
export interface ImportAnalyzerOptions {
  projectRoot?: string;

  /**
   * Alias map used by the application.
   *
   * The EPEW project uses:
   *
   * @/* -> project root
   */
  aliases?: Record<string, string>;

  /**
   * Extensions considered during module resolution.
   */
  extensions?: string[];

  /**
   * Files checked when an import resolves to a directory.
   */
  indexFileNames?: string[];

  /**
   * Include imports declared using require().
   */
  includeRequireCalls?: boolean;

  /**
   * Include imports declared using import().
   */
  includeDynamicImports?: boolean;

  /**
   * Include type-only imports.
   */
  includeTypeImports?: boolean;
}

/**
 * Default supported file extensions.
 */
const DEFAULT_EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
];

/**
 * Default directory index files.
 */
const DEFAULT_INDEX_FILE_NAMES = [
  "index.tsx",
  "index.ts",
  "index.jsx",
  "index.js",
  "index.mjs",
  "index.cjs",
];

/**
 * Default alias configuration.
 */
const DEFAULT_ALIASES: Record<string, string> = {
  "@/": "",
};

/**
 * Determines whether an imported module is relative.
 */
function isRelativeModule(sourceModule: string): boolean {
  return (
    sourceModule.startsWith("./") ||
    sourceModule.startsWith("../")
  );
}

/**
 * Determines whether an imported module uses a configured alias.
 */
function isAliasModule(
  sourceModule: string,
  aliases: Record<string, string>,
): boolean {
  return Object.keys(aliases).some((alias) =>
    sourceModule.startsWith(alias),
  );
}

/**
 * Determines whether an import references an external package.
 */
function isExternalModule(
  sourceModule: string,
  aliases: Record<string, string>,
): boolean {
  return (
    !isRelativeModule(sourceModule) &&
    !isAliasModule(sourceModule, aliases)
  );
}

/**
 * Removes query strings sometimes attached by bundlers.
 */
function removeModuleQuery(sourceModule: string): string {
  return sourceModule.split("?")[0] ?? sourceModule;
}

/**
 * Converts an import alias into an absolute path.
 */
function resolveAliasBasePath(
  projectRoot: string,
  sourceModule: string,
  aliases: Record<string, string>,
): string | null {
  const matchingAlias = Object.keys(aliases)
    .sort((first, second) => second.length - first.length)
    .find((alias) => sourceModule.startsWith(alias));

  if (!matchingAlias) {
    return null;
  }

  const aliasTarget = aliases[matchingAlias] ?? "";
  const remainingPath = sourceModule.slice(matchingAlias.length);

  return path.resolve(
    projectRoot,
    aliasTarget,
    remainingPath,
  );
}

/**
 * Creates possible module resolution paths.
 */
function createResolutionCandidates(
  basePath: string,
  extensions: string[],
  indexFileNames: string[],
): string[] {
  const candidates = new Set<string>();
  const currentExtension = path.extname(basePath);

  candidates.add(basePath);

  if (!currentExtension) {
    for (const extension of extensions) {
      candidates.add(`${basePath}${extension}`);
    }

    for (const indexFileName of indexFileNames) {
      candidates.add(path.join(basePath, indexFileName));
    }
  }

  return [...candidates];
}

/**
 * Resolves a module using the already discovered project files.
 *
 * No additional filesystem traversal is needed because the File Scanner
 * already registered every relevant source file.
 */
function resolveImportedModule(input: {
  projectRoot: string;
  sourceFile: string;
  sourceModule: string;
  aliases: Record<string, string>;
  extensions: string[];
  indexFileNames: string[];
  discoveredFileMap: Map<string, DiscoveredProjectFile>;
}): string | null {
  const normalizedModule = removeModuleQuery(
    input.sourceModule,
  );

  if (
    isExternalModule(
      normalizedModule,
      input.aliases,
    )
  ) {
    return null;
  }

  const sourceAbsolutePath = path.resolve(
    input.projectRoot,
    input.sourceFile,
  );

  let basePath: string | null = null;

  if (isRelativeModule(normalizedModule)) {
    basePath = path.resolve(
      path.dirname(sourceAbsolutePath),
      normalizedModule,
    );
  } else {
    basePath = resolveAliasBasePath(
      input.projectRoot,
      normalizedModule,
      input.aliases,
    );
  }

  if (!basePath) {
    return null;
  }

  const candidates = createResolutionCandidates(
    basePath,
    input.extensions,
    input.indexFileNames,
  );

  for (const candidate of candidates) {
    const relativeCandidate = normalizePath(
      toProjectRelativePath(
        input.projectRoot,
        candidate,
      ),
    );

    const discoveredFile =
      input.discoveredFileMap.get(relativeCandidate);

    if (discoveredFile) {
      return discoveredFile.relativePath;
    }
  }

  return null;
}

/**
 * Returns true when a local binding probably represents a React
 * component.
 *
 * React components normally begin with an uppercase letter.
 */
function appearsToBeComponentName(value: string): boolean {
  return /^[A-Z][A-Za-z0-9_$]*$/.test(value);
}

/**
 * Splits a comma-separated named import block.
 *
 * Example:
 *
 * Button,
 * Card as DashboardCard,
 * type DialogProps
 */
function splitNamedBindings(value: string): string[] {
  return value
    .split(",")
    .map((binding) => binding.trim())
    .filter(Boolean);
}

/**
 * Parses named import bindings.
 */
function parseNamedBindings(
  value: string,
  statementTypeOnly: boolean,
): SourceImportBinding[] {
  return splitNamedBindings(value).map((binding) => {
    const bindingTypeOnly = binding.startsWith("type ");
    const cleanedBinding = binding.replace(/^type\s+/, "").trim();

    const [
      importedName,
      possibleLocalName,
    ] = cleanedBinding
      .split(/\s+as\s+/i)
      .map((part) => part.trim());

    return {
      localName:
        possibleLocalName ||
        importedName ||
        "",
      importedName:
        importedName || "",
      kind: "named",
      isTypeOnly:
        statementTypeOnly || bindingTypeOnly,
    };
  });
}

/**
 * Parses the binding section from a static import.
 */
function parseStaticImportBindings(
  bindingText: string,
  statementTypeOnly: boolean,
): {
  importKind: SourceImportKind;
  bindings: SourceImportBinding[];
} {
  const cleaned = bindingText.trim();

  if (!cleaned) {
    return {
      importKind: "side_effect",
      bindings: [],
    };
  }

  if (cleaned.startsWith("*")) {
    const namespaceMatch = cleaned.match(
      /^\*\s+as\s+([A-Za-z_$][\w$]*)$/,
    );

    const localName = namespaceMatch?.[1] ?? cleaned;

    return {
      importKind: "namespace",
      bindings: [
        {
          localName,
          importedName: "*",
          kind: "namespace",
          isTypeOnly: statementTypeOnly,
        },
      ],
    };
  }

  if (cleaned.startsWith("{")) {
    const namedContent = cleaned
      .replace(/^\{/, "")
      .replace(/\}$/, "");

    return {
      importKind: "named",
      bindings: parseNamedBindings(
        namedContent,
        statementTypeOnly,
      ),
    };
  }

  const commaIndex = cleaned.indexOf(",");

  if (commaIndex === -1) {
    return {
      importKind: "default",
      bindings: [
        {
          localName: cleaned,
          importedName: "default",
          kind: "default",
          isTypeOnly: statementTypeOnly,
        },
      ],
    };
  }

  const defaultBinding = cleaned
    .slice(0, commaIndex)
    .trim();

  const remainingBindings = cleaned
    .slice(commaIndex + 1)
    .trim();

  const bindings: SourceImportBinding[] = [
    {
      localName: defaultBinding,
      importedName: "default",
      kind: "default",
      isTypeOnly: statementTypeOnly,
    },
  ];

  if (remainingBindings.startsWith("{")) {
    const namedContent = remainingBindings
      .replace(/^\{/, "")
      .replace(/\}$/, "");

    bindings.push(
      ...parseNamedBindings(
        namedContent,
        statementTypeOnly,
      ),
    );
  } else if (remainingBindings.startsWith("*")) {
    const namespaceMatch = remainingBindings.match(
      /^\*\s+as\s+([A-Za-z_$][\w$]*)$/,
    );

    if (namespaceMatch?.[1]) {
      bindings.push({
        localName: namespaceMatch[1],
        importedName: "*",
        kind: "namespace",
        isTypeOnly: statementTypeOnly,
      });
    }
  }

  return {
    importKind: "default",
    bindings,
  };
}

/**
 * Creates one import record.
 */
function createImportRecord(input: {
  sourceFile: string;
  sourceModule: string;
  importKind: SourceImportKind;
  bindings: SourceImportBinding[];
  isTypeOnly: boolean;
  isDynamic: boolean;
  resolvedFile: string | null;
  aliases: Record<string, string>;
  line: number;
  column: number;
  rawStatement: string;
}): SourceImportRecord {
  const external = isExternalModule(
    input.sourceModule,
    input.aliases,
  );

  return {
    id: createStableId(
      "source-import",
      input.sourceFile,
      input.sourceModule,
      input.line,
      input.column,
      input.importKind,
    ),
    sourceFile: input.sourceFile,
    sourceModule: input.sourceModule,
    importKind: input.importKind,
    bindings: input.bindings,
    isTypeOnly: input.isTypeOnly,
    isRelative: isRelativeModule(
      input.sourceModule,
    ),
    isAlias: isAliasModule(
      input.sourceModule,
      input.aliases,
    ),
    isExternal: external,
    isDynamic: input.isDynamic,
    isResolved:
      external || input.resolvedFile !== null,
    resolvedFile: input.resolvedFile,
    line: input.line,
    column: input.column,
    rawStatement: input.rawStatement,
  };
}

/**
 * Converts import bindings into component records.
 */
function createImportedComponentRecords(
  sourceImport: SourceImportRecord,
): ImportedComponentRecord[] {
  return sourceImport.bindings
    .filter(
      (binding) =>
        appearsToBeComponentName(
          binding.localName,
        ) &&
        !binding.isTypeOnly,
    )
    .map((binding) => ({
      id: createStableId(
        "imported-component",
        sourceImport.sourceFile,
        sourceImport.sourceModule,
        binding.localName,
        sourceImport.line,
      ),
      sourceFile: sourceImport.sourceFile,
      componentName: binding.localName,
      importedName: binding.importedName,
      sourceModule: sourceImport.sourceModule,
      resolvedFile: sourceImport.resolvedFile,
      isDefaultImport:
        binding.kind === "default",
      isTypeOnly: binding.isTypeOnly,
      line: sourceImport.line,
      column: sourceImport.column,
    }));
}

/**
 * Extracts static ES module imports.
 */
function extractStaticImports(input: {
  source: string;
  sourceFile: string;
  projectRoot: string;
  aliases: Record<string, string>;
  extensions: string[];
  indexFileNames: string[];
  discoveredFileMap: Map<string, DiscoveredProjectFile>;
  includeTypeImports: boolean;
}): SourceImportRecord[] {
  const imports: SourceImportRecord[] = [];

  const pattern =
   /(^|\n)\s*import\s+(type\s+)?(?:([\s\S]*?)\s+from\s+)?["']([^"']+)["']\s*;?/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input.source)) !== null) {
    const fullStatement = match[0].trim();
    const statementTypeOnly = Boolean(match[2]);
    const bindingText = match[3]?.trim() ?? "";
    const sourceModule = match[4]?.trim();

    if (!sourceModule) {
      continue;
    }

    if (
      statementTypeOnly &&
      !input.includeTypeImports
    ) {
      continue;
    }

    const parsedBindings =
      parseStaticImportBindings(
        bindingText,
        statementTypeOnly,
      );

    const statementIndex =
      match.index +
      (match[1]?.length ?? 0);

    const position = getLineAndColumn(
      input.source,
      statementIndex,
    );

    const resolvedFile =
      resolveImportedModule({
        projectRoot: input.projectRoot,
        sourceFile: input.sourceFile,
        sourceModule,
        aliases: input.aliases,
        extensions: input.extensions,
        indexFileNames:
          input.indexFileNames,
        discoveredFileMap:
          input.discoveredFileMap,
      });

    imports.push(
      createImportRecord({
        sourceFile: input.sourceFile,
        sourceModule,
        importKind:
          parsedBindings.importKind,
        bindings:
          parsedBindings.bindings,
        isTypeOnly: statementTypeOnly,
        isDynamic: false,
        resolvedFile,
        aliases: input.aliases,
        line: position.line,
        column: position.column,
        rawStatement: fullStatement,
      }),
    );
  }

  return imports;
}

/**
 * Extracts dynamic import() calls.
 */
function extractDynamicImports(input: {
  source: string;
  sourceFile: string;
  projectRoot: string;
  aliases: Record<string, string>;
  extensions: string[];
  indexFileNames: string[];
  discoveredFileMap: Map<string, DiscoveredProjectFile>;
}): SourceImportRecord[] {
  const imports: SourceImportRecord[] = [];

  const pattern =
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input.source)) !== null) {
    const sourceModule = match[1];

    if (!sourceModule) {
      continue;
    }

    const position = getLineAndColumn(
      input.source,
      match.index,
    );

    const resolvedFile =
      resolveImportedModule({
        projectRoot: input.projectRoot,
        sourceFile: input.sourceFile,
        sourceModule,
        aliases: input.aliases,
        extensions: input.extensions,
        indexFileNames:
          input.indexFileNames,
        discoveredFileMap:
          input.discoveredFileMap,
      });

    imports.push(
      createImportRecord({
        sourceFile: input.sourceFile,
        sourceModule,
        importKind: "dynamic",
        bindings: [],
        isTypeOnly: false,
        isDynamic: true,
        resolvedFile,
        aliases: input.aliases,
        line: position.line,
        column: position.column,
        rawStatement: match[0],
      }),
    );
  }

  return imports;
}

/**
 * Extracts CommonJS require() calls.
 */
function extractRequireImports(input: {
  source: string;
  sourceFile: string;
  projectRoot: string;
  aliases: Record<string, string>;
  extensions: string[];
  indexFileNames: string[];
  discoveredFileMap: Map<string, DiscoveredProjectFile>;
}): SourceImportRecord[] {
  const imports: SourceImportRecord[] = [];

  const pattern =
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input.source)) !== null) {
    const sourceModule = match[1];

    if (!sourceModule) {
      continue;
    }

    const position = getLineAndColumn(
      input.source,
      match.index,
    );

    const resolvedFile =
      resolveImportedModule({
        projectRoot: input.projectRoot,
        sourceFile: input.sourceFile,
        sourceModule,
        aliases: input.aliases,
        extensions: input.extensions,
        indexFileNames:
          input.indexFileNames,
        discoveredFileMap:
          input.discoveredFileMap,
      });

    imports.push(
      createImportRecord({
        sourceFile: input.sourceFile,
        sourceModule,
        importKind: "require",
        bindings: [],
        isTypeOnly: false,
        isDynamic: true,
        resolvedFile,
        aliases: input.aliases,
        line: position.line,
        column: position.column,
        rawStatement: match[0],
      }),
    );
  }

  return imports;
}

/**
 * Removes duplicate import records.
 */
function deduplicateImports(
  imports: SourceImportRecord[],
): SourceImportRecord[] {
  const records = new Map<
    string,
    SourceImportRecord
  >();

  for (const sourceImport of imports) {
    const key = [
      sourceImport.sourceFile,
      sourceImport.sourceModule,
      sourceImport.importKind,
      sourceImport.line,
      sourceImport.column,
    ].join("::");

    if (!records.has(key)) {
      records.set(key, sourceImport);
    }
  }

  return [...records.values()].sort(
    (first, second) => {
      if (first.line !== second.line) {
        return first.line - second.line;
      }

      return first.column - second.column;
    },
  );
}

/**
 * Builds a discovered-file lookup map.
 */
function createDiscoveredFileMap(
  files: DiscoveredProjectFile[],
): Map<string, DiscoveredProjectFile> {
  return new Map(
    files.map((file) => [
      normalizePath(file.relativePath),
      file,
    ]),
  );
}

/**
 * Analyzes import statements in one source file.
 */
export function analyzeFileImports(input: {
  source: string;
  file: DiscoveredProjectFile;
  discoveredFiles: DiscoveredProjectFile[];
  options?: ImportAnalyzerOptions;
}): FileImportAnalysis {
  const projectRoot = path.resolve(
    input.options?.projectRoot ??
      process.cwd(),
  );

  const aliases = {
    ...DEFAULT_ALIASES,
    ...(input.options?.aliases ?? {}),
  };

  const extensions =
    input.options?.extensions ??
    DEFAULT_EXTENSIONS;

  const indexFileNames =
    input.options?.indexFileNames ??
    DEFAULT_INDEX_FILE_NAMES;

  const includeRequireCalls =
    input.options?.includeRequireCalls ??
    true;

  const includeDynamicImports =
    input.options?.includeDynamicImports ??
    true;

  const includeTypeImports =
    input.options?.includeTypeImports ??
    true;

  const discoveredFileMap =
    createDiscoveredFileMap(
      input.discoveredFiles,
    );

  const imports: SourceImportRecord[] = [];
  const errors: string[] = [];

  try {
    imports.push(
      ...extractStaticImports({
        source: input.source,
        sourceFile:
          input.file.relativePath,
        projectRoot,
        aliases,
        extensions,
        indexFileNames,
        discoveredFileMap,
        includeTypeImports,
      }),
    );

    if (includeDynamicImports) {
      imports.push(
        ...extractDynamicImports({
          source: input.source,
          sourceFile:
            input.file.relativePath,
          projectRoot,
          aliases,
          extensions,
          indexFileNames,
          discoveredFileMap,
        }),
      );
    }

    if (includeRequireCalls) {
      imports.push(
        ...extractRequireImports({
          source: input.source,
          sourceFile:
            input.file.relativePath,
          projectRoot,
          aliases,
          extensions,
          indexFileNames,
          discoveredFileMap,
        }),
      );
    }
  } catch (error) {
    errors.push(
      `Unable to analyze imports in "${input.file.relativePath}": ${
        error instanceof Error
          ? error.message
          : "Unknown import-analysis error."
      }`,
    );
  }

  const uniqueImports =
    deduplicateImports(imports);

  const importedComponents =
    uniqueImports.flatMap(
      createImportedComponentRecords,
    );

  const resolvedFiles = uniqueValues(
    uniqueImports
      .map(
        (sourceImport) =>
          sourceImport.resolvedFile,
      )
      .filter(
        (resolvedFile): resolvedFile is string =>
          Boolean(resolvedFile),
      ),
  );

  const unresolvedModules = uniqueValues(
    uniqueImports
      .filter(
        (sourceImport) =>
          !sourceImport.isExternal &&
          !sourceImport.isResolved,
      )
      .map(
        (sourceImport) =>
          sourceImport.sourceModule,
      ),
  );

  const externalModules = uniqueValues(
    uniqueImports
      .filter(
        (sourceImport) =>
          sourceImport.isExternal,
      )
      .map(
        (sourceImport) =>
          sourceImport.sourceModule,
      ),
  );

  return {
    success: errors.length === 0,
    sourceFile: input.file.relativePath,
    imports: uniqueImports,
    importedComponents,
    resolvedFiles,
    unresolvedModules,
    externalModules,
    errors,
  };
}

/**
 * Analyzes multiple already-loaded source files.
 *
 * The source map must use project-relative file paths as keys.
 */
export function analyzeProjectImports(input: {
  files: DiscoveredProjectFile[];
  sources: Record<string, string>;
  options?: ImportAnalyzerOptions;
}): ProjectImportAnalysis {
  const fileResults: FileImportAnalysis[] = [];
  const errors: string[] = [];

  for (const file of input.files) {
    const source =
      input.sources[file.relativePath];

    if (source === undefined) {
      errors.push(
        `Source content was not provided for "${file.relativePath}".`,
      );

      continue;
    }

    const result = analyzeFileImports({
      source,
      file,
      discoveredFiles: input.files,
      options: input.options,
    });

    fileResults.push(result);
    errors.push(...result.errors);
  }

  const imports = fileResults.flatMap(
    (result) => result.imports,
  );

  const importedComponents =
    fileResults.flatMap(
      (result) =>
        result.importedComponents,
    );

  return {
    success: errors.length === 0,
    analyzedFiles: fileResults.length,
    imports,
    importedComponents,
    fileResults,
    unresolvedModules: uniqueValues(
      fileResults.flatMap(
        (result) =>
          result.unresolvedModules,
      ),
    ),
    externalModules: uniqueValues(
      fileResults.flatMap(
        (result) =>
          result.externalModules,
      ),
    ),
    errors,
  };
}

/**
 * Returns all components imported by one source file.
 */
export function getImportedComponentsForFile(
  analysis: ProjectImportAnalysis,
  sourceFile: string,
): ImportedComponentRecord[] {
  return analysis.importedComponents.filter(
    (component) =>
      component.sourceFile === sourceFile,
  );
}

/**
 * Returns all files directly imported by one source file.
 */
export function getResolvedImportsForFile(
  analysis: ProjectImportAnalysis,
  sourceFile: string,
): string[] {
  return uniqueValues(
    analysis.imports
      .filter(
        (sourceImport) =>
          sourceImport.sourceFile ===
            sourceFile &&
          sourceImport.resolvedFile !== null,
      )
      .map(
        (sourceImport) =>
          sourceImport.resolvedFile!,
      ),
  );
}

/**
 * Returns all source files that import a specific file.
 */
export function getImportingFiles(
  analysis: ProjectImportAnalysis,
  targetFile: string,
): string[] {
  return uniqueValues(
    analysis.imports
      .filter(
        (sourceImport) =>
          sourceImport.resolvedFile ===
          targetFile,
      )
      .map(
        (sourceImport) =>
          sourceImport.sourceFile,
      ),
  );
}

/**
 * Returns the probable component name from a source filename.
 *
 * Examples:
 *
 * Hero.tsx       -> Hero
 * page.tsx       -> page
 * user-card.tsx  -> user-card
 */
export function getComponentNameFromFile(
  filePath: string,
): string {
  return removeFileExtension(
    path.basename(filePath),
  );
}