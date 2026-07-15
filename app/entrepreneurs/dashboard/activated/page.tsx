export default function EntrepreneurDashboardActivatedPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">

          <div className="bg-white rounded-3xl shadow-2xl p-14 mb-12 text-center">

            <div className="text-7xl mb-8">✅</div>

            <h1 className="text-6xl font-extrabold mb-10">
              Your Entrepreneur Dashboard Is Now Active
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed mb-8">
              Your first coach meeting has been completed, and your private
              entrepreneur dashboard is now active.
            </p>

            <div className="bg-[#f5f7fb] rounded-3xl p-10 shadow-xl mb-10 text-left">

              <h2 className="text-4xl font-bold mb-6 text-center">
                What Happens Next?
              </h2>

              <ul className="space-y-5 text-2xl text-gray-700">
                <li>✅ Your private entrepreneur portal is available.</li>
                <li>✅ Your coach will continue guiding your preparation.</li>
                <li>✅ Business video and presentation preparation may begin.</li>
                <li>✅ You will review and approve your presentation materials.</li>
                <li>✅ Your public support page may go live after approval.</li>
              </ul>

            </div>

            <div className="bg-green-50 border-l-8 border-green-600 rounded-3xl p-10 mb-12">

              <h2 className="text-4xl font-bold mb-6">
                Public Support Link
              </h2>

              <div className="bg-white rounded-2xl border-2 border-dashed border-green-600 p-6 mb-6">

                <p className="text-2xl font-bold text-[#06245c] break-all">
                  http://localhost:3000/support/doe-coffee-shop
                </p>

              </div>

              <button
                type="button"
                className="bg-green-600 text-white px-8 py-4 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
              >
                Copy Link
              </button>

              <div className="bg-[#f5f7fb] rounded-3xl p-8 mt-8 text-left">

                <h3 className="text-3xl font-bold mb-5 text-[#06245c]">
                  Campaign Goal
                </h3>

                <p className="text-2xl text-gray-700 leading-relaxed mb-4">
                  20 units at $100 per week
                  {" "}
                  <strong className="text-green-700">
                    [$100,000]
                  </strong>
                  {" "}
                  to help you open
                  {" "}
                  <strong>
                    Doe Coffee Shop
                  </strong>
                  .
                </p>

                <p className="text-2xl text-gray-700 leading-relaxed">
                  Share your support link with friends, family,
                  community members, and people who believe
                  in your business vision.
                </p>

              </div>

            </div>

          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">

            <div className="bg-white rounded-3xl p-10 shadow-xl text-center">

              <div className="text-5xl mb-4">📈</div>

              <h2 className="text-3xl font-bold mb-4">
                Total Units Supported
              </h2>

              <p className="text-5xl font-bold text-green-700">
                6 / 20
              </p>

            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl text-center">

              <div className="text-5xl mb-4">📦</div>

              <h2 className="text-3xl font-bold mb-4">
                Remaining Units
              </h2>

              <p className="text-5xl font-bold text-[#06245c]">
                14
              </p>

            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl text-center">

              <div className="text-5xl mb-4">🤝</div>

              <h2 className="text-3xl font-bold mb-4">
                Active Supporters
              </h2>

              <p className="text-5xl font-bold text-green-700">
                3
              </p>

            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-12">

            <div className="bg-white rounded-3xl p-10 shadow-xl">

              <h2 className="text-4xl font-bold mb-6">
                Supporter List
              </h2>

              <div className="space-y-5">

                <div className="bg-[#f5f7fb] rounded-2xl p-6 flex justify-between items-center">

                  <div>
                    <p className="text-2xl font-bold">
                      Michael R.
                    </p>

                    <p className="text-xl text-gray-600">
                      Active Supporter
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">
                      2 Units
                    </p>
                  </div>

                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-6 flex justify-between items-center">

                  <div>
                    <p className="text-2xl font-bold">
                      Sarah M.
                    </p>

                    <p className="text-xl text-gray-600">
                      Active Supporter
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">
                      1 Unit
                    </p>
                  </div>

                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-6 flex justify-between items-center">

                  <div>
                    <p className="text-2xl font-bold">
                      Community Supporter
                    </p>

                    <p className="text-xl text-gray-600">
                      Active Supporter
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">
                      3 Units
                    </p>
                  </div>

                </div>

              </div>

            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl">

              <h2 className="text-4xl font-bold mb-6">
                Marketplace Readiness
              </h2>

              <div className="space-y-6">

                <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-6">

                  <p className="text-2xl font-bold text-green-700 mb-2">
                    Coach Meeting
                  </p>

                  <p className="text-xl text-gray-700">
                    Completed
                  </p>

                </div>

                <div className="bg-yellow-50 border-l-8 border-yellow-500 rounded-2xl p-6">

                  <p className="text-2xl font-bold text-yellow-700 mb-2">
                    Business Video
                  </p>

                  <p className="text-xl text-gray-700">
                    Pending Preparation
                  </p>

                </div>

                <div className="bg-yellow-50 border-l-8 border-yellow-500 rounded-2xl p-6">

                  <p className="text-2xl font-bold text-yellow-700 mb-2">
                    Marketplace Approval
                  </p>

                  <p className="text-xl text-gray-700">
                    Pending Final Review
                  </p>

                </div>

              </div>

            </div>

          </div>

          <div className="flex flex-col md:flex-row justify-center gap-6">

            <a
              href="/entrepreneurs/dashboard"
              className="bg-[#06245c] text-white px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition text-center"
            >
              Go to Dashboard
            </a>

            <a
              href="/entrepreneurs/dashboard/supporter-updates"
              className="border-2 border-[#06245c] text-[#06245c] px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] hover:text-white transition text-center"
            >
              Manage Supporter Updates
            </a>

          </div>

        </div>
      </section>
    </main>
  );
}