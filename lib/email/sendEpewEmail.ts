import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EPEW_EMAIL_FROM, resend } from "@/lib/email/resend";

type SendEpewEmailInput = {
  applicationId?: number | null;
  recipientEmail: string;
  recipientName?: string | null;
  messageType: string;
  subject: string;
  html: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  from?: string;
};

export async function sendEpewEmail(input: SendEpewEmailInput) {
  const {
    applicationId = null,
    recipientEmail,
    recipientName = null,
    messageType,
    subject,
    html,
    idempotencyKey,
    metadata = {},
    from = EPEW_EMAIL_FROM,
  } = input;

  if (!resend) {
    throw new Error("EPEW email delivery is not configured.");
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("epew_email_deliveries")
    .select("id,status,provider_message_id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return {
      ok: existing.status === "sent",
      duplicate: true,
      deliveryId: existing.id,
      status: existing.status,
      providerMessageId: existing.provider_message_id,
    };
  }

  const { data: delivery, error: insertError } = await supabaseAdmin
    .from("epew_email_deliveries")
    .insert({
      application_id: applicationId,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      message_type: messageType,
      subject,
      idempotency_key: idempotencyKey,
      status: "pending",
      metadata,
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  try {
    const result = await resend.emails.send({
      from,
      to: recipientEmail,
      subject,
      html,
    });

    if (result.error || !result.data?.id) {
      const message =
        result.error?.message || "Resend did not return a message ID.";

      await supabaseAdmin
        .from("epew_email_deliveries")
        .update({
          status: "failed",
          error_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", delivery.id);

      throw new Error(message);
    }

    await supabaseAdmin
      .from("epew_email_deliveries")
      .update({
        status: "sent",
        provider_message_id: result.data.id,
        sent_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);

    return {
      ok: true,
      duplicate: false,
      deliveryId: delivery.id,
      status: "sent",
      providerMessageId: result.data.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email delivery error.";

    await supabaseAdmin
      .from("epew_email_deliveries")
      .update({
        status: "failed",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);

    throw error;
  }
}
