/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Enterprise Event Bus
 * ------------------------------------------------------------
 * Publishes and subscribes to verified Enterprise Events.
 * ============================================================
 */

import { randomUUID } from "crypto";
import { EnterpriseContext, EnterpriseEvent } from "./types";

type EventHandler<TPayload = any> = (
  event: EnterpriseEvent<TPayload>
) => Promise<void> | void;

const subscribers = new Map<string, EventHandler[]>();

export function createEnterpriseEvent<TPayload = any>({
  name,
  source,
  payload,
  context,
  metadata,
}: {
  name: string;
  source: string;
  payload: TPayload;
  context: EnterpriseContext;
  metadata?: Record<string, any>;
}): EnterpriseEvent<TPayload> {
  return {
    id: randomUUID(),
    name,
    source,
    status: "pending",
    payload,
    correlationId: context.correlationId,
    transactionId: context.transactionId,
    userId: context.userId,
    createdAt: new Date().toISOString(),
    metadata: metadata ?? {},
  };
}

export function subscribeToEnterpriseEvent<TPayload = any>(
  eventName: string,
  handler: EventHandler<TPayload>
): void {
  const currentHandlers = subscribers.get(eventName) ?? [];
  subscribers.set(eventName, [...currentHandlers, handler as EventHandler]);
}

export async function publishEnterpriseEvent<TPayload = any>(
  event: EnterpriseEvent<TPayload>
): Promise<EnterpriseEvent<TPayload>> {
  const handlers = subscribers.get(event.name) ?? [];

  const processingEvent: EnterpriseEvent<TPayload> = {
    ...event,
    status: "processing",
  };

  try {
    for (const handler of handlers) {
      await handler(processingEvent);
    }

    return {
      ...processingEvent,
      status: "completed",
    };
  } catch (error: any) {
    return {
      ...processingEvent,
      status: "failed",
      metadata: {
        ...(processingEvent.metadata ?? {}),
        error: error?.message || "Enterprise event handler failed.",
      },
    };
  }
}

export function clearEnterpriseEventSubscribers(): void {
  subscribers.clear();
}