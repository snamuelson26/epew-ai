"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SupportRegisterRedirectPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
          <p className="text-2xl font-bold">
            Redirecting to supporter registration...
          </p>
        </main>
      }
    >
      <SupportRegisterRedirectContent />
    </Suspense>
  );
}

function SupportRegisterRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const businessId = searchParams.get("business_id");
    const next = searchParams.get("next");

    let url = "/supporters/register";

    const params = new URLSearchParams();

    if (businessId) {
      params.set("business_id", businessId);
    }

    if (next) {
      params.set("next", next);
    }

    const query = params.toString();

    if (query) {
      url += `?${query}`;
    }

    window.location.replace(url);
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
      <p className="text-2xl font-bold">
        Redirecting to supporter registration...
      </p>
    </main>
  );
}