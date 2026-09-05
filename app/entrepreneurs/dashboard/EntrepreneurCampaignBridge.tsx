"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EntrepreneurCampaignBridge() {
  useEffect(() => {
    let cancelled = false;

    async function applyCampaignFixes() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user || cancelled) return;

      const { data } = await supabase
        .from("entrepreneur_applications")
        .select("id,business_name")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!data || cancelled) return;

      const isFoodFans =
        Number(data.id) === 27 ||
        data.business_name?.trim().toLowerCase() === "food fans restaurant";

      if (!isFoodFans) return;

      const supportHref = "/support/FFR-001";

      // Fix the campaign URL displayed in the post-qualification Campaign Center.
      const textNodes = Array.from(document.querySelectorAll("p"));
      const displayedCampaignUrl = textNodes.find((node) =>
        (node.textContent || "").includes("/campaign/27") ||
        (node.textContent || "").includes("/campaign/FFR-001")
      );
      if (displayedCampaignUrl) {
        displayedCampaignUrl.textContent = `${window.location.origin}${supportHref}`;
      }

      // Fix all campaign links for Food Fans.
      document
        .querySelectorAll<HTMLAnchorElement>('a[href^="/campaign/"]')
        .forEach((link) => {
          link.href = supportHref;
          if ((link.textContent || "").includes("View My Campaign")) {
            link.textContent = "🌐 View My Support Page";
          }
        });

      // Make Campaign Ready useful instead of a dead status label.
      const campaignReadyNodes = Array.from(document.querySelectorAll<HTMLElement>("div,span,p"))
        .filter((node) => (node.textContent || "").trim() === "Campaign Ready");

      campaignReadyNodes.forEach((node) => {
        if (node.closest("a")) return;
        if (node.dataset.epewCampaignReadyLinked === "true") return;

        const link = document.createElement("a");
        link.href = supportHref;
        link.textContent = "Campaign Ready — View Support Page";
        link.className = node.className;
        link.dataset.epewCampaignReadyLinked = "true";
        node.replaceWith(link);
      });

      // Add a direct way to build the prospect-supporter list from the Campaign Center.
      const campaignCenterHeading = Array.from(document.querySelectorAll("h2")).find(
        (heading) => (heading.textContent || "").trim() === "Campaign Center"
      );
      const campaignCenter = campaignCenterHeading?.closest("section");

      if (campaignCenter && !campaignCenter.querySelector('[data-epew-add-prospect="true"]')) {
        const actions = campaignCenter.querySelector(".mt-5.flex") || campaignCenter;
        const addProspect = document.createElement("a");
        addProspect.href = "/entrepreneurs/communication";
        addProspect.textContent = "➕ Add a Potential Supporter";
        addProspect.dataset.epewAddProspect = "true";
        addProspect.className =
          "rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-950 hover:bg-amber-400";
        actions.appendChild(addProspect);
      }

      // Existing Founding Supporters button should open the real communication/list page.
      document
        .querySelectorAll<HTMLAnchorElement>('a[href="/entrepreneurs/supporters"]')
        .forEach((link) => {
          link.href = "/entrepreneurs/communication";
          link.textContent = "👥 My Potential Supporter List";
        });

      // Mobile-specific cleanup for the entrepreneur campaign dashboard.
      if (!document.getElementById("epew-entrepreneur-mobile-fix")) {
        const style = document.createElement("style");
        style.id = "epew-entrepreneur-mobile-fix";
        style.textContent = `
          @media (max-width: 640px) {
            #epew-entrepreneur-dashboard-localized main { padding: 0.75rem !important; overflow-x: hidden; }
            #epew-entrepreneur-dashboard-localized section { border-radius: 1rem !important; }
            #epew-entrepreneur-dashboard-localized .p-10 { padding: 1.25rem !important; }
            #epew-entrepreneur-dashboard-localized .p-6 { padding: 1rem !important; }
            #epew-entrepreneur-dashboard-localized .text-4xl { font-size: 1.75rem !important; line-height: 2rem !important; }
            #epew-entrepreneur-dashboard-localized .text-3xl { font-size: 1.4rem !important; line-height: 1.75rem !important; }
            #epew-entrepreneur-dashboard-localized .text-2xl { font-size: 1.1rem !important; line-height: 1.5rem !important; }
            #epew-entrepreneur-dashboard-localized .mt-5.flex.flex-wrap.gap-3 { display: grid !important; grid-template-columns: 1fr !important; }
            #epew-entrepreneur-dashboard-localized .mt-5.flex.flex-wrap.gap-3 > a,
            #epew-entrepreneur-dashboard-localized .mt-5.flex.flex-wrap.gap-3 > button { width: 100% !important; text-align: center !important; }
            #epew-entrepreneur-dashboard-localized .break-all { overflow-wrap: anywhere !important; word-break: break-word !important; }
          }
        `;
        document.head.appendChild(style);
      }
    }

    void applyCampaignFixes();
    const timeout = window.setTimeout(() => void applyCampaignFixes(), 900);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
