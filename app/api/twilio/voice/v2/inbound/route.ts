import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

import {
  validateTwilioWebhook,
} from "@/lib/twilio/validateTwilioWebhook";

import {
  approvedHaitianAudioUrl,
} from "@/lib/twilio/voice-v2/ApprovedAudioRegistry";

import {
  haitianDynamicTtsUrl,
} from "@/lib/twilio/voice-v2/HaitianDynamicTts";

import {
  VoiceSessionEngine,
} from "@/lib/twilio/voice-v2/VoiceSessionEngine";

import type {
  VoiceLanguage,
} from "@/lib/twilio/voice-v2/VoiceState";

import {
  CallerIdentificationService,
} from "@/lib/services/phone-v2/CallerIdentificationService";

import {
  MeetingDecisionService,
} from "@/lib/services/phone-v2/MeetingDecisionService";

import {
  AvailabilityUnderstandingService,
} from "@/lib/services/phone-v2/AvailabilityUnderstandingService";

import {
  PhoneAppointmentBookingService,
} from "@/lib/services/scheduling/PhoneAppointmentBookingService";

import {
  Segment01Handler,
} from "@/lib/twilio/voice-v2/segments/segment-01/Segment01Handler";

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
  return String(value ?? "")
    .replace(/[^\d+]/g, "")
    .trim();
}

function voiceForLanguage(
  language: VoiceLanguage
) {
  switch (language) {
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

function accountConfirmationPrompt(
  language: VoiceLanguage
) {
  switch (language) {
    case "es":
      return "Encontramos una cuenta de EPEW asociada con este número de teléfono. Para confirmar su cuenta, oprima el número 1.";

    case "fr":
      return "Nous avons trouvé un compte EPEW associé à ce numéro de téléphone. Pour confirmer votre compte, appuyez sur le numéro 1.";

    default:
      return "I found an EPEW account associated with the phone number you are calling from. To confirm your account, press number 1.";
  }
}

function formatAppointmentTime(
  iso: string,
  language: VoiceLanguage
) {
  const date = new Date(iso);

  const locale =
    language === "fr"
      ? "fr-FR"
      : language === "es"
      ? "es-US"
      : "en-US";

  const dateText =
    new Intl.DateTimeFormat(locale, {
      timeZone: "America/New_York",
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(date);

  const timeText =
    new Intl.DateTimeFormat(locale, {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);

  return `${dateText} at ${timeText}`;
}

function mainMenuPrompt(
  language: VoiceLanguage
) {
  switch (language) {
    case "es":
      return "Menú principal de EPEW. Para su reunión de EPEW o para hablar con su Coach Personal, presione 1. Para programar o reprogramar una cita, presione 2. Para otra asistencia de EPEW, presione 3. Para repetir este menú, presione 9.";

    case "fr":
      return "Menu principal EPEW. Pour votre réunion EPEW ou pour parler avec votre Coach Personnel, appuyez sur 1. Pour programmer ou reprogrammer un rendez-vous, appuyez sur 2. Pour une autre assistance EPEW, appuyez sur 3. Pour répéter ce menu, appuyez sur 9.";

    case "ht":
      return "Meni prensipal EPE W. Pou reyinyon EPE W ou oswa pou pale ak Konseye Pèsonèl EPE W la, peze nimewo 1. Pou pwograme oswa repwograme yon randevou, peze nimewo 2. Pou lòt asistans EPE W, peze nimewo 3. Pou tande meni sa a ankò, peze nimewo 9.";

    default:
      return "EPEW main menu. For your EPEW meeting or to talk to your Personal Coach, press 1. To schedule or reschedule an appointment, press 2. For other EPEW assistance, press 3. To repeat this menu, press 9.";
  }
}

function meetingMenuPrompt(
  language: VoiceLanguage
) {
  switch (language) {
    case "es":
      return "Su reunión está disponible ahora. Para hablar con su Coach Personal de EPEW, presione 1. Para otra asistencia de EPEW, presione 2. Para volver al menú principal, presione 3.";

    case "fr":
      return "Votre réunion est disponible maintenant. Pour parler avec votre Coach Personnel EPEW, appuyez sur 1. Pour une autre assistance EPEW, appuyez sur 2. Pour revenir au menu principal, appuyez sur 3.";

    case "ht":
      return "Reyinyon EPE W ou a disponib kounye a. Pou pale ak Konseye Pèsonèl EPE W la, peze nimewo 1. Pou lòt asistans EPE W, peze nimewo 2. Pou retounen nan meni prensipal la, peze nimewo 3.";

    default:
      return "Your EPEW meeting is available now. To talk to your EPEW Personal Coach, press 1. For other EPEW assistance, press 2. To return to the main menu, press 3.";
  }
}

function schedulingOfferPrompt(
  language: VoiceLanguage
) {
  switch (language) {
    case "es":
      return "No encontré una reunión telefónica disponible para conectar ahora. Si desea que le ayude a programar una cita, oprima el número 1.";

    case "fr":
      return "Je n'ai pas trouvé de réunion téléphonique disponible pour vous connecter maintenant. Si vous souhaitez que je vous aide à prendre rendez-vous, appuyez sur le numéro 1.";

    default:
      return "I did not find a phone meeting available to connect right now. If you would like me to help schedule an appointment, press number 1.";
  }
}

function memberAssistanceMenuPrompt(
  language: VoiceLanguage
) {
  switch (language) {
    case "ht":
      return "Pou enfòmasyon sou fason pou fè pati EPEW, tanpri fè chwa ou. Pou vin yon Sipòtè, peze 1. Pou vin yon Antreprenè, peze 2. Pou vin yon Coach, peze 3. Pou vin yon Patnè, peze 4. Pou vin yon Vendor, peze 5. Pou retounen nan meni prensipal la, peze 9.";

    case "es":
      return "Para obtener información sobre cómo formar parte de EPEW, haga su elección. Para convertirse en Supporter, presione 1. Para convertirse en Emprendedor, presione 2. Para convertirse en Coach, presione 3. Para convertirse en Partner, presione 4. Para convertirse en Vendor, presione 5. Para volver al menú principal, presione 9.";

    case "fr":
      return "Pour obtenir des informations sur la façon de rejoindre EPEW, faites votre choix. Pour devenir Supporter, appuyez sur 1. Pour devenir Entrepreneur, appuyez sur 2. Pour devenir Coach, appuyez sur 3. Pour devenir Partner, appuyez sur 4. Pour devenir Vendor, appuyez sur 5. Pour revenir au menu principal, appuyez sur 9.";

    default:
      return "For information about becoming part of EPEW, please make your choice. To become a Supporter, press 1. To become an Entrepreneur, press 2. To become a Coach, press 3. To become a Partner, press 4. To become a Vendor, press 5. To return to the main menu, press 9.";
  }
}

function memberAssistanceResponse(
  language: VoiceLanguage,
  digit: string
) {
  const responses: Record<
    string,
    Record<VoiceLanguage, string>
  > = {
    "1": {
      en: "Thank you for your interest in becoming an EPEW Supporter. Please visit epew.us, click EPEW Team, and then click Supporters. You may support through a direct link from a local business or friend, choose a business yourself, or let EPEW select a qualified business for you.",
      ht: "Mèsi paske ou enterese vin yon Sipòtè EPEW. Tanpri vizite epew.us, klike sou EPEW Team, epi klike sou Supporters. Ou ka sipòte atravè yon lyen dirèk nan men yon biznis lokal oswa yon zanmi, chwazi yon biznis ou menm, oswa kite EPEW chwazi yon biznis kalifye pou ou.",
      es: "Gracias por su interés en convertirse en Supporter de EPEW. Visite epew.us, haga clic en EPEW Team y luego en Supporters. Puede apoyar mediante un enlace directo de un negocio local o amigo, elegir un negocio usted mismo o permitir que EPEW seleccione un negocio calificado por usted.",
      fr: "Merci de votre intérêt à devenir Supporter EPEW. Visitez epew.us, cliquez sur EPEW Team, puis sur Supporters. Vous pouvez soutenir par un lien direct provenant d'une entreprise locale ou d'un ami, choisir vous-même une entreprise, ou laisser EPEW sélectionner une entreprise qualifiée pour vous.",
    },

    "2": {
      en: "Thank you for your interest in becoming an EPEW Entrepreneur. Please visit epew.us, click EPEW Team, and then click Entrepreneurs for more information and to get started.",
      ht: "Mèsi paske ou enterese vin yon Antreprenè EPEW. Tanpri vizite epew.us, klike sou EPEW Team, epi klike sou Entrepreneurs pou plis enfòmasyon ak pou kòmanse.",
      es: "Gracias por su interés en convertirse en Emprendedor de EPEW. Visite epew.us, haga clic en EPEW Team y luego en Entrepreneurs para obtener más información y comenzar.",
      fr: "Merci de votre intérêt à devenir Entrepreneur EPEW. Visitez epew.us, cliquez sur EPEW Team, puis sur Entrepreneurs pour obtenir plus d'informations et commencer.",
    },

    "3": {
      en: "Thank you for your interest in becoming an EPEW Coach. Please visit epew.us, click EPEW Team, and then click Coaches for more information.",
      ht: "Mèsi paske ou enterese vin yon Coach EPEW. Tanpri vizite epew.us, klike sou EPEW Team, epi klike sou Coaches pou plis enfòmasyon.",
      es: "Gracias por su interés en convertirse en Coach de EPEW. Visite epew.us, haga clic en EPEW Team y luego en Coaches para obtener más información.",
      fr: "Merci de votre intérêt à devenir Coach EPEW. Visitez epew.us, cliquez sur EPEW Team, puis sur Coaches pour plus d'informations.",
    },

    "4": {
      en: "Thank you for your interest in becoming an EPEW Partner. Please visit epew.us, click EPEW Team, and then click Partners for more information.",
      ht: "Mèsi paske ou enterese vin yon Patnè EPEW. Tanpri vizite epew.us, klike sou EPEW Team, epi klike sou Partners pou plis enfòmasyon.",
      es: "Gracias por su interés en convertirse en Partner de EPEW. Visite epew.us, haga clic en EPEW Team y luego en Partners para obtener más información.",
      fr: "Merci de votre intérêt à devenir Partner EPEW. Visitez epew.us, cliquez sur EPEW Team, puis sur Partners pour plus d'informations.",
    },

    "5": {
      en: "Thank you for your interest in becoming an EPEW Vendor. Please visit epew.us, click EPEW Team, and then click Vendors for more information.",
      ht: "Mèsi paske ou enterese vin yon Vendor EPEW. Tanpri vizite epew.us, klike sou EPEW Team, epi klike sou Vendors pou plis enfòmasyon.",
      es: "Gracias por su interés en convertirse en Vendor de EPEW. Visite epew.us, haga clic en EPEW Team y luego en Vendors para obtener más información.",
      fr: "Merci de votre intérêt à devenir Vendor EPEW. Visitez epew.us, cliquez sur EPEW Team, puis sur Vendors pour plus d'informations.",
    },
  };

  return responses[digit]?.[language] ?? null;
}

function returnToMenuPrompt(
  language: VoiceLanguage
) {
  switch (language) {
    case "es":
      return "Para volver al menú, presione 9.";

    case "fr":
      return "Pour revenir au menu, appuyez sur 9.";

    case "ht":
      return "Pou retounen nan meni an, peze nimewo 9.";

    default:
      return "To return to the menu, press 9.";
  }
}

export async function POST(
  request: NextRequest
) {
  const requestedStep = String(
    new URL(request.url).searchParams.get("step") ??
      "language"
  )
    .trim()
    .toLowerCase();

  /*
   * =========================================================
   * SEGMENT #1 — CALL ENTRY & CORE VOICE FOUNDATION
   * =========================================================
   *
   * Segment #1 owns the initial call and every language
   * selection callback. It returns only after handing the
   * session to Segment #2 at state identify_caller.
   */
  if (requestedStep === "language") {
    return Segment01Handler.handle(request);
  }

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

    const publicBaseUrl =
      requireEnvironment(
        "EPEW_PUBLIC_BASE_URL"
      );

    const callSid = String(
      params.CallSid ?? ""
    ).trim();

    const callerPhone = normalizePhone(
      String(params.From ?? "")
    );

    const digits = String(
      params.Digits ?? ""
    ).trim();

    const url = new URL(request.url);

    const step = String(
      url.searchParams.get("step") ??
        "language"
    )
      .trim()
      .toLowerCase();

    const attempt = Math.max(
      0,
      Number(
        url.searchParams.get("attempt") ??
          "0"
      ) || 0
    );

    if (!callSid) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "We could not establish a call session."
      );

      return twimlResponse(response);
    }

    const session =
      await VoiceSessionEngine.getOrCreate({
        callSid,
        callerPhone,
      });

    const language =
      session.language ?? "en";

    /*
     * =========================================================
     * STEP 2 — IDENTIFY CALLER
     * =========================================================
     */
    if (step === "identify") {
      const caller =
        await CallerIdentificationService.identify(
          callerPhone
        );

      if (!caller) {
        await VoiceSessionEngine.transition(
          callSid,
          "prospect_intake",
          {
            callerPhone,
          }
        );

        response.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          "Thank you for calling EPEW. I did not find an existing entrepreneur account for this phone number. The new caller assistance flow will continue here."
        );

        return twimlResponse(response);
      }

      await VoiceSessionEngine.transition(
        callSid,
        "confirm_account",
        {
          callerPhone,
          applicationId:
            caller.applicationId,
          entrepreneurName:
            caller.entrepreneurName,
          coachName:
            caller.coachName,
        }
      );

      response.redirect(
        {
          method: "POST",
        },
        `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=confirm`
      );

      return twimlResponse(response);
    }

    /*
     * =========================================================
     * STEP 3 — CONFIRM ACCOUNT
     * =========================================================
     */
    if (step === "confirm") {
      const current =
        await VoiceSessionEngine.get(callSid);

      if (!current?.applicationId) {
        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=identify`
        );

        return twimlResponse(response);
      }

      if (!digits) {
        const gather = response.gather({
          input: ["dtmf"],
          action:
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=confirm&attempt=${attempt}`,
          method: "POST",
          numDigits: 1,
          timeout: 10,
          actionOnEmptyResult: true,
        });

        if (language === "ht") {
          gather.play(
            approvedHaitianAudioUrl(
              publicBaseUrl,
              "accountConfirmation"
            )
          );
        } else {
          gather.say(
            voiceForLanguage(language),
            accountConfirmationPrompt(
              language
            )
          );
        }

        return twimlResponse(response);
      }

      if (digits !== "1") {
        if (attempt >= 1) {
          await VoiceSessionEngine.transition(
            callSid,
            "recovery"
          );

          response.say(
            voiceForLanguage(language),
            language === "es"
              ? "No pudimos confirmar su cuenta. Por favor llame nuevamente cuando esté listo."
              : language === "fr"
              ? "Nous n'avons pas pu confirmer votre compte. Veuillez nous rappeler lorsque vous serez prêt."
              : language === "ht"
              ? "Nou pa t kapab konfime kont ou a. Tanpri rele EPEW ankò lè ou pare."
              : "We were unable to confirm your account. Please call EPEW again when you are ready."
          );

          return twimlResponse(response);
        }

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=confirm&attempt=${
            attempt + 1
          }`
        );

        return twimlResponse(response);
      }

      await VoiceSessionEngine.transition(
        callSid,
        "check_meeting"
      );

      response.redirect(
        {
          method: "POST",
        },
        `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=meeting`
      );

      return twimlResponse(response);
    }

    /*
     * =========================================================
     * STEP 4 — CHECK MEETING
     * =========================================================
     */
    if (step === "meeting") {
      const current =
        await VoiceSessionEngine.get(callSid);

      if (!current?.applicationId) {
        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=identify`
        );

        return twimlResponse(response);
      }

      const meetingDecision =
        await MeetingDecisionService.decide(
          current.applicationId
        );

      if (
        meetingDecision.outcome ===
        "available_now"
      ) {
        await VoiceSessionEngine.transition(
          callSid,
          "meeting_menu",
          {
            meetingId:
              meetingDecision.meetingId,
          }
        );

        const meetingMenuGather =
          response.gather({
            input: ["dtmf"],
            action:
              `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=meeting_menu`,
            method: "POST",
            numDigits: 1,
            timeout: 12,
            actionOnEmptyResult: true,
          });

        meetingMenuGather.say(
          voiceForLanguage(language),
          meetingMenuPrompt(language)
        );

        return twimlResponse(response);
      }

      if (
        meetingDecision.outcome ===
        "scheduled_later"
      ) {
        await VoiceSessionEngine.transition(
          callSid,
          "main_menu",
          {
            meetingId:
              meetingDecision.meetingId,
          }
        );

        const scheduledTime =
          meetingDecision.scheduledAt
            ? formatAppointmentTime(
                meetingDecision.scheduledAt,
                language
              )
            : null;

        response.say(
          voiceForLanguage(language),
          language === "es"
            ? scheduledTime
              ? `Su reunión está programada para ${scheduledTime}. Todavía no está disponible para comenzar.`
              : "Su reunión está programada para más tarde y todavía no está disponible para comenzar."
            : language === "fr"
            ? scheduledTime
              ? `Votre réunion est prévue pour ${scheduledTime}. Elle n'est pas encore disponible pour commencer.`
              : "Votre réunion est prévue pour plus tard et n'est pas encore disponible pour commencer."
            : language === "ht"
            ? scheduledTime
              ? `Reyinyon EPE W ou a pwograme pou ${scheduledTime}. Li poko disponib pou kòmanse.`
              : "Reyinyon EPE W ou a pwograme pou pita. Li poko disponib pou kòmanse."
            : scheduledTime
            ? `Your EPEW meeting is scheduled for ${scheduledTime}. It is not available to start yet.`
            : "Your EPEW meeting is scheduled for later and is not available to start yet."
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=main_menu`
        );

        return twimlResponse(response);
      }

      if (
        meetingDecision.outcome ===
        "reschedule_required"
      ) {
        await VoiceSessionEngine.transition(
          callSid,
          "schedule_offer",
          {
            meetingId:
              meetingDecision.meetingId,
          }
        );

        const gather = response.gather({
          input: ["dtmf"],
          action:
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=schedule_offer`,
          method: "POST",
          numDigits: 1,
          timeout: 10,
          actionOnEmptyResult: true,
        });

        gather.say(
          voiceForLanguage(language),
          language === "es"
            ? "Su reunión necesita ser reprogramada. Para indicar una nueva disponibilidad, presione 1. Para finalizar esta llamada, presione 2."
            : language === "fr"
            ? "Votre réunion doit être reprogrammée. Pour indiquer de nouvelles disponibilités, appuyez sur 1. Pour terminer cet appel, appuyez sur 2."
            : language === "ht"
            ? "Reyinyon EPE W ou a bezwen repwograme. Pou bay nouvo lè ou disponib, peze nimewo 1. Pou fini apèl sa a, peze nimewo 2."
            : "Your EPEW meeting needs to be rescheduled. To provide new availability, press 1. To finish this call, press 2."
        );

        return twimlResponse(response);
      }

      await VoiceSessionEngine.transition(
        callSid,
        "schedule_offer",
        {
          meetingId:
            meetingDecision.meetingId,
        }
      );

      const gather = response.gather({
        input: ["dtmf"],
        action:
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=schedule_offer`,
        method: "POST",
        numDigits: 1,
        timeout: 10,
        actionOnEmptyResult: true,
      });

      if (language === "ht") {
        gather.play(
          approvedHaitianAudioUrl(
            publicBaseUrl,
            "noMeetingScheduleOffer"
          )
        );
      } else {
        gather.say(
          voiceForLanguage(language),
          schedulingOfferPrompt(language)
        );
      }

      return twimlResponse(response);
    }

    /*
     * =========================================================
     * STEP 4A — MAIN MENU
     * =========================================================
     *
     * 1 = My EPEW meeting / Personal Coach
     * 2 = Schedule or reschedule
     * 3 = Other EPEW assistance
     * 9 = Repeat main menu
     */
    if (step === "main_menu") {
      const current =
        await VoiceSessionEngine.get(callSid);

      if (!current?.applicationId) {
        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=identify`
        );

        return twimlResponse(response);
      }

      if (digits === "1") {
        await VoiceSessionEngine.transition(
          callSid,
          "check_meeting"
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=meeting`
        );

        return twimlResponse(response);
      }

      if (digits === "2") {
        const meetingDecision =
          await MeetingDecisionService.decide(
            current.applicationId
          );

        /*
         * Do not replace a meeting that is already
         * inside its active start window.
         */
        if (
          meetingDecision.outcome ===
          "available_now"
        ) {
          await VoiceSessionEngine.transition(
            callSid,
            "meeting_menu",
            {
              meetingId:
                meetingDecision.meetingId,
            }
          );

          response.redirect(
            {
              method: "POST",
            },
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=meeting_menu`
          );

          return twimlResponse(response);
        }

        /*
         * A completed Establishment Meeting should
         * not be scheduled again through this flow.
         */
        if (
          meetingDecision.outcome ===
          "completed"
        ) {
          response.say(
            voiceForLanguage(language),
            language === "es"
              ? "Su reunión de establecimiento ya fue completada."
              : language === "fr"
              ? "Votre réunion d'établissement a déjà été complétée."
              : language === "ht"
              ? "Reyinyon etablisman EPE W ou a deja fini."
              : "Your EPEW Establishment Meeting has already been completed."
          );

          response.redirect(
            {
              method: "POST",
            },
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=main_menu`
          );

          return twimlResponse(response);
        }

        await VoiceSessionEngine.transition(
          callSid,
          "schedule_offer",
          {
            meetingId:
              meetingDecision.meetingId,
          }
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=schedule_offer`
        );

        return twimlResponse(response);
      }

      if (digits === "3") {
        await VoiceSessionEngine.transition(
          callSid,
          "member_assistance"
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=member_assistance`
        );

        return twimlResponse(response);
      }

      const mainMenuGather =
        response.gather({
          input: ["dtmf"],
          action:
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=main_menu`,
          method: "POST",
          numDigits: 1,
          timeout: 12,
          actionOnEmptyResult: true,
        });

      mainMenuGather.say(
        voiceForLanguage(language),
        mainMenuPrompt(language)
      );

      return twimlResponse(response);
    }

    /*
     * =========================================================
     * STEP 4B — MEETING DECISION MENU
     * =========================================================
     *
     * 1 = Join / talk to Personal Coach
     * 2 = Other EPEW assistance
     * 3 = Main menu
     *
     * The meeting is always re-checked immediately before
     * transferring to the coach.
     */
    if (step === "meeting_menu") {
      const current =
        await VoiceSessionEngine.get(callSid);

      if (!current?.applicationId) {
        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=identify`
        );

        return twimlResponse(response);
      }

      if (digits === "1") {
        const meetingDecision =
          await MeetingDecisionService.decide(
            current.applicationId
          );

        if (
          meetingDecision.outcome !==
            "available_now" ||
          !meetingDecision.meetingId
        ) {
          await VoiceSessionEngine.complete(
            callSid
          );

          if (language === "ht") {
            response.play(
              haitianDynamicTtsUrl(
                publicBaseUrl,
                "Konseye Pèsonèl ou a pa disponib kounye a. Tanpri ale sou pòtal EPE W la pou pwograme yon nouvo randevou. Mèsi."
              )
            );
          } else {
            response.say(
              voiceForLanguage(language),
              language === "es"
                ? "Su Coach Personal no está disponible en este momento. Por favor, vaya a su portal de EPEW y programe una nueva cita. Gracias."
                : language === "fr"
                ? "Votre Coach Personnel n'est pas disponible pour le moment. Veuillez vous rendre sur votre portail E P E W afin de programmer un nouveau rendez-vous. Merci."
                : "Your Personal Coach is not available right now. Please go to your EPEW portal and schedule a new meeting. Thank you."
            );
          }

          response.hangup();

          return twimlResponse(response);
        }

        await VoiceSessionEngine.transition(
          callSid,
          "meeting_connect",
          {
            meetingId:
              meetingDecision.meetingId,
          }
        );

        if (language === "ht") {
          response.play(
            approvedHaitianAudioUrl(
              publicBaseUrl,
              "connectingCoach"
            )
          );
        } else {
          response.say(
            voiceForLanguage(language),
            language === "es"
              ? "Por favor, permanezca en la línea mientras le conecto con su Coach Personal de EPEW."
              : language === "fr"
              ? "Veuillez rester en ligne pendant que je vous connecte avec votre Coach Personnel EPEW."
              : "Please stay on the line while I connect you to your EPEW Personal Coach."
          );
        }

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/establishment-meeting?meetingId=${encodeURIComponent(
            meetingDecision.meetingId
          )}&lang=${encodeURIComponent(language)}`
        );

        return twimlResponse(response);
      }

      if (digits === "2") {
        await VoiceSessionEngine.transition(
          callSid,
          "member_assistance"
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=member_assistance`
        );

        return twimlResponse(response);
      }

      if (digits === "3") {
        await VoiceSessionEngine.transition(
          callSid,
          "main_menu"
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=main_menu`
        );

        return twimlResponse(response);
      }

      const meetingMenuGather =
        response.gather({
          input: ["dtmf"],
          action:
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=meeting_menu`,
          method: "POST",
          numDigits: 1,
          timeout: 12,
          actionOnEmptyResult: true,
        });

      meetingMenuGather.say(
        voiceForLanguage(language),
        meetingMenuPrompt(language)
      );

      return twimlResponse(response);
    }

    /*
     * =========================================================
     * STEP 5 — SCHEDULING OFFER
     * =========================================================
     *
     * Availability processing will be implemented next.
     */
    if (step === "schedule_offer") {
      if (digits === "1") {
        await VoiceSessionEngine.transition(
          callSid,
          "schedule_capture",
          {
            schedulingAttempt: 0,
          }
        );

        const gather = response.gather({
          input: ["speech"],
          action:
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=schedule_capture`,
          method: "POST",
          timeout: 10,
          speechTimeout: "auto",
          actionOnEmptyResult: true,
        });

        if (language === "ht") {
          gather.play(
            approvedHaitianAudioUrl(
              publicBaseUrl,
              "scheduleAvailability"
            )
          );
        } else {
          gather.say(
            voiceForLanguage(language),
            language === "es"
              ? "Por favor, dígame qué día y a qué hora está disponible para hablar con su Coach Personal."
              : language === "fr"
              ? "Veuillez me dire quel jour et à quelle heure vous êtes disponible pour parler avec votre Coach Personnel."
              : "Please tell me what day and time you are available to speak with your Personal Coach."
          );
        }

        return twimlResponse(response);
      }

      if (digits === "2") {
        await VoiceSessionEngine.complete(
          callSid
        );

        if (language === "ht") {
          response.play(
            approvedHaitianAudioUrl(
              publicBaseUrl,
              "goodbye"
            )
          );
        } else {
          response.say(
            voiceForLanguage(language),
            language === "es"
              ? "Gracias por llamar a EPEW. Que tenga un excelente día. Adiós."
              : language === "fr"
              ? "Merci d'avoir appelé E P E W. Passez une excellente journée. Au revoir."
              : "Thank you for calling EPEW. Have a wonderful day. Goodbye."
          );
        }

        response.hangup();

        return twimlResponse(response);
      }

      const retryGather = response.gather({
        input: ["dtmf"],
        action:
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=schedule_offer`,
        method: "POST",
        numDigits: 1,
        timeout: 10,
        actionOnEmptyResult: true,
      });

      if (language === "ht") {
        retryGather.play(
          approvedHaitianAudioUrl(
            publicBaseUrl,
            "noMeetingScheduleOffer"
          )
        );
      } else {
        retryGather.say(
          voiceForLanguage(language),
          schedulingOfferPrompt(language)
        );
      }

      return twimlResponse(response);
    }

    /*
     * =========================================================
     * STEP 6 — CAPTURE + INTERPRET AVAILABILITY
     * =========================================================
     *
     * V2 RULE:
     * One spoken submission -> one interpretation.
     * We do not automatically send the caller back into
     * an endless availability loop.
     */
    if (step === "schedule_capture") {
      const current =
        await VoiceSessionEngine.get(callSid);

      if (!current?.applicationId) {
        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=identify`
        );

        return twimlResponse(response);
      }

      const spokenAvailability = String(
        params.SpeechResult ?? ""
      ).trim();

      const result =
        await AvailabilityUnderstandingService
          .understandAndMatch({
            applicationId:
              current.applicationId,
            spokenAvailability,
            language,
            callSid,
          });

      if (result.status === "needs_clarification") {
        await VoiceSessionEngine.transition(
          callSid,
          "recovery",
          {
            spokenAvailability:
              spokenAvailability || null,
            schedulingAttempt: 1,
          }
        );

        if (language === "ht") {
          response.say(
            {
              voice: "Polly.Matthew",
              language: "en-US",
            },
            "Mèsi. Nou resevwa enfòmasyon ou te bay la. Nou pap mande w repete menm enfòmasyon an ankò. EPEW ap kenbe demann ou pou nou ka ede w jwenn yon randevou."
          );
        } else {
          response.say(
            voiceForLanguage(language),
            language === "es"
              ? "Gracias. Recibimos la información que proporcionó. No le pediremos que repita la misma información nuevamente. EPEW conservará su solicitud para ayudarle a programar una cita."
              : language === "fr"
              ? "Merci. Nous avons reçu les informations que vous avez fournies. Nous ne vous demanderons pas de répéter les mêmes informations. EPEW conservera votre demande afin de vous aider à prendre rendez-vous."
              : "Thank you. We received the information you provided. I will not ask you to repeat the same information again. EPEW will keep your request so we can help schedule your appointment."
          );
        }

        return twimlResponse(response);
      }

      if (result.status === "scheduling_review") {
        await VoiceSessionEngine.transition(
          callSid,
          "recovery",
          {
            spokenAvailability:
              result.spokenAvailability,
            schedulingChoices: [],
          }
        );

        response.say(
          voiceForLanguage(language),
          language === "ht"
            ? "Mèsi. Mwen resevwa lè ou disponib yo. Mwen pa jwenn yon lè ki konfime tousuit ak Konseye Pèsonèl ou a. EPEW ap revize orè a pou jwenn yon randevou ki mache pou nou toulede."
            : language === "es"
            ? "Gracias. Recibí su disponibilidad. No encontré inmediatamente una hora confirmada con su Coach Personal. EPEW revisará el horario para encontrar una cita compatible."
            : language === "fr"
            ? "Merci. J'ai reçu vos disponibilités. Je n'ai pas trouvé immédiatement une heure confirmée avec votre Coach Personnel. EPEW examinera l'horaire afin de trouver un rendez-vous compatible."
            : "Thank you. I received your availability. I did not find an immediately confirmed time with your Personal Coach. EPEW will review the schedule to find a compatible appointment."
        );

        return twimlResponse(response);
      }

      const firstChoice = result.choices[0];

      const secondChoice =
        result.choices.find((choice) => {
          if (!firstChoice) {
            return false;
          }

          const firstTime =
            new Date(
              firstChoice.proposedStartAt
            ).getTime();

          const candidateTime =
            new Date(
              choice.proposedStartAt
            ).getTime();

          return (
            candidateTime - firstTime >=
            30 * 60 * 1000
          );
        }) ?? null;

      const choices = [
        firstChoice,
        secondChoice,
      ].filter(
        (
          choice
        ): choice is NonNullable<
          typeof choice
        > => Boolean(choice)
      );

      if (choices.length === 0) {
        await VoiceSessionEngine.transition(
          callSid,
          "recovery",
          {
            spokenAvailability:
              result.spokenAvailability,
            schedulingChoices: [],
          }
        );

        response.say(
          voiceForLanguage(language),
          language === "es"
            ? "Recibí su disponibilidad, pero no encontré una cita disponible en este momento. EPEW conservará su solicitud para ayudarle a encontrar una cita."
            : language === "fr"
            ? "J'ai reçu vos disponibilités, mais je n'ai trouvé aucun rendez-vous disponible pour le moment. EPEW conservera votre demande afin de vous aider à trouver un rendez-vous."
            : language === "ht"
            ? "Mwen resevwa lè ou disponib yo, men mwen pa jwenn yon randevou ki disponib kounye a. EPE W ap kenbe demann ou pou ede jwenn yon randevou."
            : "I received your availability, but I did not find an available appointment right now. EPEW will keep your request so we can help find an appointment."
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=main_menu`
        );

        return twimlResponse(response);
      }

      await VoiceSessionEngine.transition(
        callSid,
        "schedule_choices",
        {
          spokenAvailability:
            result.spokenAvailability,
          schedulingChoices: choices,
        }
      );

      const gather = response.gather({
        input: ["dtmf"],
        action:
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=schedule_choice`,
        method: "POST",
        numDigits: 1,
        timeout: 12,
        actionOnEmptyResult: true,
      });

      const first =
        formatAppointmentTime(
          choices[0].proposedStartAt,
          language
        );

      const second =
        choices[1]
          ? formatAppointmentTime(
              choices[1].proposedStartAt,
              language
            )
          : null;

      if (language === "ht") {
        gather.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          second
            ? `Mwen jwenn de lè ki disponib. Opsyon 1 se ${first}. Opsyon 2 se ${second}. Peze nimewo 1 pou premye opsyon an oswa nimewo 2 pou dezyèm opsyon an.`
            : `Mwen jwenn yon lè ki disponib. Se ${first}. Peze nimewo 1 pou chwazi li.`
        );
      } else {
        gather.say(
          voiceForLanguage(language),
          second
            ? `I found two available appointment times. Option 1 is ${first}. Option 2 is ${second}. Press 1 for the first option or 2 for the second option.`
            : `I found one available appointment time. It is ${first}. Press 1 to choose it.`
        );
      }

      return twimlResponse(response);
    }

    /*
     * =========================================================
     * STEP 7 — SELECT + BOOK APPOINTMENT
     * =========================================================
     */
    if (step === "schedule_choice") {
      const current =
        await VoiceSessionEngine.get(callSid);

      if (
        !current?.applicationId ||
        !current.schedulingChoices?.length
      ) {
        response.say(
          voiceForLanguage(language),
          language === "es"
            ? "Las opciones de cita ya no están disponibles. Podemos buscar nuevas opciones."
            : language === "fr"
            ? "Les options de rendez-vous ne sont plus disponibles. Nous pouvons rechercher de nouvelles options."
            : language === "ht"
            ? "Opsyon randevou yo pa disponib ankò. Nou ka chèche nouvo opsyon."
            : "The appointment choices are no longer available. We can look for new options."
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=schedule_offer`
        );

        return twimlResponse(response);
      }

      const choiceIndex =
        digits === "1"
          ? 0
          : digits === "2"
          ? 1
          : -1;

      const selected =
        choiceIndex >= 0
          ? current.schedulingChoices[
              choiceIndex
            ]
          : undefined;

      if (!selected) {
        response.say(
          voiceForLanguage(language),
          language === "es"
            ? "No recibí una opción de cita válida."
            : language === "fr"
            ? "Je n'ai pas reçu un choix de rendez-vous valide."
            : language === "ht"
            ? "Mwen pa resevwa yon chwa randevou ki valab."
            : "I did not receive a valid appointment choice."
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=schedule_offer`
        );

        return twimlResponse(response);
      }

      let booking;

      try {
        booking =
          await PhoneAppointmentBookingService
            .bookMatch({
              applicationId:
                current.applicationId,
              matchId: selected.id,
              callSid,
              language,
            });
      } catch (bookingError) {
        console.error(
          "V2 phone appointment booking failed:",
          bookingError
        );

        await VoiceSessionEngine.transition(
          callSid,
          "schedule_offer",
          {
            schedulingChoices: [],
            selectedChoiceId: null,
          }
        );

        response.say(
          voiceForLanguage(language),
          language === "es"
            ? "Ese horario ya no está disponible. Podemos buscar otro horario para su cita."
            : language === "fr"
            ? "Cet horaire n'est plus disponible. Nous pouvons rechercher un autre horaire pour votre rendez-vous."
            : language === "ht"
            ? "Lè sa a pa disponib ankò. Nou ka chèche yon lòt lè pou randevou ou."
            : "That appointment time is no longer available. We can look for another time for your appointment."
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=schedule_offer`
        );

        return twimlResponse(response);
      }

      await VoiceSessionEngine.transition(
        callSid,
        "schedule_confirm",
        {
          meetingId:
            booking.meetingId,
          selectedChoiceId:
            selected.id,
        }
      );

      const confirmedTime =
        formatAppointmentTime(
          booking.scheduledAt,
          language
        );

      if (language === "ht") {
        response.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          `Randevou w konfime pou ${confirmedTime}. Reyinyon an ap fèt pa telefòn ak Konseye Pèsonèl EPE W la.`
        );
      } else {
        response.say(
          voiceForLanguage(language),
          language === "es"
            ? `Su cita está confirmada para ${confirmedTime}. La reunión será por teléfono con su Coach Personal de EPEW.`
            : language === "fr"
            ? `Votre rendez-vous est confirmé pour ${confirmedTime}. La réunion aura lieu par téléphone avec votre Coach Personnel EPEW.`
            : `Your appointment is confirmed for ${confirmedTime}. The meeting will be by phone with your EPEW Personal Coach.`
        );
      }

      await VoiceSessionEngine.transition(
        callSid,
        "member_assistance"
      );

      const memberMenuGather =
        response.gather({
          input: ["dtmf"],
          action:
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=member_assistance`,
          method: "POST",
          numDigits: 1,
          timeout: 12,
          actionOnEmptyResult: true,
        });

      if (language === "ht") {
        memberMenuGather.play(
          approvedHaitianAudioUrl(
            publicBaseUrl,
            "memberAssistanceMenu"
          )
        );
      } else {
        memberMenuGather.say(
          voiceForLanguage(language),
          memberAssistanceMenuPrompt(
            language
          )
        );
      }

      return twimlResponse(response);
    }

    /*
     * =========================================================
     * STEP 8 — MEMBER ASSISTANCE
     * =========================================================
     */
    if (step === "member_assistance") {
      /*
       * 1 = Supporter
       * 2 = Entrepreneur
       * 3 = Coach
       * 4 = Partner
       * 5 = Vendor
       * 9 = Main Menu
       */

      if (digits === "9") {
        await VoiceSessionEngine.transition(
          callSid,
          "main_menu"
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=main_menu`
        );

        return twimlResponse(response);
      }

      if (!digits) {
        const memberMenuGather =
          response.gather({
            input: ["dtmf"],
            action:
              `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=member_assistance`,
            method: "POST",
            numDigits: 1,
            timeout: 12,
            actionOnEmptyResult: true,
          });

        if (language === "ht") {
          memberMenuGather.play(
            approvedHaitianAudioUrl(
              publicBaseUrl,
              "memberAssistanceMenu"
            )
          );
        } else {
          memberMenuGather.say(
            voiceForLanguage(language),
            memberAssistanceMenuPrompt(language)
          );
        }

        return twimlResponse(response);
      }

      const assistanceResponse =
        memberAssistanceResponse(
          language,
          digits
        );

      if (!assistanceResponse) {
        const retryGather =
          response.gather({
            input: ["dtmf"],
            action:
              `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=member_assistance`,
            method: "POST",
            numDigits: 1,
            timeout: 12,
            actionOnEmptyResult: true,
          });

        if (language === "ht") {
          retryGather.play(
            approvedHaitianAudioUrl(
              publicBaseUrl,
              "memberAssistanceMenu"
            )
          );
        } else {
          retryGather.say(
            voiceForLanguage(language),
            memberAssistanceMenuPrompt(language)
          );
        }

        return twimlResponse(response);
      }

      if (language === "ht") {
        response.play(
          haitianDynamicTtsUrl(
            publicBaseUrl,
            assistanceResponse
          )
        );
      } else {
        response.say(
          voiceForLanguage(language),
          assistanceResponse
        );
      }

      await VoiceSessionEngine.transition(
        callSid,
        "member_assistance_followup"
      );

      const followupGather =
        response.gather({
          input: ["dtmf"],
          action:
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=member_assistance_followup`,
          method: "POST",
          numDigits: 1,
          timeout: 10,
          actionOnEmptyResult: true,
        });

      if (language === "ht") {
        followupGather.play(
          approvedHaitianAudioUrl(
            publicBaseUrl,
            "memberAssistanceFollowup"
          )
        );
      } else {
        followupGather.say(
          voiceForLanguage(language),
          language === "es"
            ? "Para volver a la lista de opciones, presione 1. Para finalizar esta llamada, presione 2."
            : language === "fr"
            ? "Pour revenir à la liste des choix, appuyez sur 1. Pour terminer cet appel, appuyez sur 2."
            : "To return to the list of choices, press 1. To finish this call, press 2."
        );
      }

      return twimlResponse(response);
    }

    if (step === "member_assistance_followup") {
      const returnToSubjects =
        language === "ht"
          ? digits === "9"
          : digits === "1";

      if (returnToSubjects) {
        await VoiceSessionEngine.transition(
          callSid,
          "member_assistance"
        );

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=member_assistance`
        );

        return twimlResponse(response);
      }

      if (digits === "2") {
        await VoiceSessionEngine.complete(
          callSid
        );

        if (language === "ht") {
          response.play(
            approvedHaitianAudioUrl(
              publicBaseUrl,
              "goodbye"
            )
          );
        } else {
          response.say(
            voiceForLanguage(language),
            language === "es"
              ? "Gracias por llamar a EPEW. Que tenga un excelente día. Adiós."
              : language === "fr"
              ? "Merci d'avoir appelé E P E W. Passez une excellente journée. Au revoir."
              : "Thank you for calling EPEW. Have a wonderful day. Goodbye."
          );
        }

        response.hangup();

        return twimlResponse(response);
      }

      const followupGather =
        response.gather({
          input: ["dtmf"],
          action:
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=member_assistance_followup`,
          method: "POST",
          numDigits: 1,
          timeout: 10,
          actionOnEmptyResult: true,
        });

      if (language === "ht") {
        followupGather.play(
          approvedHaitianAudioUrl(
            publicBaseUrl,
            "memberAssistanceFollowup"
          )
        );
      } else {
        followupGather.say(
          voiceForLanguage(language),
          language === "es"
            ? "Para volver a la lista de opciones, presione 1. Para finalizar esta llamada, presione 2."
            : language === "fr"
            ? "Pour revenir à la liste des choix, appuyez sur 1. Pour terminer cet appel, appuyez sur 2."
            : "To return to the list of choices, press 1. To finish this call, press 2."
        );
      }

      return twimlResponse(response);
    }

    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "The call reached an unsupported Version 2 state."
    );

    return twimlResponse(response);
  } catch (error) {
    console.error(
      "EPEW Voice V2 inbound error:",
      error
    );

    const response =
      new twilio.twiml.VoiceResponse();

    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "We are unable to complete this call right now. Please try again shortly."
    );

    return twimlResponse(response);
  }
}
