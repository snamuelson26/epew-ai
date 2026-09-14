import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  emanon_send_message,
  resolveExistingDirectConversation,
  scheduledEmanonIdentity,
} from "@/lib/emanon/directMessaging";

const EASTERN_TIME_ZONE = "America/New_York";

function easternParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    weekday: value("weekday"),
    dateLabel: `${value("weekday")}, ${value("month")} ${value("day")}, ${value("year")}`,
    dateKey: new Intl.DateTimeFormat("en-CA", {
      timeZone: EASTERN_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now),
  };
}

function checkInBody(isFriday: boolean) {
  const requestedItems = [
    "new research completed or underway",
    "communications sent",
    "communications received",
    "important opportunities or responses",
    "required follow-ups, including deadlines",
  ];

  if (isFriday) {
    requestedItems.push("your weekly plan for the following week");
  }

  return [
    "Hello Raella,",
    "",
    "Please send your Emanon check-in report in this direct conversation. Include:",
    ...requestedItems.map((item) => `- ${item}`),
    "",
    "Please attach any relevant proposals or supporting documents and identify anything that requires the Program Director's decision.",
    "",
    "Thank you,",
    "Aryal Edusp",
    "Program Director",
  ].join("\n");
}

export async function runScheduledRaellaCheckIn(now = new Date()) {
  const { weekday, dateLabel, dateKey } = easternParts(now);
  if (!["Monday", "Wednesday", "Friday"].includes(weekday)) {
    return { sent: false, skipped: true, reason: "not_a_check_in_day" } as const;
  }

  const context = await resolveExistingDirectConversation(
    supabaseAdmin,
    scheduledEmanonIdentity.senderEmail,
    scheduledEmanonIdentity.recipientEmail,
  );

  if (
    context.sender.role_code !== "program_director" ||
    !context.sender.permissions?.send_messages ||
    !context.sender.permissions?.issue_follow_ups
  ) {
    throw new Error("Aryal's scheduled Emanon capability is not authorized.");
  }

  if (context.recipient.role_code !== "strategic_partnerships_director") {
    throw new Error("The scheduled recipient is not the partnerships director.");
  }

  const subject = `Emanon Partnership Check-In — ${dateLabel}`;
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("emanon_messages")
    .select("id,created_at")
    .eq("conversation_id", context.conversation.id)
    .eq("sender_member_id", context.sender.id)
    .eq("subject", subject)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    return {
      sent: false,
      skipped: true,
      reason: "already_sent_for_eastern_date",
      dateKey,
      conversationId: context.conversation.id,
      messageId: existing.id,
    } as const;
  }

  const result = await emanon_send_message({
    supabase: supabaseAdmin,
    senderEmail: scheduledEmanonIdentity.senderEmail,
    recipientEmail: scheduledEmanonIdentity.recipientEmail,
    messageType: "follow_up",
    subject,
    body: checkInBody(weekday === "Friday"),
  });

  const deliveredAt = result.message.created_at;
  const { error: receiptError } = await supabaseAdmin
    .from("emanon_message_receipts")
    .upsert(
      {
        message_id: result.message.id,
        member_id: result.recipient.id,
        delivered_at: deliveredAt,
      },
      { onConflict: "message_id,member_id" },
    );
  if (receiptError) throw receiptError;

  const { error: conversationUpdateError } = await supabaseAdmin
    .from("emanon_conversations")
    .update({ updated_at: deliveredAt })
    .eq("id", result.conversation.id);
  if (conversationUpdateError) throw conversationUpdateError;

  return {
    sent: true,
    skipped: false,
    dateKey,
    weekday,
    conversationId: result.conversation.id,
    messageId: result.message.id,
    sender: {
      displayName: result.sender.display_name,
      title: result.sender.title,
      email: result.sender.email,
    },
    recipient: {
      displayName: result.recipient.display_name,
      title: result.recipient.title,
      email: result.recipient.email,
    },
    deliveredAt,
  } as const;
}
