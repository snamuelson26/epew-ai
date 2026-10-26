import { createHash } from "node:crypto";

type Channel = "sms" | "whatsapp";
type Input = {
  logicalId: string;
  phone: string;
  channel: Channel;
  templateId: string;
  parameters: Record<string, string>;
  sandbox?: boolean;
};
type Options = {
  apiKey: string;
  liveEnabled: boolean;
  smsApproved: boolean;
  // The caller must recheck the recipient's consent and suppression immediately
  // before sending. An SMS grant must never authorize the WhatsApp channel.
  eligible: (phone: string, channel: Channel) => Promise<boolean>;
  fetcher?: typeof fetch;
};

export class SentRequestError extends Error {
  constructor(public code: string, public status?: number, public retryAfterSeconds?: number) {
    super(code);
  }
}

// This transport has no public route and does not enable any scheduled workflow.
// Do not retry automatically: the worker must retain the same logicalId and
// classify an ambiguous acceptance before attempting another request.
export async function sendSentTemplate(input: Input, options: Options) {
  const sandbox = input.sandbox !== false;
  if (!options.apiKey) throw new SentRequestError("sent_credentials_missing");
  if (!sandbox && !options.liveEnabled) throw new SentRequestError("sent_live_sending_disabled");
  if (!/^\+[1-9][0-9]{7,14}$/.test(input.phone) || !["sms", "whatsapp"].includes(input.channel) ||
    !input.logicalId || input.logicalId.length > 512 || !/^[0-9a-f-]{36}$/i.test(input.templateId)) {
    throw new SentRequestError("sent_invalid_request");
  }
  if (!sandbox && input.channel === "sms" && !options.smsApproved) throw new SentRequestError("sent_sms_not_approved");
  const fetcher = options.fetcher || fetch;
  const headers = { "x-api-key": options.apiKey, "Content-Type": "application/json" };
  // A cached approval or a template's name does not establish its actual scope.
  const templateResponse = await fetcher(`https://api.sent.dm/v3/templates/${input.templateId}`, {
    headers, signal: AbortSignal.timeout(10000), cache: "no-store",
  });
  if (!templateResponse.ok) throw new SentRequestError("sent_template_lookup_failed", templateResponse.status);
  const templateResult = await templateResponse.json();
  const template = templateResult.data;
  if (templateResult.success !== true || !template || template.id !== input.templateId ||
    template.customer_id !== "6318afbb-beb3-4007-ae43-dc1af34241ab" ||
    String(template.status).toUpperCase() !== "APPROVED" || template.category !== "UTILITY") {
    throw new SentRequestError("sent_utility_template_not_approved");
  }
  const body = template.definition?.body?.[input.channel] || template.definition?.body?.multiChannel;
  if (!body?.template) throw new SentRequestError("sent_template_channel_missing");
  const variables: Array<{ name?: string }> = body.variables || [];
  const names = variables.map(v => v.name);
  if (names.some(name => !name || !Object.hasOwn(input.parameters, name)) ||
    Object.keys(input.parameters).some(name => !names.includes(name))) {
    throw new SentRequestError("sent_template_parameters_mismatch");
  }
  // Perform this after network lookups, immediately before the mutating request.
  if (!(await options.eligible(input.phone, input.channel))) throw new SentRequestError("sent_consent_missing_or_suppressed");
  const key = "epew_" + createHash("sha256").update(input.logicalId).digest("hex");
  const response = await fetcher("https://api.sent.dm/v3/messages", {
    method: "POST", headers: { ...headers, "Idempotency-Key": key },
    body: JSON.stringify({ to: [input.phone], channel: [input.channel],
      template: { id: input.templateId, parameters: input.parameters }, sandbox }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const retryAfter = Number(response.headers.get("Retry-After"));
    // Provider error messages may contain private data. Return only safe codes.
    throw new SentRequestError("sent_send_rejected", response.status,
      response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined);
  }
  const result = await response.json();
  const recipients = result.data?.recipients;
  if (result.success !== true || !Array.isArray(recipients) || recipients.length !== 1 ||
    recipients[0].to !== input.phone || !/^[0-9a-f-]{36}$/i.test(recipients[0].message_id || "") ||
    (recipients[0].channel && recipients[0].channel !== input.channel)) {
    throw new SentRequestError("sent_acceptance_unconfirmed");
  }
  return { messageId: recipients[0].message_id as string, sandbox, status: "accepted" as const };
}
