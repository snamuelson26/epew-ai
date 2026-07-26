/**
 * IBOS Enterprise Type Exports
 *
 * This file is the public entry point for all IBOS engine contracts.
 */

/**
 * Base engine contract and shared engine types.
 */
export * from "./IEngine";

/**
 * Primary enterprise engine interfaces.
 *
 * These are explicitly exported to prevent duplicate base-contract names
 * from older engine files from colliding with IEngine exports.
 */
export type { ILanguageEngine } from "./ILanguageEngine";
export type { IMediaEngine } from "./IMediaEngine";
export type { ICommunicationEngine } from "./ICommunicationEngine";
export type { IDocumentEngine } from "./IDocumentEngine";
export type { IWorkflowEngine } from "./IWorkflowEngine";
export type { IAIEngine } from "./IAIEngine";
export type { IIdentityEngine } from "./IIdentityEngine";
export type { ISecurityEngine } from "./ISecurityEngine";
export type { IAnalyticsEngine } from "./IAnalyticsEngine";

/**
 * AI-specific public types.
 */
export type {
  AIProvider,
  AITaskType,
  AIMessageRole,
  AIEngineConfig,
  AIMessage,
  AIUsage,
  AIRequest,
  AIResponse,
  AIConversation,
  AIClassificationRequest,
  AIClassificationResult,
  AISummarizationRequest,
  AIExtractionRequest,
  AIModerationRequest,
  AIModerationResult,
  AIEmbeddingRequest,
  AIEmbeddingResult,
} from "./IAIEngine";

/**
 * Identity-specific public types.
 */
export type {
  IdentityType,
  IdentityStatus,
  IdentityVerificationStatus,
  IdentityVerificationMethod,
  IdentityEngineConfig,
  IdentityRole,
  IdentityProfile,
  IdentityRecord,
  CreateIdentityInput,
  UpdateIdentityInput,
  IdentityCredentials,
  IdentitySession,
  IdentityAuthenticationResult,
  IdentityVerificationRequest,
  IdentityVerificationResult,
  IdentitySearchRequest,
  IdentitySearchResult,
} from "./IIdentityEngine";

/**
 * Security-specific public types.
 */
export type {
  SecurityRiskLevel,
  SecurityDecision,
  SecurityAuditEventType,
  SecurityEngineConfig,
  AuthorizationRequest,
  AuthorizationResult,
  SecurityPolicyRule,
  SecurityPolicy,
  SecurityAuditEvent,
  SecurityThreatSignal,
  SecurityRiskAssessmentRequest,
  SecurityRiskAssessment,
  EncryptionResult,
  HashResult,
  SecurityTokenRequest,
  SecurityTokenVerificationResult,
  RateLimitRequest,
  RateLimitResult,
} from "./ISecurityEngine";

/**
 * Analytics-specific public types.
 */
export type {
  AnalyticsEventCategory,
  AnalyticsPeriod,
  AnalyticsReportFormat,
  AnalyticsEngineConfig,
  AnalyticsEvent,
  AnalyticsMetric,
  AnalyticsDateRange,
  AnalyticsFilter,
  AnalyticsQuery,
  AnalyticsDataRow,
  AnalyticsQueryResult,
  AnalyticsWidget,
  AnalyticsDashboard,
  AnalyticsReportRequest,
  AnalyticsReport,
} from "./IAnalyticsEngine";