"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type ApplicationRow = {
  id: number;
  interview_status: string | null;
  interview_date: string | null;
  interview_time: string | null;
  interview_type: string | null;
  questionnaire_status: string | null;
};

function formatScheduled(dateValue: string | null, timeValue: string | null) {
  if (!dateValue || !timeValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) return null;

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const dayText = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  const timeText = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
  return `${dayText} at ${timeText} ET`;
}

function textOf(element: Element | null) {
  return element?.textContent?.trim() ?? "";
}

function findCardByHeading(headingText: string) {
  const headings = Array.from(document.querySelectorAll("h2"));
  const heading = headings.find((item) => textOf(item) === headingText);
  return (heading?.closest("div.rounded-3xl") || heading?.parentElement) as HTMLElement | null;
}

export default function PreQualificationAppointmentBridge() {
  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;

    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;

      const requestedId = new URLSearchParams(window.location.search).get("applicationId");
      let query = supabase
        .from("entrepreneur_applications")
        .select("id,interview_status,interview_date,interview_time,interview_type,questionnaire_status")
        .eq("user_id", auth.user.id);

      if (requestedId) {
        query = query.eq("id", Number(requestedId));
      } else {
        query = query.order("created_at", { ascending: false }).limit(1);
      }

      const { data, error } = await query.maybeSingle();
      if (error || !data || cancelled) return;

      const app = data as ApplicationRow;
      const status = String(app.interview_status || "").toLowerCase();
      const questionnaireDone = String(app.questionnaire_status || "").toLowerCase() === "completed";
      const isScheduled = status === "scheduled" && Boolean(app.interview_date && app.interview_time);
      const scheduledText = formatScheduled(app.interview_date, app.interview_time);

      const apply = () => {
        if (cancelled) return;

        const scheduleLinks = Array.from(
          document.querySelectorAll<HTMLAnchorElement>('a[href^="/entrepreneurs/availability?applicationId="]'),
        );

        for (const link of scheduleLinks) {
          if (isScheduled) {
            link.textContent = "Re-schedule Your Pre-Qualification Interview";
            const old = link.parentElement?.querySelector<HTMLElement>("[data-epew-prequal-scheduled]");
            if (!old && scheduledText) {
              const detail = document.createElement("p");
              detail.dataset.epewPrequalScheduled = "true";
              detail.className = "mt-3 text-sm font-bold text-green-700";
              detail.textContent = `Scheduled: ${scheduledText} • Phone Call`;
              link.insertAdjacentElement("afterend", detail);
            }
          } else if (questionnaireDone) {
            link.textContent = "Schedule Pre-Qualification Interview";
          }
        }

        for (const element of Array.from(document.querySelectorAll("p,div"))) {
          if (textOf(element) === "EPEW Establishment Meeting" && isScheduled) {
            element.textContent = "EPEW Pre-Qualification Interview";
          }
        }

        const currentStatusCard = findCardByHeading("Your Current Status");
        if (currentStatusCard && isScheduled) {
          const paragraphs = Array.from(currentStatusCard.querySelectorAll("p"));
          if (paragraphs[0]) {
            paragraphs[0].textContent = "Waiting for Pre-Qualification Interview";
            paragraphs[0].classList.add("text-green-700");
          }
          if (paragraphs[1]) {
            paragraphs[1].textContent = scheduledText
              ? `Your Pre-Qualification Interview is scheduled for ${scheduledText}. Please be available to receive the phone call.`
              : "Your Pre-Qualification Interview is scheduled. Please be available to receive the phone call.";
          }
        }

        const nextActionCard = findCardByHeading("Your Next Action");
        if (nextActionCard && isScheduled) {
          const paragraphs = Array.from(nextActionCard.querySelectorAll("p"));
          if (paragraphs[0]) {
            paragraphs[0].innerHTML =
              "<strong>Be ready for your appointment.</strong> During the Pre-Qualification Interview, the EPEW Coach Assistant will confirm your business information and discuss your business idea, your main business goal, your commitment and readiness, your target market and customer need, what you have already prepared, and what help you still need before your first interview with your Personal Coach.";
          }
        }

        const journeyItems = Array.from(document.querySelectorAll("div.rounded-2xl"));
        const interviewStep = journeyItems.find((item) => textOf(item).includes("Interview Scheduled"));
        if (interviewStep && isScheduled) {
          interviewStep.textContent = "✅ Pre-Qualification Interview Scheduled";
          interviewStep.className = interviewStep.className
            .replace(/border-gray-200/g, "border-green-300")
            .replace(/bg-gray-50/g, "bg-green-50")
            .replace(/text-gray-500/g, "text-green-800");
        }
      };

      apply();
      observer = new MutationObserver(apply);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    void load();

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  return null;
}
