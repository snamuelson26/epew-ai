/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Source Intelligence Engine
 * Dependency Graph Builder
 * Version: 1.0.0
 * ============================================================
 */

import path from "node:path";

import type { DiscoveredProjectFile } from "../file-scanner";

import {
  createStableId,
  normalizePath,
  uniqueValues,
} from "../utils";

import type {
  ImportedComponentRecord,
  ProjectImportAnalysis,
  SourceImportRecord,
} from "./import-analyzer";

/**
 * Supported dependency-node categories.
 */
export type DependencyNodeKind =
  | "page"
  | "layout"
  | "component"
  | "template"
  | "dialog"
  | "form"
  | "notification"
  | "email"
  | "sms"
  | "whatsapp"
  | "api"
  | "enterprise_engine"
  | "utility"
  | "translation_resource"
  | "unknown";

/**
 * Relationship between two dependency nodes.
 */
export type DependencyEdgeKind =
  | "imports"
  | "renders"
  | "depends_on"
  | "dynamic_import"
  | "requires"
  | "layout_wraps"
  | "route_uses"
  | "shared_dependency";

/**
 * Importance assigned to one dependency relationship.
 */
export type DependencyEdgeStrength =
  | "direct"
  | "indirect"
  | "shared";

/**
 * One source file represented in the dependency graph.
 */
export interface DependencyGraphNode {
  id: string;
  file: string;
  absolutePath: string;
  fileName: string;
  extension: string;

  kind: DependencyNodeKind;
  resourceType: DiscoveredProjectFile["resourceType"];

  route: string | null;
  namespace: string | null;
  portal: string | null;

  componentName: string;
  isRouteEntry: boolean;
  isDynamicRoute: boolean;
  isShared: boolean;
  isOrphan: boolean;

  directDependencyCount: number;
  directDependentCount: number;
  transitiveDependencyCount: number;
  routeUsageCount: number;

  importedByFiles: string[];
  importsFiles: string[];
  usedByRoutes: string[];
}

/**
 * One directional graph relationship.
 */
export interface DependencyGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;

  sourceFile: string;
  targetFile: string;

  kind: DependencyEdgeKind;
  strength: DependencyEdgeStrength;

  importedComponents: string[];
  importModules: string[];

  lineNumbers: number[];

  isDynamic: boolean;
  isTypeOnly: boolean;
  isCircular: boolean;
}

/**
 * A circular dependency detected in the project graph.
 */
export interface CircularDependency {
  id: string;
  files: string[];
  cyclePath: string[];
  length: number;
}

/**
 * One route and all source files required by it.
 */
export interface RouteDependencyGraph {
  id: string;
  route: string;
  namespace: string | null;
  portal: string | null;

  entryFile: string;
  layoutFiles: string[];

  directDependencies: string[];
  transitiveDependencies: string[];
  componentFiles: string[];

  dependencyDepth: number;
  totalFiles: number;

  hasCircularDependencies: boolean;
  circularDependencyIds: string[];
}

/**
 * One source file's dependency tree.
 */
export interface FileDependencyTree {
  sourceFile: string;
  directDependencies: string[];
  transitiveDependencies: string[];
  dependents: string[];
  depth: number;
}

/**
 * Complete project dependency graph.
 */
export interface ProjectDependencyGraph {
  success: boolean;

  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];

  routeGraphs: RouteDependencyGraph[];
  circularDependencies: CircularDependency[];

  orphanFiles: string[];
  sharedFiles: string[];
  unresolvedInternalModules: string[];

  totalNodes: number;
  totalEdges: number;
  totalRoutes: number;
  maximumDependencyDepth: number;

  errors: string[];
}

/**
 * Dependency-graph configuration.
 */
export interface DependencyGraphBuilderOptions {
  /**
   * Include type-only imports as dependency edges.
   */
  includeTypeOnlyImports?: boolean;

  /**
   * Include JSON and translation resource dependencies.
   */
  includeResourceFiles?: boolean;

  /**
   * Include unresolved internal imports in the result.
   */
  includeUnresolvedModules?: boolean;

  /**
   * Detect circular dependencies.
   */
  detectCircularDependencies?: boolean;

  /**
   * Maximum recursion depth used when building transitive graphs.
   */
  maximumDepth?: number;

  /**
   * A file is considered shared when used by at least this many routes.
   */
  sharedRouteThreshold?: number;
}

/**
 * Default graph options.
 */
const DEFAULT_OPTIONS: Required<
  Pick<
    DependencyGraphBuilderOptions,
    | "includeTypeOnlyImports"
    | "includeResourceFiles"
    | "includeUnresolvedModules"
    | "detectCircularDependencies"
    | "maximumDepth"
    | "sharedRouteThreshold"
  >
> = {
  includeTypeOnlyImports: false,
  includeResourceFiles: true,
  includeUnresolvedModules: true,
  detectCircularDependencies: true,
  maximumDepth: 100,
  sharedRouteThreshold: 2,
};

/**
 * Converts a discovered resource type into a graph-node kind.
 */
function determineNodeKind(
  file: DiscoveredProjectFile,
): DependencyNodeKind {
  switch (file.resourceType) {
    case "page":
      return "page";

    case "layout":
      return "layout";

    case "component":
      return "component";

    case "template":
      return "template";

    case "dialog":
      return "dialog";

    case "form":
      return "form";

    case "notification":
      return "notification";

    case "email":
      return "email";

    case "sms":
      return "sms";

    case "whatsapp":
      return "whatsapp";

    case "api_response":
      return "api";

    case "enterprise_engine":
      return "enterprise_engine";

    default:
      break;
  }

  if (file.extension === ".json") {
    return "translation_resource";
  }

  if (
    file.relativePath.includes("/utils/") ||
    file.relativePath.includes("/lib/")
  ) {
    return "utility";
  }

  return "unknown";
}

/**
 * Returns a readable component name from a source file.
 */
function getComponentName(
  file: DiscoveredProjectFile,
): string {
  const baseName = path.basename(
    file.relativePath,
    path.extname(file.relativePath),
  );

  if (baseName === "page" && file.route) {
    if (file.route === "/") {
      return "HomePage";
    }

    const routeSegments = file.route
      .split("/")
      .filter(Boolean)
      .map((segment) =>
        segment
          .replace(/[[\]()._-]+/g, " ")
          .split(/\s+/)
          .filter(Boolean)
          .map(
            (word) =>
              word.charAt(0).toUpperCase() +
              word.slice(1),
          )
          .join(""),
      );

    return `${routeSegments.join("") || "Root"}Page`;
  }

  if (baseName === "layout") {
    return file.portal
      ? `${capitalize(file.portal)}Layout`
      : "ApplicationLayout";
  }

  return baseName || "UnknownComponent";
}

/**
 * Capitalizes one value.
 */
function capitalize(value: string): string {
  return value
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : value;
}

/**
 * Determines whether a discovered file should become a graph node.
 */
function shouldIncludeFile(
  file: DiscoveredProjectFile,
  includeResourceFiles: boolean,
): boolean {
  if (includeResourceFiles) {
    return true;
  }

  return file.extension !== ".json";
}

/**
 * Creates a map of discovered files by normalized relative path.
 */
function createFileMap(
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
 * Groups import records by source and target file.
 */
function groupImportsByRelationship(
  imports: SourceImportRecord[],
  includeTypeOnlyImports: boolean,
): Map<string, SourceImportRecord[]> {
  const groups = new Map<string, SourceImportRecord[]>();

  for (const sourceImport of imports) {
    if (!sourceImport.resolvedFile) {
      continue;
    }

    if (
      sourceImport.isTypeOnly &&
      !includeTypeOnlyImports
    ) {
      continue;
    }

    const relationshipKey = [
      normalizePath(sourceImport.sourceFile),
      normalizePath(sourceImport.resolvedFile),
    ].join("::");

    const existing = groups.get(relationshipKey) ?? [];
    existing.push(sourceImport);
    groups.set(relationshipKey, existing);
  }

  return groups;
}

/**
 * Finds components belonging to one import relationship.
 */
function getImportedComponentsForRelationship(input: {
  importedComponents: ImportedComponentRecord[];
  sourceFile: string;
  targetFile: string;
}): string[] {
  return uniqueValues(
    input.importedComponents
      .filter(
        (component) =>
          component.sourceFile === input.sourceFile &&
          component.resolvedFile === input.targetFile,
      )
      .map((component) => component.componentName),
  ).sort();
}

/**
 * Determines the most appropriate dependency-edge kind.
 */
function determineEdgeKind(
  imports: SourceImportRecord[],
  targetFile: DiscoveredProjectFile,
): DependencyEdgeKind {
  if (
    imports.some(
      (sourceImport) =>
        sourceImport.importKind === "dynamic",
    )
  ) {
    return "dynamic_import";
  }

  if (
    imports.some(
      (sourceImport) =>
        sourceImport.importKind === "require",
    )
  ) {
    return "requires";
  }

  if (targetFile.resourceType === "component") {
    return "renders";
  }

  if (targetFile.resourceType === "layout") {
    return "layout_wraps";
  }

  return "imports";
}

/**
 * Creates dependency edges from import analysis.
 */
function createEdges(input: {
  importAnalysis: ProjectImportAnalysis;
  fileMap: Map<string, DiscoveredProjectFile>;
  includeTypeOnlyImports: boolean;
}): DependencyGraphEdge[] {
  const relationshipGroups =
    groupImportsByRelationship(
      input.importAnalysis.imports,
      input.includeTypeOnlyImports,
    );

  const edges: DependencyGraphEdge[] = [];

  for (const imports of relationshipGroups.values()) {
    const firstImport = imports[0];

    if (!firstImport?.resolvedFile) {
      continue;
    }

    const sourceFile = normalizePath(
      firstImport.sourceFile,
    );

    const targetFile = normalizePath(
      firstImport.resolvedFile,
    );

    const sourceNodeFile =
      input.fileMap.get(sourceFile);

    const targetNodeFile =
      input.fileMap.get(targetFile);

    if (!sourceNodeFile || !targetNodeFile) {
      continue;
    }

    const importedComponents =
      getImportedComponentsForRelationship({
        importedComponents:
          input.importAnalysis.importedComponents,
        sourceFile,
        targetFile,
      });

    edges.push({
      id: createStableId(
        "dependency-edge",
        sourceFile,
        targetFile,
      ),
      sourceNodeId: createStableId(
        "dependency-node",
        sourceFile,
      ),
      targetNodeId: createStableId(
        "dependency-node",
        targetFile,
      ),

      sourceFile,
      targetFile,

      kind: determineEdgeKind(
        imports,
        targetNodeFile,
      ),
      strength: "direct",

      importedComponents,
      importModules: uniqueValues(
        imports.map(
          (sourceImport) =>
            sourceImport.sourceModule,
        ),
      ),

      lineNumbers: uniqueValues(
        imports.map(
          (sourceImport) =>
            String(sourceImport.line),
        ),
      )
        .map(Number)
        .sort((first, second) => first - second),

      isDynamic: imports.some(
        (sourceImport) =>
          sourceImport.isDynamic,
      ),

      isTypeOnly: imports.every(
        (sourceImport) =>
          sourceImport.isTypeOnly,
      ),

      isCircular: false,
    });
  }

  return edges.sort((first, second) => {
    const sourceComparison =
      first.sourceFile.localeCompare(
        second.sourceFile,
      );

    if (sourceComparison !== 0) {
      return sourceComparison;
    }

    return first.targetFile.localeCompare(
      second.targetFile,
    );
  });
}

/**
 * Creates an adjacency map.
 */
function createAdjacencyMap(
  edges: DependencyGraphEdge[],
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    const current =
      adjacency.get(edge.sourceFile) ?? [];

    current.push(edge.targetFile);

    adjacency.set(
      edge.sourceFile,
      uniqueValues(current),
    );
  }

  return adjacency;
}

/**
 * Creates a reverse adjacency map.
 */
function createReverseAdjacencyMap(
  edges: DependencyGraphEdge[],
): Map<string, string[]> {
  const reverse = new Map<string, string[]>();

  for (const edge of edges) {
    const current =
      reverse.get(edge.targetFile) ?? [];

    current.push(edge.sourceFile);

    reverse.set(
      edge.targetFile,
      uniqueValues(current),
    );
  }

  return reverse;
}

/**
 * Returns all transitive dependencies for one source file.
 */
function collectTransitiveDependencies(input: {
  sourceFile: string;
  adjacency: Map<string, string[]>;
  maximumDepth: number;
}): {
  dependencies: string[];
  depth: number;
} {
  const visited = new Set<string>();
  const queue: Array<{
    file: string;
    depth: number;
  }> = [];

  for (const dependency of input.adjacency.get(
    input.sourceFile,
  ) ?? []) {
    queue.push({
      file: dependency,
      depth: 1,
    });
  }

  let maximumDepthReached = 0;

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    if (current.depth > input.maximumDepth) {
      continue;
    }

    maximumDepthReached = Math.max(
      maximumDepthReached,
      current.depth,
    );

    if (visited.has(current.file)) {
      continue;
    }

    visited.add(current.file);

    for (const dependency of input.adjacency.get(
      current.file,
    ) ?? []) {
      if (!visited.has(dependency)) {
        queue.push({
          file: dependency,
          depth: current.depth + 1,
        });
      }
    }
  }

  visited.delete(input.sourceFile);

  return {
    dependencies: [...visited].sort(),
    depth: maximumDepthReached,
  };
}

/**
 * Detects circular dependencies using depth-first traversal.
 */
function detectCircularDependencies(input: {
  files: string[];
  adjacency: Map<string, string[]>;
}): CircularDependency[] {
  const cycles = new Map<string, CircularDependency>();

  const visit = (
    currentFile: string,
    pathStack: string[],
    activePath: Set<string>,
  ): void => {
    if (activePath.has(currentFile)) {
      const cycleStartIndex =
        pathStack.indexOf(currentFile);

      if (cycleStartIndex === -1) {
        return;
      }

      const cyclePath = [
        ...pathStack.slice(cycleStartIndex),
        currentFile,
      ];

      const cycleFiles = uniqueValues(
        cyclePath.slice(0, -1),
      );

      const canonicalFiles = [...cycleFiles].sort();
      const canonicalKey = canonicalFiles.join("::");

      if (!cycles.has(canonicalKey)) {
        cycles.set(canonicalKey, {
          id: createStableId(
            "circular-dependency",
            canonicalKey,
          ),
          files: canonicalFiles,
          cyclePath,
          length: cycleFiles.length,
        });
      }

      return;
    }

    const nextActivePath = new Set(activePath);
    nextActivePath.add(currentFile);

    const nextPathStack = [
      ...pathStack,
      currentFile,
    ];

    for (const dependency of input.adjacency.get(
      currentFile,
    ) ?? []) {
      visit(
        dependency,
        nextPathStack,
        nextActivePath,
      );
    }
  };

  for (const file of input.files) {
    visit(file, [], new Set<string>());
  }

  return [...cycles.values()].sort(
    (first, second) =>
      first.length - second.length,
  );
}

/**
 * Marks graph edges participating in circular dependencies.
 */
function markCircularEdges(
  edges: DependencyGraphEdge[],
  circularDependencies: CircularDependency[],
): DependencyGraphEdge[] {
  const circularRelationships = new Set<string>();

  for (const cycle of circularDependencies) {
    for (
      let index = 0;
      index < cycle.cyclePath.length - 1;
      index += 1
    ) {
      const sourceFile = cycle.cyclePath[index];
      const targetFile = cycle.cyclePath[index + 1];

      if (!sourceFile || !targetFile) {
        continue;
      }

      circularRelationships.add(
        `${sourceFile}::${targetFile}`,
      );
    }
  }

  return edges.map((edge) => ({
    ...edge,
    isCircular: circularRelationships.has(
      `${edge.sourceFile}::${edge.targetFile}`,
    ),
  }));
}

/**
 * Finds layout files that apply to one page.
 */
function findApplicableLayouts(input: {
  pageFile: DiscoveredProjectFile;
  files: DiscoveredProjectFile[];
}): string[] {
  const pageDirectory = path.dirname(
    input.pageFile.relativePath,
  );

  const layouts = input.files
    .filter(
      (file) =>
        file.resourceType === "layout",
    )
    .filter((layoutFile) => {
      const layoutDirectory = path.dirname(
        layoutFile.relativePath,
      );

      return (
        pageDirectory === layoutDirectory ||
        pageDirectory.startsWith(
          `${layoutDirectory}/`,
        )
      );
    })
    .sort((first, second) => {
      const firstDepth =
        normalizePath(first.relativePath).split("/")
          .length;

      const secondDepth =
        normalizePath(second.relativePath).split("/")
          .length;

      return firstDepth - secondDepth;
    });

  return layouts.map(
    (layout) => layout.relativePath,
  );
}

/**
 * Builds dependency information for one route.
 */
function createRouteGraph(input: {
  pageFile: DiscoveredProjectFile;
  files: DiscoveredProjectFile[];
  adjacency: Map<string, string[]>;
  maximumDepth: number;
  circularDependencies: CircularDependency[];
}): RouteDependencyGraph {
  const directDependencies =
    input.adjacency.get(
      input.pageFile.relativePath,
    ) ?? [];

  const transitive =
    collectTransitiveDependencies({
      sourceFile: input.pageFile.relativePath,
      adjacency: input.adjacency,
      maximumDepth: input.maximumDepth,
    });

  const layoutFiles = findApplicableLayouts({
    pageFile: input.pageFile,
    files: input.files,
  });

  const layoutDependencies = uniqueValues(
    layoutFiles.flatMap((layoutFile) => {
      const layoutTransitive =
        collectTransitiveDependencies({
          sourceFile: layoutFile,
          adjacency: input.adjacency,
          maximumDepth: input.maximumDepth,
        });

      return [
        layoutFile,
        ...(input.adjacency.get(layoutFile) ?? []),
        ...layoutTransitive.dependencies,
      ];
    }),
  );

  const allDependencies = uniqueValues([
    ...transitive.dependencies,
    ...layoutDependencies,
  ]).filter(
    (file) =>
      file !== input.pageFile.relativePath,
  );

  const componentFiles = allDependencies.filter(
    (filePath) => {
      const file = input.files.find(
        (candidate) =>
          candidate.relativePath === filePath,
      );

      return (
        file?.resourceType === "component" ||
        file?.resourceType === "form" ||
        file?.resourceType === "dialog" ||
        file?.resourceType === "template"
      );
    },
  );

  const relatedCircularDependencies =
    input.circularDependencies.filter(
      (cycle) =>
        cycle.files.includes(
          input.pageFile.relativePath,
        ) ||
        cycle.files.some((file) =>
          allDependencies.includes(file),
        ),
    );

  return {
    id: createStableId(
      "route-dependency-graph",
      input.pageFile.route ??
        input.pageFile.relativePath,
    ),
    route:
      input.pageFile.route ??
      input.pageFile.relativePath,
    namespace: input.pageFile.namespace,
    portal: input.pageFile.portal,

    entryFile: input.pageFile.relativePath,
    layoutFiles,

    directDependencies:
      uniqueValues(directDependencies).sort(),
    transitiveDependencies:
      allDependencies.sort(),
    componentFiles:
      uniqueValues(componentFiles).sort(),

    dependencyDepth: transitive.depth,
    totalFiles:
      1 + allDependencies.length,

    hasCircularDependencies:
      relatedCircularDependencies.length > 0,
    circularDependencyIds:
      relatedCircularDependencies.map(
        (cycle) => cycle.id,
      ),
  };
}

/**
 * Builds a route-usage map for every source file.
 */
function createRouteUsageMap(
  routeGraphs: RouteDependencyGraph[],
): Map<string, string[]> {
  const usageMap = new Map<string, string[]>();

  for (const routeGraph of routeGraphs) {
    const relatedFiles = uniqueValues([
      routeGraph.entryFile,
      ...routeGraph.layoutFiles,
      ...routeGraph.directDependencies,
      ...routeGraph.transitiveDependencies,
    ]);

    for (const file of relatedFiles) {
      const routes = usageMap.get(file) ?? [];
      routes.push(routeGraph.route);

      usageMap.set(
        file,
        uniqueValues(routes),
      );
    }
  }

  return usageMap;
}

/**
 * Creates graph nodes.
 */
function createNodes(input: {
  files: DiscoveredProjectFile[];
  edges: DependencyGraphEdge[];
  routeGraphs: RouteDependencyGraph[];
  adjacency: Map<string, string[]>;
  reverseAdjacency: Map<string, string[]>;
  maximumDepth: number;
  sharedRouteThreshold: number;
}): DependencyGraphNode[] {
  const routeUsageMap = createRouteUsageMap(
    input.routeGraphs,
  );

  return input.files
    .map((file) => {
      const importsFiles =
        input.adjacency.get(file.relativePath) ?? [];

      const importedByFiles =
        input.reverseAdjacency.get(
          file.relativePath,
        ) ?? [];

      const transitive =
        collectTransitiveDependencies({
          sourceFile: file.relativePath,
          adjacency: input.adjacency,
          maximumDepth: input.maximumDepth,
        });

      const usedByRoutes =
        routeUsageMap.get(file.relativePath) ?? [];

      const isRouteEntry =
        file.resourceType === "page" &&
        file.route !== null;

      const isOrphan =
        !isRouteEntry &&
        importedByFiles.length === 0 &&
        usedByRoutes.length === 0;

      return {
        id: createStableId(
          "dependency-node",
          file.relativePath,
        ),
        file: file.relativePath,
        absolutePath: file.absolutePath,
        fileName: file.fileName,
        extension: file.extension,

        kind: determineNodeKind(file),
        resourceType: file.resourceType,

        route: file.route,
        namespace: file.namespace,
        portal: file.portal,

        componentName: getComponentName(file),
        isRouteEntry,
        isDynamicRoute:
          Boolean(file.route) &&
          /\[[^\]]+\]/.test(
            file.route ?? "",
          ),
        isShared:
          usedByRoutes.length >=
          input.sharedRouteThreshold,
        isOrphan,

        directDependencyCount:
          importsFiles.length,
        directDependentCount:
          importedByFiles.length,
        transitiveDependencyCount:
          transitive.dependencies.length,
        routeUsageCount: usedByRoutes.length,

        importedByFiles:
          uniqueValues(importedByFiles).sort(),
        importsFiles:
          uniqueValues(importsFiles).sort(),
        usedByRoutes:
          uniqueValues(usedByRoutes).sort(),
      };
    })
    .sort((first, second) =>
      first.file.localeCompare(second.file),
    );
}

/**
 * Builds a complete project dependency graph.
 */
export function buildDependencyGraph(input: {
  files: DiscoveredProjectFile[];
  importAnalysis: ProjectImportAnalysis;
  options?: DependencyGraphBuilderOptions;
}): ProjectDependencyGraph {
  const options = {
    ...DEFAULT_OPTIONS,
    ...(input.options ?? {}),
  };

  const errors: string[] = [];

  const includedFiles = input.files.filter(
    (file) =>
      shouldIncludeFile(
        file,
        options.includeResourceFiles,
      ),
  );

  const fileMap = createFileMap(includedFiles);

  let edges = createEdges({
    importAnalysis: input.importAnalysis,
    fileMap,
    includeTypeOnlyImports:
      options.includeTypeOnlyImports,
  });

  const adjacency = createAdjacencyMap(edges);

  const reverseAdjacency =
    createReverseAdjacencyMap(edges);

  const circularDependencies =
    options.detectCircularDependencies
      ? detectCircularDependencies({
          files: includedFiles.map(
            (file) => file.relativePath,
          ),
          adjacency,
        })
      : [];

  edges = markCircularEdges(
    edges,
    circularDependencies,
  );

  const routeGraphs = includedFiles
    .filter(
      (file) =>
        file.resourceType === "page" &&
        file.route !== null,
    )
    .map((pageFile) =>
      createRouteGraph({
        pageFile,
        files: includedFiles,
        adjacency,
        maximumDepth: options.maximumDepth,
        circularDependencies,
      }),
    )
    .sort((first, second) =>
      first.route.localeCompare(second.route),
    );

  const nodes = createNodes({
    files: includedFiles,
    edges,
    routeGraphs,
    adjacency,
    reverseAdjacency,
    maximumDepth: options.maximumDepth,
    sharedRouteThreshold:
      options.sharedRouteThreshold,
  });

  const orphanFiles = nodes
    .filter((node) => node.isOrphan)
    .map((node) => node.file);

  const sharedFiles = nodes
    .filter((node) => node.isShared)
    .map((node) => node.file);

  const unresolvedInternalModules =
    options.includeUnresolvedModules
      ? input.importAnalysis.unresolvedModules
      : [];

  const maximumDependencyDepth =
    routeGraphs.reduce(
      (maximum, routeGraph) =>
        Math.max(
          maximum,
          routeGraph.dependencyDepth,
        ),
      0,
    );

  errors.push(
    ...input.importAnalysis.errors,
  );

  return {
    success: errors.length === 0,

    nodes,
    edges,

    routeGraphs,
    circularDependencies,

    orphanFiles,
    sharedFiles,
    unresolvedInternalModules,

    totalNodes: nodes.length,
    totalEdges: edges.length,
    totalRoutes: routeGraphs.length,
    maximumDependencyDepth,

    errors,
  };
}

/**
 * Returns one graph node by file path.
 */
export function findDependencyNode(
  graph: ProjectDependencyGraph,
  filePath: string,
): DependencyGraphNode | undefined {
  const normalizedFilePath =
    normalizePath(filePath);

  return graph.nodes.find(
    (node) =>
      normalizePath(node.file) ===
      normalizedFilePath,
  );
}

/**
 * Returns one route dependency graph.
 */
export function findRouteDependencyGraph(
  graph: ProjectDependencyGraph,
  route: string,
): RouteDependencyGraph | undefined {
  return graph.routeGraphs.find(
    (routeGraph) =>
      routeGraph.route === route,
  );
}

/**
 * Returns all direct dependencies for one file.
 */
export function getDirectDependencies(
  graph: ProjectDependencyGraph,
  sourceFile: string,
): string[] {
  return graph.edges
    .filter(
      (edge) =>
        edge.sourceFile === sourceFile,
    )
    .map((edge) => edge.targetFile)
    .sort();
}

/**
 * Returns all files that directly depend on one file.
 */
export function getDirectDependents(
  graph: ProjectDependencyGraph,
  targetFile: string,
): string[] {
  return graph.edges
    .filter(
      (edge) =>
        edge.targetFile === targetFile,
    )
    .map((edge) => edge.sourceFile)
    .sort();
}

/**
 * Returns the complete dependency tree for one file.
 */
export function getFileDependencyTree(
  graph: ProjectDependencyGraph,
  sourceFile: string,
  maximumDepth = 100,
): FileDependencyTree {
  const adjacency = createAdjacencyMap(
    graph.edges,
  );

  const transitive =
    collectTransitiveDependencies({
      sourceFile,
      adjacency,
      maximumDepth,
    });

  return {
    sourceFile,
    directDependencies:
      getDirectDependencies(
        graph,
        sourceFile,
      ),
    transitiveDependencies:
      transitive.dependencies,
    dependents:
      getDirectDependents(
        graph,
        sourceFile,
      ),
    depth: transitive.depth,
  };
}

/**
 * Returns all components used by one route.
 */
export function getComponentsForRoute(
  graph: ProjectDependencyGraph,
  route: string,
): DependencyGraphNode[] {
  const routeGraph =
    findRouteDependencyGraph(
      graph,
      route,
    );

  if (!routeGraph) {
    return [];
  }

  const componentFileSet = new Set(
    routeGraph.componentFiles,
  );

  return graph.nodes.filter(
    (node) =>
      componentFileSet.has(node.file),
  );
}

/**
 * Returns all routes that depend on one file.
 */
export function getRoutesUsingFile(
  graph: ProjectDependencyGraph,
  filePath: string,
): string[] {
  const node = findDependencyNode(
    graph,
    filePath,
  );

  return node?.usedByRoutes ?? [];
}

/**
 * Returns files used by multiple routes.
 */
export function getSharedDependencyNodes(
  graph: ProjectDependencyGraph,
): DependencyGraphNode[] {
  return graph.nodes.filter(
    (node) => node.isShared,
  );
}

/**
 * Returns graph nodes that are not connected to any route or source.
 */
export function getOrphanDependencyNodes(
  graph: ProjectDependencyGraph,
): DependencyGraphNode[] {
  return graph.nodes.filter(
    (node) => node.isOrphan,
  );
}

/**
 * Returns circular dependencies involving one file.
 */
export function getCircularDependenciesForFile(
  graph: ProjectDependencyGraph,
  filePath: string,
): CircularDependency[] {
  return graph.circularDependencies.filter(
    (cycle) =>
      cycle.files.includes(filePath),
  );
}

/**
 * Determines whether one file directly or transitively depends
 * on another file.
 */
export function fileDependsOn(
  graph: ProjectDependencyGraph,
  sourceFile: string,
  targetFile: string,
): boolean {
  const dependencyTree =
    getFileDependencyTree(
      graph,
      sourceFile,
    );

  return (
    dependencyTree.directDependencies.includes(
      targetFile,
    ) ||
    dependencyTree.transitiveDependencies.includes(
      targetFile,
    )
  );
}

/**
 * Returns the impact of changing one source file.
 *
 * This includes every route and source file that depends on it.
 */
export function calculateFileChangeImpact(
  graph: ProjectDependencyGraph,
  changedFile: string,
): {
  changedFile: string;
  affectedFiles: string[];
  affectedRoutes: string[];
  hasCircularDependencyRisk: boolean;
} {
  const reverseAdjacency =
    createReverseAdjacencyMap(
      graph.edges,
    );

  const affected = new Set<string>();
  const queue = [
    ...(reverseAdjacency.get(changedFile) ?? []),
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || affected.has(current)) {
      continue;
    }

    affected.add(current);

    for (const dependent of reverseAdjacency.get(
      current,
    ) ?? []) {
      if (!affected.has(dependent)) {
        queue.push(dependent);
      }
    }
  }

  const affectedFiles = [...affected].sort();

  const affectedRoutes = uniqueValues([
    ...getRoutesUsingFile(
      graph,
      changedFile,
    ),
    ...affectedFiles.flatMap(
      (file) =>
        getRoutesUsingFile(graph, file),
    ),
  ]).sort();

  return {
    changedFile,
    affectedFiles,
    affectedRoutes,
    hasCircularDependencyRisk:
      getCircularDependenciesForFile(
        graph,
        changedFile,
      ).length > 0,
  };
}