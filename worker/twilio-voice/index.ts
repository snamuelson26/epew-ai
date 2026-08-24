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
  state: VoiceConnectionState,
  twilioSocket?: WebSocket
) {
  if (!state.streamSid) {
    console.error(
      "[EPEW Twilio Voice Worker] Cannot start OpenAI realtime session without a Twilio stream SID."
    );
    return;
  }

  const model =
    process.env.OPENAI_REALTIME_MODEL?.trim() ||
    "gpt-realtime-1.5";

  const realtimeUrl =
    `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(
      model
    )}`;

  const openAiSocket =
    new WebSocket(
      realtimeUrl,
      {
        headers: {
          Authorization:
            `Bearer ${openAiApiKey}`,
        },
      }
    );

  state.openAiSocket =
    openAiSocket;

  openAiSocket.on(
    "open",
    () => {
      console.log(
        `[EPEW Twilio Voice Worker] OpenAI realtime connected. Model=${model}.`
      );

      /*
       * First integration step:
       * establish the authenticated session and
       * provide Daniel's voice behavior.
       *
       * We are not switching production calls
       * to this worker yet.
       */
      openAiSocket.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            output_modalities: [
              "audio",
            ],
            audio: {
              input: {
                format: {
                  type: "audio/pcmu",
                },
                turn_detection: {
                  type: "semantic_vad",
                },
              },
              output: {
                format: {
                  type: "audio/pcmu",
                },
                voice: "marin",
              },
            },
            instructions: `
You are Daniel Pierre, the EPEW Personal Coach.

You are speaking with an EPEW entrepreneur by telephone.

Speak naturally, warmly, professionally, and patiently.

IMPORTANT VOICE RULES:
- Speak at a calm, moderately slow pace.
- Never rush the caller.
- Use short conversational turns.
- Ask only one main question at a time.
- Pause naturally between ideas.
- If the caller says they do not understand, apologize briefly, rephrase more simply, and slow down.
- If the caller asks you to repeat something, repeat or simplify it instead of saying you are waiting.
- If the caller speaks Haitian Creole, respond in natural Haitian Creole.
- If the caller speaks English, Spanish, or French, continue in that language.
- Respect the caller's selected language when provided.
- Do not announce yourself as an AI system.
- Do not invent personal biography, licenses, degrees, or employment history.

This realtime voice layer handles natural telephone conversation.
The EPEW Establishment Meeting business rules and permanent meeting state remain controlled by the EPEW meeting system.
            `.trim(),
          },
        })
      );
    }
  );

  openAiSocket.on(
    "message",
    (data) => {
      try {
        const event =
          JSON.parse(
            data.toString()
          ) as Record<string, any>;

        const eventType =
          String(
            event.type ?? ""
          );

        if (
          eventType ===
          "session.created"
        ) {
          console.log(
            "[EPEW Twilio Voice Worker] OpenAI realtime session created."
          );
          return;
        }

        if (
          eventType ===
          "session.updated"
        ) {
          console.log(
            "[EPEW Twilio Voice Worker] OpenAI realtime session configured."
          );
          return;
        }

        if (
          eventType ===
          "error"
        ) {
          console.error(
            "[EPEW Twilio Voice Worker] OpenAI realtime error:",
            event.error ??
              event
          );
          return;
        }

        if (
          eventType ===
          "response.output_audio.delta"
        ) {
          const delta =
            typeof event.delta === "string"
              ? event.delta
              : "";

          if (
            !delta ||
            !twilioSocket ||
            twilioSocket.readyState !==
              WebSocket.OPEN ||
            !state.streamSid
          ) {
            return;
          }

          twilioSocket.send(
            JSON.stringify({
              event: "media",
              streamSid:
                state.streamSid,
              media: {
                payload: delta,
              },
            })
          );

          return;
        }
      } catch (error) {
        console.error(
          "[EPEW Twilio Voice Worker] Unable to process OpenAI realtime event:",
          error
        );
      }
    }
  );

  openAiSocket.on(
    "error",
    (error) => {
      console.error(
        "[EPEW Twilio Voice Worker] OpenAI realtime WebSocket error:",
        error.message
      );
    }
  );

  openAiSocket.on(
    "close",
    (code, reason) => {
      console.log(
        `[EPEW Twilio Voice Worker] OpenAI realtime WebSocket closed. Code=${code}. Reason=${reason.toString() || "none"}.`
      );

      if (
        state.openAiSocket ===
        openAiSocket
      ) {
        state.openAiSocket =
          null;
      }
    }
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
              state,
              twilioSocket
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

            if (
              !state.openAiSocket ||
              state.openAiSocket.readyState !==
                WebSocket.OPEN
            ) {
              return;
            }

            state.openAiSocket.send(
              JSON.stringify({
                type:
                  "input_audio_buffer.append",
                audio: payload,
              })
            );

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
