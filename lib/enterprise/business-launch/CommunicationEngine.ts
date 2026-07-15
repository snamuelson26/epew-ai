import {
  BusinessLaunchPlan,
  EnterpriseStatus,
} from "./types";

/**
 * Communication channels supported by EOS.
 *
 * This engine manages communication records only.
 * Delivery is handled later by external adapters.
 */
export enum CommunicationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH",
  LETTER = "LETTER",
}

/**
 * Communication priority.
 */
export enum CommunicationPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

/**
 * Official communication lifecycle statuses.
 */
export enum CommunicationStatus {
  DRAFT = "DRAFT",
  QUEUED = "QUEUED",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

/**
 * Roles that may receive enterprise communication.
 *
 * The string fallback allows future EOS roles without requiring
 * immediate engine changes.
 */
export type CommunicationRecipientRole =
  | "ENTREPRENEUR"
  | "COACH"
  | "SUPPORTER"
  | "PARTNER"
  | "VENDOR"
  | "ADMINISTRATOR"
  | "FUNDING_COMMITTEE"
  | "GUEST"
  | string;

/**
 * One enterprise communication message.
 */
export interface CommunicationMessage {
  id: string;

  businessId: string;

  recipientId: string;
  recipientName: string;
  recipientRole: CommunicationRecipientRole;

  channel: CommunicationChannel;
  priority: CommunicationPriority;

  subject: string;
  body: string;

  status: CommunicationStatus;

  scheduledFor: string | null;

  queuedAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;

  failedAt: string | null;
  failureReason: string | null;

  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;

  externalReference: string | null;

  createdBy: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Input used to create a new communication.
 */
export interface CreateCommunicationInput {
  recipientId: string;
  recipientName: string;
  recipientRole: CommunicationRecipientRole;

  channel: CommunicationChannel;

  priority?: CommunicationPriority;

  subject: string;
  body: string;

  scheduledFor?: string | null;

  createdBy: string;
}

/**
 * Communication audit-history actions.
 */
export type CommunicationHistoryAction =
  | "CREATED"
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "CANCELLED"
  | "RESCHEDULED";

/**
 * Immutable communication history entry.
 */
export interface CommunicationHistoryEntry {
  id: string;

  messageId: string;
  businessId: string;

  action: CommunicationHistoryAction;

  performedBy: string | null;
  notes: string | null;

  previousStatus: CommunicationStatus | null;
  newStatus: CommunicationStatus;

  createdAt: string;
}

/**
 * Communication summary.
 */
export interface CommunicationSummary {
  totalMessages: number;

  draft: number;
  queued: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  cancelled: number;

  unread: number;

  scheduled: number;
  overdueScheduled: number;
}

/**
 * CommunicationEngine
 *
 * Owns the enterprise communication lifecycle for EOS.
 *
 * Responsibilities:
 * - create communication records,
 * - queue messages,
 * - record sends,
 * - record delivery,
 * - record reads,
 * - record failures,
 * - cancel pending messages,
 * - manage scheduled messages,
 * - preserve immutable communication history,
 * - provide communication summaries and filters.
 *
 * This engine does not:
 * - send email,
 * - send SMS,
 * - send push notifications,
 * - call Twilio,
 * - call SendGrid,
 * - call SMTP,
 * - write to Supabase,
 * - or render user-interface components.
 */
export class CommunicationEngine {
  private readonly plan: BusinessLaunchPlan;

  private messages: CommunicationMessage[];

  private history: CommunicationHistoryEntry[];

  constructor(
    plan: BusinessLaunchPlan,
    messages: CommunicationMessage[] = [],
    history: CommunicationHistoryEntry[] = [],
  ) {
    this.plan = this.clone(plan);
    this.messages = this.clone(messages);
    this.history = this.clone(history);
  }

  /**
   * Returns a protected copy of the Business Launch Plan.
   */
  public getPlan(): BusinessLaunchPlan {
    return this.clone(this.plan);
  }

  /**
   * Returns all communication messages.
   */
  public getMessages(): CommunicationMessage[] {
    return this.clone(this.messages);
  }

  /**
   * Returns the immutable communication history.
   */
  public getHistory(): CommunicationHistoryEntry[] {
    return this.clone(this.history);
  }

  /**
   * Returns one communication message.
   */
  public getMessage(
    messageId: string,
  ): CommunicationMessage {
    const message = this.findMessage(messageId);

    return {
      ...message,
    };
  }

  /**
   * Creates a communication in DRAFT status.
   */
  public createMessage(
    input: CreateCommunicationInput,
  ): CommunicationMessage {
    this.assertPlanIsOperational();
    this.validateCreateInput(input);

    const createdAt = new Date().toISOString();

    const scheduledFor = input.scheduledFor
      ? this.parseDate(
          input.scheduledFor,
        ).toISOString()
      : null;

    const message: CommunicationMessage = {
      id: this.generateId("MESSAGE"),

      businessId: String(
        this.plan.businessId,
      ),

      recipientId:
        input.recipientId.trim(),

      recipientName:
        input.recipientName.trim(),

      recipientRole:
        input.recipientRole,

      channel: input.channel,

      priority:
        input.priority ??
        CommunicationPriority.NORMAL,

      subject: input.subject.trim(),
      body: input.body.trim(),

      status:
        CommunicationStatus.DRAFT,

      scheduledFor,

      queuedAt: null,
      sentAt: null,
      deliveredAt: null,
      readAt: null,

      failedAt: null,
      failureReason: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      externalReference: null,

      createdBy:
        input.createdBy.trim(),

      createdAt,
      updatedAt: createdAt,
    };

    this.messages = [
      ...this.messages,
      message,
    ];

    this.addHistory({
      messageId: message.id,
      action: "CREATED",
      performedBy: input.createdBy,
      notes: null,
      previousStatus: null,
      newStatus:
        CommunicationStatus.DRAFT,
    });

    return {
      ...message,
    };
  }

  /**
   * Moves a DRAFT message into the delivery queue.
   */
  public queueMessage(
    messageId: string,
    queuedBy: string,
  ): CommunicationMessage {
    this.assertPlanIsOperational();

    if (!queuedBy.trim()) {
      throw new Error(
        "The person queueing the message is required.",
      );
    }

    const message =
      this.findMessage(messageId);

    this.assertStatus(
      message,
      [CommunicationStatus.DRAFT],
      "Only a DRAFT message can be queued.",
    );

    const queuedAt =
      new Date().toISOString();

    const updatedMessage: CommunicationMessage = {
      ...message,

      status:
        CommunicationStatus.QUEUED,

      queuedAt,

      failedAt: null,
      failureReason: null,

      updatedAt: queuedAt,
    };

    this.replaceMessage(updatedMessage);

    this.addHistory({
      messageId,
      action: "QUEUED",
      performedBy: queuedBy,
      notes: null,
      previousStatus: message.status,
      newStatus:
        CommunicationStatus.QUEUED,
    });

    return {
      ...updatedMessage,
    };
  }

  /**
   * Records that a queued message was sent.
   *
   * The external adapter should call this method after successful
   * transmission to the provider.
   */
  public sendMessage(
    messageId: string,
    sentBy: string,
    externalReference?: string,
  ): CommunicationMessage {
    this.assertPlanIsOperational();

    if (!sentBy.trim()) {
      throw new Error(
        "The person or adapter sending the message is required.",
      );
    }

    const message =
      this.findMessage(messageId);

    this.assertStatus(
      message,
      [CommunicationStatus.QUEUED],
      "Only a QUEUED message can be marked as sent.",
    );

    if (
      message.scheduledFor &&
      this.parseDate(
        message.scheduledFor,
      ).getTime() >
        Date.now()
    ) {
      throw new Error(
        "The message cannot be sent before its scheduled delivery time.",
      );
    }

    const sentAt =
      new Date().toISOString();

    const updatedMessage: CommunicationMessage = {
      ...message,

      status:
        CommunicationStatus.SENT,

      sentAt,

      externalReference:
        externalReference?.trim() ||
        message.externalReference,

      failedAt: null,
      failureReason: null,

      updatedAt: sentAt,
    };

    this.replaceMessage(updatedMessage);

    this.addHistory({
      messageId,
      action: "SENT",
      performedBy: sentBy,
      notes:
        externalReference?.trim() ||
        null,
      previousStatus: message.status,
      newStatus:
        CommunicationStatus.SENT,
    });

    return {
      ...updatedMessage,
    };
  }

  /**
   * Records successful delivery.
   */
  public deliverMessage(
    messageId: string,
    deliveredBy?: string,
  ): CommunicationMessage {
    this.assertPlanIsOperational();

    const message =
      this.findMessage(messageId);

    this.assertStatus(
      message,
      [CommunicationStatus.SENT],
      "Only a SENT message can be marked as delivered.",
    );

    const deliveredAt =
      new Date().toISOString();

    const updatedMessage: CommunicationMessage = {
      ...message,

      status:
        CommunicationStatus.DELIVERED,

      deliveredAt,

      updatedAt: deliveredAt,
    };

    this.replaceMessage(updatedMessage);

    this.addHistory({
      messageId,
      action: "DELIVERED",
      performedBy:
        deliveredBy?.trim() || null,
      notes: null,
      previousStatus: message.status,
      newStatus:
        CommunicationStatus.DELIVERED,
    });

    return {
      ...updatedMessage,
    };
  }

  /**
   * Marks a delivered communication as read.
   *
   * IN_APP messages may optionally move directly from SENT to READ
   * when the platform records the user opening the message before a
   * separate delivery callback is available.
   */
  public markRead(
    messageId: string,
    readBy?: string,
  ): CommunicationMessage {
    this.assertPlanIsOperational();

    const message =
      this.findMessage(messageId);

    this.assertStatus(
      message,
      [
        CommunicationStatus.SENT,
        CommunicationStatus.DELIVERED,
      ],
      "Only a SENT or DELIVERED message can be marked as read.",
    );

    const readAt =
      new Date().toISOString();

    const updatedMessage: CommunicationMessage = {
      ...message,

      status:
        CommunicationStatus.READ,

      deliveredAt:
        message.deliveredAt ?? readAt,

      readAt,

      updatedAt: readAt,
    };

    this.replaceMessage(updatedMessage);

    this.addHistory({
      messageId,
      action: "READ",
      performedBy:
        readBy?.trim() || null,
      notes: null,
      previousStatus: message.status,
      newStatus:
        CommunicationStatus.READ,
    });

    return {
      ...updatedMessage,
    };
  }

  /**
   * Records a failed delivery attempt.
   *
   * Messages may fail from QUEUED or SENT status.
   */
  public markFailed(
    messageId: string,
    failureReason: string,
    failedBy?: string,
  ): CommunicationMessage {
    this.assertPlanIsOperational();

    if (!failureReason.trim()) {
      throw new Error(
        "A failure reason is required.",
      );
    }

    const message =
      this.findMessage(messageId);

    this.assertStatus(
      message,
      [
        CommunicationStatus.QUEUED,
        CommunicationStatus.SENT,
      ],
      "Only a QUEUED or SENT message can be marked as failed.",
    );

    const failedAt =
      new Date().toISOString();

    const updatedMessage: CommunicationMessage = {
      ...message,

      status:
        CommunicationStatus.FAILED,

      failedAt,
      failureReason:
        failureReason.trim(),

      updatedAt: failedAt,
    };

    this.replaceMessage(updatedMessage);

    this.addHistory({
      messageId,
      action: "FAILED",
      performedBy:
        failedBy?.trim() || null,
      notes:
        failureReason.trim(),
      previousStatus: message.status,
      newStatus:
        CommunicationStatus.FAILED,
    });

    return {
      ...updatedMessage,
    };
  }

  /**
   * Cancels a DRAFT or QUEUED communication.
   */
  public cancelMessage(
    messageId: string,
    cancelledBy: string,
    reason: string,
  ): CommunicationMessage {
    this.assertPlanIsOperational();

    if (!cancelledBy.trim()) {
      throw new Error(
        "The person cancelling the message is required.",
      );
    }

    if (!reason.trim()) {
      throw new Error(
        "A cancellation reason is required.",
      );
    }

    const message =
      this.findMessage(messageId);

    this.assertStatus(
      message,
      [
        CommunicationStatus.DRAFT,
        CommunicationStatus.QUEUED,
      ],
      "Only a DRAFT or QUEUED message can be cancelled.",
    );

    const cancelledAt =
      new Date().toISOString();

    const updatedMessage: CommunicationMessage = {
      ...message,

      status:
        CommunicationStatus.CANCELLED,

      cancelledAt,
      cancelledBy:
        cancelledBy.trim(),

      cancellationReason:
        reason.trim(),

      updatedAt: cancelledAt,
    };

    this.replaceMessage(updatedMessage);

    this.addHistory({
      messageId,
      action: "CANCELLED",
      performedBy:
        cancelledBy.trim(),
      notes: reason.trim(),
      previousStatus: message.status,
      newStatus:
        CommunicationStatus.CANCELLED,
    });

    return {
      ...updatedMessage,
    };
  }

  /**
   * Reschedules a DRAFT or QUEUED message.
   */
  public rescheduleMessage(
    messageId: string,
    scheduledFor: string,
    rescheduledBy: string,
  ): CommunicationMessage {
    this.assertPlanIsOperational();

    if (!rescheduledBy.trim()) {
      throw new Error(
        "The person rescheduling the message is required.",
      );
    }

    const message =
      this.findMessage(messageId);

    this.assertStatus(
      message,
      [
        CommunicationStatus.DRAFT,
        CommunicationStatus.QUEUED,
      ],
      "Only a DRAFT or QUEUED message can be rescheduled.",
    );

    const scheduledDate =
      this.parseDate(scheduledFor);

    if (
      scheduledDate.getTime() <=
      Date.now()
    ) {
      throw new Error(
        "The scheduled communication time must be in the future.",
      );
    }

    const updatedAt =
      new Date().toISOString();

    const updatedMessage: CommunicationMessage = {
      ...message,

      scheduledFor:
        scheduledDate.toISOString(),

      updatedAt,
    };

    this.replaceMessage(updatedMessage);

    this.addHistory({
      messageId,
      action: "RESCHEDULED",
      performedBy:
        rescheduledBy.trim(),
      notes:
        scheduledDate.toISOString(),
      previousStatus: message.status,
      newStatus: message.status,
    });

    return {
      ...updatedMessage,
    };
  }

  /**
   * Returns all messages not yet marked READ.
   *
   * Cancelled messages are excluded because they are no longer
   * actionable communications.
   */
  public getUnreadMessages(): CommunicationMessage[] {
    return this.messages
      .filter(
        (message) =>
          message.status !==
            CommunicationStatus.READ &&
          message.status !==
            CommunicationStatus.CANCELLED,
      )
      .map((message) => ({
        ...message,
      }));
  }

  /**
   * Returns messages for one recipient.
   */
  public getMessagesForRecipient(
    recipientId: string,
  ): CommunicationMessage[] {
    return this.messages
      .filter(
        (message) =>
          message.recipientId ===
          recipientId,
      )
      .map((message) => ({
        ...message,
      }));
  }

  /**
   * Returns messages by channel.
   */
  public getMessagesByChannel(
    channel: CommunicationChannel,
  ): CommunicationMessage[] {
    return this.messages
      .filter(
        (message) =>
          message.channel === channel,
      )
      .map((message) => ({
        ...message,
      }));
  }

  /**
   * Returns messages by priority.
   */
  public getMessagesByPriority(
    priority: CommunicationPriority,
  ): CommunicationMessage[] {
    return this.messages
      .filter(
        (message) =>
          message.priority === priority,
      )
      .map((message) => ({
        ...message,
      }));
  }

  /**
   * Returns messages by status.
   */
  public getMessagesByStatus(
    status: CommunicationStatus,
  ): CommunicationMessage[] {
    return this.messages
      .filter(
        (message) =>
          message.status === status,
      )
      .map((message) => ({
        ...message,
      }));
  }

  /**
   * Returns scheduled messages that are ready to enter the delivery
   * process.
   */
  public getMessagesReadyToSend(
    asOf: Date = new Date(),
  ): CommunicationMessage[] {
    this.validateDate(
      asOf,
      "scheduled-message review date",
    );

    return this.messages
      .filter((message) => {
        if (
          message.status !==
          CommunicationStatus.QUEUED
        ) {
          return false;
        }

        if (!message.scheduledFor) {
          return true;
        }

        return (
          this.parseDate(
            message.scheduledFor,
          ).getTime() <=
          asOf.getTime()
        );
      })
      .sort((first, second) => {
        const firstDate =
          first.scheduledFor
            ? this.parseDate(
                first.scheduledFor,
              ).getTime()
            : 0;

        const secondDate =
          second.scheduledFor
            ? this.parseDate(
                second.scheduledFor,
              ).getTime()
            : 0;

        return firstDate - secondDate;
      })
      .map((message) => ({
        ...message,
      }));
  }

  /**
   * Returns queued scheduled messages whose scheduled time has passed.
   */
  public getOverdueScheduledMessages(
    asOf: Date = new Date(),
  ): CommunicationMessage[] {
    this.validateDate(
      asOf,
      "overdue communication review date",
    );

    return this.messages
      .filter((message) => {
        if (
          message.status !==
            CommunicationStatus.QUEUED ||
          !message.scheduledFor
        ) {
          return false;
        }

        return (
          this.parseDate(
            message.scheduledFor,
          ).getTime() <
          asOf.getTime()
        );
      })
      .map((message) => ({
        ...message,
      }));
  }

  /**
   * Returns enterprise communication metrics.
   */
  public getSummary(
    asOf: Date = new Date(),
  ): CommunicationSummary {
    this.validateDate(
      asOf,
      "communication summary date",
    );

    const countByStatus = (
      status: CommunicationStatus,
    ): number =>
      this.messages.filter(
        (message) =>
          message.status === status,
      ).length;

    const unread = this.messages.filter(
      (message) =>
        message.status !==
          CommunicationStatus.READ &&
        message.status !==
          CommunicationStatus.CANCELLED,
    ).length;

    const scheduled =
      this.messages.filter(
        (message) =>
          Boolean(
            message.scheduledFor,
          ) &&
          [
            CommunicationStatus.DRAFT,
            CommunicationStatus.QUEUED,
          ].includes(
            message.status,
          ),
      ).length;

    return {
      totalMessages:
        this.messages.length,

      draft: countByStatus(
        CommunicationStatus.DRAFT,
      ),

      queued: countByStatus(
        CommunicationStatus.QUEUED,
      ),

      sent: countByStatus(
        CommunicationStatus.SENT,
      ),

      delivered: countByStatus(
        CommunicationStatus.DELIVERED,
      ),

      read: countByStatus(
        CommunicationStatus.READ,
      ),

      failed: countByStatus(
        CommunicationStatus.FAILED,
      ),

      cancelled: countByStatus(
        CommunicationStatus.CANCELLED,
      ),

      unread,

      scheduled,

      overdueScheduled:
        this.getOverdueScheduledMessages(
          asOf,
        ).length,
    };
  }

  /**
   * Replaces one message while preserving all other records.
   */
  private replaceMessage(
    updatedMessage: CommunicationMessage,
  ): void {
    this.messages =
      this.messages.map((message) =>
        message.id ===
        updatedMessage.id
          ? {
              ...updatedMessage,
            }
          : {
              ...message,
            },
      );
  }

  /**
   * Adds one immutable communication-history entry.
   */
  private addHistory(input: {
    messageId: string;
    action: CommunicationHistoryAction;
    performedBy: string | null;
    notes: string | null;
    previousStatus: CommunicationStatus | null;
    newStatus: CommunicationStatus;
  }): void {
    const entry: CommunicationHistoryEntry = {
      id: this.generateId(
        "COMM-HISTORY",
      ),

      messageId: input.messageId,

      businessId: String(
        this.plan.businessId,
      ),

      action: input.action,

      performedBy:
        input.performedBy,

      notes: input.notes,

      previousStatus:
        input.previousStatus,

      newStatus:
        input.newStatus,

      createdAt:
        new Date().toISOString(),
    };

    this.history = [
      ...this.history,
      entry,
    ];
  }

  /**
   * Finds one message.
   */
  private findMessage(
    messageId: string,
  ): CommunicationMessage {
    const message =
      this.messages.find(
        (item) =>
          item.id === messageId,
      );

    if (!message) {
      throw new Error(
        `Communication message "${messageId}" was not found.`,
      );
    }

    return {
      ...message,
    };
  }

  /**
   * Validates legal communication transitions.
   */
  private assertStatus(
    message: CommunicationMessage,
    allowedStatuses: CommunicationStatus[],
    errorMessage: string,
  ): void {
    if (
      !allowedStatuses.includes(
        message.status,
      )
    ) {
      throw new Error(
        `${errorMessage} Current status: ${message.status}.`,
      );
    }
  }

  /**
   * Prevents communication changes when the launch plan is closed or
   * cancelled.
   */
  private assertPlanIsOperational(): void {
    if (
      this.plan.status ===
      EnterpriseStatus.CLOSED
    ) {
      throw new Error(
        "The Business Launch Plan is closed and cannot create or modify communications.",
      );
    }

    if (
      this.plan.status ===
      EnterpriseStatus.CANCELLED
    ) {
      throw new Error(
        "The Business Launch Plan is cancelled and cannot create or modify communications.",
      );
    }
  }

  /**
   * Validates message creation input.
   */
  private validateCreateInput(
    input: CreateCommunicationInput,
  ): void {
    if (!input.recipientId.trim()) {
      throw new Error(
        "A recipient ID is required.",
      );
    }

    if (!input.recipientName.trim()) {
      throw new Error(
        "A recipient name is required.",
      );
    }

    if (
      !String(
        input.recipientRole,
      ).trim()
    ) {
      throw new Error(
        "A recipient role is required.",
      );
    }

    if (!input.subject.trim()) {
      throw new Error(
        "A communication subject is required.",
      );
    }

    if (!input.body.trim()) {
      throw new Error(
        "A communication body is required.",
      );
    }

    if (!input.createdBy.trim()) {
      throw new Error(
        "The message creator is required.",
      );
    }

    if (input.scheduledFor) {
      const scheduledDate =
        this.parseDate(
          input.scheduledFor,
        );

      if (
        scheduledDate.getTime() <=
        Date.now()
      ) {
        throw new Error(
          "The scheduled communication time must be in the future.",
        );
      }
    }
  }

  private parseDate(
    value: string,
  ): Date {
    const normalizedValue =
      /^\d{4}-\d{2}-\d{2}$/.test(
        value,
      )
        ? `${value}T00:00:00.000Z`
        : value;

    const date =
      new Date(normalizedValue);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new Error(
        `Invalid date: "${value}".`,
      );
    }

    return date;
  }

  private validateDate(
    date: Date,
    label: string,
  ): void {
    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new Error(
        `CommunicationEngine received an invalid ${label}.`,
      );
    }
  }

  /**
   * Generates an EOS communication identifier.
   */
  private generateId(
    prefix: string,
  ): string {
    const year =
      new Date().getUTCFullYear();

    const randomCode =
      this.generateRandomCode(8);

    return `${prefix}-${year}-${randomCode}`;
  }

  private generateRandomCode(
    length: number,
  ): string {
    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";

    for (
      let index = 0;
      index < length;
      index += 1
    ) {
      const position =
        Math.floor(
          Math.random() *
            characters.length,
        );

      result +=
        characters[position];
    }

    return result;
  }

  /**
   * Prevents external mutation.
   */
  private clone<T>(
    value: T,
  ): T {
    if (
      typeof structuredClone ===
      "function"
    ) {
      return structuredClone(
        value,
      );
    }

    return JSON.parse(
      JSON.stringify(value),
    ) as T;
  }
}