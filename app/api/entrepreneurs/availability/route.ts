import { NextRequest, NextResponse } from "next/server";
import { PrivateAvailabilityMatchingService } from "@/lib/services/scheduling/PrivateAvailabilityMatchingService";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AvailabilityWindowInput = {
  availableDate?: string;
  availableFrom?: string;
  availableUntil?: string;
  isOvernight?: boolean;
  participantNote?: string | null;
};

type AvailabilityRequestBody = {
  applicationId?: number;
  windows?: AvailabilityWindowInput[];
  participantContextNotes?: string | null;
  workScheduleContext?: string | null;
  financialContextResponse?: string | null;
  financialContextLevel?:
    | "stable"
    | "somewhat_tight"
    | "difficult"
    | "very_difficult"
    | "prefer_not_to_answer"
    | null;
  personalContextConsent?: boolean;
  participantTimezone?: string | null;
};

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    let body: AvailabilityRequestBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "A valid availability request is required.",
        },
        { status: 400 }
      );
    }

    const applicationId = Number(body.applicationId);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid Application ID is required.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.windows) || body.windows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide at least one availability window.",
        },
        { status: 400 }
      );
    }

    const submittedDates = new Set(
      body.windows
        .map((window) => String(window.availableDate ?? "").trim())
        .filter(Boolean)
    );

    if (submittedDates.size > 3) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select no more than 3 days during the 7-day availability window.",
        },
        { status: 400 }
      );
    }

    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("entrepreneur_applications")
        .select("id, user_id, full_name, email, questionnaire_status")
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Entrepreneur application not found.",
        },
        { status: 404 }
      );
    }

    if (application.questionnaire_status !== "Completed") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please complete your Entrepreneur Questionnaire before choosing your availability.",
        },
        { status: 409 }
      );
    }

    const { data: assignment, error: assignmentError } =
      await supabaseAdmin
        .from("coach_assignments")
        .select("id, coach_id, assignment_status")
        .eq("application_id", applicationId)
        .not(
          "assignment_status",
          "in",
          '("ended","declined","reassigned","cancelled","inactive","reassignment_required","completed")'
        )
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (assignmentError) {
      throw assignmentError;
    }

    if (!assignment?.coach_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your Personal Coach assignment is still being prepared. Please try again shortly.",
        },
        { status: 409 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastAllowedDate = new Date(today);
    lastAllowedDate.setDate(lastAllowedDate.getDate() + 6);

    const normalizedWindows = body.windows.map((window, index) => {
      const availableDate = String(window.availableDate ?? "").trim();
      const availableFrom = String(window.availableFrom ?? "").trim();
      const availableUntil = String(window.availableUntil ?? "").trim();
      const isOvernight = Boolean(window.isOvernight);

      if (!isValidDate(availableDate)) {
        throw new Error(
          `Availability entry ${index + 1} has an invalid date.`
        );
      }

      if (!isValidTime(availableFrom) || !isValidTime(availableUntil)) {
        throw new Error(
          `Availability entry ${index + 1} has an invalid time.`
        );
      }

      const date = new Date(`${availableDate}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        throw new Error(
          `Availability entry ${index + 1} has an invalid date.`
        );
      }

      if (date < today || date > lastAllowedDate) {
        throw new Error(
          "Availability must be within the next 7 calendar days."
        );
      }

      if (!isOvernight && availableUntil <= availableFrom) {
        throw new Error(
          `Availability entry ${index + 1} must end after it starts unless it continues overnight.`
        );
      }

      if (isOvernight && availableUntil > availableFrom) {
        throw new Error(
          `Availability entry ${index + 1} is marked overnight, but the end time does not cross midnight.`
        );
      }

      return {
        available_date: availableDate,
        available_from: `${availableFrom}:00`,
        available_until: `${availableUntil}:00`,
        is_overnight: isOvernight,
        participant_note:
          window.participantNote?.trim() || null,
      };
    });

    const windowDates = normalizedWindows
      .map((window) => window.available_date)
      .sort();

    const windowStartDate = windowDates[0];
    const windowEndDate = windowDates[windowDates.length - 1];

    const allowedFinancialLevels = new Set([
      "stable",
      "somewhat_tight",
      "difficult",
      "very_difficult",
      "prefer_not_to_answer",
    ]);

    const financialContextLevel =
      body.financialContextLevel &&
      allowedFinancialLevels.has(body.financialContextLevel)
        ? body.financialContextLevel
        : null;

    const participantTimezone =
      body.participantTimezone?.trim() || "America/New_York";

    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: participantTimezone,
      }).format(new Date());
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The selected timezone is invalid.",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data: existingAvailability, error: existingError } =
      await supabaseAdmin
        .from("epew_participant_availability")
        .select("id, status")
        .eq("application_id", applicationId)
        .eq("meeting_type", "entrepreneur_first_meeting")
        .in("status", [
          "collecting",
          "submitted",
          "matching",
          "scheduling_review",
          "manual_review_required",
          "matched",
        ])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let availabilityId: string;

    if (existingAvailability) {
      availabilityId = existingAvailability.id;

      const { error: availabilityUpdateError } =
        await supabaseAdmin
          .from("epew_participant_availability")
          .update({
            participant_name: application.full_name,
            participant_email: application.email,
            coach_assignment_id: assignment.id,
            coach_id: assignment.coach_id,
            window_start_date: windowStartDate,
            window_end_date: windowEndDate,
            status: "submitted",
            participant_context_notes:
              body.participantContextNotes?.trim() || null,
            work_schedule_context:
              body.workScheduleContext?.trim() || null,
            financial_context_response:
              body.financialContextResponse?.trim() || null,
            financial_context_level: financialContextLevel,
            personal_context_consent:
              Boolean(body.personalContextConsent),
            participant_timezone: participantTimezone,
            submitted_at: now,
            matched_at: null,
            scheduling_review_started_at: null,
            scheduling_review_eligible_at: null,
            scheduling_review_deadline_at: null,
            scheduling_review_completed_at: null,
          })
          .eq("id", availabilityId);

      if (availabilityUpdateError) {
        throw availabilityUpdateError;
      }

      const { error: deleteWindowsError } =
        await supabaseAdmin
          .from("epew_participant_availability_windows")
          .delete()
          .eq("availability_id", availabilityId);

      if (deleteWindowsError) {
        throw deleteWindowsError;
      }

      const { error: clearMatchesError } =
        await supabaseAdmin
          .from("epew_private_schedule_matches")
          .delete()
          .eq("availability_id", availabilityId)
          .in("status", ["available", "expired", "withdrawn", "conflict"]);

      if (clearMatchesError) {
        throw clearMatchesError;
      }
    } else {
      const { data: createdAvailability, error: createAvailabilityError } =
        await supabaseAdmin
          .from("epew_participant_availability")
          .insert({
            application_id: applicationId,
            participant_user_id: user.id,
            participant_type: "entrepreneur",
            participant_name: application.full_name,
            participant_email: application.email,
            meeting_type: "entrepreneur_first_meeting",
            coach_assignment_id: assignment.id,
            coach_id: assignment.coach_id,
            window_start_date: windowStartDate,
            window_end_date: windowEndDate,
            status: "submitted",
            participant_context_notes:
              body.participantContextNotes?.trim() || null,
            work_schedule_context:
              body.workScheduleContext?.trim() || null,
            financial_context_response:
              body.financialContextResponse?.trim() || null,
            financial_context_level: financialContextLevel,
            personal_context_consent:
              Boolean(body.personalContextConsent),
            participant_timezone: participantTimezone,
            submitted_at: now,
          })
          .select("id")
          .single();

      if (createAvailabilityError) {
        throw createAvailabilityError;
      }

      availabilityId = createdAvailability.id;
    }

    const { error: windowInsertError } =
      await supabaseAdmin
        .from("epew_participant_availability_windows")
        .insert(
          normalizedWindows.map((window) => ({
            availability_id: availabilityId,
            ...window,
          }))
        );

    if (windowInsertError) {
      throw windowInsertError;
    }

    const responseTimestamp = new Date().toISOString();

    const { error: recoveryUpdateError } = await supabaseAdmin
      .from("epew_no_show_recovery_cases")
      .update({
        status: "responded",
        next_required_action: "select_matching_time",
        updated_at: responseTimestamp,
      })
      .eq("application_id", applicationId)
      .eq("status", "active");

    if (recoveryUpdateError) {
      console.error(
        "Unable to stop active no-show recovery countdown:",
        recoveryUpdateError
      );
    }

    const { error: reminderCancelError } = await supabaseAdmin
      .from("epew_communication_outbox")
      .update({
        status: "cancelled",
        updated_at: responseTimestamp,
      })
      .eq("application_id", applicationId)
      .eq("status", "pending")
      .in("message_type", [
        "establishment_meeting_recovery_reminder",
        "application_closed_due_to_inactivity",
      ]);

    if (reminderCancelError) {
      console.error(
        "Unable to cancel pending no-show reminders:",
        reminderCancelError
      );
    }

    const { error: historyError } =
      await supabaseAdmin
        .from("epew_operational_history")
        .insert({
          application_id: applicationId,
          entrepreneur_user_id: user.id,

          event_type: "availability_submission",
          event_name: "Establishment Meeting Availability Submitted",
          event_description:
            "Entrepreneur submitted availability for private EMCC matching with the assigned Personal Coach.",

          previous_status: null,
          new_status: "availability_submitted",

          occurred_at: now,

          actor_user_id: user.id,
          actor_role: "entrepreneur",
          actor_type: "participant",
          actor_name: application.full_name,

          decision_made_by_user_id: user.id,
          decision_made_by_role: "entrepreneur",
          decision_made_by_type: "participant",
          decision_made_by_name: application.full_name,
          decision_organization: "EPEW",
          decision_reason:
            "Participant selected preferred availability for the Establishment Meeting.",
          decision_at: now,

          executed_by: "EMCC Availability API",
          recorded_by: "EPEW EDE / IBOS",
          source_system: "EMCC Scheduling Engine",
          communication_channel: "web",

          reference_type: "participant_availability",
          reference_id: availabilityId,

          metadata: {
            meetingType: "entrepreneur_first_meeting",
            coachAssignmentId: assignment.id,
            coachId: assignment.coach_id,
            availabilityWindowCount: normalizedWindows.length,
            windowStartDate,
            windowEndDate,
            personalContextConsent:
              Boolean(body.personalContextConsent),
            participantTimezone,
          },
        });

    if (historyError) {
      console.error(
        "Operational history write failed after availability submission:",
        historyError
      );
    }

    const matchingResult =
      await PrivateAvailabilityMatchingService.matchAvailability(
        availabilityId
      );

    const { data: appointmentChoices, error: appointmentChoicesError } =
      await supabaseAdmin
        .from("epew_private_schedule_matches")
        .select(
          "id, proposed_start_at, reserved_until, reservation_minutes"
        )
        .eq("availability_id", availabilityId)
        .eq("status", "available")
        .eq("exposed_to_participant", true)
        .order("proposed_start_at", { ascending: true })
        .limit(12);

    if (appointmentChoicesError) {
      throw appointmentChoicesError;
    }

    return NextResponse.json({
      success: true,
      message:
        matchingResult.matchCount > 0
          ? "Your availability has been matched with your Personal Coach's private schedule."
          : matchingResult.status === "scheduling_review"
            ? "We’re finding the best appointment for you. Please allow approximately 5–15 minutes while EPEW privately reviews compatible Personal Coach availability."
            : "Your availability has been submitted.",
      availabilityId,
      status: matchingResult.status,
      matchCount: matchingResult.matchCount,
      appointmentChoices: appointmentChoices ?? [],
      windowStartDate,
      windowEndDate,
      windowCount: normalizedWindows.length,
    });
  } catch (error) {
    console.error("Entrepreneur availability API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to save your availability.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const applicationId = Number(
      request.nextUrl.searchParams.get("applicationId")
    );

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid Application ID is required.",
        },
        { status: 400 }
      );
    }

    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("entrepreneur_applications")
        .select("id, user_id")
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Entrepreneur application not found.",
        },
        { status: 404 }
      );
    }

    const { data: availability, error: availabilityError } =
      await supabaseAdmin
        .from("epew_participant_availability")
        .select(
          `
          id,
          status,
          scheduling_review_started_at,
          scheduling_review_eligible_at,
          scheduling_review_deadline_at,
          scheduling_review_completed_at
        `
        )
        .eq("application_id", applicationId)
        .eq("meeting_type", "entrepreneur_first_meeting")
        .in("status", [
          "submitted",
          "matching",
          "scheduling_review",
          "manual_review_required",
          "matched",
          "scheduled"
        ])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (availabilityError) {
      throw availabilityError;
    }

    if (!availability) {
      return NextResponse.json(
        {
          success: true,
          status: "not_submitted",
          matchCount: 0,
          appointmentChoices: [],
        }
      );
    }

    let currentStatus = availability.status;

    if (currentStatus === "scheduling_review") {
      const currentTime = Date.now();

      const eligibleAt = availability.scheduling_review_eligible_at
        ? new Date(
            availability.scheduling_review_eligible_at
          ).getTime()
        : null;

      const deadlineAt = availability.scheduling_review_deadline_at
        ? new Date(
            availability.scheduling_review_deadline_at
          ).getTime()
        : null;

      if (
        deadlineAt !== null &&
        currentTime >= deadlineAt
      ) {
        const completedAt = new Date().toISOString();

        const { error: manualReviewError } =
          await supabaseAdmin
            .from("epew_participant_availability")
            .update({
              status: "manual_review_required",
              scheduling_review_completed_at: completedAt,
              updated_at: completedAt,
            })
            .eq("id", availability.id)
            .eq("status", "scheduling_review");

        if (manualReviewError) {
          throw manualReviewError;
        }

        const { error: manualReviewHistoryError } =
          await supabaseAdmin
            .from("epew_operational_history")
            .insert({
              application_id: applicationId,
              event_type:
                "manual_scheduling_review_required",
              event_name:
                "Manual Scheduling Review Required",
              event_description:
                "The automated 5–15 minute Scheduling Review completed without finding a compatible appointment. The entrepreneur's submitted availability remains active for EPEW follow-up.",
              previous_status:
                "scheduling_review",
              new_status:
                "manual_review_required",
              occurred_at: completedAt,

              actor_role: "system",
              actor_type: "automation",
              actor_name:
                "EMCC Scheduling Review Engine",

              decision_made_by_role: "system",
              decision_made_by_type: "automation",
              decision_made_by_name:
                "EMCC Scheduling Review Engine",
              decision_organization: "EPEW",
              decision_reason:
                "No compatible appointment was found within the automated Scheduling Review period.",
              decision_at: completedAt,

              executed_by:
                "EMCC Scheduling Review Engine",
              recorded_by: "EPEW EDE / IBOS",
              source_system:
                "EMCC Scheduling Engine",
              communication_channel: "system",

              reference_type:
                "participant_availability",
              reference_id: availability.id,

              metadata: {
                schedulingReviewStartedAt:
                  availability.scheduling_review_started_at,
                schedulingReviewEligibleAt:
                  availability.scheduling_review_eligible_at,
                schedulingReviewDeadlineAt:
                  availability.scheduling_review_deadline_at,
                schedulingReviewCompletedAt:
                  completedAt,
                automatedReviewResult:
                  "no_compatible_appointment",
                participantResubmissionRequired:
                  false,
              },
            });

        if (manualReviewHistoryError) {
          console.error(
            "Unable to record manual Scheduling Review history:",
            manualReviewHistoryError
          );
        }

        currentStatus = "manual_review_required";
      } else if (
        eligibleAt !== null &&
        currentTime >= eligibleAt
      ) {
        const reviewResult =
          await PrivateAvailabilityMatchingService.matchAvailability(
            availability.id,
            { runSchedulingReview: true }
          );

        currentStatus = reviewResult.status;
      }
    }

    const { data: appointmentChoices, error: appointmentChoicesError } =
      await supabaseAdmin
        .from("epew_private_schedule_matches")
        .select(
          "id, proposed_start_at, reserved_until, reservation_minutes"
        )
        .eq("availability_id", availability.id)
        .eq("status", "available")
        .eq("exposed_to_participant", true)
        .order("proposed_start_at", { ascending: true })
        .limit(12);

    if (appointmentChoicesError) {
      throw appointmentChoicesError;
    }

    const matchCount = appointmentChoices?.length ?? 0;

    return NextResponse.json({
      success: true,
      availabilityId: availability.id,
      status:
        matchCount > 0
          ? "matched"
          : currentStatus,
      matchCount,
      appointmentChoices: appointmentChoices ?? [],
      schedulingReview: {
        startedAt: availability.scheduling_review_started_at,
        eligibleAt: availability.scheduling_review_eligible_at,
        deadlineAt: availability.scheduling_review_deadline_at,
        completedAt: availability.scheduling_review_completed_at,
      },
    });
  } catch (error) {
    console.error("Entrepreneur availability status API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to check scheduling status.",
      },
      { status: 500 }
    );
  }
}
