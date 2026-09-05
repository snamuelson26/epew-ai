"use client";

import { useEffect } from "react";

const ENTREPRENEUR_CAMPAIGN_PATH = "/entrepreneurs/campaign";
const FOOD_FANS_SUPPORT_PATH = "/support/FFR-001";
const POTENTIAL_SUPPORTERS_PATH = "/entrepreneurs/supporters";

export default function CampaignActionsFix() {
  useEffect(() => {
    const applyLinks = () => {
      document.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
        const label = (link.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();

        if (label.includes("view my campaign")) {
          link.href = ENTREPRENEUR_CAMPAIGN_PATH;
        }

        if (
          label.includes("founding supporters") ||
          label.includes("my potential supporter") ||
          label.includes("my potential supporters")
        ) {
          link.href = POTENTIAL_SUPPORTERS_PATH;
          link.textContent = "👥 My Potential Supporters";
        }
      });
    };

    applyLinks();
    const timer1 = window.setTimeout(applyLinks, 250);
    const timer2 = window.setTimeout(applyLinks, 1000);

    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;

      const label = (button.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (!label.includes("share my vision")) return;

      event.preventDefault();
      event.stopPropagation();

      const url = `${window.location.origin}${FOOD_FANS_SUPPORT_PATH}`;
      const shareData = {
        title: "Food Fans Restaurant",
        text: "I am building Food Fans Restaurant with EPEW. Please take a look at my business journey and support page.",
        url,
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }

        await navigator.clipboard.writeText(url);
        window.alert("Your Food Fans Restaurant support link was copied. You can now share it by text, email, WhatsApp, or social media.");
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
        window.prompt("Copy and share your Food Fans Restaurant support link:", url);
      }
    };

    document.addEventListener("click", onClick, true);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
