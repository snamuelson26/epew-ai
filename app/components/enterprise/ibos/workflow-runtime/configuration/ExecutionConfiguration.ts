/**
 * IBOS Enterprise Operating System
 * Enterprise Workflow Runtime
 *
 * ExecutionConfiguration
 *
 * Defines the configuration contracts, execution strategies, concurrency
 * controls, retry policies, compensation behavior, cancellation rules,
 * validation settings, performance options, diagnostics, and execution
 * security controls used by the IBOS Workflow Runtime.
 *
 * Version: 1.0.0
 */

import {
  DEFAULT_BASE_CONFIGURATION,
  validateBaseConfiguration,
} from "./BaseConfiguration";

import type { BaseConfiguration } from "./BaseConfiguration";

import type {
  ConfigurationValidationIssue,
  ConfigurationValidationResult,
  Immutable,
} from "./ConfigurationTypes";

import {
  createConfigurationValidationResult,
  freezeConfigurationValue,
} from "./ConfigurationTypes";

/**
 * Current schema version of the execution configuration module.
 */
export const EXECUTION_CONFIGURATION_VERSION = "1.0.0" as const;

/**
 * Default identifier assigned to the execution configuration.
 */
export const DEFAULT_EXECUTION_CONFIGURATION_ID =
  "ibos-workflow-runtime-execution" as const;

/**
 * Default human-readable execution configuration name.
 */
export const DEFAULT_EXECUTION_CONFIGURATION_NAME =
  "IBOS Workflow Runtime Execution Configuration" as const;

/**
 * Lowest supported positive duration in milliseconds.
 */
export const MINIMUM_EXECUTION_DURATION_MS = 1 as const;

/**
 * Maximum JavaScript-safe numeric limit used during validation.
 */
export const MAXIMUM_SAFE_EXECUTION_VALUE = Number.MAX_SAFE_INTEGER;

/**
 * Defines how workflows are executed by the runtime.
 */
export enum ExecutionMode {
  /**
   * Executes one workflow operation at a time in a deterministic order.
   */
  SEQUENTIAL = "sequential",

  /**
   * Allows independent workflow operations to execute concurrently.
   */
  PARALLEL = "parallel",

  /**
   * Allows workflow execution across multiple runtime nodes.
   */
  DISTRIBUTED = "distributed",

  /**
   * Combines local, parallel, and distributed execution strategies.
   */
  HYBRID = "hybrid",
}

/**
 * Defines how failed workflow operations are retried.
 */
export enum RetryStrategy {
  /**
   * Failed operations are not retried.
   */
  NONE = "none",

  /**
   * Retries immediately without waiting.
   */
  IMMEDIATE = "immediate",

  /**
   * Waits for the same duration between every retry.
   */
  FIXED_DELAY = "fixed-delay",

  /**
   * Increases the retry delay by a fixed amount.
   */
  LINEAR = "linear",

  /**
   * Multiplies the retry delay after every failed attempt.
   */
  EXPONENTIAL = "exponential",

  /**
   * Uses an externally supplied retry calculation strategy.
   */
  CUSTOM = "custom",
}

/**
 * Defines how compensation operations are performed.
 */
export enum CompensationStrategy {
  /**
   * Compensation processing is disabled.
   */
  DISABLED = "disabled",

  /**
   * Compensates completed operations in reverse execution order.
   */
  REVERSE_ORDER = "reverse-order",

  /**
   * Compensates completed operations in original execution order.
   */
  FORWARD_ORDER = "forward-order",

  /**
   * Uses a workflow-defined compensation order.
   */
  CUSTOM = "custom",
}

/**
 * Defines how workflow cancellation requests are handled.
 */
export enum CancellationStrategy {
  /**
   * Allows currently running work to finish before cancellation.
   */
  GRACEFUL = "graceful",

  /**
   * Stops execution as soon as safely possible.
   */
  IMMEDIATE = "immediate",

  /**
   * Forces execution termination without waiting for normal cleanup.
   */
  FORCE = "force",

  /**
   * Attempts graceful cancellation before forcing termination after a timeout.
   */
  TIMEOUT = "timeout",
}

/**
 * Defines the strictness applied during workflow validation.
 */
export enum ExecutionValidationStrategy {
  /**
   * Rejects all invalid, unsupported, or questionable workflow definitions.
   */
  STRICT = "strict",

  /**
   * Rejects invalid definitions while allowing non-critical warnings.
   */
  STANDARD = "standard",

  /**
   * Allows selected recoverable inconsistencies.
   */
  RELAXED = "relaxed",
}

/**
 * Defines how duplicate workflow execution is prevented.
 */
export enum DuplicateProtectionStrategy {
  /**
   * Duplicate protection is disabled.
   */
  NONE = "none",

  /**
   * Duplicate execution information is stored in local memory.
   */
  MEMORY = "memory",

  /**
   * Duplicate execution information is stored in persistent storage.
   */
  PERSISTENCE = "persistence",

  /**
   * Duplicate execution is prevented through distributed coordination.
   */
  DISTRIBUTED = "distributed",
}

/**
 * Defines how execution authorization is enforced.
 */
export enum ExecutionAuthorizationMode {
  /**
   * Authorization checks are disabled.
   */
  NONE = "none",

  /**
   * Authorization is performed only when explicitly requested.
   */
  OPTIONAL = "optional",

  /**
   * Every workflow execution requires authorization.
   */
  REQUIRED = "required",
}

/**
 * Defines behavior for an execution queue that has reached capacity.
 */
export enum ExecutionQueueOverflowStrategy {
  /**
   * Rejects the new execution request.
   */
  REJECT = "reject",

  /**
   * Waits until queue capacity becomes available.
   */
  WAIT = "wait",

  /**
   * Removes the oldest queued execution request.
   */
  DROP_OLDEST = "drop-oldest",

  /**
   * Removes the newest queued execution request.
   */
  DROP_NEWEST = "drop-newest",
}

/**
 * Defines the primary behavior of workflow execution.
 */
export interface ExecutionSettings {
  /**
   * Execution model used by the workflow runtime.
   */
  readonly mode: ExecutionMode;

  /**
   * Maximum duration allowed for a workflow execution.
   *
   * A value of zero indicates that no runtime duration limit is applied.
   */
  readonly maximumWorkflowDurationMs: number;

  /**
   * Maximum duration allowed for an individual workflow step.
   *
   * A value of zero indicates that no step duration limit is applied.
   */
  readonly maximumStepDurationMs: number;

  /**
   * Maximum number of nested child-workflow levels.
   */
  readonly maximumWorkflowDepth: number;

  /**
   * Maximum number of child workflows that one workflow may create.
   */
  readonly maximumChildWorkflows: number;

  /**
   * Maximum number of steps allowed in one workflow definition.
   */
  readonly maximumWorkflowSize: number;

  /**
   * Determines whether child workflows are permitted.
   */
  readonly allowChildWorkflows: boolean;

  /**
   * Determines whether parallel workflow branches are permitted.
   */
  readonly allowParallelBranches: boolean;

  /**
   * Determines whether workflow execution may continue after a
   * non-critical step failure.
   */
  readonly continueOnNonCriticalFailure: boolean;

  /**
   * Determines whether the runtime records an execution result for
   * every completed workflow.
   */
  readonly retainExecutionResult: boolean;
}

/**
 * Defines runtime concurrency and queue behavior.
 */
export interface ExecutionConcurrencySettings {
  /**
   * Number of local workers available to execute workflow operations.
   */
  readonly workerCount: number;

  /**
   * Maximum number of workflows allowed to execute concurrently.
   */
  readonly maximumConcurrentWorkflows: number;

  /**
   * Maximum number of workflow steps allowed to execute concurrently.
   */
  readonly maximumConcurrentSteps: number;

  /**
   * Maximum number of parallel branches allowed within one workflow.
   */
  readonly maximumParallelBranches: number;

  /**
   * Maximum number of pending workflow executions in the execution queue.
   */
  readonly queueCapacity: number;

  /**
   * Number of queued execution requests claimed during one scheduling cycle.
   */
  readonly batchSize: number;

  /**
   * Behavior applied when the execution queue reaches capacity.
   */
  readonly queueOverflowStrategy: ExecutionQueueOverflowStrategy;

  /**
   * Maximum duration an execution request may wait for queue capacity.
   *
   * This value applies when queueOverflowStrategy is set to WAIT.
   */
  readonly queueWaitTimeoutMs: number;

  /**
   * Determines whether concurrency limits are applied independently
   * to each workflow.
   */
  readonly isolateWorkflowConcurrency: boolean;
}

/**
 * Defines retry behavior for failed workflow operations.
 */
export interface ExecutionRetrySettings {
  /**
   * Enables retry processing.
   */
  readonly enabled: boolean;

  /**
   * Retry delay strategy.
   */
  readonly strategy: RetryStrategy;

  /**
   * Maximum number of retry attempts after the initial execution attempt.
   */
  readonly maximumRetries: number;

  /**
   * Initial delay before the first retry attempt.
   */
  readonly initialDelayMs: number;

  /**
   * Maximum delay permitted between retry attempts.
   */
  readonly maximumDelayMs: number;

  /**
   * Multiplier used by exponential retry calculations.
   */
  readonly multiplier: number;

  /**
   * Fixed increase used by linear retry calculations.
   */
  readonly linearIncrementMs: number;

  /**
   * Random delay percentage applied to reduce simultaneous retries.
   *
   * Valid values range from zero through one.
   */
  readonly jitterFactor: number;

  /**
   * Determines whether step-level failures may be retried.
   */
  readonly retryFailedSteps: boolean;

  /**
   * Determines whether failed child workflows may be retried.
   */
  readonly retryFailedChildWorkflows: boolean;

  /**
   * Determines whether retry counters survive runtime restarts.
   */
  readonly persistRetryState: boolean;

  /**
   * Optional error names or error codes that are eligible for retries.
   *
   * An empty collection allows every retryable runtime error.
   */
  readonly retryableErrors: readonly string[];

  /**
   * Error names or error codes that must never be retried.
   */
  readonly nonRetryableErrors: readonly string[];
}

/**
 * Defines workflow compensation and rollback behavior.
 */
export interface ExecutionCompensationSettings {
  /**
   * Enables compensation processing.
   */
  readonly enabled: boolean;

  /**
   * Compensation ordering strategy.
   */
  readonly strategy: CompensationStrategy;

  /**
   * Determines whether compensation continues when one compensation
   * operation fails.
   */
  readonly continueOnFailure: boolean;

  /**
   * Maximum number of compensation operations allowed for one workflow.
   */
  readonly maximumCompensationOperations: number;

  /**
   * Maximum duration allowed for an individual compensation operation.
   */
  readonly compensationTimeoutMs: number;

  /**
   * Determines whether compensation operations may be retried.
   */
  readonly retryFailedCompensation: boolean;

  /**
   * Maximum number of compensation retry attempts.
   */
  readonly maximumCompensationRetries: number;

  /**
   * Delay between compensation retry attempts.
   */
  readonly compensationRetryDelayMs: number;

  /**
   * Determines whether compensation progress is persisted.
   */
  readonly persistCompensationState: boolean;

  /**
   * Determines whether a workflow failure automatically begins compensation.
   */
  readonly compensateAutomatically: boolean;

  /**
   * Determines whether completed child workflows are included in compensation.
   */
  readonly compensateChildWorkflows: boolean;
}

/**
 * Defines workflow cancellation behavior.
 */
export interface ExecutionCancellationSettings {
  /**
   * Cancellation strategy applied by the runtime.
   */
  readonly strategy: CancellationStrategy;

  /**
   * Maximum duration allowed for graceful cancellation.
   */
  readonly gracefulTimeoutMs: number;

  /**
   * Maximum duration before forceful cancellation is applied.
   */
  readonly forceTimeoutMs: number;

  /**
   * Determines whether currently running steps receive a cancellation signal.
   */
  readonly notifyRunningSteps: boolean;

  /**
   * Determines whether pending steps are removed after cancellation.
   */
  readonly cancelPendingSteps: boolean;

  /**
   * Determines whether child workflows are cancelled with their parent.
   */
  readonly cascadeToChildWorkflows: boolean;

  /**
   * Determines whether cancellation state is persisted.
   */
  readonly persistCancellationState: boolean;

  /**
   * Determines whether compensation begins after workflow cancellation.
   */
  readonly compensateOnCancellation: boolean;

  /**
   * Determines whether cancelled workflows may be resumed.
   */
  readonly allowResumeAfterCancellation: boolean;
}

/**
 * Defines workflow validation behavior before and during execution.
 */
export interface ExecutionValidationSettings {
  /**
   * Validation strictness.
   */
  readonly strategy: ExecutionValidationStrategy;

  /**
   * Validates the workflow definition before execution begins.
   */
  readonly validateBeforeExecution: boolean;

  /**
   * Validates workflow input before execution begins.
   */
  readonly validateInput: boolean;

  /**
   * Validates the workflow result after execution completes.
   */
  readonly validateOutput: boolean;

  /**
   * Validates every step before the step executes.
   */
  readonly validateSteps: boolean;

  /**
   * Validates child workflow definitions.
   */
  readonly validateChildWorkflows: boolean;

  /**
   * Validates compensation definitions before execution.
   */
  readonly validateCompensation: boolean;

  /**
   * Attempts to detect circular or infinite workflow paths.
   */
  readonly detectInfiniteLoops: boolean;

  /**
   * Detects unreachable workflow steps.
   */
  readonly detectUnreachableSteps: boolean;

  /**
   * Rejects workflow definitions containing unknown step types.
   */
  readonly rejectUnknownStepTypes: boolean;

  /**
   * Rejects configuration properties not recognized by the runtime schema.
   */
  readonly rejectUnknownProperties: boolean;

  /**
   * Determines whether validation warnings are treated as errors.
   */
  readonly treatWarningsAsErrors: boolean;
}

/**
 * Defines performance monitoring and execution-history behavior.
 */
export interface ExecutionPerformanceSettings {
  /**
   * Enables execution metric collection.
   */
  readonly collectMetrics: boolean;

  /**
   * Enables execution statistics collection.
   */
  readonly collectStatistics: boolean;

  /**
   * Records workflow execution history.
   */
  readonly captureExecutionHistory: boolean;

  /**
   * Records step execution history.
   */
  readonly captureStepHistory: boolean;

  /**
   * Measures total workflow execution time.
   */
  readonly measureWorkflowDuration: boolean;

  /**
   * Measures individual step execution time.
   */
  readonly measureStepDuration: boolean;

  /**
   * Tracks queue waiting time.
   */
  readonly measureQueueWaitTime: boolean;

  /**
   * Tracks retry timing and retry counts.
   */
  readonly measureRetryPerformance: boolean;

  /**
   * Maximum number of execution-history entries retained in memory.
   */
  readonly maximumInMemoryHistoryEntries: number;

  /**
   * Determines whether performance records are persisted.
   */
  readonly persistPerformanceData: boolean;

  /**
   * Interval used to flush performance data to persistent storage.
   */
  readonly performanceFlushIntervalMs: number;
}

/**
 * Defines execution-level diagnostic tracing.
 */
export interface ExecutionDiagnosticsSettings {
  /**
   * Enables detailed diagnostic logging.
   */
  readonly verbose: boolean;

  /**
   * Traces workflow execution lifecycle transitions.
   */
  readonly traceExecution: boolean;

  /**
   * Traces individual workflow steps.
   */
  readonly traceSteps: boolean;

  /**
   * Traces emitted runtime events.
   */
  readonly traceEvents: boolean;

  /**
   * Traces retry decisions and retry attempts.
   */
  readonly traceRetries: boolean;

  /**
   * Traces compensation processing.
   */
  readonly traceCompensation: boolean;

  /**
   * Traces cancellation processing.
   */
  readonly traceCancellation: boolean;

  /**
   * Traces child workflow creation and completion.
   */
  readonly traceChildWorkflows: boolean;

  /**
   * Includes workflow input values in diagnostic records.
   */
  readonly includeWorkflowInput: boolean;

  /**
   * Includes workflow output values in diagnostic records.
   */
  readonly includeWorkflowOutput: boolean;

  /**
   * Includes step input and output values in diagnostic records.
   */
  readonly includeStepData: boolean;

  /**
   * Removes configured sensitive properties from diagnostic records.
   */
  readonly redactSensitiveData: boolean;

  /**
   * Property names removed from diagnostic output.
   */
  readonly sensitivePropertyNames: readonly string[];
}

/**
 * Defines workflow execution security and duplicate-prevention behavior.
 */
export interface ExecutionSecuritySettings {
  /**
   * Duplicate execution protection strategy.
   */
  readonly duplicateProtection: DuplicateProtectionStrategy;

  /**
   * Duration for which duplicate-execution records remain valid.
   */
  readonly duplicateProtectionWindowMs: number;

  /**
   * Validates the workflow definition checksum before execution.
   */
  readonly validateWorkflowChecksum: boolean;

  /**
   * Requires a workflow definition to exist in the runtime registry.
   */
  readonly requireWorkflowRegistration: boolean;

  /**
   * Authorization requirement applied before execution.
   */
  readonly authorizationMode: ExecutionAuthorizationMode;

  /**
   * Prevents simultaneous executions using the same workflow execution key.
   */
  readonly preventConcurrentExecution: boolean;

  /**
   * Requires an execution idempotency key.
   */
  readonly requireIdempotencyKey: boolean;

  /**
   * Validates workflow ownership before execution.
   */
  readonly validateWorkflowOwnership: boolean;

  /**
   * Prevents workflow definitions from changing during execution.
   */
  readonly enforceDefinitionImmutability: boolean;

  /**
   * Requires distributed locking when the runtime uses distributed execution.
   */
  readonly requireDistributedLock: boolean;

  /**
   * Maximum duration allowed to acquire an execution lock.
   */
  readonly lockAcquisitionTimeoutMs: number;

  /**
   * Determines whether rejected security checks are recorded.
   */
  readonly auditRejectedExecutions: boolean;
}

/**
 * Complete configuration contract for workflow execution.
 *
 * The interface extends BaseConfiguration so all execution configurations
 * inherit common identity, environment, metadata, validation, and
 * immutability behavior.
 */
export interface ExecutionConfiguration extends BaseConfiguration {
  /**
   * Core workflow execution behavior.
   */
  readonly execution: ExecutionSettings;

  /**
   * Concurrency and queue behavior.
   */
  readonly concurrency: ExecutionConcurrencySettings;

  /**
   * Retry behavior.
   */
  readonly retry: ExecutionRetrySettings;

  /**
   * Compensation and rollback behavior.
   */
  readonly compensation: ExecutionCompensationSettings;

  /**
   * Cancellation behavior.
   */
  readonly cancellation: ExecutionCancellationSettings;

  /**
   * Workflow validation behavior.
   */
  readonly validation: ExecutionValidationSettings;

  /**
   * Performance collection and history behavior.
   */
  readonly performance: ExecutionPerformanceSettings;

  /**
   * Diagnostic tracing behavior.
   */
  readonly diagnostics: ExecutionDiagnosticsSettings;

  /**
   * Security and duplicate-execution protection.
   */
  readonly security: ExecutionSecuritySettings;
}

/**
 * Configuration override type used by factories and update functions.
 *
 * The concrete DeepPartial import and factory implementation will be added
 * in the next sections of this module.
 */
export type ExecutionConfigurationSection = keyof Pick<
  ExecutionConfiguration,
  | "execution"
  | "concurrency"
  | "retry"
  | "compensation"
  | "cancellation"
  | "validation"
  | "performance"
  | "diagnostics"
  | "security"
>;

/**
 * Supported execution modes.
 */
export const EXECUTION_MODES: readonly ExecutionMode[] = Object.freeze([
  ExecutionMode.SEQUENTIAL,
  ExecutionMode.PARALLEL,
  ExecutionMode.DISTRIBUTED,
  ExecutionMode.HYBRID,
]);

/**
 * Supported retry strategies.
 */
export const RETRY_STRATEGIES: readonly RetryStrategy[] = Object.freeze([
  RetryStrategy.NONE,
  RetryStrategy.IMMEDIATE,
  RetryStrategy.FIXED_DELAY,
  RetryStrategy.LINEAR,
  RetryStrategy.EXPONENTIAL,
  RetryStrategy.CUSTOM,
]);

/**
 * Supported compensation strategies.
 */
export const COMPENSATION_STRATEGIES: readonly CompensationStrategy[] =
  Object.freeze([
    CompensationStrategy.DISABLED,
    CompensationStrategy.REVERSE_ORDER,
    CompensationStrategy.FORWARD_ORDER,
    CompensationStrategy.CUSTOM,
  ]);

/**
 * Supported cancellation strategies.
 */
export const CANCELLATION_STRATEGIES: readonly CancellationStrategy[] =
  Object.freeze([
    CancellationStrategy.GRACEFUL,
    CancellationStrategy.IMMEDIATE,
    CancellationStrategy.FORCE,
    CancellationStrategy.TIMEOUT,
  ]);

/**
 * Supported execution-validation strategies.
 */
export const EXECUTION_VALIDATION_STRATEGIES:
  readonly ExecutionValidationStrategy[] = Object.freeze([
  ExecutionValidationStrategy.STRICT,
  ExecutionValidationStrategy.STANDARD,
  ExecutionValidationStrategy.RELAXED,
]);

/**
 * Supported duplicate-protection strategies.
 */
export const DUPLICATE_PROTECTION_STRATEGIES:
  readonly DuplicateProtectionStrategy[] = Object.freeze([
  DuplicateProtectionStrategy.NONE,
  DuplicateProtectionStrategy.MEMORY,
  DuplicateProtectionStrategy.PERSISTENCE,
  DuplicateProtectionStrategy.DISTRIBUTED,
]);

/**
 * Supported authorization modes.
 */
export const EXECUTION_AUTHORIZATION_MODES:
  readonly ExecutionAuthorizationMode[] = Object.freeze([
  ExecutionAuthorizationMode.NONE,
  ExecutionAuthorizationMode.OPTIONAL,
  ExecutionAuthorizationMode.REQUIRED,
]);

/**
 * Supported queue-overflow strategies.
 */
export const EXECUTION_QUEUE_OVERFLOW_STRATEGIES:
  readonly ExecutionQueueOverflowStrategy[] = Object.freeze([
  ExecutionQueueOverflowStrategy.REJECT,
  ExecutionQueueOverflowStrategy.WAIT,
  ExecutionQueueOverflowStrategy.DROP_OLDEST,
  ExecutionQueueOverflowStrategy.DROP_NEWEST,
]);
/**
 * Production-safe default execution configuration.
 *
 * These defaults favor deterministic execution, conservative concurrency,
 * persistent operational state, strict validation, graceful cancellation,
 * compensation support, and secure duplicate-execution protection.
 */
export const DEFAULT_EXECUTION_CONFIGURATION: Immutable<ExecutionConfiguration> =
  freezeConfigurationValue({
    ...DEFAULT_BASE_CONFIGURATION,

    id: DEFAULT_EXECUTION_CONFIGURATION_ID,

    name: DEFAULT_EXECUTION_CONFIGURATION_NAME,

    version: EXECUTION_CONFIGURATION_VERSION,

    enabled: true,

    environment: "production",

    metadata: {
      ...DEFAULT_BASE_CONFIGURATION.metadata,

      description:
        "Default execution configuration for the IBOS Enterprise Workflow Runtime.",

      tags: [
        "ibos",
        "workflow-runtime",
        "execution",
        "enterprise",
        "production",
      ],
    },

    behavior: {
      validateOnCreate: true,
      freezeAfterCreate: true,
      immutable: true,
      throwOnValidationError: true,
    },

    execution: {
      mode: ExecutionMode.SEQUENTIAL,

      maximumWorkflowDurationMs: 24 * 60 * 60 * 1000,

      maximumStepDurationMs: 30 * 60 * 1000,

      maximumWorkflowDepth: 10,

      maximumChildWorkflows: 100,

      maximumWorkflowSize: 1_000,

      allowChildWorkflows: true,

      allowParallelBranches: true,

      continueOnNonCriticalFailure: false,

      retainExecutionResult: true,
    },

    concurrency: {
      workerCount: 4,

      maximumConcurrentWorkflows: 25,

      maximumConcurrentSteps: 100,

      maximumParallelBranches: 20,

      queueCapacity: 10_000,

      batchSize: 25,

      queueOverflowStrategy: ExecutionQueueOverflowStrategy.WAIT,

      queueWaitTimeoutMs: 30_000,

      isolateWorkflowConcurrency: true,
    },

    retry: {
      enabled: true,

      strategy: RetryStrategy.EXPONENTIAL,

      maximumRetries: 3,

      initialDelayMs: 1_000,

      maximumDelayMs: 60_000,

      multiplier: 2,

      linearIncrementMs: 1_000,

      jitterFactor: 0.2,

      retryFailedSteps: true,

      retryFailedChildWorkflows: true,

      persistRetryState: true,

      retryableErrors: [],

      nonRetryableErrors: [
        "WorkflowValidationError",
        "WorkflowAuthorizationError",
        "WorkflowConfigurationError",
        "WorkflowDefinitionError",
      ],
    },

    compensation: {
      enabled: true,

      strategy: CompensationStrategy.REVERSE_ORDER,

      continueOnFailure: true,

      maximumCompensationOperations: 1_000,

      compensationTimeoutMs: 10 * 60 * 1000,

      retryFailedCompensation: true,

      maximumCompensationRetries: 3,

      compensationRetryDelayMs: 5_000,

      persistCompensationState: true,

      compensateAutomatically: true,

      compensateChildWorkflows: true,
    },

    cancellation: {
      strategy: CancellationStrategy.TIMEOUT,

      gracefulTimeoutMs: 30_000,

      forceTimeoutMs: 60_000,

      notifyRunningSteps: true,

      cancelPendingSteps: true,

      cascadeToChildWorkflows: true,

      persistCancellationState: true,

      compensateOnCancellation: true,

      allowResumeAfterCancellation: false,
    },

    validation: {
      strategy: ExecutionValidationStrategy.STRICT,

      validateBeforeExecution: true,

      validateInput: true,

      validateOutput: true,

      validateSteps: true,

      validateChildWorkflows: true,

      validateCompensation: true,

      detectInfiniteLoops: true,

      detectUnreachableSteps: true,

      rejectUnknownStepTypes: true,

      rejectUnknownProperties: true,

      treatWarningsAsErrors: false,
    },

    performance: {
      collectMetrics: true,

      collectStatistics: true,

      captureExecutionHistory: true,

      captureStepHistory: true,

      measureWorkflowDuration: true,

      measureStepDuration: true,

      measureQueueWaitTime: true,

      measureRetryPerformance: true,

      maximumInMemoryHistoryEntries: 10_000,

      persistPerformanceData: true,

      performanceFlushIntervalMs: 30_000,
    },

    diagnostics: {
      verbose: false,

      traceExecution: true,

      traceSteps: false,

      traceEvents: false,

      traceRetries: true,

      traceCompensation: true,

      traceCancellation: true,

      traceChildWorkflows: true,

      includeWorkflowInput: false,

      includeWorkflowOutput: false,

      includeStepData: false,

      redactSensitiveData: true,

      sensitivePropertyNames: [
        "password",
        "passcode",
        "secret",
        "token",
        "accessToken",
        "refreshToken",
        "authorization",
        "apiKey",
        "privateKey",
        "socialSecurityNumber",
        "ssn",
        "bankAccount",
        "routingNumber",
        "creditCard",
      ],
    },

    security: {
      duplicateProtection: DuplicateProtectionStrategy.PERSISTENCE,

      duplicateProtectionWindowMs: 24 * 60 * 60 * 1000,

      validateWorkflowChecksum: true,

      requireWorkflowRegistration: true,

      authorizationMode: ExecutionAuthorizationMode.REQUIRED,

      preventConcurrentExecution: true,

      requireIdempotencyKey: true,

      validateWorkflowOwnership: true,

      enforceDefinitionImmutability: true,

      requireDistributedLock: false,

      lockAcquisitionTimeoutMs: 30_000,

      auditRejectedExecutions: true,
    },
  });

/**
 * Development execution preset.
 *
 * This preset prioritizes visibility, local debugging, and rapid feedback.
 * Persistent security controls remain enabled where they do not interfere
 * with ordinary development.
 */
export const DEVELOPMENT_EXECUTION_CONFIGURATION: Immutable<ExecutionConfiguration> =
  freezeConfigurationValue({
    ...DEFAULT_EXECUTION_CONFIGURATION,

    id: `${DEFAULT_EXECUTION_CONFIGURATION_ID}-development`,

    name: `${DEFAULT_EXECUTION_CONFIGURATION_NAME} — Development`,

    environment: "development",

    metadata: {
      ...DEFAULT_EXECUTION_CONFIGURATION.metadata,

      description:
        "Development preset for the IBOS Enterprise Workflow Runtime execution system.",

      tags: [
        "ibos",
        "workflow-runtime",
        "execution",
        "development",
      ],
    },

    behavior: {
      validateOnCreate: true,
      freezeAfterCreate: true,
      immutable: true,
      throwOnValidationError: true,
    },

    execution: {
      ...DEFAULT_EXECUTION_CONFIGURATION.execution,

      mode: ExecutionMode.SEQUENTIAL,

      maximumWorkflowDurationMs: 60 * 60 * 1000,

      maximumStepDurationMs: 10 * 60 * 1000,

      maximumWorkflowDepth: 15,

      maximumChildWorkflows: 50,

      maximumWorkflowSize: 500,

      continueOnNonCriticalFailure: false,
    },

    concurrency: {
      ...DEFAULT_EXECUTION_CONFIGURATION.concurrency,

      workerCount: 2,

      maximumConcurrentWorkflows: 10,

      maximumConcurrentSteps: 25,

      maximumParallelBranches: 10,

      queueCapacity: 1_000,

      batchSize: 10,

      queueOverflowStrategy: ExecutionQueueOverflowStrategy.WAIT,

      queueWaitTimeoutMs: 10_000,
    },

    retry: {
      ...DEFAULT_EXECUTION_CONFIGURATION.retry,

      enabled: true,

      strategy: RetryStrategy.FIXED_DELAY,

      maximumRetries: 2,

      initialDelayMs: 500,

      maximumDelayMs: 5_000,

      multiplier: 1,

      linearIncrementMs: 500,

      jitterFactor: 0,
    },

    compensation: {
      ...DEFAULT_EXECUTION_CONFIGURATION.compensation,

      compensationTimeoutMs: 5 * 60 * 1000,

      maximumCompensationRetries: 1,

      compensationRetryDelayMs: 1_000,
    },

    cancellation: {
      ...DEFAULT_EXECUTION_CONFIGURATION.cancellation,

      gracefulTimeoutMs: 10_000,

      forceTimeoutMs: 20_000,

      allowResumeAfterCancellation: true,
    },

    validation: {
      ...DEFAULT_EXECUTION_CONFIGURATION.validation,

      strategy: ExecutionValidationStrategy.STANDARD,

      rejectUnknownProperties: false,

      treatWarningsAsErrors: false,
    },

    performance: {
      ...DEFAULT_EXECUTION_CONFIGURATION.performance,

      maximumInMemoryHistoryEntries: 2_000,

      persistPerformanceData: false,

      performanceFlushIntervalMs: 10_000,
    },

    diagnostics: {
      ...DEFAULT_EXECUTION_CONFIGURATION.diagnostics,

      verbose: true,

      traceExecution: true,

      traceSteps: true,

      traceEvents: true,

      traceRetries: true,

      traceCompensation: true,

      traceCancellation: true,

      traceChildWorkflows: true,

      includeWorkflowInput: true,

      includeWorkflowOutput: true,

      includeStepData: true,

      redactSensitiveData: true,
    },

    security: {
      ...DEFAULT_EXECUTION_CONFIGURATION.security,

      duplicateProtection: DuplicateProtectionStrategy.MEMORY,

      duplicateProtectionWindowMs: 60 * 60 * 1000,

      validateWorkflowChecksum: false,

      authorizationMode: ExecutionAuthorizationMode.OPTIONAL,

      requireIdempotencyKey: false,

      validateWorkflowOwnership: false,

      requireDistributedLock: false,

      lockAcquisitionTimeoutMs: 5_000,
    },
  });

/**
 * Testing execution preset.
 *
 * This preset favors deterministic, fast, isolated executions suitable for
 * automated unit, integration, and runtime behavior tests.
 */
export const TESTING_EXECUTION_CONFIGURATION: Immutable<ExecutionConfiguration> =
  freezeConfigurationValue({
    ...DEFAULT_EXECUTION_CONFIGURATION,

    id: `${DEFAULT_EXECUTION_CONFIGURATION_ID}-testing`,

    name: `${DEFAULT_EXECUTION_CONFIGURATION_NAME} — Testing`,

    environment: "testing",

    metadata: {
      ...DEFAULT_EXECUTION_CONFIGURATION.metadata,

      description:
        "Testing preset for deterministic IBOS Workflow Runtime execution.",

      tags: [
        "ibos",
        "workflow-runtime",
        "execution",
        "testing",
      ],
    },

    behavior: {
      validateOnCreate: true,
      freezeAfterCreate: true,
      immutable: true,
      throwOnValidationError: true,
    },

    execution: {
      ...DEFAULT_EXECUTION_CONFIGURATION.execution,

      mode: ExecutionMode.SEQUENTIAL,

      maximumWorkflowDurationMs: 5 * 60 * 1000,

      maximumStepDurationMs: 60_000,

      maximumWorkflowDepth: 10,

      maximumChildWorkflows: 25,

      maximumWorkflowSize: 250,

      retainExecutionResult: true,
    },

    concurrency: {
      ...DEFAULT_EXECUTION_CONFIGURATION.concurrency,

      workerCount: 1,

      maximumConcurrentWorkflows: 5,

      maximumConcurrentSteps: 10,

      maximumParallelBranches: 5,

      queueCapacity: 250,

      batchSize: 5,

      queueOverflowStrategy: ExecutionQueueOverflowStrategy.REJECT,

      queueWaitTimeoutMs: 1_000,
    },

    retry: {
      ...DEFAULT_EXECUTION_CONFIGURATION.retry,

      enabled: true,

      strategy: RetryStrategy.IMMEDIATE,

      maximumRetries: 1,

      initialDelayMs: 0,

      maximumDelayMs: 0,

      multiplier: 1,

      linearIncrementMs: 0,

      jitterFactor: 0,

      persistRetryState: false,
    },

    compensation: {
      ...DEFAULT_EXECUTION_CONFIGURATION.compensation,

      maximumCompensationOperations: 250,

      compensationTimeoutMs: 60_000,

      maximumCompensationRetries: 1,

      compensationRetryDelayMs: 0,

      persistCompensationState: false,
    },

    cancellation: {
      ...DEFAULT_EXECUTION_CONFIGURATION.cancellation,

      strategy: CancellationStrategy.IMMEDIATE,

      gracefulTimeoutMs: 1_000,

      forceTimeoutMs: 2_000,

      persistCancellationState: false,

      allowResumeAfterCancellation: false,
    },

    validation: {
      ...DEFAULT_EXECUTION_CONFIGURATION.validation,

      strategy: ExecutionValidationStrategy.STRICT,

      treatWarningsAsErrors: true,
    },

    performance: {
      ...DEFAULT_EXECUTION_CONFIGURATION.performance,

      collectMetrics: true,

      collectStatistics: true,

      maximumInMemoryHistoryEntries: 500,

      persistPerformanceData: false,

      performanceFlushIntervalMs: 1_000,
    },

    diagnostics: {
      ...DEFAULT_EXECUTION_CONFIGURATION.diagnostics,

      verbose: true,

      traceExecution: true,

      traceSteps: true,

      traceEvents: true,

      traceRetries: true,

      traceCompensation: true,

      traceCancellation: true,

      traceChildWorkflows: true,

      includeWorkflowInput: true,

      includeWorkflowOutput: true,

      includeStepData: true,

      redactSensitiveData: true,
    },

    security: {
      ...DEFAULT_EXECUTION_CONFIGURATION.security,

      duplicateProtection: DuplicateProtectionStrategy.MEMORY,

      duplicateProtectionWindowMs: 5 * 60 * 1000,

      validateWorkflowChecksum: false,

      authorizationMode: ExecutionAuthorizationMode.NONE,

      requireIdempotencyKey: false,

      validateWorkflowOwnership: false,

      requireDistributedLock: false,

      lockAcquisitionTimeoutMs: 1_000,

      auditRejectedExecutions: true,
    },
  });

/**
 * Staging execution preset.
 *
 * This preset closely mirrors production behavior while allowing additional
 * diagnostic visibility during release verification.
 */
export const STAGING_EXECUTION_CONFIGURATION: Immutable<ExecutionConfiguration> =
  freezeConfigurationValue({
    ...DEFAULT_EXECUTION_CONFIGURATION,

    id: `${DEFAULT_EXECUTION_CONFIGURATION_ID}-staging`,

    name: `${DEFAULT_EXECUTION_CONFIGURATION_NAME} — Staging`,

    environment: "staging",

    metadata: {
      ...DEFAULT_EXECUTION_CONFIGURATION.metadata,

      description:
        "Staging preset for production-like IBOS Workflow Runtime verification.",

      tags: [
        "ibos",
        "workflow-runtime",
        "execution",
        "staging",
      ],
    },

    behavior: {
      validateOnCreate: true,
      freezeAfterCreate: true,
      immutable: true,
      throwOnValidationError: true,
    },

    execution: {
      ...DEFAULT_EXECUTION_CONFIGURATION.execution,

      mode: ExecutionMode.PARALLEL,

      maximumWorkflowDurationMs: 12 * 60 * 60 * 1000,

      maximumStepDurationMs: 20 * 60 * 1000,
    },

    concurrency: {
      ...DEFAULT_EXECUTION_CONFIGURATION.concurrency,

      workerCount: 4,

      maximumConcurrentWorkflows: 20,

      maximumConcurrentSteps: 75,

      maximumParallelBranches: 15,

      queueCapacity: 5_000,

      batchSize: 20,
    },

    retry: {
      ...DEFAULT_EXECUTION_CONFIGURATION.retry,

      maximumRetries: 3,

      initialDelayMs: 1_000,

      maximumDelayMs: 30_000,

      multiplier: 2,

      jitterFactor: 0.15,
    },

    performance: {
      ...DEFAULT_EXECUTION_CONFIGURATION.performance,

      maximumInMemoryHistoryEntries: 5_000,

      persistPerformanceData: true,

      performanceFlushIntervalMs: 15_000,
    },

    diagnostics: {
      ...DEFAULT_EXECUTION_CONFIGURATION.diagnostics,

      verbose: true,

      traceExecution: true,

      traceSteps: true,

      traceEvents: true,

      traceRetries: true,

      traceCompensation: true,

      traceCancellation: true,

      traceChildWorkflows: true,

      includeWorkflowInput: false,

      includeWorkflowOutput: false,

      includeStepData: false,

      redactSensitiveData: true,
    },

    security: {
      ...DEFAULT_EXECUTION_CONFIGURATION.security,

      duplicateProtection: DuplicateProtectionStrategy.PERSISTENCE,

      validateWorkflowChecksum: true,

      authorizationMode: ExecutionAuthorizationMode.REQUIRED,

      requireIdempotencyKey: true,

      validateWorkflowOwnership: true,

      requireDistributedLock: false,

      auditRejectedExecutions: true,
    },
  });

/**
 * Production execution preset.
 *
 * This preset enables parallel enterprise execution with conservative
 * limits, persistent state protection, strict validation, compensation,
 * operational metrics, and restricted diagnostic exposure.
 */
export const PRODUCTION_EXECUTION_CONFIGURATION: Immutable<ExecutionConfiguration> =
  freezeConfigurationValue({
    ...DEFAULT_EXECUTION_CONFIGURATION,

    id: `${DEFAULT_EXECUTION_CONFIGURATION_ID}-production`,

    name: `${DEFAULT_EXECUTION_CONFIGURATION_NAME} — Production`,

    environment: "production",

    metadata: {
      ...DEFAULT_EXECUTION_CONFIGURATION.metadata,

      description:
        "Production preset for secure and resilient IBOS Workflow Runtime execution.",

      tags: [
        "ibos",
        "workflow-runtime",
        "execution",
        "enterprise",
        "production",
      ],
    },

    behavior: {
      validateOnCreate: true,
      freezeAfterCreate: true,
      immutable: true,
      throwOnValidationError: true,
    },

    execution: {
      ...DEFAULT_EXECUTION_CONFIGURATION.execution,

      mode: ExecutionMode.PARALLEL,

      maximumWorkflowDurationMs: 24 * 60 * 60 * 1000,

      maximumStepDurationMs: 30 * 60 * 1000,

      maximumWorkflowDepth: 10,

      maximumChildWorkflows: 100,

      maximumWorkflowSize: 1_000,

      continueOnNonCriticalFailure: false,

      retainExecutionResult: true,
    },

    concurrency: {
      ...DEFAULT_EXECUTION_CONFIGURATION.concurrency,

      workerCount: 8,

      maximumConcurrentWorkflows: 50,

      maximumConcurrentSteps: 200,

      maximumParallelBranches: 25,

      queueCapacity: 25_000,

      batchSize: 50,

      queueOverflowStrategy: ExecutionQueueOverflowStrategy.WAIT,

      queueWaitTimeoutMs: 60_000,

      isolateWorkflowConcurrency: true,
    },

    retry: {
      ...DEFAULT_EXECUTION_CONFIGURATION.retry,

      enabled: true,

      strategy: RetryStrategy.EXPONENTIAL,

      maximumRetries: 5,

      initialDelayMs: 1_000,

      maximumDelayMs: 5 * 60 * 1000,

      multiplier: 2,

      linearIncrementMs: 1_000,

      jitterFactor: 0.25,

      persistRetryState: true,
    },

    compensation: {
      ...DEFAULT_EXECUTION_CONFIGURATION.compensation,

      enabled: true,

      strategy: CompensationStrategy.REVERSE_ORDER,

      continueOnFailure: true,

      compensationTimeoutMs: 15 * 60 * 1000,

      maximumCompensationRetries: 5,

      compensationRetryDelayMs: 10_000,

      persistCompensationState: true,

      compensateAutomatically: true,

      compensateChildWorkflows: true,
    },

    cancellation: {
      ...DEFAULT_EXECUTION_CONFIGURATION.cancellation,

      strategy: CancellationStrategy.TIMEOUT,

      gracefulTimeoutMs: 60_000,

      forceTimeoutMs: 2 * 60 * 1000,

      persistCancellationState: true,

      compensateOnCancellation: true,

      allowResumeAfterCancellation: false,
    },

    validation: {
      ...DEFAULT_EXECUTION_CONFIGURATION.validation,

      strategy: ExecutionValidationStrategy.STRICT,

      validateBeforeExecution: true,

      validateInput: true,

      validateOutput: true,

      validateSteps: true,

      validateChildWorkflows: true,

      validateCompensation: true,

      detectInfiniteLoops: true,

      detectUnreachableSteps: true,

      rejectUnknownStepTypes: true,

      rejectUnknownProperties: true,

      treatWarningsAsErrors: false,
    },

    performance: {
      ...DEFAULT_EXECUTION_CONFIGURATION.performance,

      collectMetrics: true,

      collectStatistics: true,

      captureExecutionHistory: true,

      captureStepHistory: true,

      maximumInMemoryHistoryEntries: 25_000,

      persistPerformanceData: true,

      performanceFlushIntervalMs: 30_000,
    },

    diagnostics: {
      ...DEFAULT_EXECUTION_CONFIGURATION.diagnostics,

      verbose: false,

      traceExecution: true,

      traceSteps: false,

      traceEvents: false,

      traceRetries: true,

      traceCompensation: true,

      traceCancellation: true,

      traceChildWorkflows: true,

      includeWorkflowInput: false,

      includeWorkflowOutput: false,

      includeStepData: false,

      redactSensitiveData: true,
    },

    security: {
      ...DEFAULT_EXECUTION_CONFIGURATION.security,

      duplicateProtection: DuplicateProtectionStrategy.PERSISTENCE,

      duplicateProtectionWindowMs: 24 * 60 * 60 * 1000,

      validateWorkflowChecksum: true,

      requireWorkflowRegistration: true,

      authorizationMode: ExecutionAuthorizationMode.REQUIRED,

      preventConcurrentExecution: true,

      requireIdempotencyKey: true,

      validateWorkflowOwnership: true,

      enforceDefinitionImmutability: true,

      requireDistributedLock: false,

      lockAcquisitionTimeoutMs: 60_000,

      auditRejectedExecutions: true,
    },
  });

/**
 * Environment-indexed execution presets.
 *
 * This collection allows the runtime configuration factory to select a
 * complete preset without using repeated conditional statements.
 */
export const EXECUTION_CONFIGURATION_PRESETS: Readonly<{
  development: Immutable<ExecutionConfiguration>;
  testing: Immutable<ExecutionConfiguration>;
  staging: Immutable<ExecutionConfiguration>;
  production: Immutable<ExecutionConfiguration>;
}> = Object.freeze({
  development: DEVELOPMENT_EXECUTION_CONFIGURATION,
  testing: TESTING_EXECUTION_CONFIGURATION,
  staging: STAGING_EXECUTION_CONFIGURATION,
  production: PRODUCTION_EXECUTION_CONFIGURATION,
});
/**
 * Validates the complete execution configuration.
 *
 * Validation is divided into:
 *
 * 1. Base configuration validation
 * 2. Section-level structural validation
 * 3. Cross-section enterprise rule validation
 */
export function validateExecutionConfiguration(
  configuration: ExecutionConfiguration,
): ConfigurationValidationResult {
  const issues: ConfigurationValidationIssue[] = [];

  issues.push(...validateBaseConfiguration(configuration).issues);

  issues.push(...validateExecutionSettings(configuration.execution));
  issues.push(...validateExecutionConcurrencySettings(configuration.concurrency));
  issues.push(...validateExecutionRetrySettings(configuration.retry));
  issues.push(
    ...validateExecutionCompensationSettings(configuration.compensation),
  );
  issues.push(
    ...validateExecutionCancellationSettings(configuration.cancellation),
  );
  issues.push(
    ...validateExecutionValidationSettings(configuration.validation),
  );
  issues.push(
    ...validateExecutionPerformanceSettings(configuration.performance),
  );
  issues.push(
    ...validateExecutionDiagnosticsSettings(configuration.diagnostics),
  );
  issues.push(...validateExecutionSecuritySettings(configuration.security));

  issues.push(...validateExecutionCrossSectionRules(configuration));

  return createConfigurationValidationResult(issues);
}

/**
 * Validates core workflow execution settings.
 */
export function validateExecutionSettings(
  settings: ExecutionSettings,
): readonly ConfigurationValidationIssue[] {
  const issues: ConfigurationValidationIssue[] = [];

  validateEnumValue(
    issues,
    "execution.mode",
    settings.mode,
    EXECUTION_MODES,
    "EXECUTION_MODE_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "execution.maximumWorkflowDurationMs",
    settings.maximumWorkflowDurationMs,
    "EXECUTION_WORKFLOW_DURATION_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "execution.maximumStepDurationMs",
    settings.maximumStepDurationMs,
    "EXECUTION_STEP_DURATION_INVALID",
  );

  validatePositiveInteger(
    issues,
    "execution.maximumWorkflowDepth",
    settings.maximumWorkflowDepth,
    "EXECUTION_WORKFLOW_DEPTH_INVALID",
  );

  validateNonNegativeInteger(
    issues,
    "execution.maximumChildWorkflows",
    settings.maximumChildWorkflows,
    "EXECUTION_CHILD_WORKFLOW_LIMIT_INVALID",
  );

  validatePositiveInteger(
    issues,
    "execution.maximumWorkflowSize",
    settings.maximumWorkflowSize,
    "EXECUTION_WORKFLOW_SIZE_INVALID",
  );

  if (
    !settings.allowChildWorkflows &&
    settings.maximumChildWorkflows > 0
  ) {
    issues.push(
      createValidationWarning(
        "execution.maximumChildWorkflows",
        "The child workflow limit is greater than zero even though child workflows are disabled.",
        "EXECUTION_CHILD_WORKFLOWS_DISABLED_WITH_LIMIT",
        settings.maximumChildWorkflows,
      ),
    );
  }

  if (
    !settings.allowParallelBranches &&
    (settings.mode === ExecutionMode.PARALLEL ||
      settings.mode === ExecutionMode.HYBRID)
  ) {
    issues.push(
      createValidationError(
        "execution.allowParallelBranches",
        `Parallel branches must be enabled when execution mode is ${settings.mode}.`,
        "EXECUTION_PARALLEL_BRANCHES_REQUIRED",
        settings.allowParallelBranches,
      ),
    );
  }

  return issues;
}

/**
 * Validates concurrency and queue settings.
 */
export function validateExecutionConcurrencySettings(
  settings: ExecutionConcurrencySettings,
): readonly ConfigurationValidationIssue[] {
  const issues: ConfigurationValidationIssue[] = [];

  validatePositiveInteger(
    issues,
    "concurrency.workerCount",
    settings.workerCount,
    "CONCURRENCY_WORKER_COUNT_INVALID",
  );

  validatePositiveInteger(
    issues,
    "concurrency.maximumConcurrentWorkflows",
    settings.maximumConcurrentWorkflows,
    "CONCURRENCY_WORKFLOW_LIMIT_INVALID",
  );

  validatePositiveInteger(
    issues,
    "concurrency.maximumConcurrentSteps",
    settings.maximumConcurrentSteps,
    "CONCURRENCY_STEP_LIMIT_INVALID",
  );

  validatePositiveInteger(
    issues,
    "concurrency.maximumParallelBranches",
    settings.maximumParallelBranches,
    "CONCURRENCY_PARALLEL_BRANCH_LIMIT_INVALID",
  );

  validatePositiveInteger(
    issues,
    "concurrency.queueCapacity",
    settings.queueCapacity,
    "CONCURRENCY_QUEUE_CAPACITY_INVALID",
  );

  validatePositiveInteger(
    issues,
    "concurrency.batchSize",
    settings.batchSize,
    "CONCURRENCY_BATCH_SIZE_INVALID",
  );

  validateEnumValue(
    issues,
    "concurrency.queueOverflowStrategy",
    settings.queueOverflowStrategy,
    EXECUTION_QUEUE_OVERFLOW_STRATEGIES,
    "CONCURRENCY_QUEUE_OVERFLOW_STRATEGY_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "concurrency.queueWaitTimeoutMs",
    settings.queueWaitTimeoutMs,
    "CONCURRENCY_QUEUE_WAIT_TIMEOUT_INVALID",
  );

  if (settings.batchSize > settings.queueCapacity) {
    issues.push(
      createValidationError(
        "concurrency.batchSize",
        "Execution batch size must not exceed queue capacity.",
        "CONCURRENCY_BATCH_EXCEEDS_QUEUE",
        settings.batchSize,
      ),
    );
  }

  if (
    settings.maximumParallelBranches >
    settings.maximumConcurrentSteps
  ) {
    issues.push(
      createValidationError(
        "concurrency.maximumParallelBranches",
        "Maximum parallel branches must not exceed the maximum concurrent step limit.",
        "CONCURRENCY_BRANCHES_EXCEED_STEPS",
        settings.maximumParallelBranches,
      ),
    );
  }

  if (
    settings.queueOverflowStrategy ===
      ExecutionQueueOverflowStrategy.WAIT &&
    settings.queueWaitTimeoutMs === 0
  ) {
    issues.push(
      createValidationWarning(
        "concurrency.queueWaitTimeoutMs",
        "A zero queue wait timeout may cause execution requests to wait indefinitely.",
        "CONCURRENCY_UNBOUNDED_QUEUE_WAIT",
        settings.queueWaitTimeoutMs,
      ),
    );
  }

  if (
    settings.queueOverflowStrategy !==
      ExecutionQueueOverflowStrategy.WAIT &&
    settings.queueWaitTimeoutMs > 0
  ) {
    issues.push(
      createValidationInformation(
        "concurrency.queueWaitTimeoutMs",
        "Queue wait timeout is ignored unless queue overflow strategy is set to WAIT.",
        "CONCURRENCY_QUEUE_WAIT_TIMEOUT_UNUSED",
        settings.queueWaitTimeoutMs,
      ),
    );
  }

  return issues;
}

/**
 * Validates execution retry settings.
 */
export function validateExecutionRetrySettings(
  settings: ExecutionRetrySettings,
): readonly ConfigurationValidationIssue[] {
  const issues: ConfigurationValidationIssue[] = [];

  validateEnumValue(
    issues,
    "retry.strategy",
    settings.strategy,
    RETRY_STRATEGIES,
    "RETRY_STRATEGY_INVALID",
  );

  validateNonNegativeInteger(
    issues,
    "retry.maximumRetries",
    settings.maximumRetries,
    "RETRY_MAXIMUM_RETRIES_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "retry.initialDelayMs",
    settings.initialDelayMs,
    "RETRY_INITIAL_DELAY_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "retry.maximumDelayMs",
    settings.maximumDelayMs,
    "RETRY_MAXIMUM_DELAY_INVALID",
  );

  validateFiniteNumber(
    issues,
    "retry.multiplier",
    settings.multiplier,
    "RETRY_MULTIPLIER_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "retry.linearIncrementMs",
    settings.linearIncrementMs,
    "RETRY_LINEAR_INCREMENT_INVALID",
  );

  validatePercentage(
    issues,
    "retry.jitterFactor",
    settings.jitterFactor,
    "RETRY_JITTER_FACTOR_INVALID",
  );

  validateStringCollection(
    issues,
    "retry.retryableErrors",
    settings.retryableErrors,
    "RETRY_RETRYABLE_ERRORS_INVALID",
  );

  validateStringCollection(
    issues,
    "retry.nonRetryableErrors",
    settings.nonRetryableErrors,
    "RETRY_NON_RETRYABLE_ERRORS_INVALID",
  );

  if (!settings.enabled && settings.strategy !== RetryStrategy.NONE) {
    issues.push(
      createValidationWarning(
        "retry.strategy",
        "Retry processing is disabled, but the retry strategy is not NONE.",
        "RETRY_DISABLED_WITH_ACTIVE_STRATEGY",
        settings.strategy,
      ),
    );
  }

  if (settings.enabled && settings.strategy === RetryStrategy.NONE) {
    issues.push(
      createValidationError(
        "retry.strategy",
        "Retry processing cannot be enabled while the retry strategy is NONE.",
        "RETRY_ENABLED_WITH_NONE_STRATEGY",
        settings.strategy,
      ),
    );
  }

  if (settings.enabled && settings.maximumRetries === 0) {
    issues.push(
      createValidationWarning(
        "retry.maximumRetries",
        "Retry processing is enabled, but the maximum retry count is zero.",
        "RETRY_ENABLED_WITH_ZERO_ATTEMPTS",
        settings.maximumRetries,
      ),
    );
  }

  if (
    settings.maximumDelayMs > 0 &&
    settings.initialDelayMs > settings.maximumDelayMs
  ) {
    issues.push(
      createValidationError(
        "retry.initialDelayMs",
        "Initial retry delay must not exceed the maximum retry delay.",
        "RETRY_INITIAL_DELAY_EXCEEDS_MAXIMUM",
        settings.initialDelayMs,
      ),
    );
  }

  if (
    settings.strategy === RetryStrategy.EXPONENTIAL &&
    settings.multiplier <= 1
  ) {
    issues.push(
      createValidationError(
        "retry.multiplier",
        "Exponential retry strategy requires a multiplier greater than one.",
        "RETRY_EXPONENTIAL_MULTIPLIER_INVALID",
        settings.multiplier,
      ),
    );
  }

  if (
    settings.strategy === RetryStrategy.LINEAR &&
    settings.linearIncrementMs <= 0
  ) {
    issues.push(
      createValidationError(
        "retry.linearIncrementMs",
        "Linear retry strategy requires a positive linear increment.",
        "RETRY_LINEAR_INCREMENT_REQUIRED",
        settings.linearIncrementMs,
      ),
    );
  }

  if (
    settings.strategy === RetryStrategy.IMMEDIATE &&
    (settings.initialDelayMs > 0 || settings.maximumDelayMs > 0)
  ) {
    issues.push(
      createValidationInformation(
        "retry.initialDelayMs",
        "Retry delay values are ignored when the retry strategy is IMMEDIATE.",
        "RETRY_IMMEDIATE_DELAY_UNUSED",
        settings.initialDelayMs,
      ),
    );
  }

  const conflictingErrors = settings.retryableErrors.filter((errorName) =>
    settings.nonRetryableErrors.includes(errorName),
  );

  if (conflictingErrors.length > 0) {
    issues.push(
      createValidationError(
        "retry.retryableErrors",
        "An error cannot be included in both retryableErrors and nonRetryableErrors.",
        "RETRY_ERROR_CLASSIFICATION_CONFLICT",
        conflictingErrors,
      ),
    );
  }

  return issues;
}

/**
 * Validates compensation and rollback settings.
 */
export function validateExecutionCompensationSettings(
  settings: ExecutionCompensationSettings,
): readonly ConfigurationValidationIssue[] {
  const issues: ConfigurationValidationIssue[] = [];

  validateEnumValue(
    issues,
    "compensation.strategy",
    settings.strategy,
    COMPENSATION_STRATEGIES,
    "COMPENSATION_STRATEGY_INVALID",
  );

  validatePositiveInteger(
    issues,
    "compensation.maximumCompensationOperations",
    settings.maximumCompensationOperations,
    "COMPENSATION_OPERATION_LIMIT_INVALID",
  );

  validatePositiveDuration(
    issues,
    "compensation.compensationTimeoutMs",
    settings.compensationTimeoutMs,
    "COMPENSATION_TIMEOUT_INVALID",
  );

  validateNonNegativeInteger(
    issues,
    "compensation.maximumCompensationRetries",
    settings.maximumCompensationRetries,
    "COMPENSATION_RETRY_LIMIT_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "compensation.compensationRetryDelayMs",
    settings.compensationRetryDelayMs,
    "COMPENSATION_RETRY_DELAY_INVALID",
  );

  if (
    !settings.enabled &&
    settings.strategy !== CompensationStrategy.DISABLED
  ) {
    issues.push(
      createValidationWarning(
        "compensation.strategy",
        "Compensation is disabled, but the compensation strategy is active.",
        "COMPENSATION_DISABLED_WITH_ACTIVE_STRATEGY",
        settings.strategy,
      ),
    );
  }

  if (
    settings.enabled &&
    settings.strategy === CompensationStrategy.DISABLED
  ) {
    issues.push(
      createValidationError(
        "compensation.strategy",
        "Compensation cannot be enabled while its strategy is DISABLED.",
        "COMPENSATION_ENABLED_WITH_DISABLED_STRATEGY",
        settings.strategy,
      ),
    );
  }

  if (
    settings.retryFailedCompensation &&
    settings.maximumCompensationRetries === 0
  ) {
    issues.push(
      createValidationWarning(
        "compensation.maximumCompensationRetries",
        "Compensation retries are enabled, but the maximum retry count is zero.",
        "COMPENSATION_RETRY_ENABLED_WITH_ZERO_ATTEMPTS",
        settings.maximumCompensationRetries,
      ),
    );
  }

  if (
    !settings.retryFailedCompensation &&
    settings.maximumCompensationRetries > 0
  ) {
    issues.push(
      createValidationInformation(
        "compensation.maximumCompensationRetries",
        "The compensation retry limit is ignored because failed compensation retries are disabled.",
        "COMPENSATION_RETRY_LIMIT_UNUSED",
        settings.maximumCompensationRetries,
      ),
    );
  }

  if (!settings.enabled && settings.compensateAutomatically) {
    issues.push(
      createValidationError(
        "compensation.compensateAutomatically",
        "Automatic compensation cannot be enabled when compensation processing is disabled.",
        "COMPENSATION_AUTOMATIC_WHILE_DISABLED",
        settings.compensateAutomatically,
      ),
    );
  }

  return issues;
}

/**
 * Validates cancellation settings.
 */
export function validateExecutionCancellationSettings(
  settings: ExecutionCancellationSettings,
): readonly ConfigurationValidationIssue[] {
  const issues: ConfigurationValidationIssue[] = [];

  validateEnumValue(
    issues,
    "cancellation.strategy",
    settings.strategy,
    CANCELLATION_STRATEGIES,
    "CANCELLATION_STRATEGY_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "cancellation.gracefulTimeoutMs",
    settings.gracefulTimeoutMs,
    "CANCELLATION_GRACEFUL_TIMEOUT_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "cancellation.forceTimeoutMs",
    settings.forceTimeoutMs,
    "CANCELLATION_FORCE_TIMEOUT_INVALID",
  );

  if (
    settings.forceTimeoutMs > 0 &&
    settings.gracefulTimeoutMs > settings.forceTimeoutMs
  ) {
    issues.push(
      createValidationError(
        "cancellation.gracefulTimeoutMs",
        "Graceful cancellation timeout must not exceed the force cancellation timeout.",
        "CANCELLATION_GRACEFUL_EXCEEDS_FORCE",
        settings.gracefulTimeoutMs,
      ),
    );
  }

  if (
    settings.strategy === CancellationStrategy.TIMEOUT &&
    settings.forceTimeoutMs === 0
  ) {
    issues.push(
      createValidationError(
        "cancellation.forceTimeoutMs",
        "TIMEOUT cancellation strategy requires a positive force timeout.",
        "CANCELLATION_TIMEOUT_FORCE_VALUE_REQUIRED",
        settings.forceTimeoutMs,
      ),
    );
  }

  if (
    settings.strategy === CancellationStrategy.GRACEFUL &&
    settings.gracefulTimeoutMs === 0
  ) {
    issues.push(
      createValidationWarning(
        "cancellation.gracefulTimeoutMs",
        "Graceful cancellation has no timeout and may wait indefinitely.",
        "CANCELLATION_GRACEFUL_UNBOUNDED",
        settings.gracefulTimeoutMs,
      ),
    );
  }

  if (
    settings.strategy === CancellationStrategy.FORCE &&
    settings.allowResumeAfterCancellation
  ) {
    issues.push(
      createValidationWarning(
        "cancellation.allowResumeAfterCancellation",
        "Resuming a forcefully cancelled workflow may be unsafe.",
        "CANCELLATION_FORCE_RESUME_RISK",
        settings.allowResumeAfterCancellation,
      ),
    );
  }

  return issues;
}

/**
 * Validates workflow-definition validation settings.
 */
export function validateExecutionValidationSettings(
  settings: ExecutionValidationSettings,
): readonly ConfigurationValidationIssue[] {
  const issues: ConfigurationValidationIssue[] = [];

  validateEnumValue(
    issues,
    "validation.strategy",
    settings.strategy,
    EXECUTION_VALIDATION_STRATEGIES,
    "VALIDATION_STRATEGY_INVALID",
  );

  if (
    settings.strategy === ExecutionValidationStrategy.STRICT &&
    !settings.validateBeforeExecution
  ) {
    issues.push(
      createValidationError(
        "validation.validateBeforeExecution",
        "Strict validation requires workflow validation before execution.",
        "VALIDATION_STRICT_PREVALIDATION_REQUIRED",
        settings.validateBeforeExecution,
      ),
    );
  }

  if (
    settings.treatWarningsAsErrors &&
    settings.strategy === ExecutionValidationStrategy.RELAXED
  ) {
    issues.push(
      createValidationWarning(
        "validation.treatWarningsAsErrors",
        "Treating warnings as errors conflicts with relaxed validation behavior.",
        "VALIDATION_RELAXED_WARNING_CONFLICT",
        settings.treatWarningsAsErrors,
      ),
    );
  }

  if (
    settings.rejectUnknownStepTypes &&
    !settings.validateSteps
  ) {
    issues.push(
      createValidationWarning(
        "validation.rejectUnknownStepTypes",
        "Unknown step types cannot be reliably rejected when step validation is disabled.",
        "VALIDATION_UNKNOWN_STEP_CHECK_INACTIVE",
        settings.rejectUnknownStepTypes,
      ),
    );
  }

  if (
    settings.validateCompensation &&
    !settings.validateBeforeExecution
  ) {
    issues.push(
      createValidationInformation(
        "validation.validateCompensation",
        "Compensation validation may be deferred because pre-execution validation is disabled.",
        "VALIDATION_COMPENSATION_DEFERRED",
        settings.validateCompensation,
      ),
    );
  }

  return issues;
}

/**
 * Validates performance and execution-history settings.
 */
export function validateExecutionPerformanceSettings(
  settings: ExecutionPerformanceSettings,
): readonly ConfigurationValidationIssue[] {
  const issues: ConfigurationValidationIssue[] = [];

  validateNonNegativeInteger(
    issues,
    "performance.maximumInMemoryHistoryEntries",
    settings.maximumInMemoryHistoryEntries,
    "PERFORMANCE_HISTORY_LIMIT_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "performance.performanceFlushIntervalMs",
    settings.performanceFlushIntervalMs,
    "PERFORMANCE_FLUSH_INTERVAL_INVALID",
  );

  if (
    settings.persistPerformanceData &&
    settings.performanceFlushIntervalMs <= 0
  ) {
    issues.push(
      createValidationError(
        "performance.performanceFlushIntervalMs",
        "Persisted performance data requires a positive flush interval.",
        "PERFORMANCE_PERSISTENCE_FLUSH_REQUIRED",
        settings.performanceFlushIntervalMs,
      ),
    );
  }

  if (
    !settings.captureExecutionHistory &&
    settings.maximumInMemoryHistoryEntries > 0
  ) {
    issues.push(
      createValidationInformation(
        "performance.maximumInMemoryHistoryEntries",
        "The in-memory history limit is unused because execution history capture is disabled.",
        "PERFORMANCE_HISTORY_LIMIT_UNUSED",
        settings.maximumInMemoryHistoryEntries,
      ),
    );
  }

  if (
    !settings.collectMetrics &&
    !settings.collectStatistics &&
    !settings.captureExecutionHistory &&
    !settings.captureStepHistory
  ) {
    issues.push(
      createValidationWarning(
        "performance",
        "All major performance and history collection features are disabled.",
        "PERFORMANCE_OBSERVABILITY_DISABLED",
      ),
    );
  }

  if (
    settings.captureStepHistory &&
    !settings.captureExecutionHistory
  ) {
    issues.push(
      createValidationWarning(
        "performance.captureStepHistory",
        "Step history is enabled while workflow execution history is disabled.",
        "PERFORMANCE_STEP_HISTORY_WITHOUT_EXECUTION_HISTORY",
        settings.captureStepHistory,
      ),
    );
  }

  return issues;
}

/**
 * Validates diagnostic tracing settings.
 */
export function validateExecutionDiagnosticsSettings(
  settings: ExecutionDiagnosticsSettings,
): readonly ConfigurationValidationIssue[] {
  const issues: ConfigurationValidationIssue[] = [];

  validateStringCollection(
    issues,
    "diagnostics.sensitivePropertyNames",
    settings.sensitivePropertyNames,
    "DIAGNOSTICS_SENSITIVE_PROPERTIES_INVALID",
  );

  if (
    (settings.includeWorkflowInput ||
      settings.includeWorkflowOutput ||
      settings.includeStepData) &&
    !settings.redactSensitiveData
  ) {
    issues.push(
      createValidationWarning(
        "diagnostics.redactSensitiveData",
        "Diagnostic payload data is enabled without sensitive-data redaction.",
        "DIAGNOSTICS_SENSITIVE_DATA_EXPOSURE",
        settings.redactSensitiveData,
      ),
    );
  }

  if (
    settings.redactSensitiveData &&
    settings.sensitivePropertyNames.length === 0
  ) {
    issues.push(
      createValidationWarning(
        "diagnostics.sensitivePropertyNames",
        "Sensitive-data redaction is enabled, but no sensitive property names are configured.",
        "DIAGNOSTICS_REDACTION_LIST_EMPTY",
        settings.sensitivePropertyNames,
      ),
    );
  }

  if (
    !settings.verbose &&
    settings.traceSteps &&
    settings.includeStepData
  ) {
    issues.push(
      createValidationInformation(
        "diagnostics.verbose",
        "Detailed step data is enabled even though verbose diagnostics are disabled.",
        "DIAGNOSTICS_STEP_DATA_WITHOUT_VERBOSE",
        settings.verbose,
      ),
    );
  }

  return issues;
}

/**
 * Validates execution security settings.
 */
export function validateExecutionSecuritySettings(
  settings: ExecutionSecuritySettings,
): readonly ConfigurationValidationIssue[] {
  const issues: ConfigurationValidationIssue[] = [];

  validateEnumValue(
    issues,
    "security.duplicateProtection",
    settings.duplicateProtection,
    DUPLICATE_PROTECTION_STRATEGIES,
    "SECURITY_DUPLICATE_PROTECTION_INVALID",
  );

  validateEnumValue(
    issues,
    "security.authorizationMode",
    settings.authorizationMode,
    EXECUTION_AUTHORIZATION_MODES,
    "SECURITY_AUTHORIZATION_MODE_INVALID",
  );

  validateNonNegativeDuration(
    issues,
    "security.duplicateProtectionWindowMs",
    settings.duplicateProtectionWindowMs,
    "SECURITY_DUPLICATE_WINDOW_INVALID",
  );

  validatePositiveDuration(
    issues,
    "security.lockAcquisitionTimeoutMs",
    settings.lockAcquisitionTimeoutMs,
    "SECURITY_LOCK_TIMEOUT_INVALID",
  );

  if (
    settings.duplicateProtection !== DuplicateProtectionStrategy.NONE &&
    settings.duplicateProtectionWindowMs <= 0
  ) {
    issues.push(
      createValidationError(
        "security.duplicateProtectionWindowMs",
        "Duplicate protection requires a positive protection window.",
        "SECURITY_DUPLICATE_WINDOW_REQUIRED",
        settings.duplicateProtectionWindowMs,
      ),
    );
  }

  if (
    settings.duplicateProtection === DuplicateProtectionStrategy.NONE &&
    settings.preventConcurrentExecution
  ) {
    issues.push(
      createValidationWarning(
        "security.preventConcurrentExecution",
        "Concurrent execution prevention may be unreliable when duplicate protection is disabled.",
        "SECURITY_CONCURRENCY_WITHOUT_DUPLICATE_PROTECTION",
        settings.preventConcurrentExecution,
      ),
    );
  }

  if (
    settings.authorizationMode === ExecutionAuthorizationMode.NONE &&
    settings.validateWorkflowOwnership
  ) {
    issues.push(
      createValidationWarning(
        "security.validateWorkflowOwnership",
        "Workflow ownership validation is enabled while execution authorization is disabled.",
        "SECURITY_OWNERSHIP_WITHOUT_AUTHORIZATION",
        settings.validateWorkflowOwnership,
      ),
    );
  }

  if (
    settings.requireDistributedLock &&
    settings.duplicateProtection !==
      DuplicateProtectionStrategy.DISTRIBUTED
  ) {
    issues.push(
      createValidationInformation(
        "security.duplicateProtection",
        "Distributed locking is required, but duplicate protection is not configured as distributed.",
        "SECURITY_DISTRIBUTED_LOCK_WITH_LOCAL_DUPLICATE_PROTECTION",
        settings.duplicateProtection,
      ),
    );
  }

  return issues;
}

/**
 * Validates enterprise rules spanning multiple configuration sections.
 */
function validateExecutionCrossSectionRules(
  configuration: ExecutionConfiguration,
): readonly ConfigurationValidationIssue[] {
  const issues: ConfigurationValidationIssue[] = [];

  const { execution, concurrency, retry, compensation, cancellation } =
    configuration;

  const { performance, diagnostics, security } = configuration;

  if (
    execution.maximumWorkflowDurationMs > 0 &&
    execution.maximumStepDurationMs >
      execution.maximumWorkflowDurationMs
  ) {
    issues.push(
      createValidationError(
        "execution.maximumStepDurationMs",
        "Maximum step duration must not exceed maximum workflow duration.",
        "EXECUTION_STEP_DURATION_EXCEEDS_WORKFLOW",
        execution.maximumStepDurationMs,
      ),
    );
  }

  if (
    execution.mode === ExecutionMode.SEQUENTIAL &&
    concurrency.maximumParallelBranches > 1
  ) {
    issues.push(
      createValidationInformation(
        "concurrency.maximumParallelBranches",
        "Parallel branch capacity is greater than one while execution mode is sequential.",
        "EXECUTION_SEQUENTIAL_PARALLEL_CAPACITY_UNUSED",
        concurrency.maximumParallelBranches,
      ),
    );
  }

  if (
    execution.mode === ExecutionMode.DISTRIBUTED ||
    execution.mode === ExecutionMode.HYBRID
  ) {
    if (!security.requireDistributedLock) {
      issues.push(
        createValidationWarning(
          "security.requireDistributedLock",
          "Distributed or hybrid execution should normally require distributed locking.",
          "EXECUTION_DISTRIBUTED_LOCK_RECOMMENDED",
          security.requireDistributedLock,
        ),
      );
    }

    if (
      security.duplicateProtection !==
      DuplicateProtectionStrategy.DISTRIBUTED
    ) {
      issues.push(
        createValidationWarning(
          "security.duplicateProtection",
          "Distributed or hybrid execution should normally use distributed duplicate protection.",
          "EXECUTION_DISTRIBUTED_DUPLICATE_PROTECTION_RECOMMENDED",
          security.duplicateProtection,
        ),
      );
    }
  }

  if (
    retry.persistRetryState &&
    security.duplicateProtection === DuplicateProtectionStrategy.MEMORY
  ) {
    issues.push(
      createValidationInformation(
        "security.duplicateProtection",
        "Retry state is persisted while duplicate protection is memory-only.",
        "EXECUTION_PERSISTED_RETRY_WITH_MEMORY_DUPLICATE_PROTECTION",
        security.duplicateProtection,
      ),
    );
  }

  if (
    compensation.compensateChildWorkflows &&
    !execution.allowChildWorkflows
  ) {
    issues.push(
      createValidationInformation(
        "compensation.compensateChildWorkflows",
        "Child workflow compensation is enabled while child workflows are disabled.",
        "EXECUTION_CHILD_COMPENSATION_UNUSED",
        compensation.compensateChildWorkflows,
      ),
    );
  }

  if (
    cancellation.compensateOnCancellation &&
    !compensation.enabled
  ) {
    issues.push(
      createValidationError(
        "cancellation.compensateOnCancellation",
        "Cancellation compensation cannot be enabled when compensation processing is disabled.",
        "EXECUTION_CANCELLATION_COMPENSATION_UNAVAILABLE",
        cancellation.compensateOnCancellation,
      ),
    );
  }

  if (
    diagnostics.traceRetries &&
    !retry.enabled
  ) {
    issues.push(
      createValidationInformation(
        "diagnostics.traceRetries",
        "Retry tracing is enabled while retry processing is disabled.",
        "EXECUTION_RETRY_TRACING_UNUSED",
        diagnostics.traceRetries,
      ),
    );
  }

  if (
    diagnostics.traceCompensation &&
    !compensation.enabled
  ) {
    issues.push(
      createValidationInformation(
        "diagnostics.traceCompensation",
        "Compensation tracing is enabled while compensation processing is disabled.",
        "EXECUTION_COMPENSATION_TRACING_UNUSED",
        diagnostics.traceCompensation,
      ),
    );
  }

  if (
    performance.captureStepHistory &&
    !execution.retainExecutionResult
  ) {
    issues.push(
      createValidationWarning(
        "execution.retainExecutionResult",
        "Step history is captured while completed execution results are not retained.",
        "EXECUTION_STEP_HISTORY_WITHOUT_RESULT_RETENTION",
        execution.retainExecutionResult,
      ),
    );
  }

  if (
    security.requireIdempotencyKey &&
    security.duplicateProtection === DuplicateProtectionStrategy.NONE
  ) {
    issues.push(
      createValidationWarning(
        "security.duplicateProtection",
        "Idempotency keys are required, but duplicate protection is disabled.",
        "EXECUTION_IDEMPOTENCY_WITHOUT_DUPLICATE_PROTECTION",
        security.duplicateProtection,
      ),
    );
  }

  if (
    configuration.environment === "production" &&
    security.authorizationMode !== ExecutionAuthorizationMode.REQUIRED
  ) {
    issues.push(
      createValidationWarning(
        "security.authorizationMode",
        "Production execution should normally require authorization.",
        "EXECUTION_PRODUCTION_AUTHORIZATION_RECOMMENDED",
        security.authorizationMode,
      ),
    );
  }

  if (
    configuration.environment === "production" &&
    diagnostics.includeStepData
  ) {
    issues.push(
      createValidationWarning(
        "diagnostics.includeStepData",
        "Including step data in production diagnostics may expose confidential information.",
        "EXECUTION_PRODUCTION_STEP_DATA_EXPOSURE",
        diagnostics.includeStepData,
      ),
    );
  }

  return issues;
}

/**
 * Validates a finite numeric value.
 */
function validateFiniteNumber(
  issues: ConfigurationValidationIssue[],
  path: string,
  value: number,
  code: string,
): void {
  if (!Number.isFinite(value)) {
    issues.push(
      createValidationError(
        path,
        "Value must be a finite number.",
        code,
        value,
      ),
    );
  }
}

/**
 * Validates a positive integer.
 */
function validatePositiveInteger(
  issues: ConfigurationValidationIssue[],
  path: string,
  value: number,
  code: string,
): void {
  if (
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    value > MAXIMUM_SAFE_EXECUTION_VALUE
  ) {
    issues.push(
      createValidationError(
        path,
        "Value must be a positive safe integer.",
        code,
        value,
      ),
    );
  }
}

/**
 * Validates a non-negative integer.
 */
function validateNonNegativeInteger(
  issues: ConfigurationValidationIssue[],
  path: string,
  value: number,
  code: string,
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAXIMUM_SAFE_EXECUTION_VALUE
  ) {
    issues.push(
      createValidationError(
        path,
        "Value must be a non-negative safe integer.",
        code,
        value,
      ),
    );
  }
}

/**
 * Validates a positive millisecond duration.
 */
function validatePositiveDuration(
  issues: ConfigurationValidationIssue[],
  path: string,
  value: number,
  code: string,
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < MINIMUM_EXECUTION_DURATION_MS
  ) {
    issues.push(
      createValidationError(
        path,
        `Duration must be at least ${MINIMUM_EXECUTION_DURATION_MS} millisecond.`,
        code,
        value,
      ),
    );
  }
}

/**
 * Validates a non-negative millisecond duration.
 */
function validateNonNegativeDuration(
  issues: ConfigurationValidationIssue[],
  path: string,
  value: number,
  code: string,
): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    issues.push(
      createValidationError(
        path,
        "Duration must be a non-negative safe integer.",
        code,
        value,
      ),
    );
  }
}

/**
 * Validates a percentage represented as a decimal from zero through one.
 */
function validatePercentage(
  issues: ConfigurationValidationIssue[],
  path: string,
  value: number,
  code: string,
): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    issues.push(
      createValidationError(
        path,
        "Value must be between zero and one.",
        code,
        value,
      ),
    );
  }
}

/**
 * Validates an enum value against its supported values.
 */
function validateEnumValue<T>(
  issues: ConfigurationValidationIssue[],
  path: string,
  value: T,
  supportedValues: readonly T[],
  code: string,
): void {
  if (!supportedValues.includes(value)) {
    issues.push(
      createValidationError(
        path,
        `Unsupported value: ${String(value)}.`,
        code,
        value,
      ),
    );
  }
}

/**
 * Validates a collection of non-empty strings.
 */
function validateStringCollection(
  issues: ConfigurationValidationIssue[],
  path: string,
  values: readonly string[],
  code: string,
): void {
  if (!Array.isArray(values)) {
    issues.push(
      createValidationError(
        path,
        "Value must be an array of strings.",
        code,
        values,
      ),
    );

    return;
  }

  const invalidValues = values.filter(
    (value) => typeof value !== "string" || !value.trim(),
  );

  if (invalidValues.length > 0) {
    issues.push(
      createValidationError(
        path,
        "String collections must not contain empty or invalid values.",
        code,
        invalidValues,
      ),
    );
  }

  const normalizedValues = values.map((value) =>
    typeof value === "string" ? value.trim().toLowerCase() : "",
  );

  const duplicateValues = normalizedValues.filter(
    (value, index) =>
      value &&
      normalizedValues.indexOf(value) !== index,
  );

  if (duplicateValues.length > 0) {
    issues.push(
      createValidationWarning(
        path,
        "String collection contains duplicate values.",
        `${code}_DUPLICATES`,
        [...new Set(duplicateValues)],
      ),
    );
  }
}

/**
 * Creates an error-level validation issue.
 */
function createValidationError(
  path: string,
  message: string,
  code: string,
  value?: unknown,
): ConfigurationValidationIssue {
  return {
    path,
    message,
    severity: "error",
    code,
    value,
  };
}

/**
 * Creates a warning-level validation issue.
 */
function createValidationWarning(
  path: string,
  message: string,
  code: string,
  value?: unknown,
): ConfigurationValidationIssue {
  return {
    path,
    message,
    severity: "warning",
    code,
    value,
  };
}

/**
 * Creates an informational validation issue.
 */
function createValidationInformation(
  path: string,
  message: string,
  code: string,
  value?: unknown,
): ConfigurationValidationIssue {
  return {
    path,
    message,
    severity: "information",
    code,
    value,
  };
}

/**
 * Determines whether the default execution configuration passes validation.
 */
export function isDefaultExecutionConfigurationValid(): boolean {
  return validateExecutionConfiguration(
    DEFAULT_EXECUTION_CONFIGURATION,
  ).valid;
}

/**
 * Determines whether every environment preset passes validation.
 */
export function validateExecutionConfigurationPresets(): Readonly<{
  development: ConfigurationValidationResult;
  testing: ConfigurationValidationResult;
  staging: ConfigurationValidationResult;
  production: ConfigurationValidationResult;
}> {
  return Object.freeze({
    development: validateExecutionConfiguration(
      DEVELOPMENT_EXECUTION_CONFIGURATION,
    ),

    testing: validateExecutionConfiguration(
      TESTING_EXECUTION_CONFIGURATION,
    ),

    staging: validateExecutionConfiguration(
      STAGING_EXECUTION_CONFIGURATION,
    ),

    production: validateExecutionConfiguration(
      PRODUCTION_EXECUTION_CONFIGURATION,
    ),
  });
}
/**
 * Supported execution configuration environments.
 */
export type ExecutionConfigurationEnvironment =
  ExecutionConfiguration["environment"];

/**
 * A controlled partial override for an execution configuration.
 *
 * Each major section may be supplied independently without requiring
 * callers to reconstruct the complete configuration object.
 */
export type ExecutionConfigurationOverride = Partial<
  Omit<
    ExecutionConfiguration,
    | "metadata"
    | "behavior"
    | "execution"
    | "concurrency"
    | "retry"
    | "compensation"
    | "cancellation"
    | "validation"
    | "performance"
    | "diagnostics"
    | "security"
  >
> & {
  metadata?: Partial<ExecutionConfiguration["metadata"]>;

  behavior?: Partial<ExecutionConfiguration["behavior"]>;

  execution?: Partial<ExecutionSettings>;

  concurrency?: Partial<ExecutionConcurrencySettings>;

  retry?: Partial<ExecutionRetrySettings>;

  compensation?: Partial<ExecutionCompensationSettings>;

  cancellation?: Partial<ExecutionCancellationSettings>;

  validation?: Partial<ExecutionValidationSettings>;

  performance?: Partial<ExecutionPerformanceSettings>;

  diagnostics?: Partial<ExecutionDiagnosticsSettings>;

  security?: Partial<ExecutionSecuritySettings>;
};

/**
 * Options controlling execution configuration creation.
 */
export interface CreateExecutionConfigurationOptions {
  /**
   * Environment preset used as the configuration foundation.
   */
  environment?: ExecutionConfigurationEnvironment;

  /**
   * Configuration values that override the selected preset.
   */
  overrides?: ExecutionConfigurationOverride;

  /**
   * Determines whether the completed configuration is validated.
   *
   * @default true
   */
  validate?: boolean;

  /**
   * Determines whether validation warnings should prevent creation.
   *
   * @default false
   */
  rejectWarnings?: boolean;

  /**
   * Determines whether the resulting configuration is deeply frozen.
   *
   * @default true
   */
  freeze?: boolean;
}

/**
 * Options controlling configuration update operations.
 */
export interface UpdateExecutionConfigurationOptions {
  /**
   * Determines whether the updated configuration is validated.
   *
   * @default true
   */
  validate?: boolean;

  /**
   * Determines whether validation warnings should prevent the update.
   *
   * @default false
   */
  rejectWarnings?: boolean;

  /**
   * Determines whether the returned configuration is deeply frozen.
   *
   * @default true
   */
  freeze?: boolean;
}

/**
 * Error raised when an execution configuration cannot pass validation.
 */
export class ExecutionConfigurationValidationError extends Error {
  public readonly validationResult: ConfigurationValidationResult;

  public constructor(
    message: string,
    validationResult: ConfigurationValidationResult,
  ) {
    super(message);

    this.name = "ExecutionConfigurationValidationError";
    this.validationResult = validationResult;

    Object.setPrototypeOf(
      this,
      ExecutionConfigurationValidationError.prototype,
    );
  }
}

/**
 * Returns the execution configuration preset associated with an environment.
 */
export function getExecutionConfigurationPreset(
  environment: ExecutionConfigurationEnvironment,
): Immutable<ExecutionConfiguration> {
  switch (environment) {
    case "development":
      return DEVELOPMENT_EXECUTION_CONFIGURATION;

    case "testing":
      return TESTING_EXECUTION_CONFIGURATION;

    case "staging":
      return STAGING_EXECUTION_CONFIGURATION;

    case "production":
      return PRODUCTION_EXECUTION_CONFIGURATION;

    default:
      return assertNeverExecutionEnvironment(environment);
  }
}

/**
 * Creates a complete execution configuration.
 *
 * Supported forms:
 *
 * createExecutionConfiguration()
 *
 * createExecutionConfiguration("production")
 *
 * createExecutionConfiguration({
 *   environment: "production",
 *   overrides: {
 *     retry: {
 *       maximumRetries: 10,
 *     },
 *   },
 * })
 */
export function createExecutionConfiguration(): Immutable<ExecutionConfiguration>;

export function createExecutionConfiguration(
  environment: ExecutionConfigurationEnvironment,
): Immutable<ExecutionConfiguration>;

export function createExecutionConfiguration(
  overrides: ExecutionConfigurationOverride,
): Immutable<ExecutionConfiguration>;

export function createExecutionConfiguration(
  options: CreateExecutionConfigurationOptions,
): Immutable<ExecutionConfiguration>;

export function createExecutionConfiguration(
  input?:
    | ExecutionConfigurationEnvironment
    | ExecutionConfigurationOverride
    | CreateExecutionConfigurationOptions,
): Immutable<ExecutionConfiguration> {
  const options = normalizeCreateExecutionConfigurationOptions(input);

  const environment =
    options.environment ??
    options.overrides?.environment ??
    "production";

  const preset = getExecutionConfigurationPreset(environment);

  const merged = mergeExecutionConfigurationValues(
    preset,
    options.overrides ?? {},
  );

  const normalized: ExecutionConfiguration = {
    ...merged,

    environment,

    metadata: {
      ...merged.metadata,

      tags: [...merged.metadata.tags],
    },

    retry: {
      ...merged.retry,

      retryableErrors: [...merged.retry.retryableErrors],

      nonRetryableErrors: [...merged.retry.nonRetryableErrors],
    },

    diagnostics: {
      ...merged.diagnostics,

      sensitivePropertyNames: [
        ...merged.diagnostics.sensitivePropertyNames,
      ],
    },
  };

  const shouldValidate = options.validate ?? true;
  const rejectWarnings = options.rejectWarnings ?? false;
  const shouldFreeze = options.freeze ?? true;

  if (shouldValidate) {
    assertValidExecutionConfiguration(
      normalized,
      rejectWarnings,
    );
  }

  if (shouldFreeze) {
    return freezeExecutionConfiguration(normalized);
  }

  return normalized as Immutable<ExecutionConfiguration>;
}

/**
 * Creates a development execution configuration.
 */
export function createDevelopmentExecutionConfiguration(
  overrides: ExecutionConfigurationOverride = {},
): Immutable<ExecutionConfiguration> {
  return createExecutionConfiguration({
    environment: "development",
    overrides,
  });
}

/**
 * Creates a testing execution configuration.
 */
export function createTestingExecutionConfiguration(
  overrides: ExecutionConfigurationOverride = {},
): Immutable<ExecutionConfiguration> {
  return createExecutionConfiguration({
    environment: "testing",
    overrides,
  });
}

/**
 * Creates a staging execution configuration.
 */
export function createStagingExecutionConfiguration(
  overrides: ExecutionConfigurationOverride = {},
): Immutable<ExecutionConfiguration> {
  return createExecutionConfiguration({
    environment: "staging",
    overrides,
  });
}

/**
 * Creates a production execution configuration.
 */
export function createProductionExecutionConfiguration(
  overrides: ExecutionConfigurationOverride = {},
): Immutable<ExecutionConfiguration> {
  return createExecutionConfiguration({
    environment: "production",
    overrides,
  });
}

/**
 * Updates an existing execution configuration without modifying the source.
 *
 * The original configuration remains unchanged.
 */
export function updateExecutionConfiguration(
  configuration: ExecutionConfiguration,
  overrides: ExecutionConfigurationOverride,
  options: UpdateExecutionConfigurationOptions = {},
): Immutable<ExecutionConfiguration> {
  const merged = mergeExecutionConfigurationValues(
    configuration,
    overrides,
  );

  const copied = copyExecutionConfiguration(merged);

  const shouldValidate = options.validate ?? true;
  const rejectWarnings = options.rejectWarnings ?? false;
  const shouldFreeze = options.freeze ?? true;

  if (shouldValidate) {
    assertValidExecutionConfiguration(
      copied,
      rejectWarnings,
    );
  }

  if (shouldFreeze) {
    return freezeExecutionConfiguration(copied);
  }

  return copied as Immutable<ExecutionConfiguration>;
}

/**
 * Merges execution configuration values and returns an immutable result.
 *
 * This function is an alias for controlled configuration updating and is
 * included to make merge intent explicit at call sites.
 */
export function mergeExecutionConfiguration(
  configuration: ExecutionConfiguration,
  overrides: ExecutionConfigurationOverride,
  options: UpdateExecutionConfigurationOptions = {},
): Immutable<ExecutionConfiguration> {
  return updateExecutionConfiguration(
    configuration,
    overrides,
    options,
  );
}

/**
 * Produces an immutable clone of an execution configuration.
 */
export function cloneExecutionConfiguration(
  configuration: ExecutionConfiguration,
): Immutable<ExecutionConfiguration> {
  return freezeExecutionConfiguration(
    copyExecutionConfiguration(configuration),
  );
}

/**
 * Produces a mutable independent copy of an execution configuration.
 *
 * Arrays and nested configuration sections are copied so modifications to
 * the returned object cannot mutate the source configuration.
 */
export function copyExecutionConfiguration(
  configuration: ExecutionConfiguration,
): ExecutionConfiguration {
  return {
    ...configuration,

    metadata: {
      ...configuration.metadata,

      tags: [...configuration.metadata.tags],
    },

    behavior: {
      ...configuration.behavior,
    },

    execution: {
      ...configuration.execution,
    },

    concurrency: {
      ...configuration.concurrency,
    },

    retry: {
      ...configuration.retry,

      retryableErrors: [
        ...configuration.retry.retryableErrors,
      ],

      nonRetryableErrors: [
        ...configuration.retry.nonRetryableErrors,
      ],
    },

    compensation: {
      ...configuration.compensation,
    },

    cancellation: {
      ...configuration.cancellation,
    },

    validation: {
      ...configuration.validation,
    },

    performance: {
      ...configuration.performance,
    },

    diagnostics: {
      ...configuration.diagnostics,

      sensitivePropertyNames: [
        ...configuration.diagnostics.sensitivePropertyNames,
      ],
    },

    security: {
      ...configuration.security,
    },
  };
}

/**
 * Deeply freezes an execution configuration.
 */
export function freezeExecutionConfiguration(
  configuration: ExecutionConfiguration,
): Immutable<ExecutionConfiguration> {
  return freezeConfigurationValue(
    copyExecutionConfiguration(configuration),
  );
}

/**
 * Alias emphasizing that all nested configuration values are frozen.
 */
export function deepFreezeExecutionConfiguration(
  configuration: ExecutionConfiguration,
): Immutable<ExecutionConfiguration> {
  return freezeExecutionConfiguration(configuration);
}

/**
 * Resets a configuration to its environment preset.
 *
 * The environment may be inherited from the current configuration or
 * explicitly replaced.
 */
export function resetExecutionConfiguration(
  configurationOrEnvironment:
    | ExecutionConfiguration
    | ExecutionConfigurationEnvironment = "production",
): Immutable<ExecutionConfiguration> {
  const environment =
    typeof configurationOrEnvironment === "string"
      ? configurationOrEnvironment
      : configurationOrEnvironment.environment;

  return createExecutionConfiguration(environment);
}

/**
 * Resets only selected sections while preserving all other values.
 */
export function resetExecutionConfigurationSections(
  configuration: ExecutionConfiguration,
  sections: readonly ExecutionConfigurationSection[],
): Immutable<ExecutionConfiguration> {
  const preset = getExecutionConfigurationPreset(
    configuration.environment,
  );

  const overrides: ExecutionConfigurationOverride = {};

  for (const section of sections) {
    switch (section) {
      case "execution":
        overrides.execution = {
          ...preset.execution,
        };
        break;

      case "concurrency":
        overrides.concurrency = {
          ...preset.concurrency,
        };
        break;

      case "retry":
        overrides.retry = {
          ...preset.retry,

          retryableErrors: [
            ...preset.retry.retryableErrors,
          ],

          nonRetryableErrors: [
            ...preset.retry.nonRetryableErrors,
          ],
        };
        break;

      case "compensation":
        overrides.compensation = {
          ...preset.compensation,
        };
        break;

      case "cancellation":
        overrides.cancellation = {
          ...preset.cancellation,
        };
        break;

      case "validation":
        overrides.validation = {
          ...preset.validation,
        };
        break;

      case "performance":
        overrides.performance = {
          ...preset.performance,
        };
        break;

      case "diagnostics":
        overrides.diagnostics = {
          ...preset.diagnostics,

          sensitivePropertyNames: [
            ...preset.diagnostics.sensitivePropertyNames,
          ],
        };
        break;

      case "security":
        overrides.security = {
          ...preset.security,
        };
        break;

      default:
        assertNeverExecutionConfigurationSection(section);
    }
  }

  return updateExecutionConfiguration(
    configuration,
    overrides,
  );
}

/**
 * Determines whether a configuration is deeply frozen.
 */
export function isExecutionConfigurationFrozen(
  configuration: ExecutionConfiguration,
): boolean {
  return (
    Object.isFrozen(configuration) &&
    Object.isFrozen(configuration.metadata) &&
    Object.isFrozen(configuration.metadata.tags) &&
    Object.isFrozen(configuration.behavior) &&
    Object.isFrozen(configuration.execution) &&
    Object.isFrozen(configuration.concurrency) &&
    Object.isFrozen(configuration.retry) &&
    Object.isFrozen(configuration.retry.retryableErrors) &&
    Object.isFrozen(configuration.retry.nonRetryableErrors) &&
    Object.isFrozen(configuration.compensation) &&
    Object.isFrozen(configuration.cancellation) &&
    Object.isFrozen(configuration.validation) &&
    Object.isFrozen(configuration.performance) &&
    Object.isFrozen(configuration.diagnostics) &&
    Object.isFrozen(
      configuration.diagnostics.sensitivePropertyNames,
    ) &&
    Object.isFrozen(configuration.security)
  );
}

/**
 * Returns true when two configurations contain equivalent values.
 *
 * This comparison uses stable field ordering from the configuration factory.
 */
export function areExecutionConfigurationsEqual(
  left: ExecutionConfiguration,
  right: ExecutionConfiguration,
): boolean {
  if (left === right) {
    return true;
  }

  return (
    JSON.stringify(left) ===
    JSON.stringify(right)
  );
}

/**
 * Asserts that a configuration passes enterprise validation.
 */
export function assertValidExecutionConfiguration(
  configuration: ExecutionConfiguration,
  rejectWarnings = false,
): void {
  const validationResult =
    validateExecutionConfiguration(configuration);

  const warningIssues = validationResult.issues.filter(
    (issue) => issue.severity === "warning",
  );

  if (
    validationResult.valid &&
    (!rejectWarnings || warningIssues.length === 0)
  ) {
    return;
  }

  const relevantIssues = validationResult.issues.filter(
    (issue) =>
      issue.severity === "error" ||
      (rejectWarnings && issue.severity === "warning"),
  );

  const issueSummary = relevantIssues
    .map(
      (issue) =>
        `[${issue.code}] ${issue.path}: ${issue.message}`,
    )
    .join("; ");

  throw new ExecutionConfigurationValidationError(
    issueSummary
      ? `Execution configuration validation failed: ${issueSummary}`
      : "Execution configuration validation failed.",
    validationResult,
  );
}

/**
 * Internal merge implementation.
 *
 * Arrays are replaced rather than concatenated. Every grouped configuration
 * section is merged independently to prevent loss of preset defaults.
 */
function mergeExecutionConfigurationValues(
  base: ExecutionConfiguration,
  overrides: ExecutionConfigurationOverride,
): ExecutionConfiguration {
  return {
    ...base,
    ...overrides,

    metadata: {
      ...base.metadata,
      ...overrides.metadata,

      tags: overrides.metadata?.tags
        ? [...overrides.metadata.tags]
        : [...base.metadata.tags],
    },

    behavior: {
      ...base.behavior,
      ...overrides.behavior,
    },

    execution: {
      ...base.execution,
      ...overrides.execution,
    },

    concurrency: {
      ...base.concurrency,
      ...overrides.concurrency,
    },

    retry: {
      ...base.retry,
      ...overrides.retry,

      retryableErrors: overrides.retry?.retryableErrors
        ? [...overrides.retry.retryableErrors]
        : [...base.retry.retryableErrors],

      nonRetryableErrors:
        overrides.retry?.nonRetryableErrors
          ? [...overrides.retry.nonRetryableErrors]
          : [...base.retry.nonRetryableErrors],
    },

    compensation: {
      ...base.compensation,
      ...overrides.compensation,
    },

    cancellation: {
      ...base.cancellation,
      ...overrides.cancellation,
    },

    validation: {
      ...base.validation,
      ...overrides.validation,
    },

    performance: {
      ...base.performance,
      ...overrides.performance,
    },

    diagnostics: {
      ...base.diagnostics,
      ...overrides.diagnostics,

      sensitivePropertyNames:
        overrides.diagnostics?.sensitivePropertyNames
          ? [
              ...overrides.diagnostics
                .sensitivePropertyNames,
            ]
          : [
              ...base.diagnostics
                .sensitivePropertyNames,
            ],
    },

    security: {
      ...base.security,
      ...overrides.security,
    },
  };
}

/**
 * Normalizes the supported factory input forms.
 */
function normalizeCreateExecutionConfigurationOptions(
  input?:
    | ExecutionConfigurationEnvironment
    | ExecutionConfigurationOverride
    | CreateExecutionConfigurationOptions,
): CreateExecutionConfigurationOptions {
  if (!input) {
    return {
      environment: "production",
    };
  }

  if (typeof input === "string") {
    return {
      environment: input,
    };
  }

  if (isCreateExecutionConfigurationOptions(input)) {
    return {
      environment: input.environment,
      overrides: input.overrides,
      validate: input.validate,
      rejectWarnings: input.rejectWarnings,
      freeze: input.freeze,
    };
  }

  return {
    environment: input.environment,
    overrides: input,
  };
}

/**
 * Determines whether an object uses the factory options structure.
 */
function isCreateExecutionConfigurationOptions(
  value:
    | ExecutionConfigurationOverride
    | CreateExecutionConfigurationOptions,
): value is CreateExecutionConfigurationOptions {
  return (
    Object.prototype.hasOwnProperty.call(
      value,
      "overrides",
    ) ||
    Object.prototype.hasOwnProperty.call(
      value,
      "validate",
    ) ||
    Object.prototype.hasOwnProperty.call(
      value,
      "rejectWarnings",
    ) ||
    Object.prototype.hasOwnProperty.call(
      value,
      "freeze",
    )
  );
}

/**
 * Exhaustiveness assertion for environment selection.
 */
function assertNeverExecutionEnvironment(
  environment: never,
): never {
  throw new Error(
    `Unsupported execution configuration environment: ${String(
      environment,
    )}`,
  );
}

/**
 * Exhaustiveness assertion for configuration sections.
 */
function assertNeverExecutionConfigurationSection(
  section: never,
): never {
  throw new Error(
    `Unsupported execution configuration section: ${String(
      section,
    )}`,
  );
}

/**
 * Unified enterprise execution configuration API.
 *
 * This utility exposes creation, updates, validation, cloning, resetting,
 * freezing, and environment preset selection through one discoverable
 * interface.
 */
export const ExecutionConfigurationFactory = Object.freeze({
  create: createExecutionConfiguration,

  createDevelopment:
    createDevelopmentExecutionConfiguration,

  createTesting:
    createTestingExecutionConfiguration,

  createStaging:
    createStagingExecutionConfiguration,

  createProduction:
    createProductionExecutionConfiguration,

  update: updateExecutionConfiguration,

  merge: mergeExecutionConfiguration,

  clone: cloneExecutionConfiguration,

  copy: copyExecutionConfiguration,

  freeze: freezeExecutionConfiguration,

  deepFreeze:
    deepFreezeExecutionConfiguration,

  reset: resetExecutionConfiguration,

  resetSections:
    resetExecutionConfigurationSections,

  getPreset:
    getExecutionConfigurationPreset,

  validate:
    validateExecutionConfiguration,

  assertValid:
    assertValidExecutionConfiguration,

  isFrozen:
    isExecutionConfigurationFrozen,

  equals:
    areExecutionConfigurationsEqual,
});
/**
 * Determines whether a value is a recognized execution mode.
 */
export function isExecutionMode(
  value: unknown,
): value is ExecutionMode {
  return EXECUTION_MODES.includes(value as ExecutionMode);
}

/**
 * Determines whether a value is a recognized retry strategy.
 */
export function isRetryStrategy(
  value: unknown,
): value is RetryStrategy {
  return RETRY_STRATEGIES.includes(value as RetryStrategy);
}

/**
 * Determines whether a value is a recognized compensation strategy.
 */
export function isCompensationStrategy(
  value: unknown,
): value is CompensationStrategy {
  return COMPENSATION_STRATEGIES.includes(
    value as CompensationStrategy,
  );
}

/**
 * Determines whether a value is a recognized cancellation strategy.
 */
export function isCancellationStrategy(
  value: unknown,
): value is CancellationStrategy {
  return CANCELLATION_STRATEGIES.includes(
    value as CancellationStrategy,
  );
}

/**
 * Determines whether a value is a recognized execution validation strategy.
 */
export function isExecutionValidationStrategy(
  value: unknown,
): value is ExecutionValidationStrategy {
  return EXECUTION_VALIDATION_STRATEGIES.includes(
    value as ExecutionValidationStrategy,
  );
}

/**
 * Determines whether a value is a recognized duplicate protection strategy.
 */
export function isDuplicateProtectionStrategy(
  value: unknown,
): value is DuplicateProtectionStrategy {
  return DUPLICATE_PROTECTION_STRATEGIES.includes(
    value as DuplicateProtectionStrategy,
  );
}

/**
 * Determines whether a value is a recognized execution authorization mode.
 */
export function isExecutionAuthorizationMode(
  value: unknown,
): value is ExecutionAuthorizationMode {
  return EXECUTION_AUTHORIZATION_MODES.includes(
    value as ExecutionAuthorizationMode,
  );
}

/**
 * Determines whether a value is a recognized queue overflow strategy.
 */
export function isExecutionQueueOverflowStrategy(
  value: unknown,
): value is ExecutionQueueOverflowStrategy {
  return EXECUTION_QUEUE_OVERFLOW_STRATEGIES.includes(
    value as ExecutionQueueOverflowStrategy,
  );
}

/**
 * Determines whether a value is a supported execution configuration
 * environment.
 */
export function isExecutionConfigurationEnvironment(
  value: unknown,
): value is ExecutionConfigurationEnvironment {
  return (
    value === "development" ||
    value === "testing" ||
    value === "staging" ||
    value === "production"
  );
}

/**
 * Determines whether a value identifies a supported configuration section.
 */
export function isExecutionConfigurationSection(
  value: unknown,
): value is ExecutionConfigurationSection {
  return (
    value === "execution" ||
    value === "concurrency" ||
    value === "retry" ||
    value === "compensation" ||
    value === "cancellation" ||
    value === "validation" ||
    value === "performance" ||
    value === "diagnostics" ||
    value === "security"
  );
}

/**
 * Determines whether a value is a non-null object.
 */
function isRecordValue(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Determines whether a value is a boolean.
 */
function isBooleanValue(
  value: unknown,
): value is boolean {
  return typeof value === "boolean";
}

/**
 * Determines whether a value is a finite number.
 */
function isFiniteNumberValue(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

/**
 * Determines whether a value is a safe integer.
 */
function isSafeIntegerValue(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value)
  );
}

/**
 * Determines whether a value is a string array.
 */
function isStringArrayValue(
  value: unknown,
): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) => typeof entry === "string",
    )
  );
}

/**
 * Determines whether a value appears to be valid execution settings.
 */
export function isExecutionSettings(
  value: unknown,
): value is ExecutionSettings {
  if (!isRecordValue(value)) {
    return false;
  }

  return (
    isExecutionMode(value.mode) &&
    isSafeIntegerValue(
      value.maximumWorkflowDurationMs,
    ) &&
    isSafeIntegerValue(
      value.maximumStepDurationMs,
    ) &&
    isSafeIntegerValue(
      value.maximumWorkflowDepth,
    ) &&
    isSafeIntegerValue(
      value.maximumChildWorkflows,
    ) &&
    isSafeIntegerValue(
      value.maximumWorkflowSize,
    ) &&
    isBooleanValue(
      value.allowChildWorkflows,
    ) &&
    isBooleanValue(
      value.allowParallelBranches,
    ) &&
    isBooleanValue(
      value.continueOnNonCriticalFailure,
    ) &&
    isBooleanValue(
      value.retainExecutionResult,
    )
  );
}

/**
 * Determines whether a value appears to be valid concurrency settings.
 */
export function isExecutionConcurrencySettings(
  value: unknown,
): value is ExecutionConcurrencySettings {
  if (!isRecordValue(value)) {
    return false;
  }

  return (
    isSafeIntegerValue(value.workerCount) &&
    isSafeIntegerValue(
      value.maximumConcurrentWorkflows,
    ) &&
    isSafeIntegerValue(
      value.maximumConcurrentSteps,
    ) &&
    isSafeIntegerValue(
      value.maximumParallelBranches,
    ) &&
    isSafeIntegerValue(value.queueCapacity) &&
    isSafeIntegerValue(value.batchSize) &&
    isExecutionQueueOverflowStrategy(
      value.queueOverflowStrategy,
    ) &&
    isSafeIntegerValue(
      value.queueWaitTimeoutMs,
    ) &&
    isBooleanValue(
      value.isolateWorkflowConcurrency,
    )
  );
}

/**
 * Determines whether a value appears to be valid retry settings.
 */
export function isExecutionRetrySettings(
  value: unknown,
): value is ExecutionRetrySettings {
  if (!isRecordValue(value)) {
    return false;
  }

  return (
    isBooleanValue(value.enabled) &&
    isRetryStrategy(value.strategy) &&
    isSafeIntegerValue(
      value.maximumRetries,
    ) &&
    isSafeIntegerValue(
      value.initialDelayMs,
    ) &&
    isSafeIntegerValue(
      value.maximumDelayMs,
    ) &&
    isFiniteNumberValue(
      value.multiplier,
    ) &&
    isSafeIntegerValue(
      value.linearIncrementMs,
    ) &&
    isFiniteNumberValue(
      value.jitterFactor,
    ) &&
    isBooleanValue(
      value.retryFailedSteps,
    ) &&
    isBooleanValue(
      value.retryFailedChildWorkflows,
    ) &&
    isBooleanValue(
      value.persistRetryState,
    ) &&
    isStringArrayValue(
      value.retryableErrors,
    ) &&
    isStringArrayValue(
      value.nonRetryableErrors,
    )
  );
}

/**
 * Determines whether a value appears to be valid compensation settings.
 */
export function isExecutionCompensationSettings(
  value: unknown,
): value is ExecutionCompensationSettings {
  if (!isRecordValue(value)) {
    return false;
  }

  return (
    isBooleanValue(value.enabled) &&
    isCompensationStrategy(
      value.strategy,
    ) &&
    isBooleanValue(
      value.continueOnFailure,
    ) &&
    isSafeIntegerValue(
      value.maximumCompensationOperations,
    ) &&
    isSafeIntegerValue(
      value.compensationTimeoutMs,
    ) &&
    isBooleanValue(
      value.retryFailedCompensation,
    ) &&
    isSafeIntegerValue(
      value.maximumCompensationRetries,
    ) &&
    isSafeIntegerValue(
      value.compensationRetryDelayMs,
    ) &&
    isBooleanValue(
      value.persistCompensationState,
    ) &&
    isBooleanValue(
      value.compensateAutomatically,
    ) &&
    isBooleanValue(
      value.compensateChildWorkflows,
    )
  );
}

/**
 * Determines whether a value appears to be valid cancellation settings.
 */
export function isExecutionCancellationSettings(
  value: unknown,
): value is ExecutionCancellationSettings {
  if (!isRecordValue(value)) {
    return false;
  }

  return (
    isCancellationStrategy(
      value.strategy,
    ) &&
    isSafeIntegerValue(
      value.gracefulTimeoutMs,
    ) &&
    isSafeIntegerValue(
      value.forceTimeoutMs,
    ) &&
    isBooleanValue(
      value.notifyRunningSteps,
    ) &&
    isBooleanValue(
      value.cancelPendingSteps,
    ) &&
    isBooleanValue(
      value.cascadeToChildWorkflows,
    ) &&
    isBooleanValue(
      value.persistCancellationState,
    ) &&
    isBooleanValue(
      value.compensateOnCancellation,
    ) &&
    isBooleanValue(
      value.allowResumeAfterCancellation,
    )
  );
}

/**
 * Determines whether a value appears to be valid execution validation
 * settings.
 */
export function isExecutionValidationSettings(
  value: unknown,
): value is ExecutionValidationSettings {
  if (!isRecordValue(value)) {
    return false;
  }

  return (
    isExecutionValidationStrategy(
      value.strategy,
    ) &&
    isBooleanValue(
      value.validateBeforeExecution,
    ) &&
    isBooleanValue(
      value.validateInput,
    ) &&
    isBooleanValue(
      value.validateOutput,
    ) &&
    isBooleanValue(
      value.validateSteps,
    ) &&
    isBooleanValue(
      value.validateChildWorkflows,
    ) &&
    isBooleanValue(
      value.validateCompensation,
    ) &&
    isBooleanValue(
      value.detectInfiniteLoops,
    ) &&
    isBooleanValue(
      value.detectUnreachableSteps,
    ) &&
    isBooleanValue(
      value.rejectUnknownStepTypes,
    ) &&
    isBooleanValue(
      value.rejectUnknownProperties,
    ) &&
    isBooleanValue(
      value.treatWarningsAsErrors,
    )
  );
}

/**
 * Determines whether a value appears to be valid execution performance
 * settings.
 */
export function isExecutionPerformanceSettings(
  value: unknown,
): value is ExecutionPerformanceSettings {
  if (!isRecordValue(value)) {
    return false;
  }

  return (
    isBooleanValue(
      value.collectMetrics,
    ) &&
    isBooleanValue(
      value.collectStatistics,
    ) &&
    isBooleanValue(
      value.captureExecutionHistory,
    ) &&
    isBooleanValue(
      value.captureStepHistory,
    ) &&
    isBooleanValue(
      value.measureWorkflowDuration,
    ) &&
    isBooleanValue(
      value.measureStepDuration,
    ) &&
    isBooleanValue(
      value.measureQueueWaitTime,
    ) &&
    isBooleanValue(
      value.measureRetryPerformance,
    ) &&
    isSafeIntegerValue(
      value.maximumInMemoryHistoryEntries,
    ) &&
    isBooleanValue(
      value.persistPerformanceData,
    ) &&
    isSafeIntegerValue(
      value.performanceFlushIntervalMs,
    )
  );
}

/**
 * Determines whether a value appears to be valid execution diagnostic
 * settings.
 */
export function isExecutionDiagnosticsSettings(
  value: unknown,
): value is ExecutionDiagnosticsSettings {
  if (!isRecordValue(value)) {
    return false;
  }

  return (
    isBooleanValue(value.verbose) &&
    isBooleanValue(
      value.traceExecution,
    ) &&
    isBooleanValue(value.traceSteps) &&
    isBooleanValue(value.traceEvents) &&
    isBooleanValue(value.traceRetries) &&
    isBooleanValue(
      value.traceCompensation,
    ) &&
    isBooleanValue(
      value.traceCancellation,
    ) &&
    isBooleanValue(
      value.traceChildWorkflows,
    ) &&
    isBooleanValue(
      value.includeWorkflowInput,
    ) &&
    isBooleanValue(
      value.includeWorkflowOutput,
    ) &&
    isBooleanValue(
      value.includeStepData,
    ) &&
    isBooleanValue(
      value.redactSensitiveData,
    ) &&
    isStringArrayValue(
      value.sensitivePropertyNames,
    )
  );
}

/**
 * Determines whether a value appears to be valid execution security
 * settings.
 */
export function isExecutionSecuritySettings(
  value: unknown,
): value is ExecutionSecuritySettings {
  if (!isRecordValue(value)) {
    return false;
  }

  return (
    isDuplicateProtectionStrategy(
      value.duplicateProtection,
    ) &&
    isSafeIntegerValue(
      value.duplicateProtectionWindowMs,
    ) &&
    isBooleanValue(
      value.validateWorkflowChecksum,
    ) &&
    isBooleanValue(
      value.requireWorkflowRegistration,
    ) &&
    isExecutionAuthorizationMode(
      value.authorizationMode,
    ) &&
    isBooleanValue(
      value.preventConcurrentExecution,
    ) &&
    isBooleanValue(
      value.requireIdempotencyKey,
    ) &&
    isBooleanValue(
      value.validateWorkflowOwnership,
    ) &&
    isBooleanValue(
      value.enforceDefinitionImmutability,
    ) &&
    isBooleanValue(
      value.requireDistributedLock,
    ) &&
    isSafeIntegerValue(
      value.lockAcquisitionTimeoutMs,
    ) &&
    isBooleanValue(
      value.auditRejectedExecutions,
    )
  );
}

/**
 * Performs structural inspection of an unknown value before full validation.
 *
 * This guard confirms that all required execution configuration sections
 * exist and contain the expected primitive structures.
 */
export function isExecutionConfiguration(
  value: unknown,
): value is ExecutionConfiguration {
  if (!isRecordValue(value)) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.version !== "string" ||
    typeof value.enabled !== "boolean" ||
    !isExecutionConfigurationEnvironment(
      value.environment,
    )
  ) {
    return false;
  }

  if (
    !isRecordValue(value.metadata) ||
    !isRecordValue(value.behavior)
  ) {
    return false;
  }

  return (
    isExecutionSettings(value.execution) &&
    isExecutionConcurrencySettings(
      value.concurrency,
    ) &&
    isExecutionRetrySettings(value.retry) &&
    isExecutionCompensationSettings(
      value.compensation,
    ) &&
    isExecutionCancellationSettings(
      value.cancellation,
    ) &&
    isExecutionValidationSettings(
      value.validation,
    ) &&
    isExecutionPerformanceSettings(
      value.performance,
    ) &&
    isExecutionDiagnosticsSettings(
      value.diagnostics,
    ) &&
    isExecutionSecuritySettings(
      value.security,
    )
  );
}

/**
 * Performs structural and enterprise-rule validation against an unknown
 * value.
 */
export function inspectExecutionConfiguration(
  value: unknown,
): ConfigurationValidationResult {
  if (!isExecutionConfiguration(value)) {
    return createConfigurationValidationResult([
      createValidationError(
        "configuration",
        "Value is not a structurally valid execution configuration.",
        "EXECUTION_CONFIGURATION_STRUCTURE_INVALID",
        value,
      ),
    ]);
  }

  return validateExecutionConfiguration(value);
}

/**
 * Parses and validates a potentially unknown execution configuration.
 *
 * The returned configuration is copied and deeply frozen.
 */
export function parseExecutionConfiguration(
  value: unknown,
  rejectWarnings = false,
): Immutable<ExecutionConfiguration> {
  if (!isExecutionConfiguration(value)) {
    const result =
      createConfigurationValidationResult([
        createValidationError(
          "configuration",
          "Unable to parse execution configuration because its structure is invalid.",
          "EXECUTION_CONFIGURATION_PARSE_FAILED",
          value,
        ),
      ]);

    throw new ExecutionConfigurationValidationError(
      "Execution configuration parsing failed.",
      result,
    );
  }

  const copied =
    copyExecutionConfiguration(value);

  assertValidExecutionConfiguration(
    copied,
    rejectWarnings,
  );

  return freezeExecutionConfiguration(copied);
}

/**
 * Attempts to parse an unknown execution configuration without throwing.
 */
export function tryParseExecutionConfiguration(
  value: unknown,
  rejectWarnings = false,
):
  | {
      success: true;
      configuration: Immutable<ExecutionConfiguration>;
      validationResult: ConfigurationValidationResult;
    }
  | {
      success: false;
      configuration: null;
      validationResult: ConfigurationValidationResult;
    } {
  if (!isExecutionConfiguration(value)) {
    const validationResult =
      createConfigurationValidationResult([
        createValidationError(
          "configuration",
          "Value is not a structurally valid execution configuration.",
          "EXECUTION_CONFIGURATION_STRUCTURE_INVALID",
          value,
        ),
      ]);

    return {
      success: false,
      configuration: null,
      validationResult,
    };
  }

  const validationResult =
    validateExecutionConfiguration(value);

  const hasWarnings =
    validationResult.issues.some(
      (issue) => issue.severity === "warning",
    );

  if (
    !validationResult.valid ||
    (rejectWarnings && hasWarnings)
  ) {
    return {
      success: false,
      configuration: null,
      validationResult,
    };
  }

  return {
    success: true,
    configuration:
      freezeExecutionConfiguration(value),
    validationResult,
  };
}

/**
 * Returns one selected execution configuration section.
 */
export function getExecutionConfigurationSection<
  TSection extends ExecutionConfigurationSection,
>(
  configuration: ExecutionConfiguration,
  section: TSection,
): ExecutionConfiguration[TSection] {
  return configuration[section];
}

/**
 * Returns independent copies of selected execution configuration sections.
 */
export function pickExecutionConfigurationSections<
  TSection extends ExecutionConfigurationSection,
>(
  configuration: ExecutionConfiguration,
  sections: readonly TSection[],
): Pick<ExecutionConfiguration, TSection> {
  const result = {} as Pick<
    ExecutionConfiguration,
    TSection
  >;

  for (const section of sections) {
    Object.assign(result, {
      [section]: copyExecutionConfigurationSection(
        configuration,
        section,
      ),
    });
  }

  return result;
}

/**
 * Copies one nested configuration section.
 */
function copyExecutionConfigurationSection<
  TSection extends ExecutionConfigurationSection,
>(
  configuration: ExecutionConfiguration,
  section: TSection,
): ExecutionConfiguration[TSection] {
  const copiedConfiguration =
    copyExecutionConfiguration(configuration);

  return copiedConfiguration[section];
}

/**
 * Returns all execution configuration section names.
 */
export function getExecutionConfigurationSections():
  readonly ExecutionConfigurationSection[] {
  return Object.freeze([
    "execution",
    "concurrency",
    "retry",
    "compensation",
    "cancellation",
    "validation",
    "performance",
    "diagnostics",
    "security",
  ]);
}

/**
 * Determines whether retry processing is operational.
 */
export function isRetryEnabled(
  configuration: ExecutionConfiguration,
): boolean {
  return (
    configuration.retry.enabled &&
    configuration.retry.strategy !==
      RetryStrategy.NONE &&
    configuration.retry.maximumRetries > 0
  );
}

/**
 * Determines whether compensation processing is operational.
 */
export function isCompensationEnabled(
  configuration: ExecutionConfiguration,
): boolean {
  return (
    configuration.compensation.enabled &&
    configuration.compensation.strategy !==
      CompensationStrategy.DISABLED
  );
}

/**
 * Determines whether the runtime uses parallel execution behavior.
 */
export function isParallelExecutionEnabled(
  configuration: ExecutionConfiguration,
): boolean {
  return (
    configuration.execution.allowParallelBranches &&
    (
      configuration.execution.mode ===
        ExecutionMode.PARALLEL ||
      configuration.execution.mode ===
        ExecutionMode.HYBRID ||
      configuration.execution.mode ===
        ExecutionMode.DISTRIBUTED
    )
  );
}

/**
 * Determines whether the runtime is configured for distributed execution.
 */
export function isDistributedExecutionEnabled(
  configuration: ExecutionConfiguration,
): boolean {
  return (
    configuration.execution.mode ===
      ExecutionMode.DISTRIBUTED ||
    configuration.execution.mode ===
      ExecutionMode.HYBRID
  );
}

/**
 * Determines whether duplicate execution protection is active.
 */
export function isDuplicateProtectionEnabled(
  configuration: ExecutionConfiguration,
): boolean {
  return (
    configuration.security.duplicateProtection !==
      DuplicateProtectionStrategy.NONE &&
    configuration.security
      .duplicateProtectionWindowMs > 0
  );
}

/**
 * Determines whether distributed locking is active.
 */
export function isDistributedLockRequired(
  configuration: ExecutionConfiguration,
): boolean {
  return (
    configuration.security.requireDistributedLock
  );
}

/**
 * Determines whether runtime diagnostics may contain workflow payload data.
 */
export function includesExecutionPayloadDiagnostics(
  configuration: ExecutionConfiguration,
): boolean {
  return (
    configuration.diagnostics
      .includeWorkflowInput ||
    configuration.diagnostics
      .includeWorkflowOutput ||
    configuration.diagnostics.includeStepData
  );
}

/**
 * Determines whether execution history is collected.
 */
export function isExecutionHistoryEnabled(
  configuration: ExecutionConfiguration,
): boolean {
  return (
    configuration.performance
      .captureExecutionHistory ||
    configuration.performance
      .captureStepHistory
  );
}

/**
 * Calculates the theoretical maximum number of simultaneously running
 * operations supported by the current concurrency configuration.
 */
export function getExecutionConcurrencyCapacity(
  configuration: ExecutionConfiguration,
): number {
  return Math.min(
    configuration.concurrency
      .maximumConcurrentSteps,
    configuration.concurrency.workerCount *
      configuration.concurrency
        .maximumParallelBranches,
  );
}

/**
 * Calculates the highest possible retry delay.
 *
 * The returned value does not include jitter.
 */
export function calculateRetryDelay(
  configuration: ExecutionConfiguration,
  retryAttempt: number,
): number {
  const retry = configuration.retry;

  if (!retry.enabled || retryAttempt <= 0) {
    return 0;
  }

  let delayMs: number;

  switch (retry.strategy) {
  case RetryStrategy.NONE:
    return 0;

  case RetryStrategy.IMMEDIATE:
    return 0;

  case RetryStrategy.FIXED_DELAY:
    delayMs = retry.initialDelayMs;
    break;

  case RetryStrategy.LINEAR:
    delayMs =
      retry.initialDelayMs +
      retry.linearIncrementMs * (retryAttempt - 1);
    break;

  case RetryStrategy.EXPONENTIAL:
    delayMs =
      retry.initialDelayMs *
      Math.pow(
        retry.multiplier,
        retryAttempt - 1,
      );
    break;

  case RetryStrategy.CUSTOM:
    delayMs = retry.initialDelayMs;
    break;

  default:
    return assertNeverRetryStrategy(
      retry.strategy,
    );
}

  const roundedDelay = Math.max(
    0,
    Math.round(delayMs),
  );

  if (retry.maximumDelayMs <= 0) {
    return roundedDelay;
  }

  return Math.min(
    roundedDelay,
    retry.maximumDelayMs,
  );
}
/**
 * Applies configured jitter to a retry delay.
 *
 * A random source may be injected to support deterministic testing.
 */
export function applyRetryJitter(
  delayMs: number,
  jitterFactor: number,
  random: () => number = Math.random,
): number {
  if (
    delayMs <= 0 ||
    jitterFactor <= 0
  ) {
    return Math.max(0, Math.round(delayMs));
  }

  const normalizedJitter =
    Math.min(Math.max(jitterFactor, 0), 1);

  const variance =
    delayMs * normalizedJitter;

  const randomOffset =
    (random() * 2 - 1) * variance;

  return Math.max(
    0,
    Math.round(delayMs + randomOffset),
  );
}

/**
 * Calculates a retry delay including jitter.
 */
export function calculateRetryDelayWithJitter(
  configuration: ExecutionConfiguration,
  retryAttempt: number,
  random: () => number = Math.random,
): number {
  const delayMs =
    calculateRetryDelay(
      configuration,
      retryAttempt,
    );

  return applyRetryJitter(
    delayMs,
    configuration.retry.jitterFactor,
    random,
  );
}

/**
 * Determines whether an error is classified as retryable.
 */
export function isRetryableExecutionError(
  configuration: ExecutionConfiguration,
  error: unknown,
): boolean {
  if (!isRetryEnabled(configuration)) {
    return false;
  }

  const errorName =
    getExecutionErrorName(error);

  if (
    configuration.retry.nonRetryableErrors.includes(
      errorName,
    )
  ) {
    return false;
  }

  if (
    configuration.retry.retryableErrors.length ===
    0
  ) {
    return true;
  }

  return configuration.retry.retryableErrors.includes(
    errorName,
  );
}

/**
 * Extracts a stable error name from an unknown thrown value.
 */
export function getExecutionErrorName(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.name || "Error";
  }

  if (
    isRecordValue(error) &&
    typeof error.name === "string" &&
    error.name.trim()
  ) {
    return error.name.trim();
  }

  if (typeof error === "string") {
    return error.trim() || "UnknownError";
  }

  return "UnknownError";
}

/**
 * Returns a concise immutable runtime capability summary.
 */
export function summarizeExecutionConfiguration(
  configuration: ExecutionConfiguration,
): Readonly<{
  environment: ExecutionConfigurationEnvironment;
  executionMode: ExecutionMode;
  retryEnabled: boolean;
  compensationEnabled: boolean;
  parallelExecutionEnabled: boolean;
  distributedExecutionEnabled: boolean;
  duplicateProtectionEnabled: boolean;
  distributedLockRequired: boolean;
  executionHistoryEnabled: boolean;
  payloadDiagnosticsEnabled: boolean;
  workerCount: number;
  maximumConcurrentWorkflows: number;
  maximumConcurrentSteps: number;
  concurrencyCapacity: number;
  queueCapacity: number;
}> {
  return Object.freeze({
    environment: configuration.environment,

    executionMode:
      configuration.execution.mode,

    retryEnabled:
      isRetryEnabled(configuration),

    compensationEnabled:
      isCompensationEnabled(configuration),

    parallelExecutionEnabled:
      isParallelExecutionEnabled(configuration),

    distributedExecutionEnabled:
      isDistributedExecutionEnabled(
        configuration,
      ),

    duplicateProtectionEnabled:
      isDuplicateProtectionEnabled(
        configuration,
      ),

    distributedLockRequired:
      isDistributedLockRequired(
        configuration,
      ),

    executionHistoryEnabled:
      isExecutionHistoryEnabled(
        configuration,
      ),

    payloadDiagnosticsEnabled:
      includesExecutionPayloadDiagnostics(
        configuration,
      ),

    workerCount:
      configuration.concurrency.workerCount,

    maximumConcurrentWorkflows:
      configuration.concurrency
        .maximumConcurrentWorkflows,

    maximumConcurrentSteps:
      configuration.concurrency
        .maximumConcurrentSteps,

    concurrencyCapacity:
      getExecutionConcurrencyCapacity(
        configuration,
      ),

    queueCapacity:
      configuration.concurrency.queueCapacity,
  });
}

/**
 * Returns validation errors only.
 */
export function getExecutionConfigurationErrors(
  configuration: ExecutionConfiguration,
): readonly ConfigurationValidationIssue[] {
  return validateExecutionConfiguration(
    configuration,
  ).issues.filter(
    (issue) => issue.severity === "error",
  );
}

/**
 * Returns validation warnings only.
 */
export function getExecutionConfigurationWarnings(
  configuration: ExecutionConfiguration,
): readonly ConfigurationValidationIssue[] {
  return validateExecutionConfiguration(
    configuration,
  ).issues.filter(
    (issue) => issue.severity === "warning",
  );
}

/**
 * Returns informational validation findings only.
 */
export function getExecutionConfigurationInformation(
  configuration: ExecutionConfiguration,
): readonly ConfigurationValidationIssue[] {
  return validateExecutionConfiguration(
    configuration,
  ).issues.filter(
    (issue) =>
      issue.severity === "information",
  );
}

/**
 * Exhaustiveness assertion for retry strategy calculations.
 */
function assertNeverRetryStrategy(
  strategy: never,
): never {
  throw new Error(
    `Unsupported retry strategy: ${String(
      strategy,
    )}`,
  );
}

/**
 * Extended unified API including runtime inspection and helper operations.
 */
export const ExecutionConfigurationRuntime =
  Object.freeze({
    create:
      createExecutionConfiguration,

    parse:
      parseExecutionConfiguration,

    tryParse:
      tryParseExecutionConfiguration,

    inspect:
      inspectExecutionConfiguration,

    validate:
      validateExecutionConfiguration,

    assertValid:
      assertValidExecutionConfiguration,

    update:
      updateExecutionConfiguration,

    merge:
      mergeExecutionConfiguration,

    clone:
      cloneExecutionConfiguration,

    copy:
      copyExecutionConfiguration,

    freeze:
      freezeExecutionConfiguration,

    reset:
      resetExecutionConfiguration,

    resetSections:
      resetExecutionConfigurationSections,

    getPreset:
      getExecutionConfigurationPreset,

    getSection:
      getExecutionConfigurationSection,

    pickSections:
      pickExecutionConfigurationSections,

    getSections:
      getExecutionConfigurationSections,

    isConfiguration:
      isExecutionConfiguration,

    isFrozen:
      isExecutionConfigurationFrozen,

    equals:
      areExecutionConfigurationsEqual,

    isRetryEnabled,

    isCompensationEnabled,

    isParallelExecutionEnabled,

    isDistributedExecutionEnabled,

    isDuplicateProtectionEnabled,

    isDistributedLockRequired,

    isExecutionHistoryEnabled,

    includesPayloadDiagnostics:
      includesExecutionPayloadDiagnostics,

    getConcurrencyCapacity:
      getExecutionConcurrencyCapacity,

    calculateRetryDelay,

    calculateRetryDelayWithJitter,

    applyRetryJitter,

    isRetryableError:
      isRetryableExecutionError,

    getErrorName:
      getExecutionErrorName,

    summarize:
      summarizeExecutionConfiguration,

    getErrors:
      getExecutionConfigurationErrors,

    getWarnings:
      getExecutionConfigurationWarnings,

    getInformation:
      getExecutionConfigurationInformation,
  });