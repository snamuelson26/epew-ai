/**
 * ============================================================
 * IBOS Enterprise Operating System (IBOS-EOS)
 * Workflow Runtime
 * WorkflowErrors
 *
 * Version: 1.0
 * ============================================================
 */

import {
  WorkflowErrorCode,
  SerializedWorkflowError,
  serializeWorkflowError,
} from "./RuntimeTypes";

/**
 * ============================================================
 * Base Workflow Error
 * ============================================================
 */

export class WorkflowError extends Error {
  public readonly code: WorkflowErrorCode | string;

  public readonly details?: Record<string, unknown>;

  public readonly cause?: unknown;

  constructor(
    code: WorkflowErrorCode | string,
    message: string,
    details?: Record<string, unknown>,
    cause?: unknown
  ) {
    super(message);

    this.name = this.constructor.name;

    this.code = code;

    this.details = details;

    this.cause = cause;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  serialize(): SerializedWorkflowError {
    return serializeWorkflowError(this, this.code as WorkflowErrorCode);
  }

  toJSON() {
    return this.serialize();
  }
}

/**
 * ============================================================
 * Definition Errors
 * ============================================================
 */

export class WorkflowDefinitionNotFoundError extends WorkflowError {
  constructor(workflowId: string) {
    super(
      WorkflowErrorCode.DefinitionNotFound,
      `Workflow definition '${workflowId}' was not found.`,
      { workflowId }
    );
  }
}

export class WorkflowDefinitionAlreadyExistsError extends WorkflowError {
  constructor(workflowId: string) {
    super(
      WorkflowErrorCode.DefinitionAlreadyRegistered,
      `Workflow definition '${workflowId}' is already registered.`,
      { workflowId }
    );
  }
}

export class InvalidWorkflowDefinitionError extends WorkflowError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      WorkflowErrorCode.InvalidDefinition,
      message,
      details
    );
  }
}

/**
 * ============================================================
 * Runtime Errors
 * ============================================================
 */

export class WorkflowRuntimeUnavailableError extends WorkflowError {
  constructor() {
    super(
      WorkflowErrorCode.RuntimeUnavailable,
      "Workflow Runtime is unavailable."
    );
  }
}

export class WorkflowRuntimeShuttingDownError extends WorkflowError {
  constructor() {
    super(
      WorkflowErrorCode.RuntimeShuttingDown,
      "Workflow Runtime is shutting down."
    );
  }
}

/**
 * ============================================================
 * Instance Errors
 * ============================================================
 */

export class WorkflowInstanceNotFoundError extends WorkflowError {
  constructor(instanceId: string) {
    super(
      WorkflowErrorCode.InstanceNotFound,
      `Workflow instance '${instanceId}' was not found.`,
      { instanceId }
    );
  }
}

export class InvalidWorkflowStateError extends WorkflowError {
  constructor(
    instanceId: string,
    state: string
  ) {
    super(
      WorkflowErrorCode.InvalidInstanceState,
      `Workflow instance '${instanceId}' cannot execute while in state '${state}'.`,
      {
        instanceId,
        state,
      }
    );
  }
}

/**
 * ============================================================
 * Step Errors
 * ============================================================
 */

export class InvalidWorkflowStepError extends WorkflowError {
  constructor(stepId: string) {
    super(
      WorkflowErrorCode.InvalidStep,
      `Workflow step '${stepId}' is invalid.`,
      { stepId }
    );
  }
}

export class WorkflowHandlerNotFoundError extends WorkflowError {
  constructor(handler: string) {
    super(
      WorkflowErrorCode.HandlerNotFound,
      `Workflow handler '${handler}' is not registered.`,
      { handler }
    );
  }
}

export class WorkflowStepExecutionError extends WorkflowError {
  constructor(
    stepId: string,
    cause?: unknown
  ) {
    super(
      WorkflowErrorCode.StepExecutionFailed,
      `Workflow step '${stepId}' failed.`,
      { stepId },
      cause
    );
  }
}

export class WorkflowTimeoutError extends WorkflowError {
  constructor(stepId: string) {
    super(
      WorkflowErrorCode.StepTimedOut,
      `Workflow step '${stepId}' exceeded its timeout.`,
      { stepId }
    );
  }
}

export class WorkflowRetryExceededError extends WorkflowError {
  constructor(stepId: string) {
    super(
      WorkflowErrorCode.RetryExhausted,
      `Workflow step '${stepId}' exceeded maximum retry attempts.`,
      { stepId }
    );
  }
}

/**
 * ============================================================
 * Approval Errors
 * ============================================================
 */

export class WorkflowApprovalRejectedError extends WorkflowError {
  constructor(stepId: string) {
    super(
      WorkflowErrorCode.ApprovalRejected,
      `Approval rejected for workflow step '${stepId}'.`,
      { stepId }
    );
  }
}

export class WorkflowApprovalTimeoutError extends WorkflowError {
  constructor(stepId: string) {
    super(
      WorkflowErrorCode.ApprovalTimedOut,
      `Approval timed out for workflow step '${stepId}'.`,
      { stepId }
    );
  }
}

/**
 * ============================================================
 * Event Errors
 * ============================================================
 */

export class WorkflowEventTimeoutError extends WorkflowError {
  constructor(
    stepId: string,
    eventName: string
  ) {
    super(
      WorkflowErrorCode.EventWaitTimedOut,
      `Timed out waiting for event '${eventName}'.`,
      {
        stepId,
        eventName,
      }
    );
  }
}

/**
 * ============================================================
 * Compensation
 * ============================================================
 */

export class WorkflowCompensationError extends WorkflowError {
  constructor(
    stepId: string,
    cause?: unknown
  ) {
    super(
      WorkflowErrorCode.CompensationFailed,
      `Compensation failed for step '${stepId}'.`,
      {
        stepId,
      },
      cause
    );
  }
}

/**
 * ============================================================
 * Persistence
 * ============================================================
 */

export class WorkflowPersistenceError extends WorkflowError {
  constructor(cause?: unknown) {
    super(
      WorkflowErrorCode.PersistenceFailed,
      "Workflow persistence operation failed.",
      undefined,
      cause
    );
  }
}

/**
 * ============================================================
 * Scheduler
 * ============================================================
 */

export class WorkflowSchedulingError extends WorkflowError {
  constructor(cause?: unknown) {
    super(
      WorkflowErrorCode.SchedulingFailed,
      "Workflow scheduling failed.",
      undefined,
      cause
    );
  }
}

/**
 * ============================================================
 * Recovery
 * ============================================================
 */

export class WorkflowRecoveryError extends WorkflowError {
  constructor(cause?: unknown) {
    super(
      WorkflowErrorCode.RecoveryFailed,
      "Workflow recovery failed.",
      undefined,
      cause
    );
  }
}

/**
 * ============================================================
 * Concurrency
 * ============================================================
 */

export class WorkflowConcurrencyLimitError extends WorkflowError {
  constructor(limit: number) {
    super(
      WorkflowErrorCode.ConcurrencyLimitReached,
      `Maximum concurrent workflow limit (${limit}) reached.`,
      {
        limit,
      }
    );
  }
}

/**
 * ============================================================
 * Cancellation
 * ============================================================
 */

export class WorkflowCancellationError extends WorkflowError {
  constructor(instanceId: string) {
    super(
      WorkflowErrorCode.CancellationFailed,
      `Unable to cancel workflow instance '${instanceId}'.`,
      {
        instanceId,
      }
    );
  }
}

/**
 * ============================================================
 * Internal Runtime Error
 * ============================================================
 */

export class WorkflowInternalError extends WorkflowError {
  constructor(
    message: string,
    cause?: unknown
  ) {
    super(
      WorkflowErrorCode.InternalError,
      message,
      undefined,
      cause
    );
  }
}

/**
 * ============================================================
 * Helper Functions
 * ============================================================
 */

export function isWorkflowError(
  value: unknown
): value is WorkflowError {
  return value instanceof WorkflowError;
}

export function ensureWorkflowError(
  error: unknown
): WorkflowError {
  if (isWorkflowError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new WorkflowInternalError(
      error.message,
      error
    );
  }

  return new WorkflowInternalError(
    "Unknown workflow runtime error.",
    error
  );
}