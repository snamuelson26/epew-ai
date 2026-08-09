import type { Metadata } from "next";

import TermsOfUseContent from "./TermsOfUseContent";

export const metadata: Metadata = {
  title: "Terms of Use | EPEW",
  description:
    "Terms of Use for Ekero Partners Empower Wealth.",
};

export default function TermsOfUsePage() {
  return <TermsOfUseContent />;
}