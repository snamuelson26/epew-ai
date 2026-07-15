import {
  Allocation,
  AllocationCategory,
  AllocationPriority,
  AllocationRecipientType,
  AllocationType,
  Business,
  BusinessLaunchPlan,
  BusinessLifeCycleStage,
  BusinessStatus,
  ComplianceStatus,
  EnterpriseStatus,
  FundingApproval,
  PartnerAssignment,
  PartnerServiceType,
  RegistryFrequency,
} from "./types";


/**
 * LaunchPlanner
 *
 * Creates the official EPEW Business Launch Plan after a business
 * receives Funding Committee approval.
 *
 * Enterprise rule:
 * This class only creates and returns the plan.
 *
 * It does not:
 * - write to the database,
 * - send notifications,
 * - process payments,
 * - call external services,
 * - or update the user interface.
 */
export class LaunchPlanner {
  private readonly createdAt: string;
  private readonly plannedOpeningDate: string;

  constructor(
    private readonly business: Business,
    private readonly approval: FundingApproval,
  ) {
    this.createdAt = new Date().toISOString();
    this.plannedOpeningDate = this.resolvePlannedOpeningDate();
  }

  /**
   * Builds the complete official Business Launch Plan.
   */
  public build(): BusinessLaunchPlan {
    const launchPlanId = this.generateLaunchPlanId();
    const allocations = this.buildAllocations(launchPlanId);

    const allocatedAmount = allocations.reduce(
      (total, allocation) => total + allocation.approvedAmount,
      0,
    );

    const releasedAmount = allocations.reduce(
      (total, allocation) => total + allocation.releasedAmount,
      0,
    );

    return {
      id: launchPlanId,
      launchPlanId,

      businessId: this.business.id,
      entrepreneurId: this.business.entrepreneurId,

      businessName: this.business.name,
      entrepreneurName: this.business.entrepreneurName,

      fundingApprovalId: this.approval.id,
      approvedAmount: this.approval.approvedAmount,
      approvedAt: this.approval.approvedAt,

      currentStage: BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN,
      status: EnterpriseStatus.PENDING,
      businessStatus: BusinessStatus.PREPARING,
      complianceStatus: ComplianceStatus.ACTION_REQUIRED,

      fundingGoal: this.approval.approvedAmount,
      allocatedAmount,
      releasedAmount,
      remainingBalance: Math.max(0, allocatedAmount - releasedAmount),

      readinessScore: 0,
      readinessThreshold: 100,

      plannedOpeningDate: this.plannedOpeningDate,
      targetOpeningDate: this.plannedOpeningDate,
      grandOpeningDate: null,

      allocations,
      timeline: this.buildTimeline(),
      deliverables: this.buildDeliverables(),
      compliance: this.buildCompliance(),
      registry: this.buildRegistry(),
      reporting: this.buildReporting(),
      partnerAssignments: this.assignPartners(launchPlanId),
      vendorAssignments: [],

      stageResults: [],

      readinessVerification: null,
      grandOpening: null,
      workingCapital: null,

      businessReadyVerifiedAt: null,
      businessReadyVerifiedBy: null,
      businessReadyVerificationNotes: null,

      businessOpeningDate: null,
      openedAt: null,
      openedBy: null,
      openingNotes: null,

      reportingComplianceStatus: ComplianceStatus.ACTION_REQUIRED,
      reportingLastReviewedAt: null,
      reportingHistory: [],

      registryComplianceStatus: ComplianceStatus.ACTION_REQUIRED,
      registryLastReviewedAt: null,

      businessReadyVerified: false,
      businessReadyVerifiedById: null,

      createdAt: this.createdAt,
      updatedAt: this.createdAt,

      closedAt: null,
      closeReason: null,
      cancelledAt: null,
      cancelReason: null,
    };
  }

  /**
   * Creates approved funding allocations from the Funding Committee
   * decision.
   */
  private buildAllocations(launchId: string): Allocation[] {
    const approvedAllocations = this.approval.allocations ?? [];

    if (approvedAllocations.length > 0) {
      return approvedAllocations.map((allocation, index) => {
        const approvedAmount = Number(
          allocation.approvedAmount ??
            allocation.requestedAmount ??
            0,
        );

        const releasedAmount = Number(
          allocation.releasedAmount ?? 0,
        );

        const vendorName =
          allocation.vendorName?.trim() || null;

        return {
          id:
            allocation.id ??
            this.generateRecordId("ALLOCATION", index + 1),

          launchId,
          entrepreneurId: this.business.entrepreneurId,
          businessId: this.business.id,

          category: allocation.category,
          type:
            allocation.type ??
            this.getAllocationType(allocation.category),
          priority:
            allocation.priority ??
            this.getAllocationPriority(allocation.category),

          title: this.getAllocationTitle(allocation.category),
          description:
            allocation.description ??
            this.getAllocationDescription(allocation.category),
          serviceScope:
            allocation.description ??
            this.getAllocationDescription(allocation.category),

          approvedAmount,
          releasedAmount,
          remainingAmount: Math.max(
            0,
            Number(
              allocation.remainingAmount ??
                approvedAmount - releasedAmount,
            ),
          ),

          recipient: vendorName
            ? {
                type: AllocationRecipientType.VENDOR,
                id: allocation.vendorId ?? null,
                name: vendorName,
                paymentReference: null,
              }
            : null,

          partnerId: null,
          vendorId: allocation.vendorId ?? null,

          entrepreneurStatus:
            allocation.status ?? EnterpriseStatus.PENDING,
          administratorStatus:
            allocation.status ?? EnterpriseStatus.PENDING,
          fundingCommitteeStatus: EnterpriseStatus.APPROVED,
          overallStatus:
            allocation.status ?? EnterpriseStatus.PENDING,

          requiresCoachRecommendation: false,
          coachRecommended: true,

          requiresFundingCommitteeApproval: true,
          fundingCommitteeApproved: true,

          supportingDocuments: [],
          notes: [],

          approvedAt:
            allocation.approvedAt ??
            this.approval.approvedAt,
          authorizedAt: null,
          releasedAt: allocation.releasedAt ?? null,
          verifiedAt: null,
          completedAt: null,

          createdAt: allocation.createdAt ?? this.createdAt,
          updatedAt: allocation.updatedAt ?? this.createdAt,
        };
      });
    }

    return [
      {
        id: this.generateRecordId("ALLOCATION", 1),

        launchId,
        entrepreneurId: this.business.entrepreneurId,
        businessId: this.business.id,

        category: AllocationCategory.WORKING_CAPITAL,
        type: AllocationType.WORKING_CAPITAL,
        priority: AllocationPriority.HIGH,

        title: "Working Capital",
        description:
          "Approved working capital pending final category distribution.",
        serviceScope:
          "Initial approved working capital for business launch operations.",

        approvedAmount: this.approval.approvedAmount,
        releasedAmount: 0,
        remainingAmount: this.approval.approvedAmount,

        recipient: {
          type: AllocationRecipientType.BUSINESS_ACCOUNT,
          id: this.business.id,
          name: this.business.name,
          paymentReference: null,
        },

        partnerId: null,
        vendorId: null,

        entrepreneurStatus: EnterpriseStatus.PENDING,
        administratorStatus: EnterpriseStatus.PENDING,
        fundingCommitteeStatus: EnterpriseStatus.APPROVED,
        overallStatus: EnterpriseStatus.PENDING,

        requiresCoachRecommendation: false,
        coachRecommended: true,

        requiresFundingCommitteeApproval: true,
        fundingCommitteeApproved: true,

        supportingDocuments: [],
        notes: [],

        approvedAt: this.approval.approvedAt,
        authorizedAt: null,
        releasedAt: null,
        verifiedAt: null,
        completedAt: null,

        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
    ];
  }

  /**
   * Creates the official execution timeline beginning with the
   * Business Launch Plan and ending with quarterly reporting.
   */
  private buildTimeline() {
    const planDate = new Date(this.createdAt);
    const partnerDate = this.addDays(planDate, 5);
    const vendorDate = this.addDays(planDate, 15);
    const verificationDate = this.addDays(planDate, 25);
    const openingDate = new Date(this.plannedOpeningDate);

    return [
      {
        id: this.generateRecordId("MILESTONE", 1),
        stage: BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN,
        title: "Business Launch Plan",
        description:
          "Prepare and approve the complete business launch execution plan.",
        sequence: 1,
        plannedStartDate: this.toDateString(planDate),
        plannedCompletionDate: this.toDateString(partnerDate),
        actualCompletionDate: null,
        owner: "Business Launch Engine",
        status: EnterpriseStatus.PENDING,
        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
      {
        id: this.generateRecordId("MILESTONE", 2),
        stage: BusinessLifeCycleStage.PARTNER_SERVICES,
        title: "Partner Services",
        description: "Assign and coordinate approved EPEW ecosystem partners.",
        sequence: 2,
        plannedStartDate: this.toDateString(partnerDate),
        plannedCompletionDate: this.toDateString(vendorDate),
        actualCompletionDate: null,
        owner: "Assigned Partners",
        status: EnterpriseStatus.PENDING,
        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
      {
        id: this.generateRecordId("MILESTONE", 3),
        stage: BusinessLifeCycleStage.VENDOR_PAYMENTS,
        title: "Vendor Payments",
        description:
          "Authorize and release approved payments directly to verified vendors.",
        sequence: 3,
        plannedStartDate: this.toDateString(vendorDate),
        plannedCompletionDate: this.toDateString(verificationDate),
        actualCompletionDate: null,
        owner: "Financial Engine",
        status: EnterpriseStatus.PENDING,
        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
      {
        id: this.generateRecordId("MILESTONE", 4),
        stage: BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION,
        title: "Business Ready Verification",
        description:
          "Verify legal, financial, operational, insurance, vendor, and launch readiness.",
        sequence: 4,
        plannedStartDate: this.toDateString(verificationDate),
        plannedCompletionDate: this.toDateString(this.addDays(openingDate, -3)),
        actualCompletionDate: null,
        owner: "Coach and Administrator",
        status: EnterpriseStatus.PENDING,
        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
      {
        id: this.generateRecordId("MILESTONE", 5),
        stage: BusinessLifeCycleStage.GRAND_OPENING,
        title: "Grand Opening",
        description:
          "Confirm the official opening and activation of business operations.",
        sequence: 5,
        plannedStartDate: this.toDateString(openingDate),
        plannedCompletionDate: this.toDateString(openingDate),
        actualCompletionDate: null,
        owner: "Entrepreneur and Business Launch Engine",
        status: EnterpriseStatus.PENDING,
        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
      {
        id: this.generateRecordId("MILESTONE", 6),
        stage: BusinessLifeCycleStage.QUARTERLY_REPORTING,
        title: "Quarterly Reporting",
        description:
          "Submit operational, financial, compliance, and impact reports.",
        sequence: 6,
        plannedStartDate: this.toDateString(this.addMonths(openingDate, 3)),
        plannedCompletionDate: this.toDateString(
          this.addMonths(openingDate, 12),
        ),
        actualCompletionDate: null,
        owner: "Entrepreneur and Reporting Engine",
        status: EnterpriseStatus.PENDING,
        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
    ];
  }

  /**
   * Creates the initial compliance record.
   *
   * A new launch plan always begins with ACTION_REQUIRED because
   * business readiness verification has not yet been completed.
   */
  private buildCompliance() {
    return {
      id: this.generateRecordId("COMPLIANCE", 1),
      businessId: this.business.id,
      status: ComplianceStatus.ACTION_REQUIRED,

      requirements: [
        {
          id: this.generateRecordId("COMPLIANCE-ITEM", 1),
          title: "Business registration verified",
          required: true,
          completed: false,
          completedAt: null,
        },
        {
          id: this.generateRecordId("COMPLIANCE-ITEM", 2),
          title: "EIN verified",
          required: true,
          completed: false,
          completedAt: null,
        },
        {
          id: this.generateRecordId("COMPLIANCE-ITEM", 3),
          title: "Business licenses verified",
          required: true,
          completed: false,
          completedAt: null,
        },
        {
          id: this.generateRecordId("COMPLIANCE-ITEM", 4),
          title: "Business insurance verified",
          required: true,
          completed: false,
          completedAt: null,
        },
        {
          id: this.generateRecordId("COMPLIANCE-ITEM", 5),
          title: "Business bank account verified",
          required: true,
          completed: false,
          completedAt: null,
        },
        {
          id: this.generateRecordId("COMPLIANCE-ITEM", 6),
          title: "Funding agreement compliance verified",
          required: true,
          completed: false,
          completedAt: null,
        },
        {
          id: this.generateRecordId("COMPLIANCE-ITEM", 7),
          title: "Required coach meetings completed",
          required: true,
          completed: false,
          completedAt: null,
        },
        {
          id: this.generateRecordId("COMPLIANCE-ITEM", 8),
          title: "Business Ready Verification completed",
          required: true,
          completed: false,
          completedAt: null,
        },
      ],

      lastReviewedAt: null,
      nextReviewDate: this.toDateString(
        this.addDays(new Date(this.createdAt), 30),
      ),

      createdAt: this.createdAt,
      updatedAt: this.createdAt,
    };
  }

  /**
   * Creates recurring registry and renewal requirements.
   */
  private buildRegistry() {
    const openingDate = new Date(this.plannedOpeningDate);

    return [
      {
        id: this.generateRecordId("REGISTRY", 1),
        businessId: this.business.id,
        title: "Business Registry Review",
        description:
          "Review and confirm that official business registry information remains current.",
        frequency: RegistryFrequency.QUARTERLY,
        effectiveDate: this.toDateString(openingDate),
        nextDueDate: this.toDateString(this.addMonths(openingDate, 3)),
        status: EnterpriseStatus.PENDING,
        completedAt: null,
        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
      {
        id: this.generateRecordId("REGISTRY", 2),
        businessId: this.business.id,
        title: "Business License Renewal",
        description:
          "Review and renew all required state, county, city, and industry licenses.",
        frequency: RegistryFrequency.QUARTERLY,
        effectiveDate: this.toDateString(openingDate),
        nextDueDate: this.toDateString(this.addMonths(openingDate, 3)),
        status: EnterpriseStatus.PENDING,
        completedAt: null,
        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
      {
        id: this.generateRecordId("REGISTRY", 3),
        businessId: this.business.id,
        title: "Insurance Renewal",
        description:
          "Maintain active insurance coverage required for business operations.",
        frequency: RegistryFrequency.QUARTERLY,
        effectiveDate: this.toDateString(openingDate),
        nextDueDate: this.toDateString(this.addMonths(openingDate, 3)),
        status: EnterpriseStatus.PENDING,
        completedAt: null,
        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
      {
        id: this.generateRecordId("REGISTRY", 4),
        businessId: this.business.id,
        title: "Annual Filing",
        description:
          "Complete the required annual or biennial government business filing.",
        frequency: RegistryFrequency.QUARTERLY,
        effectiveDate: this.toDateString(openingDate),
        nextDueDate: this.toDateString(this.addMonths(openingDate, 3)),
        status: EnterpriseStatus.PENDING,
        completedAt: null,
        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      },
    ];
  }

  /**
   * Creates the four required first-year quarterly reports.
   */
  private buildReporting() {
    const openingDate = new Date(this.plannedOpeningDate);

    return [1, 2, 3, 4].map((quarter) => {
      const dueDate = this.addMonths(openingDate, quarter * 3);

      return {
        id: this.generateRecordId("REPORT", quarter),
        businessId: this.business.id,
        quarter,
        title: `Quarter ${quarter} Business Report`,
        reportingPeriodStart:
          quarter === 1
            ? this.toDateString(openingDate)
            : this.toDateString(this.addMonths(openingDate, (quarter - 1) * 3)),
        reportingPeriodEnd: this.toDateString(dueDate),
        dueDate: this.toDateString(dueDate),

        submittedAt: null,
        reviewedAt: null,
        approvedAt: null,

        status: EnterpriseStatus.PENDING,

        createdAt: this.createdAt,
        updatedAt: this.createdAt,
      };
    });
  }

  /**
   * Creates the complete launch deliverable checklist.
   */
  private buildDeliverables() {
    const deliverables = [
      {
        title: "Business entity registered",
        stage: BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN,
        owner: "Kleernest Solutions",
      },
      {
        title: "Employer Identification Number obtained",
        stage: BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN,
        owner: "Kleernest Solutions",
      },
      {
        title: "Business bank account opened",
        stage: BusinessLifeCycleStage.BUSINESS_LAUNCH_PLAN,
        owner: "Entrepreneur",
      },
      {
        title: "Required business licenses obtained",
        stage: BusinessLifeCycleStage.PARTNER_SERVICES,
        owner: "Kleernest Solutions",
      },
      {
        title: "Commercial lease signed or business location verified",
        stage: BusinessLifeCycleStage.PARTNER_SERVICES,
        owner: "Entrepreneur and Assigned Partner",
      },
      {
        title: "Business insurance activated",
        stage: BusinessLifeCycleStage.PARTNER_SERVICES,
        owner: "Insurance Partner",
      },
      {
        title: "Approved equipment delivered",
        stage: BusinessLifeCycleStage.VENDOR_PAYMENTS,
        owner: "Approved Vendor",
      },
      {
        title: "Opening inventory delivered",
        stage: BusinessLifeCycleStage.VENDOR_PAYMENTS,
        owner: "Approved Vendor",
      },
      {
        title: "Point-of-sale system installed",
        stage: BusinessLifeCycleStage.PARTNER_SERVICES,
        owner: "Technology Partner",
      },
      {
        title: "Branding and launch promotion completed",
        stage: BusinessLifeCycleStage.PARTNER_SERVICES,
        owner: "ORGDH Promotion",
      },
      {
        title: "Required inspection passed",
        stage: BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION,
        owner: "Entrepreneur and Administrator",
      },
      {
        title: "Business Ready Verification completed",
        stage: BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION,
        owner: "Coach and Administrator",
      },
    ];

    return deliverables.map((deliverable, index) => ({
      id: this.generateRecordId("DELIVERABLE", index + 1),
      businessId: this.business.id,
      title: deliverable.title,
      description: deliverable.title,
      stage: deliverable.stage,
      owner: deliverable.owner,

      required: true,
      completed: false,
      completedAt: null,
      verifiedBy: null,
      verifiedAt: null,

      status: EnterpriseStatus.PENDING,

      createdAt: this.createdAt,
      updatedAt: this.createdAt,
    }));
  }

  /**
   * Creates pending assignments for EPEW ecosystem partners.
   */
  private assignPartners(
    launchId: string,
  ): PartnerAssignment[] {
    const partners: Array<{
      partnerId: string;
      serviceType: PartnerServiceType;
      scope: string;
    }> = [
      {
        partnerId: "KLEERNEST-SOLUTIONS",
        serviceType: PartnerServiceType.BUSINESS_SETUP,
        scope:
          "Business formation, registration, licensing, and compliance.",
      },
      {
        partnerId: "ORGDH-PROMOTION",
        serviceType: PartnerServiceType.PROMOTION,
        scope:
          "Branding, promotion, media, and community outreach.",
      },
      {
        partnerId: "BUSINESS-MANAGEMENT-PARTNER",
        serviceType:
          PartnerServiceType.BUSINESS_MANAGEMENT,
        scope:
          "Accounting, legal, insurance, technology, and business management coordination.",
      },
    ];

    return partners.map((partner, index) => ({
      id: this.generateRecordId("PARTNER", index + 1),
      launchId,
      entrepreneurId: this.business.entrepreneurId,
      businessId: this.business.id,
      partnerId: partner.partnerId,

      serviceType: partner.serviceType,
      scope: partner.scope,

      status: EnterpriseStatus.PENDING,

      assignedAt: this.createdAt,
      dueDate: this.toDateString(
        this.addDays(
          new Date(this.createdAt),
          15 + index * 5,
        ),
      ),
      completedAt: null,
      verifiedAt: null,

      notes: [],
    }));
  }

  /**
   * Uses an approved planned opening date when available.
   * Otherwise, the initial target is 45 days after plan creation.
   */
  private resolvePlannedOpeningDate(): string {
    if (this.approval.plannedOpeningDate) {
      return this.toDateString(new Date(this.approval.plannedOpeningDate));
    }

    return this.toDateString(this.addDays(new Date(this.createdAt), 45));
  }

  private getAllocationTitle(
    category: AllocationCategory,
  ): string {
    const titles: Record<AllocationCategory, string> = {
      [AllocationCategory.PROMOTION]: "Promotion",
      [AllocationCategory.BUSINESS_SETUP]:
        "Business Setup",
      [AllocationCategory.BUSINESS_MANAGEMENT]:
        "Business Management",
      [AllocationCategory.RENT]: "Rent",
      [AllocationCategory.EQUIPMENT]: "Equipment",
      [AllocationCategory.INVENTORY]: "Inventory",
      [AllocationCategory.WORKING_CAPITAL]:
        "Working Capital",
      [AllocationCategory.OTHER_APPROVED_BUSINESS_EXPENSES]:
        "Other Approved Business Expenses",
    };

    return titles[category];
  }

  private getAllocationDescription(category: AllocationCategory): string {
    const descriptions: Partial<Record<AllocationCategory, string>> = {
      [AllocationCategory.PROMOTION]:
        "Approved promotion, marketing, advertising, and community outreach services.",

      [AllocationCategory.BUSINESS_SETUP]:
        "Approved business formation, registration, licensing, insurance, and initial setup services.",

      [AllocationCategory.BUSINESS_MANAGEMENT]:
        "Approved legal, accounting, consulting, administration, and professional business management services.",

      [AllocationCategory.RENT]:
        "Approved rent, lease, security deposit, and occupancy expenses.",

      [AllocationCategory.EQUIPMENT]:
        "Approved equipment, furniture, technology, and operational tools.",

      [AllocationCategory.INVENTORY]:
        "Approved opening inventory, products, materials, and supplies.",

      [AllocationCategory.WORKING_CAPITAL]:
        "Approved working capital for initial business operations.",

      [AllocationCategory.OTHER_APPROVED_BUSINESS_EXPENSES]:
        "Other approved business launch expenses.",
    };

    return descriptions[category] ?? "Approved business launch expense.";
  }

  private getAllocationPriority(
    category: AllocationCategory,
  ): AllocationPriority {
    const criticalCategories: AllocationCategory[] = [
      AllocationCategory.BUSINESS_SETUP,
      AllocationCategory.RENT,
    ];

    const highCategories: AllocationCategory[] = [
      AllocationCategory.EQUIPMENT,
      AllocationCategory.INVENTORY,
      AllocationCategory.BUSINESS_MANAGEMENT,
    ];

    if (criticalCategories.includes(category)) {
      return AllocationPriority.CRITICAL;
    }

    if (highCategories.includes(category)) {
      return AllocationPriority.HIGH;
    }

    return AllocationPriority.MEDIUM;
  }

  private getAllocationType(category: AllocationCategory): AllocationType {
    if (category === AllocationCategory.WORKING_CAPITAL) {
      return AllocationType.WORKING_CAPITAL;
    }

    if (category === AllocationCategory.OTHER_APPROVED_BUSINESS_EXPENSES) {
      return AllocationType.CONTINGENCY;
    }

    if (
      category === AllocationCategory.PROMOTION ||
      category === AllocationCategory.BUSINESS_SETUP ||
      category === AllocationCategory.BUSINESS_MANAGEMENT
    ) {
      return AllocationType.PARTNER_SERVICE;
    }

    return AllocationType.VENDOR_PAYMENT;
  }

  /**
   * Generates the internal EOS Business Launch Plan identifier.
   *
   * Example:
   * BLP-2026-7A42C1
   */
  private generateLaunchPlanId(): string {
    const year = new Date(this.createdAt).getFullYear();
    const randomPart = this.generateRandomCode(6);

    return `BLP-${year}-${randomPart}`;
  }

  private generateRecordId(prefix: string, sequence: number): string {
    const year = new Date(this.createdAt).getFullYear();
    const normalizedSequence = String(sequence).padStart(3, "0");
    const randomPart = this.generateRandomCode(4);

    return `${prefix}-${year}-${normalizedSequence}-${randomPart}`;
  }

  private generateRandomCode(length: number): string {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";

    for (let index = 0; index < length; index += 1) {
      const position = Math.floor(Math.random() * characters.length);
      result += characters[position];
    }

    return result;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setUTCMonth(result.getUTCMonth() + months);
    return result;
  }


  private toDateString(date: Date): string {
    if (Number.isNaN(date.getTime())) {
      throw new Error("LaunchPlanner received an invalid date.");
    }

    return date.toISOString().split("T")[0];
  }
}