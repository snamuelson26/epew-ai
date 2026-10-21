export const categories = ["access", "questionnaire", "documents", "interview", "coach", "financial", "language", "other"] as const;
export const statuses = ["open", "in_progress", "waiting_on_applicant", "resolved"] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateHelpInput(value: unknown): { action: string; values: Record<string, unknown> } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const b = value as Record<string, unknown>;
  const text = (key: string, min: number, max: number) => typeof b[key] === "string" && (b[key] as string).trim().length >= min && (b[key] as string).trim().length <= max;
  if (b.action === "create") {
    if (!Number.isSafeInteger(b.application_id) || Number(b.application_id) <= 0 || typeof b.request_key !== "string" || !uuid.test(b.request_key) ||
      !categories.includes(b.category as typeof categories[number]) || !["en", "ht", "fr", "es"].includes(String(b.locale)) || !text("description", 10, 3000) || !text("help_needed", 5, 1500)) return null;
    return { action: "create", values: { application_id: b.application_id, request_key: b.request_key, category: b.category, locale: b.locale, description: (b.description as string).trim(), help_needed: (b.help_needed as string).trim() } };
  }
  if (!["reply", "update", "reopen"].includes(String(b.action)) || typeof b.case_id !== "string" || !uuid.test(b.case_id) || !text("body", 1, 5000)) return null;
  if (b.action === "update" && !statuses.includes(b.status as typeof statuses[number])) return null;
  return { action: String(b.action), values: { case_id: b.case_id, body: (b.body as string).trim(), ...(b.action === "update" ? { status: b.status } : {}) } };
}
