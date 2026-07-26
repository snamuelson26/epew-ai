/**
 * ============================================================
 * IBOS Enterprise Operating System (IBOS-EOS)
 * Workflow Runtime Executor
 *
 * Responsible for:
 * - Workflow execution
 * - Step execution
 * - Retry and backoff
 * - Compensation and rollback
 * - Parallel execution
 * - Child workflows
 * - Event waiting
 * - Timer waiting
 * - Pause, resume, cancel, fail, and complete
 * - Execution history
 * - Runtime statistics
 *
 * Version: 1.0.0
 * ============================================================
 */

import {
  CorrelationId,
  WorkflowExecutionId,
  WorkflowId,
  WorkflowInstanceId,
  WorkflowStepId,
} from "../RuntimeTypes";

import {
  generateId,
  now,
} from "./RuntimeHelpers";

/* ============================================================
 * General Types
 * ============================================================
 */

export type WorkflowExecutionStatus =
  | "created"
  | "running"
  | "waiting"
  | "paused"
  | "compensating"
  | "completed"
  | "failed"
  | "cancelled";

export type WorkflowStepExecutionStatus =
  | "pending"
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "skipped"
  | "cancelled"
  | "compensated"
  | "compensation_failed";

export type WorkflowWaitType =
  | "event"
  | "timer"
  | "approval"
  | "child_workflow"
  | "external_callback"
  | "custom";

export type ParallelCompletionMode =
  | "all"
  | "any"
  | "all_settled";

export type WorkflowFailureStrategy =
  | "fail"
  | "compensate"
  | "continue";

export type WorkflowExecutorEventName =
  | "workflow.created"
  | "workflow.started"
  | "workflow.paused"
  | "workflow.resumed"
  | "workflow.waiting"
  | "workflow.completed"
  | "workflow.failed"
  | "workflow.cancelled"
  | "workflow.compensation.started"
  | "workflow.compensation.completed"
  | "workflow.compensation.failed"
  | "step.started"
  | "step.completed"
  | "step.failed"
  | "step.retrying"
  | "step.waiting"
  | "step.compensated"
  | "step.compensation_failed"
  | "child.started"
  | "child.completed"
  | "child.failed";

/* ============================================================
 * Retry Types
 * ============================================================
 */

export interface WorkflowRetryPolicy {
  maximumAttempts: number;

  initialDelayMs?: number;

  maximumDelayMs?: number;

  backoffMultiplier?: number;

  retryableErrors?: string[];

  shouldRetry?: (
    error: unknown,
    attempt: number
  ) => boolean | Promise<boolean>;
}

export interface WorkflowRetryRecord {
  attempt: number;

  scheduledAt: Date;

  executedAt?: Date;

  delayMs: number;

  errorMessage: string;
}

/* ============================================================
 * Step Types
 * ============================================================
 */

export interface WorkflowStepContext<
  TInput = unknown
> {
  workflowId: WorkflowId;

  workflowInstanceId: WorkflowInstanceId;

  workflowExecutionId: WorkflowExecutionId;

  stepId: WorkflowStepId;

  stepName: string;

  correlationId: CorrelationId;

  input: TInput;

  workflowInput: unknown;

  variables: Record<string, unknown>;

  previousOutput?: unknown;

  attempt: number;

  maximumAttempts: number;

  signal: AbortSignal;

  metadata: Record<string, unknown>;

  setVariable(
    key: string,
    value: unknown
  ): void;

  getVariable<TValue = unknown>(
    key: string
  ): TValue | undefined;

  emit(
    name: string,
    payload?: unknown
  ): Promise<void>;

  waitForEvent<TPayload = unknown>(
    eventName: string,
    options?: WorkflowWaitForEventOptions
  ): Promise<TPayload>;

  waitForTimer(
    delayMs: number
  ): Promise<void>;

  executeChildWorkflow<
    TChildInput = unknown,
    TChildOutput = unknown
  >(
    workflowId: WorkflowId,
    input: TChildInput,
    options?: ChildWorkflowExecutionOptions
  ): Promise<TChildOutput>;
}

export type WorkflowStepHandler<
  TInput = unknown,
  TOutput = unknown
> = (
  context: WorkflowStepContext<TInput>
) => TOutput | Promise<TOutput>;

export type WorkflowCompensationHandler<
  TInput = unknown,
  TOutput = unknown
> = (
  context: WorkflowCompensationContext<
    TInput,
    TOutput
  >
) => void | Promise<void>;

export interface WorkflowCompensationContext<
  TInput = unknown,
  TOutput = unknown
> {
  workflowId: WorkflowId;

  workflowInstanceId: WorkflowInstanceId;

  workflowExecutionId: WorkflowExecutionId;

  stepId: WorkflowStepId;

  stepName: string;

  correlationId: CorrelationId;

  input: TInput;

  output: TOutput;

  workflowInput: unknown;

  variables: Record<string, unknown>;

  failure?: WorkflowExecutionError;

  metadata: Record<string, unknown>;

  signal: AbortSignal;

  emit(
    name: string,
    payload?: unknown
  ): Promise<void>;
}

export interface WorkflowStepDefinition<
  TInput = unknown,
  TOutput = unknown
> {
  id: WorkflowStepId;

  name: string;

  handler: WorkflowStepHandler<
    TInput,
    TOutput
  >;

  description?: string;

  enabled?: boolean;

  timeoutMs?: number;

  retry?: WorkflowRetryPolicy;

  compensate?: WorkflowCompensationHandler<
    TInput,
    TOutput
  >;

  condition?: (
    context: WorkflowStepContext<TInput>
  ) => boolean | Promise<boolean>;

  input?: (
    execution: WorkflowExecutionRecord
  ) => TInput | Promise<TInput>;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * Parallel Types
 * ============================================================
 */

export interface WorkflowParallelBranch {
  id: string;

  name: string;

  handler: WorkflowStepHandler;

  retry?: WorkflowRetryPolicy;

  timeoutMs?: number;

  metadata?: Record<string, unknown>;
}

export interface WorkflowParallelDefinition {
  id: WorkflowStepId;

  name: string;

  branches: WorkflowParallelBranch[];

  completionMode?: ParallelCompletionMode;

  failureStrategy?: WorkflowFailureStrategy;

  metadata?: Record<string, unknown>;
}

export interface WorkflowParallelBranchResult {
  branchId: string;

  branchName: string;

  status: "completed" | "failed";

  output?: unknown;

  error?: WorkflowExecutionError;

  startedAt: Date;

  completedAt: Date;

  durationMs: number;
}

export interface WorkflowParallelResult {
  mode: ParallelCompletionMode;

  branches: WorkflowParallelBranchResult[];

  successfulBranches: number;

  failedBranches: number;
}

/* ============================================================
 * Workflow Definition
 * ============================================================
 */

export type WorkflowExecutableNode =
  | WorkflowStepDefinition
  | WorkflowParallelDefinition;

export interface WorkflowDefinition {
  id: WorkflowId;

  name: string;

  version: string;

  nodes: WorkflowExecutableNode[];

  description?: string;

  failureStrategy?: WorkflowFailureStrategy;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * Execution Records
 * ============================================================
 */

export interface WorkflowExecutionError {
  name: string;

  message: string;

  stack?: string;

  code?: string;

  details?: Record<string, unknown>;

  occurredAt: Date;
}

export interface WorkflowStepExecutionRecord {
  stepId: WorkflowStepId;

  stepName: string;

  status: WorkflowStepExecutionStatus;

  index: number;

  attempt: number;

  maximumAttempts: number;

  startedAt?: Date;

  completedAt?: Date;

  durationMs?: number;

  input?: unknown;

  output?: unknown;

  error?: WorkflowExecutionError;

  retries: WorkflowRetryRecord[];

  compensatedAt?: Date;

  compensationError?: WorkflowExecutionError;

  metadata: Record<string, unknown>;
}

export interface WorkflowExecutionHistoryEntry {
  id: string;

  type:
    | "workflow"
    | "step"
    | "retry"
    | "wait"
    | "compensation"
    | "child"
    | "parallel";

  name: string;

  status: string;

  occurredAt: Date;

  stepId?: WorkflowStepId;

  message?: string;

  data?: Record<string, unknown>;
}

export interface WorkflowWaitState {
  type: WorkflowWaitType;

  name: string;

  startedAt: Date;

  eventName?: string;

  resumeAt?: Date;

  timeoutAt?: Date;

  metadata?: Record<string, unknown>;
}

export interface ChildWorkflowReference {
  workflowId: WorkflowId;

  workflowInstanceId: WorkflowInstanceId;

  executionId: WorkflowExecutionId;

  status: WorkflowExecutionStatus;

  startedAt: Date;

  completedAt?: Date;
}

export interface WorkflowExecutionRecord<
  TInput = unknown,
  TOutput = unknown
> {
  executionId: WorkflowExecutionId;

  workflowId: WorkflowId;

  workflowName: string;

  workflowVersion: string;

  instanceId: WorkflowInstanceId;

  correlationId: CorrelationId;

  status: WorkflowExecutionStatus;

  input: TInput;

  output?: TOutput;

  variables: Record<string, unknown>;

  currentNodeIndex: number;

  currentStepId?: WorkflowStepId;

  steps: WorkflowStepExecutionRecord[];

  history: WorkflowExecutionHistoryEntry[];

  childWorkflows: ChildWorkflowReference[];

  waitState?: WorkflowWaitState;

  error?: WorkflowExecutionError;

  createdAt: Date;

  startedAt?: Date;

  updatedAt: Date;

  completedAt?: Date;

  failedAt?: Date;

  cancelledAt?: Date;

  pausedAt?: Date;

  metadata: Record<string, unknown>;
}

/* ============================================================
 * Input and Options
 * ============================================================
 */

export interface ExecuteWorkflowInput<
  TInput = unknown
> {
  definition: WorkflowDefinition;

  input: TInput;

  instanceId?: WorkflowInstanceId;

  executionId?: WorkflowExecutionId;

  correlationId?: CorrelationId;

  variables?: Record<string, unknown>;

  metadata?: Record<string, unknown>;

  startImmediately?: boolean;
}

export interface ResumeWorkflowOptions {
  input?: unknown;

  variables?: Record<string, unknown>;

  metadata?: Record<string, unknown>;
}

export interface WorkflowWaitForEventOptions {
  timeoutMs?: number;

  correlationId?: CorrelationId;

  predicate?: (
    payload: unknown
  ) => boolean;
}

export interface ChildWorkflowExecutionOptions {
  instanceId?: WorkflowInstanceId;

  correlationId?: CorrelationId;

  variables?: Record<string, unknown>;

  metadata?: Record<string, unknown>;
}

export interface RuntimeExecutorOptions {
  maximumConcurrentWorkflows?: number;

  defaultStepTimeoutMs?: number;

  defaultRetryPolicy?: WorkflowRetryPolicy;

  retainCompletedExecutions?: boolean;

  maximumRetainedExecutions?: number;

  autoCompensateOnFailure?: boolean;
}

/* ============================================================
 * Runtime Integration Ports
 * ============================================================
 */

export interface RuntimeExecutorEvent {
  name: string;

  payload: unknown;

  occurredAt: Date;

  correlationId?: CorrelationId;

  workflowInstanceId?: WorkflowInstanceId;

  workflowStepId?: WorkflowStepId;

  source?: string;

  metadata?: Record<string, unknown>;
}

export interface RuntimeExecutorEventPort {
  publish(input: {
    name: string;

    payload: unknown;

    correlationId?: CorrelationId;

    workflowInstanceId?: WorkflowInstanceId;

    workflowStepId?: WorkflowStepId;

    source?: string;

    metadata?: Record<string, unknown>;
  }): Promise<unknown>;

  waitFor<TPayload = unknown>(
    filter: {
      name?: string;

      correlationId?: CorrelationId;

      workflowInstanceId?: WorkflowInstanceId;

      workflowStepId?: WorkflowStepId;

      predicate?: (
        event: RuntimeExecutorEvent
      ) => boolean;
    },
    options?: {
      timeoutMs?: number;

      signal?: AbortSignal;
    }
  ): Promise<{
    payload: TPayload;
  }>;
}

export interface RuntimeExecutorSchedulerPort {
  delay(
    delayMs: number,
    name?: string
  ): Promise<void>;
}

export interface RuntimeExecutorPersistencePort {
  saveExecution(
    execution: WorkflowExecutionRecord
  ): Promise<void>;

  loadExecution?(
    instanceId: WorkflowInstanceId
  ): Promise<WorkflowExecutionRecord | null>;
}

export interface RuntimeExecutorDefinitionPort {
  getWorkflow(
    workflowId: WorkflowId,
    version?: string
  ): WorkflowDefinition | undefined;
}

export interface RuntimeExecutorDependencies {
  events?: RuntimeExecutorEventPort;

  scheduler?: RuntimeExecutorSchedulerPort;

  persistence?: RuntimeExecutorPersistencePort;

  definitions?: RuntimeExecutorDefinitionPort;
}

/* ============================================================
 * Statistics
 * ============================================================
 */

export interface RuntimeExecutorStatistics {
  executionCount: number;

  createdCount: number;

  runningCount: number;

  waitingCount: number;

  pausedCount: number;

  completedCount: number;

  failedCount: number;

  cancelledCount: number;

  totalWorkflowExecutions: number;

  totalStepExecutions: number;

  totalRetries: number;

  totalCompensations: number;

  activeExecutionCount: number;
}

/* ============================================================
 * Internal Types
 * ============================================================
 */

interface InternalExecution {
  definition: WorkflowDefinition;

  record: WorkflowExecutionRecord;

  controller: AbortController;

  executionPromise?: Promise<
    WorkflowExecutionRecord
  >;

  resolveWait?: (
    value: unknown
  ) => void;

  rejectWait?: (
    reason?: unknown
  ) => void;
}

/* ============================================================
 * Executor Errors
 * ============================================================
 */

export class RuntimeExecutorError extends Error {
  readonly code: string;

  readonly details?: Record<
    string,
    unknown
  >;

  constructor(
    message: string,
    code = "RUNTIME_EXECUTOR_ERROR",
    details?: Record<string, unknown>
  ) {
    super(message);

    this.name = "RuntimeExecutorError";

    this.code = code;

    this.details = details;

    Object.setPrototypeOf(
      this,
      new.target.prototype
    );
  }
}

/* ============================================================
 * Runtime Executor
 * ============================================================
 */

export class RuntimeExecutor {
  private readonly executions =
    new Map<
      WorkflowInstanceId,
      InternalExecution
    >();

  private readonly dependencies:
    RuntimeExecutorDependencies;

  private readonly maximumConcurrentWorkflows:
    number;

  private readonly defaultStepTimeoutMs:
    number;

  private readonly defaultRetryPolicy:
    WorkflowRetryPolicy;

  private readonly retainCompletedExecutions:
    boolean;

  private readonly maximumRetainedExecutions:
    number;

  private readonly autoCompensateOnFailure:
    boolean;

  private totalWorkflowExecutions = 0;

  private totalStepExecutions = 0;

  private totalRetries = 0;

  private totalCompensations = 0;

  constructor(
    dependencies:
      RuntimeExecutorDependencies = {},

    options:
      RuntimeExecutorOptions = {}
  ) {
    this.dependencies = dependencies;

    this.maximumConcurrentWorkflows =
      Math.max(
        1,
        Math.floor(
          options.maximumConcurrentWorkflows ??
            100
        )
      );

    this.defaultStepTimeoutMs =
      Math.max(
        0,
        Math.floor(
          options.defaultStepTimeoutMs ??
            30_000
        )
      );

    this.defaultRetryPolicy = {
      maximumAttempts:
        options.defaultRetryPolicy
          ?.maximumAttempts ?? 1,

      initialDelayMs:
        options.defaultRetryPolicy
          ?.initialDelayMs ?? 0,

      maximumDelayMs:
        options.defaultRetryPolicy
          ?.maximumDelayMs ?? 60_000,

      backoffMultiplier:
        options.defaultRetryPolicy
          ?.backoffMultiplier ?? 2,

      retryableErrors:
        options.defaultRetryPolicy
          ?.retryableErrors,

      shouldRetry:
        options.defaultRetryPolicy
          ?.shouldRetry,
    };

    this.retainCompletedExecutions =
      options.retainCompletedExecutions ??
      true;

    this.maximumRetainedExecutions =
      Math.max(
        0,
        Math.floor(
          options.maximumRetainedExecutions ??
            1000
        )
      );

    this.autoCompensateOnFailure =
      options.autoCompensateOnFailure ??
      true;
  }

  /* ==========================================================
   * Workflow Creation and Execution
   * ==========================================================
   */

  executeWorkflow<
    TInput = unknown,
    TOutput = unknown
  >(
    input: ExecuteWorkflowInput<TInput>
  ): Promise<
    WorkflowExecutionRecord<
      TInput,
      TOutput
    >
  > {
    this.validateDefinition(
      input.definition
    );

    this.assertConcurrencyAvailable();

    const instanceId =
      input.instanceId ??
      (`workflow_instance_${generateId(
        16
      )}` as WorkflowInstanceId);

    if (this.executions.has(instanceId)) {
      throw new RuntimeExecutorError(
        `Workflow instance '${instanceId}' already exists.`,
        "WORKFLOW_INSTANCE_EXISTS",
        {
          instanceId,
        }
      );
    }

    const executionId =
      input.executionId ??
      (`workflow_execution_${generateId(
        16
      )}` as WorkflowExecutionId);

    const correlationId =
      input.correlationId ??
      (`correlation_${generateId(
        16
      )}` as CorrelationId);

    const timestamp = now();

    const record:
      WorkflowExecutionRecord<
        TInput,
        TOutput
      > = {
        executionId,

        workflowId:
          input.definition.id,

        workflowName:
          input.definition.name,

        workflowVersion:
          input.definition.version,

        instanceId,

        correlationId,

        status: "created",

        input: this.clone(input.input),

        variables: this.clone(
          input.variables ?? {}
        ),

        currentNodeIndex: 0,

        steps: [],

        history: [],

        childWorkflows: [],

        createdAt: timestamp,

        updatedAt: timestamp,

        metadata: this.clone(
          input.metadata ?? {}
        ),
      };

    const internal: InternalExecution = {
      definition: input.definition,

      record:
        record as WorkflowExecutionRecord,

      controller:
        new AbortController(),
    };

    this.executions.set(
      instanceId,
      internal
    );

    this.totalWorkflowExecutions += 1;

    this.addHistory(
      record,
      "workflow",
      "Workflow created",
      "created"
    );

    void this.publishExecutorEvent(
      "workflow.created",
      record
    );

    void this.persist(record);

    if (input.startImmediately === false) {
      return Promise.resolve(record);
    }

    const executionPromise =
      this.runExecution(
        internal
      ) as Promise<
        WorkflowExecutionRecord<
          TInput,
          TOutput
        >
      >;

    internal.executionPromise =
      executionPromise as Promise<
        WorkflowExecutionRecord
      >;

    return executionPromise;
  }

  async executeRegisteredWorkflow<
    TInput = unknown,
    TOutput = unknown
  >(
    workflowId: WorkflowId,
    input: TInput,
    options: Omit<
      ExecuteWorkflowInput<TInput>,
      "definition" | "input"
    > & {
      version?: string;
    } = {}
  ): Promise<
    WorkflowExecutionRecord<
      TInput,
      TOutput
    >
  > {
    const definition =
      this.dependencies.definitions
        ?.getWorkflow(
          workflowId,
          options.version
        );

    if (!definition) {
      throw new RuntimeExecutorError(
        `Workflow definition '${workflowId}' was not found.`,
        "WORKFLOW_DEFINITION_NOT_FOUND",
        {
          workflowId,

          version: options.version,
        }
      );
    }

    return this.executeWorkflow<
      TInput,
      TOutput
    >({
      ...options,

      definition,

      input,
    });
  }

  private async runExecution(
    internal: InternalExecution
  ): Promise<WorkflowExecutionRecord> {
    const record = internal.record;

    if (
      this.isTerminalStatus(record.status)
    ) {
      return record;
    }

    record.status = "running";

    record.startedAt ??= now();

    record.updatedAt = now();

    record.pausedAt = undefined;

    record.waitState = undefined;

    this.addHistory(
      record,
      "workflow",
      "Workflow execution started",
      "running"
    );

    await this.publishExecutorEvent(
      record.startedAt?.getTime() ===
        record.createdAt.getTime()
        ? "workflow.started"
        : "workflow.resumed",
      record
    );

    await this.persist(record);

    try {
      while (
        record.currentNodeIndex <
        internal.definition.nodes.length
      ) {
        this.assertExecutionCanContinue(
          internal
        );

        const currentStatus =
          record.status as WorkflowExecutionStatus;

        if (
          currentStatus === "paused" ||
          currentStatus === "waiting"
        ) {
          return record;
        }

        const node =
          internal.definition.nodes[
            record.currentNodeIndex
          ];

        record.currentStepId = node.id;

        if (this.isParallelNode(node)) {
          await this.executeParallelNode(
            internal,
            node
          );
        } else {
          await this.executeStepNode(
            internal,
            node
          );
        }

        const nextStatus =
          record.status as WorkflowExecutionStatus;

        if (
          nextStatus === "paused" ||
          nextStatus === "waiting" ||
          this.isTerminalStatus(
            nextStatus
          )
        ) {
          return record;
        }

        record.currentNodeIndex += 1;

        record.currentStepId = undefined;

        record.updatedAt = now();

        await this.persist(record);
      }

      await this.completeWorkflow(
        record.instanceId,
        this.resolveWorkflowOutput(record)
      );

      return record;
    } catch (error) {
      const workflowStatus =
        record.status as WorkflowExecutionStatus;

      if (
        workflowStatus === "cancelled" ||
        internal.controller.signal.aborted
      ) {
        if (
          workflowStatus !== "cancelled"
        ) {
          await this.cancelWorkflow(
            record.instanceId,
            "Workflow execution was aborted."
          );
        }

        return record;
      }

      await this.handleWorkflowFailure(
        internal,
        error
      );

      return record;
    } finally {
      this.cleanupRetainedExecutions();
    }
  }

  /* ==========================================================
   * Sequential Step Execution
   * ==========================================================
   */

  private async executeStepNode(
    internal: InternalExecution,
    step: WorkflowStepDefinition
  ): Promise<void> {
    const record = internal.record;

    const stepInput = step.input
      ? await step.input(record)
      : record.currentNodeIndex === 0
        ? record.input
        : this.getPreviousStepOutput(
            record
          );

    const retryPolicy =
      this.normalizeRetryPolicy(
        step.retry
      );

    const stepRecord:
      WorkflowStepExecutionRecord = {
        stepId: step.id,

        stepName: step.name,

        status: "pending",

        index:
          record.currentNodeIndex,

        attempt: 0,

        maximumAttempts:
          retryPolicy.maximumAttempts,

        input: this.clone(stepInput),

        retries: [],

        metadata: this.clone(
          step.metadata ?? {}
        ),
      };

    record.steps.push(stepRecord);

    const shouldRun =
      step.enabled !== false &&
      (step.condition
        ? await step.condition(
            this.createStepContext(
              internal,
              step,
              stepInput,
              1,
              retryPolicy.maximumAttempts
            )
          )
        : true);

    if (!shouldRun) {
      stepRecord.status = "skipped";

      stepRecord.completedAt = now();

      stepRecord.durationMs = 0;

      this.addHistory(
        record,
        "step",
        `Step '${step.name}' skipped`,
        "skipped",
        step.id
      );

      await this.persist(record);

      return;
    }

    let lastError: unknown;

    for (
      let attempt = 1;
      attempt <=
      retryPolicy.maximumAttempts;
      attempt += 1
    ) {
      this.assertExecutionCanContinue(
        internal
      );

      stepRecord.attempt = attempt;

      stepRecord.status = "running";

      stepRecord.startedAt ??= now();

      record.updatedAt = now();

      this.totalStepExecutions += 1;

      this.addHistory(
        record,
        "step",
        `Step '${step.name}' started`,
        "running",
        step.id,
        {
          attempt,

          maximumAttempts:
            retryPolicy.maximumAttempts,
        }
      );

      await this.publishExecutorEvent(
        "step.started",
        {
          execution: record,

          step: stepRecord,
        },
        step.id
      );

      await this.persist(record);

      try {
        const context =
          this.createStepContext(
            internal,
            step,
            stepInput,
            attempt,
            retryPolicy.maximumAttempts
          );

        const output =
          await this.executeWithTimeout(
            () =>
              step.handler(context),
            step.timeoutMs ??
              this.defaultStepTimeoutMs,
            `Step '${step.name}' timed out.`,
            internal.controller.signal
          );

        stepRecord.status = "completed";

        stepRecord.output =
          this.clone(output);

        stepRecord.completedAt = now();

        stepRecord.durationMs =
          stepRecord.startedAt
            ? stepRecord.completedAt.getTime() -
              stepRecord.startedAt.getTime()
            : 0;

        record.updatedAt = now();

        this.addHistory(
          record,
          "step",
          `Step '${step.name}' completed`,
          "completed",
          step.id,
          {
            attempt,

            durationMs:
              stepRecord.durationMs,
          }
        );

        await this.publishExecutorEvent(
          "step.completed",
          {
            execution: record,

            step: stepRecord,

            output,
          },
          step.id
        );

        await this.persist(record);

        return;
      } catch (error) {
        lastError = error;

        const executionError =
          this.toExecutionError(error);

        stepRecord.error =
          executionError;

        const shouldRetry =
          attempt <
            retryPolicy.maximumAttempts &&
          (await this.shouldRetry(
            retryPolicy,
            error,
            attempt
          ));

        if (!shouldRetry) {
          stepRecord.status = "failed";

          stepRecord.completedAt = now();

          stepRecord.durationMs =
            stepRecord.startedAt
              ? stepRecord.completedAt.getTime() -
                stepRecord.startedAt.getTime()
              : 0;

          record.updatedAt = now();

          this.addHistory(
            record,
            "step",
            `Step '${step.name}' failed`,
            "failed",
            step.id,
            {
              attempt,

              error:
                executionError.message,
            }
          );

          await this.publishExecutorEvent(
            "step.failed",
            {
              execution: record,

              step: stepRecord,

              error: executionError,
            },
            step.id
          );

          await this.persist(record);

          throw error;
        }

        const delayMs =
          this.calculateRetryDelay(
            retryPolicy,
            attempt
          );

        const retryRecord:
          WorkflowRetryRecord = {
            attempt: attempt + 1,

            scheduledAt: now(),

            delayMs,

            errorMessage:
              executionError.message,
          };

        stepRecord.retries.push(
          retryRecord
        );

        this.totalRetries += 1;

        this.addHistory(
          record,
          "retry",
          `Retry scheduled for step '${step.name}'`,
          "scheduled",
          step.id,
          {
            attempt: attempt + 1,

            delayMs,

            error:
              executionError.message,
          }
        );

        await this.publishExecutorEvent(
          "step.retrying",
          {
            execution: record,

            step: stepRecord,

            retry: retryRecord,
          },
          step.id
        );

        await this.persist(record);

        await this.delay(
          delayMs,
          `Retry ${attempt + 1} for ${step.name}`
        );

        retryRecord.executedAt = now();
      }
    }

    throw lastError;
  }

  /* ==========================================================
   * Parallel Execution
   * ==========================================================
   */

  private async executeParallelNode(
    internal: InternalExecution,
    node: WorkflowParallelDefinition
  ): Promise<void> {
    const record = internal.record;

    const startedAt = now();

    const stepRecord:
      WorkflowStepExecutionRecord = {
        stepId: node.id,

        stepName: node.name,

        status: "running",

        index:
          record.currentNodeIndex,

        attempt: 1,

        maximumAttempts: 1,

        startedAt,

        retries: [],

        metadata: this.clone(
          node.metadata ?? {}
        ),
      };

    record.steps.push(stepRecord);

    this.addHistory(
      record,
      "parallel",
      `Parallel node '${node.name}' started`,
      "running",
      node.id,
      {
        branchCount:
          node.branches.length,

        completionMode:
          node.completionMode ?? "all",
      }
    );

    await this.persist(record);

    const branchPromises =
      node.branches.map(
        async (
          branch
        ): Promise<WorkflowParallelBranchResult> => {
          const branchStartedAt = now();

          try {
            const output =
              await this.executeParallelBranch(
                internal,
                node,
                branch
              );

            const completedAt = now();

            return {
              branchId: branch.id,

              branchName: branch.name,

              status: "completed",

              output:
                this.clone(output),

              startedAt:
                branchStartedAt,

              completedAt,

              durationMs:
                completedAt.getTime() -
                branchStartedAt.getTime(),
            };
          } catch (error) {
            const completedAt = now();

            return {
              branchId: branch.id,

              branchName: branch.name,

              status: "failed",

              error:
                this.toExecutionError(
                  error
                ),

              startedAt:
                branchStartedAt,

              completedAt,

              durationMs:
                completedAt.getTime() -
                branchStartedAt.getTime(),
            };
          }
        }
      );

    const mode =
      node.completionMode ?? "all";

    let branchResults:
      WorkflowParallelBranchResult[];

    if (mode === "any") {
      const firstSuccessful =
        await this.waitForFirstSuccessful(
          branchPromises
        );

      branchResults = [
        firstSuccessful,
      ];
    } else {
      branchResults =
        await Promise.all(
          branchPromises
        );
    }

    const result:
      WorkflowParallelResult = {
        mode,

        branches: branchResults,

        successfulBranches:
          branchResults.filter(
            (branch) =>
              branch.status ===
              "completed"
          ).length,

        failedBranches:
          branchResults.filter(
            (branch) =>
              branch.status ===
              "failed"
          ).length,
      };

    const failureStrategy =
      node.failureStrategy ??
      internal.definition
        .failureStrategy ??
      "fail";

    if (
      result.failedBranches > 0 &&
      failureStrategy === "fail"
    ) {
      const firstFailure =
        result.branches.find(
          (branch) =>
            branch.status === "failed"
        );

      stepRecord.status = "failed";

      stepRecord.output = result;

      stepRecord.error =
        firstFailure?.error ??
        this.toExecutionError(
          new Error(
            `Parallel node '${node.name}' failed.`
          )
        );

      stepRecord.completedAt = now();

      stepRecord.durationMs =
        stepRecord.completedAt.getTime() -
        startedAt.getTime();

      await this.persist(record);

      throw new RuntimeExecutorError(
        `Parallel node '${node.name}' failed.`,
        "PARALLEL_NODE_FAILED",
        {
          nodeId: node.id,

          failedBranches:
            result.failedBranches,
        }
      );
    }

    stepRecord.status = "completed";

    stepRecord.output = result;

    stepRecord.completedAt = now();

    stepRecord.durationMs =
      stepRecord.completedAt.getTime() -
      startedAt.getTime();

    record.updatedAt = now();

    this.addHistory(
      record,
      "parallel",
      `Parallel node '${node.name}' completed`,
      "completed",
      node.id,
      {
        successfulBranches:
          result.successfulBranches,

        failedBranches:
          result.failedBranches,
      }
    );

    await this.persist(record);
  }

  private async executeParallelBranch(
    internal: InternalExecution,
    node: WorkflowParallelDefinition,
    branch: WorkflowParallelBranch
  ): Promise<unknown> {
    const retryPolicy =
      this.normalizeRetryPolicy(
        branch.retry
      );

    let lastError: unknown;

    for (
      let attempt = 1;
      attempt <=
      retryPolicy.maximumAttempts;
      attempt += 1
    ) {
      try {
        const context:
          WorkflowStepContext = {
            workflowId:
              internal.record
                .workflowId,

            workflowInstanceId:
              internal.record
                .instanceId,

            workflowExecutionId:
              internal.record
                .executionId,

            stepId: node.id,

            stepName:
              `${node.name}:${branch.name}`,

            correlationId:
              internal.record
                .correlationId,

            input:
              this.getPreviousStepOutput(
                internal.record
              ) ??
              internal.record.input,

            workflowInput:
              internal.record.input,

            variables:
              internal.record.variables,

            previousOutput:
              this.getPreviousStepOutput(
                internal.record
              ),

            attempt,

            maximumAttempts:
              retryPolicy.maximumAttempts,

            signal:
              internal.controller.signal,

            metadata: this.clone(
              branch.metadata ?? {}
            ),

            setVariable: (
              key,
              value
            ) => {
              internal.record.variables[
                key
              ] = value;

              internal.record.updatedAt =
                now();
            },

            getVariable: <
              TValue = unknown
            >(
              key: string
            ) =>
              internal.record.variables[
                key
              ] as TValue | undefined,

            emit: async (
              name,
              payload
            ) => {
              await this.emitRuntimeEvent(
                internal,
                node.id,
                name,
                payload
              );
            },

            waitForEvent: async <
              TPayload = unknown
            >(
              eventName: string,
              options: WorkflowWaitForEventOptions = {}
            ) =>
              this.waitForEvent<
                TPayload
              >(
                internal.record
                  .instanceId,
                eventName,
                options
              ),

            waitForTimer: async (
              delayMs
            ) => {
              await this.waitForTimer(
                internal.record
                  .instanceId,
                delayMs
              );
            },

            executeChildWorkflow:
              async <
                TChildInput = unknown,
                TChildOutput = unknown
              >(
                workflowId:
                  WorkflowId,
                input:
                  TChildInput,
                options:
                  ChildWorkflowExecutionOptions = {}
              ) =>
                this.executeChildWorkflow<
                  TChildInput,
                  TChildOutput
                >(
                  internal,
                  workflowId,
                  input,
                  options
                ),
          };

        return await this.executeWithTimeout(
          () =>
            branch.handler(context),
          branch.timeoutMs ??
            this.defaultStepTimeoutMs,
          `Parallel branch '${branch.name}' timed out.`,
          internal.controller.signal
        );
      } catch (error) {
        lastError = error;

        const shouldRetry =
          attempt <
            retryPolicy.maximumAttempts &&
          (await this.shouldRetry(
            retryPolicy,
            error,
            attempt
          ));

        if (!shouldRetry) {
          throw error;
        }

        const delayMs =
          this.calculateRetryDelay(
            retryPolicy,
            attempt
          );

        this.totalRetries += 1;

        await this.delay(
          delayMs,
          `Retry ${attempt + 1} for branch ${branch.name}`
        );
      }
    }

    throw lastError;
  }

  /* ==========================================================
   * Pause, Resume, and Cancel
   * ==========================================================
   */

  async pauseWorkflow(
    instanceId: WorkflowInstanceId,
    reason = "Workflow paused."
  ): Promise<WorkflowExecutionRecord> {
    const internal =
      this.requireInternalExecution(
        instanceId
      );

    const record = internal.record;

    if (
      this.isTerminalStatus(record.status)
    ) {
      throw new RuntimeExecutorError(
        `Workflow '${instanceId}' cannot be paused because it is ${record.status}.`,
        "INVALID_WORKFLOW_STATUS",
        {
          instanceId,

          status: record.status,
        }
      );
    }

    record.status = "paused";

    record.pausedAt = now();

    record.updatedAt = now();

    this.addHistory(
      record,
      "workflow",
      reason,
      "paused"
    );

    await this.publishExecutorEvent(
      "workflow.paused",
      {
        execution: record,

        reason,
      }
    );

    await this.persist(record);

    return record;
  }

  async resumeWorkflow(
    instanceId: WorkflowInstanceId,
    options:
      ResumeWorkflowOptions = {}
  ): Promise<WorkflowExecutionRecord> {
    const internal =
      this.requireInternalExecution(
        instanceId
      );

    const record = internal.record;

    if (
      record.status !== "paused" &&
      record.status !== "waiting"
    ) {
      throw new RuntimeExecutorError(
        `Workflow '${instanceId}' is not paused or waiting.`,
        "WORKFLOW_NOT_RESUMABLE",
        {
          instanceId,

          status: record.status,
        }
      );
    }

    if (options.input !== undefined) {
      record.variables[
        "resumeInput"
      ] = this.clone(options.input);
    }

    if (options.variables) {
      Object.assign(
        record.variables,
        this.clone(options.variables)
      );
    }

    if (options.metadata) {
      Object.assign(
        record.metadata,
        this.clone(options.metadata)
      );
    }

    record.status = "running";

    record.waitState = undefined;

    record.pausedAt = undefined;

    record.updatedAt = now();

    this.addHistory(
      record,
      "workflow",
      "Workflow resumed",
      "running"
    );

    await this.publishExecutorEvent(
      "workflow.resumed",
      record
    );

    await this.persist(record);

    const executionPromise =
      this.runExecution(internal);

    internal.executionPromise =
      executionPromise;

    return executionPromise;
  }

  async cancelWorkflow(
    instanceId: WorkflowInstanceId,
    reason = "Workflow cancelled."
  ): Promise<WorkflowExecutionRecord> {
    const internal =
      this.requireInternalExecution(
        instanceId
      );

    const record = internal.record;

    if (
      this.isTerminalStatus(record.status)
    ) {
      return record;
    }

    internal.controller.abort(reason);

    record.status = "cancelled";

    record.cancelledAt = now();

    record.updatedAt = now();

    record.waitState = undefined;

    if (record.currentStepId) {
      const activeStep =
        this.findLatestStep(
          record,
          record.currentStepId
        );

      if (
        activeStep &&
        (activeStep.status ===
          "running" ||
          activeStep.status ===
            "waiting")
      ) {
        activeStep.status =
          "cancelled";

        activeStep.completedAt =
          now();
      }
    }

    this.addHistory(
      record,
      "workflow",
      reason,
      "cancelled"
    );

    await this.publishExecutorEvent(
      "workflow.cancelled",
      {
        execution: record,

        reason,
      }
    );

    await this.persist(record);

    this.cleanupRetainedExecutions();

    return record;
  }

  /* ==========================================================
   * Completion and Failure
   * ==========================================================
   */

  async completeWorkflow(
    instanceId: WorkflowInstanceId,
    output?: unknown
  ): Promise<WorkflowExecutionRecord> {
    const internal =
      this.requireInternalExecution(
        instanceId
      );

    const record = internal.record;

    if (
      record.status === "cancelled" ||
      record.status === "failed"
    ) {
      return record;
    }

    record.status = "completed";

    record.output =
      this.clone(output);

    record.completedAt = now();

    record.updatedAt = now();

    record.currentStepId = undefined;

    record.waitState = undefined;

    this.addHistory(
      record,
      "workflow",
      "Workflow completed",
      "completed"
    );

    await this.publishExecutorEvent(
      "workflow.completed",
      record
    );

    await this.persist(record);

    this.cleanupRetainedExecutions();

    return record;
  }

  async failWorkflow(
    instanceId: WorkflowInstanceId,
    error: unknown
  ): Promise<WorkflowExecutionRecord> {
    const internal =
      this.requireInternalExecution(
        instanceId
      );

    await this.handleWorkflowFailure(
      internal,
      error
    );

    return internal.record;
  }

  private async handleWorkflowFailure(
    internal: InternalExecution,
    error: unknown
  ): Promise<void> {
    const record = internal.record;

    const executionError =
      this.toExecutionError(error);

    const failureStrategy =
      internal.definition
        .failureStrategy ??
      (this.autoCompensateOnFailure
        ? "compensate"
        : "fail");

    if (
      failureStrategy === "continue"
    ) {
      record.currentNodeIndex += 1;

      record.currentStepId = undefined;

      record.status = "running";

      record.updatedAt = now();

      this.addHistory(
        record,
        "workflow",
        "Workflow continued after failure",
        "running",
        undefined,
        {
          error:
            executionError.message,
        }
      );

      await this.persist(record);

      return;
    }

    if (
      failureStrategy ===
      "compensate"
    ) {
      try {
        await this.compensateWorkflow(
          internal,
          executionError
        );
      } catch (compensationError) {
        record.error =
          this.toExecutionError(
            compensationError
          );
      }
    }

    record.status = "failed";

    record.error ??=
      executionError;

    record.failedAt = now();

    record.updatedAt = now();

    record.currentStepId = undefined;

    record.waitState = undefined;

    this.addHistory(
      record,
      "workflow",
      `Workflow failed: ${record.error.message}`,
      "failed"
    );

    await this.publishExecutorEvent(
      "workflow.failed",
      {
        execution: record,

        error: record.error,
      }
    );

    await this.persist(record);

    this.cleanupRetainedExecutions();
  }

  /* ==========================================================
   * Compensation and Rollback
   * ==========================================================
   */

  private async compensateWorkflow(
    internal: InternalExecution,
    failure: WorkflowExecutionError
  ): Promise<void> {
    const record = internal.record;

    record.status = "compensating";

    record.updatedAt = now();

    this.addHistory(
      record,
      "compensation",
      "Workflow compensation started",
      "running"
    );

    await this.publishExecutorEvent(
      "workflow.compensation.started",
      {
        execution: record,

        failure,
      }
    );

    await this.persist(record);

    const completedSteps =
      [...record.steps]
        .filter(
          (step) =>
            step.status ===
            "completed"
        )
        .reverse();

    for (const stepRecord of completedSteps) {
      const node =
        internal.definition.nodes.find(
          (candidate) =>
            candidate.id ===
            stepRecord.stepId
        );

      if (
        !node ||
        this.isParallelNode(node) ||
        !node.compensate
      ) {
        continue;
      }

      this.totalCompensations += 1;

      try {
        await node.compensate({
          workflowId:
            record.workflowId,

          workflowInstanceId:
            record.instanceId,

          workflowExecutionId:
            record.executionId,

          stepId:
            stepRecord.stepId,

          stepName:
            stepRecord.stepName,

          correlationId:
            record.correlationId,

          input:
            stepRecord.input,

          output:
            stepRecord.output,

          workflowInput:
            record.input,

          variables:
            record.variables,

          failure,

          metadata:
            stepRecord.metadata,

          signal:
            internal.controller.signal,

          emit: async (
            name,
            payload
          ) => {
            await this.emitRuntimeEvent(
              internal,
              stepRecord.stepId,
              name,
              payload
            );
          },
        });

        stepRecord.status =
          "compensated";

        stepRecord.compensatedAt =
          now();

        this.addHistory(
          record,
          "compensation",
          `Step '${stepRecord.stepName}' compensated`,
          "completed",
          stepRecord.stepId
        );

        await this.publishExecutorEvent(
          "step.compensated",
          {
            execution: record,

            step: stepRecord,
          },
          stepRecord.stepId
        );
      } catch (error) {
        stepRecord.status =
          "compensation_failed";

        stepRecord.compensationError =
          this.toExecutionError(
            error
          );

        this.addHistory(
          record,
          "compensation",
          `Compensation failed for step '${stepRecord.stepName}'`,
          "failed",
          stepRecord.stepId,
          {
            error:
              stepRecord
                .compensationError
                .message,
          }
        );

        await this.publishExecutorEvent(
          "step.compensation_failed",
          {
            execution: record,

            step: stepRecord,

            error:
              stepRecord
                .compensationError,
          },
          stepRecord.stepId
        );

        await this.publishExecutorEvent(
          "workflow.compensation.failed",
          {
            execution: record,

            step: stepRecord,
          }
        );

        await this.persist(record);

        throw error;
      }

      await this.persist(record);
    }

    await this.publishExecutorEvent(
      "workflow.compensation.completed",
      record
    );
  }

  /* ==========================================================
   * Waiting for Events
   * ==========================================================
   */

  async waitForEvent<
    TPayload = unknown
  >(
    instanceId: WorkflowInstanceId,
    eventName: string,
    options:
      WorkflowWaitForEventOptions = {}
  ): Promise<TPayload> {
    const internal =
      this.requireInternalExecution(
        instanceId
      );

    const record = internal.record;

    if (!this.dependencies.events) {
      throw new RuntimeExecutorError(
        "Runtime event service is not configured.",
        "EVENT_SERVICE_NOT_CONFIGURED"
      );
    }

    const startedAt = now();

    record.status = "waiting";

    record.waitState = {
      type: "event",

      name:
        `Waiting for event '${eventName}'`,

      eventName,

      startedAt,

      timeoutAt:
        options.timeoutMs !==
        undefined
          ? new Date(
              startedAt.getTime() +
                options.timeoutMs
            )
          : undefined,
    };

    record.updatedAt = now();

    this.addHistory(
      record,
      "wait",
      `Waiting for event '${eventName}'`,
      "waiting",
      record.currentStepId
    );

    await this.publishExecutorEvent(
      "step.waiting",
      {
        execution: record,

        eventName,
      },
      record.currentStepId
    );

    await this.publishExecutorEvent(
      "workflow.waiting",
      {
        execution: record,

        waitState:
          record.waitState,
      }
    );

    await this.persist(record);

    try {
      const event =
        await this.dependencies.events.waitFor<TPayload>(
          {
            name: eventName,

            correlationId:
              options.correlationId ??
              record.correlationId,

            workflowInstanceId:
              record.instanceId,

            workflowStepId:
              record.currentStepId,

            predicate:
              options.predicate
                ? (
                    runtimeEvent
                  ) =>
                    options.predicate?.(
                      runtimeEvent.payload
                    ) ?? true
                : undefined,
          },
          {
            timeoutMs:
              options.timeoutMs,

            signal:
              internal.controller.signal,
          }
        );

      record.status = "running";

      record.waitState = undefined;

      record.updatedAt = now();

      this.addHistory(
        record,
        "wait",
        `Event '${eventName}' received`,
        "completed",
        record.currentStepId
      );

      await this.persist(record);

      return event.payload;
    } catch (error) {
      record.status = "running";

      record.waitState = undefined;

      record.updatedAt = now();

      await this.persist(record);

      throw error;
    }
  }

  /* ==========================================================
   * Waiting for Timers
   * ==========================================================
   */

  async waitForTimer(
    instanceId: WorkflowInstanceId,
    delayMs: number
  ): Promise<void> {
    const internal =
      this.requireInternalExecution(
        instanceId
      );

    const record = internal.record;

    this.validateDuration(
      delayMs,
      "delayMs"
    );

    const startedAt = now();

    record.status = "waiting";

    record.waitState = {
      type: "timer",

      name:
        `Waiting ${delayMs}ms`,

      startedAt,

      resumeAt: new Date(
        startedAt.getTime() +
          delayMs
      ),
    };

    record.updatedAt = now();

    this.addHistory(
      record,
      "wait",
      `Timer wait started for ${delayMs}ms`,
      "waiting",
      record.currentStepId
    );

    await this.publishExecutorEvent(
      "workflow.waiting",
      {
        execution: record,

        waitState:
          record.waitState,
      }
    );

    await this.persist(record);

    await this.delay(
      delayMs,
      `Workflow timer ${instanceId}`
    );

    this.assertExecutionCanContinue(
      internal
    );

    record.status = "running";

    record.waitState = undefined;

    record.updatedAt = now();

    this.addHistory(
      record,
      "wait",
      "Timer wait completed",
      "completed",
      record.currentStepId
    );

    await this.persist(record);
  }

  /* ==========================================================
   * Child Workflows
   * ==========================================================
   */

  private async executeChildWorkflow<
    TChildInput = unknown,
    TChildOutput = unknown
  >(
    parent: InternalExecution,
    workflowId: WorkflowId,
    input: TChildInput,
    options:
      ChildWorkflowExecutionOptions = {}
  ): Promise<TChildOutput> {
    const definition =
      this.dependencies.definitions
        ?.getWorkflow(workflowId);

    if (!definition) {
      throw new RuntimeExecutorError(
        `Child workflow definition '${workflowId}' was not found.`,
        "CHILD_WORKFLOW_NOT_FOUND",
        {
          workflowId,

          parentInstanceId:
            parent.record.instanceId,
        }
      );
    }

    const childExecution =
      await this.executeWorkflow<
        TChildInput,
        TChildOutput
      >({
        definition,

        input,

        instanceId:
          options.instanceId,

        correlationId:
          options.correlationId ??
          parent.record
            .correlationId,

        variables:
          options.variables,

        metadata: {
          ...options.metadata,

          parentWorkflowId:
            parent.record.workflowId,

          parentInstanceId:
            parent.record.instanceId,

          parentExecutionId:
            parent.record.executionId,
        },
      });

    const childReference:
      ChildWorkflowReference = {
        workflowId,

        workflowInstanceId:
          childExecution.instanceId,

        executionId:
          childExecution.executionId,

        status:
          childExecution.status,

        startedAt:
          childExecution.startedAt ??
          childExecution.createdAt,

        completedAt:
          childExecution.completedAt,
      };

    parent.record.childWorkflows.push(
      childReference
    );

    this.addHistory(
      parent.record,
      "child",
      `Child workflow '${workflowId}' completed`,
      childExecution.status,
      parent.record.currentStepId,
      {
        childInstanceId:
          childExecution.instanceId,

        childExecutionId:
          childExecution.executionId,
      }
    );

    await this.publishExecutorEvent(
      childExecution.status ===
        "completed"
        ? "child.completed"
        : "child.failed",
      {
        parent:
          parent.record,

        child:
          childExecution,
      },
      parent.record.currentStepId
    );

    await this.persist(
      parent.record
    );

    if (
      childExecution.status !==
      "completed"
    ) {
      throw new RuntimeExecutorError(
        `Child workflow '${workflowId}' did not complete successfully.`,
        "CHILD_WORKFLOW_FAILED",
        {
          workflowId,

          childInstanceId:
            childExecution.instanceId,

          status:
            childExecution.status,
        }
      );
    }

    return childExecution.output as
      TChildOutput;
  }

  /* ==========================================================
   * Execution Queries
   * ==========================================================
   */

  getExecution(
    instanceId: WorkflowInstanceId
  ): WorkflowExecutionRecord | undefined {
    const internal =
      this.executions.get(instanceId);

    return internal
      ? this.clone(internal.record)
      : undefined;
  }

  getExecutionRequired(
    instanceId: WorkflowInstanceId
  ): WorkflowExecutionRecord {
    const execution =
      this.getExecution(instanceId);

    if (!execution) {
      throw new RuntimeExecutorError(
        `Workflow execution '${instanceId}' was not found.`,
        "WORKFLOW_EXECUTION_NOT_FOUND",
        {
          instanceId,
        }
      );
    }

    return execution;
  }

  hasExecution(
    instanceId: WorkflowInstanceId
  ): boolean {
    return this.executions.has(
      instanceId
    );
  }

  listExecutions():
  WorkflowExecutionRecord[] {
    return [...this.executions.values()]
      .map((internal) =>
        this.clone(internal.record)
      )
      .sort(
        (left, right) =>
          right.createdAt.getTime() -
          left.createdAt.getTime()
      );
  }

  getRunningExecutions():
  WorkflowExecutionRecord[] {
    return this.listExecutions().filter(
      (execution) =>
        execution.status ===
          "running" ||
        execution.status ===
          "waiting" ||
        execution.status ===
          "compensating"
    );
  }

  getPausedExecutions():
  WorkflowExecutionRecord[] {
    return this.listExecutions().filter(
      (execution) =>
        execution.status === "paused"
    );
  }

  getWaitingExecutions():
  WorkflowExecutionRecord[] {
    return this.listExecutions().filter(
      (execution) =>
        execution.status === "waiting"
    );
  }

  removeExecution(
    instanceId: WorkflowInstanceId
  ): boolean {
    const internal =
      this.executions.get(instanceId);

    if (!internal) {
      return false;
    }

    if (
      !this.isTerminalStatus(
        internal.record.status
      )
    ) {
      throw new RuntimeExecutorError(
        `Active workflow '${instanceId}' cannot be removed.`,
        "ACTIVE_WORKFLOW_REMOVAL_DENIED",
        {
          instanceId,

          status:
            internal.record.status,
        }
      );
    }

    return this.executions.delete(
      instanceId
    );
  }

  /* ==========================================================
   * Statistics
   * ==========================================================
   */

  statistics():
  RuntimeExecutorStatistics {
    const executions =
      this.listExecutions();

    const countStatus = (
      status:
        WorkflowExecutionStatus
    ): number =>
      executions.filter(
        (execution) =>
          execution.status === status
      ).length;

    return {
      executionCount:
        executions.length,

      createdCount:
        countStatus("created"),

      runningCount:
        countStatus("running"),

      waitingCount:
        countStatus("waiting"),

      pausedCount:
        countStatus("paused"),

      completedCount:
        countStatus("completed"),

      failedCount:
        countStatus("failed"),

      cancelledCount:
        countStatus("cancelled"),

      totalWorkflowExecutions:
        this.totalWorkflowExecutions,

      totalStepExecutions:
        this.totalStepExecutions,

      totalRetries:
        this.totalRetries,

      totalCompensations:
        this.totalCompensations,

      activeExecutionCount:
        executions.filter(
          (execution) =>
            !this.isTerminalStatus(
              execution.status
            )
        ).length,
    };
  }

  /* ==========================================================
   * Cleanup
   * ==========================================================
   */

  async cancelAll(
    reason =
      "Runtime executor shutting down."
  ): Promise<number> {
    const active =
      this.listExecutions().filter(
        (execution) =>
          !this.isTerminalStatus(
            execution.status
          )
      );

    for (const execution of active) {
      await this.cancelWorkflow(
        execution.instanceId,
        reason
      );
    }

    return active.length;
  }

  clearCompleted(): number {
    let removed = 0;

    for (const [
      instanceId,
      internal,
    ] of this.executions.entries()) {
      if (
        this.isTerminalStatus(
          internal.record.status
        )
      ) {
        this.executions.delete(
          instanceId
        );

        removed += 1;
      }
    }

    return removed;
  }

  async clear(): Promise<void> {
    await this.cancelAll(
      "Runtime executor cleared."
    );

    this.executions.clear();

    this.totalWorkflowExecutions = 0;

    this.totalStepExecutions = 0;

    this.totalRetries = 0;

    this.totalCompensations = 0;
  }

  /* ==========================================================
   * Step Context
   * ==========================================================
   */

  private createStepContext<
    TInput = unknown
  >(
    internal: InternalExecution,
    step: WorkflowStepDefinition<TInput>,
    input: TInput,
    attempt: number,
    maximumAttempts: number
  ): WorkflowStepContext<TInput> {
    const record = internal.record;

    return {
      workflowId:
        record.workflowId,

      workflowInstanceId:
        record.instanceId,

      workflowExecutionId:
        record.executionId,

      stepId: step.id,

      stepName: step.name,

      correlationId:
        record.correlationId,

      input,

      workflowInput:
        record.input,

      variables:
        record.variables,

      previousOutput:
        this.getPreviousStepOutput(
          record
        ),

      attempt,

      maximumAttempts,

      signal:
        internal.controller.signal,

      metadata: this.clone(
        step.metadata ?? {}
      ),

      setVariable: (
        key,
        value
      ) => {
        if (
          typeof key !== "string" ||
          key.trim().length === 0
        ) {
          throw new RuntimeExecutorError(
            "Workflow variable key must be a non-empty string.",
            "INVALID_VARIABLE_KEY"
          );
        }

        record.variables[
          key
        ] = value;

        record.updatedAt = now();
      },

      getVariable: <
        TValue = unknown
      >(
        key: string
      ) =>
        record.variables[
          key
        ] as TValue | undefined,

      emit: async (
        name,
        payload
      ) => {
        await this.emitRuntimeEvent(
          internal,
          step.id,
          name,
          payload
        );
      },

      waitForEvent: async <
        TPayload = unknown
      >(
        eventName: string,
        options:
          WorkflowWaitForEventOptions = {}
      ) =>
        this.waitForEvent<TPayload>(
          record.instanceId,
          eventName,
          options
        ),

      waitForTimer: async (
        delayMs
      ) => {
        await this.waitForTimer(
          record.instanceId,
          delayMs
        );
      },

      executeChildWorkflow:
        async <
          TChildInput = unknown,
          TChildOutput = unknown
        >(
          workflowId:
            WorkflowId,
          childInput:
            TChildInput,
          options:
            ChildWorkflowExecutionOptions = {}
        ) =>
          this.executeChildWorkflow<
            TChildInput,
            TChildOutput
          >(
            internal,
            workflowId,
            childInput,
            options
          ),
    };
  }

  /* ==========================================================
   * Runtime Events
   * ==========================================================
   */

  private async emitRuntimeEvent(
    internal: InternalExecution,
    stepId: WorkflowStepId,
    name: string,
    payload?: unknown
  ): Promise<void> {
    if (!this.dependencies.events) {
      return;
    }

    await this.dependencies.events.publish({
      name,

      payload,

      correlationId:
        internal.record
          .correlationId,

      workflowInstanceId:
        internal.record.instanceId,

      workflowStepId: stepId,

      source:
        "RuntimeExecutor",

      metadata: {
        workflowId:
          internal.record
            .workflowId,

        executionId:
          internal.record
            .executionId,
      },
    });
  }

  private async publishExecutorEvent(
    name: WorkflowExecutorEventName,
    payload: unknown,
    stepId?: WorkflowStepId
  ): Promise<void> {
    if (!this.dependencies.events) {
      return;
    }

    const execution =
      this.extractExecution(payload);

    await this.dependencies.events.publish({
      name,

      payload,

      correlationId:
        execution?.correlationId,

      workflowInstanceId:
        execution?.instanceId,

      workflowStepId:
        stepId,

      source:
        "RuntimeExecutor",
    });
  }

  /* ==========================================================
   * Persistence
   * ==========================================================
   */

  private async persist(
    record: WorkflowExecutionRecord
  ): Promise<void> {
    if (!this.dependencies.persistence) {
      return;
    }

    await this.dependencies.persistence
      .saveExecution(
        this.clone(record)
      );
  }

  /* ==========================================================
   * Timeout and Delay
   * ==========================================================
   */

  private async executeWithTimeout<
    TResult
  >(
    operation: () =>
      TResult | Promise<TResult>,
    timeoutMs: number,
    timeoutMessage: string,
    signal: AbortSignal
  ): Promise<TResult> {
    if (signal.aborted) {
      throw new RuntimeExecutorError(
        "Workflow execution was aborted.",
        "WORKFLOW_ABORTED"
      );
    }

    if (timeoutMs <= 0) {
      return operation();
    }

    return new Promise<TResult>(
      (resolve, reject) => {
        let completed = false;

        const cleanup = (): void => {
          signal.removeEventListener(
            "abort",
            onAbort
          );

          clearTimeout(timeout);
        };

        const onAbort = (): void => {
          if (completed) {
            return;
          }

          completed = true;

          cleanup();

          reject(
            new RuntimeExecutorError(
              "Workflow execution was aborted.",
              "WORKFLOW_ABORTED"
            )
          );
        };

        const timeout =
          setTimeout(() => {
            if (completed) {
              return;
            }

            completed = true;

            cleanup();

            reject(
              new RuntimeExecutorError(
                timeoutMessage,
                "STEP_TIMEOUT",
                {
                  timeoutMs,
                }
              )
            );
          }, timeoutMs);

        signal.addEventListener(
          "abort",
          onAbort,
          {
            once: true,
          }
        );

        Promise.resolve()
          .then(operation)
          .then(
            (result) => {
              if (completed) {
                return;
              }

              completed = true;

              cleanup();

              resolve(result);
            },
            (error) => {
              if (completed) {
                return;
              }

              completed = true;

              cleanup();

              reject(error);
            }
          );
      }
    );
  }

  private async delay(
    delayMs: number,
    name: string
  ): Promise<void> {
    if (delayMs <= 0) {
      return;
    }

    if (this.dependencies.scheduler) {
      await this.dependencies.scheduler.delay(
        delayMs,
        name
      );

      return;
    }

    await new Promise<void>(
      (resolve) => {
        setTimeout(resolve, delayMs);
      }
    );
  }

  /* ==========================================================
   * Retry Helpers
   * ==========================================================
   */

  private normalizeRetryPolicy(
    policy?: WorkflowRetryPolicy
  ): Required<
    Pick<
      WorkflowRetryPolicy,
      | "maximumAttempts"
      | "initialDelayMs"
      | "maximumDelayMs"
      | "backoffMultiplier"
    >
  > &
    Pick<
      WorkflowRetryPolicy,
      | "retryableErrors"
      | "shouldRetry"
    > {
    return {
      maximumAttempts:
        Math.max(
          1,
          Math.floor(
            policy?.maximumAttempts ??
              this.defaultRetryPolicy
                .maximumAttempts
          )
        ),

      initialDelayMs:
        Math.max(
          0,
          policy?.initialDelayMs ??
            this.defaultRetryPolicy
              .initialDelayMs ??
            0
        ),

      maximumDelayMs:
        Math.max(
          0,
          policy?.maximumDelayMs ??
            this.defaultRetryPolicy
              .maximumDelayMs ??
            60_000
        ),

      backoffMultiplier:
        Math.max(
          1,
          policy?.backoffMultiplier ??
            this.defaultRetryPolicy
              .backoffMultiplier ??
            2
        ),

      retryableErrors:
        policy?.retryableErrors ??
        this.defaultRetryPolicy
          .retryableErrors,

      shouldRetry:
        policy?.shouldRetry ??
        this.defaultRetryPolicy
          .shouldRetry,
    };
  }

  private async shouldRetry(
    policy:
      ReturnType<
        RuntimeExecutor[
          "normalizeRetryPolicy"
        ]
      >,
    error: unknown,
    attempt: number
  ): Promise<boolean> {
    if (policy.shouldRetry) {
      return policy.shouldRetry(
        error,
        attempt
      );
    }

    if (
      policy.retryableErrors &&
      policy.retryableErrors.length > 0
    ) {
      const errorName =
        error instanceof Error
          ? error.name
          : typeof error;

      return policy.retryableErrors.includes(
        errorName
      );
    }

    return true;
  }

  private calculateRetryDelay(
    policy:
      ReturnType<
        RuntimeExecutor[
          "normalizeRetryPolicy"
        ]
      >,
    completedAttempt: number
  ): number {
    const calculated =
      policy.initialDelayMs *
      Math.pow(
        policy.backoffMultiplier,
        Math.max(
          0,
          completedAttempt - 1
        )
      );

    return Math.min(
      policy.maximumDelayMs,
      Math.floor(calculated)
    );
  }

  /* ==========================================================
   * Validation
   * ==========================================================
   */

  private validateDefinition(
    definition: WorkflowDefinition
  ): void {
    if (
      !definition ||
      typeof definition !== "object"
    ) {
      throw new RuntimeExecutorError(
        "Workflow definition is required.",
        "INVALID_WORKFLOW_DEFINITION"
      );
    }

    if (
      typeof definition.id !== "string" ||
      definition.id.trim().length === 0
    ) {
      throw new RuntimeExecutorError(
        "Workflow definition id is required.",
        "INVALID_WORKFLOW_ID"
      );
    }

    if (
      typeof definition.name !==
        "string" ||
      definition.name.trim().length ===
        0
    ) {
      throw new RuntimeExecutorError(
        "Workflow definition name is required.",
        "INVALID_WORKFLOW_NAME"
      );
    }

    if (
      !Array.isArray(definition.nodes)
    ) {
      throw new RuntimeExecutorError(
        "Workflow definition nodes must be an array.",
        "INVALID_WORKFLOW_NODES"
      );
    }

    const nodeIds = new Set<string>();

    for (const node of definition.nodes) {
      if (
        typeof node.id !== "string" ||
        node.id.trim().length === 0
      ) {
        throw new RuntimeExecutorError(
          "Every workflow node requires an id.",
          "INVALID_WORKFLOW_NODE_ID"
        );
      }

      if (nodeIds.has(node.id)) {
        throw new RuntimeExecutorError(
          `Duplicate workflow node id '${node.id}'.`,
          "DUPLICATE_WORKFLOW_NODE_ID",
          {
            nodeId: node.id,
          }
        );
      }

      nodeIds.add(node.id);

      if (this.isParallelNode(node)) {
        if (
          !Array.isArray(
            node.branches
          ) ||
          node.branches.length === 0
        ) {
          throw new RuntimeExecutorError(
            `Parallel node '${node.id}' requires at least one branch.`,
            "INVALID_PARALLEL_NODE"
          );
        }

        for (
          const branch of node.branches
        ) {
          if (
            typeof branch.handler !==
            "function"
          ) {
            throw new RuntimeExecutorError(
              `Parallel branch '${branch.id}' requires a handler.`,
              "INVALID_PARALLEL_BRANCH"
            );
          }
        }
      } else if (
        typeof node.handler !==
        "function"
      ) {
        throw new RuntimeExecutorError(
          `Workflow step '${node.id}' requires a handler.`,
          "INVALID_WORKFLOW_STEP"
        );
      }
    }
  }

  private assertConcurrencyAvailable():
  void {
    const activeCount =
      [...this.executions.values()]
        .filter(
          (internal) =>
            !this.isTerminalStatus(
              internal.record.status
            )
        ).length;

    if (
      activeCount >=
      this.maximumConcurrentWorkflows
    ) {
      throw new RuntimeExecutorError(
        "Maximum concurrent workflow limit reached.",
        "MAXIMUM_CONCURRENCY_REACHED",
        {
          maximumConcurrentWorkflows:
            this.maximumConcurrentWorkflows,

          activeCount,
        }
      );
    }
  }

  private assertExecutionCanContinue(
    internal: InternalExecution
  ): void {
    const record = internal.record;

    if (
      internal.controller.signal.aborted
    ) {
      throw new RuntimeExecutorError(
        "Workflow execution was aborted.",
        "WORKFLOW_ABORTED",
        {
          instanceId:
            record.instanceId,
        }
      );
    }

    if (
      record.status === "cancelled"
    ) {
      throw new RuntimeExecutorError(
        "Workflow execution was cancelled.",
        "WORKFLOW_CANCELLED",
        {
          instanceId:
            record.instanceId,
        }
      );
    }

    if (record.status === "failed") {
      throw new RuntimeExecutorError(
        "Workflow execution has failed.",
        "WORKFLOW_FAILED",
        {
          instanceId:
            record.instanceId,
        }
      );
    }
  }

  private validateDuration(
    value: number,
    fieldName: string
  ): void {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new RuntimeExecutorError(
        `${fieldName} must be a non-negative finite number.`,
        "INVALID_DURATION",
        {
          fieldName,

          value,
        }
      );
    }
  }

  /* ==========================================================
   * General Helpers
   * ==========================================================
   */

  private requireInternalExecution(
    instanceId: WorkflowInstanceId
  ): InternalExecution {
    const internal =
      this.executions.get(instanceId);

    if (!internal) {
      throw new RuntimeExecutorError(
        `Workflow execution '${instanceId}' was not found.`,
        "WORKFLOW_EXECUTION_NOT_FOUND",
        {
          instanceId,
        }
      );
    }

    return internal;
  }

  private isParallelNode(
    node: WorkflowExecutableNode
  ): node is WorkflowParallelDefinition {
    return (
      "branches" in node &&
      Array.isArray(node.branches)
    );
  }

  private isTerminalStatus(
    status: WorkflowExecutionStatus
  ): boolean {
    return (
      status === "completed" ||
      status === "failed" ||
      status === "cancelled"
    );
  }

  private getPreviousStepOutput(
    record: WorkflowExecutionRecord
  ): unknown {
    for (
      let index =
        record.steps.length - 1;
      index >= 0;
      index -= 1
    ) {
      const step =
        record.steps[index];

      if (
        step.status === "completed" ||
        step.status ===
          "compensated"
      ) {
        return step.output;
      }
    }

    return undefined;
  }

  private resolveWorkflowOutput(
    record: WorkflowExecutionRecord
  ): unknown {
    return this.getPreviousStepOutput(
      record
    );
  }

  private findLatestStep(
    record: WorkflowExecutionRecord,
    stepId: WorkflowStepId
  ): WorkflowStepExecutionRecord | undefined {
    for (
      let index =
        record.steps.length - 1;
      index >= 0;
      index -= 1
    ) {
      if (
        record.steps[index].stepId ===
        stepId
      ) {
        return record.steps[index];
      }
    }

    return undefined;
  }

  private addHistory(
    record: WorkflowExecutionRecord,
    type:
      WorkflowExecutionHistoryEntry["type"],
    name: string,
    status: string,
    stepId?: WorkflowStepId,
    data?: Record<string, unknown>
  ): void {
    record.history.push({
      id: `history_${generateId(12)}`,

      type,

      name,

      status,

      occurredAt: now(),

      stepId,

      data: data
        ? this.clone(data)
        : undefined,
    });

    record.updatedAt = now();
  }

  private toExecutionError(
    error: unknown
  ): WorkflowExecutionError {
    if (error instanceof RuntimeExecutorError) {
      return {
        name: error.name,

        message: error.message,

        stack: error.stack,

        code: error.code,

        details: error.details,

        occurredAt: now(),
      };
    }

    if (error instanceof Error) {
      return {
        name: error.name,

        message: error.message,

        stack: error.stack,

        occurredAt: now(),
      };
    }

    return {
      name: "UnknownError",

      message:
        typeof error === "string"
          ? error
          : String(error),

      occurredAt: now(),
    };
  }

  private extractExecution(
    payload: unknown
  ): WorkflowExecutionRecord | undefined {
    if (
      payload &&
      typeof payload === "object"
    ) {
      if (
        "instanceId" in payload &&
        "executionId" in payload
      ) {
        return payload as
          WorkflowExecutionRecord;
      }

      if (
        "execution" in payload
      ) {
        const execution = (
          payload as {
            execution?: unknown;
          }
        ).execution;

        if (
          execution &&
          typeof execution ===
            "object" &&
          "instanceId" in
            execution &&
          "executionId" in
            execution
        ) {
          return execution as
            WorkflowExecutionRecord;
        }
      }
    }

    return undefined;
  }

  private async waitForFirstSuccessful(
    promises: Promise<
      WorkflowParallelBranchResult
    >[]
  ): Promise<WorkflowParallelBranchResult> {
    return new Promise(
      (resolve, reject) => {
        let remaining =
          promises.length;

        const failures:
          WorkflowParallelBranchResult[] =
          [];

        if (remaining === 0) {
          reject(
            new RuntimeExecutorError(
              "Parallel execution contains no branches.",
              "EMPTY_PARALLEL_EXECUTION"
            )
          );

          return;
        }

        for (const promise of promises) {
          void promise.then(
            (result) => {
              if (
                result.status ===
                "completed"
              ) {
                resolve(result);

                return;
              }

              failures.push(result);

              remaining -= 1;

              if (remaining === 0) {
                reject(
                  new RuntimeExecutorError(
                    "All parallel branches failed.",
                    "ALL_PARALLEL_BRANCHES_FAILED",
                    {
                      failures,
                    }
                  )
                );
              }
            },
            (error) => {
              remaining -= 1;

              if (remaining === 0) {
                reject(error);
              }
            }
          );
        }
      }
    );
  }

  private cleanupRetainedExecutions():
  void {
    if (
      !this.retainCompletedExecutions
    ) {
      this.clearCompleted();

      return;
    }

    if (
      this.maximumRetainedExecutions <=
      0
    ) {
      return;
    }

    const terminalExecutions =
      [...this.executions.values()]
        .filter(
          (internal) =>
            this.isTerminalStatus(
              internal.record.status
            )
        )
        .sort(
          (left, right) =>
            this.getTerminalTimestamp(
              left.record
            ) -
            this.getTerminalTimestamp(
              right.record
            )
        );

    const excess =
      terminalExecutions.length -
      this.maximumRetainedExecutions;

    if (excess <= 0) {
      return;
    }

    for (
      let index = 0;
      index < excess;
      index += 1
    ) {
      this.executions.delete(
        terminalExecutions[index]
          .record.instanceId
      );
    }
  }

  private getTerminalTimestamp(
    record: WorkflowExecutionRecord
  ): number {
    return (
      record.completedAt ??
      record.failedAt ??
      record.cancelledAt ??
      record.updatedAt
    ).getTime();
  }

  private clone<TValue>(
    value: TValue
  ): TValue {
    if (
      value === undefined ||
      value === null
    ) {
      return value;
    }

    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(value);
      } catch {
        return value;
      }
    }

    return value;
  }
}

/* ============================================================
 * Factory
 * ============================================================
 */

export function createRuntimeExecutor(
  dependencies?:
    RuntimeExecutorDependencies,

  options?:
    RuntimeExecutorOptions
): RuntimeExecutor {
  return new RuntimeExecutor(
    dependencies,
    options
  );
}