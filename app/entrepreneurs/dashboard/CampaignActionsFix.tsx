"use client";

import { useEffect } from "react";

const ENTREPRENEUR_CAMPAIGN_PATH = "/entrepreneurs/campaign";
const POTENTIAL_SUPPORTERS_PATH = "/entrepreneurs/supporters";
const COMMUNICATION_CENTER_PATH = "/entrepreneurs/communication";

export default function CampaignActionsFix() {
  useEffect(() => {
    let applying = false;

    const applyLinks = () => {
      if (applying) return;
      applying = true;

      try {
        document.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
          const label = (link.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();

          if (label.includes("view my campaign") && link.getAttribute("href") !== ENTREPRENEUR_CAMPAIGN_PATH) {
            link.href = ENTREPRENEUR_CAMPAIGN_PATH;
          }

          if (
            label.includes("founding supporters") ||
            label.includes("my potential supporter") ||
            label.includes("my potential supporters")
          ) {
            const applicationId = new URLSearchParams(window.location.search).get("applicationId");
            const supportersPath = applicationId
              ? `${POTENTIAL_SUPPORTERS_PATH}?applicationId=${encodeURIComponent(applicationId)}`
              : POTENTIAL_SUPPORTERS_PATH;

            if (link.getAttribute("href") !== supportersPath) {
              link.href = supportersPath;
            }

            const desiredLabel = "👥 My Potential Supporters";
            if ((link.textContent || "").trim() !== desiredLabel) {
              link.textContent = desiredLabel;
            }

            const parent = link.parentElement;
            if (parent && !parent.querySelector('[data-epew-communication-center="true"]')) {
              const communicationLink = document.createElement("a");
              communicationLink.href = COMMUNICATION_CENTER_PATH;
              communicationLink.dataset.epewCommunicationCenter = "true";
              communicationLink.textContent = "✉️ Communication Center";
              communicationLink.className = "rounded-xl bg-blue-950 px-5 py-3 font-bold text-white hover:bg-blue-800";
              link.insertAdjacentElement("afterend", communicationLink);
            }
          }
        });
      } finally {
        applying = false;
      }
    };

    applyLinks();
    const timer1 = window.setTimeout(applyLinks, 250);
    const timer2 = window.setTimeout(applyLinks, 1000);

    let observerScheduled = false;
    const observer = new MutationObserver(() => {
      if (observerScheduled) return;
      observerScheduled = true;
      window.requestAnimationFrame(() => {
        observerScheduled = false;
        applyLinks();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      observer.disconnect();
    };
  }, []);

  return null;
}
