import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const TEST_BUSINESS_NAME = "Food Fans Restaurant — FFR-002";
const ACTION_KEY = "prequalification-phone-test:FFR-002";

function normalizeUsPhone(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return String(value ?? "").trim();
}

async function authorizeOneTime(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) return false;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date().toISOString();

  const { data: action, error } = await supabaseAdmin
    .from("epew_internal_action_tokens")
    .select("id")
    .eq("action_key", ACTION_KEY)
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) throw error;
  if (!action) return false;

  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("epew_internal_action_tokens")
    .update({ used_at: now })
    .eq("id", action.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) throw claimError;
  return Boolean(claimed);
}

export async function GET(request: NextRequest) {
  try {
    if (!(await authorizeOneTime(request))) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { data: application, error } = await supabaseAdmin
      .from("entrepreneur_applications")
      .select("id,full_name,business_name,phone,questionnaire_status,qualification_status,interview_status")
      .eq("business_name", TEST_BUSINESS_NAME)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!application) {
      return NextResponse.json({ success: false, message: "FFR-002 application was not found." }, { status: 404 });
    }

    if (!application.phone?.trim()) {
      return NextResponse.json({ success: false, message: "FFR-002 does not have a test phone number configured." }, { status: 409 });
    }

    if (String(application.questionnaire_status ?? "").toLowerCase() !== "completed") {
      return NextResponse.json({ success: false, message: "FFR-002 questionnaire is not completed." }, { status: 409 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const from =
      process.env.TWILIO_PHONE_NUMBER?.trim() ||
      process.env.TWILIO_FROM_NUMBER?.trim() ||
      process.env.EPEW_TWILIO_PHONE_NUMBER?.trim();

    if (!accountSid || !authToken || !from) {
      return NextResponse.json({ success: false, message: "Twilio voice calling is not fully configured." }, { status: 500 });
    }

    const publicBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.EPEW_PUBLIC_BASE_URL?.trim() ||
      "https://www.epew.us";

    const client = twilio(accountSid, authToken);
    const call = await client.calls.create({
      to: normalizeUsPhone(application.phone),
      from: normalizeUsPhone(from),
      url: `${publicBaseUrl}/api/twilio/voice/prequalification?applicationId=${encodeURIComponent(String(application.id))}&q=0`,
      method: "POST",
      timeout: 45,
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      businessName: application.business_name,
      callSid: call.sid,
      callStatus: call.status,
    });
  } catch (error) {
    console.error("FFR-002 prequalification test call failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to start the FFR-002 prequalification phone test.",
      },
      { status: 500 }
    );
  }
}
