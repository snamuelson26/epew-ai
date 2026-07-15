/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Enterprise Business Launch Core
 * ------------------------------------------------------------
 * File:
 * types.ts
 *
 * Purpose:
 * Official enterprise dictionary for the EPEW Business Launch
 * Engine and Business Life Cycle.
 *
 * Owner:
 * EPEW Enterprise Architecture
 *
 * Rules:
 * - No UI dependencies.
 * - No database dependencies.
 * - No literal workflow strings outside approved enums.
 * - All Business Launch engines use these shared definitions.
 * ============================================================
 */

export const BUSINESS_LAUNCH_ENGINE_VERSION = "1.0.0";

/**
 * Branded enterprise identifiers.
 *
 * These aliases improve readability and reduce accidental
 * mixing of unrelated identifiers.
 */
export type LaunchId = string;
export type AllocationId = string;
export type VerificationId = string;
export type ParticipationCycleId = string;
export type EntrepreneurId = string;
export type BusinessId = string;
export type SupporterId = string;
export type CoachId = string;
export type AdministratorId = string;
export type PartnerId = string;
export type VendorId = string;
export type RegistryId = string;
export type ReportId = string;
export type EnterpriseEventId = string;

/**
 * ============================================================
 * BUSINESS LIFE CYCLE
 * ============================================================
 */

export enum BusinessLifeCycleStage {
  ENTREPRENEUR_ENROLLMENT = "entrepreneur_enrollment",
  QUALIFICATION = "qualification",
  COACH_ASSIGNMENT = "coach_assignment",
  BUSINESS_PREPARATION = "business_preparation",
  BUSINESS_PRESENTATION = "business_presentation",
  ANNUAL_MEETING_QUALIFICATION = "annual_meeting_qualification",
  ANNUAL_MEETING = "annual_meeting",
  BUSINESS_LAUNCH_CANDIDATE = "business_launch_candidate",
  FUNDING_COMMITTEE_APPROVAL = "funding_committee_approval",
  BUSINESS_LAUNCH_PLAN = "business_launch_plan",
  PARTNER_SERVICES = "partner_services",
  VENDOR_PAYMENTS = "vendor_payments",
  BUSINESS_READY_VERIFICATION = "business_ready_verification",
  GRAND_OPENING = "grand_opening",
  BUSINESS_OPENING_VERIFICATION = "business_opening_verification",
  WORKING_CAPITAL_RELEASE = "working_capital_release",
  BUSINESS_REGISTRY = "business_registry",
  QUARTERLY_REPORTING = "quarterly_reporting",
  BUSINESS_GROWTH = "business_growth",
  BUSINESS_EXPANSION = "business_expansion",
  SUCCESS_STORY = "success_story",
}

/**
 * Human-readable labels for every life-cycle stage.
 */
export const BUSINESS_LIFE_CYCLE_LABELS: Record<
  BusinessLifeCycleStage,
  string
> = {
  [BusinessLifeCycleStage.ENTREPRENEUR_ENROLLMENT]:
    "Entrepreneur Enrollment",

  [BusinessLifeCycleStage.QUALIFICATION]:
    "Qualification",

  [BusinessLifeCycleStage.COACH_ASSIGNMENT]:
    "Coach Assignment",

  [BusinessLifeCycleStage.BUSINESS_PREPARATION]:
    "Business Preparation",

  [BusinessLifeCycleStage.BUSINESS_PRESENTATION]:
    "Business Presentation",

  [BusinessLifeCycleStage.ANNUAL_MEETING_QUALIFICATION]:
    "Annual Meeting Qualification",

  [BusinessLifeCycleStage.ANNUAL_MEETING]:
    "Annual Meeting",

  [BusinessLifeCycleStage.BUSINESS_LAUNCH_CANDIDATE]:
    "Business Launch Candidate",

  [BusinessLifeCycleStage.FUNDING_COMMITTEE_APPROVAL]:
    "Funding Committee Approval",

  [BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN]:
    "Business Launch Plan",

  [BusinessLifeCycleStage.PARTNER_SERVICES]:
    "Partner Services",

  [BusinessLifeCycleStage.VENDOR_PAYMENTS]:
    "Vendor Payments",

  [BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION]:
    "Business Ready Verification",

  [BusinessLifeCycleStage.GRAND_OPENING]:
    "Grand Opening",

  [BusinessLifeCycleStage.BUSINESS_OPENING_VERIFICATION]:
    "Business Opening Verification",

  [BusinessLifeCycleStage.WORKING_CAPITAL_RELEASE]:
    "Working Capital Release",

  [BusinessLifeCycleStage.BUSINESS_REGISTRY]:
    "Daily / Weekly Business Registry",

  [BusinessLifeCycleStage.QUARTERLY_REPORTING]:
    "Quarterly Reporting",

  [BusinessLifeCycleStage.BUSINESS_GROWTH]:
    "Business Growth",

  [BusinessLifeCycleStage.BUSINESS_EXPANSION]:
    "Business Expansion",

  [BusinessLifeCycleStage.SUCCESS_STORY]:
    "EPEW Success Story",
};

/**
 * ============================================================
 * ENTERPRISE STATUS
 * ============================================================
 */

export enum EnterpriseStatus {
  PENDING = "pending",
  SCHEDULED = "scheduled",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  READY_FOR_APPROVAL = "ready_for_approval",
  APPROVED = "approved",
  AUTHORIZED = "authorized",
  RELEASED = "released",
  VERIFIED = "verified",
  COMPLETED = "completed",
  REJECTED = "rejected",
  ACTIVE = "ACTIVE",
  CANCELLED = "cancelled",
  CLOSED = "CLOSED",
  SUSPENDED = "suspended",
}

/**
 * ============================================================
 * COMPLIANCE
 * ============================================================
 */

export enum ComplianceStatus {
  COMPLIANT = "compliant",
  ACTION_REQUIRED = "action_required",
  NON_COMPLIANT = "non_compliant",
}

export interface ComplianceEvaluation {
  status: ComplianceStatus;
  score: number;
  blockingIssues: string[];
  warnings: string[];
  evaluatedAt: string;
  evaluatedBy?: string | null;
}

/**
 * ============================================================
 * ALLOCATION MODEL
 * ============================================================
 */

export enum AllocationCategory {
  PROMOTION = "promotion",
  BUSINESS_SETUP = "business_setup",
  BUSINESS_MANAGEMENT = "business_management",
  RENT = "rent",
  EQUIPMENT = "equipment",
  INVENTORY = "inventory",
  WORKING_CAPITAL = "working_capital",
  OTHER_APPROVED_BUSINESS_EXPENSES =
    "other_approved_business_expenses",
}

export const ALLOCATION_CATEGORY_LABELS: Record<
  AllocationCategory,
  string
> = {
  [AllocationCategory.PROMOTION]: "Promotion",
  [AllocationCategory.BUSINESS_SETUP]: "Business Setup",
  [AllocationCategory.BUSINESS_MANAGEMENT]:
    "Business Management",
  [AllocationCategory.RENT]: "Rent",
  [AllocationCategory.EQUIPMENT]: "Equipment",
  [AllocationCategory.INVENTORY]: "Inventory",
  [AllocationCategory.WORKING_CAPITAL]: "Working Capital",
  [AllocationCategory.OTHER_APPROVED_BUSINESS_EXPENSES]:
    "Other Approved Business Expenses",
};

export enum AllocationPriority {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum AllocationType {
  PARTNER_SERVICE = "partner_service",
  VENDOR_PAYMENT = "vendor_payment",
  WORKING_CAPITAL = "working_capital",
  CONTINGENCY = "contingency",
}

export enum AllocationRecipientType {
  PARTNER = "partner",
  VENDOR = "vendor",
  LANDLORD = "landlord",
  SUPPLIER = "supplier",
  BUSINESS_ACCOUNT = "business_account",
  OTHER_APPROVED_RECIPIENT = "other_approved_recipient",
}

export interface AllocationRecipient {
  type: AllocationRecipientType;
  id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  paymentReference?: string | null;
}

export interface Allocation {
  id: AllocationId;
  launchId: LaunchId;
  entrepreneurId: EntrepreneurId;
  businessId: BusinessId;

  category: AllocationCategory;
  type: AllocationType;
  priority: AllocationPriority;

  title: string;
  description?: string | null;
  serviceScope?: string | null;

  approvedAmount: number;
  releasedAmount: number;
  remainingAmount: number;

  recipient?: AllocationRecipient | null;

  partnerId?: PartnerId | null;
  vendorId?: VendorId | null;

  entrepreneurStatus: EnterpriseStatus;
  administratorStatus: EnterpriseStatus;
  fundingCommitteeStatus: EnterpriseStatus;
  overallStatus: EnterpriseStatus;

  requiresCoachRecommendation: boolean;
  coachRecommended: boolean;

  requiresFundingCommitteeApproval: boolean;
  fundingCommitteeApproved: boolean;

  supportingDocuments: SupportingDocument[];
  notes: EnterpriseNote[];

  approvedAt?: string | null;
  authorizedAt?: string | null;
  releasedAt?: string | null;
  verifiedAt?: string | null;
  completedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * ============================================================
 * PAYMENT AND REGISTRY
 * ============================================================
 */

export enum PaymentFrequency {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  ANNUAL = "annual",
  ONE_TIME = "one_time",
}

export enum RegistryFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  QUARTERLY = "quarterly",
}

/**
 * ============================================================
 * BUSINESS STATUS
 * ============================================================
 */

export enum BusinessStatus {
  PREPARING = "preparing",
  READY = "ready",
  OPEN = "open",
  OPERATING = "operating",
  GROWING = "growing",
  EXPANDED = "expanded",
  SUSPENDED = "suspended",
  CLOSED = "closed",
}

export interface LaunchTimelineMilestone {
  id: string;
  stage: BusinessLifeCycleStage;
  title: string;
  description: string;
  sequence: number;

  plannedStartDate: string;
  plannedCompletionDate: string;
  actualCompletionDate: string | null;

  owner: string;
  status: EnterpriseStatus;

  createdAt: string;
  updatedAt: string;
}

export interface QuarterlyBusinessReport {
  id: string;
  businessId: string;

  quarter: number;
  title: string;

  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  dueDate: string;

  submittedAt: string | null;
  submittedBy?: string | null;

  reviewedAt: string | null;
  approvedAt: string | null;

  reportReference?: string | null;
  notes?: string | null;

  status: EnterpriseStatus;

  createdAt: string;
  updatedAt: string;
}
export interface StageResult {
  id: string;

  stage: BusinessLifeCycleStage;

  successful: boolean;

  message?: string | null;
  notes?: string | null;

  completedBy?: string | null;
  completedAt: string;

  createdAt: string;
}
/**
 * ============================================================
 * BUSINESS AND FUNDING APPROVAL INPUTS
 * ============================================================
 */

export interface Business {
  id: BusinessId;
  entrepreneurId: EntrepreneurId;

  name: string;
  entrepreneurName: string;

  category?: string | null;
  description?: string | null;

  city?: string | null;
  state?: string | null;
  country?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface FundingApprovalAllocation {
  id?: AllocationId;

  category: AllocationCategory;
  description?: string | null;

  requestedAmount?: number;
  approvedAmount?: number;
  releasedAmount?: number;
  remainingAmount?: number;

  priority?: AllocationPriority;
  type?: AllocationType;
  paymentFrequency?: PaymentFrequency;

  vendorId?: VendorId | null;
  vendorName?: string | null;

  status?: EnterpriseStatus;

  approvedAt?: string | null;
  releasedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface FundingApproval {
  id: string;

  entrepreneurId: EntrepreneurId;
  businessId: BusinessId;

  approvedAmount: number;
  approvedAt: string;

  plannedOpeningDate?: string | null;

  allocations?: FundingApprovalAllocation[];

  approvedBy?: string | null;
  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;
}
/**
 * ============================================================
 * BUSINESS LAUNCH PLAN
 * ============================================================
 */

export interface BusinessLaunchPlan {
  id: LaunchId;

  /**
   * Optional secondary identifier used by the Launch Planner.
   */
  launchPlanId?: string;

  entrepreneurId: EntrepreneurId;
  businessId: BusinessId;
  participationCycleId?: ParticipationCycleId | null;

  entrepreneurName: string;
  businessName: string;

  /**
   * Funding approval information.
   */
  fundingApprovalId?: string | null;
  approvedAmount?: number;
  approvedAt?: string | null;

  currentStage: BusinessLifeCycleStage;
  status: EnterpriseStatus;
  businessStatus: BusinessStatus;
  complianceStatus: ComplianceStatus;

  /**
   * Complete compliance record.
   */
  compliance: {
    id: string;
    businessId: BusinessId;
    status: ComplianceStatus;

    requirements: Array<{
      id: string;
      title: string;
      required: boolean;
      completed: boolean;
      completedAt: string | null;

      approvedBy?: string | null;
      notes?: string | null;
      dueDate?: string | null;

      status?: EnterpriseStatus;
      createdAt?: string;
      updatedAt?: string;

      reopenedBy?: string | null;
      reopenedAt?: string | null;
      createdBy?: string | null;
      dueDateUpdatedBy?: string | null;
    }>;

    lastReviewedAt: string | null;
    nextReviewDate: string | null;

    evaluatedBy?: string | null;
    reviewNotes?: string | null;
    requirementHistory?: unknown[];

    createdAt: string;
    updatedAt: string;
  };

  /**
   * Funding totals.
   */
  fundingGoal: number;
  allocatedAmount: number;
  releasedAmount: number;
  remainingBalance: number;

  /**
   * Readiness measurements.
   */
  readinessScore: number;
  readinessThreshold: number;

  coachId?: CoachId | null;
  administratorId?: AdministratorId | null;

  /**
   * Opening dates.
   */
  targetOpeningDate?: string | null;
  plannedOpeningDate?: string | null;
  grandOpeningDate?: string | null;

  businessOpeningVerifiedAt?: string | null;
  workingCapitalReleasedAt?: string | null;

  /**
   * Launch-plan operational records.
   */
  allocations: Allocation[];
  partnerAssignments: PartnerAssignment[];
  vendorAssignments: VendorAssignment[];

  deliverables: Array<{
    id: string;
    businessId: BusinessId;

    title: string;
    description?: string | null;

    stage: BusinessLifeCycleStage;
    owner?: string | null;

    required: boolean;
    completed: boolean;
    completedAt: string | null;

    verifiedBy?: string | null;
    verifiedAt?: string | null;

    notes?: string | null;

    status: EnterpriseStatus;

    createdAt: string;
    updatedAt: string;
  }>;

  /**
   * Launch milestones and reporting.
   */
  timeline: LaunchTimelineMilestone[];
  reporting: QuarterlyBusinessReport[];

  /**
   * Registry schedules generated by LaunchPlanner.
   *
   * The dedicated BusinessRegistryEngine stores its full registry
   * records separately through the repository layer.
   */
  registry?: Array<{
    id: string;
    businessId: BusinessId;

    title: string;
    description?: string | null;

    frequency?: RegistryFrequency;
    effectiveDate?: string | null;
    nextDueDate?: string | null;

    status: EnterpriseStatus;
    completedAt?: string | null;

    createdAt: string;
    updatedAt: string;
  }>;

  readinessVerification?: BusinessReadyVerification | null;
  grandOpening?: GrandOpeningRecord | null;
  workingCapital?: WorkingCapitalRecord | null;

  /**
   * Immutable lifecycle history.
   */
  stageResults: StageResult[];

  /**
   * Business-ready verification audit fields.
   */
  businessReadyVerifiedAt?: string | null;
  businessReadyVerifiedBy?: string | null;
  businessReadyVerificationNotes?: string | null;

  /**
   * Official business-opening audit fields.
   */
  businessOpeningDate?: string | null;
  openedAt?: string | null;
  openedBy?: string | null;
  openingNotes?: string | null;

  /**
   * Reporting-cycle information.
   */
  reportingComplianceStatus?: ComplianceStatus;
  reportingLastReviewedAt?: string | null;
  reportingHistory?: unknown[];

  allQuarterlyReportsSubmittedAt?: string | null;
  allQuarterlyReportsApprovedAt?: string | null;

  /**
   * Registry compliance information.
   */
  registryComplianceStatus?: ComplianceStatus;
  registryLastReviewedAt?: string | null;

  /**
   * Business-ready and opening compatibility fields.
   */
  businessReadyVerified?: boolean;
  businessReadyVerifiedById?: string | null;

  /**
   * Lifecycle closure and cancellation.
   */
  closedAt?: string | null;
  closeReason?: string | null;

  cancelledAt?: string | null;
  cancelReason?: string | null;

  /**
   * Overall Business Launch Plan timestamps.
   */
  createdAt: string;
  updatedAt: string;
}
/**
 * ============================================================
 * PARTNER AND VENDOR ASSIGNMENTS
 * ============================================================
 */

export enum PartnerServiceType {
  PROMOTION = "promotion",
  BUSINESS_SETUP = "business_setup",
  BUSINESS_MANAGEMENT = "business_management",
}

export interface PartnerAssignment {
  id: string;
  launchId: LaunchId;
  entrepreneurId: EntrepreneurId;
  businessId: BusinessId;
  partnerId: PartnerId;

  serviceType: PartnerServiceType;
  scope: string;

  status: EnterpriseStatus;

  assignedAt: string;
  dueDate?: string | null;
  completedAt?: string | null;
  verifiedAt?: string | null;

  notes: EnterpriseNote[];
}

export enum VendorServiceType {
  RENT = "rent",
  EQUIPMENT = "equipment",
  INVENTORY = "inventory",
  OTHER_APPROVED_BUSINESS_EXPENSE =
    "other_approved_business_expense",
}

export interface VendorAssignment {
  id: string;
  launchId: LaunchId;
  entrepreneurId: EntrepreneurId;
  businessId: BusinessId;
  vendorId: VendorId;

  serviceType: VendorServiceType;
  scope: string;

  approvedAmount: number;
  paidAmount: number;
  remainingAmount: number;

  status: EnterpriseStatus;

  assignedAt: string;
  paymentDueDate?: string | null;
  paidAt?: string | null;
  verifiedAt?: string | null;

  notes: EnterpriseNote[];
}

/**
 * ============================================================
 * READINESS VERIFICATION
 * ============================================================
 */

export enum ReadinessRequirementCode {
  BUSINESS_REGISTRATION_COMPLETE =
    "business_registration_complete",

  EIN_OBTAINED = "ein_obtained",

  BUSINESS_BANK_ACCOUNT_OPENED =
    "business_bank_account_opened",

  LEASE_VERIFIED = "lease_verified",

  BUSINESS_ADDRESS_VERIFIED =
    "business_address_verified",

  INSURANCE_ACTIVE = "insurance_active",

  LICENSES_ACTIVE = "licenses_active",

  COACH_APPROVAL = "coach_approval",

  ADMINISTRATOR_APPROVAL = "administrator_approval",

  PARTNER_ASSIGNMENTS_COMPLETE =
    "partner_assignments_complete",

  VENDOR_ASSIGNMENTS_COMPLETE =
    "vendor_assignments_complete",

  FUNDING_COMMITTEE_APPROVED =
    "funding_committee_approved",

  PARTICIPATION_CYCLE_ACTIVE =
    "participation_cycle_active",

  PROMOTION_READY = "promotion_ready",

  EQUIPMENT_READY = "equipment_ready",

  INVENTORY_READY = "inventory_ready",
}

export interface ReadinessRequirement {
  code: ReadinessRequirementCode;
  label: string;
  required: boolean;
  completed: boolean;
  weight: number;

  verifiedBy?: string | null;
  verifiedAt?: string | null;
  evidence?: SupportingDocument[];
  notes?: string | null;
}

export interface BusinessReadyVerification {
  id: VerificationId;
  launchId: LaunchId;
  entrepreneurId: EntrepreneurId;
  businessId: BusinessId;

  requirements: ReadinessRequirement[];

  score: number;
  requiredThreshold: number;
  readyForGrandOpening: boolean;

  coachApproved: boolean;
  administratorApproved: boolean;
  complianceStatus: ComplianceStatus;

  blockingIssues: string[];
  warnings: string[];

  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * ============================================================
 * GRAND OPENING
 * ============================================================
 */

export interface GrandOpeningRecord {
  id: string;
  launchId: LaunchId;
  entrepreneurId: EntrepreneurId;
  businessId: BusinessId;

  scheduledDate?: string | null;
  completedDate?: string | null;

  location?: string | null;
  description?: string | null;

  communityInvitationPrepared: boolean;
  ribbonCuttingPlanned: boolean;
  mediaCoveragePlanned: boolean;

  photos: SupportingDocument[];
  videos: SupportingDocument[];

  entrepreneurConfirmed: boolean;
  coachConfirmed: boolean;
  administratorConfirmed: boolean;

  openingVerified: boolean;
  status: EnterpriseStatus;

  createdAt: string;
  updatedAt: string;
}

/**
 * ============================================================
 * WORKING CAPITAL
 * ============================================================
 */

export interface WorkingCapitalReleaseConditions {
  grandOpeningCompleted: boolean;
  businessOpeningVerified: boolean;
  coachVerified: boolean;
  administratorVerified: boolean;
  compliancePassed: boolean;
  participationCycleActive: boolean;
  businessBankAccountVerified: boolean;
}

export interface WorkingCapitalRecord {
  id: string;
  allocationId: AllocationId;
  launchId: LaunchId;
  entrepreneurId: EntrepreneurId;
  businessId: BusinessId;

  approvedAmount: number;
  releasedAmount: number;
  remainingAmount: number;

  conditions: WorkingCapitalReleaseConditions;

  eligibleForRelease: boolean;
  status: EnterpriseStatus;

  authorizedBy?: string | null;
  authorizedAt?: string | null;

  releasedBy?: string | null;
  releasedAt?: string | null;

  verificationNotes?: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * ============================================================
 * BUSINESS LIFE-CYCLE GOVERNANCE
 * ============================================================
 */

export enum EnterpriseRole {
  ENTREPRENEUR = "entrepreneur",
  COACH = "coach",
  ADMINISTRATOR = "administrator",
  EPEW_ADMINISTRATION = "epew_administration",
  QUALIFICATION_COMMITTEE = "qualification_committee",
  FUNDING_COMMITTEE = "funding_committee",
  BUSINESS_LAUNCH_ENGINE = "business_launch_engine",
  ASSIGNED_PARTNER = "assigned_partner",
  FINANCE_DEPARTMENT = "finance_department",
  BUSINESS_LAUNCH_TEAM = "business_launch_team",
  GROWTH_ENGINE = "growth_engine",
  GROWTH_COMMITTEE = "growth_committee",
  COMMUNICATIONS_TEAM = "communications_team",
  EOS = "eos",
}

export enum EnterpriseEngineName {
  ENTERPRISE_CORE = "enterprise_core",
  PARTICIPATION_ENGINE = "participation_engine",
  FINANCIAL_ENGINE = "financial_engine",
  BUSINESS_LAUNCH_ENGINE = "business_launch_engine",
  BUSINESS_REGISTRY_ENGINE = "business_registry_engine",
  REPORTING_ENGINE = "reporting_engine",
  GROWTH_ENGINE = "growth_engine",
  COMMUNICATION_ENGINE = "communication_engine",
  COMPLIANCE_ENGINE = "compliance_engine",
}

export interface LifeCycleRequirement {
  code: string;
  label: string;
  description?: string;
  required: boolean;
}

export interface LifeCycleDeliverable {
  code: string;
  label: string;
  description?: string;
  required: boolean;
}

export interface BusinessLifeCycleStageDefinition {
  stage: BusinessLifeCycleStage;
  label: string;
  order: number;

  owners: EnterpriseRole[];
  engines: EnterpriseEngineName[];

  entryRequirements: LifeCycleRequirement[];
  exitRequirements: LifeCycleRequirement[];
  deliverables: LifeCycleDeliverable[];

  nextStage: BusinessLifeCycleStage | null;
  previousStage: BusinessLifeCycleStage | null;

  description: string;
}

/**
 * ============================================================
 * ENTERPRISE DOCUMENTS AND NOTES
 * ============================================================
 */

export enum SupportingDocumentType {
  INVOICE = "invoice",
  ESTIMATE = "estimate",
  RECEIPT = "receipt",
  AGREEMENT = "agreement",
  LICENSE = "license",
  INSURANCE = "insurance",
  LEASE = "lease",
  PHOTO = "photo",
  VIDEO = "video",
  BANK_VERIFICATION = "bank_verification",
  OTHER = "other",
}

export interface SupportingDocument {
  id: string;
  type: SupportingDocumentType;
  name: string;
  url?: string | null;
  storagePath?: string | null;
  uploadedBy?: string | null;
  uploadedAt: string;
  verified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export interface EnterpriseNote {
  id: string;
  authorId?: string | null;
  authorRole?: EnterpriseRole | null;
  content: string;
  createdAt: string;
}

/**
 * ============================================================
 * ENTERPRISE EVENTS AND AUDIT
 * ============================================================
 */

export enum BusinessLaunchEventName {
  BUSINESS_LAUNCH_CANDIDATE_CREATED =
    "business_launch_candidate_created",

  FUNDING_COMMITTEE_APPROVED =
    "funding_committee_approved",

  BUSINESS_LAUNCH_PLAN_CREATED =
    "business_launch_plan_created",

  ALLOCATION_CREATED = "allocation_created",

  PARTNER_ASSIGNED = "partner_assigned",

  VENDOR_ASSIGNED = "vendor_assigned",

  BUSINESS_READY_VERIFIED =
    "business_ready_verified",

  GRAND_OPENING_SCHEDULED =
    "grand_opening_scheduled",

  GRAND_OPENING_COMPLETED =
    "grand_opening_completed",

  BUSINESS_OPENING_VERIFIED =
    "business_opening_verified",

  WORKING_CAPITAL_AUTHORIZED =
    "working_capital_authorized",

  WORKING_CAPITAL_RELEASED =
    "working_capital_released",

  BUSINESS_REGISTRY_ACTIVATED =
    "business_registry_activated",

  BUSINESS_LIFE_CYCLE_STAGE_CHANGED =
    "business_life_cycle_stage_changed",
}

export interface BusinessLaunchAuditEvent<TPayload = unknown> {
  id: EnterpriseEventId;
  name: BusinessLaunchEventName;

  launchId?: LaunchId | null;
  entrepreneurId?: EntrepreneurId | null;
  businessId?: BusinessId | null;

  actorId?: string | null;
  actorRole?: EnterpriseRole | null;

  occurredAt: string;
  payload: TPayload;
}

/**
 * ============================================================
 * STANDARD ENTERPRISE RESULT
 * ============================================================
 */

export interface EnterpriseResult<TData = unknown> {
  success: boolean;
  status: EnterpriseStatus;
  message: string;
  data: TData | null;
  warnings: string[];
  errors: string[];
  auditEvents: BusinessLaunchAuditEvent[];
  metadata?: Record<string, unknown>;
}

/**
 * Helper for successful engine results.
 */
export function createEnterpriseSuccess<TData>({
  status = EnterpriseStatus.COMPLETED,
  message,
  data,
  warnings = [],
  auditEvents = [],
  metadata,
}: {
  status?: EnterpriseStatus;
  message: string;
  data: TData;
  warnings?: string[];
  auditEvents?: BusinessLaunchAuditEvent[];
  metadata?: Record<string, unknown>;
}): EnterpriseResult<TData> {
  return {
    success: true,
    status,
    message,
    data,
    warnings,
    errors: [],
    auditEvents,
    metadata,
  };
}

/**
 * Helper for failed engine results.
 */
export function createEnterpriseFailure<TData = never>({
  status = EnterpriseStatus.REJECTED,
  message,
  errors,
  warnings = [],
  auditEvents = [],
  metadata,
}: {
  status?: EnterpriseStatus;
  message: string;
  errors: string[];
  warnings?: string[];
  auditEvents?: BusinessLaunchAuditEvent[];
  metadata?: Record<string, unknown>;
}): EnterpriseResult<TData> {
  return {
    success: false,
    status,
    message,
    data: null,
    warnings,
    errors,
    auditEvents,
    metadata,
  };
}

/**
 * Ensures percentage values remain within 0–100.
 */
export function clampEnterprisePercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Number(value), 0), 100);
}

/**
 * Ensures monetary values cannot be negative.
 */
export function normalizeEnterpriseAmount(value: number): number {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Number(Math.max(amount, 0).toFixed(2));
}