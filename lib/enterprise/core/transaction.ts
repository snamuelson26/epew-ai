/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Enterprise Transaction Manager
 * ------------------------------------------------------------
 * Creates and manages enterprise-level transactions.
 * ============================================================
 */

import { randomUUID } from "crypto";
import { EnterpriseContext, EnterpriseTransaction } from "./types";
import { ENGINE_STATUS } from "./constants";

export function beginEnterpriseTransaction(
  context: EnterpriseContext,
  engine: string,
  metadata?: Record<string, any>
): EnterpriseTransaction {
  return {
    id: randomUUID(),
    correlationId: context.correlationId,
    engine,
    status: ENGINE_STATUS.RUNNING,
    startedAt: new Date().toISOString(),
    metadata: metadata ?? {},
  };
}

export function completeEnterpriseTransaction(
  transaction: EnterpriseTransaction
): EnterpriseTransaction {
  const completedAt = new Date().toISOString();
  const durationMs =
    new Date(completedAt).getTime() -
    new Date(transaction.startedAt).getTime();

  return {
    ...transaction,
    status: ENGINE_STATUS.SUCCESS,
    completedAt,
    durationMs,
  };
}

export function failEnterpriseTransaction(
  transaction: EnterpriseTransaction,
  metadata?: Record<string, any>
): EnterpriseTransaction {
  const completedAt = new Date().toISOString();
  const durationMs =
    new Date(completedAt).getTime() -
    new Date(transaction.startedAt).getTime();

  return {
    ...transaction,
    status: ENGINE_STATUS.FAILED,
    completedAt,
    durationMs,
    metadata: {
      ...(transaction.metadata ?? {}),
      ...(metadata ?? {}),
    },
  };
}

export function rollbackEnterpriseTransaction(
  transaction: EnterpriseTransaction,
  metadata?: Record<string, any>
): EnterpriseTransaction {
  const completedAt = new Date().toISOString();
  const durationMs =
    new Date(completedAt).getTime() -
    new Date(transaction.startedAt).getTime();

  return {
    ...transaction,
    status: ENGINE_STATUS.ROLLED_BACK,
    completedAt,
    durationMs,
    metadata: {
      ...(transaction.metadata ?? {}),
      ...(metadata ?? {}),
    },
  };
}