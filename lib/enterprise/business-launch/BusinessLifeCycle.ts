/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Enterprise Business Launch Core
 * ------------------------------------------------------------
 * File:
 * BusinessLifeCycle.ts
 *
 * Purpose:
 * Official EPEW Business Life Cycle Constitution.
 *
 * Responsibility:
 * Defines the ordered business journey, stage ownership,
 * responsible Enterprise Engines, requirements, deliverables,
 * transition rules, and lifecycle progress.
 *
 * Owner:
 * EPEW Enterprise Architecture
 *
 * Rules:
 * - Applications and enrollment remain open continuously.
 * - Every entrepreneur has one official current lifecycle stage.
 * - Pages may display lifecycle information but may not define
 *   or modify lifecycle policy.
 * - Enterprise Engines control stage transitions.
 * - Working capital cannot be released before verified opening.
 * ============================================================
 */

import {
  BUSINESS_LAUNCH_ENGINE_VERSION,
  BUSINESS_LIFE_CYCLE_LABELS,
  BusinessLaunchPlan,
  BusinessLifeCycleStage,
  BusinessLifeCycleStageDefinition,
  ComplianceStatus,
  EnterpriseEngineName,
  EnterpriseRole,
  EnterpriseStatus,
  LifeCycleDeliverable,
  LifeCycleRequirement,
  StageResult,
  EnterpriseResult,
  createEnterpriseFailure,
  createEnterpriseSuccess,
  clampEnterprisePercentage,
} from "./types";

export const BUSINESS_LIFE_CYCLE_VERSION =
  BUSINESS_LAUNCH_ENGINE_VERSION;

/**
 * ============================================================
 * REQUIREMENT AND DELIVERABLE HELPERS
 * ============================================================
 */

function requirement(
  code: string,
  label: string,
  description?: string,
  required = true
): LifeCycleRequirement {
  return {
    code,
    label,
    description,
    required,
  };
}

function deliverable(
  code: string,
  label: string,
  description?: string,
  required = true
): LifeCycleDeliverable {
  return {
    code,
    label,
    description,
    required,
  };
}

/**
 * ============================================================
 * OFFICIAL STAGE ORDER
 * ============================================================
 */

export const BUSINESS_LIFE_CYCLE_ORDER: BusinessLifeCycleStage[] =
  [
    BusinessLifeCycleStage.ENTREPRENEUR_ENROLLMENT,
    BusinessLifeCycleStage.QUALIFICATION,
    BusinessLifeCycleStage.COACH_ASSIGNMENT,
    BusinessLifeCycleStage.BUSINESS_PREPARATION,
    BusinessLifeCycleStage.BUSINESS_PRESENTATION,
    BusinessLifeCycleStage.ANNUAL_MEETING_QUALIFICATION,
    BusinessLifeCycleStage.ANNUAL_MEETING,
    BusinessLifeCycleStage.BUSINESS_LAUNCH_CANDIDATE,
    BusinessLifeCycleStage.FUNDING_COMMITTEE_APPROVAL,
    BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN,
    BusinessLifeCycleStage.PARTNER_SERVICES,
    BusinessLifeCycleStage.VENDOR_PAYMENTS,
    BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION,
    BusinessLifeCycleStage.GRAND_OPENING,
    BusinessLifeCycleStage.BUSINESS_OPENING_VERIFICATION,
    BusinessLifeCycleStage.WORKING_CAPITAL_RELEASE,
    BusinessLifeCycleStage.BUSINESS_REGISTRY,
    BusinessLifeCycleStage.QUARTERLY_REPORTING,
    BusinessLifeCycleStage.BUSINESS_GROWTH,
    BusinessLifeCycleStage.BUSINESS_EXPANSION,
    BusinessLifeCycleStage.SUCCESS_STORY,
  ];

/**
 * ============================================================
 * OFFICIAL BUSINESS LIFE CYCLE DEFINITIONS
 * ============================================================
 */

export const BUSINESS_LIFE_CYCLE: Record<
  BusinessLifeCycleStage,
  BusinessLifeCycleStageDefinition
> = {
  [BusinessLifeCycleStage.ENTREPRENEUR_ENROLLMENT]: {
    stage:
      BusinessLifeCycleStage.ENTREPRENEUR_ENROLLMENT,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.ENTREPRENEUR_ENROLLMENT
      ],

    order: 1,

    owners: [EnterpriseRole.ENTREPRENEUR],

    engines: [
      EnterpriseEngineName.PARTICIPATION_ENGINE,
      EnterpriseEngineName.ENTERPRISE_CORE,
    ],

    entryRequirements: [],

    exitRequirements: [
      requirement(
        "enrollment_form_complete",
        "Enrollment Form Complete",
        "The entrepreneur has submitted the official EPEW enrollment form."
      ),

      requirement(
        "identity_information_provided",
        "Identity Information Provided",
        "Required identity and contact information has been provided."
      ),

      requirement(
        "business_idea_provided",
        "Business Idea Provided",
        "The entrepreneur has described the proposed business or business concept."
      ),

      requirement(
        "participation_terms_acknowledged",
        "Participation Terms Acknowledged",
        "The entrepreneur has acknowledged the applicable EPEW participation terms."
      ),
    ],

    deliverables: [
      deliverable(
        "entrepreneur_record",
        "Entrepreneur Enterprise Record",
        "The official entrepreneur record has been created."
      ),

      deliverable(
        "entrepreneur_public_id",
        "Entrepreneur Public ID",
        "A permanent EPEW entrepreneur identifier has been assigned."
      ),

      deliverable(
        "application_submitted_event",
        "Application Submitted Event",
        "The enrollment event has been recorded in the Enterprise Ledger."
      ),
    ],

    previousStage: null,

    nextStage: BusinessLifeCycleStage.QUALIFICATION,

    description:
      "The entrepreneur enters the EPEW Entrepreneur Development Ecosystem. Enrollment remains open throughout the year.",
  },

  [BusinessLifeCycleStage.QUALIFICATION]: {
    stage: BusinessLifeCycleStage.QUALIFICATION,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.QUALIFICATION
      ],

    order: 2,

    owners: [EnterpriseRole.COACH],

    engines: [
      EnterpriseEngineName.PARTICIPATION_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "entrepreneur_enrolled",
        "Entrepreneur Enrolled",
        "The entrepreneur has completed enrollment."
      ),
    ],

    exitRequirements: [
      requirement(
        "initial_review_complete",
        "Initial Review Complete"
      ),

      requirement(
        "qualification_interview_complete",
        "Qualification Interview Complete"
      ),

      requirement(
        "qualification_requirements_met",
        "Qualification Requirements Met"
      ),

      requirement(
        "qualification_decision_recorded",
        "Qualification Decision Recorded"
      ),
    ],

    deliverables: [
      deliverable(
        "qualification_result",
        "Qualification Result"
      ),

      deliverable(
        "qualification_notes",
        "Qualification Notes"
      ),

      deliverable(
        "qualification_status",
        "Qualification Status"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.ENTREPRENEUR_ENROLLMENT,

    nextStage: BusinessLifeCycleStage.COACH_ASSIGNMENT,

    description:
      "The entrepreneur is evaluated according to official EPEW qualification requirements.",
  },

  [BusinessLifeCycleStage.COACH_ASSIGNMENT]: {
    stage: BusinessLifeCycleStage.COACH_ASSIGNMENT,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.COACH_ASSIGNMENT
      ],

    order: 3,

    owners: [EnterpriseRole.ADMINISTRATOR],

    engines: [
      EnterpriseEngineName.PARTICIPATION_ENGINE,
      EnterpriseEngineName.COMMUNICATION_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "entrepreneur_qualified",
        "Entrepreneur Qualified"
      ),
    ],

    exitRequirements: [
      requirement(
        "coach_selected",
        "Coach Selected"
      ),

      requirement(
        "coach_assignment_confirmed",
        "Coach Assignment Confirmed"
      ),

      requirement(
        "coach_introductory_contact_scheduled",
        "Introductory Contact Scheduled"
      ),
    ],

    deliverables: [
      deliverable(
        "coach_assignment_record",
        "Coach Assignment Record"
      ),

      deliverable(
        "coach_notification",
        "Coach Notification"
      ),

      deliverable(
        "entrepreneur_notification",
        "Entrepreneur Notification"
      ),
    ],

    previousStage: BusinessLifeCycleStage.QUALIFICATION,

    nextStage:
      BusinessLifeCycleStage.BUSINESS_PREPARATION,

    description:
      "Administration assigns the qualified entrepreneur to an approved EPEW coach.",
  },

  [BusinessLifeCycleStage.BUSINESS_PREPARATION]: {
    stage:
      BusinessLifeCycleStage.BUSINESS_PREPARATION,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.BUSINESS_PREPARATION
      ],

    order: 4,

    owners: [
      EnterpriseRole.ENTREPRENEUR,
      EnterpriseRole.COACH,
    ],

    engines: [
      EnterpriseEngineName.PARTICIPATION_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "coach_assigned",
        "Coach Assigned"
      ),
    ],

    exitRequirements: [
      requirement(
        "entrepreneur_questionnaire_complete",
        "Entrepreneur Questionnaire Complete"
      ),

      requirement(
        "business_profile_complete",
        "Business Profile Complete"
      ),

      requirement(
        "business_structure_reviewed",
        "Business Structure Reviewed"
      ),

      requirement(
        "readiness_evaluation_complete",
        "Readiness Evaluation Complete"
      ),
    ],

    deliverables: [
      deliverable(
        "business_profile",
        "Business Profile"
      ),

      deliverable(
        "preparation_plan",
        "Business Preparation Plan"
      ),

      deliverable(
        "coach_preparation_notes",
        "Coach Preparation Notes"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.COACH_ASSIGNMENT,

    nextStage:
      BusinessLifeCycleStage.BUSINESS_PRESENTATION,

    description:
      "The entrepreneur and coach prepare the business structure, profile, documentation, and presentation materials.",
  },

  [BusinessLifeCycleStage.BUSINESS_PRESENTATION]: {
    stage:
      BusinessLifeCycleStage.BUSINESS_PRESENTATION,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.BUSINESS_PRESENTATION
      ],

    order: 5,

    owners: [
      EnterpriseRole.ENTREPRENEUR,
      EnterpriseRole.COACH,
    ],

    engines: [
      EnterpriseEngineName.PARTICIPATION_ENGINE,
      EnterpriseEngineName.COMMUNICATION_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "business_preparation_complete",
        "Business Preparation Complete"
      ),
    ],

    exitRequirements: [
      requirement(
        "business_pitch_complete",
        "Business Pitch Complete"
      ),

      requirement(
        "business_video_complete",
        "Business Video Complete"
      ),

      requirement(
        "presentation_reviewed_by_coach",
        "Presentation Reviewed by Coach"
      ),

      requirement(
        "presentation_approved",
        "Presentation Approved"
      ),
    ],

    deliverables: [
      deliverable(
        "approved_business_presentation",
        "Approved Business Presentation"
      ),

      deliverable(
        "approved_business_video",
        "Approved Business Video"
      ),

      deliverable(
        "presentation_evaluation",
        "Presentation Evaluation"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.BUSINESS_PREPARATION,

    nextStage:
      BusinessLifeCycleStage.ANNUAL_MEETING_QUALIFICATION,

    description:
      "The entrepreneur presents the business concept, plan, funding need, and launch vision for formal review.",
  },

  [BusinessLifeCycleStage.ANNUAL_MEETING_QUALIFICATION]:
    {
      stage:
        BusinessLifeCycleStage.ANNUAL_MEETING_QUALIFICATION,

      label:
        BUSINESS_LIFE_CYCLE_LABELS[
          BusinessLifeCycleStage.ANNUAL_MEETING_QUALIFICATION
        ],

      order: 6,

      owners: [
        EnterpriseRole.COACH,
        EnterpriseRole.QUALIFICATION_COMMITTEE,
      ],

      engines: [
        EnterpriseEngineName.PARTICIPATION_ENGINE,
        EnterpriseEngineName.COMPLIANCE_ENGINE,
      ],

      entryRequirements: [
        requirement(
          "business_presentation_approved",
          "Business Presentation Approved"
        ),
      ],

      exitRequirements: [
        requirement(
          "qualification_committee_review_complete",
          "Qualification Committee Review Complete"
        ),

        requirement(
          "annual_meeting_requirements_met",
          "Annual Meeting Requirements Met"
        ),

        requirement(
          "annual_meeting_qualification_approved",
          "Annual Meeting Qualification Approved"
        ),
      ],

      deliverables: [
        deliverable(
          "annual_meeting_qualification_record",
          "Annual Meeting Qualification Record"
        ),

        deliverable(
          "annual_meeting_invitation_eligibility",
          "Annual Meeting Invitation Eligibility"
        ),
      ],

      previousStage:
        BusinessLifeCycleStage.BUSINESS_PRESENTATION,

      nextStage:
        BusinessLifeCycleStage.ANNUAL_MEETING,

      description:
        "The coach and Qualification Committee determine whether the entrepreneur is eligible to participate in the Annual Meeting.",
    },

  [BusinessLifeCycleStage.ANNUAL_MEETING]: {
    stage: BusinessLifeCycleStage.ANNUAL_MEETING,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.ANNUAL_MEETING
      ],

    order: 7,

    owners: [EnterpriseRole.EPEW_ADMINISTRATION],

    engines: [
      EnterpriseEngineName.PARTICIPATION_ENGINE,
      EnterpriseEngineName.COMMUNICATION_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "annual_meeting_qualified",
        "Annual Meeting Qualified"
      ),

      requirement(
        "annual_meeting_scheduled",
        "Annual Meeting Scheduled"
      ),
    ],

    exitRequirements: [
      requirement(
        "annual_meeting_attended",
        "Annual Meeting Attended"
      ),

      requirement(
        "annual_meeting_requirements_completed",
        "Annual Meeting Requirements Completed"
      ),

      requirement(
        "annual_meeting_completion_verified",
        "Annual Meeting Completion Verified"
      ),
    ],

    deliverables: [
      deliverable(
        "annual_meeting_attendance_record",
        "Annual Meeting Attendance Record"
      ),

      deliverable(
        "annual_meeting_completion_record",
        "Annual Meeting Completion Record"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.ANNUAL_MEETING_QUALIFICATION,

    nextStage:
      BusinessLifeCycleStage.BUSINESS_LAUNCH_CANDIDATE,

    description:
      "EPEW Administration conducts the Annual Meeting and verifies the entrepreneur's official participation.",
  },

  [BusinessLifeCycleStage.BUSINESS_LAUNCH_CANDIDATE]:
    {
      stage:
        BusinessLifeCycleStage.BUSINESS_LAUNCH_CANDIDATE,

      label:
        BUSINESS_LIFE_CYCLE_LABELS[
          BusinessLifeCycleStage.BUSINESS_LAUNCH_CANDIDATE
        ],

      order: 8,

      owners: [EnterpriseRole.EOS],

      engines: [
        EnterpriseEngineName.BUSINESS_LAUNCH_ENGINE,
        EnterpriseEngineName.COMPLIANCE_ENGINE,
      ],

      entryRequirements: [
        requirement(
          "annual_meeting_completed",
          "Annual Meeting Completed"
        ),
      ],

      exitRequirements: [
        requirement(
          "business_launch_candidate_record_created",
          "Business Launch Candidate Record Created"
        ),

        requirement(
          "launch_candidate_compliance_review_complete",
          "Launch Candidate Compliance Review Complete"
        ),
      ],

      deliverables: [
        deliverable(
          "business_launch_candidate_status",
          "Business Launch Candidate Status"
        ),

        deliverable(
          "business_launch_candidate_id",
          "Business Launch Candidate ID"
        ),
      ],

      previousStage:
        BusinessLifeCycleStage.ANNUAL_MEETING,

      nextStage:
        BusinessLifeCycleStage.FUNDING_COMMITTEE_APPROVAL,

      description:
        "After the Annual Meeting, EOS formally recognizes the entrepreneur as a Business Launch Candidate.",
    },

  [BusinessLifeCycleStage.FUNDING_COMMITTEE_APPROVAL]:
    {
      stage:
        BusinessLifeCycleStage.FUNDING_COMMITTEE_APPROVAL,

      label:
        BUSINESS_LIFE_CYCLE_LABELS[
          BusinessLifeCycleStage.FUNDING_COMMITTEE_APPROVAL
        ],

      order: 9,

      owners: [EnterpriseRole.FUNDING_COMMITTEE],

      engines: [
        EnterpriseEngineName.FINANCIAL_ENGINE,
        EnterpriseEngineName.BUSINESS_LAUNCH_ENGINE,
        EnterpriseEngineName.COMPLIANCE_ENGINE,
      ],

      entryRequirements: [
        requirement(
          "business_launch_candidate_confirmed",
          "Business Launch Candidate Confirmed"
        ),

        requirement(
          "funding_readiness_review_complete",
          "Funding Readiness Review Complete"
        ),
      ],

      exitRequirements: [
        requirement(
          "funding_committee_review_complete",
          "Funding Committee Review Complete"
        ),

        requirement(
          "funding_amount_approved",
          "Funding Amount Approved"
        ),

        requirement(
          "funding_conditions_recorded",
          "Funding Conditions Recorded"
        ),
      ],

      deliverables: [
        deliverable(
          "funding_committee_decision",
          "Funding Committee Decision"
        ),

        deliverable(
          "approved_funding_amount",
          "Approved Funding Amount"
        ),

        deliverable(
          "funding_approval_event",
          "Funding Approval Audit Event"
        ),
      ],

      previousStage:
        BusinessLifeCycleStage.BUSINESS_LAUNCH_CANDIDATE,

      nextStage:
        BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN,

      description:
        "The Funding Committee reviews the Business Launch Candidate and authorizes the approved funding framework.",
    },

  [BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN]: {
    stage:
      BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN
      ],

    order: 10,

    owners: [EnterpriseRole.BUSINESS_LAUNCH_ENGINE],

    engines: [
      EnterpriseEngineName.BUSINESS_LAUNCH_ENGINE,
      EnterpriseEngineName.FINANCIAL_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "funding_committee_approved",
        "Funding Committee Approved"
      ),
    ],

    exitRequirements: [
      requirement(
        "launch_plan_created",
        "Business Launch Plan Created"
      ),

      requirement(
        "allocation_plan_created",
        "Funding Allocation Plan Created"
      ),

      requirement(
        "target_opening_date_defined",
        "Target Opening Date Defined"
      ),

      requirement(
        "launch_team_identified",
        "Business Launch Team Identified"
      ),
    ],

    deliverables: [
      deliverable(
        "business_launch_plan_record",
        "Business Launch Plan Record"
      ),

      deliverable(
        "allocation_schedule",
        "Allocation Schedule"
      ),

      deliverable(
        "launch_timeline",
        "Business Launch Timeline"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.FUNDING_COMMITTEE_APPROVAL,

    nextStage:
      BusinessLifeCycleStage.PARTNER_SERVICES,

    description:
      "The Business Launch Engine creates the official launch plan, allocation framework, target opening date, and launch timeline.",
  },

  [BusinessLifeCycleStage.PARTNER_SERVICES]: {
    stage: BusinessLifeCycleStage.PARTNER_SERVICES,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.PARTNER_SERVICES
      ],

    order: 11,

    owners: [EnterpriseRole.ASSIGNED_PARTNER],

    engines: [
      EnterpriseEngineName.BUSINESS_LAUNCH_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "business_launch_plan_approved",
        "Business Launch Plan Approved"
      ),

      requirement(
        "partner_services_defined",
        "Partner Services Defined"
      ),
    ],

    exitRequirements: [
      requirement(
        "promotion_service_complete",
        "Promotion Service Complete"
      ),

      requirement(
        "business_setup_service_complete",
        "Business Setup Service Complete"
      ),

      requirement(
        "business_management_service_ready",
        "Business Management Service Ready"
      ),

      requirement(
        "partner_deliverables_verified",
        "Partner Deliverables Verified"
      ),
    ],

    deliverables: [
      deliverable(
        "promotion_deliverables",
        "Promotion Deliverables"
      ),

      deliverable(
        "business_setup_deliverables",
        "Business Setup Deliverables"
      ),

      deliverable(
        "business_management_plan",
        "Business Management Plan"
      ),

      deliverable(
        "partner_completion_verification",
        "Partner Completion Verification"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN,

    nextStage:
      BusinessLifeCycleStage.VENDOR_PAYMENTS,

    description:
      "Assigned partners deliver promotion, business setup, and business management services.",
  },

  [BusinessLifeCycleStage.VENDOR_PAYMENTS]: {
    stage: BusinessLifeCycleStage.VENDOR_PAYMENTS,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.VENDOR_PAYMENTS
      ],

    order: 12,

    owners: [EnterpriseRole.FINANCE_DEPARTMENT],

    engines: [
      EnterpriseEngineName.FINANCIAL_ENGINE,
      EnterpriseEngineName.BUSINESS_LAUNCH_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "vendor_allocations_approved",
        "Vendor Allocations Approved"
      ),

      requirement(
        "vendor_documents_verified",
        "Vendor Documents Verified"
      ),
    ],

    exitRequirements: [
      requirement(
        "rent_payment_complete",
        "Rent Payment Complete"
      ),

      requirement(
        "equipment_payment_complete",
        "Equipment Payment Complete"
      ),

      requirement(
        "inventory_payment_complete",
        "Inventory Payment Complete"
      ),

      requirement(
        "approved_contingency_payments_complete",
        "Approved Contingency Payments Complete"
      ),

      requirement(
        "vendor_payments_verified",
        "Vendor Payments Verified"
      ),
    ],

    deliverables: [
      deliverable(
        "vendor_payment_records",
        "Vendor Payment Records"
      ),

      deliverable(
        "rent_verification",
        "Rent Verification"
      ),

      deliverable(
        "equipment_verification",
        "Equipment Verification"
      ),

      deliverable(
        "inventory_verification",
        "Inventory Verification"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.PARTNER_SERVICES,

    nextStage:
      BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION,

    description:
      "The Finance Department pays approved landlords, vendors, and suppliers according to the Business Launch Plan.",
  },

  [BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION]:
    {
      stage:
        BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION,

      label:
        BUSINESS_LIFE_CYCLE_LABELS[
          BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION
        ],

      order: 13,

      owners: [
        EnterpriseRole.COACH,
        EnterpriseRole.ADMINISTRATOR,
      ],

      engines: [
        EnterpriseEngineName.BUSINESS_LAUNCH_ENGINE,
        EnterpriseEngineName.COMPLIANCE_ENGINE,
      ],

      entryRequirements: [
        requirement(
          "partner_services_complete",
          "Partner Services Complete"
        ),

        requirement(
          "required_vendor_payments_complete",
          "Required Vendor Payments Complete"
        ),
      ],

      exitRequirements: [
        requirement(
          "business_registration_verified",
          "Business Registration Verified"
        ),

        requirement(
          "ein_verified",
          "EIN Verified"
        ),

        requirement(
          "business_bank_account_verified",
          "Business Bank Account Verified"
        ),

        requirement(
          "lease_verified",
          "Lease Verified"
        ),

        requirement(
          "insurance_verified",
          "Insurance Verified"
        ),

        requirement(
          "licenses_verified",
          "Licenses Verified"
        ),

        requirement(
          "equipment_installed",
          "Equipment Installed"
        ),

        requirement(
          "inventory_received",
          "Inventory Received"
        ),

        requirement(
          "readiness_threshold_met",
          "Readiness Threshold Met"
        ),

        requirement(
          "coach_approval_recorded",
          "Coach Approval Recorded"
        ),

        requirement(
          "administrator_approval_recorded",
          "Administrator Approval Recorded"
        ),
      ],

      deliverables: [
        deliverable(
          "business_readiness_score",
          "Business Readiness Score"
        ),

        deliverable(
          "business_ready_verification_record",
          "Business Ready Verification Record"
        ),

        deliverable(
          "grand_opening_authorization",
          "Grand Opening Authorization"
        ),
      ],

      previousStage:
        BusinessLifeCycleStage.VENDOR_PAYMENTS,

      nextStage:
        BusinessLifeCycleStage.GRAND_OPENING,

      description:
        "The coach and administrator verify that the business is ready to open and that all required compliance conditions have been satisfied.",
    },

  [BusinessLifeCycleStage.GRAND_OPENING]: {
    stage: BusinessLifeCycleStage.GRAND_OPENING,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.GRAND_OPENING
      ],

    order: 14,

    owners: [EnterpriseRole.BUSINESS_LAUNCH_TEAM],

    engines: [
      EnterpriseEngineName.BUSINESS_LAUNCH_ENGINE,
      EnterpriseEngineName.COMMUNICATION_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "business_ready_verified",
        "Business Ready Verified"
      ),

      requirement(
        "grand_opening_authorized",
        "Grand Opening Authorized"
      ),
    ],

    exitRequirements: [
      requirement(
        "grand_opening_completed",
        "Grand Opening Completed"
      ),

      requirement(
        "business_accepting_customers",
        "Business Accepting Customers"
      ),

      requirement(
        "opening_documentation_complete",
        "Opening Documentation Complete"
      ),
    ],

    deliverables: [
      deliverable(
        "grand_opening_record",
        "Grand Opening Record"
      ),

      deliverable(
        "grand_opening_photos",
        "Grand Opening Photos"
      ),

      deliverable(
        "grand_opening_video",
        "Grand Opening Video",
        undefined,
        false
      ),

      deliverable(
        "community_opening_announcement",
        "Community Opening Announcement"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION,

    nextStage:
      BusinessLifeCycleStage.BUSINESS_OPENING_VERIFICATION,

    description:
      "The Business Launch Team conducts and documents the official Grand Opening.",
  },

  [BusinessLifeCycleStage.BUSINESS_OPENING_VERIFICATION]:
    {
      stage:
        BusinessLifeCycleStage.BUSINESS_OPENING_VERIFICATION,

      label:
        BUSINESS_LIFE_CYCLE_LABELS[
          BusinessLifeCycleStage.BUSINESS_OPENING_VERIFICATION
        ],

      order: 15,

      owners: [
        EnterpriseRole.COACH,
        EnterpriseRole.ADMINISTRATOR,
      ],

      engines: [
        EnterpriseEngineName.COMPLIANCE_ENGINE,
        EnterpriseEngineName.BUSINESS_LAUNCH_ENGINE,
      ],

      entryRequirements: [
        requirement(
          "grand_opening_completed",
          "Grand Opening Completed"
        ),
      ],

      exitRequirements: [
        requirement(
          "business_operating_verified",
          "Business Operating Verified"
        ),

        requirement(
          "customers_being_served_verified",
          "Customers Being Served Verified"
        ),

        requirement(
          "partner_services_verified",
          "Partner Services Verified"
        ),

        requirement(
          "vendor_deliverables_verified",
          "Vendor Deliverables Verified"
        ),

        requirement(
          "coach_opening_verification_complete",
          "Coach Opening Verification Complete"
        ),

        requirement(
          "administrator_opening_verification_complete",
          "Administrator Opening Verification Complete"
        ),
      ],

      deliverables: [
        deliverable(
          "business_opening_verification_record",
          "Business Opening Verification Record"
        ),

        deliverable(
          "working_capital_eligibility",
          "Working Capital Release Eligibility"
        ),
      ],

      previousStage:
        BusinessLifeCycleStage.GRAND_OPENING,

      nextStage:
        BusinessLifeCycleStage.WORKING_CAPITAL_RELEASE,

      description:
        "The coach and administrator verify that the business has opened and is actively operating before working capital may be released.",
    },

  [BusinessLifeCycleStage.WORKING_CAPITAL_RELEASE]:
    {
      stage:
        BusinessLifeCycleStage.WORKING_CAPITAL_RELEASE,

      label:
        BUSINESS_LIFE_CYCLE_LABELS[
          BusinessLifeCycleStage.WORKING_CAPITAL_RELEASE
        ],

      order: 16,

      owners: [EnterpriseRole.FINANCE_DEPARTMENT],

      engines: [
        EnterpriseEngineName.FINANCIAL_ENGINE,
        EnterpriseEngineName.BUSINESS_LAUNCH_ENGINE,
        EnterpriseEngineName.COMPLIANCE_ENGINE,
      ],

      entryRequirements: [
        requirement(
          "grand_opening_complete",
          "Grand Opening Complete"
        ),

        requirement(
          "business_opening_verified",
          "Business Opening Verified"
        ),

        requirement(
          "coach_verified",
          "Coach Verified"
        ),

        requirement(
          "administrator_verified",
          "Administrator Verified"
        ),

        requirement(
          "business_bank_account_verified",
          "Business Bank Account Verified"
        ),

        requirement(
          "compliance_passed",
          "Compliance Passed"
        ),

        requirement(
          "participation_cycle_active",
          "Participation Cycle Active"
        ),
      ],

      exitRequirements: [
        requirement(
          "working_capital_authorized",
          "Working Capital Authorized"
        ),

        requirement(
          "working_capital_released",
          "Working Capital Released"
        ),

        requirement(
          "working_capital_release_verified",
          "Working Capital Release Verified"
        ),
      ],

      deliverables: [
        deliverable(
          "working_capital_release_record",
          "Working Capital Release Record"
        ),

        deliverable(
          "working_capital_payment_confirmation",
          "Working Capital Payment Confirmation"
        ),

        deliverable(
          "registry_activation_authorization",
          "Business Registry Activation Authorization"
        ),
      ],

      previousStage:
        BusinessLifeCycleStage.BUSINESS_OPENING_VERIFICATION,

      nextStage:
        BusinessLifeCycleStage.BUSINESS_REGISTRY,

      description:
        "Working capital is released only after the Grand Opening and Business Opening Verification have been completed.",
    },

  [BusinessLifeCycleStage.BUSINESS_REGISTRY]: {
    stage: BusinessLifeCycleStage.BUSINESS_REGISTRY,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.BUSINESS_REGISTRY
      ],

    order: 17,

    owners: [EnterpriseRole.ENTREPRENEUR],

    engines: [
      EnterpriseEngineName.BUSINESS_REGISTRY_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
      EnterpriseEngineName.REPORTING_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "business_open_and_operating",
        "Business Open and Operating"
      ),

      requirement(
        "working_capital_process_complete",
        "Working Capital Process Complete"
      ),

      requirement(
        "business_registry_activated",
        "Business Registry Activated"
      ),
    ],

    exitRequirements: [
      requirement(
        "daily_or_weekly_registry_current",
        "Daily or Weekly Registry Current"
      ),

      requirement(
        "required_operational_information_submitted",
        "Required Operational Information Submitted"
      ),
    ],

    deliverables: [
      deliverable(
        "business_registry_entries",
        "Daily or Weekly Business Registry Entries"
      ),

      deliverable(
        "business_health_information",
        "Business Health Information"
      ),

      deliverable(
        "quarterly_reporting_source_data",
        "Quarterly Reporting Source Data"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.WORKING_CAPITAL_RELEASE,

    nextStage:
      BusinessLifeCycleStage.QUARTERLY_REPORTING,

    description:
      "The entrepreneur records daily or weekly operational information that supports monitoring, reporting, and business growth.",
  },

  [BusinessLifeCycleStage.QUARTERLY_REPORTING]: {
    stage:
      BusinessLifeCycleStage.QUARTERLY_REPORTING,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.QUARTERLY_REPORTING
      ],

    order: 18,

    owners: [
      EnterpriseRole.ENTREPRENEUR,
      EnterpriseRole.COACH,
    ],

    engines: [
      EnterpriseEngineName.REPORTING_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
      EnterpriseEngineName.BUSINESS_REGISTRY_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "business_registry_active",
        "Business Registry Active"
      ),

      requirement(
        "quarterly_reporting_period_reached",
        "Quarterly Reporting Period Reached"
      ),
    ],

    exitRequirements: [
      requirement(
        "quarterly_report_submitted",
        "Quarterly Report Submitted"
      ),

      requirement(
        "coach_review_complete",
        "Coach Review Complete"
      ),

      requirement(
        "quarterly_report_accepted",
        "Quarterly Report Accepted"
      ),
    ],

    deliverables: [
      deliverable(
        "quarterly_report",
        "Quarterly Report"
      ),

      deliverable(
        "coach_quarterly_review",
        "Coach Quarterly Review"
      ),

      deliverable(
        "quarterly_compliance_result",
        "Quarterly Compliance Result"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.BUSINESS_REGISTRY,

    nextStage:
      BusinessLifeCycleStage.BUSINESS_GROWTH,

    description:
      "The entrepreneur and coach submit and review formal quarterly performance reports generated from operational registry data.",
  },

  [BusinessLifeCycleStage.BUSINESS_GROWTH]: {
    stage: BusinessLifeCycleStage.BUSINESS_GROWTH,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.BUSINESS_GROWTH
      ],

    order: 19,

    owners: [EnterpriseRole.GROWTH_ENGINE],

    engines: [
      EnterpriseEngineName.GROWTH_ENGINE,
      EnterpriseEngineName.REPORTING_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "quarterly_reporting_current",
        "Quarterly Reporting Current"
      ),

      requirement(
        "business_operating_in_good_standing",
        "Business Operating in Good Standing"
      ),
    ],

    exitRequirements: [
      requirement(
        "growth_review_complete",
        "Growth Review Complete"
      ),

      requirement(
        "growth_plan_created",
        "Growth Plan Created"
      ),

      requirement(
        "growth_eligibility_confirmed",
        "Growth Eligibility Confirmed"
      ),
    ],

    deliverables: [
      deliverable(
        "business_growth_plan",
        "Business Growth Plan"
      ),

      deliverable(
        "business_growth_metrics",
        "Business Growth Metrics"
      ),

      deliverable(
        "growth_eligibility_result",
        "Growth Eligibility Result"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.QUARTERLY_REPORTING,

    nextStage:
      BusinessLifeCycleStage.BUSINESS_EXPANSION,

    description:
      "The Growth Engine evaluates business performance, creates a growth plan, and identifies sustainable development opportunities.",
  },

  [BusinessLifeCycleStage.BUSINESS_EXPANSION]: {
    stage:
      BusinessLifeCycleStage.BUSINESS_EXPANSION,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.BUSINESS_EXPANSION
      ],

    order: 20,

    owners: [EnterpriseRole.GROWTH_COMMITTEE],

    engines: [
      EnterpriseEngineName.GROWTH_ENGINE,
      EnterpriseEngineName.FINANCIAL_ENGINE,
      EnterpriseEngineName.COMPLIANCE_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "business_growth_requirements_met",
        "Business Growth Requirements Met"
      ),

      requirement(
        "expansion_eligibility_confirmed",
        "Expansion Eligibility Confirmed"
      ),
    ],

    exitRequirements: [
      requirement(
        "expansion_review_complete",
        "Expansion Review Complete"
      ),

      requirement(
        "expansion_plan_approved",
        "Expansion Plan Approved"
      ),
    ],

    deliverables: [
      deliverable(
        "business_expansion_plan",
        "Business Expansion Plan"
      ),

      deliverable(
        "growth_committee_decision",
        "Growth Committee Decision"
      ),

      deliverable(
        "expansion_approval_record",
        "Expansion Approval Record"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.BUSINESS_GROWTH,

    nextStage:
      BusinessLifeCycleStage.SUCCESS_STORY,

    description:
      "The Growth Committee evaluates and authorizes eligible expansion opportunities.",
  },

  [BusinessLifeCycleStage.SUCCESS_STORY]: {
    stage: BusinessLifeCycleStage.SUCCESS_STORY,

    label:
      BUSINESS_LIFE_CYCLE_LABELS[
        BusinessLifeCycleStage.SUCCESS_STORY
      ],

    order: 21,

    owners: [EnterpriseRole.COMMUNICATIONS_TEAM],

    engines: [
      EnterpriseEngineName.COMMUNICATION_ENGINE,
      EnterpriseEngineName.REPORTING_ENGINE,
      EnterpriseEngineName.GROWTH_ENGINE,
    ],

    entryRequirements: [
      requirement(
        "business_success_criteria_met",
        "Business Success Criteria Met"
      ),

      requirement(
        "entrepreneur_consent_received",
        "Entrepreneur Consent Received"
      ),
    ],

    exitRequirements: [
      requirement(
        "success_story_prepared",
        "Success Story Prepared"
      ),

      requirement(
        "success_story_approved",
        "Success Story Approved"
      ),

      requirement(
        "success_story_published",
        "Success Story Published"
      ),
    ],

    deliverables: [
      deliverable(
        "epew_success_story",
        "EPEW Success Story"
      ),

      deliverable(
        "business_impact_summary",
        "Business Impact Summary"
      ),

      deliverable(
        "entrepreneur_recognition_record",
        "Entrepreneur Recognition Record"
      ),
    ],

    previousStage:
      BusinessLifeCycleStage.BUSINESS_EXPANSION,

    nextStage: null,

    description:
      "The Communications Team documents and publishes the entrepreneur's verified EPEW success story.",
  },
};

/**
 * ============================================================
 * LIFECYCLE LOOKUP HELPERS
 * ============================================================
 */

export function getBusinessLifeCycleDefinition(
  stage: BusinessLifeCycleStage
): BusinessLifeCycleStageDefinition {
  return BUSINESS_LIFE_CYCLE[stage];
}

export function getBusinessLifeCycleStages(): BusinessLifeCycleStageDefinition[] {
  return BUSINESS_LIFE_CYCLE_ORDER.map(
    (stage) => BUSINESS_LIFE_CYCLE[stage]
  );
}

export function getBusinessLifeCycleStageIndex(
  stage: BusinessLifeCycleStage
): number {
  return BUSINESS_LIFE_CYCLE_ORDER.indexOf(stage);
}

export function getPreviousBusinessLifeCycleStage(
  stage: BusinessLifeCycleStage
): BusinessLifeCycleStage | null {
  return BUSINESS_LIFE_CYCLE[stage].previousStage;
}

export function getNextBusinessLifeCycleStage(
  stage: BusinessLifeCycleStage
): BusinessLifeCycleStage | null {
  return BUSINESS_LIFE_CYCLE[stage].nextStage;
}

export function isFirstBusinessLifeCycleStage(
  stage: BusinessLifeCycleStage
): boolean {
  return (
    stage ===
    BUSINESS_LIFE_CYCLE_ORDER[0]
  );
}

export function isFinalBusinessLifeCycleStage(
  stage: BusinessLifeCycleStage
): boolean {
  return (
    stage ===
    BUSINESS_LIFE_CYCLE_ORDER[
      BUSINESS_LIFE_CYCLE_ORDER.length - 1
    ]
  );
}

/**
 * ============================================================
 * STAGE OWNERSHIP AND ENGINE GOVERNANCE
 * ============================================================
 */

export function stageHasOwner(
  stage: BusinessLifeCycleStage,
  role: EnterpriseRole
): boolean {
  return BUSINESS_LIFE_CYCLE[
    stage
  ].owners.includes(role);
}

export function stageUsesEngine(
  stage: BusinessLifeCycleStage,
  engine: EnterpriseEngineName
): boolean {
  return BUSINESS_LIFE_CYCLE[
    stage
  ].engines.includes(engine);
}

export function getStagesOwnedByRole(
  role: EnterpriseRole
): BusinessLifeCycleStageDefinition[] {
  return getBusinessLifeCycleStages().filter(
    (definition) =>
      definition.owners.includes(role)
  );
}

export function getStagesManagedByEngine(
  engine: EnterpriseEngineName
): BusinessLifeCycleStageDefinition[] {
  return getBusinessLifeCycleStages().filter(
    (definition) =>
      definition.engines.includes(engine)
  );
}

/**
 * ============================================================
 * TRANSITION RULES
 * ============================================================
 */

export interface LifeCycleTransitionValidation {
  valid: boolean;
  currentStage: BusinessLifeCycleStage;
  requestedStage: BusinessLifeCycleStage;
  expectedNextStage: BusinessLifeCycleStage | null;
  errors: string[];
  warnings: string[];
}

export function validateBusinessLifeCycleTransition(
  currentStage: BusinessLifeCycleStage,
  requestedStage: BusinessLifeCycleStage
): LifeCycleTransitionValidation {
  const expectedNextStage =
    getNextBusinessLifeCycleStage(currentStage);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (currentStage === requestedStage) {
    warnings.push(
      "The requested stage is already the current lifecycle stage."
    );

    return {
      valid: true,
      currentStage,
      requestedStage,
      expectedNextStage,
      errors,
      warnings,
    };
  }

  if (!expectedNextStage) {
    errors.push(
      "The current lifecycle stage is final and has no next stage."
    );
  } else if (
    expectedNextStage !== requestedStage
  ) {
    errors.push(
      `Invalid lifecycle transition. The expected next stage is "${BUSINESS_LIFE_CYCLE_LABELS[expectedNextStage]}".`
    );
  }

  return {
    valid: errors.length === 0,
    currentStage,
    requestedStage,
    expectedNextStage,
    errors,
    warnings,
  };
}

export function canAdvanceBusinessLifeCycleStage(
  currentStage: BusinessLifeCycleStage,
  requestedStage: BusinessLifeCycleStage
): boolean {
  return validateBusinessLifeCycleTransition(
    currentStage,
    requestedStage
  ).valid;
}

/**
 * ============================================================
 * REQUIREMENT AND DELIVERABLE VALIDATION
 * ============================================================
 */

export interface StageCompletionInput {
  stage: BusinessLifeCycleStage;
  completedRequirementCodes: string[];
  completedDeliverableCodes: string[];
}

export interface StageCompletionEvaluation {
  stage: BusinessLifeCycleStage;
  complete: boolean;
  requirementProgress: number;
  deliverableProgress: number;
  missingRequirements: LifeCycleRequirement[];
  missingDeliverables: LifeCycleDeliverable[];
  warnings: string[];
}

export function evaluateStageCompletion({
  stage,
  completedRequirementCodes,
  completedDeliverableCodes,
}: StageCompletionInput): StageCompletionEvaluation {
  const definition =
    getBusinessLifeCycleDefinition(stage);

  const completedRequirements = new Set(
    completedRequirementCodes
  );

  const completedDeliverables = new Set(
    completedDeliverableCodes
  );

  const requiredExitRequirements =
    definition.exitRequirements.filter(
      (item) => item.required
    );

  const requiredDeliverables =
    definition.deliverables.filter(
      (item) => item.required
    );

  const missingRequirements =
    requiredExitRequirements.filter(
      (item) =>
        !completedRequirements.has(item.code)
    );

  const missingDeliverables =
    requiredDeliverables.filter(
      (item) =>
        !completedDeliverables.has(item.code)
    );

  const requirementProgress =
    requiredExitRequirements.length === 0
      ? 100
      : clampEnterprisePercentage(
          ((requiredExitRequirements.length -
            missingRequirements.length) /
            requiredExitRequirements.length) *
            100
        );

  const deliverableProgress =
    requiredDeliverables.length === 0
      ? 100
      : clampEnterprisePercentage(
          ((requiredDeliverables.length -
            missingDeliverables.length) /
            requiredDeliverables.length) *
            100
        );

  const warnings: string[] = [];

  if (
    missingRequirements.length === 0 &&
    missingDeliverables.length > 0
  ) {
    warnings.push(
      "All exit requirements are complete, but one or more required deliverables are still missing."
    );
  }

  if (
    missingRequirements.length > 0 &&
    missingDeliverables.length === 0
  ) {
    warnings.push(
      "All required deliverables exist, but one or more exit requirements are still incomplete."
    );
  }

  return {
    stage,
    complete:
      missingRequirements.length === 0 &&
      missingDeliverables.length === 0,

    requirementProgress,
    deliverableProgress,
    missingRequirements,
    missingDeliverables,
    warnings,
  };
}

/**
 * ============================================================
 * LIFECYCLE PROGRESS
 * ============================================================
 */

export interface BusinessLifeCycleProgress {
  currentStage: BusinessLifeCycleStage;
  currentStageLabel: string;
  currentStageOrder: number;
  totalStages: number;
  completedStageCount: number;
  remainingStageCount: number;
  progressPercentage: number;
  previousStage: BusinessLifeCycleStage | null;
  nextStage: BusinessLifeCycleStage | null;
}

export function calculateBusinessLifeCycleProgress(
  currentStage: BusinessLifeCycleStage
): BusinessLifeCycleProgress {
  const index =
    getBusinessLifeCycleStageIndex(
      currentStage
    );

  const totalStages =
    BUSINESS_LIFE_CYCLE_ORDER.length;

  const safeIndex = Math.max(index, 0);

  const completedStageCount = safeIndex;

  const remainingStageCount = Math.max(
    totalStages - safeIndex - 1,
    0
  );

  const progressPercentage =
    totalStages <= 1
      ? 100
      : clampEnterprisePercentage(
          (safeIndex / (totalStages - 1)) *
            100
        );

  return {
    currentStage,

    currentStageLabel:
      BUSINESS_LIFE_CYCLE_LABELS[
        currentStage
      ],

    currentStageOrder:
      safeIndex + 1,

    totalStages,

    completedStageCount,

    remainingStageCount,

    progressPercentage,

    previousStage:
      getPreviousBusinessLifeCycleStage(
        currentStage
      ),

    nextStage:
      getNextBusinessLifeCycleStage(
        currentStage
      ),
  };
}

/**
 * ============================================================
 * TIMELINE BUILDER
 * ============================================================
 */

export type LifeCycleTimelineStatus =
  | "completed"
  | "current"
  | "pending";

export interface BusinessLifeCycleTimelineItem {
  stage: BusinessLifeCycleStage;
  label: string;
  order: number;
  status: LifeCycleTimelineStatus;
  owners: EnterpriseRole[];
  engines: EnterpriseEngineName[];
  description: string;
}

export function buildBusinessLifeCycleTimeline(
  currentStage: BusinessLifeCycleStage
): BusinessLifeCycleTimelineItem[] {
  const currentIndex =
    getBusinessLifeCycleStageIndex(
      currentStage
    );

  return getBusinessLifeCycleStages().map(
    (definition, index) => {
      let status: LifeCycleTimelineStatus =
        "pending";

      if (index < currentIndex) {
        status = "completed";
      } else if (index === currentIndex) {
        status = "current";
      }

      return {
        stage: definition.stage,
        label: definition.label,
        order: definition.order,
        status,
        owners: definition.owners,
        engines: definition.engines,
        description: definition.description,
      };
    }
  );
}

/**
 * ============================================================
 * ENTERPRISE STAGE ADVANCEMENT
 * ============================================================
 */

export interface AdvanceStageInput {
  currentStage: BusinessLifeCycleStage;
  requestedStage: BusinessLifeCycleStage;
  completedRequirementCodes: string[];
  completedDeliverableCodes: string[];
}

export interface AdvanceStageResultData {
  previousStage: BusinessLifeCycleStage;
  currentStage: BusinessLifeCycleStage;
  currentStageLabel: string;
  progress: BusinessLifeCycleProgress;
}

export function advanceBusinessLifeCycleStage({
  currentStage,
  requestedStage,
  completedRequirementCodes,
  completedDeliverableCodes,
}: AdvanceStageInput): EnterpriseResult<AdvanceStageResultData> {
  const transition =
    validateBusinessLifeCycleTransition(
      currentStage,
      requestedStage
    );

  if (!transition.valid) {
    return createEnterpriseFailure({
      status: EnterpriseStatus.REJECTED,

      message:
        "The requested business lifecycle transition is not permitted.",

      errors: transition.errors,

      warnings: transition.warnings,

      metadata: {
        currentStage,
        requestedStage,
        expectedNextStage:
          transition.expectedNextStage,
      },
    });
  }

  const completion =
    evaluateStageCompletion({
      stage: currentStage,
      completedRequirementCodes,
      completedDeliverableCodes,
    });

  if (!completion.complete) {
    return createEnterpriseFailure({
      status:
       EnterpriseStatus.PENDING,
      message:
        "The current lifecycle stage is not complete.",

      errors: [
        ...completion.missingRequirements.map(
          (item) =>
            `Missing requirement: ${item.label}`
        ),

        ...completion.missingDeliverables.map(
          (item) =>
            `Missing deliverable: ${item.label}`
        ),
      ],

      warnings: completion.warnings,

      metadata: {
        stage: currentStage,
        requirementProgress:
          completion.requirementProgress,
        deliverableProgress:
          completion.deliverableProgress,
      },
    });
  }

  return createEnterpriseSuccess({
    status: EnterpriseStatus.COMPLETED,

    message: `Business lifecycle advanced from "${BUSINESS_LIFE_CYCLE_LABELS[currentStage]}" to "${BUSINESS_LIFE_CYCLE_LABELS[requestedStage]}".`,

    data: {
      previousStage: currentStage,
      currentStage: requestedStage,
      currentStageLabel:
        BUSINESS_LIFE_CYCLE_LABELS[
          requestedStage
        ],
      progress:
        calculateBusinessLifeCycleProgress(
          requestedStage
        ),
    },

    warnings: [
      ...transition.warnings,
      ...completion.warnings,
    ],

    metadata: {
      lifeCycleVersion:
        BUSINESS_LIFE_CYCLE_VERSION,
    },
  });
}

/**
 * ============================================================
 * IMPORTANT POLICY HELPERS
 * ============================================================
 */

/**
 * An entrepreneur becomes a Business Launch Candidate only
 * after the Annual Meeting has been completed.
 */
export function isEligibleForBusinessLaunchCandidate(
  currentStage: BusinessLifeCycleStage
): boolean {
  return (
    currentStage ===
      BusinessLifeCycleStage.ANNUAL_MEETING ||
    getBusinessLifeCycleStageIndex(
      currentStage
    ) >
      getBusinessLifeCycleStageIndex(
        BusinessLifeCycleStage.ANNUAL_MEETING
      )
  );
}

/**
 * Working capital may never be released before the business
 * opening has been formally verified.
 */
export function isWorkingCapitalStageAllowed(
  currentStage: BusinessLifeCycleStage
): boolean {
  return (
    getBusinessLifeCycleStageIndex(
      currentStage
    ) >=
    getBusinessLifeCycleStageIndex(
      BusinessLifeCycleStage.BUSINESS_OPENING_VERIFICATION
    )
  );
}

/**
 * Business registry activity begins only after the working
 * capital stage is complete and the business is operating.
 */
export function isBusinessRegistryStageAllowed(
  currentStage: BusinessLifeCycleStage
): boolean {
  return (
    getBusinessLifeCycleStageIndex(
      currentStage
    ) >=
    getBusinessLifeCycleStageIndex(
      BusinessLifeCycleStage.WORKING_CAPITAL_RELEASE
    )
  );
}

/**
 * Quarterly reporting requires the Business Registry stage
 * to be active or completed.
 */
export function isQuarterlyReportingAllowed(
  currentStage: BusinessLifeCycleStage
): boolean {
  return (
    getBusinessLifeCycleStageIndex(
      currentStage
    ) >=
    getBusinessLifeCycleStageIndex(
      BusinessLifeCycleStage.BUSINESS_REGISTRY
    )
  );
}

/**
 * ============================================================
 * BUSINESS LIFE CYCLE STATE MANAGER
 * ============================================================
 *
 * Compatibility wrapper used by BusinessLaunchEngine.
 *
 * The lifecycle constitution and transition definitions remain
 * functional above. This class applies those rules to one persisted
 * BusinessLaunchPlan instance.
 */
export class BusinessLifeCycle {
  private plan: BusinessLaunchPlan;

  constructor(plan: BusinessLaunchPlan) {
    this.plan = this.clonePlan(plan);
  }

  /**
   * Returns a protected copy of the current plan.
   */
  public getPlan(): BusinessLaunchPlan {
    return this.clonePlan(this.plan);
  }

  /**
   * Advances the plan to the next official lifecycle stage.
   */
  public advance(
    result: StageResult,
  ): BusinessLaunchPlan {
    this.assertOperational();

    if (
      result.stage !==
      this.plan.currentStage
    ) {
      throw new Error(
        `Stage result "${result.stage}" does not match the current lifecycle stage "${this.plan.currentStage}".`,
      );
    }

    const updatedAt =
      new Date().toISOString();

    const stageResults = [
      ...(this.plan.stageResults ?? []),
      this.clonePlan(result),
    ];

    if (!result.successful) {
      this.plan = {
        ...this.plan,

        status:
          EnterpriseStatus.PENDING,

        complianceStatus:
          ComplianceStatus.ACTION_REQUIRED,

        stageResults,

        updatedAt,
      };

      return this.getPlan();
    }

    const nextStage =
      getNextBusinessLifeCycleStage(
        this.plan.currentStage,
      );

    if (!nextStage) {
      throw new Error(
        `Lifecycle stage "${this.plan.currentStage}" does not have a next stage.`,
      );
    }

    this.plan = {
      ...this.plan,

      currentStage: nextStage,

      status:
        isFinalBusinessLifeCycleStage(nextStage)
          ? EnterpriseStatus.COMPLETED
          : EnterpriseStatus.IN_PROGRESS,

      stageResults,

      updatedAt,
    };

    return this.getPlan();
  }

  /**
   * Closes a launch plan that reached the completed lifecycle stage.
   */
  public close(
    reason: string,
  ): BusinessLaunchPlan {
    if (this.plan.status !== EnterpriseStatus.COMPLETED) {
      throw new Error(
        "Only a completed Business Launch Plan can be closed.",
      );
    }

    if (!reason.trim()) {
      throw new Error(
        "A launch-plan closure reason is required.",
      );
    }

    const closedAt =
      new Date().toISOString();

    this.plan = {
      ...this.plan,

      status:
        EnterpriseStatus.CLOSED,

      closedAt,
      closeReason: reason.trim(),

      updatedAt: closedAt,
    };

    return this.getPlan();
  }

  /**
   * Cancels an operational launch plan.
   */
  public cancel(
    reason: string,
  ): BusinessLaunchPlan {
    this.assertOperational();

    if (!reason.trim()) {
      throw new Error(
        "A launch-plan cancellation reason is required.",
      );
    }

    const cancelledAt =
      new Date().toISOString();

    this.plan = {
      ...this.plan,

      status:
        EnterpriseStatus.CANCELLED,

      cancelledAt,
      cancelReason: reason.trim(),

      updatedAt: cancelledAt,
    };

    return this.getPlan();
  }

  /**
   * Prevents changes to closed or cancelled plans.
   */
  private assertOperational(): void {
    if (
      this.plan.status ===
      EnterpriseStatus.CLOSED
    ) {
      throw new Error(
        "The Business Launch Plan is closed and cannot be modified.",
      );
    }

    if (
      this.plan.status ===
      EnterpriseStatus.CANCELLED
    ) {
      throw new Error(
        "The Business Launch Plan is cancelled and cannot be modified.",
      );
    }
  }

  /**
   * Prevents external mutation.
   */
  private clonePlan<T>(
    value: T,
  ): T {
    if (
      typeof structuredClone ===
      "function"
    ) {
      return structuredClone(value);
    }

    return JSON.parse(
      JSON.stringify(value),
    ) as T;
  }
}