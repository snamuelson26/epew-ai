import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supportReportingReferences } from "@/lib/enterprise/supporters/reportingReferences";

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
    if ((applicationId && !/^[1-9]\d{0,14}$/.test(applicationId)) || !/^[1-9]\d{0,5}$/.test(pageValue)) {
      return json({ error: "Select a valid business from your dashboard." }, 400);
    }
    const { data: applications, error: applicationError } = await supabaseAdmin
      .from("entrepreneur_applications").select("id,business_name")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1000);
    if (applicationError) throw applicationError;
    const accounts = (applications || []).map(row => ({ id: String(row.id), name: row.business_name || "My business" }));
    if (!applicationId) return json({ selectionRequired: true, accounts });
    const application = (applications || []).find(row => String(row.id) === applicationId);
    if (!application) return json({ error: "This business link does not match your signed-in account. Choose one of your businesses below.", accounts }, 404);
    const { data: business, error: businessError } = await supabaseAdmin
      .from("entrepreneurs").select("id,business_name,public_business_id")
      .eq("source_application_id", application.id).maybeSingle();
    if (businessError) throw businessError;
    const page = Number(pageValue), pageSize = 50;
    if (!business) return json({ accounts, applicationId: String(application.id), business: { name: application.business_name, code: null }, transactions: [], reportedReceipts: [], pendingRequests: [], pendingHasMore: false, count: 0, page, pageSize });
    const { data: payments, error: paymentError, count } = await supabaseAdmin
      .from("supporter_transactions")
      .select("id,supporter_id,amount,units,frequency,status,created_at", { count: "exact" })
      .eq("entrepreneur_id", business.id)
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (paymentError) throw paymentError;
    // Pending support requests are not payment transactions or received funds.
    // Use selected-business ownership, never a referral alone, for attribution.
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("epew_support_intents")
      .select("id,supporter_id,total_amount,unit_count,payment_frequency,status,created_at")
      .or(`supporter_selected_entrepreneur_id.eq.${business.id},supporter_selected_entrepreneur_application_id.eq.${application.id}`)
      .eq("status", "payment_pending").is("paid_at", null).is("cancelled_at", null)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(51);
    if (pendingError) throw pendingError;
    const pendingIds = (pending || []).map(row => row.id);
    const { data: confirmed, error: confirmedError } = pendingIds.length
      ? await supabaseAdmin.from("supporter_transactions").select("support_intent_id")
        .in("support_intent_id", pendingIds).eq("status", "paid")
      : { data: [], error: null };
    if (confirmedError) throw confirmedError;
    const paidIntents = new Set((confirmed || []).map(row => row.support_intent_id));
    const pendingRequests = (pending || []).filter(row => !paidIntents.has(row.id)).slice(0, 50);
    const reportedReceipts: { id: string; supporter_id: string | null; amount: number | string | null; units: number | null; frequency: string | null; status: string | null; created_at: string | null; sourceBusiness: string; reportedOn: string }[] = [];
    for (const reference of supportReportingReferences.filter(item => item.reportingBusiness === business.public_business_id)) {
      const { data: source, error: sourceError } = await supabaseAdmin.from("entrepreneurs")
        .select("id").eq("public_business_id", reference.sourceBusiness)
        .in("source_application_id", (applications || []).map(row => row.id)).maybeSingle();
      if (sourceError) throw sourceError;
      if (!source) continue;
      const { data: receipt, error: receiptError } = await supabaseAdmin.from("supporter_transactions")
        .select("id,supporter_id,amount,units,frequency,status,created_at")
        .eq("id", reference.transactionId).eq("entrepreneur_id", source.id)
        .eq("amount", reference.expectedAmount).eq("units", reference.expectedUnits)
        .eq("status", "paid").maybeSingle();
      if (receiptError) throw receiptError;
      if (receipt) reportedReceipts.push({ ...receipt, sourceBusiness: reference.sourceBusiness, reportedOn: reference.reportedOn });
    }
    const ids = [...new Set([...(payments || []), ...pendingRequests, ...reportedReceipts].map(row => row.supporter_id).filter(Boolean))];
    const { data: supporters, error: supporterError } = ids.length
      ? await supabaseAdmin.from("supporters").select("id,full_name").in("id", ids)
      : { data: [], error: null };
    if (supporterError) throw supporterError;
    const names = new Map((supporters || []).map(row => [row.id, row.full_name]));
    return json({
      accounts, applicationId: String(application.id),
      business: { name: business.business_name || application.business_name, code: business.public_business_id },
      reportedReceipts: reportedReceipts.map(row => ({
        id: row.id, supporter: names.get(row.supporter_id) || "Supporter name unavailable",
        amount: row.amount, units: row.units, frequency: row.frequency, status: row.status,
        recordedAt: row.created_at, sourceBusiness: row.sourceBusiness, reportedOn: row.reportedOn,
      })),
      pendingHasMore: (pending || []).length > 50,
      pendingRequests: pendingRequests.map(row => ({
        id: row.id, supporter: names.get(row.supporter_id) || "Supporter name unavailable",
        amount: row.total_amount, units: row.unit_count, frequency: row.payment_frequency,
        status: "in_progress", sourceStatus: row.status, recordedAt: row.created_at,
      })),
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
