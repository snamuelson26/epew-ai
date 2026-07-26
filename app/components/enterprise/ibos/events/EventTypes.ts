/**
 * IBOS Event Types
 *
 * This file defines the shared contracts used by the IBOS Event Bus.
 */

/**
 * Standard event names used throughout the EPEW-EDE-IBOS platform.
 *
 * Custom event names are also supported through the broader
 * `IBOSEventType` string type.
 */
export const IBOS_EVENT_TYPES = {
  ENGINE_REGISTERED: "engine.registered",
  ENGINE_REPLACED: "engine.replaced",
  ENGINE_UNREGISTERED: "engine.unregistered",
  ENGINE_INITIALIZED: "engine.initialized",
  ENGINE_STARTED: "engine.started",
  ENGINE_STOPPED: "engine.stopped",
  ENGINE_SHUTDOWN: "engine.shutdown",
  ENGINE_FAILED: "engine.failed",
  ENGINE_HEALTH_UPDATED: "engine.health.updated",

  IDENTITY_CREATED: "identity.created",
  IDENTITY_VERIFIED: "identity.verified",
  IDENTITY_REJECTED: "identity.rejected",
  IDENTITY_UPDATED: "identity.updated",

  ENTREPRENEUR_REGISTERED: "entrepreneur.registered",
  ENTREPRENEUR_APPLICATION_SUBMITTED:
    "entrepreneur.application.submitted",
  ENTREPRENEUR_QUALIFIED: "entrepreneur.qualified",
  ENTREPRENEUR_APPROVED: "entrepreneur.approved",
  ENTREPRENEUR_REJECTED: "entrepreneur.rejected",
  ENTREPRENEUR_ACTIVATED: "entrepreneur.activated",
  ENTREPRENEUR_SUSPENDED: "entrepreneur.suspended",

  COACH_ASSIGNED: "coach.assigned",
  COACH_ASSIGNMENT_ACKNOWLEDGED:
    "coach.assignment.acknowledged",
  COACH_SESSION_COMPLETED: "coach.session.completed",

  BUSINESS_CREATED: "business.created",
  BUSINESS_UPDATED: "business.updated",
  BUSINESS_APPROVED: "business.approved",
  BUSINESS_LAUNCH_CANDIDATE:
    "business.launch.candidate",
  BUSINESS_LAUNCH_PLAN_CREATED:
    "business.launch.plan.created",
  BUSINESS_READY_VERIFIED:
    "business.ready.verified",
  BUSINESS_LAUNCHED: "business.launched",
  BUSINESS_SUSPENDED: "business.suspended",
  BUSINESS_CLOSED: "business.closed",

  FUNDING_READINESS_COMPLETED:
    "funding.readiness.completed",
  FUNDING_QUEUE_ADDED: "funding.queue.added",
  FUNDING_APPROVED: "funding.approved",
  FUNDING_DECLINED: "funding.declined",
  FUNDING_ALLOCATED: "funding.allocated",
  FUNDING_DISBURSED: "funding.disbursed",

  SUPPORTER_REGISTERED: "supporter.registered",
  SUPPORT_RECEIVED: "support.received",
  CONTRIBUTION_CREATED: "contribution.created",
  CONTRIBUTION_COMPLETED: "contribution.completed",
  CONTRIBUTION_FAILED: "contribution.failed",
  CONTRIBUTION_CANCELLED: "contribution.cancelled",

  PAYMENT_CREATED: "payment.created",
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",

  CERTIFICATE_REQUESTED: "certificate.requested",
  CERTIFICATE_GENERATED: "certificate.generated",
  CERTIFICATE_PUBLISHED: "certificate.published",
  CERTIFICATE_VERIFIED: "certificate.verified",
  CERTIFICATE_SUSPENDED: "certificate.suspended",
  CERTIFICATE_REVOKED: "certificate.revoked",
  CERTIFICATE_ARCHIVED: "certificate.archived",

  EVENT_SESSION_CREATED: "event.session.created",
  EVENT_REGISTRATION_OPENED:
    "event.registration.opened",
  EVENT_REGISTRATION_CLOSED:
    "event.registration.closed",
  EVENT_PARTICIPANT_ASSIGNED:
    "event.participant.assigned",
  EVENT_GUEST_REGISTERED: "event.guest.registered",
  EVENT_CHECK_IN_COMPLETED:
    "event.check-in.completed",
  EVENT_RAFFLE_COMPLETED: "event.raffle.completed",
  EVENT_STAGE_COMPLETED: "event.stage.completed",
  EVENT_SESSION_ARCHIVED: "event.session.archived",

  REPORT_SUBMITTED: "report.submitted",
  REPORT_APPROVED: "report.approved",
  REPORT_REJECTED: "report.rejected",

  COMPLIANCE_UPDATED: "compliance.updated",
  COMPLIANCE_ACTION_REQUIRED:
    "compliance.action-required",
  COMPLIANCE_VIOLATION_DETECTED:
    "compliance.violation.detected",
  COMPLIANCE_RESTORED: "compliance.restored",

  DOCUMENT_CREATED: "document.created",
  DOCUMENT_GENERATED: "document.generated",
  DOCUMENT_SIGNED: "document.signed",
  DOCUMENT_ARCHIVED: "document.archived",

  COMMUNICATION_PREPARED:
    "communication.prepared",
  COMMUNICATION_APPROVED:
    "communication.approved",
  COMMUNICATION_SENT: "communication.sent",
  COMMUNICATION_FAILED: "communication.failed",

  NOTIFICATION_CREATED: "notification.created",
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_READ: "notification.read",
  NOTIFICATION_FAILED: "notification.failed",

  WORKFLOW_CREATED: "workflow.created",
  WORKFLOW_STARTED: "workflow.started",
  WORKFLOW_STEP_STARTED: "workflow.step.started",
  WORKFLOW_STEP_COMPLETED:
    "workflow.step.completed",
  WORKFLOW_STEP_FAILED: "workflow.step.failed",
  WORKFLOW_COMPLETED: "workflow.completed",
  WORKFLOW_FAILED: "workflow.failed",
  WORKFLOW_CANCELLED: "workflow.cancelled",

  AUTOMATION_TRIGGERED: "automation.triggered",
  AUTOMATION_COMPLETED: "automation.completed",
  AUTOMATION_FAILED: "automation.failed",

  ANALYTICS_RECORDED: "analytics.recorded",
  AUDIT_RECORDED: "audit.recorded",

  SYSTEM_READY: "system.ready",
  SYSTEM_WARNING: "system.warning",
  SYSTEM_ERROR: "system.error",
} as const;

/**
 * Union of all official IBOS event names.
 */
export type StandardIBOSEventType =
  (typeof IBOS_EVENT_TYPES)[keyof typeof IBOS_EVENT_TYPES];

/**
 * IBOS accepts both official event names and custom names.
 *
 * The `string & {}` construction preserves autocomplete for official
 * event names while allowing future plug-in events.
 */
export type IBOSEventType =
  | StandardIBOSEventType
  | (string & {});

/**
 * Unique identifier used for events and subscriptions.
 */
export type IBOSEventId = string;

/**
 * Priority used to determine handler execution order.
 *
 * Higher priority handlers run first.
 */
export type EventPriority = number;

/**
 * Common event priority values.
 */
export const EVENT_PRIORITY = {
  LOWEST: -100,
  LOW: -50,
  NORMAL: 0,
  HIGH: 50,
  HIGHEST: 100,
  CRITICAL: 1_000,
} as const;

/**
 * Event processing status.
 */
export type EventProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "partially-completed"
  | "failed"
  | "cancelled";

/**
 * Metadata attached to an IBOS event.
 */
export interface IBOSEventMetadata {
  /**
   * Identifier of the user, engine, workflow, API route, or service
   * that created the event.
   */
  source?: string;

  /**
   * User responsible for the action.
   */
  actorId?: string;

  /**
   * Organization or tenant identifier.
   */
  organizationId?: string;

  /**
   * Correlates related events in one business process.
   */
  correlationId?: string;

  /**
   * Links this event to the event that caused it.
   */
  causationId?: string;

  /**
   * Workflow instance associated with the event.
   */
  workflowId?: string;

  /**
   * Engine that published the event.
   */
  engineName?: string;

  /**
   * Event schema version.
   */
  schemaVersion?: string;

  /**
   * Trace identifier for logs and monitoring.
   */
  traceId?: string;

  /**
   * Additional metadata supplied by callers.
   */
  [key: string]: unknown;
}

/**
 * Base IBOS event contract.
 */
export interface IBOSEvent<
  TPayload = unknown,
  TType extends IBOSEventType = IBOSEventType,
> {
  /**
   * Unique event identifier.
   */
  id: IBOSEventId;

  /**
   * Event name.
   */
  type: TType;

  /**
   * Event payload.
   */
  payload: TPayload;

  /**
   * Event creation date in ISO format.
   */
  occurredAt: string;

  /**
   * Optional event metadata.
   */
  metadata: IBOSEventMetadata;
}

/**
 * Input accepted when publishing an event.
 *
 * The Event Bus automatically supplies the ID and timestamp when omitted.
 */
export interface PublishEventInput<
  TPayload = unknown,
  TType extends IBOSEventType = IBOSEventType,
> {
  id?: IBOSEventId;
  type: TType;
  payload: TPayload;
  occurredAt?: string;
  metadata?: IBOSEventMetadata;
}

/**
 * Context supplied to every event handler.
 */
export interface EventHandlerContext {
  /**
   * Identifier of the current subscription.
   */
  subscriptionId: string;

  /**
   * Number of the current delivery attempt.
   */
  attempt: number;

  /**
   * Event Bus publication timestamp.
   */
  publishedAt: string;

  /**
   * Cancels delivery to lower-priority handlers.
   */
  stopPropagation(): void;

  /**
   * Indicates whether event propagation has been stopped.
   */
  readonly propagationStopped: boolean;
}

/**
 * Event handler function.
 */
export type EventHandler<
  TPayload = unknown,
  TType extends IBOSEventType = IBOSEventType,
> = (
  event: IBOSEvent<TPayload, TType>,
  context: EventHandlerContext,
) => void | Promise<void>;

/**
 * Optional error handler for a subscription.
 */
export type EventErrorHandler = (
  error: Error,
  event: IBOSEvent,
  context: EventHandlerContext,
) => void | Promise<void>;

/**
 * Event filter.
 *
 * Returning false prevents the handler from running.
 */
export type EventFilter<
  TPayload = unknown,
  TType extends IBOSEventType = IBOSEventType,
> = (
  event: IBOSEvent<TPayload, TType>,
) => boolean | Promise<boolean>;

/**
 * Retry settings for a subscription.
 */
export interface EventRetryOptions {
  /**
   * Total number of attempts, including the first attempt.
   */
  maxAttempts?: number;

  /**
   * Delay before retrying.
   */
  delayMs?: number;

  /**
   * Multiplier applied after each failed attempt.
   */
  backoffMultiplier?: number;

  /**
   * Maximum retry delay.
   */
  maxDelayMs?: number;
}

/**
 * Options used to subscribe to an event.
 */
export interface EventSubscriptionOptions<
  TPayload = unknown,
  TType extends IBOSEventType = IBOSEventType,
> {
  /**
   * Custom subscription identifier.
   */
  id?: string;

  /**
   * Higher numbers run first.
   */
  priority?: EventPriority;

  /**
   * Automatically removes the subscription after one successful delivery.
   */
  once?: boolean;

  /**
   * Whether the subscription is initially enabled.
   */
  enabled?: boolean;

  /**
   * Optional filtering function.
   */
  filter?: EventFilter<TPayload, TType>;

  /**
   * Optional retry settings.
   */
  retry?: EventRetryOptions;

  /**
   * Optional handler for subscription errors.
   */
  onError?: EventErrorHandler;

  /**
   * Optional subscription metadata.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Result of one event-handler execution.
 */
export interface EventHandlerExecutionResult {
  subscriptionId: string;
  eventType: IBOSEventType;
  success: boolean;
  skipped: boolean;
  attempts: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  error?: string;
}

/**
 * Result returned by EventBus.publish().
 */
export interface EventPublishResult<
  TPayload = unknown,
  TType extends IBOSEventType = IBOSEventType,
> {
  event: IBOSEvent<TPayload, TType>;
  status: EventProcessingStatus;
  matchedSubscriptions: number;
  successfulHandlers: number;
  failedHandlers: number;
  skippedHandlers: number;
  propagationStopped: boolean;
  executions: EventHandlerExecutionResult[];
  publishedAt: string;
  completedAt: string;
  durationMs: number;
}

/**
 * Event history record.
 */
export interface EventHistoryRecord {
  event: IBOSEvent;
  result: EventPublishResult;
}

/**
 * Event Bus statistics.
 */
export interface EventBusStatistics {
  totalSubscriptions: number;
  enabledSubscriptions: number;
  disabledSubscriptions: number;
  totalPublished: number;
  totalCompleted: number;
  totalPartiallyCompleted: number;
  totalFailed: number;
  totalHandlerExecutions: number;
  totalHandlerFailures: number;
  historySize: number;
  generatedAt: string;
}

/**
 * Event replay options.
 */
export interface EventReplayOptions {
  /**
   * Event types to replay.
   */
  types?: IBOSEventType[];

  /**
   * Replay events created on or after this timestamp.
   */
  from?: string;

  /**
   * Replay events created on or before this timestamp.
   */
  to?: string;

  /**
   * Maximum number of matching events to replay.
   */
  limit?: number;

  /**
   * Whether replayed events should be written to history again.
   */
  recordReplay?: boolean;
}

/**
 * Result of an event replay operation.
 */
export interface EventReplayResult {
  requested: number;
  replayed: number;
  successful: number;
  failed: number;
  results: EventPublishResult[];
}

/**
 * Configuration for the Event Bus.
 */
export interface EventBusConfig {
  /**
   * Maximum number of event records retained in memory.
   */
  historyLimit?: number;

  /**
   * Whether publication history is enabled.
   */
  historyEnabled?: boolean;

  /**
   * Whether handlers run sequentially.
   *
   * Sequential mode preserves priority order and propagation stopping.
   */
  sequentialProcessing?: boolean;

  /**
   * Whether errors should throw after all handlers finish.
   */
  throwOnHandlerError?: boolean;

  /**
   * Default retry configuration.
   */
  defaultRetry?: EventRetryOptions;
}