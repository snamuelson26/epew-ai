"use client";

import { useState } from "react";

interface ManageBillingButtonProps {
  stripeCustomerId?: string | null;
}

export default function ManageBillingButton({
  stripeCustomerId,
}: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleManageBilling() {
    if (!stripeCustomerId) {
      alert("No Stripe customer account was found.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/stripe/customer-portal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stripeCustomerId,
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to open Stripe Billing Portal.");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to connect to Stripe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleManageBilling}
      disabled={loading}
      className="w-full rounded-2xl bg-[#06245c] py-4 text-lg font-bold text-white transition hover:bg-[#0a347d] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Opening Billing Portal..." : "Manage Billing"}
    </button>
  );
}