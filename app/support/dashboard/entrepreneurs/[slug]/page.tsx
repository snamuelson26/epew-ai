export default function SupportedEntrepreneurDetailPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">

          <div className="bg-white rounded-3xl shadow-2xl p-14 mb-12">
            <h1 className="text-6xl font-extrabold mb-6">
              Doe Coffee Shop
            </h1>
            <p className="text-3xl text-gray-700">
              Entrepreneur: John Doe • Brooklyn, NY • Restaurant / Food
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <h2 className="text-3xl font-bold mb-4">Your Support</h2>
              <p className="text-4xl font-bold text-green-700">$5,200</p>
              <p className="text-xl text-gray-600 mt-3">Annual commitment</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <h2 className="text-3xl font-bold mb-4">Business Stage</h2>
              <p className="text-2xl font-bold text-[#06245c]">Preparation</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <h2 className="text-3xl font-bold mb-4">Updates</h2>
              <p className="text-2xl font-bold text-[#06245c]">3 New</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-12">
            <div className="bg-white rounded-3xl p-10 shadow-xl">
              <h2 className="text-4xl font-bold mb-6">
                Business Progress Updates
              </h2>

              <div className="space-y-6">
                <div className="bg-[#f5f7fb] rounded-2xl p-6">
                  <p className="text-xl font-bold text-green-700 mb-2">
                    June 12, 2026
                  </p>
                  <p className="text-2xl text-gray-700 leading-relaxed">
                    Business registration preparation has started.
                  </p>
                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-6">
                  <p className="text-xl font-bold text-green-700 mb-2">
                    June 20, 2026
                  </p>
                  <p className="text-2xl text-gray-700 leading-relaxed">
                    Coach reviewed the opening budget and preparation plan.
                  </p>
                </div>

                <div className="bg-[#f5f7fb] rounded-2xl p-6">
                  <p className="text-xl font-bold text-green-700 mb-2">
                    July 01, 2026
                  </p>
                  <p className="text-2xl text-gray-700 leading-relaxed">
                    Entrepreneur is preparing vendor and equipment information.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl">
              <h2 className="text-4xl font-bold mb-6">
                Message Entrepreneur
              </h2>

              <div className="bg-[#f5f7fb] rounded-3xl p-6 mb-6 min-h-[260px]">
                <p className="text-xl text-gray-600 mb-4">
                  Conversation preview
                </p>

                <div className="bg-white rounded-2xl p-5 mb-4">
                  <p className="text-xl text-gray-700">
                    Thank you for supporting my business journey.
                  </p>
                </div>

                <div className="bg-green-100 rounded-2xl p-5">
                  <p className="text-xl text-gray-700">
                    I am excited to follow your progress.
                  </p>
                </div>
              </div>

              <textarea
                className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl min-h-[140px]"
                placeholder="Write a message..."
              />

              <button
                type="button"
                className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition mt-6"
              >
                Send Message
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-12">
            <div className="bg-white rounded-3xl p-10 shadow-xl">
              <h2 className="text-4xl font-bold mb-6">
                Quarterly Reports
              </h2>

              <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                Reports will appear here when the entrepreneur begins formal
                reporting through the EPEW platform.
              </p>

              <button
                type="button"
                className="bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold"
              >
                No Reports Yet
              </button>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl">
              <h2 className="text-4xl font-bold mb-6">
                Important Notice
              </h2>

              <p className="text-2xl text-gray-700 leading-relaxed">
                Communication is available only between supporters and
                entrepreneurs connected through an active participation record.
                EPEW may monitor platform communication for safety,
                accountability, and compliance with platform rules.
              </p>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}