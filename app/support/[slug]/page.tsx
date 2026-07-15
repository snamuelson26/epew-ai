"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SupportEntrepreneurPage() {
  const params = useParams();
  const businessId = typeof params?.slug === "string" ? params.slug : "";

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (businessId) {
      loadBusiness();
    }
  }, [businessId]);

  async function loadBusiness() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("entrepreneurs")
      .select("*")
      .eq("public_business_id", businessId)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setMessage("Business not found.");
      setLoading(false);
      return;
    }

    setBusiness(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <p className="text-2xl font-bold">Loading support page...</p>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="text-4xl font-extrabold">Support Page</h1>
          <p className="mt-4 text-2xl text-gray-700">{message}</p>
        </div>
      </main>
    );
  }

  const businessName = business.business_name || "Business Name";
  const entrepreneurName = business.full_name || "EPEW Entrepreneur";
  const city = business.city || "City";
  const state = business.state || "State";
  const category = business.business_category || "Business Category";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <section className="px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-14 text-center shadow-2xl">
            <div className="mb-8 inline-flex rounded-full bg-lime-300 px-8 py-4 text-2xl font-black text-[#06245c] shadow-lg">
              ⭐ EPEW Qualified Entrepreneur
            </div>

            <h1 className="mb-8 text-6xl font-extrabold">
              You Are Invited to Support This Entrepreneur
            </h1>

            <p className="mb-12 text-3xl leading-relaxed text-gray-700">
              Welcome to EPEW, where entrepreneurs, supporters, coaches, and
              community partners work together to help business ideas grow.
            </p>

            <div className="mb-12 rounded-3xl bg-[#f5f7fb] p-10 shadow-xl">
              <p className="mb-6 text-lg font-black uppercase tracking-wide text-green-700">
                Business ID: {businessId}
              </p>

              <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-[#06245c] text-6xl text-white shadow-lg">
                {business.entrepreneur_photo_url ||
                business.photo_url ||
                business.profile_photo_url ? (
                  <img
                    src={
                      business.entrepreneur_photo_url ||
                      business.photo_url ||
                      business.profile_photo_url
                    }
                    alt={entrepreneurName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "👤"
                )}
              </div>

              <h2 className="mt-8 mb-4 text-5xl font-bold">{businessName}</h2>

              <p className="mb-4 text-3xl text-gray-700">
                {entrepreneurName}
              </p>

              <p className="text-2xl text-gray-600">
                {city}, {state} • {category}
              </p>
            </div>

            <p className="mb-12 text-2xl leading-relaxed text-gray-700">
              Your support may help this entrepreneur prepare, launch, and grow
              a business through structured community participation.
            </p>

            <div className="flex flex-col justify-center gap-5 md:flex-row">
  <Link
    href={`/support/${businessId}/checkout`}
    className="rounded-2xl bg-green-700 px-10 py-5 text-2xl font-bold text-white transition hover:bg-green-800"
  >
    Continue to Stripe Checkout
  </Link>
</div>

            <p className="mx-auto mt-10 max-w-4xl rounded-2xl bg-white p-5 text-lg font-bold text-red-700 shadow">
              Participation is not an investment. Participation benefits are not
              guaranteed and depend on business performance and EPEW policies.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}