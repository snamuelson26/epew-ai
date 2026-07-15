import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function PartnersPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 px-8 py-20 text-white">
          <div className="mx-auto max-w-7xl text-center">
            <div className="flex justify-center mb-14">
              <Image
                src="/images/partners-hero.png"
                alt="EPEW Certified Growth Partners"
                width={1400}
                height={850}
                className="rounded-3xl shadow-2xl"
                priority
              />
            </div>

            <p className="text-xl font-black uppercase tracking-widest text-lime-300">
              EPEW Certified Growth Partners
            </p>

            <h1 className="mt-5 text-6xl font-extrabold leading-tight">
              Certified Growth Partners Supporting Entrepreneur Success
            </h1>

            <p className="mx-auto mt-8 max-w-5xl text-3xl leading-relaxed text-blue-100">
              EPEW works with professional partners who help entrepreneurs
              develop, prepare, launch, promote, and grow successful businesses.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-16">
          <div className="rounded-3xl bg-white p-12 shadow-xl">
            <h2 className="text-5xl font-extrabold">
              Entrepreneurs Are Supported by a Professional Ecosystem
            </h2>

            <p className="mt-8 text-3xl leading-relaxed text-gray-700">
              From the moment an entrepreneur is approved, EPEW connects them
              to a coordinated support system. Certified Growth Partners help
              provide the guidance, services, preparation, and visibility needed
              to build a real business.
            </p>

            <p className="mt-8 text-3xl leading-relaxed text-gray-700">
              After the coach introduces the entrepreneur to the appropriate
              professional support, the entrepreneur gains access to service
              requests through the EPEW Professional Service Center.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <PartnerArea
              icon="🏢"
              title="Business Formation Partners"
              text="Help entrepreneurs establish professional business structures correctly from the beginning."
            />

            <PartnerArea
              icon="💰"
              title="Financial & Compliance Partners"
              text="Support entrepreneurs with financial readiness, compliance preparation, accounting, payroll, and tax-related organization."
            />

            <PartnerArea
              icon="📈"
              title="Business Development Partners"
              text="Assist entrepreneurs with planning, organization, readiness, business consulting, and operational development."
            />

            <PartnerArea
              icon="🎨"
              title="Branding & Design Partners"
              text="Help entrepreneurs create a professional business image, including logo, business cards, flyers, brochures, banners, and promotional materials."
            />

            <PartnerArea
              icon="📣"
              title="Promotion & Media Partners"
              text="Help entrepreneurs gain visibility through business promotion, media coverage, social media, community exposure, and launch communication."
            />

            <PartnerArea
              icon="🎉"
              title="Launch & Event Partners"
              text="Support grand opening planning, event setup, business launch activities, community events, and public introduction."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-white p-12 shadow-xl">
            <h2 className="text-5xl font-extrabold">
              How Partners Serve Entrepreneurs
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-4">
              <Step
                number="1"
                title="Coach Review"
                text="The coach identifies the entrepreneur’s needs."
              />

              <Step
                number="2"
                title="Partner Introduction"
                text="EPEW introduces the right professional support."
              />

              <Step
                number="3"
                title="Service Request"
                text="The entrepreneur requests the service through the platform."
              />

              <Step
                number="4"
                title="Service Delivery"
                text="The partner completes the service with progress updates."
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-[#06245c] p-12 text-center text-white shadow-xl">
            <h2 className="text-5xl font-extrabold">
              Partners Strengthen the Ecosystem
            </h2>

            <p className="mx-auto mt-8 max-w-5xl text-3xl leading-relaxed text-blue-100">
              Certified Growth Partners help transform ideas into prepared,
              professional, visible, and sustainable businesses.
            </p>

            <div className="mt-10 space-y-4 text-4xl font-black text-lime-300">
              <p>The entrepreneur brings the vision.</p>
              <p>EPEW provides the ecosystem.</p>
              <p>Partners help strengthen the business.</p>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-5 md:flex-row">
              <Link
                href="/professional-support"
                className="rounded-2xl bg-lime-400 px-10 py-5 text-2xl font-black text-[#06245c] hover:bg-lime-300"
              >
                View Professional Support
              </Link>

              <Link
                href="/partners/register"
                className="rounded-2xl bg-white px-10 py-5 text-2xl font-black text-[#06245c] hover:bg-gray-200"
              >
                Become a Partner
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function PartnerArea({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-10 shadow-xl">
      <div className="text-6xl">{icon}</div>
      <h3 className="mt-5 text-3xl font-extrabold text-[#06245c]">
        {title}
      </h3>
      <p className="mt-5 text-2xl leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-6 shadow-md">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-2xl font-black text-white">
        {number}
      </div>
      <h3 className="mt-5 text-2xl font-extrabold text-[#06245c]">{title}</h3>
      <p className="mt-3 text-lg leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}