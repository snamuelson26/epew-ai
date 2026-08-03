"use client";

export default function MySupportedBusinessesPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
            Supporter Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            My Supported Businesses
          </h1>

          <p className="mt-3 max-w-3xl text-gray-600">
            Review the entrepreneurs and businesses you currently support
            through the EPEW Entrepreneur Development Ecosystem.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Supported Businesses
          </h2>

          <p className="mt-3 text-gray-600">
            Your supported businesses will appear here.
          </p>
        </section>
      </div>
    </main>
  );
}