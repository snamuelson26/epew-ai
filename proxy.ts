import { NextRequest, NextResponse } from "next/server";

const MAINTENANCE_MODE =
  process.env.MAINTENANCE_MODE === "true" ||
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Routes and files that must remain accessible
   * so the maintenance page can load correctly.
   */
  const isMaintenancePage = pathname === "/maintenance";

  const isNextAsset =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/fonts/");

  const isPublicFile =
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".map") ||
    pathname.endsWith(".txt") ||
    pathname.endsWith(".xml");

  /*
   * Allow the maintenance page and its required assets.
   */
  if (isMaintenancePage || isNextAsset || isPublicFile) {
    return NextResponse.next();
  }

  /*
   * When maintenance mode is active, redirect every other
   * page—including /admin—to the maintenance page.
   */
  if (MAINTENANCE_MODE) {
    const maintenanceUrl = request.nextUrl.clone();
    maintenanceUrl.pathname = "/maintenance";
    maintenanceUrl.search = "";

    return NextResponse.redirect(maintenanceUrl);
  }

  /*
   * Maintenance mode is off.
   */
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run Proxy on all application routes.
     * Static Next.js assets are also excluded inside the function.
     */
    "/((?!_next/static|_next/image).*)",
  ],
};