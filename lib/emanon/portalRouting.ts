export const EMANON_DASHBOARD = "/organizations/EMANON-001/dashboard";

// Only local, normalized paths within the selected organization's portals.
export function staffRedirect(value: unknown, organizationCode = "EMANON-INSTITUTE") {
  const isEmanon = organizationCode === "EMANON-INSTITUTE";
  const fallback = isEmanon ? EMANON_DASHBOARD : "/orgdh/communication-center";
  if (typeof value !== "string" || /[\\\u0000-\u0020]/.test(value)) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  const url = new URL(value, "https://epew.invalid");
  if (url.origin !== "https://epew.invalid") return fallback;
  const path = url.pathname;
  const allowed = path.startsWith("/emanon/oauth/") ||
    (isEmanon && (path === "/emanon/communication-center" || path.startsWith("/organizations/EMANON-001/"))) ||
    (!isEmanon && path.startsWith("/orgdh/") && path !== "/orgdh/login");
  return allowed ? `${path}${url.search}${url.hash}` : fallback;
}

export function organizationLoginPath(profileCode: string, returnPath?: string) {
  const destination = returnPath ?? `/organizations/${encodeURIComponent(profileCode)}/dashboard`;
  return profileCode === "EMANON-001"
    ? `/emanon/login?redirect=${encodeURIComponent(staffRedirect(destination))}`
    : "/entrepreneurs/login";
}
