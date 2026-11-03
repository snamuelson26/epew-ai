export type DocumentChannel = "sms" | "whatsapp";
export type DocumentNotification = {
  transactionId: string;
  supporterId: string;
  payment: "pending" | "failed" | "received" | "refunded" | "disputed";
  // Must come from authoritative provider reconciliation, never a browser redirect.
  paymentVerified: boolean;
  documents: { letterPublished: boolean; certificatePublished: boolean };
  phone: string;
  permissions: Record<DocumentChannel, boolean>;
  optedOut: boolean;
  language: "en" | "ht";
};

export function notificationPlan(record: DocumentNotification) {
  if (record.payment !== "received" || !record.paymentVerified ||
      !record.documents.letterPublished || !record.documents.certificatePublished ||
      record.optedOut || !/^\+[1-9]\d{7,14}$/.test(record.phone)) return [];
  const body = record.language === "ht"
    ? "EPEW: Mèsi pou sipò ou. Lèt remèsiman ak sètifika patisipasyon ou disponib. Konekte epi ouvri Communications pou wè, telechaje ak enprime yo: https://www.epew.us/supporters/login Reponn STOP pou sispann mesaj yo."
    : "EPEW: Thank you for your support. Your acknowledgment letter and participation certificate are available. Sign in and open Communications to view, download and print: https://www.epew.us/supporters/login Reply STOP to opt out.";
  return (["sms", "whatsapp"] as const).filter(channel => record.permissions[channel]).map(channel => ({
    channel, to: record.phone, body,
    key: `support-documents:${record.transactionId}:${channel}:v1`,
  }));
}

export interface NotificationDependencies {
  load(transactionId: string): Promise<DocumentNotification>;
  // Persistent atomic insert/CAS with UNIQUE(transactionId,channel,purpose).
  // Never reclaim accepted or unknown deliveries automatically.
  claim(key: string): Promise<boolean>;
  ready(channel: DocumentChannel): Promise<boolean>;
  // SMS text / approved WhatsApp utility-template adapter; return provider ID.
  send(message: ReturnType<typeof notificationPlan>[number]): Promise<string>;
  record(key: string, state: "accepted" | "unknown" | "cancelled", providerId?: string): Promise<void>;
}

export async function dispatchDocumentNotification(transactionId: string, deps: NotificationDependencies) {
  const plan = notificationPlan(await deps.load(transactionId));
  const results: { channel: DocumentChannel; status: string }[] = [];
  for (const message of plan) {
    if (!await deps.ready(message.channel)) {
      results.push({ channel: message.channel, status: "channel_unavailable" }); continue;
    }
    if (!await deps.claim(message.key)) {
      results.push({ channel: message.channel, status: "duplicate_blocked" }); continue;
    }
    // Recheck payment, publication and permission after claiming to catch changes.
    const current = notificationPlan(await deps.load(transactionId)).find(m => m.key === message.key);
    if (!current || current.to !== message.to || current.body !== message.body) {
      await deps.record(message.key, "cancelled");
      results.push({ channel: message.channel, status: "cancelled" }); continue;
    }
    try {
      const providerId = await deps.send(current);
      await deps.record(message.key, "accepted", providerId);
      results.push({ channel: message.channel, status: "accepted" });
    } catch {
      // A timeout may occur after provider acceptance: do not blindly retry.
      await deps.record(message.key, "unknown");
      results.push({ channel: message.channel, status: "unknown" });
    }
  }
  return results;
}
