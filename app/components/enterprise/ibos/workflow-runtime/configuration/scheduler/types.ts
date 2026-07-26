import type { BaseConfiguration } from "../BaseConfiguration";

/**
 * IBOS Enterprise Workflow Runtime
 * Scheduler Configuration Types
 *
 * This module defines the scheduler configuration contracts used throughout
 * the workflow runtime. It contains no operational logic and should remain
 * safe to import from any runtime layer.
 */

/* ==========================================================================
 * Enterprise scheduler constants
 * ========================================================================== */

export const SCHEDULER_CONFIGURATION_VERSION = "1.0.0" as const;

export const DEFAULT_SCHEDULER_NAME = "ibos-enterprise-scheduler" as const;

export const DEFAULT_SCHEDULER_QUEUE_NAME = "workflow-default" as const;

export const DEFAULT_DEAD_LETTER_QUEUE_NAME =
    "workflow-dead-letter" as const;

export const DEFAULT_SCHEDULER_TIME_ZONE = "UTC" as const;

export const DEFAULT_POLLING_INTERVAL_MS = 1_000;

export const DEFAULT_MINIMUM_POLLING_INTERVAL_MS = 250;

export const DEFAULT_MAXIMUM_POLLING_INTERVAL_MS = 30_000;

export const DEFAULT_POLLING_BATCH_SIZE = 100;

export const DEFAULT_QUEUE_CAPACITY = 10_000;

export const DEFAULT_MAX_QUEUE_CAPACITY = 100_000;

export const DEFAULT_MAX_CONCURRENT_DISPATCHES = 100;

export const DEFAULT_MAX_CONCURRENT_TIMERS = 10_000;

export const DEFAULT_TIMER_RESOLUTION_MS = 1_000;

export const DEFAULT_CRON_SCAN_INTERVAL_MS = 30_000;

export const DEFAULT_LEADER_LEASE_DURATION_MS = 30_000;

export const DEFAULT_LEADER_RENEWAL_INTERVAL_MS = 10_000;

export const DEFAULT_WORKER_HEARTBEAT_INTERVAL_MS = 10_000;

export const DEFAULT_WORKER_TIMEOUT_MS = 30_000;

export const DEFAULT_SHUTDOWN_TIMEOUT_MS = 30_000;

export const DEFAULT_QUEUE_DRAIN_TIMEOUT_MS = 60_000;

export const DEFAULT_SCHEDULER_HISTORY_LIMIT = 1_000;

export const DEFAULT_PRIORITY_LEVELS = 10;

export const MINIMUM_PRIORITY_VALUE = 0;

export const MAXIMUM_PRIORITY_VALUE = 100;

export const DEFAULT_PRIORITY_VALUE = 50;

/* ==========================================================================
 * Scheduler enums
 * ========================================================================== */

/**
 * Determines where and how scheduling coordination occurs.
 */
export enum SchedulerMode {
    LOCAL = "local",
    DISTRIBUTED = "distributed",
    HYBRID = "hybrid",
}

/**
 * Controls the lifecycle state of the scheduler.
 */
export enum SchedulerStatus {
    CREATED = "created",
    INITIALIZING = "initializing",
    IDLE = "idle",
    RUNNING = "running",
    PAUSED = "paused",
    DRAINING = "draining",
    STOPPING = "stopping",
    STOPPED = "stopped",
    DEGRADED = "degraded",
    FAILED = "failed",
}

/**
 * Determines how the scheduler discovers work.
 */
export enum PollingStrategy {
    FIXED = "fixed",
    ADAPTIVE = "adaptive",
    EVENT_DRIVEN = "event-driven",
    HYBRID = "hybrid",
}

/**
 * Controls how polling behaves when no work is available.
 */
export enum PollingBackoffStrategy {
    NONE = "none",
    FIXED = "fixed",
    LINEAR = "linear",
    EXPONENTIAL = "exponential",
}

/**
 * Determines how a queue selects the next eligible workflow.
 */
export enum QueueSelectionStrategy {
    FIFO = "fifo",
    LIFO = "lifo",
    PRIORITY = "priority",
    ROUND_ROBIN = "round-robin",
    WEIGHTED = "weighted",
    FAIR = "fair",
}

/**
 * Determines how workflows are dispatched to available workers.
 */
export enum DispatchStrategy {
    IMMEDIATE = "immediate",
    BATCHED = "batched",
    BALANCED = "balanced",
    AFFINITY = "affinity",
    LEAST_LOADED = "least-loaded",
}

/**
 * Defines scheduler queue behavior when capacity is reached.
 */
export enum QueueOverflowStrategy {
    REJECT = "reject",
    DROP_OLDEST = "drop-oldest",
    DROP_LOWEST_PRIORITY = "drop-lowest-priority",
    DEAD_LETTER = "dead-letter",
    BLOCK = "block",
}

/**
 * Determines how priority values are interpreted.
 */
export enum PriorityDirection {
    HIGHER_FIRST = "higher-first",
    LOWER_FIRST = "lower-first",
}

/**
 * Determines how long-waiting workflow priority changes over time.
 */
export enum PriorityAgingStrategy {
    DISABLED = "disabled",
    LINEAR = "linear",
    STEP = "step",
    EXPONENTIAL = "exponential",
}

/**
 * Defines the precision expected from scheduler timers.
 */
export enum TimerPrecision {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
}

/**
 * Determines how timer records are stored and evaluated.
 */
export enum TimerStorageMode {
    MEMORY = "memory",
    PERSISTENT = "persistent",
    HYBRID = "hybrid",
}

/**
 * Determines how expired or missed timers are handled.
 */
export enum TimerMisfireStrategy {
    FIRE_IMMEDIATELY = "fire-immediately",
    SKIP = "skip",
    RESCHEDULE = "reschedule",
    FAIL = "fail",
}

/**
 * Determines the supported cron expression resolution.
 */
export enum CronResolution {
    MINUTE = "minute",
    SECOND = "second",
}

/**
 * Determines how missed recurring schedules are handled.
 */
export enum CronMisfireStrategy {
    FIRE_ONCE = "fire-once",
    FIRE_ALL = "fire-all",
    SKIP = "skip",
    RESCHEDULE_FROM_NOW = "reschedule-from-now",
}

/**
 * Determines how scheduler shutdown is performed.
 */
export enum ShutdownStrategy {
    IMMEDIATE = "immediate",
    GRACEFUL = "graceful",
    DRAIN_QUEUE = "drain-queue",
}

/**
 * Determines how a distributed scheduler leader is elected.
 */
export enum LeaderElectionStrategy {
    DISABLED = "disabled",
    DATABASE = "database",
    REDIS = "redis",
    CONSUL = "consul",
    KUBERNETES = "kubernetes",
    CUSTOM = "custom",
}

/**
 * Controls the scheduler node's role in a distributed deployment.
 */
export enum SchedulerNodeRole {
    STANDALONE = "standalone",
    LEADER_ELIGIBLE = "leader-eligible",
    FOLLOWER_ONLY = "follower-only",
    WORKER_ONLY = "worker-only",
}

/**
 * Determines how work is partitioned across scheduler nodes.
 */
export enum PartitionStrategy {
    NONE = "none",
    HASH = "hash",
    RANGE = "range",
    ROUND_ROBIN = "round-robin",
    CUSTOM = "custom",
}

/**
 * Determines worker health and availability.
 */
export enum WorkerStatus {
    UNKNOWN = "unknown",
    STARTING = "starting",
    AVAILABLE = "available",
    BUSY = "busy",
    DRAINING = "draining",
    OFFLINE = "offline",
    UNHEALTHY = "unhealthy",
}

/**
 * Controls scheduler authorization requirements.
 */
export enum SchedulerAuthorizationMode {
    NONE = "none",
    OPTIONAL = "optional",
    REQUIRED = "required",
}

/**
 * Determines how scheduler configuration changes are applied.
 */
export enum SchedulerReloadStrategy {
    DISABLED = "disabled",
    MANUAL = "manual",
    AUTOMATIC = "automatic",
}

/**
 * Determines the scheduler environment preset.
 */
export enum SchedulerEnvironment {
    DEVELOPMENT = "development",
    TEST = "test",
    STAGING = "staging",
    PRODUCTION = "production",
}

/**
 * Defines scheduler diagnostic detail.
 */
export enum SchedulerDiagnosticLevel {
    OFF = "off",
    BASIC = "basic",
    STANDARD = "standard",
    DETAILED = "detailed",
    TRACE = "trace",
}

/**
 * Defines the result of validating scheduler configuration.
 */
export enum SchedulerValidationSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
}

/* ==========================================================================
 * Scheduler configuration section interfaces
 * ========================================================================== */

/**
 * Primary scheduler lifecycle and dispatch settings.
 */
export interface SchedulerSettings {
    enabled: boolean;
    name: string;
    mode: SchedulerMode;
    environment: SchedulerEnvironment;
    timeZone: string;
    autoStart: boolean;
    startPaused: boolean;
    allowDynamicConfiguration: boolean;
    reloadStrategy: SchedulerReloadStrategy;
    dispatchStrategy: DispatchStrategy;
    maxConcurrentDispatches: number;
    dispatchBatchSize: number;
    dispatchTimeoutMs: number;
    idleSleepMs: number;
}

/**
 * Work discovery and polling behavior.
 */
export interface SchedulerPollingSettings {
    enabled: boolean;
    strategy: PollingStrategy;
    intervalMs: number;
    minimumIntervalMs: number;
    maximumIntervalMs: number;
    batchSize: number;
    maxEmptyPollsBeforeBackoff: number;
    backoffStrategy: PollingBackoffStrategy;
    backoffMultiplier: number;
    jitterEnabled: boolean;
    jitterRatio: number;
    resetBackoffWhenWorkFound: boolean;
    immediatePollOnStart: boolean;
}

/**
 * Queue storage, selection, and capacity behavior.
 */
export interface SchedulerQueueSettings {
    enabled: boolean;
    defaultQueueName: string;
    deadLetterQueueName: string;
    selectionStrategy: QueueSelectionStrategy;
    overflowStrategy: QueueOverflowStrategy;
    capacity: number;
    maximumCapacity: number;
    allowDynamicQueues: boolean;
    maximumQueueCount: number;
    dequeueBatchSize: number;
    reservationTimeoutMs: number;
    visibilityTimeoutMs: number;
    retainCompletedItemsMs: number;
    retainFailedItemsMs: number;
    deadLetterEnabled: boolean;
    maxDeliveryAttempts: number;
}

/**
 * Priority ordering and starvation prevention.
 */
export interface SchedulerPrioritySettings {
    enabled: boolean;
    direction: PriorityDirection;
    defaultPriority: number;
    minimumPriority: number;
    maximumPriority: number;
    priorityLevels: number;
    agingStrategy: PriorityAgingStrategy;
    agingIntervalMs: number;
    agingIncrement: number;
    starvationThresholdMs: number;
    preservePriorityOnRetry: boolean;
}

/**
 * Delayed execution and timer behavior.
 */
export interface SchedulerTimerSettings {
    enabled: boolean;
    precision: TimerPrecision;
    storageMode: TimerStorageMode;
    resolutionMs: number;
    scanIntervalMs: number;
    batchSize: number;
    maxConcurrentTimers: number;
    misfireStrategy: TimerMisfireStrategy;
    misfireGracePeriodMs: number;
    persistentTimersRequired: boolean;
    deleteCompletedTimers: boolean;
    completedTimerRetentionMs: number;
}

/**
 * Recurring and cron-based scheduling behavior.
 */
export interface SchedulerCronSettings {
    enabled: boolean;
    resolution: CronResolution;
    scanIntervalMs: number;
    defaultTimeZone: string;
    allowSecondsField: boolean;
    allowYearField: boolean;
    validateExpressionsOnRegistration: boolean;
    maximumRegisteredSchedules: number;
    maximumConcurrentTriggers: number;
    misfireStrategy: CronMisfireStrategy;
    misfireGracePeriodMs: number;
    catchUpLimit: number;
    preventConcurrentExecution: boolean;
}

/**
 * Distributed scheduler coordination.
 */
export interface SchedulerDistributionSettings {
    enabled: boolean;
    nodeId: string;
    nodeRole: SchedulerNodeRole;
    clusterName: string;
    leaderElectionStrategy: LeaderElectionStrategy;
    leaderLeaseDurationMs: number;
    leaderRenewalIntervalMs: number;
    leaderAcquisitionTimeoutMs: number;
    partitionStrategy: PartitionStrategy;
    partitionCount: number;
    assignedPartitions: readonly number[];
    workerHeartbeatIntervalMs: number;
    workerTimeoutMs: number;
    requireLeaderForDispatch: boolean;
    allowFollowerScheduling: boolean;
    rebalanceOnNodeChange: boolean;
    rebalanceIntervalMs: number;
}

/**
 * Scheduler shutdown and draining behavior.
 */
export interface SchedulerShutdownSettings {
    strategy: ShutdownStrategy;
    timeoutMs: number;
    queueDrainTimeoutMs: number;
    waitForActiveDispatches: boolean;
    waitForActiveTimers: boolean;
    waitForLeaderRelease: boolean;
    rejectNewWorkDuringShutdown: boolean;
    persistPendingWork: boolean;
    forceStopOnTimeout: boolean;
}

/**
 * Scheduler diagnostics and observability behavior.
 */
export interface SchedulerDiagnosticsSettings {
    enabled: boolean;
    level: SchedulerDiagnosticLevel;
    collectMetrics: boolean;
    collectQueueMetrics: boolean;
    collectPollingMetrics: boolean;
    collectTimerMetrics: boolean;
    collectCronMetrics: boolean;
    collectWorkerMetrics: boolean;
    collectDistributionMetrics: boolean;
    historyEnabled: boolean;
    historyLimit: number;
    slowDispatchThresholdMs: number;
    slowPollThresholdMs: number;
    logConfigurationOnStart: boolean;
    exposeHealthStatus: boolean;
}

/**
 * Scheduler security and access-control behavior.
 */
export interface SchedulerSecuritySettings {
    enabled: boolean;
    authorizationMode: SchedulerAuthorizationMode;
    requireAuthenticatedRegistration: boolean;
    requireAuthenticatedCancellation: boolean;
    requireAuthenticatedInspection: boolean;
    allowedRegistrationRoles: readonly string[];
    allowedAdministrationRoles: readonly string[];
    allowCrossTenantScheduling: boolean;
    tenantIsolationEnabled: boolean;
    validateWorkflowOwnership: boolean;
    auditAdministrativeActions: boolean;
}

/* ==========================================================================
 * Root scheduler configuration
 * ========================================================================== */

/**
 * Complete scheduler configuration contract.
 */
export interface SchedulerConfiguration extends BaseConfiguration {
    scheduler: SchedulerSettings;
    polling: SchedulerPollingSettings;
    queues: SchedulerQueueSettings;
    priority: SchedulerPrioritySettings;
    timers: SchedulerTimerSettings;
    cron: SchedulerCronSettings;
    distribution: SchedulerDistributionSettings;
    shutdown: SchedulerShutdownSettings;
    diagnostics: SchedulerDiagnosticsSettings;
    security: SchedulerSecuritySettings;
}

/**
 * Valid top-level configuration section names.
 */
export type SchedulerConfigurationSection =
    keyof Pick<
        SchedulerConfiguration,
        | "scheduler"
        | "polling"
        | "queues"
        | "priority"
        | "timers"
        | "cron"
        | "distribution"
        | "shutdown"
        | "diagnostics"
        | "security"
    >;

/**
 * Maps each scheduler section name to its configuration type.
 */
export interface SchedulerConfigurationSectionMap {
    scheduler: SchedulerSettings;
    polling: SchedulerPollingSettings;
    queues: SchedulerQueueSettings;
    priority: SchedulerPrioritySettings;
    timers: SchedulerTimerSettings;
    cron: SchedulerCronSettings;
    distribution: SchedulerDistributionSettings;
    shutdown: SchedulerShutdownSettings;
    diagnostics: SchedulerDiagnosticsSettings;
    security: SchedulerSecuritySettings;
}

/**
 * Returns the configuration value associated with a section name.
 */
export type SchedulerConfigurationSectionValue<
    TSection extends SchedulerConfigurationSection,
> = SchedulerConfigurationSectionMap[TSection];

/**
 * Partial scheduler configuration accepted by factory and merge operations.
 */
export type SchedulerConfigurationInput = Partial<
    Omit<
        SchedulerConfiguration,
        SchedulerConfigurationSection
    >
> & {
    scheduler?: Partial<SchedulerSettings>;
    polling?: Partial<SchedulerPollingSettings>;
    queues?: Partial<SchedulerQueueSettings>;
    priority?: Partial<SchedulerPrioritySettings>;
    timers?: Partial<SchedulerTimerSettings>;
    cron?: Partial<SchedulerCronSettings>;
    distribution?: Partial<SchedulerDistributionSettings>;
    shutdown?: Partial<SchedulerShutdownSettings>;
    diagnostics?: Partial<SchedulerDiagnosticsSettings>;
    security?: Partial<SchedulerSecuritySettings>;
};

/**
 * Deeply readonly scheduler configuration.
 */
export type ReadonlySchedulerConfiguration = {
    readonly [TKey in keyof SchedulerConfiguration]:
        SchedulerConfiguration[TKey] extends readonly unknown[]
            ? Readonly<SchedulerConfiguration[TKey]>
            : SchedulerConfiguration[TKey] extends object
              ? Readonly<SchedulerConfiguration[TKey]>
              : SchedulerConfiguration[TKey];
};

/* ==========================================================================
 * Queue contracts
 * ========================================================================== */

/**
 * Identifies a scheduler queue.
 */
export interface SchedulerQueueDescriptor {
    name: string;
    displayName?: string;
    description?: string;
    enabled: boolean;
    capacity?: number;
    weight?: number;
    defaultPriority?: number;
    tenantId?: string;
    tags?: string[];
}

/**
 * Queue statistics exposed by scheduler inspection APIs.
 */
export interface SchedulerQueueStatistics {
    queueName: string;
    waitingCount: number;
    reservedCount: number;
    runningCount: number;
    completedCount: number;
    failedCount: number;
    deadLetterCount: number;
    oldestWaitingAgeMs: number;
    averageWaitingTimeMs: number;
    averageDispatchTimeMs: number;
    capacity: number;
    utilizationRatio: number;
}

/**
 * Work item submitted to the scheduler.
 */
export interface SchedulerWorkItem {
    id: string;
    workflowId: string;
    workflowType?: string;
    workflowVersion?: string;
    queueName: string;
    priority: number;
    tenantId?: string;
    partitionKey?: string;
    affinityKey?: string;
    scheduledAt: string;
    availableAt: string;
    expiresAt?: string;
    attempt: number;
    maximumAttempts: number;
    payload?: unknown;
    metadata?: Record<string, unknown>;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

/**
 * A reservation made while a worker claims scheduled work.
 */
export interface SchedulerWorkReservation {
    reservationId: string;
    workItemId: string;
    workerId: string;
    queueName: string;
    reservedAt: string;
    expiresAt: string;
    deliveryAttempt: number;
}

/* ==========================================================================
 * Timer and cron contracts
 * ========================================================================== */

/**
 * Scheduler timer definition.
 */
export interface SchedulerTimerDefinition {
    timerId: string;
    workflowId: string;
    timerName?: string;
    fireAt: string;
    timeZone?: string;
    priority?: number;
    queueName?: string;
    tenantId?: string;
    payload?: unknown;
    metadata?: Record<string, unknown>;
}

/**
 * Recurring scheduler definition.
 */
export interface SchedulerCronDefinition {
    scheduleId: string;
    workflowId: string;
    expression: string;
    timeZone?: string;
    enabled: boolean;
    startAt?: string;
    endAt?: string;
    maximumOccurrences?: number;
    queueName?: string;
    priority?: number;
    tenantId?: string;
    payload?: unknown;
    metadata?: Record<string, unknown>;
}

/**
 * Computed cron schedule state.
 */
export interface SchedulerCronState {
    scheduleId: string;
    previousFireAt?: string;
    nextFireAt?: string;
    occurrenceCount: number;
    misfireCount: number;
    lastEvaluationAt?: string;
}

/* ==========================================================================
 * Distributed scheduler contracts
 * ========================================================================== */

/**
 * Scheduler node registration.
 */
export interface SchedulerNode {
    nodeId: string;
    clusterName: string;
    role: SchedulerNodeRole;
    status: WorkerStatus;
    host?: string;
    processId?: number;
    version?: string;
    startedAt: string;
    lastHeartbeatAt: string;
    activeDispatches: number;
    maximumDispatches: number;
    assignedPartitions: readonly number[];
    metadata?: Record<string, unknown>;
}

/**
 * Current distributed scheduler leadership information.
 */
export interface SchedulerLeaderLease {
    clusterName: string;
    leaderNodeId: string;
    acquiredAt: string;
    renewedAt: string;
    expiresAt: string;
    fencingToken?: string;
}

/**
 * Scheduler partition assignment.
 */
export interface SchedulerPartitionAssignment {
    partitionId: number;
    nodeId: string;
    assignedAt: string;
    leaseExpiresAt?: string;
}

/* ==========================================================================
 * Scheduler lifecycle and runtime inspection contracts
 * ========================================================================== */

/**
 * Scheduler lifecycle state.
 */
export interface SchedulerState {
    status: SchedulerStatus;
    startedAt?: string;
    pausedAt?: string;
    stoppedAt?: string;
    lastPollAt?: string;
    lastDispatchAt?: string;
    activeDispatches: number;
    activeTimers: number;
    registeredCronSchedules: number;
    isLeader: boolean;
    leaderNodeId?: string;
    nodeId?: string;
    failureReason?: string;
}

/**
 * High-level scheduler runtime snapshot.
 */
export interface SchedulerRuntimeSnapshot {
    capturedAt: string;
    state: SchedulerState;
    queueCount: number;
    waitingWorkCount: number;
    activeWorkCount: number;
    delayedWorkCount: number;
    deadLetterCount: number;
    workerCount: number;
    healthyWorkerCount: number;
    timerCount: number;
    cronScheduleCount: number;
    pollingIntervalMs: number;
    configurationVersion?: string;
}

/**
 * Scheduler health-check result.
 */
export interface SchedulerHealthStatus {
    healthy: boolean;
    status: SchedulerStatus;
    checkedAt: string;
    message?: string;
    warnings: string[];
    failures: string[];
    details?: Record<string, unknown>;
}

/* ==========================================================================
 * Validation contracts
 * ========================================================================== */

/**
 * A scheduler configuration validation issue.
 */
export interface SchedulerValidationIssue {
    path: string;
    message: string;
    severity: SchedulerValidationSeverity;
    code?: string;
    value?: unknown;
    expected?: unknown;
}

/**
 * Complete scheduler validation result.
 */
export interface SchedulerValidationResult {
    valid: boolean;
    errors: SchedulerValidationIssue[];
    warnings: SchedulerValidationIssue[];
    information: SchedulerValidationIssue[];
}

/**
 * Options used by the scheduler configuration validator.
 */
export interface SchedulerValidationOptions {
    strict?: boolean;
    validateCrossSectionRules?: boolean;
    validateEnvironmentRules?: boolean;
    throwOnError?: boolean;
}

/* ==========================================================================
 * Configuration factory and lifecycle contracts
 * ========================================================================== */

/**
 * Options used while creating scheduler configuration.
 */
export interface CreateSchedulerConfigurationOptions {
    environment?: SchedulerEnvironment;
    overrides?: SchedulerConfigurationInput;
    validate?: boolean;
    freeze?: boolean;
}

/**
 * Options used while merging scheduler configuration.
 */
export interface MergeSchedulerConfigurationOptions {
    validate?: boolean;
    freeze?: boolean;
    replaceArrays?: boolean;
}

/**
 * A scheduler configuration change record.
 */
export interface SchedulerConfigurationChange {
    section: SchedulerConfigurationSection;
    path: string;
    previousValue: unknown;
    nextValue: unknown;
    changedAt: string;
    changedBy?: string;
    reason?: string;
}

/**
 * Scheduler configuration revision.
 */
export interface SchedulerConfigurationRevision {
    revision: number;
    configuration: ReadonlySchedulerConfiguration;
    changes: SchedulerConfigurationChange[];
    createdAt: string;
    createdBy?: string;
}

/* ==========================================================================
 * Supported value collections
 * ========================================================================== */

export const SUPPORTED_SCHEDULER_MODES: readonly SchedulerMode[] =
    Object.freeze(Object.values(SchedulerMode));

export const SUPPORTED_SCHEDULER_STATUSES: readonly SchedulerStatus[] =
    Object.freeze(Object.values(SchedulerStatus));

export const SUPPORTED_POLLING_STRATEGIES: readonly PollingStrategy[] =
    Object.freeze(Object.values(PollingStrategy));

export const SUPPORTED_POLLING_BACKOFF_STRATEGIES:
    readonly PollingBackoffStrategy[] = Object.freeze(
        Object.values(PollingBackoffStrategy),
    );

export const SUPPORTED_QUEUE_SELECTION_STRATEGIES:
    readonly QueueSelectionStrategy[] = Object.freeze(
        Object.values(QueueSelectionStrategy),
    );

export const SUPPORTED_DISPATCH_STRATEGIES: readonly DispatchStrategy[] =
    Object.freeze(Object.values(DispatchStrategy));

export const SUPPORTED_QUEUE_OVERFLOW_STRATEGIES:
    readonly QueueOverflowStrategy[] = Object.freeze(
        Object.values(QueueOverflowStrategy),
    );

export const SUPPORTED_PRIORITY_DIRECTIONS: readonly PriorityDirection[] =
    Object.freeze(Object.values(PriorityDirection));

export const SUPPORTED_PRIORITY_AGING_STRATEGIES:
    readonly PriorityAgingStrategy[] = Object.freeze(
        Object.values(PriorityAgingStrategy),
    );

export const SUPPORTED_TIMER_PRECISIONS: readonly TimerPrecision[] =
    Object.freeze(Object.values(TimerPrecision));

export const SUPPORTED_TIMER_STORAGE_MODES: readonly TimerStorageMode[] =
    Object.freeze(Object.values(TimerStorageMode));

export const SUPPORTED_TIMER_MISFIRE_STRATEGIES:
    readonly TimerMisfireStrategy[] = Object.freeze(
        Object.values(TimerMisfireStrategy),
    );

export const SUPPORTED_CRON_RESOLUTIONS: readonly CronResolution[] =
    Object.freeze(Object.values(CronResolution));

export const SUPPORTED_CRON_MISFIRE_STRATEGIES:
    readonly CronMisfireStrategy[] = Object.freeze(
        Object.values(CronMisfireStrategy),
    );

export const SUPPORTED_SHUTDOWN_STRATEGIES: readonly ShutdownStrategy[] =
    Object.freeze(Object.values(ShutdownStrategy));

export const SUPPORTED_LEADER_ELECTION_STRATEGIES:
    readonly LeaderElectionStrategy[] = Object.freeze(
        Object.values(LeaderElectionStrategy),
    );

export const SUPPORTED_SCHEDULER_NODE_ROLES:
    readonly SchedulerNodeRole[] = Object.freeze(
        Object.values(SchedulerNodeRole),
    );

export const SUPPORTED_PARTITION_STRATEGIES:
    readonly PartitionStrategy[] = Object.freeze(
        Object.values(PartitionStrategy),
    );

export const SUPPORTED_WORKER_STATUSES: readonly WorkerStatus[] =
    Object.freeze(Object.values(WorkerStatus));

export const SUPPORTED_SCHEDULER_AUTHORIZATION_MODES:
    readonly SchedulerAuthorizationMode[] = Object.freeze(
        Object.values(SchedulerAuthorizationMode),
    );

export const SUPPORTED_SCHEDULER_RELOAD_STRATEGIES:
    readonly SchedulerReloadStrategy[] = Object.freeze(
        Object.values(SchedulerReloadStrategy),
    );

export const SUPPORTED_SCHEDULER_ENVIRONMENTS:
    readonly SchedulerEnvironment[] = Object.freeze(
        Object.values(SchedulerEnvironment),
    );

export const SUPPORTED_SCHEDULER_DIAGNOSTIC_LEVELS:
    readonly SchedulerDiagnosticLevel[] = Object.freeze(
        Object.values(SchedulerDiagnosticLevel),
    );

export const SCHEDULER_CONFIGURATION_SECTIONS:
    readonly SchedulerConfigurationSection[] = Object.freeze([
        "scheduler",
        "polling",
        "queues",
        "priority",
        "timers",
        "cron",
        "distribution",
        "shutdown",
        "diagnostics",
        "security",
    ]);

/* ==========================================================================
 * Utility types
 * ========================================================================== */

/**
 * Makes all properties in a type recursively optional.
 */
export type SchedulerDeepPartial<TValue> =
    TValue extends (...arguments_: never[]) => unknown
        ? TValue
        : TValue extends readonly (infer TItem)[]
          ? readonly SchedulerDeepPartial<TItem>[]
          : TValue extends object
            ? {
                  [TKey in keyof TValue]?: SchedulerDeepPartial<
                      TValue[TKey]
                  >;
              }
            : TValue;

/**
 * Makes all properties in a type recursively readonly.
 */
export type SchedulerDeepReadonly<TValue> =
    TValue extends (...arguments_: never[]) => unknown
        ? TValue
        : TValue extends readonly (infer TItem)[]
          ? readonly SchedulerDeepReadonly<TItem>[]
          : TValue extends object
            ? {
                  readonly [TKey in keyof TValue]:
                      SchedulerDeepReadonly<TValue[TKey]>;
              }
            : TValue;

/**
 * Mutable representation of a readonly scheduler type.
 */
export type SchedulerMutable<TValue> = {
    -readonly [TKey in keyof TValue]: TValue[TKey] extends object
        ? SchedulerMutable<TValue[TKey]>
        : TValue[TKey];
};

/**
 * A complete deeply partial scheduler configuration override.
 */
export type SchedulerConfigurationOverride =
    SchedulerDeepPartial<SchedulerConfiguration>;

/**
 * A complete deeply readonly scheduler configuration snapshot.
 */
export type SchedulerConfigurationSnapshot =
    SchedulerDeepReadonly<SchedulerConfiguration>;