import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64"
);

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const normalizedToken = String(token || "").trim();

  if (normalizedToken) {
    try {
      const { data: message } = await supabaseAdmin
        .from("epew_entrepreneur_communication_messages")
        .select("id,opened_at,open_count,delivery_channel")
        .eq("open_tracking_token", normalizedToken)
        .eq("delivery_channel", "email")
        .maybeSingle();

      if (message) {
        const now = new Date().toISOString();
        await supabaseAdmin
          .from("epew_entrepreneur_communication_messages")
          .update({
            opened_at: message.opened_at || now,
            last_opened_at: now,
            open_count: Number(message.open_count || 0) + 1,
          })
          .eq("id", message.id);
      }
    } catch (error) {
      console.error("Supporter email open tracking failed", error);
    }
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
