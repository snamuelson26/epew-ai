import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    const user = userData.user;
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const contactId = String(body.contactId || "").trim();
    const businessCode = String(body.businessCode || "").trim();

    if (!contactId || !businessCode) {
      return NextResponse.json({ error: "Contact and business account are required." }, { status: 400 });
    }

    const { data: contact, error: contactError } = await supabaseAdmin
      .from("epew_entrepreneur_communication_contacts")
      .select("id,entrepreneur_user_id,business_code,prospect_name,email,phone,opted_out_at,status")
      .eq("id", contactId)
      .eq("entrepreneur_user_id", user.id)
      .eq("business_code", businessCode)
      .maybeSingle();

    if (contactError) throw contactError;
    if (!contact) return NextResponse.json({ error: "Potential supporter not found for this business account." }, { status: 404 });
    if (contact.opted_out_at) return NextResponse.json({ error: "This contact has opted out of campaign communication." }, { status: 409 });

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: existingQueued } = await supabaseAdmin
      .from("epew_entrepreneur_communication_messages")
      .select("id,delivery_status,scheduled_for,created_at")
      .eq("entrepreneur_user_id", user.id)
      .eq("contact_id", contactId)
      .eq("business_code", businessCode)
      .eq("message_type", "introduction")
      .eq("delivery_status", "queued")
      .gte("created_at", twoMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingQueued) {
      return NextResponse.json({
        ok: true,
        alreadyQueued: true,
        messageId: existingQueued.id,
        status: "queued",
        scheduledFor: existingQueued.scheduled_for,
      });
    }

    const { data: latestMessage, error: messageError } = await supabaseAdmin
      .from("epew_entrepreneur_communication_messages")
      .select("language,subject,body,sender_voice,delivery_channel")
      .eq("entrepreneur_user_id", user.id)
      .eq("contact_id", contactId)
      .eq("business_code", businessCode)
      .eq("message_type", "introduction")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (messageError) throw messageError;
    if (!latestMessage) {
      return NextResponse.json({ error: "No original campaign message is available to resend." }, { status: 404 });
    }

    const deliveryChannel = latestMessage.delivery_channel || (contact.email ? "email" : contact.phone ? "sms" : null);
    if (!deliveryChannel) {
      return NextResponse.json({ error: "This supporter does not have an available email address or phone number." }, { status: 409 });
    }

    const scheduledFor = new Date().toISOString();
    const { data: queued, error: insertError } = await supabaseAdmin
      .from("epew_entrepreneur_communication_messages")
      .insert({
        entrepreneur_user_id: user.id,
        contact_id: contactId,
        business_code: businessCode,
        message_type: "introduction",
        language: latestMessage.language || "en",
        subject: latestMessage.subject,
        body: latestMessage.body,
        sender_voice: latestMessage.sender_voice || "entrepreneur",
        delivery_channel: deliveryChannel,
        delivery_status: "queued",
        scheduled_for: scheduledFor,
        sent_at: null,
      })
      .select("id,delivery_status,scheduled_for")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      ok: true,
      messageId: queued.id,
      status: queued.delivery_status,
      scheduledFor: queued.scheduled_for,
      contactName: contact.prospect_name,
      channel: deliveryChannel,
    });
  } catch (error) {
    console.error("Supporter resend error:", error);
    return NextResponse.json({ error: "Unable to resend this campaign message." }, { status: 500 });
  }
}
