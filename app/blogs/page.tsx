import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";

export default function BlogsPage() {
  const categories = [
    {
      title: "Entrepreneurship",
      description:
        "Business ideas, startup preparation, business structure, and launch readiness.",
      icon: "🚀",
    },
    {
      title: "Wealth Building",
      description:
        "Financial education, budgeting, savings, credit, and long-term planning.",
      icon: "💰",
    },
    {
      title: "Community Development",
      description:
        "How entrepreneurship strengthens families, creates jobs, and supports communities.",
      icon: "🌍",
    },
    {
      title: "EPEW News",
      description:
        "Platform updates, events, announcements, and ecosystem progress.",
      icon: "📢",
    },
    {
      title: "Coach Corner",
      description:
        "Training articles, coaching guidance, and entrepreneur preparation resources.",
      icon: "🤝",
    },
    {
      title: "Partner Spotlight",
      description:
        "Business services, partner resources, and professional support opportunities.",
      icon: "⭐",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="py-24 px-8 text-center">
          <h1 className="text-7xl font-extrabold mb-8">
            EPEW Blogs
          </h1>

          <p className="text-3xl text-gray-700 leading-relaxed max-w-5xl mx-auto">
            Explore articles, resources, updates, and education designed to help
            entrepreneurs, supporters, coaches, and partners grow together.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-8 pb-24">
          <div className="grid md:grid-cols-3 gap-10">
            {categories.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-3xl shadow-xl p-10 text-center"
              >
                <div className="text-7xl mb-8">{item.icon}</div>

                <h2 className="text-4xl font-bold mb-6">
                  {item.title}
                </h2>

                <p className="text-2xl text-gray-700 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#06245c] text-white py-24 px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-6xl font-extrabold mb-8">
              EPEW Knowledge Center
            </h2>

            <p className="text-3xl text-gray-200 leading-relaxed mb-12">
              The blog will support education, transparency, financial literacy,
              entrepreneur readiness, community participation, and ecosystem
              updates.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-8">
              <Link
                href="/entrepreneurs"
                className="bg-green-600 text-white px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-white hover:text-[#06245c] transition"
              >
                Entrepreneur Resources
              </Link>

              <Link
                href="/supporters"
                className="bg-white text-[#06245c] px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 hover:text-white transition"
              >
                Supporter Resources
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}