import {
  validateTwilioWebhook,
} from "@/lib/twilio/validateTwilioWebhook";

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

function twimlResponse(
  response: twilio.twiml.VoiceResponse,
  status = 200
) {
  return new NextResponse(response.toString(), {
    status,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

function meetingLabel(meetingType: string | null) {
  const type = String(meetingType ?? "")
    .trim()
    .toLowerCase();

  if (
    type.includes("establishment") ||
    type.includes("first")
  ) {
    return "your EPEW Establishment Meeting";
  }

  if (type.includes("marketing")) {
    return "your EPEW Business Marketing Meeting";
  }

  if (type.includes("support")) {
    return "your EPEW Support Preparation Meeting";
  }

  return "your EPEW meeting";
}

type SupportedLanguage =
  | "en"
  | "ht"
  | "es"
  | "fr";

function voiceForLanguage(language: SupportedLanguage) {
  switch (language) {
    case "ht":
      return {
        voice: "Polly.Joanna",
        language: "en-US",
      } as const;

    case "es":
      return {
        voice: "Polly.Mia",
        language: "es-MX",
      } as const;

    case "fr":
      return {
        voice: "Polly.Lea",
        language: "fr-FR",
      } as const;

    default:
      return {
        voice: "Polly.Matthew",
        language: "en-US",
      } as const;
  }
}

function languageFromDigit(
  digit: string
): SupportedLanguage | null {
  switch (digit) {
    case "1":
      return "en";
    case "2":
      return "ht";
    case "3":
      return "es";
    case "4":
      return "fr";
    default:
      return null;
  }
}

function confirmationPrompt(
  language: SupportedLanguage
) {
  switch (language) {
    case "ht":
      return "Nou jwenn yon kont EPEW ki asosye ak nimewo telefòn sa a. Pou konfime se ou menm ki gen kont lan epi pou nou ka verifye kiyès ki te kontakte ou, peze 1.";

    case "es":
      return "Encontramos una cuenta de EPEW asociada con este número de teléfono. Para confirmar que usted es el titular de la cuenta y permitirnos verificar quién lo contactó recientemente, oprima 1.";

    case "fr":
      return "Nous avons trouvé un compte EPEW associé à ce numéro de téléphone. Pour confirmer que vous êtes le titulaire du compte et nous permettre de vérifier qui vous a récemment contacté, appuyez sur 1.";

    default:
      return "I found an EPEW account associated with the phone number you are calling from. To confirm that you are the account holder and allow me to check who recently contacted you, press 1.";
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      valid,
      params,
    } = await validateTwilioWebhook(request);

    const response =
      new twilio.twiml.VoiceResponse();

    if (!valid) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "This call could not be verified."
      );

      return twimlResponse(response, 403);
    }

    const callerPhone = normalizePhone(
      String(params.From ?? "")
    );

    const callerDigits =
      callerPhone.replace(/\D/g, "");

    const nationalPhone =
      callerDigits.length === 11 &&
      callerDigits.startsWith("1")
        ? callerDigits.slice(1)
        : callerDigits;

    const phoneLookupValues = Array.from(
      new Set(
        [
          callerPhone,
          callerDigits,
          nationalPhone,
          nationalPhone
            ? `+1${nationalPhone}`
            : "",
          nationalPhone
            ? `1${nationalPhone}`
            : "",
        ].filter(Boolean)
      )
    );

    const digits = String(
      params.Digits ?? ""
    ).trim();

    const url = new URL(request.url);

    const step = String(
      url.searchParams.get("step") ?? "language"
    )
      .trim()
      .toLowerCase();

    const selectedLanguage = String(
      url.searchParams.get("lang") ?? ""
    )
      .trim()
      .toLowerCase() as SupportedLanguage;

    const callSid = String(
      params.CallSid ?? ""
    ).trim();

    const calledNumber = normalizePhone(
      String(params.To ?? "")
    );

    const callNow = new Date().toISOString();

    /*
     * Record the inbound call immediately.
     *
     * The same Twilio Call SID is used throughout
     * Gather callbacks, so this remains idempotent.
     */
    if (callSid) {
      const {
        error: inboundHistoryError,
      } = await supabaseAdmin
        .from("epew_voice_calls")
        .upsert(
          {
            twilio_call_sid: callSid,
            direction: "inbound",
            from_number:
              callerPhone || null,
            to_number:
              calledNumber || null,
            department:
              "call_recovery",
            purpose:
              "callback_recovery",
            call_status:
              String(
                params.CallStatus ?? "in-progress"
              )
                .trim()
                .toLowerCase(),
            initiated_at: callNow,
            answered_at: callNow,
            verification_status:
              "unverified",
            metadata: {
              provider: "twilio",
              source:
                "epew_inbound_call_recovery",
            },
          },
          {
            onConflict: "twilio_call_sid",
          }
        );

      if (inboundHistoryError) {
        console.error(
          "Unable to record EPEW inbound voice history:",
          inboundHistoryError
        );
      }
    }

    if (!callerPhone) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "Thank you for calling EPEW. We could not identify the phone number you are calling from."
      );

      return twimlResponse(response);
    }

    const publicBaseUrl =
      requireEnvironment(
        "EPEW_PUBLIC_BASE_URL"
      );

    if (step === "language") {
      if (!digits) {
        const gather = response.gather({
          action:
            `${publicBaseUrl}/api/twilio/voice/inbound?step=language`,
          method: "POST",
          numDigits: 1,
          timeout: 8,
        });

        /*
         * Announce each language separately so
         * one English voice does not attempt to
         * pronounce all four languages.
         */
        gather.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          "Welcome to E. P. E. W. Ekero Partners Empower Wealth. For English, press 1."
        );

        gather.say(
          {
            voice: "Polly.Joanna",
            language: "en-US",
          },
          "Pou Kreyòl Ayisyen, peze de."
        );

        gather.say(
          {
            voice: "Polly.Mia",
            language: "es-MX",
          },
          "Para español, oprima 3."
        );

        gather.say(
          {
            voice: "Polly.Lea",
            language: "fr-FR",
          },
          "Pour le français, appuyez sur 4."
        );

        response.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          "We did not receive a language selection. Please call again."
        );

        return twimlResponse(response);
      }

      const language =
        languageFromDigit(digits);

      if (!language) {
        response.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          "That selection is not valid. Please call again and choose 1, 2, 3, or 4."
        );

        return twimlResponse(response);
      }

      response.redirect(
        {
          method: "POST",
        },
        `${publicBaseUrl}/api/twilio/voice/inbound?step=confirm&lang=${language}`
      );

      return twimlResponse(response);
    }

    const language: SupportedLanguage =
      ["en", "ht", "es", "fr"].includes(
        selectedLanguage
      )
        ? selectedLanguage
        : "en";

    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .from("entrepreneur_applications")
      .select(`
        id,
        full_name,
        phone,
        business_name,
        coach_name,
        assigned_coach_name
      `)
      .in("phone", phoneLookupValues)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    if (application && callSid) {
      const recognizedCoachName = String(
        application.assigned_coach_name ??
        application.coach_name ??
        ""
      ).trim();

      const {
        error: recognitionHistoryError,
      } = await supabaseAdmin
        .from("epew_voice_calls")
        .update({
          application_id:
            application.id,
          agent_role:
            "personal_coach",
          agent_name:
            recognizedCoachName || null,
          verification_status:
            "caller_id_matched",
          metadata: {
            provider: "twilio",
            source:
              "epew_inbound_call_recovery",
            entrepreneur_name:
              application.full_name ?? null,
            business_name:
              application.business_name ?? null,
          },
        })
        .eq(
          "twilio_call_sid",
          callSid
        );

      if (recognitionHistoryError) {
        console.error(
          "Unable to update recognized EPEW inbound caller:",
          recognitionHistoryError
        );
      }
    }

    if (!application) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "Thank you for calling EPEW. I am the EPEW Call Recovery Assistant. I could not automatically match this phone number to an EPEW account."
      );

      response.pause({
        length: 1,
      });

      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "For your privacy, I cannot provide information about recent EPEW calls until your identity is verified. Please call again from the phone number registered with your EPEW account or contact EPEW support."
      );

      return twimlResponse(response);
    }

    if (!digits) {
      const gather = response.gather({
        input: ["dtmf"],
        action:
          `${publicBaseUrl}/api/twilio/voice/inbound?step=confirm&lang=${language}`,
        method: "POST",
        numDigits: 1,
        timeout: 10,
        actionOnEmptyResult: true,
      });

      gather.say(
        voiceForLanguage(language),
        confirmationPrompt(language)
      );

      response.say(
        voiceForLanguage(language),
        language === "ht"
          ? "Nou pa resevwa konfimasyon ou. Tanpri rele ankò lè ou pare."
          : language === "es"
          ? "No recibimos su confirmación. Por favor, vuelva a llamar cuando esté listo."
          : language === "fr"
          ? "Nous n'avons pas reçu votre confirmation. Veuillez rappeler lorsque vous serez prêt."
          : "I did not receive your confirmation. Please call again when you are ready."
      );

      return twimlResponse(response);
    }

    if (digits !== "1") {
      response.say(
        voiceForLanguage(language),
        language === "ht"
          ? "Idantite ou pa konfime. Pou pwoteje enfòmasyon ou, nou pa kapab bay detay sou apèl EPEW ki asosye ak kont sa a."
          : language === "es"
          ? "Su identidad no fue confirmada. Para proteger su privacidad, no podemos proporcionar información sobre llamadas de EPEW asociadas con esta cuenta."
          : language === "fr"
          ? "Votre identité n'a pas été confirmée. Pour protéger votre vie privée, nous ne pouvons pas fournir d'informations sur les appels EPEW associés à ce compte."
          : "Your identity was not confirmed. For your privacy, I cannot provide information about EPEW calls associated with this account."
      );

      return twimlResponse(response);
    }

    const {
      data: recentMeeting,
      error: meetingError,
    } = await supabaseAdmin
      .from("epew_coach_meetings")
      .select(`
        id,
        application_id,
        meeting_type,
        meeting_status,
        meeting_provider,
        scheduled_at,
        twilio_call_sid,
        twilio_call_status,
        twilio_call_started_at,
        twilio_call_answered_at,
        twilio_call_ended_at
      `)
      .eq(
        "application_id",
        application.id
      )
      .eq(
        "meeting_provider",
        "phone"
      )
      .not(
        "twilio_call_started_at",
        "is",
        null
      )
      .order(
        "twilio_call_started_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (meetingError) {
      throw meetingError;
    }

    if (!recentMeeting) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "Thank you. Your account has been confirmed. I could not find a recent EPEW phone call associated with this account."
      );

      return twimlResponse(response);
    }

    /*
     * Find the permanent outbound call record.
     *
     * Older calls may predate epew_voice_calls,
     * so failure to find one must not interrupt
     * the recovery experience.
     */
    let originalVoiceCallId:
      string | null = null;

    const {
      data: originalVoiceCall,
      error: originalVoiceCallError,
    } = await supabaseAdmin
      .from("epew_voice_calls")
      .select("id")
      .eq(
        "direction",
        "outbound"
      )
      .eq(
        "application_id",
        application.id
      )
      .eq(
        "meeting_id",
        recentMeeting.id
      )
      .order(
        "initiated_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (originalVoiceCallError) {
      console.error(
        "Unable to locate original EPEW outbound voice call:",
        originalVoiceCallError
      );
    } else {
      originalVoiceCallId =
        originalVoiceCall?.id ?? null;
    }

    if (callSid) {
      const {
        error: confirmationHistoryError,
      } = await supabaseAdmin
        .from("epew_voice_calls")
        .update({
          application_id:
            application.id,
          meeting_id:
            recentMeeting.id,
          recovery_of_call_id:
            originalVoiceCallId,
          verification_status:
            "confirmed",
          call_status:
            "in-progress",
          answered_at:
            callNow,
        })
        .eq(
          "twilio_call_sid",
          callSid
        );

      if (confirmationHistoryError) {
        console.error(
          "Unable to link EPEW return call to original call:",
          confirmationHistoryError
        );
      }
    }

    const coachName =
      String(
        application.assigned_coach_name ??
        application.coach_name ??
        ""
      ).trim();

    const purpose = meetingLabel(
      recentMeeting.meeting_type
    );

    if (coachName) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        `Thank you. I found the recent call. Your EPEW Personal Coach, ${coachName}, was trying to reach you regarding ${purpose}.`
      );
    } else {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        `Thank you. I found the recent call. An EPEW representative was trying to reach you regarding ${purpose}.`
      );
    }

    const meetingStatus = String(
      recentMeeting.meeting_status ?? ""
    )
      .trim()
      .toLowerCase();

    const reconnectableStatuses = new Set([
      "scheduled",
      "ready_to_start",
      "in_progress",
    ]);

    if (
      reconnectableStatuses.has(
        meetingStatus
      )
    ) {
      const publicBaseUrl =
        requireEnvironment(
          "EPEW_PUBLIC_BASE_URL"
        );

      response.pause({
        length: 1,
      });

      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        coachName
          ? `Please hold while I connect you to your EPEW Personal Coach, ${coachName}.`
          : "Please hold while I connect you to your EPEW Personal Coach."
      );

      response.pause({
        length: 4,
      });

      response.redirect(
        {
          method: "POST",
        },
        `${publicBaseUrl}/api/twilio/voice/establishment-meeting?meetingId=${encodeURIComponent(
          recentMeeting.id
        )}`
      );

      return twimlResponse(response);
    }

    response.pause({
      length: 1,
    });

    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "That call is no longer available for automatic reconnection."
    );

    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "EPEW will need to arrange another connection with the person who contacted you."
    );

    return twimlResponse(response);
  } catch (error) {
    console.error(
      "EPEW inbound call recovery error:",
      error
    );

    const response =
      new twilio.twiml.VoiceResponse();

    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "Thank you for calling EPEW. We are unable to complete the call recovery process right now. Please try again shortly."
    );

    return twimlResponse(
      response,
      500
    );
  }
}
