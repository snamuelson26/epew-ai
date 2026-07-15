import Image from "next/image";

export default function ResourcesPage() {
  return (
    <main className="bg-white text-[#06245c]">

      {/* HERO IMAGE */}
      <section className="bg-white">
        <Image
          src="/images/resources-hero.png"
          alt="EPEW Resources"
          width={1600}
          height={900}
          className="w-full h-auto object-cover"
          priority
        />
      </section>

      {/* INTRO */}
      <section className="py-24 bg-[#f5f7fb]">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <h1 className="text-7xl md:text-8xl font-extrabold mb-12">
            EPEW Resources
          </h1>

          <p className="text-3xl text-gray-700 leading-relaxed">
            Explore videos, FAQs, event updates, entrepreneur stories,
            and supporter stories designed to help you understand the
            EPEW ecosystem with confidence.
          </p>
        </div>
      </section>

      {/* VIDEO INFORMATION */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <Image
            src="/images/video-info.png"
            alt="Video Information"
            width={1400}
            height={900}
            className="rounded-3xl shadow-2xl mx-auto mb-16"
          />

          <div className="text-center">
            <h2 className="text-6xl font-bold mb-10">Video Information</h2>
            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              Watch official EPEW video presentations explaining how the
              ecosystem works for entrepreneurs, supporters, coaches,
              and partners.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ CENTER */}
      <section id="faq" className="py-24 bg-[#f5f7fb]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-bold mb-10">FAQ Center</h2>
            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              Find clear answers about entrepreneurship, supporter participation,
              transparency, reporting, and the EPEW program structure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <a href="/resources/entrepreneur-faq" className="bg-white rounded-3xl p-12 shadow-xl hover:shadow-2xl transition">
              <h3 className="text-4xl font-bold mb-6">Entrepreneur FAQ</h3>
              <p className="text-2xl text-gray-700 leading-relaxed">
                Questions and answers for entrepreneurs preparing to apply,
                qualify, receive coaching, and launch businesses.
              </p>
            </a>

            <a href="/resources/supporter-faq" className="bg-white rounded-3xl p-12 shadow-xl hover:shadow-2xl transition">
              <h3 className="text-4xl font-bold mb-6">Supporter FAQ</h3>
              <p className="text-2xl text-gray-700 leading-relaxed">
                Questions and answers for supporters about participation,
                transparency, benefits, reports, and community impact.
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* EVENTS VIDEOS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <Image
            src="/images/events-video.png"
            alt="Events Videos"
            width={1400}
            height={900}
            className="rounded-3xl shadow-2xl mx-auto mb-16"
          />

          <div className="text-center">
            <h2 className="text-6xl font-bold mb-10">Events Videos</h2>
            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              View event videos, community updates, program presentations,
              and entrepreneur launch highlights.
            </p>
          </div>
        </div>
      </section>

      {/* STORIES */}
      <section className="py-24 bg-[#f5f7fb]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-3xl p-10 shadow-2xl">
              <Image
                src="/images/entrepreneur-story.png"
                alt="Entrepreneur Stories"
                width={900}
                height={600}
                className="rounded-3xl shadow-xl mb-10"
              />
              <h2 className="text-5xl font-bold mb-8">Entrepreneur Stories</h2>
              <p className="text-2xl text-gray-700 leading-relaxed">
                Discover how business ideas can move from vision to structure,
                from structure to launch, and from launch to growth.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-2xl">
              <Image
                src="/images/supporter-story.png"
                alt="Supporter Stories"
                width={900}
                height={600}
                className="rounded-3xl shadow-xl mb-10"
              />
              <h2 className="text-5xl font-bold mb-8">Supporter Stories</h2>
              <p className="text-2xl text-gray-700 leading-relaxed">
                Learn how supporters participate in strengthening entrepreneurs,
                families, and communities through structured participation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <h2 className="text-7xl font-extrabold mb-12">
            Explore the EPEW Ecosystem
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <a href="/entrepreneurs" className="bg-[#06245c] text-white px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition">
              Entrepreneurs
            </a>

            <a href="/supporters" className="bg-green-600 text-white px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition">
              Supporters
            </a>

            <a href="/about" className="border-2 border-[#06245c] text-[#06245c] px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] hover:text-white transition">
              About EPEW
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}