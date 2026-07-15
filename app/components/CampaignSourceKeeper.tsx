"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CampaignSourceKeeper() {
  const searchParams = useSearchParams();
  const campaign = searchParams.get("campaign");

  const [savedCampaign, setSavedCampaign] = useState("");

  useEffect(() => {
    if (campaign) {
      localStorage.setItem("epew_campaign_source", campaign);
      localStorage.setItem("epew_supported_entrepreneur", campaign);
      setSavedCampaign(campaign);
      return;
    }

    const stored = localStorage.getItem("epew_campaign_source") || "";
    setSavedCampaign(stored);
  }, [campaign]);

  if (!savedCampaign) return null;

  return (
    <div className="sticky top-0 z-50 bg-green-700 px-4 py-2 text-center text-sm font-bold text-white shadow">
      You are connected to campaign source:{" "}
      <span className="underline">{savedCampaign}</span>
    </div>
  );
}