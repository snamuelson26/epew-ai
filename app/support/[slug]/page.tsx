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
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <p className="text-center text-xl font-bold">
          Loading...
        </p>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
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
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-10 text-[#06245c]">
      <div className="mx-auto max-w-3xl">

        <section className="rounded-3xl bg-white px-6 py-10 text-center shadow-xl md:px-12">

          <div className="mx-auto mb-10 inline-flex flex-col items-center rounded-3xl bg-lime-300 px-10 py-5 shadow-lg">
            <span className="text-xl font-black md:text-2xl">
              ⭐ EPEW Qualified Entrepreneur
            </span>

            <span className="mt-2 text-3xl font-black md:text-4xl">
              $100,000.00
            </span>
          </div>

          <p className="mb-8 text-sm font-black uppercase tracking-wider text-green-700">
            Business ID: {businessId}
          </p>

          <div className="mb-8 flex items-center justify-center gap-6">

            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#06245c] text-3xl font-black text-white shadow-lg">
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

            {logo && !logoError ? (
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg">
                <img
                  src={logo}
                  alt={`${businessName} logo`}
                  className="h-full w-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : null}
          </div>

          <h1 className="text-4xl font-extrabold md:text-5xl">
            {businessName}
          </h1>

          <p className="mt-3 text-2xl text-gray-700">
            {entrepreneurName}
          </p>

          <p className="mt-3 text-lg text-gray-600">
            {location}
            {location && category ? " • " : ""}
            {category}
          </p>

          <div className="mx-auto my-10 h-px max-w-xl bg-gray-200" />

          <p className="mx-auto max-w-xl text-xl leading-relaxed text-gray-700">
            Support this entrepreneur through EPEW&apos;s
            structured community participation program.
          </p>

          <div className="mt-10">
            <Link
              href={`/support/${businessId}/checkout`}
              className="inline-block rounded-2xl bg-green-700 px-10 py-5 text-xl font-black text-white shadow-lg transition hover:bg-green-800"
            >
              Support This Entrepreneur
            </Link>
          </div>

          <p className="mx-auto mt-10 max-w-2xl rounded-2xl border border-gray-200 bg-gray-50 p-5 text-base font-bold leading-relaxed text-red-700">
            Participation is not an investment. Participation
            benefits depend on business performance and EPEW
            policies and regulations.
          </p>

        </section>

      </div>
    </main>
  );
}
