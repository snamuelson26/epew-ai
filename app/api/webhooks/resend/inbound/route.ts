import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/email/resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const INBOUND_DOMAIN = "inbound.emanoninstitute.org";
const CONTACT_ALIAS = /^contact\+([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

const DELIVERY_STATUS: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "sending",
  "email.bounced": "failed",
  "email.complained": "failed",
  "email.failed": "failed",
  "email.suppressed": "failed",
};

function addressOnly(value: string) {
  const bracketed = value.match(/<([^>]+)>/);
  return (bracketed?.[1] ?? value).trim().toLowerCase();
}

function localPart(value: string) {
  return addressOnly(value).split("@")[0] ?? "";
}

function contactIdFromRecipients(recipients: string[]) {
  for (const recipient of recipients) {
    const address = addressOnly(recipient);
    const [local, domain] = address.split("@");
    if (domain !== INBOUND_DOMAIN) continue;
    const match = local.match(CONTACT_ALIAS);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

function textFromHtml(html: string | null) {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function auditUnmatched(input: {
  providerEmailId: string;
  providerMessageId?: string | null;
  senderEmail: string;
  recipients: string[];
  subject: string;
  reason: string;
  payload: unknown;
  receivedAt?: string | null;
}) {
  const { error } = await supabaseAdmin
    .from("epew_inbound_email_events")
    .upsert(
      {
        provider_email_id: input.providerEmailId,
        provider_message_id: input.providerMessageId ?? null,
        sender_email: input.senderEmail,
        recipient_emails: input.recipients,
        subject: input.subject,
        status: "unmatched",
        reason: input.reason,
        payload: input.payload,
        received_at: input.receivedAt ?? null,
      },
      { onConflict: "provider_email_id", ignoreDuplicates: true }
    );

  if (error) throw error;
}

async function recordDeliveryEvent(input: {
  eventId: string;
  eventType: string;
  providerEmailId: string;
  occurredAt?: string | null;
  payload: unknown;
}) {
  const normalizedStatus = DELIVERY_STATUS[input.eventType];
  if (!normalizedStatus) return;

  const { error: eventError } = await supabaseAdmin
    .from("epew_email_delivery_events")
    .upsert(
      {
        webhook_event_id: input.eventId,
        provider_email_id: input.providerEmailId,
        event_type: input.eventType,
        normalized_status: normalizedStatus,
        payload: input.payload,
        occurred_at: input.occurredAt ?? null,
      },
      { onConflict: "webhook_event_id", ignoreDuplicates: true }
    );

  if (eventError) throw eventError;

  const updatedAt = input.occurredAt || new Date().toISOString();
  const deliveryUpdate: Record<string, unknown> = {
    status: normalizedStatus,
    provider_status: input.eventType,
    delivery_status_updated_at: updatedAt,
    updated_at: new Date().toISOString(),
  };
  if (normalizedStatus === "sent") deliveryUpdate.sent_at = updatedAt;

  const { error: deliveryError } = await supabaseAdmin
    .from("epew_email_deliveries")
    .update(deliveryUpdate)
    .eq("provider_message_id", input.providerEmailId);

  if (deliveryError) throw deliveryError;

  const messageUpdate: Record<string, unknown> = {
    delivery_status: normalizedStatus,
    provider_status: input.eventType,
    delivery_status_updated_at: updatedAt,
  };
  if (normalizedStatus === "sent") messageUpdate.sent_at = updatedAt;

  const { error: messageError } = await supabaseAdmin
    .from("epew_entrepreneur_communication_messages")
    .update(messageUpdate)
    .eq("provider_email_id", input.providerEmailId);

  if (messageError) throw messageError;
}

export async function POST(request: NextRequest) {
  if (!resend) {
    return NextResponse.json({ error: "Resend is not configured." }, { status: 503 });
  }

  const rawPayload = await request.text();
  let event: {
    type?: string;
    created_at?: string;
    data?: {
      email_id?: string;
      created_at?: string;
      received_for?: string[];
      to?: string[];
    };
  };

  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
    if (secret) {
      event = resend.webhooks.verify({
        payload: rawPayload,
        headers: {
          id: request.headers.get("svix-id") ?? "",
          timestamp: request.headers.get("svix-timestamp") ?? "",
          signature: request.headers.get("svix-signature") ?? "",
        },
        webhookSecret: secret,
      }) as unknown as typeof event;
    } else {
      event = JSON.parse(rawPayload);
    }
  } catch {
    return NextResponse.json({ error: "Invalid webhook." }, { status: 400 });
  }

  const eventType = String(event.type ?? "");
  const providerEmailId = String(event.data?.email_id ?? "").trim();

  if (DELIVERY_STATUS[eventType]) {
    if (!providerEmailId) {
      return NextResponse.json({ error: "Missing email ID." }, { status: 400 });
    }

    const eventId =
      request.headers.get("svix-id") ||
      createHash("sha256").update(rawPayload).digest("hex");

    await recordDeliveryEvent({
      eventId,
      eventType,
      providerEmailId,
      occurredAt: event.data?.created_at ?? event.created_at ?? null,
      payload: event,
    });

    return NextResponse.json({ ok: true, statusUpdated: true });
  }

  if (eventType !== "email.received") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!providerEmailId) {
    return NextResponse.json({ error: "Missing inbound email ID." }, { status: 400 });
  }

  // Resend's authenticated API is the source of truth. Never persist body,
  // sender, recipient, or attachment data directly from the webhook payload.
  const received = await resend.emails.receiving.get(providerEmailId, {
    html_format: "cid",
  });

  if (received.error || !received.data) {
    console.error("Unable to retrieve Resend inbound email", providerEmailId, received.error);
    return NextResponse.json({ error: "Inbound email is not available." }, { status: 503 });
  }

  const email = received.data;
  const senderEmail = addressOnly(email.from);
  const recipients = Array.from(
    new Set([...(email.received_for ?? []), ...(email.to ?? [])].map(addressOnly))
  );
  const inboundRecipients = recipients.filter((value) =>
    value.endsWith(`@${INBOUND_DOMAIN}`)
  );

  if (inboundRecipients.length === 0) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  let senderIdentityId: string | null = null;
  const identityLocal = inboundRecipients
    .map(localPart)
    .find((value) => value === "programdirector");

  if (identityLocal) {
    const identityResult = await supabaseAdmin
      .from("epew_communication_sender_identities")
      .select("id")
      .eq("identity_key", "emanon_program_director")
      .eq("is_active", true)
      .maybeSingle();

    if (identityResult.error) throw identityResult.error;
    senderIdentityId = identityResult.data?.id ?? null;
  }

  let contactId = contactIdFromRecipients(inboundRecipients);
  let contact:
    | {
        id: string;
        entrepreneur_user_id: string;
        business_code: string | null;
        email: string | null;
        preferred_language: string;
      }
    | null = null;

  if (contactId) {
    const result = await supabaseAdmin
      .from("epew_entrepreneur_communication_contacts")
      .select("id,entrepreneur_user_id,business_code,email,preferred_language")
      .eq("id", contactId)
      .maybeSingle();

    if (result.error) throw result.error;
    contact = result.data;

    if (contact?.email && addressOnly(contact.email) !== senderEmail) {
      contact = null;
    }
  } else {
    const result = await supabaseAdmin
      .from("epew_entrepreneur_communication_contacts")
      .select("id,entrepreneur_user_id,business_code,email,preferred_language")
      .ilike("email", senderEmail)
      .limit(2);

    if (result.error) throw result.error;
    if (result.data?.length === 1) {
      contact = result.data[0];
      contactId = contact.id;
    }
  }

  if (!contact || !contactId) {
    await auditUnmatched({
      providerEmailId,
      providerMessageId: email.message_id,
      senderEmail,
      recipients: inboundRecipients,
      subject: email.subject || "(no subject)",
      reason: contactId ? "sender_does_not_match_contact" : "contact_not_identified",
      payload: {
        from: email.from,
        to: email.to,
        received_for: email.received_for,
        cc: email.cc,
        attachments: email.attachments,
        sender_identity_id: senderIdentityId,
      },
      receivedAt: email.created_at,
    });

    return NextResponse.json({ ok: true, matched: false }, { status: 202 });
  }

  const body =
    email.text?.trim() ||
    textFromHtml(email.html) ||
    "[HTML email received — open the message details to view it.]";

  const { error: insertError } = await supabaseAdmin
    .from("epew_entrepreneur_communication_messages")
    .insert({
      entrepreneur_user_id: contact.entrepreneur_user_id,
      contact_id: contact.id,
      business_code: contact.business_code,
      message_type: "inbound_reply",
      language: contact.preferred_language || "en",
      subject: email.subject || "(no subject)",
      body,
      html_body: email.html,
      sender_voice: "contact",
      sender_identity_id: senderIdentityId,
      direction: "inbound",
      delivery_channel: "email",
      delivery_status: "received",
      provider_status: "email.received",
      delivery_status_updated_at: email.created_at,
      provider_email_id: providerEmailId,
      provider_message_id: email.message_id,
      sender_email: senderEmail,
      recipient_emails: inboundRecipients,
      attachments: email.attachments,
      received_at: email.created_at,
    });

  if (insertError && insertError.code !== "23505") {
    console.error("Unable to store inbound communication", providerEmailId, insertError);
    return NextResponse.json({ error: "Unable to store inbound communication." }, { status: 500 });
  }

  await supabaseAdmin
    .from("epew_entrepreneur_communication_contacts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", contact.id);

  return NextResponse.json({
    ok: true,
    matched: true,
    duplicate: insertError?.code === "23505",
  });
}
