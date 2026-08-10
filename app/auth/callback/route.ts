import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  const loginUrl = new URL(
    "/entrepreneurs/login",
    siteUrl
  );

  const confirmedUrl = new URL(
    "/auth/email-confirmed",
    siteUrl
  );

  const alreadyConfirmedUrl = new URL(
    "/auth/email-already-confirmed",
    siteUrl
  );

  if (!code) {
    return NextResponse.redirect(alreadyConfirmedUrl);
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "Supabase callback session exchange failed:",
      error
    );

    return NextResponse.redirect(
      alreadyConfirmedUrl
    );
  }

  if (type === "recovery") {
    const resetDestination =
      next && next.startsWith("/")
        ? next
        : "/admin/reset-password";

    return NextResponse.redirect(
      new URL(resetDestination, siteUrl)
    );
  }

  if (type === "signup" || !type) {
    return NextResponse.redirect(confirmedUrl);
  }

  if (next && next.startsWith("/")) {
    return NextResponse.redirect(
      new URL(next, siteUrl)
    );
  }

  return NextResponse.redirect(loginUrl);
}
