import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { processDueMessages } from "@/lib/communications/processSupporterOutreach";

async function authorizeOneTimeRecovery(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const businessCode = url.searchParams.get("businessCode")?.trim();

  if (!token || !businessCode) return null;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const actionKey = `supporter-outreach:${businessCode}`;
  const now = new Date().toISOString();

  const { data: action } = await supabaseAdmin
    .from("epew_internal_action_tokens")
    .select("id,expires_at,used_at")
    .eq("action_key", actionKey)
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (!action) return null;

  const { data: claimed } = await supabaseAdmin
    .from("epew_internal_action_tokens")
    .update({ used_at: now })
    .eq("id", action.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  return claimed ? businessCode : null;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  const cronAuthorized = Boolean(secret && authorization === `Bearer ${secret}`);
  const recoveryBusinessCode = cronAuthorized ? null : await authorizeOneTimeRecovery(request);

  if (!cronAuthorized && !recoveryBusinessCode) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await processDueMessages({ businessCode: recoveryBusinessCode ?? undefined });
    return NextResponse.json({
      success: true,
      businessCode: recoveryBusinessCode ?? null,
      ...result,
    });
  } catch (error) {
    console.error("EPEW supporter outreach processor failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to process supporter outreach.",
      },
      { status: 500 }
    );
  }
}
