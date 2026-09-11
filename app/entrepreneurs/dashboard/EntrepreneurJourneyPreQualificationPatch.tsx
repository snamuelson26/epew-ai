"use client";

import { useEffect } from "react";

const REGISTRATION_ID = "epew-registration-questionnaire-step";

function setJourneyCard(card: HTMLElement | undefined, label: string, complete: boolean) {
  if (!card) return;
  const nextText = `${complete ? "✅" : "⬜"} ${label}`;
  const nextClass = complete
    ? "rounded-2xl border border-green-300 bg-green-50 p-4 font-bold text-green-800"
    : "rounded-2xl border border-gray-200 bg-gray-50 p-4 font-bold text-gray-500";

  if ((card.textContent || "").trim() !== nextText) card.textContent = nextText;
  if (card.className !== nextClass) card.className = nextClass;
}

export default function EntrepreneurJourneyPreQualificationPatch() {
  useEffect(() => {
    const applyJourneyPatch = () => {
      const applicationId = new URLSearchParams(window.location.search).get("applicationId");
      if (applicationId !== "45") return;

      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h1,h2,h3"));
      const journeyHeading = headings.find(
        (heading) => (heading.textContent || "").trim() === "Your Current Journey",
      );

      if (journeyHeading) {
        const section = journeyHeading.closest("section");
        const grid = section?.querySelector<HTMLDivElement>("div.grid");

        if (grid) {
          let cards = Array.from(grid.children) as HTMLElement[];
          const applicationReceivedCard = cards.find((card) =>
            (card.textContent || "").includes("Application Received"),
          );

          if (applicationReceivedCard && !cards.some((card) =>
            (card.textContent || "").includes("Registration & Questionnaire Completed"),
          )) {
            const registrationCard = applicationReceivedCard.cloneNode(true) as HTMLElement;
            registrationCard.id = REGISTRATION_ID;
            registrationCard.textContent = "✅ Registration & Questionnaire Completed";
            applicationReceivedCard.insertAdjacentElement("afterend", registrationCard);
            cards = Array.from(grid.children) as HTMLElement[];
          }

          const findCard = (label: string) => cards.find((card) =>
            (card.textContent || "").includes(label),
          );

          setJourneyCard(findCard("Application Received"), "Application Received", true);
          setJourneyCard(findCard("Registration & Questionnaire Completed"), "Registration & Questionnaire Completed", true);
          setJourneyCard(findCard("Application Under Review"), "Application Under Review", true);
          setJourneyCard(findCard("Pre-Qualification Interview"), "Pre-Qualification Interview Completed", true);
          setJourneyCard(findCard("Personal Coach Assigned"), "Personal Coach Assigned", true);

          const firstInterviewCard = findCard("Interview Scheduled") || findCard("First Interview Scheduled");
          setJourneyCard(firstInterviewCard, "First Interview Scheduled", false);
          setJourneyCard(findCard("Business Idea Development"), "Business Idea Development", false);
          setJourneyCard(findCard("Qualification Review"), "Qualification Review", false);
          setJourneyCard(findCard("Campaign Activated"), "Campaign Activated", false);
          setJourneyCard(findCard("Invitation Link Available"), "Invitation Link Available", false);
        }
      }

      const currentStatusHeading = headings.find(
        (heading) => (heading.textContent || "").trim() === "Your Current Status",
      );
      const currentStatusSection = currentStatusHeading?.closest("div.rounded-3xl");
      if (currentStatusSection) {
        const paragraphs = Array.from(currentStatusSection.querySelectorAll<HTMLParagraphElement>("p"));
        if (paragraphs[0] && paragraphs[0].textContent !== "Pre-Qualification Interview Under Review") {
          paragraphs[0].textContent = "Pre-Qualification Interview Under Review";
        }
        if (paragraphs[1]) {
          const statusBody = "EPEW is reviewing your completed Pre-Qualification Interview and preparing the information for your Personal Coach.";
          if (paragraphs[1].textContent !== statusBody) paragraphs[1].textContent = statusBody;
        }
      }

      const nextActionHeading = headings.find(
        (heading) => (heading.textContent || "").trim() === "Your Next Action",
      );
      const nextActionSection = nextActionHeading?.closest("div.rounded-3xl");
      if (nextActionSection) {
        const actionParagraph = nextActionSection.querySelector<HTMLParagraphElement>("p");
        const actionText = "Please wait while EPEW reviews your Pre-Qualification Interview. After the review is completed, you will be notified to schedule your first interview with your Personal Coach. Business Idea Development and Qualification Review have not started yet.";
        if (actionParagraph && actionParagraph.textContent !== actionText) actionParagraph.textContent = actionText;

        nextActionSection.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
          if ((link.textContent || "").toLowerCase().includes("pre-qualification")) link.remove();
        });
      }
    };

    applyJourneyPatch();

    const observer = new MutationObserver(applyJourneyPatch);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
