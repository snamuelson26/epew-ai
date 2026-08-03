"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ImpactCenterPage() {
  const [loading, setLoading] = useState(true);
  const [projection, setProjection] = useState<any>(null);

  useEffect(() => {
    loadImpactData();
  }, []);

  async function loadImpactData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/supporters/login";
      return;
    }

    const { data: supporter } = await supabase
      .from("supporters")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!supporter) {
      window.location.href = "/supporters/login";
      return;
    }

    const { data: projectionData } = await supabase
      .from("supporter_projections")
      .select("*")
      .eq("supporter_id", supporter.id)
      .maybeSingle();

    setProjection(projectionData);
    setLoading(false);
  }

  const businessesSupported = Number(projection?.businesses_supported || 0);
  const totalUnits = Number(projection?.total_units || 0);
  const totalContributions = Number(projection?.total_contributions || 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8">
        <p className="text-2xl font-bold text-[#06245c]">
          Loading impact center...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <div className="mb-8 rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="mb-3 text-5xl font-extrabold">Impact Center</h1>

        <p className="text-xl text-gray-700">
          Measure the impact you are creating through your participation in the
          EPEW ecosystem.
        </p>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <ImpactCard
          title="Businesses Supported"
          value={businessesSupported.toLocaleString()}
        />

        <ImpactCard
          title="Total Units"
          value={totalUnits.toLocaleString()}
        />

        <ImpactCard
          title="Total Contributions"
          value={`$${totalContributions.toLocaleString()}`}
          green
        />
      </div>

      <div className="mb-8 rounded-3xl bg-white p-10 shadow-xl">
        <h2 className="mb-8 text-3xl font-bold">Lifetime Impact</h2>

        <div className="grid gap-6 text-lg md:grid-cols-2">
          <p>
            <strong>Entrepreneurs Supported:</strong>{" "}
            {businessesSupported.toLocaleString()}
          </p>

          <p>
            <strong>Total Units Supported:</strong>{" "}
            {totalUnits.toLocaleString()}
          </p>

          <p>
            <strong>Total Contributions:</strong>{" "}
            ${totalContributions.toLocaleString()}
          </p>

          <p>
            <strong>Years with EPEW:</strong> 1
          </p>

          <p>
            <strong>Participation Benefits:</strong> Subject to EPEW policies
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border-2 border-green-500 bg-green-50 p-10 shadow-xl">
        <h2 className="mb-8 text-3xl font-bold">Participation Benefit</h2>

        <div className="text-center">
          <p className="mb-6 text-6xl font-extrabold text-green-700">
            Up to 6% Annually
          </p>

          <a
            href="/epew-policies"
            className="text-lg underline hover:text-green-700"
          >
            See EPEW policies and program performance
          </a>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-10 shadow-xl">
        <h2 className="mb-6 text-3xl font-bold">Future Impact Features</h2>

        <div className="space-y-4 text-xl">
          <p>✅ Success Stories</p>
          <p>✅ Jobs Created</p>
          <p>✅ Communities Impacted</p>
          <p>✅ Churches Supported</p>
          <p>✅ Nonprofit Organizations Supported</p>
          <p>✅ Videos and Quarterly Reports</p>
        </div>
      </div>
    </main>
  );
}

function ImpactCard({
  title,
  value,
  green = false,
}: {
  title: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl">
      <h3 className="mb-3 text-xl font-bold">{title}</h3>

      <p
        className={`text-5xl font-extrabold ${
          green ? "text-green-700" : "text-[#06245c]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}