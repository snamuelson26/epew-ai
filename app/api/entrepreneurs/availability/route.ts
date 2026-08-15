import { NextRequest, NextResponse } from "next/server";
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
        .in("status", ["collecting", "submitted", "matching", "matched"])
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

    return NextResponse.json({
      success: true,
      message:
        "Your availability has been submitted. EPEW will now compare it privately with your Personal Coach's schedule.",
      availabilityId,
      status: "submitted",
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
