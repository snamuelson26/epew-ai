"use client";

type OfficialCertificateProps = {
  entrepreneur?: {
    name?: string;
    title?: string;
    entrepreneurId?: string;
    photoUrl?: string;
  };
  business?: {
    name?: string;
    businessId?: string;
    logoUrl?: string;
    projectedJobs?: number | string;
    communitiesServed?: number | string;
    communitySupportUnits?: number | string;
    businessesCertified?: number | string;
  };
  certificate?: {
    certificateNumber?: string;
    authenticationId?: string;
    cohort?: string;
    annualMeetingDate?: string;
    disbursementDate?: string;
    grandOpeningDate?: string;
    verificationUrl?: string;
  };
};

export default function OfficialCertificate({
  entrepreneur = {},
  business = {},
  certificate = {},
}: OfficialCertificateProps) {
  const data = {
    entrepreneur: {
      name: entrepreneur.name || "Samuel Nelson",
      title: entrepreneur.title || "Founder & Entrepreneur",
      entrepreneurId: entrepreneur.entrepreneurId || "ENT-2026-001",
      photoUrl: entrepreneur.photoUrl || "",
    },
    business: {
      name: business.name || "Kleernest LLC",
      businessId: business.businessId || "BUS-2026-001",
      logoUrl: business.logoUrl || "",
      projectedJobs: business.projectedJobs || "96+",
      communitiesServed: business.communitiesServed || "8",
      communitySupportUnits: business.communitySupportUnits || "20 / 20",
      businessesCertified: business.businessesCertified || "12",
    },
    certificate: {
      certificateNumber: certificate.certificateNumber || "BLC-2026-000012",
      authenticationId: certificate.authenticationId || "A9K4-D7P2-QX81",
      cohort: certificate.cohort || "2026-001",
      annualMeetingDate: certificate.annualMeetingDate || "August 14, 2026",
      disbursementDate: certificate.disbursementDate || "August 20, 2026",
      grandOpeningDate: certificate.grandOpeningDate || "September 5, 2026",
      verificationUrl:
        certificate.verificationUrl ||
        "ekeropartnersempowerwealth.com/verify/BLC-2026-000012",
    },
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] overflow-x-auto rounded-[2rem] bg-[#080808] p-6 shadow-2xl">
      <div className="relative mx-auto aspect-[16/10] min-w-[1180px] overflow-hidden rounded-[2rem] border-[8px] border-[#d4af37] bg-[#f6ecd1] shadow-[0_0_45px_rgba(212,175,55,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45),rgba(246,236,209,0.85)),linear-gradient(135deg,rgba(120,90,35,0.14),transparent_35%,rgba(120,90,35,0.16))]" />
        <div className="absolute inset-5 rounded-[1.5rem] border-2 border-[#b8860b]" />
        <div className="absolute inset-8 rounded-[1.2rem] border border-[#d4af37]/70" />

        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-[190px] font-black text-[#0b3b2e]/[0.045]">
          EPEW
        </div>

        <CertificateHeader />

        <div className="relative z-10 grid grid-cols-[30%_40%_30%] gap-5 px-10 pt-6">
          <EntrepreneurRecognition entrepreneur={data.entrepreneur} />
          <BusinessRecognition business={data.business} />
          <CertificateInformation data={data} />
        </div>

        <AchievementSummary business={data.business} />

        <EcosystemDefinition />

        <div className="relative z-10 grid grid-cols-[52%_48%] gap-5 px-10 pt-4">
          <CertificationStatement entrepreneur={data.entrepreneur} />
          <SignatureAuthority />
        </div>

        <CertificateFooter certificate={data.certificate} />
      </div>
    </div>
  );
}

function CertificateHeader() {
  return (
    <header className="relative z-10 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.22),transparent_40%),linear-gradient(135deg,#020202,#07172f_45%,#020202)] px-10 py-6 text-center text-white">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#f6d66b] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#f6d66b] to-transparent" />

      <p className="text-lg font-black uppercase tracking-[0.55em] text-[#49d17c]">
        EPEW Special Event
      </p>

      <h1 className="mt-2 font-serif text-6xl font-black uppercase leading-[0.95] tracking-wide text-[#f6d66b] drop-shadow">
        Annual Meeting
        <br />
        Business Launch Certification
      </h1>

      <p className="mt-3 text-lg font-bold uppercase tracking-[0.2em] text-white">
        Certified Through The Entrepreneur Development Ecosystem
      </p>

      <div className="mx-auto mt-4 flex w-[620px] items-center justify-center gap-4">
        <div className="h-[1px] flex-1 bg-[#d4af37]" />
        <span className="text-2xl text-[#f6d66b]">◆</span>
        <div className="h-[1px] flex-1 bg-[#d4af37]" />
      </div>
    </header>
  );
}

function EntrepreneurRecognition({ entrepreneur }: any) {
  return (
    <section className="text-center">
      <Ribbon title="Entrepreneur Recognition" />

      <div className="mx-auto mt-4 flex h-44 w-44 items-center justify-center overflow-hidden rounded-full border-[6px] border-[#d4af37] bg-white shadow-xl">
        {entrepreneur.photoUrl ? (
          <img
            src={entrepreneur.photoUrl}
            alt={entrepreneur.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-7xl">👤</span>
        )}
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-[#07172f]">
        This Certificate Is Proudly Presented To
      </p>

      <h2 className="mt-2 font-serif text-4xl font-black uppercase leading-tight text-[#0b3b2e]">
        {entrepreneur.name}
      </h2>

      <p className="mt-2 text-base font-black uppercase text-[#9b6a00]">
        {entrepreneur.title}
      </p>

      <p className="mx-auto mt-3 w-fit rounded-full border border-[#d4af37] bg-[#07172f] px-5 py-2 text-sm font-black uppercase text-[#f6d66b]">
        ID: {entrepreneur.entrepreneurId}
      </p>
    </section>
  );
}

function BusinessRecognition({ business }: any) {
  return (
    <section className="text-center">
      <Ribbon title="Business Recognition" />

      <div className="mx-auto mt-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-[5px] border-[#0b3b2e] bg-white shadow-xl">
        {business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt={business.name}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <span className="text-6xl">🏢</span>
        )}
      </div>

      <h2 className="mt-4 font-serif text-5xl font-black uppercase tracking-wide text-[#07172f]">
        {business.name}
      </h2>

      <p className="mx-auto mt-3 w-fit rounded-full border border-[#d4af37] bg-[#0b3b2e] px-6 py-2 text-sm font-black uppercase text-white">
        Business ID: {business.businessId}
      </p>

      <div className="mx-auto mt-5 w-fit rounded-xl border-2 border-[#d4af37] bg-gradient-to-r from-[#07172f] via-[#0b3b2e] to-[#07172f] px-8 py-3 text-2xl font-black uppercase text-[#f6d66b] shadow-xl">
        Business Launch Certified
      </div>
    </section>
  );
}

function CertificateInformation({ data }: any) {
  return (
    <section>
      <Ribbon title="Certificate Information" />

      <div className="mt-4 rounded-2xl border-2 border-[#d4af37] bg-white/70 p-4 shadow-xl">
        <InfoLine label="Certificate No." value={data.certificate.certificateNumber} />
        <InfoLine label="Authentication ID" value={data.certificate.authenticationId} />
        <InfoLine label="Cohort" value={data.certificate.cohort} />
        <InfoLine label="Annual Meeting" value={data.certificate.annualMeetingDate} />
        <InfoLine label="Disbursement Begins" value={data.certificate.disbursementDate} />
        <InfoLine label="Grand Opening" value={data.certificate.grandOpeningDate} />

        <div className="mt-4 grid grid-cols-[1fr_0.9fr] gap-4">
          <OfficialSeal />

          <div className="rounded-xl border-2 border-[#0b3b2e] bg-white p-3 text-center">
            <p className="text-xs font-black uppercase text-[#07172f]">
              Scan To Verify
            </p>
            <div className="mx-auto mt-2 flex h-24 w-24 items-center justify-center border bg-gray-100 text-5xl">
              ▦
            </div>
            <p className="mt-2 text-xs font-black text-[#07172f]">
              {data.certificate.certificateNumber}
            </p>
            <p className="mt-1 break-all text-[9px] font-bold text-gray-600">
              {data.certificate.verificationUrl}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AchievementSummary({ business }: any) {
  return (
    <section className="relative z-10 mx-10 mt-5 rounded-2xl border-2 border-[#d4af37] bg-white/65 px-5 py-4 text-center shadow-lg">
      <p className="mx-auto -mt-8 w-fit rounded-full bg-[#07172f] px-8 py-2 text-sm font-black uppercase tracking-[0.25em] text-[#f6d66b]">
        Achievement Summary
      </p>

      <div className="grid grid-cols-4 divide-x divide-[#d4af37]">
        <Achievement title="Projected Jobs" value={business.projectedJobs} />
        <Achievement title="Communities Served" value={business.communitiesServed} />
        <Achievement title="Support Units" value={business.communitySupportUnits} />
        <Achievement title="Businesses Certified" value={business.businessesCertified} />
      </div>
    </section>
  );
}

function EcosystemDefinition() {
  return (
    <section className="relative z-10 mx-10 mt-4 grid grid-cols-3 divide-x divide-[#d4af37] rounded-2xl border-2 border-[#d4af37] bg-white/60 p-4">
      <EcosystemBox
        title="EPEW"
        text="Ekero Partners Empower Wealth provides the vision, mission, and community empowerment structure."
      />
      <EcosystemBox
        title="EDE"
        text="Entrepreneur Development Ecosystem prepares entrepreneurs for responsible business ownership."
      />
      <EcosystemBox
        title="IBOS"
        text="Integrated Business Ownership System coordinates certification, launch readiness, and verification."
      />
    </section>
  );
}

function CertificationStatement({ entrepreneur }: any) {
  return (
    <section className="rounded-2xl border-2 border-[#d4af37] bg-white/65 p-4 text-center shadow-lg">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#07172f]">
        Official Certification Statement
      </p>

      <p className="mt-2 font-serif text-3xl font-black text-[#0b3b2e]">
        {entrepreneur.name}
      </p>

      <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-700">
        has successfully completed the Entrepreneur Development requirements
        established by the EPEW Entrepreneur Development Ecosystem and is hereby
        recognized as approved for Business Launch Certification through IBOS
        operational authority.
      </p>
    </section>
  );
}

function SignatureAuthority() {
  return (
    <section className="rounded-2xl border-2 border-[#d4af37] bg-white/65 p-4 text-center shadow-lg">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#07172f]">
        Signature Authority
      </p>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <Signature name="Samuel Nelson" title="Founder" />
        <Signature name="Noslen Leumas" title="President" />
        <Signature name="IBOS Authority" title="Certification Office" />
      </div>
    </section>
  );
}

function CertificateFooter({ certificate }: any) {
  return (
    <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between bg-[linear-gradient(135deg,#020202,#07172f_50%,#020202)] px-10 py-3 text-white">
      <p className="font-serif text-3xl font-black text-[#f6d66b]">EPEW</p>

      <p className="text-sm font-black uppercase tracking-[0.25em] text-[#49d17c]">
        One Entrepreneur. One Business. One Community at a Time.
      </p>

      <div className="text-right text-xs font-bold">
        <p className="text-[#f6d66b]">Certificate No. {certificate.certificateNumber}</p>
        <p>Authentication ID {certificate.authenticationId}</p>
      </div>
    </footer>
  );
}

function OfficialSeal() {
  return (
    <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-[5px] border-[#d4af37] bg-[radial-gradient(circle,#f6d66b,#b8860b_55%,#07172f)] p-3 text-center text-[#07172f] shadow-xl">
      <p className="text-[9px] font-black uppercase">Official Seal</p>
      <p className="font-serif text-2xl font-black">EPEW</p>
      <p className="text-[9px] font-black uppercase">EDE • IBOS</p>
      <p className="mt-1 text-[8px] font-black uppercase">Verified</p>
    </div>
  );
}

function Ribbon({ title }: { title: string }) {
  return (
    <p className="mx-auto w-fit rounded-full border border-[#d4af37] bg-gradient-to-r from-[#07172f] via-[#0b3b2e] to-[#07172f] px-5 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#f6d66b] shadow">
      {title}
    </p>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_1.1fr] items-center border-b border-[#d4af37]/60 py-1.5">
      <p className="text-[10px] font-black uppercase text-gray-600">{label}</p>
      <p className="text-right text-sm font-black text-[#07172f]">{value}</p>
    </div>
  );
}

function Achievement({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="px-3 text-center">
      <p className="text-3xl font-black text-[#07172f]">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wide text-gray-600">
        {title}
      </p>
    </div>
  );
}

function EcosystemBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="px-5 text-center">
      <p className="font-serif text-3xl font-black text-[#0b3b2e]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-snug text-gray-700">
        {text}
      </p>
    </div>
  );
}

function Signature({ name, title }: { name: string; title: string }) {
  return (
    <div>
      <div className="mx-auto h-8 border-b-2 border-[#07172f]" />
      <p className="mt-1 font-serif text-lg font-bold text-[#07172f]">{name}</p>
      <p className="text-[10px] font-black uppercase tracking-wide text-gray-600">
        {title}
      </p>
    </div>
  );
}