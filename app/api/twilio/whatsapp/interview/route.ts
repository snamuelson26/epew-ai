import { createHash, randomUUID } from "node:crypto";
import { after, NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";
import { coachLanguage } from "@/lib/twilio/coachLanguage";
import {
  loadApplication,
  freshState,
  parseState,
  evaluateCompletedInterview,
} from "@/lib/interviews/prequalification";
import {
  whatsappNumber,
  whatsappReadiness,
  whatsappSender,
  languageMenu,
} from "@/lib/whatsapp/config";
import { whatsappInterviewTurn } from "@/lib/whatsapp/interviewTurn";
import { transcribeWhatsApp, validatedMediaPath } from "@/lib/whatsapp/media";
export const maxDuration = 60;
export const runtime = "nodejs";
function reply(body?: string) {
  const r = new twilio.twiml.MessagingResponse();
  if (body) r.message(body);
  return new NextResponse(r.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
export async function POST(request: NextRequest) {
  const { valid, params } = await validateTwilioWebhook(request);
  if (!valid) return new NextResponse("Forbidden", { status: 403 });
  const phone = whatsappNumber(params.From ?? "");
  const sender = whatsappSender();
  const sid = params.MessageSid ?? "";
  if (
    !phone ||
    !String(params.From).startsWith("whatsapp:") ||
    whatsappNumber(params.To ?? "") !== sender ||
    !/^(SM|MM)[0-9a-f]{32}$/i.test(sid)
  )
    return new NextResponse("Invalid message", { status: 400 });
  if (!whatsappReadiness().messaging)
    return reply(
      "EPEW WhatsApp interviews are awaiting activation. Please use your entrepreneur portal for assistance.",
    );
  const text = String(params.Body ?? "").trim();
  const start = text.match(/^EPEW ([0-9a-f]{36})$/i);
  if (start) {
    const hash = createHash("sha256").update(start[1]).digest("hex");
    const { data, error } = await supabaseAdmin
      .from("epew_whatsapp_interviews")
      .update({
        verified_at: new Date().toISOString(),
        token_hash: null,
        token_expires_at: null,
        choosing_language: true,
      })
      .eq("phone", phone)
      .eq("token_hash", hash)
      .gt("token_expires_at", new Date().toISOString())
      .select("application_id")
      .maybeSingle();
    if (error) return new NextResponse("Unavailable", { status: 503 });
    if (data)
      return reply(
        "Your WhatsApp number is connected. Voice notes will be transcribed and saved with your interview. / N ap transkri mesaj vokal ou yo epi konsève tèks la nan dosye entèvyou ou.\n\n" +
          languageMenu,
      );
  }
  const { data: link, error } = await supabaseAdmin
    .from("epew_whatsapp_interviews")
    .select("application_id,choosing_language,locked_until")
    .eq("phone", phone)
    .not("verified_at", "is", null)
    .maybeSingle();
  if (error) return new NextResponse("Unavailable", { status: 503 });
  if (!link)
    return reply(
      "Please connect WhatsApp from your signed-in EPEW entrepreneur portal: https://www.epew.us/entrepreneurs/whatsapp-interview",
    );
  if (start) return reply(languageMenu);
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("epew_whatsapp_interview_messages")
    .select("status,reply")
    .eq("message_sid", sid)
    .maybeSingle();
  if (existingError) return new NextResponse("Unavailable", { status: 503 });
  if (existing?.status === "sent") return reply();
  const lock = randomUUID();
  const now = new Date().toISOString();
  const { data: claimed, error: lockError } = await supabaseAdmin
    .from("epew_whatsapp_interviews")
    .update({
      locked_until: new Date(Date.now() + 70000).toISOString(),
      lock_token: lock,
    })
    .eq("application_id", link.application_id)
    .or(`locked_until.is.null,locked_until.lt.${now}`)
    .select("application_id")
    .maybeSingle();
  if (lockError) return new NextResponse("Unavailable", { status: 503 });
  if (!claimed)
    return reply(
      "Please wait for the current answer to finish, then send your next answer. / Tanpri tann repons aktyèl la fini, apre sa voye pwochen repons ou.",
    );
  if (!existing) {
    const { error: insertError } = await supabaseAdmin
      .from("epew_whatsapp_interview_messages")
      .insert({ message_sid: sid, application_id: link.application_id });
    if (insertError) {
      await supabaseAdmin
        .from("epew_whatsapp_interviews")
        .update({ locked_until: null, lock_token: null })
        .eq("application_id", link.application_id)
        .eq("lock_token", lock);
      return new NextResponse("Retry", { status: 503 });
    }
  }
  after(async () => {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
      { timeout: 10000 },
    );
    let prepared = existing?.status === "ready" ? existing.reply : null;
    try {
      if (!prepared) {
        const app = await loadApplication(link.application_id);
        if (!app || app.questionnaire_status !== "completed")
          throw new Error("Interview unavailable");
        const state = parseState(app.interview_notes) ?? {
          ...freshState(),
          record_notes: app.interview_notes ?? undefined,
        };
        let input = text;
        if (Number(params.NumMedia) > 0) {
          if (!String(params.MediaContentType0).startsWith("audio/"))
            throw new Error("Use text or voice note");
          input = await transcribeWhatsApp(
            params.MediaUrl0,
            sid,
            coachLanguage(state.language),
          );
        }
        if (input.length > 10000) throw new Error("Answer too long");
        const turn = await whatsappInterviewTurn(
          state,
          app,
          input,
          link.choosing_language,
        );
        if (turn.complete) {
          const evaluation = await evaluateCompletedInterview(app, turn.state);
          turn.state.summary = evaluation.summary;
          turn.state.scores = evaluation.scores;
        }
        if (state.completed_at) {
          const { error: saveError } = await supabaseAdmin
            .from("epew_whatsapp_interview_messages")
            .update({ status: "ready", reply: turn.reply })
            .eq("message_sid", sid);
          if (saveError) throw saveError;
        } else {
          const { error: saveError } = await supabaseAdmin.rpc(
            "epew_save_whatsapp_turn",
            {
              p_application: link.application_id,
              p_message: sid,
              p_state: turn.state,
              p_reply: turn.reply,
              p_choosing: turn.choosingLanguage,
              p_complete: Boolean(turn.state.completed_at),
              p_lock: lock,
            },
          );
          if (saveError) throw saveError;
        }
        prepared = turn.reply;
      }
      // Reply only to the inbound user's current WhatsApp conversation.
      await client.messages.create({
        from: `whatsapp:${sender}`,
        to: `whatsapp:${phone}`,
        body: prepared,
      });
      const { error: sentError } = await supabaseAdmin
        .from("epew_whatsapp_interview_messages")
        .update({ status: "sent" })
        .eq("message_sid", sid);
      if (sentError) throw sentError;
    } catch {
      if (!prepared) {
        await supabaseAdmin
          .from("epew_whatsapp_interview_messages")
          .update({ status: "failed" })
          .eq("message_sid", sid);
        try {
          await client.messages.create({
            from: `whatsapp:${sender}`,
            to: `whatsapp:${phone}`,
            body: "I could not process that answer. Please send a short text answer, or type LANGUAGE to choose your language. Your interview progress is saved. / Mwen pa t kapab trete repons sa a. Voye yon repons kout an tèks oswa ekri LANGUAGE pou chwazi lang ou.",
          });
        } catch {
          /* Keep failed state for diagnosis. */
        }
      }
      console.error("WhatsApp interview processing failed", {
        messageSid: sid,
        applicationId: link.application_id,
      });
    } finally {
      if (params.MediaUrl0) {
        try {
          const url = validatedMediaPath(
            params.MediaUrl0,
            process.env.TWILIO_ACCOUNT_SID!,
            sid,
          );
          const mediaSid = url.pathname.split("/").pop()!;
          await client.messages(sid).media(mediaSid).remove();
        } catch {
          /* Provider retention remains in effect if cleanup fails. */
        }
      }
      await supabaseAdmin
        .from("epew_whatsapp_interviews")
        .update({ locked_until: null, lock_token: null })
        .eq("application_id", link.application_id)
        .eq("lock_token", lock);
    }
  });
  return reply();
}
