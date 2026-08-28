import {
  PhoneAvailabilitySchedulingService,
} from "@/lib/services/scheduling/PhoneAvailabilitySchedulingService";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

import type {
  VoiceLanguage,
} from "@/lib/twilio/voice-v2/VoiceState";

export type V2AvailabilityChoice = {
  id: string;
  proposedStartAt: string;
  reservedUntil?: string | null;
};

export type V2AvailabilityResult =
  | {
      status: "matched";
      availabilityId: string;
      spokenAvailability: string;
      choices: V2AvailabilityChoice[];
    }
  | {
      status: "scheduling_review";
      availabilityId: string;
      spokenAvailability: string;
      choices: [];
    }
  | {
      status: "needs_clarification";
      spokenAvailability: string;
      message: string;
      choices: [];
    };

export class AvailabilityUnderstandingService {
  static async understandAndMatch(params: {
    applicationId: number;
    spokenAvailability: string;
    language: VoiceLanguage;
    callSid: string;
  }): Promise<V2AvailabilityResult> {
    const spokenAvailability =
      String(params.spokenAvailability ?? "")
        .trim();

    if (!spokenAvailability) {
      return {
        status: "needs_clarification",
        spokenAvailability: "",
        message:
          "No scheduling availability was received.",
        choices: [],
      };
    }

    const result =
      await PhoneAvailabilitySchedulingService
        .submitAvailability({
          applicationId:
            params.applicationId,
          spokenAvailability,
          language: params.language,
          callSid: params.callSid,
        });

    if (!result.success) {
      return {
        status: "needs_clarification",
        spokenAvailability,
        message: result.message,
        choices: [],
      };
    }

    if (result.status === "scheduling_review") {
      return {
        status: "scheduling_review",
        availabilityId:
          result.availabilityId,
        spokenAvailability,
        choices: [],
      };
    }

    const {
      data: availableMatches,
      error: matchesError,
    } = await supabaseAdmin
      .from("epew_private_schedule_matches")
      .select(`
        id,
        proposed_start_at,
        reserved_until
      `)
      .eq(
        "availability_id",
        result.availabilityId
      )
      .eq("status", "available")
      .eq(
        "exposed_to_participant",
        true
      )
      .order(
        "proposed_start_at",
        {
          ascending: true,
        }
      )
      .limit(50);

    if (matchesError) {
      throw matchesError;
    }

    const choices =
      availableMatches?.map(
        (match) => ({
          id: match.id,
          proposedStartAt:
            match.proposed_start_at,
          reservedUntil:
            match.reserved_until ?? null,
        })
      ) ?? [];

    return {
      status: "matched",
      availabilityId:
        result.availabilityId,
      spokenAvailability,
      choices:
        choices.length > 0
          ? choices
          : result.choices.map(
              (choice) => ({
                id: choice.id,
                proposedStartAt:
                  choice.proposedStartAt,
                reservedUntil:
                  choice.reservedUntil ??
                  null,
              })
            ),
    };
  }
}
