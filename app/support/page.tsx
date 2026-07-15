export default function SupportPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">

      {/* HERO */}
      <section className="py-24 bg-white shadow-sm">

        <div className="max-w-7xl mx-auto px-8 text-center">

          <h1 className="text-7xl font-extrabold mb-10">
            Support Entrepreneurs Through EPEW
          </h1>

          <p className="text-3xl text-gray-700 leading-relaxed max-w-5xl mx-auto mb-12">
            EPEW connects supporters, entrepreneurs, coaches,
            and community partners to help business ideas grow
            through structured community participation.
          </p>

          <div className="flex justify-center">

            <a
              href="/support/register"
              className="bg-[#06245c] text-white px-12 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
            >
              Become a Supporter
            </a>

          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}
      <section className="py-24">

        <div className="max-w-7xl mx-auto px-8">

          <h2 className="text-6xl font-bold text-center mb-16">
            How Support Participation Works
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

              <div className="text-7xl mb-8">
                👥
              </div>

              <h3 className="text-4xl font-bold mb-6">
                Discover Entrepreneurs
              </h3>

              <p className="text-2xl text-gray-700 leading-relaxed">
                Browse entrepreneur campaigns and learn about
                business ideas being prepared through the EPEW ecosystem.
              </p>

            </div>

            <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

              <div className="text-7xl mb-8">
                🤝
              </div>

              <h3 className="text-4xl font-bold mb-6">
                Participate in Support
              </h3>

              <p className="text-2xl text-gray-700 leading-relaxed">
                Select participation units and support entrepreneurs
                through structured community participation campaigns.
              </p>

            </div>

            <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

              <div className="text-7xl mb-8">
                📈
              </div>

              <h3 className="text-4xl font-bold mb-6">
                Follow Entrepreneur Growth
              </h3>

              <p className="text-2xl text-gray-700 leading-relaxed">
                Receive updates regarding entrepreneur preparation,
                launch progress, and business development activities.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* IMPORTANT NOTICE */}
      <section className="pb-24">

        <div className="max-w-6xl mx-auto px-8">

          <div className="bg-[#06245c] text-white rounded-3xl p-14 shadow-2xl">

            <h2 className="text-5xl font-bold mb-8 text-center">
              Important Notice
            </h2>

            <div className="space-y-6 text-2xl text-gray-200 leading-relaxed">

              <p>
                EPEW is not a bank, investment company,
                broker-dealer, or public securities exchange.
              </p>

              <p>
                Support participation through the platform involves
                business risk and entrepreneur outcomes are not guaranteed.
              </p>

              <p>
                EPEW provides entrepreneur preparation,
                coaching coordination, and platform organization services.
              </p>

              <p>
                All participation decisions are made voluntarily
                between supporters and entrepreneurs.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* SAMPLE ENTREPRENEURS */}
      <section className="pb-24">

        <div className="max-w-7xl mx-auto px-8">

          <h2 className="text-6xl font-bold text-center mb-16">
            Featured Entrepreneurs
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            {/* CARD 1 */}
            <div className="bg-white rounded-3xl shadow-xl p-10">

              <div className="text-6xl mb-6 text-center">
                ☕
              </div>

              <h3 className="text-4xl font-bold mb-4 text-center">
                Doe Coffee Shop
              </h3>

              <p className="text-2xl text-gray-600 text-center mb-6">
                Restaurant / Food
              </p>

              <p className="text-xl text-gray-700 leading-relaxed mb-8 text-center">
                Helping bring a neighborhood coffee shop
                concept to the community.
              </p>

              <div className="flex justify-center">

                <a
                  href="/support/doe-coffee-shop"
                  className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-green-600 transition"
                >
                  View Entrepreneur
                </a>

              </div>

            </div>

            {/* CARD 2 */}
            <div className="bg-white rounded-3xl shadow-xl p-10">

              <div className="text-6xl mb-6 text-center">
                💻
              </div>

              <h3 className="text-4xl font-bold mb-4 text-center">
                Future Tech Solutions
              </h3>

              <p className="text-2xl text-gray-600 text-center mb-6">
                Technology
              </p>

              <p className="text-xl text-gray-700 leading-relaxed mb-8 text-center">
                Supporting a technology entrepreneur
                developing digital business services.
              </p>

              <div className="flex justify-center">

                <a
                  href="/support/future-tech-solutions"
                  className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-green-600 transition"
                >
                  View Entrepreneur
                </a>

              </div>

            </div>

            {/* CARD 3 */}
            <div className="bg-white rounded-3xl shadow-xl p-10">

              <div className="text-6xl mb-6 text-center">
                🌱
              </div>

              <h3 className="text-4xl font-bold mb-4 text-center">
                Green Harvest Farm
              </h3>

              <p className="text-2xl text-gray-600 text-center mb-6">
                Agriculture
              </p>

              <p className="text-xl text-gray-700 leading-relaxed mb-8 text-center">
                Supporting sustainable agriculture
                and local food production initiatives.
              </p>

              <div className="flex justify-center">

                <a
                  href="/support/green-harvest-farm"
                  className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-green-600 transition"
                >
                  View Entrepreneur
                </a>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}