import type {
  IBOSEngine,
  IBOSEngineName,
  IBOSEngines,
} from "../IBOS";

import type {
  EngineHealthCheck,
  EngineOperationResult,
  IEngine,
} from "../types";

/**
 * Registration options for an IBOS engine.
 */
export interface EngineRegistrationOptions {
  /**
   * Other registered engines that must exist before this engine can start.
   */
  dependencies?: IBOSEngineName[];

  /**
   * Whether this engine should be included in automatic lifecycle operations.
   */
  lifecycleEnabled?: boolean;

  /**
   * Whether an existing engine may be replaced.
   */
  replaceExisting?: boolean;

  /**
   * Optional registration metadata.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Internal registration record.
 */
export interface EngineRegistration<
  K extends IBOSEngineName = IBOSEngineName,
> {
  name: K;
  engine: IBOSEngines[K];
  dependencies: IBOSEngineName[];
  lifecycleEnabled: boolean;
  registeredAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result of an engine lifecycle operation.
 */
export interface EngineLifecycleResult {
  name: IBOSEngineName;
  operation:
    | "initialize"
    | "start"
    | "stop"
    | "shutdown"
    | "health";
  success: boolean;
  skipped?: boolean;
  message?: string;
  result?: EngineOperationResult;
  health?: EngineHealthCheck;
  error?: string;
}

/**
 * Registry status snapshot.
 */
export interface EngineRegistrySnapshot {
  totalEngines: number;
  registeredEngines: IBOSEngineName[];
  lifecycleEnabledEngines: IBOSEngineName[];
  generatedAt: string;
}

/**
 * Determines whether an engine supports the shared IBOS lifecycle contract.
 */
function supportsLifecycle(
  value: unknown,
): value is IEngine<any> {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return false;
  }

  const engine = value as Partial<IEngine<any>>;

  return (
    typeof engine.initialize === "function" &&
    typeof engine.start === "function" &&
    typeof engine.stop === "function" &&
    typeof engine.shutdown === "function" &&
    typeof engine.healthCheck === "function"
  );
}

/**
 * Central registry for all IBOS enterprise engines.
 */
export class EngineRegistry {
  private readonly registrations =
    new Map<IBOSEngineName, EngineRegistration>();

  /**
   * Registers an enterprise engine.
   */
  public register<K extends IBOSEngineName>(
    name: K,
    engine: IBOSEngines[K],
    options: EngineRegistrationOptions = {},
  ): this {
    const existing = this.registrations.has(name);

    if (existing && !options.replaceExisting) {
      throw new Error(
        `IBOS engine "${name}" is already registered.`,
      );
    }

    const dependencies = Array.from(
      new Set(options.dependencies ?? []),
    );

    if (dependencies.includes(name)) {
      throw new Error(
        `IBOS engine "${name}" cannot depend on itself.`,
      );
    }

    const registration: EngineRegistration<K> = {
      name,
      engine,
      dependencies,
      lifecycleEnabled:
        options.lifecycleEnabled ?? true,
      registeredAt: new Date().toISOString(),
      metadata: options.metadata,
    };

    this.registrations.set(
      name,
      registration as EngineRegistration,
    );

    return this;
  }

  /**
   * Registers or replaces an enterprise engine.
   */
  public replace<K extends IBOSEngineName>(
    name: K,
    engine: IBOSEngines[K],
    options: Omit<
      EngineRegistrationOptions,
      "replaceExisting"
    > = {},
  ): this {
    return this.register(name, engine, {
      ...options,
      replaceExisting: true,
    });
  }

  /**
   * Removes an engine from the registry.
   */
  public unregister(
    name: IBOSEngineName,
  ): boolean {
    return this.registrations.delete(name);
  }

  /**
   * Returns whether an engine is registered.
   */
  public has(
    name: IBOSEngineName,
  ): boolean {
    return this.registrations.has(name);
  }

  /**
   * Returns a registered engine.
   */
  public get<K extends IBOSEngineName>(
    name: K,
  ): IBOSEngines[K] {
    const registration =
      this.registrations.get(name);

    if (!registration) {
      throw new Error(
        `IBOS engine "${name}" is not registered.`,
      );
    }

    return registration.engine as IBOSEngines[K];
  }

  /**
   * Returns an engine or undefined when it is not registered.
   */
  public tryGet<K extends IBOSEngineName>(
    name: K,
  ): IBOSEngines[K] | undefined {
    return this.registrations.get(name)
      ?.engine as IBOSEngines[K] | undefined;
  }

  /**
   * Returns the complete registration record.
   */
  public getRegistration<
    K extends IBOSEngineName,
  >(
    name: K,
  ): EngineRegistration<K> | undefined {
    return this.registrations.get(
      name,
    ) as EngineRegistration<K> | undefined;
  }

  /**
   * Returns all registration records.
   */
  public listRegistrations():
    EngineRegistration[] {
    return Array.from(
      this.registrations.values(),
    );
  }

  /**
   * Returns all registered engine names.
   */
  public getNames(): IBOSEngineName[] {
    return Array.from(
      this.registrations.keys(),
    );
  }

  /**
   * Returns all registered engine instances.
   */
  public getEngines(): IBOSEngine[] {
    return this.listRegistrations().map(
      (registration) => registration.engine,
    );
  }

  /**
   * Verifies that every declared dependency is registered.
   */
  public validateDependencies(): void {
    for (
      const registration
      of this.registrations.values()
    ) {
      for (
        const dependency
        of registration.dependencies
      ) {
        if (!this.registrations.has(dependency)) {
          throw new Error(
            `IBOS engine "${registration.name}" requires missing engine "${dependency}".`,
          );
        }
      }
    }

    this.getDependencyOrder();
  }

  /**
   * Returns engines in dependency-safe startup order.
   */
  public getDependencyOrder():
    IBOSEngineName[] {
    const visited =
      new Set<IBOSEngineName>();

    const visiting =
      new Set<IBOSEngineName>();

    const order: IBOSEngineName[] = [];

    const visit = (
      name: IBOSEngineName,
    ): void => {
      if (visited.has(name)) {
        return;
      }

      if (visiting.has(name)) {
        throw new Error(
          `Circular IBOS engine dependency detected at "${name}".`,
        );
      }

      const registration =
        this.registrations.get(name);

      if (!registration) {
        throw new Error(
          `IBOS engine dependency "${name}" is not registered.`,
        );
      }

      visiting.add(name);

      for (
        const dependency
        of registration.dependencies
      ) {
        visit(dependency);
      }

      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (
      const name
      of this.registrations.keys()
    ) {
      visit(name);
    }

    return order;
  }

  /**
   * Initializes all lifecycle-enabled engines.
   */
  public async initializeAll(
    ibosVersion?: string,
  ): Promise<EngineLifecycleResult[]> {
    this.validateDependencies();

    const results: EngineLifecycleResult[] = [];

    for (
      const name
      of this.getDependencyOrder()
    ) {
      const registration =
        this.registrations.get(name);

      if (!registration) {
        continue;
      }

      const engine = registration.engine;

      if (
        !registration.lifecycleEnabled ||
        !supportsLifecycle(engine)
      ) {
        results.push({
          name,
          operation: "initialize",
          success: true,
          skipped: true,
          message:
            "Engine does not use the shared lifecycle contract.",
        });

        continue;
      }

      if (engine.initialized) {
        results.push({
          name,
          operation: "initialize",
          success: true,
          skipped: true,
          message:
            "Engine is already initialized.",
        });

        continue;
      }

      try {
        const result =
  await (engine as IEngine).initialize({
    config: engine.config as any,
    ibosVersion,
  });

        results.push({
          name,
          operation: "initialize",
          success: result.success,
          result,
          message: result.message,
          error: result.error?.message,
        });

        if (!result.success) {
          break;
        }
      } catch (error) {
        results.push({
          name,
          operation: "initialize",
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown initialization error.",
        });

        break;
      }
    }

    return results;
  }

  /**
   * Starts all lifecycle-enabled engines.
   */
  public async startAll():
    Promise<EngineLifecycleResult[]> {
    this.validateDependencies();

    const results: EngineLifecycleResult[] = [];

    for (
      const name
      of this.getDependencyOrder()
    ) {
      const registration =
        this.registrations.get(name);

      if (!registration) {
        continue;
      }

      const engine = registration.engine;

      if (
        !registration.lifecycleEnabled ||
        !supportsLifecycle(engine)
      ) {
        results.push({
          name,
          operation: "start",
          success: true,
          skipped: true,
          message:
            "Engine does not use the shared lifecycle contract.",
        });

        continue;
      }

      if (engine.running) {
        results.push({
          name,
          operation: "start",
          success: true,
          skipped: true,
          message:
            "Engine is already running.",
        });

        continue;
      }

      try {
        const result = await engine.start();

        results.push({
          name,
          operation: "start",
          success: result.success,
          result,
          message: result.message,
          error: result.error?.message,
        });

        if (!result.success) {
          break;
        }
      } catch (error) {
        results.push({
          name,
          operation: "start",
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown startup error.",
        });

        break;
      }
    }

    return results;
  }

  /**
   * Stops engines in reverse dependency order.
   */
  public async stopAll():
    Promise<EngineLifecycleResult[]> {
    const order =
      this.getDependencyOrder().reverse();

    const results: EngineLifecycleResult[] = [];

    for (const name of order) {
      const registration =
        this.registrations.get(name);

      if (!registration) {
        continue;
      }

      const engine = registration.engine;

      if (
        !registration.lifecycleEnabled ||
        !supportsLifecycle(engine)
      ) {
        results.push({
          name,
          operation: "stop",
          success: true,
          skipped: true,
          message:
            "Engine does not use the shared lifecycle contract.",
        });

        continue;
      }

      if (!engine.running) {
        results.push({
          name,
          operation: "stop",
          success: true,
          skipped: true,
          message:
            "Engine is not running.",
        });

        continue;
      }

      try {
        const result = await engine.stop();

        results.push({
          name,
          operation: "stop",
          success: result.success,
          result,
          message: result.message,
          error: result.error?.message,
        });
      } catch (error) {
        results.push({
          name,
          operation: "stop",
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown stop error.",
        });
      }
    }

    return results;
  }

  /**
   * Shuts down engines in reverse dependency order.
   */
  public async shutdownAll(
    clearRegistry = false,
  ): Promise<EngineLifecycleResult[]> {
    const order =
      this.getDependencyOrder().reverse();

    const results: EngineLifecycleResult[] = [];

    for (const name of order) {
      const registration =
        this.registrations.get(name);

      if (!registration) {
        continue;
      }

      const engine = registration.engine;

      if (
        !registration.lifecycleEnabled ||
        !supportsLifecycle(engine)
      ) {
        results.push({
          name,
          operation: "shutdown",
          success: true,
          skipped: true,
          message:
            "Engine does not use the shared lifecycle contract.",
        });

        continue;
      }

      try {
        const result =
          await engine.shutdown();

        results.push({
          name,
          operation: "shutdown",
          success: result.success,
          result,
          message: result.message,
          error: result.error?.message,
        });
      } catch (error) {
        results.push({
          name,
          operation: "shutdown",
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown shutdown error.",
        });
      }
    }

    if (clearRegistry) {
      this.clear();
    }

    return results;
  }

  /**
   * Runs health checks for all supported engines.
   */
  public async healthCheckAll():
    Promise<EngineLifecycleResult[]> {
    const results: EngineLifecycleResult[] = [];

    for (
      const [name, registration]
      of this.registrations.entries()
    ) {
      const engine = registration.engine;

      if (
        !registration.lifecycleEnabled ||
        !supportsLifecycle(engine)
      ) {
        results.push({
          name,
          operation: "health",
          success: true,
          skipped: true,
          message:
            "Engine does not expose a health check.",
        });

        continue;
      }

      try {
        const health =
          await engine.healthCheck();

        results.push({
          name,
          operation: "health",
          success:
            health.status === "healthy" ||
            health.status === "degraded",
          health,
          message: health.message,
        });
      } catch (error) {
        results.push({
          name,
          operation: "health",
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown health-check error.",
        });
      }
    }

    return results;
  }

  /**
   * Returns a registry snapshot.
   */
  public getSnapshot():
    EngineRegistrySnapshot {
    const registrations =
      this.listRegistrations();

    return {
      totalEngines:
        registrations.length,
      registeredEngines:
        registrations.map(
          (registration) =>
            registration.name,
        ),
      lifecycleEnabledEngines:
        registrations
          .filter(
            (registration) =>
              registration.lifecycleEnabled &&
              supportsLifecycle(
                registration.engine,
              ),
          )
          .map(
            (registration) =>
              registration.name,
          ),
      generatedAt:
        new Date().toISOString(),
    };
  }

  /**
   * Removes every registered engine.
   */
  public clear(): void {
    this.registrations.clear();
  }
}

/**
 * Creates a new independent engine registry.
 */
export function createEngineRegistry():
  EngineRegistry {
  return new EngineRegistry();
}