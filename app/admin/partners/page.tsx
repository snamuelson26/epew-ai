export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">

      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Partners
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage approved EPEW partners, partnership status, activity, and access.
      </p>

      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-[#06245c] text-center">
          No approved partners yet.
        </h2>
      </div>

    </main>
  );
}