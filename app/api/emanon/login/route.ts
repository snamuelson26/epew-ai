import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { staffRedirect } from "@/lib/emanon/portalRouting";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string; redirectTo?: string; organizationCode?: string }
    | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to sign in." },
      { status: 401 },
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("emanon_staff_members")
    .select("id,status,organization_id")
    .eq("user_id", data.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (memberError || !member) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "This account does not have active Emanon Institute access." },
      { status: 403 },
    );
  }

  {
    const { data: organization } = await supabase
      .from("emanon_organizations")
      .select("organization_code")
      .eq("id", member.organization_id)
      .maybeSingle();
    if (!organization || (body?.organizationCode && organization.organization_code !== body.organizationCode)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "This account does not have access to the selected organization." },
        { status: 403 },
      );
    }
    let redirectTo = staffRedirect(body?.redirectTo, organization.organization_code);
    if (redirectTo.startsWith("/organizations/EMANON-001/")) {
      const { data: portal } = await supabase.from("organization_portal_profiles")
        .select("id").eq("auth_user_id", data.user.id)
        .eq("profile_code", "EMANON-001").eq("status", "active").maybeSingle();
      if (!portal) redirectTo = "/emanon/communication-center";
    }
    return NextResponse.json({ ok: true, redirectTo });
  }
}
