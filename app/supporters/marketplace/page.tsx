"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import MarketplaceBusinessCard from "../../components/MarketplaceBusinessCard";

export default function SupporterMarketplacePage() {
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const [supporter, setSupporter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    loadMarketplace();
  }, []);

  async function loadMarketplace() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
  const { data } = await supabase
    .from("supporters")
    .select("*")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle();

  setSupporter(data);
}

    const { data, error } = await supabase
      .from("entrepreneurs")
      .select("*")
      .eq("marketplace_visibility", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEntrepreneurs(data);
    }

    setLoading(false);
  }

  const categories = useMemo(() => {
    const list = entrepreneurs
      .map((item) => item.business_category)
      .filter(Boolean);

    return ["All", ...Array.from(new Set(list))];
  }, [entrepreneurs]);

  const businesses = entrepreneurs.filter((business) => {
    const matchesCategory =
      category === "All" || business.business_category === category;

    const searchText = `
      ${business.business_name || ""}
      ${business.full_name || ""}
      ${business.name || ""}
      ${business.product_or_service || ""}
      ${business.business_description || ""}
      ${business.business_category || ""}
      ${business.city || ""}
      ${business.state || ""}
      ${business.country || ""}
    `.toLowerCase();

    const matchesSearch =
      search.trim() === "" || searchText.includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const qualifiedEntrepreneurs = entrepreneurs.length;
  const businessesSeekingSupport = entrepreneurs.length;

  const weeklySupportersNeeded = entrepreneurs.reduce((total, business) => {
    const required = Number(business.units_required || 20);
    const supported = Number(business.units_supported || 0);

    return total + Math.max(required - supported, 0);
  }, 0);

  const newEntrepreneursThisWeek = entrepreneurs.filter((business) => {
    if (!business.created_at) return false;

    const createdDate = new Date(business.created_at);
    const today = new Date();
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(today.getDate() - 7);

    return createdDate >= sevenDaysAgo && createdDate <= today;
  }).length;

  const newBusinessesAddedThisWeek = newEntrepreneursThisWeek;

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
          <h1 className="text-5xl font-extrabold text-[#06245c]">
            Loading Marketplace...
          </h1>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 px-8 py-20 text-white">
          <div className="mx-auto max-w-7xl text-center">
            <p className="text-xl font-black uppercase tracking-widest text-lime-300">
              EPEW Supporter Marketplace
            </p>

            <h1 className="mt-5 text-5xl font-extrabold leading-tight md:text-7xl">
              Support Entrepreneurs. Strengthen Communities.
            </h1>

            <p className="mx-auto mt-8 max-w-6xl text-2xl leading-relaxed text-blue-100 md:text-3xl">
              By empowering entrepreneurs, EPEW creates opportunities that
              strengthen families, transform communities, and build lasting
              prosperity throughout the United States and around the world.
            </p>

            <p className="mx-auto mt-6 max-w-5xl text-xl leading-relaxed text-blue-100 md:text-2xl">
              Support qualified entrepreneurs participating in the Entrepreneur
              Development Ecosystem.
            </p>

            <p className="mx-auto mt-8 max-w-4xl rounded-2xl bg-white p-5 text-lg font-bold text-red-700">
              Participation is not an investment. Participation benefits are not
              guaranteed.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-14">
          <div className="mb-10 text-center">
            <h2 className="text-5xl font-extrabold text-[#06245c]">
              This Week&apos;s Marketplace Activity
            </h2>

            <p className="mx-auto mt-5 max-w-5xl text-2xl leading-relaxed text-gray-700">
              EPEW is an active, growing entrepreneurship ecosystem where
              qualified entrepreneurs are prepared, presented, and connected
              with community supporters.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <SnapshotCard
              icon="✅"
              title="New Entrepreneurs Qualified"
              value={newEntrepreneursThisWeek}
            />

            <SnapshotCard
              icon="🏢"
              title="New Businesses Added"
              value={newBusinessesAddedThisWeek}
            />

            <SnapshotCard
              icon="🤝"
              title="Businesses Seeking Support"
              value={businessesSeekingSupport}
            />

            <SnapshotCard
              icon="💚"
              title="Weekly Supporters Needed"
              value={weeklySupportersNeeded}
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-10">
          <div className="grid gap-6 rounded-3xl bg-white p-8 shadow-xl md:grid-cols-2">
            <input
              type="text"
              placeholder="Search by business, entrepreneur, category, city, or state..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="rounded-xl border border-[#06245c] p-4 text-lg outline-none focus:ring-2 focus:ring-green-400"
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-xl border border-[#06245c] p-4 text-lg outline-none focus:ring-2 focus:ring-green-400"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-24">
          <div className="grid grid-cols-1 gap-12">
            {businesses.length === 0 ? (
              <div className="rounded-3xl bg-white p-12 text-center shadow-xl">
                <h2 className="text-4xl font-extrabold text-[#06245c]">
                  No businesses match your current search.
                </h2>

                <p className="mt-5 text-2xl text-gray-700">
                  Try adjusting your search terms or filters to discover other
                  qualified entrepreneurs in the EPEW Marketplace.
                </p>
              </div>
            ) : (
              businesses.map((business) => (
                <MarketplaceBusinessCard
                  key={business.id}
                  business={business}
                  supporter={supporter}
                />
              ))
            )}
          </div>
        </section>

        <section className="bg-[#06245c] px-8 py-16 text-center text-white">
          <p className="mx-auto max-w-5xl text-3xl font-extrabold leading-relaxed">
            Support an entrepreneur. Strengthen a community. Help build lasting
            prosperity through the EPEW ecosystem.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}

function SnapshotCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
      <div className="text-5xl">{icon}</div>

      <h3 className="mt-5 text-xl font-extrabold text-gray-600">{title}</h3>

      <p className="mt-4 text-5xl font-black text-[#06245c]">{value}</p>
    </div>
  );
}