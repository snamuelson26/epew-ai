import Link from "next/link";

export default function PaymentCancelledPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-8 py-24 text-[#06245c]">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-12 text-center shadow-2xl">
        <div className="mb-6 text-7xl">⚠️</div>

        <h1 className="text-5xl font-extrabold">
          Payment Cancelled
        </h1>

        <p className="mt-8 text-2xl leading-relaxed text-gray-700">
          Your payment was not completed. You may return to the supporter page
          and try again when you are ready.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-5 md:flex-row">
          <Link
            href="/supporters"
            className="rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-bold text-white hover:bg-green-700"
          >
            Return to Supporters Page
          </Link>

          <Link
            href="/"
            className="rounded-2xl bg-white px-10 py-5 text-2xl font-bold text-[#06245c] ring-2 ring-[#06245c] hover:bg-gray-100"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}