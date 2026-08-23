import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ZoomMeetingService } from "@/lib/zoom/ZoomMeetingService";

export const dynamic = "force-dynamic";

async function processNoShows() {
  const now = new Date().toISOString();

  /*
   * Supabase remains the authority for deciding which meetings
   * have crossed the Establishment Meeting no-show threshold.
   */
  const { data: recoveryResult, error: recoveryError } =
    await supabaseAdmin.rpc(
      "epew_process_establishment_meeting_no_shows"
    );

  if (recoveryError) {
    throw recoveryError;
  }

  /*
   * Find no-show meetings whose Zoom lifecycle has not yet
   * been closed by EPEW.
   */
  const { data: meetings, error: meetingsError } =
    await supabaseAdmin
      .from("epew_coach_meetings")
      .select(
        `
          id,
          application_id,
          zoom_meeting_id,
          zoom_meeting_status,
          meeting_status,
          scheduled_at,
          meeting_action_log
        `
      )
      .eq(
        "meeting_type",
        "entrepreneur_first_meeting"
      )
      .eq(
        "meeting_status",
        "no_show"
      )
      .not(
        "zoom_meeting_id",
        "is",
        null
      )
      .neq(
        "zoom_meeting_status",
        "ended"
      )
      .limit(50);

  if (meetingsError) {
    throw meetingsError;
  }

  let closed = 0;
  let failed = 0;

  for (const meeting of meetings ?? []) {
    const zoomMeetingId =
      String(meeting.zoom_meeting_id);

    let zoomCloseMethod:
      | "ended"
      | "deleted" =
      "ended";

    try {
      /*
       * A genuinely live Zoom meeting can be ended.
       */
      try {
        await ZoomMeetingService.endMeeting(
          zoomMeetingId
        );
      } catch (endError) {
        /*
         * If the no-show meeting never became live,
         * cancel/delete the unused scheduled Zoom meeting.
         */
        console.warn(
          `[EPEW No-Show] Could not end Zoom meeting ${zoomMeetingId}; attempting cancellation.`,
          endError
        );

        await ZoomMeetingService.deleteMeeting(
          zoomMeetingId
        );

        zoomCloseMethod = "deleted";
      }

      const existingLog =
        Array.isArray(
          meeting.meeting_action_log
        )
          ? meeting.meeting_action_log
          : [];

      const { error: updateError } =
        await supabaseAdmin
          .from("epew_coach_meetings")
          .update({
            zoom_meeting_status:
              "ended",
            coach_session_status:
              "not_started",
            coach_session_ended_at:
              now,
            meeting_action_log: [
              ...existingLog,
              {
                event:
                  "automatic_no_show_zoom_closed",
                actor:
                  "EPEW EMCC Scheduling Engine",
                authority:
                  "10-Minute No-Show Rule",
                zoomCloseMethod,
                recordedAt: now,
              },
            ],
            updated_at: now,
          })
          .eq(
            "id",
            meeting.id
          );

      if (updateError) {
        throw updateError;
      }

      closed += 1;
    } catch (error) {
      failed += 1;

      console.error(
        `[EPEW No-Show] Unable to close Zoom meeting ${zoomMeetingId}:`,
        error
      );
    }
  }

  return {
    recoveryResult,
    meetingsFound:
      meetings?.length ?? 0,
    zoomMeetingsClosed:
      closed,
    zoomCloseFailures:
      failed,
  };
}

export async function GET(
  request: NextRequest
) {
  const secret =
    process.env.CRON_SECRET;

  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !secret ||
    authorization !==
      `Bearer ${secret}`
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const result =
      await processNoShows();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "EPEW Establishment Meeting no-show processor failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to process Establishment Meeting no-shows.",
      },
      { status: 500 }
    );
  }
}
