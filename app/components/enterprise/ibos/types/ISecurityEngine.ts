import type {
  EngineConfig,
  EngineOperationResult,
  IEngine,
} from "./IEngine";

/**
 * Security risk levels.
 */
export type SecurityRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

/**
 * Security decision outcomes.
 */
export type SecurityDecision =
  | "allow"
  | "deny"
  | "challenge"
  | "review";

/**
 * Security audit event types.
 */
export type SecurityAuditEventType =
  | "login"
  | "logout"
  | "login_failed"
  | "password_changed"
  | "password_reset"
  | "permission_granted"
  | "permission_denied"
  | "role_assigned"
  | "role_removed"
  | "record_created"
  | "record_viewed"
  | "record_updated"
  | "record_deleted"
  | "file_uploaded"
  | "file_downloaded"
  | "payment_attempted"
  | "payment_completed"
  | "security_alert"
  | "system"
  | "custom";

/**
 * Security engine configuration.
 */
export interface SecurityEngineConfig extends EngineConfig {
  provider?: string;
  encryptionKeyId?: string;
  auditLoggingEnabled?: boolean;
  threatDetectionEnabled?: boolean;
  rateLimitingEnabled?: boolean;
  multiFactorAuthenticationEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  maximumLoginAttempts?: number;
}

/**
 * Authorization request.
 */
export interface AuthorizationRequest {
  identityId?: string;
  roleIds?: string[];
  permission: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  ipAddress?: string;
  userAgent?: string;
  context?: Record<string, unknown>;
}

/**
 * Authorization response.
 */
export interface AuthorizationResult {
  allowed: boolean;
  decision: SecurityDecision;
  reason?: string;
  matchedPolicies?: string[];
  requiredActions?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Security policy rule.
 */
export interface SecurityPolicyRule {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "starts_with"
    | "ends_with"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in"
    | "exists";
  value?: unknown;
}

/**
 * Enterprise security policy.
 */
export interface SecurityPolicy {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  effect: "allow" | "deny" | "challenge" | "review";
  permissions?: string[];
  resources?: string[];
  actions?: string[];
  roles?: string[];
  rules?: SecurityPolicyRule[];
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Security audit event.
 */
export interface SecurityAuditEvent {
  id?: string;
  type: SecurityAuditEventType;
  identityId?: string;
  actorType?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  result?: "success" | "failure" | "blocked";
  riskLevel?: SecurityRiskLevel;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Security threat signal.
 */
export interface SecurityThreatSignal {
  type: string;
  description?: string;
  severity: SecurityRiskLevel;
  confidence?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Security risk assessment request.
 */
export interface SecurityRiskAssessmentRequest {
  identityId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  signals?: SecurityThreatSignal[];
  context?: Record<string, unknown>;
}

/**
 * Security risk assessment response.
 */
export interface SecurityRiskAssessment {
  riskLevel: SecurityRiskLevel;
  riskScore: number;
  decision: SecurityDecision;
  reasons: string[];
  requiredActions?: string[];
  assessedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Encryption response.
 */
export interface EncryptionResult {
  encryptedValue: string;
  algorithm?: string;
  keyId?: string;
  initializationVector?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Hashing response.
 */
export interface HashResult {
  hash: string;
  algorithm: string;
  salt?: string;
}

/**
 * Token creation request.
 */
export interface SecurityTokenRequest {
  subject: string;
  audience?: string;
  expiresInSeconds?: number;
  claims?: Record<string, unknown>;
}

/**
 * Token verification response.
 */
export interface SecurityTokenVerificationResult {
  valid: boolean;
  subject?: string;
  claims?: Record<string, unknown>;
  issuedAt?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Rate limit request.
 */
export interface RateLimitRequest {
  key: string;
  limit: number;
  windowSeconds: number;
  cost?: number;
}

/**
 * Rate limit response.
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
  retryAfterSeconds?: number;
}

/**
 * Enterprise security contract used by IBOS.
 */
export interface ISecurityEngine
  extends IEngine<SecurityEngineConfig> {
  authorize(
    request: AuthorizationRequest,
  ): Promise<AuthorizationResult>;

  hasPermission(
    identityId: string,
    permission: string,
    resource?: string,
    resourceId?: string,
  ): Promise<boolean>;

  createPolicy(
    policy: Omit<SecurityPolicy, "id">,
  ): Promise<SecurityPolicy>;

  updatePolicy(
    policyId: string,
    policy: Partial<SecurityPolicy>,
  ): Promise<SecurityPolicy>;

  deletePolicy(
    policyId: string,
  ): Promise<EngineOperationResult>;

  getPolicy(
    policyId: string,
  ): Promise<SecurityPolicy | null>;

  listPolicies(): Promise<SecurityPolicy[]>;

  audit(
    event: SecurityAuditEvent,
  ): Promise<EngineOperationResult>;

  assessRisk(
    request: SecurityRiskAssessmentRequest,
  ): Promise<SecurityRiskAssessment>;

  encrypt(
    value: string,
    context?: Record<string, unknown>,
  ): Promise<EncryptionResult>;

  decrypt(
    encryptedValue: string,
    context?: Record<string, unknown>,
  ): Promise<string>;

  hash(
    value: string,
  ): Promise<HashResult>;

  verifyHash(
    value: string,
    hash: string,
    salt?: string,
  ): Promise<boolean>;

  createToken(
    request: SecurityTokenRequest,
  ): Promise<string>;

  verifyToken(
    token: string,
  ): Promise<SecurityTokenVerificationResult>;

  checkRateLimit(
    request: RateLimitRequest,
  ): Promise<RateLimitResult>;

  revokeSession(
    sessionId: string,
  ): Promise<EngineOperationResult>;

  revokeAllIdentitySessions(
    identityId: string,
  ): Promise<EngineOperationResult>;
}