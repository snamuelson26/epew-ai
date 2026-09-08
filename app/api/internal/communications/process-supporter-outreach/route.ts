import { createHash } from "crypto";
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

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

function getSmsConfig() {
  const from =
    process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() ||
    process.env.TWILIO_PHONE_NUMBER?.trim() ||
    process.env.TWILIO_FROM_NUMBER?.trim() ||
    process.env.EPEW_TWILIO_PHONE_NUMBER?.trim();

  if (!from) return null;

  return {
    from,
    useMessagingService: from.startsWith("MG"),
  };
}

function getWhatsAppFrom() {
  const raw =
    process.env.TWILIO_WHATSAPP_FROM_NUMBER?.trim() ||
    process.env.EPEW_TWILIO_WHATSAPP_NUMBER?.trim();

  if (!raw) return null;
  return raw.startsWith("whatsapp:") ? raw : `whatsapp:${normalizeUsPhone(raw)}`;
}

function easternTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? -1),
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? -1),
  };
}

function isSupporterOutreachWindow() {
  const { hour, minute } = easternTimeParts();
  return hour === 9 && minute >= 25 && minute <= 40;
}

async function sendSms(to: string, body: string) {
  const client = getTwilioClient();
  const sms = getSmsConfig();
  if (!client || !sms) {
    throw new Error("Twilio SMS delivery is not configured.");
  }

  if (sms.useMessagingService) {
    await client.messages.create({
      to,
      body,
      messagingServiceSid: sms.from,
    });
  } else {
    await client.messages.create({
      to,
      body,
      from: sms.from,
    });
  }
}

async function tryWhatsApp(to: string, body: string) {
  const client = getTwilioClient();
  const from = getWhatsAppFrom();
  if (!client || !from) return false;

  try {
    await client.messages.create({
      to: `whatsapp:${to}`,
      body,
      from,
    });
    return true;
  } catch (error) {
    console.warn("WhatsApp supporter outreach unavailable; falling back to SMS", error);
    return false;
  }
}

async function processDueMessages(businessCode?: string) {
  const now = new Date().toISOString();

  let query = supabaseAdmin
    .from("epew_entrepreneur_communication_messages")
    .select("id,contact_id,business_code,message_type,subject,body,delivery_status,scheduled_for")
    .eq("delivery_status", "queued")
    .lte("scheduled_for", now);

  if (businessCode) {
    query = query.eq("business_code", businessCode);
  }

  const { data: messages, error } = await query
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (error) throw error;

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const message of messages ?? []) {
    const { data: contact, error: contactError } = await supabaseAdmin
      .from("epew_entrepreneur_communication_contacts")
      .select("id,prospect_name,email,phone,preferred_language,weekly_follow_up_enabled,opted_out_at")
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
      let channel: "email" | "sms" | "whatsapp";

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
            preferredLanguage: contact.preferred_language,
          },
        });

        if (!result.ok && result.status !== "sent") {
          throw new Error(`Email delivery returned status ${result.status}.`);
        }
      } else if (contact.phone?.trim()) {
        const to = normalizeUsPhone(contact.phone);
        const phoneBody = `${normalizeBody(message.body)}\n\nReply STOP to opt out.`;

        const whatsappSent = await tryWhatsApp(to, phoneBody);
        if (whatsappSent) {
          channel = "whatsapp";
        } else {
          await sendSms(to, phoneBody);
          channel = "sms";
        }
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

  if (cronAuthorized && !isSupporterOutreachWindow()) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "outside_0930_eastern_window",
    });
  }

  try {
    const result = await processDueMessages(recoveryBusinessCode ?? undefined);
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
