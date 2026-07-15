"use client";

import { useState } from "react";

interface StripeCheckoutButtonProps {
  entrepreneurId: string;
  entrepreneurName: string;
  businessName: string;
  supporterId?: string;
  units: number;
  frequency: "weekly" | "monthly" | "annual" | "one-time";
}

export default function StripeCheckoutButton({
  entrepreneurId,
  entrepreneurName,
  businessName,
  supporterId,
  units,
  frequency,
}: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/stripe/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entrepreneurId,
            entrepreneurName,
            businessName,
            supporterId,
            units,
            frequency,
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to start checkout.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full rounded-2xl bg-green-600 py-4 text-xl font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? "Redirecting to Stripe..." : "Support This Business"}
    </button>
  );
}