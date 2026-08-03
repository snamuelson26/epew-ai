"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SupportBusinessPage() {
  const params = useParams();
  const id = params.id as string;

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [supportType, setSupportType] = useState("Weekly");
  const [units, setUnits] = useState(1);
  const [customAmount, setCustomAmount] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    loadBusiness();
  }, [id]);

  async function loadBusiness() {
    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setBusiness(data);
    setLoading(false);
  }

  function getAmount() {
    if (supportType === "Weekly") return units * 100;
    if (supportType === "Monthly") return Math.round(units * 433);
    if (supportType === "Yearly") return units * 5200;
    if (supportType === "One-Time") return Number(customAmount || 0);
    return 0;
  }

  async function continueToCheckout() {
    if (!acknowledged) {
      alert("Please acknowledge the EPEW support participation terms.");
      return;
    }

    if (getAmount() < 100) {
      alert("Minimum support contribution is $100.");
      return;
    }

    alert(
      `Support recorded for testing: $${getAmount()} ${supportType}. Stripe will be connected next.`
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <p className="text-2xl font-bold">Loading support page...</p>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <p className="text-2xl font-bold">Business not found.</p>
      </main>
    );
  }

  const amount = getAmount();

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">
          Support This Business
        </h1>

        <p className="text-2xl text-gray-700">
          {business.business_name} — {business.full_name}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-4">
            Business Information
          </h2>

          <p className="text-xl mb-3">
            <strong>Business:</strong> {business.business_name}
          </p>

          <p className="text-xl mb-3">
            <strong>Entrepreneur:</strong> {business.full_name}
          </p>

          <p className="text-xl mb-3">
            <strong>Funding Goal:</strong>{" "}
            {business.funding_request
              ? `$${business.funding_request}`
              : "$100,000"}
          </p>

          <p className="text-xl mb-3">
            <strong>Units Supported:</strong>{" "}
            {business.units_supported || 0} / {business.units_required || 20}
          </p>

          <p className="text-lg text-gray-700 mt-5">
            {business.business_description || "No description available."}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-6">
            Choose Support Option
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {["Weekly", "Monthly", "Yearly", "One-Time"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSupportType(type)}
                className={`p-4 rounded-xl font-bold border-2 ${
                  supportType === type
                    ? "bg-[#06245c] text-white border-[#06245c]"
                    : "bg-white text-[#06245c] border-gray-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {supportType !== "One-Time" ? (
            <div className="mb-6">
              <label className="block font-bold mb-2">
                Select Units
              </label>

              <select
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full border rounded-xl p-4 text-xl"
              >
                <option value={1}>1 Unit</option>
                <option value={2}>2 Units</option>
                <option value={5}>5 Units</option>
                <option value={10}>10 Units</option>
              </select>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block font-bold mb-2">
                Custom Amount
              </label>

              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Minimum $100"
                className="w-full border rounded-xl p-4 text-xl"
              />
            </div>
          )}

          <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-6 mb-6">
            <p className="text-2xl font-bold">
              Contribution Amount: ${amount}
            </p>

            <p className="text-lg mt-2">
              Potential Participation Benefit: Up to 6% annually*
            </p>

            <p className="text-sm text-gray-600 mt-2">
              *Participation benefits are not guaranteed and depend on program
              performance, participation level, and EPEW policies.
            </p>
          </div>

          <label className="flex gap-3 text-lg mb-6">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />

            <span>
              I understand that I am supporting entrepreneur development
              through the EPEW ecosystem. I understand that any participation
              benefit is not guaranteed and may be up to 6% annually based on
              program performance and applicable policies.
            </span>
          </label>

          <button
            type="button"
            onClick={continueToCheckout}
            className="w-full bg-green-700 text-white py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </main>
  );
}