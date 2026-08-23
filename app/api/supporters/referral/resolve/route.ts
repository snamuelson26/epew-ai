import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const referrerCode =
      typeof body?.referrerCode === "string"
        ? body.referrerCode.trim().toUpperCase()
        : "";

    if (!referrerCode) {
      return NextResponse.json({
        valid: false,
        referrerSupporterId: null,
        referrerCode: null,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("supporters")
      .select("id,supporter_id,status,account_status")
      .eq("supporter_id", referrerCode)
      .maybeSingle();

    if (error) {
      console.error("Referral resolution error:", error);

      return NextResponse.json(
        { error: "Unable to validate referral code." },
        { status: 500 }
      );
    }

    if (
      !data ||
      data.status === "inactive" ||
      data.account_status === "inactive"
    ) {
      return NextResponse.json({
        valid: false,
        referrerSupporterId: null,
        referrerCode: null,
      });
    }

    return NextResponse.json({
      valid: true,
      referrerSupporterId: data.id,
      referrerCode: data.supporter_id,
    });
  } catch (error) {
    console.error("Referral resolution failure:", error);

    return NextResponse.json(
      { error: "Unable to validate referral code." },
      { status: 500 }
    );
  }
}
