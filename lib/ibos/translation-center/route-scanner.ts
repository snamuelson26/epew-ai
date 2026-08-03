/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * IBOS Enterprise Translation Service
 * Route Scanner and Page Registry
 * Version: 1.0.0
 * ============================================================
 */

import type {
  TranslationPage,
  TranslationRoute,
  TranslationLanguage,
  TranslationLanguageStatus,
  TranslationComplianceStatus,
} from "./types";

import type {
  DiscoveredProjectFile,
  ProjectFileScanResult,
} from "./file-scanner";

import {
  IBOS_ENABLED_LANGUAGES,
  IBOS_MASTER_LANGUAGE,
} from "./config";

import {
  calculatePercentage,
  createStableId,
  determineComplianceStatus,
  determineTranslationStatus,
  nowIso,
  routeToNamespace,
  routeToTitle,
} from "./utils";

/**
 * Options used when generating the route registry.
 */
export interface RouteScannerOptions {
  /**
   * Automatically generate a namespace when the route scanner
   * discovers a page without one.
   */
  generateMissingNamespaces?: boolean;

  /**
   * Include dynamic routes such as:
   * /entrepreneur/[id]
   */
  includeDynamicRoutes?: boolean;

  /**
   * Include public application pages.
   */
  includePublicRoutes?: boolean;

  /**
   * Include authenticated portal pages.
   */
  includeAuthenticatedRoutes?: boolean;

  /**
   * Existing namespace names discovered from the message folders.
   */
  availableNamespaces?: string[];

  /**
   * Existing registry records that should be preserved when possible.
   */
  existingRoutes?: TranslationRoute[];

  /**
   * Existing page records that should be preserved when possible.
   */
  existingPages?: TranslationPage[];
}

/**
 * Result returned by the route scanner.
 */
export interface RouteScanResult {
  success: boolean;
  scanId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;

  routes: TranslationRoute[];
  pages: TranslationPage[];

  publicRoutes: TranslationRoute[];
  authenticatedRoutes: TranslationRoute[];
  dynamicRoutes: TranslationRoute[];

  newlyDiscoveredRoutes: TranslationRoute[];
  updatedRoutes: TranslationRoute[];
  removedRoutes: TranslationRoute[];

  routesWithoutNamespaces: TranslationRoute[];
  routesWithMissingNamespaceFiles: TranslationRoute[];

  errors: string[];
}

/**
 * Internal route comparison result.
 */
interface RouteRegistryComparison {
  newlyDiscoveredRoutes: TranslationRoute[];
  updatedRoutes: TranslationRoute[];
  removedRoutes: TranslationRoute[];
}

/**
 * Default route scanner configuration.
 */
const DEFAULT_ROUTE_SCANNER_OPTIONS: Required<
  Pick<
    RouteScannerOptions,
    | "generateMissingNamespaces"
    | "includeDynamicRoutes"
    | "includePublicRoutes"
    | "includeAuthenticatedRoutes"
  >
> = {
  generateMissingNamespaces: true,
  includeDynamicRoutes: true,
  includePublicRoutes: true,
  includeAuthenticatedRoutes: true,
};

/**
 * Creates an empty language-status record.
 */
function createInitialLanguageStatus(
  language: TranslationLanguage,
  namespaceExists: boolean,
): TranslationLanguageStatus {
  const isMasterLanguage = language === IBOS_MASTER_LANGUAGE;
  const fileExists = namespaceExists && isMasterLanguage;

  return {
    language,
    status: determineTranslationStatus({
      fileExists,
      totalKeys: 0,
      translatedKeys: 0,
      missingKeys: 0,
      invalidKeys: 0,
    }),
    fileExists,
    totalKeys: 0,
    translatedKeys: 0,
    missingKeys: 0,
    obsoleteKeys: 0,
    invalidKeys: 0,
    coveragePercentage: fileExists ? 100 : 0,
  };
}

/**
 * Creates all language status records for a page.
 *
 * At the route-discovery stage, only the namespace name is known.
 * The namespace scanner will later replace these initial values
 * with actual file and key statistics.
 */
function createInitialLanguageStatuses(
  namespace: string | null,
  availableNamespaces: Set<string>,
): Record<TranslationLanguage, TranslationLanguageStatus> {
  const namespaceExists =
    namespace !== null && availableNamespaces.has(namespace);

  return IBOS_ENABLED_LANGUAGES.reduce(
    (
      output,
      language,
    ): Record<TranslationLanguage, TranslationLanguageStatus> => {
      output[language] = createInitialLanguageStatus(
        language,
        namespaceExists,
      );

      return output;
    },
    {} as Record<
      TranslationLanguage,
      TranslationLanguageStatus
    >,
  );
}

/**
 * Calculates an initial page compliance score.
 *
 * The complete compliance score will be recalculated later by
 * the namespace validator and compliance engine.
 */
function calculateInitialPageComplianceScore(
  namespace: string | null,
  availableNamespaces: Set<string>,
): number {
  if (!namespace) {
    return 0;
  }

  if (!availableNamespaces.has(namespace)) {
    return 25;
  }

  return 50;
}

/**
 * Creates a TranslationRoute record from a discovered page file.
 */
function createRouteRecord(
  file: DiscoveredProjectFile,
  generateMissingNamespaces: boolean,
  existingRoute?: TranslationRoute,
): TranslationRoute {
  const route = file.route ?? "/";
  const namespace =
    file.namespace ??
    (generateMissingNamespaces
      ? routeToNamespace(route)
      : null);

  return {
    id:
      existingRoute?.id ??
      createStableId(
        "translation-route",
        route,
        file.relativePath,
      ),
    route,
    title: existingRoute?.title ?? routeToTitle(route),
    sourceFile: file.relativePath,
    namespace,
    isDynamic: file.isDynamicRoute,
    isPublic: file.isPublic,
    requiresAuthentication:
      file.requiresAuthentication,
    portal: file.portal,
    discoveredAt:
      existingRoute?.discoveredAt ?? nowIso(),
  };
}

/**
 * Creates a TranslationPage record from a route record.
 */
function createPageRecord(
  file: DiscoveredProjectFile,
  route: TranslationRoute,
  availableNamespaces: Set<string>,
  existingPage?: TranslationPage,
): TranslationPage {
  const languages =
    existingPage?.languages ??
    createInitialLanguageStatuses(
      route.namespace,
      availableNamespaces,
    );

  const complianceScore =
    existingPage?.complianceScore ??
    calculateInitialPageComplianceScore(
      route.namespace,
      availableNamespaces,
    );

  const complianceStatus: TranslationComplianceStatus =
    existingPage?.complianceStatus ??
    determineComplianceStatus(complianceScore);

  return {
    id:
      existingPage?.id ??
      createStableId(
        "translation-page",
        route.route,
        file.relativePath,
      ),
    route: route.route,
    title: route.title,
    namespace: route.namespace,
    sourceFile: file.relativePath,
    resourceType: "page",
    languages,
    complianceStatus,
    complianceScore,
    registeredAt:
      existingPage?.registeredAt ?? nowIso(),
    lastScannedAt: nowIso(),
  };
}

/**
 * Determines whether a discovered file should be included
 * according to the active route scanner options.
 */
function shouldIncludeRouteFile(
  file: DiscoveredProjectFile,
  options: Required<
    Pick<
      RouteScannerOptions,
      | "includeDynamicRoutes"
      | "includePublicRoutes"
      | "includeAuthenticatedRoutes"
    >
  >,
): boolean {
  if (!file.isRouteFile || file.resourceType !== "page") {
    return false;
  }

  if (
    !options.includeDynamicRoutes &&
    file.isDynamicRoute
  ) {
    return false;
  }

  if (!options.includePublicRoutes && file.isPublic) {
    return false;
  }

  if (
    !options.includeAuthenticatedRoutes &&
    file.requiresAuthentication
  ) {
    return false;
  }

  return true;
}

/**
 * Removes duplicate routes.
 *
 * In case more than one file resolves to the same URL,
 * the first route is preserved and an error is reported
 * separately by the scanner.
 */
function deduplicateRouteFiles(
  files: DiscoveredProjectFile[],
): {
  files: DiscoveredProjectFile[];
  duplicateErrors: string[];
} {
  const routeMap = new Map<
    string,
    DiscoveredProjectFile
  >();

  const duplicateErrors: string[] = [];

  for (const file of files) {
    const route = file.route ?? "/";

    const existing = routeMap.get(route);

    if (existing) {
      duplicateErrors.push(
        [
          `Duplicate application route detected: "${route}".`,
          `First file: "${existing.relativePath}".`,
          `Duplicate file: "${file.relativePath}".`,
        ].join(" "),
      );

      continue;
    }

    routeMap.set(route, file);
  }

  return {
    files: [...routeMap.values()],
    duplicateErrors,
  };
}

/**
 * Compares the current route registry with an earlier registry.
 */
function compareRouteRegistries(
  currentRoutes: TranslationRoute[],
  previousRoutes: TranslationRoute[],
): RouteRegistryComparison {
  const currentByRoute = new Map(
    currentRoutes.map((route) => [
      route.route,
      route,
    ]),
  );

  const previousByRoute = new Map(
    previousRoutes.map((route) => [
      route.route,
      route,
    ]),
  );

  const newlyDiscoveredRoutes: TranslationRoute[] = [];
  const updatedRoutes: TranslationRoute[] = [];
  const removedRoutes: TranslationRoute[] = [];

  for (const currentRoute of currentRoutes) {
    const previousRoute = previousByRoute.get(
      currentRoute.route,
    );

    if (!previousRoute) {
      newlyDiscoveredRoutes.push(currentRoute);
      continue;
    }

    const hasChanged =
      currentRoute.title !== previousRoute.title ||
      currentRoute.sourceFile !==
        previousRoute.sourceFile ||
      currentRoute.namespace !==
        previousRoute.namespace ||
      currentRoute.isDynamic !==
        previousRoute.isDynamic ||
      currentRoute.isPublic !==
        previousRoute.isPublic ||
      currentRoute.requiresAuthentication !==
        previousRoute.requiresAuthentication ||
      currentRoute.portal !== previousRoute.portal;

    if (hasChanged) {
      updatedRoutes.push(currentRoute);
    }
  }

  for (const previousRoute of previousRoutes) {
    if (!currentByRoute.has(previousRoute.route)) {
      removedRoutes.push(previousRoute);
    }
  }

  return {
    newlyDiscoveredRoutes,
    updatedRoutes,
    removedRoutes,
  };
}

/**
 * Sorts routes in a predictable order.
 *
 * Home appears first, followed by all other routes
 * alphabetically.
 */
function sortRoutes(
  routes: TranslationRoute[],
): TranslationRoute[] {
  return [...routes].sort((first, second) => {
    if (first.route === "/") {
      return -1;
    }

    if (second.route === "/") {
      return 1;
    }

    return first.route.localeCompare(second.route);
  });
}

/**
 * Sorts page records by route.
 */
function sortPages(
  pages: TranslationPage[],
): TranslationPage[] {
  return [...pages].sort((first, second) => {
    if (first.route === "/") {
      return -1;
    }

    if (second.route === "/") {
      return 1;
    }

    return first.route.localeCompare(second.route);
  });
}

/**
 * Finds an existing route using its route path or source file.
 */
function findExistingRoute(
  file: DiscoveredProjectFile,
  existingRoutes: TranslationRoute[],
): TranslationRoute | undefined {
  return existingRoutes.find(
    (route) =>
      route.route === file.route ||
      route.sourceFile === file.relativePath,
  );
}

/**
 * Finds an existing page using its route path or source file.
 */
function findExistingPage(
  route: TranslationRoute,
  file: DiscoveredProjectFile,
  existingPages: TranslationPage[],
): TranslationPage | undefined {
  return existingPages.find(
    (page) =>
      page.route === route.route ||
      page.sourceFile === file.relativePath,
  );
}

/**
 * Scans discovered page files and creates the official
 * Translation Center route and page registries.
 */
export function scanRoutes(
  files: DiscoveredProjectFile[],
  scannerOptions: RouteScannerOptions = {},
): RouteScanResult {
  const startedAt = nowIso();
  const startTime = Date.now();

  const options = {
    ...DEFAULT_ROUTE_SCANNER_OPTIONS,
    ...scannerOptions,
  };

  const existingRoutes =
    scannerOptions.existingRoutes ?? [];

  const existingPages =
    scannerOptions.existingPages ?? [];

  const availableNamespaces = new Set(
    scannerOptions.availableNamespaces ?? [],
  );

  const errors: string[] = [];

  const candidateFiles = files.filter((file) =>
    shouldIncludeRouteFile(file, options),
  );

  const {
    files: uniqueRouteFiles,
    duplicateErrors,
  } = deduplicateRouteFiles(candidateFiles);

  errors.push(...duplicateErrors);

  const routes: TranslationRoute[] = [];
  const pages: TranslationPage[] = [];

  for (const file of uniqueRouteFiles) {
    try {
      const existingRoute = findExistingRoute(
        file,
        existingRoutes,
      );

      const route = createRouteRecord(
        file,
        options.generateMissingNamespaces,
        existingRoute,
      );

      const existingPage = findExistingPage(
        route,
        file,
        existingPages,
      );

      const page = createPageRecord(
        file,
        route,
        availableNamespaces,
        existingPage,
      );

      routes.push(route);
      pages.push(page);
    } catch (error) {
      errors.push(
        `Unable to register route from "${file.relativePath}": ${
          error instanceof Error
            ? error.message
            : "Unknown route scanning error"
        }`,
      );
    }
  }

  const sortedRoutes = sortRoutes(routes);
  const sortedPages = sortPages(pages);

  const comparison = compareRouteRegistries(
    sortedRoutes,
    existingRoutes,
  );

  const publicRoutes = sortedRoutes.filter(
    (route) => route.isPublic,
  );

  const authenticatedRoutes = sortedRoutes.filter(
    (route) => route.requiresAuthentication,
  );

  const dynamicRoutes = sortedRoutes.filter(
    (route) => route.isDynamic,
  );

  const routesWithoutNamespaces = sortedRoutes.filter(
    (route) => !route.namespace,
  );

  const routesWithMissingNamespaceFiles =
    sortedRoutes.filter(
      (route) =>
        route.namespace !== null &&
        !availableNamespaces.has(route.namespace),
    );

  const completedAt = nowIso();

  return {
    success: errors.length === 0,
    scanId: createStableId(
      "route-scan",
      startedAt,
      sortedRoutes.length,
    ),
    startedAt,
    completedAt,
    durationMs: Date.now() - startTime,
    routes: sortedRoutes,
    pages: sortedPages,
    publicRoutes,
    authenticatedRoutes,
    dynamicRoutes,
    newlyDiscoveredRoutes:
      comparison.newlyDiscoveredRoutes,
    updatedRoutes: comparison.updatedRoutes,
    removedRoutes: comparison.removedRoutes,
    routesWithoutNamespaces,
    routesWithMissingNamespaceFiles,
    errors,
  };
}

/**
 * Creates a route registry directly from a complete
 * project file scan result.
 */
export function scanRoutesFromProjectFiles(
  projectScan: ProjectFileScanResult,
  options: RouteScannerOptions = {},
): RouteScanResult {
  return scanRoutes(projectScan.routeFiles, options);
}

/**
 * Returns the translation coverage of the registered pages.
 *
 * This uses the page records currently available. The number
 * becomes fully accurate after namespace validation.
 */
export function calculatePageRegistryCoverage(
  pages: TranslationPage[],
): number {
  if (pages.length === 0) {
    return 100;
  }

  const totalCoverage = pages.reduce(
    (sum, page) => {
      const languageCoverage =
        IBOS_ENABLED_LANGUAGES.reduce(
          (languageSum, language) =>
            languageSum +
            page.languages[language]
              .coveragePercentage,
          0,
        );

      const averageLanguageCoverage =
        languageCoverage /
        IBOS_ENABLED_LANGUAGES.length;

      return sum + averageLanguageCoverage;
    },
    0,
  );

  return calculatePercentage(
    totalCoverage,
    pages.length * 100,
  );
}

/**
 * Returns every namespace referenced by a route.
 */
export function getRegisteredRouteNamespaces(
  routes: TranslationRoute[],
): string[] {
  return [
    ...new Set(
      routes
        .map((route) => route.namespace)
        .filter(
          (namespace): namespace is string =>
            Boolean(namespace),
        ),
    ),
  ].sort();
}

/**
 * Returns all routes assigned to a specific portal.
 */
export function getRoutesByPortal(
  routes: TranslationRoute[],
  portal: string,
): TranslationRoute[] {
  return routes.filter(
    (route) => route.portal === portal,
  );
}

/**
 * Returns the registered route by URL.
 */
export function findRouteByPath(
  routes: TranslationRoute[],
  routePath: string,
): TranslationRoute | undefined {
  return routes.find(
    (route) => route.route === routePath,
  );
}

/**
 * Returns the registered page by namespace.
 */
export function findPageByNamespace(
  pages: TranslationPage[],
  namespace: string,
): TranslationPage | undefined {
  return pages.find(
    (page) => page.namespace === namespace,
  );
}

/**
 * Returns pages requiring translation action.
 */
export function getNonCompliantPages(
  pages: TranslationPage[],
): TranslationPage[] {
  return pages.filter(
    (page) =>
      page.complianceStatus !== "compliant",
  );
}