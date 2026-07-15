export default function AIAdminBackupCenterPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-2xl p-12 mb-10">
        <h1 className="text-6xl font-extrabold mb-5">
          AI Admin Backup Center
        </h1>

        <p className="text-2xl text-gray-700 leading-relaxed">
            The AI Admin continuously monitors platform operations, supports
            administrative efficiency, reviews entrepreneur readiness, assists
            with annual meeting preparation, tracks disbursement readiness,
            generates reports, and escalates urgent matters requiring human
            attention. The AI Admin also monitors pending administrative tasks
            after 72 hours, supports annual meeting operations, coordinates
            qualification reviews, tracks attendance, manages invitations and
            badges, and helps ensure entrepreneurs move efficiently through the
            EPEW development and funding process.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-8 mb-10">
        {[
          ["72h", "Review Trigger"],
          ["14", "Pending Tasks"],
          ["6", "Ready for Action"],
          ["3", "Urgent Escalations"],
        ].map(([number, label]) => (
          <div key={label} className="bg-white rounded-3xl p-8 shadow-xl text-center">
            <p className="text-5xl font-bold text-green-700 mb-3">
              {number}
            </p>
            <p className="text-xl font-bold text-gray-700">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border-l-8 border-yellow-500 rounded-3xl p-10 mb-10 shadow-xl">
        <h2 className="text-4xl font-bold mb-5">
          AI Admin 72-Hour Rule
        </h2>

        <p className="text-2xl text-gray-700 leading-relaxed">
          If a human admin does not act within 72 hours, the AI Admin reviews
          the pending task. Routine annual meeting tasks may be completed
          automatically if all required information is present. Financial
          disbursement matters are reviewed and prepared for approval, but
          urgent or unclear cases are escalated by text message.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Annual Meeting Automation
          </h2>

          <div className="space-y-5 text-2xl text-gray-700">
            <p>✅ Assign qualified entrepreneur to next available group</p>
            <p>✅ Track entrepreneur and guest attendance</p>
            <p>✅ Approve guest registration when information is complete</p>
            <p>✅ Send invitation with date, time, and address</p>
            <p>✅ Generate two printable badges</p>
            <p>✅ Record confirmed attendance</p>
            <p>✅ Move entrepreneur to Coach Funding Meeting</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Badge & Invitation Rules
          </h2>

          <div className="bg-[#f5f7fb] rounded-2xl p-6 mb-6">
            <p className="text-2xl font-bold mb-3">
              Entrepreneur Badge
            </p>
            <p className="text-xl text-gray-700">
              Includes entrepreneur name, business name, entrepreneur ID,
              annual meeting group, date, time, and address.
            </p>
          </div>

          <div className="bg-[#f5f7fb] rounded-2xl p-6">
            <p className="text-2xl font-bold mb-3">
              Guest Badge
            </p>
            <p className="text-xl text-gray-700">
              Includes guest name, linked entrepreneur, guest status,
              annual meeting group, date, time, and address.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
        <h2 className="text-5xl font-bold mb-8">
          72-Hour Pending Task Queue
        </h2>

        <div className="space-y-6">
          <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-6">
            <p className="text-2xl font-bold">
              John Doe — Doe Coffee Shop
            </p>
            <p className="text-xl text-gray-700 mt-2">
              Task: Assign to Annual Meeting Group #2
            </p>
            <p className="text-xl text-gray-700">
              Status: All criteria met • AI Admin may assign
            </p>
          </div>

          <div className="bg-yellow-50 border-l-8 border-yellow-500 rounded-2xl p-6">
            <p className="text-2xl font-bold">
              Maria B. — Maria Bakery
            </p>
            <p className="text-xl text-gray-700 mt-2">
              Task: Guest approval pending
            </p>
            <p className="text-xl text-gray-700">
              Status: Guest phone number missing • AI Admin requests information
            </p>
          </div>

          <div className="bg-red-50 border-l-8 border-red-500 rounded-2xl p-6">
            <p className="text-2xl font-bold">
              Green Auto Services
            </p>
            <p className="text-xl text-gray-700 mt-2">
              Task: Disbursement review
            </p>
            <p className="text-xl text-gray-700">
              Status: Compliance issue detected • urgent SMS required
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Urgent Escalation SMS
          </h2>

          <div className="bg-red-50 border-l-8 border-red-600 rounded-2xl p-6 mb-6">
            <p className="text-2xl font-bold text-red-700 mb-3">
              Alert Number
            </p>
            <p className="text-2xl text-gray-700">
              347-933-2244
            </p>
          </div>

          <p className="text-2xl text-gray-700 leading-relaxed">
            If the AI Admin finds missing documents, compliance issues,
            disbursement risk, unclear approval authority, or system conflicts,
            it sends an urgent text message to the human admin and logs the issue.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            AI Admin Approval Report
          </h2>

          <textarea
            className="w-full border-2 border-gray-300 rounded-2xl p-6 text-xl min-h-[260px]"
            placeholder="AI Admin report will summarize task reviewed, criteria checked, action taken, and reason for approval or escalation."
          />

          <button
            type="button"
            className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition mt-6"
          >
            Generate Approval Report
          </button>
        </div>
      </div>

      <div className="bg-[#06245c] text-white rounded-3xl shadow-2xl p-12">
        <h2 className="text-5xl font-bold mb-8">
          AI Admin Safety Rule
        </h2>

        <p className="text-2xl text-gray-200 leading-relaxed">
          The AI Admin may complete routine annual meeting operations when
          information is complete and rules are satisfied. If a case involves
          unclear facts, missing information, compliance concerns, or financial
          disbursement risk, the AI Admin must escalate the matter and create
          a written report before any final action.
        </p>
      </div>
    </main>
  );
}