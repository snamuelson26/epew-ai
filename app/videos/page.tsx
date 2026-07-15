"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function VideosPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-[#06245c]">
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <Image
              src="/images/videos-hero.png"
              alt="EPEW Video Library"
              width={1600}
              height={900}
              className="w-full rounded-3xl shadow-2xl object-cover mb-16"
              priority
            />

            <h1 className="text-7xl font-extrabold mb-8">
              Learn. Prepare. Grow.
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto mb-12">
              The EPEW Video Library provides practical education, expert
              guidance, entrepreneur stories, and step-by-step training to help
              you build a successful business.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-6">
              <Link
                href="#featured-videos"
                className="bg-[#06245c] text-white px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
              >
                Watch Featured Videos
              </Link>

              <Link
                href="/entrepreneurs"
                className="bg-green-600 text-white px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
              >
                Become an Entrepreneur
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              Why the Video Library?
            </h2>

            <p className="text-3xl text-gray-700 leading-relaxed max-w-6xl mx-auto">
              At EPEW, education comes before funding. Our video library helps
              entrepreneurs, supporters, coaches, and partners understand the
              ecosystem, prepare responsibly, and grow with confidence.
            </p>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-extrabold mb-10">
                Video Categories
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <CategoryCard icon="🎓" title="Entrepreneur Fundamentals" />
              <CategoryCard icon="💼" title="Business Development" />
              <CategoryCard icon="🤝" title="Coaching & Mentorship" />
              <CategoryCard icon="💰" title="Funding Readiness" />
              <CategoryCard icon="📣" title="Marketing & Promotion" />
              <CategoryCard icon="🏢" title="Business Operations" />
              <CategoryCard icon="📊" title="Financial Management" />
              <CategoryCard icon="⭐" title="Success Stories" />
            </div>
          </div>
        </section>

        <section id="featured-videos" className="py-24 bg-[#f5f7fb]">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-extrabold mb-10">
                Featured Videos
              </h2>

              <div className="mx-auto mt-8 max-w-5xl rounded-2xl border-2 border-red-300 bg-red-50 px-8 py-6">
  <p className="text-3xl font-extrabold text-red-700">
    🚧 Coming Soon
  </p>

  <p className="mt-3 text-2xl text-red-600 leading-relaxed">
    Our first EPEW training and introduction videos are currently in production and will be available soon.
  </p>
</div>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <VideoCard
                title="Welcome to EPEW"
                description="An introduction to the EPEW mission, ecosystem, and entrepreneur journey."
                duration="Coming Soon"
              />

              <VideoCard
                title="From Idea to Business"
                description="Learn how EPEW helps entrepreneurs develop ideas into business opportunities."
                duration="Coming Soon"
              />

              <VideoCard
                title="How Supporters Help"
                description="Understand how supporters become the foundation and engine of the ecosystem."
                duration="Coming Soon"
              />

              <VideoCard
                title="Coach-Guided Development"
                description="See how EPEW coaches guide entrepreneurs through preparation and growth."
                duration="Coming Soon"
              />

              <VideoCard
                title="Funding Readiness"
                description="Learn why preparation comes before funding inside the EPEW model."
                duration="Coming Soon"
              />

              <VideoCard
                title="Business Launch & Growth"
                description="Explore how entrepreneurs launch, report, and strengthen their businesses."
                duration="Coming Soon"
              />
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              The EPEW Learning Journey
            </h2>

            <div className="grid md:grid-cols-4 gap-8 mt-16">
              <StepCard number="1" title="Start Here" />
              <StepCard number="2" title="Learn the Ecosystem" />
              <StepCard number="3" title="Develop Your Business" />
              <StepCard number="4" title="Prepare for Growth" />
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#06245c] text-white">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <h2 className="text-6xl font-extrabold mb-10">
              Start Learning Today
            </h2>

            <p className="text-3xl text-blue-100 leading-relaxed mb-12">
              Knowledge is the foundation of every successful entrepreneur.
              Keep learning. Keep preparing. Keep building your future.
            </p>

            <Link
              href="/entrepreneurs"
              className="bg-green-600 text-white px-14 py-6 rounded-2xl text-2xl font-bold hover:bg-white hover:text-[#06245c] transition inline-block"
            >
              Become an Entrepreneur
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function CategoryCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="bg-[#f5f7fb] rounded-3xl p-8 shadow-xl text-center">
      <div className="text-6xl mb-6">{icon}</div>
      <h3 className="text-2xl font-extrabold">{title}</h3>
    </div>
  );
}

function VideoCard({
  title,
  description,
  duration,
}: {
  title: string;
  description: string;
  duration: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-10 shadow-xl">
      <div className="h-56 rounded-2xl bg-[#06245c] flex items-center justify-center mb-8">
        <div className="text-white text-7xl">▶</div>
      </div>

      <h3 className="text-3xl font-extrabold mb-5">{title}</h3>
      <p className="text-2xl text-gray-700 leading-relaxed mb-6">
        {description}
      </p>

      <p className="text-xl font-bold text-green-700">{duration}</p>
    </div>
  );
}

function StepCard({ number, title }: { number: string; title: string }) {
  return (
    <div className="bg-[#f5f7fb] rounded-3xl p-8 shadow-xl text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-700 text-white text-3xl font-black mx-auto mb-6">
        {number}
      </div>
      <h3 className="text-2xl font-extrabold">{title}</h3>
    </div>
  );
}