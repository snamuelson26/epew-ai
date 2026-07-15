"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BUSINESS_ID = 2;

export default function FundingPitchPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pitch, setPitch] = useState<any>({
    business_name: "",
    full_name: "",
    business_stage: "Startup",
    pitch_video_url: "",
    funding_opportunity_description: "",
    market_opportunity: "",
    proof_of_concept: "",
    competitive_advantage: "",
    team_strength: "",
    financial_projection_summary: "",
    capital_return_plan: "",
  });

  useEffect(() => {
    loadPitch();
  }, []);

  async function loadPitch() {
    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .eq("id", BUSINESS_ID)
      .single();

    if (error) {
      console.log(error);
      alert("Unable to load funding pitch.");
      setLoading(false);
      return;
    }

    setPitch(data);
    setLoading(false);
  }

  function updateField(field: string, value: string) {
    setPitch((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function savePitch() {
    setSaving(true);

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        business_stage: pitch.business_stage,
        pitch_video_url: pitch.pitch_video_url,
        funding_opportunity_description:
          pitch.funding_opportunity_description,
        market_opportunity: pitch.market_opportunity,
        proof_of_concept: pitch.proof_of_concept,
        competitive_advantage: pitch.competitive_advantage,
        team_strength: pitch.team_strength,
        financial_projection_summary:
          pitch.financial_projection_summary,
        capital_return_plan: pitch.capital_return_plan,
      })
      .eq("id", BUSINESS_ID);

    setSaving(false);

    if (error) {
      console.log(error);
      alert("Unable to save funding pitch.");
      return;
    }

    alert("Funding pitch saved successfully.");
  }

  async function uploadPitchVideo(file: File) {
    const fileName = `${BUSINESS_ID}-${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("pitch-videos")
      .upload(fileName, file);

    if (error) {
      console.log(error);
      alert("Video upload failed.");
      return;
    }

    const { data } = supabase.storage
      .from("pitch-videos")
      .getPublicUrl(fileName);

    updateField("pitch_video_url", data.publicUrl);

    alert("Pitch video uploaded. Click Save Pitch to save it.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <p className="text-2xl font-bold">Loading Funding Pitch...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">
          Funding Pitch Manager
        </h1>

        <p className="text-xl text-gray-700">
          Prepare the funding opportunity that supporters will review in the
          EPEW Business Marketplace.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h2 className="text-3xl font-bold mb-6">
          Business Pitch Information
        </h2>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <input
            className="border rounded-xl p-4 bg-gray-100"
            value={pitch.business_name || ""}
            readOnly
          />

          <input
            className="border rounded-xl p-4 bg-gray-100"
            value={pitch.full_name || ""}
            readOnly
          />

          <select
            value={pitch.business_stage || "Startup"}
            onChange={(e) =>
              updateField("business_stage", e.target.value)
            }
            className="border rounded-xl p-4"
          >
            <option value="Startup">Startup</option>
            <option value="Operating Business">
              Operating Business
            </option>
            <option value="Expansion Project">
              Expansion Project
            </option>
          </select>
        </div>

        <label className="block font-bold mb-2">
          Funding Opportunity Description
        </label>
        <textarea
          className="border rounded-xl p-4 w-full h-36 mb-5"
          value={pitch.funding_opportunity_description || ""}
          onChange={(e) =>
            updateField(
              "funding_opportunity_description",
              e.target.value
            )
          }
          placeholder="Explain the funding opportunity, business model, and why supporters should consider supporting this entrepreneur."
        />

        <label className="block font-bold mb-2">
          Market Opportunity
        </label>
        <textarea
          className="border rounded-xl p-4 w-full h-32 mb-5"
          value={pitch.market_opportunity || ""}
          onChange={(e) =>
            updateField("market_opportunity", e.target.value)
          }
          placeholder="Describe the market demand, customer need, and growth potential."
        />

        <label className="block font-bold mb-2">
          Proof of Concept / Traction
        </label>
        <textarea
          className="border rounded-xl p-4 w-full h-32 mb-5"
          value={pitch.proof_of_concept || ""}
          onChange={(e) =>
            updateField("proof_of_concept", e.target.value)
          }
          placeholder="Describe existing customers, sales, contracts, pilot activity, or operational history."
        />

        <label className="block font-bold mb-2">
          Competitive Advantage
        </label>
        <textarea
          className="border rounded-xl p-4 w-full h-32 mb-5"
          value={pitch.competitive_advantage || ""}
          onChange={(e) =>
            updateField("competitive_advantage", e.target.value)
          }
          placeholder="Explain what makes this business different or stronger than competitors."
        />

        <label className="block font-bold mb-2">
          Team Strength
        </label>
        <textarea
          className="border rounded-xl p-4 w-full h-32 mb-5"
          value={pitch.team_strength || ""}
          onChange={(e) =>
            updateField("team_strength", e.target.value)
          }
          placeholder="Explain why the entrepreneur or team is capable of succeeding."
        />

        <label className="block font-bold mb-2">
          Financial Projection Summary
        </label>
        <textarea
          className="border rounded-xl p-4 w-full h-32 mb-5"
          value={pitch.financial_projection_summary || ""}
          onChange={(e) =>
            updateField(
              "financial_projection_summary",
              e.target.value
            )
          }
          placeholder="Summarize expected revenue, growth, expenses, and sustainability."
        />

        <label className="block font-bold mb-2">
          Capital Utilization / Return Plan
        </label>
        <textarea
          className="border rounded-xl p-4 w-full h-32"
          value={pitch.capital_return_plan || ""}
          onChange={(e) =>
            updateField("capital_return_plan", e.target.value)
          }
          placeholder="Explain how EPEW capital will be used and how the business plans to generate results."
        />
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h2 className="text-3xl font-bold mb-6">
          Pitch Video Upload
        </h2>

        <input
          type="file"
          accept="video/*"
          onChange={(e) =>
            e.target.files?.[0] &&
            uploadPitchVideo(e.target.files[0])
          }
        />

        {pitch.pitch_video_url && (
          <div className="mt-6">
            <p className="font-bold mb-3">Current Pitch Video</p>

            <video
              src={pitch.pitch_video_url}
              controls
              className="w-full rounded-2xl shadow-lg max-h-[500px]"
            />
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={savePitch}
          className="bg-green-700 text-white px-8 py-4 rounded-2xl text-xl font-bold"
        >
          {saving ? "Saving..." : "Save Funding Pitch"}
        </button>

        <a
          href="/marketplace"
          target="_blank"
          className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold"
        >
          Preview Marketplace
        </a>
      </div>
    </main>
  );
}