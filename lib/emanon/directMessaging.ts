import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const EMANON_PROGRAM_DIRECTOR_EMAIL = "programdirector@emanoninstitute.org";
const EMANON_PARTNERSHIPS_DIRECTOR_EMAIL = "partnership@emanoninstitute.org";

const allowedMessageTypes = [
  "message",
  "report",
  "assignment",
  "follow_up",
  "proposal",
] as const;

export type EmanonMessageType = (typeof allowedMessageTypes)[number];

type StaffMember = {
  id: string;
  organization_id: string;
  email: string;
  display_name: string;
  title: string;
  role_code: string;
  permissions: Record<string, boolean> | null;
  status: string;
};

type DirectConversation = {
  id: string;
  organization_id: string;
  conversation_type: string;
  title: string;
};

type SendDirectMessageInput = {
  supabase: SupabaseClient;
  senderEmail: string;
  recipientEmail: string;
  messageType: EmanonMessageType;
  subject?: string | null;
  body: string;
  assignmentDueAt?: string | null;
  followUpAt?: string | null;
  attachments?: Array<Record<string, unknown>>;
};

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function requireIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new Error("Date must be a valid ISO-8601 date/time.");
  }
  return date.toISOString();
}

async function loadActiveMember(supabase: SupabaseClient, email: string) {
  const { data, error } = await supabase
    .from("emanon_staff_members")
    .select(
      "id,organization_id,email,display_name,title,role_code,permissions,status",
    )
    .eq("email", normalizedEmail(email))
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(`No active Emanon member exists for ${email}.`);
  return data as StaffMember;
}

export async function resolveExistingDirectConversation(
  supabase: SupabaseClient,
  senderEmail: string,
  recipientEmail: string,
) {
  const [sender, recipient] = await Promise.all([
    loadActiveMember(supabase, senderEmail),
    loadActiveMember(supabase, recipientEmail),
  ]);

  if (sender.organization_id !== recipient.organization_id) {
    throw new Error("The sender and recipient are not in the same Emanon profile.");
  }

  const { data: senderLinks, error: senderLinksError } = await supabase
    .from("emanon_conversation_members")
    .select("conversation_id")
    .eq("member_id", sender.id);
  if (senderLinksError) throw senderLinksError;

  const candidateIds = (senderLinks ?? []).map((link) => link.conversation_id);
  if (!candidateIds.length) {
    throw new Error("The sender has no Emanon direct conversation.");
  }

  const { data: recipientLinks, error: recipientLinksError } = await supabase
    .from("emanon_conversation_members")
    .select("conversation_id")
    .eq("member_id", recipient.id)
    .in("conversation_id", candidateIds);
  if (recipientLinksError) throw recipientLinksError;

  const sharedIds = (recipientLinks ?? []).map((link) => link.conversation_id);
  if (!sharedIds.length) {
    throw new Error("No existing direct conversation exists for these members.");
  }

  const { data: conversations, error: conversationError } = await supabase
    .from("emanon_conversations")
    .select("id,organization_id,conversation_type,title")
    .in("id", sharedIds)
    .eq("organization_id", sender.organization_id)
    .eq("conversation_type", "direct");
  if (conversationError) throw conversationError;

  if ((conversations ?? []).length !== 1) {
    throw new Error(
      "Expected exactly one existing direct conversation for these members.",
    );
  }

  return {
    sender,
    recipient,
    conversation: conversations![0] as DirectConversation,
  };
}

export async function emanonSendMessage(input: SendDirectMessageInput) {
  if (!allowedMessageTypes.includes(input.messageType)) {
    throw new Error("Unsupported Emanon message type.");
  }

  const body = input.body.trim();
  if (!body) throw new Error("Message body is required.");

  const context = await resolveExistingDirectConversation(
    input.supabase,
    input.senderEmail,
    input.recipientEmail,
  );

  if (!context.sender.permissions?.send_messages) {
    throw new Error("The sender does not have permission to send Emanon messages.");
  }

  if (
    (input.messageType === "assignment" || input.messageType === "follow_up") &&
    context.sender.role_code !== "program_director"
  ) {
    throw new Error("Only the Program Director may issue assignments or follow-ups.");
  }

  const { data, error } = await input.supabase
    .from("emanon_messages")
    .insert({
      organization_id: context.sender.organization_id,
      conversation_id: context.conversation.id,
      sender_member_id: context.sender.id,
      message_type: input.messageType,
      subject: input.subject?.trim() || null,
      body,
      assignment_due_at:
        input.messageType === "assignment"
          ? requireIsoDate(input.assignmentDueAt)
          : null,
      follow_up_at: requireIsoDate(input.followUpAt),
      attachments: input.attachments ?? [],
    })
    .select("id,conversation_id,created_at")
    .single();

  if (error) throw error;

  return { ...context, message: data };
}

// The scheduled worker and the MCP tool intentionally share this capability.
export const emanon_send_message = emanonSendMessage;

export const scheduledEmanonIdentity = {
  senderEmail: EMANON_PROGRAM_DIRECTOR_EMAIL,
  recipientEmail: EMANON_PARTNERSHIPS_DIRECTOR_EMAIL,
} as const;
