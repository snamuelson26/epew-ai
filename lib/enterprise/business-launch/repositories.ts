import type {
  BusinessLaunchPlan,
  BusinessId,
  EntrepreneurId,
  LaunchId,
} from "./types";

import type {
  FinancialTransaction,
} from "./FinancialEngine";

import type {
  CommunicationHistoryEntry,
  CommunicationMessage,
} from "./CommunicationEngine";

import type {
  RegistryHistoryEntry,
  RegistryItem,
} from "./BusinessRegistryEngine";

import type {
  CoachMeetingRecord,
  GrowthMetricRecord,
  GrowthMilestone,
} from "./GrowthEngine";

/**
 * ============================================================
 * SHARED REPOSITORY TYPES
 * ============================================================
 */

/**
 * Generic pagination input.
 */
export interface RepositoryPagination {
  limit?: number;
  offset?: number;
}

/**
 * Generic date-range filter.
 */
export interface RepositoryDateRange {
  from?: string;
  to?: string;
}

/**
 * Generic repository list response.
 */
export interface RepositoryListResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Repository transaction context.
 *
 * A database adapter may use this value to associate multiple
 * repository operations with one database transaction.
 */
export interface RepositoryTransactionContext {
  transactionId: string;
}

/**
 * Unit-of-work callback.
 */
export type RepositoryTransactionCallback<T> = (
  context: RepositoryTransactionContext,
) => Promise<T>;

/**
 * ============================================================
 * BUSINESS LAUNCH PLAN REPOSITORY
 * ============================================================
 */

export interface BusinessLaunchPlanFilters
  extends RepositoryPagination {
  entrepreneurId?: EntrepreneurId;
  businessId?: BusinessId;

  status?: string;
  currentStage?: string;
  complianceStatus?: string;

  createdDateRange?: RepositoryDateRange;
  updatedDateRange?: RepositoryDateRange;
}

/**
 * Persistence contract for BusinessLaunchPlan.
 */
export interface BusinessLaunchPlanRepository {
  /**
   * Creates a new launch plan.
   */
  create(
    plan: BusinessLaunchPlan,
    context?: RepositoryTransactionContext,
  ): Promise<BusinessLaunchPlan>;

  /**
   * Replaces the persisted launch-plan state.
   */
  save(
    plan: BusinessLaunchPlan,
    context?: RepositoryTransactionContext,
  ): Promise<BusinessLaunchPlan>;

  /**
   * Finds one launch plan by its internal launch ID.
   */
  findById(
    launchPlanId: LaunchId,
  ): Promise<BusinessLaunchPlan | null>;

  /**
   * Finds the active launch plan for one business.
   */
  findByBusinessId(
    businessId: BusinessId,
  ): Promise<BusinessLaunchPlan | null>;

  /**
   * Finds launch plans belonging to one entrepreneur.
   */
  findByEntrepreneurId(
    entrepreneurId: EntrepreneurId,
    pagination?: RepositoryPagination,
  ): Promise<RepositoryListResult<BusinessLaunchPlan>>;

  /**
   * Lists launch plans using enterprise filters.
   */
  list(
    filters?: BusinessLaunchPlanFilters,
  ): Promise<RepositoryListResult<BusinessLaunchPlan>>;

  /**
   * Returns true when a launch plan exists.
   */
  exists(
    launchPlanId: LaunchId,
  ): Promise<boolean>;
}

/**
 * ============================================================
 * FINANCIAL TRANSACTION REPOSITORY
 * ============================================================
 */

export interface FinancialTransactionFilters
  extends RepositoryPagination {
  businessId?: BusinessId;
  allocationId?: string;

  type?: FinancialTransaction["type"];

  approvedBy?: string;
  reference?: string;

  createdDateRange?: RepositoryDateRange;
}

/**
 * Immutable financial transaction persistence contract.
 *
 * Financial transactions should be appended, never overwritten
 * or deleted.
 */
export interface FinancialTransactionRepository {
  /**
   * Appends one transaction.
   */
  append(
    transaction: FinancialTransaction,
    context?: RepositoryTransactionContext,
  ): Promise<FinancialTransaction>;

  /**
   * Appends several transactions atomically when supported.
   */
  appendMany(
    transactions: FinancialTransaction[],
    context?: RepositoryTransactionContext,
  ): Promise<FinancialTransaction[]>;

  /**
   * Finds one transaction by ID.
   */
  findById(
    transactionId: string,
  ): Promise<FinancialTransaction | null>;

  /**
   * Lists transactions for one business.
   */
  findByBusinessId(
    businessId: BusinessId,
    pagination?: RepositoryPagination,
  ): Promise<RepositoryListResult<FinancialTransaction>>;

  /**
   * Lists transactions for one allocation.
   */
  findByAllocationId(
    allocationId: string,
    pagination?: RepositoryPagination,
  ): Promise<RepositoryListResult<FinancialTransaction>>;

  /**
   * Lists transactions using enterprise filters.
   */
  list(
    filters?: FinancialTransactionFilters,
  ): Promise<RepositoryListResult<FinancialTransaction>>;
}

/**
 * ============================================================
 * COMPLIANCE RECORD REPOSITORY
 * ============================================================
 */

/**
 * Compliance is currently stored inside BusinessLaunchPlan.
 *
 * This repository contract allows adapters to persist a separate,
 * queryable compliance projection without changing the pure engines.
 */
export interface ComplianceRecord {
  id: string;

  launchPlanId: LaunchId;
  businessId: BusinessId;

  status: string;

  requirements: unknown[];

  lastReviewedAt: string | null;
  nextReviewDate: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRecordFilters
  extends RepositoryPagination {
  launchPlanId?: LaunchId;
  businessId?: BusinessId;
  status?: string;

  nextReviewDateRange?: RepositoryDateRange;
  updatedDateRange?: RepositoryDateRange;
}

export interface ComplianceRecordRepository {
  save(
    record: ComplianceRecord,
    context?: RepositoryTransactionContext,
  ): Promise<ComplianceRecord>;

  findById(
    complianceRecordId: string,
  ): Promise<ComplianceRecord | null>;

  findByLaunchPlanId(
    launchPlanId: LaunchId,
  ): Promise<ComplianceRecord | null>;

  findByBusinessId(
    businessId: BusinessId,
  ): Promise<ComplianceRecord | null>;

  list(
    filters?: ComplianceRecordFilters,
  ): Promise<RepositoryListResult<ComplianceRecord>>;
}

/**
 * ============================================================
 * BUSINESS REGISTRY REPOSITORY
 * ============================================================
 */

export interface RegistryItemFilters
  extends RepositoryPagination {
  businessId?: BusinessId;

  category?: RegistryItem["category"];
  requirementLevel?: RegistryItem["requirementLevel"];

  verified?: boolean;
  status?: string;

  expirationDateRange?: RepositoryDateRange;
  updatedDateRange?: RepositoryDateRange;

  includeArchived?: boolean;
}

export interface BusinessRegistryRepository {
  /**
   * Creates or updates a registry item.
   */
  saveItem(
    item: RegistryItem,
    context?: RepositoryTransactionContext,
  ): Promise<RegistryItem>;

  /**
   * Saves several registry items.
   */
  saveItems(
    items: RegistryItem[],
    context?: RepositoryTransactionContext,
  ): Promise<RegistryItem[]>;

  /**
   * Finds one registry item.
   */
  findItemById(
    registryItemId: string,
  ): Promise<RegistryItem | null>;

  /**
   * Lists registry items for one business.
   */
  findItemsByBusinessId(
    businessId: BusinessId,
    filters?: Omit<
      RegistryItemFilters,
      "businessId"
    >,
  ): Promise<RepositoryListResult<RegistryItem>>;

  /**
   * Lists registry items using enterprise filters.
   */
  listItems(
    filters?: RegistryItemFilters,
  ): Promise<RepositoryListResult<RegistryItem>>;

  /**
   * Appends immutable registry history.
   */
  appendHistory(
    entry: RegistryHistoryEntry,
    context?: RepositoryTransactionContext,
  ): Promise<RegistryHistoryEntry>;

  /**
   * Appends several registry-history entries.
   */
  appendHistoryMany(
    entries: RegistryHistoryEntry[],
    context?: RepositoryTransactionContext,
  ): Promise<RegistryHistoryEntry[]>;

  /**
   * Returns registry history for one item.
   */
  findHistoryByRegistryItemId(
    registryItemId: string,
    pagination?: RepositoryPagination,
  ): Promise<RepositoryListResult<RegistryHistoryEntry>>;

  /**
   * Returns registry history for one business.
   */
  findHistoryByBusinessId(
    businessId: BusinessId,
    pagination?: RepositoryPagination,
  ): Promise<RepositoryListResult<RegistryHistoryEntry>>;
}

/**
 * ============================================================
 * COMMUNICATION REPOSITORY
 * ============================================================
 */

export interface CommunicationMessageFilters
  extends RepositoryPagination {
  businessId?: BusinessId;

  recipientId?: string;
  recipientRole?: string;

  channel?: CommunicationMessage["channel"];
  priority?: CommunicationMessage["priority"];
  status?: CommunicationMessage["status"];

  scheduledDateRange?: RepositoryDateRange;
  createdDateRange?: RepositoryDateRange;
}

/**
 * Persistence contract for enterprise communication records.
 */
export interface CommunicationRepository {
  /**
   * Creates or updates a communication message.
   */
  saveMessage(
    message: CommunicationMessage,
    context?: RepositoryTransactionContext,
  ): Promise<CommunicationMessage>;

  /**
   * Saves several messages.
   */
  saveMessages(
    messages: CommunicationMessage[],
    context?: RepositoryTransactionContext,
  ): Promise<CommunicationMessage[]>;

  /**
   * Finds one message.
   */
  findMessageById(
    messageId: string,
  ): Promise<CommunicationMessage | null>;

  /**
   * Lists messages for one business.
   */
  findMessagesByBusinessId(
    businessId: BusinessId,
    filters?: Omit<
      CommunicationMessageFilters,
      "businessId"
    >,
  ): Promise<RepositoryListResult<CommunicationMessage>>;

  /**
   * Lists messages for one recipient.
   */
  findMessagesByRecipientId(
    recipientId: string,
    pagination?: RepositoryPagination,
  ): Promise<RepositoryListResult<CommunicationMessage>>;

  /**
   * Lists messages using enterprise filters.
   */
  listMessages(
    filters?: CommunicationMessageFilters,
  ): Promise<RepositoryListResult<CommunicationMessage>>;

  /**
   * Appends immutable message history.
   */
  appendHistory(
    entry: CommunicationHistoryEntry,
    context?: RepositoryTransactionContext,
  ): Promise<CommunicationHistoryEntry>;

  /**
   * Appends several immutable history records.
   */
  appendHistoryMany(
    entries: CommunicationHistoryEntry[],
    context?: RepositoryTransactionContext,
  ): Promise<CommunicationHistoryEntry[]>;

  /**
   * Returns the history for one communication.
   */
  findHistoryByMessageId(
    messageId: string,
    pagination?: RepositoryPagination,
  ): Promise<RepositoryListResult<CommunicationHistoryEntry>>;
}

/**
 * ============================================================
 * GROWTH METRIC REPOSITORY
 * ============================================================
 */

export interface GrowthMetricFilters
  extends RepositoryPagination {
  businessId?: BusinessId;

  type?: GrowthMetricRecord["type"];
  quarter?: number;

  periodDateRange?: RepositoryDateRange;
  createdDateRange?: RepositoryDateRange;
}

export interface GrowthMetricRepository {
  append(
    metric: GrowthMetricRecord,
    context?: RepositoryTransactionContext,
  ): Promise<GrowthMetricRecord>;

  appendMany(
    metrics: GrowthMetricRecord[],
    context?: RepositoryTransactionContext,
  ): Promise<GrowthMetricRecord[]>;

  findById(
    growthMetricId: string,
  ): Promise<GrowthMetricRecord | null>;

  findByBusinessId(
    businessId: BusinessId,
    filters?: Omit<
      GrowthMetricFilters,
      "businessId"
    >,
  ): Promise<RepositoryListResult<GrowthMetricRecord>>;

  list(
    filters?: GrowthMetricFilters,
  ): Promise<RepositoryListResult<GrowthMetricRecord>>;
}

/**
 * ============================================================
 * COACH MEETING REPOSITORY
 * ============================================================
 */

export interface CoachMeetingFilters
  extends RepositoryPagination {
  businessId?: BusinessId;
  coachId?: string;

  attended?: boolean;

  meetingDateRange?: RepositoryDateRange;
  createdDateRange?: RepositoryDateRange;
}

export interface CoachMeetingRepository {
  save(
    meeting: CoachMeetingRecord,
    context?: RepositoryTransactionContext,
  ): Promise<CoachMeetingRecord>;

  findById(
    coachMeetingId: string,
  ): Promise<CoachMeetingRecord | null>;

  findByBusinessId(
    businessId: BusinessId,
    filters?: Omit<
      CoachMeetingFilters,
      "businessId"
    >,
  ): Promise<RepositoryListResult<CoachMeetingRecord>>;

  findByCoachId(
    coachId: string,
    filters?: Omit<
      CoachMeetingFilters,
      "coachId"
    >,
  ): Promise<RepositoryListResult<CoachMeetingRecord>>;

  list(
    filters?: CoachMeetingFilters,
  ): Promise<RepositoryListResult<CoachMeetingRecord>>;
}

/**
 * ============================================================
 * GROWTH MILESTONE REPOSITORY
 * ============================================================
 */

export interface GrowthMilestoneFilters
  extends RepositoryPagination {
  businessId?: BusinessId;

  status?: GrowthMilestone["status"];
  targetMetric?: GrowthMilestone["targetMetric"];

  targetDateRange?: RepositoryDateRange;
  createdDateRange?: RepositoryDateRange;
}

export interface GrowthMilestoneRepository {
  save(
    milestone: GrowthMilestone,
    context?: RepositoryTransactionContext,
  ): Promise<GrowthMilestone>;

  saveMany(
    milestones: GrowthMilestone[],
    context?: RepositoryTransactionContext,
  ): Promise<GrowthMilestone[]>;

  findById(
    growthMilestoneId: string,
  ): Promise<GrowthMilestone | null>;

  findByBusinessId(
    businessId: BusinessId,
    filters?: Omit<
      GrowthMilestoneFilters,
      "businessId"
    >,
  ): Promise<RepositoryListResult<GrowthMilestone>>;

  list(
    filters?: GrowthMilestoneFilters,
  ): Promise<RepositoryListResult<GrowthMilestone>>;
}

/**
 * ============================================================
 * BUSINESS LAUNCH UNIT OF WORK
 * ============================================================
 */

/**
 * Groups all repositories required by the Business Launch
 * Application Service.
 *
 * The Supabase adapter will implement this complete contract.
 */
export interface BusinessLaunchUnitOfWork {
  launchPlans: BusinessLaunchPlanRepository;

  financialTransactions: FinancialTransactionRepository;

  complianceRecords: ComplianceRecordRepository;

  registry: BusinessRegistryRepository;

  communications: CommunicationRepository;

  growthMetrics: GrowthMetricRepository;

  coachMeetings: CoachMeetingRepository;

  growthMilestones: GrowthMilestoneRepository;

  /**
   * Executes several repository operations as one transaction when the
   * underlying database adapter supports transactions.
   *
   * A Supabase adapter may initially implement this as a controlled
   * callback and later replace it with an RPC-backed transaction.
   */
  runInTransaction<T>(
    callback: RepositoryTransactionCallback<T>,
  ): Promise<T>;
}

/**
 * ============================================================
 * REPOSITORY ERROR
 * ============================================================
 */

/**
 * Standard persistence-layer exception.
 */
export class RepositoryError extends Error {
  public readonly operation: string;

  public readonly repository: string;

  public readonly causeValue: unknown;

  constructor(input: {
    message: string;
    operation: string;
    repository: string;
    cause?: unknown;
  }) {
    super(input.message);

    this.name = "RepositoryError";

    this.operation = input.operation;
    this.repository = input.repository;
    this.causeValue = input.cause;

    Object.setPrototypeOf(
      this,
      RepositoryError.prototype,
    );
  }
}