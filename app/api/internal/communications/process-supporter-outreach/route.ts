import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
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

function normalizeBody(body: string) {
  return body.replace(/your business website/gi, "www.foodfans.org");
}

function emailHtml(body: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;white-space:pre-line">${escapeHtml(
    normalizeBody(body)
  )}</div>`;
}

function normalizeUsPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return value.trim();
}

function getSmsClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from =
    process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() ||
    process.env.TWILIO_PHONE_NUMBER?.trim() ||
    process.env.TWILIO_FROM_NUMBER?.trim() ||
    process.env.EPEW_TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !from) return null;

  return {
    client: twilio(accountSid, authToken),
    from,
    useMessagingService: from.startsWith("MG"),
  };
}

async function processDueMessages() {
  const now = new Date().toISOString();

  const { data: messages, error } = await supabaseAdmin
    .from("epew_entrepreneur_communication_messages")
    .select("id,contact_id,business_code,message_type,subject,body,delivery_status,scheduled_for")
    .eq("delivery_status", "queued")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (error) throw error;

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const message of messages ?? []) {
    const { data: contact, error: contactError } = await supabaseAdmin
      .from("epew_entrepreneur_communication_contacts")
      .select("id,prospect_name,email,phone,weekly_follow_up_enabled,opted_out_at")
      .eq("id", message.contact_id)
      .maybeSingle();

    if (contactError) {
      console.error("Supporter outreach contact lookup failed", message.id, contactError);
      failed += 1;
      continue;
    }

    if (!contact || contact.opted_out_at || !contact.weekly_follow_up_enabled) {
      skipped += 1;
      continue;
    }

    const { data: claimed } = await supabaseAdmin
      .from("epew_entrepreneur_communication_messages")
      .update({ delivery_status: "sending" })
      .eq("id", message.id)
      .eq("delivery_status", "queued")
      .select("id")
      .maybeSingle();

    if (!claimed) continue;

    try {
      let channel: "email" | "sms";

      if (contact.email?.trim()) {
        channel = "email";
        const result = await sendEpewEmail({
          recipientEmail: contact.email.trim(),
          recipientName: contact.prospect_name,
          messageType: `supporter_${message.message_type}`,
          subject: message.subject,
          html: emailHtml(message.body),
          idempotencyKey: `supporter-outreach:${message.id}`,
          metadata: {
            supporterOutreachMessageId: message.id,
            contactId: contact.id,
            businessCode: message.business_code,
          },
        });

        if (!result.ok && result.status !== "sent") {
          throw new Error(`Email delivery returned status ${result.status}.`);
        }
      } else if (contact.phone?.trim()) {
        channel = "sms";
        const sms = getSmsClient();
        if (!sms) {
          throw new Error("Twilio SMS delivery is not configured.");
        }

        const smsBody = `${normalizeBody(message.body)}\n\nReply STOP to opt out.`;
        const to = normalizeUsPhone(contact.phone);
        const payload = sms.useMessagingService
          ? { to, body: smsBody, messagingServiceSid: sms.from }
          : { to, body: smsBody, from: sms.from };

        await sms.client.messages.create(payload);
      } else {
        throw new Error("Contact has no deliverable email address or phone number.");
      }

      const sentAt = new Date().toISOString();
      await supabaseAdmin
        .from("epew_entrepreneur_communication_messages")
        .update({
          delivery_status: "sent",
          delivery_channel: channel,
          sent_at: sentAt,
        })
        .eq("id", message.id);

      await supabaseAdmin
        .from("epew_entrepreneur_communication_contacts")
        .update({ last_contacted_at: sentAt })
        .eq("id", contact.id);

      sent += 1;
    } catch (sendError) {
      console.error("Supporter outreach delivery failed", message.id, sendError);
      await supabaseAdmin
        .from("epew_entrepreneur_communication_messages")
        .update({ delivery_status: "queued" })
        .eq("id", message.id)
        .eq("delivery_status", "sending");
      failed += 1;
    }
  }

  return { processed: (messages ?? []).length, sent, failed, skipped };
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await processDueMessages();
    return NextResponse.json({ success: true, ...result });
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
