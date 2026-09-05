"use client";

import { useEffect, useState } from "react";

export default function MySupportedBusinessesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    void loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/supporters/my-supported-businesses", {
        cache: "no-store",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        setError(result?.message || "Unable to load your supported businesses.");
        setData(null);
      } else {
        setData(result);
      }
    } catch {
      setError("Unable to load your supported businesses.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl"><p className="text-lg font-semibold text-gray-700">Loading your supported businesses...</p></div></main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-[#06245c] to-green-700 p-6 text-white shadow-xl md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-lime-300">Supporter Portal</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">My Supported Businesses</h1>
          <p className="mt-3 max-w-3xl text-white/90">See the businesses connected to your support, the units you selected, and the units that have been confirmed after payment.</p>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800">{error}</div>}

        {data && (
          <>
            <section className="mb-8 grid gap-4 sm:grid-cols-3">
              <Metric label="Units Selected" value={data.totals?.selectedUnits || 0} />
              <Metric label="Supported Units" value={data.totals?.supportedUnits || 0} />
              <Metric label="Pending Payment" value={data.totals?.pendingUnits || 0} />
            </section>

            <section className="space-y-5">
              {(data.businesses || []).length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900">No supported business yet</h2>
                  <p className="mt-3 text-gray-600">Businesses will appear here as soon as you select or support an entrepreneur.</p>
                </div>
              ) : (
                data.businesses.map((item: any) => (
                  <article key={item.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-4xl">
                          {item.business?.business_logo ? <img src={item.business.business_logo} alt={item.businessName} className="h-full w-full object-contain p-2" /> : "🏢"}
                        </div>
                        <div className="min-w-0">
                          <h2 className="break-words text-2xl font-black text-[#06245c]">{item.businessName}</h2>
                          {item.entrepreneurName && <p className="mt-1 text-gray-600">{item.entrepreneurName}</p>}
                          {item.publicBusinessId && <p className="mt-1 font-bold text-green-700">Business ID: {item.publicBusinessId}</p>}
                        </div>
                      </div>

                      {item.publicBusinessId && (
                        <a href={`/support/${item.publicBusinessId}`} className="inline-flex w-full justify-center rounded-xl bg-[#06245c] px-5 py-3 font-bold text-white hover:bg-green-700 md:w-auto">View Business</a>
                      )}
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <Info label="Units Selected" value={item.selectedUnits || 0} />
                      <Info label="Supported Units" value={item.supportedUnits || 0} />
                      <Info label="Pending Payment" value={item.pendingUnits || 0} />
                    </div>

                    <p className="mt-4 text-sm text-gray-500">A unit becomes a Supported Unit after its payment is confirmed. Pending selections remain listed separately so they are not counted as completed support.</p>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-white p-5 text-center shadow-sm"><p className="text-sm font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-2 text-4xl font-black text-[#06245c]">{value}</p></div>;
}

function Info({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-bold text-gray-500">{label}</p><p className="mt-1 text-3xl font-black text-[#06245c]">{value}</p></div>;
}
