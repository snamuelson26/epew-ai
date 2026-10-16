import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    const user = userData.user;
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const contactId = String(body.contactId || "").trim();
    const businessCode = String(body.businessCode || "").trim();

    if (!contactId || !businessCode) {
      return NextResponse.json({ error: "Contact and business account are required." }, { status: 400 });
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contactId)) {
      return NextResponse.json({ error: "Invalid contact identifier." }, { status: 400 });
    }
    const { data: result, error } = await supabaseAdmin.rpc("epew_queue_supporter_resend", {
      p_user_id: user.id,
      p_contact_id: contactId,
      p_business_code: businessCode,
    });
    if (error) throw error;
    if (!result || (result.ok !== true && !result.error)) throw new Error("Invalid queue response");
    const { httpStatus, ...response } = result;
    return NextResponse.json(response, { status: result.ok ? 200 : httpStatus || 500 });
  } catch (error) {
    console.error("Supporter resend error:", error);
    return NextResponse.json({ error: "Unable to resend this campaign message." }, { status: 500 });
  }
}
