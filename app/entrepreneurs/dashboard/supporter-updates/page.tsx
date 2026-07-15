export default function EntrepreneurSupporterUpdatesPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">

          <div className="bg-white rounded-3xl shadow-2xl p-14 mb-12">
            <h1 className="text-6xl font-extrabold mb-6">
              Supporter Updates & Messages
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed">
              Share business progress, communicate with active supporters,
              upload reports, and keep your community informed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">

            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <div className="text-5xl mb-4">🤝</div>

              <h2 className="text-3xl font-bold mb-3">
                Active Supporters
              </h2>

              <p className="text-4xl font-bold text-green-700">
                12
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <div className="text-5xl mb-4">📢</div>

              <h2 className="text-3xl font-bold mb-3">
                Updates Posted
              </h2>

              <p className="text-4xl font-bold text-green-700">
                3
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <div className="text-5xl mb-4">📄</div>

              <h2 className="text-3xl font-bold mb-3">
                Reports
              </h2>

              <p className="text-4xl font-bold text-green-700">
                0
              </p>
            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-12">

            <div className="bg-white rounded-3xl p-10 shadow-xl">

              <h2 className="text-4xl font-bold mb-6">
                Post Business Update
              </h2>

              <textarea
                className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl min-h-[220px]"
                placeholder="Share business progress, milestones, preparation steps, or important updates..."
              />

              <button
                type="button"
                className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition mt-6"
              >
                Post Update
              </button>

            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl">

              <h2 className="text-4xl font-bold mb-6">
                Upload Quarterly Report
              </h2>

              <p className="text-2xl text-gray-700 leading-relaxed mb-6">
                Upload reports when required to keep supporters informed
                about business preparation, launch progress, and operations.
              </p>

              <input
                type="file"
                className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-xl mb-6"
              />

              <button
                type="button"
                className="w-full bg-green-600 text-white py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
              >
                Upload Report
              </button>

            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-12">

            <div className="bg-white rounded-3xl p-10 shadow-xl">

              <h2 className="text-4xl font-bold mb-6">
                Recent Supporter Messages
              </h2>

              <div className="space-y-6">

                <div className="bg-[#f5f7fb] rounded-2xl p-6">
                  <p className="text-xl font-bold text-green-700 mb-2">
                    Supporter Message
                  </p>

                  <p className="text-2xl text-gray-700">
                    I am excited to follow your progress. Keep going!
                  </p>
                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-6">
                  <p className="text-xl font-bold text-green-700 mb-2">
                    Supporter Message
                  </p>

                  <p className="text-2xl text-gray-700">
                    Thank you for sharing your business journey.
                  </p>
                </div>

              </div>

            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl">

              <h2 className="text-4xl font-bold mb-6">
                Active Supporters
              </h2>

              <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-6 mb-8">

                <p className="text-2xl font-bold text-green-700 mb-3">
                  Total Units Supported: 6 / 20
                </p>

                <p className="text-2xl font-bold text-[#06245c]">
                  Total Units Remaining: 14
                </p>

              </div>

              <ul className="space-y-5 text-2xl text-gray-700">

                <li>
                  ✅ Michael R. — 2 units
                </li>

                <li>
                  ✅ Sarah M. — 1 unit
                </li>

                <li>
                  ✅ Community Supporter — 3 units
                </li>

              </ul>

            </div>

          </div>

          <div className="bg-[#06245c] text-white rounded-3xl p-12 shadow-2xl">

            <h2 className="text-5xl font-bold mb-8">
              Communication Guidelines
            </h2>

            <p className="text-2xl text-gray-200 leading-relaxed">
              Business updates should be honest, respectful, and related to
              preparation, launch, progress, or operations.

              EPEW may monitor communication for safety,
              accountability, and platform compliance.
            </p>

          </div>

        </div>
      </section>
    </main>
  );
}