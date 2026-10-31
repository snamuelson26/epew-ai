// Keep repeat contributions on an approved checkout; never infer a recipient from its display name.
export function foodFansCheckout(publicId: unknown): string | null {
  return publicId === 'FFR-001' || publicId === 'FFR-002' ? `/support/${publicId}/checkout` : null;
}
export function repeatContribution(publicId: unknown): { href: string; foodFans: boolean } | null {
  if (publicId === 'FFR-001' || publicId === 'FFR-002')
    return { href: '/support/FFR-002/checkout?frequency=one-time', foodFans: true };
  if (typeof publicId === 'string' && /^[A-Za-z0-9-]+$/.test(publicId))
    return { href: `/support/${encodeURIComponent(publicId)}/checkout`, foodFans: false };
  return null;
}
