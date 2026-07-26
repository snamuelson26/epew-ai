import type {
  EventHandler,
  EventPriority,
  EventSubscriptionOptions,
  IBOSEvent,
  IBOSEventType,
} from "./EventTypes";

/**
 * Public subscription contract returned by the Event Bus.
 */
export interface IEventSubscription<
  TPayload = unknown,
  TType extends IBOSEventType = IBOSEventType,
> {
  readonly id: string;
  readonly eventType: TType;
  readonly priority: EventPriority;
  readonly once: boolean;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly deliveryCount: number;
  readonly lastDeliveredAt?: string;
  readonly enabled: boolean;
  readonly active: boolean;

  enable(): void;
  disable(): void;
  unsubscribe(): boolean;
}

/**
 * Internal arguments used to create an EventSubscription.
 */
export interface EventSubscriptionCreationOptions<
  TPayload = unknown,
  TType extends IBOSEventType = IBOSEventType,
> extends EventSubscriptionOptions<TPayload, TType> {
  eventType: TType;
  handler: EventHandler<TPayload, TType>;
  unsubscribeCallback: (subscriptionId: string) => boolean;
}

/**
 * Represents one active Event Bus subscription.
 */
export class EventSubscription<
  TPayload = unknown,
  TType extends IBOSEventType = IBOSEventType,
> implements IEventSubscription<TPayload, TType>
{
  public readonly id: string;

  public readonly eventType: TType;

  public readonly priority: EventPriority;

  public readonly once: boolean;

  public readonly metadata?: Record<string, unknown>;

  public readonly createdAt: string;

  public readonly handler: EventHandler<TPayload, TType>;

  public readonly filter:
    | EventSubscriptionOptions<TPayload, TType>["filter"]
    | undefined;

  public readonly retry:
    | EventSubscriptionOptions<TPayload, TType>["retry"]
    | undefined;

  public readonly onError:
    | EventSubscriptionOptions<TPayload, TType>["onError"]
    | undefined;

  private enabledState: boolean;

  private activeState = true;

  private deliveryCounter = 0;

  private lastDeliveryTimestamp?: string;

  private readonly unsubscribeCallback: (
    subscriptionId: string,
  ) => boolean;

  public constructor(
    options: EventSubscriptionCreationOptions<
      TPayload,
      TType
    >,
  ) {
    this.id =
      options.id ??
      EventSubscription.generateId();

    this.eventType = options.eventType;
    this.handler = options.handler;
    this.priority = options.priority ?? 0;
    this.once = options.once ?? false;
    this.enabledState = options.enabled ?? true;
    this.filter = options.filter;
    this.retry = options.retry;
    this.onError = options.onError;
    this.metadata = options.metadata;
    this.createdAt = new Date().toISOString();
    this.unsubscribeCallback =
      options.unsubscribeCallback;
  }

  public get enabled(): boolean {
    return this.enabledState;
  }

  public get active(): boolean {
    return this.activeState;
  }

  public get deliveryCount(): number {
    return this.deliveryCounter;
  }

  public get lastDeliveredAt():
    | string
    | undefined {
    return this.lastDeliveryTimestamp;
  }

  /**
   * Enables this subscription.
   */
  public enable(): void {
    if (!this.activeState) {
      throw new Error(
        `Cannot enable inactive event subscription "${this.id}".`,
      );
    }

    this.enabledState = true;
  }

  /**
   * Disables this subscription without removing it.
   */
  public disable(): void {
    this.enabledState = false;
  }

  /**
   * Removes this subscription from the Event Bus.
   */
  public unsubscribe(): boolean {
    if (!this.activeState) {
      return false;
    }

    const removed =
      this.unsubscribeCallback(this.id);

    if (removed) {
      this.markInactive();
    }

    return removed;
  }

  /**
   * Determines whether an event should be handled by this subscription.
   */
  public async accepts(
    event: IBOSEvent<TPayload, TType>,
  ): Promise<boolean> {
    if (!this.activeState || !this.enabledState) {
      return false;
    }

    if (!this.filter) {
      return true;
    }

    return this.filter(event);
  }

  /**
   * Records one successful delivery.
   */
  public recordDelivery(): void {
    this.deliveryCounter += 1;
    this.lastDeliveryTimestamp =
      new Date().toISOString();
  }

  /**
   * Marks the subscription inactive.
   *
   * This is called internally when the Event Bus removes it.
   */
  public markInactive(): void {
    this.activeState = false;
    this.enabledState = false;
  }

  /**
   * Generates a unique subscription identifier.
   */
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
      "subscription",
      Date.now().toString(36),
      Math.random().toString(36).slice(2),
    ].join("-");
  }
}