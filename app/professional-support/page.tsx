import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function ProfessionalSupportPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 px-8 py-20 text-white">
          <div className="mx-auto max-w-7xl text-center">
            <p className="text-xl font-black uppercase tracking-widest text-lime-300">
              EPEW Professional Support Center
            </p>

            <h1 className="mt-5 text-6xl font-extrabold leading-tight">
              Professional Support for Every Stage of Business Development
            </h1>

            <p className="mx-auto mt-8 max-w-5xl text-3xl leading-relaxed text-blue-100">
              Every successful business begins with an idea. EPEW helps
              entrepreneurs develop that idea into a structured, professional,
              funded, and sustainable business.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-16">
          <div className="rounded-3xl bg-white p-12 shadow-xl">
            <h2 className="text-5xl font-extrabold">
              Develop Your Idea. Build Your Business. Create Wealth.
            </h2>

            <p className="mt-8 text-3xl leading-relaxed text-gray-700">
              What makes a successful business is the development of the idea.
              EPEW assists entrepreneurs by providing structure, professional
              guidance, coordinated support, and access to resources that help
              them prepare, launch, and grow their businesses with confidence.
            </p>

            <p className="mt-8 text-3xl leading-relaxed text-gray-700">
              Through the Entrepreneur Development Ecosystem, entrepreneurs are
              connected to the right guidance, tools, people, and services
              needed to move from vision to business readiness.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <SupportCard
              icon="🏢"
              title="Business Formation"
              text="We help entrepreneurs establish professional businesses correctly from the beginning, providing a strong foundation to build on."
            />

            <SupportCard
              icon="💰"
              title="Financial Services"
              text="Professional financial support is designed to prepare your business for long-term success and improve readiness for future funding opportunities."
            />

            <SupportCard
              icon="📈"
              title="Business Development"
              text="Our ecosystem helps entrepreneurs strengthen their ideas, organize their operations, and move from concept to business readiness."
            />

            <SupportCard
              icon="🎨"
              title="Branding & Business Identity"
              text="A strong business needs a professional identity. EPEW helps entrepreneurs present their business with confidence and credibility."
            />

            <SupportCard
              icon="📣"
              title="Marketing & Community Visibility"
              text="Entrepreneurs receive support to become visible, connect with their community, and build awareness around their business."
            />

            <SupportCard
              icon="🎉"
              title="Business Launch Support"
              text="Launching a business is a major milestone. EPEW helps entrepreneurs prepare for a professional opening and public introduction."
            />

            <SupportCard
              icon="🎥"
              title="Media & Digital Presence"
              text="Entrepreneurs receive support to share their story, present their business online, and build a permanent digital business presence."
            />

            <SupportCard
              icon="🤝"
              title="Community Support"
              text="EPEW helps entrepreneurs build a community of Founding Supporters who believe in their vision and want to be part of their story."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-white p-12 shadow-xl">
            <h2 className="text-5xl font-extrabold">
              Your Coach Leads the Way
            </h2>

            <p className="mt-8 text-3xl leading-relaxed text-gray-700">
              Your assigned coach serves as your primary guide throughout your
              EPEW journey. After learning about your business goals, your coach
              introduces you to the appropriate professional support and helps
              coordinate the services that best fit your needs.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-4">
              <Step
                number="1"
                title="Approval"
                text="You are approved as an EPEW entrepreneur."
              />
              <Step
                number="2"
                title="Coach"
                text="A coach guides your next steps."
              />
              <Step
                number="3"
                title="Support"
                text="You are introduced to professional support."
              />
              <Step
                number="4"
                title="Growth"
                text="Your business develops with structure."
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-white p-12 shadow-xl">
            <h2 className="text-5xl font-extrabold">
              The EPEW Development Model
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-5">
              <Step
                number="1"
                title="Idea"
                text="The entrepreneur brings the idea."
              />
              <Step
                number="2"
                title="Develop"
                text="EPEW develops the idea."
              />
              <Step
                number="3"
                title="Prepare"
                text="EPEW prepares the entrepreneur and connects them with funding."
              />
              <Step
                number="4"
                title="EDE"
                text="EPEW provides the Entrepreneur Development Ecosystem."
              />
              <Step
                number="5"
                title="IBOS"
                text="IBOS coordinates the journey toward readiness and funding."
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="rounded-3xl bg-[#06245c] p-12 text-center text-white shadow-xl">
            <h2 className="text-5xl font-extrabold">Our Commitment</h2>

            <div className="mt-10 space-y-4 text-4xl font-black text-lime-300">
              <p>You bring the vision.</p>
              <p>We develop the idea.</p>
              <p>We provide the ecosystem.</p>
              <p>We prepare you and connect you with the funding needed.</p>
            </div>

            <p className="mx-auto mt-10 max-w-5xl text-2xl leading-relaxed text-blue-100">
              Together, we build successful businesses, strengthen communities,
              and create lasting wealth.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-5 md:flex-row">
              <Link
                href="/entrepreneurs"
                className="rounded-2xl bg-lime-400 px-10 py-5 text-2xl font-black text-[#06245c] hover:bg-lime-300"
              >
                Become an Entrepreneur
              </Link>

              <Link
                href="/how-it-works"
                className="rounded-2xl bg-white px-10 py-5 text-2xl font-black text-[#06245c] hover:bg-gray-200"
              >
                Learn How EPEW Works
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function SupportCard({
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
      <h3 className="mt-5 text-3xl font-extrabold text-[#06245c]">{title}</h3>
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