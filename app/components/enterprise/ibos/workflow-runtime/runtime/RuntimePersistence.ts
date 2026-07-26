/**
 * ============================================================
 * IBOS Enterprise Operating System (IBOS-EOS)
 * Workflow Runtime Persistence
 *
 * Coordinates workflow storage, snapshots, transactions,
 * optimistic concurrency, and instance-level persistence locks.
 *
 * Version: 1.0.0
 * ============================================================
 */

import {
  CompleteWorkflowExecutionRecord,
  WorkflowInstanceId,
} from "../RuntimeTypes";

import {
  WorkflowPersistenceError,
} from "../WorkflowErrors";

import {
  deepClone,
  generateId,
  now,
} from "./RuntimeHelpers";

/* ============================================================
 * Public Types
 * ============================================================
 */

export type PersistenceVersion = number;

export interface PersistedWorkflowRecord {
  instanceId: WorkflowInstanceId;

  version: PersistenceVersion;

  workflow: CompleteWorkflowExecutionRecord;

  createdAt: Date;

  updatedAt: Date;
}

export interface WorkflowSnapshot {
  id: string;

  instanceId: WorkflowInstanceId;

  persistenceVersion: PersistenceVersion;

  workflow: CompleteWorkflowExecutionRecord;

  createdAt: Date;

  reason?: string;

  metadata?: Record<string, unknown>;
}

export interface SaveWorkflowOptions {
  expectedVersion?: PersistenceVersion;

  createSnapshot?: boolean;

  snapshotReason?: string;

  snapshotMetadata?: Record<string, unknown>;
}

export interface DeleteWorkflowOptions {
  expectedVersion?: PersistenceVersion;

  deleteSnapshots?: boolean;
}

export interface RuntimePersistenceStatistics {
  workflowCount: number;

  snapshotCount: number;

  activeTransactionCount: number;

  activeLockCount: number;

  saveCount: number;

  loadCount: number;

  deleteCount: number;
}

export interface RuntimePersistenceAdapter {
  save(
    record: PersistedWorkflowRecord
  ): Promise<void>;

  load(
    instanceId: WorkflowInstanceId
  ): Promise<PersistedWorkflowRecord | null>;

  delete(
    instanceId: WorkflowInstanceId
  ): Promise<boolean>;

  list(): Promise<PersistedWorkflowRecord[]>;

  saveSnapshot(
    snapshot: WorkflowSnapshot
  ): Promise<void>;

  getSnapshots(
    instanceId: WorkflowInstanceId
  ): Promise<WorkflowSnapshot[]>;

  deleteSnapshots(
    instanceId: WorkflowInstanceId
  ): Promise<number>;

  clear(): Promise<void>;
}

export interface PersistenceTransaction {
  id: string;

  startedAt: Date;

  save(
    workflow: CompleteWorkflowExecutionRecord,
    options?: SaveWorkflowOptions
  ): Promise<PersistedWorkflowRecord>;

  delete(
    instanceId: WorkflowInstanceId,
    options?: DeleteWorkflowOptions
  ): Promise<boolean>;

  commit(): Promise<void>;

  rollback(): Promise<void>;
}

export interface PersistenceLock {
  instanceId: WorkflowInstanceId;

  ownerId: string;

  acquiredAt: Date;

  expiresAt: Date;

  release(): Promise<void>;

  renew(leaseMs?: number): Promise<void>;
}

export interface RuntimePersistenceOptions {
  defaultLockLeaseMs?: number;

  createSnapshotsByDefault?: boolean;
}

/* ============================================================
 * Internal Types
 * ============================================================
 */

interface ActiveLockRecord {
  instanceId: WorkflowInstanceId;

  ownerId: string;

  acquiredAt: Date;

  expiresAt: Date;
}

interface TransactionOperation {
  type: "save" | "delete";

  workflow?: CompleteWorkflowExecutionRecord;

  instanceId?: WorkflowInstanceId;

  saveOptions?: SaveWorkflowOptions;

  deleteOptions?: DeleteWorkflowOptions;
}

/* ============================================================
 * In-Memory Persistence Adapter
 * ============================================================
 */

export class InMemoryPersistenceAdapter
  implements RuntimePersistenceAdapter
{
  private readonly workflows =
    new Map<
      WorkflowInstanceId,
      PersistedWorkflowRecord
    >();

  private readonly snapshots =
    new Map<
      WorkflowInstanceId,
      WorkflowSnapshot[]
    >();

  async save(
    record: PersistedWorkflowRecord
  ): Promise<void> {
    this.workflows.set(
      record.instanceId,
      this.clonePersistedRecord(record)
    );
  }

  async load(
    instanceId: WorkflowInstanceId
  ): Promise<PersistedWorkflowRecord | null> {
    const record =
      this.workflows.get(instanceId);

    return record
      ? this.clonePersistedRecord(record)
      : null;
  }

  async delete(
    instanceId: WorkflowInstanceId
  ): Promise<boolean> {
    return this.workflows.delete(instanceId);
  }

  async list():
  Promise<PersistedWorkflowRecord[]> {
    return [...this.workflows.values()]
      .map((record) =>
        this.clonePersistedRecord(record)
      );
  }

  async saveSnapshot(
    snapshot: WorkflowSnapshot
  ): Promise<void> {
    const existing =
      this.snapshots.get(
        snapshot.instanceId
      ) ?? [];

    existing.push(
      this.cloneSnapshot(snapshot)
    );

    this.snapshots.set(
      snapshot.instanceId,
      existing
    );
  }

  async getSnapshots(
    instanceId: WorkflowInstanceId
  ): Promise<WorkflowSnapshot[]> {
    return (
      this.snapshots.get(instanceId) ?? []
    ).map((snapshot) =>
      this.cloneSnapshot(snapshot)
    );
  }

  async deleteSnapshots(
    instanceId: WorkflowInstanceId
  ): Promise<number> {
    const snapshots =
      this.snapshots.get(instanceId);

    if (!snapshots) {
      return 0;
    }

    const count = snapshots.length;

    this.snapshots.delete(instanceId);

    return count;
  }

  async clear(): Promise<void> {
    this.workflows.clear();
    this.snapshots.clear();
  }

  private clonePersistedRecord(
    record: PersistedWorkflowRecord
  ): PersistedWorkflowRecord {
    return {
      ...record,

      workflow: deepClone(record.workflow),

      createdAt: new Date(
        record.createdAt.getTime()
      ),

      updatedAt: new Date(
        record.updatedAt.getTime()
      ),
    };
  }

  private cloneSnapshot(
    snapshot: WorkflowSnapshot
  ): WorkflowSnapshot {
    return {
      ...snapshot,

      workflow: deepClone(snapshot.workflow),

      createdAt: new Date(
        snapshot.createdAt.getTime()
      ),

      metadata: snapshot.metadata
        ? deepClone(snapshot.metadata)
        : undefined,
    };
  }
}

/* ============================================================
 * Runtime Persistence Coordinator
 * ============================================================
 */

export class RuntimePersistence {
  private readonly adapter:
    RuntimePersistenceAdapter;

  private readonly defaultLockLeaseMs:
    number;

  private readonly createSnapshotsByDefault:
    boolean;

  private readonly locks =
    new Map<
      WorkflowInstanceId,
      ActiveLockRecord
    >();

  private readonly activeTransactions =
    new Set<string>();

  private saveCount = 0;

  private loadCount = 0;

  private deleteCount = 0;

  constructor(
    adapter:
      RuntimePersistenceAdapter =
        new InMemoryPersistenceAdapter(),

    options:
      RuntimePersistenceOptions = {}
  ) {
    this.adapter = adapter;

    this.defaultLockLeaseMs = Math.max(
      1000,
      Math.floor(
        options.defaultLockLeaseMs ??
          30_000
      )
    );

    this.createSnapshotsByDefault =
      options.createSnapshotsByDefault ??
      false;
  }

  /* ==========================================================
   * Save
   * ==========================================================
   */

  async save(
    workflow:
      CompleteWorkflowExecutionRecord,

    options:
      SaveWorkflowOptions = {}
  ): Promise<PersistedWorkflowRecord> {
    try {
      const instanceId =
        workflow.instanceId;

      const existing =
        await this.adapter.load(
          instanceId
        );

      this.assertExpectedVersion(
        instanceId,
        existing?.version ?? 0,
        options.expectedVersion
      );

      const timestamp = now();

      const record:
        PersistedWorkflowRecord = {
          instanceId,

          version:
            (existing?.version ?? 0) + 1,

          workflow:
            deepClone(workflow),

          createdAt:
            existing?.createdAt ??
            timestamp,

          updatedAt: timestamp,
        };

      await this.adapter.save(record);

      this.saveCount += 1;

      const shouldCreateSnapshot =
        options.createSnapshot ??
        this.createSnapshotsByDefault;

      if (shouldCreateSnapshot) {
        await this.createSnapshot(
          workflow,
          record.version,
          options.snapshotReason,
          options.snapshotMetadata
        );
      }

      return this.cloneRecord(record);
    } catch (error) {
      if (
        error instanceof
        WorkflowPersistenceError
      ) {
        throw error;
      }

     throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
    }
  }

  /* ==========================================================
   * Load
   * ==========================================================
   */

  async load(
    instanceId: WorkflowInstanceId
  ): Promise<PersistedWorkflowRecord | null> {
    try {
      const record =
        await this.adapter.load(
          instanceId
        );

      this.loadCount += 1;

      return record
        ? this.cloneRecord(record)
        : null;
    } catch (error) {
      throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
    }
  }

  async loadWorkflow(
    instanceId: WorkflowInstanceId
  ): Promise<
    CompleteWorkflowExecutionRecord | null
  > {
    const record =
      await this.load(instanceId);

    return record
      ? deepClone(record.workflow)
      : null;
  }

  async loadRequired(
    instanceId: WorkflowInstanceId
  ): Promise<PersistedWorkflowRecord> {
    const record =
      await this.load(instanceId);

    if (!record) {
      throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
    }

    return record;
  }

  /* ==========================================================
   * Delete
   * ==========================================================
   */

  async delete(
    instanceId: WorkflowInstanceId,

    options:
      DeleteWorkflowOptions = {}
  ): Promise<boolean> {
    try {
      const existing =
        await this.adapter.load(
          instanceId
        );

      if (!existing) {
        return false;
      }

      this.assertExpectedVersion(
        instanceId,
        existing.version,
        options.expectedVersion
      );

      const deleted =
        await this.adapter.delete(
          instanceId
        );

      if (
        deleted &&
        options.deleteSnapshots
      ) {
        await this.adapter.deleteSnapshots(
          instanceId
        );
      }

      if (deleted) {
        this.deleteCount += 1;
      }

      return deleted;
    } catch (error) {
      if (
        error instanceof
        WorkflowPersistenceError
      ) {
        throw error;
      }

     throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
    }
  }

  /* ==========================================================
   * Listing
   * ==========================================================
   */

  async list():
  Promise<PersistedWorkflowRecord[]> {
    try {
      const records =
        await this.adapter.list();

      return records
        .map((record) =>
          this.cloneRecord(record)
        )
        .sort(
          (left, right) =>
            right.updatedAt.getTime() -
            left.updatedAt.getTime()
        );
    } catch (error) {
      throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
    }
  }

  async exists(
    instanceId: WorkflowInstanceId
  ): Promise<boolean> {
    return (
      (await this.adapter.load(instanceId)) !==
      null
    );
  }

  /* ==========================================================
   * Snapshots
   * ==========================================================
   */

  async createSnapshot(
    workflow:
      CompleteWorkflowExecutionRecord,

    persistenceVersion?: number,

    reason?: string,

    metadata?: Record<string, unknown>
  ): Promise<WorkflowSnapshot> {
    try {
      const version =
        persistenceVersion ??
        (
          await this.adapter.load(
            workflow.instanceId
          )
        )?.version ??
        0;

      const snapshot:
        WorkflowSnapshot = {
          id: `snapshot_${generateId(12)}`,

          instanceId:
            workflow.instanceId,

          persistenceVersion:
            version,

          workflow:
            deepClone(workflow),

          createdAt: now(),

          reason:
            reason?.trim() || undefined,

          metadata: metadata
            ? deepClone(metadata)
            : undefined,
        };

      await this.adapter.saveSnapshot(
        snapshot
      );

      return this.cloneSnapshot(snapshot);
    } catch (error) {
      throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
    }
  }

  async getSnapshots(
    instanceId: WorkflowInstanceId
  ): Promise<WorkflowSnapshot[]> {
    const snapshots =
      await this.adapter.getSnapshots(
        instanceId
      );

    return snapshots
      .map((snapshot) =>
        this.cloneSnapshot(snapshot)
      )
      .sort(
        (left, right) =>
          right.createdAt.getTime() -
          left.createdAt.getTime()
      );
  }

  async getLatestSnapshot(
    instanceId: WorkflowInstanceId
  ): Promise<WorkflowSnapshot | null> {
    const snapshots =
      await this.getSnapshots(instanceId);

    return snapshots[0] ?? null;
  }

  async restoreSnapshot(
    snapshotId: string
  ): Promise<PersistedWorkflowRecord> {
    const records = await this.list();

    for (const record of records) {
      const snapshots =
        await this.getSnapshots(
          record.instanceId
        );

      const snapshot =
        snapshots.find(
          (candidate) =>
            candidate.id === snapshotId
        );

      if (snapshot) {
        return this.save(
          snapshot.workflow,
          {
            expectedVersion:
              record.version,

            createSnapshot: true,

            snapshotReason:
              `Before restoring snapshot ${snapshotId}`,
          }
        );
      }
    }

    throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
  }

  /* ==========================================================
   * Transactions
   * ==========================================================
   */

  beginTransaction():
  PersistenceTransaction {
    const transactionId =
      `transaction_${generateId(12)}`;

    const operations:
      TransactionOperation[] = [];

    let completed = false;

    this.activeTransactions.add(
      transactionId
    );

    const assertActive = (): void => {
      if (completed) {
       throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
      }
    };

    return {
      id: transactionId,

      startedAt: now(),

      save: async (
        workflow,
        options = {}
      ) => {
        assertActive();

        operations.push({
          type: "save",
          workflow: deepClone(workflow),
          saveOptions: {
            ...options,
          },
        });

        const existing =
          await this.adapter.load(
            workflow.instanceId
          );

        return {
          instanceId:
            workflow.instanceId,

          version:
            (existing?.version ?? 0) + 1,

          workflow:
            deepClone(workflow),

          createdAt:
            existing?.createdAt ??
            now(),

          updatedAt: now(),
        };
      },

      delete: async (
        instanceId,
        options = {}
      ) => {
        assertActive();

        const exists =
          await this.exists(instanceId);

        operations.push({
          type: "delete",
          instanceId,
          deleteOptions: {
            ...options,
          },
        });

        return exists;
      },

      commit: async () => {
        assertActive();

        try {
          for (const operation of operations) {
            if (
              operation.type === "save" &&
              operation.workflow
            ) {
              await this.save(
                operation.workflow,
                operation.saveOptions
              );
            }

            if (
              operation.type === "delete" &&
              operation.instanceId
            ) {
              await this.delete(
                operation.instanceId,
                operation.deleteOptions
              );
            }
          }

          completed = true;
        } finally {
          this.activeTransactions.delete(
            transactionId
          );
        }
      },

      rollback: async () => {
        assertActive();

        operations.length = 0;

        completed = true;

        this.activeTransactions.delete(
          transactionId
        );
      },
    };
  }

  /* ==========================================================
   * Locks
   * ==========================================================
   */

  async acquireLock(
    instanceId: WorkflowInstanceId,

    ownerId =
      `owner_${generateId(10)}`,

    leaseMs =
      this.defaultLockLeaseMs
  ): Promise<PersistenceLock> {
    this.removeExpiredLock(instanceId);

    const existing =
      this.locks.get(instanceId);

    if (existing) {
     throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
    }

    const acquiredAt = now();

    const normalizedLeaseMs =
      Math.max(
        1000,
        Math.floor(leaseMs)
      );

    const record: ActiveLockRecord = {
      instanceId,

      ownerId,

      acquiredAt,

      expiresAt: new Date(
        acquiredAt.getTime() +
          normalizedLeaseMs
      ),
    };

    this.locks.set(instanceId, record);

    return {
      instanceId,

      ownerId,

      acquiredAt:
        new Date(
          record.acquiredAt.getTime()
        ),

      expiresAt:
        new Date(
          record.expiresAt.getTime()
        ),

      release: async () => {
        const current =
          this.locks.get(instanceId);

        if (
          current?.ownerId === ownerId
        ) {
          this.locks.delete(instanceId);
        }
      },

      renew: async (
        renewalLeaseMs =
          this.defaultLockLeaseMs
      ) => {
        const current =
          this.locks.get(instanceId);

        if (
          !current ||
          current.ownerId !== ownerId
        ) {
         throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
        }

        current.expiresAt =
          new Date(
            Date.now() +
              Math.max(
                1000,
                Math.floor(
                  renewalLeaseMs
                )
              )
          );
      },
    };
  }

  isLocked(
    instanceId: WorkflowInstanceId
  ): boolean {
    this.removeExpiredLock(instanceId);

    return this.locks.has(instanceId);
  }

  /* ==========================================================
   * Statistics
   * ==========================================================
   */

  async statistics():
  Promise<RuntimePersistenceStatistics> {
    const workflows =
      await this.adapter.list();

    let snapshotCount = 0;

    for (const workflow of workflows) {
      snapshotCount += (
        await this.adapter.getSnapshots(
          workflow.instanceId
        )
      ).length;
    }

    this.removeAllExpiredLocks();

    return {
      workflowCount:
        workflows.length,

      snapshotCount,

      activeTransactionCount:
        this.activeTransactions.size,

      activeLockCount:
        this.locks.size,

      saveCount:
        this.saveCount,

      loadCount:
        this.loadCount,

      deleteCount:
        this.deleteCount,
    };
  }

  /* ==========================================================
   * Cleanup
   * ==========================================================
   */

  async clear(): Promise<void> {
    await this.adapter.clear();

    this.locks.clear();

    this.activeTransactions.clear();

    this.saveCount = 0;

    this.loadCount = 0;

    this.deleteCount = 0;
  }

  /* ==========================================================
   * Private Helpers
   * ==========================================================
   */

  private assertExpectedVersion(
    instanceId: WorkflowInstanceId,

    currentVersion: number,

    expectedVersion?: number
  ): void {
    if (
      expectedVersion !== undefined &&
      currentVersion !== expectedVersion
    ) {
      throw new WorkflowPersistenceError(
  "Failed to save workflow execution record."
);
    }
  }

  private removeExpiredLock(
    instanceId: WorkflowInstanceId
  ): void {
    const lock =
      this.locks.get(instanceId);

    if (
      lock &&
      lock.expiresAt.getTime() <=
        Date.now()
    ) {
      this.locks.delete(instanceId);
    }
  }

  private removeAllExpiredLocks(): void {
    for (const instanceId of this.locks.keys()) {
      this.removeExpiredLock(instanceId);
    }
  }

  private cloneRecord(
    record: PersistedWorkflowRecord
  ): PersistedWorkflowRecord {
    return {
      ...record,

      workflow:
        deepClone(record.workflow),

      createdAt:
        new Date(
          record.createdAt.getTime()
        ),

      updatedAt:
        new Date(
          record.updatedAt.getTime()
        ),
    };
  }

  private cloneSnapshot(
    snapshot: WorkflowSnapshot
  ): WorkflowSnapshot {
    return {
      ...snapshot,

      workflow:
        deepClone(snapshot.workflow),

      createdAt:
        new Date(
          snapshot.createdAt.getTime()
        ),

      metadata:
        snapshot.metadata
          ? deepClone(
              snapshot.metadata
            )
          : undefined,
    };
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

export function createRuntimePersistence(
  adapter?: RuntimePersistenceAdapter,

  options?: RuntimePersistenceOptions
): RuntimePersistence {
  return new RuntimePersistence(
    adapter,
    options
  );
}