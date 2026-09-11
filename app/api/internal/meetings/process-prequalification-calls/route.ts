import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function normalizeUsPhone(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return String(value ?? "").trim();
}

function scheduledAtIso(date: string, time: string) {
  const local = `${date}T${time}`;
  const parts = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!parts) return null;

  const [, year, month, day, hour, minute, second = "00"] = parts;
  // Pre-Qualification appointments are stored as America/New_York local date/time.
  // September is EDT (-04:00). The dispatcher only needs a real instant for due-time checks.
  return `${year}-${month}-${day}T${hour}:${minute}:${second}-04:00`;
}

async function processScheduledCalls() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 2 * 60 * 1000);

  const { data: applications, error } = await supabaseAdmin
    .from("entrepreneur_applications")
    .select("id,full_name,business_name,phone,questionnaire_status,interview_status,interview_date,interview_time,interview_type")
    .eq("interview_status", "Scheduled")
    .eq("interview_type", "phone")
    .not("interview_date", "is", null)
    .not("interview_time", "is", null)
    .limit(50);

  if (error) throw error;

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from =
    process.env.TWILIO_PHONE_NUMBER?.trim() ||
    process.env.TWILIO_FROM_NUMBER?.trim() ||
    process.env.EPEW_TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio voice calling is not fully configured.");
  }

  const publicBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.EPEW_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://www.epew.us";

  const client = twilio(accountSid, authToken);
  let started = 0;
  let skipped = 0;
  let failed = 0;

  for (const application of applications ?? []) {
    if (!application.phone || String(application.questionnaire_status ?? "").toLowerCase() !== "completed") {
      skipped += 1;
      continue;
    }

    const iso = scheduledAtIso(String(application.interview_date), String(application.interview_time));
    if (!iso) {
      skipped += 1;
      continue;
    }

    const scheduledAt = new Date(iso);
    if (scheduledAt < windowStart || scheduledAt > windowEnd) {
      skipped += 1;
      continue;
    }

    const { data: existing } = await supabaseAdmin
      .from("epew_prequalification_call_dispatch")
      .select("id,status")
      .eq("application_id", application.id)
      .eq("scheduled_at", scheduledAt.toISOString())
      .maybeSingle();

    if (existing) {
      skipped += 1;
      continue;
    }

    const { data: dispatch, error: claimError } = await supabaseAdmin
      .from("epew_prequalification_call_dispatch")
      .insert({
        application_id: application.id,
        scheduled_at: scheduledAt.toISOString(),
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (claimError || !dispatch) {
      skipped += 1;
      continue;
    }

    try {
      const call = await client.calls.create({
        to: normalizeUsPhone(application.phone),
        from: normalizeUsPhone(from),
        url: `${publicBaseUrl}/api/twilio/voice/prequalification-establishment?applicationId=${encodeURIComponent(String(application.id))}`,
        method: "POST",
        timeout: 45,
      });

      await supabaseAdmin
        .from("epew_prequalification_call_dispatch")
        .update({
          status: "started",
          call_sid: call.sid,
          error_message: null,
        })
        .eq("id", dispatch.id);

      started += 1;
    } catch (callError) {
      await supabaseAdmin
        .from("epew_prequalification_call_dispatch")
        .update({
          status: "failed",
          error_message: callError instanceof Error ? callError.message : "Unable to start phone call.",
          completed_at: new Date().toISOString(),
        })
        .eq("id", dispatch.id);
      failed += 1;
    }
  }

  return { checked: (applications ?? []).length, started, skipped, failed };
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await processScheduledCalls();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Pre-Qualification call processor failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to process scheduled Pre-Qualification calls.",
      },
      { status: 500 },
    );
  }
}
