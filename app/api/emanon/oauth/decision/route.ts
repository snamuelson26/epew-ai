import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const decision = formData.get("decision");
  const authorizationId = formData.get("authorization_id");
  if (typeof authorizationId !== "string" || !authorizationId) {
    return NextResponse.json({ error: "Missing authorization_id." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const { data: member } = await supabase
    .from("emanon_staff_members")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!member) {
    return NextResponse.json({ error: "Active Emanon access is required." }, { status: 403 });
  }

  const result = decision === "approve"
    ? await supabase.auth.oauth.approveAuthorization(authorizationId)
    : await supabase.auth.oauth.denyAuthorization(authorizationId);
  if (result.error || !result.data) {
    return NextResponse.json({ error: result.error?.message ?? "Authorization failed." }, { status: 400 });
  }
  return NextResponse.redirect(result.data.redirect_url);
}
