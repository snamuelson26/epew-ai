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
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // Confirm the signed-in user owns the Supporter profile.
    // =====================================================

    const {
      data: supporter,
      error: supporterError,
    } = await supabaseAdmin
      .from("supporters")
      .select("id,user_id,full_name,email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (supporterError) {
      throw supporterError;
    }

    if (!supporter) {
      return NextResponse.json(
        {
          success: false,
          message: "Supporter profile not found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // Load active EPEW selection cases.
    // These represent paid support awaiting/completing selection.
    // =====================================================

    const {
      data: selectionCases,
      error: selectionError,
    } = await supabaseAdmin
      .from("epew_support_selection_cases")
      .select(
        "id,support_intent_id,supporter_id,requested_units,remaining_units,status,paid_at,selection_due_at,selection_started_at,selection_completed_at,selected_entrepreneur_id,selected_business_name,selection_reason,created_at"
      )
      .eq("supporter_id", supporter.id)
      .neq("status", "cancelled")
      .order("created_at", {
        ascending: false,
      });

    if (selectionError) {
      throw selectionError;
    }

    // =====================================================
    // Load completed/current annual allocations.
    // =====================================================

    const {
      data: allocations,
      error: allocationError,
    } = await supabaseAdmin
      .from("epew_support_allocations")
      .select(
        "id,support_intent_id,selection_case_id,supporter_id,entrepreneur_id,business_name,units,unit_price,allocated_amount,support_term_months,participation_benefit_rate,selection_method,referral_preference_applied,status,allocated_at,created_at"
      )
      .eq("supporter_id", supporter.id)
      .neq("status", "cancelled")
      .order("allocated_at", {
        ascending: false,
      });

    if (allocationError) {
      throw allocationError;
    }

    // =====================================================
    // Load entrepreneur/business information for allocations.
    // =====================================================

    const entrepreneurIds = Array.from(
      new Set(
        (allocations || [])
          .map(
            (allocation) =>
              allocation.entrepreneur_id
          )
          .filter(
            (id): id is string =>
              typeof id === "string" &&
              id.length > 0
          )
      )
    );

    let entrepreneurs: Array<{
      id: string;
      full_name: string | null;
      business_name: string | null;
      public_business_id: string | null;
    }> = [];

    if (entrepreneurIds.length > 0) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("entrepreneurs")
        .select(
          "id,full_name,business_name,public_business_id"
        )
        .in("id", entrepreneurIds);

      if (error) {
        throw error;
      }

      entrepreneurs = data || [];
    }

    const entrepreneurMap =
      new Map(
        entrepreneurs.map(
          (entrepreneur) => [
            entrepreneur.id,
            entrepreneur,
          ]
        )
      );

    const enrichedAllocations =
      (allocations || []).map(
        (allocation) => ({
          ...allocation,

          entrepreneur:
            allocation.entrepreneur_id
              ? entrepreneurMap.get(
                  allocation.entrepreneur_id
                ) || null
              : null,
        })
      );

    return NextResponse.json({
      success: true,

      supporter: {
        id: supporter.id,
        fullName:
          supporter.full_name || "",
      },

      selectionCases:
        selectionCases || [],

      allocations:
        enrichedAllocations,
    });
  } catch (error) {
    console.error(
      "Supporter annual-support dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load annual support status.",
      },
      { status: 500 }
    );
  }
}
