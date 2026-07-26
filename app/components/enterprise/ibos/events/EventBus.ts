import {
  EventSubscription,
  type IEventSubscription,
} from "./EventSubscription";

import type {
  EventBusConfig,
  EventBusStatistics,
  EventHandler,
  EventHandlerContext,
  EventHandlerExecutionResult,
  EventHistoryRecord,
  EventPublishResult,
  EventReplayOptions,
  EventReplayResult,
  EventRetryOptions,
  EventSubscriptionOptions,
  IBOSEvent,
  IBOSEventType,
  PublishEventInput,
} from "./EventTypes";

/**
 * Wildcard event name.
 *
 * A wildcard subscriber receives every event published through the bus.
 */
export const WILDCARD_EVENT = "*" as const;

/**
 * Event type accepted by wildcard subscriptions.
 */
export type EventSubscriptionType =
  | IBOSEventType
  | typeof WILDCARD_EVENT;

/**
 * Internal Event Bus metrics.
 */
interface EventBusMetrics {
  totalPublished: number;
  totalCompleted: number;
  totalPartiallyCompleted: number;
  totalFailed: number;
  totalHandlerExecutions: number;
  totalHandlerFailures: number;
}

/**
 * Error containing failed event-handler executions.
 */
export class EventBusPublishError extends Error {
  public readonly result: EventPublishResult;

  public constructor(result: EventPublishResult) {
    super(
      `IBOS Event Bus failed to deliver event "${result.event.type}" to ${result.failedHandlers} handler(s).`,
    );

    this.name = "EventBusPublishError";
    this.result = result;
  }
}

/**
 * In-memory asynchronous event bus for IBOS.
 */
export class EventBus {
  private readonly config:
    Required<
      Pick<
        EventBusConfig,
        | "historyLimit"
        | "historyEnabled"
        | "sequentialProcessing"
        | "throwOnHandlerError"
      >
    > & {
      defaultRetry: Required<EventRetryOptions>;
    };

  private readonly subscriptions =
    new Map<
      string,
      EventSubscription<
        unknown,
        IBOSEventType
      >
    >();

  private readonly subscriptionsByType =
    new Map<EventSubscriptionType, Set<string>>();

  private readonly history:
    EventHistoryRecord[] = [];

  private readonly metrics: EventBusMetrics = {
    totalPublished: 0,
    totalCompleted: 0,
    totalPartiallyCompleted: 0,
    totalFailed: 0,
    totalHandlerExecutions: 0,
    totalHandlerFailures: 0,
  };

  public constructor(config: EventBusConfig = {}) {
    this.config = {
      historyLimit:
        Math.max(0, config.historyLimit ?? 1_000),
      historyEnabled:
        config.historyEnabled ?? true,
      sequentialProcessing:
        config.sequentialProcessing ?? true,
      throwOnHandlerError:
        config.throwOnHandlerError ?? false,
      defaultRetry: {
        maxAttempts: Math.max(
          1,
          config.defaultRetry?.maxAttempts ?? 1,
        ),
        delayMs: Math.max(
          0,
          config.defaultRetry?.delayMs ?? 0,
        ),
        backoffMultiplier: Math.max(
          1,
          config.defaultRetry
            ?.backoffMultiplier ?? 1,
        ),
        maxDelayMs: Math.max(
          0,
          config.defaultRetry?.maxDelayMs ??
            30_000,
        ),
      },
    };
  }

  /**
   * Subscribes to a specific event type.
   */
  public subscribe<
    TPayload = unknown,
    TType extends IBOSEventType = IBOSEventType,
  >(
    eventType: TType,
    handler: EventHandler<TPayload, TType>,
    options: EventSubscriptionOptions<
      TPayload,
      TType
    > = {},
  ): IEventSubscription<TPayload, TType> {
    return this.createSubscription(
      eventType,
      handler,
      options,
    );
  }

  /**
   * Subscribes to all events.
   */
  public subscribeAll<
    TPayload = unknown,
  >(
    handler: EventHandler<
      TPayload,
      IBOSEventType
    >,
    options: EventSubscriptionOptions<
      TPayload,
      IBOSEventType
    > = {},
  ): IEventSubscription<
    TPayload,
    IBOSEventType
  > {
    return this.createSubscription(
      WILDCARD_EVENT,
      handler,
      options,
    );
  }

  /**
   * Creates a one-time subscription.
   */
  public once<
    TPayload = unknown,
    TType extends IBOSEventType = IBOSEventType,
  >(
    eventType: TType,
    handler: EventHandler<TPayload, TType>,
    options: Omit<
      EventSubscriptionOptions<
        TPayload,
        TType
      >,
      "once"
    > = {},
  ): IEventSubscription<TPayload, TType> {
    return this.subscribe(
      eventType,
      handler,
      {
        ...options,
        once: true,
      },
    );
  }

  /**
   * Publishes an event and waits for all matching handlers.
   */
  public async publish<
    TPayload = unknown,
    TType extends IBOSEventType = IBOSEventType,
  >(
    input: PublishEventInput<TPayload, TType>,
  ): Promise<
    EventPublishResult<TPayload, TType>
  > {
    const event = this.createEvent(input);

    return this.dispatchEvent(event, {
      recordHistory: true,
    });
  }

  /**
   * Convenience overload for publishing an event name and payload.
   */
  public async emit<
    TPayload = unknown,
    TType extends IBOSEventType = IBOSEventType,
  >(
    type: TType,
    payload: TPayload,
    metadata: PublishEventInput<
      TPayload,
      TType
    >["metadata"] = {},
  ): Promise<
    EventPublishResult<TPayload, TType>
  > {
    return this.publish({
      type,
      payload,
      metadata,
    });
  }

  /**
   * Removes a subscription by its identifier.
   */
  public unsubscribe(
    subscriptionId: string,
  ): boolean {
    const subscription =
      this.subscriptions.get(subscriptionId);

    if (!subscription) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);

    for (
      const [eventType, ids]
      of this.subscriptionsByType.entries()
    ) {
      ids.delete(subscriptionId);

      if (ids.size === 0) {
        this.subscriptionsByType.delete(
          eventType,
        );
      }
    }

    subscription.markInactive();

    return true;
  }

  /**
   * Removes every subscription for an event type.
   */
  public unsubscribeType(
    eventType: EventSubscriptionType,
  ): number {
    const ids =
      this.subscriptionsByType.get(eventType);

    if (!ids) {
      return 0;
    }

    const subscriptionIds =
      Array.from(ids);

    let removed = 0;

    for (
      const subscriptionId
      of subscriptionIds
    ) {
      if (this.unsubscribe(subscriptionId)) {
        removed += 1;
      }
    }

    return removed;
  }

  /**
   * Removes all subscriptions.
   */
  public clearSubscriptions(): void {
    for (
      const subscription
      of this.subscriptions.values()
    ) {
      subscription.markInactive();
    }

    this.subscriptions.clear();
    this.subscriptionsByType.clear();
  }

  /**
   * Returns a subscription by ID.
   */
  public getSubscription(
    subscriptionId: string,
  ):
    | IEventSubscription
    | undefined {
    return this.subscriptions.get(
      subscriptionId,
    );
  }

  /**
   * Returns all registered subscriptions.
   */
  public getSubscriptions():
    IEventSubscription[] {
    return Array.from(
      this.subscriptions.values(),
    );
  }

  /**
   * Returns subscriptions for an event type.
   */
  public getSubscriptionsFor(
    eventType: EventSubscriptionType,
  ): IEventSubscription[] {
    const ids =
      this.subscriptionsByType.get(eventType);

    if (!ids) {
      return [];
    }

    return Array.from(ids)
      .map((id) =>
        this.subscriptions.get(id),
      )
      .filter(
        (
          subscription,
        ): subscription is EventSubscription<
          unknown,
          IBOSEventType
        > => subscription !== undefined,
      );
  }

  /**
   * Returns whether any enabled subscriber can receive an event.
   */
  public hasSubscribers(
    eventType: IBOSEventType,
  ): boolean {
    return this.getMatchingSubscriptions(
      eventType,
    ).some(
      (subscription) =>
        subscription.active &&
        subscription.enabled,
    );
  }

  /**
   * Returns a copy of the Event Bus history.
   */
  public getHistory(
    limit?: number,
  ): EventHistoryRecord[] {
    const records = [...this.history];

    if (
      limit === undefined ||
      limit < 0
    ) {
      return records;
    }

    return records.slice(
      Math.max(0, records.length - limit),
    );
  }

  /**
   * Returns historical records for one event type.
   */
  public getHistoryByType(
    eventType: IBOSEventType,
    limit?: number,
  ): EventHistoryRecord[] {
    const records = this.history.filter(
      (record) =>
        record.event.type === eventType,
    );

    if (
      limit === undefined ||
      limit < 0
    ) {
      return records;
    }

    return records.slice(
      Math.max(0, records.length - limit),
    );
  }

  /**
   * Removes all event history.
   */
  public clearHistory(): void {
    this.history.length = 0;
  }

  /**
   * Replays events stored in Event Bus history.
   */
  public async replay(
    options: EventReplayOptions = {},
  ): Promise<EventReplayResult> {
    let matchingRecords = [...this.history];

    if (
      options.types &&
      options.types.length > 0
    ) {
      const allowedTypes = new Set(
        options.types,
      );

      matchingRecords =
        matchingRecords.filter((record) =>
          allowedTypes.has(
            record.event.type,
          ),
        );
    }

    if (options.from) {
      const fromTimestamp =
        Date.parse(options.from);

      if (
        Number.isNaN(fromTimestamp)
      ) {
        throw new Error(
          `Invalid event replay "from" timestamp: ${options.from}.`,
        );
      }

      matchingRecords =
        matchingRecords.filter(
          (record) =>
            Date.parse(
              record.event.occurredAt,
            ) >= fromTimestamp,
        );
    }

    if (options.to) {
      const toTimestamp =
        Date.parse(options.to);

      if (Number.isNaN(toTimestamp)) {
        throw new Error(
          `Invalid event replay "to" timestamp: ${options.to}.`,
        );
      }

      matchingRecords =
        matchingRecords.filter(
          (record) =>
            Date.parse(
              record.event.occurredAt,
            ) <= toTimestamp,
        );
    }

    if (
      options.limit !== undefined &&
      options.limit >= 0
    ) {
      matchingRecords =
        matchingRecords.slice(
          0,
          options.limit,
        );
    }

    const results: EventPublishResult[] = [];

    for (
      const record
      of matchingRecords
    ) {
      const replayedEvent: IBOSEvent = {
        ...record.event,
        metadata: {
          ...record.event.metadata,
          replayed: true,
          replayedAt:
            new Date().toISOString(),
          originalEventId:
            record.event.id,
        },
      };

      const result =
        await this.dispatchEvent(
          replayedEvent,
          {
            recordHistory:
              options.recordReplay ??
              false,
          },
        );

      results.push(result);
    }

    return {
      requested: matchingRecords.length,
      replayed: results.length,
      successful: results.filter(
        (result) =>
          result.status === "completed",
      ).length,
      failed: results.filter(
        (result) =>
          result.status === "failed" ||
          result.status ===
            "partially-completed",
      ).length,
      results,
    };
  }

  /**
   * Returns Event Bus statistics.
   */
  public getStatistics():
    EventBusStatistics {
    const subscriptions =
      Array.from(
        this.subscriptions.values(),
      );

    return {
      totalSubscriptions:
        subscriptions.length,
      enabledSubscriptions:
        subscriptions.filter(
          (subscription) =>
            subscription.enabled,
        ).length,
      disabledSubscriptions:
        subscriptions.filter(
          (subscription) =>
            !subscription.enabled,
        ).length,
      totalPublished:
        this.metrics.totalPublished,
      totalCompleted:
        this.metrics.totalCompleted,
      totalPartiallyCompleted:
        this.metrics
          .totalPartiallyCompleted,
      totalFailed:
        this.metrics.totalFailed,
      totalHandlerExecutions:
        this.metrics
          .totalHandlerExecutions,
      totalHandlerFailures:
        this.metrics.totalHandlerFailures,
      historySize: this.history.length,
      generatedAt:
        new Date().toISOString(),
    };
  }

  /**
   * Resets runtime metrics.
   */
  public resetStatistics(): void {
    this.metrics.totalPublished = 0;
    this.metrics.totalCompleted = 0;
    this.metrics.totalPartiallyCompleted =
      0;
    this.metrics.totalFailed = 0;
    this.metrics.totalHandlerExecutions =
      0;
    this.metrics.totalHandlerFailures = 0;
  }

  /**
   * Clears subscriptions, history, and metrics.
   */
  public clear(): void {
    this.clearSubscriptions();
    this.clearHistory();
    this.resetStatistics();
  }

  private createSubscription<
    TPayload,
    TType extends IBOSEventType,
  >(
    eventType:
      | TType
      | typeof WILDCARD_EVENT,
    handler: EventHandler<TPayload, TType>,
    options: EventSubscriptionOptions<
      TPayload,
      TType
    >,
  ): IEventSubscription<TPayload, TType> {
    const subscription =
      new EventSubscription<
        TPayload,
        TType
      >({
        ...options,
        eventType:
          eventType === WILDCARD_EVENT
            ? (WILDCARD_EVENT as TType)
            : eventType,
        handler,
        unsubscribeCallback: (
          subscriptionId,
        ) =>
          this.unsubscribe(
            subscriptionId,
          ),
      });

    if (
      this.subscriptions.has(
        subscription.id,
      )
    ) {
      throw new Error(
        `IBOS event subscription "${subscription.id}" already exists.`,
      );
    }

    this.subscriptions.set(
      subscription.id,
      subscription as unknown as EventSubscription<
        unknown,
        IBOSEventType
      >,
    );

    const subscriptionType =
      eventType as EventSubscriptionType;

    const ids =
      this.subscriptionsByType.get(
        subscriptionType,
      ) ?? new Set<string>();

    ids.add(subscription.id);

    this.subscriptionsByType.set(
      subscriptionType,
      ids,
    );

    return subscription;
  }

  private createEvent<
    TPayload,
    TType extends IBOSEventType,
  >(
    input: PublishEventInput<
      TPayload,
      TType
    >,
  ): IBOSEvent<TPayload, TType> {
    if (
      !input.type ||
      input.type.trim().length === 0
    ) {
      throw new Error(
        "IBOS event type cannot be empty.",
      );
    }

    const occurredAt =
      input.occurredAt ??
      new Date().toISOString();

    if (
      Number.isNaN(
        Date.parse(occurredAt),
      )
    ) {
      throw new Error(
        `Invalid IBOS event timestamp: ${occurredAt}.`,
      );
    }

    return {
      id:
        input.id ??
        EventBus.generateId(),
      type: input.type,
      payload: input.payload,
      occurredAt,
      metadata: {
        ...(input.metadata ?? {}),
      },
    };
  }

  private async dispatchEvent<
    TPayload,
    TType extends IBOSEventType,
  >(
    event: IBOSEvent<TPayload, TType>,
    options: {
      recordHistory: boolean;
    },
  ): Promise<
    EventPublishResult<TPayload, TType>
  > {
    const startedAtMs =
      Date.now();

    const publishedAt =
      new Date().toISOString();

    this.metrics.totalPublished += 1;

    const subscriptions =
      this.getMatchingSubscriptions(
        event.type,
      );

    const executions:
      EventHandlerExecutionResult[] = [];

    let propagationStopped = false;

    if (
      this.config.sequentialProcessing
    ) {
      for (
        const subscription
        of subscriptions
      ) {
        if (propagationStopped) {
          executions.push(
            this.createSkippedExecution(
              subscription.id,
              event.type,
              "Event propagation was stopped.",
            ),
          );

          continue;
        }

        const execution =
          await this.executeSubscription(
            subscription,
            event as IBOSEvent,
            () => {
              propagationStopped = true;
            },
          );

        executions.push(execution);
      }
    } else {
      const executionPromises =
        subscriptions.map(
          (subscription) =>
            this.executeSubscription(
              subscription,
              event as IBOSEvent,
              () => {
                propagationStopped = true;
              },
            ),
        );

      executions.push(
        ...(await Promise.all(
          executionPromises,
        )),
      );
    }

    const successfulHandlers =
      executions.filter(
        (execution) =>
          execution.success &&
          !execution.skipped,
      ).length;

    const failedHandlers =
      executions.filter(
        (execution) =>
          !execution.success &&
          !execution.skipped,
      ).length;

    const skippedHandlers =
      executions.filter(
        (execution) =>
          execution.skipped,
      ).length;

    const status =
      failedHandlers === 0
        ? "completed"
        : successfulHandlers > 0
          ? "partially-completed"
          : "failed";

    if (status === "completed") {
      this.metrics.totalCompleted += 1;
    } else if (
      status ===
      "partially-completed"
    ) {
      this.metrics
        .totalPartiallyCompleted += 1;
    } else {
      this.metrics.totalFailed += 1;
    }

    const completedAt =
      new Date().toISOString();

    const result: EventPublishResult<
      TPayload,
      TType
    > = {
      event,
      status,
      matchedSubscriptions:
        subscriptions.length,
      successfulHandlers,
      failedHandlers,
      skippedHandlers,
      propagationStopped,
      executions,
      publishedAt,
      completedAt,
      durationMs:
        Date.now() - startedAtMs,
    };

    if (
      options.recordHistory &&
      this.config.historyEnabled
    ) {
      this.addHistoryRecord(
        result as EventPublishResult,
      );
    }

    if (
      failedHandlers > 0 &&
      this.config.throwOnHandlerError
    ) {
      throw new EventBusPublishError(
        result as EventPublishResult,
      );
    }

    return result;
  }

  private getMatchingSubscriptions(
    eventType: IBOSEventType,
  ): EventSubscription<
    unknown,
    IBOSEventType
  >[] {
    const ids = new Set<string>();

    const exactIds =
      this.subscriptionsByType.get(
        eventType,
      );

    const wildcardIds =
      this.subscriptionsByType.get(
        WILDCARD_EVENT,
      );

    exactIds?.forEach((id) =>
      ids.add(id),
    );

    wildcardIds?.forEach((id) =>
      ids.add(id),
    );

    return Array.from(ids)
      .map((id) =>
        this.subscriptions.get(id),
      )
      .filter(
        (
          subscription,
        ): subscription is EventSubscription<
          unknown,
          IBOSEventType
        > => subscription !== undefined,
      )
      .sort(
        (left, right) =>
          right.priority -
            left.priority ||
          left.createdAt.localeCompare(
            right.createdAt,
          ),
      );
  }

  private async executeSubscription(
    subscription: EventSubscription<
      unknown,
      IBOSEventType
    >,
    event: IBOSEvent,
    stopPropagation: () => void,
  ): Promise<EventHandlerExecutionResult> {
    const startedAtMs =
      Date.now();

    const startedAt =
      new Date().toISOString();

    if (
      !subscription.active ||
      !subscription.enabled
    ) {
      return this.createSkippedExecution(
        subscription.id,
        event.type,
        "Subscription is disabled or inactive.",
      );
    }

    let accepted = false;

    try {
      accepted =
        await subscription.accepts(
          event,
        );
    } catch (error) {
      const normalizedError =
        EventBus.normalizeError(error);

      const completedAt =
        new Date().toISOString();

      this.metrics
        .totalHandlerExecutions += 1;
      this.metrics
        .totalHandlerFailures += 1;

      return {
        subscriptionId:
          subscription.id,
        eventType: event.type,
        success: false,
        skipped: false,
        attempts: 1,
        startedAt,
        completedAt,
        durationMs:
          Date.now() - startedAtMs,
        error:
          normalizedError.message,
      };
    }

    if (!accepted) {
      return this.createSkippedExecution(
        subscription.id,
        event.type,
        "Subscription filter rejected the event.",
      );
    }

    const retry =
      this.resolveRetryOptions(
        subscription.retry,
      );

    let attempts = 0;
    let lastError: Error | undefined;

    const contextState = {
      propagationStopped: false,
    };

    while (
      attempts < retry.maxAttempts
    ) {
      attempts += 1;

      const context:
        EventHandlerContext = {
        subscriptionId:
          subscription.id,
        attempt: attempts,
        publishedAt: startedAt,
        stopPropagation: () => {
          contextState.propagationStopped =
            true;
          stopPropagation();
        },
        get propagationStopped() {
          return contextState.propagationStopped;
        },
      };

      this.metrics
        .totalHandlerExecutions += 1;

      try {
        await subscription.handler(
          event,
          context,
        );

        subscription.recordDelivery();

        if (subscription.once) {
          this.unsubscribe(
            subscription.id,
          );
        }

        const completedAt =
          new Date().toISOString();

        return {
          subscriptionId:
            subscription.id,
          eventType: event.type,
          success: true,
          skipped: false,
          attempts,
          startedAt,
          completedAt,
          durationMs:
            Date.now() - startedAtMs,
        };
      } catch (error) {
        lastError =
          EventBus.normalizeError(error);

        this.metrics
          .totalHandlerFailures += 1;

        try {
          await subscription.onError?.(
            lastError,
            event,
            context,
          );
        } catch {
          // The original handler error remains authoritative.
        }

        if (
          attempts <
          retry.maxAttempts
        ) {
          const delay =
            this.calculateRetryDelay(
              retry,
              attempts,
            );

          if (delay > 0) {
            await EventBus.delay(delay);
          }
        }
      }
    }

    const completedAt =
      new Date().toISOString();

    return {
      subscriptionId: subscription.id,
      eventType: event.type,
      success: false,
      skipped: false,
      attempts,
      startedAt,
      completedAt,
      durationMs:
        Date.now() - startedAtMs,
      error:
        lastError?.message ??
        "Unknown event handler error.",
    };
  }

  private resolveRetryOptions(
    retry?: EventRetryOptions,
  ): Required<EventRetryOptions> {
    return {
      maxAttempts: Math.max(
        1,
        retry?.maxAttempts ??
          this.config.defaultRetry
            .maxAttempts,
      ),
      delayMs: Math.max(
        0,
        retry?.delayMs ??
          this.config.defaultRetry
            .delayMs,
      ),
      backoffMultiplier: Math.max(
        1,
        retry?.backoffMultiplier ??
          this.config.defaultRetry
            .backoffMultiplier,
      ),
      maxDelayMs: Math.max(
        0,
        retry?.maxDelayMs ??
          this.config.defaultRetry
            .maxDelayMs,
      ),
    };
  }

  private calculateRetryDelay(
    retry: Required<EventRetryOptions>,
    completedAttempts: number,
  ): number {
    const multiplier =
      Math.pow(
        retry.backoffMultiplier,
        Math.max(
          0,
          completedAttempts - 1,
        ),
      );

    return Math.min(
      retry.delayMs * multiplier,
      retry.maxDelayMs,
    );
  }

  private createSkippedExecution(
    subscriptionId: string,
    eventType: IBOSEventType,
    reason: string,
  ): EventHandlerExecutionResult {
    const timestamp =
      new Date().toISOString();

    return {
      subscriptionId,
      eventType,
      success: true,
      skipped: true,
      attempts: 0,
      startedAt: timestamp,
      completedAt: timestamp,
      durationMs: 0,
      error: reason,
    };
  }

  private addHistoryRecord(
    result: EventPublishResult,
  ): void {
    if (
      this.config.historyLimit === 0
    ) {
      return;
    }

    this.history.push({
      event: result.event,
      result,
    });

    while (
      this.history.length >
      this.config.historyLimit
    ) {
      this.history.shift();
    }
  }

  private static normalizeError(
    error: unknown,
  ): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === "string") {
      return new Error(error);
    }

    try {
      return new Error(
        JSON.stringify(error),
      );
    } catch {
      return new Error(
        "Unknown Event Bus error.",
      );
    }
  }

  private static async delay(
    milliseconds: number,
  ): Promise<void> {
    await new Promise<void>(
      (resolve) => {
        setTimeout(resolve, milliseconds);
      },
    );
  }

  private static generateId(): string {
    const cryptoObject =
      typeof globalThis !== "undefined"
        ? globalThis.crypto
        : undefined;

    if (
      cryptoObject &&
      typeof cryptoObject.randomUUID ===
        "function"
    ) {
      return cryptoObject.randomUUID();
    }

    return [
      "event",
      Date.now().toString(36),
      Math.random().toString(36).slice(2),
    ].join("-");
  }
}

/**
 * Creates an independent Event Bus.
 */
export function createEventBus(
  config: EventBusConfig = {},
): EventBus {
  return new EventBus(config);
}