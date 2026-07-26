import {
  EngineConfig,
  EngineOperationResult,
  IEngine,
} from "./IEngine";

/**
 * Communication channels supported by IBOS.
 */
export type CommunicationChannel =
  | "email"
  | "sms"
  | "whatsapp"
  | "push"
  | "inApp"
  | "voice"
  | "webhook";

/**
 * Communication priority.
 */
export type CommunicationPriority =
  | "low"
  | "normal"
  | "high"
  | "critical";

/**
 * Delivery status.
 */
export type CommunicationStatus =
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "failed"
  | "cancelled";

/**
 * Recipient information.
 */
export interface CommunicationRecipient {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  language?: string;
}

/**
 * Message attachment.
 */
export interface CommunicationAttachment {
  id?: string;
  name: string;
  url: string;
  mimeType?: string;
}

/**
 * Communication message.
 */
export interface CommunicationMessage {
  subject?: string;
  body: string;
  html?: string;

  language?: string;

  channel: CommunicationChannel;

  priority?: CommunicationPriority;

  templateId?: string;

  variables?: Record<string, unknown>;

  attachments?: CommunicationAttachment[];

  metadata?: Record<string, unknown>;
}

/**
 * Delivery result.
 */
export interface CommunicationResult {
  success: boolean;

  status: CommunicationStatus;

  messageId?: string;

  provider?: string;

  sentAt?: string;

  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Communication template.
 */
export interface CommunicationTemplate {
  id: string;

  name: string;

  channel: CommunicationChannel;

  subject?: string;

  body: string;

  language?: string;

  variables?: string[];
}

/**
 * Communication engine configuration.
 */
export interface CommunicationEngineConfig
  extends EngineConfig {

  defaultLanguage: string;

  defaultChannel: CommunicationChannel;

  retryAttempts?: number;

  queueEnabled?: boolean;

  loggingEnabled?: boolean;
}

/**
 * IBOS Global Communication Engine.
 */
export interface ICommunicationEngine
  extends IEngine<CommunicationEngineConfig> {

  /**
   * Send a communication.
   */
  send(
    recipient: CommunicationRecipient,
    message: CommunicationMessage,
  ): Promise<CommunicationResult>;

  /**
   * Send the same message to many recipients.
   */
  sendBulk(
    recipients: CommunicationRecipient[],
    message: CommunicationMessage,
  ): Promise<CommunicationResult[]>;

  /**
   * Queue a message.
   */
  queue(
    recipient: CommunicationRecipient,
    message: CommunicationMessage,
  ): Promise<CommunicationResult>;

  /**
   * Cancel queued communication.
   */
  cancel(
    messageId: string,
  ): Promise<EngineOperationResult>;

  /**
   * Register template.
   */
  registerTemplate(
    template: CommunicationTemplate,
  ): Promise<EngineOperationResult>;

  /**
   * Remove template.
   */
  unregisterTemplate(
    templateId: string,
  ): Promise<EngineOperationResult>;

  /**
   * Retrieve template.
   */
  getTemplate(
    templateId: string,
  ): CommunicationTemplate | undefined;

  /**
   * Check delivery status.
   */
  getStatus(
    messageId: string,
  ): Promise<CommunicationStatus>;

  /**
   * Retry failed communication.
   */
  retry(
    messageId: string,
  ): Promise<CommunicationResult>;

  /**
   * Reset communication engine.
   */
  reset(): Promise<EngineOperationResult>;
}