import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    const { data: supporter, error: supporterError } = await supabaseAdmin
      .from("supporters")
      .select("id,user_id,full_name,email,selected_business_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (supporterError) throw supporterError;
    if (!supporter) {
      return NextResponse.json({ success: false, message: "Supporter profile not found." }, { status: 404 });
    }

    const { data: intents, error: intentError } = await supabaseAdmin
      .from("epew_support_intents")
      .select("id,unit_count,total_amount,status,paid_at,created_at,supporter_selected_entrepreneur_id,referred_entrepreneur_id,supporter_selected_entrepreneur_application_id,referred_entrepreneur_application_id,referred_business_name")
      .eq("supporter_id", supporter.id)
      .order("created_at", { ascending: false });

    if (intentError) throw intentError;

    const entrepreneurIds = Array.from(new Set((intents || []).flatMap((row: any) => [row.supporter_selected_entrepreneur_id, row.referred_entrepreneur_id]).filter(Boolean)));
    const applicationIds = Array.from(new Set((intents || []).flatMap((row: any) => [row.supporter_selected_entrepreneur_application_id, row.referred_entrepreneur_application_id]).filter(Boolean)));

    let businesses: any[] = [];
    if (entrepreneurIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("entrepreneurs")
        .select("id,public_business_id,business_name,full_name,business_logo,entrepreneur_photo,units_required,units_supported,community_units_required,community_units_supported,campaign_status,marketplace_visibility,qualified,source_application_id")
        .in("id", entrepreneurIds);
      if (error) throw error;
      businesses = data || [];
    }

    if (applicationIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("entrepreneurs")
        .select("id,public_business_id,business_name,full_name,business_logo,entrepreneur_photo,units_required,units_supported,community_units_required,community_units_supported,campaign_status,marketplace_visibility,qualified,source_application_id")
        .in("source_application_id", applicationIds);
      if (error) throw error;
      for (const row of data || []) {
        if (!businesses.some((item) => item.id === row.id)) businesses.push(row);
      }
    }

    if (supporter.selected_business_id && !businesses.some((b) => b.public_business_id === supporter.selected_business_id)) {
      const { data } = await supabaseAdmin
        .from("entrepreneurs")
        .select("id,public_business_id,business_name,full_name,business_logo,entrepreneur_photo,units_required,units_supported,community_units_required,community_units_supported,campaign_status,marketplace_visibility,qualified,source_application_id")
        .eq("public_business_id", supporter.selected_business_id)
        .limit(1)
        .maybeSingle();
      if (data) businesses.push(data);
    }

    const paidStatuses = new Set(["paid", "payment_completed", "completed", "active", "allocated"]);
    const grouped = new Map<string, any>();

    for (const intent of intents || []) {
      const business = businesses.find((b) =>
        b.id === intent.supporter_selected_entrepreneur_id ||
        b.id === intent.referred_entrepreneur_id ||
        (intent.supporter_selected_entrepreneur_application_id && b.source_application_id === intent.supporter_selected_entrepreneur_application_id) ||
        (intent.referred_entrepreneur_application_id && b.source_application_id === intent.referred_entrepreneur_application_id)
      );

      const key = business?.id || intent.referred_business_name || supporter.selected_business_id || "unassigned";
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          business,
          businessName: business?.business_name || intent.referred_business_name || "Business selection pending",
          publicBusinessId: business?.public_business_id || supporter.selected_business_id || null,
          entrepreneurName: business?.full_name || null,
          selectedUnits: 0,
          supportedUnits: 0,
          pendingUnits: 0,
          totalAmount: 0,
          intents: 0,
        });
      }

      const item = grouped.get(key);
      const units = Number(intent.unit_count || 0);
      const amount = Number(intent.total_amount || 0);
      const isConfirmed = Boolean(intent.paid_at) || paidStatuses.has(String(intent.status || "").toLowerCase());
      item.selectedUnits += units;
      item.totalAmount += amount;
      item.intents += 1;
      if (isConfirmed) item.supportedUnits += units;
      else if (String(intent.status || "").toLowerCase() === "payment_pending") item.pendingUnits += units;
    }

    if (grouped.size === 0 && supporter.selected_business_id) {
      const business = businesses.find((b) => b.public_business_id === supporter.selected_business_id) || null;
      grouped.set(business?.id || supporter.selected_business_id, {
        id: business?.id || supporter.selected_business_id,
        business,
        businessName: business?.business_name || "Selected business",
        publicBusinessId: business?.public_business_id || supporter.selected_business_id,
        entrepreneurName: business?.full_name || null,
        selectedUnits: 0,
        supportedUnits: 0,
        pendingUnits: 0,
        totalAmount: 0,
        intents: 0,
      });
    }

    return NextResponse.json({
      success: true,
      supporter: { id: supporter.id, fullName: supporter.full_name, email: supporter.email },
      totals: Array.from(grouped.values()).reduce(
        (acc, item) => ({
          selectedUnits: acc.selectedUnits + item.selectedUnits,
          supportedUnits: acc.supportedUnits + item.supportedUnits,
          pendingUnits: acc.pendingUnits + item.pendingUnits,
        }),
        { selectedUnits: 0, supportedUnits: 0, pendingUnits: 0 }
      ),
      businesses: Array.from(grouped.values()),
    });
  } catch (error) {
    console.error("Unable to load supported businesses:", error);
    return NextResponse.json({ success: false, message: "Unable to load your supported businesses." }, { status: 500 });
  }
}
