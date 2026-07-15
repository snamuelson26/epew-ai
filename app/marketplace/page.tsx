"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MarketplacePage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [supporterName, setSupporterName] = useState("");
  const [supporterEmail, setSupporterEmail] = useState("");
  const [supportType, setSupportType] = useState("Weekly");
  const [units, setUnits] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .eq("marketplace_listed", true)
      .order("units_supported", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setBusinesses(data || []);
    setLoading(false);
  }

  function getProgress(app: any) {
    const supported = app.units_supported || 0;
    const required = app.units_required || 20;
    return Math.min(100, Math.round((supported / required) * 100));
  }

  function getAmount() {
    if (supportType === "Weekly") return units * 100;
    if (supportType === "Monthly") return units * 433;
    if (supportType === "Yearly") return units * 5200;
    return units * 100;
  }

  async function submitSupportCommitment() {
    if (!selectedBusiness) return;

    if (!supporterName || !supporterEmail) {
      alert("Please enter supporter name and email.");
      return;
    }

    setSubmitting(true);

    const amount = getAmount();

    const { error: insertError } = await supabase
      .from("support_commitments")
      .insert({
        supporter_name: supporterName,
        supporter_email: supporterEmail,
        entrepreneur_id: selectedBusiness.id,
        support_type: supportType,
        units,
        amount,
        status: "Pending",
      });

    if (insertError) {
      console.log(insertError);
      alert("Unable to submit support commitment.");
      setSubmitting(false);
      return;
    }

    const newUnitsSupported = (selectedBusiness.units_supported || 0) + units;

    const { error: updateError } = await supabase
      .from("entrepreneur_applications")
      .update({
        units_supported: newUnitsSupported,
      })
      .eq("id", selectedBusiness.id);

    setSubmitting(false);

    if (updateError) {
      console.log(updateError);
      alert("Commitment saved, but progress update failed.");
      return;
    }

    alert("Support commitment submitted successfully.");

    setSelectedBusiness(null);
    setSupporterName("");
    setSupporterEmail("");
    setSupportType("Weekly");
    setUnits(1);

    loadBusinesses();
  }

  if (loading) {
    return (
      <main className="min-h-screen p-10 bg-[#f5f7fb] text-[#06245c]">
        <p className="text-2xl font-bold">Loading Marketplace...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
        <h1 className="text-5xl font-extrabold mb-4">
          EPEW Business Marketplace
        </h1>

        <p className="text-xl text-gray-700">
          Discover approved entrepreneurs seeking EPEW support and review their
          funding opportunity before making a support commitment.
        </p>
      </div>

      {businesses.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <p className="text-2xl font-bold">
            No businesses are listed in the marketplace yet.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {businesses.map((app) => {
            const progress = getProgress(app);
            const supported = app.units_supported || 0;
            const required = app.units_required || 20;

            return (
              <div key={app.id} className="bg-white rounded-3xl shadow-xl p-8">
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-100 rounded-2xl overflow-hidden h-56 flex items-center justify-center">
                    {app.entrepreneur_photo_url ? (
                      <img
                        src={app.entrepreneur_photo_url}
                        alt="Entrepreneur"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500">Entrepreneur Photo</span>
                    )}
                  </div>

                  <div className="bg-gray-100 rounded-2xl overflow-hidden h-56 flex items-center justify-center">
                    {app.business_photo_url ? (
                      <img
                        src={app.business_photo_url}
                        alt="Business"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500">Business Photo</span>
                    )}
                  </div>
                </div>

                <h2 className="text-3xl font-bold mb-2">
                  {app.business_name || "Business Name"}
                </h2>

                <p className="text-xl text-gray-700 mb-4">
                  Entrepreneur: {app.full_name || "Entrepreneur"}
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-6 text-lg">
                  <p>
                    <strong>Business Stage:</strong>{" "}
                    {app.business_stage || "Not Assigned"}
                  </p>

                  <p>
                    <strong>Funding Goal:</strong>{" "}
                    {app.funding_request ? `$${app.funding_request}` : "$100,000"}
                  </p>

                  <p>
                    <strong>Funding Path:</strong>{" "}
                    {app.funding_path || "Queue Funding"}
                  </p>

                  <p>
                    <strong>Support Category:</strong>{" "}
                    {app.support_category || "Not Assigned"}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between font-bold mb-2">
                    <span>
                      Units Supported: {supported} / {required}
                    </span>
                    <span>{progress}%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-5">
                    <div
                      className="bg-green-600 h-5 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-5 mb-5">
                  <h3 className="text-xl font-bold mb-2">
                    Funding Opportunity Summary
                  </h3>

                  <p className="text-lg text-gray-700">
                    {app.funding_opportunity_description ||
                      app.video_description ||
                      "Funding opportunity summary will appear here."}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-5 text-lg">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="font-bold mb-2">Market Opportunity</h4>
                    <p>{app.market_opportunity || "Not provided yet."}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="font-bold mb-2">Proof of Concept</h4>
                    <p>{app.proof_of_concept || "Not provided yet."}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="font-bold mb-2">Competitive Advantage</h4>
                    <p>{app.competitive_advantage || "Not provided yet."}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="font-bold mb-2">Team Strength</h4>
                    <p>{app.team_strength || "Not provided yet."}</p>
                  </div>
                </div>

                {app.pitch_video_url && (
                  <div className="mb-5">
                    <video
                      src={app.pitch_video_url}
                      controls
                      className="w-full rounded-2xl shadow-lg max-h-[350px]"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBusiness(app)}
                  className="w-full mt-4 bg-[#06245c] text-white py-4 rounded-2xl text-xl font-bold hover:bg-green-600 transition"
                >
                  Support This Business
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
            <h2 className="text-3xl font-extrabold mb-3">
              Support {selectedBusiness.business_name}
            </h2>

            <p className="text-lg text-gray-700 mb-6">
              1 Unit = $100. Choose weekly, monthly, or yearly support.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <input
                type="text"
                value={supporterName}
                onChange={(e) => setSupporterName(e.target.value)}
                placeholder="Supporter Name"
                className="border rounded-xl p-4"
              />

              <input
                type="email"
                value={supporterEmail}
                onChange={(e) => setSupporterEmail(e.target.value)}
                placeholder="Supporter Email"
                className="border rounded-xl p-4"
              />

              <select
                value={supportType}
                onChange={(e) => setSupportType(e.target.value)}
                className="border rounded-xl p-4"
              >
                <option value="Weekly">Weekly - $100/unit</option>
                <option value="Monthly">Monthly - $433/unit</option>
                <option value="Yearly">Yearly - $5,200/unit</option>
              </select>

              <select
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="border rounded-xl p-4"
              >
                <option value={1}>1 Unit</option>
                <option value={2}>2 Units</option>
                <option value={5}>5 Units</option>
                <option value={10}>10 Units</option>
              </select>
            </div>

            <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-5 mb-5">
              <p className="text-2xl font-bold">
                Total Commitment: ${getAmount()}
              </p>

              <p className="text-lg mt-2">
                Potential participation benefit: Up to 6% annually.
              </p>

              <p className="text-sm text-gray-600 mt-2">
                Participation benefits are not guaranteed and depend on program
                performance, participation level, and EPEW policies.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={submitSupportCommitment}
                className="flex-1 bg-green-700 text-white py-4 rounded-2xl text-xl font-bold"
              >
                {submitting ? "Submitting..." : "Submit Commitment"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedBusiness(null)}
                className="flex-1 bg-gray-300 text-[#06245c] py-4 rounded-2xl text-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}