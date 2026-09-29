import { after, NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";
import { readInterviewNotes } from "@/lib/twilio/prequalificationListening";
import { translateCoachText } from "@/lib/twilio/coachLanguage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { valid, params } = await validateTwilioWebhook(request);
  if (!valid) return new NextResponse("FORBIDDEN", { status: 403 });
  const id = Number(request.nextUrl.searchParams.get("applicationId"));
  const recordingSid = String(params.RecordingSid ?? "");
  const callSid = String(params.CallSid ?? "");
  if (!Number.isSafeInteger(id) || id <= 0 || !/^RE[0-9a-f]{32}$/i.test(recordingSid) || !/^CA[0-9a-f]{32}$/i.test(callSid)) return new NextResponse("Invalid recording", { status: 400 });
  const { data: app, error } = await supabaseAdmin.from("entrepreneur_applications").select("interview_notes").eq("id", id).maybeSingle();
  if (error) return new NextResponse("Unavailable", { status: 503 });
  const state = readInterviewNotes(app?.interview_notes).data;
  if (!state || state.call_sid !== callSid || state.recording_consent_call_sid !== callSid) return new NextResponse("FORBIDDEN", { status: 403 });
  const { error: claimError } = await supabaseAdmin.from("epew_phone_recording_jobs").insert({ recording_sid: recordingSid, call_sid: callSid, application_id: id });
  if (claimError?.code === "23505") return new NextResponse(null, { status: 204 });
  if (claimError) return new NextResponse("Unavailable", { status: 503 });

  after(async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    try {
      if (params.RecordingStatus !== "completed") throw new Error("Recording unavailable");
      // Never fetch a URL supplied in a webhook. Use our account and validated SID.
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.wav`, {
        headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}` }, signal: AbortSignal.timeout(8000), redirect: "error",
      });
      if (!response.ok) throw new Error("Recording unavailable");
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > 3 * 1024 * 1024) throw new Error("Recording too large");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20000, maxRetries: 0 });
      const result = await client.audio.transcriptions.create({ file: await toFile(bytes, "answer.wav"), model: "whisper-1", language: "ht", response_format: "verbose_json" });
      const voicedSegments = result.segments?.filter(segment => segment.no_speech_prob < 0.6 && segment.avg_logprob > -1);
      const original = voicedSegments?.map(segment => segment.text).join(" ").trim() ?? "";
      const english = original ? await translateCoachText(original, "en") : "";
      const { error: saveError } = await supabaseAdmin.from("epew_phone_recording_jobs").update({ status: "ready", original_text: original, english_text: english }).eq("recording_sid", recordingSid);
      if (saveError) throw new Error("Unable to save transcription");
    } catch {
      await supabaseAdmin.from("epew_phone_recording_jobs").update({ status: "failed" }).eq("recording_sid", recordingSid);
      console.error("EPEW Creole transcription failed", { applicationId: id, callSid });
    } finally {
      try { await twilio(accountSid, authToken).recordings(recordingSid).remove(); }
      catch { console.error("EPEW recording cleanup needs retry", { recordingSid }); }
    }
  });
  return new NextResponse(null, { status: 204 });
}
