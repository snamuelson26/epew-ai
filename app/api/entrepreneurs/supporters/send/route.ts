import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { processDueMessages } from "@/lib/communications/processSupporterOutreach";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const messageId = typeof body.messageId === "string" ? body.messageId : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
      return NextResponse.json({ error: "A valid message is required." }, { status: 400 });
    }

    const { data: message, error: messageError } = await supabaseAdmin
      .from("epew_entrepreneur_communication_messages")
      .select("id,business_code,delivery_status,scheduled_for,sent_at,delivery_channel")
      .eq("id", messageId)
      .eq("entrepreneur_user_id", data.user.id)
      .eq("message_type", "introduction")
      .maybeSingle();
    if (messageError) throw messageError;
    if (!message) return NextResponse.json({ error: "Support request not found." }, { status: 404 });

    // Only this entrepreneur's saved request can be dispatched. Concurrent workers
    // use the same atomic queued -> sending claim and email idempotency key.
    await processDueMessages({ messageId, entrepreneurUserId: data.user.id });
    const { data: updated, error: statusError } = await supabaseAdmin
      .from("epew_entrepreneur_communication_messages")
      .select("delivery_status,scheduled_for,sent_at,delivery_channel")
      .eq("id", messageId)
      .eq("entrepreneur_user_id", data.user.id)
      .single();
    if (statusError) throw statusError;
    return NextResponse.json({ ok: true, ...updated });
  } catch (error) {
    console.error("Immediate supporter request failed", error);
    return NextResponse.json({ error: "Your request is saved, but delivery could not be completed. It will be retried automatically." }, { status: 500 });
  }
}
