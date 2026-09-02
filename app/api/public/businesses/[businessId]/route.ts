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
        campaign_status
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
      .eq("campaign_status", "Campaign Active")
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
