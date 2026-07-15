export default function QuestionnaireSubmittedPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">

      <section className="py-24">

        <div className="max-w-5xl mx-auto px-8 text-center">

          <div className="bg-white rounded-3xl shadow-2xl p-14">

            <div className="text-7xl mb-8">✅</div>

            <h1 className="text-6xl font-extrabold mb-10">
              Questionnaire Successfully Submitted
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed mb-8">
              Thank you for completing your Entrepreneur Onboarding Questionnaire.
            </p>

            <p className="text-2xl text-gray-700 leading-relaxed mb-8">
              Your information has been received successfully and is now being
              reviewed by your assigned EPEW Coach and the entrepreneur
              preparation team.
            </p>

            <div className="bg-[#f5f7fb] rounded-3xl p-10 shadow-xl mb-10">

              <h2 className="text-4xl font-bold mb-6">
                What Happens Next?
              </h2>

              <p className="text-2xl text-gray-700 leading-relaxed mb-6">
                Your coach may contact you within approximately 24 to 48 hours
                to schedule your first entrepreneur interview.
              </p>

              <p className="text-2xl text-gray-700 leading-relaxed">
                Additional preparation steps may be discussed during your first
                interaction depending on your business idea, preparation needs,
                and entrepreneur development pathway.
              </p>

            </div>

            <div className="bg-green-50 border-l-8 border-green-600 rounded-3xl p-10 mb-12">

              <h2 className="text-4xl font-bold mb-6">
                Important Reminder
              </h2>

              <p className="text-2xl text-gray-700 leading-relaxed">
                Delays in communication, incomplete information,
                or missed interview appointments may delay the entrepreneur
                preparation process.
              </p>

            </div>

            <p className="text-3xl text-gray-700 leading-relaxed font-bold mb-12">
              We look forward to supporting your entrepreneur journey with EPEW.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-6">

              <a
                href="/entrepreneurs"
                className="bg-[#06245c] text-white px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
              >
                Back to Entrepreneurs
              </a>

              <a
                href="/resources/view-faq"
                className="border-2 border-[#06245c] text-[#06245c] px-10 py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] hover:text-white transition"
              >
                View FAQ
              </a>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}