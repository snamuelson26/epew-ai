/**
 * ============================================================
 * IBOS Enterprise Operating System (IBOS-EOS)
 * Runtime State Manager
 *
 * Version: 1.0
 * ============================================================
 */

import {
  CompleteWorkflowExecutionRecord,
  WorkflowInstanceId,
  WorkflowRuntimeStatus,
} from "../RuntimeTypes";

export class RuntimeState {

  /**
   * Runtime lifecycle
   */
  private runtimeStatus: WorkflowRuntimeStatus =
    WorkflowRuntimeStatus.Created;

  /**
   * Active workflow instances
   */
  private readonly activeWorkflows =
    new Map<
      WorkflowInstanceId,
      CompleteWorkflowExecutionRecord
    >();

  /**
   * Waiting workflow instances
   */
  private readonly waitingWorkflows =
    new Map<
      WorkflowInstanceId,
      CompleteWorkflowExecutionRecord
    >();

  /**
   * Suspended workflow instances
   */
  private readonly suspendedWorkflows =
    new Map<
      WorkflowInstanceId,
      CompleteWorkflowExecutionRecord
    >();

  /**
   * Runtime start time
   */
  private readonly startedAt = new Date();

  /**
   * ============================================================
   * Runtime Status
   * ============================================================
   */

  get status(): WorkflowRuntimeStatus {
    return this.runtimeStatus;
  }

  set status(value: WorkflowRuntimeStatus) {
    this.runtimeStatus = value;
  }

  /**
   * ============================================================
   * Active Workflows
   * ============================================================
   */

  addActive(
    workflow: CompleteWorkflowExecutionRecord
  ): void {
    this.activeWorkflows.set(
      workflow.instanceId,
      workflow
    );
  }

  removeActive(
    instanceId: WorkflowInstanceId
  ): void {
    this.activeWorkflows.delete(instanceId);
  }

  getActive(
    instanceId: WorkflowInstanceId
  ) {
    return this.activeWorkflows.get(instanceId);
  }

  getAllActive() {
    return [...this.activeWorkflows.values()];
  }

  get activeCount(): number {
    return this.activeWorkflows.size;
  }

  /**
   * ============================================================
   * Waiting Workflows
   * ============================================================
   */

  addWaiting(
    workflow: CompleteWorkflowExecutionRecord
  ): void {

    this.waitingWorkflows.set(
      workflow.instanceId,
      workflow
    );

    this.removeActive(workflow.instanceId);
  }

  removeWaiting(
    instanceId: WorkflowInstanceId
  ): void {

    this.waitingWorkflows.delete(instanceId);
  }

  getWaiting(
    instanceId: WorkflowInstanceId
  ) {
    return this.waitingWorkflows.get(instanceId);
  }

  getAllWaiting() {
    return [...this.waitingWorkflows.values()];
  }

  get waitingCount(): number {
    return this.waitingWorkflows.size;
  }

  /**
   * ============================================================
   * Suspended Workflows
   * ============================================================
   */

  addSuspended(
    workflow: CompleteWorkflowExecutionRecord
  ): void {

    this.suspendedWorkflows.set(
      workflow.instanceId,
      workflow
    );

    this.removeActive(workflow.instanceId);

    this.removeWaiting(workflow.instanceId);
  }

  removeSuspended(
    instanceId: WorkflowInstanceId
  ): void {

    this.suspendedWorkflows.delete(instanceId);
  }

  getSuspended(
    instanceId: WorkflowInstanceId
  ) {
    return this.suspendedWorkflows.get(instanceId);
  }

  getAllSuspended() {
    return [...this.suspendedWorkflows.values()];
  }

  get suspendedCount(): number {
    return this.suspendedWorkflows.size;
  }

  /**
   * ============================================================
   * Lookup
   * ============================================================
   */

  find(
    instanceId: WorkflowInstanceId
  ): CompleteWorkflowExecutionRecord | undefined {

    return (
      this.activeWorkflows.get(instanceId) ??
      this.waitingWorkflows.get(instanceId) ??
      this.suspendedWorkflows.get(instanceId)
    );
  }

  has(
    instanceId: WorkflowInstanceId
  ): boolean {

    return this.find(instanceId) !== undefined;
  }

  /**
   * ============================================================
   * Remove
   * ============================================================
   */

  remove(
    instanceId: WorkflowInstanceId
  ): void {

    this.activeWorkflows.delete(instanceId);

    this.waitingWorkflows.delete(instanceId);

    this.suspendedWorkflows.delete(instanceId);
  }

  /**
   * ============================================================
   * Statistics
   * ============================================================
   */

  get uptimeMs(): number {
    return Date.now() - this.startedAt.getTime();
  }

  statistics() {

    return {

      runtimeStatus: this.runtimeStatus,

      active: this.activeCount,

      waiting: this.waitingCount,

      suspended: this.suspendedCount,

      uptimeMs: this.uptimeMs,
    };
  }

  /**
   * ============================================================
   * Reset
   * ============================================================
   */

  clear(): void {

    this.activeWorkflows.clear();

    this.waitingWorkflows.clear();

    this.suspendedWorkflows.clear();
  }
}