import { sendEpewEmail } from "@/lib/email/sendEpewEmail";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const EMANON_PARTNERSHIP_IDENTITY_KEY =
  "emanon_strategic_partnerships_director";
export const EMANON_PARTNERSHIP_FROM =
  "Raella Noslen <partnership@emanoninstitute.org>";
export const EMANON_PARTNERSHIP_REPLY_TO =
  "partnership@emanoninstitute.org";
export const EMANON_PARTNERSHIP_INBOUND =
  "partnership@inbound.emanoninstitute.org";

export type EmanonPartnershipPurpose =
  | "funding"
  | "strategic_collaboration";

type SendPartnershipEmailInput = {
  purpose: EmanonPartnershipPurpose;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  html: string;
  idempotencyKey: string;
  messageType?: string;
  applicationId?: number | null;
  metadata?: Record<string, unknown>;
};

export async function sendEmanonPartnershipEmail(
  input: SendPartnershipEmailInput
) {
  const { data: identity, error } = await supabaseAdmin
    .from("epew_communication_sender_identities")
    .select("id,display_name,email_address,reply_to_address")
    .eq("identity_key", EMANON_PARTNERSHIP_IDENTITY_KEY)
    .eq("is_active", true)
    .single();

  if (error) throw error;

  return sendEpewEmail({
    applicationId: input.applicationId ?? null,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName ?? null,
    messageType: input.messageType ?? "emanon_strategic_partnerships",
    subject: input.subject,
    html: input.html,
    idempotencyKey: input.idempotencyKey,
    from: `${identity.display_name} <${identity.email_address}>`,
    replyTo: identity.reply_to_address,
    senderIdentityId: identity.id,
    metadata: {
      ...input.metadata,
      senderIdentityKey: EMANON_PARTNERSHIP_IDENTITY_KEY,
      roleScope: "funding_and_strategic_collaboration_only",
      purpose: input.purpose,
      approvalRequiredForCommitments: true,
      inboundProcessingAddress: EMANON_PARTNERSHIP_INBOUND,
    },
  });
}
