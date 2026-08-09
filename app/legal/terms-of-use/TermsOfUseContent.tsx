"use client";

import { useEffect } from "react";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

const NAMESPACE = "terms-of-use";

export default function TermsOfUseContent() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const translate = (key: string) =>
    t(key, {
      namespace: NAMESPACE,
    });

  const acceptableUseItems = [
    "sections.acceptableUse.items.falseInformation",
    "sections.acceptableUse.items.impersonation",
    "sections.acceptableUse.items.accountUse",
    "sections.acceptableUse.items.unauthorizedAccess",
    "sections.acceptableUse.items.harmfulCode",
    "sections.acceptableUse.items.fraud",
    "sections.acceptableUse.items.harassment",
    "sections.acceptableUse.items.misrepresentation",
  ];

  const noGuaranteesItems = [
    "sections.noGuarantees.items.acceptance",
    "sections.noGuarantees.items.funding",
    "sections.noGuarantees.items.businessSuccess",
    "sections.noGuarantees.items.revenue",
    "sections.noGuarantees.items.participationBenefits",
    "sections.noGuarantees.items.businessGrowth",
  ];

  return (
    <article className="prose prose-lg max-w-none text-gray-800">
      {/* =====================================================
          PAGE TITLE
      ====================================================== */}

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

      {/* =====================================================
          OFFICIAL ORGANIZATIONAL IDENTITY
      ====================================================== */}

      <h2>
        {translate("identity.title")}
      </h2>

      <p>
        {translate("identity.description")}
      </p>

      {/* =====================================================
          1. ACCEPTANCE OF TERMS
      ====================================================== */}

      <h2>
        {translate("sections.acceptance.title")}
      </h2>

      <p>
        {translate("sections.acceptance.description")}
      </p>

      {/* =====================================================
          2. ABOUT EPEW
      ====================================================== */}

      <h2>
        {translate("sections.about.title")}
      </h2>

      <p>
        {translate("sections.about.description")}
      </p>

      {/* =====================================================
          3. OUR MISSION
      ====================================================== */}

      <h2>
        {translate("sections.mission.title")}
      </h2>

      <p>
        {translate("sections.mission.description")}
      </p>

      {/* =====================================================
          4. ELIGIBILITY
      ====================================================== */}

      <h2>
        {translate("sections.eligibility.title")}
      </h2>

      <p>
        {translate("sections.eligibility.description")}
      </p>

      {/* =====================================================
          5. USER ACCOUNTS
      ====================================================== */}

      <h2>
        {translate("sections.userAccounts.title")}
      </h2>

      <p>
        {translate("sections.userAccounts.description")}
      </p>

      {/* =====================================================
          6. PLATFORM SERVICES
      ====================================================== */}

      <h2>
        {translate("sections.platformServices.title")}
      </h2>

      <p>
        {translate("sections.platformServices.description")}
      </p>

      {/* =====================================================
          7. ACCEPTABLE USE
      ====================================================== */}

      <h2>
        {translate("sections.acceptableUse.title")}
      </h2>

      <p>
        {translate(
          "sections.acceptableUse.introduction",
        )}
      </p>

      <ul>
        {acceptableUseItems.map((key) => (
          <li key={key}>
            {translate(key)}
          </li>
        ))}
      </ul>

      {/* =====================================================
          8. INTELLECTUAL PROPERTY
      ====================================================== */}

      <h2>
        {translate(
          "sections.intellectualProperty.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.intellectualProperty.description",
        )}
      </p>

      <p>
        {translate(
          "sections.intellectualProperty.entrepreneurOwnership",
        )}
      </p>

      {/* =====================================================
          9. ENTREPRENEUR PROJECTS
      ====================================================== */}

      <h2>
        {translate(
          "sections.entrepreneurProjects.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.entrepreneurProjects.description",
        )}
      </p>

      <p>
        <strong>
          {translate(
            "sections.entrepreneurProjects.principle",
          )}
        </strong>
      </p>

      <p>
        {translate(
          "sections.entrepreneurProjects.responsibility",
        )}
      </p>

      {/* =====================================================
          10. FOUNDING SUPPORTER PARTICIPATION
      ====================================================== */}

      <h2>
        {translate(
          "sections.foundingSupporter.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.foundingSupporter.description",
        )}
      </p>

      {/* =====================================================
          11. PAYMENTS, CONTRIBUTIONS, AND PLATFORM FEES
      ====================================================== */}

      <h2>
        {translate("sections.payments.title")}
      </h2>

      <p>
        {translate("sections.payments.description")}
      </p>

      {/* =====================================================
          12. NO GUARANTEES
      ====================================================== */}

      <h2>
        {translate("sections.noGuarantees.title")}
      </h2>

      <p>
        {translate(
          "sections.noGuarantees.introduction",
        )}
      </p>

      <ul>
        {noGuaranteesItems.map((key) => (
          <li key={key}>
            {translate(key)}
          </li>
        ))}
      </ul>

      {/* =====================================================
          13. PLATFORM AVAILABILITY
      ====================================================== */}

      <h2>
        {translate(
          "sections.platformAvailability.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.platformAvailability.description",
        )}
      </p>

      {/* =====================================================
          14. THIRD-PARTY SERVICES
      ====================================================== */}

      <h2>
        {translate(
          "sections.thirdPartyServices.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.thirdPartyServices.description",
        )}
      </p>

      {/* =====================================================
          15. SUSPENSION OR TERMINATION
      ====================================================== */}

      <h2>
        {translate(
          "sections.suspension.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.suspension.description",
        )}
      </p>

      {/* =====================================================
          16. LIMITATION OF LIABILITY
      ====================================================== */}

      <h2>
        {translate(
          "sections.liability.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.liability.description",
        )}
      </p>

      {/* =====================================================
          17. INDEMNIFICATION
      ====================================================== */}

      <h2>
        {translate(
          "sections.indemnification.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.indemnification.description",
        )}
      </p>

      {/* =====================================================
          18. GOVERNING LAW
      ====================================================== */}

      <h2>
        {translate(
          "sections.governingLaw.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.governingLaw.description",
        )}
      </p>

      {/* =====================================================
          19. CHANGES TO THESE TERMS
      ====================================================== */}

      <h2>
        {translate(
          "sections.changes.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.changes.description",
        )}
      </p>

      {/* =====================================================
          20. CONTACT INFORMATION
      ====================================================== */}

      <h2>
        {translate(
          "sections.contact.title",
        )}
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

      {/* =====================================================
          FINAL ACKNOWLEDGMENT
      ====================================================== */}

      <h2>
        {translate(
          "finalAcknowledgment.title",
        )}
      </h2>

      <p>
        {translate(
          "finalAcknowledgment.description",
        )}
      </p>

      {/* =====================================================
          OFFICIAL ORGANIZATIONAL DECLARATION
      ====================================================== */}

      <h2>
        {translate(
          "officialDeclaration.title",
        )}
      </h2>

      <p>
        {translate(
          "officialDeclaration.description1",
        )}
      </p>

      <p>
        {translate(
          "officialDeclaration.description2",
        )}
      </p>

      <p>
        <strong>
          {translate(
            "officialDeclaration.principle",
          )}
        </strong>
      </p>
    </article>
  );
}