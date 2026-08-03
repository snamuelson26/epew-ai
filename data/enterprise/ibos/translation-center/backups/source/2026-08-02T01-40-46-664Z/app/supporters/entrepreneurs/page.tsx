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

export default function AvailableEntrepreneursPage() {
  const [loading, setLoading] = useState(true);
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    loadEntrepreneurs();
  }, []);

  async function loadEntrepreneurs() {
    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setEntrepreneurs([]);
    } else {
      setEntrepreneurs(data || []);
    }

    setLoading(false);
  }

  const filteredEntrepreneurs = useMemo(() => {
    return entrepreneurs.filter((item) => {
      const searchText = `
        ${item.business_name || ""}
        ${item.full_name || ""}
        ${item.business_type || ""}
        ${item.business_description || ""}
        ${item.status || ""}
      `.toLowerCase();

      const locationText = `
        ${item.city || ""}
        ${item.state || ""}
        ${item.country || ""}
        ${item.business_location || ""}
      `.toLowerCase();

      const matchesSearch = searchText.includes(
        search.toLowerCase()
      );

      const matchesLocation = locationText.includes(
        location.toLowerCase()
      );

      const itemCategory =
        item.business_category ||
        item.category ||
        item.business_type ||
        "Other";

      const matchesCategory =
        category === "All" || itemCategory === category;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCategory
      );
    });
  }, [entrepreneurs, search, location, category]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8">
        <p className="text-2xl font-bold text-[#06245c]">
          Loading available entrepreneurs...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">

      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">
          Available Entrepreneurs
        </h1>

        <p className="text-xl text-gray-700">
          Browse entrepreneurs, churches, nonprofit organizations,
          and community development projects.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

        <div className="grid lg:grid-cols-[2fr_1.5fr_1fr] gap-5">

          <input
            type="text"
            placeholder="Search business, entrepreneur, or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-2xl p-4 text-lg"
          />

          <input
            type="text"
            placeholder="Search city, state, country..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border rounded-2xl p-4 text-lg"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-2xl p-4 text-lg"
          >
            {categories.map((item) => (
              <option key={item}>
                {item}
              </option>
            ))}
          </select>

        </div>

      </div>

      {filteredEntrepreneurs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <p className="text-xl font-bold">
            No available entrepreneurs found.
          </p>
        </div>
      ) : (
        <div className="grid xl:grid-cols-2 gap-8">

          {filteredEntrepreneurs.map((item) => {

            const fundingGoal = Number(
              item.funding_goal ||
              item.funding_request ||
              0
            );

            const unitsSupported = Number(
              item.units_supported || 0
            );

            const unitsRequired = Number(
              item.units_required || 20
            );

            const progress =
              unitsRequired > 0
                ? Math.min(
                    Math.round(
                      (unitsSupported / unitsRequired) * 100
                    ),
                    100
                  )
                : 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl shadow-xl p-8"
              >
                <div className="flex justify-between mb-5">

                  <div>
                    <h2 className="text-3xl font-extrabold mb-2">
                      {item.business_name}
                    </h2>

                    <p className="text-lg text-gray-600">
                      {item.full_name}
                    </p>
                  </div>

                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold h-fit">
                    {item.status || "Under Review"}
                  </div>

                </div>

                <p className="mb-4 text-lg">
                  <strong>Category:</strong>{" "}
                  {item.business_category ||
                    item.business_type ||
                    "Other"}
                </p>

                <p className="mb-6 text-gray-700 leading-relaxed">
                  {item.business_description ||
                    "No business description provided."}
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">

                  <div className="bg-[#f5f7fb] rounded-2xl p-5">
                    <p className="font-bold">
                      Funding Goal
                    </p>

                    <p className="text-2xl font-extrabold">
                      ${fundingGoal.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-5">
                    <p className="font-bold">
                      Units Supported
                    </p>

                    <p className="text-2xl font-extrabold">
                      {unitsSupported}
                    </p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-5">
                    <p className="font-bold">
                      Units Required
                    </p>

                    <p className="text-2xl font-extrabold">
                      {unitsRequired}
                    </p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-5">
                    <p className="font-bold">
                      Funding Progress
                    </p>

                    <p className="text-2xl font-extrabold">
                      {progress}%
                    </p>
                  </div>

                </div>

                <div className="w-full bg-gray-200 rounded-full h-5 mb-6">
                  <div
                    className="bg-green-600 h-5 rounded-full"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">

                  <p>
                    <strong>Projected Start:</strong>{" "}
                    {item.projected_funding_start_date || "Pending"}
                  </p>

                  <p>
                    <strong>Qualification:</strong>{" "}
                    {item.qualification_status ||
                      "Pending Review"}
                  </p>

                </div>

                <div className="flex flex-wrap gap-4">

                  <a
                    href={item.video_url || "#"}
                    className="bg-[#06245c] text-white px-6 py-3 rounded-2xl font-bold"
                  >
                    Watch Video
                  </a>

                  <a
                    href={`/supporters/contribution-plans?entrepreneur=${item.id}`}
                    className="bg-green-700 text-white px-6 py-3 rounded-2xl font-bold"
                  >
                    Support This Business
                  </a>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </main>
  );
}