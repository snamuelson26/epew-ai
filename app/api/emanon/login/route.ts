import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to sign in." },
      { status: 401 },
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("emanon_staff_members")
    .select("id,status")
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

  return NextResponse.json({
    ok: true,
    redirectTo: "/emanon/communication-center",
  });
}
