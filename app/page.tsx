import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F8F2] text-[#0D1B5E]">

      {/* NAVBAR */}
      <nav className="bg-[#0D1B5E] text-white px-8 md:px-14 py-6 flex items-center justify-between">

        <Image
          src="/images/epew-logo.png"
          alt="EPEW Logo"
          width={230}
          height={90}
          className="h-auto"
        />

        <div className="hidden md:flex gap-12 text-2xl font-bold">
          <a href="#" className="hover:text-[#DFF4FF]">Home</a>
          <a href="#" className="hover:text-[#DFF4FF]">About</a>
          <a href="#" className="hover:text-[#DFF4FF]">How It Works</a>
          <a href="#" className="hover:text-[#DFF4FF]">Apply</a>
          <a href="#" className="hover:text-[#DFF4FF]">Supporter</a>
        </div>

        <button className="bg-white text-[#0D1B5E] px-8 py-4 rounded-2xl font-bold text-2xl">
          Login
        </button>
      </nav>

      {/* HERO */}
      <section className="bg-[#DFF4FF] px-8 py-32 text-center">
        <h1 className="text-6xl md:text-8xl font-extrabold leading-tight mb-10">
          Empowering Entrepreneurs.
          <br />
          Building Communities.
        </h1>

        <p className="max-w-6xl mx-auto text-3xl md:text-4xl leading-relaxed text-[#1f2f60]">
          EPEW provides structure, coaching, community participation, and
          strategic support to help entrepreneurs turn ideas into real,
          sustainable businesses.
        </p>

        <div className="mt-14 flex flex-col md:flex-row gap-8 justify-center">
          <a
            href="#apply"
            className="bg-[#0FAF3D] hover:bg-[#0c9634] text-white px-12 py-6 rounded-full text-3xl font-bold shadow-lg"
          >
            Apply as Entrepreneur
          </a>

          <a
            href="#video"
            className="bg-white border-2 border-[#0FAF3D] text-[#0D1B5E] px-12 py-6 rounded-full text-3xl font-bold shadow-lg"
          >
            Watch Video
          </a>
        </div>
      </section>

      {/* VIDEO */}
      <section id="video" className="py-32 px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">

          <h2 className="text-6xl md:text-7xl font-extrabold mb-8">
            EPEW Presentation Video
          </h2>

          <p className="text-3xl text-gray-700 mb-14">
            Learn how EPEW connects entrepreneurs, supporters,
            coaches, and partners into one growth ecosystem.
          </p>

          <div className="rounded-3xl overflow-hidden shadow-2xl bg-black">
            <video controls className="w-full">
              <source
                src="/videos/epew-presentation.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-32 px-8 bg-[#F7F8F2]">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-6xl md:text-7xl font-extrabold text-center mb-20">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">

            <div className="bg-white rounded-3xl p-12 shadow-xl border-t-8 border-[#0FAF3D]">

              <div className="text-6xl mb-8">1</div>

              <h3 className="text-4xl font-bold mb-6">
                Join the Community
              </h3>

              <p className="text-2xl leading-relaxed text-gray-700">
                Entrepreneurs, supporters, coaches, and partners
                enter the EPEW ecosystem through a structured
                onboarding process.
              </p>

            </div>

            <div className="bg-white rounded-3xl p-12 shadow-xl border-t-8 border-[#0FAF3D]">

              <div className="text-6xl mb-8">2</div>

              <h3 className="text-4xl font-bold mb-6">
                Structure the Business
              </h3>

              <p className="text-2xl leading-relaxed text-gray-700">
                Coaches and business partners help entrepreneurs
                prepare their compliance, planning, branding,
                and launch foundation.
              </p>

            </div>

            <div className="bg-white rounded-3xl p-12 shadow-xl border-t-8 border-[#0FAF3D]">

              <div className="text-6xl mb-8">3</div>

              <h3 className="text-4xl font-bold mb-6">
                Grow With Support
              </h3>

              <p className="text-2xl leading-relaxed text-gray-700">
                Community participation supports business
                development while entrepreneurs report
                progress and create community impact.
              </p>

            </div>

          </div>
        </div>
      </section>

      {/* WHAT WE OFFER */}
      <section className="py-32 px-8 bg-[#0FAF3D] text-white">

        <div className="max-w-7xl mx-auto text-center">

          <h2 className="text-6xl md:text-7xl font-extrabold mb-20">
            What We Offer
          </h2>

          <div className="grid md:grid-cols-3 gap-10 text-left">

            <div className="bg-white/15 rounded-3xl p-10">

              <h3 className="text-4xl font-bold mb-6">
                Coaching
              </h3>

              <p className="text-2xl leading-relaxed">
                Guidance to help entrepreneurs build confidence,
                structure, and operational readiness.
              </p>

            </div>

            <div className="bg-white/15 rounded-3xl p-10">

              <h3 className="text-4xl font-bold mb-6">
                Business Support
              </h3>

              <p className="text-2xl leading-relaxed">
                Support with formation, branding, compliance,
                launch strategy, and growth planning.
              </p>

            </div>

            <div className="bg-white/15 rounded-3xl p-10">

              <h3 className="text-4xl font-bold mb-6">
                Community Growth
              </h3>

              <p className="text-2xl leading-relaxed">
                A participation model designed to connect
                real people with real business development.
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* CTA */}
      <section
        id="apply"
        className="py-32 px-8 bg-[#DFF4FF] text-center"
      >

        <h2 className="text-6xl md:text-7xl font-extrabold mb-10">
          Ready to Build With EPEW?
        </h2>

        <p className="max-w-5xl mx-auto text-3xl text-gray-700 mb-14">
          Apply as an entrepreneur or join as a supporter
          to participate in a structured community business
          development platform.
        </p>

        <div className="flex flex-col md:flex-row gap-8 justify-center">

          <a
            href="#"
            className="bg-[#0D1B5E] text-white px-12 py-6 rounded-full text-3xl font-bold shadow-lg"
          >
            Start Application
          </a>

          <a
            href="#"
            className="bg-[#0FAF3D] text-white px-12 py-6 rounded-full text-3xl font-bold shadow-lg"
          >
            Become a Supporter
          </a>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-[#0D1B5E] text-white py-20 px-8 text-center">

        <h3 className="text-5xl font-bold mb-6">
          EPEW
        </h3>

        <p className="max-w-5xl mx-auto text-2xl text-blue-100 leading-relaxed">
          Ekero Partners Empower Wealth is a community
          entrepreneurship platform focused on structure,
          support, business growth, and sustainable impact.
        </p>

        <p className="mt-10 text-2xl text-blue-200">
          © 2026 EPEW. All Rights Reserved.
        </p>

      </footer>

    </main>
  );
}