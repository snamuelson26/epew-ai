const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (v: unknown, max = 4000) => typeof v === "string" && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null;
export function validateRewardsInput(raw: unknown): { action: string; values: Record<string, unknown> } | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.request_id !== "string" || !uuid.test(v.request_id) || !text(v.reason)) return null;
  const values: Record<string, unknown> = { request_id: v.request_id, reason: text(v.reason) };
  if (v.action === "enroll") {
    for (const key of ["full_name", "mobile_number", "email", "zip_code", "preferred_language", "consent_evidence"]) {
      const value = text(v[key], key === "consent_evidence" ? 4000 : 200); if (!value) return null; values[key] = value;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(String(values.mobile_number)) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email)) || !/^\d{5}(-\d{4})?$/.test(String(values.zip_code))) return null;
    for (const key of ["sms_consent", "email_consent", "raffle_opt_in"]) { if (typeof v[key] !== "boolean") return null; values[key] = v[key]; }
  } else {
    if (typeof v.member_id !== "string" || !/^FFRM-[a-f0-9]{32}$/i.test(v.member_id)) return null;
    values.member_id = v.member_id;
    if (v.action === "record_order") {
      if (!text(v.order_id, 200) || !text(v.receipt_reference, 2000) || !["paid", "unpaid", "refunded"].includes(String(v.payment_status)) || !["completed", "canceled"].includes(String(v.order_status)) || !Array.isArray(v.lines) || v.lines.length < 1 || v.lines.length > 100) return null;
      const lines = [];
      for (const item of v.lines) {
        if (!item || typeof item !== "object" || !["meal", "addon"].includes(item.kind) || typeof item.is_reward !== "boolean" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 || !Number.isInteger(item.unit_price_cents) || item.unit_price_cents < 0 || item.unit_price_cents > 1000000) return null;
        lines.push({ kind: item.kind, is_reward: item.is_reward, quantity: item.quantity, unit_price_cents: item.unit_price_cents });
      }
      Object.assign(values, { order_id: text(v.order_id, 200), receipt_reference: text(v.receipt_reference, 2000), payment_status: v.payment_status, order_status: v.order_status, lines });
    } else if (v.action === "refund_order" || v.action === "adjust") {
      if (typeof v.quantity !== "number" || !Number.isInteger(v.quantity) || v.quantity === 0 || Math.abs(v.quantity) > 100 || (v.action === "refund_order" && v.quantity < 1)) return null;
      values.quantity = v.quantity;
      if (v.action === "refund_order") {
        if (!text(v.order_id, 200) || !text(v.receipt_reference, 2000)) return null;
        Object.assign(values, { order_id: text(v.order_id, 200), receipt_reference: text(v.receipt_reference, 2000) });
      }
    } else if (v.action === "redeem") {
      if (typeof v.grant_id !== "string" || !uuid.test(v.grant_id) || !text(v.order_id, 200) || !text(v.receipt_reference, 2000) || !["pickup", "delivery"].includes(String(v.fulfillment_method))) return null;
      for (const key of ["online_requested_at", "fulfillment_at"]) {
        if (typeof v[key] !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/.test(v[key]) || !Number.isFinite(Date.parse(v[key]))) return null;
        values[key] = new Date(v[key]).toISOString();
      }
      Object.assign(values, { grant_id: v.grant_id, order_id: text(v.order_id, 200), receipt_reference: text(v.receipt_reference, 2000), fulfillment_method: v.fulfillment_method });
    } else if (v.action === "update_member") {
      if (!["active", "inactive", "suspended"].includes(String(v.membership_status)) || typeof v.expected_updated_at !== "string" || !Number.isFinite(Date.parse(v.expected_updated_at)) || !text(v.consent_evidence)) return null;
      Object.assign(values, { membership_status: v.membership_status, expected_updated_at: v.expected_updated_at, consent_evidence: text(v.consent_evidence) });
      for (const key of ["full_name", "mobile_number", "email", "zip_code", "preferred_language"]) {
        if (v[key] !== undefined) { const value = text(v[key],200); if (!value) return null; values[key] = value; }
      }
      if (values.mobile_number && !/^\+[1-9]\d{7,14}$/.test(String(values.mobile_number))) return null;
      if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email))) return null;
      if (values.zip_code && !/^\d{5}(-\d{4})?$/.test(String(values.zip_code))) return null;
      for (const key of ["sms_consent", "email_consent", "raffle_opt_in"]) { if (typeof v[key] !== "boolean") return null; values[key] = v[key]; }
      if (v.raffle_eligibility_year) {
        const year = Number(v.raffle_eligibility_year); if (!Number.isInteger(year) || year < 2026 || year > 2100 || !v.raffle_opt_in || !text(v.raffle_eligibility_evidence, 2000)) return null;
        Object.assign(values, { raffle_eligibility_year: year, raffle_eligibility_evidence: text(v.raffle_eligibility_evidence, 2000) });
      } else Object.assign(values, { raffle_eligibility_year: "", raffle_eligibility_evidence: "" });
    } else return null;
  }
  return { action: v.action as string, values };
}
