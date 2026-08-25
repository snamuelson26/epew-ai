import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PrivateAvailabilityMatchingService } from "@/lib/services/scheduling/PrivateAvailabilityMatchingService";

type SupportedLanguage = "en" | "ht" | "es" | "fr";

type ParsedAvailabilityWindow = {
  availableDate: string;
  availableFrom: string;
  availableUntil: string;
  isOvernight: boolean;
};

type PhoneAvailabilityResult =
  | {
      success: true;
      status: "matched";
      availabilityId: string;
      windows: ParsedAvailabilityWindow[];
      choices: Array<{
        id: string;
        proposedStartAt: string;
        reservedUntil: string;
        reservationMinutes: number;
      }>;
    }
  | {
      success: true;
      status: "scheduling_review";
      availabilityId: string;
      windows: ParsedAvailabilityWindow[];
      choices: [];
    }
  | {
      success: false;
      status: "needs_clarification";
      message: string;
    };

const PARTICIPANT_TIMEZONE = "America/New_York";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function dateOnlyInTimezone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addCalendarDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function clarificationMessage(language: SupportedLanguage) {
  switch (language) {
    case "ht":
      return "Mwen bezwen yon ti plis presizyon. Tanpri di m jou a ak lè ou disponib. Pa egzanp: madi ant de zè ak senkè nan apremidi.";
    case "es":
      return "Necesito un poco más de precisión. Por favor, dígame el día y el horario en que está disponible. Por ejemplo: martes entre las dos y las cinco de la tarde.";
    case "fr":
      return "J'ai besoin d'un peu plus de précision. Dites-moi le jour et les heures où vous êtes disponible. Par exemple : mardi entre quatorze heures et dix-sept heures.";
    default:
      return "I need a little more information. Please tell me the day and time range when you are available. For example: Tuesday between 2 PM and 5 PM.";
  }
}

async function parseAvailability(
  spokenAvailability: string,
  language: SupportedLanguage
): Promise<ParsedAvailabilityWindow[] | null> {
  const today = dateOnlyInTimezone(
    new Date(),
    PARTICIPANT_TIMEZONE
  );

  const lastAllowedDate = addCalendarDays(today, 6);

  const client = getOpenAIClient();

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          `You convert spoken appointment availability into structured calendar windows.

The caller may speak English, Haitian Creole, Spanish, or French.

Current timezone: ${PARTICIPANT_TIMEZONE}
Today: ${today}
Last allowed date: ${lastAllowedDate}

Rules:
- Return only availability explicitly supported by what the caller said.
- Never invent a day or time.
- Resolve relative expressions such as tomorrow, Tuesday, next Friday, morning, afternoon, and evening using the dates above.
- Every window must be within ${today} through ${lastAllowedDate}, inclusive.
- Maximum 3 calendar days.
- A usable window must be at least 60 minutes.
- Use 24-hour HH:MM format.
- If the caller provides one exact appointment time instead of a range, create a 60-minute window beginning at that exact time.
- If the statement is too ambiguous to safely determine both a date and time, return needsClarification=true.
- Do not translate names or add facts.`,
      },
      {
        role: "user",
        content:
          `Language: ${language}
Spoken availability: ${spokenAvailability}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "phone_availability",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            needsClarification: {
              type: "boolean",
            },
            windows: {
              type: "array",
              maxItems: 3,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  availableDate: {
                    type: "string",
                  },
                  availableFrom: {
                    type: "string",
                  },
                  availableUntil: {
                    type: "string",
                  },
                  isOvernight: {
                    type: "boolean",
                  },
                },
                required: [
                  "availableDate",
                  "availableFrom",
                  "availableUntil",
                  "isOvernight",
                ],
              },
            },
          },
          required: [
            "needsClarification",
            "windows",
          ],
        },
      },
    },
  });

  const raw = response.output_text?.trim();

  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw) as {
    needsClarification: boolean;
    windows: ParsedAvailabilityWindow[];
  };

  if (
    parsed.needsClarification ||
    !Array.isArray(parsed.windows) ||
    parsed.windows.length === 0
  ) {
    return null;
  }

  const normalized = parsed.windows
    .slice(0, 3)
    .filter((window) => {
      if (!isValidDate(window.availableDate)) {
        return false;
      }

      if (
        !isValidTime(window.availableFrom) ||
        !isValidTime(window.availableUntil)
      ) {
        return false;
      }

      if (
        window.availableDate < today ||
        window.availableDate > lastAllowedDate
      ) {
        return false;
      }

      if (
        !window.isOvernight &&
        window.availableUntil <= window.availableFrom
      ) {
        return false;
      }

      return true;
    });

  return normalized.length > 0 ? normalized : null;
}

export class PhoneAvailabilitySchedulingService {
  static async submitAvailability(params: {
    applicationId: number;
    spokenAvailability: string;
    language: SupportedLanguage;
    callSid?: string | null;
  }): Promise<PhoneAvailabilityResult> {
    const {
      applicationId,
      spokenAvailability,
      language,
      callSid,
    } = params;

    const windows = await parseAvailability(
      spokenAvailability,
      language
    );

    if (!windows) {
      return {
        success: false,
        status: "needs_clarification",
        message: clarificationMessage(language),
      };
    }

    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .from("entrepreneur_applications")
      .select(
        "id, user_id, full_name, email, questionnaire_status"
      )
      .eq("id", applicationId)
      .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    if (!application) {
      throw new Error(
        "Entrepreneur application not found."
      );
    }

    if (application.questionnaire_status !== "Completed") {
      throw new Error(
        "Entrepreneur Questionnaire must be completed before scheduling."
      );
    }

    const {
      data: assignment,
      error: assignmentError,
    } = await supabaseAdmin
      .from("coach_assignments")
      .select(
        "id, coach_id, assignment_status"
      )
      .eq("application_id", applicationId)
      .not(
        "assignment_status",
        "in",
        '("ended","declined","reassigned","cancelled","inactive","reassignment_required","completed")'
      )
      .order("assigned_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (assignmentError) {
      throw assignmentError;
    }

    if (!assignment?.coach_id) {
      throw new Error(
        "Personal Coach assignment is not ready."
      );
    }

    const normalizedWindows = windows.map(
      (window) => ({
        available_date: window.availableDate,
        available_from: `${window.availableFrom}:00`,
        available_until: `${window.availableUntil}:00`,
        is_overnight: window.isOvernight,
        participant_note:
          `Submitted by phone${callSid ? ` — ${callSid}` : ""}`,
      })
    );

    const windowDates = normalizedWindows
      .map((window) => window.available_date)
      .sort();

    const windowStartDate = windowDates[0];
    const windowEndDate =
      windowDates[windowDates.length - 1];

    const now = new Date().toISOString();

    const {
      data: existingAvailability,
      error: existingError,
    } = await supabaseAdmin
      .from("epew_participant_availability")
      .select("id, status")
      .eq("application_id", applicationId)
      .eq(
        "meeting_type",
        "entrepreneur_first_meeting"
      )
      .in("status", [
        "collecting",
        "submitted",
        "matching",
        "scheduling_review",
        "manual_review_required",
        "matched",
      ])
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let availabilityId: string;

    if (existingAvailability) {
      availabilityId = existingAvailability.id;

      const {
        error: availabilityUpdateError,
      } = await supabaseAdmin
        .from("epew_participant_availability")
        .update({
          participant_user_id:
            application.user_id ?? null,
          participant_type: "entrepreneur",
          participant_name:
            application.full_name,
          participant_email:
            application.email,
          coach_assignment_id:
            assignment.id,
          coach_id:
            assignment.coach_id,
          window_start_date:
            windowStartDate,
          window_end_date:
            windowEndDate,
          status: "submitted",
          participant_timezone:
            PARTICIPANT_TIMEZONE,
          submitted_at: now,
          matched_at: null,
          scheduling_review_started_at: null,
          scheduling_review_eligible_at: null,
          scheduling_review_deadline_at: null,
          scheduling_review_completed_at: null,
          updated_at: now,
        })
        .eq("id", availabilityId);

      if (availabilityUpdateError) {
        throw availabilityUpdateError;
      }

      const {
        error: deleteWindowsError,
      } = await supabaseAdmin
        .from(
          "epew_participant_availability_windows"
        )
        .delete()
        .eq(
          "availability_id",
          availabilityId
        );

      if (deleteWindowsError) {
        throw deleteWindowsError;
      }

      const {
        error: clearMatchesError,
      } = await supabaseAdmin
        .from("epew_private_schedule_matches")
        .delete()
        .eq(
          "availability_id",
          availabilityId
        )
        .in("status", [
          "available",
          "expired",
          "withdrawn",
          "conflict",
        ]);

      if (clearMatchesError) {
        throw clearMatchesError;
      }
    } else {
      const {
        data: createdAvailability,
        error: createAvailabilityError,
      } = await supabaseAdmin
        .from("epew_participant_availability")
        .insert({
          application_id: applicationId,
          participant_user_id:
            application.user_id ?? null,
          participant_type: "entrepreneur",
          participant_name:
            application.full_name,
          participant_email:
            application.email,
          meeting_type:
            "entrepreneur_first_meeting",
          coach_assignment_id:
            assignment.id,
          coach_id:
            assignment.coach_id,
          window_start_date:
            windowStartDate,
          window_end_date:
            windowEndDate,
          status: "submitted",
          participant_timezone:
            PARTICIPANT_TIMEZONE,
          submitted_at: now,
        })
        .select("id")
        .single();

      if (createAvailabilityError) {
        throw createAvailabilityError;
      }

      availabilityId =
        createdAvailability.id;
    }

    const {
      error: windowInsertError,
    } = await supabaseAdmin
      .from(
        "epew_participant_availability_windows"
      )
      .insert(
        normalizedWindows.map((window) => ({
          availability_id:
            availabilityId,
          ...window,
        }))
      );

    if (windowInsertError) {
      throw windowInsertError;
    }

    await supabaseAdmin
      .from("epew_no_show_recovery_cases")
      .update({
        status: "responded",
        next_required_action:
          "select_matching_time",
        updated_at: now,
      })
      .eq("application_id", applicationId)
      .eq("status", "active");

    await supabaseAdmin
      .from("epew_communication_outbox")
      .update({
        status: "cancelled",
        updated_at: now,
      })
      .eq("application_id", applicationId)
      .eq("status", "pending")
      .in("message_type", [
        "establishment_meeting_recovery_reminder",
        "application_closed_due_to_inactivity",
      ]);

    await supabaseAdmin
      .from("epew_operational_history")
      .insert({
        application_id: applicationId,
        entrepreneur_user_id:
          application.user_id ?? null,

        event_type:
          "availability_submission",
        event_name:
          "Establishment Meeting Availability Submitted",
        event_description:
          "Entrepreneur submitted Establishment Meeting availability by telephone for private EMCC matching.",

        previous_status: null,
        new_status:
          "availability_submitted",

        occurred_at: now,

        actor_user_id:
          application.user_id ?? null,
        actor_role: "entrepreneur",
        actor_type: "participant",
        actor_name:
          application.full_name,

        decision_made_by_user_id:
          application.user_id ?? null,
        decision_made_by_role:
          "entrepreneur",
        decision_made_by_type:
          "participant",
        decision_made_by_name:
          application.full_name,
        decision_organization: "EPEW",
        decision_reason:
          "Participant provided preferred availability through the EPEW telephone system.",
        decision_at: now,

        executed_by:
          "EMCC Phone Availability Service",
        recorded_by:
          "EPEW EDE / IBOS",
        source_system:
          "EMCC Scheduling Engine",
        communication_channel: "phone",

        reference_type:
          "participant_availability",
        reference_id: availabilityId,

        metadata: {
          meetingType:
            "entrepreneur_first_meeting",
          coachAssignmentId:
            assignment.id,
          coachId:
            assignment.coach_id,
          availabilityWindowCount:
            normalizedWindows.length,
          windowStartDate,
          windowEndDate,
          participantTimezone:
            PARTICIPANT_TIMEZONE,
          source: "inbound_voice",
          twilioCallSid:
            callSid ?? null,
          spokenAvailability,
          preferredLanguage:
            language,
        },
      });

    const matchingResult =
      await PrivateAvailabilityMatchingService.matchAvailability(
        availabilityId
      );

    const {
      data: appointmentChoices,
      error: appointmentChoicesError,
    } = await supabaseAdmin
      .from("epew_private_schedule_matches")
      .select(
        "id, proposed_start_at, reserved_until, reservation_minutes"
      )
      .eq(
        "availability_id",
        availabilityId
      )
      .eq("status", "available")
      .eq(
        "exposed_to_participant",
        true
      )
      .order("proposed_start_at", {
        ascending: true,
      })
      .limit(2);

    if (appointmentChoicesError) {
      throw appointmentChoicesError;
    }

    if (
      matchingResult.status !== "matched" ||
      !appointmentChoices ||
      appointmentChoices.length === 0
    ) {
      return {
        success: true,
        status: "scheduling_review",
        availabilityId,
        windows,
        choices: [],
      };
    }

    return {
      success: true,
      status: "matched",
      availabilityId,
      windows,
      choices:
        appointmentChoices.map(
          (choice) => ({
            id: choice.id,
            proposedStartAt:
              choice.proposed_start_at,
            reservedUntil:
              choice.reserved_until,
            reservationMinutes:
              choice.reservation_minutes,
          })
        ),
    };
  }
}
