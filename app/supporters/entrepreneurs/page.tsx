"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const categories = [
  "All",
  "Food",
  "Retail",
  "Transportation",
  "Agriculture",
  "Beauty",
  "Technology",
  "Healthcare",
  "Education",
  "Construction",
  "Real Estate",
  "Hospitality",
  "Manufacturing",
  "Media & Entertainment",
  "Professional Services",
  "Churches",
  "Nonprofit Organizations",
  "Community Organizations",
  "Faith-Based Ministries",
  "Tourism",
  "Arts & Culture",
  "Sports & Recreation",
  "Environmental Projects",
  "Youth Development",
  "Senior Services",
  "Other",
];

type PublicEntrepreneur = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  business_category: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  business_description: string | null;
  funding_goal: number | null;
  units_supported: number | null;
  units_required: number | null;
  status: string | null;
  qualified: boolean | null;
  marketplace_visibility: boolean | null;
  business_video_url: string | null;
  public_support_link: string | null;
  public_business_id: string | null;
  business_logo: string | null;
  entrepreneur_photo: string | null;
  product_or_service: string | null;
  business_website_url: string | null;
};

export default function AvailableEntrepreneursPage() {
  const [loading, setLoading] = useState(true);
  const [entrepreneurs, setEntrepreneurs] = useState<PublicEntrepreneur[]>([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    void loadEntrepreneurs();
  }, []);

  async function loadEntrepreneurs() {
    setLoading(true);

    // IMPORTANT PRIVACY RULE:
    // Supporters never browse entrepreneur applications. Applications are
    // internal EPEW operational records. This page reads only the separate
    // public entrepreneur marketplace table and only records explicitly
    // qualified + approved for marketplace visibility.
    const { data, error } = await supabase
      .from("entrepreneurs")
      .select(
        "id,full_name,business_name,business_category,city,state,country,business_description,funding_goal,units_supported,units_required,status,qualified,marketplace_visibility,business_video_url,public_support_link,public_business_id,business_logo,entrepreneur_photo,product_or_service,business_website_url",
      )
      .eq("qualified", true)
      .eq("marketplace_visibility", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Unable to load public entrepreneur marketplace:", error);
      setEntrepreneurs([]);
    } else {
      setEntrepreneurs((data || []) as PublicEntrepreneur[]);
    }

    setLoading(false);
  }

  const filteredEntrepreneurs = useMemo(() => {
    return entrepreneurs.filter((item) => {
      const searchText = `
        ${item.business_name || ""}
        ${item.full_name || ""}
        ${item.business_category || ""}
        ${item.business_description || ""}
        ${item.product_or_service || ""}
      `.toLowerCase();

      const locationText = `
        ${item.city || ""}
        ${item.state || ""}
        ${item.country || ""}
      `.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesLocation = locationText.includes(location.toLowerCase());
      const itemCategory = item.business_category || "Other";
      const matchesCategory = category === "All" || itemCategory === category;

      return matchesSearch && matchesLocation && matchesCategory;
    });
  }, [entrepreneurs, search, location, category]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8">
        <p className="text-2xl font-bold text-[#06245c]">
          Loading available businesses...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-6 text-[#06245c] md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-xl md:p-10">
          <h1 className="mb-3 text-4xl font-extrabold md:text-5xl">
            Businesses Available for Support
          </h1>
          <p className="text-xl text-gray-700">
            Browse qualified businesses that EPEW has approved for the supporter marketplace.
          </p>
        </div>

        <div className="mb-8 rounded-3xl bg-white p-8 shadow-xl">
          <div className="grid gap-5 lg:grid-cols-[2fr_1.5fr_1fr]">
            <input
              type="text"
              placeholder="Search business or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-2xl border p-4 text-lg"
            />
            <input
              type="text"
              placeholder="Search city, state, country..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-2xl border p-4 text-lg"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-2xl border p-4 text-lg"
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredEntrepreneurs.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 shadow-xl">
            <p className="text-xl font-bold">
              No qualified businesses are currently available for support.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-2">
            {filteredEntrepreneurs.map((item) => {
              const fundingGoal = Number(item.funding_goal || 0);
              const unitsSupported = Number(item.units_supported || 0);
              const unitsRequired = Number(item.units_required || 20);
              const progress =
                unitsRequired > 0
                  ? Math.min(Math.round((unitsSupported / unitsRequired) * 100), 100)
                  : 0;

              const supportHref =
                item.public_support_link ||
                (item.public_business_id
                  ? `/support/${item.public_business_id}`
                  : "#");

              return (
                <article key={item.id} className="rounded-3xl bg-white p-8 shadow-xl">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="mb-2 text-3xl font-extrabold">
                        {item.business_name || "EPEW Business"}
                      </h2>
                      {item.full_name && (
                        <p className="text-lg text-gray-600">{item.full_name}</p>
                      )}
                    </div>
                    <div className="h-fit rounded-xl bg-green-100 px-4 py-2 font-bold text-green-700">
                      Qualified
                    </div>
                  </div>

                  <p className="mb-4 text-lg">
                    <strong>Category:</strong> {item.business_category || "Other"}
                  </p>

                  <p className="mb-6 leading-relaxed text-gray-700">
                    {item.business_description || item.product_or_service || "Business information is being prepared."}
                  </p>

                  <div className="mb-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-[#f5f7fb] p-5">
                      <p className="font-bold">Qualification Goal</p>
                      <p className="text-2xl font-extrabold">
                        ${fundingGoal.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#f5f7fb] p-5">
                      <p className="font-bold">Units Supported</p>
                      <p className="text-2xl font-extrabold">{unitsSupported}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f5f7fb] p-5">
                      <p className="font-bold">Units Required</p>
                      <p className="text-2xl font-extrabold">{unitsRequired}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f5f7fb] p-5">
                      <p className="font-bold">Support Progress</p>
                      <p className="text-2xl font-extrabold">{progress}%</p>
                    </div>
                  </div>

                  <div className="mb-6 h-5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-5 rounded-full bg-green-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {item.business_video_url && (
                      <a
                        href={item.business_video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-[#06245c] px-6 py-3 font-bold text-white"
                      >
                        Watch Video
                      </a>
                    )}
                    {supportHref !== "#" && (
                      <a
                        href={supportHref}
                        className="rounded-2xl bg-green-700 px-6 py-3 font-bold text-white"
                      >
                        Support This Business
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
