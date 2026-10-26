import { createHash } from "node:crypto";
import { smsKeyword } from "@/lib/communications/smsConsentPolicy";

const EPEW_ACCOUNT = "6318afbb-beb3-4007-ae43-dc1af34241ab";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const phone = /^\+[1-9][0-9]{7,14}$/;

export function parseSentEvent(input: unknown, senderNumber: string) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid event");
  const event = input as Record<string, unknown>;
  // Current Sent docs use payload. Accept the older value envelope explicitly,
  // but never let two conflicting envelopes choose different account identities.
  if (event.payload && event.value) throw new Error("Ambiguous envelope");
  const envelope = event.payload ?? event.value;
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) throw new Error("Invalid payload");
  const value = envelope as Record<string, unknown>;
  if (value.account_id !== EPEW_ACCOUNT) throw new Error("Account mismatch");
  const field = String(event.field || "").slice(0, 80);
  const name = String(event.event || "").slice(0, 100);
  const messageId = typeof value.message_id === "string" && uuid.test(value.message_id) ? value.message_id : null;
  const channel = typeof value.channel === "string" ? value.channel.slice(0, 30) : null;
  const inbound = field === "message" && name === "message.received";
  const contact = typeof value.inbound_number === "string" && phone.test(value.inbound_number) ? value.inbound_number : null;
  if (field === "message" && !messageId) throw new Error("Missing message id");
  if (inbound && (!contact || value.outbound_number !== senderNumber || !["sms", "whatsapp"].includes(channel || ""))) throw new Error("Inbound sender mismatch");
  const keyword = inbound && typeof value.text === "string" ? smsKeyword(value.text) : null;
  // Ignore transport formatting; distinct delivery transitions remain separate.
  const identity = inbound ? [value.account_id, messageId, "received"] : messageId || value.template_id ? [value.account_id, field, name, messageId, value.template_id, channel, value.message_status, value.status, value.updated_at] : event;
  const key = createHash("sha256").update(JSON.stringify(identity)).digest("hex");
  return { key, field, name, messageId, channel, payload: { ...event, value }, stopPhone: keyword === "stop" ? contact : null };
}
