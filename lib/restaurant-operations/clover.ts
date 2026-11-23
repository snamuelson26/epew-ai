import { createHash } from "node:crypto";

// Clover credentials stay on the server. This connector never writes to Clover.
const idPattern = /^[A-Z0-9]{13}$/;
type Row = Record<string, unknown>;
export class CloverError extends Error {}
const object = (value: unknown): Row => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CloverError("Incomplete Clover response; review the receipt manually.");
  return value as Row;
};
const elements = (value: unknown): Row[] => {
  const collection = object(value);
  if (!Array.isArray(collection.elements)) throw new CloverError("Incomplete Clover collection; review the receipt manually.");
  return collection.elements.map(object);
};
export function cloverConfiguration(env = process.env) {
  const merchant = env.FFR_CLOVER_MERCHANT_ID || "";
  const token = env.FFR_CLOVER_READ_TOKEN || "";
  const environment = env.FFR_CLOVER_ENVIRONMENT;
  let catalog: Record<string, "meal" | "addon" | "reward"> = {};
  try { catalog = JSON.parse(env.FFR_CLOVER_ITEM_KINDS || "{}"); } catch { throw new CloverError("The approved Clover menu mapping is invalid."); }
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog) || Object.entries(catalog).some(([id, kind]) => !idPattern.test(id) || !["meal", "addon", "reward"].includes(kind))) throw new CloverError("The approved Clover menu mapping is invalid.");
  if (!idPattern.test(merchant) || !token || !["production", "sandbox"].includes(environment || "")) throw new CloverError("Clover connection is awaiting secure server configuration.");
  return { merchant, token, catalog, base: environment === "production" ? "https://api.clover.com" : "https://apisandbox.dev.clover.com" };
}
export function cloverReady() {
  try { const c = cloverConfiguration(); return { configured: true, menuMapped: Object.keys(c.catalog).length > 0 }; }
  catch { return { configured: false, menuMapped: false }; }
}

export async function verifyCloverOrder(orderId: string, member: { email: string; mobile_number: string }, fetcher: typeof fetch = fetch) {
  if (!idPattern.test(orderId)) throw new CloverError("Enter the 13-character Clover order ID.");
  const config = cloverConfiguration();
  const get = async (path: string) => {
    const response = await fetcher(`${config.base}/v3/merchants/${config.merchant}/${path}`, {
      headers: { Authorization: `Bearer ${config.token}`, "User-Agent": "FoodFansEPEWRewards/1.0" },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    });
    // Never return the vendor response body, request headers, or credentials.
    if (!response.ok) throw new CloverError(response.status === 401 || response.status === 403 ? "Clover access needs administrator attention." : "Clover could not verify this receipt.");
    return object(await response.json());
  };
  const collection = async (path: string) => {
    const rows: Row[] = [];
    for (let offset = 0; offset <= 100; offset += 100) {
      const page = elements(await get(`${path}${path.includes("?") ? "&" : "?"}limit=100&offset=${offset}`));
      rows.push(...page);
      if (rows.length > 100) throw new CloverError("Receipt is too large for this import; review it manually.");
      if (page.length < 100) return rows;
    }
    throw new CloverError("Receipt pagination could not be verified.");
  };
  const order = await get(`orders/${orderId}?expand=customers,discounts,refunds`);
  if (order.id !== orderId || order.state !== "locked" || order.paymentState !== "PAID") throw new CloverError("Only a locked, fully paid Clover order can be imported.");
  if (elements(order.discounts).length || elements(order.refunds).length) throw new CloverError("Discounted or refunded orders need manager review; no credits were posted.");
  const customers = elements(order.customers);
  if (customers.length !== 1 || !idPattern.test(String(customers[0].id))) throw new CloverError("Attach exactly one verified customer to the Clover order first.");
  const customer = await get(`customers/${customers[0].id}?expand=emailAddresses,phoneNumbers`);
  if (customer.id !== customers[0].id) throw new CloverError("Clover customer could not be verified.");
  const email = member.email.trim().toLowerCase();
  const phone = (value: unknown) => String(value || "").replace(/\D/g, "").replace(/^(\d{10})$/, "1$1");
  if (!elements(customer.emailAddresses).some(r => String(r.emailAddress).trim().toLowerCase() === email) || !elements(customer.phoneNumbers).some(r => phone(r.phoneNumber) === phone(member.mobile_number))) throw new CloverError("Clover customer email and phone must both match this member. Verify ownership before correcting either account.");
  const payments = await collection(`orders/${orderId}/payments?expand=refunds`);
  if (!payments.length || payments.some(p => p.result !== "SUCCESS" || p.voided === true || p.offline === true || elements(p.refunds).length > 0)) throw new CloverError("Payment, void or refund needs manager review; no credits were posted.");
  const rawLines = await collection(`orders/${orderId}/line_items?expand=discounts`);
  if (!rawLines.length) throw new CloverError("No verified meal lines were found.");
  const lines = rawLines.map(line => {
    const itemId = String(object(line.item).id);
    const kind = config.catalog[itemId];
    const quantity = line.unitQty === undefined ? 1 : Number(line.unitQty) / 1000;
    const price = line.price;
    if (!kind || line.deleted === true || line.refunded === true || elements(line.discounts).length || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || typeof price !== "number" || !Number.isInteger(price) || price < 0 || price > 1000000) throw new CloverError("Unmapped, discounted, refunded or nonstandard meal line; review the receipt manually.");
    return { kind: kind === "addon" ? "addon" : "meal", is_reward: kind === "reward", quantity, unit_price_cents: price };
  });
  const qualifying = lines.reduce((n, line) => n + (line.kind === "meal" && !line.is_reward && line.unit_price_cents > 1500 ? line.quantity : 0), 0);
  // Same Clover receipt uses the same ledger order ID across manager retries.
  const externalOrderId = `clover:${config.merchant}:${orderId}`;
  const digest = createHash("sha256").update(externalOrderId).digest("hex");
  const requestId = `${digest.slice(0,8)}-${digest.slice(8,12)}-4${digest.slice(13,16)}-a${digest.slice(17,20)}-${digest.slice(20,32)}`;
  return { merchantId: config.merchant, orderId, externalOrderId, requestId, lines, qualifying };
}
