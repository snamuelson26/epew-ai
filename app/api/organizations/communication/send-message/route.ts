import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEpewEmail } from "@/lib/email/sendEpewEmail";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function messageHtml(body: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;white-space:pre-line">${escapeHtml(body)}</div>`;
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    const user = userData.user;
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const profileCode = String(body.profileCode || "").trim();
    const contactId = String(body.contactId || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    if (!profileCode || !contactId || !subject || !message) {
      return NextResponse.json({ error: "Contact, subject, and message are required." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("organization_portal_profiles")
      .select("entity_id,display_name,external_sender")
      .eq("auth_user_id", user.id)
      .eq("profile_code", profileCode)
      .eq("status", "active")
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return NextResponse.json({ error: "Organization profile not available." }, { status: 403 });

    const { data: groups, error: groupsError } = await supabaseAdmin
      .from("communication_groups")
      .select("id")
      .eq("entity_id", profile.entity_id);
    if (groupsError) throw groupsError;

    const groupIds = (groups || []).map((row) => row.id);
    if (!groupIds.length) return NextResponse.json({ error: "No communication groups are configured for this organization." }, { status: 409 });

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("communication_group_members")
      .select("contact_id")
      .eq("contact_id", contactId)
      .eq("membership_status", "active")
      .in("group_id", groupIds)
      .limit(1)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return NextResponse.json({ error: "This contact is not part of the Emanon communication workspace." }, { status: 403 });

    const { data: contact, error: contactError } = await supabaseAdmin
      .from("communication_contacts")
      .select("id,display_name,organization,email")
      .eq("id", contactId)
      .maybeSingle();
    if (contactError) throw contactError;
    if (!contact?.email) return NextResponse.json({ error: "This contact does not have an email address." }, { status: 400 });

    const fromEmail = String(profile.external_sender || "").trim().toLowerCase();
    if (profileCode === "EMANON-001" && fromEmail !== "admin@emanoninstitute.org") {
      return NextResponse.json({ error: "Emanon outbound identity is not configured correctly." }, { status: 409 });
    }

    const fromName = String(profile.display_name || "Emanon Institute").trim();
    const idempotencyKey = `organization:${profileCode}:${contactId}:${randomUUID()}`;
    const result = await sendEpewEmail({
      recipientEmail: contact.email,
      recipientName: contact.display_name || contact.organization || null,
      messageType: "organization_communication",
      subject,
      html: messageHtml(message),
      idempotencyKey,
      from: `${fromName} <${fromEmail}>`,
      replyTo: fromEmail,
      metadata: {
        profileCode,
        entityId: profile.entity_id,
        contactId,
        senderIdentity: fromEmail,
      },
    });

    const createdAt = new Date().toISOString();
    const { error: eventError } = await supabaseAdmin.from("communication_events").insert({
      contact_id: contactId,
      event_type: "email",
      channel: "email",
      direction: "outbound",
      status: result.status || "sent",
      title: subject,
      summary: message,
      message_preview: message.slice(0, 500),
      metadata: {
        profile_code: profileCode,
        entity_id: profile.entity_id,
        from_name: fromName,
        from_email: fromEmail,
        reply_to: fromEmail,
        to_email: contact.email,
        provider: "resend",
        provider_message_id: result.providerMessageId,
        delivery_id: result.deliveryId,
      },
      performed_by: user.id,
      performed_by_type: "organization_user",
      created_at: createdAt,
    });
    if (eventError) throw eventError;

    await supabaseAdmin
      .from("communication_contacts")
      .update({ last_contacted_at: createdAt, updated_at: createdAt, updated_by: user.id })
      .eq("id", contactId);

    return NextResponse.json({
      ok: true,
      status: result.status,
      providerMessageId: result.providerMessageId,
      from: `${fromName} <${fromEmail}>`,
      replyTo: fromEmail,
    });
  } catch (error) {
    console.error("Organization communication send error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send this message." }, { status: 500 });
  }
}
