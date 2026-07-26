import type {
  IBOSEngineName,
  IBOSEngines,
} from "../IBOS";

import type {
  EngineRegistrationOptions,
  EngineRegistry,
} from "./EngineRegistry";

/**
 * Context supplied to an engine factory.
 */
export interface EngineFactoryContext {
  registry?: EngineRegistry;
  services?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Function capable of creating one IBOS engine.
 */
export type EngineCreator<
  K extends IBOSEngineName,
> = (
  context: EngineFactoryContext,
) =>
  | IBOSEngines[K]
  | Promise<IBOSEngines[K]>;

/**
 * Factory registration record.
 */
export interface EngineFactoryRegistration<
  K extends IBOSEngineName = IBOSEngineName,
> {
  name: K;
  creator: EngineCreator<K>;
  singleton: boolean;
  registrationOptions?: EngineRegistrationOptions;
  metadata?: Record<string, unknown>;
}

/**
 * Central factory for creating replaceable IBOS engine implementations.
 */
export class EngineFactory {
  private readonly factories =
    new Map<
      IBOSEngineName,
      EngineFactoryRegistration
    >();

  private readonly singletons =
    new Map<
      IBOSEngineName,
      IBOSEngines[IBOSEngineName]
    >();

  /**
   * Registers an engine creator.
   */
  public register<K extends IBOSEngineName>(
    name: K,
    creator: EngineCreator<K>,
    options: {
      singleton?: boolean;
      replaceExisting?: boolean;
      registrationOptions?: EngineRegistrationOptions;
      metadata?: Record<string, unknown>;
    } = {},
  ): this {
    if (
      this.factories.has(name) &&
      !options.replaceExisting
    ) {
      throw new Error(
        `An IBOS factory for "${name}" is already registered.`,
      );
    }

    const registration:
      EngineFactoryRegistration<K> = {
        name,
        creator,
        singleton:
          options.singleton ?? true,
        registrationOptions:
          options.registrationOptions,
        metadata: options.metadata,
      };

    this.factories.set(
      name,
      registration as EngineFactoryRegistration,
    );

    if (options.replaceExisting) {
      this.singletons.delete(name);
    }

    return this;
  }

  /**
   * Removes an engine creator and its cached singleton.
   */
  public unregister(
    name: IBOSEngineName,
  ): boolean {
    this.singletons.delete(name);

    return this.factories.delete(name);
  }

  /**
   * Returns whether a factory is registered.
   */
  public has(
    name: IBOSEngineName,
  ): boolean {
    return this.factories.has(name);
  }

  /**
   * Creates or retrieves an engine.
   */
  public async create<
    K extends IBOSEngineName,
  >(
    name: K,
    context: EngineFactoryContext = {},
  ): Promise<IBOSEngines[K]> {
    const registration =
      this.factories.get(name);

    if (!registration) {
      throw new Error(
        `No IBOS engine factory is registered for "${name}".`,
      );
    }

    if (
      registration.singleton &&
      this.singletons.has(name)
    ) {
      return this.singletons.get(
        name,
      ) as IBOSEngines[K];
    }

    const creator =
      registration.creator as EngineCreator<K>;

    const engine =
      await creator(context);

    if (registration.singleton) {
      this.singletons.set(
        name,
        engine,
      );
    }

    return engine;
  }

  /**
   * Creates an engine and registers it in an EngineRegistry.
   */
  public async createAndRegister<
    K extends IBOSEngineName,
  >(
    name: K,
    registry: EngineRegistry,
    context: Omit<
      EngineFactoryContext,
      "registry"
    > = {},
  ): Promise<IBOSEngines[K]> {
    const registration =
      this.factories.get(name);

    if (!registration) {
      throw new Error(
        `No IBOS engine factory is registered for "${name}".`,
      );
    }

    const engine = await this.create(
      name,
      {
        ...context,
        registry,
      },
    );

    registry.register(
      name,
      engine,
      {
        ...registration.registrationOptions,
        replaceExisting: true,
      },
    );

    return engine;
  }

  /**
   * Creates all registered engines.
   */
  public async createAll(
    context: EngineFactoryContext = {},
  ): Promise<
    Partial<IBOSEngines>
  > {
    const engines:
      Partial<IBOSEngines> = {};

    for (
      const name
      of this.factories.keys()
    ) {
      const engine =
        await this.create(
          name,
          context,
        );

      Object.assign(engines, {
        [name]: engine,
      });
    }

    return engines;
  }

  /**
   * Creates and registers all engine implementations.
   */
  public async createAndRegisterAll(
    registry: EngineRegistry,
    context: Omit<
      EngineFactoryContext,
      "registry"
    > = {},
  ): Promise<
    Partial<IBOSEngines>
  > {
    const engines:
      Partial<IBOSEngines> = {};

    for (
      const name
      of this.factories.keys()
    ) {
      const engine =
        await this.createAndRegister(
          name,
          registry,
          context,
        );

      Object.assign(engines, {
        [name]: engine,
      });
    }

    return engines;
  }

  /**
   * Returns registered factory names.
   */
  public getRegisteredNames():
    IBOSEngineName[] {
    return Array.from(
      this.factories.keys(),
    );
  }

  /**
   * Returns a factory registration.
   */
  public getRegistration<
    K extends IBOSEngineName,
  >(
    name: K,
  ): EngineFactoryRegistration<K> | undefined {
    return this.factories.get(
      name,
    ) as
      | EngineFactoryRegistration<K>
      | undefined;
  }

  /**
   * Removes a cached singleton without removing its factory.
   */
  public clearSingleton(
    name: IBOSEngineName,
  ): boolean {
    return this.singletons.delete(name);
  }

  /**
   * Removes every cached singleton.
   */
  public clearSingletons(): void {
    this.singletons.clear();
  }

  /**
   * Removes all factories and cached engines.
   */
  public clear(): void {
    this.factories.clear();
    this.singletons.clear();
  }
}

/**
 * Creates an independent IBOS engine factory.
 */
export function createEngineFactory():
  EngineFactory {
  return new EngineFactory();
}