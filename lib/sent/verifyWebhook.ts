import { createHmac, timingSafeEqual } from "node:crypto";

// Sent signs raw bytes, not parsed/re-serialized JSON. The id is an endpoint id.
export function verifySentWebhook(body: Uint8Array, headers: Headers, secret: string, endpointId: string, now = Date.now()) {
  const id = headers.get("x-webhook-id");
  const timestamp = headers.get("x-webhook-timestamp") || "";
  const signature = headers.get("x-webhook-signature") || "";
  if (!endpointId || id !== endpointId || !/^\d{10}$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const encoded = secret.replace(/^whsec_/, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return false;
  const key = Buffer.from(encoded, "base64");
  if (key.length < 16) return false;
  const expected = `v1,${createHmac("sha256", key).update(`${id}.${timestamp}.`).update(body).digest("base64")}`;
  const actual = Buffer.from(signature);
  const comparison = Buffer.from(expected);
  return actual.length === comparison.length && timingSafeEqual(actual, comparison);
}
