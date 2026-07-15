"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BusinessDirectoryPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameSearch, setNameSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .eq("received_funding", true)
      .eq("opened_business", true)
      .eq("passed_initial_review", true)
      .eq("epew_excellence_tag", true)
      .order("business_name", { ascending: true });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setBusinesses(data || []);
    setLoading(false);
  }

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const name = (business.business_name || "").toLowerCase();
      const category = (business.business_category || "").toLowerCase();
      const city = (business.city || "").toLowerCase();
      const state = (business.state || "").toLowerCase();

      return (
        name.includes(nameSearch.toLowerCase()) &&
        category.includes(categorySearch.toLowerCase()) &&
        city.includes(citySearch.toLowerCase()) &&
        state.includes(stateSearch.toLowerCase())
      );
    });
  }, [businesses, nameSearch, categorySearch, citySearch, stateSearch]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <p className="text-2xl font-bold">Loading Business Directory...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
        <h1 className="text-5xl font-extrabold mb-4">
          EPEW Business Directory
        </h1>

        <p className="text-xl text-gray-700">
          Search funded businesses that received the EPEW Tag of Excellence.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold mb-6">
          Search Businesses
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="Business Name"
            className="border rounded-xl p-3 w-full"
          />

          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Category"
            className="border rounded-xl p-3 w-full"
          />

          <input
            type="text"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            placeholder="City"
            className="border rounded-xl p-3 w-full"
          />

          <input
            type="text"
            value={stateSearch}
            onChange={(e) => setStateSearch(e.target.value)}
            placeholder="State"
            className="border rounded-xl p-3 w-full"
          />
        </div>
      </div>

      {filteredBusinesses.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <p className="text-2xl font-bold">
            No EPEW Excellence businesses found.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {filteredBusinesses.map((business) => (
            <div
              key={business.id}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
              <div className="bg-yellow-100 border-l-8 border-yellow-500 rounded-2xl p-4 mb-6">
                <p className="text-xl font-extrabold text-yellow-800">
                  🏆 EPEW Excellence Business
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-100 rounded-2xl overflow-hidden h-56 flex items-center justify-center">
                  {business.business_photo_url ? (
                    <img
                      src={business.business_photo_url}
                      alt={business.business_name || "Business"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 font-bold">
                      Business Photo
                    </span>
                  )}
                </div>

                <div className="bg-gray-100 rounded-2xl overflow-hidden h-56 flex items-center justify-center">
                  {business.entrepreneur_photo_url ? (
                    <img
                      src={business.entrepreneur_photo_url}
                      alt={business.full_name || "Entrepreneur"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 font-bold">
                      Entrepreneur Photo
                    </span>
                  )}
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-2">
                {business.business_name || "Business Name"}
              </h2>

              <p className="text-xl text-gray-700 mb-4">
                Entrepreneur: {business.full_name || "Entrepreneur"}
              </p>

              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">★★★★★</span>
                <span className="text-lg font-bold">
                  {business.public_rating || "5.0"}
                </span>
                <span className="text-gray-600">
                  ({business.total_reviews || 0} reviews)
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-lg mb-5">
                <p>
                  <strong>Category:</strong>{" "}
                  {business.business_category || "Not listed"}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {business.city || "City"},{" "}
                  {business.state || "State"}
                </p>

                <p>
                  <strong>Received Funding:</strong> Yes
                </p>

                <p>
                  <strong>Initial Review:</strong> Passed
                </p>
              </div>

              <p className="text-lg text-gray-700 mb-6">
                {business.business_description ||
                  "No business description available."}
              </p>

              <a
                href={`/business/${business.id}`}
                type="button"
                className="w-full bg-[#06245c] text-white py-4 rounded-2xl text-xl font-bold hover:bg-green-600 transition"
              >
                View Business Profile
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}