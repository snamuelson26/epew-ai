"use client";

import Image from "next/image";
import { useState } from "react";

const entrepreneurs = [
  {
    name: "John Doe",
    business: "Doe Coffee Shop",
    category: "Restaurant",
    location: "Brooklyn, NY",
    summary: "A community coffee shop focused on local service, jobs, and neighborhood growth.",
    photo: "/images/entrepreneur-sample-1.png",
    units: 14,
    status: "Open for Support",
  },
  {
    name: "Marie Jean",
    business: "MJ Beauty Studio",
    category: "Beauty",
    location: "Queens, NY",
    summary: "A beauty and wellness studio preparing to serve women and families in the community.",
    photo: "/images/entrepreneur-sample-2.png",
    units: 18,
    status: "Almost Completed",
  },
  {
    name: "Carlos Rivera",
    business: "Rivera Delivery Services",
    category: "Transportation",
    location: "Miami, FL",
    summary: "A local delivery service helping small businesses move products faster and reliably.",
    photo: "/images/entrepreneur-sample-3.png",
    units: 7,
    status: "Open for Support",
  },
];

export default function EntrepreneurListPage() {
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Statuses");

  const filteredEntrepreneurs = entrepreneurs.filter((item) => {
    const categoryMatch = category === "All Categories" || item.category === category;
    const statusMatch = status === "All Statuses" || item.status === status;
    return categoryMatch && statusMatch;
  });

  return (
    <main className="bg-white text-[#06245c]">

      {/* HERO IMAGE */}
      <section className="bg-white">
        <Image
          src="/images/entrepreneur-marketplace.png"
          alt="Entrepreneur Marketplace"
          width={1600}
          height={900}
          className="w-full h-auto object-cover"
          priority
        />
      </section>

      {/* INTRO */}
      <section className="py-24 bg-[#f5f7fb]">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <h1 className="text-7xl font-extrabold mb-10">
            Entrepreneur Marketplace
          </h1>

          <p className="text-3xl text-gray-700 leading-relaxed">
            Explore approved entrepreneurs who are currently seeking supporter
            participation. These are people within your community working 
            hard to build businesses, create opportunities, and strengthen 
            local economic groth. 
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-4 gap-6">

          <input
            type="text"
            placeholder="Search entrepreneurs..."
            className="border-2 border-gray-300 rounded-2xl px-6 py-4 text-xl"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-2 border-gray-300 rounded-2xl px-6 py-4 text-xl"
          >
            <option>All Categories</option>
            <option>Restaurant</option>
            <option>Beauty</option>
            <option>Transportation</option>
            <option>Retail</option>
            <option>Technology</option>
            <option>Cleaning Services</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border-2 border-gray-300 rounded-2xl px-6 py-4 text-xl"
          >
            <option>All Statuses</option>
            <option>Open for Support</option>
            <option>Almost Completed</option>
            <option>Relisted</option>
            <option>Under Review</option>
          </select>

          <select className="border-2 border-gray-300 rounded-2xl px-6 py-4 text-xl">
            <option>Sort By</option>
            <option>Newest</option>
            <option>Most Supported</option>
            <option>Almost Completed</option>
          </select>

        </div>
      </section>

      {/* ENTREPRENEUR CARDS */}
      <section className="py-24 bg-[#f5f7fb]">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-10">

          {filteredEntrepreneurs.map((item, index) => {
            const percent = (item.units / 20) * 100;

            return (
              <div key={index} className="bg-white rounded-3xl p-8 shadow-2xl">

                <Image
                  src={item.photo}
                  alt={item.name}
                  width={600}
                  height={450}
                  className="rounded-3xl shadow-xl mb-8"
                />

                <h2 className="text-4xl font-bold mb-3">
                  {item.business}
                </h2>

                <p className="text-2xl text-gray-600 mb-2">
                  {item.name}
                </p>

                <p className="text-xl text-green-700 font-bold mb-6">
                  {item.category} • {item.location}
                </p>

                <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                  {item.summary}
                </p>

                <div className="mb-6">
                  <div className="flex justify-between text-xl font-bold mb-3">
                    <span>{item.units} / 20 Units Supported</span>
                    <span>{percent}%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-5">
                    <div
                      className="bg-green-600 h-5 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <p className="text-xl font-bold text-[#06245c] mb-8">
                  Status: {item.status}
                </p>

                <div className="flex flex-col gap-4">
                  <a
                    href="/support"
                    className="bg-[#06245c] text-white text-center px-8 py-4 rounded-2xl text-xl font-bold hover:bg-green-600 transition"
                  >
                    Support This Entrepreneur
                  </a>

                  <a
                    href="/entrepreneur-list/details"
                    className="border-2 border-[#06245c] text-[#06245c] text-center px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] hover:text-white transition"
                  >
                    View Business Details
                  </a>

                  <a
                    href="/resources/videos"
                    className="bg-green-600 text-white text-center px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] transition"
                  >
                    Watch Presentation
                  </a>
                </div>

              </div>
            );
          })}

        </div>
      </section>

      {/* PUBLIC LIMIT NOTICE */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-8 text-center">

          <h2 className="text-6xl font-bold mb-10">
            Public Preview Access
          </h2>

          <p className="text-3xl text-gray-700 leading-relaxed mb-12">
            Visitors may preview a limited number of entrepreneur profiles.
            Registered now as a supporter to access the full marketplace,
            follow progress, and participate through structured options.
          </p>

          <a
            href="/support"
            className="bg-[#06245c] text-white px-14 py-6 rounded-2xl text-3xl font-bold hover:bg-green-600 transition"
          >
            Register to View Full Marketplace
          </a>

        </div>
      </section>

    </main>
  );
}