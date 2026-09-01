import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      businessId: string;
    }>;
  }
) {
  try {
    const { businessId } =
      await context.params;

    const publicBusinessId =
      String(businessId || "").trim();

    const supabaseProjectRef =
      (() => {
        try {
          const host = new URL(
            process.env.NEXT_PUBLIC_SUPABASE_URL || ""
          ).hostname;
          return host.split(".")[0] || "unknown";
        } catch {
          return "unknown";
        }
      })();

    console.log(
      "Public business Supabase project:",
      supabaseProjectRef
    );

    if (!publicBusinessId) {
      return NextResponse.json(
        {
          error:
            "Business ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: business,
      error,
    } = await supabaseAdmin
      .from("entrepreneurs")
      .select(`
        id,
        public_business_id,
        business_name,
        full_name,
        business_category,
        business_description,
        business_address,
        city,
        state,
        postal_code,
        business_logo,
        entrepreneur_photo,
        units_required,
        units_supported,
        units_remaining,
        funding_goal,
        qualified,
        marketplace_visibility,
        marketplace_status,
        meeting_1_status,
        meeting_2_status,
        meeting_3_status,
        campaign_status,
        campaign_authorized_at
      `)
      .eq(
        "public_business_id",
        publicBusinessId
      )
      .eq("qualified", true)
      .eq(
        "marketplace_visibility",
        true
      )
      .eq("meeting_1_status", "completed")
      .eq("meeting_2_status", "completed")
      .in("meeting_3_status", ["active", "completed"])
      .eq("campaign_status", "Campaign Active")
      .not("campaign_authorized_at", "is", null)
      .maybeSingle();

    if (error) {
      console.error(
        "Public business lookup error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load this business.",
        },
        { status: 500 }
      );
    }

    if (!business) {
      return NextResponse.json(
        {
          error:
            "Business not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      business,
    });
  } catch (error) {
    console.error(
      "Public business API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load this business.",
      },
      { status: 500 }
    );
  }
}
