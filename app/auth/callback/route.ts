import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  const loginUrl = new URL(
    "/entrepreneurs/login",
    siteUrl,
  );

  const confirmedUrl = new URL(
    "/auth/email-confirmed",
    siteUrl,
  );

  const alreadyConfirmedUrl = new URL(
    "/auth/email-already-confirmed",
    siteUrl,
  );

  if (!code) {
    return NextResponse.redirect(alreadyConfirmedUrl);
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      },
    },
  );

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(alreadyConfirmedUrl);
  }

  if (type === "signup" || !type) {
    return NextResponse.redirect(confirmedUrl);
  }

  return NextResponse.redirect(loginUrl);
}