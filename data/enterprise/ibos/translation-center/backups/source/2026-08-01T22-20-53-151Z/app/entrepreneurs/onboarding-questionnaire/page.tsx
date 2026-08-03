"use client";
export default function OnboardingQuestionnairePage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">
      <section className="py-20 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <h1 className="text-7xl font-extrabold mb-10">
            Entrepreneur Onboarding Questionnaire
          </h1>

          <p className="text-3xl text-gray-700 leading-relaxed max-w-5xl mx-auto">
            This questionnaire is designed to help your coach and the EPEW team
            better understand your business idea, preparation needs, and
            entrepreneur development pathway before your first interview.
          </p>

          <p className="text-xl text-red-600 font-semibold mt-6">
            * Required fields must be completed before submission.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-6xl mx-auto px-8">
          <form
            onSubmit={(e) => {
                e.preventDefault();
                window.location.href = "/entrepreneurs/questionnaire-submitted";
            }}
            className="bg-white rounded-3xl shadow-2xl p-14 space-y-16"
        >
            {/* SECTION 1 */}
            <div>
              <h2 className="text-5xl font-bold mb-10">
                Section 1 — Personal Information
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input required type="tel" className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input required type="email" className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Date of Birth <span className="text-red-600">*</span>
                  </label>
                  <input required type="date" className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Street Address <span className="text-red-600">*</span>
                  </label>
                  <input required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    City <span className="text-red-600">*</span>
                  </label>
                  <input required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    State / Province <span className="text-red-600">*</span>
                  </label>
                  <input required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Zip Code <span className="text-red-600">*</span>
                  </label>
                  <input required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Country <span className="text-red-600">*</span>
                  </label>
                  <input required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Preferred Language <span className="text-red-600">*</span>
                  </label>
                  <select required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl">
                    <option value="">Select language</option>
                    <option>English</option>
                    <option>French</option>
                    <option>Haitian Creole</option>
                    <option>Spanish</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2 */}
            <div>
              <h2 className="text-5xl font-bold mb-10">
                Section 2 — Business Idea Information
              </h2>

              <div className="space-y-8">
                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Do you currently have a business? <span className="text-red-600">*</span>
                  </label>
                  <select required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl">
                    <option value="">Select answer</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Business Name or Business Idea Name <span className="text-red-600">*</span>
                  </label>
                  <input required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Year Established, if existing
                  </label>
                  <input className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Business Website, if any
                  </label>
                  <input type="url" className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Business Category <span className="text-red-600">*</span>
                  </label>
                  <select required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl">
                    <option value="">Select category</option>
                    <option>Retail</option>
                    <option>Restaurant / Food</option>
                    <option>Technology</option>
                    <option>Agriculture</option>
                    <option>Transportation</option>
                    <option>Health / Beauty</option>
                    <option>Construction</option>
                    <option>Education</option>
                    <option>Services</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Describe your business idea <span className="text-red-600">*</span>
                  </label>
                  <textarea required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl min-h-[180px]" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    What problem will your product or service solve? <span className="text-red-600">*</span>
                  </label>
                  <textarea required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl min-h-[160px]" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Who are your customers? <span className="text-red-600">*</span>
                  </label>
                  <textarea required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl min-h-[160px]" />
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-2xl font-bold mb-3">
                      Business City <span className="text-red-600">*</span>
                    </label>
                    <input required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                  </div>

                  <div>
                    <label className="block text-2xl font-bold mb-3">
                      Business State <span className="text-red-600">*</span>
                    </label>
                    <input required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                  </div>

                  <div>
                    <label className="block text-2xl font-bold mb-3">
                      Business Country <span className="text-red-600">*</span>
                    </label>
                    <input required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3 */}
            <div>
              <h2 className="text-5xl font-bold mb-10">
                Section 3 — Funding Preparation
              </h2>

              <div className="space-y-8">
                <div>
                  <label className="block text-2xl font-bold mb-3">
                    How much support do you think you may need? <span className="text-red-600">*</span>
                  </label>
                  <select required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl">
                    <option value="">Select amount</option>
                    <option>$10,000</option>
                    <option>$25,000</option>
                    <option>$50,000</option>
                    <option>$75,000</option>
                    <option>$100,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    How would the support be used? <span className="text-red-600">*</span>
                  </label>
                  <textarea required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl min-h-[180px]" placeholder="Examples: equipment, inventory, marketing, business location, technology, employees" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Estimated time to launch your business <span className="text-red-600">*</span>
                  </label>
                  <select required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl">
                    <option value="">Select timeline</option>
                    <option>Immediately</option>
                    <option>3 Months</option>
                    <option>6 Months</option>
                    <option>1 Year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 4 */}
            <div>
              <h2 className="text-5xl font-bold mb-10">
                Section 4 — Experience & Background
              </h2>

              <div className="space-y-8">
                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Do you have experience in this industry? <span className="text-red-600">*</span>
                  </label>
                  <select required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl">
                    <option value="">Select answer</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    If yes, explain briefly. If no, write “No experience yet.” <span className="text-red-600">*</span>
                  </label>
                  <textarea required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl min-h-[160px]" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Have you ever owned a business before? <span className="text-red-600">*</span>
                  </label>
                  <select required className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl">
                    <option value="">Select answer</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 5 */}
            <div>
              <h2 className="text-5xl font-bold mb-10">
                Section 5 — Training Commitment
              </h2>

              <div className="bg-[#f5f7fb] rounded-3xl p-10">
                <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                  The EPEW program includes entrepreneur preparation, training,
                  guidance, and development sessions. Estimated commitment may
                  be 2–4 hours per week.
                </p>

                <label className="flex items-start gap-4 text-2xl text-gray-700 leading-relaxed">
                  <input type="checkbox" required className="w-6 h-6 mt-1" />
                  <span>
                    I am willing to participate in entrepreneur preparation and training activities. <span className="text-red-600">*</span>
                  </span>
                </label>
              </div>
            </div>

            {/* SECTION 6 */}
            <div>
              <h2 className="text-5xl font-bold mb-10">
                Section 6 — Community Participation
              </h2>

              <div className="bg-[#f5f7fb] rounded-3xl p-10">
                <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                  EPEW operates through a structured community participation
                  ecosystem designed to help entrepreneurs prepare and grow
                  through organized supporter participation.
                </p>

                <label className="flex items-start gap-4 text-2xl text-gray-700 leading-relaxed">
                  <input type="checkbox" required className="w-6 h-6 mt-1" />
                  <span>
                    I understand and agree to participate in the EPEW community participation model. <span className="text-red-600">*</span>
                  </span>
                </label>
              </div>
            </div>

            {/* SECTION 7 */}
            <div>
              <h2 className="text-5xl font-bold mb-10">
                Section 7 — Optional Supporting Documents
              </h2>

              <div className="space-y-8">
                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Business Plan, optional
                  </label>
                  <input type="file" className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Resume, optional
                  </label>
                  <input type="file" className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Financial Projections, optional
                  </label>
                  <input type="file" className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-xl" />
                </div>

                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Business Photos, optional
                  </label>
                  <input type="file" className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-xl" />
                </div>
              </div>
            </div>

            {/* FINAL AGREEMENT */}
            <div className="bg-[#06245c] text-white rounded-3xl p-12">
              <h2 className="text-5xl font-bold mb-10">
                Final Confirmation
              </h2>

              <label className="flex items-start gap-4 text-2xl leading-relaxed">
                <input type="checkbox" required className="w-6 h-6 mt-1" />
                <span>
                  I confirm that the information provided is accurate and
                  understand that entrepreneur preparation, marketplace readiness,
                  and participation support depend on review, preparation, and
                  ecosystem conditions. <span className="text-red-300">*</span>
                </span>
              </label>
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="bg-green-600 text-white px-16 py-6 rounded-2xl text-3xl font-bold hover:bg-[#06245c] transition"
              >
                Submit Questionnaire
              </button>
            </div>

          </form>
        </div>
      </section>
    </main>
  );
}