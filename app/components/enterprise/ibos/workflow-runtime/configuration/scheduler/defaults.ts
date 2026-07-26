import {
    cloneConfigurationValue,
    freezeConfigurationValue,
    mergeConfigurationValues,
} from "../ConfigurationTypes";

import {
    createDevelopmentBaseConfiguration,
    createProductionBaseConfiguration,
    createStagingBaseConfiguration,
    createTestingBaseConfiguration,
} from "../BaseConfiguration";

import {
    CronMisfireStrategy,
    CronResolution,
    DEFAULT_CRON_SCAN_INTERVAL_MS,
    DEFAULT_DEAD_LETTER_QUEUE_NAME,
    DEFAULT_LEADER_LEASE_DURATION_MS,
    DEFAULT_LEADER_RENEWAL_INTERVAL_MS,
    DEFAULT_MAX_CONCURRENT_DISPATCHES,
    DEFAULT_MAX_CONCURRENT_TIMERS,
    DEFAULT_MAX_QUEUE_CAPACITY,
    DEFAULT_MINIMUM_POLLING_INTERVAL_MS,
    DEFAULT_MAXIMUM_POLLING_INTERVAL_MS,
    DEFAULT_POLLING_BATCH_SIZE,
    DEFAULT_POLLING_INTERVAL_MS,
    DEFAULT_PRIORITY_LEVELS,
    DEFAULT_PRIORITY_VALUE,
    DEFAULT_QUEUE_CAPACITY,
    DEFAULT_QUEUE_DRAIN_TIMEOUT_MS,
    DEFAULT_SCHEDULER_HISTORY_LIMIT,
    DEFAULT_SCHEDULER_NAME,
    DEFAULT_SCHEDULER_QUEUE_NAME,
    DEFAULT_SCHEDULER_TIME_ZONE,
    DEFAULT_SHUTDOWN_TIMEOUT_MS,
    DEFAULT_TIMER_RESOLUTION_MS,
    DEFAULT_WORKER_HEARTBEAT_INTERVAL_MS,
    DEFAULT_WORKER_TIMEOUT_MS,
    DispatchStrategy,
    LeaderElectionStrategy,
    MAXIMUM_PRIORITY_VALUE,
    MINIMUM_PRIORITY_VALUE,
    PartitionStrategy,
    PollingBackoffStrategy,
    PollingStrategy,
    PriorityAgingStrategy,
    PriorityDirection,
    QueueOverflowStrategy,
    QueueSelectionStrategy,
    SchedulerAuthorizationMode,
    SchedulerConfiguration,
    SchedulerConfigurationInput,
    SchedulerDiagnosticLevel,
    SchedulerEnvironment,
    SchedulerMode,
    SchedulerNodeRole,
    SchedulerReloadStrategy,
    ShutdownStrategy,
    TimerMisfireStrategy,
    TimerPrecision,
    TimerStorageMode,
} from "./types";

/**
 * IBOS Enterprise Operating System
 * Enterprise Workflow Runtime
 *
 * Scheduler Configuration Defaults
 *
 * Defines production-safe scheduler defaults and environment-specific
 * scheduler presets.
 */

/* ==========================================================================
 * Internal helpers
 * ========================================================================== */

/**
 * Converts the scheduler environment enum into the environment value used by
 * the shared BaseConfiguration contract.
 */
function toBaseConfigurationEnvironment(
    environment: SchedulerEnvironment,
): "development" | "testing" | "staging" | "production" {
    switch (environment) {
        case SchedulerEnvironment.DEVELOPMENT:
            return "development";

        case SchedulerEnvironment.TEST:
            return "testing";

        case SchedulerEnvironment.STAGING:
            return "staging";

        case SchedulerEnvironment.PRODUCTION:
            return "production";

        default:
            return "production";
    }
}

/**
 * Creates the shared base configuration for a scheduler environment.
 */
function createSchedulerBaseConfiguration(
    environment: SchedulerEnvironment,
) {
    switch (environment) {
        case SchedulerEnvironment.DEVELOPMENT:
            return createDevelopmentBaseConfiguration({
                id: "ibos-workflow-scheduler-development",
                name: "IBOS Workflow Scheduler",
                version: "1.0.0",
                enabled: true,
                environment:
                    toBaseConfigurationEnvironment(environment),
                metadata: {
                    description:
                        "Development configuration for the IBOS Enterprise Workflow Scheduler.",
                    tags: [
                        "ibos",
                        "workflow-runtime",
                        "scheduler",
                        "development",
                    ],
                },
            });

        case SchedulerEnvironment.TEST:
            return createTestingBaseConfiguration({
                id: "ibos-workflow-scheduler-testing",
                name: "IBOS Workflow Scheduler",
                version: "1.0.0",
                enabled: true,
                environment:
                    toBaseConfigurationEnvironment(environment),
                metadata: {
                    description:
                        "Testing configuration for the IBOS Enterprise Workflow Scheduler.",
                    tags: [
                        "ibos",
                        "workflow-runtime",
                        "scheduler",
                        "testing",
                    ],
                },
            });

        case SchedulerEnvironment.STAGING:
            return createStagingBaseConfiguration({
                id: "ibos-workflow-scheduler-staging",
                name: "IBOS Workflow Scheduler",
                version: "1.0.0",
                enabled: true,
                environment:
                    toBaseConfigurationEnvironment(environment),
                metadata: {
                    description:
                        "Staging configuration for the IBOS Enterprise Workflow Scheduler.",
                    tags: [
                        "ibos",
                        "workflow-runtime",
                        "scheduler",
                        "staging",
                    ],
                },
            });

        case SchedulerEnvironment.PRODUCTION:
        default:
            return createProductionBaseConfiguration({
                id: "ibos-workflow-scheduler-production",
                name: "IBOS Workflow Scheduler",
                version: "1.0.0",
                enabled: true,
                environment:
                    toBaseConfigurationEnvironment(environment),
                metadata: {
                    description:
                        "Production configuration for the IBOS Enterprise Workflow Scheduler.",
                    tags: [
                        "ibos",
                        "workflow-runtime",
                        "scheduler",
                        "production",
                    ],
                },
            });
    }
}

/**
 * Creates the common scheduler configuration used as the foundation for all
 * environment presets.
 */
function createCommonSchedulerConfiguration(
    environment: SchedulerEnvironment,
): SchedulerConfiguration {
    const baseConfiguration =
        createSchedulerBaseConfiguration(environment);

    return {
        ...cloneConfigurationValue(baseConfiguration),

        scheduler: {
            enabled: true,
            name: DEFAULT_SCHEDULER_NAME,
            mode: SchedulerMode.LOCAL,
            environment,
            timeZone: DEFAULT_SCHEDULER_TIME_ZONE,
            autoStart: true,
            startPaused: false,
            allowDynamicConfiguration: false,
            reloadStrategy: SchedulerReloadStrategy.MANUAL,
            dispatchStrategy: DispatchStrategy.BALANCED,
            maxConcurrentDispatches:
                DEFAULT_MAX_CONCURRENT_DISPATCHES,
            dispatchBatchSize: 25,
            dispatchTimeoutMs: 30_000,
            idleSleepMs: 250,
        },

        polling: {
            enabled: true,
            strategy: PollingStrategy.ADAPTIVE,
            intervalMs: DEFAULT_POLLING_INTERVAL_MS,
            minimumIntervalMs:
                DEFAULT_MINIMUM_POLLING_INTERVAL_MS,
            maximumIntervalMs:
                DEFAULT_MAXIMUM_POLLING_INTERVAL_MS,
            batchSize: DEFAULT_POLLING_BATCH_SIZE,
            maxEmptyPollsBeforeBackoff: 5,
            backoffStrategy:
                PollingBackoffStrategy.EXPONENTIAL,
            backoffMultiplier: 2,
            jitterEnabled: true,
            jitterRatio: 0.1,
            resetBackoffWhenWorkFound: true,
            immediatePollOnStart: true,
        },

        queues: {
            enabled: true,
            defaultQueueName: DEFAULT_SCHEDULER_QUEUE_NAME,
            deadLetterQueueName:
                DEFAULT_DEAD_LETTER_QUEUE_NAME,
            selectionStrategy:
                QueueSelectionStrategy.PRIORITY,
            overflowStrategy:
                QueueOverflowStrategy.DEAD_LETTER,
            capacity: DEFAULT_QUEUE_CAPACITY,
            maximumCapacity: DEFAULT_MAX_QUEUE_CAPACITY,
            allowDynamicQueues: true,
            maximumQueueCount: 1_000,
            dequeueBatchSize: 100,
            reservationTimeoutMs: 30_000,
            visibilityTimeoutMs: 60_000,
            retainCompletedItemsMs: 86_400_000,
            retainFailedItemsMs: 604_800_000,
            deadLetterEnabled: true,
            maxDeliveryAttempts: 5,
        },

        priority: {
            enabled: true,
            direction: PriorityDirection.HIGHER_FIRST,
            defaultPriority: DEFAULT_PRIORITY_VALUE,
            minimumPriority: MINIMUM_PRIORITY_VALUE,
            maximumPriority: MAXIMUM_PRIORITY_VALUE,
            priorityLevels: DEFAULT_PRIORITY_LEVELS,
            agingStrategy: PriorityAgingStrategy.LINEAR,
            agingIntervalMs: 60_000,
            agingIncrement: 1,
            starvationThresholdMs: 900_000,
            preservePriorityOnRetry: true,
        },

        timers: {
            enabled: true,
            precision: TimerPrecision.NORMAL,
            storageMode: TimerStorageMode.PERSISTENT,
            resolutionMs: DEFAULT_TIMER_RESOLUTION_MS,
            scanIntervalMs: 1_000,
            batchSize: 500,
            maxConcurrentTimers:
                DEFAULT_MAX_CONCURRENT_TIMERS,
            misfireStrategy:
                TimerMisfireStrategy.FIRE_IMMEDIATELY,
            misfireGracePeriodMs: 60_000,
            persistentTimersRequired: true,
            deleteCompletedTimers: false,
            completedTimerRetentionMs: 86_400_000,
        },

        cron: {
            enabled: true,
            resolution: CronResolution.MINUTE,
            scanIntervalMs: DEFAULT_CRON_SCAN_INTERVAL_MS,
            defaultTimeZone: DEFAULT_SCHEDULER_TIME_ZONE,
            allowSecondsField: false,
            allowYearField: false,
            validateExpressionsOnRegistration: true,
            maximumRegisteredSchedules: 100_000,
            maximumConcurrentTriggers: 100,
            misfireStrategy: CronMisfireStrategy.FIRE_ONCE,
            misfireGracePeriodMs: 300_000,
            catchUpLimit: 10,
            preventConcurrentExecution: true,
        },

        distribution: {
            enabled: false,
            nodeId: "scheduler-node-local",
            nodeRole: SchedulerNodeRole.STANDALONE,
            clusterName: "ibos-workflow-runtime",
            leaderElectionStrategy:
                LeaderElectionStrategy.DISABLED,
            leaderLeaseDurationMs:
                DEFAULT_LEADER_LEASE_DURATION_MS,
            leaderRenewalIntervalMs:
                DEFAULT_LEADER_RENEWAL_INTERVAL_MS,
            leaderAcquisitionTimeoutMs: 30_000,
            partitionStrategy: PartitionStrategy.NONE,
            partitionCount: 1,
            assignedPartitions: [0],
            workerHeartbeatIntervalMs:
                DEFAULT_WORKER_HEARTBEAT_INTERVAL_MS,
            workerTimeoutMs: DEFAULT_WORKER_TIMEOUT_MS,
            requireLeaderForDispatch: false,
            allowFollowerScheduling: false,
            rebalanceOnNodeChange: true,
            rebalanceIntervalMs: 30_000,
        },

        shutdown: {
            strategy: ShutdownStrategy.GRACEFUL,
            timeoutMs: DEFAULT_SHUTDOWN_TIMEOUT_MS,
            queueDrainTimeoutMs:
                DEFAULT_QUEUE_DRAIN_TIMEOUT_MS,
            waitForActiveDispatches: true,
            waitForActiveTimers: true,
            waitForLeaderRelease: true,
            rejectNewWorkDuringShutdown: true,
            persistPendingWork: true,
            forceStopOnTimeout: true,
        },

        diagnostics: {
            enabled: true,
            level: SchedulerDiagnosticLevel.STANDARD,
            collectMetrics: true,
            collectQueueMetrics: true,
            collectPollingMetrics: true,
            collectTimerMetrics: true,
            collectCronMetrics: true,
            collectWorkerMetrics: true,
            collectDistributionMetrics: true,
            historyEnabled: true,
            historyLimit: DEFAULT_SCHEDULER_HISTORY_LIMIT,
            slowDispatchThresholdMs: 5_000,
            slowPollThresholdMs: 2_000,
            logConfigurationOnStart: false,
            exposeHealthStatus: true,
        },

        security: {
            enabled: true,
            authorizationMode:
                SchedulerAuthorizationMode.REQUIRED,
            requireAuthenticatedRegistration: true,
            requireAuthenticatedCancellation: true,
            requireAuthenticatedInspection: true,
            allowedRegistrationRoles: [
                "system",
                "administrator",
                "workflow-runtime",
            ],
            allowedAdministrationRoles: [
                "system",
                "administrator",
            ],
            allowCrossTenantScheduling: false,
            tenantIsolationEnabled: true,
            validateWorkflowOwnership: true,
            auditAdministrativeActions: true,
        },
    };
}

/* ==========================================================================
 * Development preset
 * ========================================================================== */

/**
 * Development scheduler configuration.
 *
 * Optimized for:
 * - fast local feedback,
 * - automatic configuration reload,
 * - detailed diagnostics,
 * - short polling intervals,
 * - relaxed authorization.
 */
export const DEVELOPMENT_SCHEDULER_CONFIGURATION =
    freezeConfigurationValue<SchedulerConfiguration>({
        ...createCommonSchedulerConfiguration(
            SchedulerEnvironment.DEVELOPMENT,
        ),

        scheduler: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.DEVELOPMENT,
            ).scheduler,
            mode: SchedulerMode.LOCAL,
            allowDynamicConfiguration: true,
            reloadStrategy: SchedulerReloadStrategy.AUTOMATIC,
            dispatchStrategy: DispatchStrategy.IMMEDIATE,
            maxConcurrentDispatches: 25,
            dispatchBatchSize: 10,
            dispatchTimeoutMs: 15_000,
            idleSleepMs: 100,
        },

        polling: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.DEVELOPMENT,
            ).polling,
            strategy: PollingStrategy.ADAPTIVE,
            intervalMs: 500,
            minimumIntervalMs: 100,
            maximumIntervalMs: 5_000,
            batchSize: 25,
            maxEmptyPollsBeforeBackoff: 3,
            jitterEnabled: false,
        },

        queues: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.DEVELOPMENT,
            ).queues,
            capacity: 2_000,
            maximumCapacity: 10_000,
            maximumQueueCount: 100,
            dequeueBatchSize: 25,
            retainCompletedItemsMs: 3_600_000,
            retainFailedItemsMs: 86_400_000,
        },

        timers: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.DEVELOPMENT,
            ).timers,
            precision: TimerPrecision.HIGH,
            storageMode: TimerStorageMode.HYBRID,
            resolutionMs: 100,
            scanIntervalMs: 250,
            batchSize: 100,
            maxConcurrentTimers: 2_000,
            persistentTimersRequired: false,
        },

        cron: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.DEVELOPMENT,
            ).cron,
            resolution: CronResolution.SECOND,
            scanIntervalMs: 1_000,
            allowSecondsField: true,
            maximumRegisteredSchedules: 5_000,
            maximumConcurrentTriggers: 25,
        },

        shutdown: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.DEVELOPMENT,
            ).shutdown,
            timeoutMs: 10_000,
            queueDrainTimeoutMs: 15_000,
        },

        diagnostics: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.DEVELOPMENT,
            ).diagnostics,
            level: SchedulerDiagnosticLevel.TRACE,
            historyLimit: 5_000,
            slowDispatchThresholdMs: 1_000,
            slowPollThresholdMs: 500,
            logConfigurationOnStart: true,
        },

        security: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.DEVELOPMENT,
            ).security,
            authorizationMode:
                SchedulerAuthorizationMode.OPTIONAL,
            requireAuthenticatedInspection: false,
            allowedRegistrationRoles: [
                "system",
                "administrator",
                "developer",
                "workflow-runtime",
            ],
            allowedAdministrationRoles: [
                "system",
                "administrator",
                "developer",
            ],
        },
    });

/* ==========================================================================
 * Testing preset
 * ========================================================================== */

/**
 * Testing scheduler configuration.
 *
 * Optimized for:
 * - deterministic execution,
 * - small queues,
 * - rapid tests,
 * - disabled jitter,
 * - in-memory scheduling.
 */
export const TEST_SCHEDULER_CONFIGURATION =
    freezeConfigurationValue<SchedulerConfiguration>({
        ...createCommonSchedulerConfiguration(
            SchedulerEnvironment.TEST,
        ),

        scheduler: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.TEST,
            ).scheduler,
            name: "ibos-test-scheduler",
            mode: SchedulerMode.LOCAL,
            autoStart: false,
            allowDynamicConfiguration: true,
            reloadStrategy: SchedulerReloadStrategy.MANUAL,
            dispatchStrategy: DispatchStrategy.IMMEDIATE,
            maxConcurrentDispatches: 5,
            dispatchBatchSize: 5,
            dispatchTimeoutMs: 5_000,
            idleSleepMs: 10,
        },

        polling: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.TEST,
            ).polling,
            strategy: PollingStrategy.FIXED,
            intervalMs: 10,
            minimumIntervalMs: 10,
            maximumIntervalMs: 10,
            batchSize: 10,
            maxEmptyPollsBeforeBackoff: 1,
            backoffStrategy: PollingBackoffStrategy.NONE,
            backoffMultiplier: 1,
            jitterEnabled: false,
            jitterRatio: 0,
        },

        queues: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.TEST,
            ).queues,
            capacity: 100,
            maximumCapacity: 1_000,
            allowDynamicQueues: true,
            maximumQueueCount: 20,
            dequeueBatchSize: 10,
            reservationTimeoutMs: 5_000,
            visibilityTimeoutMs: 10_000,
            retainCompletedItemsMs: 0,
            retainFailedItemsMs: 0,
            maxDeliveryAttempts: 3,
        },

        priority: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.TEST,
            ).priority,
            agingStrategy: PriorityAgingStrategy.DISABLED,
            agingIntervalMs: 0,
            agingIncrement: 0,
            starvationThresholdMs: 0,
        },

        timers: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.TEST,
            ).timers,
            precision: TimerPrecision.HIGH,
            storageMode: TimerStorageMode.MEMORY,
            resolutionMs: 1,
            scanIntervalMs: 1,
            batchSize: 50,
            maxConcurrentTimers: 100,
            misfireGracePeriodMs: 100,
            persistentTimersRequired: false,
            deleteCompletedTimers: true,
            completedTimerRetentionMs: 0,
        },

        cron: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.TEST,
            ).cron,
            resolution: CronResolution.SECOND,
            scanIntervalMs: 10,
            allowSecondsField: true,
            maximumRegisteredSchedules: 100,
            maximumConcurrentTriggers: 10,
            misfireGracePeriodMs: 100,
            catchUpLimit: 3,
        },

        distribution: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.TEST,
            ).distribution,
            enabled: false,
            nodeId: "scheduler-node-test",
            nodeRole: SchedulerNodeRole.STANDALONE,
            workerHeartbeatIntervalMs: 100,
            workerTimeoutMs: 500,
            rebalanceIntervalMs: 100,
        },

        shutdown: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.TEST,
            ).shutdown,
            strategy: ShutdownStrategy.IMMEDIATE,
            timeoutMs: 1_000,
            queueDrainTimeoutMs: 1_000,
            waitForActiveDispatches: false,
            waitForActiveTimers: false,
            waitForLeaderRelease: false,
            forceStopOnTimeout: true,
        },

        diagnostics: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.TEST,
            ).diagnostics,
            level: SchedulerDiagnosticLevel.TRACE,
            historyLimit: 100,
            slowDispatchThresholdMs: 100,
            slowPollThresholdMs: 100,
            logConfigurationOnStart: false,
        },

        security: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.TEST,
            ).security,
            enabled: false,
            authorizationMode:
                SchedulerAuthorizationMode.NONE,
            requireAuthenticatedRegistration: false,
            requireAuthenticatedCancellation: false,
            requireAuthenticatedInspection: false,
            allowedRegistrationRoles: [],
            allowedAdministrationRoles: [],
            tenantIsolationEnabled: false,
            validateWorkflowOwnership: false,
            auditAdministrativeActions: false,
        },
    });

/* ==========================================================================
 * Staging preset
 * ========================================================================== */

/**
 * Staging scheduler configuration.
 *
 * Closely resembles production while retaining additional diagnostics and a
 * lower scheduler capacity for controlled pre-production verification.
 */
export const STAGING_SCHEDULER_CONFIGURATION =
    freezeConfigurationValue<SchedulerConfiguration>({
        ...createCommonSchedulerConfiguration(
            SchedulerEnvironment.STAGING,
        ),

        scheduler: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.STAGING,
            ).scheduler,
            mode: SchedulerMode.HYBRID,
            allowDynamicConfiguration: true,
            reloadStrategy: SchedulerReloadStrategy.MANUAL,
            maxConcurrentDispatches: 75,
            dispatchBatchSize: 25,
        },

        polling: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.STAGING,
            ).polling,
            intervalMs: 1_000,
            minimumIntervalMs: 250,
            maximumIntervalMs: 15_000,
            batchSize: 75,
        },

        queues: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.STAGING,
            ).queues,
            capacity: 20_000,
            maximumCapacity: 100_000,
            maximumQueueCount: 2_000,
            dequeueBatchSize: 75,
        },

        timers: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.STAGING,
            ).timers,
            maxConcurrentTimers: 25_000,
            batchSize: 750,
        },

        cron: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.STAGING,
            ).cron,
            maximumRegisteredSchedules: 250_000,
            maximumConcurrentTriggers: 250,
        },

        distribution: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.STAGING,
            ).distribution,
            enabled: true,
            nodeId: "scheduler-node-staging",
            nodeRole: SchedulerNodeRole.LEADER_ELIGIBLE,
            leaderElectionStrategy:
                LeaderElectionStrategy.DATABASE,
            partitionStrategy: PartitionStrategy.HASH,
            partitionCount: 16,
            assignedPartitions: [],
            requireLeaderForDispatch: true,
            allowFollowerScheduling: false,
        },

        diagnostics: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.STAGING,
            ).diagnostics,
            level: SchedulerDiagnosticLevel.DETAILED,
            historyLimit: 10_000,
            slowDispatchThresholdMs: 3_000,
            slowPollThresholdMs: 1_000,
            logConfigurationOnStart: true,
        },
    });

/* ==========================================================================
 * Production preset
 * ========================================================================== */

/**
 * Production scheduler configuration.
 *
 * Optimized for:
 * - distributed scheduling,
 * - persistent timers,
 * - queue durability,
 * - high availability,
 * - secure multi-tenant execution.
 */
export const PRODUCTION_SCHEDULER_CONFIGURATION =
    freezeConfigurationValue<SchedulerConfiguration>({
        ...createCommonSchedulerConfiguration(
            SchedulerEnvironment.PRODUCTION,
        ),

        scheduler: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.PRODUCTION,
            ).scheduler,
            mode: SchedulerMode.DISTRIBUTED,
            allowDynamicConfiguration: false,
            reloadStrategy: SchedulerReloadStrategy.MANUAL,
            dispatchStrategy: DispatchStrategy.LEAST_LOADED,
            maxConcurrentDispatches: 250,
            dispatchBatchSize: 100,
            dispatchTimeoutMs: 60_000,
            idleSleepMs: 250,
        },

        polling: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.PRODUCTION,
            ).polling,
            strategy: PollingStrategy.HYBRID,
            intervalMs: 1_000,
            minimumIntervalMs: 250,
            maximumIntervalMs: 30_000,
            batchSize: 250,
            maxEmptyPollsBeforeBackoff: 10,
            backoffStrategy:
                PollingBackoffStrategy.EXPONENTIAL,
            backoffMultiplier: 2,
            jitterEnabled: true,
            jitterRatio: 0.15,
        },

        queues: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.PRODUCTION,
            ).queues,
            capacity: 100_000,
            maximumCapacity: 1_000_000,
            maximumQueueCount: 10_000,
            dequeueBatchSize: 250,
            reservationTimeoutMs: 60_000,
            visibilityTimeoutMs: 120_000,
            retainCompletedItemsMs: 604_800_000,
            retainFailedItemsMs: 2_592_000_000,
            maxDeliveryAttempts: 10,
        },

        priority: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.PRODUCTION,
            ).priority,
            priorityLevels: 100,
            agingIntervalMs: 60_000,
            agingIncrement: 1,
            starvationThresholdMs: 1_800_000,
        },

        timers: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.PRODUCTION,
            ).timers,
            precision: TimerPrecision.NORMAL,
            storageMode: TimerStorageMode.PERSISTENT,
            resolutionMs: 1_000,
            scanIntervalMs: 1_000,
            batchSize: 2_000,
            maxConcurrentTimers: 100_000,
            persistentTimersRequired: true,
            completedTimerRetentionMs: 604_800_000,
        },

        cron: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.PRODUCTION,
            ).cron,
            resolution: CronResolution.MINUTE,
            scanIntervalMs: 30_000,
            allowSecondsField: false,
            maximumRegisteredSchedules: 1_000_000,
            maximumConcurrentTriggers: 1_000,
            misfireGracePeriodMs: 300_000,
            catchUpLimit: 25,
        },

        distribution: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.PRODUCTION,
            ).distribution,
            enabled: true,
            nodeId: "scheduler-node-production",
            nodeRole: SchedulerNodeRole.LEADER_ELIGIBLE,
            clusterName: "ibos-production-runtime",
            leaderElectionStrategy:
                LeaderElectionStrategy.DATABASE,
            partitionStrategy: PartitionStrategy.HASH,
            partitionCount: 64,
            assignedPartitions: [],
            requireLeaderForDispatch: true,
            allowFollowerScheduling: false,
            rebalanceOnNodeChange: true,
            rebalanceIntervalMs: 15_000,
        },

        shutdown: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.PRODUCTION,
            ).shutdown,
            strategy: ShutdownStrategy.DRAIN_QUEUE,
            timeoutMs: 60_000,
            queueDrainTimeoutMs: 300_000,
            waitForActiveDispatches: true,
            waitForActiveTimers: true,
            waitForLeaderRelease: true,
            persistPendingWork: true,
            forceStopOnTimeout: true,
        },

        diagnostics: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.PRODUCTION,
            ).diagnostics,
            level: SchedulerDiagnosticLevel.STANDARD,
            historyLimit: 25_000,
            slowDispatchThresholdMs: 5_000,
            slowPollThresholdMs: 2_000,
            logConfigurationOnStart: false,
        },

        security: {
            ...createCommonSchedulerConfiguration(
                SchedulerEnvironment.PRODUCTION,
            ).security,
            enabled: true,
            authorizationMode:
                SchedulerAuthorizationMode.REQUIRED,
            requireAuthenticatedRegistration: true,
            requireAuthenticatedCancellation: true,
            requireAuthenticatedInspection: true,
            allowCrossTenantScheduling: false,
            tenantIsolationEnabled: true,
            validateWorkflowOwnership: true,
            auditAdministrativeActions: true,
        },
    });

/* ==========================================================================
 * Default alias
 * ========================================================================== */

/**
 * The default scheduler configuration is the production-safe preset.
 */
export const DEFAULT_SCHEDULER_CONFIGURATION =
    PRODUCTION_SCHEDULER_CONFIGURATION;

/* ==========================================================================
 * Environment preset map
 * ========================================================================== */

export const SCHEDULER_CONFIGURATION_PRESETS = Object.freeze({
    [SchedulerEnvironment.DEVELOPMENT]:
        DEVELOPMENT_SCHEDULER_CONFIGURATION,

    [SchedulerEnvironment.TEST]:
        TEST_SCHEDULER_CONFIGURATION,

    [SchedulerEnvironment.STAGING]:
        STAGING_SCHEDULER_CONFIGURATION,

    [SchedulerEnvironment.PRODUCTION]:
        PRODUCTION_SCHEDULER_CONFIGURATION,
});

/* ==========================================================================
 * Public default helpers
 * ========================================================================== */

/**
 * Returns an immutable scheduler preset for an environment.
 */
export function getSchedulerConfigurationPreset(
    environment: SchedulerEnvironment,
): Readonly<SchedulerConfiguration> {
    return SCHEDULER_CONFIGURATION_PRESETS[environment];
}

/**
 * Creates a mutable deep clone of the default production configuration.
 */
export function cloneDefaultSchedulerConfiguration():
    SchedulerConfiguration {
    return cloneConfigurationValue(
        DEFAULT_SCHEDULER_CONFIGURATION,
    );
}

/**
 * Creates a mutable deep clone of a scheduler environment preset.
 */
export function cloneSchedulerConfigurationPreset(
    environment: SchedulerEnvironment,
): SchedulerConfiguration {
    return cloneConfigurationValue(
        getSchedulerConfigurationPreset(environment),
    );
}

/**
 * Creates scheduler configuration for the requested environment.
 */
export function createSchedulerConfigurationForEnvironment(
    environment: SchedulerEnvironment,
    overrides?: SchedulerConfigurationInput,
): SchedulerConfiguration {
    const preset =
        cloneSchedulerConfigurationPreset(environment);

    if (!overrides) {
        return preset;
    }

    return mergeConfigurationValues(
        preset,
        overrides,
    ) as SchedulerConfiguration;
}

/**
 * Creates a scheduler configuration using production defaults.
 */
export function createDefaultSchedulerConfiguration(
    overrides?: SchedulerConfigurationInput,
): SchedulerConfiguration {
    return createSchedulerConfigurationForEnvironment(
        SchedulerEnvironment.PRODUCTION,
        overrides,
    );
}

/**
 * Creates an immutable scheduler configuration for an environment.
 */
export function createFrozenSchedulerConfigurationForEnvironment(
    environment: SchedulerEnvironment,
    overrides?: SchedulerConfigurationInput,
): Readonly<SchedulerConfiguration> {
    return freezeConfigurationValue(
        createSchedulerConfigurationForEnvironment(
            environment,
            overrides,
        ),
    );
}

/**
 * Determines whether a preset exists for an environment.
 */
export function hasSchedulerConfigurationPreset(
    environment: string,
): environment is SchedulerEnvironment {
    return Object.values(SchedulerEnvironment).includes(
        environment as SchedulerEnvironment,
    );
}