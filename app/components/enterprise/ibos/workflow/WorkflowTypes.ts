/**
 * IBOS Workflow Engine
 * Shared Types and Contracts
 *
 * This file is the single source of truth for workflow definitions,
 * workflow executions, steps, retries, timeouts, compensation,
 * approvals, audit records, persistence, and monitoring.
 */

/* -------------------------------------------------------------------------- */
/*                               Core identifiers                              */
/* -------------------------------------------------------------------------- */

export type WorkflowId = string;

export type WorkflowDefinitionId = string;

export type WorkflowExecutionId = string;

export type WorkflowStepId = string;

export type WorkflowStepExecutionId = string;

export type WorkflowCorrelationId = string;

/* -------------------------------------------------------------------------- */
/*                              Workflow lifecycle                             */
/* -------------------------------------------------------------------------- */

export type WorkflowStatus =
  | "created"
  | "pending"
  | "running"
  | "waiting"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "compensating"
  | "compensated"
  | "partially-compensated";

export type WorkflowStepStatus =
  | "pending"
  | "ready"
  | "running"
  | "waiting"
  | "completed"
  | "skipped"
  | "failed"
  | "cancelled"
  | "timed-out"
  | "compensating"
  | "compensated"
  | "compensation-failed";

export type WorkflowExecutionMode =
  | "sequential"
  | "parallel";

export type WorkflowStepType =
  | "action"
  | "condition"
  | "parallel"
  | "delay"
  | "approval"
  | "event"
  | "workflow"
  | "ai"
  | "manual";

export type WorkflowFailureStrategy =
  | "stop"
  | "continue"
  | "compensate"
  | "retry"
  | "skip";

export type WorkflowCompensationStrategy =
  | "none"
  | "reverse-order"
  | "parallel";

export type WorkflowApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

/* -------------------------------------------------------------------------- */
/*                              Workflow variables                             */
/* -------------------------------------------------------------------------- */

export type WorkflowPrimitive =
  | string
  | number
  | boolean
  | null;

export type WorkflowValue =
  | WorkflowPrimitive
  | WorkflowPrimitive[]
  | Record<string, unknown>
  | unknown[];

export type WorkflowVariables = Record<
  string,
  WorkflowValue
>;

export type WorkflowMetadata = Record<
  string,
  unknown
>;

/* -------------------------------------------------------------------------- */
/*                            Retry and timeout rules                           */
/* -------------------------------------------------------------------------- */

export interface WorkflowRetryPolicy {
  /**
   * Total number of attempts, including the first attempt.
   */
  maxAttempts: number;

  /**
   * Delay before the first retry.
   */
  delayMs: number;

  /**
   * Multiplier applied after each failed attempt.
   */
  backoffMultiplier: number;

  /**
   * Maximum retry delay.
   */
  maxDelayMs: number;

  /**
   * Optional error names or messages that are retryable.
   */
  retryableErrors?: string[];
}

export interface WorkflowTimeoutPolicy {
  /**
   * Maximum step execution duration.
   */
  timeoutMs: number;

  /**
   * Action taken after timeout.
   */
  onTimeout: WorkflowFailureStrategy;
}

export const DEFAULT_WORKFLOW_RETRY_POLICY: WorkflowRetryPolicy =
  {
    maxAttempts: 1,
    delayMs: 0,
    backoffMultiplier: 1,
    maxDelayMs: 30_000,
  };

export const DEFAULT_WORKFLOW_TIMEOUT_POLICY: WorkflowTimeoutPolicy =
  {
    timeoutMs: 0,
    onTimeout: "stop",
  };

/* -------------------------------------------------------------------------- */
/*                           Workflow execution context                        */
/* -------------------------------------------------------------------------- */

export interface WorkflowExecutionContext {
  workflowId: WorkflowId;
  definitionId: WorkflowDefinitionId;
  executionId: WorkflowExecutionId;
  correlationId: WorkflowCorrelationId;

  variables: WorkflowVariables;
  metadata: WorkflowMetadata;

  startedAt: string;

  actorId?: string;
  organizationId?: string;
  tenantId?: string;
  parentExecutionId?: WorkflowExecutionId;

  signal?: AbortSignal;
}

/* -------------------------------------------------------------------------- */
/*                              Step handler APIs                              */
/* -------------------------------------------------------------------------- */

export interface WorkflowStepHandlerContext
  extends WorkflowExecutionContext {
  stepId: WorkflowStepId;
  stepExecutionId: WorkflowStepExecutionId;
  attempt: number;

  setVariable(
    key: string,
    value: WorkflowValue,
  ): void;

  getVariable<TValue = WorkflowValue>(
    key: string,
  ): TValue | undefined;

  hasVariable(key: string): boolean;

  deleteVariable(key: string): boolean;

  emitAudit(
    action: string,
    details?: WorkflowMetadata,
  ): void;
}

export interface WorkflowStepResult<
  TOutput = unknown,
> {
  success: boolean;
  output?: TOutput;

  /**
   * Variables to merge into the workflow context.
   */
  variables?: WorkflowVariables;

  /**
   * Optional instruction to skip following steps.
   */
  skipRemaining?: boolean;

  /**
   * Optional next step override.
   */
  nextStepId?: WorkflowStepId;

  /**
   * Human-readable result message.
   */
  message?: string;

  metadata?: WorkflowMetadata;
}

export type WorkflowStepHandler<
  TInput = unknown,
  TOutput = unknown,
> = (
  input: TInput,
  context: WorkflowStepHandlerContext,
) =>
  | WorkflowStepResult<TOutput>
  | Promise<WorkflowStepResult<TOutput>>;

export type WorkflowStepCondition = (
  context: WorkflowStepHandlerContext,
) => boolean | Promise<boolean>;

export type WorkflowStepInputResolver<
  TInput = unknown,
> = (
  context: WorkflowStepHandlerContext,
) => TInput | Promise<TInput>;

export type WorkflowStepOutputMapper<
  TOutput = unknown,
> = (
  output: TOutput,
  context: WorkflowStepHandlerContext,
) =>
  | WorkflowVariables
  | Promise<WorkflowVariables>;

export type WorkflowCompensationHandler<
  TOutput = unknown,
> = (
  output: TOutput | undefined,
  context: WorkflowStepHandlerContext,
) => void | Promise<void>;

/* -------------------------------------------------------------------------- */
/*                              Approval contracts                             */
/* -------------------------------------------------------------------------- */

export interface WorkflowApprovalRequest {
  id: string;
  workflowExecutionId: WorkflowExecutionId;
  stepExecutionId: WorkflowStepExecutionId;

  title: string;
  description?: string;

  requestedAt: string;
  expiresAt?: string;

  requestedBy?: string;
  assignedTo?: string[];
  assignedRoles?: string[];

  status: WorkflowApprovalStatus;

  decisionAt?: string;
  decisionBy?: string;
  decisionReason?: string;

  metadata?: WorkflowMetadata;
}

export interface WorkflowApprovalDecision {
  approved: boolean;
  decidedBy: string;
  reason?: string;
  metadata?: WorkflowMetadata;
}

/* -------------------------------------------------------------------------- */
/*                              Event wait rules                               */
/* -------------------------------------------------------------------------- */

export interface WorkflowEventWaitDefinition {
  eventType: string;

  /**
   * Optional event timeout.
   */
  timeoutMs?: number;

  /**
   * Optional correlation metadata key.
   */
  correlationKey?: string;

  /**
   * Optional expected correlation value.
   */
  correlationValue?: string;

  /**
   * Store the received event payload in this workflow variable.
   */
  payloadVariable?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Delay definitions                              */
/* -------------------------------------------------------------------------- */

export interface WorkflowDelayDefinition {
  /**
   * Fixed delay.
   */
  delayMs?: number;

  /**
   * Absolute ISO timestamp.
   */
  until?: string;

  /**
   * Optional function that dynamically calculates a delay.
   */
  resolver?: (
    context: WorkflowStepHandlerContext,
  ) => number | Promise<number>;
}

/* -------------------------------------------------------------------------- */
/*                              Step definitions                               */
/* -------------------------------------------------------------------------- */

export interface WorkflowStepDefinition<
  TInput = unknown,
  TOutput = unknown,
> {
  id: WorkflowStepId;
  name: string;
  description?: string;

  type: WorkflowStepType;

  handler?: WorkflowStepHandler<
    TInput,
    TOutput
  >;

  input?: TInput;

  inputResolver?: WorkflowStepInputResolver<TInput>;

  outputMapper?: WorkflowStepOutputMapper<TOutput>;

  condition?: WorkflowStepCondition;

  retry?: Partial<WorkflowRetryPolicy>;

  timeout?: Partial<WorkflowTimeoutPolicy>;

  failureStrategy?: WorkflowFailureStrategy;

  compensation?: WorkflowCompensationHandler<TOutput>;

  /**
   * IDs of steps that must complete before this step can run.
   */
  dependsOn?: WorkflowStepId[];

  /**
   * Explicit next step IDs.
   */
  next?: WorkflowStepId[];

  /**
   * Step IDs executed when the condition evaluates to true.
   */
  onTrue?: WorkflowStepId[];

  /**
   * Step IDs executed when the condition evaluates to false.
   */
  onFalse?: WorkflowStepId[];

  /**
   * Child steps used by a parallel step.
   */
  children?: WorkflowStepDefinition[];

  delay?: WorkflowDelayDefinition;

  eventWait?: WorkflowEventWaitDefinition;

  approval?: {
    title: string;
    description?: string;
    assignedTo?: string[];
    assignedRoles?: string[];
    expiresInMs?: number;
  };

  nestedWorkflowDefinitionId?: WorkflowDefinitionId;

  enabled?: boolean;

  metadata?: WorkflowMetadata;
}

/* -------------------------------------------------------------------------- */
/*                            Workflow definition                              */
/* -------------------------------------------------------------------------- */

export interface WorkflowDefinition {
  id: WorkflowDefinitionId;
  name: string;
  description?: string;

  version: string;

  steps: WorkflowStepDefinition[];

  executionMode?: WorkflowExecutionMode;

  failureStrategy?: WorkflowFailureStrategy;

  compensationStrategy?: WorkflowCompensationStrategy;

  retry?: Partial<WorkflowRetryPolicy>;

  timeoutMs?: number;

  enabled?: boolean;

  tags?: string[];

  metadata?: WorkflowMetadata;

  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Execution records                              */
/* -------------------------------------------------------------------------- */

export interface WorkflowStepExecution {
  id: WorkflowStepExecutionId;
  workflowExecutionId: WorkflowExecutionId;
  stepId: WorkflowStepId;

  status: WorkflowStepStatus;

  attempt: number;

  startedAt?: string;
  completedAt?: string;

  durationMs?: number;

  input?: unknown;
  output?: unknown;

  error?: string;
  errorStack?: string;

  skippedReason?: string;

  compensationStartedAt?: string;
  compensationCompletedAt?: string;
  compensationError?: string;

  metadata?: WorkflowMetadata;
}

export interface WorkflowExecutionRecord {
  id: WorkflowExecutionId;
  workflowId: WorkflowId;
  definitionId: WorkflowDefinitionId;
  definitionVersion: string;

  correlationId: WorkflowCorrelationId;

  status: WorkflowStatus;

  variables: WorkflowVariables;
  metadata: WorkflowMetadata;

  currentStepId?: WorkflowStepId;

  stepExecutions: WorkflowStepExecution[];

  createdAt: string;
  startedAt?: string;
  completedAt?: string;

  durationMs?: number;

  error?: string;
  errorStack?: string;

  actorId?: string;
  organizationId?: string;
  tenantId?: string;

  parentExecutionId?: WorkflowExecutionId;
}

/* -------------------------------------------------------------------------- */
/*                              Execution input                                */
/* -------------------------------------------------------------------------- */

export interface StartWorkflowInput {
  definitionId: WorkflowDefinitionId;

  workflowId?: WorkflowId;

  executionId?: WorkflowExecutionId;

  correlationId?: WorkflowCorrelationId;

  variables?: WorkflowVariables;

  metadata?: WorkflowMetadata;

  actorId?: string;
  organizationId?: string;
  tenantId?: string;

  parentExecutionId?: WorkflowExecutionId;
}

export interface ResumeWorkflowInput {
  executionId: WorkflowExecutionId;

  variables?: WorkflowVariables;

  metadata?: WorkflowMetadata;
}

export interface CancelWorkflowInput {
  executionId: WorkflowExecutionId;

  reason?: string;

  cancelledBy?: string;

  compensate?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              Execution results                              */
/* -------------------------------------------------------------------------- */

export interface WorkflowExecutionResult {
  execution: WorkflowExecutionRecord;

  success: boolean;

  status: WorkflowStatus;

  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  compensatedSteps: number;

  output?: WorkflowVariables;

  error?: string;
}

export interface WorkflowCompensationResult {
  executionId: WorkflowExecutionId;

  success: boolean;

  compensatedSteps: number;
  failedCompensations: number;

  errors: string[];

  startedAt: string;
  completedAt: string;
  durationMs: number;
}

/* -------------------------------------------------------------------------- */
/*                                Audit trail                                  */
/* -------------------------------------------------------------------------- */

export type WorkflowAuditLevel =
  | "debug"
  | "info"
  | "warning"
  | "error"
  | "critical";

export interface WorkflowAuditRecord {
  id: string;

  timestamp: string;

  level: WorkflowAuditLevel;

  action: string;

  workflowDefinitionId?: WorkflowDefinitionId;
  workflowExecutionId?: WorkflowExecutionId;
  stepId?: WorkflowStepId;
  stepExecutionId?: WorkflowStepExecutionId;

  actorId?: string;
  organizationId?: string;

  message?: string;

  details?: WorkflowMetadata;
}

/* -------------------------------------------------------------------------- */
/*                           Persistence contracts                             */
/* -------------------------------------------------------------------------- */

export interface WorkflowPersistenceAdapter {
  saveDefinition(
    definition: WorkflowDefinition,
  ): Promise<void>;

  getDefinition(
    definitionId: WorkflowDefinitionId,
  ): Promise<WorkflowDefinition | undefined>;

  deleteDefinition(
    definitionId: WorkflowDefinitionId,
  ): Promise<boolean>;

  listDefinitions(): Promise<
    WorkflowDefinition[]
  >;

  saveExecution(
    execution: WorkflowExecutionRecord,
  ): Promise<void>;

  getExecution(
    executionId: WorkflowExecutionId,
  ): Promise<WorkflowExecutionRecord | undefined>;

  listExecutions(
    filter?: WorkflowExecutionFilter,
  ): Promise<WorkflowExecutionRecord[]>;

  saveApprovalRequest(
    request: WorkflowApprovalRequest,
  ): Promise<void>;

  getApprovalRequest(
    requestId: string,
  ): Promise<WorkflowApprovalRequest | undefined>;

  saveAuditRecord(
    record: WorkflowAuditRecord,
  ): Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*                             Search and filters                              */
/* -------------------------------------------------------------------------- */

export interface WorkflowExecutionFilter {
  definitionId?: WorkflowDefinitionId;
  workflowId?: WorkflowId;
  correlationId?: WorkflowCorrelationId;

  statuses?: WorkflowStatus[];

  actorId?: string;
  organizationId?: string;
  tenantId?: string;

  createdFrom?: string;
  createdTo?: string;

  limit?: number;
}

/* -------------------------------------------------------------------------- */
/*                              Manager hooks                                  */
/* -------------------------------------------------------------------------- */

export interface WorkflowManagerHooks {
  onWorkflowCreated?: (
    execution: WorkflowExecutionRecord,
  ) => void | Promise<void>;

  onWorkflowStarted?: (
    execution: WorkflowExecutionRecord,
  ) => void | Promise<void>;

  onWorkflowCompleted?: (
    execution: WorkflowExecutionRecord,
  ) => void | Promise<void>;

  onWorkflowFailed?: (
    execution: WorkflowExecutionRecord,
    error: Error,
  ) => void | Promise<void>;

  onWorkflowCancelled?: (
    execution: WorkflowExecutionRecord,
  ) => void | Promise<void>;

  onStepStarted?: (
    step: WorkflowStepExecution,
    execution: WorkflowExecutionRecord,
  ) => void | Promise<void>;

  onStepCompleted?: (
    step: WorkflowStepExecution,
    execution: WorkflowExecutionRecord,
  ) => void | Promise<void>;

  onStepFailed?: (
    step: WorkflowStepExecution,
    execution: WorkflowExecutionRecord,
    error: Error,
  ) => void | Promise<void>;

  onCompensationStarted?: (
    execution: WorkflowExecutionRecord,
  ) => void | Promise<void>;

  onCompensationCompleted?: (
    result: WorkflowCompensationResult,
  ) => void | Promise<void>;

  onAudit?: (
    record: WorkflowAuditRecord,
  ) => void | Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*                           Workflow manager config                           */
/* -------------------------------------------------------------------------- */

export interface WorkflowManagerConfig {
  defaultRetry?: Partial<WorkflowRetryPolicy>;

  defaultTimeout?: Partial<WorkflowTimeoutPolicy>;

  defaultFailureStrategy?: WorkflowFailureStrategy;

  defaultCompensationStrategy?: WorkflowCompensationStrategy;

  maxConcurrentExecutions?: number;

  maxExecutionHistory?: number;

  enableAudit?: boolean;

  enableEvents?: boolean;

  throwOnWorkflowFailure?: boolean;

  persistence?: WorkflowPersistenceAdapter;

  hooks?: WorkflowManagerHooks;
}

/* -------------------------------------------------------------------------- */
/*                              Runtime statistics                             */
/* -------------------------------------------------------------------------- */

export interface WorkflowStatistics {
  totalDefinitions: number;
  enabledDefinitions: number;
  disabledDefinitions: number;

  totalExecutions: number;
  runningExecutions: number;
  waitingExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  cancelledExecutions: number;
  compensatedExecutions: number;

  totalStepExecutions: number;
  successfulStepExecutions: number;
  failedStepExecutions: number;
  skippedStepExecutions: number;

  averageExecutionDurationMs: number;

  generatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Snapshots                                  */
/* -------------------------------------------------------------------------- */

export interface WorkflowManagerSnapshot {
  definitions: WorkflowDefinition[];

  executions: WorkflowExecutionRecord[];

  approvals: WorkflowApprovalRequest[];

  statistics: WorkflowStatistics;

  generatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*                              Workflow events                                */
/* -------------------------------------------------------------------------- */

export const WORKFLOW_EVENT_TYPES = {
  DEFINITION_REGISTERED:
    "workflow.definition.registered",

  DEFINITION_UPDATED:
    "workflow.definition.updated",

  DEFINITION_REMOVED:
    "workflow.definition.removed",

  WORKFLOW_CREATED: "workflow.created",

  WORKFLOW_STARTED: "workflow.started",

  WORKFLOW_PAUSED: "workflow.paused",

  WORKFLOW_RESUMED: "workflow.resumed",

  WORKFLOW_COMPLETED: "workflow.completed",

  WORKFLOW_FAILED: "workflow.failed",

  WORKFLOW_CANCELLED: "workflow.cancelled",

  WORKFLOW_COMPENSATION_STARTED:
    "workflow.compensation.started",

  WORKFLOW_COMPENSATION_COMPLETED:
    "workflow.compensation.completed",

  STEP_STARTED: "workflow.step.started",

  STEP_COMPLETED: "workflow.step.completed",

  STEP_SKIPPED: "workflow.step.skipped",

  STEP_FAILED: "workflow.step.failed",

  STEP_RETRYING: "workflow.step.retrying",

  STEP_TIMED_OUT: "workflow.step.timed-out",

  STEP_COMPENSATED:
    "workflow.step.compensated",

  APPROVAL_REQUESTED:
    "workflow.approval.requested",

  APPROVAL_APPROVED:
    "workflow.approval.approved",

  APPROVAL_REJECTED:
    "workflow.approval.rejected",
} as const;

export type WorkflowEventType =
  (typeof WORKFLOW_EVENT_TYPES)[keyof typeof WORKFLOW_EVENT_TYPES];

/* -------------------------------------------------------------------------- */
/*                               Error contracts                               */
/* -------------------------------------------------------------------------- */

export interface WorkflowErrorDetails {
  workflowExecutionId?: WorkflowExecutionId;
  workflowDefinitionId?: WorkflowDefinitionId;
  stepId?: WorkflowStepId;
  stepExecutionId?: WorkflowStepExecutionId;
  attempt?: number;
  metadata?: WorkflowMetadata;
}

export interface SerializedWorkflowError {
  name: string;
  message: string;
  stack?: string;
  details?: WorkflowErrorDetails;
}