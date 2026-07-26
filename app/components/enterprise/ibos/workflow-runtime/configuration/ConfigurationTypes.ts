/**
 * IBOS Enterprise Operating System
 * Enterprise Workflow Runtime
 *
 * ConfigurationTypes
 *
 * Provides shared utility types and contracts used throughout the
 * workflow-runtime configuration framework.
 *
 * Version: 1.0.0
 */

/**
 * Supported deployment environments for the IBOS Workflow Runtime.
 */
export type ConfigurationEnvironment =
  | "development"
  | "testing"
  | "staging"
  | "production";

/**
 * Supported configuration validation severity levels.
 */
export type ConfigurationValidationSeverity =
  | "information"
  | "warning"
  | "error";

/**
 * Makes every property in an object optional recursively.
 *
 * Useful when providing configuration overrides without requiring
 * the caller to supply the complete configuration tree.
 */
export type DeepPartial<T> = T extends Date
  ? T
  : T extends (...args: never[]) => unknown
    ? T
    : T extends readonly (infer U)[]
      ? readonly DeepPartial<U>[]
      : T extends object
        ? {
            [P in keyof T]?: DeepPartial<T[P]>;
          }
        : T;

/**
 * Makes every property in an object immutable recursively.
 */
export type Immutable<T> = T extends Date
  ? T
  : T extends (...args: never[]) => unknown
    ? T
    : T extends readonly (infer U)[]
      ? readonly Immutable<U>[]
      : T extends object
        ? {
            readonly [P in keyof T]: Immutable<T[P]>;
          }
        : T;

/**
 * Removes readonly modifiers recursively.
 */
export type Mutable<T> = T extends Date
  ? T
  : T extends (...args: never[]) => unknown
    ? T
    : T extends readonly (infer U)[]
      ? Mutable<U>[]
      : T extends object
        ? {
            -readonly [P in keyof T]: Mutable<T[P]>;
          }
        : T;

/**
 * Makes selected fields optional.
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Makes selected fields required.
 */
export type RequiredFields<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Represents an object that may be synchronously or asynchronously produced.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Represents a configuration factory.
 */
export type ConfigurationFactory<T> = (
  overrides?: DeepPartial<T>,
) => Immutable<T>;

/**
 * Represents a configuration validator.
 */
export type ConfigurationValidator<T> = (
  configuration: T,
) => ConfigurationValidationResult;

/**
 * Represents a configuration merger.
 */
export type ConfigurationMerger<T> = (
  base: T,
  overrides?: DeepPartial<T>,
) => T;

/**
 * Represents a configuration cloner.
 */
export type ConfigurationCloner<T> = (configuration: T) => T;

/**
 * Represents a configuration freezer.
 */
export type ConfigurationFreezer<T> = (
  configuration: T,
) => Immutable<T>;

/**
 * Represents a configuration updater.
 */
export type ConfigurationUpdater<T> = (
  current: T,
  overrides: DeepPartial<T>,
) => Immutable<T>;

/**
 * Describes one configuration validation issue.
 */
export interface ConfigurationValidationIssue {
  /**
   * Dot-separated path to the invalid configuration property.
   *
   * Example:
   * `execution.limits.maxConcurrentWorkflows`
   */
  readonly path: string;

  /**
   * Human-readable validation message.
   */
  readonly message: string;

  /**
   * Validation severity.
   */
  readonly severity: ConfigurationValidationSeverity;

  /**
   * Optional machine-readable validation code.
   */
  readonly code?: string;

  /**
   * Current invalid or questionable value.
   */
  readonly value?: unknown;
}

/**
 * Result returned by configuration validation functions.
 */
export interface ConfigurationValidationResult {
  /**
   * True when the configuration contains no validation errors.
   */
  readonly valid: boolean;

  /**
   * All validation issues discovered.
   */
  readonly issues: readonly ConfigurationValidationIssue[];

  /**
   * Validation issues with an error severity.
   */
  readonly errors: readonly ConfigurationValidationIssue[];

  /**
   * Validation issues with a warning severity.
   */
  readonly warnings: readonly ConfigurationValidationIssue[];
}

/**
 * Options controlling configuration creation.
 */
export interface ConfigurationCreationOptions {
  /**
   * Validate the configuration before returning it.
   */
  readonly validate?: boolean;

  /**
   * Deep-freeze the configuration before returning it.
   */
  readonly freeze?: boolean;

  /**
   * Throw an exception when validation fails.
   */
  readonly throwOnValidationError?: boolean;
}

/**
 * Runtime configuration source.
 */
export type ConfigurationSource =
  | "default"
  | "environment"
  | "file"
  | "database"
  | "administrator"
  | "runtime"
  | "test";

/**
 * Metadata describing how a configuration value was produced.
 */
export interface ConfigurationSourceMetadata {
  readonly source: ConfigurationSource;
  readonly sourceName?: string;
  readonly loadedAt: string;
  readonly checksum?: string;
}

/**
 * Creates an empty successful validation result.
 */
export function createValidConfigurationResult(): ConfigurationValidationResult {
  return {
    valid: true,
    issues: [],
    errors: [],
    warnings: [],
  };
}

/**
 * Builds a complete validation result from a list of issues.
 */
export function createConfigurationValidationResult(
  issues: readonly ConfigurationValidationIssue[],
): ConfigurationValidationResult {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    valid: errors.length === 0,
    issues: [...issues],
    errors,
    warnings,
  };
}

/**
 * Determines whether a value is a plain object.
 */
export function isPlainConfigurationObject(
  value: unknown,
): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * Performs a recursive clone suitable for runtime configuration values.
 *
 * Configuration values should consist of primitives, arrays, plain objects,
 * and dates. Functions are preserved by reference.
 */
export function cloneConfigurationValue<T>(value: T): T {
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneConfigurationValue(item)) as T;
  }

  if (isPlainConfigurationObject(value)) {
    const cloned: Record<string, unknown> = {};

    for (const [key, childValue] of Object.entries(value)) {
      cloned[key] = cloneConfigurationValue(childValue);
    }

    return cloned as T;
  }

  return value;
}

/**
 * Deeply freezes a configuration value.
 */
export function freezeConfigurationValue<T>(value: T): Immutable<T> {
  if (
    value === null ||
    typeof value !== "object" ||
    value instanceof Date ||
    Object.isFrozen(value)
  ) {
    return value as Immutable<T>;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      freezeConfigurationValue(item);
    }

    return Object.freeze(value) as Immutable<T>;
  }

  for (const childValue of Object.values(value as object)) {
    freezeConfigurationValue(childValue);
  }

  return Object.freeze(value) as Immutable<T>;
}

/**
 * Recursively merges configuration overrides into a base configuration.
 *
 * Arrays are replaced rather than concatenated.
 */
export function mergeConfigurationValues<T>(
  base: T,
  overrides?: DeepPartial<T>,
): T {
  if (overrides === undefined) {
    return cloneConfigurationValue(base);
  }

  if (
    Array.isArray(base) ||
    Array.isArray(overrides) ||
    !isPlainConfigurationObject(base) ||
    !isPlainConfigurationObject(overrides)
  ) {
    return cloneConfigurationValue(overrides as T);
  }

  const result = cloneConfigurationValue(
    base,
  ) as unknown as Record<string, unknown>;

  for (const [key, overrideValue] of Object.entries(overrides)) {
    if (overrideValue === undefined) {
      continue;
    }

    const baseValue = result[key];

    if (
      isPlainConfigurationObject(baseValue) &&
      isPlainConfigurationObject(overrideValue)
    ) {
      result[key] = mergeConfigurationValues(
        baseValue,
        overrideValue,
      );
    } else {
      result[key] = cloneConfigurationValue(overrideValue);
    }
  }

  return result as T;
}

/**
 * Creates an ISO timestamp for configuration metadata.
 */
export function createConfigurationTimestamp(
  date: Date = new Date(),
): string {
  return date.toISOString();
}