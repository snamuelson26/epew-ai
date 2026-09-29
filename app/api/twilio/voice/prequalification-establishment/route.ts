import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { appendLanguageMenu, appendCreoleConsent, coachLanguage, languageDigit, needsLanguageChoice, sayCoach, translateCoachText, type CoachLanguage } from "@/lib/twilio/coachLanguage";
import { appendInterviewGather, isNewInterviewCall } from "@/lib/twilio/prequalificationListening";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";

import { State, loadApplication, parseState, freshState, saveState, markInterrupted, questionFor, displayBusinessName, businessIdFor, asksForRepeat, asksForMeaning, clarificationFor, nextTopic, evaluateCompletedInterview, welcomeAndIntroduction, acknowledgement, transitionFor, coachPreparationSummary, missionClarification } from "@/lib/interviews/prequalification";
function xml(response: twilio.twiml.VoiceResponse, status = 200) {
  return new NextResponse(response.toString(), { status, headers: { "Content-Type": "text/xml" } });
}
function voice() { return { voice: "Polly.Matthew", language: "en-US" } as const; }
async function gather(response: twilio.twiml.VoiceResponse, origin: string, id: number, prompt: string, app: any, language: CoachLanguage, retry = false) {
  const hints = [app.full_name, displayBusinessName(app), businessIdFor(app), app.business_type, app.business_category, app.business_city, app.business_state, app.city, app.state, app.enterprise_country, app.address_country, "EPEW", "EDE", "IBOS", "entrepreneur"].filter(Boolean).join(",");
  await appendInterviewGather(response, { origin, applicationId: id, prompt, hints, retry, language });
}

export async function POST(request: NextRequest) {
  let currentLanguage: CoachLanguage = "en";
  try {
    const { valid, params } = await validateTwilioWebhook(request);
    const response = new twilio.twiml.VoiceResponse();

    if (!valid) {
      response.say(voice(), "This request could not be verified.");
      return xml(response, 403);
    }

    const url = new URL(request.url);
    const id = Number(url.searchParams.get("applicationId"));
    let speech = String(params.SpeechResult ?? "").trim();
    let originalSpeech = speech;
    let digits = String(params.Digits ?? "").trim();
    const callSid = String(params.CallSid ?? "").trim();

    if (!Number.isInteger(id) || id <= 0) {
      response.say(voice(), "This EPEW pre-qualification interview could not be identified.");
      response.hangup();
      return xml(response, 400);
    }

    const app = await loadApplication(id);
    if (!app) {
      response.say(voice(), "We could not find this EPEW entrepreneur application.");
      response.hangup();
      return xml(response, 404);
    }

    if (String(app.questionnaire_status ?? "").toLowerCase() !== "completed") {
      response.say(voice(), "Your entrepreneur questionnaire must be completed before this interview can begin.");
      response.hangup();
      return xml(response, 409);
    }

    const state: State = parseState(app.interview_notes) ?? {
      ...freshState(),
      record_notes: typeof app.interview_notes === "string" ? app.interview_notes : undefined,
    };
    currentLanguage = coachLanguage(state.language);
    const turn = url.searchParams.get("turn");
    const recordInputEvent = (event: string) => {
      state.listening_events = [...(state.listening_events ?? []), {
        at: new Date().toISOString(), call_sid: callSid, event,
        ...(speech ? { confidence: String(params.Confidence ?? "") } : {}),
      }].slice(-200);
    };

    if (state.completed_at) {
      response.say(voice(), "Your pre-qualification interview is already complete. Thank you. Your Personal Coach will continue with the next steps.");
      response.hangup();
      return xml(response);
    }

    if (isNewInterviewCall(state.call_sid, callSid, Boolean(turn))) {
      // A fresh call must never inherit the exhausted silence counter from a
      // previous attempt. Keep the transcript and resume the unanswered topic.
      state.call_sid = callSid;
      state.no_input_count = 0;
      recordInputEvent("call_started");
      state.language_menu_attempts = 0;
      await saveState(id, state, false);
      appendLanguageMenu(response, url.origin, id);
      return xml(response);
    }

    const showLanguageMenu = async () => {
      recordInputEvent("language_choice_requested");
      state.language_menu_attempts = (state.language_menu_attempts ?? 0) + 1;
      await saveState(id, state, false);
      if (state.language_menu_attempts > 3) {
        await markInterrupted(id, state);
        // The menu itself is multilingual even if a translation service is down.
        response.say(voice(), "We could not confirm your language. Your interview remains pending. Thank you.");
        response.hangup();
      } else appendLanguageMenu(response, url.origin, id);
    };

    if (turn === "language") {
      const selected = languageDigit(digits);
      if (!selected) { await showLanguageMenu(); return xml(response); }
      state.language = selected;
      currentLanguage = selected;
      state.no_input_count = 0;
      state.language_menu_attempts = 0;
      recordInputEvent(`language_selected_${selected}`);
      await saveState(id, state, false);
      if (selected === "ht" && state.recording_consent_call_sid !== callSid) appendCreoleConsent(response, url.origin, id);
      else await gather(response, url.origin, id, questionFor(state.current_topic, app) + " Press the star key at any time to change language.", app, currentLanguage);
      return xml(response);
    }

    if (turn === "record-consent") {
      if (digits !== "1") { await showLanguageMenu(); return xml(response); }
      state.recording_consent_call_sid = callSid;
      recordInputEvent("creole_transcription_consent");
      await saveState(id, state, false);
      await gather(response, url.origin, id, questionFor(state.current_topic, app), app, currentLanguage);
      return xml(response);
    }

    if (digits === "*") { await showLanguageMenu(); return xml(response); }

    if (turn === "recorded" || turn === "record-poll") {
      const recordingSid = String(params.RecordingSid || url.searchParams.get("recordingSid") || "");
      if (!/^RE[0-9a-f]{32}$/i.test(recordingSid) || state.recording_consent_call_sid !== callSid) {
        await showLanguageMenu(); return xml(response);
      }
      const { data: job, error: jobError } = await supabaseAdmin.from("epew_phone_recording_jobs")
        .select("status,original_text,english_text").eq("recording_sid", recordingSid).eq("call_sid", callSid).eq("application_id", id).maybeSingle();
      if (jobError) throw new Error("Transcription result unavailable");
      const attempt = Number(url.searchParams.get("attempt") || 0);
      if (!job || job.status === "processing") {
        if (!Number.isInteger(attempt) || attempt >= 20) { await showLanguageMenu(); return xml(response); }
        response.pause({ length: 2 });
        response.redirect({ method: "POST" }, `${url.origin}/api/twilio/voice/prequalification-establishment?applicationId=${id}&turn=record-poll&recordingSid=${recordingSid}&attempt=${attempt + 1}`);
        return xml(response);
      }
      if (state.processed_recordings?.includes(recordingSid)) {
        await gather(response, url.origin, id, questionFor(state.current_topic, app), app, currentLanguage);
        return xml(response);
      }
      state.processed_recordings = [...(state.processed_recordings ?? []), recordingSid];
      speech = job.status === "ready" ? String(job.english_text || "") : "";
      originalSpeech = String(job.original_text || "");
      digits = "";
    }

    if (needsLanguageChoice(speech, String(params.Confidence ?? "")) && !digits) {
      recordInputEvent(speech ? "speech_unclear_or_language_request" : "no_recognized_speech");
      state.no_input_count += 1;
      await showLanguageMenu();
      return xml(response);
    }
    if (speech && currentLanguage !== "en" && currentLanguage !== "ht") {
      speech = await translateCoachText(speech, "en");
      if (needsLanguageChoice(speech, "")) { await showLanguageMenu(); return xml(response); }
    }

    if (digits) {
      // A keypress verifies a working keypad path; it is not an interview answer.
      recordInputEvent(digits === "9" ? "keypad_retry" : "other_keypad_input");
      state.no_input_count = 0;
      const prompt = `I received your keypress. Let us try your voice again. ${questionFor(state.current_topic, app)} Please answer after I finish speaking.`;
      state.messages.push({ role: "coach", topic: state.current_topic, content: prompt, at: new Date().toISOString() });
      await saveState(id, state, false);
      await gather(response, url.origin, id, prompt, app, currentLanguage, true);
      return xml(response);
    }

    recordInputEvent("speech_recognized");
    state.no_input_count = 0;
    state.messages.push({ role: "entrepreneur", topic: state.current_topic, content: originalSpeech, language: currentLanguage, english_translation: speech, at: new Date().toISOString() });

    if (asksForRepeat(speech)) {
      const repeat = questionFor(state.current_topic, app);
      state.messages.push({ role: "coach", topic: state.current_topic, content: repeat, at: new Date().toISOString() });
      await saveState(id, state, false);
      await gather(response, url.origin, id, repeat, app, currentLanguage);
      return xml(response);
    }

    if (asksForMeaning(speech)) {
      const clarification = clarificationFor(state.current_topic);
      state.messages.push({ role: "coach", topic: state.current_topic, content: clarification, at: new Date().toISOString() });
      await saveState(id, state, false);
      await gather(response, url.origin, id, clarification, app, currentLanguage);
      return xml(response);
    }

    const answered = state.current_topic;
    const next = nextTopic(answered, app, speech);

    if (!next) {
      const evaluation = await evaluateCompletedInterview(app, state);
      state.completed_at = new Date().toISOString();
      state.summary = evaluation.summary;
      state.scores = evaluation.scores;
      await saveState(id, state, true);
      const closing = "Thank you for attending the meeting. We are looking forward to helping you open a successful business. Thank you, and have a blessed day.";
      await sayCoach(response, url.origin, closing, currentLanguage);
      response.hangup();
      return xml(response);
    }

    state.current_topic = next;
    let reply = "";

    if (answered === "business_verification") {
      reply = welcomeAndIntroduction();
    } else {
      reply = acknowledgement(answered, speech);
      const transition = transitionFor(next);
      if (transition) reply = `${reply} ${transition}`;
      if (next === "mission_orientation") reply = `${reply} ${coachPreparationSummary()}`;
      if (answered === "mission_orientation") reply = `${reply} ${missionClarification()}`;
      reply = `${reply} ${questionFor(next, app)}`.trim();
    }

    state.messages.push({ role: "coach", topic: next, content: reply, at: new Date().toISOString() });
    await saveState(id, state, false);
    await gather(response, url.origin, id, reply, app, currentLanguage);
    return xml(response);
  } catch (error) {
    console.error("EPEW approved prequalification error:", error);
    const response = new twilio.twiml.VoiceResponse();
    const id = Number(request.nextUrl.searchParams.get("applicationId"));
    if (Number.isSafeInteger(id) && id > 0) appendLanguageMenu(response, request.nextUrl.origin, id);
    else response.hangup();
    return xml(response);
  }
}
