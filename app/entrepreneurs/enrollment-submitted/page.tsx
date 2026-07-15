export default function EnrollmentSubmittedPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">

      <section className="py-24">

        <div className="max-w-5xl mx-auto px-8 text-center">

          <div className="bg-white rounded-3xl shadow-2xl p-14">

            <div className="text-7xl mb-8">✅</div>

            <h1 className="text-6xl font-extrabold mb-10">
              Enrollment Request Received
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed mb-8">
              Welcome and thank you for submitting your entrepreneur
              enrollment request to the Ekero Partners Empower Wealth
              Entrepreneur Program.
            </p>

            <p className="text-2xl text-gray-700 leading-relaxed mb-8">
              Your request has been received successfully and is now waiting
              for review by the EPEW team.
            </p>

            <div className="bg-[#f5f7fb] rounded-3xl p-10 shadow-xl mb-10">

              <h2 className="text-4xl font-bold mb-6">
                What Happens Next?
              </h2>

              <p className="text-2xl text-gray-700 leading-relaxed">
                Please wait for your personal EPEW Coach. Your coach will
                contact you with the next instructions and guide you through
                the next step of the entrepreneur preparation process.
              </p>

            </div>

            <p className="text-3xl text-gray-700 leading-relaxed font-bold mb-12">
              We are excited to work with you and see your business venture
              grow in the community.
            </p>

            <a
              href="/entrepreneurs"
              className="bg-[#06245c] text-white px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition inline-block"
            >
              Back to Entrepreneurs
            </a>

          </div>

        </div>

      </section>

    </main>
  );
}