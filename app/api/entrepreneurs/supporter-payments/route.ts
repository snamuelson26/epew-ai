import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
export async function GET(request: Request) {
  try {
    const auth = await createClient();
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) return json({ error: "Please sign in to your entrepreneur account." }, 401);
    const params = new URL(request.url).searchParams;
    const applicationId = params.get("applicationId");
    const pageValue = params.get("page") || "1";
    if (!applicationId || !/^\d+$/.test(applicationId) || !/^[1-9]\d{0,5}$/.test(pageValue)) {
      return json({ error: "Select a valid business from your dashboard." }, 400);
    }
    const { data: application, error: applicationError } = await supabaseAdmin
      .from("entrepreneur_applications").select("id,business_name")
      .eq("id", applicationId).eq("user_id", user.id).maybeSingle();
    if (applicationError) throw applicationError;
    if (!application) return json({ error: "Business not found in your account." }, 404);
    const { data: business, error: businessError } = await supabaseAdmin
      .from("entrepreneurs").select("id,business_name,public_business_id")
      .eq("source_application_id", application.id).maybeSingle();
    if (businessError) throw businessError;
    const page = Number(pageValue), pageSize = 50;
    if (!business) return json({ business: { name: application.business_name, code: null }, transactions: [], count: 0, page, pageSize });
    const { data: payments, error: paymentError, count } = await supabaseAdmin
      .from("supporter_transactions")
      .select("id,supporter_id,amount,units,frequency,status,created_at", { count: "exact" })
      .eq("entrepreneur_id", business.id)
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (paymentError) throw paymentError;
    const ids = [...new Set((payments || []).map(row => row.supporter_id).filter(Boolean))];
    const { data: supporters, error: supporterError } = ids.length
      ? await supabaseAdmin.from("supporters").select("id,full_name").in("id", ids)
      : { data: [], error: null };
    if (supporterError) throw supporterError;
    const names = new Map((supporters || []).map(row => [row.id, row.full_name]));
    return json({
      business: { name: business.business_name || application.business_name, code: business.public_business_id },
      transactions: (payments || []).map(row => ({
        id: row.id, supporter: names.get(row.supporter_id) || "Supporter name unavailable",
        amount: row.amount, units: row.units, frequency: row.frequency,
        status: row.status, recordedAt: row.created_at,
      })), count: count ?? 0, page, pageSize,
    });
  } catch {
    return json({ error: "Unable to load payment records. Please try again." }, 503);
  }
}
