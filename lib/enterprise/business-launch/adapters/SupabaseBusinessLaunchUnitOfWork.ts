import type {
  PostgrestError,
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  BusinessId,
  BusinessLaunchPlan,
  EntrepreneurId,
  LaunchId,
} from "../types";

import type {
  CommunicationHistoryEntry,
  CommunicationMessage,
} from "../CommunicationEngine";

import type {
  FinancialTransaction,
} from "../FinancialEngine";

import type {
  CoachMeetingRecord,
  GrowthMetricRecord,
  GrowthMilestone,
} from "../GrowthEngine";

import type {
  RegistryHistoryEntry,
  RegistryItem,
} from "../BusinessRegistryEngine";

import {
  RepositoryError,
  type BusinessLaunchPlanFilters,
  type BusinessLaunchPlanRepository,
  type BusinessLaunchUnitOfWork,
  type BusinessRegistryRepository,
  type CoachMeetingFilters,
  type CoachMeetingRepository,
  type CommunicationMessageFilters,
  type CommunicationRepository,
  type ComplianceRecord,
  type ComplianceRecordFilters,
  type ComplianceRecordRepository,
  type FinancialTransactionFilters,
  type FinancialTransactionRepository,
  type GrowthMetricFilters,
  type GrowthMetricRepository,
  type GrowthMilestoneFilters,
  type GrowthMilestoneRepository,
  type RepositoryDateRange,
  type RepositoryListResult,
  type RepositoryPagination,
  type RepositoryTransactionCallback,
  type RepositoryTransactionContext,
} from "../repositories";

/**
 * ============================================================
 * SUPABASE TABLE NAMES
 * ============================================================
 *
 * These names must match the SQL schema that we create next.
 */
export const BUSINESS_LAUNCH_TABLES = {
  launchPlans: "epew_business_launch_plans",

  financialTransactions:
    "epew_financial_transactions",

  complianceRecords:
    "epew_compliance_records",

  registryItems:
    "epew_business_registry",

  registryHistory:
    "epew_registry_history",

  communicationMessages:
    "epew_communications",

  communicationHistory:
    "epew_communication_history",

  growthMetrics:
    "epew_growth_metrics",

  coachMeetings:
    "epew_coach_meetings",

  growthMilestones:
    "epew_growth_milestones",
} as const;

/**
 * Generic JSON-payload row.
 *
 * EOS keeps the complete engine object in a JSONB payload while
 * exposing important values as indexed database columns.
 */
interface PayloadRow<T> {
    [key: string]: unknown;
  id: string;

  business_id?: string | null;
  entrepreneur_id?: string | null;
  launch_plan_id?: string | null;

  status?: string | null;
  current_stage?: string | null;
  compliance_status?: string | null;

  category?: string | null;
  requirement_level?: string | null;
  verified?: boolean | null;

  allocation_id?: string | null;
  transaction_type?: string | null;
  reference?: string | null;
  approved_by?: string | null;

  recipient_id?: string | null;
  recipient_role?: string | null;
  channel?: string | null;
  priority?: string | null;

  metric_type?: string | null;
  quarter?: number | null;

  coach_id?: string | null;
  attended?: boolean | null;

  target_metric?: string | null;

  scheduled_for?: string | null;
  expiration_date?: string | null;
  archived_at?: string | null;
  next_review_date?: string | null;
  meeting_date?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  target_date?: string | null;

  payload: T;

  created_at: string;
  updated_at: string;
}

/**
 * ============================================================
 * SUPABASE BUSINESS LAUNCH UNIT OF WORK
 * ============================================================
 */
export class SupabaseBusinessLaunchUnitOfWork
  implements BusinessLaunchUnitOfWork
{
  public readonly launchPlans: BusinessLaunchPlanRepository;

  public readonly financialTransactions: FinancialTransactionRepository;

  public readonly complianceRecords: ComplianceRecordRepository;

  public readonly registry: BusinessRegistryRepository;

  public readonly communications: CommunicationRepository;

  public readonly growthMetrics: GrowthMetricRepository;

  public readonly coachMeetings: CoachMeetingRepository;

  public readonly growthMilestones: GrowthMilestoneRepository;

  constructor(
    private readonly supabase: SupabaseClient,
  ) {
    this.launchPlans =
      this.createLaunchPlanRepository();

    this.financialTransactions =
      this.createFinancialTransactionRepository();

    this.complianceRecords =
      this.createComplianceRecordRepository();

    this.registry =
      this.createRegistryRepository();

    this.communications =
      this.createCommunicationRepository();

    this.growthMetrics =
      this.createGrowthMetricRepository();

    this.coachMeetings =
      this.createCoachMeetingRepository();

    this.growthMilestones =
      this.createGrowthMilestoneRepository();
  }

  /**
   * Supabase Data API calls are separate requests.
   *
   * This context groups application operations under one transaction
   * identifier for logging and audit purposes.
   *
   * A later Postgres RPC can provide a true multi-table transaction
   * without changing the application-service contract.
   */
  public async runInTransaction<T>(
    callback: RepositoryTransactionCallback<T>,
  ): Promise<T> {
    const context: RepositoryTransactionContext = {
      transactionId:
        this.generateTransactionId(),
    };

    return callback(context);
  }

  /**
   * ============================================================
   * BUSINESS LAUNCH PLAN REPOSITORY
   * ============================================================
   */
  private createLaunchPlanRepository(): BusinessLaunchPlanRepository {
    const repository =
      "BusinessLaunchPlanRepository";

    return {
      create: async (
        plan,
        _context,
      ): Promise<BusinessLaunchPlan> => {
        const row =
          this.mapLaunchPlanToRow(plan);

        try {
          const { data, error } =
            await this.supabase
              .from(
                BUSINESS_LAUNCH_TABLES.launchPlans,
              )
              .insert(row)
              .select("*")
              .single();

          this.throwIfError(
            error,
            "create",
            repository,
          );

          return this.readPayload<BusinessLaunchPlan>(
            data,
            "create",
            repository,
          );
        } catch (error) {
          throw this.toRepositoryError(
            error,
            "create",
            repository,
          );
        }
      },

      save: async (
        plan,
        _context,
      ): Promise<BusinessLaunchPlan> => {
        const row =
          this.mapLaunchPlanToRow(plan);

        try {
          const { data, error } =
            await this.supabase
              .from(
                BUSINESS_LAUNCH_TABLES.launchPlans,
              )
              .upsert(row, {
                onConflict: "id",
              })
              .select("*")
              .single();

          this.throwIfError(
            error,
            "save",
            repository,
          );

          return this.readPayload<BusinessLaunchPlan>(
            data,
            "save",
            repository,
          );
        } catch (error) {
          throw this.toRepositoryError(
            error,
            "save",
            repository,
          );
        }
      },

      findById: async (
        launchPlanId,
      ): Promise<BusinessLaunchPlan | null> => {
        try {
          const { data, error } =
            await this.supabase
              .from(
                BUSINESS_LAUNCH_TABLES.launchPlans,
              )
              .select("*")
              .eq(
                "id",
                String(launchPlanId),
              )
              .maybeSingle();

          this.throwIfError(
            error,
            "findById",
            repository,
          );

          return data
            ? this.readPayload<BusinessLaunchPlan>(
                data,
                "findById",
                repository,
              )
            : null;
        } catch (error) {
          throw this.toRepositoryError(
            error,
            "findById",
            repository,
          );
        }
      },

      findByBusinessId: async (
        businessId,
      ): Promise<BusinessLaunchPlan | null> => {
        try {
          const { data, error } =
            await this.supabase
              .from(
                BUSINESS_LAUNCH_TABLES.launchPlans,
              )
              .select("*")
              .eq(
                "business_id",
                String(businessId),
              )
              .order("created_at", {
                ascending: false,
              })
              .limit(1)
              .maybeSingle();

          this.throwIfError(
            error,
            "findByBusinessId",
            repository,
          );

          return data
            ? this.readPayload<BusinessLaunchPlan>(
                data,
                "findByBusinessId",
                repository,
              )
            : null;
        } catch (error) {
          throw this.toRepositoryError(
            error,
            "findByBusinessId",
            repository,
          );
        }
      },

      findByEntrepreneurId: async (
        entrepreneurId,
        pagination,
      ): Promise<
        RepositoryListResult<BusinessLaunchPlan>
      > => {
        return this.listPayloadRows<
          BusinessLaunchPlan
        >({
          table:
            BUSINESS_LAUNCH_TABLES.launchPlans,

          repository,

          operation:
            "findByEntrepreneurId",

          pagination,

          applyFilters: (query) =>
            query.eq(
              "entrepreneur_id",
              String(entrepreneurId),
            ),
        });
      },

      list: async (
        filters = {},
      ): Promise<
        RepositoryListResult<BusinessLaunchPlan>
      > => {
        return this.listPayloadRows<
          BusinessLaunchPlan
        >({
          table:
            BUSINESS_LAUNCH_TABLES.launchPlans,

          repository,

          operation: "list",

          pagination: filters,

          applyFilters: (query) =>
            this.applyLaunchPlanFilters(
              query,
              filters,
            ),
        });
      },

      exists: async (
        launchPlanId,
      ): Promise<boolean> => {
        try {
          const { count, error } =
            await this.supabase
              .from(
                BUSINESS_LAUNCH_TABLES.launchPlans,
              )
              .select("id", {
                count: "exact",
                head: true,
              })
              .eq(
                "id",
                String(launchPlanId),
              );

          this.throwIfError(
            error,
            "exists",
            repository,
          );

          return (count ?? 0) > 0;
        } catch (error) {
          throw this.toRepositoryError(
            error,
            "exists",
            repository,
          );
        }
      },
    };
  }

  /**
   * ============================================================
   * FINANCIAL TRANSACTION REPOSITORY
   * ============================================================
   */
  private createFinancialTransactionRepository(): FinancialTransactionRepository {
    const repository =
      "FinancialTransactionRepository";

    return {
      append: async (
        transaction,
        _context,
      ): Promise<FinancialTransaction> => {
        const row =
          this.mapFinancialTransactionToRow(
            transaction,
          );

        return this.insertPayloadRow(
          BUSINESS_LAUNCH_TABLES
            .financialTransactions,
          row,
          "append",
          repository,
        );
      },

      appendMany: async (
        transactions,
        _context,
      ): Promise<FinancialTransaction[]> => {
        if (transactions.length === 0) {
          return [];
        }

        const rows = transactions.map(
          (transaction) =>
            this.mapFinancialTransactionToRow(
              transaction,
            ),
        );

        return this.insertPayloadRows(
          BUSINESS_LAUNCH_TABLES
            .financialTransactions,
          rows,
          "appendMany",
          repository,
        );
      },

      findById: async (
        transactionId,
      ): Promise<FinancialTransaction | null> => {
        return this.findPayloadById(
          BUSINESS_LAUNCH_TABLES
            .financialTransactions,
          transactionId,
          "findById",
          repository,
        );
      },

      findByBusinessId: async (
        businessId,
        pagination,
      ): Promise<
        RepositoryListResult<FinancialTransaction>
      > => {
        return this.listPayloadRows<
          FinancialTransaction
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .financialTransactions,

          repository,

          operation:
            "findByBusinessId",

          pagination,

          applyFilters: (query) =>
            query.eq(
              "business_id",
              String(businessId),
            ),
        });
      },

      findByAllocationId: async (
        allocationId,
        pagination,
      ): Promise<
        RepositoryListResult<FinancialTransaction>
      > => {
        return this.listPayloadRows<
          FinancialTransaction
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .financialTransactions,

          repository,

          operation:
            "findByAllocationId",

          pagination,

          applyFilters: (query) =>
            query.eq(
              "allocation_id",
              allocationId,
            ),
        });
      },

      list: async (
        filters = {},
      ): Promise<
        RepositoryListResult<FinancialTransaction>
      > => {
        return this.listPayloadRows<
          FinancialTransaction
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .financialTransactions,

          repository,

          operation: "list",

          pagination: filters,

          applyFilters: (query) =>
            this.applyFinancialFilters(
              query,
              filters,
            ),
        });
      },
    };
  }

  /**
   * ============================================================
   * COMPLIANCE REPOSITORY
   * ============================================================
   */
  private createComplianceRecordRepository(): ComplianceRecordRepository {
    const repository =
      "ComplianceRecordRepository";

    return {
      save: async (
        record,
        _context,
      ): Promise<ComplianceRecord> => {
        const row =
          this.mapComplianceRecordToRow(
            record,
          );

        return this.upsertPayloadRow(
          BUSINESS_LAUNCH_TABLES
            .complianceRecords,
          row,
          "save",
          repository,
        );
      },

      findById: async (
        complianceRecordId,
      ): Promise<ComplianceRecord | null> => {
        return this.findPayloadById(
          BUSINESS_LAUNCH_TABLES
            .complianceRecords,
          complianceRecordId,
          "findById",
          repository,
        );
      },

      findByLaunchPlanId: async (
        launchPlanId,
      ): Promise<ComplianceRecord | null> => {
        return this.findSinglePayloadByColumn(
          BUSINESS_LAUNCH_TABLES
            .complianceRecords,
          "launch_plan_id",
          String(launchPlanId),
          "findByLaunchPlanId",
          repository,
        );
      },

      findByBusinessId: async (
        businessId,
      ): Promise<ComplianceRecord | null> => {
        return this.findSinglePayloadByColumn(
          BUSINESS_LAUNCH_TABLES
            .complianceRecords,
          "business_id",
          String(businessId),
          "findByBusinessId",
          repository,
        );
      },

      list: async (
        filters = {},
      ): Promise<
        RepositoryListResult<ComplianceRecord>
      > => {
        return this.listPayloadRows<
          ComplianceRecord
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .complianceRecords,

          repository,

          operation: "list",

          pagination: filters,

          applyFilters: (query) =>
            this.applyComplianceFilters(
              query,
              filters,
            ),
        });
      },
    };
  }

  /**
   * ============================================================
   * BUSINESS REGISTRY REPOSITORY
   * ============================================================
   */
  private createRegistryRepository(): BusinessRegistryRepository {
    const repository =
      "BusinessRegistryRepository";

    return {
      saveItem: async (
        item,
        _context,
      ): Promise<RegistryItem> => {
        return this.upsertPayloadRow(
          BUSINESS_LAUNCH_TABLES
            .registryItems,
          this.mapRegistryItemToRow(item),
          "saveItem",
          repository,
        );
      },

      saveItems: async (
        items,
        _context,
      ): Promise<RegistryItem[]> => {
        if (items.length === 0) {
          return [];
        }

        return this.upsertPayloadRows(
          BUSINESS_LAUNCH_TABLES
            .registryItems,
          items.map((item) =>
            this.mapRegistryItemToRow(item),
          ),
          "saveItems",
          repository,
        );
      },

      findItemById: async (
        registryItemId,
      ): Promise<RegistryItem | null> => {
        return this.findPayloadById(
          BUSINESS_LAUNCH_TABLES
            .registryItems,
          registryItemId,
          "findItemById",
          repository,
        );
      },

      findItemsByBusinessId: async (
        businessId,
        filters = {},
      ): Promise<
        RepositoryListResult<RegistryItem>
      > => {
        return this.listPayloadRows<
          RegistryItem
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .registryItems,

          repository,

          operation:
            "findItemsByBusinessId",

          pagination: filters,

          applyFilters: (query) => {
            let filtered = query.eq(
              "business_id",
              String(businessId),
            );

            filtered =
              this.applyRegistryFilters(
                filtered,
                filters,
              );

            return filtered;
          },
        });
      },

      listItems: async (
        filters = {},
      ): Promise<
        RepositoryListResult<RegistryItem>
      > => {
        return this.listPayloadRows<
          RegistryItem
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .registryItems,

          repository,

          operation: "listItems",

          pagination: filters,

          applyFilters: (query) =>
            this.applyRegistryFilters(
              query,
              filters,
            ),
        });
      },

      appendHistory: async (
        entry,
        _context,
      ): Promise<RegistryHistoryEntry> => {
        return this.insertPayloadRow(
          BUSINESS_LAUNCH_TABLES
            .registryHistory,
          this.mapRegistryHistoryToRow(
            entry,
          ),
          "appendHistory",
          repository,
        );
      },

      appendHistoryMany: async (
        entries,
        _context,
      ): Promise<RegistryHistoryEntry[]> => {
        if (entries.length === 0) {
          return [];
        }

        return this.insertPayloadRows(
          BUSINESS_LAUNCH_TABLES
            .registryHistory,
          entries.map((entry) =>
            this.mapRegistryHistoryToRow(
              entry,
            ),
          ),
          "appendHistoryMany",
          repository,
        );
      },

      findHistoryByRegistryItemId:
        async (
          registryItemId,
          pagination,
        ): Promise<
          RepositoryListResult<RegistryHistoryEntry>
        > => {
          return this.listPayloadRows<
            RegistryHistoryEntry
          >({
            table:
              BUSINESS_LAUNCH_TABLES
                .registryHistory,

            repository,

            operation:
              "findHistoryByRegistryItemId",

            pagination,

            applyFilters: (query) =>
              query.eq(
                "registry_item_id",
                registryItemId,
              ),
          });
        },

      findHistoryByBusinessId: async (
        businessId,
        pagination,
      ): Promise<
        RepositoryListResult<RegistryHistoryEntry>
      > => {
        return this.listPayloadRows<
          RegistryHistoryEntry
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .registryHistory,

          repository,

          operation:
            "findHistoryByBusinessId",

          pagination,

          applyFilters: (query) =>
            query.eq(
              "business_id",
              String(businessId),
            ),
        });
      },
    };
  }

  /**
   * ============================================================
   * COMMUNICATION REPOSITORY
   * ============================================================
   */
  private createCommunicationRepository(): CommunicationRepository {
    const repository =
      "CommunicationRepository";

    return {
      saveMessage: async (
        message,
        _context,
      ): Promise<CommunicationMessage> => {
        return this.upsertPayloadRow(
          BUSINESS_LAUNCH_TABLES
            .communicationMessages,
          this.mapCommunicationMessageToRow(
            message,
          ),
          "saveMessage",
          repository,
        );
      },

      saveMessages: async (
        messages,
        _context,
      ): Promise<CommunicationMessage[]> => {
        if (messages.length === 0) {
          return [];
        }

        return this.upsertPayloadRows(
          BUSINESS_LAUNCH_TABLES
            .communicationMessages,
          messages.map((message) =>
            this.mapCommunicationMessageToRow(
              message,
            ),
          ),
          "saveMessages",
          repository,
        );
      },

      findMessageById: async (
        messageId,
      ): Promise<CommunicationMessage | null> => {
        return this.findPayloadById(
          BUSINESS_LAUNCH_TABLES
            .communicationMessages,
          messageId,
          "findMessageById",
          repository,
        );
      },

      findMessagesByBusinessId: async (
        businessId,
        filters = {},
      ): Promise<
        RepositoryListResult<CommunicationMessage>
      > => {
        return this.listPayloadRows<
          CommunicationMessage
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .communicationMessages,

          repository,

          operation:
            "findMessagesByBusinessId",

          pagination: filters,

          applyFilters: (query) => {
            let filtered = query.eq(
              "business_id",
              String(businessId),
            );

            filtered =
              this.applyCommunicationFilters(
                filtered,
                filters,
              );

            return filtered;
          },
        });
      },

      findMessagesByRecipientId: async (
        recipientId,
        pagination,
      ): Promise<
        RepositoryListResult<CommunicationMessage>
      > => {
        return this.listPayloadRows<
          CommunicationMessage
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .communicationMessages,

          repository,

          operation:
            "findMessagesByRecipientId",

          pagination,

          applyFilters: (query) =>
            query.eq(
              "recipient_id",
              recipientId,
            ),
        });
      },

      listMessages: async (
        filters = {},
      ): Promise<
        RepositoryListResult<CommunicationMessage>
      > => {
        return this.listPayloadRows<
          CommunicationMessage
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .communicationMessages,

          repository,

          operation: "listMessages",

          pagination: filters,

          applyFilters: (query) =>
            this.applyCommunicationFilters(
              query,
              filters,
            ),
        });
      },

      appendHistory: async (
        entry,
        _context,
      ): Promise<CommunicationHistoryEntry> => {
        return this.insertPayloadRow(
          BUSINESS_LAUNCH_TABLES
            .communicationHistory,
          this.mapCommunicationHistoryToRow(
            entry,
          ),
          "appendHistory",
          repository,
        );
      },

      appendHistoryMany: async (
        entries,
        _context,
      ): Promise<
        CommunicationHistoryEntry[]
      > => {
        if (entries.length === 0) {
          return [];
        }

        return this.insertPayloadRows(
          BUSINESS_LAUNCH_TABLES
            .communicationHistory,
          entries.map((entry) =>
            this.mapCommunicationHistoryToRow(
              entry,
            ),
          ),
          "appendHistoryMany",
          repository,
        );
      },

      findHistoryByMessageId: async (
        messageId,
        pagination,
      ): Promise<
        RepositoryListResult<CommunicationHistoryEntry>
      > => {
        return this.listPayloadRows<
          CommunicationHistoryEntry
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .communicationHistory,

          repository,

          operation:
            "findHistoryByMessageId",

          pagination,

          applyFilters: (query) =>
            query.eq(
              "message_id",
              messageId,
            ),
        });
      },
    };
  }

  /**
   * ============================================================
   * GROWTH METRIC REPOSITORY
   * ============================================================
   */
  private createGrowthMetricRepository(): GrowthMetricRepository {
    const repository =
      "GrowthMetricRepository";

    return {
      append: async (
        metric,
        _context,
      ): Promise<GrowthMetricRecord> => {
        return this.insertPayloadRow(
          BUSINESS_LAUNCH_TABLES
            .growthMetrics,
          this.mapGrowthMetricToRow(
            metric,
          ),
          "append",
          repository,
        );
      },

      appendMany: async (
        metrics,
        _context,
      ): Promise<GrowthMetricRecord[]> => {
        if (metrics.length === 0) {
          return [];
        }

        return this.insertPayloadRows(
          BUSINESS_LAUNCH_TABLES
            .growthMetrics,
          metrics.map((metric) =>
            this.mapGrowthMetricToRow(
              metric,
            ),
          ),
          "appendMany",
          repository,
        );
      },

      findById: async (
        growthMetricId,
      ): Promise<GrowthMetricRecord | null> => {
        return this.findPayloadById(
          BUSINESS_LAUNCH_TABLES
            .growthMetrics,
          growthMetricId,
          "findById",
          repository,
        );
      },

      findByBusinessId: async (
        businessId,
        filters = {},
      ): Promise<
        RepositoryListResult<GrowthMetricRecord>
      > => {
        return this.listPayloadRows<
          GrowthMetricRecord
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .growthMetrics,

          repository,

          operation:
            "findByBusinessId",

          pagination: filters,

          applyFilters: (query) => {
            let filtered = query.eq(
              "business_id",
              String(businessId),
            );

            filtered =
              this.applyGrowthMetricFilters(
                filtered,
                filters,
              );

            return filtered;
          },
        });
      },

      list: async (
        filters = {},
      ): Promise<
        RepositoryListResult<GrowthMetricRecord>
      > => {
        return this.listPayloadRows<
          GrowthMetricRecord
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .growthMetrics,

          repository,

          operation: "list",

          pagination: filters,

          applyFilters: (query) =>
            this.applyGrowthMetricFilters(
              query,
              filters,
            ),
        });
      },
    };
  }

  /**
   * ============================================================
   * COACH MEETING REPOSITORY
   * ============================================================
   */
  private createCoachMeetingRepository(): CoachMeetingRepository {
    const repository =
      "CoachMeetingRepository";

    return {
      save: async (
        meeting,
        _context,
      ): Promise<CoachMeetingRecord> => {
        return this.upsertPayloadRow(
          BUSINESS_LAUNCH_TABLES
            .coachMeetings,
          this.mapCoachMeetingToRow(
            meeting,
          ),
          "save",
          repository,
        );
      },

      findById: async (
        coachMeetingId,
      ): Promise<CoachMeetingRecord | null> => {
        return this.findPayloadById(
          BUSINESS_LAUNCH_TABLES
            .coachMeetings,
          coachMeetingId,
          "findById",
          repository,
        );
      },

      findByBusinessId: async (
        businessId,
        filters = {},
      ): Promise<
        RepositoryListResult<CoachMeetingRecord>
      > => {
        return this.listPayloadRows<
          CoachMeetingRecord
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .coachMeetings,

          repository,

          operation:
            "findByBusinessId",

          pagination: filters,

          applyFilters: (query) => {
            let filtered = query.eq(
              "business_id",
              String(businessId),
            );

            filtered =
              this.applyCoachMeetingFilters(
                filtered,
                filters,
              );

            return filtered;
          },
        });
      },

      findByCoachId: async (
        coachId,
        filters = {},
      ): Promise<
        RepositoryListResult<CoachMeetingRecord>
      > => {
        return this.listPayloadRows<
          CoachMeetingRecord
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .coachMeetings,

          repository,

          operation: "findByCoachId",

          pagination: filters,

          applyFilters: (query) => {
            let filtered = query.eq(
              "coach_id",
              coachId,
            );

            filtered =
              this.applyCoachMeetingFilters(
                filtered,
                filters,
              );

            return filtered;
          },
        });
      },

      list: async (
        filters = {},
      ): Promise<
        RepositoryListResult<CoachMeetingRecord>
      > => {
        return this.listPayloadRows<
          CoachMeetingRecord
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .coachMeetings,

          repository,

          operation: "list",

          pagination: filters,

          applyFilters: (query) =>
            this.applyCoachMeetingFilters(
              query,
              filters,
            ),
        });
      },
    };
  }

  /**
   * ============================================================
   * GROWTH MILESTONE REPOSITORY
   * ============================================================
   */
  private createGrowthMilestoneRepository(): GrowthMilestoneRepository {
    const repository =
      "GrowthMilestoneRepository";

    return {
      save: async (
        milestone,
        _context,
      ): Promise<GrowthMilestone> => {
        return this.upsertPayloadRow(
          BUSINESS_LAUNCH_TABLES
            .growthMilestones,
          this.mapGrowthMilestoneToRow(
            milestone,
          ),
          "save",
          repository,
        );
      },

      saveMany: async (
        milestones,
        _context,
      ): Promise<GrowthMilestone[]> => {
        if (milestones.length === 0) {
          return [];
        }

        return this.upsertPayloadRows(
          BUSINESS_LAUNCH_TABLES
            .growthMilestones,
          milestones.map(
            (milestone) =>
              this.mapGrowthMilestoneToRow(
                milestone,
              ),
          ),
          "saveMany",
          repository,
        );
      },

      findById: async (
        growthMilestoneId,
      ): Promise<GrowthMilestone | null> => {
        return this.findPayloadById(
          BUSINESS_LAUNCH_TABLES
            .growthMilestones,
          growthMilestoneId,
          "findById",
          repository,
        );
      },

      findByBusinessId: async (
        businessId,
        filters = {},
      ): Promise<
        RepositoryListResult<GrowthMilestone>
      > => {
        return this.listPayloadRows<
          GrowthMilestone
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .growthMilestones,

          repository,

          operation:
            "findByBusinessId",

          pagination: filters,

          applyFilters: (query) => {
            let filtered = query.eq(
              "business_id",
              String(businessId),
            );

            filtered =
              this.applyGrowthMilestoneFilters(
                filtered,
                filters,
              );

            return filtered;
          },
        });
      },

      list: async (
        filters = {},
      ): Promise<
        RepositoryListResult<GrowthMilestone>
      > => {
        return this.listPayloadRows<
          GrowthMilestone
        >({
          table:
            BUSINESS_LAUNCH_TABLES
              .growthMilestones,

          repository,

          operation: "list",

          pagination: filters,

          applyFilters: (query) =>
            this.applyGrowthMilestoneFilters(
              query,
              filters,
            ),
        });
      },
    };
  }

  /**
   * ============================================================
   * ROW MAPPERS
   * ============================================================
   */
  private mapLaunchPlanToRow(
    plan: BusinessLaunchPlan,
  ): PayloadRow<BusinessLaunchPlan> {
    return {
      id: String(plan.id),

      business_id:
        String(plan.businessId),

      entrepreneur_id:
        String(plan.entrepreneurId),

      launch_plan_id:
        String(plan.id),

      status:
        String(plan.status),

      current_stage:
        String(plan.currentStage),

      compliance_status:
        String(plan.complianceStatus),

      payload: this.clone(plan),

      created_at: plan.createdAt,
      updated_at: plan.updatedAt,
    };
  }

  private mapFinancialTransactionToRow(
    transaction: FinancialTransaction,
  ): PayloadRow<FinancialTransaction> {
    return {
      id: transaction.id,

      business_id:
        transaction.businessId,

      allocation_id:
        transaction.allocationId,

      transaction_type:
        transaction.type,

      reference:
        transaction.reference,

      approved_by:
        transaction.approvedBy,

      payload:
        this.clone(transaction),

      created_at:
        transaction.createdAt,

      updated_at:
        transaction.createdAt,
    };
  }

  private mapComplianceRecordToRow(
    record: ComplianceRecord,
  ): PayloadRow<ComplianceRecord> {
    return {
      id: record.id,

      business_id:
        String(record.businessId),

      launch_plan_id:
        String(record.launchPlanId),

      status:
        record.status,

      compliance_status:
        record.status,

      next_review_date:
        record.nextReviewDate,

      payload: this.clone(record),

      created_at:
        record.createdAt,

      updated_at:
        record.updatedAt,
    };
  }

  private mapRegistryItemToRow(
  item: RegistryItem,
): PayloadRow<RegistryItem> {
  return {
    id: item.id,

    business_id:
      item.businessId,

    status:
      String(item.status),

    category:
      item.category,

    requirement_level:
      item.requirementLevel,

    verified:
      item.verified,

    expiration_date:
      item.expirationDate,

    archived_at:
      item.archivedAt ?? null,

    payload:
      this.clone(item),

    created_at:
      item.createdAt,

    updated_at:
      item.updatedAt,
  };
}
  private mapRegistryHistoryToRow(
    entry: RegistryHistoryEntry,
  ): PayloadRow<RegistryHistoryEntry> & {
    registry_item_id: string;
  } {
    return {
      id: entry.id,

      business_id:
        entry.businessId,

      registry_item_id:
        entry.registryItemId,

      status:
        entry.action,

      payload:
        this.clone(entry),

      created_at:
        entry.createdAt,

      updated_at:
        entry.createdAt,
    };
  }

  private mapCommunicationMessageToRow(
    message: CommunicationMessage,
  ): PayloadRow<CommunicationMessage> {
    return {
      id: message.id,

      business_id:
        message.businessId,

      recipient_id:
        message.recipientId,

      recipient_role:
        String(message.recipientRole),

      channel:
        String(message.channel),

      priority:
        String(message.priority),

      status:
        String(message.status),

      scheduled_for:
        message.scheduledFor,

      payload:
        this.clone(message),

      created_at:
        message.createdAt,

      updated_at:
        message.updatedAt,
    };
  }

  private mapCommunicationHistoryToRow(
    entry: CommunicationHistoryEntry,
  ): PayloadRow<CommunicationHistoryEntry> & {
    message_id: string;
  } {
    return {
      id: entry.id,

      business_id:
        entry.businessId,

      message_id:
        entry.messageId,

      status:
        entry.newStatus,

      payload:
        this.clone(entry),

      created_at:
        entry.createdAt,

      updated_at:
        entry.createdAt,
    };
  }

  private mapGrowthMetricToRow(
    metric: GrowthMetricRecord,
  ): PayloadRow<GrowthMetricRecord> {
    return {
      id: metric.id,

      business_id:
        metric.businessId,

      metric_type:
        String(metric.type),

      quarter:
        metric.quarter ?? null,

      period_start:
        metric.periodStart,

      period_end:
        metric.periodEnd,

      payload:
        this.clone(metric),

      created_at:
        metric.createdAt,

      updated_at:
        metric.updatedAt,
    };
  }

  private mapCoachMeetingToRow(
    meeting: CoachMeetingRecord,
  ): PayloadRow<CoachMeetingRecord> {
    return {
      id: meeting.id,

      business_id:
        meeting.businessId,

      coach_id:
        meeting.coachId,

      attended:
        meeting.attended,

      meeting_date:
        meeting.meetingDate,

      payload:
        this.clone(meeting),

      created_at:
        meeting.createdAt,

      updated_at:
        meeting.updatedAt,
    };
  }

  private mapGrowthMilestoneToRow(
    milestone: GrowthMilestone,
  ): PayloadRow<GrowthMilestone> {
    return {
      id: milestone.id,

      business_id:
        milestone.businessId,

      status:
        String(milestone.status),

      target_metric:
        milestone.targetMetric
          ? String(
              milestone.targetMetric,
            )
          : null,

      target_date:
        milestone.targetDate,

      payload:
        this.clone(milestone),

      created_at:
        milestone.createdAt,

      updated_at:
        milestone.updatedAt,
    };
  }

  /**
   * ============================================================
   * FILTER HELPERS
   * ============================================================
   */
  private applyLaunchPlanFilters(
    query: any,
    filters: BusinessLaunchPlanFilters,
  ): any {
    let result = query;

    if (filters.entrepreneurId) {
      result = result.eq(
        "entrepreneur_id",
        String(filters.entrepreneurId),
      );
    }

    if (filters.businessId) {
      result = result.eq(
        "business_id",
        String(filters.businessId),
      );
    }

    if (filters.status) {
      result = result.eq(
        "status",
        filters.status,
      );
    }

    if (filters.currentStage) {
      result = result.eq(
        "current_stage",
        filters.currentStage,
      );
    }

    if (filters.complianceStatus) {
      result = result.eq(
        "compliance_status",
        filters.complianceStatus,
      );
    }

    result = this.applyDateRange(
      result,
      "created_at",
      filters.createdDateRange,
    );

    result = this.applyDateRange(
      result,
      "updated_at",
      filters.updatedDateRange,
    );

    return result;
  }

  private applyFinancialFilters(
    query: any,
    filters: FinancialTransactionFilters,
  ): any {
    let result = query;

    if (filters.businessId) {
      result = result.eq(
        "business_id",
        String(filters.businessId),
      );
    }

    if (filters.allocationId) {
      result = result.eq(
        "allocation_id",
        filters.allocationId,
      );
    }

    if (filters.type) {
      result = result.eq(
        "transaction_type",
        filters.type,
      );
    }

    if (filters.approvedBy) {
      result = result.eq(
        "approved_by",
        filters.approvedBy,
      );
    }

    if (filters.reference) {
      result = result.eq(
        "reference",
        filters.reference,
      );
    }

    return this.applyDateRange(
      result,
      "created_at",
      filters.createdDateRange,
    );
  }

  private applyComplianceFilters(
    query: any,
    filters: ComplianceRecordFilters,
  ): any {
    let result = query;

    if (filters.launchPlanId) {
      result = result.eq(
        "launch_plan_id",
        String(filters.launchPlanId),
      );
    }

    if (filters.businessId) {
      result = result.eq(
        "business_id",
        String(filters.businessId),
      );
    }

    if (filters.status) {
      result = result.eq(
        "status",
        filters.status,
      );
    }

    result = this.applyDateRange(
      result,
      "next_review_date",
      filters.nextReviewDateRange,
    );

    result = this.applyDateRange(
      result,
      "updated_at",
      filters.updatedDateRange,
    );

    return result;
  }

  private applyRegistryFilters(
    query: any,
    filters: {
      category?: RegistryItem["category"];
      requirementLevel?: RegistryItem["requirementLevel"];
      verified?: boolean;
      status?: string;
      expirationDateRange?: RepositoryDateRange;
      updatedDateRange?: RepositoryDateRange;
      includeArchived?: boolean;
    },
  ): any {
    let result = query;

    if (filters.category) {
      result = result.eq(
        "category",
        filters.category,
      );
    }

    if (filters.requirementLevel) {
      result = result.eq(
        "requirement_level",
        filters.requirementLevel,
      );
    }

    if (
      filters.verified !== undefined
    ) {
      result = result.eq(
        "verified",
        filters.verified,
      );
    }

    if (filters.status) {
      result = result.eq(
        "status",
        filters.status,
      );
    }

    if (!filters.includeArchived) {
      result = result.is(
        "archived_at",
        null,
      );
    }

    result = this.applyDateRange(
      result,
      "expiration_date",
      filters.expirationDateRange,
    );

    result = this.applyDateRange(
      result,
      "updated_at",
      filters.updatedDateRange,
    );

    return result;
  }

  private applyCommunicationFilters(
    query: any,
    filters: CommunicationMessageFilters,
  ): any {
    let result = query;

    if (filters.businessId) {
      result = result.eq(
        "business_id",
        String(filters.businessId),
      );
    }

    if (filters.recipientId) {
      result = result.eq(
        "recipient_id",
        filters.recipientId,
      );
    }

    if (filters.recipientRole) {
      result = result.eq(
        "recipient_role",
        filters.recipientRole,
      );
    }

    if (filters.channel) {
      result = result.eq(
        "channel",
        filters.channel,
      );
    }

    if (filters.priority) {
      result = result.eq(
        "priority",
        filters.priority,
      );
    }

    if (filters.status) {
      result = result.eq(
        "status",
        filters.status,
      );
    }

    result = this.applyDateRange(
      result,
      "scheduled_for",
      filters.scheduledDateRange,
    );

    result = this.applyDateRange(
      result,
      "created_at",
      filters.createdDateRange,
    );

    return result;
  }

  private applyGrowthMetricFilters(
    query: any,
    filters: GrowthMetricFilters,
  ): any {
    let result = query;

    if (filters.businessId) {
      result = result.eq(
        "business_id",
        String(filters.businessId),
      );
    }

    if (filters.type) {
      result = result.eq(
        "metric_type",
        filters.type,
      );
    }

    if (
      filters.quarter !== undefined
    ) {
      result = result.eq(
        "quarter",
        filters.quarter,
      );
    }

    result = this.applyDateRange(
      result,
      "period_end",
      filters.periodDateRange,
    );

    result = this.applyDateRange(
      result,
      "created_at",
      filters.createdDateRange,
    );

    return result;
  }

  private applyCoachMeetingFilters(
    query: any,
    filters: CoachMeetingFilters,
  ): any {
    let result = query;

    if (filters.businessId) {
      result = result.eq(
        "business_id",
        String(filters.businessId),
      );
    }

    if (filters.coachId) {
      result = result.eq(
        "coach_id",
        filters.coachId,
      );
    }

    if (
      filters.attended !== undefined
    ) {
      result = result.eq(
        "attended",
        filters.attended,
      );
    }

    result = this.applyDateRange(
      result,
      "meeting_date",
      filters.meetingDateRange,
    );

    result = this.applyDateRange(
      result,
      "created_at",
      filters.createdDateRange,
    );

    return result;
  }

  private applyGrowthMilestoneFilters(
    query: any,
    filters: GrowthMilestoneFilters,
  ): any {
    let result = query;

    if (filters.businessId) {
      result = result.eq(
        "business_id",
        String(filters.businessId),
      );
    }

    if (filters.status) {
      result = result.eq(
        "status",
        filters.status,
      );
    }

    if (filters.targetMetric) {
      result = result.eq(
        "target_metric",
        filters.targetMetric,
      );
    }

    result = this.applyDateRange(
      result,
      "target_date",
      filters.targetDateRange,
    );

    result = this.applyDateRange(
      result,
      "created_at",
      filters.createdDateRange,
    );

    return result;
  }

  private applyDateRange(
    query: any,
    column: string,
    range?: RepositoryDateRange,
  ): any {
    let result = query;

    if (range?.from) {
      result = result.gte(
        column,
        range.from,
      );
    }

    if (range?.to) {
      result = result.lte(
        column,
        range.to,
      );
    }

    return result;
  }

  /**
   * ============================================================
   * GENERIC SUPABASE OPERATIONS
   * ============================================================
   */
  private async insertPayloadRow<T>(
    table: string,
    row: Record<string, unknown>,
    operation: string,
    repository: string,
  ): Promise<T> {
    try {
      const { data, error } =
        await this.supabase
          .from(table)
          .insert(row)
          .select("*")
          .single();

      this.throwIfError(
        error,
        operation,
        repository,
      );

      return this.readPayload<T>(
        data,
        operation,
        repository,
      );
    } catch (error) {
      throw this.toRepositoryError(
        error,
        operation,
        repository,
      );
    }
  }

  private async insertPayloadRows<T>(
    table: string,
    rows: Record<string, unknown>[],
    operation: string,
    repository: string,
  ): Promise<T[]> {
    try {
      const { data, error } =
        await this.supabase
          .from(table)
          .insert(rows)
          .select("*");

      this.throwIfError(
        error,
        operation,
        repository,
      );

      return this.readPayloadArray<T>(
        data,
        operation,
        repository,
      );
    } catch (error) {
      throw this.toRepositoryError(
        error,
        operation,
        repository,
      );
    }
  }

  private async upsertPayloadRow<T>(
    table: string,
    row: Record<string, unknown>,
    operation: string,
    repository: string,
  ): Promise<T> {
    try {
      const { data, error } =
        await this.supabase
          .from(table)
          .upsert(row, {
            onConflict: "id",
          })
          .select("*")
          .single();

      this.throwIfError(
        error,
        operation,
        repository,
      );

      return this.readPayload<T>(
        data,
        operation,
        repository,
      );
    } catch (error) {
      throw this.toRepositoryError(
        error,
        operation,
        repository,
      );
    }
  }

  private async upsertPayloadRows<T>(
    table: string,
    rows: Record<string, unknown>[],
    operation: string,
    repository: string,
  ): Promise<T[]> {
    try {
      const { data, error } =
        await this.supabase
          .from(table)
          .upsert(rows, {
            onConflict: "id",
          })
          .select("*");

      this.throwIfError(
        error,
        operation,
        repository,
      );

      return this.readPayloadArray<T>(
        data,
        operation,
        repository,
      );
    } catch (error) {
      throw this.toRepositoryError(
        error,
        operation,
        repository,
      );
    }
  }

  private async findPayloadById<T>(
    table: string,
    id: string,
    operation: string,
    repository: string,
  ): Promise<T | null> {
    try {
      const { data, error } =
        await this.supabase
          .from(table)
          .select("*")
          .eq("id", id)
          .maybeSingle();

      this.throwIfError(
        error,
        operation,
        repository,
      );

      return data
        ? this.readPayload<T>(
            data,
            operation,
            repository,
          )
        : null;
    } catch (error) {
      throw this.toRepositoryError(
        error,
        operation,
        repository,
      );
    }
  }

  private async findSinglePayloadByColumn<T>(
    table: string,
    column: string,
    value: string,
    operation: string,
    repository: string,
  ): Promise<T | null> {
    try {
      const { data, error } =
        await this.supabase
          .from(table)
          .select("*")
          .eq(column, value)
          .order("updated_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      this.throwIfError(
        error,
        operation,
        repository,
      );

      return data
        ? this.readPayload<T>(
            data,
            operation,
            repository,
          )
        : null;
    } catch (error) {
      throw this.toRepositoryError(
        error,
        operation,
        repository,
      );
    }
  }

  private async listPayloadRows<T>(input: {
    table: string;
    repository: string;
    operation: string;

    pagination?: RepositoryPagination;

    applyFilters?: (
      query: any,
    ) => any;
  }): Promise<RepositoryListResult<T>> {
    const { limit, offset } =
      this.normalizePagination(
        input.pagination,
      );

    try {
      let query = this.supabase
        .from(input.table)
        .select("*", {
          count: "exact",
        });

      if (input.applyFilters) {
        query =
          input.applyFilters(query);
      }

      const { data, error, count } =
        await query
          .order("created_at", {
            ascending: false,
          })
          .range(
            offset,
            offset + limit - 1,
          );

      this.throwIfError(
        error,
        input.operation,
        input.repository,
      );

      return {
        items:
          this.readPayloadArray<T>(
            data,
            input.operation,
            input.repository,
          ),

        total: count ?? 0,

        limit,
        offset,
      };
    } catch (error) {
      throw this.toRepositoryError(
        error,
        input.operation,
        input.repository,
      );
    }
  }

  /**
   * ============================================================
   * ERROR AND PAYLOAD HELPERS
   * ============================================================
   */
  private throwIfError(
    error: PostgrestError | null,
    operation: string,
    repository: string,
  ): void {
    if (!error) {
      return;
    }

    throw new RepositoryError({
      message:
        `${repository}.${operation} failed: ${error.message}`,

      operation,
      repository,
      cause: error,
    });
  }

  private toRepositoryError(
    error: unknown,
    operation: string,
    repository: string,
  ): RepositoryError {
    if (
      error instanceof RepositoryError
    ) {
      return error;
    }

    return new RepositoryError({
      message:
        error instanceof Error
          ? `${repository}.${operation} failed: ${error.message}`
          : `${repository}.${operation} failed.`,

      operation,
      repository,
      cause: error,
    });
  }

  private readPayload<T>(
    row: unknown,
    operation: string,
    repository: string,
  ): T {
    if (
      typeof row !== "object" ||
      row === null
    ) {
      throw new RepositoryError({
        message:
          `${repository}.${operation} returned an invalid database row.`,

        operation,
        repository,
        cause: row,
      });
    }

    const payload = (
      row as Record<string, unknown>
    ).payload;

    if (
      typeof payload !== "object" ||
      payload === null
    ) {
      throw new RepositoryError({
        message:
          `${repository}.${operation} returned a row without a valid payload.`,

        operation,
        repository,
        cause: row,
      });
    }

    return this.clone(
      payload as T,
    );
  }

  private readPayloadArray<T>(
    rows: unknown,
    operation: string,
    repository: string,
  ): T[] {
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows.map((row) =>
      this.readPayload<T>(
        row,
        operation,
        repository,
      ),
    );
  }

  private normalizePagination(
    pagination?: RepositoryPagination,
  ): {
    limit: number;
    offset: number;
  } {
    const requestedLimit =
      pagination?.limit ?? 50;

    const requestedOffset =
      pagination?.offset ?? 0;

    const limit = Math.min(
      10_000,
      Math.max(
        1,
        Math.trunc(requestedLimit),
      ),
    );

    const offset = Math.max(
      0,
      Math.trunc(requestedOffset),
    );

    return {
      limit,
      offset,
    };
  }

  private generateTransactionId(): string {
    const cryptoObject =
      globalThis.crypto;

    if (
      cryptoObject &&
      typeof cryptoObject.randomUUID ===
        "function"
    ) {
      return cryptoObject.randomUUID();
    }

    return `EOS-TX-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()}`;
  }

  private clone<T>(
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