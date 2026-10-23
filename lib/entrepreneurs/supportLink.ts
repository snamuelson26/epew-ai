export function supportLink(code: string | null | undefined): string {
  const value = code?.trim();
  return value && /^[A-Za-z0-9_-]+$/.test(value)
    ? `https://www.epew.us/support/${encodeURIComponent(value)}` : "";
}
