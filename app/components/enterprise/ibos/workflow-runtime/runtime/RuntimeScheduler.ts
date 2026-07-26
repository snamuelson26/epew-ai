/**
 * ============================================================
 * IBOS Enterprise Operating System (IBOS-EOS)
 * Workflow Runtime Scheduler
 *
 * Responsible for:
 * - Delayed execution
 * - Scheduled workflow resume
 * - Retry timers
 * - Timeout timers
 * - Recurring tasks
 * - Heartbeats
 * - Task cancellation
 * - Scheduler lifecycle
 *
 * Version: 1.0.0
 * ============================================================
 */

import {
  WorkflowInstanceId,
  WorkflowStepId,
} from "../RuntimeTypes";

import {
  WorkflowSchedulingError,
} from "../WorkflowErrors";

import {
  generateId,
  now,
} from "./RuntimeHelpers";

/* ============================================================
 * Public Types
 * ============================================================
 */

export type ScheduledTaskId = string;

export type ScheduledTaskStatus =
  | "scheduled"
  | "running"
  | "completed"
  | "cancelled"
  | "failed";

export type ScheduledTaskType =
  | "delay"
  | "retry"
  | "timeout"
  | "resume"
  | "recurring"
  | "heartbeat"
  | "custom";

export type ScheduledTaskHandler = (
  task: ScheduledTask
) => void | Promise<void>;

export interface ScheduleTaskInput {
  type?: ScheduledTaskType;

  name: string;

  executeAt: Date;

  handler: ScheduledTaskHandler;

  workflowInstanceId?: WorkflowInstanceId;

  workflowStepId?: WorkflowStepId;

  correlationId?: string;

  metadata?: Record<string, unknown>;
}

export interface ScheduleDelayInput {
  name: string;

  delayMs: number;

  handler: ScheduledTaskHandler;

  type?: ScheduledTaskType;

  workflowInstanceId?: WorkflowInstanceId;

  workflowStepId?: WorkflowStepId;

  correlationId?: string;

  metadata?: Record<string, unknown>;
}

export interface ScheduleRetryInput {
  name: string;

  delayMs: number;

  attempt: number;

  maximumAttempts: number;

  handler: ScheduledTaskHandler;

  workflowInstanceId?: WorkflowInstanceId;

  workflowStepId?: WorkflowStepId;

  correlationId?: string;

  metadata?: Record<string, unknown>;
}

export interface ScheduleTimeoutInput {
  name: string;

  timeoutMs: number;

  handler: ScheduledTaskHandler;

  workflowInstanceId?: WorkflowInstanceId;

  workflowStepId?: WorkflowStepId;

  correlationId?: string;

  metadata?: Record<string, unknown>;
}

export interface ScheduleResumeInput {
  name?: string;

  executeAt?: Date;

  delayMs?: number;

  workflowInstanceId: WorkflowInstanceId;

  workflowStepId?: WorkflowStepId;

  handler: ScheduledTaskHandler;

  correlationId?: string;

  metadata?: Record<string, unknown>;
}

export interface ScheduleRecurringInput {
  name: string;

  intervalMs: number;

  handler: ScheduledTaskHandler;

  startAt?: Date;

  runImmediately?: boolean;

  maximumRuns?: number;

  workflowInstanceId?: WorkflowInstanceId;

  workflowStepId?: WorkflowStepId;

  correlationId?: string;

  metadata?: Record<string, unknown>;
}

export interface ScheduledTask {
  id: ScheduledTaskId;

  name: string;

  type: ScheduledTaskType;

  status: ScheduledTaskStatus;

  executeAt: Date;

  createdAt: Date;

  startedAt?: Date;

  completedAt?: Date;

  cancelledAt?: Date;

  failedAt?: Date;

  failureMessage?: string;

  workflowInstanceId?: WorkflowInstanceId;

  workflowStepId?: WorkflowStepId;

  correlationId?: string;

  metadata?: Record<string, unknown>;

  recurring?: {
    intervalMs: number;

    runCount: number;

    maximumRuns?: number;
  };
}

export interface ScheduledTaskHandle {
  id: ScheduledTaskId;

  cancel(): boolean;

  getTask(): ScheduledTask | undefined;
}

export interface RuntimeSchedulerStatistics {
  running: boolean;

  scheduledTaskCount: number;

  activeTimerCount: number;

  completedTaskCount: number;

  cancelledTaskCount: number;

  failedTaskCount: number;

  recurringTaskCount: number;

  totalScheduledCount: number;

  totalExecutedCount: number;
}

export interface RuntimeSchedulerOptions {
  autoStart?: boolean;

  retainCompletedTasks?: boolean;

  maximumRetainedTasks?: number;

  continueOnTaskError?: boolean;
}

/* ============================================================
 * Internal Types
 * ============================================================
 */

interface InternalScheduledTask {
  task: ScheduledTask;

  handler: ScheduledTaskHandler;

  timer?: ReturnType<typeof setTimeout>;
}

/* ============================================================
 * Runtime Scheduler
 * ============================================================
 */

export class RuntimeScheduler {
  private readonly tasks =
    new Map<
      ScheduledTaskId,
      InternalScheduledTask
    >();

  private readonly retainCompletedTasks:
    boolean;

  private readonly maximumRetainedTasks:
    number;

  private readonly continueOnTaskError:
    boolean;

  private running = false;

  private totalScheduledCount = 0;

  private totalExecutedCount = 0;

  constructor(
    options: RuntimeSchedulerOptions = {}
  ) {
    this.retainCompletedTasks =
      options.retainCompletedTasks ?? true;

    this.maximumRetainedTasks = Math.max(
      0,
      Math.floor(
        options.maximumRetainedTasks ?? 1000
      )
    );

    this.continueOnTaskError =
      options.continueOnTaskError ?? true;

    if (options.autoStart ?? true) {
      this.start();
    }
  }

  /* ==========================================================
   * Lifecycle
   * ==========================================================
   */

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;

    for (const record of this.tasks.values()) {
      if (
        record.task.status === "scheduled" &&
        !record.timer
      ) {
        this.activateTimer(record);
      }
    }
  }

  stop(
    cancelScheduledTasks = false
  ): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    for (const record of this.tasks.values()) {
      if (record.timer) {
        clearTimeout(record.timer);
        record.timer = undefined;
      }

      if (
        cancelScheduledTasks &&
        record.task.status === "scheduled"
      ) {
        this.markCancelled(record.task);
      }
    }

    this.cleanupRetainedTasks();
  }

  get isRunning(): boolean {
    return this.running;
  }

  /* ==========================================================
   * General Scheduling
   * ==========================================================
   */

  schedule(
    input: ScheduleTaskInput
  ): ScheduledTaskHandle {
    this.validateTaskName(input.name);
    this.validateDate(input.executeAt);

    if (typeof input.handler !== "function") {
      throw new WorkflowSchedulingError(
        "Scheduled task handler must be a function."
      );
    }

    const task: ScheduledTask = {
      id: `task_${generateId(12)}`,

      name: input.name.trim(),

      type: input.type ?? "custom",

      status: "scheduled",

      executeAt: new Date(
        input.executeAt.getTime()
      ),

      createdAt: now(),

      workflowInstanceId:
        input.workflowInstanceId,

      workflowStepId:
        input.workflowStepId,

      correlationId:
        input.correlationId,

      metadata: input.metadata
        ? { ...input.metadata }
        : undefined,
    };

    const record: InternalScheduledTask = {
      task,
      handler: input.handler,
    };

    this.tasks.set(task.id, record);

    this.totalScheduledCount += 1;

    if (this.running) {
      this.activateTimer(record);
    }

    return this.createHandle(task.id);
  }

  scheduleAt(
    name: string,
    executeAt: Date,
    handler: ScheduledTaskHandler
  ): ScheduledTaskHandle {
    return this.schedule({
      name,
      executeAt,
      handler,
      type: "custom",
    });
  }

  /* ==========================================================
   * Delay
   * ==========================================================
   */

  scheduleDelay(
    input: ScheduleDelayInput
  ): ScheduledTaskHandle {
    this.validateDuration(
      input.delayMs,
      "delayMs"
    );

    return this.schedule({
      name: input.name,

      type: input.type ?? "delay",

      executeAt: new Date(
        Date.now() + input.delayMs
      ),

      handler: input.handler,

      workflowInstanceId:
        input.workflowInstanceId,

      workflowStepId:
        input.workflowStepId,

      correlationId:
        input.correlationId,

      metadata: input.metadata,
    });
  }

  delay(
    delayMs: number,
    name = "Runtime delay"
  ): Promise<void> {
    this.validateDuration(
      delayMs,
      "delayMs"
    );

    return new Promise<void>(
      (resolve, reject) => {
        try {
          this.scheduleDelay({
            name,
            delayMs,

            handler: async () => {
              resolve();
            },
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  }

  /* ==========================================================
   * Retry Scheduling
   * ==========================================================
   */

  scheduleRetry(
    input: ScheduleRetryInput
  ): ScheduledTaskHandle {
    this.validateDuration(
      input.delayMs,
      "delayMs"
    );

    if (
      !Number.isInteger(input.attempt) ||
      input.attempt < 1
    ) {
      throw new WorkflowSchedulingError(
        "Retry attempt must be a positive integer."
      );
    }

    if (
      !Number.isInteger(
        input.maximumAttempts
      ) ||
      input.maximumAttempts < 1
    ) {
      throw new WorkflowSchedulingError(
        "Retry maximumAttempts must be a positive integer."
      );
    }

    if (
      input.attempt >
      input.maximumAttempts
    ) {
      throw new WorkflowSchedulingError(
        "Retry attempt cannot exceed maximumAttempts."
      );
    }

    return this.scheduleDelay({
      name: input.name,

      type: "retry",

      delayMs: input.delayMs,

      handler: input.handler,

      workflowInstanceId:
        input.workflowInstanceId,

      workflowStepId:
        input.workflowStepId,

      correlationId:
        input.correlationId,

      metadata: {
        ...input.metadata,

        retryAttempt:
          input.attempt,

        maximumAttempts:
          input.maximumAttempts,
      },
    });
  }

  /* ==========================================================
   * Timeout Scheduling
   * ==========================================================
   */

  scheduleTimeout(
    input: ScheduleTimeoutInput
  ): ScheduledTaskHandle {
    this.validateDuration(
      input.timeoutMs,
      "timeoutMs"
    );

    return this.scheduleDelay({
      name: input.name,

      type: "timeout",

      delayMs: input.timeoutMs,

      handler: input.handler,

      workflowInstanceId:
        input.workflowInstanceId,

      workflowStepId:
        input.workflowStepId,

      correlationId:
        input.correlationId,

      metadata: input.metadata,
    });
  }

  /* ==========================================================
   * Workflow Resume
   * ==========================================================
   */

  scheduleResume(
    input: ScheduleResumeInput
  ): ScheduledTaskHandle {
    if (
      input.executeAt === undefined &&
      input.delayMs === undefined
    ) {
      throw new WorkflowSchedulingError(
        "Scheduled resume requires executeAt or delayMs."
      );
    }

    if (
      input.executeAt !== undefined &&
      input.delayMs !== undefined
    ) {
      throw new WorkflowSchedulingError(
        "Scheduled resume cannot use both executeAt and delayMs."
      );
    }

    const executeAt =
      input.executeAt
        ? new Date(
            input.executeAt.getTime()
          )
        : new Date(
            Date.now() +
              (input.delayMs ?? 0)
          );

    return this.schedule({
      name:
        input.name ??
        `Resume workflow ${input.workflowInstanceId}`,

      type: "resume",

      executeAt,

      handler: input.handler,

      workflowInstanceId:
        input.workflowInstanceId,

      workflowStepId:
        input.workflowStepId,

      correlationId:
        input.correlationId,

      metadata: input.metadata,
    });
  }

  /* ==========================================================
   * Recurring Tasks
   * ==========================================================
   */

  scheduleRecurring(
    input: ScheduleRecurringInput
  ): ScheduledTaskHandle {
    this.validateTaskName(input.name);

    this.validateDuration(
      input.intervalMs,
      "intervalMs"
    );

    if (
      input.maximumRuns !== undefined &&
      (
        !Number.isInteger(
          input.maximumRuns
        ) ||
        input.maximumRuns < 1
      )
    ) {
      throw new WorkflowSchedulingError(
        "Recurring maximumRuns must be a positive integer."
      );
    }

    const executeAt =
      input.runImmediately
        ? now()
        : input.startAt
          ? new Date(
              input.startAt.getTime()
            )
          : new Date(
              Date.now() +
                input.intervalMs
            );

    const handle = this.schedule({
      name: input.name,

      type: "recurring",

      executeAt,

      handler: input.handler,

      workflowInstanceId:
        input.workflowInstanceId,

      workflowStepId:
        input.workflowStepId,

      correlationId:
        input.correlationId,

      metadata: input.metadata,
    });

    const record =
      this.tasks.get(handle.id);

    if (!record) {
      throw new WorkflowSchedulingError(
        "Failed to create recurring task."
      );
    }

    record.task.recurring = {
      intervalMs:
        input.intervalMs,

      runCount: 0,

      maximumRuns:
        input.maximumRuns,
    };

    return handle;
  }

  scheduleHeartbeat(
    name: string,
    intervalMs: number,
    handler: ScheduledTaskHandler,
    runImmediately = false
  ): ScheduledTaskHandle {
    const handle =
      this.scheduleRecurring({
        name,

        intervalMs,

        handler,

        runImmediately,

        metadata: {
          schedulerRole:
            "heartbeat",
        },
      });

    const record =
      this.tasks.get(handle.id);

    if (record) {
      record.task.type = "heartbeat";
    }

    return handle;
  }

  /* ==========================================================
   * Cancellation
   * ==========================================================
   */

  cancel(
    taskId: ScheduledTaskId
  ): boolean {
    const record =
      this.tasks.get(taskId);

    if (!record) {
      return false;
    }

    if (
      record.task.status !==
      "scheduled"
    ) {
      return false;
    }

    if (record.timer) {
      clearTimeout(record.timer);
      record.timer = undefined;
    }

    this.markCancelled(record.task);

    this.cleanupRetainedTasks();

    return true;
  }

  cancelByWorkflow(
    workflowInstanceId:
      WorkflowInstanceId
  ): number {
    let cancelledCount = 0;

    for (const record of this.tasks.values()) {
      if (
        record.task.workflowInstanceId ===
          workflowInstanceId &&
        this.cancel(record.task.id)
      ) {
        cancelledCount += 1;
      }
    }

    return cancelledCount;
  }

  cancelByStep(
    workflowInstanceId:
      WorkflowInstanceId,

    workflowStepId:
      WorkflowStepId
  ): number {
    let cancelledCount = 0;

    for (const record of this.tasks.values()) {
      if (
        record.task.workflowInstanceId ===
          workflowInstanceId &&
        record.task.workflowStepId ===
          workflowStepId &&
        this.cancel(record.task.id)
      ) {
        cancelledCount += 1;
      }
    }

    return cancelledCount;
  }

  cancelAll(): number {
    let cancelledCount = 0;

    for (const record of this.tasks.values()) {
      if (this.cancel(record.task.id)) {
        cancelledCount += 1;
      }
    }

    return cancelledCount;
  }

  /* ==========================================================
   * Queries
   * ==========================================================
   */

  getTask(
    taskId: ScheduledTaskId
  ): ScheduledTask | undefined {
    const record =
      this.tasks.get(taskId);

    return record
      ? this.cloneTask(record.task)
      : undefined;
  }

  hasTask(
    taskId: ScheduledTaskId
  ): boolean {
    return this.tasks.has(taskId);
  }

  listTasks(): ScheduledTask[] {
    return [...this.tasks.values()]
      .map((record) =>
        this.cloneTask(record.task)
      )
      .sort(
        (left, right) =>
          left.executeAt.getTime() -
          right.executeAt.getTime()
      );
  }

  listScheduledTasks():
  ScheduledTask[] {
    return this.listTasks().filter(
      (task) =>
        task.status === "scheduled"
    );
  }

  listWorkflowTasks(
    workflowInstanceId:
      WorkflowInstanceId
  ): ScheduledTask[] {
    return this.listTasks().filter(
      (task) =>
        task.workflowInstanceId ===
        workflowInstanceId
    );
  }

  getNextScheduledTask():
  ScheduledTask | undefined {
    return this.listScheduledTasks()[0];
  }

  /* ==========================================================
   * Statistics
   * ==========================================================
   */

  statistics():
  RuntimeSchedulerStatistics {
    const tasks = this.listTasks();

    return {
      running:
        this.running,

      scheduledTaskCount:
        tasks.filter(
          (task) =>
            task.status === "scheduled"
        ).length,

      activeTimerCount:
        [...this.tasks.values()].filter(
          (record) =>
            record.timer !== undefined
        ).length,

      completedTaskCount:
        tasks.filter(
          (task) =>
            task.status === "completed"
        ).length,

      cancelledTaskCount:
        tasks.filter(
          (task) =>
            task.status === "cancelled"
        ).length,

      failedTaskCount:
        tasks.filter(
          (task) =>
            task.status === "failed"
        ).length,

      recurringTaskCount:
        tasks.filter(
          (task) =>
            task.recurring !== undefined &&
            task.status === "scheduled"
        ).length,

      totalScheduledCount:
        this.totalScheduledCount,

      totalExecutedCount:
        this.totalExecutedCount,
    };
  }

  /* ==========================================================
   * Cleanup
   * ==========================================================
   */

  removeTask(
    taskId: ScheduledTaskId
  ): boolean {
    const record =
      this.tasks.get(taskId);

    if (!record) {
      return false;
    }

    if (record.timer) {
      clearTimeout(record.timer);
    }

    return this.tasks.delete(taskId);
  }

  removeCompletedTasks(): number {
    let removedCount = 0;

    for (const [
      taskId,
      record,
    ] of this.tasks.entries()) {
      if (
        record.task.status ===
          "completed" ||
        record.task.status ===
          "cancelled" ||
        record.task.status ===
          "failed"
      ) {
        if (record.timer) {
          clearTimeout(record.timer);
        }

        this.tasks.delete(taskId);
        removedCount += 1;
      }
    }

    return removedCount;
  }

  clear(): void {
    for (const record of this.tasks.values()) {
      if (record.timer) {
        clearTimeout(record.timer);
      }
    }

    this.tasks.clear();

    this.totalScheduledCount = 0;
    this.totalExecutedCount = 0;
  }

  /* ==========================================================
   * Private Execution
   * ==========================================================
   */

  private activateTimer(
    record: InternalScheduledTask
  ): void {
    if (
      !this.running ||
      record.task.status !==
        "scheduled"
    ) {
      return;
    }

    if (record.timer) {
      clearTimeout(record.timer);
    }

    const delayMs = Math.max(
      0,
      record.task.executeAt.getTime() -
        Date.now()
    );

    record.timer = setTimeout(() => {
      record.timer = undefined;

      void this.executeTask(record);
    }, delayMs);
  }

  private async executeTask(
    record: InternalScheduledTask
  ): Promise<void> {
    const task = record.task;

    if (
      !this.running ||
      task.status !== "scheduled"
    ) {
      return;
    }

    task.status = "running";
    task.startedAt = now();

    this.totalExecutedCount += 1;

    try {
      await record.handler(
        this.cloneTask(task)
      );

      if (task.recurring) {
        task.recurring.runCount += 1;

        const reachedMaximum =
          task.recurring.maximumRuns !==
            undefined &&
          task.recurring.runCount >=
            task.recurring.maximumRuns;

        if (reachedMaximum) {
          this.markCompleted(task);
        } else {
          task.status = "scheduled";

          task.executeAt = new Date(
            Date.now() +
              task.recurring.intervalMs
          );

          task.startedAt = undefined;

          this.activateTimer(record);
        }
      } else {
        this.markCompleted(task);
      }
    } catch (error) {
      task.status = "failed";

      task.failedAt = now();

      task.failureMessage =
        this.errorMessage(error);

      if (!this.continueOnTaskError) {
        throw error;
      }
    } finally {
      this.cleanupRetainedTasks();
    }
  }

  /* ==========================================================
   * Private Helpers
   * ==========================================================
   */

  private createHandle(
    taskId: ScheduledTaskId
  ): ScheduledTaskHandle {
    return {
      id: taskId,

      cancel: () =>
        this.cancel(taskId),

      getTask: () =>
        this.getTask(taskId),
    };
  }

  private markCompleted(
    task: ScheduledTask
  ): void {
    task.status = "completed";
    task.completedAt = now();

    if (!this.retainCompletedTasks) {
      this.tasks.delete(task.id);
    }
  }

  private markCancelled(
    task: ScheduledTask
  ): void {
    task.status = "cancelled";
    task.cancelledAt = now();

    if (!this.retainCompletedTasks) {
      this.tasks.delete(task.id);
    }
  }

  private cleanupRetainedTasks(): void {
    if (
      !this.retainCompletedTasks ||
      this.maximumRetainedTasks <= 0
    ) {
      return;
    }

    const completedTasks =
      [...this.tasks.values()]
        .filter(
          (record) =>
            record.task.status ===
              "completed" ||
            record.task.status ===
              "cancelled" ||
            record.task.status ===
              "failed"
        )
        .sort((left, right) => {
          const leftTime =
            this.getTerminalTime(
              left.task
            );

          const rightTime =
            this.getTerminalTime(
              right.task
            );

          return leftTime - rightTime;
        });

    const excessCount =
      completedTasks.length -
      this.maximumRetainedTasks;

    if (excessCount <= 0) {
      return;
    }

    for (
      let index = 0;
      index < excessCount;
      index += 1
    ) {
      this.tasks.delete(
        completedTasks[index].task.id
      );
    }
  }

  private getTerminalTime(
    task: ScheduledTask
  ): number {
    return (
      task.completedAt ??
      task.cancelledAt ??
      task.failedAt ??
      task.createdAt
    ).getTime();
  }

  private cloneTask(
    task: ScheduledTask
  ): ScheduledTask {
    return {
      ...task,

      executeAt:
        new Date(
          task.executeAt.getTime()
        ),

      createdAt:
        new Date(
          task.createdAt.getTime()
        ),

      startedAt:
        task.startedAt
          ? new Date(
              task.startedAt.getTime()
            )
          : undefined,

      completedAt:
        task.completedAt
          ? new Date(
              task.completedAt.getTime()
            )
          : undefined,

      cancelledAt:
        task.cancelledAt
          ? new Date(
              task.cancelledAt.getTime()
            )
          : undefined,

      failedAt:
        task.failedAt
          ? new Date(
              task.failedAt.getTime()
            )
          : undefined,

      metadata:
        task.metadata
          ? { ...task.metadata }
          : undefined,

      recurring:
        task.recurring
          ? { ...task.recurring }
          : undefined,
    };
  }

  private validateTaskName(
    name: string
  ): void {
    if (
      typeof name !== "string" ||
      name.trim().length === 0
    ) {
      throw new WorkflowSchedulingError(
        "Scheduled task name must be a non-empty string."
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
      throw new WorkflowSchedulingError(
        `${fieldName} must be a non-negative finite number.`
      );
    }
  }

  private validateDate(
    value: Date
  ): void {
    if (
      !(value instanceof Date) ||
      Number.isNaN(value.getTime())
    ) {
      throw new WorkflowSchedulingError(
        "Scheduled executeAt must be a valid Date."
      );
    }
  }

  private errorMessage(
    error: unknown
  ): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    return String(error);
  }
}

/* ============================================================
 * Factory
 * ============================================================
 */

export function createRuntimeScheduler(
  options?: RuntimeSchedulerOptions
): RuntimeScheduler {
  return new RuntimeScheduler(options);
}