import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const {
      data: businesses,
      error,
    } = await supabaseAdmin
      .from("entrepreneurs")
      .select(`
        id,
        public_business_id,
        full_name,
        business_name,
        business_category,
        business_description,
        product_or_service,
        business_address,
        city,
        state,
        country,
        postal_code,
        business_logo,
        entrepreneur_photo,
        units_required,
        units_supported,
        units_remaining,
        funding_goal,
        marketplace_status,
        qualified,
        marketplace_visibility,
        campaign_status,
        created_at
      `)
      .eq("qualified", true)
      .eq(
        "marketplace_visibility",
        true
      )
      .eq("campaign_status", "Campaign Active")
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        "Public Marketplace API error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the EPEW Marketplace.",
        },
        {
          status: 500,
        }
      );
    }

    const publicBusinesses =
      (businesses || []).filter(
        (business) =>
          Boolean(
            business.public_business_id
          )
      );

    return NextResponse.json({
      businesses: publicBusinesses,
    });
  } catch (error) {
    console.error(
      "Public Marketplace API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load the EPEW Marketplace.",
      },
      {
        status: 500,
      }
    );
  }
}
