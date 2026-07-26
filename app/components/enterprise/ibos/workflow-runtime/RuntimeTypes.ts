/**
 * ============================================================
 * IBOS Enterprise Operating System (IBOS-EOS)
 * Workflow Runtime
 * Runtime Types
 *
 * Version: 1.0
 * ============================================================
 */

export type WorkflowId = string;
export type WorkflowInstanceId = string;
export type WorkflowExecutionId = string;
export type WorkflowStepId = string;
export type CorrelationId = string;
export type UserId = string;
export type EngineId = string;

export enum WorkflowStatus {
  Draft = "draft",
  Ready = "ready",
  Running = "running",
  Waiting = "waiting",
  Suspended = "suspended",
  Completed = "completed",
  Failed = "failed",
  Cancelled = "cancelled",
  RolledBack = "rolled_back",
}

export enum StepStatus {
  Pending = "pending",
  Running = "running",
  Waiting = "waiting",
  Completed = "completed",
  Failed = "failed",
  Skipped = "skipped",
  Cancelled = "cancelled",
  Compensated = "compensated",
}

export enum StepType {
  Action = "action",
  AI = "ai",
  Approval = "approval",
  Event = "event",
  Delay = "delay",
  Parallel = "parallel",
  ChildWorkflow = "child_workflow",
  Script = "script",
}

export enum RetryStrategy {
  None = "none",
  Immediate = "immediate",
  Fixed = "fixed",
  Exponential = "exponential",
}

export interface RetryPolicy {
  strategy: RetryStrategy;
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
}

export interface TimeoutPolicy {
  enabled: boolean;
  timeoutMs: number;
}

export interface WorkflowMetadata {
  id: WorkflowId;
  name: string;
  version: string;
  description?: string;
  category?: string;
  tags?: string[];
}
export interface WorkflowVariables {
  [key: string]: unknown;
}

export interface WorkflowContextData {
  workflowId: WorkflowId;
  instanceId: WorkflowInstanceId;

  correlationId: CorrelationId;

  initiatedBy?: UserId;

  organizationId?: string;

  businessId?: string;

  variables: WorkflowVariables;

  createdAt: Date;

  updatedAt: Date;
}

export interface StepResult {
  success: boolean;

  output?: unknown;

  error?: Error;

  durationMs: number;
}

export interface StepExecutionContext {
  runtime: unknown;

  workflow: WorkflowMetadata;

  context: WorkflowContextData;

  stepId: WorkflowStepId;

  input: unknown;
}
export interface StepHandler {
  execute(
    context: StepExecutionContext
  ): Promise<StepResult>;
}

export interface CompensationHandler {
  compensate(
    context: StepExecutionContext
  ): Promise<void>;
}

export interface ApprovalRequest {
  title: string;

  description?: string;

  approvers: string[];

  minimumApprovals: number;

  timeoutMs?: number;
}

export interface EventWaitDefinition {
  eventName: string;

  timeoutMs?: number;

  correlationProperty?: string;
}
/**
 * ============================================================
 * Workflow Definition
 * ============================================================
 */

export interface WorkflowStepDefinition {
  id: WorkflowStepId;

  name: string;

  type: StepType;

  description?: string;

  handler?: string;

  enabled?: boolean;

  input?: Record<string, unknown>;

  outputVariable?: string;

  retry?: RetryPolicy;

  timeout?: TimeoutPolicy;

  approval?: ApprovalRequest;

  event?: EventWaitDefinition;

  compensateWith?: WorkflowStepId;

  next?: WorkflowStepId[];

  metadata?: Record<string, unknown>;
}

export interface WorkflowDefinition {
  metadata: WorkflowMetadata;

  steps: WorkflowStepDefinition[];

  startStep: WorkflowStepId;

  variables?: WorkflowVariables;
}
/**
 * ============================================================
 * Runtime Configuration
 * ============================================================
 */

export interface RuntimeConfiguration {

  runtimeId: string;

  nodeId: string;

  persistenceEnabled: boolean;

  metricsEnabled: boolean;

  auditEnabled: boolean;

  schedulerEnabled: boolean;

  eventBusEnabled: boolean;

  defaultRetryPolicy: RetryPolicy;

  defaultTimeoutPolicy: TimeoutPolicy;

  maxConcurrentWorkflows: number;

  heartbeatIntervalMs: number;
}
/**
 * ============================================================
 * Scheduler
 * ============================================================
 */

export interface ScheduledWorkflow {

  instanceId: WorkflowInstanceId;

  executeAt: Date;

  stepId?: WorkflowStepId;

  payload?: unknown;
}

export interface WorkflowScheduler {

  schedule(
    job: ScheduledWorkflow
  ): Promise<void>;

  cancel(
    instanceId: WorkflowInstanceId
  ): Promise<void>;

  shutdown(): Promise<void>;
}
/**
 * ============================================================
 * Persistence
 * ============================================================
 */

export interface WorkflowPersistence {

  saveInstance(
    instance: WorkflowExecutionRecord
  ): Promise<void>;

  updateInstance(
    instance: WorkflowExecutionRecord
  ): Promise<void>;

  loadInstance(
    id: WorkflowInstanceId
  ): Promise<WorkflowExecutionRecord | null>;

  deleteInstance(
    id: WorkflowInstanceId
  ): Promise<void>;
}
/**
 * ============================================================
 * Runtime Events
 * ============================================================
 */

export enum WorkflowRuntimeEvent {

  WorkflowStarted = "workflow.started",

  WorkflowCompleted = "workflow.completed",

  WorkflowFailed = "workflow.failed",

  WorkflowCancelled = "workflow.cancelled",

  WorkflowSuspended = "workflow.suspended",

  StepStarted = "workflow.step.started",

  StepCompleted = "workflow.step.completed",

  StepFailed = "workflow.step.failed",

  StepWaiting = "workflow.step.waiting",

  StepCompensated = "workflow.step.compensated",
}
/**
 * ============================================================
 * Runtime Metrics
 * ============================================================
 */

export interface WorkflowMetrics {

  totalStarted: number;

  totalCompleted: number;

  totalFailed: number;

  running: number;

  waiting: number;

  averageExecutionTimeMs: number;
}
/**
 * ============================================================
 * Audit
 * ============================================================
 */

export interface WorkflowAuditEntry {

  timestamp: Date;

  workflowId: WorkflowId;

  instanceId: WorkflowInstanceId;

  stepId?: WorkflowStepId;

  event: WorkflowRuntimeEvent;

  actor?: string;

  details?: Record<string, unknown>;
}

export interface WorkflowAuditProvider {

  write(
    entry: WorkflowAuditEntry
  ): Promise<void>;
}
/**
 * ============================================================
 * Runtime Hooks
 * ============================================================
 */

export interface RuntimeHooks {

  beforeWorkflowStart?(
    workflow: WorkflowDefinition
  ): Promise<void>;

  afterWorkflowComplete?(
    record: WorkflowExecutionRecord
  ): Promise<void>;

  beforeStepExecute?(
    step: WorkflowStepDefinition
  ): Promise<void>;

  afterStepExecute?(
    step: WorkflowStepDefinition,
    result: StepResult
  ): Promise<void>;
}
/**
 * ============================================================
 * Workflow Execution
 * ============================================================
 */

export interface WorkflowExecutionRecord {

  instanceId: WorkflowInstanceId;

  workflowId: WorkflowId;

  status: WorkflowStatus;

  currentStep?: WorkflowStepId;

  variables: WorkflowVariables;

  startedAt: Date;

  updatedAt: Date;

  completedAt?: Date;

  correlationId: CorrelationId;
}
/**
 * ============================================================
 * Runtime Errors
 * ============================================================
 */

export enum WorkflowErrorCode {
  DefinitionNotFound = "WORKFLOW_DEFINITION_NOT_FOUND",
  DefinitionAlreadyRegistered = "WORKFLOW_DEFINITION_ALREADY_REGISTERED",
  InvalidDefinition = "INVALID_WORKFLOW_DEFINITION",
  InvalidStep = "INVALID_WORKFLOW_STEP",
  InstanceNotFound = "WORKFLOW_INSTANCE_NOT_FOUND",
  InvalidInstanceState = "INVALID_WORKFLOW_INSTANCE_STATE",
  HandlerNotFound = "WORKFLOW_HANDLER_NOT_FOUND",
  StepExecutionFailed = "WORKFLOW_STEP_EXECUTION_FAILED",
  StepTimedOut = "WORKFLOW_STEP_TIMED_OUT",
  RetryExhausted = "WORKFLOW_RETRY_EXHAUSTED",
  ApprovalRejected = "WORKFLOW_APPROVAL_REJECTED",
  ApprovalTimedOut = "WORKFLOW_APPROVAL_TIMED_OUT",
  EventWaitTimedOut = "WORKFLOW_EVENT_WAIT_TIMED_OUT",
  CompensationFailed = "WORKFLOW_COMPENSATION_FAILED",
  PersistenceFailed = "WORKFLOW_PERSISTENCE_FAILED",
  SchedulingFailed = "WORKFLOW_SCHEDULING_FAILED",
  RuntimeUnavailable = "WORKFLOW_RUNTIME_UNAVAILABLE",
  RuntimeShuttingDown = "WORKFLOW_RUNTIME_SHUTTING_DOWN",
  ConcurrencyLimitReached = "WORKFLOW_CONCURRENCY_LIMIT_REACHED",
  CancellationFailed = "WORKFLOW_CANCELLATION_FAILED",
  RecoveryFailed = "WORKFLOW_RECOVERY_FAILED",
  InternalError = "WORKFLOW_INTERNAL_ERROR",
}

export interface SerializedWorkflowError {
  name: string;
  message: string;
  code: WorkflowErrorCode | string;
  stack?: string;
  details?: Record<string, unknown>;
  cause?: SerializedWorkflowError;
}

export interface WorkflowFailureRecord {
  code: WorkflowErrorCode | string;
  message: string;
  stepId?: WorkflowStepId;
  attempt?: number;
  occurredAt: Date;
  retryable: boolean;
  error?: SerializedWorkflowError;
}

/**
 * ============================================================
 * Step Execution Records
 * ============================================================
 */

export interface StepExecutionRecord {
  stepId: WorkflowStepId;
  name: string;
  type: StepType;
  status: StepStatus;
  attempt: number;
  input?: unknown;
  output?: unknown;
  error?: SerializedWorkflowError;
  startedAt?: Date;
  updatedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  nextAttemptAt?: Date;
  waitingFor?: WorkflowWaitState;
  metadata?: Record<string, unknown>;
}

export interface WorkflowWaitState {
  type: "approval" | "event" | "delay" | "child_workflow" | "manual";
  since: Date;
  expiresAt?: Date;
  eventName?: string;
  scheduledAt?: Date;
  approvalRequestId?: string;
  childInstanceId?: WorkflowInstanceId;
  details?: Record<string, unknown>;
}

/**
 * ============================================================
 * Workflow Execution Record Extensions
 * ============================================================
 */

export interface CompleteWorkflowExecutionRecord
  extends WorkflowExecutionRecord {
  definitionVersion: string;
  definitionSnapshot?: WorkflowDefinition;
  context: WorkflowContextData;
  steps: Record<WorkflowStepId, StepExecutionRecord>;
  history: WorkflowHistoryEntry[];
  failure?: WorkflowFailureRecord;
  parentInstanceId?: WorkflowInstanceId;
  parentStepId?: WorkflowStepId;
  suspendedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  recoveredAt?: Date;
  revision: number;
}

export interface WorkflowHistoryEntry {
  sequence: number;
  timestamp: Date;
  event: WorkflowRuntimeEvent | string;
  status: WorkflowStatus;
  stepId?: WorkflowStepId;
  actor?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * ============================================================
 * Runtime Commands
 * ============================================================
 */

export interface StartWorkflowInput {
  workflowId: WorkflowId;
  version?: string;
  variables?: WorkflowVariables;
  correlationId?: CorrelationId;
  initiatedBy?: UserId;
  organizationId?: string;
  businessId?: string;
  parentInstanceId?: WorkflowInstanceId;
  parentStepId?: WorkflowStepId;
  metadata?: Record<string, unknown>;
}

export interface ResumeWorkflowInput {
  instanceId: WorkflowInstanceId;
  variables?: WorkflowVariables;
  actor?: UserId;
  reason?: string;
}

export interface SuspendWorkflowInput {
  instanceId: WorkflowInstanceId;
  actor?: UserId;
  reason?: string;
}

export interface CancelWorkflowInput {
  instanceId: WorkflowInstanceId;
  actor?: UserId;
  reason?: string;
  compensate?: boolean;
}

export interface RetryWorkflowInput {
  instanceId: WorkflowInstanceId;
  stepId?: WorkflowStepId;
  actor?: UserId;
  resetAttempts?: boolean;
}

export interface PublishWorkflowEventInput {
  eventName: string;
  payload?: unknown;
  correlationId?: CorrelationId;
  instanceId?: WorkflowInstanceId;
  occurredAt?: Date;
}

/**
 * ============================================================
 * Runtime Results
 * ============================================================
 */

export interface WorkflowOperationResult {
  success: boolean;
  instanceId: WorkflowInstanceId;
  status: WorkflowStatus;
  currentStep?: WorkflowStepId;
  error?: SerializedWorkflowError;
}

export interface StartWorkflowResult extends WorkflowOperationResult {
  created: boolean;
  correlationId: CorrelationId;
}

export interface WorkflowQueryResult {
  records: CompleteWorkflowExecutionRecord[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * ============================================================
 * Query and Filtering
 * ============================================================
 */

export interface WorkflowInstanceFilter {
  workflowId?: WorkflowId;
  workflowIds?: WorkflowId[];
  instanceId?: WorkflowInstanceId;
  correlationId?: CorrelationId;
  statuses?: WorkflowStatus[];
  initiatedBy?: UserId;
  organizationId?: string;
  businessId?: string;
  parentInstanceId?: WorkflowInstanceId;
  createdFrom?: Date;
  createdTo?: Date;
  updatedFrom?: Date;
  updatedTo?: Date;
  completedFrom?: Date;
  completedTo?: Date;
  tags?: string[];
  search?: string;
}

export type WorkflowSortField =
  | "startedAt"
  | "updatedAt"
  | "completedAt"
  | "status"
  | "workflowId";

export type SortDirection = "asc" | "desc";

export interface WorkflowQueryOptions {
  filter?: WorkflowInstanceFilter;
  sortBy?: WorkflowSortField;
  sortDirection?: SortDirection;
  limit?: number;
  offset?: number;
}

/**
 * ============================================================
 * Definition Registry
 * ============================================================
 */

export interface WorkflowDefinitionReference {
  workflowId: WorkflowId;
  version: string;
}

export interface WorkflowDefinitionRegistry {
  register(definition: WorkflowDefinition): Promise<void> | void;

  unregister(
    workflowId: WorkflowId,
    version?: string
  ): Promise<boolean> | boolean;

  get(
    workflowId: WorkflowId,
    version?: string
  ): Promise<WorkflowDefinition | null> | WorkflowDefinition | null;

  getLatest(
    workflowId: WorkflowId
  ): Promise<WorkflowDefinition | null> | WorkflowDefinition | null;

  list(): Promise<WorkflowDefinition[]> | WorkflowDefinition[];

  has(
    workflowId: WorkflowId,
    version?: string
  ): Promise<boolean> | boolean;
}

/**
 * ============================================================
 * Handler Registry
 * ============================================================
 */

export interface WorkflowHandlerRegistration {
  name: string;
  handler: StepHandler;
  compensationHandler?: CompensationHandler;
  engineId?: EngineId;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowHandlerRegistry {
  register(registration: WorkflowHandlerRegistration): void;

  unregister(name: string): boolean;

  get(name: string): WorkflowHandlerRegistration | undefined;

  has(name: string): boolean;

  list(): WorkflowHandlerRegistration[];
}

/**
 * ============================================================
 * Persistence Extensions
 * ============================================================
 */

export interface WorkflowPersistenceTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface ExtendedWorkflowPersistence extends WorkflowPersistence {
  createInstance(
    instance: CompleteWorkflowExecutionRecord
  ): Promise<void>;

  saveCompleteInstance(
    instance: CompleteWorkflowExecutionRecord
  ): Promise<void>;

  loadCompleteInstance(
    id: WorkflowInstanceId
  ): Promise<CompleteWorkflowExecutionRecord | null>;

  queryInstances(
    options?: WorkflowQueryOptions
  ): Promise<WorkflowQueryResult>;

  loadRecoverableInstances(
    runtimeId?: string
  ): Promise<CompleteWorkflowExecutionRecord[]>;

  acquireLease?(
    instanceId: WorkflowInstanceId,
    ownerId: string,
    durationMs: number
  ): Promise<boolean>;

  renewLease?(
    instanceId: WorkflowInstanceId,
    ownerId: string,
    durationMs: number
  ): Promise<boolean>;

  releaseLease?(
    instanceId: WorkflowInstanceId,
    ownerId: string
  ): Promise<void>;

  beginTransaction?(): Promise<WorkflowPersistenceTransaction>;
}

/**
 * ============================================================
 * Scheduler Extensions
 * ============================================================
 */

export interface ScheduledJob {
  id: string;
  instanceId: WorkflowInstanceId;
  stepId?: WorkflowStepId;
  type: "delay" | "retry" | "timeout" | "resume" | "cron";
  executeAt: Date;
  payload?: unknown;
  attempts: number;
  maxAttempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowScheduleFilter {
  instanceId?: WorkflowInstanceId;
  stepId?: WorkflowStepId;
  type?: ScheduledJob["type"];
  executeBefore?: Date;
  executeAfter?: Date;
}

export interface ExtendedWorkflowScheduler extends WorkflowScheduler {
  scheduleJob(job: ScheduledJob): Promise<void>;

  cancelJob(jobId: string): Promise<boolean>;

  cancelForStep(
    instanceId: WorkflowInstanceId,
    stepId: WorkflowStepId
  ): Promise<number>;

  getDueJobs(now?: Date, limit?: number): Promise<ScheduledJob[]>;

  findJobs(filter: WorkflowScheduleFilter): Promise<ScheduledJob[]>;

  start?(): Promise<void>;
}

/**
 * ============================================================
 * Runtime Event Publisher
 * ============================================================
 */

export interface WorkflowRuntimeEventEnvelope {
  id: string;
  name: WorkflowRuntimeEvent | string;
  runtimeId: string;
  instanceId: WorkflowInstanceId;
  workflowId: WorkflowId;
  correlationId: CorrelationId;
  stepId?: WorkflowStepId;
  timestamp: Date;
  payload?: unknown;
  metadata?: Record<string, unknown>;
}

export interface WorkflowEventPublisher {
  publish(event: WorkflowRuntimeEventEnvelope): Promise<void>;

  subscribe?(
    eventName: string,
    handler: (event: WorkflowRuntimeEventEnvelope) => Promise<void> | void
  ): Promise<() => void> | (() => void);
}

/**
 * ============================================================
 * Approval Contracts
 * ============================================================
 */

export enum ApprovalStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
  Expired = "expired",
  Cancelled = "cancelled",
}

export interface ApprovalDecision {
  approverId: string;
  approved: boolean;
  comment?: string;
  decidedAt: Date;
}

export interface WorkflowApprovalRecord {
  requestId: string;
  instanceId: WorkflowInstanceId;
  stepId: WorkflowStepId;
  request: ApprovalRequest;
  status: ApprovalStatus;
  decisions: ApprovalDecision[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface WorkflowApprovalProvider {
  create(
    record: WorkflowApprovalRecord
  ): Promise<WorkflowApprovalRecord>;

  get(
    requestId: string
  ): Promise<WorkflowApprovalRecord | null>;

  decide(
    requestId: string,
    decision: ApprovalDecision
  ): Promise<WorkflowApprovalRecord>;

  cancel(requestId: string): Promise<void>;
}

/**
 * ============================================================
 * Snapshots and Recovery
 * ============================================================
 */

export interface WorkflowSnapshot {
  snapshotId: string;
  instanceId: WorkflowInstanceId;
  revision: number;
  record: CompleteWorkflowExecutionRecord;
  createdAt: Date;
  reason:
    | "step_completed"
    | "waiting"
    | "suspended"
    | "failure"
    | "manual"
    | "shutdown";
}

export interface WorkflowSnapshotProvider {
  save(snapshot: WorkflowSnapshot): Promise<void>;

  loadLatest(
    instanceId: WorkflowInstanceId
  ): Promise<WorkflowSnapshot | null>;

  list(
    instanceId: WorkflowInstanceId
  ): Promise<WorkflowSnapshot[]>;

  deleteBefore?(date: Date): Promise<number>;
}

export interface WorkflowRecoveryResult {
  attempted: number;
  recovered: number;
  skipped: number;
  failed: number;
  failures: Array<{
    instanceId: WorkflowInstanceId;
    error: SerializedWorkflowError;
  }>;
}

export interface WorkflowRecoveryProvider {
  recover(
    records: CompleteWorkflowExecutionRecord[]
  ): Promise<WorkflowRecoveryResult>;
}

/**
 * ============================================================
 * Distributed Runtime
 * ============================================================
 */

export enum RuntimeNodeStatus {
  Starting = "starting",
  Ready = "ready",
  Degraded = "degraded",
  Draining = "draining",
  Stopped = "stopped",
  Failed = "failed",
}

export interface RuntimeNodeDescriptor {
  runtimeId: string;
  nodeId: string;
  host?: string;
  version: string;
  status: RuntimeNodeStatus;
  startedAt: Date;
  lastHeartbeatAt: Date;
  activeWorkflows: number;
  capacity: number;
  metadata?: Record<string, unknown>;
}

export interface RuntimeCoordinator {
  registerNode(node: RuntimeNodeDescriptor): Promise<void>;

  heartbeat(node: RuntimeNodeDescriptor): Promise<void>;

  unregisterNode(runtimeId: string, nodeId: string): Promise<void>;

  listNodes(): Promise<RuntimeNodeDescriptor[]>;

  assignInstance?(
    instanceId: WorkflowInstanceId
  ): Promise<RuntimeNodeDescriptor | null>;
}

/**
 * ============================================================
 * Health and Diagnostics
 * ============================================================
 */

export enum HealthStatus {
  Healthy = "healthy",
  Degraded = "degraded",
  Unhealthy = "unhealthy",
}

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  durationMs: number;
  checkedAt: Date;
  details?: Record<string, unknown>;
}

export interface WorkflowRuntimeHealth {
  status: HealthStatus;
  runtimeId: string;
  nodeId: string;
  startedAt: Date;
  uptimeMs: number;
  activeWorkflows: number;
  waitingWorkflows: number;
  registeredDefinitions: number;
  registeredHandlers: number;
  checks: HealthCheckResult[];
}

export interface WorkflowRuntimeDiagnostics {
  health: WorkflowRuntimeHealth;
  metrics: WorkflowMetrics;
  configuration: Readonly<RuntimeConfiguration>;
  node?: RuntimeNodeDescriptor;
}

/**
 * ============================================================
 * Metrics Extensions
 * ============================================================
 */

export interface WorkflowMetricLabels {
  workflowId?: WorkflowId;
  workflowVersion?: string;
  instanceId?: WorkflowInstanceId;
  stepId?: WorkflowStepId;
  stepType?: StepType;
  status?: WorkflowStatus | StepStatus;
  runtimeId?: string;
  nodeId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface WorkflowMetricsProvider {
  increment(
    name: string,
    value?: number,
    labels?: WorkflowMetricLabels
  ): void | Promise<void>;

  gauge(
    name: string,
    value: number,
    labels?: WorkflowMetricLabels
  ): void | Promise<void>;

  timing(
    name: string,
    durationMs: number,
    labels?: WorkflowMetricLabels
  ): void | Promise<void>;

  snapshot?(): Promise<WorkflowMetrics>;
}

/**
 * ============================================================
 * Logging
 * ============================================================
 */

export interface WorkflowLogger {
  debug(message: string, details?: Record<string, unknown>): void;
  info(message: string, details?: Record<string, unknown>): void;
  warn(message: string, details?: Record<string, unknown>): void;
  error(
    message: string,
    error?: unknown,
    details?: Record<string, unknown>
  ): void;
}

/**
 * ============================================================
 * Clock and Identifier Providers
 * ============================================================
 */

export interface WorkflowClock {
  now(): Date;
  sleep(ms: number): Promise<void>;
}

export interface WorkflowIdGenerator {
  workflowInstanceId(): WorkflowInstanceId;
  correlationId(): CorrelationId;
  eventId(): string;
  jobId(): string;
  snapshotId(): string;
  approvalRequestId(): string;
}

/**
 * ============================================================
 * Runtime Dependencies
 * ============================================================
 */

export interface WorkflowRuntimeDependencies {
  persistence: ExtendedWorkflowPersistence;
  scheduler: ExtendedWorkflowScheduler;
  definitions: WorkflowDefinitionRegistry;
  handlers: WorkflowHandlerRegistry;
  eventPublisher?: WorkflowEventPublisher;
  auditProvider?: WorkflowAuditProvider;
  metricsProvider?: WorkflowMetricsProvider;
  snapshotProvider?: WorkflowSnapshotProvider;
  approvalProvider?: WorkflowApprovalProvider;
  coordinator?: RuntimeCoordinator;
  logger?: WorkflowLogger;
  clock?: WorkflowClock;
  idGenerator?: WorkflowIdGenerator;
  hooks?: RuntimeHooks;
}

/**
 * ============================================================
 * Runtime Lifecycle
 * ============================================================
 */

export enum WorkflowRuntimeStatus {
  Created = "created",
  Starting = "starting",
  Ready = "ready",
  Draining = "draining",
  Stopping = "stopping",
  Stopped = "stopped",
  Failed = "failed",
}

export interface WorkflowRuntimeLifecycle {
  readonly status: WorkflowRuntimeStatus;

  start(): Promise<void>;

  drain(timeoutMs?: number): Promise<void>;

  stop(): Promise<void>;

  health(): Promise<WorkflowRuntimeHealth>;
}

/**
 * ============================================================
 * Runtime Public Contract
 * ============================================================
 */

export interface IWorkflowRuntime extends WorkflowRuntimeLifecycle {
  readonly configuration: Readonly<RuntimeConfiguration>;

  registerDefinition(
    definition: WorkflowDefinition
  ): Promise<void>;

  unregisterDefinition(
    workflowId: WorkflowId,
    version?: string
  ): Promise<boolean>;

  registerHandler(
    registration: WorkflowHandlerRegistration
  ): void;

  unregisterHandler(name: string): boolean;

  startWorkflow(
    input: StartWorkflowInput
  ): Promise<StartWorkflowResult>;

  resumeWorkflow(
    input: ResumeWorkflowInput
  ): Promise<WorkflowOperationResult>;

  suspendWorkflow(
    input: SuspendWorkflowInput
  ): Promise<WorkflowOperationResult>;

  cancelWorkflow(
    input: CancelWorkflowInput
  ): Promise<WorkflowOperationResult>;

  retryWorkflow(
    input: RetryWorkflowInput
  ): Promise<WorkflowOperationResult>;

  publishEvent(
    input: PublishWorkflowEventInput
  ): Promise<void>;

  getInstance(
    instanceId: WorkflowInstanceId
  ): Promise<CompleteWorkflowExecutionRecord | null>;

  queryInstances(
    options?: WorkflowQueryOptions
  ): Promise<WorkflowQueryResult>;

  recover(): Promise<WorkflowRecoveryResult>;

  diagnostics(): Promise<WorkflowRuntimeDiagnostics>;
}

/**
 * ============================================================
 * Utility Types
 * ============================================================
 */

export type Awaitable<T> = T | Promise<T>;

export type DeepReadonly<T> =
  T extends (...args: never[]) => unknown
    ? T
    : T extends Date
      ? Readonly<Date>
      : T extends Array<infer U>
        ? ReadonlyArray<DeepReadonly<U>>
        : T extends object
          ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
          : T;

export type Optional<T, K extends keyof T> =
  Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> =
  T & Required<Pick<T, K>>;

export type WorkflowVariableValue =
  | string
  | number
  | boolean
  | null
  | Date
  | WorkflowVariableValue[]
  | { [key: string]: WorkflowVariableValue };

/**
 * ============================================================
 * Default Runtime Values
 * ============================================================
 */

export const DEFAULT_RETRY_POLICY: Readonly<RetryPolicy> = {
  strategy: RetryStrategy.Exponential,
  maxAttempts: 3,
  delayMs: 1_000,
  backoffMultiplier: 2,
};

export const DEFAULT_TIMEOUT_POLICY: Readonly<TimeoutPolicy> = {
  enabled: true,
  timeoutMs: 30_000,
};

export const DEFAULT_RUNTIME_CONFIGURATION: Readonly<
  RuntimeConfiguration
> = {
  runtimeId: "ibos-workflow-runtime",
  nodeId: "primary",
  persistenceEnabled: true,
  metricsEnabled: true,
  auditEnabled: true,
  schedulerEnabled: true,
  eventBusEnabled: true,
  defaultRetryPolicy: {
    ...DEFAULT_RETRY_POLICY,
  },
  defaultTimeoutPolicy: {
    ...DEFAULT_TIMEOUT_POLICY,
  },
  maxConcurrentWorkflows: 100,
  heartbeatIntervalMs: 30_000,
};

/**
 * ============================================================
 * Runtime Constants
 * ============================================================
 */

export const WORKFLOW_RUNTIME_VERSION = "1.0.0";

export const WORKFLOW_RUNTIME_SERVICE_KEY =
  "ibos.workflow.runtime";

export const WORKFLOW_SCHEDULER_SERVICE_KEY =
  "ibos.workflow.scheduler";

export const WORKFLOW_PERSISTENCE_SERVICE_KEY =
  "ibos.workflow.persistence";

export const WORKFLOW_DEFINITION_REGISTRY_SERVICE_KEY =
  "ibos.workflow.definition-registry";

export const WORKFLOW_HANDLER_REGISTRY_SERVICE_KEY =
  "ibos.workflow.handler-registry";

export const TERMINAL_WORKFLOW_STATUSES: ReadonlySet<WorkflowStatus> =
  new Set([
    WorkflowStatus.Completed,
    WorkflowStatus.Failed,
    WorkflowStatus.Cancelled,
    WorkflowStatus.RolledBack,
  ]);

export const TERMINAL_STEP_STATUSES: ReadonlySet<StepStatus> =
  new Set([
    StepStatus.Completed,
    StepStatus.Failed,
    StepStatus.Skipped,
    StepStatus.Cancelled,
    StepStatus.Compensated,
  ]);

export const ACTIVE_WORKFLOW_STATUSES: ReadonlySet<WorkflowStatus> =
  new Set([
    WorkflowStatus.Running,
    WorkflowStatus.Waiting,
    WorkflowStatus.Suspended,
  ]);

/**
 * ============================================================
 * Type Guards
 * ============================================================
 */

export function isTerminalWorkflowStatus(
  status: WorkflowStatus
): boolean {
  return TERMINAL_WORKFLOW_STATUSES.has(status);
}

export function isTerminalStepStatus(
  status: StepStatus
): boolean {
  return TERMINAL_STEP_STATUSES.has(status);
}

export function isActiveWorkflowStatus(
  status: WorkflowStatus
): boolean {
  return ACTIVE_WORKFLOW_STATUSES.has(status);
}

export function isWorkflowDefinition(
  value: unknown
): value is WorkflowDefinition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorkflowDefinition>;

  return Boolean(
    candidate.metadata &&
      typeof candidate.metadata.id === "string" &&
      typeof candidate.metadata.name === "string" &&
      typeof candidate.metadata.version === "string" &&
      Array.isArray(candidate.steps) &&
      typeof candidate.startStep === "string"
  );
}

export function isSerializedWorkflowError(
  value: unknown
): value is SerializedWorkflowError {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SerializedWorkflowError>;

  return (
    typeof candidate.name === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.code === "string"
  );
}

/**
 * ============================================================
 * Error Serialization
 * ============================================================
 */

export function serializeWorkflowError(
  error: unknown,
  fallbackCode: WorkflowErrorCode = WorkflowErrorCode.InternalError
): SerializedWorkflowError {
  if (isSerializedWorkflowError(error)) {
    return error;
  }

  if (error instanceof Error) {
    const extended = error as Error & {
      code?: string;
      details?: Record<string, unknown>;
      cause?: unknown;
    };

    return {
      name: error.name,
      message: error.message,
      code: extended.code ?? fallbackCode,
      stack: error.stack,
      details: extended.details,
      cause: extended.cause
        ? serializeWorkflowError(
            extended.cause,
            fallbackCode
          )
        : undefined,
    };
  }

  if (typeof error === "string") {
    return {
      name: "WorkflowError",
      message: error,
      code: fallbackCode,
    };
  }

  return {
    name: "WorkflowError",
    message: "An unknown workflow error occurred.",
    code: fallbackCode,
    details: {
      originalValue: error,
    },
  };
}