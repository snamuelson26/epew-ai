import type { ReactNode } from "react";
import SupporterNavigation from "../supporters/SupporterNavigation";
export default function SupportLayout({children}:{children:ReactNode}) {
  return <><SupporterNavigation />{children}</>;
}
