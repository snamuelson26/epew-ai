/**
 * IBOS Enterprise Operating System
 * Enterprise Workflow Runtime
 *
 * BaseConfiguration
 *
 * Defines the common contract shared by all workflow-runtime
 * configuration modules.
 *
 * Version: 1.0.0
 */

import type {
  ConfigurationEnvironment,
  ConfigurationValidationIssue,
  ConfigurationValidationResult,
  DeepPartial,
  Immutable,
} from "./ConfigurationTypes";

import {
  cloneConfigurationValue,
  createConfigurationTimestamp,
  createConfigurationValidationResult,
  freezeConfigurationValue,
  mergeConfigurationValues,
} from "./ConfigurationTypes";

/**
 * Current version of the base configuration contract.
 */
export const BASE_CONFIGURATION_VERSION = "1.0.0" as const;

/**
 * Default configuration identifier.
 */
export const DEFAULT_BASE_CONFIGURATION_ID =
  "ibos-workflow-runtime" as const;

/**
 * General metadata shared by every configuration module.
 */
export interface BaseConfigurationMetadata {
  /**
   * ISO timestamp indicating when the configuration was created.
   */
  readonly createdAt: string;

  /**
   * ISO timestamp indicating when the configuration was last updated.
   */
  readonly updatedAt: string;

  /**
   * Optional human-readable description.
   */
  readonly description?: string;

  /**
   * Optional configuration tags.
   */
  readonly tags: readonly string[];
}

/**
 * Behavior controlling how a configuration object is created and used.
 */
export interface BaseConfigurationBehavior {
  /**
   * Validate the configuration during creation.
   */
  readonly validateOnCreate: boolean;

  /**
   * Deep-freeze the configuration after creation.
   */
  readonly freezeAfterCreate: boolean;

  /**
   * Prevent runtime updates after initialization.
   */
  readonly immutable: boolean;

  /**
   * Throw when validation errors are discovered.
   */
  readonly throwOnValidationError: boolean;
}

/**
 * Parent contract for all IBOS workflow-runtime configuration modules.
 */
export interface BaseConfiguration {
  /**
   * Unique configuration identifier.
   */
  readonly id: string;

  /**
   * Human-readable configuration name.
   */
  readonly name: string;

  /**
   * Configuration schema or component version.
   */
  readonly version: string;

  /**
   * Enables or disables the configured component.
   */
  readonly enabled: boolean;

  /**
   * Deployment environment.
   */
  readonly environment: ConfigurationEnvironment;

  /**
   * Configuration metadata.
   */
  readonly metadata: BaseConfigurationMetadata;

  /**
   * Configuration behavior.
   */
  readonly behavior: BaseConfigurationBehavior;
}

/**
 * Production-safe base configuration defaults.
 */
export const DEFAULT_BASE_CONFIGURATION: Immutable<BaseConfiguration> =
  freezeConfigurationValue({
    id: DEFAULT_BASE_CONFIGURATION_ID,
    name: "IBOS Workflow Runtime",
    version: BASE_CONFIGURATION_VERSION,
    enabled: true,
    environment: "production",
    metadata: {
      createdAt: "1970-01-01T00:00:00.000Z",
      updatedAt: "1970-01-01T00:00:00.000Z",
      description:
        "Base configuration for the IBOS Enterprise Workflow Runtime.",
      tags: ["ibos", "workflow-runtime"],
    },
    behavior: {
      validateOnCreate: true,
      freezeAfterCreate: true,
      immutable: true,
      throwOnValidationError: true,
    },
  });

/**
 * Options accepted when creating a base configuration.
 */
export interface CreateBaseConfigurationOptions {
  /**
   * Configuration overrides.
   */
  readonly overrides?: DeepPartial<BaseConfiguration>;

  /**
   * Timestamp applied to metadata when one is not provided.
   */
  readonly timestamp?: Date;
}

/**
 * Error thrown when configuration validation fails.
 */
export class ConfigurationValidationError extends Error {
  public readonly validation: ConfigurationValidationResult;

  public constructor(
    message: string,
    validation: ConfigurationValidationResult,
  ) {
    super(message);

    this.name = "ConfigurationValidationError";
    this.validation = validation;

    Object.setPrototypeOf(this, ConfigurationValidationError.prototype);
  }
}

/**
 * Validates the common base configuration contract.
 */
export function validateBaseConfiguration(
  configuration: BaseConfiguration,
): ConfigurationValidationResult {
  const issues: ConfigurationValidationIssue[] = [];

  if (!configuration.id.trim()) {
    issues.push({
      path: "id",
      message: "Configuration id must not be empty.",
      severity: "error",
      code: "BASE_ID_REQUIRED",
      value: configuration.id,
    });
  }

  if (!configuration.name.trim()) {
    issues.push({
      path: "name",
      message: "Configuration name must not be empty.",
      severity: "error",
      code: "BASE_NAME_REQUIRED",
      value: configuration.name,
    });
  }

  if (!configuration.version.trim()) {
    issues.push({
      path: "version",
      message: "Configuration version must not be empty.",
      severity: "error",
      code: "BASE_VERSION_REQUIRED",
      value: configuration.version,
    });
  }

  const supportedEnvironments: readonly ConfigurationEnvironment[] = [
    "development",
    "testing",
    "staging",
    "production",
  ];

  if (!supportedEnvironments.includes(configuration.environment)) {
    issues.push({
      path: "environment",
      message: `Unsupported configuration environment: ${String(
        configuration.environment,
      )}.`,
      severity: "error",
      code: "BASE_ENVIRONMENT_INVALID",
      value: configuration.environment,
    });
  }

  if (!isValidIsoTimestamp(configuration.metadata.createdAt)) {
    issues.push({
      path: "metadata.createdAt",
      message: "Created timestamp must be a valid ISO date string.",
      severity: "error",
      code: "BASE_CREATED_AT_INVALID",
      value: configuration.metadata.createdAt,
    });
  }

  if (!isValidIsoTimestamp(configuration.metadata.updatedAt)) {
    issues.push({
      path: "metadata.updatedAt",
      message: "Updated timestamp must be a valid ISO date string.",
      severity: "error",
      code: "BASE_UPDATED_AT_INVALID",
      value: configuration.metadata.updatedAt,
    });
  }

  if (
    isValidIsoTimestamp(configuration.metadata.createdAt) &&
    isValidIsoTimestamp(configuration.metadata.updatedAt) &&
    Date.parse(configuration.metadata.updatedAt) <
      Date.parse(configuration.metadata.createdAt)
  ) {
    issues.push({
      path: "metadata.updatedAt",
      message:
        "Updated timestamp must not occur before the created timestamp.",
      severity: "error",
      code: "BASE_UPDATED_AT_BEFORE_CREATED_AT",
      value: configuration.metadata.updatedAt,
    });
  }

  const invalidTag = configuration.metadata.tags.find(
    (tag) => !tag.trim(),
  );

  if (invalidTag !== undefined) {
    issues.push({
      path: "metadata.tags",
      message: "Configuration tags must not contain empty values.",
      severity: "warning",
      code: "BASE_EMPTY_TAG",
      value: configuration.metadata.tags,
    });
  }

  if (
    configuration.behavior.immutable &&
    !configuration.behavior.freezeAfterCreate
  ) {
    issues.push({
      path: "behavior.freezeAfterCreate",
      message:
        "Immutable configurations should normally be frozen after creation.",
      severity: "warning",
      code: "BASE_IMMUTABLE_NOT_FROZEN",
      value: configuration.behavior.freezeAfterCreate,
    });
  }

  return createConfigurationValidationResult(issues);
}

/**
 * Creates a base configuration using production-safe defaults.
 */
export function createBaseConfiguration(
  options: CreateBaseConfigurationOptions = {},
): Immutable<BaseConfiguration> {
  const timestamp = createConfigurationTimestamp(
    options.timestamp ?? new Date(),
  );

  const timestampedDefaults: BaseConfiguration = {
    ...cloneConfigurationValue(DEFAULT_BASE_CONFIGURATION),
    metadata: {
      ...cloneConfigurationValue(DEFAULT_BASE_CONFIGURATION.metadata),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  const merged: BaseConfiguration = mergeConfigurationValues(
  timestampedDefaults,
  options.overrides,
) as BaseConfiguration;

  const validation = validateBaseConfiguration(merged);

  if (
    merged.behavior.validateOnCreate &&
    !validation.valid &&
    merged.behavior.throwOnValidationError
  ) {
    throw new ConfigurationValidationError(
      "The base runtime configuration is invalid.",
      validation,
    );
  }

  return merged.behavior.freezeAfterCreate
    ? freezeConfigurationValue(merged)
    : (merged as Immutable<BaseConfiguration>);
}

/**
 * Creates development-oriented base configuration defaults.
 */
export function createDevelopmentBaseConfiguration(
  overrides?: DeepPartial<BaseConfiguration>,
): Immutable<BaseConfiguration> {
  return createBaseConfiguration({
    overrides: mergeConfigurationValues<BaseConfiguration>(
      {
        ...cloneConfigurationValue(DEFAULT_BASE_CONFIGURATION),
        environment: "development",
        metadata: {
          ...cloneConfigurationValue(
            DEFAULT_BASE_CONFIGURATION.metadata,
          ),
          tags: ["ibos", "workflow-runtime", "development"],
        },
        behavior: {
          validateOnCreate: true,
          freezeAfterCreate: true,
          immutable: true,
          throwOnValidationError: true,
        },
      },
      overrides,
    ),
  });
}

/**
 * Creates testing-oriented base configuration defaults.
 */
export function createTestingBaseConfiguration(
  overrides?: DeepPartial<BaseConfiguration>,
): Immutable<BaseConfiguration> {
  return createBaseConfiguration({
    overrides: mergeConfigurationValues<BaseConfiguration>(
      {
        ...cloneConfigurationValue(DEFAULT_BASE_CONFIGURATION),
        environment: "testing",
        metadata: {
          ...cloneConfigurationValue(
            DEFAULT_BASE_CONFIGURATION.metadata,
          ),
          tags: ["ibos", "workflow-runtime", "testing"],
        },
        behavior: {
          validateOnCreate: true,
          freezeAfterCreate: true,
          immutable: true,
          throwOnValidationError: true,
        },
      },
      overrides,
    ),
  });
}

/**
 * Creates staging-oriented base configuration defaults.
 */
export function createStagingBaseConfiguration(
  overrides?: DeepPartial<BaseConfiguration>,
): Immutable<BaseConfiguration> {
  return createBaseConfiguration({
    overrides: mergeConfigurationValues<BaseConfiguration>(
      {
        ...cloneConfigurationValue(DEFAULT_BASE_CONFIGURATION),
        environment: "staging",
        metadata: {
          ...cloneConfigurationValue(
            DEFAULT_BASE_CONFIGURATION.metadata,
          ),
          tags: ["ibos", "workflow-runtime", "staging"],
        },
      },
      overrides,
    ),
  });
}

/**
 * Creates production-oriented base configuration defaults.
 */
export function createProductionBaseConfiguration(
  overrides?: DeepPartial<BaseConfiguration>,
): Immutable<BaseConfiguration> {
  return createBaseConfiguration({
    overrides: mergeConfigurationValues<BaseConfiguration>(
      {
        ...cloneConfigurationValue(DEFAULT_BASE_CONFIGURATION),
        environment: "production",
        metadata: {
          ...cloneConfigurationValue(
            DEFAULT_BASE_CONFIGURATION.metadata,
          ),
          tags: ["ibos", "workflow-runtime", "production"],
        },
        behavior: {
          validateOnCreate: true,
          freezeAfterCreate: true,
          immutable: true,
          throwOnValidationError: true,
        },
      },
      overrides,
    ),
  });
}

/**
 * Creates a mutable deep clone of a base configuration.
 */
export function cloneBaseConfiguration(
  configuration: BaseConfiguration,
): BaseConfiguration {
  return cloneConfigurationValue(configuration);
}

/**
 * Applies overrides and returns a new immutable base configuration.
 */
export function updateBaseConfiguration(
  configuration: BaseConfiguration,
  overrides: DeepPartial<BaseConfiguration>,
): Immutable<BaseConfiguration> {
  const current = cloneBaseConfiguration(configuration);
  const updatedAt = createConfigurationTimestamp();

  return createBaseConfiguration({
    overrides: mergeConfigurationValues(current, {
      ...overrides,
      metadata: {
        ...overrides.metadata,
        createdAt: current.metadata.createdAt,
        updatedAt,
      },
    }),
  });
}

/**
 * Determines whether an unknown value satisfies the basic shape of a
 * BaseConfiguration object.
 */
export function isBaseConfiguration(
  value: unknown,
): value is BaseConfiguration {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BaseConfiguration>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.version === "string" &&
    typeof candidate.enabled === "boolean" &&
    typeof candidate.environment === "string" &&
    candidate.metadata !== null &&
    typeof candidate.metadata === "object" &&
    candidate.behavior !== null &&
    typeof candidate.behavior === "object"
  );
}

/**
 * Determines whether a string represents a valid ISO timestamp.
 */
function isValidIsoTimestamp(value: string): boolean {
  if (!value.trim()) {
    return false;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp);
}