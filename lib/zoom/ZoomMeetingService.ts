type ZoomTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
};

type ZoomMeetingResponse = {
  id: number;
  uuid?: string;
  host_id?: string;
  host_email?: string;
  topic: string;
  start_time?: string;
  duration?: number;
  timezone?: string;
  join_url: string;
  start_url: string;
  password?: string;
};

export type CreateEstablishmentMeetingInput = {
  entrepreneurName: string;
  businessName?: string | null;
  scheduledAt: string;
  durationMinutes?: number;
};

export type CreatedZoomMeeting = {
  meetingId: string;
  meetingUuid: string | null;
  joinUrl: string;
  startUrl: string;
  passcode: string | null;
  scheduledAt: string;
  durationMinutes: number;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `${name} is not configured for the EPEW Zoom Meeting Service.`
    );
  }

  return value;
}

async function getAccessToken(): Promise<string> {
  const accountId = requireEnv("ZOOM_ACCOUNT_ID");
  const clientId = requireEnv("ZOOM_CLIENT_ID");
  const clientSecret = requireEnv("ZOOM_CLIENT_SECRET");

  const basicAuth = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const tokenUrl = new URL(
    "https://zoom.us/oauth/token"
  );

  tokenUrl.searchParams.set(
    "grant_type",
    "account_credentials"
  );

  tokenUrl.searchParams.set(
    "account_id",
    accountId
  );

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type":
        "application/x-www-form-urlencoded",
    },
    cache: "no-store",
  });

  const payload =
    (await response.json()) as
      | ZoomTokenResponse
      | {
          reason?: string;
          error?: string;
        };

  if (!response.ok) {
    throw new Error(
      `Zoom OAuth failed (${response.status}): ${
        "reason" in payload
          ? payload.reason
          : "error" in payload
            ? payload.error
            : "Unknown Zoom OAuth error"
      }`
    );
  }

  if (!("access_token" in payload)) {
    throw new Error(
      "Zoom OAuth did not return an access token."
    );
  }

  return payload.access_token;
}

export class ZoomMeetingService {
  static async createEstablishmentMeeting(
    input: CreateEstablishmentMeetingInput
  ): Promise<CreatedZoomMeeting> {
    const hostUserId =
      requireEnv("ZOOM_HOST_USER_ID");

    const accessToken =
      await getAccessToken();

    const durationMinutes =
      input.durationMinutes ?? 60;

    const topic =
      input.businessName?.trim()
        ? `EPEW Establishment Meeting — ${input.entrepreneurName} — ${input.businessName}`
        : `EPEW Establishment Meeting — ${input.entrepreneurName}`;

    const response = await fetch(
      `https://api.zoom.us/v2/users/${encodeURIComponent(
        hostUserId
      )}/meetings`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          topic,
          type: 2,
          start_time: input.scheduledAt,
          duration: durationMinutes,
          timezone: "America/New_York",

          agenda:
            "EPEW Establishment Meeting between the Entrepreneur and assigned Personal Coach.",

          settings: {
            host_video: false,
            participant_video: false,

            join_before_host: false,

            waiting_room: true,

            mute_upon_entry: true,

            approval_type: 2,

            audio: "both",

            auto_recording: "cloud",

            meeting_authentication: false,

            registrants_confirmation_email: false,

            registrants_email_notification: false,

            use_pmi: false,
          },
        }),
        cache: "no-store",
      }
    );

    const payload =
      (await response.json()) as
        | ZoomMeetingResponse
        | {
            code?: number;
            message?: string;
          };

    if (!response.ok) {
      const message =
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Unknown Zoom meeting creation error";

      throw new Error(
        `Zoom meeting creation failed (${response.status}): ${message}`
      );
    }

    if (
      !("id" in payload) ||
      !("join_url" in payload) ||
      !("start_url" in payload)
    ) {
      throw new Error(
        "Zoom did not return the required meeting information."
      );
    }

    return {
      meetingId: String(payload.id),

      meetingUuid:
        payload.uuid ?? null,

      joinUrl:
        payload.join_url,

      startUrl:
        payload.start_url,

      passcode:
        payload.password ?? null,

      scheduledAt:
        input.scheduledAt,

      durationMinutes,
    };
  }

  static async startMeetingRtms(
    meetingId: string
  ): Promise<void> {
    const accessToken =
      await getAccessToken();

    const clientId =
      requireEnv("ZOOM_CLIENT_ID");

    const response = await fetch(
      `https://api.zoom.us/v2/live_meetings/${encodeURIComponent(
        meetingId
      )}/rtms_app/status`,
      {
        method: "PATCH",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          action: "start",
          settings: {
            client_id: clientId,
          },
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      let details = "";

      try {
        details =
          JSON.stringify(
            await response.json()
          );
      } catch {
        details =
          await response.text();
      }

      throw new Error(
        `Zoom RTMS start failed (${response.status}): ${details}`
      );
    }

    console.log(
      `[EPEW Zoom Meeting Service] RTMS start requested for meeting ${meetingId}.`
    );
  }

}
