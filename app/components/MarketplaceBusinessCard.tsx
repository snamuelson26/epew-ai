"use client";

import Link from "next/link";

export default function MarketplaceBusinessCard({
  business,
  supporter,
}: {
  business: any;
  supporter?: any;
}) {
  const businessName = business.business_name || "Business Name Coming Soon";

  const entrepreneurName =
    business.full_name || business.name || "Entrepreneur Name Coming Soon";

 const businessId = business.public_business_id || "EPEW-26-000001";

const publicBusinessUrl = `/business/${businessId}`;

const supportUrl = `/support/${businessId}`;

  const category = business.business_category || "Community Business";

  const description =
    business.business_description ||
    business.product_or_service ||
    "This qualified entrepreneur is preparing a business presentation for community support through the EPEW ecosystem.";

  const unitsRequired = Number(business.units_required || 20);
  const unitsSupported = Number(business.units_supported || 0);
  const remainingUnits = Math.max(unitsRequired - unitsSupported, 0);

  const progress =
    unitsRequired > 0
      ? Math.min(Math.round((unitsSupported / unitsRequired) * 100), 100)
      : 0;

  const fundingGoal = Number(business.funding_goal ?? 100000);

  return (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-gray-200">
      <div className="bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 px-6 py-8 text-center">
        <div className="mx-auto inline-flex items-center gap-4 rounded-full bg-lime-300 px-8 py-4 text-2xl font-black text-[#06245c] shadow-lg">
          <span>⭐</span>
          <span>EPEW Qualified Entrepreneur</span>
        </div>
      </div>

      <div className="grid gap-8 px-8 py-10 lg:grid-cols-[320px_1fr_320px] lg:items-center">
        <div className="flex justify-center">
          <div className="flex h-72 w-72 items-center justify-center overflow-hidden rounded-3xl bg-[#06245c] shadow-xl ring-4 ring-white">
            {business.photo_url || business.profile_photo_url ? (
              <img
                src={business.photo_url || business.profile_photo_url}
                alt={entrepreneurName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-9xl text-white">👤</span>
            )}
          </div>
        </div>

        <div className="text-center lg:text-left">
          <h2 className="text-5xl font-black text-[#06245c] md:text-6xl">
            {businessName}
          </h2>

          <p className="mt-4 inline-flex rounded-full bg-blue-50 px-5 py-2 text-lg font-black text-[#06245c]">
            Business ID: {businessId}
          </p>

          <div className="my-6 h-1 w-full rounded-full bg-green-500" />

          <h3 className="text-4xl font-black text-[#06245c]">
            {entrepreneurName}
          </h3>

          <p className="mt-3 text-2xl font-black uppercase tracking-wide text-green-700">
            Founder & Entrepreneur
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 lg:justify-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              👥
            </div>

            <p className="max-w-xl text-xl leading-relaxed text-gray-700">
              Member of the Entrepreneur Development Ecosystem
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex h-72 w-72 flex-col items-center justify-center rounded-3xl border-2 border-blue-100 bg-white p-6 text-center shadow-lg">
            {business.business_logo_url || business.logo_url ? (
              <img
                src={business.business_logo_url || business.logo_url}
                alt={`${businessName} logo`}
                className="max-h-40 max-w-40 object-contain"
              />
            ) : (
              <>
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-50 text-7xl">
                  🏢
                </div>

                <p className="mt-6 text-3xl font-black text-[#06245c]">
                  Business Logo
                </p>

                <p className="mt-1 text-xl font-black uppercase text-[#06245c]">
                  Coming Soon
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 pb-10">
        <div className="grid gap-5 rounded-3xl border border-blue-100 bg-[#f7faff] p-6 md:grid-cols-4">
          <TrustItem
            icon="✅"
            title="Qualified & Verified"
            text="Reviewed and approved by EPEW."
          />

          <TrustItem
            icon="🤝"
            title="Prepared for Growth"
            text="Supported with coaching and guidance."
          />

          <TrustItem
            icon="🎯"
            title="Community Impact"
            text="Committed to creating local opportunities."
          />

          <TrustItem
            icon="💚"
            title="Support Creates Opportunity"
            text="Together we build stronger communities."
          />
        </div>

        <div className="mt-8 grid gap-6 rounded-3xl bg-[#f5f7fb] p-8 md:grid-cols-3">
          <InfoBox title="Business Category" value={category} />

          <InfoBox
            title="Business Funding Goal"
            value={`$${fundingGoal.toLocaleString()}`}
          />

          <InfoBox
            title="Units Remaining"
            value={`${remainingUnits} of ${unitsRequired}`}
          />
        </div>

        <div className="mt-8">
          <div className="mb-3 flex justify-between text-lg font-bold text-gray-700">
            <span>Funding Progress</span>
            <span>{progress}%</span>
          </div>

          <div className="h-5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-600"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-3 text-lg font-semibold text-gray-700">
            {unitsSupported} of {unitsRequired} units supported
          </p>
        </div>

        <p className="mt-8 text-2xl leading-relaxed text-gray-700">
          {description}
        </p>

        <div className="mt-10 flex flex-col gap-4 md:flex-row">
          <Link
            href={publicBusinessUrl}
            className="flex-1 rounded-2xl bg-[#06245c] px-8 py-5 text-center text-xl font-black text-white shadow-lg hover:bg-[#0b3b91]"
          >
            View Business
          </Link>

          <Link
            href={supportUrl}
            className="flex-1 rounded-2xl bg-green-600 px-8 py-5 text-center text-xl font-black text-white shadow-lg hover:bg-green-700"
          >
            Support This Business
          </Link>
        </div>
      </div>
    </div>
  );
}

function TrustItem({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="text-5xl">{icon}</div>

      <div>
        <h4 className="text-lg font-black uppercase text-[#06245c]">{title}</h4>
        <p className="mt-2 text-base leading-relaxed text-gray-700">{text}</p>
      </div>
    </div>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow">
      <p className="text-lg font-bold text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-black text-[#06245c]">{value}</p>
    </div>
  );
}