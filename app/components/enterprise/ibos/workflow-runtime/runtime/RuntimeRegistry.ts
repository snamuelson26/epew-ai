/**
 * ============================================================
 * IBOS Enterprise Operating System (IBOS-EOS)
 * Workflow Runtime
 * Runtime Registry
 *
 * Version: 1.0.0
 * ============================================================
 */

import {
  WorkflowDefinition,
  WorkflowDefinitionReference,
  WorkflowDefinitionRegistry,
  WorkflowHandlerRegistration,
  WorkflowHandlerRegistry,
  WorkflowId,
} from "../RuntimeTypes";

import {
  InvalidWorkflowDefinitionError,
  WorkflowDefinitionAlreadyExistsError,
  WorkflowDefinitionNotFoundError,
  WorkflowHandlerNotFoundError,
} from "../WorkflowErrors";

/**
 * ============================================================
 * Internal Types
 * ============================================================
 */

type VersionMap = Map<string, WorkflowDefinition>;

export interface RuntimeRegistryStatistics {
  workflowCount: number;
  workflowVersionCount: number;
  handlerCount: number;
  compensationHandlerCount: number;
  engineCount: number;
}

export interface WorkflowRegistrationOptions {
  replace?: boolean;
  validate?: boolean;
  makeLatest?: boolean;
}

export interface HandlerRegistrationOptions {
  replace?: boolean;
}

export interface RuntimeRegistryOptions {
  allowDefinitionReplacement?: boolean;
  allowHandlerReplacement?: boolean;
  validateDefinitions?: boolean;
}

/**
 * ============================================================
 * Semantic Version Helpers
 * ============================================================
 */

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

function parseVersion(version: string): ParsedVersion | null {
  const normalized = version.trim().replace(/^v/i, "");

  const match = normalized.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/
  );

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
}

function compareVersions(left: string, right: string): number {
  const leftParsed = parseVersion(left);
  const rightParsed = parseVersion(right);

  if (!leftParsed || !rightParsed) {
    return left.localeCompare(right, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  if (leftParsed.major !== rightParsed.major) {
    return leftParsed.major - rightParsed.major;
  }

  if (leftParsed.minor !== rightParsed.minor) {
    return leftParsed.minor - rightParsed.minor;
  }

  if (leftParsed.patch !== rightParsed.patch) {
    return leftParsed.patch - rightParsed.patch;
  }

  if (!leftParsed.prerelease && rightParsed.prerelease) {
    return 1;
  }

  if (leftParsed.prerelease && !rightParsed.prerelease) {
    return -1;
  }

  return (leftParsed.prerelease ?? "").localeCompare(
    rightParsed.prerelease ?? "",
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

/**
 * ============================================================
 * Definition Cloning
 * ============================================================
 */

function cloneUnknown<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneDefinition(
  definition: WorkflowDefinition
): WorkflowDefinition {
  return cloneUnknown(definition);
}

/**
 * ============================================================
 * Validation Helpers
 * ============================================================
 */

function assertNonEmptyString(
  value: unknown,
  field: string
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidWorkflowDefinitionError(
      `Workflow definition field '${field}' must be a non-empty string.`,
      {
        field,
        value,
      }
    );
  }
}

function validateDefinition(
  definition: WorkflowDefinition
): void {
  if (!definition || typeof definition !== "object") {
    throw new InvalidWorkflowDefinitionError(
      "Workflow definition must be an object."
    );
  }

  if (!definition.metadata) {
    throw new InvalidWorkflowDefinitionError(
      "Workflow definition metadata is required."
    );
  }

  assertNonEmptyString(
    definition.metadata.id,
    "metadata.id"
  );

  assertNonEmptyString(
    definition.metadata.name,
    "metadata.name"
  );

  assertNonEmptyString(
    definition.metadata.version,
    "metadata.version"
  );

  assertNonEmptyString(
    definition.startStep,
    "startStep"
  );

  if (!Array.isArray(definition.steps)) {
    throw new InvalidWorkflowDefinitionError(
      "Workflow definition steps must be an array.",
      {
        workflowId: definition.metadata.id,
      }
    );
  }

  if (definition.steps.length === 0) {
    throw new InvalidWorkflowDefinitionError(
      "Workflow definition must contain at least one step.",
      {
        workflowId: definition.metadata.id,
      }
    );
  }

  const stepIds = new Set<string>();

  for (const step of definition.steps) {
    if (!step || typeof step !== "object") {
      throw new InvalidWorkflowDefinitionError(
        "Every workflow step must be an object.",
        {
          workflowId: definition.metadata.id,
        }
      );
    }

    assertNonEmptyString(step.id, "steps[].id");
    assertNonEmptyString(step.name, "steps[].name");

    if (stepIds.has(step.id)) {
      throw new InvalidWorkflowDefinitionError(
        `Workflow step '${step.id}' is duplicated.`,
        {
          workflowId: definition.metadata.id,
          stepId: step.id,
        }
      );
    }

    stepIds.add(step.id);

    if (step.next) {
      if (!Array.isArray(step.next)) {
        throw new InvalidWorkflowDefinitionError(
          `The 'next' property for step '${step.id}' must be an array.`,
          {
            workflowId: definition.metadata.id,
            stepId: step.id,
          }
        );
      }

      for (const nextStepId of step.next) {
        assertNonEmptyString(
          nextStepId,
          `steps['${step.id}'].next[]`
        );
      }
    }

    if (
      step.retry &&
      (!Number.isInteger(step.retry.maxAttempts) ||
        step.retry.maxAttempts < 1)
    ) {
      throw new InvalidWorkflowDefinitionError(
        `Retry maxAttempts for step '${step.id}' must be at least 1.`,
        {
          workflowId: definition.metadata.id,
          stepId: step.id,
          maxAttempts: step.retry.maxAttempts,
        }
      );
    }

    if (
      step.timeout?.enabled &&
      (!Number.isFinite(step.timeout.timeoutMs) ||
        step.timeout.timeoutMs <= 0)
    ) {
      throw new InvalidWorkflowDefinitionError(
        `Timeout for step '${step.id}' must be greater than zero.`,
        {
          workflowId: definition.metadata.id,
          stepId: step.id,
          timeoutMs: step.timeout.timeoutMs,
        }
      );
    }
  }

  if (!stepIds.has(definition.startStep)) {
    throw new InvalidWorkflowDefinitionError(
      `Start step '${definition.startStep}' does not exist.`,
      {
        workflowId: definition.metadata.id,
        startStep: definition.startStep,
      }
    );
  }

  for (const step of definition.steps) {
    for (const nextStepId of step.next ?? []) {
      if (!stepIds.has(nextStepId)) {
        throw new InvalidWorkflowDefinitionError(
          `Step '${step.id}' references unknown next step '${nextStepId}'.`,
          {
            workflowId: definition.metadata.id,
            stepId: step.id,
            nextStepId,
          }
        );
      }
    }

    if (
      step.compensateWith &&
      !stepIds.has(step.compensateWith)
    ) {
      throw new InvalidWorkflowDefinitionError(
        `Step '${step.id}' references unknown compensation step '${step.compensateWith}'.`,
        {
          workflowId: definition.metadata.id,
          stepId: step.id,
          compensateWith: step.compensateWith,
        }
      );
    }
  }
}

/**
 * ============================================================
 * Runtime Registry
 * ============================================================
 */

export class RuntimeRegistry {
  private readonly definitions =
    new Map<WorkflowId, VersionMap>();

  private readonly latestVersions =
    new Map<WorkflowId, string>();

  private readonly handlers =
    new Map<string, WorkflowHandlerRegistration>();

  private readonly engineHandlers =
    new Map<string, Set<string>>();

  private readonly options: Required<RuntimeRegistryOptions>;

  constructor(options: RuntimeRegistryOptions = {}) {
    this.options = {
      allowDefinitionReplacement:
        options.allowDefinitionReplacement ?? false,
      allowHandlerReplacement:
        options.allowHandlerReplacement ?? false,
      validateDefinitions:
        options.validateDefinitions ?? true,
    };
  }

  /**
   * ==========================================================
   * Workflow Definitions
   * ==========================================================
   */

  register(
    definition: WorkflowDefinition,
    options: WorkflowRegistrationOptions = {}
  ): void {
    const shouldValidate =
      options.validate ?? this.options.validateDefinitions;

    if (shouldValidate) {
      validateDefinition(definition);
    }

    const workflowId = definition.metadata.id.trim();
    const version = definition.metadata.version.trim();

    const versions =
      this.definitions.get(workflowId) ??
      new Map<string, WorkflowDefinition>();

    const exists = versions.has(version);

    const mayReplace =
      options.replace ??
      this.options.allowDefinitionReplacement;

    if (exists && !mayReplace) {
      throw new WorkflowDefinitionAlreadyExistsError(
        `${workflowId}@${version}`
      );
    }

    const storedDefinition = cloneDefinition({
      ...definition,
      metadata: {
        ...definition.metadata,
        id: workflowId,
        version,
      },
    });

    versions.set(version, storedDefinition);
    this.definitions.set(workflowId, versions);

    if (
      options.makeLatest === true ||
      !this.latestVersions.has(workflowId)
    ) {
      this.latestVersions.set(workflowId, version);
      return;
    }

    if (options.makeLatest === false) {
      return;
    }

    const currentLatest =
      this.latestVersions.get(workflowId);

    if (
      !currentLatest ||
      compareVersions(version, currentLatest) > 0
    ) {
      this.latestVersions.set(workflowId, version);
    }
  }

  unregister(
    workflowId: WorkflowId,
    version?: string
  ): boolean {
    const normalizedWorkflowId = workflowId.trim();
    const versions = this.definitions.get(
      normalizedWorkflowId
    );

    if (!versions) {
      return false;
    }

    if (!version) {
      this.definitions.delete(normalizedWorkflowId);
      this.latestVersions.delete(normalizedWorkflowId);
      return true;
    }

    const normalizedVersion = version.trim();
    const removed = versions.delete(normalizedVersion);

    if (!removed) {
      return false;
    }

    if (versions.size === 0) {
      this.definitions.delete(normalizedWorkflowId);
      this.latestVersions.delete(normalizedWorkflowId);
      return true;
    }

    const currentLatest =
      this.latestVersions.get(normalizedWorkflowId);

    if (currentLatest === normalizedVersion) {
      this.latestVersions.set(
        normalizedWorkflowId,
        this.resolveLatestVersion(versions)
      );
    }

    return true;
  }

  get(
    workflowId: WorkflowId,
    version?: string
  ): WorkflowDefinition | null {
    const normalizedWorkflowId = workflowId.trim();
    const versions = this.definitions.get(
      normalizedWorkflowId
    );

    if (!versions) {
      return null;
    }

    const resolvedVersion =
      version?.trim() ??
      this.latestVersions.get(normalizedWorkflowId);

    if (!resolvedVersion) {
      return null;
    }

    const definition = versions.get(resolvedVersion);

    return definition
      ? cloneDefinition(definition)
      : null;
  }

  getRequired(
    workflowId: WorkflowId,
    version?: string
  ): WorkflowDefinition {
    const definition = this.get(workflowId, version);

    if (!definition) {
      const identifier = version
        ? `${workflowId}@${version}`
        : workflowId;

      throw new WorkflowDefinitionNotFoundError(
        identifier
      );
    }

    return definition;
  }

  getLatest(
    workflowId: WorkflowId
  ): WorkflowDefinition | null {
    return this.get(workflowId);
  }

  list(): WorkflowDefinition[] {
    const result: WorkflowDefinition[] = [];

    for (const versions of this.definitions.values()) {
      for (const definition of versions.values()) {
        result.push(cloneDefinition(definition));
      }
    }

    return result.sort((left, right) => {
      const idComparison =
        left.metadata.id.localeCompare(
          right.metadata.id
        );

      if (idComparison !== 0) {
        return idComparison;
      }

      return compareVersions(
        right.metadata.version,
        left.metadata.version
      );
    });
  }

  listLatest(): WorkflowDefinition[] {
    const result: WorkflowDefinition[] = [];

    for (const workflowId of this.definitions.keys()) {
      const latest = this.getLatest(workflowId);

      if (latest) {
        result.push(latest);
      }
    }

    return result.sort((left, right) =>
      left.metadata.id.localeCompare(
        right.metadata.id
      )
    );
  }

  listVersions(
    workflowId: WorkflowId
  ): string[] {
    const versions = this.definitions.get(
      workflowId.trim()
    );

    if (!versions) {
      return [];
    }

    return [...versions.keys()].sort((left, right) =>
      compareVersions(right, left)
    );
  }

  references(): WorkflowDefinitionReference[] {
    return this.list().map((definition) => ({
      workflowId: definition.metadata.id,
      version: definition.metadata.version,
    }));
  }

  has(
    workflowId: WorkflowId,
    version?: string
  ): boolean {
    const normalizedWorkflowId = workflowId.trim();
    const versions = this.definitions.get(
      normalizedWorkflowId
    );

    if (!versions) {
      return false;
    }

    if (!version) {
      return versions.size > 0;
    }

    return versions.has(version.trim());
  }

  hasExact(
    reference: WorkflowDefinitionReference
  ): boolean {
    return this.has(
      reference.workflowId,
      reference.version
    );
  }

  setLatestVersion(
    workflowId: WorkflowId,
    version: string
  ): void {
    const normalizedWorkflowId = workflowId.trim();
    const normalizedVersion = version.trim();

    if (
      !this.has(
        normalizedWorkflowId,
        normalizedVersion
      )
    ) {
      throw new WorkflowDefinitionNotFoundError(
        `${normalizedWorkflowId}@${normalizedVersion}`
      );
    }

    this.latestVersions.set(
      normalizedWorkflowId,
      normalizedVersion
    );
  }

  getLatestVersion(
    workflowId: WorkflowId
  ): string | null {
    return (
      this.latestVersions.get(workflowId.trim()) ??
      null
    );
  }

  /**
   * ==========================================================
   * Workflow Handlers
   * ==========================================================
   */

  registerHandler(
    registration: WorkflowHandlerRegistration,
    options: HandlerRegistrationOptions = {}
  ): void {
    this.validateHandlerRegistration(registration);

    const name = registration.name.trim();
    const exists = this.handlers.has(name);

    const mayReplace =
      options.replace ??
      this.options.allowHandlerReplacement;

    if (exists && !mayReplace) {
      throw new WorkflowDefinitionAlreadyExistsError(
        `handler:${name}`
      );
    }

    if (exists) {
      this.removeHandlerFromEngineIndex(name);
    }

    const storedRegistration: WorkflowHandlerRegistration = {
      ...registration,
      name,
      metadata: registration.metadata
        ? { ...registration.metadata }
        : undefined,
    };

    this.handlers.set(name, storedRegistration);
    this.addHandlerToEngineIndex(storedRegistration);
  }

  unregisterHandler(name: string): boolean {
    const normalizedName = name.trim();
    const removed = this.handlers.delete(normalizedName);

    if (removed) {
      this.removeHandlerFromEngineIndex(
        normalizedName
      );
    }

    return removed;
  }

  getHandler(
    name: string
  ): WorkflowHandlerRegistration | undefined {
    const registration = this.handlers.get(
      name.trim()
    );

    if (!registration) {
      return undefined;
    }

    return {
      ...registration,
      metadata: registration.metadata
        ? { ...registration.metadata }
        : undefined,
    };
  }

  getRequiredHandler(
    name: string
  ): WorkflowHandlerRegistration {
    const registration = this.getHandler(name);

    if (!registration) {
      throw new WorkflowHandlerNotFoundError(name);
    }

    return registration;
  }

  hasHandler(name: string): boolean {
    return this.handlers.has(name.trim());
  }

  listHandlers(): WorkflowHandlerRegistration[] {
    return [...this.handlers.values()]
      .map((registration) => ({
        ...registration,
        metadata: registration.metadata
          ? { ...registration.metadata }
          : undefined,
      }))
      .sort((left, right) =>
        left.name.localeCompare(right.name)
      );
  }

  listHandlersByEngine(
    engineId: string
  ): WorkflowHandlerRegistration[] {
    const handlerNames =
      this.engineHandlers.get(engineId.trim());

    if (!handlerNames) {
      return [];
    }

    const registrations: WorkflowHandlerRegistration[] =
      [];

    for (const handlerName of handlerNames) {
      const registration =
        this.getHandler(handlerName);

      if (registration) {
        registrations.push(registration);
      }
    }

    return registrations.sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }

  unregisterEngineHandlers(
    engineId: string
  ): number {
    const normalizedEngineId = engineId.trim();
    const handlerNames =
      this.engineHandlers.get(normalizedEngineId);

    if (!handlerNames) {
      return 0;
    }

    let removed = 0;

    for (const handlerName of [...handlerNames]) {
      if (this.unregisterHandler(handlerName)) {
        removed += 1;
      }
    }

    this.engineHandlers.delete(normalizedEngineId);

    return removed;
  }

  /**
   * ==========================================================
   * Interface Compatibility Aliases
   * ==========================================================
   */

  getRegistration(
    name: string
  ): WorkflowHandlerRegistration | undefined {
    return this.getHandler(name);
  }

  /**
   * These overload-compatible methods allow this class to act as
   * both WorkflowDefinitionRegistry and WorkflowHandlerRegistry.
   *
   * Definitions use register(definition).
   * Handlers should use registerHandler(registration).
   */

  /**
   * ==========================================================
   * Discovery
   * ==========================================================
   */

  findDefinitionsByTag(
    tag: string
  ): WorkflowDefinition[] {
    const normalizedTag = tag.trim().toLowerCase();

    return this.list().filter((definition) =>
      definition.metadata.tags?.some(
        (candidate) =>
          candidate.trim().toLowerCase() ===
          normalizedTag
      )
    );
  }

  findDefinitionsByCategory(
    category: string
  ): WorkflowDefinition[] {
    const normalizedCategory =
      category.trim().toLowerCase();

    return this.list().filter(
      (definition) =>
        definition.metadata.category
          ?.trim()
          .toLowerCase() === normalizedCategory
    );
  }

  findHandlers(
    search: string
  ): WorkflowHandlerRegistration[] {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return this.listHandlers();
    }

    return this.listHandlers().filter(
      (registration) =>
        registration.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        registration.description
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        registration.engineId
          ?.toLowerCase()
          .includes(normalizedSearch)
    );
  }

  /**
   * ==========================================================
   * Statistics
   * ==========================================================
   */

  statistics(): RuntimeRegistryStatistics {
    let workflowVersionCount = 0;
    let compensationHandlerCount = 0;

    for (const versions of this.definitions.values()) {
      workflowVersionCount += versions.size;
    }

    for (const registration of this.handlers.values()) {
      if (registration.compensationHandler) {
        compensationHandlerCount += 1;
      }
    }

    return {
      workflowCount: this.definitions.size,
      workflowVersionCount,
      handlerCount: this.handlers.size,
      compensationHandlerCount,
      engineCount: this.engineHandlers.size,
    };
  }

  /**
   * ==========================================================
   * Validation
   * ==========================================================
   */

  validateRegisteredDefinitions(): void {
    for (const definition of this.list()) {
      validateDefinition(definition);

      for (const step of definition.steps) {
        if (
          step.handler &&
          !this.hasHandler(step.handler)
        ) {
          throw new InvalidWorkflowDefinitionError(
            `Workflow '${definition.metadata.id}@${definition.metadata.version}' references unregistered handler '${step.handler}'.`,
            {
              workflowId: definition.metadata.id,
              version: definition.metadata.version,
              stepId: step.id,
              handler: step.handler,
            }
          );
        }
      }
    }
  }

  /**
   * ==========================================================
   * Cleanup
   * ==========================================================
   */

  clearDefinitions(): void {
    this.definitions.clear();
    this.latestVersions.clear();
  }

  clearHandlers(): void {
    this.handlers.clear();
    this.engineHandlers.clear();
  }

  clear(): void {
    this.clearDefinitions();
    this.clearHandlers();
  }

  /**
   * ==========================================================
   * Private Helpers
   * ==========================================================
   */

  private resolveLatestVersion(
    versions: VersionMap
  ): string {
    const availableVersions = [...versions.keys()];

    if (availableVersions.length === 0) {
      throw new InvalidWorkflowDefinitionError(
        "Cannot resolve the latest workflow version from an empty registry."
      );
    }

    return availableVersions.sort((left, right) =>
      compareVersions(right, left)
    )[0];
  }

  private validateHandlerRegistration(
    registration: WorkflowHandlerRegistration
  ): void {
    if (!registration || typeof registration !== "object") {
      throw new InvalidWorkflowDefinitionError(
        "Workflow handler registration must be an object."
      );
    }

    if (
      typeof registration.name !== "string" ||
      registration.name.trim().length === 0
    ) {
      throw new InvalidWorkflowDefinitionError(
        "Workflow handler name must be a non-empty string."
      );
    }

    if (
      !registration.handler ||
      typeof registration.handler.execute !== "function"
    ) {
      throw new InvalidWorkflowDefinitionError(
        `Workflow handler '${registration.name}' must provide an execute method.`,
        {
          handler: registration.name,
        }
      );
    }

    if (
      registration.compensationHandler &&
      typeof registration.compensationHandler
        .compensate !== "function"
    ) {
      throw new InvalidWorkflowDefinitionError(
        `Compensation handler for '${registration.name}' must provide a compensate method.`,
        {
          handler: registration.name,
        }
      );
    }
  }

  private addHandlerToEngineIndex(
    registration: WorkflowHandlerRegistration
  ): void {
    if (!registration.engineId) {
      return;
    }

    const engineId = registration.engineId.trim();

    const handlerNames =
      this.engineHandlers.get(engineId) ??
      new Set<string>();

    handlerNames.add(registration.name);
    this.engineHandlers.set(engineId, handlerNames);
  }

  private removeHandlerFromEngineIndex(
    handlerName: string
  ): void {
    for (const [
      engineId,
      handlerNames,
    ] of this.engineHandlers.entries()) {
      handlerNames.delete(handlerName);

      if (handlerNames.size === 0) {
        this.engineHandlers.delete(engineId);
      }
    }
  }
}

/**
 * ============================================================
 * Dedicated Definition Registry Adapter
 * ============================================================
 */

export class RuntimeDefinitionRegistry
  implements WorkflowDefinitionRegistry
{
  constructor(
    private readonly registry: RuntimeRegistry =
      new RuntimeRegistry()
  ) {}

  register(definition: WorkflowDefinition): void {
    this.registry.register(definition);
  }

  unregister(
    workflowId: WorkflowId,
    version?: string
  ): boolean {
    return this.registry.unregister(
      workflowId,
      version
    );
  }

  get(
    workflowId: WorkflowId,
    version?: string
  ): WorkflowDefinition | null {
    return this.registry.get(workflowId, version);
  }

  getLatest(
    workflowId: WorkflowId
  ): WorkflowDefinition | null {
    return this.registry.getLatest(workflowId);
  }

  list(): WorkflowDefinition[] {
    return this.registry.list();
  }

  has(
    workflowId: WorkflowId,
    version?: string
  ): boolean {
    return this.registry.has(workflowId, version);
  }

  get runtimeRegistry(): RuntimeRegistry {
    return this.registry;
  }
}

/**
 * ============================================================
 * Dedicated Handler Registry Adapter
 * ============================================================
 */

export class RuntimeHandlerRegistry
  implements WorkflowHandlerRegistry
{
  constructor(
    private readonly registry: RuntimeRegistry =
      new RuntimeRegistry()
  ) {}

  register(
    registration: WorkflowHandlerRegistration
  ): void {
    this.registry.registerHandler(registration);
  }

  unregister(name: string): boolean {
    return this.registry.unregisterHandler(name);
  }

  get(
    name: string
  ): WorkflowHandlerRegistration | undefined {
    return this.registry.getHandler(name);
  }

  has(name: string): boolean {
    return this.registry.hasHandler(name);
  }

  list(): WorkflowHandlerRegistration[] {
    return this.registry.listHandlers();
  }

  get runtimeRegistry(): RuntimeRegistry {
    return this.registry;
  }
}

/**
 * ============================================================
 * Factory
 * ============================================================
 */

export function createRuntimeRegistry(
  options?: RuntimeRegistryOptions
): RuntimeRegistry {
  return new RuntimeRegistry(options);
}