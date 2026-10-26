import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";
import { appendLanguageMenu } from "@/lib/twilio/coachLanguage";

// Recovery must not depend on the dynamic audio service that just failed.
export async function POST(request: NextRequest) {
  const { valid, params } = await validateTwilioWebhook(request);
  if (!valid) return new NextResponse("Forbidden", { status: 403 });
  const id = Number(request.nextUrl.searchParams.get("applicationId"));
  if (!Number.isSafeInteger(id) || id <= 0) return new NextResponse("Invalid application", { status: 400 });
  console.error("EPEW interview voice fallback", { applicationId: id, callSid: params.CallSid, errorCode: params.ErrorCode });
  const response = new twilio.twiml.VoiceResponse();
  response.say({ voice: "Polly.Matthew", language: "en-US" }, "The interview audio is temporarily unavailable. Your progress is saved. Please choose another language to continue, or reschedule through your EPEW portal.");
  appendLanguageMenu(response, request.nextUrl.origin, id);
  return new NextResponse(response.toString(), { headers: { "Content-Type": "text/xml" } });
}
