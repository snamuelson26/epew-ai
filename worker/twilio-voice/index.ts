import http from "node:http";
import WebSocket, {
  WebSocketServer,
} from "ws";
import { createClient } from "@supabase/supabase-js";
import {
  EstablishmentMeetingRuntimeService,
} from "../../lib/services/establishment-meeting/EstablishmentMeetingRuntimeService";
import type {
  EstablishmentMeetingMessage,
  EstablishmentMeetingStage,
} from "../../lib/enterprise/establishment-meeting/EstablishmentMeetingCoach";

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
  process.env.PORT ??
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
  processingTurn: boolean;
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


const VALID_MEETING_STAGES =
  new Set<EstablishmentMeetingStage>([
    "opening",
    "meeting_purpose",
    "entrepreneur_discovery",
    "epew_philosophy",
    "business_discovery",
    "document_assessment",
    "meeting_2_readiness",
    "coach_evaluation",
    "development_plan",
    "closing",
  ]);

function getMeetingStage(
  value: unknown
): EstablishmentMeetingStage {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const stage = String(
      (
        value as {
          stage?: unknown;
        }
      ).stage ?? ""
    ).trim() as EstablishmentMeetingStage;

    if (VALID_MEETING_STAGES.has(stage)) {
      return stage;
    }
  }

  return "opening";
}

function getMeetingConversation(
  value: unknown
): EstablishmentMeetingMessage[] {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return [];
  }

  const messages =
    (
      value as {
        messages?: unknown;
      }
    ).messages;

  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter(
      (
        message
      ): message is EstablishmentMeetingMessage =>
        Boolean(
          message &&
          typeof message === "object" &&
          !Array.isArray(message) &&
          (
            (message as EstablishmentMeetingMessage)
              .role === "coach" ||
            (message as EstablishmentMeetingMessage)
              .role === "entrepreneur"
          ) &&
          typeof (
            message as EstablishmentMeetingMessage
          ).content === "string" &&
          (
            message as EstablishmentMeetingMessage
          ).content.trim()
        )
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
}

async function runEstablishmentMeetingTurn(
  state: VoiceConnectionState,
  transcript: string
) {
  if (
    !state.applicationId ||
    !state.meetingId
  ) {
    throw new Error(
      "Realtime meeting turn is missing applicationId or meetingId."
    );
  }

  const {
    data: meeting,
    error,
  } = await supabase
    .from("epew_coach_meetings")
    .select(`
      id,
      application_id,
      meeting_conversation_state
    `)
    .eq("id", state.meetingId)
    .eq(
      "application_id",
      state.applicationId
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!meeting) {
    throw new Error(
      "Realtime Establishment Meeting record was not found."
    );
  }

  const stage =
    getMeetingStage(
      meeting.meeting_conversation_state
    );

  const savedConversation =
    getMeetingConversation(
      meeting.meeting_conversation_state
    );

  const conversation:
    EstablishmentMeetingMessage[] = [
      ...savedConversation,
      {
        role: "entrepreneur",
        content: transcript,
      },
    ];

  return EstablishmentMeetingRuntimeService
    .runTurn({
      applicationId:
        state.applicationId,
      meetingId:
        state.meetingId,
      stage,
      conversation,
      isAdmin: true,
      stageNotes: {
        communicationChannel:
          "phone_realtime",
        twilioCallSid:
          state.callSid,
        selectedLanguage:
          state.language,
      },
    });
}

function speakApprovedMeetingText(
  state: VoiceConnectionState,
  text: string
) {
  if (
    !state.openAiSocket ||
    state.openAiSocket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  /*
   * Realtime is the voice renderer here,
   * not the Meeting 1 decision-maker.
   *
   * The text has already been produced and
   * persisted by the EPEW Establishment
   * Meeting Engine.
   */
  state.openAiSocket.send(
    JSON.stringify({
      type: "response.create",
      response: {
        output_modalities: [
          "audio",
        ],
        instructions: `
Speak ONLY the following approved EPEW Personal Coach message.

Do not answer it.
Do not expand it.
Do not add another question.
Do not remove information.
Do not change the meeting topic.
Preserve the language of the approved message.
Speak naturally, warmly, and conversationally.
Use a calm pace with natural pauses.

APPROVED MESSAGE:
${text}
        `.trim(),
      },
    })
  );
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
                noise_reduction: {
                  type: "near_field",
                },
                transcription: {
                  model: "gpt-transcribe",
                },
                turn_detection: {
                  type: "semantic_vad",
                  create_response: false,
                  interrupt_response: false,
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
You are the realtime telephone voice layer for the EPEW Personal Coach.

You do NOT independently conduct the business meeting.
You do NOT invent coaching questions.
You do NOT decide what topic comes next.

The EPEW Establishment Meeting Engine decides the approved content.

Your responsibilities are:
1. receive the entrepreneur's telephone audio;
2. support accurate transcription;
3. speak approved EPEW Coach text naturally.

When speaking approved text:
- preserve its meaning and language;
- sound warm, professional, patient, and human;
- use natural pauses;
- use a calm conversational pace;
- do not add new content;
- do not introduce unrelated business advice;
- do not continue speaking after the approved message ends.
            `.trim(),
          },
        })
      );
    }
  );

  openAiSocket.on(
    "message",
    async (data) => {
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
          "conversation.item.input_audio_transcription.completed"
        ) {
          const transcript =
            String(
              event.transcript ?? ""
            ).trim();

          if (!transcript) {
            return;
          }

          console.log(
            "[EPEW Twilio Voice Worker] Entrepreneur speech turn transcribed."
          );

          if (state.processingTurn) {
            console.log(
              "[EPEW Twilio Voice Worker] Meeting turn already processing; duplicate transcript ignored."
            );
            return;
          }

          state.processingTurn = true;

          try {
            const result =
              await runEstablishmentMeetingTurn(
                state,
                transcript
              );

            console.log(
              `[EPEW Twilio Voice Worker] Approved Meeting 1 response ready. Response=${result.responseId}.`
            );

            speakApprovedMeetingText(
              state,
              result.message.content
            );
          } catch (error) {
            console.error(
              "[EPEW Twilio Voice Worker] Unable to process Establishment Meeting turn:",
              error
            );
          } finally {
            state.processingTurn = false;
          }

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
        processingTurn: false,
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
