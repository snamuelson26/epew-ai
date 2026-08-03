import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

import type {
  HardcodedTextIssue,
  NamespaceUsage,
  RouteInventoryItem,
  SourceLocation,
  SupportedLocale,
  TranslationKeyUsage,
  TranslationManifest,
  TranslationNamespaceFile,
  TranslationScannerConfig,
} from "./types";

const SCANNER_VERSION = "1.0.0";

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
]);

const PAGE_FILE_NAMES = new Set([
  "page.ts",
  "page.tsx",
  "page.js",
  "page.jsx",
]);

const COMPONENT_FILE_EXTENSIONS = new Set([
  ".tsx",
  ".jsx",
]);

const IGNORED_TEXT_VALUES = new Set([
  "",
  "-",
  "–",
  "—",
  "|",
  "/",
  "\\",
  ":",
  ";",
  ",",
  ".",
  "...",
  "•",
  "→",
  "←",
  "↑",
  "↓",
  "✓",
  "✔",
  "✕",
  "×",
]);

interface SourceScanResult {
  hardcodedText: HardcodedTextIssue[];

  translationKeyUsage: TranslationKeyUsage[];

  namespaceUsage: NamespaceUsage[];
}

export class EnterpriseTranslationScanner {
  private readonly config: TranslationScannerConfig;

  constructor(config: TranslationScannerConfig) {
    this.config = config;
  }

  public scan(): TranslationManifest {
    const warnings: string[] = [];

    this.assertRequiredDirectories(warnings);

    const allSourceFiles = this.discoverSourceFiles();

    const pageFiles = allSourceFiles.filter((file) =>
      PAGE_FILE_NAMES.has(path.basename(file))
    );

    const publicPageFiles = pageFiles.filter((file) => {
      const route = this.routeFromPageFile(file);

      return !this.isExcludedRoute(route);
    });

    const namespaces = this.scanTranslationFiles(warnings);

    const allHardcodedText: HardcodedTextIssue[] = [];
    const allTranslationKeyUsage: TranslationKeyUsage[] = [];
    const allNamespaceUsage: NamespaceUsage[] = [];

    for (const sourceFile of allSourceFiles) {
      const route = this.findOwningRoute(
        sourceFile,
        publicPageFiles
      );

      const result = this.scanSourceFile(
        sourceFile,
        route
      );

      allHardcodedText.push(...result.hardcodedText);

      allTranslationKeyUsage.push(
        ...result.translationKeyUsage
      );

      allNamespaceUsage.push(...result.namespaceUsage);
    }

    const routes = publicPageFiles.map((pageFile) =>
      this.buildRouteInventory({
        pageFile,
        allSourceFiles,
        namespaces,
        hardcodedText: allHardcodedText,
        translationKeyUsage: allTranslationKeyUsage,
        namespaceUsage: allNamespaceUsage,
      })
    );

    const statistics =
      this.buildProjectStatistics({
        routes,
        allSourceFiles,
        namespaces,
        hardcodedText: allHardcodedText,
        translationKeyUsage: allTranslationKeyUsage,
      });

    return {
      schemaVersion: "1.0",

      project: {
        name: this.readProjectName(),
        root: this.toProjectRelative(
          this.config.projectRoot
        ),
        generatedAt: new Date().toISOString(),
        scannerVersion: SCANNER_VERSION,
      },

      languages: this.config.supportedLocales,

      statistics,

      routes: routes.sort((a, b) =>
        a.route.localeCompare(b.route)
      ),

      namespaces: namespaces.sort((a, b) => {
        const namespaceComparison =
          a.namespace.localeCompare(b.namespace);

        if (namespaceComparison !== 0) {
          return namespaceComparison;
        }

        return a.locale.localeCompare(b.locale);
      }),

      hardcodedText: allHardcodedText.sort(
        this.sortIssues
      ),

      translationKeyUsage:
        allTranslationKeyUsage.sort((a, b) =>
          a.file.localeCompare(b.file)
        ),

      namespaceUsage: allNamespaceUsage.sort(
        (a, b) => a.file.localeCompare(b.file)
      ),

      warnings,
    };
  }

  public writeManifest(
    manifest: TranslationManifest
  ): string {
    fs.mkdirSync(this.config.outputDirectory, {
      recursive: true,
    });

    const manifestPath = path.join(
      this.config.outputDirectory,
      "translation-manifest.json"
    );

    fs.writeFileSync(
      manifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8"
    );

    return manifestPath;
  }

  private assertRequiredDirectories(
    warnings: string[]
  ): void {
    if (!fs.existsSync(this.config.appDirectory)) {
      throw new Error(
        `App directory not found: ${this.config.appDirectory}`
      );
    }

    if (
      !fs.existsSync(this.config.messagesDirectory)
    ) {
      warnings.push(
        `Messages directory not found: ${this.toProjectRelative(
          this.config.messagesDirectory
        )}`
      );
    }
  }

  private discoverSourceFiles(): string[] {
    const roots = new Set<string>([
      this.config.appDirectory,
      ...this.config.componentDirectories,
    ]);

    const files = new Set<string>();

    for (const root of roots) {
      if (!fs.existsSync(root)) {
        continue;
      }

      for (const file of this.walkDirectory(root)) {
        const extension = path.extname(file);

        if (SOURCE_EXTENSIONS.has(extension)) {
          files.add(path.normalize(file));
        }
      }
    }

    return Array.from(files).sort();
  }

  private walkDirectory(
    directory: string
  ): string[] {
    const discoveredFiles: string[] = [];

    const entries = fs.readdirSync(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const entryPath = path.join(
        directory,
        entry.name
      );

      if (
        entry.isDirectory() &&
        this.config.excludedDirectories.includes(
          entry.name
        )
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        discoveredFiles.push(
          ...this.walkDirectory(entryPath)
        );

        continue;
      }

      if (entry.isFile()) {
        discoveredFiles.push(entryPath);
      }
    }

    return discoveredFiles;
  }

  private scanSourceFile(
    absoluteFilePath: string,
    route: string | null
  ): SourceScanResult {
    const sourceText = fs.readFileSync(
      absoluteFilePath,
      "utf8"
    );

    const sourceFile = ts.createSourceFile(
      absoluteFilePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      this.scriptKindFromFile(absoluteFilePath)
    );

    const hardcodedText: HardcodedTextIssue[] = [];
    const translationKeyUsage: TranslationKeyUsage[] =
      [];
    const namespaceUsage: NamespaceUsage[] = [];

    let currentNamespace: string | null = null;

    const visit = (node: ts.Node): void => {
      const discoveredNamespace =
        this.extractNamespaceUsage(
          node,
          sourceFile,
          absoluteFilePath,
          route
        );

      if (discoveredNamespace) {
        currentNamespace =
          discoveredNamespace.namespace;

        namespaceUsage.push(
          discoveredNamespace
        );
      }

      const translationKey =
        this.extractTranslationKeyUsage(
          node,
          sourceFile,
          absoluteFilePath,
          route,
          currentNamespace
        );

      if (translationKey) {
        translationKeyUsage.push(
          translationKey
        );
      }

      const hardcodedIssue =
        this.extractHardcodedTextIssue(
          node,
          sourceFile,
          absoluteFilePath,
          route
        );

      if (hardcodedIssue) {
        hardcodedText.push(hardcodedIssue);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return {
      hardcodedText:
        this.removeDuplicateHardcodedIssues(
          hardcodedText
        ),

      translationKeyUsage,

      namespaceUsage,
    };
  }

  private extractNamespaceUsage(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    absoluteFilePath: string,
    route: string | null
  ): NamespaceUsage | null {
    if (!ts.isCallExpression(node)) {
      return null;
    }

    const functionName =
      this.getCalledFunctionName(node.expression);

    if (
      !functionName ||
      !this.config.namespaceHookNames.includes(
        functionName
      )
    ) {
      return null;
    }

    const firstArgument = node.arguments[0];

    if (
      !firstArgument ||
      !ts.isStringLiteralLike(firstArgument)
    ) {
      return null;
    }

    return {
      file: this.toProjectRelative(
        absoluteFilePath
      ),

      route,

      namespace: firstArgument.text,

      location: this.locationOf(
        firstArgument,
        sourceFile
      ),
    };
  }

  private extractTranslationKeyUsage(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    absoluteFilePath: string,
    route: string | null,
    currentNamespace: string | null
  ): TranslationKeyUsage | null {
    if (!ts.isCallExpression(node)) {
      return null;
    }

    const functionName =
      this.getCalledFunctionName(node.expression);

    if (
      !functionName ||
      !this.config.translationFunctionNames.includes(
        functionName
      )
    ) {
      return null;
    }

    const firstArgument = node.arguments[0];

    if (
      !firstArgument ||
      !ts.isStringLiteralLike(firstArgument)
    ) {
      return null;
    }

    return {
      file: this.toProjectRelative(
        absoluteFilePath
      ),

      route,

      namespace: currentNamespace,

      key: firstArgument.text,

      location: this.locationOf(
        firstArgument,
        sourceFile
      ),
    };
  }

  private extractHardcodedTextIssue(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    absoluteFilePath: string,
    route: string | null
  ): HardcodedTextIssue | null {
    if (ts.isJsxText(node)) {
      const text = this.normalizeVisibleText(
        node.getText(sourceFile)
      );

      if (!this.isPublicText(text)) {
        return null;
      }

      return {
        file: this.toProjectRelative(
          absoluteFilePath
        ),

        route,

        type: "jsx-text",

        text,

        location: this.locationOf(
          node,
          sourceFile
        ),

        element: this.findParentJsxElementName(
          node
        ),

        severity: "error",
      };
    }

    if (ts.isJsxExpression(node)) {
      const expression = node.expression;

      if (
        !expression ||
        !ts.isStringLiteralLike(expression)
      ) {
        return null;
      }

      const text = this.normalizeVisibleText(
        expression.text
      );

      if (!this.isPublicText(text)) {
        return null;
      }

      return {
        file: this.toProjectRelative(
          absoluteFilePath
        ),

        route,

        type: "jsx-expression",

        text,

        location: this.locationOf(
          expression,
          sourceFile
        ),

        element: this.findParentJsxElementName(
          node
        ),

        severity: "error",
      };
    }

    if (ts.isJsxAttribute(node)) {
      const attributeName =
        node.name.getText(sourceFile);

      if (
        !this.config.visibleAttributes.includes(
          attributeName
        )
      ) {
        return null;
      }

      const text =
        this.readJsxAttributeStringValue(node);

      if (!text || !this.isPublicText(text)) {
        return null;
      }

      return {
        file: this.toProjectRelative(
          absoluteFilePath
        ),

        route,

        type: "jsx-attribute",

        text: this.normalizeVisibleText(text),

        location: this.locationOf(
          node,
          sourceFile
        ),

        element: this.findParentJsxElementName(
          node
        ),

        attribute: attributeName,

        severity: "error",
      };
    }

    if (
      ts.isPropertyAssignment(node) &&
      this.isMetadataProperty(node)
    ) {
      const value = node.initializer;

      if (!ts.isStringLiteralLike(value)) {
        return null;
      }

      const text = this.normalizeVisibleText(
        value.text
      );

      if (!this.isPublicText(text)) {
        return null;
      }

      return {
        file: this.toProjectRelative(
          absoluteFilePath
        ),

        route,

        type: "metadata",

        text,

        location: this.locationOf(
          value,
          sourceFile
        ),

        severity: "warning",
      };
    }

    return null;
  }

  private scanTranslationFiles(
    warnings: string[]
  ): TranslationNamespaceFile[] {
    const results: TranslationNamespaceFile[] =
      [];

    if (
      !fs.existsSync(this.config.messagesDirectory)
    ) {
      return results;
    }

    for (const locale of this.config
      .supportedLocales) {
      const localeDirectory = path.join(
        this.config.messagesDirectory,
        locale
      );

      if (!fs.existsSync(localeDirectory)) {
        warnings.push(
          `Missing locale directory: ${this.toProjectRelative(
            localeDirectory
          )}`
        );

        continue;
      }

      const jsonFiles = this.walkDirectory(
        localeDirectory
      ).filter(
        (file) => path.extname(file) === ".json"
      );

      for (const jsonFile of jsonFiles) {
        const namespace = path
          .relative(localeDirectory, jsonFile)
          .replaceAll(path.sep, "/")
          .replace(/\.json$/i, "");

        try {
          const raw = fs.readFileSync(
            jsonFile,
            "utf8"
          );

          const parsed: unknown = JSON.parse(raw);

          const keys = this.flattenJsonKeys(parsed);

          results.push({
            locale,
            namespace,
            file: this.toProjectRelative(jsonFile),
            keyCount: keys.length,
            keys,
            validJson: true,
          });
        } catch (error) {
          results.push({
            locale,
            namespace,
            file: this.toProjectRelative(jsonFile),
            keyCount: 0,
            keys: [],
            validJson: false,
            error:
              error instanceof Error
                ? error.message
                : "Unknown JSON parsing error",
          });
        }
      }
    }

    return results;
  }

  private buildRouteInventory(args: {
    pageFile: string;

    allSourceFiles: string[];

    namespaces: TranslationNamespaceFile[];

    hardcodedText: HardcodedTextIssue[];

    translationKeyUsage: TranslationKeyUsage[];

    namespaceUsage: NamespaceUsage[];
  }): RouteInventoryItem {
    const route = this.routeFromPageFile(
      args.pageFile
    );

    const defaultNamespace =
      this.namespaceFromRoute(route);

    const relatedSourceFiles =
      this.findRouteSourceFiles(
        args.pageFile,
        args.allSourceFiles
      );

    const relatedRelativeFiles = new Set(
      relatedSourceFiles.map((file) =>
        this.toProjectRelative(file)
      )
    );

    const routeHardcodedText =
      args.hardcodedText.filter(
        (issue) =>
          issue.route === route ||
          relatedRelativeFiles.has(issue.file)
      );

    const routeKeyUsage =
      args.translationKeyUsage.filter(
        (usage) =>
          usage.route === route ||
          relatedRelativeFiles.has(usage.file)
      );

    const routeNamespaceUsage =
      args.namespaceUsage.filter(
        (usage) =>
          usage.route === route ||
          relatedRelativeFiles.has(usage.file)
      );

    const detectedNamespaces = Array.from(
      new Set(
        routeNamespaceUsage.map(
          (usage) => usage.namespace
        )
      )
    );

    if (detectedNamespaces.length === 0) {
      detectedNamespaces.push(defaultNamespace);
    }

    const requiredNamespace =
      detectedNamespaces[0] ?? defaultNamespace;

    const missingLocaleFiles =
      this.config.supportedLocales.filter(
        (locale) =>
          !args.namespaces.some(
            (namespaceFile) =>
              namespaceFile.locale === locale &&
              namespaceFile.namespace ===
                requiredNamespace &&
              namespaceFile.validJson
          )
      );

    const translationKeysUsed = Array.from(
      new Set(
        routeKeyUsage.map((usage) => usage.key)
      )
    ).sort();

    const complianceScore =
      this.calculateRouteComplianceScore({
        hardcodedTextCount:
          routeHardcodedText.length,

        missingLocaleCount:
          missingLocaleFiles.length,

        hasNamespace:
          detectedNamespaces.length > 0,

        translationKeyCount:
          translationKeysUsed.length,
      });

    return {
      route,

      namespace: requiredNamespace,

      pageFile: this.toProjectRelative(
        args.pageFile
      ),

      sourceFiles: relatedSourceFiles.map((file) =>
        this.toProjectRelative(file)
      ),

      detectedNamespaces,

      translationKeysUsed,

      hardcodedTextCount:
        routeHardcodedText.length,

      missingLocaleFiles,

      complianceScore,

      status:
        complianceScore === 100
          ? "compliant"
          : complianceScore >= 70
            ? "review-required"
            : "non-compliant",
    };
  }

  private buildProjectStatistics(args: {
    routes: RouteInventoryItem[];

    allSourceFiles: string[];

    namespaces: TranslationNamespaceFile[];

    hardcodedText: HardcodedTextIssue[];

    translationKeyUsage: TranslationKeyUsage[];
  }): TranslationManifest["statistics"] {
    const uniqueNamespaceNames = new Set(
      args.namespaces.map(
        (namespace) => namespace.namespace
      )
    );

    const definedKeys = new Set(
      args.namespaces.flatMap((namespace) =>
        namespace.keys.map(
          (key) =>
            `${namespace.locale}:${namespace.namespace}:${key}`
        )
      )
    );

    const usedKeys = new Set(
      args.translationKeyUsage.map(
        (usage) =>
          `${usage.namespace ?? "unknown"}:${usage.key}`
      )
    );

    const missingLanguageFiles =
      args.routes.reduce(
        (total, route) =>
          total +
          route.missingLocaleFiles.length,
        0
      );

    const invalidJsonFiles =
      args.namespaces.filter(
        (namespace) => !namespace.validJson
      ).length;

    const overallComplianceScore =
      args.routes.length === 0
        ? 0
        : Math.round(
            args.routes.reduce(
              (total, route) =>
                total + route.complianceScore,
              0
            ) / args.routes.length
          );

    return {
      pagesDiscovered: args.routes.length,

      sourceFilesScanned:
        args.allSourceFiles.length,

      componentFilesScanned:
        args.allSourceFiles.filter((file) =>
          COMPONENT_FILE_EXTENSIONS.has(
            path.extname(file)
          )
        ).length,

      namespacesDiscovered:
        uniqueNamespaceNames.size,

      translationFilesDiscovered:
        args.namespaces.length,

      translationKeysDefined:
        definedKeys.size,

      translationKeysUsed: usedKeys.size,

      hardcodedTextIssues:
        args.hardcodedText.length,

      missingLanguageFiles,

      invalidJsonFiles,

      overallComplianceScore,
    };
  }

  private findRouteSourceFiles(
    pageFile: string,
    allSourceFiles: string[]
  ): string[] {
    const pageDirectory = path.dirname(pageFile);

    return allSourceFiles.filter((file) => {
      if (file === pageFile) {
        return true;
      }

      const relative = path.relative(
        pageDirectory,
        file
      );

      return (
        relative !== "" &&
        !relative.startsWith("..") &&
        !path.isAbsolute(relative)
      );
    });
  }

  private findOwningRoute(
    sourceFile: string,
    pageFiles: string[]
  ): string | null {
    const matchingPage = pageFiles
      .filter((pageFile) => {
        const pageDirectory =
          path.dirname(pageFile);

        const relative = path.relative(
          pageDirectory,
          sourceFile
        );

        return (
          sourceFile === pageFile ||
          (relative !== "" &&
            !relative.startsWith("..") &&
            !path.isAbsolute(relative))
        );
      })
      .sort(
        (a, b) =>
          path.dirname(b).length -
          path.dirname(a).length
      )[0];

    return matchingPage
      ? this.routeFromPageFile(matchingPage)
      : null;
  }

  private routeFromPageFile(
    pageFile: string
  ): string {
    const relativeDirectory = path.relative(
      this.config.appDirectory,
      path.dirname(pageFile)
    );

    if (
      relativeDirectory === "" ||
      relativeDirectory === "."
    ) {
      return "/";
    }

    const segments = relativeDirectory
      .split(path.sep)
      .filter(Boolean)
      .filter(
        (segment) =>
          !(
            segment.startsWith("(") &&
            segment.endsWith(")")
          )
      )
      .filter(
        (segment) =>
          !segment.startsWith("@")
      );

    const route = `/${segments.join("/")}`;

    return route === "" ? "/" : route;
  }

  private namespaceFromRoute(
    route: string
  ): string {
    if (route === "/") {
      return "homepage";
    }

    return route
      .replace(/^\/+/, "")
      .replaceAll("/", "-")
      .replace(/\[(?:\.\.\.)?([^\]]+)\]/g, "$1")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
  }

  private isExcludedRoute(
    route: string
  ): boolean {
    return this.config.excludedRoutePrefixes.some(
      (prefix) =>
        route === prefix ||
        route.startsWith(`${prefix}/`)
    );
  }

  private calculateRouteComplianceScore(args: {
    hardcodedTextCount: number;

    missingLocaleCount: number;

    hasNamespace: boolean;

    translationKeyCount: number;
  }): number {
    let score = 100;

    if (!args.hasNamespace) {
      score -= 20;
    }

    if (args.translationKeyCount === 0) {
      score -= 15;
    }

    score -= Math.min(
      args.hardcodedTextCount * 2,
      40
    );

    score -= Math.min(
      args.missingLocaleCount * 10,
      40
    );

    return Math.max(0, score);
  }

  private flattenJsonKeys(
    value: unknown,
    prefix = ""
  ): string[] {
    if (
      value === null ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return prefix ? [prefix] : [];
    }

    const keys: string[] = [];

    for (const [
      propertyName,
      propertyValue,
    ] of Object.entries(
      value as Record<string, unknown>
    )) {
      const nextPrefix = prefix
        ? `${prefix}.${propertyName}`
        : propertyName;

      if (
        propertyValue !== null &&
        typeof propertyValue === "object" &&
        !Array.isArray(propertyValue)
      ) {
        keys.push(
          ...this.flattenJsonKeys(
            propertyValue,
            nextPrefix
          )
        );
      } else {
        keys.push(nextPrefix);
      }
    }

    return keys.sort();
  }

  private readProjectName(): string {
    const packageJsonPath = path.join(
      this.config.projectRoot,
      "package.json"
    );

    if (!fs.existsSync(packageJsonPath)) {
      return path.basename(
        this.config.projectRoot
      );
    }

    try {
      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, "utf8")
      ) as {
        name?: string;
      };

      return (
        packageJson.name ??
        path.basename(this.config.projectRoot)
      );
    } catch {
      return path.basename(
        this.config.projectRoot
      );
    }
  }

  private readJsxAttributeStringValue(
    attribute: ts.JsxAttribute
  ): string | null {
    if (!attribute.initializer) {
      return null;
    }

    if (
      ts.isStringLiteral(attribute.initializer)
    ) {
      return attribute.initializer.text;
    }

    if (
      ts.isJsxExpression(attribute.initializer) &&
      attribute.initializer.expression &&
      ts.isStringLiteralLike(
        attribute.initializer.expression
      )
    ) {
      return attribute.initializer.expression.text;
    }

    return null;
  }

  private isMetadataProperty(
    node: ts.PropertyAssignment
  ): boolean {
    const propertyName =
      node.name.getText().replaceAll(
        /["']/g,
        ""
      );

    return [
      "title",
      "description",
      "applicationName",
      "authors",
      "creator",
      "publisher",
    ].includes(propertyName);
  }

  private getCalledFunctionName(
    expression: ts.LeftHandSideExpression
  ): string | null {
    if (ts.isIdentifier(expression)) {
      return expression.text;
    }

    if (
      ts.isPropertyAccessExpression(expression)
    ) {
      return expression.name.text;
    }

    return null;
  }

  private findParentJsxElementName(
    node: ts.Node
  ): string | undefined {
    let current: ts.Node | undefined =
      node.parent;

    while (current) {
      if (ts.isJsxElement(current)) {
        return current.openingElement.tagName.getText();
      }

      if (
        ts.isJsxSelfClosingElement(current)
      ) {
        return current.tagName.getText();
      }

      current = current.parent;
    }

    return undefined;
  }

  private normalizeVisibleText(
    value: string
  ): string {
    return value
      .replace(/\s+/g, " ")
      .trim();
  }

  private isPublicText(
    value: string
  ): boolean {
    if (!value) {
      return false;
    }

    if (IGNORED_TEXT_VALUES.has(value)) {
      return false;
    }

    if (/^[\d\s.,%$€£¥:+\-–—/\\()]+$/.test(value)) {
      return false;
    }

    if (/^https?:\/\//i.test(value)) {
      return false;
    }

    if (/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|svg|webp|gif)$/i.test(value)) {
      return false;
    }

    if (/^[.#][a-zA-Z0-9_-]+$/.test(value)) {
      return false;
    }

    return /[a-zA-ZÀ-ÿ]/.test(value);
  }

  private locationOf(
    node: ts.Node,
    sourceFile: ts.SourceFile
  ): SourceLocation {
    const position =
      sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile)
      );

    return {
      line: position.line + 1,
      column: position.character + 1,
    };
  }

  private scriptKindFromFile(
    file: string
  ): ts.ScriptKind {
    const extension = path.extname(file);

    switch (extension) {
      case ".tsx":
        return ts.ScriptKind.TSX;

      case ".jsx":
        return ts.ScriptKind.JSX;

      case ".js":
        return ts.ScriptKind.JS;

      default:
        return ts.ScriptKind.TS;
    }
  }

  private toProjectRelative(
    absolutePath: string
  ): string {
    const relative = path.relative(
      this.config.projectRoot,
      absolutePath
    );

    return relative
      ? relative.replaceAll(path.sep, "/")
      : ".";
  }

  private removeDuplicateHardcodedIssues(
    issues: HardcodedTextIssue[]
  ): HardcodedTextIssue[] {
    const unique = new Map<
      string,
      HardcodedTextIssue
    >();

    for (const issue of issues) {
      const key = [
        issue.file,
        issue.location.line,
        issue.location.column,
        issue.type,
        issue.text,
      ].join(":");

      unique.set(key, issue);
    }

    return Array.from(unique.values());
  }

  private readonly sortIssues = (
    first: HardcodedTextIssue,
    second: HardcodedTextIssue
  ): number => {
    const fileComparison =
      first.file.localeCompare(second.file);

    if (fileComparison !== 0) {
      return fileComparison;
    }

    if (
      first.location.line !== second.location.line
    ) {
      return (
        first.location.line -
        second.location.line
      );
    }

    return (
      first.location.column -
      second.location.column
    );
  };
}