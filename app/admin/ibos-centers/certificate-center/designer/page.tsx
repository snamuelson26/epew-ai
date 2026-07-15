"use client";

import Link from "next/link";

export default function CertificateDesignerPage() {
  return (
    <main className="min-h-screen bg-[#eef1f6] p-8 text-[#061b46]">
      <section className="mb-8 rounded-3xl bg-gradient-to-r from-black via-[#061b46] to-green-900 p-10 text-white shadow-2xl">
        <Link
          href="/admin/ibos-centers/certificate-center"
          className="text-lg font-black text-lime-300"
        >
          ← Back to Certificate Center
        </Link>

        <p className="mt-8 text-xl font-black uppercase tracking-[0.4em] text-lime-300">
          IBOS Certificate Designer
        </p>

        <h1 className="mt-4 text-6xl font-extrabold">
          Official Certificate Design Studio
        </h1>

        <p className="mt-4 text-2xl font-bold text-yellow-300">
          Entrepreneur Development Ecosystem
        </p>

        <p className="mt-6 max-w-6xl text-xl leading-relaxed text-blue-100">
          Design and preview the official EPEW Business Launch Certificate with
          QR verification, official seal, certificate number, authentication ID,
          founder signature, president signature, and IBOS certification
          authority.
        </p>
      </section>

      <section className="grid gap-8 xl:grid-cols-[360px_1fr]">
        <DesignerPanel />

        <section className="rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex flex-wrap gap-4">
            <Button label="Save Template" />
            <Button label="Generate Sample" />
            <Button label="Print" />
            <Button label="Export PDF" />
            <Button label="Publish" green />
          </div>

          <OfficialCertificatePreview />
        </section>
      </section>
    </main>
  );
}

function DesignerPanel() {
  return (
    <aside className="rounded-3xl bg-white p-6 shadow-2xl">
      <h2 className="text-3xl font-black text-[#061b46]">
        Design Controls
      </h2>

      <div className="mt-6 space-y-5">
        <Control label="Template" value="Official Annual Meeting" />
        <Control label="Certificate Type" value="Business Launch Certification" />
        <Control label="Theme" value="Black, Gold & Green" />
        <Control label="Seal Position" value="Beside QR Verification" />
        <Control label="Signature Authority" value="Founder • President • IBOS" />
        <Control label="QR Verification" value="Enabled" />
        <Control label="Authentication ID" value="Enabled" />

        <div className="rounded-2xl bg-green-50 p-5">
          <h3 className="text-xl font-black">Official Authority</h3>
          <ul className="mt-4 space-y-3 text-gray-700">
            <li>✅ Samuel Nelson — Founder</li>
            <li>✅ Noslen Leumas — President</li>
            <li>✅ IBOS — Official Certification Authority</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-[#f5f7fb] p-5">
          <h3 className="text-xl font-black">Security</h3>
          <ul className="mt-4 space-y-3 text-gray-700">
            <li>✅ Certificate Number</li>
            <li>✅ Authentication ID</li>
            <li>✅ QR Verification</li>
            <li>✅ Permanent Registry Record</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

function OfficialCertificatePreview() {
  return (
    <div className="mx-auto overflow-x-auto rounded-3xl bg-[#111] p-5 shadow-2xl">
      <div className="relative mx-auto aspect-[16/10] min-w-[1180px] overflow-hidden rounded-[2rem] border-[6px] border-yellow-500 bg-[#fff9ea] shadow-2xl">
        <CertificateHeader />

        <div className="grid grid-cols-[31%_38%_31%] gap-4 px-8 pt-5">
          <EntrepreneurRecognition />
          <BusinessRecognition />
          <CertificateInformation />
        </div>

        <AchievementSummary />

        <EcosystemDefinition />

        <div className="grid grid-cols-[52%_48%] gap-5 px-8 pt-4">
          <CertificationStatement />
          <SignatureAuthority />
        </div>

        <CertificateFooter />
      </div>
    </div>
  );
}

function CertificateHeader() {
  return (
    <header className="relative bg-gradient-to-r from-black via-[#061b46] to-black px-8 py-6 text-center text-white">
      <div className="absolute left-0 top-0 h-full w-28 rounded-br-full bg-green-900/70" />
      <div className="absolute right-0 top-0 h-full w-28 rounded-bl-full bg-green-900/70" />

      <p className="relative text-2xl font-black uppercase tracking-[0.45em] text-green-400">
        EPEW Special Event
      </p>

      <h1 className="relative mt-2 text-5xl font-black uppercase leading-tight text-yellow-300">
        Annual Meeting {"&"}
        <br />
        Business Launch Certification
      </h1>

      <p className="relative mt-3 text-xl font-bold">
        Certified through the{" "}
        <span className="text-green-400">
          EPEW Entrepreneur Development Ecosystem
        </span>
      </p>
    </header>
  );
}

function EntrepreneurRecognition() {
  return (
    <section className="rounded-2xl border-2 border-yellow-600 bg-white/90 p-4 text-center shadow-xl">
      <Ribbon title="Entrepreneur Recognition" />

      <div className="mx-auto mt-4 flex h-44 w-44 items-center justify-center rounded-full border-4 border-yellow-500 bg-[#eef1f6] text-7xl">
        👤
      </div>

      <h2 className="mt-4 font-serif text-4xl font-black uppercase text-green-950">
        Samuel Nelson
      </h2>

      <p className="mt-1 text-lg font-black uppercase text-yellow-700">
        Founder & Entrepreneur
      </p>

      <p className="mt-3 text-xs font-black uppercase text-[#061b46]">
        Entrepreneur ID
      </p>

      <p className="mx-auto mt-1 w-fit rounded-lg bg-green-900 px-5 py-2 text-xl font-black text-white">
        ENT-2026-001
      </p>
    </section>
  );
}

function BusinessRecognition() {
  return (
    <section className="text-center">
      <Ribbon title="Business Recognition" />

      <div className="mx-auto mt-4 flex h-36 w-36 items-center justify-center rounded-2xl border-4 border-green-900 bg-[#f5f7fb] text-7xl">
        🏢
      </div>

      <h2 className="mt-4 text-5xl font-black uppercase tracking-wide text-green-950">
        Kleernest LLC
      </h2>

      <p className="mt-2 text-sm font-black uppercase text-gray-700">
        Business ID
      </p>

      <p className="mx-auto mt-1 w-fit rounded-lg bg-green-900 px-6 py-2 text-xl font-black text-white">
        BUS-2026-001
      </p>

      <p className="mt-3 text-xl font-black uppercase text-green-900">
        Business Launch Certified
      </p>

      <div className="mx-auto mt-4 rounded-xl border-2 border-yellow-500 bg-green-800 px-6 py-4 text-3xl font-black uppercase text-white shadow-xl">
        ✅ Business Launch Certified
      </div>
    </section>
  );
}

function CertificateInformation() {
  return (
    <section className="rounded-2xl border-2 border-yellow-600 bg-white/90 p-4 shadow-xl">
      <Ribbon title="Certificate Information" />

      <div className="mt-4 space-y-2">
        <InfoLine label="Certificate Number" value="BLC-2026-000012" />
        <InfoLine label="Cohort" value="2026-001" />
        <InfoLine label="Community Support Units" value="20 / 20" />
        <InfoLine label="Annual Meeting" value="August 14, 2026" />
        <InfoLine label="Disbursement Begins" value="August 20, 2026" />
        <InfoLine label="Projected Grand Opening" value="September 5, 2026" />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_0.9fr] gap-4">
        <OfficialSeal />

        <div className="rounded-xl border-2 border-green-800 bg-white p-3 text-center">
          <p className="text-sm font-black uppercase text-green-950">
            Scan to Verify
          </p>

          <div className="mx-auto mt-2 flex h-28 w-28 items-center justify-center bg-gray-100 text-6xl">
            ▦
          </div>

          <p className="mt-2 text-sm font-black text-[#061b46]">
            BLC-2026-000012
          </p>

          <p className="mt-1 text-[10px] font-bold text-gray-600">
            ekeropartnersempowerwealth.com/verify/BLC-2026-000012
          </p>
        </div>
      </div>
    </section>
  );
}

function AchievementSummary() {
  return (
    <section className="mx-8 mt-4 rounded-xl border-2 border-yellow-600 bg-white/90 p-3 text-center">
      <p className="mx-auto -mt-7 w-fit rounded-lg bg-gradient-to-r from-green-950 to-yellow-700 px-6 py-2 text-lg font-black uppercase text-white">
        Achievement Summary
      </p>

      <div className="grid grid-cols-4 gap-4">
        <Achievement icon="💼" title="Projected Jobs" value="96" />
        <Achievement icon="🌍" title="Communities Served" value="8" />
        <Achievement icon="👥" title="Community Support Units" value="20" />
        <Achievement icon="🏅" title="Businesses Certified" value="12" />
      </div>
    </section>
  );
}

function EcosystemDefinition() {
  return (
    <section className="mx-8 mt-4 grid grid-cols-3 gap-4 rounded-xl border-2 border-yellow-600 bg-white/90 p-4">
      <EcosystemBox
        icon="⚔️"
        title="EPEW"
        text="Provides the vision, purpose, and mission of the ecosystem."
      />

      <EcosystemBox
        icon="🤝"
        title="EDE"
        text="Develops entrepreneurs into business-ready leaders."
      />

      <EcosystemBox
        icon="🚀"
        title="IBOS"
        text="Coordinates the journey to successful business ownership."
      />
    </section>
  );
}

function CertificationStatement() {
  return (
    <section className="rounded-xl border border-yellow-500 bg-white/90 p-4 text-center">
      <p className="text-sm font-black uppercase text-[#061b46]">
        This certifies that
      </p>

      <p className="mt-1 font-serif text-4xl text-green-950">
        Samuel Nelson
      </p>

      <p className="mt-2 text-sm font-bold leading-relaxed text-gray-700">
        has successfully completed the Entrepreneur Development requirements
        established by the EPEW Entrepreneur Development Ecosystem and has been
        approved for Business Launch Certification. This certification
        authorizes entry into the Business Launch Phase through IBOS operational
        certification.
      </p>
    </section>
  );
}

function SignatureAuthority() {
  return (
    <section className="rounded-xl bg-white/90 p-4 text-center">
      <p className="text-sm font-black uppercase text-[#061b46]">
        Issued under the authority of the Entrepreneur Development Ecosystem
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Signature
          name="Samuel Nelson"
          title="Founder"
          organization="Entrepreneur Development Ecosystem"
        />

        <Signature
          name="Noslen Leumas"
          title="President"
          organization="Ekero Partners Empower Wealth"
        />

        <Signature
          name="IBOS Certification"
          title="Official Certification Authority"
          organization="Verified"
        />
      </div>
    </section>
  );
}

function CertificateFooter() {
  return (
    <footer className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-r from-black via-[#061b46] to-black px-8 py-3 text-white">
      <p className="text-3xl font-black text-green-400">EPEW</p>

      <p className="text-lg font-black uppercase tracking-widest text-yellow-300">
        One Entrepreneur. One Business. One Community at a Time.
      </p>

      <div className="text-right">
        <p className="text-sm font-black text-green-400">Powered by EPEW</p>
        <p className="text-xs font-bold">
          Entrepreneur Development Ecosystem • Business Launch Certification
          Program
        </p>
      </div>
    </footer>
  );
}

function OfficialSeal() {
  return (
    <div className="rounded-full border-4 border-yellow-500 bg-gradient-to-br from-black via-[#061b46] to-green-900 p-4 text-center text-white shadow-xl">
      <p className="text-[10px] font-black uppercase text-yellow-300">
        Entrepreneur Development Ecosystem
      </p>

      <div className="mx-auto mt-2 rounded-full border-2 border-yellow-500 bg-yellow-100 p-3 text-[#061b46]">
        <p className="text-lg font-black">⚔️ EPEW</p>
        <p className="text-lg font-black">🤝 EDE</p>
        <p className="text-lg font-black">🚀 IBOS</p>
      </div>

      <p className="mt-2 text-[10px] font-black uppercase text-yellow-300">
        Developing Entrepreneurs.
        <br />
        Building Businesses.
        <br />
        Strengthening Communities.
      </p>
    </div>
  );
}

function Ribbon({ title }: { title: string }) {
  return (
    <p className="mx-auto w-fit rounded-lg border border-yellow-500 bg-gradient-to-r from-green-950 via-green-800 to-green-950 px-5 py-2 text-sm font-black uppercase tracking-widest text-white shadow">
      {title}
    </p>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1.1fr_1fr] items-center border-b border-yellow-300 pb-2">
      <p className="text-xs font-black uppercase text-gray-700">{label}</p>
      <p className="text-right text-base font-black text-green-950">{value}</p>
    </div>
  );
}

function Achievement({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-xs font-black uppercase text-gray-600">{title}</p>
        <p className="text-3xl font-black text-[#061b46]">{value}</p>
      </div>
    </div>
  );
}

function EcosystemBox({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-4xl">{icon}</div>

      <div>
        <p className="text-3xl font-black text-green-950">{title}</p>
        <p className="text-sm font-bold leading-snug text-gray-700">{text}</p>
      </div>
    </div>
  );
}

function Signature({
  name,
  title,
  organization,
}: {
  name: string;
  title: string;
  organization: string;
}) {
  return (
    <div>
      <div className="mx-auto h-8 w-full border-b-2 border-[#061b46]" />
      <p className="mt-1 font-serif text-xl text-[#061b46]">{name}</p>
      <p className="text-xs font-black uppercase text-[#061b46]">{title}</p>
      <p className="text-[10px] font-bold uppercase text-gray-600">
        {organization}
      </p>
    </div>
  );
}

function Control({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f5f7fb] p-4">
      <p className="text-sm font-black uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-black text-[#061b46]">{value}</p>
    </div>
  );
}

function Button({ label, green }: { label: string; green?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-2xl px-6 py-3 text-lg font-black ${
        green
          ? "bg-green-700 text-white hover:bg-green-800"
          : "bg-[#061b46] text-white hover:bg-blue-900"
      }`}
    >
      {label}
    </button>
  );
}