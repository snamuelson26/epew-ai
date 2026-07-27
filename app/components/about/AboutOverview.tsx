"use client";

import ContentSection from "@/app/components/shared/ContentSection";
import LocalizedAboutImage from "./LocalizedAboutImage";
import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

export default function AboutOverview() {
  const { t } = useLanguage();

  return (
    <ContentSection
      id="about-overview"
      background="white"
      title={t("overview.title")}
      description={t("overview.description")}
    >
      <LocalizedAboutImage
        fileName="about-epew.png"
        fallbackPath="/images/about-epew.png"
        alt={t("overview.imageAlt")}
        width={1600}
        height={900}
        className="mx-auto h-auto w-full rounded-3xl shadow-2xl"
        sizes="(max-width: 768px) 100vw, 1280px"
      />
    </ContentSection>
  );
}