import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-8 py-24 text-[#06245c]">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-12 text-center shadow-2xl">
        <div className="mb-6 text-7xl">✅</div>

        <h1 className="text-5xl font-extrabold">
          Payment Successful
        </h1>

        <p className="mt-8 text-2xl leading-relaxed text-gray-700">
          Thank you for your Business Support Contribution. Your participation
          helps strengthen entrepreneurs through the EPEW Entrepreneur
          Development Ecosystem.
        </p>

        <p className="mt-6 text-xl font-bold text-green-700">
          This is not an investment or guaranteed financial product.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-5 md:flex-row">
          <Link
            href="/supporters/dashboard"
            className="rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-bold text-white hover:bg-green-700"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/supporters"
            className="rounded-2xl bg-green-600 px-10 py-5 text-2xl font-bold text-white hover:bg-[#06245c]"
          >
            Support More Entrepreneurs
          </Link>
        </div>
      </div>
    </main>
  );
}