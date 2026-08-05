"use client";

import { useEffect } from "react";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

const NAMESPACE = "privacy-policy";

export default function PrivacyPolicyContent() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const translate = (key: string) =>
    t(key, { namespace: NAMESPACE });

  return (
    <article className="prose prose-lg max-w-none text-gray-800">
      <h1 className="text-5xl font-extrabold text-[#06245c]">
        {translate("page.title")}
      </h1>

      <p>
        <strong>
          {translate("organization.name")}
        </strong>
      </p>

      <p>
        <strong>
          {translate("dates.effectiveDateLabel")}
        </strong>{" "}
        {translate("dates.effectiveDate")}
        <br />

        <strong>
          {translate("dates.lastUpdatedLabel")}
        </strong>{" "}
        {translate("dates.lastUpdated")}
      </p>

      <h2>
        {translate("identity.title")}
      </h2>

      <p>
        {translate("identity.description")}
      </p>

      <h2>
        {translate("sections.introduction.title")}
      </h2>

      <p>
        {translate("sections.introduction.description")}
      </p>

      <h2>
        {translate("sections.informationCollected.title")}
      </h2>

      <p>
        {translate(
          "sections.informationCollected.introduction",
        )}
      </p>

      <ul>
        <li>
          {translate(
            "sections.informationCollected.items.contact",
          )}
        </li>

        <li>
          {translate(
            "sections.informationCollected.items.identification",
          )}
        </li>

        <li>
          {translate(
            "sections.informationCollected.items.profile",
          )}
        </li>

        <li>
          {translate(
            "sections.informationCollected.items.entrepreneur",
          )}
        </li>

        <li>
          {translate(
            "sections.informationCollected.items.supporter",
          )}
        </li>

        <li>
          {translate(
            "sections.informationCollected.items.coach",
          )}
        </li>

        <li>
          {translate(
            "sections.informationCollected.items.partner",
          )}
        </li>

        <li>
          {translate(
            "sections.informationCollected.items.payment",
          )}
        </li>

        <li>
          {translate(
            "sections.informationCollected.items.technical",
          )}
        </li>
      </ul>

      <h2>
        {translate("sections.informationUse.title")}
      </h2>

      <p>
        {translate("sections.informationUse.description")}
      </p>

      <h2>
        {translate("sections.legalBasis.title")}
      </h2>

      <p>
        {translate("sections.legalBasis.description")}
      </p>

      <h2>
        {translate("sections.informationSharing.title")}
      </h2>

      <p>
        {translate(
          "sections.informationSharing.description",
        )}
      </p>

      <h2>
        {translate("sections.dataRetention.title")}
      </h2>

      <p>
        {translate("sections.dataRetention.description")}
      </p>

      <h2>
        {translate("sections.cookies.title")}
      </h2>

      <p>
        {translate("sections.cookies.description")}
      </p>

      <h2>
        {translate("sections.dataSecurity.title")}
      </h2>

      <p>
        {translate("sections.dataSecurity.description")}
      </p>

      <h2>
        {translate("sections.privacyRights.title")}
      </h2>

      <p>
        {translate("sections.privacyRights.description")}
      </p>

      <h2>
        {translate("sections.children.title")}
      </h2>

      <p>
        {translate("sections.children.description")}
      </p>

      <h2>
        {translate("sections.international.title")}
      </h2>

      <p>
        {translate("sections.international.description")}
      </p>

      <h2>
        {translate("sections.thirdPartyLinks.title")}
      </h2>

      <p>
        {translate(
          "sections.thirdPartyLinks.description",
        )}
      </p>

      <h2>
        {translate("sections.changes.title")}
      </h2>

      <p>
        {translate("sections.changes.description")}
      </p>

      <h2>
        {translate("sections.contact.title")}
      </h2>

      <p>
        <strong>
          {translate("organization.name")}
        </strong>
        <br />

        {translate("contact.addressLine1")}
        <br />

        {translate("contact.addressLine2")}
        <br />

        {translate("contact.country")}
        <br />

        {translate("contact.phoneLabel")}:{" "}
        {translate("contact.phone")}
        <br />

        {translate("contact.emailLabel")}:{" "}
        {translate("contact.email")}
        <br />

        {translate("contact.websiteLabel")}:{" "}
        {translate("contact.website")}
      </p>
    </article>
  );
}