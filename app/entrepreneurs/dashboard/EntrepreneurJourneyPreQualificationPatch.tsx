"use client";

import { useEffect } from "react";

const STEP_ID = "epew-prequalification-journey-step";
const REGISTRATION_ID = "epew-registration-questionnaire-step";

export default function EntrepreneurJourneyPreQualificationPatch() {
  useEffect(() => {
    const applyJourneyPatch = () => {
      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h1,h2,h3"));
      const journeyHeading = headings.find(
        (heading) => (heading.textContent || "").trim() === "Your Current Journey",
      );

      if (!journeyHeading) return;

      const section = journeyHeading.closest("section");
      if (!section) return;

      const grid = section.querySelector<HTMLDivElement>("div.grid");
      if (!grid) return;

      const cards = Array.from(grid.children) as HTMLElement[];
      const applicationReceivedCard = cards.find((card) =>
        (card.textContent || "").includes("Application Received"),
      );
      const coachAssignedCard = cards.find((card) =>
        (card.textContent || "").includes("Personal Coach Assigned"),
      );

      if (!applicationReceivedCard || !coachAssignedCard) return;

      if (!document.getElementById(REGISTRATION_ID)) {
        const registrationCard = applicationReceivedCard.cloneNode(true) as HTMLElement;
        registrationCard.id = REGISTRATION_ID;
        registrationCard.textContent = "✅ Registration & Questionnaire Completed";
        applicationReceivedCard.insertAdjacentElement("afterend", registrationCard);
      }

      if (!document.getElementById(STEP_ID)) {
        const preQualificationCard = coachAssignedCard.cloneNode(true) as HTMLElement;
        preQualificationCard.id = STEP_ID;
        preQualificationCard.className = "rounded-2xl border border-gray-200 bg-gray-50 p-4 font-bold text-gray-500";
        preQualificationCard.textContent = "⬜ Pre-Qualification Interview";
        coachAssignedCard.insertAdjacentElement("beforebegin", preQualificationCard);
      }
    };

    applyJourneyPatch();

    const observer = new MutationObserver(applyJourneyPatch);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
