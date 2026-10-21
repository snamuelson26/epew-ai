import type { ReactNode } from "react";
import HelpEntry from "@/app/components/applicant-help/HelpEntry";
export default function Layout({ children }: { children: ReactNode }) {
  return <><HelpEntry />{children}</>;
}
