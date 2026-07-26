/**
 * Tokens may be strings or symbols.
 */
export type ServiceToken<T = unknown> =
  | string
  | symbol;

/**
 * Service lifetime options.
 */
export type ServiceLifetime =
  | "singleton"
  | "transient";

/**
 * Factory used to create a service.
 */
export type ServiceFactory<T> = (
  container: ServiceContainer,
) => T | Promise<T>;

/**
 * Service registration definition.
 */
interface ServiceRegistration<T = unknown> {
  token: ServiceToken<T>;
  lifetime: ServiceLifetime;
  factory?: ServiceFactory<T>;
  value?: T;
  instance?: T;
  creating?: Promise<T>;
  metadata?: Record<string, unknown>;
}

/**
 * Registration settings.
 */
export interface ServiceRegistrationOptions {
  lifetime?: ServiceLifetime;
  replaceExisting?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Lightweight dependency-injection container for IBOS services.
 */
export class ServiceContainer {
  private readonly registrations =
    new Map<
      ServiceToken,
      ServiceRegistration
    >();

  private readonly resolutionStack:
    ServiceToken[] = [];

  public constructor(
    private readonly parent?: ServiceContainer,
  ) {}

  /**
   * Registers an existing value as a singleton service.
   */
  public registerValue<T>(
    token: ServiceToken<T>,
    value: T,
    options: Omit<
      ServiceRegistrationOptions,
      "lifetime"
    > = {},
  ): this {
    this.assertMayRegister(
      token,
      options.replaceExisting,
    );

    this.registrations.set(token, {
      token,
      lifetime: "singleton",
      value,
      instance: value,
      metadata: options.metadata,
    });

    return this;
  }

  /**
   * Registers a service factory.
   */
  public registerFactory<T>(
    token: ServiceToken<T>,
    factory: ServiceFactory<T>,
    options: ServiceRegistrationOptions = {},
  ): this {
    this.assertMayRegister(
      token,
      options.replaceExisting,
    );

    this.registrations.set(token, {
      token,
      factory,
      lifetime:
        options.lifetime ?? "singleton",
      metadata: options.metadata,
    });

    return this;
  }

  /**
   * Registers a singleton factory.
   */
  public registerSingleton<T>(
    token: ServiceToken<T>,
    factory: ServiceFactory<T>,
    options: Omit<
      ServiceRegistrationOptions,
      "lifetime"
    > = {},
  ): this {
    return this.registerFactory(
      token,
      factory,
      {
        ...options,
        lifetime: "singleton",
      },
    );
  }

  /**
   * Registers a transient factory.
   */
  public registerTransient<T>(
    token: ServiceToken<T>,
    factory: ServiceFactory<T>,
    options: Omit<
      ServiceRegistrationOptions,
      "lifetime"
    > = {},
  ): this {
    return this.registerFactory(
      token,
      factory,
      {
        ...options,
        lifetime: "transient",
      },
    );
  }

  /**
   * Returns whether a service exists in this container or its parent.
   */
  public has(
    token: ServiceToken,
    includeParent = true,
  ): boolean {
    if (this.registrations.has(token)) {
      return true;
    }

    return (
      includeParent &&
      this.parent?.has(token, true) === true
    );
  }

  /**
   * Resolves a service.
   */
  public async resolve<T>(
    token: ServiceToken<T>,
  ): Promise<T> {
    const localRegistration =
      this.registrations.get(token) as
        | ServiceRegistration<T>
        | undefined;

    if (!localRegistration) {
      if (this.parent) {
        return this.parent.resolve(token);
      }

      throw new Error(
        `IBOS service "${this.describeToken(
          token,
        )}" is not registered.`,
      );
    }

    return this.resolveRegistration(
      localRegistration,
    );
  }

  /**
   * Resolves a service or returns undefined.
   */
  public async tryResolve<T>(
    token: ServiceToken<T>,
  ): Promise<T | undefined> {
    if (!this.has(token)) {
      return undefined;
    }

    return this.resolve(token);
  }

  /**
   * Resolves several services.
   */
  public async resolveAll<
    T extends readonly unknown[],
  >(
    tokens: {
      [K in keyof T]:
        ServiceToken<T[K]>;
    },
  ): Promise<T> {
    const services =
      await Promise.all(
        tokens.map((token) =>
          this.resolve(token),
        ),
      );

    return services as unknown as T;
  }

  /**
   * Returns registration metadata.
   */
  public getMetadata(
    token: ServiceToken,
  ): Record<string, unknown> | undefined {
    const registration =
      this.registrations.get(token);

    if (registration) {
      return registration.metadata;
    }

    return this.parent?.getMetadata(token);
  }

  /**
   * Removes a local service registration.
   */
  public unregister(
    token: ServiceToken,
  ): boolean {
    return this.registrations.delete(token);
  }

  /**
   * Clears the cached instance of a local singleton service.
   */
  public clearInstance(
    token: ServiceToken,
  ): boolean {
    const registration =
      this.registrations.get(token);

    if (!registration) {
      return false;
    }

    registration.instance = undefined;
    registration.creating = undefined;

    if (
      Object.prototype.hasOwnProperty.call(
        registration,
        "value",
      )
    ) {
      registration.instance =
        registration.value;
    }

    return true;
  }

  /**
   * Returns all locally registered tokens.
   */
  public getRegisteredTokens():
    ServiceToken[] {
    return Array.from(
      this.registrations.keys(),
    );
  }

  /**
   * Creates a child container.
   *
   * Child containers inherit services but may override them locally.
   */
  public createChild():
    ServiceContainer {
    return new ServiceContainer(this);
  }

  /**
   * Removes all local service registrations.
   */
  public clear(): void {
    this.registrations.clear();
    this.resolutionStack.length = 0;
  }

  private assertMayRegister(
    token: ServiceToken,
    replaceExisting = false,
  ): void {
    if (
      this.registrations.has(token) &&
      !replaceExisting
    ) {
      throw new Error(
        `IBOS service "${this.describeToken(
          token,
        )}" is already registered.`,
      );
    }
  }

  private async resolveRegistration<T>(
    registration: ServiceRegistration<T>,
  ): Promise<T> {
    if (
      registration.lifetime ===
        "singleton" &&
      registration.instance !== undefined
    ) {
      return registration.instance;
    }

    if (
      registration.lifetime ===
        "singleton" &&
      registration.creating
    ) {
      return registration.creating;
    }

    if (
      !registration.factory &&
      registration.value !== undefined
    ) {
      return registration.value;
    }

    if (!registration.factory) {
      throw new Error(
        `IBOS service "${this.describeToken(
          registration.token,
        )}" does not have a value or factory.`,
      );
    }

    this.assertNoCircularDependency(
      registration.token,
    );

    const createService =
      async (): Promise<T> => {
        this.resolutionStack.push(
          registration.token,
        );

        try {
          return await registration.factory!(
            this,
          );
        } finally {
          this.resolutionStack.pop();
        }
      };

    if (
      registration.lifetime ===
      "transient"
    ) {
      return createService();
    }

    const creating = createService();

    registration.creating = creating;

    try {
      const instance = await creating;

      registration.instance = instance;

      return instance;
    } finally {
      registration.creating = undefined;
    }
  }

  private assertNoCircularDependency(
    token: ServiceToken,
  ): void {
    const existingIndex =
      this.resolutionStack.indexOf(token);

    if (existingIndex === -1) {
      return;
    }

    const dependencyPath = [
      ...this.resolutionStack.slice(
        existingIndex,
      ),
      token,
    ]
      .map((entry) =>
        this.describeToken(entry),
      )
      .join(" -> ");

    throw new Error(
      `Circular IBOS service dependency detected: ${dependencyPath}.`,
    );
  }

  private describeToken(
    token: ServiceToken,
  ): string {
    return typeof token === "symbol"
      ? token.description ??
          token.toString()
      : token;
  }
}

/**
 * Creates an independent service container.
 */
export function createServiceContainer(
  parent?: ServiceContainer,
): ServiceContainer {
  return new ServiceContainer(parent);
}