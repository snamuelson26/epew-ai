import type {
  IAIEngine,
  IAnalyticsEngine,
  ICommunicationEngine,
  IDocumentEngine,
  IEngine,
  IIdentityEngine,
  ILanguageEngine,
  IMediaEngine,
  ISecurityEngine,
  IWorkflowEngine,
} from "./types";

/**
 * Official enterprise engine names registered with IBOS.
 */
export type IBOSEngineName =
  | "language"
  | "media"
  | "communication"
  | "documents"
  | "workflow"
  | "ai"
  | "identity"
  | "security"
  | "analytics";

/**
 * Strongly typed collection of IBOS enterprise engines.
 */
export interface IBOSEngines {
  language: ILanguageEngine;
  media: IMediaEngine;
  communication: ICommunicationEngine;
  documents: IDocumentEngine;
  workflow: IWorkflowEngine;
  ai: IAIEngine;
  identity: IIdentityEngine;
  security: ISecurityEngine;
  analytics: IAnalyticsEngine;
}

/**
 * Union containing every engine type supported by IBOS.
 */
export type IBOSEngine =
  IBOSEngines[IBOSEngineName];

/**
 * Configuration accepted when creating an IBOS instance.
 *
 * Each engine is optional because engines may be registered progressively.
 */
export type IBOSConfiguration =
  Partial<IBOSEngines>;

/**
 * Snapshot describing the current IBOS runtime.
 */
export interface IBOSRuntimeSnapshot {
  version: string;
  initialized: boolean;
  registeredEngines: IBOSEngineName[];
  runningEngines: IBOSEngineName[];
  generatedAt: string;
}

/**
 * Determines whether an engine implements the shared IBOS lifecycle.
 *
 * Some legacy engine contracts may not yet extend IEngine. Those engines
 * can still be registered and used, but lifecycle methods will be skipped
 * until their contracts are upgraded.
 */
function supportsEngineLifecycle(
  value: unknown,
): value is IEngine {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return false;
  }

  const engine = value as Partial<IEngine>;

  return (
    typeof engine.initialize === "function" &&
    typeof engine.start === "function" &&
    typeof engine.stop === "function" &&
    typeof engine.shutdown === "function" &&
    typeof engine.healthCheck === "function"
  );
}

/**
 * IBOS
 *
 * The Intelligent Business Operating System is the central orchestration
 * layer for the EPEW-EDE-IBOS enterprise platform.
 */
export class IBOS {
  public readonly version = "1.0.0";

  /**
   * Runtime engine registry.
   */
  private readonly engines =
    new Map<IBOSEngineName, IBOSEngine>();

  private initialized = false;

  public constructor(
    configuration: IBOSConfiguration = {},
  ) {
    this.registerConfiguration(configuration);
  }

  /**
   * Registers every engine supplied during construction.
   */
  private registerConfiguration(
    configuration: IBOSConfiguration,
  ): void {
    const engineNames: IBOSEngineName[] = [
      "language",
      "media",
      "communication",
      "documents",
      "workflow",
      "ai",
      "identity",
      "security",
      "analytics",
    ];

    for (const name of engineNames) {
      const engine = configuration[name];

      if (engine) {
        this.engines.set(
          name,
          engine as IBOSEngine,
        );
      }
    }
  }

  /**
   * Registers or replaces one enterprise engine.
   */
  public register<K extends IBOSEngineName>(
    name: K,
    engine: IBOSEngines[K],
  ): this {
    this.engines.set(
      name,
      engine as IBOSEngine,
    );

    return this;
  }

  /**
   * Removes an engine from the runtime registry.
   */
  public unregister(
    name: IBOSEngineName,
  ): boolean {
    return this.engines.delete(name);
  }

  /**
   * Returns whether an engine is registered.
   */
  public hasEngine(
    name: IBOSEngineName,
  ): boolean {
    return this.engines.has(name);
  }

  /**
   * Returns one registered enterprise engine.
   *
   * An explicit error is thrown when the requested engine has not yet
   * been registered.
   */
  public getEngine<K extends IBOSEngineName>(
    name: K,
  ): IBOSEngines[K] {
    const engine = this.engines.get(name);

    if (!engine) {
      throw new Error(
        `IBOS engine "${name}" is not registered.`,
      );
    }

    return engine as IBOSEngines[K];
  }

  /**
   * Initializes and starts every registered engine that supports the
   * shared IBOS lifecycle contract.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    for (const engine of this.engines.values()) {
      if (!supportsEngineLifecycle(engine)) {
        continue;
      }

      if (!engine.initialized) {
       const initializeResult =
  await (engine as IEngine).initialize({
    config: engine.config,
    ibosVersion: this.version,
  } as Parameters<IEngine["initialize"]>[0]);

        if (!initializeResult.success) {
          throw new Error(
            initializeResult.error?.message ??
              initializeResult.message ??
              `Unable to initialize engine "${engine.name}".`,
          );
        }
      }

      if (!engine.running) {
        const startResult =
          await engine.start();

        if (!startResult.success) {
          throw new Error(
            startResult.error?.message ??
              startResult.message ??
              `Unable to start engine "${engine.name}".`,
          );
        }
      }
    }

    this.initialized = true;
  }

  /**
   * Stops every running engine that supports lifecycle operations.
   */
  public async stop(): Promise<void> {
    const registeredEngines =
      Array.from(
        this.engines.values(),
      ).reverse();

    for (const engine of registeredEngines) {
      if (
        supportsEngineLifecycle(engine) &&
        engine.running
      ) {
        await engine.stop();
      }
    }

    this.initialized = false;
  }

  /**
   * Shuts down lifecycle-enabled engines and clears the registry.
   */
  public async shutdown(): Promise<void> {
    const registeredEngines =
      Array.from(
        this.engines.values(),
      ).reverse();

    for (const engine of registeredEngines) {
      if (supportsEngineLifecycle(engine)) {
        await engine.shutdown();
      }
    }

    this.engines.clear();
    this.initialized = false;
  }

  /**
   * Returns all registered engine names.
   */
  public getRegisteredEngines():
    IBOSEngineName[] {
    return Array.from(
      this.engines.keys(),
    );
  }

  /**
   * Returns the names of engines currently running.
   */
  public getRunningEngines():
    IBOSEngineName[] {
    const runningEngines:
      IBOSEngineName[] = [];

    for (const [
      name,
      engine,
    ] of this.engines.entries()) {
      if (
        supportsEngineLifecycle(engine) &&
        engine.running
      ) {
        runningEngines.push(name);
      }
    }

    return runningEngines;
  }

  /**
   * Returns a runtime status snapshot.
   */
  public getRuntimeSnapshot():
    IBOSRuntimeSnapshot {
    return {
      version: this.version,
      initialized: this.initialized,
      registeredEngines:
        this.getRegisteredEngines(),
      runningEngines:
        this.getRunningEngines(),
      generatedAt:
        new Date().toISOString(),
    };
  }

  /**
   * Indicates whether the IBOS runtime was initialized.
   */
  public get isInitialized(): boolean {
    return this.initialized;
  }

  public get language(): ILanguageEngine {
    return this.getEngine("language");
  }

  public get media(): IMediaEngine {
    return this.getEngine("media");
  }

  public get communication():
    ICommunicationEngine {
    return this.getEngine(
      "communication",
    );
  }

  public get documents(): IDocumentEngine {
    return this.getEngine("documents");
  }

  public get workflow(): IWorkflowEngine {
    return this.getEngine("workflow");
  }

  public get ai(): IAIEngine {
    return this.getEngine("ai");
  }

  public get identity(): IIdentityEngine {
    return this.getEngine("identity");
  }

  public get security(): ISecurityEngine {
    return this.getEngine("security");
  }

  public get analytics(): IAnalyticsEngine {
    return this.getEngine("analytics");
  }
}

/**
 * Creates an independent IBOS runtime.
 */
export function createIBOS(
  configuration: IBOSConfiguration = {},
): IBOS {
  return new IBOS(configuration);
}