import Image from "next/image";
import Link from "next/link";

export default function StoriesPage() {
  return (
    <main className="min-h-screen bg-white text-[#06245c]">
      <section className="bg-[#f5f7fb] py-24">
        <div className="mx-auto max-w-7xl px-8 text-center">
          <h1 className="text-6xl font-extrabold md:text-7xl">
            EPEW Stories
          </h1>

          <p className="mx-auto mt-8 max-w-5xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
            Discover stories that show how entrepreneurship, mutual
            participation, and community support can strengthen
            businesses, families, and communities.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-8 md:grid-cols-2">
          <article className="rounded-3xl bg-white p-10 shadow-2xl">
            <Image
              src="/images/entrepreneur-story.png"
              alt="Entrepreneur stories"
              width={900}
              height={600}
              className="rounded-3xl shadow-xl"
            />

            <h2 className="mt-10 text-4xl font-bold">
              Entrepreneur Stories
            </h2>

            <p className="mt-6 text-2xl leading-relaxed text-gray-700">
              Follow entrepreneurs as they move from an idea to
              preparation, qualification, business launch, and
              long-term growth.
            </p>
          </article>

          <article className="rounded-3xl bg-white p-10 shadow-2xl">
            <Image
              src="/images/supporter-story.png"
              alt="Supporter stories"
              width={900}
              height={600}
              className="rounded-3xl shadow-xl"
            />

            <h2 className="mt-10 text-4xl font-bold">
              Supporter Stories
            </h2>

            <p className="mt-6 text-2xl leading-relaxed text-gray-700">
              Learn how supporters strengthen entrepreneurs and
              communities through structured participation and
              shared commitment.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-[#06245c] py-24 text-white">
        <div className="mx-auto max-w-5xl px-8 text-center">
          <h2 className="text-5xl font-extrabold">
            New Stories Are Coming Soon
          </h2>

          <p className="mt-8 text-2xl leading-relaxed text-blue-100">
            As entrepreneurs and supporters begin participating in
            the Entrepreneur Development Ecosystem, their stories
            and progress will be shared here.
          </p>

          <Link
            href="/resources"
            className="mt-10 inline-flex rounded-2xl bg-green-600 px-10 py-5 text-2xl font-bold text-white transition hover:bg-green-700"
          >
            Return to EPEW Resources
          </Link>
        </div>
      </section>
    </main>
  );
}