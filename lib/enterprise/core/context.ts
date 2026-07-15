/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Enterprise Context
 * ------------------------------------------------------------
 * Creates and manages the execution context shared by every
 * Enterprise Engine.
 * ============================================================
 */

import { randomUUID } from "crypto";
import { EnterpriseContext } from "./types";

export interface CreateContextOptions {
  userId?: string | null;
  organizationId?: string | null;
  source: string;
  environment?: "development" | "test" | "production";
  transactionId?: string;
  metadata?: Record<string, any>;
}

export function createEnterpriseContext(
  options: CreateContextOptions
): EnterpriseContext {
  return {
    correlationId: randomUUID(),

    transactionId: options.transactionId,

    userId: options.userId ?? null,

    organizationId: options.organizationId ?? null,

    source: options.source,

    environment:
      options.environment ??
      (process.env.NODE_ENV === "production"
        ? "production"
        : process.env.NODE_ENV === "test"
        ? "test"
        : "development"),

    timestamp: new Date().toISOString(),

    metadata: options.metadata ?? {},
  };
}

/**
 * Clone an existing Enterprise Context
 * while preserving the Correlation ID.
 */
export function cloneContext(
  context: EnterpriseContext,
  updates?: Partial<EnterpriseContext>
): EnterpriseContext {
  return {
    ...context,
    ...updates,
  };
}

/**
 * Create child context
 * used by nested Enterprise Engines.
 */
export function createChildContext(
  parent: EnterpriseContext,
  source: string
): EnterpriseContext {
  return {
    ...parent,
    source,
    timestamp: new Date().toISOString(),
  };
}