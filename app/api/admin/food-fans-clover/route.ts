import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { restaurantAdministrator } from "@/lib/restaurant-operations/authorize";
import { CloverError, cloverReady, verifyCloverOrder } from "@/lib/restaurant-operations/clover";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET() {
  if (!await restaurantAdministrator()) return reply({ error: "Authorized manager sign-in required." }, 403);
  return reply({ ...cloverReady(), mode: "manager_verified_import", unit: "FFR-001", automaticRedemption: false });
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Invalid request origin." }, 403);
  try {
    const actor = await restaurantAdministrator();
    if (!actor) return reply({ error: "Authorized manager sign-in required." }, 403);
    const input = await request.json();
    if (!input || !["preview", "import"].includes(input.action) || !/^FFRM-[a-f0-9]{32}$/i.test(input.member_id || "") || !/^[A-Z0-9]{13}$/.test(input.order_id || "")) return reply({ error: "Choose a member and enter a Clover order ID." }, 400);
    if (input.action === "import" && (input.fulfillment_verified !== true || typeof input.reason !== "string" || !input.reason.trim() || input.reason.length > 2000)) return reply({ error: "Confirm completed meal fulfillment and record the verification evidence." }, 400);
    const member = await supabaseAdmin.from("epew_ffr_members").select("member_id,email,mobile_number,membership_status").eq("restaurant_unit_id", "FFR-001").eq("member_id", input.member_id).maybeSingle();
    if (member.error) return reply({ error: "Member service unavailable." }, 503);
    if (!member.data || member.data.membership_status !== "active") return reply({ error: "An active FFR-001 membership is required." }, 400);
    const receipt = await verifyCloverOrder(input.order_id, member.data);
    const prior = await supabaseAdmin.from("epew_ffr_orders").select("order_id").eq("restaurant_unit_id", "FFR-001").in("order_id", [input.order_id, receipt.externalOrderId]).limit(1);
    if (prior.error) return reply({ error: "Receipt history could not be checked." }, 503);
    if (prior.data?.length) return reply({ error: "This Clover receipt is already recorded. Review its existing ledger entry instead of importing again." }, 409);
    if (input.action === "preview") return reply({ verified: true, order_id: receipt.orderId, qualifying_meals: receipt.qualifying, lines: receipt.lines, fulfillmentConfirmationRequired: true });
    // Re-fetch on import; client-supplied prices, quantities, payment states and identities are ignored.
    const saved = await supabaseAdmin.rpc("epew_ffr_rewards_operation", {
      p_actor: actor.id, p_actor_email: actor.email, p_unit: "FFR-001", p_action: "record_order",
      p_input: { request_id: receipt.requestId, reason: `Clover verified paid receipt; manager verified completed fulfillment. ${input.reason.trim()}`, member_id: member.data.member_id,
        order_id: receipt.externalOrderId, receipt_reference: receipt.externalOrderId, payment_status: "paid", order_status: "completed", lines: receipt.lines },
    });
    if (saved.error || saved.data?.saved !== true) return reply({ error: "Import was not confirmed. The receipt may already be recorded or require manager review." }, 409);
    return reply({ saved: true, qualifying_meals: receipt.qualifying, replayed: saved.data.replayed === true });
  } catch (error) {
    return reply({ error: error instanceof CloverError ? error.message : "Clover verification unavailable; no import was confirmed." }, error instanceof CloverError ? 422 : 503);
  }
}
