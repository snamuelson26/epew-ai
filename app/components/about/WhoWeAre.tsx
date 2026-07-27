"use client";

import ContentSection from "@/app/components/shared/ContentSection";
import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

export default function WhoWeAre() {
  const { t } = useLanguage();

  const description = `${t("about.whoWeAre.description1")} ${t(
    "about.whoWeAre.description2",
  )}`;

  return (
    <ContentSection
      id="who-we-are"
      background="soft"
      title={t("about.whoWeAre.title")}
      description={description}
    />
  );
}