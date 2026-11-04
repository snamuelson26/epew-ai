import type { ReactNode } from "react";

export default async function FoodFansSupportLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const isFoodFans = slug === "FFR-001" || slug === "FFR-002";

  return (
    <>
      {isFoodFans && (
        <nav aria-label="Food Fans return navigation" className="border-b border-green-200 bg-green-50 px-5 py-4">
          <a href="https://foodfans.org" className="inline-flex rounded-lg border border-green-800 bg-white px-5 py-3 text-base font-bold text-green-900 hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800">
            ← Back to Food Fans
          </a>
        </nav>
      )}
      {children}
    </>
  );
}
