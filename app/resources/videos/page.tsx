import Link from "next/link";

export default function VideosPage() {
  return (
    <main className="min-h-screen bg-white text-[#06245c]">
      <section className="bg-[#f5f7fb] py-24">
        <div className="mx-auto max-w-6xl px-8 text-center">
          <h1 className="text-6xl font-extrabold md:text-7xl">
            EPEW Videos
          </h1>

          <p className="mx-auto mt-8 max-w-5xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
            Watch official presentations, program explanations,
            entrepreneur guidance, event highlights, and community
            updates from the Entrepreneur Development Ecosystem.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-8">
          <div className="overflow-hidden rounded-3xl shadow-2xl">
            <iframe
              className="aspect-video w-full"
              src="https://www.youtube.com/embed/ZR_L6Vx0p-U"
              title="EPEW Presentation Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="mt-16 rounded-3xl bg-[#f5f7fb] p-10 text-center">
            <h2 className="text-4xl font-extrabold">
              More Videos Are Coming Soon
            </h2>

            <p className="mt-6 text-2xl leading-relaxed text-gray-700">
              Additional videos will explain the entrepreneur journey,
              supporter participation, Personal Coach guidance,
              business launch preparation, and community impact.
            </p>

            <Link
              href="/resources"
              className="mt-10 inline-flex rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-bold text-white transition hover:bg-green-600"
            >
              Return to EPEW Resources
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}