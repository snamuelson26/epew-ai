// =======================================================
// EPEW – EDE – IBOS
// Business Launch Readiness Service
//
// Official gateway between entrepreneur development
// and the EPEW community funding lifecycle.
//
// Constitutional Principle #018
// Centralized Lifecycle Orchestration
//
// Constitutional Principle #019
// Objective Business Launch Readiness
// =======================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { EntrepreneurTimelineService } from "@/lib/services/EntrepreneurTimelineService";

// =======================================================
// Funding paths
// =======================================================

export type BusinessLaunchFundingPath =
  | "funding_queue"
  | "fully_funded_non_queue";

// =======================================================
// Readiness category names
// =======================================================

export type BusinessLaunchReadinessCategory =
  | "identity"
  | "qualification"
  | "coach"
  | "business"
  | "marketplace"
  | "compliance"
  | "funding";

// =======================================================
// Requirement status
// =======================================================

export type ReadinessRequirementStatus =
  | "completed"
  | "missing"
  | "warning"
  | "not_applicable";

// =======================================================
// Readiness requirement severity
// =======================================================

export type ReadinessRequirementSeverity =
  | "required"
  | "recommended"
  | "optional";

// =======================================================
// Individual readiness requirement
// =======================================================

export interface BusinessLaunchReadinessRequirement {
  key: string;

  label: string;

  description: string;

  category:
    BusinessLaunchReadinessCategory;

  severity:
    ReadinessRequirementSeverity;

  status:
    ReadinessRequirementStatus;

  completed: boolean;

  scoreValue: number;

  earnedScore: number;

  blocking: boolean;

  metadata?: Record<string, unknown>;
}

// =======================================================
// Category evaluation result
// =======================================================

export interface BusinessLaunchReadinessCategoryResult {
  category:
    BusinessLaunchReadinessCategory;

  label: string;

  completed: boolean;

  score: number;

  maximumScore: number;

  percentage: number;

  blockingIssues: number;

  completedRequirements: number;

  totalRequirements: number;

  requirements:
    BusinessLaunchReadinessRequirement[];
}

// =======================================================
// Main readiness result
// =======================================================

export interface BusinessLaunchReadinessResult {
  success: boolean;

  entrepreneurId: string;

  ready: boolean;

  readinessScore: number;

  minimumRequiredScore: number;

  fundingPath:
    BusinessLaunchFundingPath;

  fundedAnnualUnits: number;

  requiredAnnualUnits: number;

  missingRequirements: string[];

  warnings: string[];

  completedRequirements: string[];

  blockingRequirements: string[];

  categories:
    BusinessLaunchReadinessCategoryResult[];

  evaluatedAt: string;

  message: string;
}

// =======================================================
// Evaluation options
// =======================================================

export interface EvaluateBusinessLaunchReadinessOptions {
  recordTimelineEvent?: boolean;

  requireMarketplacePublication?: boolean;

  requireAnnualMeetingEligibility?: boolean;

  minimumReadinessScore?: number;

  performedBy?: string;

  source?: string;
}

// =======================================================
// Internal entrepreneur record
// =======================================================

interface EntrepreneurReadinessRecord {
  id: string;

  status: string | null;

  current_stage: string | null;

  previous_stage: string | null;

  next_stage: string | null;

  qualified_at: string | null;

  full_name: string | null;

  email: string | null;

  phone: string | null;

  email_verified: boolean | null;

  phone_verified: boolean | null;

  identity_verified: boolean | null;

  profile_completed: boolean | null;

  government_id_url: string | null;

  selfie_url: string | null;

  business_name: string | null;

  business_description: string | null;

  business_category: string | null;

  business_plan_completed: boolean | null;

  business_plan_url: string | null;

  startup_budget_completed: boolean | null;

  startup_cost: number | null;

  community_impact_completed: boolean | null;

  marketplace_status: string | null;

  marketplace_visibility: boolean | null;

  marketplace_published_at: string | null;

  business_logo_url: string | null;

  business_photo_url: string | null;

  presentation_completed: boolean | null;

  presentation_video_url: string | null;

  required_documents_completed: boolean | null;

  terms_accepted: boolean | null;

  compliance_status: string | null;

  annual_meeting_registered: boolean | null;

  annual_meeting_eligible: boolean | null;

  funded_annual_units: number | null;

  funding_status: string | null;
}

// =======================================================
// Internal coach assignment record
// =======================================================

interface CoachAssignmentReadinessRecord {
  id: string;

  entrepreneur_id: string;

  coach_id: string;

  status: string | null;

  assigned_at: string | null;

  first_contact_completed_at:
    string | null;

  interview_completed_at:
    string | null;

  recommendation_status:
    string | null;

  recommendation_submitted_at:
    string | null;
}

// =======================================================
// Internal evaluation context
// =======================================================

interface ReadinessEvaluationContext {
  entrepreneur:
    EntrepreneurReadinessRecord;

  coachAssignment:
    CoachAssignmentReadinessRecord | null;

  fundedAnnualUnits: number;

  requiredAnnualUnits: number;

  fundingPath:
    BusinessLaunchFundingPath;

  evaluatedAt: string;

  options:
    Required<
      EvaluateBusinessLaunchReadinessOptions
    >;
}

// =======================================================
// Readiness errors
// =======================================================

export type BusinessLaunchReadinessErrorCode =
  | "INVALID_ENTREPRENEUR_ID"
  | "ENTREPRENEUR_NOT_FOUND"
  | "ENTREPRENEUR_LOOKUP_FAILED"
  | "COACH_ASSIGNMENT_LOOKUP_FAILED"
  | "READINESS_EVALUATION_FAILED"
  | "TIMELINE_RECORDING_FAILED";

// =======================================================
// Readiness error class
// =======================================================

export class BusinessLaunchReadinessError
  extends Error {
  constructor(
    message: string,
    public readonly code:
      BusinessLaunchReadinessErrorCode,
    public readonly causeData?: unknown
  ) {
    super(message);

    this.name =
      "BusinessLaunchReadinessError";
  }
}


// =======================================================
// Service constants
// =======================================================

const DEFAULT_MINIMUM_READINESS_SCORE = 85;

const REQUIRED_ANNUAL_UNITS = 20;

const DEFAULT_OPTIONS: Required<
  EvaluateBusinessLaunchReadinessOptions
> = {
  recordTimelineEvent: false,

  requireMarketplacePublication: true,

  requireAnnualMeetingEligibility: true,

  minimumReadinessScore:
    DEFAULT_MINIMUM_READINESS_SCORE,

  performedBy:
    "BusinessLaunchReadinessService",

  source:
    "BusinessLaunchReadinessService",
};

// =======================================================
// Category labels
// =======================================================

const CATEGORY_LABELS: Record<
  BusinessLaunchReadinessCategory,
  string
> = {
  identity:
    "Identity and Profile",

  qualification:
    "Qualification",

  coach:
    "Coach Development",

  business:
    "Business Development",

  marketplace:
    "Marketplace Readiness",

  compliance:
    "Compliance",

  funding:
    "Funding Eligibility",
};

// =======================================================
// Business Launch Readiness Service
// =======================================================

export class BusinessLaunchReadinessService {
  private readonly timeline:
    EntrepreneurTimelineService;

  constructor(
    private readonly supabase:
      SupabaseClient
  ) {
    this.timeline =
      new EntrepreneurTimelineService(
        supabase
      );
  }

  // =====================================================
  // Main readiness evaluation
  // =====================================================

  async evaluateReadiness(
    entrepreneurId: string,
    options:
      EvaluateBusinessLaunchReadinessOptions = {}
  ): Promise<BusinessLaunchReadinessResult> {
    const normalizedEntrepreneurId =
      entrepreneurId.trim();

    if (!normalizedEntrepreneurId) {
      throw new BusinessLaunchReadinessError(
        "Entrepreneur ID is required.",
        "INVALID_ENTREPRENEUR_ID"
      );
    }

    const resolvedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    const evaluatedAt =
      new Date().toISOString();

    // ===================================================
    // Step 1 — Load entrepreneur readiness information
    // ===================================================

    const entrepreneur =
      await this.getEntrepreneurRecord(
        normalizedEntrepreneurId
      );

    // ===================================================
    // Step 2 — Load current coach assignment
    // ===================================================

    const coachAssignment =
      await this.getActiveCoachAssignment(
        normalizedEntrepreneurId
      );

    // ===================================================
    // Step 3 — Determine funded annual units
    // ===================================================

    const fundedAnnualUnits =
      this.normalizeFundedAnnualUnits(
        entrepreneur.funded_annual_units
      );

    // ===================================================
    // Step 4 — Determine the official funding path
    // ===================================================

    const fundingPath =
      this.determineFundingPath(
        fundedAnnualUnits
      );

    const context:
      ReadinessEvaluationContext = {
      entrepreneur,

      coachAssignment,

      fundedAnnualUnits,

      requiredAnnualUnits:
        REQUIRED_ANNUAL_UNITS,

      fundingPath,

      evaluatedAt,

      options:
        resolvedOptions,
    };

    // ===================================================
    // Step 5 — Evaluate readiness categories
    //
    // The category methods are implemented in Part 2.
    // ===================================================

    const categories:
      BusinessLaunchReadinessCategoryResult[] =
      [
        this.evaluateIdentityCategory(
          context
        ),

        this.evaluateQualificationCategory(
          context
        ),

        this.evaluateCoachCategory(
          context
        ),

        this.evaluateBusinessCategory(
          context
        ),

        this.evaluateMarketplaceCategory(
          context
        ),

        this.evaluateComplianceCategory(
          context
        ),

        this.evaluateFundingCategory(
          context
        ),
      ];

    // ===================================================
    // Step 6 — Calculate score and final readiness
    //
    // These helper methods are completed in Part 3.
    // ===================================================

    const readinessScore =
      this.calculateOverallScore(
        categories
      );

    const missingRequirements =
      this.collectRequirementLabels(
        categories,
        "missing"
      );

    const warnings =
      this.collectRequirementLabels(
        categories,
        "warning"
      );

    const completedRequirements =
      this.collectRequirementLabels(
        categories,
        "completed"
      );

    const blockingRequirements =
      this.collectBlockingRequirements(
        categories
      );

    const ready =
      readinessScore >=
        resolvedOptions
          .minimumReadinessScore &&
      blockingRequirements.length === 0;

    const result:
      BusinessLaunchReadinessResult = {
      success: true,

      entrepreneurId:
        normalizedEntrepreneurId,

      ready,

      readinessScore,

      minimumRequiredScore:
        resolvedOptions
          .minimumReadinessScore,

      fundingPath,

      fundedAnnualUnits,

      requiredAnnualUnits:
        REQUIRED_ANNUAL_UNITS,

      missingRequirements,

      warnings,

      completedRequirements,

      blockingRequirements,

      categories,

      evaluatedAt,

      message:
        this.buildReadinessMessage({
          ready,
          readinessScore,
          fundingPath,
          missingRequirements,
          blockingRequirements,
        }),
    };

    // ===================================================
    // Step 7 — Optional timeline recording
    //
    // Timeline integration is completed in Part 3.
    // ===================================================

    if (
      ready &&
      resolvedOptions.recordTimelineEvent
    ) {
      await this.recordReadinessTimelineEvent(
        result,
        resolvedOptions
      );
    }

    return result;
  }

  // =====================================================
  // Convenience method — Is launch ready?
  // =====================================================

  async isLaunchReady(
    entrepreneurId: string,
    options:
      EvaluateBusinessLaunchReadinessOptions = {}
  ): Promise<boolean> {
    const result =
      await this.evaluateReadiness(
        entrepreneurId,
        options
      );

    return result.ready;
  }

  // =====================================================
  // Convenience method — Funding path only
  // =====================================================

  async getFundingPath(
    entrepreneurId: string
  ): Promise<BusinessLaunchFundingPath> {
    const entrepreneur =
      await this.getEntrepreneurRecord(
        entrepreneurId.trim()
      );

    const fundedAnnualUnits =
      this.normalizeFundedAnnualUnits(
        entrepreneur.funded_annual_units
      );

    return this.determineFundingPath(
      fundedAnnualUnits
    );
  }

  // =====================================================
  // Entrepreneur lookup
  // =====================================================

  private async getEntrepreneurRecord(
    entrepreneurId: string
  ): Promise<EntrepreneurReadinessRecord> {
    const {
      data,
      error,
    } = await this.supabase
      .from("entrepreneurs")
      .select(
        `
          id,
          status,
          current_stage,
          previous_stage,
          next_stage,
          qualified_at,
          full_name,
          email,
          phone,
          email_verified,
          phone_verified,
          identity_verified,
          profile_completed,
          government_id_url,
          selfie_url,
          business_name,
          business_description,
          business_category,
          business_plan_completed,
          business_plan_url,
          startup_budget_completed,
          startup_cost,
          community_impact_completed,
          marketplace_status,
          marketplace_visibility,
          marketplace_published_at,
          business_logo_url,
          business_photo_url,
          presentation_completed,
          presentation_video_url,
          required_documents_completed,
          terms_accepted,
          compliance_status,
          annual_meeting_registered,
          annual_meeting_eligible,
          funded_annual_units,
          funding_status
        `
      )
      .eq(
        "id",
        entrepreneurId
      )
      .maybeSingle();

    if (error) {
      throw new BusinessLaunchReadinessError(
        error.message,
        "ENTREPRENEUR_LOOKUP_FAILED",
        error
      );
    }

    if (!data) {
      throw new BusinessLaunchReadinessError(
        "Entrepreneur not found.",
        "ENTREPRENEUR_NOT_FOUND"
      );
    }

    return data as
      EntrepreneurReadinessRecord;
  }

  // =====================================================
  // Active coach assignment lookup
  // =====================================================

  private async getActiveCoachAssignment(
    entrepreneurId: string
  ): Promise<
    CoachAssignmentReadinessRecord | null
  > {
    const {
      data,
      error,
    } = await this.supabase
      .from("coach_assignments")
      .select(
        `
          id,
          entrepreneur_id,
          coach_id,
          status,
          assigned_at,
          first_contact_completed_at,
          interview_completed_at,
          recommendation_status,
          recommendation_submitted_at
        `
      )
      .eq(
        "entrepreneur_id",
        entrepreneurId
      )
      .in(
        "status",
        [
          "active",
          "assigned",
          "in_progress",
          "completed",
        ]
      )
      .order(
        "assigned_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BusinessLaunchReadinessError(
        error.message,
        "COACH_ASSIGNMENT_LOOKUP_FAILED",
        error
      );
    }

    return data
      ? (
          data as
            CoachAssignmentReadinessRecord
        )
      : null;
  }

  // =====================================================
  // Funding path determination
  // =====================================================

  private determineFundingPath(
    fundedAnnualUnits: number
  ): BusinessLaunchFundingPath {
    if (
      fundedAnnualUnits >=
      REQUIRED_ANNUAL_UNITS
    ) {
      return "fully_funded_non_queue";
    }

    return "funding_queue";
  }

  // =====================================================
  // Normalize funded annual units
  // =====================================================

  private normalizeFundedAnnualUnits(
    value: number | null
  ): number {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      return 0;
    }

    return Math.floor(value);
  }

  // =====================================================
  // Part 2 methods
  //
  // These methods will contain the actual requirement
  // checks for each readiness category.
  // =====================================================

    // =====================================================
  // Identity Readiness Evaluation
  // =====================================================

  private evaluateIdentityCategory(
    context: ReadinessEvaluationContext
  ): BusinessLaunchReadinessCategoryResult {

    const entrepreneur =
      context.entrepreneur;

    const requirements: BusinessLaunchReadinessRequirement[] = [

      this.createRequirement({
        key: "identity_verified",
        label: "Identity Verified",
        description:
          "Government identity has been verified.",
        category: "identity",
        severity: "required",
        completed:
          this.isTrue(
            entrepreneur.identity_verified
          ),
        scoreValue: 20,
      }),

      this.createRequirement({
        key: "email_verified",
        label: "Email Verified",
        description:
          "Entrepreneur email address is verified.",
        category: "identity",
        severity: "required",
        completed:
          this.isTrue(
            entrepreneur.email_verified
          ),
        scoreValue: 15,
      }),

      this.createRequirement({
        key: "phone_verified",
        label: "Phone Verified",
        description:
          "Entrepreneur phone number is verified.",
        category: "identity",
        severity: "required",
        completed:
          this.isTrue(
            entrepreneur.phone_verified
          ),
        scoreValue: 15,
      }),

      this.createRequirement({
        key: "profile_completed",
        label: "Profile Completed",
        description:
          "Entrepreneur profile is complete.",
        category: "identity",
        severity: "required",
        completed:
          this.isTrue(
            entrepreneur.profile_completed
          ),
        scoreValue: 15,
      }),

      this.createRequirement({
        key: "government_id",
        label: "Government ID Uploaded",
        description:
          "Government identification document uploaded.",
        category: "identity",
        severity: "required",
        completed:
          this.hasFileReference(
            entrepreneur.government_id_url
          ),
        scoreValue: 20,
      }),

      this.createRequirement({
        key: "selfie_uploaded",
        label: "Identity Selfie Uploaded",
        description:
          "Identity verification selfie uploaded.",
        category: "identity",
        severity: "required",
        completed:
          this.hasFileReference(
            entrepreneur.selfie_url
          ),
        scoreValue: 15,
      }),

    ];

    return this.buildCategoryResult(
      "identity",
      requirements
    );
  }
  // =====================================================
  // Qualification Readiness Evaluation
  // =====================================================

  private evaluateQualificationCategory(
    context: ReadinessEvaluationContext
  ): BusinessLaunchReadinessCategoryResult {
    const entrepreneur =
      context.entrepreneur;

    const qualified =
      this.isEntrepreneurQualified(
        entrepreneur
      );

    const requirements:
      BusinessLaunchReadinessRequirement[] = [
        this.createRequirement({
          key: "entrepreneur_qualified",
          label: "Entrepreneur Qualified",
          description:
            "The entrepreneur has completed the official EPEW qualification process.",
          category: "qualification",
          severity: "required",
          completed: qualified,
          scoreValue: 50,
          metadata:
            this.buildMetadata({
              status:
                entrepreneur.status,
              currentStage:
                entrepreneur.current_stage,
              qualifiedAt:
                entrepreneur.qualified_at,
            }),
        }),

        this.createRequirement({
          key: "qualification_date_recorded",
          label: "Qualification Date Recorded",
          description:
            "The official qualification date has been recorded.",
          category: "qualification",
          severity: "required",
          completed:
            this.hasText(
              entrepreneur.qualified_at
            ),
          scoreValue: 25,
          metadata:
            this.buildMetadata({
              qualifiedAt:
                entrepreneur.qualified_at,
            }),
        }),

        this.createRequirement({
          key: "qualification_stage_confirmed",
          label: "Qualification Stage Confirmed",
          description:
            "The entrepreneur lifecycle stage reflects qualification or a later approved stage.",
          category: "qualification",
          severity: "required",
          completed:
            qualified &&
            this.hasText(
              entrepreneur.current_stage
            ),
          scoreValue: 25,
          metadata:
            this.buildMetadata({
              previousStage:
                entrepreneur.previous_stage,
              currentStage:
                entrepreneur.current_stage,
              nextStage:
                entrepreneur.next_stage,
            }),
        }),
      ];

    return this.buildCategoryResult(
      "qualification",
      requirements
    );
  }
    // =====================================================
  // Coach Readiness Evaluation
  // =====================================================

  private evaluateCoachCategory(
    context: ReadinessEvaluationContext
  ): BusinessLaunchReadinessCategoryResult {
    const assignment =
      context.coachAssignment;

    const requirements:
      BusinessLaunchReadinessRequirement[] = [

      this.createRequirement({
        key: "coach_assigned",
        label: "Coach Assigned",
        description:
          "An official EPEW coach has been assigned.",
        category: "coach",
        severity: "required",
        completed:
          this.hasActiveCoachAssignment(
            assignment
          ),
        scoreValue: 30,
        metadata:
          this.buildMetadata({
            coachId:
              assignment?.coach_id,
            assignedAt:
              assignment?.assigned_at,
            status:
              assignment?.status,
          }),
      }),

      this.createRequirement({
        key: "first_contact_completed",
        label: "First Contact Completed",
        description:
          "The assigned coach has completed the first entrepreneur contact.",
        category: "coach",
        severity: "required",
        completed:
          this.hasCompletedFirstContact(
            assignment
          ),
        scoreValue: 20,
        metadata:
          this.buildMetadata({
            completedAt:
              assignment?.first_contact_completed_at,
          }),
      }),

      this.createRequirement({
        key: "interview_completed",
        label: "Interview Completed",
        description:
          "The entrepreneur interview has been completed.",
        category: "coach",
        severity: "required",
        completed:
          this.hasCompletedInterview(
            assignment
          ),
        scoreValue: 25,
        metadata:
          this.buildMetadata({
            completedAt:
              assignment?.interview_completed_at,
          }),
      }),

      this.createRequirement({
        key: "coach_recommendation",
        label: "Coach Recommendation Approved",
        description:
          "The coach has officially approved the entrepreneur for business launch.",
        category: "coach",
        severity: "required",
        completed:
          this.hasApprovedCoachRecommendation(
            assignment
          ),
        scoreValue: 25,
        metadata:
          this.buildMetadata({
            recommendationStatus:
              assignment?.recommendation_status,
            recommendationSubmittedAt:
              assignment?.recommendation_submitted_at,
          }),
      }),

    ];

    return this.buildCategoryResult(
      "coach",
      requirements
    );
  }

    // =====================================================
  // Business Readiness Evaluation
  // =====================================================

  private evaluateBusinessCategory(
    context: ReadinessEvaluationContext
  ): BusinessLaunchReadinessCategoryResult {

    const entrepreneur =
      context.entrepreneur;

    const requirements:
      BusinessLaunchReadinessRequirement[] = [

      this.createRequirement({
        key: "business_name",
        label: "Business Name",
        description:
          "Business name has been provided.",
        category: "business",
        severity: "required",
        completed:
          this.hasText(
            entrepreneur.business_name
          ),
        scoreValue: 15,
      }),

      this.createRequirement({
        key: "business_description",
        label: "Business Description",
        description:
          "Business description has been completed.",
        category: "business",
        severity: "required",
        completed:
          this.hasText(
            entrepreneur.business_description
          ),
        scoreValue: 15,
      }),

      this.createRequirement({
        key: "business_category",
        label: "Business Category",
        description:
          "Business category has been selected.",
        category: "business",
        severity: "required",
        completed:
          this.hasText(
            entrepreneur.business_category
          ),
        scoreValue: 10,
      }),

      this.createRequirement({
        key: "business_plan",
        label: "Business Plan Completed",
        description:
          "Business plan has been completed.",
        category: "business",
        severity: "required",
        completed:
          this.isTrue(
            entrepreneur.business_plan_completed
          ) &&
          this.hasFileReference(
            entrepreneur.business_plan_url
          ),
        scoreValue: 20,
      }),

      this.createRequirement({
        key: "startup_budget",
        label: "Startup Budget Completed",
        description:
          "Startup budget has been prepared.",
        category: "business",
        severity: "required",
        completed:
          this.isTrue(
            entrepreneur.startup_budget_completed
          ) &&
          this.isPositiveNumber(
            entrepreneur.startup_cost
          ),
        scoreValue: 15,
      }),

      this.createRequirement({
        key: "community_impact",
        label: "Community Impact",
        description:
          "Community impact assessment completed.",
        category: "business",
        severity: "required",
        completed:
          this.isTrue(
            entrepreneur.community_impact_completed
          ),
        scoreValue: 10,
      }),

      this.createRequirement({
        key: "required_documents",
        label: "Required Documents",
        description:
          "All required documents have been submitted.",
        category: "business",
        severity: "required",
        completed:
          this.isTrue(
            entrepreneur.required_documents_completed
          ),
        scoreValue: 10,
      }),

      this.createRequirement({
        key: "terms_accepted",
        label: "Terms Accepted",
        description:
          "Entrepreneur has accepted all required agreements.",
        category: "business",
        severity: "required",
        completed:
          this.isTrue(
            entrepreneur.terms_accepted
          ),
        scoreValue: 5,
      }),

    ];

    return this.buildCategoryResult(
      "business",
      requirements
    );
  }

  // =====================================================
  // Marketplace Readiness Evaluation
  // =====================================================

  private evaluateMarketplaceCategory(
    context: ReadinessEvaluationContext
  ): BusinessLaunchReadinessCategoryResult {
    const entrepreneur =
      context.entrepreneur;

    const publicationRequired =
      context.options.requireMarketplacePublication;

    const requirements:
      BusinessLaunchReadinessRequirement[] = [
        this.createRequirement({
          key: "marketplace_publication",
          label: "Marketplace Published",
          description:
            "The entrepreneur business profile is officially published in the EPEW marketplace.",
          category: "marketplace",
          severity: publicationRequired
            ? "required"
            : "recommended",
          completed:
            this.isMarketplacePublished(
              entrepreneur
            ),
          scoreValue: 35,
          blocking: publicationRequired,
          warningWhenIncomplete:
            !publicationRequired,
          metadata:
            this.buildMetadata({
              marketplaceStatus:
                entrepreneur.marketplace_status,
              marketplaceVisibility:
                entrepreneur.marketplace_visibility,
              publishedAt:
                entrepreneur.marketplace_published_at,
            }),
        }),

        this.createRequirement({
          key: "business_logo",
          label: "Business Logo Uploaded",
          description:
            "A business logo has been uploaded for marketplace presentation.",
          category: "marketplace",
          severity: "recommended",
          completed:
            this.hasFileReference(
              entrepreneur.business_logo_url
            ),
          scoreValue: 15,
          warningWhenIncomplete: true,
        }),

        this.createRequirement({
          key: "business_photo",
          label: "Business Photo Uploaded",
          description:
            "A business image has been uploaded for marketplace presentation.",
          category: "marketplace",
          severity: "recommended",
          completed:
            this.hasFileReference(
              entrepreneur.business_photo_url
            ),
          scoreValue: 15,
          warningWhenIncomplete: true,
        }),

        this.createRequirement({
          key: "presentation_completed",
          label: "Business Presentation Completed",
          description:
            "The entrepreneur business presentation has been completed.",
          category: "marketplace",
          severity: "required",
          completed:
            this.isTrue(
              entrepreneur.presentation_completed
            ),
          scoreValue: 20,
        }),

        this.createRequirement({
          key: "presentation_video",
          label: "Presentation Video Uploaded",
          description:
            "A business presentation video has been uploaded.",
          category: "marketplace",
          severity: "recommended",
          completed:
            this.hasFileReference(
              entrepreneur.presentation_video_url
            ),
          scoreValue: 15,
          warningWhenIncomplete: true,
        }),
      ];

    return this.buildCategoryResult(
      "marketplace",
      requirements
    );
  }

    // =====================================================
  // Compliance Readiness Evaluation
  // =====================================================

  private evaluateComplianceCategory(
    context: ReadinessEvaluationContext
  ): BusinessLaunchReadinessCategoryResult {
    const entrepreneur =
      context.entrepreneur;

    const annualMeetingRequired =
      context.options
        .requireAnnualMeetingEligibility;

    const requirements:
      BusinessLaunchReadinessRequirement[] = [
        this.createRequirement({
          key: "compliance_status",
          label: "Compliance Status Approved",
          description:
            "The entrepreneur is in good standing with all current EPEW compliance requirements.",
          category: "compliance",
          severity: "required",
          completed:
            this.isComplianceAcceptable(
              entrepreneur.compliance_status
            ),
          scoreValue: 40,
          metadata:
            this.buildMetadata({
              complianceStatus:
                entrepreneur.compliance_status,
            }),
        }),

        this.createRequirement({
          key: "annual_meeting_registered",
          label: "Annual Meeting Registration",
          description:
            "The entrepreneur is registered for the required annual meeting.",
          category: "compliance",
          severity: annualMeetingRequired
            ? "required"
            : "recommended",
          completed:
            this.isTrue(
              entrepreneur
                .annual_meeting_registered
            ),
          scoreValue: 25,
          blocking: annualMeetingRequired,
          warningWhenIncomplete:
            !annualMeetingRequired,
        }),

        this.createRequirement({
          key: "annual_meeting_eligible",
          label: "Annual Meeting Eligibility",
          description:
            "The entrepreneur has been confirmed as eligible for the annual meeting and funding process.",
          category: "compliance",
          severity: annualMeetingRequired
            ? "required"
            : "recommended",
          completed:
            this.isTrue(
              entrepreneur
                .annual_meeting_eligible
            ),
          scoreValue: 35,
          blocking: annualMeetingRequired,
          warningWhenIncomplete:
            !annualMeetingRequired,
        }),
      ];

    return this.buildCategoryResult(
      "compliance",
      requirements
    );
  }

   // =====================================================
  // Funding Readiness Evaluation
  // =====================================================

  private evaluateFundingCategory(
    context: ReadinessEvaluationContext
  ): BusinessLaunchReadinessCategoryResult {
    const entrepreneur =
      context.entrepreneur;

    const fullyFunded =
      context.fundingPath ===
      "fully_funded_non_queue";

    const fundingStatusAccepted =
      this.statusMatches(
        entrepreneur.funding_status,
        [
          "eligible",
          "approved",
          "funding_queue",
          "fully_funded",
          "ready",
        ]
      );

    const requirements:
      BusinessLaunchReadinessRequirement[] = [
        this.createRequirement({
          key: "funding_path_determined",
          label: "Funding Path Determined",
          description:
            "The entrepreneur has been assigned an official funding path.",
          category: "funding",
          severity: "required",
          completed: true,
          scoreValue: 20,
          metadata:
            this.buildMetadata({
              fundingPath:
                context.fundingPath,
              fundedAnnualUnits:
                context.fundedAnnualUnits,
              requiredAnnualUnits:
                context.requiredAnnualUnits,
            }),
        }),

        this.createRequirement({
          key: "funding_status",
          label: "Funding Status Approved",
          description:
            "The entrepreneur funding status permits entry into the official launch process.",
          category: "funding",
          severity: "required",
          completed:
            fundingStatusAccepted ||
            fullyFunded,
          scoreValue: 30,
          metadata:
            this.buildMetadata({
              fundingStatus:
                entrepreneur.funding_status,
            }),
        }),

        this.createRequirement({
          key: "annual_units_progress",
          label: fullyFunded
            ? "Annual Funding Units Completed"
            : "Funding Queue Eligibility",
          description: fullyFunded
            ? "The entrepreneur has secured the required annual community support units."
            : "The entrepreneur is eligible to continue through the official funding queue.",
          category: "funding",
          severity: "required",
          completed:
            fullyFunded ||
            context.fundedAnnualUnits >= 0,
          scoreValue: 30,
          metadata:
            this.buildMetadata({
              fundedAnnualUnits:
                context.fundedAnnualUnits,
              requiredAnnualUnits:
                context.requiredAnnualUnits,
              remainingAnnualUnits:
                Math.max(
                  0,
                  context.requiredAnnualUnits -
                    context.fundedAnnualUnits
                ),
            }),
        }),

        this.createRequirement({
          key: "funding_path_ready",
          label: fullyFunded
            ? "Direct Launch Funding Path Ready"
            : "Funding Queue Path Ready",
          description: fullyFunded
            ? "The entrepreneur may proceed through the fully funded non-queue launch path."
            : "The entrepreneur may proceed through the official EPEW funding queue.",
          category: "funding",
          severity: "required",
          completed:
            fullyFunded
              ? context.fundedAnnualUnits >=
                context.requiredAnnualUnits
              : fundingStatusAccepted,
          scoreValue: 20,
          metadata:
            this.buildMetadata({
              fundingPath:
                context.fundingPath,
            }),
        }),
      ];

    return this.buildCategoryResult(
      "funding",
      requirements
    );
  }

  // =====================================================
  // Part 3 methods
  //
  // These methods will calculate scoring, collect results,
  // create the final message, and record the timeline.
  // =====================================================

    // =====================================================
  // Calculate Overall Readiness Score
  // =====================================================

  private calculateOverallScore(
    categories:
      BusinessLaunchReadinessCategoryResult[]
  ): number {
    const totalMaximumScore =
      categories.reduce(
        (total, category) =>
          total + category.maximumScore,
        0
      );

    if (totalMaximumScore <= 0) {
      return 0;
    }

    const totalEarnedScore =
      categories.reduce(
        (total, category) =>
          total + category.score,
        0
      );

    return this.roundPercentage(
      (totalEarnedScore /
        totalMaximumScore) *
        100
    );
  }

    // =====================================================
  // Collect Requirement Labels by Status
  // =====================================================

  private collectRequirementLabels(
    categories:
      BusinessLaunchReadinessCategoryResult[],
    status:
      ReadinessRequirementStatus
  ): string[] {
    return categories.flatMap(
      (category) =>
        category.requirements
          .filter(
            (requirement) =>
              requirement.status === status
          )
          .map(
            (requirement) =>
              requirement.label
          )
    );
  }

    // =====================================================
  // Collect Blocking Requirements
  // =====================================================

  private collectBlockingRequirements(
    categories:
      BusinessLaunchReadinessCategoryResult[]
  ): string[] {
    return categories.flatMap(
      (category) =>
        category.requirements
          .filter(
            (requirement) =>
              requirement.blocking &&
              !requirement.completed
          )
          .map(
            (requirement) =>
              requirement.label
          )
    );
  }

   // =====================================================
  // Build Readiness Message
  // =====================================================

  private buildReadinessMessage(
    input: {
      ready: boolean;
      readinessScore: number;
      fundingPath:
        BusinessLaunchFundingPath;
      missingRequirements: string[];
      blockingRequirements: string[];
    }
  ): string {
    if (input.ready) {
      return input.fundingPath ===
        "fully_funded_non_queue"
        ? `Business launch readiness approved at ${input.readinessScore}%. The entrepreneur qualifies for the fully funded non-queue launch path.`
        : `Business launch readiness approved at ${input.readinessScore}%. The entrepreneur may proceed through the official funding queue.`;
    }

    if (
      input.blockingRequirements.length > 0
    ) {
      return `Business launch readiness is currently ${input.readinessScore}%. Launch is blocked by: ${input.blockingRequirements.join(
        ", "
      )}.`;
    }

    if (
      input.missingRequirements.length > 0
    ) {
      return `Business launch readiness is currently ${input.readinessScore}%. Remaining requirements: ${input.missingRequirements.join(
        ", "
      )}.`;
    }

    return `Business launch readiness is currently ${input.readinessScore}%. Additional development is required before launch approval.`;
  }

    // =====================================================
  // Record Readiness Timeline Event
  // =====================================================

  private async recordReadinessTimelineEvent(
    result: BusinessLaunchReadinessResult,
    options: Required<
      EvaluateBusinessLaunchReadinessOptions
    >
  ): Promise<void> {
    try {
      await this.timeline.recordEvent({
        entrepreneurId:
          result.entrepreneurId,

        eventType:
          "business_launch_ready",

        eventTitle:
          "Business Launch Ready",

        eventDescription:
          result.message,

        lifecycleStage:
          "business_launch_ready",

        performedBy:
          options.performedBy,

        source:
          options.source,

        metadata: {
          readinessScore:
            result.readinessScore,

          minimumRequiredScore:
            result.minimumRequiredScore,

          fundingPath:
            result.fundingPath,

          fundedAnnualUnits:
            result.fundedAnnualUnits,

          requiredAnnualUnits:
            result.requiredAnnualUnits,

          ready:
            result.ready,

          missingRequirements:
            result.missingRequirements,

          warnings:
            result.warnings,

          blockingRequirements:
            result.blockingRequirements,

          evaluatedAt:
            result.evaluatedAt,
        },
      });
    } catch (error) {
      throw new BusinessLaunchReadinessError(
        error instanceof Error
          ? error.message
          : "Unable to record the business launch readiness timeline event.",
        "TIMELINE_RECORDING_FAILED",
        error
      );
    }
  }

  // =====================================================
  // Shared category label helper
  // =====================================================

  private getCategoryLabel(
    category:
      BusinessLaunchReadinessCategory
  ): string {
    return CATEGORY_LABELS[
      category
    ];
  }

  // =====================================================
  // Shared requirement builder
  // =====================================================

  private createRequirement(input: {
    key: string;
    label: string;
    description: string;
    category: BusinessLaunchReadinessCategory;
    severity: ReadinessRequirementSeverity;
    completed: boolean;
    scoreValue: number;
    blocking?: boolean;
    warningWhenIncomplete?: boolean;
    notApplicable?: boolean;
    metadata?: Record<string, unknown>;
  }): BusinessLaunchReadinessRequirement {
    const blocking =
      input.blocking ??
      input.severity === "required";

    if (input.notApplicable) {
      return {
        key: input.key,
        label: input.label,
        description: input.description,
        category: input.category,
        severity: input.severity,
        status: "not_applicable",
        completed: true,
        scoreValue: 0,
        earnedScore: 0,
        blocking: false,
        metadata: input.metadata,
      };
    }

    if (input.completed) {
      return {
        key: input.key,
        label: input.label,
        description: input.description,
        category: input.category,
        severity: input.severity,
        status: "completed",
        completed: true,
        scoreValue: input.scoreValue,
        earnedScore: input.scoreValue,
        blocking: false,
        metadata: input.metadata,
      };
    }

    const status: ReadinessRequirementStatus =
      input.warningWhenIncomplete ||
      input.severity !== "required"
        ? "warning"
        : "missing";

    return {
      key: input.key,
      label: input.label,
      description: input.description,
      category: input.category,
      severity: input.severity,
      status,
      completed: false,
      scoreValue: input.scoreValue,
      earnedScore: 0,
      blocking:
        blocking &&
        status === "missing",
      metadata: input.metadata,
    };
  }

  // =====================================================
  // Build category result
  // =====================================================

  private buildCategoryResult(
    category: BusinessLaunchReadinessCategory,
    requirements: BusinessLaunchReadinessRequirement[]
  ): BusinessLaunchReadinessCategoryResult {

    const applicableRequirements =
      requirements.filter(
        (requirement) =>
          requirement.status !== "not_applicable"
      );

    const maximumScore =
      applicableRequirements.reduce(
        (total, requirement) =>
          total + requirement.scoreValue,
        0
      );

    const score =
      applicableRequirements.reduce(
        (total, requirement) =>
          total + requirement.earnedScore,
        0
      );

   const percentage =
  maximumScore > 0
    ? this.roundPercentage(
        (score / maximumScore) * 100
      )
    : 100;

    const blockingIssues =
      applicableRequirements.filter(
        (requirement) =>
          requirement.blocking &&
          !requirement.completed
      ).length;

    const completedRequirements =
      applicableRequirements.filter(
        (requirement) =>
          requirement.completed
      ).length;

    const completed =
      blockingIssues === 0 &&
      applicableRequirements.every(
        (requirement) =>
          requirement.status === "completed" ||
          requirement.status === "warning"
      );

    return {
      category,
      label: CATEGORY_LABELS[category],
      completed,
      score,
      maximumScore,
      percentage,
      blockingIssues,
      completedRequirements,
      totalRequirements:
        applicableRequirements.length,
      requirements,
    };
  }
  // =====================================================
  // Boolean normalization helper
  // =====================================================

  private isTrue(
    value: boolean | null | undefined
  ): boolean {
    return value === true;
  }

  // =====================================================
  // Non-empty text helper
  // =====================================================

  private hasText(
    value: string | null | undefined
  ): value is string {
    return (
      typeof value === "string" &&
      value.trim().length > 0
    );
  }

  // =====================================================
  // Valid URL or stored file reference helper
  // =====================================================

  private hasFileReference(
    value: string | null | undefined
  ): boolean {
    if (!this.hasText(value)) {
      return false;
    }

    const normalizedValue =
      value.trim();

    return (
      normalizedValue.startsWith("http://") ||
      normalizedValue.startsWith("https://") ||
      normalizedValue.startsWith("/") ||
      normalizedValue.includes("/")
    );
  }
    // =====================================================
  // Positive number helper
  // =====================================================

  private isPositiveNumber(
    value: number | null | undefined
  ): boolean {
    return (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value > 0
    );
  }

  // =====================================================
  // Status comparison helper
  // =====================================================

  private statusMatches(
    value: string | null | undefined,
    acceptedStatuses: string[]
  ): boolean {
    if (!this.hasText(value)) {
      return false;
    }

    const normalizedValue =
      value!.trim().toLowerCase();

    return acceptedStatuses.some(
      (status) =>
        status.trim().toLowerCase() ===
        normalizedValue
    );
  }

  // =====================================================
  // Round percentage
  // =====================================================

  private roundPercentage(
    value: number
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.round(
      Math.min(
        100,
        Math.max(0, value)
      )
    );
  }

  // =====================================================
  // Build metadata safely
  // =====================================================

  private buildMetadata(
    values: Record<string, unknown>
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(values).filter(
        ([, value]) =>
          value !== undefined
      )
    );
  }
    // =====================================================
  // Determine whether entrepreneur is qualified
  // =====================================================

  private isEntrepreneurQualified(
    entrepreneur: EntrepreneurReadinessRecord
  ): boolean {
    return (
      entrepreneur.status === "qualified" ||
      entrepreneur.current_stage === "qualified" ||
      this.hasText(entrepreneur.qualified_at)
    );
  }

  // =====================================================
  // Determine whether coach assignment is active
  // =====================================================

  private hasActiveCoachAssignment(
    assignment: CoachAssignmentReadinessRecord | null
  ): boolean {
    if (!assignment) {
      return false;
    }

    return (
      this.hasText(assignment.coach_id) &&
      this.statusMatches(
        assignment.status,
        [
          "active",
          "assigned",
          "in_progress",
          "completed",
        ]
      )
    );
  }

  // =====================================================
  // Determine whether first coach contact occurred
  // =====================================================

  private hasCompletedFirstContact(
    assignment: CoachAssignmentReadinessRecord | null
  ): boolean {
    return (
      assignment !== null &&
      this.hasText(
        assignment.first_contact_completed_at
      )
    );
  }

  // =====================================================
  // Determine whether interview was completed
  // =====================================================

  private hasCompletedInterview(
    assignment: CoachAssignmentReadinessRecord | null
  ): boolean {
    return (
      assignment !== null &&
      this.hasText(
        assignment.interview_completed_at
      )
    );
  }

  // =====================================================
  // Determine whether coach recommendation is approved
  // =====================================================

  private hasApprovedCoachRecommendation(
    assignment: CoachAssignmentReadinessRecord | null
  ): boolean {
    if (!assignment) {
      return false;
    }

    return this.statusMatches(
      assignment.recommendation_status,
      [
        "approved",
        "recommended",
        "launch_ready",
        "ready",
      ]
    );
  }

  // =====================================================
  // Determine whether marketplace is published
  // =====================================================

  private isMarketplacePublished(
    entrepreneur: EntrepreneurReadinessRecord
  ): boolean {
    return (
      this.statusMatches(
        entrepreneur.marketplace_status,
        [
          "active",
          "published",
          "approved",
        ]
      ) &&
      entrepreneur.marketplace_visibility === true
    );
  }

  // =====================================================
  // Determine whether compliance is acceptable
  // =====================================================

  private isComplianceAcceptable(
    complianceStatus: string | null
  ): boolean {
    return this.statusMatches(
      complianceStatus,
      [
        "compliant",
        "approved",
        "clear",
        "good_standing",
        "in_good_standing",
      ]
    );
  }
}
