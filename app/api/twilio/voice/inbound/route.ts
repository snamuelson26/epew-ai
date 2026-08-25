import {
  validateTwilioWebhook,
} from "@/lib/twilio/validateTwilioWebhook";

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PhoneAvailabilitySchedulingService } from "@/lib/services/scheduling/PhoneAvailabilitySchedulingService";
import { PhoneAppointmentBookingService } from "@/lib/services/scheduling/PhoneAppointmentBookingService";

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

function normalizeSpokenEmail(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+at\s+/g, "@")
    .replace(/\s+dot\s+/g, ".")
    .replace(/\s+period\s+/g, ".")
    .replace(/\s+underscore\s+/g, "_")
    .replace(/\s+dash\s+/g, "-")
    .replace(/\s+hyphen\s+/g, "-")
    .replace(/\s+/g, "");
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
      return "Mwen jwenn yon kont EPE-W ki asosye ak nimewo telefòn ou rele ya. Pou konfime kont lan, e pou m ka jwenn kiyès ki te kontakte w, tanpri peze en.";

    case "es":
      return "Encontramos una cuenta de EPEW asociada con este número de teléfono. Para confirmar que usted es el titular de la cuenta y permitirnos verificar quién lo contactó recientemente, oprima 1.";

    case "fr":
      return "Nous avons trouvé un compte EPEW associé à ce numéro de téléphone. Pour confirmer que vous êtes le titulaire du compte et nous permettre de vérifier qui vous a récemment contacté, appuyez sur 1.";

    default:
      return "I found an EPEW account associated with the phone number you are calling from. To confirm that you are the account holder and allow me to check who recently contacted you, press 1.";
  }
}

function scheduleOfferPrompt(
  language: SupportedLanguage
) {
  switch (language) {
    case "es":
      return "Nos alegra mucho que haya llamado a EPEW. Si necesita hablar con su Coach Personal, puede programar una cita desde su portal. Si desea, también puedo ayudarle a programar la cita ahora. ¿Desea que programe la cita por usted ahora? Para sí, oprima el número 1. Para no y terminar la llamada, oprima el número 2.";

    case "fr":
      return "Nous sommes très heureux que vous ayez appelé EPEW. Si vous avez besoin de parler avec votre Coach Personnel, vous pouvez prendre rendez-vous dans votre portail. Si vous le souhaitez, je peux aussi vous aider à prendre le rendez-vous maintenant. Voulez-vous que je prenne le rendez-vous pour vous maintenant ? Pour oui, appuyez sur le numéro 1. Pour non et terminer l'appel, appuyez sur le numéro 2.";

    default:
      return "We are very glad you called EPEW. If you need to speak with your Personal Coach, you can schedule an appointment through your portal. If you would like, I can also help schedule the appointment for you now. Would you like me to schedule the appointment for you now? For yes, press number 1. For no and to end the call, press number 2.";
  }
}

function schedulingStartedPrompt(
  language: SupportedLanguage
) {
  switch (language) {
    case "ht":
      return "Trè byen. Mwen pral ede w jwenn yon randevou ki bon pou ou.";

    case "es":
      return "Muy bien. Le ayudaré a encontrar una cita que funcione para usted.";

    case "fr":
      return "Très bien. Je vais vous aider à trouver un rendez-vous qui vous convient.";

    default:
      return "Very well. I will help you find an appointment that works for you.";
  }
}

function goodbyePrompt(
  language: SupportedLanguage
) {
  switch (language) {
    case "es":
      return "Gracias por llamar a EPEW. Estaremos encantados de ayudarle cuando nos necesite. Que tenga un buen día.";

    case "fr":
      return "Merci d'avoir appelé EPEW. Nous serons heureux de vous aider lorsque vous en aurez besoin. Bonne journée.";

    default:
      return "Thank you for calling EPEW. We will be happy to help whenever you need us. Have a wonderful day.";
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
          "Welcome to E. P. E. W., Ekero Partners Empower Wealth. For English, press 1."
        );

        gather.play(
          `${publicBaseUrl}/audio/phone/ht-language-selection.mp3`
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
      /*
       * ========================================================
       * NEW / PROSPECTIVE CALLER
       * ========================================================
       *
       * A caller whose telephone number does not match an
       * existing EPEW entrepreneur account enters the public
       * prospect intake workflow instead of being disconnected.
       *
       * The same Twilio Call SID is used to recover the prospect
       * record through subsequent Gather callbacks.
       */

      let prospect:
        | {
            id: string;
            full_name: string | null;
            caller_id_phone: string | null;
            confirmed_phone: string | null;
            email: string | null;
            name_verified: boolean;
            phone_verified: boolean;
            email_verified: boolean;
          }
        | null = null;

      if (callSid) {
        const {
          data: existingProspect,
          error: existingProspectError,
        } = await supabaseAdmin
          .from("epew_prospects")
          .select(`
            id,
            full_name,
            caller_id_phone,
            confirmed_phone,
            email,
            name_verified,
            phone_verified,
            email_verified
          `)
          .eq("latest_call_sid", callSid)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (existingProspectError) {
          throw existingProspectError;
        }

        prospect = existingProspect;
      }

      /*
       * Create one prospect record for this inbound call.
       */
      if (!prospect) {
        const {
          data: createdProspect,
          error: createProspectError,
        } = await supabaseAdmin
          .from("epew_prospects")
          .insert({
            caller_id_phone:
              callerPhone || null,
            preferred_language:
              language,
            source_channel:
              "phone",
            source_detail:
              "inbound_epew_call",
            prospect_status:
              "collecting_contact_information",
            first_call_sid:
              callSid || null,
            latest_call_sid:
              callSid || null,
            first_contact_at:
              callNow,
            last_contact_at:
              callNow,
            metadata: {
              provider: "twilio",
              source:
                "epew_inbound_phone",
            },
          })
          .select(`
            id,
            full_name,
            caller_id_phone,
            confirmed_phone,
            email,
            name_verified,
            phone_verified,
            email_verified
          `)
          .single();

        if (createProspectError) {
          throw createProspectError;
        }

        prospect = createdProspect;
      }

      /*
       * STEP: Caller speaks their full name.
       */
      if (step === "prospect_name") {
        const spokenName = String(
          params.SpeechResult ?? ""
        ).trim();

        if (!spokenName) {
          const nameRetry =
            response.gather({
              input: ["speech"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_name&lang=${language}`,
              method: "POST",
              timeout: 8,
              speechTimeout: "auto",
              actionOnEmptyResult: true,
            });

          nameRetry.say(
            voiceForLanguage(language),
            language === "es"
              ? "No pude escuchar su nombre. Por favor, diga su nombre y apellido."
              : language === "fr"
              ? "Je n'ai pas entendu votre nom. Veuillez dire votre prénom et votre nom de famille."
              : language === "ht"
              ? "Mwen pa tande non ou. Tanpri di non ak siyati ou."
              : "I did not hear your name. Please say your first and last name."
          );

          return twimlResponse(response);
        }

        const {
          error: nameUpdateError,
        } = await supabaseAdmin
          .from("epew_prospects")
          .update({
            full_name:
              spokenName,
            name_verified:
              false,
            prospect_status:
              "verification_pending",
            last_contact_at:
              callNow,
            updated_at:
              callNow,
          })
          .eq("id", prospect.id);

        if (nameUpdateError) {
          throw nameUpdateError;
        }

        const nameConfirmation =
          response.gather({
            input: ["dtmf"],
            action:
              `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_name_confirm&lang=${language}`,
            method: "POST",
            numDigits: 1,
            timeout: 10,
            actionOnEmptyResult: true,
          });

        nameConfirmation.say(
          voiceForLanguage(language),
          language === "es"
            ? `Escuché ${spokenName}. Si el nombre es correcto, oprima el número 1. Para decir su nombre nuevamente, oprima el número 2.`
            : language === "fr"
            ? `J'ai entendu ${spokenName}. Si le nom est correct, appuyez sur le numéro 1. Pour répéter votre nom, appuyez sur le numéro 2.`
            : language === "ht"
            ? `Mwen tande ${spokenName}. Si non an kòrèk, peze nimewo 1. Pou di non ou ankò, peze nimewo 2.`
            : `I heard ${spokenName}. If that name is correct, press number 1. To say your name again, press number 2.`
        );

        return twimlResponse(response);
      }

      /*
       * STEP: Caller confirms or rejects recognized name.
       */
      if (step === "prospect_name_confirm") {
        if (digits === "2") {
          response.redirect(
            {
              method: "POST",
            },
            `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_name&lang=${language}`
          );

          return twimlResponse(response);
        }

        if (digits === "1") {
          const {
            error: verifiedNameError,
          } = await supabaseAdmin
            .from("epew_prospects")
            .update({
              name_verified:
                true,
              prospect_status:
                "collecting_contact_information",
              last_contact_at:
                callNow,
              updated_at:
                callNow,
            })
            .eq("id", prospect.id);

          if (verifiedNameError) {
            throw verifiedNameError;
          }

          const phoneConfirmation =
            response.gather({
              input: ["dtmf"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_phone_confirm&lang=${language}`,
              method: "POST",
              numDigits: 1,
              timeout: 10,
              actionOnEmptyResult: true,
            });

          phoneConfirmation.say(
            voiceForLanguage(language),
            language === "es"
              ? "Gracias. Su nombre ha sido confirmado. ¿Desea utilizar el número de teléfono desde el cual está llamando como su número de contacto de EPEW? Para sí, oprima el número 1. Para proporcionar otro número, oprima el número 2."
              : language === "fr"
              ? "Merci. Votre nom est confirmé. Voulez-vous utiliser le numéro depuis lequel vous appelez comme numéro de contact EPEW ? Pour oui, appuyez sur le numéro 1. Pour fournir un autre numéro, appuyez sur le numéro 2."
              : language === "ht"
              ? "Mèsi. Nou konfime non ou. Èske ou vle itilize nimewo telefòn ou rele ak li a kòm nimewo kontak EPE-W ou? Pou wi, peze nimewo 1. Pou bay yon lòt nimewo, peze nimewo 2."
              : "Thank you. Your name has been confirmed. Would you like to use the phone number you are calling from as your EPEW contact number? For yes, press number 1. To provide a different number, press number 2."
          );

          return twimlResponse(response);
        }

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_name_confirm&lang=${language}`
        );

        return twimlResponse(response);
      }

      /*
       * STEP: Confirm or replace the caller-ID phone number.
       */
      if (step === "prospect_phone_confirm") {
        if (digits === "1") {
          const {
            error: phoneConfirmError,
          } = await supabaseAdmin
            .from("epew_prospects")
            .update({
              confirmed_phone:
                callerPhone,
              phone_verified:
                true,
              prospect_status:
                "collecting_contact_information",
              last_contact_at:
                callNow,
              updated_at:
                callNow,
            })
            .eq("id", prospect.id);

          if (phoneConfirmError) {
            throw phoneConfirmError;
          }

          const emailGather =
            response.gather({
              input: ["speech"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_email&lang=${language}`,
              method: "POST",
              timeout: 10,
              speechTimeout: "auto",
              actionOnEmptyResult: true,
            });

          emailGather.say(
            voiceForLanguage(language),
            language === "es"
              ? "Gracias. Ahora, por favor diga su dirección de correo electrónico lentamente."
              : language === "fr"
              ? "Merci. Maintenant, veuillez dire lentement votre adresse électronique."
              : language === "ht"
              ? "Mèsi. Kounye a, tanpri di adrès imel ou dousman."
              : "Thank you. Now please say your email address slowly."
          );

          return twimlResponse(response);
        }

        if (digits === "2") {
          const phoneGather =
            response.gather({
              input: ["speech"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_phone_other&lang=${language}`,
              method: "POST",
              timeout: 10,
              speechTimeout: "auto",
              actionOnEmptyResult: true,
            });

          phoneGather.say(
            voiceForLanguage(language),
            language === "es"
              ? "Por favor diga el número de teléfono que desea utilizar como su número de contacto de EPEW."
              : language === "fr"
              ? "Veuillez dire le numéro de téléphone que vous souhaitez utiliser comme numéro de contact EPEW."
              : language === "ht"
              ? "Tanpri di nimewo telefòn ou vle itilize kòm nimewo kontak EPE-W ou."
              : "Please say the phone number you would like to use as your EPEW contact number."
          );

          return twimlResponse(response);
        }

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_name_confirm&lang=${language}`
        );

        return twimlResponse(response);
      }

      /*
       * STEP: Capture a different contact phone number.
       */
      if (step === "prospect_phone_other") {
        const spokenPhone = String(
          params.SpeechResult ?? ""
        ).trim();

        if (!spokenPhone) {
          response.redirect(
            {
              method: "POST",
            },
            `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_phone_confirm&lang=${language}`
          );

          return twimlResponse(response);
        }

        const normalizedSpokenPhone =
          spokenPhone.replace(/\D/g, "");

        if (normalizedSpokenPhone.length < 10) {
          const retryPhoneGather =
            response.gather({
              input: ["speech"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_phone_other&lang=${language}`,
              method: "POST",
              timeout: 10,
              speechTimeout: "auto",
              actionOnEmptyResult: true,
            });

          retryPhoneGather.say(
            voiceForLanguage(language),
            language === "es"
              ? "No pude confirmar ese número. Por favor diga el número de teléfono completo, incluyendo el código de área."
              : language === "fr"
              ? "Je n'ai pas pu confirmer ce numéro. Veuillez dire le numéro complet, y compris l'indicatif régional."
              : language === "ht"
              ? "Mwen pa t ka konfime nimewo sa a. Tanpri di nimewo telefòn konplè a, ansanm ak kòd zòn nan."
              : "I could not confirm that number. Please say the complete phone number, including the area code."
          );

          return twimlResponse(response);
        }

        const {
          error: alternatePhoneError,
        } = await supabaseAdmin
          .from("epew_prospects")
          .update({
            confirmed_phone:
              normalizedSpokenPhone,
            phone_verified:
              false,
            prospect_status:
              "verification_pending",
            last_contact_at:
              callNow,
            updated_at:
              callNow,
          })
          .eq("id", prospect.id);

        if (alternatePhoneError) {
          throw alternatePhoneError;
        }

        const phoneVerifyGather =
          response.gather({
            input: ["dtmf"],
            action:
              `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_phone_other_confirm&lang=${language}`,
            method: "POST",
            numDigits: 1,
            timeout: 10,
            actionOnEmptyResult: true,
          });

        const spokenDigits =
          normalizedSpokenPhone
            .split("")
            .join(" ");

        phoneVerifyGather.say(
          voiceForLanguage(language),
          language === "es"
            ? `Escuché ${spokenDigits}. Si ese número es correcto, oprima el número 1. Para decirlo nuevamente, oprima el número 2.`
            : language === "fr"
            ? `J'ai entendu ${spokenDigits}. Si ce numéro est correct, appuyez sur le numéro 1. Pour le répéter, appuyez sur le numéro 2.`
            : language === "ht"
            ? `Mwen tande ${spokenDigits}. Si nimewo sa a kòrèk, peze nimewo 1. Pou di li ankò, peze nimewo 2.`
            : `I heard ${spokenDigits}. If that number is correct, press number 1. To say it again, press number 2.`
        );

        return twimlResponse(response);
      }

      /*
       * STEP: Verify the alternate phone number.
       */
      if (step === "prospect_phone_other_confirm") {
        if (digits === "2") {
          response.redirect(
            {
              method: "POST",
            },
            `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_phone_other&lang=${language}`
          );

          return twimlResponse(response);
        }

        if (digits === "1") {
          const {
            error: verifyPhoneError,
          } = await supabaseAdmin
            .from("epew_prospects")
            .update({
              phone_verified:
                true,
              prospect_status:
                "collecting_contact_information",
              last_contact_at:
                callNow,
              updated_at:
                callNow,
            })
            .eq("id", prospect.id);

          if (verifyPhoneError) {
            throw verifyPhoneError;
          }

          const emailGather =
            response.gather({
              input: ["speech"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_email&lang=${language}`,
              method: "POST",
              timeout: 10,
              speechTimeout: "auto",
              actionOnEmptyResult: true,
            });

          emailGather.say(
            voiceForLanguage(language),
            language === "es"
              ? "Gracias. Ahora, por favor diga su dirección de correo electrónico lentamente."
              : language === "fr"
              ? "Merci. Maintenant, veuillez dire lentement votre adresse électronique."
              : language === "ht"
              ? "Mèsi. Kounye a, tanpri di adrès imel ou dousman."
              : "Thank you. Now please say your email address slowly."
          );

          return twimlResponse(response);
        }

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_phone_other_confirm&lang=${language}`
        );

        return twimlResponse(response);
      }

      /*
       * STEP: Capture the caller's email address.
       */
      if (step === "prospect_email") {
        const spokenEmail = String(
          params.SpeechResult ?? ""
        ).trim();

        const normalizedEmail =
          normalizeSpokenEmail(spokenEmail);

        const looksLikeEmail =
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(
            normalizedEmail
          );

        if (!spokenEmail || !looksLikeEmail) {
          const retryEmailGather =
            response.gather({
              input: ["speech"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_email&lang=${language}`,
              method: "POST",
              timeout: 12,
              speechTimeout: "auto",
              actionOnEmptyResult: true,
            });

          retryEmailGather.say(
            voiceForLanguage(language),
            language === "es"
              ? "No pude confirmar esa dirección de correo electrónico. Por favor, dígala lentamente. Por ejemplo, nombre arroba gmail punto com."
              : language === "fr"
              ? "Je n'ai pas pu confirmer cette adresse électronique. Veuillez la dire lentement. Par exemple, nom arobase gmail point com."
              : language === "ht"
              ? "Mwen pa t ka konfime adrès imel sa a. Tanpri di li dousman. Pa egzanp, non, at, gmail, dot com."
              : "I could not confirm that email address. Please say it slowly. For example, name at gmail dot com."
          );

          return twimlResponse(response);
        }

        const {
          error: emailUpdateError,
        } = await supabaseAdmin
          .from("epew_prospects")
          .update({
            email:
              normalizedEmail,
            email_verified:
              false,
            prospect_status:
              "verification_pending",
            last_contact_at:
              callNow,
            updated_at:
              callNow,
          })
          .eq("id", prospect.id);

        if (emailUpdateError) {
          throw emailUpdateError;
        }

        const emailVerifyGather =
          response.gather({
            input: ["dtmf"],
            action:
              `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_email_confirm&lang=${language}`,
            method: "POST",
            numDigits: 1,
            timeout: 10,
            actionOnEmptyResult: true,
          });

        const emailForSpeech =
          normalizedEmail
            .replace("@", " at ")
            .replace(/\./g, " dot ")
            .replace(/_/g, " underscore ")
            .replace(/-/g, " dash ");

        emailVerifyGather.say(
          voiceForLanguage(language),
          language === "es"
            ? `Escuché ${emailForSpeech}. Si esa dirección de correo electrónico es correcta, oprima el número 1. Para decirla nuevamente, oprima el número 2.`
            : language === "fr"
            ? `J'ai entendu ${emailForSpeech}. Si cette adresse électronique est correcte, appuyez sur le numéro 1. Pour la répéter, appuyez sur le numéro 2.`
            : language === "ht"
            ? `Mwen tande ${emailForSpeech}. Si adrès imel sa a kòrèk, peze nimewo 1. Pou di li ankò, peze nimewo 2.`
            : `I heard ${emailForSpeech}. If that email address is correct, press number 1. To say it again, press number 2.`
        );

        return twimlResponse(response);
      }

      /*
       * STEP: Verify the caller's email address.
       */
      if (step === "prospect_email_confirm") {
        if (digits === "2") {
          response.redirect(
            {
              method: "POST",
            },
            `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_email&lang=${language}`
          );

          return twimlResponse(response);
        }

        if (digits === "1") {
          const {
            error: emailVerifyError,
          } = await supabaseAdmin
            .from("epew_prospects")
            .update({
              email_verified:
                true,
              contact_information_verified:
                true,
              prospect_status:
                "verified",
              last_contact_at:
                callNow,
              updated_at:
                callNow,
            })
            .eq("id", prospect.id);

          if (emailVerifyError) {
            throw emailVerifyError;
          }

          const consentGather =
            response.gather({
              input: ["dtmf"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_consent&lang=${language}`,
              method: "POST",
              numDigits: 1,
              timeout: 10,
              actionOnEmptyResult: true,
            });

          consentGather.say(
            voiceForLanguage(language),
            language === "es"
              ? "Gracias. Su información de contacto ha sido confirmada. ¿Autoriza a EPEW a contactarle en el futuro con información sobre programas, oportunidades y servicios de EPEW? Para sí, oprima el número 1. Para no, oprima el número 2."
              : language === "fr"
              ? "Merci. Vos coordonnées ont été confirmées. Autorisez-vous EPEW à vous contacter à l'avenir au sujet des programmes, opportunités et services EPEW ? Pour oui, appuyez sur le numéro 1. Pour non, appuyez sur le numéro 2."
              : language === "ht"
              ? "Mèsi. Nou konfime enfòmasyon kontak ou. Èske ou bay EPE-W pèmisyon pou kontakte w alavni konsènan pwogram, opòtinite ak sèvis EPEW? Pou wi, peze nimewo 1. Pou non, peze nimewo 2."
              : "Thank you. Your contact information has been confirmed. Do you give EPEW permission to contact you in the future about EPEW programs, opportunities, and services? For yes, press number 1. For no, press number 2."
          );

          return twimlResponse(response);
        }

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_email_confirm&lang=${language}`
        );

        return twimlResponse(response);
      }

      /*
       * STEP: Capture the caller's email address.
       */
      if (step === "prospect_email") {
        const spokenEmail = String(
          params.SpeechResult ?? ""
        ).trim();

        const normalizedEmail =
          normalizeSpokenEmail(spokenEmail);

        const looksLikeEmail =
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(
            normalizedEmail
          );

        if (!spokenEmail || !looksLikeEmail) {
          const retryEmailGather =
            response.gather({
              input: ["speech"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_email&lang=${language}`,
              method: "POST",
              timeout: 12,
              speechTimeout: "auto",
              actionOnEmptyResult: true,
            });

          retryEmailGather.say(
            voiceForLanguage(language),
            language === "es"
              ? "No pude confirmar esa dirección de correo electrónico. Por favor, dígala lentamente. Por ejemplo, nombre arroba gmail punto com."
              : language === "fr"
              ? "Je n'ai pas pu confirmer cette adresse électronique. Veuillez la dire lentement. Par exemple, nom arobase gmail point com."
              : language === "ht"
              ? "Mwen pa t ka konfime adrès imel sa a. Tanpri di li dousman. Pa egzanp, non, at, gmail, dot com."
              : "I could not confirm that email address. Please say it slowly. For example, name at gmail dot com."
          );

          return twimlResponse(response);
        }

        const {
          error: emailUpdateError,
        } = await supabaseAdmin
          .from("epew_prospects")
          .update({
            email:
              normalizedEmail,
            email_verified:
              false,
            prospect_status:
              "verification_pending",
            last_contact_at:
              callNow,
            updated_at:
              callNow,
          })
          .eq("id", prospect.id);

        if (emailUpdateError) {
          throw emailUpdateError;
        }

        const emailVerifyGather =
          response.gather({
            input: ["dtmf"],
            action:
              `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_email_confirm&lang=${language}`,
            method: "POST",
            numDigits: 1,
            timeout: 10,
            actionOnEmptyResult: true,
          });

        const emailForSpeech =
          normalizedEmail
            .replace("@", " at ")
            .replace(/\./g, " dot ")
            .replace(/_/g, " underscore ")
            .replace(/-/g, " dash ");

        emailVerifyGather.say(
          voiceForLanguage(language),
          language === "es"
            ? `Escuché ${emailForSpeech}. Si esa dirección de correo electrónico es correcta, oprima el número 1. Para decirla nuevamente, oprima el número 2.`
            : language === "fr"
            ? `J'ai entendu ${emailForSpeech}. Si cette adresse électronique est correcte, appuyez sur le numéro 1. Pour la répéter, appuyez sur le numéro 2.`
            : language === "ht"
            ? `Mwen tande ${emailForSpeech}. Si adrès imel sa a kòrèk, peze nimewo 1. Pou di li ankò, peze nimewo 2.`
            : `I heard ${emailForSpeech}. If that email address is correct, press number 1. To say it again, press number 2.`
        );

        return twimlResponse(response);
      }

      /*
       * STEP: Verify the caller's email address.
       */
      if (step === "prospect_email_confirm") {
        if (digits === "2") {
          response.redirect(
            {
              method: "POST",
            },
            `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_email&lang=${language}`
          );

          return twimlResponse(response);
        }

        if (digits === "1") {
          const {
            error: emailVerifyError,
          } = await supabaseAdmin
            .from("epew_prospects")
            .update({
              email_verified:
                true,
              contact_information_verified:
                true,
              prospect_status:
                "verified",
              last_contact_at:
                callNow,
              updated_at:
                callNow,
            })
            .eq("id", prospect.id);

          if (emailVerifyError) {
            throw emailVerifyError;
          }

          const consentGather =
            response.gather({
              input: ["dtmf"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_consent&lang=${language}`,
              method: "POST",
              numDigits: 1,
              timeout: 10,
              actionOnEmptyResult: true,
            });

          consentGather.say(
            voiceForLanguage(language),
            language === "es"
              ? "Gracias. Su información de contacto ha sido confirmada. ¿Autoriza a EPEW a contactarle en el futuro con información sobre programas, oportunidades y servicios de EPEW? Para sí, oprima el número 1. Para no, oprima el número 2."
              : language === "fr"
              ? "Merci. Vos coordonnées ont été confirmées. Autorisez-vous EPEW à vous contacter à l'avenir au sujet des programmes, opportunités et services EPEW ? Pour oui, appuyez sur le numéro 1. Pour non, appuyez sur le numéro 2."
              : language === "ht"
              ? "Mèsi. Nou konfime enfòmasyon kontak ou. Èske ou bay EPE-W pèmisyon pou kontakte w alavni konsènan pwogram, opòtinite ak sèvis EPEW? Pou wi, peze nimewo 1. Pou non, peze nimewo 2."
              : "Thank you. Your contact information has been confirmed. Do you give EPEW permission to contact you in the future about EPEW programs, opportunities, and services? For yes, press number 1. For no, press number 2."
          );

          return twimlResponse(response);
        }

        response.redirect(
          {
            method: "POST",
          },
          `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_email_confirm&lang=${language}`
        );

        return twimlResponse(response);
      }

      /*
       * STEP: Record future-contact consent.
       */
      if (step === "prospect_consent") {
        if (digits !== "1" && digits !== "2") {
          const consentRetry =
            response.gather({
              input: ["dtmf"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_consent&lang=${language}`,
              method: "POST",
              numDigits: 1,
              timeout: 10,
              actionOnEmptyResult: true,
            });

          consentRetry.say(
            voiceForLanguage(language),
            language === "es"
              ? "Para autorizar a EPEW a contactarle en el futuro, oprima el número 1. Para no autorizar futuros contactos, oprima el número 2."
              : language === "fr"
              ? "Pour autoriser EPEW à vous contacter à l'avenir, appuyez sur le numéro 1. Pour ne pas autoriser de futurs contacts, appuyez sur le numéro 2."
              : language === "ht"
              ? "Pou bay EPE-W pèmisyon pou kontakte w alavni, peze nimewo 1. Pou pa bay pèmisyon pou kontak alavni, peze nimewo 2."
              : "To give EPEW permission to contact you in the future, press number 1. To decline future contact, press number 2."
          );

          return twimlResponse(response);
        }

        const consentGranted =
          digits === "1";

        const {
          error: consentUpdateError,
        } = await supabaseAdmin
          .from("epew_prospects")
          .update({
            outreach_consent:
              consentGranted,
            outreach_consent_at:
              callNow,
            outreach_consent_channel:
              "phone",
            outreach_consent_source:
              "inbound_voice_confirmation",
            prospect_status:
              "verified",
            last_contact_at:
              callNow,
            updated_at:
              callNow,
          })
          .eq("id", prospect.id);

        if (consentUpdateError) {
          throw consentUpdateError;
        }

        const interestGather =
          response.gather({
            input: ["dtmf"],
            action:
              `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_interest&lang=${language}`,
            method: "POST",
            numDigits: 1,
            timeout: 12,
            actionOnEmptyResult: true,
          });

        interestGather.say(
          voiceForLanguage(language),
          language === "es"
            ? "Gracias. Ahora dígame cómo podemos ayudarle. Para información general sobre EPEW, oprima 1. Para convertirse en Emprendedor, oprima 2. Para convertirse en Supporter, oprima 3. Para asociarse con EPEW como Partner, oprima 4. Para convertirse en Vendor, oprima 5."
            : language === "fr"
            ? "Merci. Dites-nous maintenant comment nous pouvons vous aider. Pour des informations générales sur EPEW, appuyez sur 1. Pour devenir Entrepreneur, appuyez sur 2. Pour devenir Supporter, appuyez sur 3. Pour devenir Partner avec EPEW, appuyez sur 4. Pour devenir Vendor, appuyez sur 5."
            : language === "ht"
            ? "Mèsi. Kounye a, di nou kijan nou ka ede w. Pou enfòmasyon jeneral sou EPE-W, peze nimewo 1. Pou vin yon Antreprenè, peze nimewo 2. Pou vin yon Sipòtè, peze nimewo 3. Pou vin yon Patnè EPE-W, peze nimewo 4. Pou vin yon Vandè EPEW, peze nimewo 5."
            : "Thank you. Now tell us how we can help you. For general information about EPEW, press 1. To become an Entrepreneur, press 2. To become a Supporter, press 3. To partner with EPEW, press 4. To become a Vendor, press 5."
        );

        return twimlResponse(response);
      }

      /*
       * STEP: Save the caller's first public EPEW interest.
       */
      if (step === "prospect_interest") {
        const interestByDigit: Record<
          string,
          | "general_epew"
          | "entrepreneur"
          | "supporter"
          | "partner"
          | "vendor"
        > = {
          "1": "general_epew",
          "2": "entrepreneur",
          "3": "supporter",
          "4": "partner",
          "5": "vendor",
        };

        const selectedInterest =
          interestByDigit[digits];

        if (!selectedInterest) {
          const interestRetry =
            response.gather({
              input: ["dtmf"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_interest&lang=${language}`,
              method: "POST",
              numDigits: 1,
              timeout: 12,
              actionOnEmptyResult: true,
            });

          interestRetry.say(
            voiceForLanguage(language),
            language === "es"
              ? "No recibí una selección válida. Oprima 1 para EPEW, 2 para Emprendedor, 3 para Supporter, 4 para Partner, o 5 para Vendor."
              : language === "fr"
              ? "Je n'ai pas reçu de sélection valide. Appuyez sur 1 pour EPEW, 2 pour Entrepreneur, 3 pour Supporter, 4 pour Partner, ou 5 pour Vendor."
              : language === "ht"
              ? "Mwen pa resevwa yon chwa ki valab. Peze nimewo 1 pou EPEW, 2 pou Antreprenè, 3 pou Sipòtè, 4 pou Patnè, oswa 5 pou Vandè."
              : "I did not receive a valid selection. Press 1 for EPEW, 2 for Entrepreneur, 3 for Supporter, 4 for Partner, or 5 for Vendor."
          );

          return twimlResponse(response);
        }

        const {
          data: currentProspect,
          error: currentProspectError,
        } = await supabaseAdmin
          .from("epew_prospects")
          .select(`
            interests,
            primary_interest
          `)
          .eq("id", prospect.id)
          .single();

        if (currentProspectError) {
          throw currentProspectError;
        }

        const currentInterests =
          Array.isArray(
            currentProspect.interests
          )
            ? currentProspect.interests
            : [];

        const updatedInterests =
          Array.from(
            new Set([
              ...currentInterests,
              selectedInterest,
            ])
          );

        const {
          error: interestUpdateError,
        } = await supabaseAdmin
          .from("epew_prospects")
          .update({
            interests:
              updatedInterests,
            primary_interest:
              currentProspect.primary_interest ??
              selectedInterest,
            prospect_status:
              "engaged",
            follow_up_required:
              true,
            last_contact_at:
              callNow,
            updated_at:
              callNow,
          })
          .eq("id", prospect.id);

        if (interestUpdateError) {
          throw interestUpdateError;
        }

        response.say(
          voiceForLanguage(language),
          language === "es"
            ? "Gracias. Hemos registrado su interés. Un representante o sistema autorizado de EPEW podrá continuar ayudándole según la información que usted solicitó."
            : language === "fr"
            ? "Merci. Nous avons enregistré votre intérêt. Un représentant ou système autorisé d'EPEW pourra continuer à vous aider selon les informations que vous avez demandées."
            : language === "ht"
            ? "Mèsi. Nou anrejistre enterè ou. Yon reprezantan oswa yon sistèm EPE-W ki otorize kapab kontinye ede w selon enfòmasyon ou mande a."
            : "Thank you. We have recorded your interest. An authorized EPEW representative or system can continue assisting you based on the information you requested."
        );

        response.pause({
          length: 1,
        });

        response.say(
          voiceForLanguage(language),
          language === "es"
            ? "Gracias por llamar a EPEW."
            : language === "fr"
            ? "Merci d'avoir appelé EPEW."
            : language === "ht"
            ? "Mèsi paske ou rele EPE-W."
            : "Thank you for calling EPEW."
        );

        return twimlResponse(response);
      }

      /*
       * Initial entry into the new-caller workflow.
       */
      const nameGather =
        response.gather({
          input: ["speech"],
          action:
            `${publicBaseUrl}/api/twilio/voice/inbound?step=prospect_name&lang=${language}`,
          method: "POST",
          timeout: 8,
          speechTimeout: "auto",
          actionOnEmptyResult: true,
        });

      if (language === "en") {
        nameGather.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          "Welcome to EPEW. Ekero Partners Empower Wealth. I could not find an EPEW account associated with the phone number you are calling from. To better assist you now and in the future, please provide your name, phone number, and email address. Thank you. Please begin by saying your first and last name."
        );
      } else {
        nameGather.say(
          voiceForLanguage(language),
          language === "es"
            ? "Bienvenido a EPEW, Ekero Partners Empower Wealth. No pude encontrar una cuenta de EPEW asociada con el número de teléfono desde el cual está llamando. Para poder ayudarle mejor ahora y en el futuro, le pediré su nombre, número de teléfono y correo electrónico. Gracias. Comience diciendo su nombre y apellido."
            : language === "fr"
            ? "Bienvenue chez EPEW, Ekero Partners Empower Wealth. Je n'ai trouvé aucun compte EPEW associé au numéro de téléphone depuis lequel vous appelez. Afin de mieux vous aider maintenant et à l'avenir, je vais vous demander votre nom, votre numéro de téléphone et votre adresse électronique. Merci. Commencez par dire votre prénom et votre nom de famille."
            : "Byenveni nan EPE-W — Ekero Partners Empower Wealth. Mwen pa jwenn yon kont EPEW ki asosye ak nimewo telefòn ou rele ak li a. Pou nou ka ede w pi byen kounye a ak nan lavni, tanpri ban nou non ou, nimewo telefòn ou, ak adrès imel ou. Mèsi. Kòmanse pa di non ak siyati ou."
        );
      }

      return twimlResponse(response);
    }

    if (step === "schedule_availability") {
      const spokenAvailability = String(
        params.SpeechResult ?? ""
      ).trim();

      if (!spokenAvailability) {
        const retryGather = response.gather({
          input: ["speech"],
          action:
            `${publicBaseUrl}/api/twilio/voice/inbound?step=schedule_availability&lang=${language}`,
          method: "POST",
          timeout: 8,
          speechTimeout: "auto",
          actionOnEmptyResult: true,
        });

        retryGather.say(
          voiceForLanguage(language),
          language === "ht"
            ? "Mwen pa tande disponiblite ou. Tanpri di m ki jou ak ki lè ou disponib."
            : language === "es"
            ? "No pude escuchar su disponibilidad. Por favor, dígame qué día y a qué hora está disponible."
            : language === "fr"
            ? "Je n'ai pas entendu vos disponibilités. Dites-moi quel jour et à quelle heure vous êtes disponible."
            : "I did not hear your availability. Please tell me what day and time you are available."
        );

        return twimlResponse(response);
      }

      if (!application?.id) {
        response.say(
          voiceForLanguage(language),
          language === "ht"
            ? "Mwen pa kapab konfime kont antreprenè ou pou pran randevou a kounye a."
            : language === "es"
            ? "No puedo confirmar su cuenta de emprendedor para programar la cita en este momento."
            : language === "fr"
            ? "Je ne peux pas confirmer votre compte entrepreneur pour fixer le rendez-vous pour le moment."
            : "I cannot confirm your entrepreneur account for scheduling right now."
        );

        return twimlResponse(response);
      }

      try {
        const schedulingResult =
          await PhoneAvailabilitySchedulingService.submitAvailability({
            applicationId: application.id,
            spokenAvailability,
            language,
            callSid,
          });

        if (!schedulingResult.success) {
          const retryGather = response.gather({
            input: ["speech"],
            action:
              `${publicBaseUrl}/api/twilio/voice/inbound?step=schedule_availability&lang=${language}`,
            method: "POST",
            timeout: 8,
            speechTimeout: "auto",
            actionOnEmptyResult: true,
          });

          retryGather.say(
            voiceForLanguage(language),
            schedulingResult.message
          );

          return twimlResponse(response);
        }

        if (
          schedulingResult.status === "scheduling_review" ||
          schedulingResult.choices.length === 0
        ) {
          response.say(
            voiceForLanguage(language),
            language === "ht"
              ? "Mèsi. Mwen resevwa disponiblite ou. Mwen pa jwenn yon lè ki konfime touswit ak Konseye Pèsonèl ou. Epew ap revize orè a pou jwenn yon lè ki konpatib pou ou."
              : language === "es"
              ? "Gracias. He recibido su disponibilidad. No encontré de inmediato una hora confirmada con su Coach Personal. EPEW revisará el horario para encontrar una opción compatible."
              : language === "fr"
              ? "Merci. J'ai reçu vos disponibilités. Je n'ai pas trouvé immédiatement un horaire confirmé avec votre Coach Personnel. EPEW va revoir le calendrier afin de trouver une option compatible."
              : "Thank you. I received your availability. I did not find an immediately confirmed time with your Personal Coach. EPEW will review the schedule to find a compatible appointment."
          );

          return twimlResponse(response);
        }

        const choices = schedulingResult.choices.slice(0, 2);

        if (callSid) {
          const { data: existingVoiceCall } =
            await supabaseAdmin
              .from("epew_voice_calls")
              .select("metadata")
              .eq("twilio_call_sid", callSid)
              .maybeSingle();

          const existingMetadata =
            existingVoiceCall?.metadata &&
            typeof existingVoiceCall.metadata === "object"
              ? existingVoiceCall.metadata
              : {};

          const { error: availabilityHistoryError } =
            await supabaseAdmin
              .from("epew_voice_calls")
              .update({
                metadata: {
                  ...existingMetadata,
                  provider: "twilio",
                  source: "epew_inbound_call_recovery",
                  scheduling_requested: true,
                  spoken_availability: spokenAvailability,
                  preferred_language: language,
                  availability_id: schedulingResult.availabilityId,
                  scheduling_choices: choices,
                },
              })
              .eq("twilio_call_sid", callSid);

          if (availabilityHistoryError) {
            console.error(
              "Unable to record caller scheduling choices:",
              availabilityHistoryError
            );
          }
        }

        const formatChoice = (iso: string) => {
          const date = new Date(iso);

          const dateText = new Intl.DateTimeFormat(
            language === "fr"
              ? "fr-FR"
              : language === "es"
              ? "es-US"
              : language === "ht"
              ? "fr-HT"
              : "en-US",
            {
              timeZone: "America/New_York",
              weekday: "long",
              month: "long",
              day: "numeric",
            }
          ).format(date);

          const timeText = new Intl.DateTimeFormat(
            language === "fr"
              ? "fr-FR"
              : language === "es"
              ? "es-US"
              : language === "ht"
              ? "fr-HT"
              : "en-US",
            {
              timeZone: "America/New_York",
              hour: "numeric",
              minute: "2-digit",
            }
          ).format(date);

          return `${dateText}, ${timeText}`;
        };

        const choiceOne = formatChoice(
          choices[0].proposedStartAt
        );

        const choiceTwo =
          choices.length > 1
            ? formatChoice(
                choices[1].proposedStartAt
              )
            : null;

        const choiceGather = response.gather({
          input: ["dtmf"],
          action:
            `${publicBaseUrl}/api/twilio/voice/inbound?step=schedule_choice&lang=${language}`,
          method: "POST",
          numDigits: 1,
          timeout: 12,
          actionOnEmptyResult: true,
        });

        if (language === "ht") {
          choiceGather.say(
            voiceForLanguage(language),
            choiceTwo
              ? `Mwen jwenn de lè ki disponib. Opsyon nimewo 1 se ${choiceOne}. Opsyon nimewo 2 se ${choiceTwo}. Pou chwazi premye lè a, peze nimewo 1. Pou chwazi dezyèm lè a, peze nimewo 2.`
              : `Mwen jwenn yon lè ki disponib. Lè a se ${choiceOne}. Pou chwazi lè sa a, peze nimewo 1.`
          );
        } else if (language === "es") {
          choiceGather.say(
            voiceForLanguage(language),
            choiceTwo
              ? `Encontré dos horarios disponibles. La opción 1 es ${choiceOne}. La opción 2 es ${choiceTwo}. Presione 1 para elegir la primera opción o 2 para elegir la segunda.`
              : `Encontré un horario disponible. Es ${choiceOne}. Presione 1 para elegirlo.`
          );
        } else if (language === "fr") {
          choiceGather.say(
            voiceForLanguage(language),
            choiceTwo
              ? `J'ai trouvé deux horaires disponibles. L'option 1 est ${choiceOne}. L'option 2 est ${choiceTwo}. Appuyez sur 1 pour choisir la première option ou sur 2 pour choisir la deuxième.`
              : `J'ai trouvé un horaire disponible. Il s'agit de ${choiceOne}. Appuyez sur 1 pour le choisir.`
          );
        } else {
          choiceGather.say(
            voiceForLanguage(language),
            choiceTwo
              ? `I found two available appointment times. Option 1 is ${choiceOne}. Option 2 is ${choiceTwo}. Press 1 for the first option or 2 for the second option.`
              : `I found one available appointment time. It is ${choiceOne}. Press 1 to choose it.`
          );
        }

        return twimlResponse(response);
      } catch (schedulingError) {
        console.error(
          "Phone scheduling availability error:",
          schedulingError
        );

        response.say(
          voiceForLanguage(language),
          language === "ht"
            ? "Mwen pa kapab fini rechèch randevou a kounye a. Epew ap konsève demann ou an pou nou ka ede w."
            : language === "es"
            ? "No puedo completar la búsqueda de su cita en este momento. EPEW conservará su solicitud para poder ayudarle."
            : language === "fr"
            ? "Je ne peux pas terminer la recherche de votre rendez-vous pour le moment. EPEW conservera votre demande afin de pouvoir vous aider."
            : "I cannot complete the appointment search right now. EPEW will keep your request so we can assist you."
        );

        return twimlResponse(response);
      }
    }

    if (step === "schedule_choice") {
      const selectedIndex =
        digits === "1"
          ? 0
          : digits === "2"
          ? 1
          : -1;

      if (!application?.id) {
        response.say(
          voiceForLanguage(language),
          language === "ht"
            ? "Mwen pa kapab konfime kont ou pou pran randevou a."
            : language === "es"
            ? "No puedo confirmar su cuenta para programar la cita."
            : language === "fr"
            ? "Je ne peux pas confirmer votre compte pour fixer le rendez-vous."
            : "I cannot confirm your account for scheduling."
        );

        return twimlResponse(response);
      }

      const { data: voiceCallRecord } =
        callSid
          ? await supabaseAdmin
              .from("epew_voice_calls")
              .select("metadata")
              .eq("twilio_call_sid", callSid)
              .maybeSingle()
          : { data: null };

      const metadata =
        voiceCallRecord?.metadata &&
        typeof voiceCallRecord.metadata === "object"
          ? voiceCallRecord.metadata
          : {};

      let schedulingChoices =
        Array.isArray(
          (metadata as Record<string, unknown>)
            .scheduling_choices
        )
          ? (
              (metadata as Record<string, unknown>)
                .scheduling_choices as Array<{
                  id?: string;
                  proposedStartAt?: string;
                }>
            )
          : [];

      /*
       * epew_private_schedule_matches is authoritative.
       *
       * Voice-call metadata is useful for continuity, but scheduling must
       * still work if that metadata row was delayed, missing, or incomplete.
       */
      if (schedulingChoices.length === 0) {
        const {
          data: latestAvailability,
          error: latestAvailabilityError,
        } = await supabaseAdmin
          .from("epew_participant_availability")
          .select("id")
          .eq("application_id", application.id)
          .eq(
            "meeting_type",
            "entrepreneur_first_meeting"
          )
          .eq("status", "matched")
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (latestAvailabilityError) {
          console.error(
            "Unable to recover phone scheduling availability:",
            latestAvailabilityError
          );
        }

        if (latestAvailability?.id) {
          const {
            data: recoveredChoices,
            error: recoveredChoicesError,
          } = await supabaseAdmin
            .from("epew_private_schedule_matches")
            .select(
              "id, proposed_start_at"
            )
            .eq(
              "availability_id",
              latestAvailability.id
            )
            .eq(
              "application_id",
              application.id
            )
            .eq("status", "available")
            .eq(
              "exposed_to_participant",
              true
            )
            .order("proposed_start_at", {
              ascending: true,
            })
            .limit(2);

          if (recoveredChoicesError) {
            console.error(
              "Unable to recover phone scheduling choices:",
              recoveredChoicesError
            );
          } else {
            schedulingChoices =
              (recoveredChoices ?? []).map(
                (choice) => ({
                  id: choice.id,
                  proposedStartAt:
                    choice.proposed_start_at,
                })
              );
          }
        }
      }

      if (
        selectedIndex < 0 ||
        !schedulingChoices[selectedIndex]?.id
      ) {
        const retryGather = response.gather({
          input: ["dtmf"],
          action:
            `${publicBaseUrl}/api/twilio/voice/inbound?step=schedule_choice&lang=${language}`,
          method: "POST",
          numDigits: 1,
          timeout: 10,
          actionOnEmptyResult: true,
        });

        retryGather.say(
          voiceForLanguage(language),
          language === "ht"
            ? schedulingChoices.length > 1
              ? "Tanpri peze nimewo 1 pou premye lè a, oswa nimewo 2 pou dezyèm lè a."
              : "Tanpri peze nimewo 1 pou chwazi lè ki disponib la."
            : language === "es"
            ? schedulingChoices.length > 1
              ? "Presione 1 para la primera opción o 2 para la segunda."
              : "Presione 1 para elegir el horario disponible."
            : language === "fr"
            ? schedulingChoices.length > 1
              ? "Appuyez sur 1 pour la première option ou sur 2 pour la deuxième."
              : "Appuyez sur 1 pour choisir l'horaire disponible."
            : schedulingChoices.length > 1
            ? "Press 1 for the first appointment or 2 for the second appointment."
            : "Press 1 to choose the available appointment."
        );

        return twimlResponse(response);
      }

      try {
        const bookingResult =
          await PhoneAppointmentBookingService.bookMatch({
            applicationId: application.id,
            matchId:
              schedulingChoices[selectedIndex].id!,
            callSid,
            language,
          });

        const appointmentDate =
          new Date(bookingResult.scheduledAt);

        const dateLocale =
          language === "fr"
            ? "fr-FR"
            : language === "es"
            ? "es-US"
            : language === "ht"
            ? "fr-HT"
            : "en-US";

        const dateText =
          new Intl.DateTimeFormat(
            dateLocale,
            {
              timeZone:
                "America/New_York",
              weekday: "long",
              month: "long",
              day: "numeric",
            }
          ).format(appointmentDate);

        const timeText =
          new Intl.DateTimeFormat(
            dateLocale,
            {
              timeZone:
                "America/New_York",
              hour: "numeric",
              minute: "2-digit",
              timeZoneName: "short",
            }
          ).format(appointmentDate);

        response.say(
          voiceForLanguage(language),
          language === "ht"
            ? `Randevou ou konfime pou ${dateText}, a ${timeText}. Reyinyon an ap fèt pa telefòn ak Konseye Pèsonèl Epew ou.`
            : language === "es"
            ? `Su cita está confirmada para ${dateText} a las ${timeText}. La reunión será por teléfono con su Coach Personal de EPEW.`
            : language === "fr"
            ? `Votre rendez-vous est confirmé pour ${dateText} à ${timeText}. La réunion aura lieu par téléphone avec votre Coach Personnel EPEW.`
            : `Your appointment is confirmed for ${dateText} at ${timeText}. The meeting will be by phone with your EPEW Personal Coach.`
        );

        const memberMenuGather =
          response.gather({
            input: ["dtmf"],
            action:
              `${publicBaseUrl}/api/twilio/voice/inbound?step=member_assistance&lang=${language}`,
            method: "POST",
            numDigits: 1,
            timeout: 12,
            actionOnEmptyResult: true,
          });

        if (language === "ht") {
          memberMenuGather.play(
            `${publicBaseUrl}/audio/phone/ht-member-assistance-menu.mp3`
          );
        } else {
          memberMenuGather.say(
            voiceForLanguage(language),
            language === "es"
              ? "¿Cómo más podemos ayudarle? Para información general sobre EPEW, presione 1. Para emprendedores, presione 2. Para partidarios, presione 3. Para socios, presione 4. Para vendedores, presione 5."
              : language === "fr"
              ? "Comment pouvons-nous encore vous aider ? Pour des informations générales sur EPEW, appuyez sur 1. Pour devenir entrepreneur, appuyez sur 2. Pour devenir supporter, appuyez sur 3. Pour devenir partenaire, appuyez sur 4. Pour devenir vendeur, appuyez sur 5."
              : "How else can we help you? For general information about EPEW, press 1. To become an Entrepreneur, press 2. To become a Supporter, press 3. To become an EPEW Partner, press 4. To become an EPEW Vendor, press 5."
          );
        }

        return twimlResponse(response);
      } catch (bookingError) {
        console.error(
          "Phone appointment booking error:",
          bookingError
        );

        const retryGather = response.gather({
          input: ["speech"],
          action:
            `${publicBaseUrl}/api/twilio/voice/inbound?step=schedule_availability&lang=${language}`,
          method: "POST",
          timeout: 8,
          speechTimeout: "auto",
          actionOnEmptyResult: true,
        });

        retryGather.say(
          voiceForLanguage(language),
          language === "ht"
            ? "Lè ou te chwazi a pa disponib ankò. Tanpri di m yon lòt jou ak lè ou disponib."
            : language === "es"
            ? "El horario que eligió ya no está disponible. Dígame otro día y horario en que esté disponible."
            : language === "fr"
            ? "L'horaire que vous avez choisi n'est plus disponible. Dites-moi un autre jour et une autre plage horaire."
            : "The appointment you selected is no longer available. Please tell me another day and time when you are available."
        );

        return twimlResponse(response);
      }
    }

    if (step === "schedule_offer") {
      if (digits === "2") {
        if (language === "ht") {
          const memberMenuGather =
            response.gather({
              input: ["dtmf"],
              action:
                `${publicBaseUrl}/api/twilio/voice/inbound?step=member_assistance&lang=${language}`,
              method: "POST",
              numDigits: 1,
              timeout: 12,
              actionOnEmptyResult: true,
            });

          memberMenuGather.play(
            `${publicBaseUrl}/audio/phone/ht-member-assistance-menu.mp3`
          );

          return twimlResponse(response);
        }

        response.say(
          voiceForLanguage(language),
          goodbyePrompt(language)
        );

        return twimlResponse(response);
      }

      if (digits === "1") {
        const availabilityGather = response.gather({
          input: ["speech"],
          action:
            `${publicBaseUrl}/api/twilio/voice/inbound?step=schedule_availability&lang=${language}`,
          method: "POST",
          timeout: 8,
          speechTimeout: "auto",
          actionOnEmptyResult: true,
        });

        if (language === "ht") {
          availabilityGather.play(
            `${publicBaseUrl}/audio/phone/ht-schedule-availability.mp3`
          );
        } else {
          availabilityGather.say(
            voiceForLanguage(language),
            language === "es"
              ? "Muy bien. Le ayudaré a encontrar una cita que funcione para usted. Por favor, dígame qué día y a qué hora está disponible para hablar con su Coach Personal."
              : language === "fr"
              ? "Très bien. Je vais vous aider à trouver un rendez-vous qui vous convient. Dites-moi quel jour et à quelle heure vous êtes disponible pour parler avec votre Coach Personnel."
              : "Very well. I will help you find an appointment that works for you. Please tell me what day and time you are available to speak with your Personal Coach."
          );
        }

        return twimlResponse(response);
      }

      const gather = response.gather({
        input: ["dtmf"],
        action:
          `${publicBaseUrl}/api/twilio/voice/inbound?step=schedule_offer&lang=${language}`,
        method: "POST",
        numDigits: 1,
        timeout: 10,
        actionOnEmptyResult: true,
      });

      if (language === "ht") {
        gather.play(
          `${publicBaseUrl}/audio/phone/ht-no-meeting-schedule-offer.mp3`
        );
      } else {
        gather.say(
          voiceForLanguage(language),
          scheduleOfferPrompt(language)
        );
      }

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

      if (language === "ht") {
        gather.play(
          `${publicBaseUrl}/audio/phone/ht-account-confirmation.mp3`
        );
      } else {
        gather.say(
          voiceForLanguage(language),
          confirmationPrompt(language)
        );
      }

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
          ? "Idantite ou pa konfime. Pou pwoteje enfòmasyon ou, nou pa kapab bay detay sou apèl EPE-W ki asosye ak kont sa a."
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
      const gather = response.gather({
        input: ["dtmf"],
        action:
          `${publicBaseUrl}/api/twilio/voice/inbound?step=schedule_offer&lang=${language}`,
        method: "POST",
        numDigits: 1,
        timeout: 10,
        actionOnEmptyResult: true,
      });

      if (language === "ht") {
        gather.play(
          `${publicBaseUrl}/audio/phone/ht-no-meeting-schedule-offer.mp3`
        );
      } else {
        gather.say(
          voiceForLanguage(language),
          scheduleOfferPrompt(language)
        );
      }

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

    if (language !== "ht") {
      if (coachName) {
        response.say(
          voiceForLanguage(language),
          `Thank you. I found the recent call. Your EPEW Personal Coach, ${coachName}, was trying to reach you regarding ${purpose}.`
        );
      } else {
        response.say(
          voiceForLanguage(language),
          `Thank you. I found the recent call. An EPEW representative was trying to reach you regarding ${purpose}.`
        );
      }
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

      if (language === "ht") {
        response.play(
          `${publicBaseUrl}/audio/phone/ht-connecting-coach.mp3`
        );
      } else {
        response.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          coachName
            ? `Please hold while I connect you to your EPEW Personal Coach, ${coachName}.`
            : "Please hold while I connect you to your EPEW Personal Coach."
        );
      }

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

    const scheduleGather = response.gather({
      input: ["dtmf"],
      action:
        `${publicBaseUrl}/api/twilio/voice/inbound?step=schedule_offer&lang=${language}`,
      method: "POST",
      numDigits: 1,
      timeout: 10,
      actionOnEmptyResult: true,
    });

    if (language === "ht") {
      scheduleGather.play(
        `${publicBaseUrl}/audio/phone/ht-no-meeting-schedule-offer.mp3`
      );
    } else {
      scheduleGather.say(
        voiceForLanguage(language),
        scheduleOfferPrompt(language)
      );
    }

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
