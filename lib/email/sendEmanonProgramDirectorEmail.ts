import { sendEpewEmail } from "@/lib/email/sendEpewEmail";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const EMANON_PROGRAM_DIRECTOR_IDENTITY_KEY =
  "emanon_program_director";
export const EMANON_PROGRAM_DIRECTOR_FROM =
  "Aryal Edusp <programdirector@emanoninstitute.org>";
export const EMANON_PROGRAM_DIRECTOR_REPLY_TO =
  "programdirector@emanoninstitute.org";
export const EMANON_PROGRAM_DIRECTOR_INBOUND =
  "programdirector@inbound.emanoninstitute.org";

type SendProgramDirectorEmailInput = {
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  html: string;
  idempotencyKey: string;
  messageType?: string;
  applicationId?: number | null;
  metadata?: Record<string, unknown>;
};

export async function sendEmanonProgramDirectorEmail(
  input: SendProgramDirectorEmailInput
) {
  const { data: identity, error } = await supabaseAdmin
    .from("epew_communication_sender_identities")
    .select("id,display_name,email_address,reply_to_address")
    .eq("identity_key", EMANON_PROGRAM_DIRECTOR_IDENTITY_KEY)
    .eq("is_active", true)
    .single();

  if (error) throw error;

  return sendEpewEmail({
    applicationId: input.applicationId ?? null,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName ?? null,
    messageType: input.messageType ?? "emanon_program_director",
    subject: input.subject,
    html: input.html,
    idempotencyKey: input.idempotencyKey,
    from: `${identity.display_name} <${identity.email_address}>`,
    replyTo: identity.reply_to_address,
    senderIdentityId: identity.id,
    metadata: {
      ...input.metadata,
      senderIdentityKey: EMANON_PROGRAM_DIRECTOR_IDENTITY_KEY,
      inboundProcessingAddress: EMANON_PROGRAM_DIRECTOR_INBOUND,
    },
  });
}
