"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SupportEntrepreneurPage() {
  const params = useParams();
  const businessId =
    typeof params?.slug === "string" ? params.slug : "";

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    if (businessId) {
      loadBusiness();
    }
  }, [businessId]);

  async function loadBusiness() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/public/businesses/${encodeURIComponent(businessId)}`,
        { cache: "no-store" }
      );

      const payload = await response.json();

      if (!response.ok || !payload?.business) {
        setMessage(payload?.error || "Business not found.");
        return;
      }

      setBusiness(payload.business);
    } catch (error) {
      console.error("Support page business lookup error:", error);
      setMessage("Unable to load this business.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] p-8 text-[#06245c]">
        <p className="text-center text-xl font-bold">
          Loading...
        </p>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] p-8 text-[#06245c]">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-xl">
          <h1 className="text-3xl font-extrabold">
            Support Page
          </h1>

          <p className="mt-4 text-xl text-gray-700">
            {message}
          </p>
        </div>
      </main>
    );
  }

  const businessName =
    business.business_name || "EPEW Business";

  const entrepreneurName =
    business.full_name || "EPEW Entrepreneur";

  const category =
    business.business_category || "Business";

  const city = business.city || "";
  const state = business.state || "";

  const location =
    [city, state].filter(Boolean).join(", ");

  const logo =
    business.business_logo ||
    business.business_logo_url ||
    business.logo_url;

  const photo =
    business.entrepreneur_photo ||
    business.entrepreneur_photo_url ||
    business.photo_url ||
    business.profile_photo_url;

  const initials = entrepreneurName
    .split(" ")
    .map((name: string) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-[#06245c]">
      <div className="mx-auto max-w-3xl">

        <section className="overflow-hidden rounded-[32px] bg-white shadow-2xl">

          <div className="bg-[#06245c] px-6 py-9 text-center text-white">
            <div className="inline-flex flex-col items-center rounded-3xl bg-lime-300 px-9 py-4 text-[#06245c] shadow-lg">
              <span className="text-xl font-black md:text-2xl">
                ⭐ EPEW Qualified Entrepreneur
              </span>

              <span className="mt-1 text-3xl font-black md:text-4xl">
                $100,000.00
              </span>
            </div>
          </div>

          <div className="px-5 py-8 md:px-10">

            <p className="mb-6 text-center text-sm font-black uppercase tracking-wider text-green-700">
              Business ID: {businessId}
            </p>

            <div className="mx-auto max-w-2xl rounded-[28px] border border-gray-200 bg-[#f8fafc] p-6 shadow-lg md:p-8">

              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">

                <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#06245c] text-4xl font-black text-white shadow-xl">
                  {photo && !photoError ? (
                    <img
                      src={photo}
                      alt={entrepreneurName}
                      className="h-full w-full object-cover"
                      onError={() => setPhotoError(true)}
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white p-3 shadow-xl">
                  {logo && !logoError ? (
                    <img
                      src={logo}
                      alt={`${businessName} logo`}
                      className="h-full w-full object-contain"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <span className="text-center text-sm font-bold text-gray-500">
                      {businessName}
                    </span>
                  )}
                </div>

              </div>

              <div className="mt-7 text-center">
                <h1 className="text-3xl font-black md:text-4xl">
                  {businessName}
                </h1>

                <p className="mt-2 text-xl font-semibold text-gray-700">
                  {entrepreneurName}
                </p>

                <p className="mt-2 text-base text-gray-600 md:text-lg">
                  {location}
                  {location && category ? " • " : ""}
                  {category}
                </p>
              </div>

            </div>

            <div className="mx-auto mt-8 max-w-xl text-center">
              <p className="text-lg leading-relaxed text-gray-700 md:text-xl">
                Support this entrepreneur through EPEW&apos;s
                structured community participation program.
              </p>

              <Link
                href={`/supporters/login?next=${encodeURIComponent(
                `/support/${businessId}/checkout`
              )}`}
                className="mt-7 inline-block w-full rounded-2xl bg-green-700 px-8 py-5 text-xl font-black text-white shadow-lg transition hover:bg-green-800 sm:w-auto"
              >
                Support This Entrepreneur
              </Link>
            </div>

            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-center shadow-sm">
              <p className="text-base font-bold leading-relaxed text-[#7a4b00]">
                Your participation is voluntary support.
                Participation benefits depend on business performance
                and EPEW policies and regulations.
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
