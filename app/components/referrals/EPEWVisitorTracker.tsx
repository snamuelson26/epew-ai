"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const INTERNAL_PREFIXES = [
  "/admin",
  "/api",
  "/coaches",
  "/entrepreneurs",
];

function shouldTrackPath(pathname: string) {
  if (!pathname) {
    return false;
  }

  return !INTERNAL_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`)
  );
}

export default function EPEWVisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !shouldTrackPath(pathname)) {
      return;
    }

    const searchParams =
      new URLSearchParams(window.location.search);

    const referrerCode =
      (searchParams.get("ref") || "")
        .trim()
        .toUpperCase();

    const pathParts =
      pathname.split("/").filter(Boolean);

    let businessId: string | null = null;

    if (
      pathParts[0] === "business" ||
      pathParts[0] === "support"
    ) {
      businessId = pathParts[1] || null;
    }

    fetch("/api/referrals/visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referrerCode,
        landingPath:
          `${pathname}${window.location.search}`,
        businessId,
      }),
      keepalive: true,
    }).catch((error) => {
      console.error(
        "Unable to record EPEW visitor activity:",
        error
      );
    });
  }, [pathname]);

  return null;
}
