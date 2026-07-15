export default function AdminQualificationListPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-2xl p-12 mb-10">
        <h1 className="text-6xl font-extrabold mb-5">
          Annual Meeting Qualification List
        </h1>

        <p className="text-2xl text-gray-700 leading-relaxed">
          Organize qualified entrepreneurs into annual meeting groups of 50
          entrepreneurs. Each entrepreneur may bring one guest.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-8 mb-10">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <p className="text-5xl font-bold text-green-700 mb-3">50</p>
          <p className="text-xl font-bold text-gray-700">Entrepreneurs Per Group</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <p className="text-5xl font-bold text-green-700 mb-3">1</p>
          <p className="text-xl font-bold text-gray-700">Guest Per Entrepreneur</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <p className="text-5xl font-bold text-[#06245c] mb-3">100</p>
          <p className="text-xl font-bold text-gray-700">Total Attendance</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <p className="text-5xl font-bold text-yellow-600 mb-3">18/50</p>
          <p className="text-xl font-bold text-gray-700">Current Group Progress</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
        <h2 className="text-5xl font-bold mb-8">
          Annual Meeting Groups
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-6">
            <p className="text-3xl font-bold text-green-700 mb-3">
              Group #1
            </p>
            <p className="text-2xl text-gray-700">
              50 / 50 Qualified
            </p>
            <p className="text-xl text-gray-600 mt-2">
              Ready for annual meeting scheduling.
            </p>
          </div>

          <div className="bg-yellow-50 border-l-8 border-yellow-500 rounded-2xl p-6">
            <p className="text-3xl font-bold text-yellow-700 mb-3">
              Group #2
            </p>
            <p className="text-2xl text-gray-700">
              18 / 50 Qualified
            </p>
            <p className="text-xl text-gray-600 mt-2">
              Collecting qualified entrepreneurs.
            </p>
          </div>

          <div className="bg-[#f5f7fb] border-l-8 border-[#06245c] rounded-2xl p-6">
            <p className="text-3xl font-bold text-[#06245c] mb-3">
              Group #3
            </p>
            <p className="text-2xl text-gray-700">
              Not Open Yet
            </p>
            <p className="text-xl text-gray-600 mt-2">
              Opens after Group #2 reaches 50.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
        <h2 className="text-5xl font-bold mb-8">
          Qualification Priority Rules
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-green-50 rounded-2xl p-6 border-l-8 border-green-600">
            <h3 className="text-2xl font-bold text-green-700 mb-3">
              Row 1
            </h3>
            <p className="text-xl text-gray-700">
              Entrepreneurs with 20 units supported for the whole year.
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border-l-8 border-blue-600">
            <h3 className="text-2xl font-bold text-blue-700 mb-3">
              Row 2
            </h3>
            <p className="text-xl text-gray-700">
              Entrepreneurs with 20 units supported.
            </p>
          </div>

          <div className="bg-yellow-50 rounded-2xl p-6 border-l-8 border-yellow-500">
            <h3 className="text-2xl font-bold text-yellow-700 mb-3">
              Row 3
            </h3>
            <p className="text-xl text-gray-700">
              Admin-approved exceptions.
            </p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-6 border-l-8 border-gray-500">
            <h3 className="text-2xl font-bold text-gray-700 mb-3">
              Row 4
            </h3>
            <p className="text-xl text-gray-700">
              Waiting list and not-yet-qualified entrepreneurs.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Row 1: 20 Units Supported for Whole Year
          </h2>

          <div className="space-y-5">
            {[
              ["John Doe", "Doe Coffee Shop", "20 annual units", "Guest Confirmed"],
              ["Marie Louis", "Marie Bakery", "20 annual units", "Guest Pending"],
              ["Samuel Pierre", "Green Services", "20 annual units", "Guest Confirmed"],
            ].map(([name, business, units, guest]) => (
              <div key={name} className="bg-green-50 rounded-2xl p-6 border-l-8 border-green-600">
                <p className="text-2xl font-bold">{name} — {business}</p>
                <p className="text-xl text-gray-700 mt-2">{units}</p>
                <p className="text-xl text-gray-700">{guest}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Row 2: 20 Units Supported
          </h2>

          <div className="space-y-5">
            {[
              ["Maria B.", "Community Bakery", "20 units", "Guest Pending"],
              ["Jean R.", "Auto Detail Center", "20 units", "Guest Not Added"],
              ["Claudia M.", "Beauty Supply", "20 units", "Guest Confirmed"],
            ].map(([name, business, units, guest]) => (
              <div key={name} className="bg-blue-50 rounded-2xl p-6 border-l-8 border-blue-600">
                <p className="text-2xl font-bold">{name} — {business}</p>
                <p className="text-xl text-gray-700 mt-2">{units}</p>
                <p className="text-xl text-gray-700">{guest}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Admin Exceptions
          </h2>

          <div className="space-y-5">
            <div className="bg-yellow-50 rounded-2xl p-6 border-l-8 border-yellow-500">
              <p className="text-2xl font-bold">Nadia C. — Childcare Center</p>
              <p className="text-xl text-gray-700 mt-2">
                Exception reason: Strong community impact and high readiness score.
              </p>
              <p className="text-xl text-gray-700">
                Admin Status: Approved Exception
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Waiting List
          </h2>

          <div className="space-y-5">
            <div className="bg-gray-100 rounded-2xl p-6 border-l-8 border-gray-500">
              <p className="text-2xl font-bold">Alex T. — Mobile Car Wash</p>
              <p className="text-xl text-gray-700 mt-2">
                Units Supported: 14 / 20
              </p>
              <p className="text-xl text-gray-700">
                Status: Waiting for qualification
              </p>
            </div>

            <div className="bg-gray-100 rounded-2xl p-6 border-l-8 border-gray-500">
              <p className="text-2xl font-bold">Rose M. — Catering Service</p>
              <p className="text-xl text-gray-700 mt-2">
                Units Supported: 11 / 20
              </p>
              <p className="text-xl text-gray-700">
                Status: Waiting for qualification
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#06245c] text-white rounded-3xl shadow-2xl p-12">
        <h2 className="text-5xl font-bold mb-8">
          Admin Actions
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          <button className="bg-green-600 text-white py-5 rounded-2xl text-2xl font-bold hover:bg-white hover:text-[#06245c] transition">
            Send Invitations
          </button>

          <button className="bg-white text-[#06245c] py-5 rounded-2xl text-2xl font-bold hover:bg-green-500 hover:text-white transition">
            Confirm Guests
          </button>

          <button className="border-2 border-white text-white py-5 rounded-2xl text-2xl font-bold hover:bg-white hover:text-[#06245c] transition">
            Create New Group
          </button>

          <button className="border-2 border-green-400 text-green-400 py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 hover:text-white transition">
            Export List
          </button>
        </div>

        <p className="text-2xl text-gray-200 leading-relaxed mt-10">
          Every time 50 entrepreneurs qualify, EPEW may create a new annual
          meeting group for that cohort. Admin may approve exceptions based on
          readiness, community impact, or organizational priority.
        </p>
      </div>
    </main>
  );
}