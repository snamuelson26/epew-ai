"use client";

const stats = [
  { title: "Certificates Issued", value: "0", icon: "📜" },
  { title: "Business Launch Certificates", value: "0", icon: "🚀" },
  { title: "Certificates Verified", value: "0", icon: "✅" },
  { title: "Pending Certificates", value: "0", icon: "⏳" },
  { title: "Archived Certificates", value: "0", icon: "🗄️" },
  { title: "Public Verifications Today", value: "0", icon: "🌐" },
];

const centers = [
  {
    title: "Certificate Designer",
    icon: "🎨",
    description: "Design official EPEW certificates, seals, layouts, and certificate styles.",
    href: "/admin/ibos-centers/certificate-center/designer",
  },
  {
    title: "Certificate Generator",
    icon: "⚙️",
    description: "Generate certificates automatically from entrepreneur, business, and cohort records.",
    href: "/admin/ibos-centers/certificate-center/generator",
  },
  {
    title: "Certificate Registry",
    icon: "📚",
    description: "Search, review, and manage every certificate issued through IBOS.",
    href: "/admin/ibos-centers/certificate-center/registry",
  },
  {
    title: "QR Verification",
    icon: "✅",
    description: "Generate QR codes and verify certificate authenticity.",
    href: "/admin/ibos-centers/certificate-center/qr-verification",
  },
  {
    title: "Print & PDF",
    icon: "🖨️",
    description: "Export high-quality printable certificates and PDF records.",
    href: "/admin/ibos-centers/certificate-center/print",
  },
  {
    title: "Live Display",
    icon: "🎥",
    description: "Display certificates during Annual Meeting ceremonies and live broadcasts.",
    href: "/admin/ibos-centers/certificate-center/live-display",
  },
  {
    title: "Public Verification",
    icon: "🌐",
    description: "Manage public certificate verification pages and lookup tools.",
    href: "/admin/ibos-centers/certificate-center/public-verification",
  },
  {
    title: "Certificate Archive",
    icon: "🗄️",
    description: "Preserve the permanent historical record of all official EPEW certifications.",
    href: "/admin/ibos-centers/certificate-center/archive",
  },
];

const futureCertificates = [
  "Business Launch Certification",
  "Coach Certification",
  "Partner Certification",
  "Community Recognition",
  "Entrepreneur Excellence Award",
  "Lifetime Achievement Award",
  "Institutional Accreditation",
];

export default function CertificateCenterPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <section className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-black via-[#06245c] to-green-800 p-12 text-white shadow-2xl">
        <p className="text-xl font-black uppercase tracking-[0.4em] text-lime-300">
          IBOS Certificate Center
        </p>

        <h1 className="mt-5 text-6xl font-extrabold leading-tight">
          Official Certification Authority
        </h1>

        <p className="mt-5 max-w-5xl text-3xl font-bold text-yellow-300">
          Entrepreneur Development Ecosystem
        </p>

        <p className="mt-8 max-w-6xl text-2xl leading-relaxed text-blue-100">
          Generate, certify, verify, display, print, and permanently archive
          every official certificate issued through the EPEW Entrepreneur
          Development Ecosystem.
        </p>
      </section>

      <section className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-6">
        {stats.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </section>

      <section className="mb-10 rounded-3xl bg-white p-10 shadow-2xl">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          Main Centers
        </h2>

        <p className="mt-4 text-2xl leading-relaxed text-gray-700">
          Every major certification function is organized as an IBOS Center.
          Dashboards provide visibility. IBOS Centers provide operational
          capability.
        </p>

        <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
          {centers.map((center) => (
            <CenterCard key={center.title} center={center} />
          ))}
        </div>
      </section>

      <section className="mb-10 grid gap-8 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-3xl bg-white p-10 shadow-2xl">
          <h2 className="text-5xl font-extrabold text-[#06245c]">
            Official Certification Philosophy
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <PhilosophyCard
              icon="⚔️"
              title="EPEW"
              text="Provides the vision, purpose, and mission of the ecosystem."
            />

            <PhilosophyCard
              icon="🤝"
              title="EDE"
              text="Develops entrepreneurs into business-ready leaders."
            />

            <PhilosophyCard
              icon="🚀"
              title="IBOS"
              text="Coordinates the journey from entrepreneur development to successful business ownership."
            />
          </div>

          <div className="mt-10 rounded-3xl bg-green-50 p-8">
            <h3 className="text-3xl font-extrabold text-[#06245c]">
              Official Certification Statement
            </h3>

            <p className="mt-4 text-xl leading-relaxed text-gray-700">
              This certificate recognizes successful completion of the
              Entrepreneur Development requirements of the EPEW Entrepreneur
              Development Ecosystem and authorizes entry into the Business
              Launch Phase through IBOS operational certification.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-black via-[#06245c] to-green-800 p-10 text-white shadow-2xl">
          <h2 className="text-4xl font-extrabold text-yellow-300">
            Official Seal Preview
          </h2>

          <div className="mt-8 rounded-full border-8 border-yellow-400 bg-white p-8 text-center text-[#06245c] shadow-2xl">
            <p className="text-sm font-black uppercase tracking-widest">
              Entrepreneur Development Ecosystem
            </p>

            <div className="mx-auto mt-6 flex h-44 w-44 items-center justify-center rounded-full border-4 border-[#06245c] bg-[#f5f7fb]">
              <div>
                <p className="text-2xl font-black">⚔️ EPEW</p>
                <p className="mt-2 text-2xl font-black">🤝 EDE</p>
                <p className="mt-2 text-2xl font-black">🚀 IBOS</p>
              </div>
            </div>

            <p className="mt-6 text-lg font-black leading-relaxed">
              Developing Entrepreneurs.
              <br />
              Building Businesses.
              <br />
              Strengthening Communities.
            </p>
          </div>

          <p className="mt-8 text-xl leading-relaxed text-blue-100">
            The EPEW Seal of Certification appears beside the QR verification
            code on every official certificate, plaque, recognition award, and
            future accreditation.
          </p>
        </div>
      </section>

      <section className="mb-10 rounded-3xl bg-white p-10 shadow-2xl">
        <h2 className="text-5xl font-extrabold text-[#06245c]">
          Future Certificate Types
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {futureCertificates.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-gray-200 bg-[#f5f7fb] p-6 shadow"
            >
              <p className="text-xl font-black text-[#06245c]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-[#06245c] p-10 text-white shadow-2xl">
        <h2 className="text-5xl font-extrabold">Quick Actions</h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3 xl:grid-cols-6">
          <QuickAction label="Generate Certificate" />
          <QuickAction label="Verify Certificate" />
          <QuickAction label="Print PDF" />
          <QuickAction label="Open Live Display" />
          <QuickAction label="Search Registry" />
          <QuickAction label="View Archive" />
        </div>
      </section>
    </main>
  );
}

function StatCard({
  item,
}: {
  item: { title: string; value: string; icon: string };
}) {
  return (
    <div className="rounded-3xl border-t-8 border-green-600 bg-white p-6 text-center shadow-xl">
      <div className="text-5xl">{item.icon}</div>
      <p className="mt-4 text-lg font-bold text-gray-600">{item.title}</p>
      <p className="mt-3 text-5xl font-black text-[#06245c]">{item.value}</p>
    </div>
  );
}

function CenterCard({
  center,
}: {
  center: {
    title: string;
    icon: string;
    description: string;
    href: string;
  };
}) {
  return (
    <a
      href={center.href}
      className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="text-6xl">{center.icon}</div>

      <h3 className="mt-6 text-3xl font-extrabold text-[#06245c]">
        {center.title}
      </h3>

      <p className="mt-4 text-lg leading-relaxed text-gray-700">
        {center.description}
      </p>

      <p className="mt-6 text-lg font-black text-green-700">
        Open Center →
      </p>
    </a>
  );
}

function PhilosophyCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-7 text-center shadow">
      <div className="text-6xl">{icon}</div>

      <h3 className="mt-5 text-4xl font-black text-[#06245c]">{title}</h3>

      <p className="mt-4 text-xl leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}

function QuickAction({ label }: { label: string }) {
  return (
    <button className="rounded-2xl bg-white px-6 py-4 text-lg font-black text-[#06245c] hover:bg-lime-300">
      {label}
    </button>
  );
}