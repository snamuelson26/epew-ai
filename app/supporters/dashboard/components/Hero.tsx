"use client";

import { Supporter } from "./types";

export default function Hero({
  supporter,
  onLogout,
}: {
  supporter: Supporter;
  onLogout: () => void;
}) {
  const countryOfOrigin =
    supporter.country_of_origin ||
    supporter.country_of_citizenship ||
    "Not Provided";

  const countryOfResidence =
    supporter.country_of_residence ||
    supporter.country ||
    "Not Provided";

  const memberSince = supporter.created_at
    ? new Date(supporter.created_at).toLocaleDateString()
    : "Not Available";

  return (
    <section className="mb-8 rounded-3xl bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 p-10 text-white shadow-2xl">
      <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div>
          <p className="text-xl font-black uppercase tracking-widest text-lime-300">
            EPEW Main Supporter Portal
          </p>

          <h1 className="mt-4 text-5xl font-extrabold leading-tight md:text-6xl">
            Welcome, {supporter.full_name || "Supporter"}
          </h1>

          <p className="mt-6 max-w-5xl text-2xl leading-relaxed text-blue-100">
            Your participation helps entrepreneurs build businesses, strengthen
            communities, create jobs, and generate lasting prosperity through the
            EPEW Entrepreneur Development Ecosystem.
          </p>

          <p className="mt-6 max-w-4xl text-2xl font-bold text-lime-300">
            EPEW develops entrepreneurs. Entrepreneurs build businesses.
            Businesses strengthen communities.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/supporters/marketplace"
              className="rounded-2xl bg-white px-8 py-4 text-xl font-black text-[#06245c] shadow-lg hover:bg-lime-300"
            >
              Explore Entrepreneurs
            </a>

            <a
              href="/supporters/messages"
              className="rounded-2xl bg-lime-300 px-8 py-4 text-xl font-black text-[#06245c] shadow-lg hover:bg-white"
            >
              Messages
            </a>

            <button
              onClick={onLogout}
              className="rounded-2xl bg-red-600 px-8 py-4 text-xl font-black text-white shadow-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 p-8 text-center shadow-2xl ring-1 ring-white/20">
          <div className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-white text-7xl font-black text-[#06245c] shadow-lg">
            {supporter.photo_url ? (
              <img
                src={supporter.photo_url}
                alt={supporter.full_name || "Supporter"}
                className="h-full w-full object-cover"
              />
            ) : (
              "👤"
            )}
          </div>

          <h2 className="mt-6 text-4xl font-black">
            {supporter.full_name || "Supporter"}
          </h2>

          <p className="mt-3 text-2xl font-black text-lime-300">
            {supporter.supporter_id || "Supporter ID Pending"}
          </p>

          <div className="mt-6 space-y-3 rounded-2xl bg-black/20 p-5 text-left">
            <ProfileLine label="Country of Origin" value={countryOfOrigin} />
            <ProfileLine
              label="Country of Residence"
              value={countryOfResidence}
            />
            <ProfileLine label="Member Since" value={memberSince} />
            <ProfileLine
              label="Status"
              value={supporter.status || "Active"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex flex-col gap-1 text-lg md:flex-row md:justify-between">
      <span className="font-bold text-blue-100">{label}</span>
      <span className="font-black text-white">{value}</span>
    </p>
  );
}