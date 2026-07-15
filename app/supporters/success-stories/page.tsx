"use client";

export default function SuccessStoriesPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">

      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">
          Success Stories
        </h1>

        <p className="text-xl text-gray-700">
          Celebrate businesses, churches, nonprofit organizations, and
          community projects successfully launched through the EPEW ecosystem.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">

        <div className="bg-white rounded-3xl shadow-xl p-8">

          <h2 className="text-3xl font-bold mb-4">
            Future Success Story
          </h2>

          <div className="space-y-4 text-lg">

            <p>
              <strong>Business:</strong> Food Fans Restaurant
            </p>

            <p>
              <strong>Entrepreneur:</strong> Future Entrepreneur
            </p>

            <p>
              <strong>Jobs Created:</strong> 0
            </p>

            <p>
              <strong>Business Grade:</strong> Pending
            </p>

            <p>
              <strong>Status:</strong> Awaiting Launch
            </p>

          </div>

          <div className="flex gap-4 mt-8">

            <button className="bg-[#06245c] text-white px-6 py-3 rounded-2xl font-bold">
              Watch Video
            </button>

            <button className="bg-green-700 text-white px-6 py-3 rounded-2xl font-bold">
              View Story
            </button>

          </div>

        </div>

      </div>

      <div className="bg-green-50 border-2 border-green-500 rounded-3xl shadow-xl p-10 mt-8">

        <h2 className="text-3xl font-bold mb-6">
          Future Success Story Features
        </h2>

        <div className="space-y-4 text-xl">

          <p>✅ Grand Opening Photos</p>

          <p>✅ Videos</p>

          <p>✅ Community Impact</p>

          <p>✅ Jobs Created</p>

          <p>✅ Business Grades</p>

          <p>✅ Testimonials</p>

          <p>✅ Annual Awards</p>

        </div>

      </div>

    </main>
  );
}