export const workStatuses = ["planned", "in_progress", "blocked", "ready_for_review", "completed"] as const;
export const entryKinds = ["progress", "evidence", "decision", "correction"] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null;
export function validateWorkInput(value: unknown): { action: string; values: Record<string, unknown> } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.request_id !== "string" || !uuid.test(v.request_id)) return null;
  const reason = text(v.reason, 4000);
  if (!reason) return null;
  const values: Record<string, unknown> = { request_id: v.request_id, reason };
  if (v.action === "create_task") {
    const title = text(v.title, 200), description = text(v.description, 4000), owner = text(v.owner, 200);
    if (!title || !description || !owner) return null;
    Object.assign(values, { title, description, owner });
    if (v.due_at) {
      if (typeof v.due_at !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/.test(v.due_at) || !Number.isFinite(Date.parse(v.due_at))) return null;
      values.due_at = new Date(v.due_at).toISOString();
    }
  } else if (v.action === "update_task" || v.action === "add_entry") {
    if (typeof v.task_id !== "string" || !uuid.test(v.task_id)) return null;
    values.task_id = v.task_id;
    if (v.action === "update_task") {
      if (!workStatuses.includes(v.status as typeof workStatuses[number]) || typeof v.expected_updated_at !== "string" || !Number.isFinite(Date.parse(v.expected_updated_at))) return null;
      Object.assign(values, { status: v.status, expected_updated_at: v.expected_updated_at });
    } else {
      if (!entryKinds.includes(v.kind as typeof entryKinds[number])) return null;
      values.kind = v.kind;
      if (v.kind === "correction") {
        if (typeof v.corrects_entry_id !== "string" || !uuid.test(v.corrects_entry_id)) return null;
        values.corrects_entry_id = v.corrects_entry_id;
      }
      if (v.evidence_url) {
        if (typeof v.evidence_url !== "string" || v.evidence_url.length > 2000) return null;
        try {
          const url = new URL(v.evidence_url);
          if (url.protocol !== "https:" || url.username || url.password) return null;
          values.evidence_url = url.href;
        } catch { return null; }
      }
      if (v.kind === "evidence" && !values.evidence_url) return null;
    }
  } else return null;
  return { action: v.action as string, values };
}
