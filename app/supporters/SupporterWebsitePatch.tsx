"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const EPEW_SELECTION_PATH = "/supporters/annual-support";

export default function SupporterWebsitePatch() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/supporters") return;

    const applyApprovedChanges = () => {
      // Approved content-only change: 6% -> 8%. Do not alter layout or styling.
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
