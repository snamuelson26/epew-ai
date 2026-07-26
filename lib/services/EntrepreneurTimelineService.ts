// =======================================================
// EPEW – EDE – IBOS
// Entrepreneur Timeline Engine
//
// Permanent chronological history of every entrepreneur.
//
// Lifecycle events should be recorded through the
// EntrepreneurLifecycleOrchestrator.
// =======================================================

import type { SupabaseClient } from "@supabase/supabase-js";

// =======================================================
// Official Timeline Event Types
// =======================================================

export type EntrepreneurTimelineEventType =
  | "application_submitted"
  | "qualification_started"
  | "qualified"
  | "qualification_rejected"
  | "coach_assigned"
  | "coach_reassigned"
  | "first_contact_due"
  | "first_contact_completed"
  | "interview_scheduled"
  | "interview_completed"
  | "business_plan_started"
  | "business_plan_completed"
  | "business_launch_ready"
  | "funding_eligibility_verified"
  | "funding_queue_entered"
  | "funding_queue_position_updated"
  | "fully_funded_non_queue_confirmed"
  | "funding_approved"
  | "funding_declined"
  | "vendor_payment_started"
  | "vendor_payment_completed"
  | "business_ready_verified"
  | "business_launched"
  | "grand_opening_completed"
  | "annual_meeting_registered"
  | "annual_meeting_attended"
  | "certificate_issued"
  | "quarterly_report_submitted"
  | "compliance_warning"
  | "compliance_restored"
  | "business_paused"
  | "business_closed"
  | "note_added";

// =======================================================
// Event Sources
// =======================================================

export type EntrepreneurTimelineSource =
  | "EntrepreneurLifecycleOrchestrator"
  | "QualificationWorkflowService"
  | "AutomaticCoachAssignmentService"
  | "CoachAssignmentService"
  | "InterviewSchedulingService"
  | "BusinessLaunchService"
  | "FundingQueueService"
  | "FundingService"
  | "ComplianceService"
  | "CertificateService"
  | "AnnualMeetingService"
  | "AdminPortal"
  | "EntrepreneurPortal"
  | "CoachPortal"
  | "System";

// =======================================================
// Timeline Record
// =======================================================

export interface EntrepreneurTimelineEvent {
  id: string;

  entrepreneurId: string;

  eventType: EntrepreneurTimelineEventType;

  eventTitle: string;

  eventDescription: string | null;

  lifecycleStage: string | null;

  performedBy: string | null;

  source: EntrepreneurTimelineSource | string;

  metadata: Record<string, unknown>;

  createdAt: string;
}

// =======================================================
// Create Event Request
// =======================================================

export interface RecordTimelineEventRequest {
  entrepreneurId: string;

  eventType: EntrepreneurTimelineEventType;

  eventTitle: string;

  eventDescription?: string | null;

  lifecycleStage?: string | null;

  performedBy?: string | null;

  source?: EntrepreneurTimelineSource | string;

  metadata?: Record<string, unknown>;
}

// =======================================================
// Timeline Query Options
// =======================================================

export interface TimelineQueryOptions {
  eventType?: EntrepreneurTimelineEventType;

  startDate?: string;

  endDate?: string;

  limit?: number;

  ascending?: boolean;
}

// =======================================================
// Entrepreneur Timeline Service
// =======================================================

export class EntrepreneurTimelineService {
  constructor(
    private readonly supabase: SupabaseClient
  ) {}

  // =====================================================
  // Record Timeline Event
  // =====================================================

  async recordEvent(
    request: RecordTimelineEventRequest
  ): Promise<EntrepreneurTimelineEvent> {
    const entrepreneurId =
      request.entrepreneurId?.trim();

    if (!entrepreneurId) {
      throw new Error(
        "Entrepreneur ID is required to record a timeline event."
      );
    }

    if (!request.eventType) {
      throw new Error(
        "Timeline event type is required."
      );
    }

    const eventTitle =
      request.eventTitle?.trim();

    if (!eventTitle) {
      throw new Error(
        "Timeline event title is required."
      );
    }

    const { data, error } = await this.supabase
      .from("entrepreneur_timeline")
      .insert({
        entrepreneur_id:
          entrepreneurId,

        event_type:
          request.eventType,

        event_title:
          eventTitle,

        event_description:
          request.eventDescription?.trim() ||
          null,

        lifecycle_stage:
          request.lifecycleStage?.trim() ||
          null,

        performed_by:
          request.performedBy?.trim() ||
          "EntrepreneurLifecycleOrchestrator",

        source:
          request.source ||
          "EntrepreneurLifecycleOrchestrator",

        metadata:
          request.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Unable to record entrepreneur timeline event: ${error.message}`
      );
    }

    if (!data) {
      throw new Error(
        "Timeline event insert did not return a record."
      );
    }

    return this.mapTimelineEvent(data);
  }

  // =====================================================
  // Get Complete Entrepreneur Timeline
  // =====================================================

  async getTimeline(
    entrepreneurId: string,
    options: TimelineQueryOptions = {}
  ): Promise<EntrepreneurTimelineEvent[]> {
    const normalizedEntrepreneurId =
      entrepreneurId?.trim();

    if (!normalizedEntrepreneurId) {
      throw new Error(
        "Entrepreneur ID is required to retrieve the timeline."
      );
    }

    const ascending =
      options.ascending ?? false;

    const limit = Math.min(
      Math.max(options.limit ?? 100, 1),
      500
    );

    let query = this.supabase
      .from("entrepreneur_timeline")
      .select("*")
      .eq(
        "entrepreneur_id",
        normalizedEntrepreneurId
      );

    if (options.eventType) {
      query = query.eq(
        "event_type",
        options.eventType
      );
    }

    if (options.startDate) {
      query = query.gte(
        "created_at",
        options.startDate
      );
    }

    if (options.endDate) {
      query = query.lte(
        "created_at",
        options.endDate
      );
    }

    const { data, error } = await query
      .order("created_at", {
        ascending,
      })
      .limit(limit);

    if (error) {
      throw new Error(
        `Unable to retrieve entrepreneur timeline: ${error.message}`
      );
    }

    return (data ?? []).map((row) =>
      this.mapTimelineEvent(row)
    );
  }

  // =====================================================
  // Get Latest Timeline Event
  // =====================================================

  async getLatestEvent(
    entrepreneurId: string
  ): Promise<EntrepreneurTimelineEvent | null> {
    const normalizedEntrepreneurId =
      entrepreneurId?.trim();

    if (!normalizedEntrepreneurId) {
      throw new Error(
        "Entrepreneur ID is required to retrieve the latest event."
      );
    }

    const { data, error } = await this.supabase
      .from("entrepreneur_timeline")
      .select("*")
      .eq(
        "entrepreneur_id",
        normalizedEntrepreneurId
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to retrieve the latest timeline event: ${error.message}`
      );
    }

    return data
      ? this.mapTimelineEvent(data)
      : null;
  }

  // =====================================================
  // Get Events by Type
  // =====================================================

  async getEventsByType(
    entrepreneurId: string,
    eventType: EntrepreneurTimelineEventType,
    limit = 100
  ): Promise<EntrepreneurTimelineEvent[]> {
    return this.getTimeline(
      entrepreneurId,
      {
        eventType,
        limit,
        ascending: false,
      }
    );
  }

  // =====================================================
  // Check Whether Event Exists
  // =====================================================

  async hasEvent(
    entrepreneurId: string,
    eventType: EntrepreneurTimelineEventType
  ): Promise<boolean> {
    const normalizedEntrepreneurId =
      entrepreneurId?.trim();

    if (!normalizedEntrepreneurId) {
      throw new Error(
        "Entrepreneur ID is required to check timeline events."
      );
    }

    const { count, error } = await this.supabase
      .from("entrepreneur_timeline")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "entrepreneur_id",
        normalizedEntrepreneurId
      )
      .eq(
        "event_type",
        eventType
      );

    if (error) {
      throw new Error(
        `Unable to check entrepreneur timeline event: ${error.message}`
      );
    }

    return (count ?? 0) > 0;
  }

  // =====================================================
  // Get Latest Event by Type
  // =====================================================

  async getLatestEventByType(
    entrepreneurId: string,
    eventType: EntrepreneurTimelineEventType
  ): Promise<EntrepreneurTimelineEvent | null> {
    const normalizedEntrepreneurId =
      entrepreneurId?.trim();

    if (!normalizedEntrepreneurId) {
      throw new Error(
        "Entrepreneur ID is required to retrieve a timeline event."
      );
    }

    const { data, error } = await this.supabase
      .from("entrepreneur_timeline")
      .select("*")
      .eq(
        "entrepreneur_id",
        normalizedEntrepreneurId
      )
      .eq(
        "event_type",
        eventType
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to retrieve timeline event by type: ${error.message}`
      );
    }

    return data
      ? this.mapTimelineEvent(data)
      : null;
  }

  // =====================================================
  // Record Coach Assignment
  // Convenience method for orchestrator use
  // =====================================================

  async recordCoachAssigned(input: {
    entrepreneurId: string;
    coachId: string;
    coachName?: string | null;
    assignmentId: string;
    assignedAt?: string;
  }): Promise<EntrepreneurTimelineEvent> {
    return this.recordEvent({
      entrepreneurId:
        input.entrepreneurId,

      eventType:
        "coach_assigned",

      eventTitle:
        "Personal Coach Assigned",

      eventDescription:
        input.coachName
          ? `${input.coachName} was assigned as the entrepreneur's Personal Coach.`
          : "A Personal Coach was assigned to the entrepreneur.",

      lifecycleStage:
        "coach_assigned",

      performedBy:
        "EntrepreneurLifecycleOrchestrator",

      source:
        "AutomaticCoachAssignmentService",

      metadata: {
        coachId:
          input.coachId,

        coachName:
          input.coachName ?? null,

        assignmentId:
          input.assignmentId,

        assignedAt:
          input.assignedAt ??
          new Date().toISOString(),
      },
    });
  }

  // =====================================================
  // Record Funding Queue Entry
  // =====================================================

  async recordFundingQueueEntry(input: {
    entrepreneurId: string;
    queuePosition?: number | null;
    fundedUnits: number;
    requiredUnits?: number;
  }): Promise<EntrepreneurTimelineEvent> {
    const requiredUnits =
      input.requiredUnits ?? 20;

    return this.recordEvent({
      entrepreneurId:
        input.entrepreneurId,

      eventType:
        "funding_queue_entered",

      eventTitle:
        "Entered Funding Queue",

      eventDescription:
        "The entrepreneur entered the official EPEW Funding Queue.",

      lifecycleStage:
        "funding_queue",

      performedBy:
        "EntrepreneurLifecycleOrchestrator",

      source:
        "FundingQueueService",

      metadata: {
        queuePosition:
          input.queuePosition ?? null,

        fundedUnits:
          input.fundedUnits,

        requiredUnits,

        remainingUnits:
          Math.max(
            requiredUnits -
              input.fundedUnits,
            0
          ),

        fundingPath:
          "funding_queue",
      },
    });
  }

  // =====================================================
  // Record Fully Funded Non-Queue Path
  // =====================================================

  async recordFullyFundedNonQueue(input: {
    entrepreneurId: string;
    fundedUnits: number;
    requiredUnits?: number;
    confirmationId?: string | null;
  }): Promise<EntrepreneurTimelineEvent> {
    const requiredUnits =
      input.requiredUnits ?? 20;

    if (
      input.fundedUnits <
      requiredUnits
    ) {
      throw new Error(
        `The entrepreneur must have at least ${requiredUnits} funded annual units to enter the fully funded non-queue path.`
      );
    }

    return this.recordEvent({
      entrepreneurId:
        input.entrepreneurId,

      eventType:
        "fully_funded_non_queue_confirmed",

      eventTitle:
        "Fully Funded — Non-Queue Path",

      eventDescription:
        `All ${requiredUnits} annual support units have been funded. The entrepreneur does not enter the general Funding Queue.`,

      lifecycleStage:
        "fully_funded_non_queue",

      performedBy:
        "EntrepreneurLifecycleOrchestrator",

      source:
        "FundingService",

      metadata: {
        fundedUnits:
          input.fundedUnits,

        requiredUnits,

        confirmationId:
          input.confirmationId ?? null,

        fundingPath:
          "fully_funded_non_queue",

        queueRequired:
          false,
      },
    });
  }

  // =====================================================
  // Database Row Mapping
  // =====================================================

  private mapTimelineEvent(
    row: Record<string, any>
  ): EntrepreneurTimelineEvent {
    return {
      id:
        row.id,

      entrepreneurId:
        row.entrepreneur_id,

      eventType:
        row.event_type,

      eventTitle:
        row.event_title,

      eventDescription:
        row.event_description ?? null,

      lifecycleStage:
        row.lifecycle_stage ?? null,

      performedBy:
        row.performed_by ?? null,

      source:
        row.source ??
        "System",

      metadata:
        row.metadata &&
        typeof row.metadata === "object"
          ? row.metadata
          : {},

      createdAt:
        row.created_at,
    };
  }
}