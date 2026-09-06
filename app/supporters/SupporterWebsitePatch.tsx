"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const EPEW_SELECTION_PATH = "/supporters/annual-support";
const PANEL_ID = "epew-founding-supporter-panel";

export default function SupporterWebsitePatch() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/supporters") return;

    const ensureFoundingSupporterPanel = () => {
      if (document.getElementById(PANEL_ID)) return;

      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h1,h2,h3"));
      const whyHeading = headings.find((heading) => {
        const text = (heading.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
        return text.includes("why become") && text.includes("supporter");
      });

      const targetSection = whyHeading?.closest("section");
      if (!targetSection) return;

      const wrapper = document.createElement("div");
      wrapper.id = PANEL_ID;
      wrapper.className = "max-w-5xl mx-auto px-8 mt-16";
      wrapper.innerHTML = `
        <div class="rounded-3xl border border-green-200 bg-green-50 p-8 md:p-10 shadow-xl text-left text-green-950">
          <h3 class="text-4xl md:text-5xl font-extrabold leading-tight text-green-900">
            Why Become a Founding Supporter?
          </h3>

          <div class="mt-8 divide-y divide-green-200">
            <div class="pb-7">
              <p class="text-2xl font-extrabold text-green-900">You become part of this entrepreneur's success story.</p>
              <p class="mt-3 text-xl leading-relaxed">You will be recognized as a Founding Supporter and be part of their journey and legacy.</p>
            </div>

            <div class="py-7">
              <p class="text-2xl font-extrabold text-green-900">You help launch a real business that serves its community.</p>
              <p class="mt-3 text-xl leading-relaxed">Your support helps turn a vision into a business that creates value, serves people, and builds opportunity.</p>
            </div>

            <div class="py-7">
              <p class="text-2xl font-extrabold text-green-900">You may receive participation benefits of up to 8% annually,</p>
              <p class="mt-3 text-xl leading-relaxed">subject to business performance and EPEW policies.</p>
            </div>

            <div class="pt-7">
              <p class="text-2xl font-extrabold text-green-900">Your support creates jobs, strengthens communities, and helps build the next generation of entrepreneurs.</p>
            </div>
          </div>
        </div>
      `;

      targetSection.appendChild(wrapper);
    };

    const applyApprovedChanges = () => {
      // Approved content-only change: 6% -> 8%. Do not alter existing layout or styling.
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );

      let node = walker.nextNode();
      while (node) {
        const value = node.nodeValue || "";
        if (value.includes("6%")) {
          node.nodeValue = value.replace(/6%/g, "8%");
        }
        node = walker.nextNode();
      }

      // Both public supporter CTA buttons now open the existing
      // EPEW-selected business support page.
      document.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
        const label = (link.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
        const href = link.getAttribute("href") || "";

        if (
          label.includes("become a supporter") ||
          (href.startsWith("/supporters/register") && pathname === "/supporters")
        ) {
          link.href = EPEW_SELECTION_PATH;
        }
      });

      ensureFoundingSupporterPanel();
    };

    applyApprovedChanges();

    const observer = new MutationObserver(() => {
      applyApprovedChanges();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
