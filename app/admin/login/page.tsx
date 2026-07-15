export default function AdminLoginPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c] flex items-center justify-center px-8">
      <div className="bg-white rounded-3xl shadow-2xl p-14 max-w-3xl w-full">

        <h1 className="text-6xl font-extrabold text-center mb-8">
          Admin Login
        </h1>

        <p className="text-2xl text-gray-700 text-center leading-relaxed mb-12">
          Authorized EPEW administrators can access the control center to manage
          entrepreneurs, coaches, supporters, marketplace activation, and disbursements.
        </p>

        <form action="/admin/dashboard" className="space-y-8">

          <div>
            <label className="block text-2xl font-bold mb-3">
              Email Address
            </label>

            <input
              type="email"
              required
              className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl"
            />
          </div>

          <div>
            <label className="block text-2xl font-bold mb-3">
              Password
            </label>

            <input
              type="password"
              required
              className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
          >
            Login to Admin Dashboard
          </button>

        </form>

        <p className="text-center text-xl text-gray-600 mt-10">
          Admin access is restricted to authorized EPEW leadership only.
        </p>

      </div>
    </main>
  );
}