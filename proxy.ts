import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const MAINTENANCE_MODE =
  process.env.MAINTENANCE_MODE === "true";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isMaintenancePage = pathname === "/maintenance";

  const isStaticAsset =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/fonts/") ||
    pathname === "/favicon.ico" ||
    pathname.match(
      /\.(png|jpg|jpeg|svg|webp|ico|css|js|map|txt|xml)$/i
    );

  /*
   * Maintenance mode has first priority.
   */
  if (
    MAINTENANCE_MODE &&
    !isMaintenancePage &&
    !isStaticAsset
  ) {
    const maintenanceUrl = request.nextUrl.clone();

    maintenanceUrl.pathname = "/maintenance";
    maintenanceUrl.search = "";

    return NextResponse.redirect(maintenanceUrl);
  }

  /*
   * Allow the maintenance page and static assets.
   */
  if (isMaintenancePage || isStaticAsset) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Supabase environment variables are missing."
    );

    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  /*
   * Refresh and validate the authentication token.
   */
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};