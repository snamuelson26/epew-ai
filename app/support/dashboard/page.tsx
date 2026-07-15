export default function SupportDashboardPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">

          {/* HEADER */}
          <div className="bg-white rounded-3xl shadow-2xl p-14 mb-14">
            <h1 className="text-6xl font-extrabold mb-6">
              Supporter Dashboard
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed">
              Welcome to your EPEW supporter portal. Track your participation,
              supported entrepreneurs, units, projected benefits, disbursement
              eligibility, fund release status, and communication updates.
            </p>
          </div>

          {/* TOP STATUS CARDS */}
          <div className="grid md:grid-cols-4 gap-8 mb-14">
            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-3xl font-bold mb-3">Verification</h2>
              <p className="text-xl text-green-700 font-bold">Pending Review</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <div className="text-5xl mb-4">💳</div>
              <h2 className="text-3xl font-bold mb-3">Auto Payment</h2>
              <p className="text-xl text-green-700 font-bold">Setup Required</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <div className="text-5xl mb-4">🤝</div>
              <h2 className="text-3xl font-bold mb-3">Active Support</h2>
              <p className="text-xl text-gray-700">3 Entrepreneurs</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <div className="text-5xl mb-4">📈</div>
              <h2 className="text-3xl font-bold mb-3">Annual Support</h2>
              <p className="text-xl text-gray-700">$62,400</p>
            </div>
          </div>

          {/* PARTICIPATION SUMMARY */}
          <div className="bg-white rounded-3xl p-12 shadow-2xl mb-14">
            <h2 className="text-5xl font-bold mb-8">
              My Participation Summary
            </h2>

            <div className="grid md:grid-cols-4 gap-8 mb-10">
              <div className="bg-[#f5f7fb] rounded-2xl p-8 text-center">
                <p className="text-xl text-gray-600 mb-3">Total Units</p>
                <p className="text-5xl font-bold text-green-700">12</p>
              </div>

              <div className="bg-[#f5f7fb] rounded-2xl p-8 text-center">
                <p className="text-xl text-gray-600 mb-3">Weekly Units</p>
                <p className="text-5xl font-bold text-[#06245c]">4</p>
              </div>

              <div className="bg-[#f5f7fb] rounded-2xl p-8 text-center">
                <p className="text-xl text-gray-600 mb-3">Monthly Units</p>
                <p className="text-5xl font-bold text-[#06245c]">3</p>
              </div>

              <div className="bg-[#f5f7fb] rounded-2xl p-8 text-center">
                <p className="text-xl text-gray-600 mb-3">Annual Units</p>
                <p className="text-5xl font-bold text-[#06245c]">5</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-8">
                <p className="text-xl text-gray-600 mb-3">
                  Participation Benefits Earned
                </p>
                <p className="text-4xl font-bold text-green-700">
                  $XXX
                </p>
              </div>

              <div className="bg-yellow-50 border-l-8 border-yellow-500 rounded-2xl p-8">
                <p className="text-xl text-gray-600 mb-3">
                  Projected Benefits
                </p>
                <p className="text-4xl font-bold text-yellow-700">
                  $XXX
                </p>
              </div>

              <div className="bg-[#f5f7fb] border-l-8 border-[#06245c] rounded-2xl p-8">
                <p className="text-xl text-gray-600 mb-3">
                  Projected Disbursement Date
                </p>
                <p className="text-3xl font-bold text-[#06245c]">
                  Pending
                </p>
              </div>
            </div>
          </div>

          {/* SUPPORTED ENTREPRENEURS */}
          <div className="bg-white rounded-3xl p-12 shadow-2xl mb-14">
            <h2 className="text-5xl font-bold mb-8">
              My Supported Entrepreneurs
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xl">
                <thead>
                  <tr className="bg-[#06245c] text-white">
                    <th className="p-4 text-left">Entrepreneur</th>
                    <th className="p-4 text-left">Business</th>
                    <th className="p-4 text-center">Units</th>
                    <th className="p-4 text-center">Support Type</th>
                    <th className="p-4 text-right">Annual Support</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b bg-white">
                    <td className="p-4">John Doe</td>
                    <td className="p-4">Doe Coffee Shop</td>
                    <td className="p-4 text-center">5</td>
                    <td className="p-4 text-center">Weekly</td>
                    <td className="p-4 text-right">$26,000</td>
                    <td className="p-4 text-center">Building Support Base</td>
                  </tr>

                  <tr className="border-b bg-white">
                    <td className="p-4">Maria Louis</td>
                    <td className="p-4">Community Bakery</td>
                    <td className="p-4 text-center">4</td>
                    <td className="p-4 text-center">Monthly</td>
                    <td className="p-4 text-right">$20,800</td>
                    <td className="p-4 text-center">Annual Meeting Pending</td>
                  </tr>

                  <tr className="border-b bg-white">
                    <td className="p-4">David Brown</td>
                    <td className="p-4">Auto Detail Center</td>
                    <td className="p-4 text-center">3</td>
                    <td className="p-4 text-center">Annual</td>
                    <td className="p-4 text-right">$15,600</td>
                    <td className="p-4 text-center">In Preparation</td>
                  </tr>

                  <tr className="bg-green-50 font-bold">
                    <td className="p-4">TOTAL</td>
                    <td className="p-4"></td>
                    <td className="p-4 text-center">12</td>
                    <td className="p-4"></td>
                    <td className="p-4 text-right">$62,400</td>
                    <td className="p-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* DISBURSEMENT AGREEMENT */}
          <div className="bg-white rounded-3xl p-12 shadow-2xl mb-14">
            <h2 className="text-5xl font-bold mb-8">
              Disbursement Agreement
            </h2>

            <div className="bg-yellow-50 border-l-8 border-yellow-500 rounded-2xl p-8 mb-8">
              <p className="text-2xl text-gray-700 leading-relaxed">
                Full benefit disbursement requests are available only after the
                supported business has completed one full year of operation.
                Automatic participation benefit disbursement begins one year
                after the business operation start date.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-2xl text-gray-700">
              <p><strong>Business Operation Start Date:</strong> Pending</p>
              <p><strong>One-Year Eligibility Date:</strong> Pending</p>
              <p><strong>Projected Disbursement Date:</strong> Pending</p>
              <p><strong>Disbursement Status:</strong> Not Eligible Yet</p>
            </div>
          </div>

          {/* DISBURSEMENT REQUEST CENTER */}
          <div className="bg-white rounded-3xl p-12 shadow-2xl mb-14">
            <h2 className="text-5xl font-bold mb-8">
              Disbursement Request Center
            </h2>

            <div className="grid lg:grid-cols-2 gap-10">
              <div>
                <h3 className="text-3xl font-bold mb-6">
                  Request Details
                </h3>

                <div className="space-y-6">
                  <input
                    className="w-full border-2 border-gray-300 rounded-2xl p-5 text-xl"
                    placeholder="Amount Requested"
                  />

                  <input
                    className="w-full border-2 border-gray-300 rounded-2xl p-5 text-xl"
                    placeholder="Request Date"
                    type="date"
                  />

                  <input
                    className="w-full border-2 border-gray-300 rounded-2xl p-5 text-xl"
                    placeholder="Projected Fund Release Date"
                    type="date"
                  />

                  <input
                    className="w-full border-2 border-gray-300 rounded-2xl p-5 text-xl"
                    placeholder="Fund Available to Withdraw Date"
                    type="date"
                  />

                  <input
                    className="w-full border-2 border-gray-300 rounded-2xl p-5 text-xl"
                    placeholder="Withdraw Fund Date"
                    type="date"
                  />

                  <button
                    type="button"
                    className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
                  >
                    Request Disbursement
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-bold mb-6">
                  Disbursement Status
                </h3>

                <div className="space-y-5">
                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <p className="text-xl text-gray-600">Amount Requested</p>
                    <p className="text-3xl font-bold">$0</p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <p className="text-xl text-gray-600">Request Date</p>
                    <p className="text-3xl font-bold">Pending</p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <p className="text-xl text-gray-600">Fund Release Date</p>
                    <p className="text-3xl font-bold">Pending</p>
                  </div>

                  <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-6">
                    <p className="text-xl text-gray-600">
                      Fund Available to Withdraw
                    </p>
                    <p className="text-3xl font-bold text-green-700">
                      Not Available Yet
                    </p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <p className="text-xl text-gray-600">Withdraw Fund Date</p>
                    <p className="text-3xl font-bold">Pending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* REMINDER + PROTECTION LOGIC */}
          <div className="bg-white rounded-3xl p-12 shadow-2xl mb-14">
            <h2 className="text-5xl font-bold mb-8">
              Disbursement Protection Process
            </h2>

            <div className="grid lg:grid-cols-2 gap-10">
              <div className="bg-[#f5f7fb] rounded-3xl p-10">
                <h3 className="text-4xl font-bold mb-6">
                  Coach Reminder Process
                </h3>

                <ul className="space-y-5 text-2xl text-gray-700">
                  <li>✅ Coach reminds entrepreneur before the due date.</li>
                  <li>✅ Three reminders are sent within the 24 hours before the disbursement date.</li>
                  <li>✅ Reminder activity is recorded in the system.</li>
                  <li>✅ If no action is taken, the case is escalated to EPEW.</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-8 border-red-500 rounded-3xl p-10">
                <h3 className="text-4xl font-bold mb-6">
                  Escalation & Reimbursement Procedure
                </h3>

                <p className="text-2xl text-gray-700 leading-relaxed">
                  If a benefit disbursement is due, funds are available, and
                  the entrepreneur does not complete the required disbursement,
                  EPEW may escalate the matter, assist the supporter through
                  available protection procedures, and place the entrepreneur
                  into a reimbursement review process with the appropriate
                  department.
                </p>
              </div>
            </div>
          </div>

          {/* SECURITY RESERVE NOTICE */}
          <div className="bg-[#06245c] text-white rounded-3xl p-12 shadow-2xl">
            <h2 className="text-5xl font-bold mb-8">
              Security Reserve Protection Notice
            </h2>

            <p className="text-2xl text-gray-200 leading-relaxed mb-8">
              EPEW may maintain a security reserve intended to help reduce
              supporter risk and provide limited recovery assistance when a
              participating business fails to complete an approved benefit
              disbursement after proper notice, reminders, and escalation review.
            </p>

            <div className="bg-white text-[#06245c] rounded-2xl p-8">
              <p className="text-2xl font-bold leading-relaxed">
                Security reserve assistance is subject to available reserve
                funds, EPEW review, program rules, and documented eligibility.
              </p>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}