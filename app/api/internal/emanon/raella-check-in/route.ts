import { NextRequest, NextResponse } from "next/server";

import { runScheduledRaellaCheckIn } from "@/lib/emanon/scheduledRaellaCheckIn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const result = await runScheduledRaellaCheckIn();
    console.info("Scheduled Emanon Raella check-in completed", {
      sent: result.sent,
      reason: "reason" in result ? result.reason : null,
      conversationId: "conversationId" in result ? result.conversationId : null,
      messageId: "messageId" in result ? result.messageId : null,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Scheduled Emanon Raella check-in failed", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to send check-in.",
      },
      { status: 500 },
    );
  }
}
