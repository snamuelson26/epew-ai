import type {
  EngineConfig,
  EngineOperationResult,
  IEngine,
} from "./IEngine";

/**
 * Identity types recognized by IBOS.
 */
export type IdentityType =
  | "user"
  | "entrepreneur"
  | "supporter"
  | "coach"
  | "administrator"
  | "partner"
  | "vendor"
  | "employee"
  | "organization"
  | "business"
  | "guest"
  | "system";

/**
 * Identity lifecycle statuses.
 */
export type IdentityStatus =
  | "pending"
  | "active"
  | "inactive"
  | "suspended"
  | "blocked"
  | "archived"
  | "deleted";

/**
 * Identity verification statuses.
 */
export type IdentityVerificationStatus =
  | "not_started"
  | "pending"
  | "in_review"
  | "verified"
  | "rejected"
  | "expired"
  | "requires_action";

/**
 * Supported identity verification methods.
 */
export type IdentityVerificationMethod =
  | "email"
  | "phone"
  | "government_id"
  | "selfie"
  | "address"
  | "business_document"
  | "manual_review"
  | "biometric"
  | "custom";

/**
 * Identity engine configuration.
 */
export interface IdentityEngineConfig extends EngineConfig {
  provider?: string;
  requireEmailVerification?: boolean;
  requirePhoneVerification?: boolean;
  requireGovernmentId?: boolean;
  requireSelfieVerification?: boolean;
  allowMultipleRoles?: boolean;
  sessionDurationMinutes?: number;
}

/**
 * A role assigned to an identity.
 */
export interface IdentityRole {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  assignedAt?: string;
  expiresAt?: string;
}

/**
 * Identity profile information.
 */
export interface IdentityProfile {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  displayName?: string;
  dateOfBirth?: string;
  gender?: string;
  raceEthnicity?: string;
  preferredLanguage?: string;
  timezone?: string;
  country?: string;
  state?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Enterprise identity record.
 */
export interface IdentityRecord {
  id: string;
  externalId?: string;
  type: IdentityType;
  status: IdentityStatus;
  email?: string;
  phone?: string;
  profile: IdentityProfile;
  roles: IdentityRole[];
  verificationStatus: IdentityVerificationStatus;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input used to create an identity.
 */
export interface CreateIdentityInput {
  type: IdentityType;
  email?: string;
  phone?: string;
  password?: string;
  profile?: IdentityProfile;
  roles?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Input used to update an identity.
 */
export interface UpdateIdentityInput {
  email?: string;
  phone?: string;
  status?: IdentityStatus;
  profile?: Partial<IdentityProfile>;
  metadata?: Record<string, unknown>;
}

/**
 * Login credentials.
 */
export interface IdentityCredentials {
  email?: string;
  phone?: string;
  password?: string;
  oneTimeCode?: string;
  provider?: string;
  providerToken?: string;
}

/**
 * Authenticated identity session.
 */
export interface IdentitySession {
  id: string;
  identityId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Authentication result.
 */
export interface IdentityAuthenticationResult {
  success: boolean;
  identity?: IdentityRecord;
  session?: IdentitySession;
  requiresMultiFactorAuthentication?: boolean;
  challengeId?: string;
  message?: string;
  error?: string;
}

/**
 * Verification request.
 */
export interface IdentityVerificationRequest {
  identityId: string;
  method: IdentityVerificationMethod;
  documentType?: string;
  documentNumber?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  country?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Verification result.
 */
export interface IdentityVerificationResult {
  success: boolean;
  verificationId?: string;
  identityId: string;
  method: IdentityVerificationMethod;
  status: IdentityVerificationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  expiresAt?: string;
  message?: string;
  reasons?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Identity search request.
 */
export interface IdentitySearchRequest {
  query?: string;
  types?: IdentityType[];
  statuses?: IdentityStatus[];
  roles?: string[];
  verificationStatuses?: IdentityVerificationStatus[];
  limit?: number;
  offset?: number;
}

/**
 * Identity search response.
 */
export interface IdentitySearchResult {
  identities: IdentityRecord[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Enterprise identity contract used by IBOS.
 */
export interface IIdentityEngine
  extends IEngine<IdentityEngineConfig> {
  createIdentity(
    input: CreateIdentityInput,
  ): Promise<IdentityRecord>;

  getIdentity(
    identityId: string,
  ): Promise<IdentityRecord | null>;

  getIdentityByEmail(
    email: string,
  ): Promise<IdentityRecord | null>;

  updateIdentity(
    identityId: string,
    input: UpdateIdentityInput,
  ): Promise<IdentityRecord>;

  deleteIdentity(
    identityId: string,
  ): Promise<EngineOperationResult>;

  searchIdentities(
    request: IdentitySearchRequest,
  ): Promise<IdentitySearchResult>;

  authenticate(
    credentials: IdentityCredentials,
  ): Promise<IdentityAuthenticationResult>;

  logout(
    sessionId: string,
  ): Promise<EngineOperationResult>;

  refreshSession(
    refreshToken: string,
  ): Promise<IdentitySession>;

  getSession(
    sessionId: string,
  ): Promise<IdentitySession | null>;

  verifyIdentity(
    request: IdentityVerificationRequest,
  ): Promise<IdentityVerificationResult>;

  getVerificationStatus(
    identityId: string,
  ): Promise<IdentityVerificationResult | null>;

  assignRole(
    identityId: string,
    roleId: string,
  ): Promise<EngineOperationResult>;

  removeRole(
    identityId: string,
    roleId: string,
  ): Promise<EngineOperationResult>;

  hasRole(
    identityId: string,
    roleId: string,
  ): Promise<boolean>;

  hasPermission(
    identityId: string,
    permission: string,
  ): Promise<boolean>;
}