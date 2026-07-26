import {
  EngineConfig,
  EngineOperationResult,
  IEngine,
} from "./IEngine";

/**
 * Workflow execution status.
 */
export type WorkflowStatus =
  | "draft"
  | "ready"
  | "running"
  | "paused"
  | "waiting"
  | "completed"
  | "cancelled"
  | "failed";

/**
 * Individual workflow step status.
 */
export type WorkflowStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "skipped"
  | "failed";

/**
 * Workflow step definition.
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  order: number;
  engine?: string;
  action?: string;
  required?: boolean;
  timeoutSeconds?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Workflow definition.
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version?: string;
  enabled?: boolean;
  steps: WorkflowStep[];
}

/**
 * Workflow instance.
 */
export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: WorkflowStatus;
  currentStepId?: string;
  startedAt?: string;
  completedAt?: string;
  data?: Record<string, unknown>;
}

/**
 * Workflow execution result.
 */
export interface WorkflowResult {
  success: boolean;
  workflowId: string;
  status: WorkflowStatus;
  currentStepId?: string;
  message?: string;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Workflow event.
 */
export interface WorkflowEvent {
  id: string;
  workflowId: string;
  stepId?: string;
  type: string;
  occurredAt: string;
  data?: Record<string, unknown>;
}

/**
 * Workflow Engine configuration.
 */
export interface WorkflowEngineConfig extends EngineConfig {
  autoRetry?: boolean;
  retryAttempts?: number;
  loggingEnabled?: boolean;
  historyEnabled?: boolean;
}

/**
 * IBOS Enterprise Workflow Engine.
 */
export interface IWorkflowEngine
  extends IEngine<WorkflowEngineConfig> {

  /**
   * Register workflow definition.
   */
  registerWorkflow(
    workflow: WorkflowDefinition,
  ): Promise<EngineOperationResult>;

  /**
   * Remove workflow definition.
   */
  unregisterWorkflow(
    workflowId: string,
  ): Promise<EngineOperationResult>;

  /**
   * Retrieve workflow definition.
   */
  getWorkflow(
    workflowId: string,
  ): WorkflowDefinition | undefined;

  /**
   * Start workflow execution.
   */
  startWorkflow(
    workflowId: string,
    data?: Record<string, unknown>,
  ): Promise<WorkflowResult>;

  /**
   * Pause workflow.
   */
  pauseWorkflow(
    instanceId: string,
  ): Promise<WorkflowResult>;

  /**
   * Resume workflow.
   */
  resumeWorkflow(
    instanceId: string,
  ): Promise<WorkflowResult>;

  /**
   * Cancel workflow.
   */
  cancelWorkflow(
    instanceId: string,
  ): Promise<WorkflowResult>;

  /**
   * Restart workflow.
   */
  restartWorkflow(
    instanceId: string,
  ): Promise<WorkflowResult>;

  /**
   * Complete current step.
   */
  completeStep(
    instanceId: string,
    stepId: string,
    data?: Record<string, unknown>,
  ): Promise<WorkflowResult>;

  /**
   * Fail current step.
   */
  failStep(
    instanceId: string,
    stepId: string,
    reason?: string,
  ): Promise<WorkflowResult>;

  /**
   * Skip workflow step.
   */
  skipStep(
    instanceId: string,
    stepId: string,
  ): Promise<WorkflowResult>;

  /**
   * Retrieve workflow instance.
   */
  getInstance(
    instanceId: string,
  ): Promise<WorkflowInstance | undefined>;

  /**
   * Retrieve workflow history.
   */
  getHistory(
    instanceId: string,
  ): Promise<WorkflowEvent[]>;

  /**
   * Determine whether workflow exists.
   */
  hasWorkflow(
    workflowId: string,
  ): boolean;

  /**
   * Reset workflow engine.
   */
  reset(): Promise<EngineOperationResult>;
}