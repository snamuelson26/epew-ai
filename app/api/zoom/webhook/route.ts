import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ZoomMeetingService } from "@/lib/zoom/ZoomMeetingService";

type ZoomWebhookPayload = {
  event?: string;
  event_ts?: number;
  payload?: {
    plainToken?: string;
    object?: Record<string, any>;
    meeting_id?: string | number;
    meeting_uuid?: string;
    rtms_stream_id?: string;
    server_urls?: string;
  };
};

function getWebhookSecret() {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim();

  if (!secret) {
    throw new Error(
      "ZOOM_WEBHOOK_SECRET_TOKEN is not configured."
    );
  }

  return secret;
}

function buildValidationResponse(plainToken: string) {
  const encryptedToken = crypto
    .createHmac("sha256", getWebhookSecret())
    .update(plainToken)
    .digest("hex");

  return {
    plainToken,
    encryptedToken,
  };
}

function verifyZoomSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null
) {
  if (!timestamp || !signature) {
    return false;
  }

  const message = `v0:${timestamp}:${rawBody}`;

  const hash = crypto
    .createHmac("sha256", getWebhookSecret())
    .update(message)
    .digest("hex");

  const expectedSignature = `v0=${hash}`;

  const expectedBuffer =
    Buffer.from(expectedSignature);

  const receivedBuffer =
    Buffer.from(signature);

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

function getMeetingId(
  payload: ZoomWebhookPayload
): string | null {
  const eventPayload = payload.payload;
  const object = eventPayload?.object;

  const meetingId =
    object?.id ??
    object?.meeting_id ??
    eventPayload?.meeting_id ??
    null;

  if (
    meetingId === null ||
    meetingId === undefined
  ) {
    return null;
  }

  return String(meetingId);
}

async function loadMeeting(
  zoomMeetingId: string
) {
  const { data, error } =
    await supabaseAdmin
      .from("epew_coach_meetings")
      .select("*")
      .eq("zoom_meeting_id", zoomMeetingId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function updateMeeting(
  zoomMeetingId: string,
  updates: Record<string, unknown>
) {
  const { error } =
    await supabaseAdmin
      .from("epew_coach_meetings")
      .update({
        ...updates,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "zoom_meeting_id",
        zoomMeetingId
      );

  if (error) {
    throw error;
  }
}

async function appendActionLog(
  zoomMeetingId: string,
  entry: Record<string, unknown>
) {
  const meeting =
    await loadMeeting(zoomMeetingId);

  if (!meeting) {
    return;
  }

  const existingLog =
    Array.isArray(
      meeting.meeting_action_log
    )
      ? meeting.meeting_action_log
      : [];

  await updateMeeting(
    zoomMeetingId,
    {
      meeting_action_log: [
        ...existingLog,
        {
          ...entry,
          recordedAt:
            new Date().toISOString(),
        },
      ],
    }
  );
}

async function processZoomEvent(
  payload: ZoomWebhookPayload
) {
  const event = payload.event ?? "";

  const zoomMeetingId =
    getMeetingId(payload);

  if (!zoomMeetingId) {
    return;
  }

  const meeting =
    await loadMeeting(zoomMeetingId);

  if (!meeting) {
    console.warn(
      "Zoom event received for unknown EMCC meeting:",
      zoomMeetingId,
      event
    );

    return;
  }

  const now =
    new Date().toISOString();

  switch (event) {
    case "meeting.started":
      await updateMeeting(
        zoomMeetingId,
        {
          zoom_meeting_status:
            "started",
        }
      );

      await appendActionLog(
        zoomMeetingId,
        {
          event:
            "zoom_room_started",
          actor:
            "Zoom",
          authority:
            "Zoom Webhook",
        }
      );

      try {
        await ZoomMeetingService.startMeetingRtms(
          zoomMeetingId
        );

        await appendActionLog(
          zoomMeetingId,
          {
            event:
              "zoom_rtms_start_requested",
            actor:
              "EPEW Zoom Meeting Service",
            authority:
              "EPEW Zoom RTMS",
          }
        );
      } catch (error) {
        console.error(
          `[EPEW Zoom Webhook] Unable to start RTMS for meeting ${zoomMeetingId}:`,
          error
        );

        await appendActionLog(
          zoomMeetingId,
          {
            event:
              "zoom_rtms_start_failed",
            actor:
              "EPEW Zoom Meeting Service",
            authority:
              "EPEW Zoom RTMS",
            error:
              error instanceof Error
                ? error.message
                : String(error),
          }
        );
      }

      break;

    case "meeting.rtms_started": {
      const existingRuntimeContext =
        meeting.meeting_runtime_context &&
        typeof meeting.meeting_runtime_context === "object" &&
        !Array.isArray(meeting.meeting_runtime_context)
          ? meeting.meeting_runtime_context
          : {};

      await updateMeeting(
        zoomMeetingId,
        {
          zoom_rtms_enabled: true,
          zoom_rtms_session_id:
            payload.payload?.rtms_stream_id ??
            null,
          zoom_live_transcript_status:
            "starting",
          meeting_runtime_context: {
            ...existingRuntimeContext,
            zoomRtms: {
              status: "starting",
              streamId:
                payload.payload?.rtms_stream_id ??
                null,
              meetingUuid:
                payload.payload?.meeting_uuid ??
                null,
              serverUrls:
                payload.payload?.server_urls ??
                "",
              startedAt: now,
            },
          },
        }
      );

      await appendActionLog(
        zoomMeetingId,
        {
          type: "rtms_started",
          event,
          rtmsStreamId:
            payload.payload?.rtms_stream_id ??
            null,
          meetingUuid:
            payload.payload?.meeting_uuid ??
            null,
        }
      );
      break;
    }

    case "meeting.rtms_stopped": {
      const existingRuntimeContext =
        meeting.meeting_runtime_context &&
        typeof meeting.meeting_runtime_context === "object" &&
        !Array.isArray(meeting.meeting_runtime_context)
          ? meeting.meeting_runtime_context
          : {};

      const existingZoomRtms =
        existingRuntimeContext.zoomRtms &&
        typeof existingRuntimeContext.zoomRtms === "object" &&
        !Array.isArray(existingRuntimeContext.zoomRtms)
          ? existingRuntimeContext.zoomRtms
          : {};

      await updateMeeting(
        zoomMeetingId,
        {
          zoom_live_transcript_status:
            "completed",
          meeting_runtime_context: {
            ...existingRuntimeContext,
            zoomRtms: {
              ...existingZoomRtms,
              status: "stopped",
              stoppedAt: now,
            },
          },
        }
      );

      await appendActionLog(
        zoomMeetingId,
        {
          type: "rtms_stopped",
          event,
          rtmsStreamId:
            payload.payload?.rtms_stream_id ??
            null,
          meetingUuid:
            payload.payload?.meeting_uuid ??
            null,
        }
      );
      break;
    }

    case "meeting.ended":
      await updateMeeting(
        zoomMeetingId,
        {
          zoom_meeting_status:
            "ended",
          coach_session_status:
            "post_processing",
          coach_session_ended_at:
            now,
        }
      );

      await appendActionLog(
        zoomMeetingId,
        {
          event: "zoom_room_ended",
          actor: "Zoom",
          authority: "Zoom Webhook",
        }
      );

      /*
       * An ended Zoom room must never remain entrepreneur-facing
       * as Join Meeting or Meeting in Progress.
       *
       * The existing recovery processor determines whether an
       * eligible unattended meeting has crossed the no-show
       * threshold and should receive a rescheduling opportunity.
       */
      {
        const { error: recoveryError } =
          await supabaseAdmin.rpc(
            "epew_process_establishment_meeting_no_shows"
          );

        if (recoveryError) {
          console.error(
            "[EPEW Zoom Webhook] Unable to process no-show recovery:",
            recoveryError
          );
        }
      }

      break;

    case "meeting.participant_joined": {
      const participant =
        payload.payload?.object
          ?.participant ?? null;

      const participantEmail =
        typeof participant?.email === "string"
          ? participant.email.trim().toLowerCase()
          : "";

      const { data: assignment } =
        await supabaseAdmin
          .from("coach_assignments")
          .select("coach_email")
          .eq("application_id", meeting.application_id)
          .not(
            "assignment_status",
            "in",
            '("ended","declined","reassigned","cancelled","inactive","reassignment_required","completed")'
          )
          .order("assigned_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      const coachEmail =
        assignment?.coach_email
          ?.trim()
          .toLowerCase() ?? "";

      const isCoach =
        Boolean(
          participantEmail &&
          coachEmail &&
          participantEmail === coachEmail
        );

      if (isCoach) {
        await updateMeeting(
          zoomMeetingId,
          {
            zoom_coach_joined_at:
              meeting.zoom_coach_joined_at ??
              now,
            coach_session_status:
              "active",
            coach_session_started_at:
              meeting.coach_session_started_at ??
              now,
            meeting_status:
              "in_progress",
            started_at:
              meeting.started_at ??
              now,
          }
        );
      } else {
        await updateMeeting(
          zoomMeetingId,
          {
            zoom_participant_joined_at:
              meeting.zoom_participant_joined_at ??
              now,
          }
        );
      }

      await appendActionLog(
        zoomMeetingId,
        {
          type:
            isCoach
              ? "coach_joined"
              : "participant_joined",
          event,
          participant,
          participantRole:
            isCoach
              ? "personal_coach"
              : "entrepreneur",
        }
      );

      break;
    }

    case "meeting.participant_left":
      await appendActionLog(
        zoomMeetingId,
        {
          type:
            "participant_left",
          event,
          participant:
            payload.payload?.object
              ?.participant ?? null,
        }
      );
      break;

    case "recording.completed":
      await updateMeeting(
        zoomMeetingId,
        {
          zoom_recording_status:
            "completed",
        }
      );

      await appendActionLog(
        zoomMeetingId,
        {
          type:
            "recording_completed",
          event,
        }
      );
      break;

    default:
      await appendActionLog(
        zoomMeetingId,
        {
          type: "zoom_event",
          event,
        }
      );
      break;
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const rawBody =
      await request.text();

    let payload:
      ZoomWebhookPayload;

    try {
      payload =
        JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Zoom webhook payload.",
        },
        { status: 400 }
      );
    }

    /*
     * Zoom endpoint URL validation.
     */
    if (
      payload.event ===
        "endpoint.url_validation" &&
      payload.payload?.plainToken
    ) {
      return NextResponse.json(
        buildValidationResponse(
          payload.payload.plainToken
        )
      );
    }

    const timestamp =
      request.headers.get(
        "x-zm-request-timestamp"
      );

    const signature =
      request.headers.get(
        "x-zm-signature"
      );

    if (
      !verifyZoomSignature(
        rawBody,
        timestamp,
        signature
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Zoom webhook signature.",
        },
        { status: 401 }
      );
    }

    await processZoomEvent(
      payload
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Zoom webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to process Zoom webhook.",
      },
      { status: 500 }
    );
  }
}
