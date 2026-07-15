import Image from "next/image";

export default function SupportVerifyPage() {
  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c]">

      <section className="py-24">

        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-14 items-center">

          {/* LEFT */}
          <div>

            <h1 className="text-7xl font-extrabold leading-tight mb-10">
              Verify Your Account
            </h1>

            <p className="text-3xl text-gray-700 leading-relaxed mb-12">
              EPEW uses secure verification systems to help protect supporters,
              entrepreneurs, and ecosystem integrity through identity validation
              and two-factor authentication.
            </p>

            <Image
              src="/images/supporter-final-notice.png"
              alt="2FA Verification"
              width={700}
              height={600}
              className="rounded-3xl shadow-2xl"
              priority
            />

          </div>

          {/* RIGHT */}
          <div className="bg-white rounded-3xl shadow-2xl p-12">

            <h2 className="text-5xl font-bold mb-10 text-center">
              2FA Verification
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

              {/* PHONE */}
              <div>
                <label className="block text-2xl font-bold mb-3">
                  Phone Number
                </label>

                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl focus:outline-none focus:border-green-600"
                />
              </div>

              {/* CODE */}
              <div>
                <label className="block text-2xl font-bold mb-3">
                  Verification Code
                </label>

                <input
                  type="text"
                  placeholder="Enter verification code"
                  className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl tracking-[10px] text-center focus:outline-none focus:border-green-600"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-5">

                <button
                  type="button"
                  className="w-full bg-green-600 text-white py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
                >
                  Send Verification Code
                </button>

                <button
                  type="submit"
                  className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
                >
                  Verify Account
                </button>

              </div>

            </form>

            {/* SECURITY NOTE */}
            <div className="mt-12 bg-[#f5f7fb] rounded-2xl p-8">

              <h3 className="text-3xl font-bold mb-4">
                Security Protection
              </h3>

              <p className="text-xl text-gray-700 leading-relaxed">
                Two-factor authentication helps secure your EPEW account,
                protect participation activity, and reduce unauthorized access.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* IMPORTANT NOTICE */}
      <section className="pb-24">

        <div className="max-w-6xl mx-auto px-8 text-center">

          <p className="text-2xl text-gray-700 leading-relaxed">
            Identity verification and secure authentication are required
            before participating in the EPEW ecosystem.
          </p>

        </div>

      </section>

    </main>
  );
}