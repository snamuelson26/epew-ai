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

function emailHtml(body: string, openTrackingToken?: string | null) {
  const content = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;white-space:pre-line">${escapeHtml(
    normalizeBody(body)
  )}</div>`;

  if (!openTrackingToken) return content;

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.EPEW_PUBLIC_BASE_URL || "https://www.epew.us").replace(/\/$/, "");
  const trackingUrl = `${baseUrl}/api/entrepreneurs/campaign/email-open/${encodeURIComponent(openTrackingToken)}`;

  return `${content}<img src="${trackingUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;opacity:0;overflow:hidden" />`;
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

export async function processDueMessages(
  filters: { businessCode?: string; messageId?: string; entrepreneurUserId?: string } = {},
  client = supabaseAdmin,
  sendEmail = sendEpewEmail,
) {
  const now = new Date().toISOString();

  let query = client
    .from("epew_entrepreneur_communication_messages")
    .select("id,contact_id,entrepreneur_user_id,business_code,message_type,subject,body,delivery_status,scheduled_for,open_tracking_token")
    .eq("delivery_status", "queued")
    .lte("scheduled_for", now);

  if (filters.businessCode) query = query.eq("business_code", filters.businessCode);
  if (filters.messageId) query = query.eq("id", filters.messageId);
  if (filters.entrepreneurUserId) query = query.eq("entrepreneur_user_id", filters.entrepreneurUserId);

  const { data: messages, error } = await query
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (error) throw error;

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const message of messages ?? []) {
    const { data: contact, error: contactError } = await client
      .from("epew_entrepreneur_communication_contacts")
      .select("id,prospect_name,email,phone,preferred_language,weekly_follow_up_enabled,opted_out_at")
      .eq("id", message.contact_id)
      .eq("entrepreneur_user_id", message.entrepreneur_user_id)
      .eq("business_code", message.business_code)
      .maybeSingle();

    if (contactError) {
      console.error("Supporter outreach contact lookup failed", message.id, contactError);
      failed += 1;
      continue;
    }

    if (!contact || contact.opted_out_at || (message.message_type !== "introduction" && !contact.weekly_follow_up_enabled)) {
      skipped += 1;
      continue;
    }

    const { data: claimed } = await client
      .from("epew_entrepreneur_communication_messages")
      .update({ delivery_status: "sending" })
      .eq("id", message.id)
      .eq("delivery_status", "queued")
      .select("id")
      .maybeSingle();

    if (!claimed) continue;

    try {
      let channel: "email" | "sms" | "whatsapp";
      let providerMessageId: string | null = null;

      if (contact.email?.trim()) {
        channel = "email";
        const result = await sendEmail({
          recipientEmail: contact.email.trim(),
          recipientName: contact.prospect_name,
          messageType: `supporter_${message.message_type}`,
          subject: message.subject,
          html: emailHtml(message.body, message.open_tracking_token),
          idempotencyKey: `supporter-outreach:${message.id}`,
          retryFailed: true,
          metadata: {
            supporterOutreachMessageId: message.id,
            contactId: contact.id,
            businessCode: message.business_code,
            preferredLanguage: contact.preferred_language,
          },
          replyTo: `contact+${contact.id}@inbound.emanoninstitute.org`,
        });

        providerMessageId = result.providerMessageId || null;
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
      await client
        .from("epew_entrepreneur_communication_messages")
        .update({
          delivery_status: "sent",
          delivery_channel: channel,
          sent_at: sentAt,
          ...(providerMessageId ? { provider_email_id: providerMessageId, provider_message_id: providerMessageId } : {}),
        })
        .eq("id", message.id);

      await client
        .from("epew_entrepreneur_communication_contacts")
        .update({ last_contacted_at: sentAt })
        .eq("id", contact.id);

      sent += 1;
    } catch (sendError) {
      console.error("Supporter outreach delivery failed", message.id, sendError);
      await client
        .from("epew_entrepreneur_communication_messages")
        .update({ delivery_status: "queued" })
        .eq("id", message.id)
        .eq("delivery_status", "sending");
      failed += 1;
    }
  }

  return { processed: (messages ?? []).length, sent, failed, skipped };
}

