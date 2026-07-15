"use client";

import { useState } from "react";
import Link from "next/link";
import OfficialCertificate from "@/app/components/certificates/OfficialCertificate";

export default function CertificateGeneratorPage() {
  const [certificateNumber] = useState("BLC-2026-000021");
  const [authenticationId] = useState("A9K4-D7P2-QX81");

  const entrepreneurData = {
    name: "Samuel Nelson",
    title: "Founder & Entrepreneur",
    entrepreneurId: "ENT-2026-001",
    photoUrl: "",
  };

  const businessData = {
    name: "Kleernest LLC",
    businessId: "BUS-2026-001",
    logoUrl: "",
    projectedJobs: "96+",
    communitiesServed: "8",
    communitySupportUnits: "20 / 20",
    businessesCertified: "12",
  };

  const certificateData = {
    certificateNumber,
    authenticationId,
    cohort: "2026-001",
    annualMeetingDate: "August 14, 2026",
    disbursementDate: "August 20, 2026",
    grandOpeningDate: "September 5, 2026",
    verificationUrl: `/verify/${certificateNumber}`,
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <section className="mb-8 rounded-3xl bg-gradient-to-r from-black via-[#06245c] to-green-800 p-10 text-white shadow-2xl">
        <Link
          href="/admin/ibos-centers/certificate-center"
          className="text-lg font-black text-lime-300"
        >
          ← Back to Certificate Center
        </Link>

        <p className="mt-8 text-xl font-black uppercase tracking-[0.4em] text-lime-300">
          IBOS Certificate Generator
        </p>

        <h1 className="mt-4 text-6xl font-extrabold">
          Generate Official Certificates
        </h1>

        <p className="mt-5 max-w-6xl text-2xl leading-relaxed text-blue-100">
          Select an entrepreneur, business, cohort, and certification type.
          IBOS will assign the certificate number, authentication ID, QR
          verification record, registry entry, and printable certificate.
        </p>
      </section>

      <section className="grid gap-8 xl:grid-cols-[360px_1fr_360px]">
        <aside className="rounded-3xl bg-white p-6 shadow-2xl">
          <h2 className="text-3xl font-black">Certificate Data</h2>

          <div className="mt-6 space-y-5">
            <Field label="Entrepreneur" value={entrepreneurData.name} />
            <Field label="Business" value={businessData.name} />
            <Field label="Certificate Type" value="Business Launch Certification" />
            <Field label="Cohort" value={certificateData.cohort} />
            <Field label="Annual Meeting" value={certificateData.annualMeetingDate} />
            <Field label="Issue Date" value={certificateData.annualMeetingDate} />
          </div>
        </aside>

        <section className="rounded-3xl bg-white p-8 shadow-2xl">
          <h2 className="text-4xl font-black">Live Certificate Preview</h2>

          <div className="mt-8">
            <OfficialCertificate
              entrepreneur={entrepreneurData}
              business={businessData}
              certificate={certificateData}
            />
          </div>
        </section>

        <aside className="rounded-3xl bg-white p-6 shadow-2xl">
          <h2 className="text-3xl font-black">Generation Control</h2>

          <div className="mt-6 space-y-5">
            <InfoBox title="Certificate Number" value={certificateNumber} />
            <InfoBox title="Authentication ID" value={authenticationId} />
            <InfoBox title="Verification URL" value={`/verify/${certificateNumber}`} />
            <InfoBox title="Registry Status" value="Ready to Save" />
          </div>

          <div className="mt-8 space-y-4">
            <ActionButton label="Generate Certificate" green />
            <ActionButton label="Save Registry" />
            <ActionButton label="Print" />
            <ActionButton label="Download PDF" />
            <ActionButton label="Publish Verification" />
          </div>
        </aside>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-lg font-black">{label}</span>
      <input
        value={value}
        readOnly
        className="mt-2 w-full rounded-xl border border-gray-300 bg-[#f5f7fb] p-4 font-bold"
      />
    </label>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f5f7fb] p-5">
      <p className="text-sm font-black uppercase text-gray-500">{title}</p>
      <p className="mt-2 break-words text-lg font-black text-[#06245c]">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  label,
  green,
}: {
  label: string;
  green?: boolean;
}) {
  return (
    <button
      type="button"
      className={`w-full rounded-2xl px-6 py-4 text-lg font-black ${
        green
          ? "bg-green-700 text-white hover:bg-green-800"
          : "bg-[#06245c] text-white hover:bg-blue-900"
      }`}
    >
      {label}
    </button>
  );
}