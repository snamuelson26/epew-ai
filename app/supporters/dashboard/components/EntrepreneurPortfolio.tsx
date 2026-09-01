"use client";

import { SupportCommitment } from "./types";

interface Props {
  commitments: SupportCommitment[];
  selectedBusiness?: any;
}

export default function EntrepreneurPortfolio({
  commitments,
  selectedBusiness,
}: Props) {
  if (
    commitments.length === 0 &&
    !selectedBusiness
  ) {
    return (
      <section className="mb-10">
        <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
          <h2 className="text-5xl font-extrabold text-[#06245c]">
            My Entrepreneurs
          </h2>

          <p className="mx-auto mt-5 max-w-4xl text-2xl leading-relaxed text-gray-700">
            You have not supported an entrepreneur yet. Explore the EPEW
            Marketplace and choose a qualified entrepreneur to begin your
            impact journey.
          </p>

          <a
            href="/supporters/marketplace"
            className="mt-8 inline-block rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-black text-white hover:bg-green-700"
          >
            Explore Marketplace
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="rounded-3xl bg-white p-10 shadow-2xl">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          My Entrepreneurs
        </h2>

        <p className="mt-4 text-2xl leading-relaxed text-gray-700">
          View entrepreneurs you selected to support and businesses already
          connected to your EPEW participation.
        </p>

        <div className="mt-10 grid gap-8 xl:grid-cols-2">
          {selectedBusiness ? (
            <SelectedBusinessCard
              business={selectedBusiness}
            />
          ) : null}

          {commitments.map((item) => (
            <PortfolioCard
              key={item.id}
              item={item}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SelectedBusinessCard({
  business,
}: {
  business: any;
}) {
  const businessId =
    business.public_business_id || "";

  const businessName =
    business.business_name ||
    "Business";

  const entrepreneurName =
    business.full_name ||
    "EPEW Entrepreneur";

  const entrepreneurPhoto =
    business.entrepreneur_photo ||
    business.entrepreneur_photo_url ||
    business.photo_url ||
    "";

  const businessLogo =
    business.business_logo ||
    business.business_logo_url ||
    business.logo_url ||
    "";

  return (
    <div className="rounded-3xl border-2 border-green-300 bg-green-50 p-8 shadow-lg">
      <div className="mb-6 inline-flex rounded-full bg-green-700 px-5 py-2 text-sm font-black uppercase tracking-wider text-white">
        Ready to Support
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-[#06245c] text-6xl text-white shadow-lg">
          {entrepreneurPhoto ? (
            <img
              src={entrepreneurPhoto}
              alt={entrepreneurName}
              className="h-full w-full object-cover"
            />
          ) : (
            "👤"
          )}
        </div>

        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-white text-6xl shadow-lg">
          {businessLogo ? (
            <img
              src={businessLogo}
              alt={businessName}
              className="h-full w-full object-contain p-3"
            />
          ) : (
            "🏢"
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-4xl font-black text-[#06245c]">
            {businessName}
          </h3>

          <p className="mt-2 text-xl font-black text-green-700">
            Business ID: {businessId}
          </p>

          <p className="mt-2 text-2xl text-gray-700">
            {entrepreneurName}
          </p>

          <p className="mt-1 text-lg font-bold uppercase tracking-wide text-gray-500">
            Selected Entrepreneur
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5">
        <p className="text-lg leading-relaxed text-gray-700">
          You selected this entrepreneur for support. Review the business and
          choose your Support Units when you are ready.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href={`/support/${businessId}/checkout`}
          className="rounded-2xl bg-green-700 px-8 py-4 text-xl font-black text-white hover:bg-[#06245c]"
        >
          Support This Entrepreneur
        </a>

        <a
          href={`/business/${businessId}`}
          className="rounded-2xl border-2 border-[#06245c] px-8 py-4 text-xl font-black text-[#06245c] hover:bg-[#06245c] hover:text-white"
        >
          View This Business
        </a>
      </div>
    </div>
  );
}

function PortfolioCard({ item }: { item: SupportCommitment }) {
  const businessId =
    item.public_business_id || item.entrepreneur_id || "Business ID Pending";

  const businessName = item.business_name || "Business Name Pending";
  const entrepreneurName = item.entrepreneur_name || "Entrepreneur Pending";

  const openingDate = item.business_opening_date
    ? new Date(item.business_opening_date).toLocaleDateString()
    : "Pending Annual Meeting Schedule";

  return (
    <div className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-8 shadow-lg">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-[#06245c] text-6xl text-white shadow-lg">
          {item.entrepreneur_photo_url ? (
            <img
              src={item.entrepreneur_photo_url}
              alt={entrepreneurName}
              className="h-full w-full object-cover"
            />
          ) : (
            "👤"
          )}
        </div>

        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-white text-6xl shadow-lg">
          {item.business_logo_url ? (
            <img
              src={item.business_logo_url}
              alt={businessName}
              className="h-full w-full object-contain p-4"
            />
          ) : (
            "🏢"
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-4xl font-black text-[#06245c]">
            {businessName}
          </h3>

          <p className="mt-2 text-xl font-black text-green-700">
            Business ID: {businessId}
          </p>

          <p className="mt-2 text-2xl text-gray-700">
            {entrepreneurName}
          </p>

          <p className="mt-1 text-lg font-bold uppercase tracking-wide text-gray-500">
            Founder & Entrepreneur
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <InfoBox
          label="Business Status"
          value={item.business_status || "In Development"}
        />

        <InfoBox
          label="Community Served"
          value={item.community || item.country || "Community Pending"}
        />

        <InfoBox label="Opening Date" value={openingDate} />

        <InfoBox label="My Units" value={`${item.units || 0}`} />
      </div>

      <div className="mt-8 rounded-3xl bg-white p-6">
        <h4 className="text-2xl font-extrabold text-[#06245c]">
          Supporting Information
        </h4>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MiniInfo
            label="Support Type"
            value={item.support_type || "Pending"}
          />

          <MiniInfo
            label="Contribution"
            value={`$${Number(item.amount || 0).toLocaleString()}`}
          />

          <MiniInfo
            label="Payment Status"
            value={item.payment_status || "Pending"}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href={`/supporters/businesses/${businessId}`}
          className="rounded-2xl bg-[#06245c] px-8 py-4 text-xl font-black text-white hover:bg-green-700"
        >
          View Impact Details
        </a>

        <a
          href={`/business/${businessId}`}
          className="rounded-2xl border-2 border-[#06245c] px-8 py-4 text-xl font-black text-[#06245c] hover:bg-[#06245c] hover:text-white"
        >
          Public Business Page
        </a>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold text-[#06245c]">
        {value}
      </p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f5f7fb] p-4">
      <p className="text-sm font-bold text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-black text-[#06245c]">{value}</p>
    </div>
  );
}