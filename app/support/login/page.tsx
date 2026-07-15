import Image from "next/image";

export default function SupportLoginPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">

      {/* HERO */}
      <section className="py-24">

        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-14 items-center">

          {/* LEFT */}
          <div>

            <h1 className="text-7xl font-extrabold leading-tight mb-10">
              Supporter Login
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed mb-12">
              Access your supporter dashboard, follow entrepreneur progress,
              review participation activity, and manage your EPEW account securely.
            </p>

            <Image
              src="/images/become-a-supporter.png"
              alt="Supporter Login"
              width={700}
              height={600}
              className="rounded-3xl shadow-2xl"
              priority
            />

          </div>

          {/* RIGHT */}
          <div className="bg-white rounded-3xl shadow-2xl p-12">

            <h2 className="text-5xl font-bold mb-10 text-center">
              Login
            </h2>

            <form className="space-y-8">

              {/* EMAIL */}
              <div>
                <label className="block text-2xl font-bold mb-3">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl focus:outline-none focus:border-green-600"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-2xl font-bold mb-3">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl focus:outline-none focus:border-green-600"
                />
              </div>

              {/* REMEMBER */}
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  className="w-6 h-6"
                />

                <span className="text-xl text-gray-700">
                  Remember me
                </span>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
              >
                Login Securely
              </button>

            </form>

            {/* LINKS */}
            <div className="mt-10 text-center space-y-4">

              <a
                href="/support/register"
                className="block text-2xl font-bold text-green-700 hover:underline"
              >
                Create Supporter Account
              </a>

              <a
                href="/support/verify"
                className="block text-2xl font-bold text-[#06245c] hover:underline"
              >
                Verify 2FA
              </a>

            </div>

          </div>

        </div>

      </section>

      {/* NOTICE */}
      <section className="pb-24">

        <div className="max-w-6xl mx-auto px-8 text-center">

          <p className="text-2xl text-gray-700 leading-relaxed">
            EPEW uses secure account protection, identity verification,
            and structured participation systems to help maintain
            transparency, accountability, and ecosystem integrity.
          </p>

        </div>

      </section>

    </main>
  );
}