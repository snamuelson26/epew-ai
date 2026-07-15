export default function EntrepreneurParticipationAgreementPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">

      <section className="py-24">

        <div className="max-w-6xl mx-auto px-8">

          <div className="bg-white rounded-3xl shadow-2xl p-14">

            <h1 className="text-6xl font-extrabold text-center mb-10">
              Entrepreneur Participation Agreement
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed text-center mb-12">
              This agreement outlines the entrepreneur participation
              terms within the Ekero Partners Empower Wealth (EPEW)
              entrepreneur ecosystem program.
            </p>

            {/* INTRODUCTION */}
            <div className="bg-[#f5f7fb] rounded-3xl p-10 shadow-xl mb-12">

              <h2 className="text-4xl font-bold mb-6">
                Entrepreneur Program Participation
              </h2>

              <p className="text-2xl text-gray-700 leading-relaxed">
                EPEW provides entrepreneur preparation,
                coaching coordination, onboarding support,
                campaign organization,
                and entrepreneur visibility assistance
                through its ecosystem development platform.
              </p>

            </div>

            {/* AGREEMENT TERMS */}
            <div className="max-h-[700px] overflow-y-scroll bg-[#f5f7fb] rounded-3xl p-10 border border-gray-300 space-y-8 text-xl text-gray-700 leading-relaxed mb-12">

              <h2 className="text-4xl font-bold text-[#06245c]">
                Agreement Terms
              </h2>

              <div>

                <h3 className="text-3xl font-bold mb-4">
                  1. Program Participation
                </h3>

                <p>
                  The Entrepreneur agrees to participate in the
                  EPEW entrepreneur preparation ecosystem,
                  including onboarding,
                  training guidance,
                  coaching communication,
                  and campaign preparation activities.
                </p>

              </div>

              <div>

                <h3 className="text-3xl font-bold mb-4">
                  2. Business Responsibility
                </h3>

                <p>
                  The Entrepreneur remains fully responsible for
                  all business activities,
                  legal compliance,
                  taxes,
                  licensing,
                  permits,
                  operations,
                  employees,
                  and business decisions.
                </p>

              </div>

              <div>

                <h3 className="text-3xl font-bold mb-4">
                  3. Platform Role
                </h3>

                <p>
                  EPEW acts solely as a platform organizer,
                  entrepreneur development coordinator,
                  and ecosystem support provider.
                </p>

                <p className="mt-4">
                  EPEW does not guarantee:
                </p>

                <ul className="list-disc pl-8 mt-4 space-y-2">

                  <li>funding approval</li>
                  <li>business success</li>
                  <li>supporter participation</li>
                  <li>profitability</li>
                  <li>campaign success</li>
                  <li>business launch outcomes</li>

                </ul>

              </div>

              <div>

                <h3 className="text-3xl font-bold mb-4">
                  4. Coach Communication
                </h3>

                <p>
                  The Entrepreneur understands that a personal coach
                  may contact the entrepreneur regarding onboarding,
                  preparation steps,
                  scheduling,
                  questionnaire completion,
                  business planning guidance,
                  and campaign readiness activities.
                </p>

              </div>

              <div>

                <h3 className="text-3xl font-bold mb-4">
                  5. Business Visibility Support
                </h3>

                <p>
                  One of EPEW’s business partners may also be introduced
                  during the entrepreneur preparation process
                  to assist with business presentation preparation,
                  media guidance,
                  entrepreneur visibility materials,
                  and communication support.
                </p>

              </div>

              <div>

                <h3 className="text-3xl font-bold mb-4">
                  6. Community Participation Structure
                </h3>

                <p>
                  The Entrepreneur understands that EPEW uses a
                  community participation ecosystem model where
                  supporters voluntarily participate in entrepreneur
                  campaigns through structured participation units.
                </p>

              </div>

              <div>

                <h3 className="text-3xl font-bold mb-4">
                  7. Risk Acknowledgment
                </h3>

                <p>
                  Business activities involve risk.
                  Campaign participation,
                  business launch,
                  supporter participation,
                  and business performance are not guaranteed.
                </p>

              </div>

              <div>

                <h3 className="text-3xl font-bold mb-4">
                  8. Independent Business Operation
                </h3>

                <p>
                  The Entrepreneur remains an independent business entity
                  and is not an employee,
                  legal representative,
                  financial agent,
                  or partner of EPEW.
                </p>

              </div>

              <div>

                <h3 className="text-3xl font-bold mb-4">
                  9. Dispute Resolution
                </h3>

                <p>
                  Any dispute related to entrepreneur business activities
                  shall remain the responsibility of the Entrepreneur.
                </p>

                <p className="mt-4">
                  If issues are reported to EPEW Counselor Services,
                  EPEW may voluntarily provide general communication support,
                  ecosystem guidance,
                  and informal coordination assistance.
                </p>

                <p className="mt-4">
                  EPEW does not provide legal representation,
                  financial advice,
                  judicial services,
                  or binding arbitration.
                </p>

              </div>

            </div>

            {/* CHECKBOXES */}
            <div className="space-y-6 mb-12">

              <label className="flex items-start gap-4 text-2xl text-gray-700 leading-relaxed">

                <input
                  type="checkbox"
                  required
                  className="w-6 h-6 mt-1"
                />

                <span>
                  I confirm that the information provided
                  during enrollment and onboarding is accurate.
                </span>

              </label>

              <label className="flex items-start gap-4 text-2xl text-gray-700 leading-relaxed">

                <input
                  type="checkbox"
                  required
                  className="w-6 h-6 mt-1"
                />

                <span>
                  I understand that EPEW does not guarantee
                  funding approval,
                  business success,
                  or campaign outcomes.
                </span>

              </label>

              <label className="flex items-start gap-4 text-2xl text-gray-700 leading-relaxed">

                <input
                  type="checkbox"
                  required
                  className="w-6 h-6 mt-1"
                />

                <span>
                  I voluntarily agree to participate
                  in the EPEW entrepreneur ecosystem program.
                </span>

              </label>

            </div>

            {/* BUTTON */}
            <div className="text-center">

              <button
                type="button"
                className="bg-[#06245c] text-white px-16 py-6 rounded-2xl text-3xl font-bold hover:bg-green-600 transition"
              >
                Accept Entrepreneur Participation Agreement
              </button>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}