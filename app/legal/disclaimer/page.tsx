import type { Metadata } from "next";

import DisclaimerContent from "./DisclaimerContent";

export const metadata: Metadata = {
  title: "Platform Disclaimer | EPEW",
  description:
    "Official Platform Disclaimer for Ekero Partners Empower Wealth.",
};

export default function PlatformDisclaimerPage() {
  return <DisclaimerContent />;
}