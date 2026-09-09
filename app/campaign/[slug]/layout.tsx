"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import CampaignLocalization from "./CampaignLocalization";

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = String(params?.slug || "").toUpperCase();
  const isFoodFans = slug === "FFR-001" || slug === "27";

  const businessLogo = isFoodFans
    ? "/images/businesses/food-fans-restaurant-logo.png"
    : "/images/epew-ede-ibos-logo.png";

  const headerPhoto = isFoodFans
    ? "/images/businesses/samuel-nelson-entrepreneur-photo.jpg"
    : "/images/entrepreneur-hero.png";

  return (
    <CampaignLocalization>
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-20 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Image
                src={businessLogo}
                alt="Business logo"
                fill
                className="object-contain p-1"
                sizes="80px"
                priority
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-green-700">
                EPEW Entrepreneur Campaign
              </p>
              <p className="text-lg font-black text-blue-950">
                Build Your Community. Build Your Business. Build Your Wealth.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pr-24 md:pr-20">
            <Link
              href="/entrepreneurs/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-blue-950 px-5 py-3 font-black text-white transition hover:bg-blue-800"
            >
              ← Back to Entrepreneur Portal
            </Link>
            <Link
              href="/entrepreneurs/communication"
              className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-black text-white transition hover:bg-green-800"
            >
              Communication Center
            </Link>
          </div>
        </div>

        <div className="relative mx-auto h-56 max-w-7xl overflow-hidden md:h-72">
          <Image
            src={headerPhoto}
            alt="Entrepreneur campaign header"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/65 via-blue-900/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
            <p className="max-w-2xl text-xl font-black drop-shadow md:text-3xl">
              Entrepreneur Campaign
            </p>
          </div>
        </div>
      </header>
      {children}
    </CampaignLocalization>
  );
}
