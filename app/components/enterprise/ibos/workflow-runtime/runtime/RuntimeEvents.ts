/**
 * ============================================================
 * IBOS Enterprise Operating System (IBOS-EOS)
 * Workflow Runtime Events
 *
 * Handles runtime event publishing, subscriptions, correlation,
 * event waiting, replay history, and workflow notifications.
 *
 * Version: 1.0.0
 * ============================================================
 */

import {
  CorrelationId,
  WorkflowInstanceId,
  WorkflowStepId,
} from "../RuntimeTypes";

/* ============================================================
 * Public Types
 * ============================================================
 */

export type RuntimeEventId = string;

export type RuntimeEventHandler<
  TPayload = unknown
> = (
  event: RuntimeEvent<TPayload>
) => void | Promise<void>;

export interface RuntimeEvent<
  TPayload = unknown
> {
  id: RuntimeEventId;
  name: string;
  payload: TPayload;
  occurredAt: Date;

  correlationId?: CorrelationId;
  causationId?: RuntimeEventId;

  workflowInstanceId?: WorkflowInstanceId;
  workflowStepId?: WorkflowStepId;

  source?: string;

  metadata?: Record<string, unknown>;
}

export interface PublishRuntimeEventInput<
  TPayload = unknown
> {
  name: string;
  payload: TPayload;

  id?: RuntimeEventId;
  occurredAt?: Date;

  correlationId?: CorrelationId;
  causationId?: RuntimeEventId;

  workflowInstanceId?: WorkflowInstanceId;
  workflowStepId?: WorkflowStepId;

  source?: string;

  metadata?: Record<string, unknown>;
}

export interface RuntimeEventFilter {
  name?: string;

  correlationId?: CorrelationId;

  workflowInstanceId?: WorkflowInstanceId;

  workflowStepId?: WorkflowStepId;

  source?: string;

  predicate?: (
    event: RuntimeEvent
  ) => boolean;
}

export interface RuntimeEventSubscription {
  id: string;

  unsubscribe(): void;
}

export interface WaitForEventOptions {
  timeoutMs?: number;

  signal?: AbortSignal;
}

export interface RuntimeEventStatistics {
  publishedCount: number;

  activeSubscriptionCount: number;

  waitingSubscriberCount: number;

  historySize: number;
}

export interface RuntimeEventsOptions {
  maximumHistorySize?: number;

  retainHistory?: boolean;

  continueOnHandlerError?: boolean;
}

/* ============================================================
 * Internal Types
 * ============================================================
 */

interface EventSubscriptionRecord {
  id: string;

  filter: RuntimeEventFilter;

  handler: RuntimeEventHandler;

  once: boolean;

  createdAt: Date;
}

/* ============================================================
 * Runtime Events
 * ============================================================
 */

export class RuntimeEvents {
  private readonly subscriptions =
    new Map<string, EventSubscriptionRecord>();

  private readonly history: RuntimeEvent[] = [];

  private readonly maximumHistorySize: number;

  private readonly retainHistory: boolean;

  private readonly continueOnHandlerError: boolean;

  private publishedCount = 0;

  private waitingSubscriberCount = 0;

  constructor(
    options: RuntimeEventsOptions = {}
  ) {
    this.maximumHistorySize = Math.max(
      0,
      Math.floor(
        options.maximumHistorySize ?? 1000
      )
    );

    this.retainHistory =
      options.retainHistory ?? true;

    this.continueOnHandlerError =
      options.continueOnHandlerError ?? true;
  }

  /* ==========================================================
   * Publishing
   * ==========================================================
   */

  async publish<TPayload>(
    input: PublishRuntimeEventInput<TPayload>
  ): Promise<RuntimeEvent<TPayload>> {
    const event = this.createEvent(input);

    this.publishedCount += 1;

    if (this.retainHistory) {
      this.addToHistory(event);
    }

    const matchingSubscriptions =
      [...this.subscriptions.values()].filter(
        (subscription) =>
          this.matches(
            event,
            subscription.filter
          )
      );

    for (
      const subscription of matchingSubscriptions
    ) {
      if (subscription.once) {
        this.subscriptions.delete(
          subscription.id
        );
      }

      try {
        await subscription.handler(event);
      } catch (error) {
        if (!this.continueOnHandlerError) {
          throw error;
        }
      }
    }

    return event;
  }

  async publishMany(
    events: readonly PublishRuntimeEventInput[]
  ): Promise<RuntimeEvent[]> {
    const publishedEvents: RuntimeEvent[] = [];

    for (const event of events) {
      publishedEvents.push(
        await this.publish(event)
      );
    }

    return publishedEvents;
  }

  /* ==========================================================
   * Subscriptions
   * ==========================================================
   */

  subscribe<TPayload = unknown>(
    filter: RuntimeEventFilter,
    handler: RuntimeEventHandler<TPayload>
  ): RuntimeEventSubscription {
    return this.createSubscription(
      filter,
      handler as RuntimeEventHandler,
      false
    );
  }

  subscribeToName<TPayload = unknown>(
    eventName: string,
    handler: RuntimeEventHandler<TPayload>
  ): RuntimeEventSubscription {
    return this.subscribe(
      {
        name: this.requireEventName(
          eventName
        ),
      },
      handler
    );
  }

  once<TPayload = unknown>(
    filter: RuntimeEventFilter,
    handler: RuntimeEventHandler<TPayload>
  ): RuntimeEventSubscription {
    return this.createSubscription(
      filter,
      handler as RuntimeEventHandler,
      true
    );
  }

  onceByName<TPayload = unknown>(
    eventName: string,
    handler: RuntimeEventHandler<TPayload>
  ): RuntimeEventSubscription {
    return this.once(
      {
        name: this.requireEventName(
          eventName
        ),
      },
      handler
    );
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(
      subscriptionId
    );
  }

  clearSubscriptions(): void {
    this.subscriptions.clear();
  }

  /* ==========================================================
   * Event Waiting
   * ==========================================================
   */

  waitFor<TPayload = unknown>(
    filter: RuntimeEventFilter,
    options: WaitForEventOptions = {}
  ): Promise<RuntimeEvent<TPayload>> {
    this.waitingSubscriberCount += 1;

    return new Promise<
      RuntimeEvent<TPayload>
    >((resolve, reject) => {
      let timeoutHandle:
        | ReturnType<typeof setTimeout>
        | undefined;

      let subscription:
        | RuntimeEventSubscription
        | undefined;

      let completed = false;

      const cleanup = (): void => {
        if (completed) {
          return;
        }

        completed = true;

        subscription?.unsubscribe();

        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        options.signal?.removeEventListener(
          "abort",
          onAbort
        );

        this.waitingSubscriberCount =
          Math.max(
            0,
            this.waitingSubscriberCount - 1
          );
      };

      const onAbort = (): void => {
        cleanup();

        reject(
          new Error(
            "Runtime event wait was aborted."
          )
        );
      };

      subscription = this.once<TPayload>(
        filter,
        async (event) => {
          cleanup();
          resolve(event);
        }
      );

      if (
        options.timeoutMs !== undefined &&
        options.timeoutMs > 0
      ) {
        timeoutHandle = setTimeout(() => {
          cleanup();

          reject(
            new Error(
              `Runtime event wait timed out after ${options.timeoutMs}ms.`
            )
          );
        }, options.timeoutMs);
      }

      if (options.signal) {
        if (options.signal.aborted) {
          onAbort();
          return;
        }

        options.signal.addEventListener(
          "abort",
          onAbort,
          {
            once: true,
          }
        );
      }
    });
  }

  waitForName<TPayload = unknown>(
    eventName: string,
    options: WaitForEventOptions = {}
  ): Promise<RuntimeEvent<TPayload>> {
    return this.waitFor<TPayload>(
      {
        name: this.requireEventName(
          eventName
        ),
      },
      options
    );
  }

  waitForWorkflowEvent<
    TPayload = unknown
  >(
    eventName: string,
    workflowInstanceId:
      WorkflowInstanceId,
    options: WaitForEventOptions = {}
  ): Promise<RuntimeEvent<TPayload>> {
    return this.waitFor<TPayload>(
      {
        name: this.requireEventName(
          eventName
        ),
        workflowInstanceId,
      },
      options
    );
  }

  /* ==========================================================
   * History and Replay
   * ==========================================================
   */

  getHistory(
    filter?: RuntimeEventFilter
  ): RuntimeEvent[] {
    const events = filter
      ? this.history.filter((event) =>
          this.matches(event, filter)
        )
      : this.history;

    return events.map((event) =>
      this.cloneEvent(event)
    );
  }

  findLatest(
    filter: RuntimeEventFilter
  ): RuntimeEvent | undefined {
    for (
      let index = this.history.length - 1;
      index >= 0;
      index -= 1
    ) {
      const event = this.history[index];

      if (this.matches(event, filter)) {
        return this.cloneEvent(event);
      }
    }

    return undefined;
  }

  hasOccurred(
    filter: RuntimeEventFilter
  ): boolean {
    return this.history.some((event) =>
      this.matches(event, filter)
    );
  }

  async replay(
    filter: RuntimeEventFilter,
    handler: RuntimeEventHandler
  ): Promise<number> {
    const matchingEvents =
      this.history.filter((event) =>
        this.matches(event, filter)
      );

    for (const event of matchingEvents) {
      await handler(this.cloneEvent(event));
    }

    return matchingEvents.length;
  }

  clearHistory(): void {
    this.history.length = 0;
  }

  /* ==========================================================
   * Statistics
   * ==========================================================
   */

  statistics(): RuntimeEventStatistics {
    return {
      publishedCount:
        this.publishedCount,

      activeSubscriptionCount:
        this.subscriptions.size,

      waitingSubscriberCount:
        this.waitingSubscriberCount,

      historySize:
        this.history.length,
    };
  }

  /* ==========================================================
   * Cleanup
   * ==========================================================
   */

  clear(): void {
    this.clearSubscriptions();
    this.clearHistory();

    this.publishedCount = 0;

    this.waitingSubscriberCount = 0;
  }

  /* ==========================================================
   * Private Helpers
   * ==========================================================
   */

  private createSubscription(
    filter: RuntimeEventFilter,
    handler: RuntimeEventHandler,
    once: boolean
  ): RuntimeEventSubscription {
    if (typeof handler !== "function") {
      throw new Error(
        "Runtime event handler must be a function."
      );
    }

    const id =
      this.generateIdentifier(
        "subscription"
      );

    const record: EventSubscriptionRecord = {
      id,
      filter: {
        ...filter,
      },
      handler,
      once,
      createdAt: new Date(),
    };

    this.subscriptions.set(id, record);

    return {
      id,

      unsubscribe: () => {
        this.unsubscribe(id);
      },
    };
  }

  private createEvent<TPayload>(
    input: PublishRuntimeEventInput<TPayload>
  ): RuntimeEvent<TPayload> {
    return {
      id:
        input.id ??
        this.generateIdentifier("event"),

      name: this.requireEventName(
        input.name
      ),

      payload: input.payload,

      occurredAt:
        input.occurredAt
          ? new Date(
              input.occurredAt.getTime()
            )
          : new Date(),

      correlationId:
        input.correlationId,

      causationId:
        input.causationId,

      workflowInstanceId:
        input.workflowInstanceId,

      workflowStepId:
        input.workflowStepId,

      source:
        input.source?.trim() || undefined,

      metadata: input.metadata
        ? { ...input.metadata }
        : undefined,
    };
  }

  private matches(
    event: RuntimeEvent,
    filter: RuntimeEventFilter
  ): boolean {
    if (
      filter.name !== undefined &&
      event.name !== filter.name
    ) {
      return false;
    }

    if (
      filter.correlationId !== undefined &&
      event.correlationId !==
        filter.correlationId
    ) {
      return false;
    }

    if (
      filter.workflowInstanceId !==
        undefined &&
      event.workflowInstanceId !==
        filter.workflowInstanceId
    ) {
      return false;
    }

    if (
      filter.workflowStepId !== undefined &&
      event.workflowStepId !==
        filter.workflowStepId
    ) {
      return false;
    }

    if (
      filter.source !== undefined &&
      event.source !== filter.source
    ) {
      return false;
    }

    if (
      filter.predicate &&
      !filter.predicate(event)
    ) {
      return false;
    }

    return true;
  }

  private addToHistory(
    event: RuntimeEvent
  ): void {
    if (this.maximumHistorySize === 0) {
      return;
    }

    this.history.push(
      this.cloneEvent(event)
    );

    while (
      this.history.length >
      this.maximumHistorySize
    ) {
      this.history.shift();
    }
  }

  private cloneEvent<TPayload>(
    event: RuntimeEvent<TPayload>
  ): RuntimeEvent<TPayload> {
    return {
      ...event,

      occurredAt: new Date(
        event.occurredAt.getTime()
      ),

      metadata: event.metadata
        ? { ...event.metadata }
        : undefined,
    };
  }

  private requireEventName(
    eventName: string
  ): string {
    if (
      typeof eventName !== "string" ||
      eventName.trim().length === 0
    ) {
      throw new Error(
        "Runtime event name must be a non-empty string."
      );
    }

    return eventName.trim();
  }

  private generateIdentifier(
    prefix: string
  ): string {
    const randomPart =
      Math.random()
        .toString(36)
        .slice(2, 12);

    const timestampPart =
      Date.now().toString(36);

    return `${prefix}_${timestampPart}_${randomPart}`;
  }
}

/* ============================================================
 * Factory
 * ============================================================
 */

export function createRuntimeEvents(
  options?: RuntimeEventsOptions
): RuntimeEvents {
  return new RuntimeEvents(options);
}