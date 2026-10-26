import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifySentWebhook } from "@/lib/sent/verifyWebhook";
import { parseSentEvent } from "@/lib/sent/parseEvent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.SENT_DM_WEBHOOK_SECRET;
  const endpointId = process.env.SENT_DM_WEBHOOK_ID;
  const sender = process.env.SENT_DM_SENDER_NUMBER;
  if (!secret || !endpointId || !sender) return new NextResponse("Not configured", { status: 503 });
  const length = request.headers.get("content-length");
  if (length && Number(length) > 65536) return new NextResponse("Too large", { status: 413 });
  // Bound the actual stream too: Content-Length may be absent or untrusted.
  const reader = request.body?.getReader();
  if (!reader) return new NextResponse("Missing body", { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 65536) { await reader.cancel(); return new NextResponse("Too large", { status: 413 }); }
      chunks.push(value);
    }
  } catch { return new NextResponse("Invalid body", { status: 400 }); }
  const body = Buffer.concat(chunks);
  if (!verifySentWebhook(body, request.headers, secret, endpointId)) return new NextResponse("Unauthorized", { status: 401 });
  let event;
  try {
    const decoded = JSON.parse(body.toString("utf8"));
    // Sent's signed dashboard health tests use a zero account placeholder.
    // Acknowledge them without recording delivery truth or applying consent.
    if (decoded?.field === "message" && typeof decoded.event === "string" && decoded.event.startsWith("message.") &&
      decoded.payload?.account_id === "00000000-0000-0000-0000-000000000000") {
      return NextResponse.json({ received: true, synthetic: true });
    }
    event = parseSentEvent(decoded, sender);
  }
  catch { return new NextResponse("Invalid event", { status: 400 }); }
  // Durable event storage and suppression commit together before acknowledgement.
  // Sent already handles keyword replies; never send a duplicate reply here.
  const { error } = await supabaseAdmin.rpc("epew_record_sent_event", {
    p_key: event.key, p_field: event.field, p_event: event.name,
    p_message_id: event.messageId, p_channel: event.channel,
    p_payload: event.payload, p_stop_phone: event.stopPhone,
  });
  if (error) return new NextResponse("Unavailable", { status: 503 });
  return NextResponse.json({ received: true });
}
