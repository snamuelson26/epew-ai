import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function normalizeUsPhone(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return String(value ?? "").trim();
}

function easternLocalToUtc(dateValue: string, timeValue: string) {
  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeValue.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!dateMatch || !timeMatch) return null;

  const [, y, m, d] = dateMatch;
  const [, hh, mm, ss = "00"] = timeMatch;
  const wantedAsUtc = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));

  function offsetAt(instantMs: number) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(instantMs));

    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    const shownAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return shownAsUtc - instantMs;
  }

  let instant = wantedAsUtc - offsetAt(wantedAsUtc);
  instant = wantedAsUtc - offsetAt(instant);
  return new Date(instant);
}

async function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (secret && authorization === `Bearer ${secret}`) return true;

  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) return false;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabaseAdmin
    .from("epew_internal_cron_tokens")
    .select("id")
    .eq("action_key", "prequalification-call-dispatch")
    .eq("token_hash", tokenHash)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
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

    const scheduledAt = easternLocalToUtc(String(application.interview_date), String(application.interview_time));
    if (!scheduledAt || scheduledAt < windowStart || scheduledAt > windowEnd) {
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
        .update({ status: "started", call_sid: call.sid, error_message: null })
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
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

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
