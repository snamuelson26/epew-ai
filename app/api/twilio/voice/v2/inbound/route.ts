import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

import {
  validateTwilioWebhook,
} from "@/lib/twilio/validateTwilioWebhook";

import {
  approvedHaitianAudioUrl,
} from "@/lib/twilio/voice-v2/ApprovedAudioRegistry";

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
  MeetingLookupService,
} from "@/lib/services/phone-v2/MeetingLookupService";

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
    case "es":
      return "¿Cómo más podemos ayudarle? Para información general sobre EPEW, presione 1. Para emprendedores, presione 2. Para partidarios, presione 3. Para socios, presione 4. Para vendedores, presione 5.";

    case "fr":
      return "Comment pouvons-nous encore vous aider ? Pour des informations générales sur EPEW, appuyez sur 1. Pour devenir entrepreneur, appuyez sur 2. Pour devenir supporter, appuyez sur 3. Pour devenir partenaire, appuyez sur 4. Pour devenir vendeur, appuyez sur 5.";

    default:
      return "How else can we help you? For general information about EPEW, press 1. To become an Entrepreneur, press 2. To become a Supporter, press 3. To become an EPEW Partner, press 4. To become an EPEW Vendor, press 5.";
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
      en: "EPEW helps people build businesses through community support, business preparation, coaching, and the EPEW support system.",
      ht: "EPE W ede moun bati biznis atravè sipò kominotè, preparasyon biznis, akonpayman, ak sistèm sipò EPE W la.",
      es: "EPEW ayuda a las personas a desarrollar negocios mediante apoyo comunitario, preparación empresarial, acompañamiento y el sistema de apoyo de EPEW.",
      fr: "EPEW aide les personnes à développer leur entreprise grâce au soutien communautaire, à la préparation de l'entreprise, à l'accompagnement et au système de soutien EPEW.",
    },
    "2": {
      en: "If you want to become an EPEW Entrepreneur, EPEW can guide you through the application, business preparation, coaching, and support process.",
      ht: "Si ou vle vin yon Antreprenè EPE W, EPE W kapab gide w nan aplikasyon an, preparasyon biznis la, akonpayman an, ak pwosesis sipò a.",
      es: "Si desea convertirse en Emprendedor de EPEW, EPEW puede guiarle durante la solicitud, la preparación del negocio, el acompañamiento y el proceso de apoyo.",
      fr: "Si vous souhaitez devenir Entrepreneur EPEW, EPEW peut vous guider dans la demande, la préparation de l'entreprise, l'accompagnement et le processus de soutien.",
    },
    "3": {
      en: "EPEW Supporters help entrepreneurs move forward through the EPEW community support system.",
      ht: "Sipòtè EPE W yo ede antreprenè yo avanse atravè sistèm sipò kominotè EPE W la.",
      es: "Los Supporters de EPEW ayudan a los emprendedores a avanzar mediante el sistema de apoyo comunitario de EPEW.",
      fr: "Les Supporters EPEW aident les entrepreneurs à progresser grâce au système de soutien communautaire EPEW.",
    },
    "4": {
      en: "EPEW Partners help coordinate services, resources, and business-development support within the EPEW ecosystem.",
      ht: "Patnè EPE W yo ede kowòdone sèvis, resous, ak sipò pou devlopman biznis nan sistèm EPE W la.",
      es: "Los Partners de EPEW ayudan a coordinar servicios, recursos y apoyo para el desarrollo empresarial dentro del ecosistema EPEW.",
      fr: "Les Partners EPEW aident à coordonner les services, les ressources et le soutien au développement des entreprises dans l'écosystème EPEW.",
    },
    "5": {
      en: "EPEW Vendors provide qualified professional services for approved business-development work in the EPEW ecosystem.",
      ht: "Vandè EPE W yo bay sèvis pwofesyonèl kalifye pou travay devlopman biznis ki apwouve nan sistèm EPE W la.",
      es: "Los Vendors de EPEW proporcionan servicios profesionales calificados para trabajos aprobados de desarrollo empresarial dentro del ecosistema EPEW.",
      fr: "Les Vendors EPEW fournissent des services professionnels qualifiés pour les travaux approuvés de développement d'entreprise dans l'écosystème EPEW.",
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

      const meetingResult =
        await MeetingLookupService
          .findCurrentPhoneMeeting(
            current.applicationId
          );

      if (
        meetingResult.meeting &&
        meetingResult.canConnectNow
      ) {
        await VoiceSessionEngine.transition(
          callSid,
          "meeting_connect",
          {
            meetingId:
              meetingResult.meeting.id,
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
            "Please hold while I connect you to your EPEW Personal Coach."
          );
        }

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/establishment-meeting?meetingId=${encodeURIComponent(
            meetingResult.meeting.id
          )}`
        );

        return twimlResponse(response);
      }

      await VoiceSessionEngine.transition(
        callSid,
        "schedule_offer",
        {
          meetingId:
            meetingResult.meeting?.id ??
            null,
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
            "Please tell me what day and time you are available to speak with your Personal Coach."
          );
        }

        return twimlResponse(response);
      }

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
          "Thank you for calling EPEW. Have a wonderful day."
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
          "The appointment choices are no longer available."
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
          language === "ht"
            ? "Mwen pa resevwa yon chwa valab."
            : "I did not receive a valid appointment choice."
        );

        return twimlResponse(response);
      }

      const booking =
        await PhoneAppointmentBookingService
          .bookMatch({
            applicationId:
              current.applicationId,
            matchId: selected.id,
            callSid,
            language,
          });

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
      const phase = String(
        url.searchParams.get("phase") ?? "menu"
      ).trim();

      if (digits === "9") {
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

      if (!digits) {
        if (phase === "finish") {
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
                ? "Gracias por llamar a EPEW."
                : language === "fr"
                ? "Merci d'avoir appelé EPEW."
                : "Thank you for calling EPEW."
            );
          }

          return twimlResponse(response);
        }

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
            memberAssistanceMenuPrompt(
              language
            )
          );
        }

        return twimlResponse(response);
      }

      response.say(
        voiceForLanguage(language),
        assistanceResponse
      );

      const returnGather =
        response.gather({
          input: ["dtmf"],
          action:
            `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=member_assistance&phase=finish`,
          method: "POST",
          numDigits: 1,
          timeout: 8,
          actionOnEmptyResult: true,
        });

      returnGather.say(
        voiceForLanguage(language),
        returnToMenuPrompt(language)
      );

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

    return twimlResponse(response, 500);
  }
}
