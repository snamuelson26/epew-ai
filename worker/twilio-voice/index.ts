import http from "node:http";
import WebSocket, {
  WebSocketServer,
} from "ws";
import { createClient } from "@supabase/supabase-js";

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

const supabase = createClient(
  requireEnvironment(
    "NEXT_PUBLIC_SUPABASE_URL"
  ),
  requireEnvironment(
    "SUPABASE_SERVICE_ROLE_KEY"
  ),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const openAiApiKey =
  requireEnvironment("OPENAI_API_KEY");

const port = Number(
  process.env.EPEW_TWILIO_VOICE_PORT ??
    "8787"
);

type TwilioStartMessage = {
  event: "start";
  streamSid?: string;
  start?: {
    streamSid?: string;
    callSid?: string;
    accountSid?: string;
    customParameters?: Record<
      string,
      string
    >;
  };
};

type TwilioMediaMessage = {
  event: "media";
  streamSid?: string;
  media?: {
    payload?: string;
    timestamp?: string;
    chunk?: string;
  };
};

type TwilioStopMessage = {
  event: "stop";
  streamSid?: string;
  stop?: {
    callSid?: string;
    accountSid?: string;
  };
};

type TwilioMessage =
  | TwilioStartMessage
  | TwilioMediaMessage
  | TwilioStopMessage
  | {
      event: string;
      [key: string]: unknown;
    };

type VoiceConnectionState = {
  streamSid: string | null;
  callSid: string | null;
  applicationId: number | null;
  meetingId: string | null;
  language: string | null;
  openAiSocket: WebSocket | null;
};

function parseApplicationId(
  value: unknown
) {
  const number = Number(value);

  return Number.isInteger(number) &&
    number > 0
    ? number
    : null;
}

async function recordStreamStarted(
  state: VoiceConnectionState
) {
  if (!state.callSid) {
    return;
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("epew_voice_calls")
    .update({
      call_status: "in-progress",
      answered_at: now,
      metadata: {
        provider: "twilio",
        source:
          "epew_twilio_voice_worker",
        media_stream_sid:
          state.streamSid,
        application_id:
          state.applicationId,
        meeting_id:
          state.meetingId,
        language:
          state.language,
      },
    })
    .eq(
      "twilio_call_sid",
      state.callSid
    );

  if (error) {
    console.error(
      "[EPEW Twilio Voice Worker] Unable to record stream start:",
      error.message
    );
  }
}

function connectOpenAiRealtime(
  state: VoiceConnectionState
) {
  /*
   * Foundation only.
   *
   * The OpenAI realtime WebSocket connection,
   * session configuration, audio forwarding,
   * interruption handling, and Daniel/EPEW
   * conversation instructions will be added
   * after the Twilio WebSocket endpoint is
   * proven locally.
   */
  void openAiApiKey;
  void state;

  console.log(
    "[EPEW Twilio Voice Worker] OpenAI realtime connection pending next phase."
  );
}

const server = http.createServer(
  (request, response) => {
    if (
      request.url === "/health"
    ) {
      response.writeHead(
        200,
        {
          "Content-Type":
            "application/json",
        }
      );

      response.end(
        JSON.stringify({
          ok: true,
          service:
            "epew-twilio-voice-worker",
        })
      );

      return;
    }

    response.writeHead(404);
    response.end("Not Found");
  }
);

const websocketServer =
  new WebSocketServer({
    server,
    path: "/twilio-media",
  });

websocketServer.on(
  "connection",
  (twilioSocket) => {
    const state:
      VoiceConnectionState = {
        streamSid: null,
        callSid: null,
        applicationId: null,
        meetingId: null,
        language: null,
        openAiSocket: null,
      };

    console.log(
      "[EPEW Twilio Voice Worker] Twilio WebSocket connected."
    );

    twilioSocket.on(
      "message",
      async (data) => {
        try {
          const message =
            JSON.parse(
              data.toString()
            ) as TwilioMessage;

          if (
            message.event ===
            "connected"
          ) {
            console.log(
              "[EPEW Twilio Voice Worker] Twilio media protocol connected."
            );

            return;
          }

          if (
            message.event === "start"
          ) {
            const start =
              message as TwilioStartMessage;

            state.streamSid =
              start.start?.streamSid ??
              start.streamSid ??
              null;

            state.callSid =
              start.start?.callSid ??
              null;

            const parameters =
              start.start
                ?.customParameters ??
              {};

            state.applicationId =
              parseApplicationId(
                parameters.applicationId
              );

            state.meetingId =
              String(
                parameters.meetingId ??
                  ""
              ).trim() || null;

            state.language =
              String(
                parameters.language ??
                  ""
              ).trim() || null;

            console.log(
              `[EPEW Twilio Voice Worker] Stream started. Call=${state.callSid ?? "unknown"} Meeting=${state.meetingId ?? "none"} Application=${state.applicationId ?? "none"}.`
            );

            await recordStreamStarted(
              state
            );

            connectOpenAiRealtime(
              state
            );

            return;
          }

          if (
            message.event === "media"
          ) {
            const media =
              message as TwilioMediaMessage;

            const payload =
              media.media?.payload;

            if (!payload) {
              return;
            }

            /*
             * Twilio sends base64-encoded
             * 8 kHz μ-law audio here.
             *
             * Forwarding to OpenAI will be
             * implemented in the next phase.
             */
            return;
          }

          if (
            message.event === "stop"
          ) {
            console.log(
              `[EPEW Twilio Voice Worker] Stream stopped. Call=${state.callSid ?? "unknown"}.`
            );

            if (
              state.openAiSocket &&
              state.openAiSocket.readyState ===
                WebSocket.OPEN
            ) {
              state.openAiSocket.close();
            }

            return;
          }
        } catch (error) {
          console.error(
            "[EPEW Twilio Voice Worker] Unable to process Twilio message:",
            error
          );
        }
      }
    );

    twilioSocket.on(
      "error",
      (error) => {
        console.error(
          "[EPEW Twilio Voice Worker] Twilio WebSocket error:",
          error.message
        );
      }
    );

    twilioSocket.on(
      "close",
      () => {
        console.log(
          "[EPEW Twilio Voice Worker] Twilio WebSocket closed."
        );

        if (
          state.openAiSocket &&
          state.openAiSocket.readyState ===
            WebSocket.OPEN
        ) {
          state.openAiSocket.close();
        }
      }
    );
  }
);

server.listen(
  port,
  "0.0.0.0",
  () => {
    console.log(
      `[EPEW Twilio Voice Worker] Listening on port ${port}.`
    );

    console.log(
      `[EPEW Twilio Voice Worker] WebSocket path: /twilio-media`
    );

    console.log(
      `[EPEW Twilio Voice Worker] Health path: /health`
    );
  }
);
