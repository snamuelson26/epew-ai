/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Enterprise Dictionary
 * ------------------------------------------------------------
 * Official system-wide constants.
 * Nothing in the Enterprise Operating System should hardcode
 * event names, statuses, queue names, or engine names.
 * ============================================================
 */

/* ============================================================
   SYSTEM
============================================================ */

export const EOS_VERSION = "1.0.0";

export const ORGANIZATION_NAME =
  "Ekero Partners Empower Wealth";

export const SYSTEM_NAME =
  "EPEW Enterprise Operating System";

export const SYSTEM_CODE = "EOS";

/* ============================================================
   CORE ENGINES
============================================================ */

export const ENGINES = {
  CORE: "core",

  FINANCIAL: "financial",

  ENTREPRENEUR: "entrepreneur",

  FUNDING: "funding",

  CERTIFICATE: "certificate",

  COMMUNICATION: "communication",

  ANALYTICS: "analytics",

  AUDIT: "audit",

  EDUCATION: "education",

  AI: "ai",

  ADMINISTRATION: "administration",

  SECURITY: "security",
} as const;

/* ============================================================
   ENTERPRISE EVENTS
============================================================ */

export const EVENTS = {
  SUPPORTER_CONTRIBUTION_CONFIRMED:
    "supporter.contribution.confirmed",

  SUPPORTER_SUBSCRIPTION_CREATED:
    "supporter.subscription.created",

  SUPPORTER_SUBSCRIPTION_CANCELLED:
    "supporter.subscription.cancelled",

  PAYMENT_FAILED:
    "payment.failed",

  PAYMENT_REFUNDED:
    "payment.refunded",

  ENTREPRENEUR_APPROVED:
    "entrepreneur.approved",

  ENTREPRENEUR_QUALIFIED:
    "entrepreneur.qualified",

  ENTREPRENEUR_FUNDING_READY:
    "entrepreneur.funding.ready",

  ENTREPRENEUR_FUNDED:
    "entrepreneur.funded",

  BUSINESS_OPENED:
    "business.opened",

  CERTIFICATE_ISSUED:
    "certificate.issued",

  COACH_ASSIGNED:
    "coach.assigned",

  ANNUAL_MEETING_COMPLETED:
    "annualmeeting.completed",

  QUARTERLY_REPORT_SUBMITTED:
    "quarterly.report.submitted",
} as const;

/* ============================================================
   ENGINE STATUS
============================================================ */

export const ENGINE_STATUS = {
  IDLE: "idle",

  RUNNING: "running",

  SUCCESS: "success",

  FAILED: "failed",

  ROLLED_BACK: "rolled_back",
} as const;

/* ============================================================
   TRANSACTION STATUS
============================================================ */

export const TRANSACTION_STATUS = {
  PENDING: "pending",

  PROCESSING: "processing",

  COMPLETED: "completed",

  FAILED: "failed",

  CANCELLED: "cancelled",

  REFUNDED: "refunded",
} as const;

/* ============================================================
   CONTRIBUTION FREQUENCY
============================================================ */

export const CONTRIBUTION_FREQUENCY = {
  WEEKLY: "weekly",

  MONTHLY: "monthly",

  ANNUAL: "annual",

  ONE_TIME: "one-time",
} as const;

/* ============================================================
   PAYMENT STATUS
============================================================ */

export const PAYMENT_STATUS = {
  PAID: "paid",

  PENDING: "pending",

  FAILED: "failed",

  REFUNDED: "refunded",
} as const;

/* ============================================================
   PARTICIPATION STATUS
============================================================ */

export const PARTICIPATION_STATUS = {
  PENDING: "Pending",

  ACTIVE: "Active",

  PAUSED: "Paused",

  CANCELLED: "Cancelled",

  COMPLETED: "Completed",
} as const;

/* ============================================================
   FUNDING STATUS
============================================================ */

export const FUNDING_STATUS = {
  PREPARATION: "Preparation",

  MARKETPLACE: "Marketplace",

  FUNDING_QUEUE: "Funding Queue",

  READY_FOR_FUNDING: "Ready for Funding",

  FUNDED: "Funded",

  BUSINESS_OPENED: "Business Opened",
} as const;

/* ============================================================
   QUEUES
============================================================ */

export const QUEUES = {
  FUNDING: "Funding Queue",

  REVIEW: "Review Queue",

  APPROVAL: "Approval Queue",

  CERTIFICATE: "Certificate Queue",
} as const;

/* ============================================================
   NOTIFICATION CHANNELS
============================================================ */

export const CHANNELS = {
  EMAIL: "email",

  SMS: "sms",

  IN_APP: "in_app",

  SYSTEM: "system",
} as const;

/* ============================================================
   AUDIT LEVELS
============================================================ */

export const AUDIT_LEVEL = {
  INFO: "info",

  WARNING: "warning",

  ERROR: "error",

  CRITICAL: "critical",
} as const;