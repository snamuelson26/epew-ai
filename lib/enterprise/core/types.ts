export type EngineStatus =
  | "idle"
  | "running"
  | "success"
  | "failed"
  | "rolled_back";

export type EngineSeverity = "info" | "warning" | "error" | "critical";

export type EnterpriseEventStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface EnterpriseEvent<TPayload = any> {
  id: string;
  name: string;
  source: string;
  status: EnterpriseEventStatus;
  payload: TPayload;
  correlationId: string;
  transactionId?: string;
  userId?: string | null;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface EnterpriseContext {
  correlationId: string;
  transactionId?: string;
  userId?: string | null;
  organizationId?: string | null;
  source: string;
  environment: "development" | "test" | "production";
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface EnterpriseTransaction {
  id: string;
  correlationId: string;
  engine: string;
  status: EngineStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
}

export interface EngineWarning {
  code: string;
  message: string;
  severity: EngineSeverity;
  metadata?: Record<string, any>;
}

export interface EngineResult<TData = any> {
  success: boolean;
  status: EngineStatus;
  message: string;
  data?: TData;
  warnings?: EngineWarning[];
  events?: EnterpriseEvent[];
  transaction?: EnterpriseTransaction;
  durationMs?: number;
}

export interface AuditRecord {
  id: string;
  action: string;
  engine: string;
  actorId?: string | null;
  entityType?: string;
  entityId?: string | null;
  previousValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  correlationId: string;
  transactionId?: string;
  severity: EngineSeverity;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationMessage {
  id: string;
  recipientId?: string | null;
  recipientEmail?: string | null;
  channel: "email" | "sms" | "in_app" | "system";
  subject: string;
  message: string;
  status: "pending" | "sent" | "failed";
  eventName?: string;
  correlationId: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface Contribution {
  supporterId: string;
  entrepreneurId: string;
  businessId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeInvoiceId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  amount: number;
  units: number;
  frequency: "weekly" | "monthly" | "annual" | "one-time";
  status: "paid" | "failed" | "pending" | "refunded";
  paymentType: "recurring" | "one-time";
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface Participation {
  supporterId: string;
  entrepreneurId: string;
  units: number;
  weeklyAmount: number;
  monthlyAmount: number;
  annualCommitment: number;
  paymentFrequency: "weekly" | "monthly" | "annual" | "one-time";
  automaticPaymentActive: boolean;
  participationStatus: "Pending" | "Active" | "Paused" | "Cancelled" | "Completed";
  agreementAccepted: boolean;
  metadata?: Record<string, any>;
}

export interface FinancialSummary {
  totalRevenue: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  totalTransactions: number;
  totalUnits: number;
  activeSupporters: number;
  activeSubscriptions: number;
  failedPayments: number;
}