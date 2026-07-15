import Link from "next/link";

export default function EmailAlreadyConfirmedPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-xl">
        <h1 className="text-4xl font-extrabold text-[#10246f]">
          Your Email Is Already Confirmed
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-slate-700">
          Our records show that your email address has already been
          verified.
        </p>

        <p className="mt-3 text-lg leading-relaxed text-slate-700">
          Your Entrepreneur Portal is active and ready to use.
        </p>

        <Link
          href="/entrepreneurs/login"
          className="mt-8 inline-flex rounded-xl bg-[#10246f] px-7 py-4 font-bold text-white hover:bg-green-700"
        >
          Login to Your Entrepreneur Portal
        </Link>

        <p className="mt-6 text-sm text-slate-500">
          Need help? Contact welcome@epew.us
        </p>
      </div>
    </main>
  );
}