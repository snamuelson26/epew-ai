import {
  BusinessLaunchPlan,
  ComplianceStatus,
  EnterpriseStatus,
} from "./types";

/**
 * Official registry categories recognized by the
 * EPEW Enterprise Operating System.
 */
export type RegistryCategory =
  | "BUSINESS_REGISTRATION"
  | "EIN"
  | "STATE_REGISTRATION"
  | "DBA"
  | "LICENSE"
  | "PERMIT"
  | "INSURANCE"
  | "ANNUAL_REPORT"
  | "BIENNIAL_REPORT"
  | "GOOD_STANDING"
  | "OTHER";

/**
 * Registry item requirement level.
 *
 * Required items affect the official compliance decision.
 * Optional items remain tracked but do not block compliance.
 */
export type RegistryRequirementLevel =
  | "REQUIRED"
  | "OPTIONAL";

/**
 * Registry history action.
 */
export type RegistryHistoryAction =
  | "REGISTERED"
  | "VERIFIED"
  | "RENEWED"
  | "REOPENED"
  | "UPDATED"
  | "ARCHIVED";

/**
 * One official legal, licensing, insurance, or regulatory record.
 */
export interface RegistryItem {
  id: string;

  businessId: string;

  category: RegistryCategory;

  title: string;
  description?: string | null;

  requirementLevel: RegistryRequirementLevel;

  status: EnterpriseStatus;

  verified: boolean;

  issuingAuthority?: string | null;
  jurisdiction?: string | null;

  documentNumber: string | null;

  issueDate: string | null;
  expirationDate: string | null;

  reminderDays: number;

  verifiedBy: string | null;
  verifiedAt: string | null;

  notes: string | null;

  createdBy?: string | null;

  createdAt: string;
  updatedAt: string;

  archivedAt?: string | null;
  archivedBy?: string | null;
  archiveReason?: string | null;
}

/**
 * Immutable registry audit-history entry.
 */
export interface RegistryHistoryEntry {
  id: string;

  registryItemId: string;
  businessId: string;

  action: RegistryHistoryAction;

  performedBy: string | null;
  reason: string | null;

  previousValue: RegistryItem | null;
  newValue: RegistryItem | null;

  createdAt: string;
}

/**
 * Input used when creating a registry item.
 */
export interface RegisterRegistryItemInput {
  category: RegistryCategory;

  title: string;
  description?: string | null;

  requirementLevel?: RegistryRequirementLevel;

  issuingAuthority?: string | null;
  jurisdiction?: string | null;

  documentNumber?: string | null;

  issueDate?: string | null;
  expirationDate?: string | null;

  reminderDays?: number;

  notes?: string | null;

  createdBy?: string | null;
}

/**
 * Input used to renew a registration, license,
 * insurance policy, permit, or filing.
 */
export interface RenewRegistryItemInput {
  issueDate: string;
  expirationDate?: string | null;

  documentNumber?: string | null;

  renewedBy: string;

  notes?: string | null;
}

/**
 * Registry compliance evaluation.
 */
export interface RegistryComplianceEvaluation {
  status: ComplianceStatus;

  totalItems: number;
  requiredItems: number;

  verifiedItems: number;
  pendingItems: number;

  expiredItems: RegistryItem[];
  expiringSoonItems: RegistryItem[];
  missingRequiredCategories: RegistryCategory[];

  compliant: boolean;

  evaluatedAt: string;
}

/**
 * Registry operational summary.
 */
export interface RegistrySummary {
  totalItems: number;

  requiredItems: number;
  optionalItems: number;

  verifiedItems: number;
  pendingItems: number;

  expiredItems: number;
  expiringSoonItems: number;

  archivedItems: number;

  completionPercentage: number;

  complianceStatus: ComplianceStatus;
  compliant: boolean;

  nextExpirationDate: string | null;
}

/**
 * BusinessRegistryEngine
 *
 * Enterprise authority for business registration,
 * licensing, insurance, filings, and legal operating status.
 *
 * Responsibilities:
 * - register legal and regulatory records,
 * - verify official documents,
 * - renew registrations and policies,
 * - reopen invalid or cancelled records,
 * - archive obsolete records,
 * - detect expired records,
 * - detect records approaching expiration,
 * - calculate registry compliance,
 * - preserve an immutable audit history.
 *
 * This engine does not:
 * - file government documents,
 * - contact licensing authorities,
 * - automatically renew registrations,
 * - send reminders,
 * - write to Supabase,
 * - or render user-interface components.
 */
export class BusinessRegistryEngine {
  private plan: BusinessLaunchPlan;

  private registry: RegistryItem[];

  private history: RegistryHistoryEntry[];

  /**
   * Required categories for an operating business.
   *
   * Additional industry-specific licenses and permits may be
   * registered as required items through registerItem().
   */
  private readonly requiredCategories: RegistryCategory[] = [
    "BUSINESS_REGISTRATION",
    "EIN",
    "LICENSE",
    "INSURANCE",
  ];

  constructor(
    plan: BusinessLaunchPlan,
    registry: RegistryItem[] = [],
    history: RegistryHistoryEntry[] = [],
  ) {
    this.plan = this.clone(plan);
    this.registry = this.clone(registry);
    this.history = this.clone(history);
  }

  /**
   * Returns a protected copy of the Business Launch Plan.
   */
  public getPlan(): BusinessLaunchPlan {
    return this.clone(this.plan);
  }

  /**
   * Returns all active registry records.
   */
  public getRegistry(): RegistryItem[] {
    return this.registry
      .filter((item) => !item.archivedAt)
      .map((item) => ({
        ...item,
      }));
  }

  /**
   * Returns all registry records, including archived records.
   */
  public getAllRegistryItems(): RegistryItem[] {
    return this.clone(this.registry);
  }

  /**
   * Returns the immutable registry audit history.
   */
  public getHistory(): RegistryHistoryEntry[] {
    return this.clone(this.history);
  }

  /**
   * Returns one registry item.
   */
  public getItem(registryItemId: string): RegistryItem {
    const item = this.findItem(registryItemId);

    return {
      ...item,
    };
  }

  /**
   * Creates a new legal or regulatory registry record.
   */
  public registerItem(
    input: RegisterRegistryItemInput,
  ): RegistryItem {
    this.assertPlanIsOperational();
    this.validateRegisterInput(input);

    const duplicate = this.registry.some(
      (item) =>
        !item.archivedAt &&
        item.category === input.category &&
        item.title.trim().toLowerCase() ===
          input.title.trim().toLowerCase(),
    );

    if (duplicate) {
      throw new Error(
        `An active registry item named "${input.title}" already exists in category ${input.category}.`,
      );
    }

    const createdAt = new Date().toISOString();

    const issueDate = input.issueDate
      ? this.toDateString(
          this.parseDate(input.issueDate),
        )
      : null;

    const expirationDate = input.expirationDate
      ? this.toDateString(
          this.parseDate(input.expirationDate),
        )
      : null;

    if (
      issueDate &&
      expirationDate &&
      this.parseDate(expirationDate).getTime() <
        this.parseDate(issueDate).getTime()
    ) {
      throw new Error(
        "The expiration date cannot be earlier than the issue date.",
      );
    }

    const registryItem: RegistryItem = {
      id: this.generateId("REG"),

      businessId: String(this.plan.businessId),

      category: input.category,

      title: input.title.trim(),
      description:
        input.description?.trim() || null,

      requirementLevel:
        input.requirementLevel ??
        this.defaultRequirementLevel(
          input.category,
        ),

      status: EnterpriseStatus.PENDING,

      verified: false,

      issuingAuthority:
        input.issuingAuthority?.trim() || null,

      jurisdiction:
        input.jurisdiction?.trim() || null,

      documentNumber:
        input.documentNumber?.trim() || null,

      issueDate,
      expirationDate,

      reminderDays:
        input.reminderDays ?? 30,

      verifiedBy: null,
      verifiedAt: null,

      notes: input.notes?.trim() || null,

      createdBy:
        input.createdBy?.trim() || null,

      createdAt,
      updatedAt: createdAt,

      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    };

    this.registry = [
      ...this.registry,
      registryItem,
    ];

    this.addHistory({
      registryItemId: registryItem.id,
      action: "REGISTERED",
      performedBy:
        input.createdBy?.trim() || null,
      reason: null,
      previousValue: null,
      newValue: registryItem,
    });

    this.refreshPlanCompliance();

    return {
      ...registryItem,
    };
  }

  /**
   * Verifies a registry document.
   *
   * Verification confirms that the document was reviewed
   * and accepted by an authorized EPEW administrator.
   */
  public verifyItem(
    registryItemId: string,
    verifiedBy: string,
    notes?: string,
  ): RegistryItem {
    this.assertPlanIsOperational();

    if (!verifiedBy.trim()) {
      throw new Error(
        "The person verifying the registry item is required.",
      );
    }

    const item = this.findActiveItem(
      registryItemId,
    );

    if (item.verified) {
      throw new Error(
        `Registry item "${registryItemId}" is already verified.`,
      );
    }

    if (this.isExpired(item, new Date())) {
      throw new Error(
        "An expired registry item cannot be verified. Renew the item first.",
      );
    }

    const verifiedAt =
      new Date().toISOString();

    const updatedItem: RegistryItem = {
      ...item,

      verified: true,

      verifiedBy: verifiedBy.trim(),
      verifiedAt,

      notes:
        notes?.trim() ||
        item.notes ||
        null,

      status: EnterpriseStatus.COMPLETED,

      updatedAt: verifiedAt,
    };

    this.replaceItem(updatedItem);

    this.addHistory({
      registryItemId,
      action: "VERIFIED",
      performedBy: verifiedBy.trim(),
      reason: notes?.trim() || null,
      previousValue: item,
      newValue: updatedItem,
    });

    this.refreshPlanCompliance();

    return {
      ...updatedItem,
    };
  }

  /**
   * Renews an existing registry item.
   *
   * The previous version remains preserved in the history.
   */
  public renewItem(
    registryItemId: string,
    input: RenewRegistryItemInput,
  ): RegistryItem {
    this.assertPlanIsOperational();

    if (!input.renewedBy.trim()) {
      throw new Error(
        "The person renewing the registry item is required.",
      );
    }

    const item = this.findActiveItem(
      registryItemId,
    );

    const issueDate = this.toDateString(
      this.parseDate(input.issueDate),
    );

    const expirationDate =
      input.expirationDate
        ? this.toDateString(
            this.parseDate(
              input.expirationDate,
            ),
          )
        : null;

    if (
      expirationDate &&
      this.parseDate(
        expirationDate,
      ).getTime() <
        this.parseDate(
          issueDate,
        ).getTime()
    ) {
      throw new Error(
        "The renewed expiration date cannot be earlier than the renewed issue date.",
      );
    }

    const renewedAt =
      new Date().toISOString();

    const updatedItem: RegistryItem = {
      ...item,

      issueDate,
      expirationDate,

      documentNumber:
        input.documentNumber?.trim() ||
        item.documentNumber,

      verified: false,
      verifiedBy: null,
      verifiedAt: null,

      notes:
        input.notes?.trim() ||
        item.notes ||
        null,

      status: EnterpriseStatus.PENDING,

      updatedAt: renewedAt,
    };

    this.replaceItem(updatedItem);

    this.addHistory({
      registryItemId,
      action: "RENEWED",
      performedBy:
        input.renewedBy.trim(),
      reason:
        input.notes?.trim() || null,
      previousValue: item,
      newValue: updatedItem,
    });

    this.refreshPlanCompliance();

    return {
      ...updatedItem,
    };
  }

  /**
   * Reopens or invalidates a previously verified record.
   *
   * Examples:
   * - insurance policy cancelled,
   * - license suspended,
   * - registration document rejected,
   * - information determined to be inaccurate.
   */
  public reopenItem(
    registryItemId: string,
    reopenedBy: string,
    reason: string,
  ): RegistryItem {
    this.assertPlanIsOperational();

    if (!reopenedBy.trim()) {
      throw new Error(
        "The person reopening the registry item is required.",
      );
    }

    if (!reason.trim()) {
      throw new Error(
        "A reason is required to reopen a registry item.",
      );
    }

    const item = this.findActiveItem(
      registryItemId,
    );

    const reopenedAt =
      new Date().toISOString();

    const updatedItem: RegistryItem = {
      ...item,

      verified: false,
      verifiedBy: null,
      verifiedAt: null,

      notes: reason.trim(),

      status: EnterpriseStatus.PENDING,

      updatedAt: reopenedAt,
    };

    this.replaceItem(updatedItem);

    this.addHistory({
      registryItemId,
      action: "REOPENED",
      performedBy: reopenedBy.trim(),
      reason: reason.trim(),
      previousValue: item,
      newValue: updatedItem,
    });

    this.refreshPlanCompliance();

    return {
      ...updatedItem,
    };
  }

  /**
   * Updates basic information on an active registry item.
   */
  public updateItem(
    registryItemId: string,
    updates: {
      title?: string;
      description?: string | null;
      issuingAuthority?: string | null;
      jurisdiction?: string | null;
      documentNumber?: string | null;
      issueDate?: string | null;
      expirationDate?: string | null;
      reminderDays?: number;
      requirementLevel?: RegistryRequirementLevel;
      notes?: string | null;
    },
    updatedBy: string,
  ): RegistryItem {
    this.assertPlanIsOperational();

    if (!updatedBy.trim()) {
      throw new Error(
        "The person updating the registry item is required.",
      );
    }

    const item = this.findActiveItem(
      registryItemId,
    );

    if (
      updates.title !== undefined &&
      !updates.title.trim()
    ) {
      throw new Error(
        "Registry item title cannot be empty.",
      );
    }

    if (
      updates.reminderDays !== undefined &&
      (!Number.isInteger(
        updates.reminderDays,
      ) ||
        updates.reminderDays < 0)
    ) {
      throw new Error(
        "Reminder days must be a non-negative integer.",
      );
    }

    const issueDate =
      updates.issueDate === undefined
        ? item.issueDate
        : updates.issueDate
          ? this.toDateString(
              this.parseDate(
                updates.issueDate,
              ),
            )
          : null;

    const expirationDate =
      updates.expirationDate === undefined
        ? item.expirationDate
        : updates.expirationDate
          ? this.toDateString(
              this.parseDate(
                updates.expirationDate,
              ),
            )
          : null;

    if (
      issueDate &&
      expirationDate &&
      this.parseDate(
        expirationDate,
      ).getTime() <
        this.parseDate(
          issueDate,
        ).getTime()
    ) {
      throw new Error(
        "The expiration date cannot be earlier than the issue date.",
      );
    }

    const updatedAt =
      new Date().toISOString();

    const updatedItem: RegistryItem = {
      ...item,

      title:
        updates.title?.trim() ??
        item.title,

      description:
        updates.description === undefined
          ? item.description
          : updates.description?.trim() ||
            null,

      issuingAuthority:
        updates.issuingAuthority ===
        undefined
          ? item.issuingAuthority
          : updates.issuingAuthority?.trim() ||
            null,

      jurisdiction:
        updates.jurisdiction === undefined
          ? item.jurisdiction
          : updates.jurisdiction?.trim() ||
            null,

      documentNumber:
        updates.documentNumber === undefined
          ? item.documentNumber
          : updates.documentNumber?.trim() ||
            null,

      issueDate,
      expirationDate,

      reminderDays:
        updates.reminderDays ??
        item.reminderDays,

      requirementLevel:
        updates.requirementLevel ??
        item.requirementLevel,

      notes:
        updates.notes === undefined
          ? item.notes
          : updates.notes?.trim() || null,

      updatedAt,
    };

    this.replaceItem(updatedItem);

    this.addHistory({
      registryItemId,
      action: "UPDATED",
      performedBy: updatedBy.trim(),
      reason: null,
      previousValue: item,
      newValue: updatedItem,
    });

    this.refreshPlanCompliance();

    return {
      ...updatedItem,
    };
  }

  /**
   * Archives a registry item.
   *
   * Registry records are never deleted.
   */
  public archiveItem(
    registryItemId: string,
    archivedBy: string,
    reason: string,
  ): RegistryItem {
    this.assertPlanIsOperational();

    if (!archivedBy.trim()) {
      throw new Error(
        "The person archiving the registry item is required.",
      );
    }

    if (!reason.trim()) {
      throw new Error(
        "An archive reason is required.",
      );
    }

    const item = this.findActiveItem(
      registryItemId,
    );

    const archivedAt =
      new Date().toISOString();

    const archivedItem: RegistryItem = {
      ...item,

      status: EnterpriseStatus.CLOSED,

      archivedAt,
      archivedBy: archivedBy.trim(),
      archiveReason: reason.trim(),

      updatedAt: archivedAt,
    };

    this.replaceItem(archivedItem);

    this.addHistory({
      registryItemId,
      action: "ARCHIVED",
      performedBy: archivedBy.trim(),
      reason: reason.trim(),
      previousValue: item,
      newValue: archivedItem,
    });

    this.refreshPlanCompliance();

    return {
      ...archivedItem,
    };
  }

  /**
   * Returns all expired active registry items.
   */
  public getExpiredItems(
    asOf: Date = new Date(),
  ): RegistryItem[] {
    this.validateDate(
      asOf,
      "expired-item review date",
    );

    return this.getRegistry()
      .filter((item) =>
        this.isExpired(item, asOf),
      )
      .map((item) => ({
        ...item,
      }));
  }

  /**
   * Returns registry items that will expire within
   * the selected number of days.
   */
  public getExpiringWithin(
    days: number,
    asOf: Date = new Date(),
  ): RegistryItem[] {
    if (
      !Number.isInteger(days) ||
      days < 0
    ) {
      throw new Error(
        "The number of days must be a non-negative integer.",
      );
    }

    this.validateDate(
      asOf,
      "expiration review date",
    );

    const startDate =
      this.startOfUtcDay(asOf);

    const deadline =
      this.endOfUtcDay(
        this.addDays(asOf, days),
      );

    return this.getRegistry()
      .filter((item) => {
        if (!item.expirationDate) {
          return false;
        }

        const expirationDate =
          this.endOfUtcDay(
            this.parseDate(
              item.expirationDate,
            ),
          );

        return (
          expirationDate.getTime() >=
            startDate.getTime() &&
          expirationDate.getTime() <=
            deadline.getTime()
        );
      })
      .sort(
        (first, second) =>
          this.parseDate(
            first.expirationDate!,
          ).getTime() -
          this.parseDate(
            second.expirationDate!,
          ).getTime(),
      )
      .map((item) => ({
        ...item,
      }));
  }

  /**
   * Returns all active unverified registry items.
   */
  public getPendingItems(): RegistryItem[] {
    return this.getRegistry()
      .filter((item) => !item.verified)
      .map((item) => ({
        ...item,
      }));
  }

  /**
   * Evaluates registry compliance.
   *
   * COMPLIANT:
   * - all required categories exist,
   * - all required items are verified,
   * - no required item is expired.
   *
   * ACTION_REQUIRED:
   * - required records are missing,
   * - or required records exist but remain unverified.
   *
   * NON_COMPLIANT:
   * - one or more required records are expired.
   */
  public evaluateCompliance(
    evaluationDate: Date = new Date(),
  ): RegistryComplianceEvaluation {
    this.validateDate(
      evaluationDate,
      "registry compliance evaluation date",
    );

    const activeItems =
      this.getRegistry();

    const requiredItems =
      activeItems.filter(
        (item) =>
          item.requirementLevel ===
          "REQUIRED",
      );

    const verifiedItems =
      requiredItems.filter(
        (item) => item.verified,
      );

    const pendingItems =
      requiredItems.filter(
        (item) => !item.verified,
      );

    const expiredItems =
      requiredItems.filter((item) =>
        this.isExpired(
          item,
          evaluationDate,
        ),
      );

    const expiringSoonItems =
      requiredItems.filter((item) =>
        this.isExpiringWithinItemReminder(
          item,
          evaluationDate,
        ),
      );

    const availableCategories =
      new Set(
        requiredItems.map(
          (item) => item.category,
        ),
      );

    const missingRequiredCategories =
      this.requiredCategories.filter(
        (category) =>
          !availableCategories.has(
            category,
          ),
      );

    let status =
      ComplianceStatus.COMPLIANT;

    if (expiredItems.length > 0) {
      status =
        ComplianceStatus.NON_COMPLIANT;
    } else if (
      missingRequiredCategories.length >
        0 ||
      pendingItems.length > 0
    ) {
      status =
        ComplianceStatus.ACTION_REQUIRED;
    }

    return {
      status,

      totalItems: activeItems.length,
      requiredItems:
        requiredItems.length,

      verifiedItems:
        verifiedItems.length,
      pendingItems:
        pendingItems.length,

      expiredItems:
        expiredItems.map((item) => ({
          ...item,
        })),

      expiringSoonItems:
        expiringSoonItems.map(
          (item) => ({
            ...item,
          }),
        ),

      missingRequiredCategories: [
        ...missingRequiredCategories,
      ],

      compliant:
        status ===
        ComplianceStatus.COMPLIANT,

      evaluatedAt:
        evaluationDate.toISOString(),
    };
  }

  /**
   * Applies registry compliance to the Business Launch Plan.
   */
  public refreshComplianceStatus(
    evaluationDate: Date = new Date(),
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    const evaluation =
      this.evaluateCompliance(
        evaluationDate,
      );

    const updatedAt =
      evaluation.evaluatedAt;

    this.plan = {
      ...this.plan,

      complianceStatus:
        this.mergeComplianceStatus(
          this.plan.complianceStatus,
          evaluation.status,
        ),

      registryComplianceStatus:
        evaluation.status,

      registryLastReviewedAt:
        updatedAt,

      updatedAt,
    } as BusinessLaunchPlan;

    return this.getPlan();
  }

  /**
   * Returns the complete registry summary.
   */
  public getSummary(
    asOf: Date = new Date(),
  ): RegistrySummary {
    this.validateDate(
      asOf,
      "registry summary date",
    );

    const activeItems =
      this.getRegistry();

    const requiredItems =
      activeItems.filter(
        (item) =>
          item.requirementLevel ===
          "REQUIRED",
      );

    const optionalItems =
      activeItems.filter(
        (item) =>
          item.requirementLevel ===
          "OPTIONAL",
      );

    const verifiedItems =
      activeItems.filter(
        (item) => item.verified,
      );

    const pendingItems =
      activeItems.filter(
        (item) => !item.verified,
      );

    const expiredItems =
      activeItems.filter((item) =>
        this.isExpired(item, asOf),
      );

    const expiringSoonItems =
      activeItems.filter((item) =>
        this.isExpiringWithinItemReminder(
          item,
          asOf,
        ),
      );

    const archivedItems =
      this.registry.filter(
        (item) =>
          Boolean(item.archivedAt),
      );

    const evaluation =
      this.evaluateCompliance(asOf);

    const expirationDates =
      activeItems
        .filter(
          (item) =>
            Boolean(
              item.expirationDate,
            ),
        )
        .map((item) =>
          this.parseDate(
            item.expirationDate!,
          ),
        )
        .filter(
          (date) =>
            date.getTime() >=
            this.startOfUtcDay(
              asOf,
            ).getTime(),
        )
        .sort(
          (first, second) =>
            first.getTime() -
            second.getTime(),
        );

    const totalItems =
      activeItems.length;

    return {
      totalItems,

      requiredItems:
        requiredItems.length,

      optionalItems:
        optionalItems.length,

      verifiedItems:
        verifiedItems.length,

      pendingItems:
        pendingItems.length,

      expiredItems:
        expiredItems.length,

      expiringSoonItems:
        expiringSoonItems.length,

      archivedItems:
        archivedItems.length,

      completionPercentage:
        totalItems === 0
          ? 0
          : Number(
              (
                (verifiedItems.length /
                  totalItems) *
                100
              ).toFixed(2),
            ),

      complianceStatus:
        evaluation.status,

      compliant:
        evaluation.compliant,

      nextExpirationDate:
        expirationDates.length > 0
          ? this.toDateString(
              expirationDates[0],
            )
          : null,
    };
  }

  /**
   * Returns true only when registry compliance is satisfied.
   */
  public isCompliant(
    asOf: Date = new Date(),
  ): boolean {
    return this.evaluateCompliance(
      asOf,
    ).compliant;
  }

  /**
   * Returns true when a particular required category
   * has at least one current verified record.
   */
  public hasVerifiedCategory(
    category: RegistryCategory,
    asOf: Date = new Date(),
  ): boolean {
    return this.getRegistry().some(
      (item) =>
        item.category === category &&
        item.verified &&
        !this.isExpired(item, asOf),
    );
  }

  /**
   * Adds one immutable audit-history entry.
   */
  private addHistory(input: {
    registryItemId: string;
    action: RegistryHistoryAction;
    performedBy: string | null;
    reason: string | null;
    previousValue: RegistryItem | null;
    newValue: RegistryItem | null;
  }): void {
    const entry: RegistryHistoryEntry = {
      id: this.generateId(
        "REG-HISTORY",
      ),

      registryItemId:
        input.registryItemId,

      businessId:
        String(this.plan.businessId),

      action: input.action,

      performedBy:
        input.performedBy,

      reason: input.reason,

      previousValue:
        input.previousValue
          ? this.clone(
              input.previousValue,
            )
          : null,

      newValue:
        input.newValue
          ? this.clone(
              input.newValue,
            )
          : null,

      createdAt:
        new Date().toISOString(),
    };

    this.history = [
      ...this.history,
      entry,
    ];
  }

  /**
   * Recalculates plan-level registry compliance.
   */
  private refreshPlanCompliance(): void {
    const evaluation =
      this.evaluateCompliance();

    const updatedAt =
      new Date().toISOString();

    this.plan = {
      ...this.plan,

      complianceStatus:
        this.mergeComplianceStatus(
          this.plan.complianceStatus,
          evaluation.status,
        ),

      registryComplianceStatus:
        evaluation.status,

      registryLastReviewedAt:
        evaluation.evaluatedAt,

      updatedAt,
    } as BusinessLaunchPlan;
  }

  /**
   * Preserves the most serious compliance status.
   *
   * NON_COMPLIANT is more serious than ACTION_REQUIRED.
   * ACTION_REQUIRED is more serious than COMPLIANT.
   */
  private mergeComplianceStatus(
    existingStatus: ComplianceStatus,
    registryStatus: ComplianceStatus,
  ): ComplianceStatus {
    const priority: Record<
      ComplianceStatus,
      number
    > = {
      [ComplianceStatus.COMPLIANT]: 1,
      [ComplianceStatus.ACTION_REQUIRED]: 2,
      [ComplianceStatus.NON_COMPLIANT]: 3,
    };

    return priority[registryStatus] >
      priority[existingStatus]
      ? registryStatus
      : existingStatus;
  }

  private validateRegisterInput(
    input: RegisterRegistryItemInput,
  ): void {
    if (!input.title.trim()) {
      throw new Error(
        "A registry item title is required.",
      );
    }

    if (
      input.reminderDays !== undefined &&
      (!Number.isInteger(
        input.reminderDays,
      ) ||
        input.reminderDays < 0)
    ) {
      throw new Error(
        "Reminder days must be a non-negative integer.",
      );
    }
  }

  private defaultRequirementLevel(
    category: RegistryCategory,
  ): RegistryRequirementLevel {
    return this.requiredCategories.includes(
      category,
    )
      ? "REQUIRED"
      : "OPTIONAL";
  }

  private findItem(
    registryItemId: string,
  ): RegistryItem {
    const item = this.registry.find(
      (registryItem) =>
        registryItem.id ===
        registryItemId,
    );

    if (!item) {
      throw new Error(
        `Registry item "${registryItemId}" was not found.`,
      );
    }

    return {
      ...item,
    };
  }

  private findActiveItem(
    registryItemId: string,
  ): RegistryItem {
    const item =
      this.findItem(registryItemId);

    if (item.archivedAt) {
      throw new Error(
        `Registry item "${registryItemId}" is archived and cannot be modified.`,
      );
    }

    return item;
  }

  private replaceItem(
    updatedItem: RegistryItem,
  ): void {
    this.registry =
      this.registry.map((item) =>
        item.id === updatedItem.id
          ? {
              ...updatedItem,
            }
          : {
              ...item,
            },
      );
  }

  private isExpired(
    item: RegistryItem,
    asOf: Date,
  ): boolean {
    if (!item.expirationDate) {
      return false;
    }

    const expirationDate =
      this.endOfUtcDay(
        this.parseDate(
          item.expirationDate,
        ),
      );

    return (
      expirationDate.getTime() <
      this.startOfUtcDay(
        asOf,
      ).getTime()
    );
  }

  private isExpiringWithinItemReminder(
    item: RegistryItem,
    asOf: Date,
  ): boolean {
    if (
      !item.expirationDate ||
      this.isExpired(item, asOf)
    ) {
      return false;
    }

    const expirationDate =
      this.endOfUtcDay(
        this.parseDate(
          item.expirationDate,
        ),
      );

    const reminderDeadline =
      this.endOfUtcDay(
        this.addDays(
          asOf,
          item.reminderDays,
        ),
      );

    return (
      expirationDate.getTime() >=
        this.startOfUtcDay(
          asOf,
        ).getTime() &&
      expirationDate.getTime() <=
        reminderDeadline.getTime()
    );
  }

  private assertPlanIsOperational(): void {
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

  private parseDate(
    value: string,
  ): Date {
    const normalizedValue =
      /^\d{4}-\d{2}-\d{2}$/.test(
        value,
      )
        ? `${value}T00:00:00.000Z`
        : value;

    const date =
      new Date(normalizedValue);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new Error(
        `Invalid date: "${value}".`,
      );
    }

    return date;
  }

  private validateDate(
    date: Date,
    label: string,
  ): void {
    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new Error(
        `BusinessRegistryEngine received an invalid ${label}.`,
      );
    }
  }

  private addDays(
    date: Date,
    days: number,
  ): Date {
    const result =
      new Date(date);

    result.setUTCDate(
      result.getUTCDate() +
        days,
    );

    return result;
  }

  private startOfUtcDay(
    date: Date,
  ): Date {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
  }

  private endOfUtcDay(
    date: Date,
  ): Date {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
  }

  private toDateString(
    date: Date,
  ): string {
    this.validateDate(
      date,
      "date",
    );

    return date
      .toISOString()
      .split("T")[0];
  }

  private generateId(
    prefix: string,
  ): string {
    const year =
      new Date().getUTCFullYear();

    const randomCode =
      this.generateRandomCode(8);

    return `${prefix}-${year}-${randomCode}`;
  }

  private generateRandomCode(
    length: number,
  ): string {
    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";

    for (
      let index = 0;
      index < length;
      index += 1
    ) {
      const position =
        Math.floor(
          Math.random() *
            characters.length,
        );

      result +=
        characters[position];
    }

    return result;
  }

  private clone<T>(
    value: T,
  ): T {
    if (
      typeof structuredClone ===
      "function"
    ) {
      return structuredClone(
        value,
      );
    }

    return JSON.parse(
      JSON.stringify(value),
    ) as T;
  }
}