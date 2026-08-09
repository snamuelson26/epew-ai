"use client";

import { useEffect } from "react";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

const NAMESPACE = "disclaimer";

export default function DisclaimerContent() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const translate = (key: string) =>
    t(key, {
      namespace: NAMESPACE,
    });

  const platformPurposeItems = [
    "sections.platformNature.items.prepareEntrepreneurs",
    "sections.platformNature.items.businessDevelopment",
    "sections.platformNature.items.coaching",
    "sections.platformNature.items.partnerServices",
    "sections.platformNature.items.communityParticipation",
    "sections.platformNature.items.readiness",
    "sections.platformNature.items.businessLaunch",
    "sections.platformNature.items.longTermGrowth",
  ];

  const notFinancialInstitutionItems = [
    "sections.notFinancialInstitution.items.bank",
    "sections.notFinancialInstitution.items.creditUnion",
    "sections.notFinancialInstitution.items.lender",
    "sections.notFinancialInstitution.items.financeCompany",
    "sections.notFinancialInstitution.items.insuranceCompany",
    "sections.notFinancialInstitution.items.securitiesBroker",
    "sections.notFinancialInstitution.items.brokerDealer",
    "sections.notFinancialInstitution.items.investmentAdviser",
    "sections.notFinancialInstitution.items.investmentCompany",
    "sections.notFinancialInstitution.items.ventureCapitalFund",
    "sections.notFinancialInstitution.items.crowdfundingPortal",
  ];

  const noFundingGuaranteeItems = [
    "sections.noFundingGuarantee.items.acceptance",
    "sections.noFundingGuarantee.items.fundingApproval",
    "sections.noFundingGuarantee.items.fundingAvailability",
    "sections.noFundingGuarantee.items.communityGoals",
    "sections.noFundingGuarantee.items.fundingTimelines",
    "sections.noFundingGuarantee.items.businessLaunchDates",
  ];

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
        {translate("mission.title")}
      </h2>

      <p>
        {translate("mission.description")}
      </p>

      <h2>
        {translate("sections.purpose.title")}
      </h2>

      <p>
        {translate("sections.purpose.description")}
      </p>

      <h2>
        {translate("sections.organizationNature.title")}
      </h2>

      <p>
        {translate(
          "sections.organizationNature.description1",
        )}
      </p>

      <p>
        {translate(
          "sections.organizationNature.description2",
        )}
      </p>

      <p>
        {translate(
          "sections.organizationNature.description3",
        )}
      </p>

      <h2>
        {translate("sections.platformNature.title")}
      </h2>

      <p>
        {translate(
          "sections.platformNature.description",
        )}
      </p>

      <p>
        {translate(
          "sections.platformNature.introduction",
        )}
      </p>

      <ul>
        {platformPurposeItems.map((key) => (
          <li key={key}>
            {translate(key)}
          </li>
        ))}
      </ul>

      <p>
        {translate(
          "sections.platformNature.ibosDescription1",
        )}
      </p>

      <p>
        {translate(
          "sections.platformNature.ibosDescription2",
        )}
      </p>

      <h2>
        {translate(
          "sections.notFinancialInstitution.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.notFinancialInstitution.introduction",
        )}
      </p>

      <ul>
        {notFinancialInstitutionItems.map((key) => (
          <li key={key}>
            {translate(key)}
          </li>
        ))}
      </ul>

      <h2>
        {translate("sections.noInvestment.title")}
      </h2>

      <p>
        {translate("sections.noInvestment.description1")}
      </p>

      <p>
        {translate("sections.noInvestment.description2")}
      </p>

      <h2>
        {translate(
          "sections.noFundingGuarantee.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.noFundingGuarantee.introduction",
        )}
      </p>

      <ul>
        {noFundingGuaranteeItems.map((key) => (
          <li key={key}>
            {translate(key)}
          </li>
        ))}
      </ul>

      <h2>
        {translate(
          "sections.noBusinessSuccess.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.noBusinessSuccess.description",
        )}
      </p>

      <h2>
        {translate(
          "sections.participationBenefits.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.participationBenefits.description",
        )}
      </p>

      <h2>
        {translate(
          "sections.independentBusinesses.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.independentBusinesses.description1",
        )}
      </p>

      <p>
        {translate(
          "sections.independentBusinesses.description2",
        )}
      </p>

      <h2>
        {translate(
          "sections.noAgencyRelationship.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.noAgencyRelationship.description",
        )}
      </p>

      <h2>
        {translate(
          "sections.professionalAdvice.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.professionalAdvice.description",
        )}
      </p>

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

      <h2>
        {translate("sections.noWarranty.title")}
      </h2>

      <p>
        {translate("sections.noWarranty.description")}
      </p>

      <h2>
        {translate(
          "sections.limitationResponsibility.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.limitationResponsibility.description",
        )}
      </p>

      <p>
        <strong>
          {translate(
            "sections.limitationResponsibility.principle1",
          )}
        </strong>
      </p>

      <p>
        <strong>
          {translate(
            "sections.limitationResponsibility.principle2",
          )}
        </strong>
      </p>

      <h2>
        {translate(
          "sections.internationalParticipation.title",
        )}
      </h2>

      <p>
        {translate(
          "sections.internationalParticipation.description",
        )}
      </p>

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
        {translate(
          "officialDeclaration.description3",
        )}
      </p>

      <p>
        <strong>
          {translate(
            "officialDeclaration.principle1",
          )}
        </strong>
      </p>

      <p>
        <strong>
          {translate(
            "officialDeclaration.principle2",
          )}
        </strong>
      </p>

      <p>
        <strong>
          {translate(
            "officialDeclaration.conclusion",
          )}
        </strong>
      </p>
    </article>
  );
}