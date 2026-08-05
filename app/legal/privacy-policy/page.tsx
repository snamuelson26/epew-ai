import type { Metadata } from "next";

import PrivacyPolicyContent from "./PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Privacy Policy | EPEW",
  description:
    "Privacy Policy for Ekero Partners Empower Wealth.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}