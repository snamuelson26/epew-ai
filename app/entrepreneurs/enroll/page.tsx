"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

const NAMESPACE = "entrepreneurs-enroll";

type ApplicantType =
  | ""
  | "individual"
  | "organization"
  | "international_special_request";

type LocationType = "" | "us" | "canada" | "other";

type Participant = {
  full_name: string;
  email: string;
  phone: string;
  organizational_title: string;
  project_role: string;
  project_responsibility: string;
  is_primary_representative: boolean;
  is_secondary_representative: boolean;
};

type CommonForm = {
  full_name: string;
  email: string;
  phone: string;
  password: string;

  country_of_citizenship: string;
  date_of_birth: string;
  place_of_birth: string;

  address_country: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;

  race_ethnicity: string;
  race_ethnicity_other: string;
};

type IndividualForm = {
  business_name: string;
  business_type: string;
  business_description: string;

  organization_affiliation: string;
  organization_type: string;
  organization_name: string;
};

type OrganizationForm = {
  legal_name: string;
  display_name: string;
  organization_type: string;
  registration_number: string;

  organization_street_address: string;
  organization_city: string;
  organization_state_region: string;
  organization_postal_code: string;

  year_established: string;
  website: string;

  primary_representative_name: string;
  primary_representative_title: string;
  primary_representative_email: string;
  primary_representative_phone: string;

  secondary_representative_name: string;
  secondary_representative_title: string;
  secondary_representative_email: string;
  secondary_representative_phone: string;

  project_name: string;
  project_category: string;
  project_description: string;
  product_service: string;
  community_market_served: string;
  project_location: string;
  project_stage: string;
  existing_operations: string;

  expected_jobs: string;
  resources_required: string;
  facility_requirements: string;
  licenses_permits: string;

  estimated_project_cost: string;
  requested_financing: string;
  intended_use_of_financing: string;
};

type SpecialRequestForm = {
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  country: string;
  years_operating: string;
  registration_status: string;
  registration_number: string;
  business_address: string;
  website: string;
  product_service: string;
  current_operations: string;
  request_reason: string;
  supporting_evidence: string;
};

const INITIAL_COMMON: CommonForm = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  country_of_citizenship: "",
  date_of_birth: "",
  place_of_birth: "",
  address_country: "",
  street_address: "",
  city: "",
  state: "",
  zip_code: "",
  race_ethnicity: "",
  race_ethnicity_other: "",
};

const INITIAL_INDIVIDUAL: IndividualForm = {
  business_name: "",
  business_type: "",
  business_description: "",
  organization_affiliation: "",
  organization_type: "",
  organization_name: "",
};

const INITIAL_ORGANIZATION: OrganizationForm = {
  legal_name: "",
  display_name: "",
  organization_type: "",
  registration_number: "",
  organization_street_address: "",
  organization_city: "",
  organization_state_region: "",
  organization_postal_code: "",
  year_established: "",
  website: "",
  primary_representative_name: "",
  primary_representative_title: "",
  primary_representative_email: "",
  primary_representative_phone: "",
  secondary_representative_name: "",
  secondary_representative_title: "",
  secondary_representative_email: "",
  secondary_representative_phone: "",
  project_name: "",
  project_category: "",
  project_description: "",
  product_service: "",
  community_market_served: "",
  project_location: "",
  project_stage: "",
  existing_operations: "",
  expected_jobs: "",
  resources_required: "",
  facility_requirements: "",
  licenses_permits: "",
  estimated_project_cost: "",
  requested_financing: "",
  intended_use_of_financing: "",
};

const INITIAL_SPECIAL_REQUEST: SpecialRequestForm = {
  full_name: "",
  email: "",
  phone: "",
  business_name: "",
  country: "",
  years_operating: "",
  registration_status: "",
  registration_number: "",
  business_address: "",
  website: "",
  product_service: "",
  current_operations: "",
  request_reason: "",
  supporting_evidence: "",
};

const EMPTY_PARTICIPANT: Participant = {
  full_name: "",
  email: "",
  phone: "",
  organizational_title: "",
  project_role: "",
  project_responsibility: "",
  is_primary_representative: false,
  is_secondary_representative: false,
};

const COUNTRIES = [
  { value: "United States", key: "united_states" },
  { value: "Canada", key: "canada" },
  { value: "Haiti", key: "haiti" },
  { value: "Dominican Republic", key: "dominican_republic" },
  { value: "France", key: "france" },
  { value: "United Kingdom", key: "united_kingdom" },
  { value: "Mexico", key: "mexico" },
  { value: "Jamaica", key: "jamaica" },
  { value: "Bahamas", key: "bahamas" },
  { value: "Brazil", key: "brazil" },
  { value: "Germany", key: "germany" },
  { value: "Spain", key: "spain" },
  { value: "Italy", key: "italy" },
  { value: "China", key: "china" },
  { value: "India", key: "india" },
  { value: "Japan", key: "japan" },
];

const RACE_ETHNICITY_OPTIONS = [
  {
    value: "Black or African American",
    key: "black_african_american",
  },
  {
    value: "Hispanic or Latino",
    key: "hispanic_latino",
  },
  {
    value: "White",
    key: "white",
  },
  {
    value: "Asian",
    key: "asian",
  },
  {
    value: "American Indian or Alaska Native",
    key: "american_indian_alaska_native",
  },
  {
    value: "Middle Eastern or North African",
    key: "middle_eastern_north_african",
  },
  {
    value: "Native Hawaiian or Pacific Islander",
    key: "native_hawaiian_pacific_islander",
  },
  {
    value: "Another race or ethnicity",
    key: "another",
  },
  {
    value: "Prefer not to answer",
    key: "prefer_not_to_answer",
  },
];

export default function EntrepreneurEnrollPage() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const tr = (key: string) =>
    t(key, { namespace: NAMESPACE });

  const [locationType, setLocationType] =
    useState<LocationType>("");

  const [enterpriseCountry, setEnterpriseCountry] =
    useState("");

  const [applicantType, setApplicantType] =
    useState<ApplicantType>("");

  const [commonForm, setCommonForm] =
    useState<CommonForm>(INITIAL_COMMON);

  const [individualForm, setIndividualForm] =
    useState<IndividualForm>(INITIAL_INDIVIDUAL);

  const [organizationForm, setOrganizationForm] =
    useState<OrganizationForm>(INITIAL_ORGANIZATION);

  const [specialRequestForm, setSpecialRequestForm] =
    useState<SpecialRequestForm>(INITIAL_SPECIAL_REQUEST);

  const [participants, setParticipants] =
    useState<Participant[]>([
      { ...EMPTY_PARTICIPANT },
      { ...EMPTY_PARTICIPANT },
      { ...EMPTY_PARTICIPANT },
    ]);

  const [governmentIdFile, setGovernmentIdFile] =
    useState<File | null>(null);

  const [selfieFile, setSelfieFile] =
    useState<File | null>(null);

  const [agreementAccepted, setAgreementAccepted] =
    useState(false);

  const [acknowledgmentAccepted, setAcknowledgmentAccepted] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] =
    useState(false);

  const enterpriseCountryValue = useMemo(() => {
    if (locationType === "us") {
      return "United States";
    }

    if (locationType === "canada") {
      return "Canada";
    }

    return enterpriseCountry.trim();
  }, [locationType, enterpriseCountry]);

  const isDomestic =
    locationType === "us" || locationType === "canada";

  const handleCommonChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setCommonForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "race_ethnicity" &&
      value !== "Another race or ethnicity"
        ? { race_ethnicity_other: "" }
        : {}),
    }));
  };

  const handleIndividualChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setIndividualForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "organization_affiliation" &&
      value !== "Yes"
        ? {
            organization_type: "",
            organization_name: "",
          }
        : {}),
    }));
  };

  const handleOrganizationChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setOrganizationForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSpecialRequestChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setSpecialRequestForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateParticipant = (
    index: number,
    field: keyof Participant,
    value: string | boolean,
  ) => {
    setParticipants((current) =>
      current.map((participant, participantIndex) => {
        if (participantIndex !== index) {
          return participant;
        }

        return {
          ...participant,
          [field]: value,
        };
      }),
    );
  };

  const addParticipant = () => {
    setParticipants((current) => [
      ...current,
      { ...EMPTY_PARTICIPANT },
    ]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length <= 3) {
      setMessage(
        tr("validation.organization_minimum_participants"),
      );
      return;
    }

    setParticipants((current) =>
      current.filter((_, participantIndex) =>
        participantIndex !== index,
      ),
    );
  };

  const resetApplication = () => {
    setCommonForm(INITIAL_COMMON);
    setIndividualForm(INITIAL_INDIVIDUAL);
    setOrganizationForm(INITIAL_ORGANIZATION);
    setParticipants([
      { ...EMPTY_PARTICIPANT },
      { ...EMPTY_PARTICIPANT },
      { ...EMPTY_PARTICIPANT },
    ]);
    setGovernmentIdFile(null);
    setSelfieFile(null);
    setAgreementAccepted(false);
    setAcknowledgmentAccepted(false);
  };

  const validateCommonApplication = () => {
    if (!enterpriseCountryValue) {
      setMessage(
        tr("validation.select_enterprise_location"),
      );
      return false;
    }

    if (!applicantType) {
      setMessage(
        tr("validation.select_applicant_type"),
      );
      return false;
    }

    if (
      !commonForm.full_name.trim() ||
      !commonForm.email.trim() ||
      !commonForm.phone.trim() ||
      !commonForm.password ||
      !commonForm.country_of_citizenship ||
      !commonForm.date_of_birth ||
      !commonForm.place_of_birth ||
      !commonForm.address_country ||
      !commonForm.street_address.trim() ||
      !commonForm.city.trim() ||
      !commonForm.state.trim() ||
      !commonForm.zip_code.trim()
    ) {
      setMessage(tr("validation.required_fields"));
      return false;
    }

    if (commonForm.password.length < 8) {
      setMessage(tr("validation.password_length"));
      return false;
    }

    if (
      commonForm.race_ethnicity ===
        "Another race or ethnicity" &&
      !commonForm.race_ethnicity_other.trim()
    ) {
      setMessage(tr("validation.required_fields"));
      return false;
    }

    if (!governmentIdFile) {
      setMessage(
        tr("validation.government_id_required"),
      );
      return false;
    }

    if (!selfieFile) {
      setMessage(
        tr("validation.selfie_required"),
      );
      return false;
    }

    if (!agreementAccepted) {
      setMessage(
        tr("validation.agreement_required"),
      );
      return false;
    }

    if (!acknowledgmentAccepted) {
      setMessage(
        tr("validation.agreement_required"),
      );
      return false;
    }

    return true;
  };

  const submitIndividualApplication = async () => {
    if (!isDomestic) {
      setMessage(
        tr(
          "validation.international_individual_not_available",
        ),
      );
      return;
    }

    if (
      !individualForm.business_name.trim() ||
      !individualForm.business_description.trim()
    ) {
      setMessage(tr("validation.required_fields"));
      return;
    }

    if (
      individualForm.organization_affiliation === "Yes" &&
      (!individualForm.organization_type ||
        !individualForm.organization_name.trim())
    ) {
      setMessage(tr("validation.required_fields"));
      return;
    }

    const payload = new FormData();

    Object.entries(commonForm).forEach(([key, value]) => {
      payload.append(key, value);
    });

    Object.entries(individualForm).forEach(
      ([key, value]) => {
        payload.append(key, value);
      },
    );

    payload.append(
      "enterprise_country",
      enterpriseCountryValue,
    );

    payload.append(
      "government_id",
      governmentIdFile as File,
    );

    payload.append(
      "selfie",
      selfieFile as File,
    );

    const response = await fetch(
      "/api/entrepreneurs/individual-application",
      {
        method: "POST",
        body: payload,
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result?.error ||
          tr("validation.submission_error"),
      );
    }

    setMessage(
      result.message || tr("success.message"),
    );

    setSubmitted(true);
    resetApplication();
  };

  const submitOrganizationApplication = async () => {
    const requestedFinancing = Number(
      organizationForm.requested_financing,
    );

    if (
      !organizationForm.legal_name.trim() ||
      !organizationForm.organization_street_address.trim() ||
      !organizationForm.organization_city.trim() ||
      !organizationForm.organization_state_region.trim() ||
      !organizationForm.organization_postal_code.trim() ||
      !organizationForm.primary_representative_name.trim() ||
      !organizationForm.primary_representative_email.trim() ||
      !organizationForm.project_name.trim() ||
      !organizationForm.project_description.trim() ||
      !organizationForm.intended_use_of_financing.trim()
    ) {
      setMessage(tr("validation.required_fields"));
      return;
    }

    if (
      !Number.isFinite(requestedFinancing) ||
      requestedFinancing <= 0 ||
      requestedFinancing > 100000
    ) {
      setMessage(
        tr("validation.organization_financing_limit"),
      );
      return;
    }

    if (participants.length < 3) {
      setMessage(
        tr("validation.organization_minimum_participants"),
      );
      return;
    }

    if (
      participants.some(
        (participant) =>
          !participant.full_name.trim() ||
          !participant.organizational_title.trim() ||
          !participant.project_role.trim() ||
          !participant.project_responsibility.trim(),
      )
    ) {
      setMessage(tr("validation.required_fields"));
      return;
    }

    const payload = new FormData();

    Object.entries(commonForm).forEach(([key, value]) => {
      payload.append(key, value);
    });

    Object.entries(organizationForm).forEach(
      ([key, value]) => {
        payload.append(key, value);
      },
    );

    payload.append(
      "enterprise_country",
      enterpriseCountryValue,
    );

    payload.append(
      "participants",
      JSON.stringify(participants),
    );

    payload.append(
      "government_id",
      governmentIdFile as File,
    );

    payload.append(
      "selfie",
      selfieFile as File,
    );

    const response = await fetch(
      "/api/entrepreneurs/organization-application",
      {
        method: "POST",
        body: payload,
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result?.error ||
          tr("validation.submission_error"),
      );
    }

    setMessage(
      result.message || tr("success.message"),
    );

    setSubmitted(true);
    resetApplication();
  };

  const handleApplicationSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setMessage("");

    if (!validateCommonApplication()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (applicantType === "individual") {
        await submitIndividualApplication();
      } else if (applicantType === "organization") {
        await submitOrganizationApplication();
      }
    } catch (error) {
      console.error(
        "EEQC entrepreneur application error:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : tr("validation.unexpected_error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpecialRequestSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setMessage("");

    if (
      !specialRequestForm.full_name.trim() ||
      !specialRequestForm.email.trim() ||
      !specialRequestForm.business_name.trim() ||
      !specialRequestForm.country.trim() ||
      !specialRequestForm.years_operating.trim() ||
      !specialRequestForm.registration_status.trim() ||
      !specialRequestForm.business_address.trim() ||
      !specialRequestForm.product_service.trim() ||
      !specialRequestForm.current_operations.trim() ||
      !specialRequestForm.request_reason.trim()
    ) {
      setMessage(tr("validation.required_fields"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/entrepreneurs/international-special-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            specialRequestForm,
          ),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error ||
            tr("validation.submission_error"),
        );
      }

      setMessage(
        result.message ||
          tr(
            "international_special_request.success_message",
          ),
      );

      setSubmitted(true);
      setSpecialRequestForm(INITIAL_SPECIAL_REQUEST);
    } catch (error) {
      console.error(
        "International special request error:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : tr("validation.unexpected_error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const applicantCardClass = (
    value: ApplicantType,
  ) =>
    `cursor-pointer rounded-3xl border-2 p-7 transition ${
      applicantType === value
        ? "border-green-600 bg-green-50 shadow-xl"
        : "border-gray-200 bg-white hover:border-green-400"
    }`;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="bg-green-600 px-6 py-4 text-center text-white">
          <p className="text-lg font-extrabold md:text-2xl">
            {tr("announcement.open")}
          </p>
        </section>

        <section className="bg-[#f5f7fb] py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-8 md:grid-cols-2">
            <div className="text-center md:text-left">
              <p className="mb-4 text-xl font-extrabold uppercase tracking-wider text-green-700">
                {tr("hero.eyebrow")}
              </p>

              <h1 className="mb-8 text-5xl font-extrabold leading-tight md:text-7xl">
                {tr("hero.title")}
              </h1>

              <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
                {tr("hero.description")}
              </p>

              <div className="mt-9 rounded-3xl border border-green-200 bg-green-50 p-6">
                <p className="text-xl font-extrabold leading-relaxed text-[#06245c] md:text-2xl">
                  {tr("hero.requirements")}
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <Image
                src="/images/entrepreneur-enroll-hero.png"
                alt="Entrepreneur beginning the EPEW journey"
                width={760}
                height={620}
                className="w-full max-w-[760px] rounded-3xl shadow-2xl"
                priority
              />
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-5xl px-8">
            <div className="rounded-3xl border-l-8 border-green-600 bg-white p-10 text-center shadow-xl">
              <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
                {tr("hero.disclaimer")}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-14 text-center">
              <h2 className="text-5xl font-extrabold md:text-6xl">
                {tr("process.title")}
              </h2>

              <p className="mx-auto mt-7 max-w-5xl text-xl leading-relaxed text-gray-700 md:text-2xl">
                {tr("process.description")}
              </p>
            </div>

            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["🧭", "one"],
                ["📝", "two"],
                ["📋", "three"],
                ["✅", "four"],
              ].map(([icon, key]) => (
                <div
                  key={key}
                  className="rounded-3xl bg-[#f5f7fb] p-8 shadow-lg"
                >
                  <div className="text-5xl">{icon}</div>

                  <h3 className="mt-5 text-2xl font-extrabold">
                    {tr(
                      `process.steps.${key}_title`,
                    )}
                  </h3>

                  <p className="mt-4 text-lg leading-relaxed text-gray-700">
                    {tr(
                      `process.steps.${key}_description`,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="application"
          className="bg-[#f5f7fb] py-24"
        >
          <div className="mx-auto max-w-6xl px-8">
            <div className="mb-12 text-center">
              <h2 className="text-5xl font-extrabold md:text-6xl">
                {tr("application.title")}
              </h2>

              <p className="mx-auto mt-6 max-w-5xl text-xl leading-relaxed text-gray-700 md:text-2xl">
                {tr("application.subtitle")}
              </p>
            </div>

            {submitted ? (
              <SuccessPanel
                message={message}
                tr={tr}
                specialRequest={
                  applicantType ===
                  "international_special_request"
                }
              />
            ) : (
              <>
                <div className="rounded-3xl bg-white p-8 shadow-2xl md:p-10">
                  <h3 className="text-3xl font-extrabold md:text-4xl">
                    {tr("geographic.title")}
                  </h3>

                  <p className="mt-4 text-xl text-gray-700">
                    {tr("geographic.question")}
                  </p>

                  <div className="mt-7 grid gap-5 md:grid-cols-3">
                    {[
                      ["us", "geographic.us"],
                      ["canada", "geographic.canada"],
                      ["other", "geographic.other"],
                    ].map(([value, labelKey]) => (
                      <label
                        key={value}
                        className={`cursor-pointer rounded-2xl border-2 p-6 text-center text-xl font-extrabold transition ${
                          locationType === value
                            ? "border-green-600 bg-green-50"
                            : "border-gray-200 hover:border-green-400"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          checked={
                            locationType === value
                          }
                          onChange={() => {
                            const nextLocation =
                              value as LocationType;

                            setLocationType(
                              nextLocation,
                            );

                            setApplicantType("");

                            if (
                              nextLocation !== "other"
                            ) {
                              setEnterpriseCountry(
                                "",
                              );
                            }

                            setMessage("");
                          }}
                        />
                        {tr(labelKey)}
                      </label>
                    ))}
                  </div>

                  {locationType === "other" && (
                    <div className="mt-6">
                      <label className="mb-2 block text-lg font-bold">
                        {tr(
                          "geographic.country_label",
                        )}
                      </label>

                      <input
                        type="text"
                        value={enterpriseCountry}
                        onChange={(event) =>
                          setEnterpriseCountry(
                            event.target.value,
                          )
                        }
                        placeholder={tr(
                          "geographic.country_placeholder",
                        )}
                        className="w-full rounded-2xl border p-4"
                      />
                    </div>
                  )}

                  {locationType && (
                    <div className="mt-7 rounded-2xl border-l-8 border-green-600 bg-green-50 p-6 text-lg leading-relaxed text-gray-700">
                      {isDomestic
                        ? tr(
                            "geographic.domestic_notice",
                          )
                        : tr(
                            "geographic.international_notice",
                          )}
                    </div>
                  )}
                </div>

                {locationType && (
                  <div className="mt-10 rounded-3xl bg-white p-8 shadow-2xl md:p-10">
                    <h3 className="text-3xl font-extrabold md:text-4xl">
                      {tr("classification.title")}
                    </h3>

                    <p className="mt-4 text-xl text-gray-700">
                      {tr(
                        "classification.question",
                      )}
                    </p>

                    <div className="mt-7 grid gap-6 lg:grid-cols-2">
                      {isDomestic && (
                        <label
                          className={applicantCardClass(
                            "individual",
                          )}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            checked={
                              applicantType ===
                              "individual"
                            }
                            onChange={() => {
                              setApplicantType(
                                "individual",
                              );
                              setMessage("");
                            }}
                          />

                          <h4 className="text-2xl font-extrabold">
                            {tr(
                              "classification.individual_title",
                            )}
                          </h4>

                          <p className="mt-4 text-lg leading-relaxed text-gray-700">
                            {tr(
                              "classification.individual_description",
                            )}
                          </p>
                        </label>
                      )}

                      <label
                        className={applicantCardClass(
                          "organization",
                        )}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          checked={
                            applicantType ===
                            "organization"
                          }
                          onChange={() => {
                            setApplicantType(
                              "organization",
                            );
                            setMessage("");
                          }}
                        />

                        <h4 className="text-2xl font-extrabold">
                          {tr(
                            "classification.organization_title",
                          )}
                        </h4>

                        <p className="mt-4 text-lg leading-relaxed text-gray-700">
                          {tr(
                            "classification.organization_description",
                          )}
                        </p>
                      </label>

                      {!isDomestic && (
                        <label
                          className={applicantCardClass(
                            "international_special_request",
                          )}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            checked={
                              applicantType ===
                              "international_special_request"
                            }
                            onChange={() => {
                              setApplicantType(
                                "international_special_request",
                              );

                              setSpecialRequestForm(
                                (current) => ({
                                  ...current,
                                  country:
                                    enterpriseCountryValue,
                                }),
                              );

                              setMessage("");
                            }}
                          />

                          <h4 className="text-2xl font-extrabold">
                            {tr(
                              "classification.special_title",
                            )}
                          </h4>

                          <p className="mt-4 text-lg leading-relaxed text-gray-700">
                            {tr(
                              "classification.special_description",
                            )}
                          </p>
                        </label>
                      )}
                    </div>

                    {applicantType ===
                      "organization" && (
                      <div className="mt-7 space-y-3 rounded-2xl bg-[#f5f7fb] p-6 text-lg font-semibold text-gray-700">
                        <p>
                          {tr(
                            "classification.organization_rule",
                          )}
                        </p>
                        <p>
                          {tr(
                            "classification.organization_minimum",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {applicantType ===
                "international_special_request" ? (
                  <SpecialRequestFormSection
                    form={specialRequestForm}
                    onChange={
                      handleSpecialRequestChange
                    }
                    onSubmit={
                      handleSpecialRequestSubmit
                    }
                    isSubmitting={isSubmitting}
                    message={message}
                    tr={tr}
                  />
                ) : applicantType ? (
                  <form
                    onSubmit={
                      handleApplicationSubmit
                    }
                    className="mt-10 space-y-10"
                  >
                    <CommonIdentitySection
                      form={commonForm}
                      onChange={handleCommonChange}
                      tr={tr}
                    />

                    {applicantType ===
                      "individual" && (
                      <IndividualSection
                        form={individualForm}
                        onChange={
                          handleIndividualChange
                        }
                        tr={tr}
                      />
                    )}

                    {applicantType ===
                      "organization" && (
                      <>
                        <OrganizationSection
                          form={organizationForm}
                          onChange={
                            handleOrganizationChange
                          }
                          tr={tr}
                        />

                        <ParticipantsSection
                          participants={
                            participants
                          }
                          updateParticipant={
                            updateParticipant
                          }
                          addParticipant={
                            addParticipant
                          }
                          removeParticipant={
                            removeParticipant
                          }
                          tr={tr}
                        />
                      </>
                    )}

                    <AgreementSection
                      applicantType={
                        applicantType
                      }
                      agreementAccepted={
                        agreementAccepted
                      }
                      setAgreementAccepted={
                        setAgreementAccepted
                      }
                      acknowledgmentAccepted={
                        acknowledgmentAccepted
                      }
                      setAcknowledgmentAccepted={
                        setAcknowledgmentAccepted
                      }
                      tr={tr}
                    />

                    <VerificationSection
                      governmentIdFile={
                        governmentIdFile
                      }
                      setGovernmentIdFile={
                        setGovernmentIdFile
                      }
                      selfieFile={selfieFile}
                      setSelfieFile={
                        setSelfieFile
                      }
                      tr={tr}
                    />

                    {message && (
                      <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-5 text-lg font-bold text-red-700">
                        {message}
                      </div>
                    )}

                    <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
                      <p className="font-bold text-gray-700">
                        {tr(
                          "submit.already_applied",
                        )}
                      </p>

                      <Link
                        href="/entrepreneurs/login"
                        className="mt-2 inline-block font-bold text-blue-700 underline"
                      >
                        {tr("submit.login")}
                      </Link>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-8 w-full rounded-2xl bg-[#06245c] py-5 text-2xl font-extrabold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-500"
                      >
                        {isSubmitting
                          ? tr(
                              "submit.submitting",
                            )
                          : tr(
                              "submit.button",
                            )}
                      </button>
                    </div>
                  </form>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function CommonIdentitySection({
  form,
  onChange,
  tr,
}: {
  form: CommonForm;
  onChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  tr: (key: string) => string;
}) {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-2xl md:p-10">
      <h3 className="text-3xl font-extrabold md:text-4xl">
        {tr("account.title")}
      </h3>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Input
          name="full_name"
          value={form.full_name}
          onChange={onChange}
          placeholder={tr("account.full_name")}
          required
        />

        <Input
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder={tr("account.email")}
          required
        />

        <Input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={onChange}
          placeholder={tr("account.phone")}
          required
        />

        <Input
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder={tr(
            "account.password_placeholder",
          )}
          minLength={8}
          required
        />

        <CountrySelect
          name="country_of_citizenship"
          value={
            form.country_of_citizenship
          }
          onChange={onChange}
          placeholder={tr(
            "account.country_of_citizenship",
          )}
          tr={tr}
        />

        <div>
          <label className="mb-2 block font-semibold">
            {tr("account.date_of_birth")}
          </label>

          <Input
            type="date"
            name="date_of_birth"
            value={form.date_of_birth}
            onChange={onChange}
            required
          />
        </div>

        <CountrySelect
          name="place_of_birth"
          value={form.place_of_birth}
          onChange={onChange}
          placeholder={tr(
            "account.place_of_birth",
          )}
          tr={tr}
        />

        <CountrySelect
          name="address_country"
          value={form.address_country}
          onChange={onChange}
          placeholder={tr(
            "account.country_of_residence",
          )}
          tr={tr}
        />

        <Input
          name="street_address"
          value={form.street_address}
          onChange={onChange}
          placeholder={tr(
            "account.street_address",
          )}
          required
          className="md:col-span-2"
        />

        <Input
          name="city"
          value={form.city}
          onChange={onChange}
          placeholder={tr("account.city")}
          required
        />

        <Input
          name="state"
          value={form.state}
          onChange={onChange}
          placeholder={tr("account.state")}
          required
        />

        <Input
          name="zip_code"
          value={form.zip_code}
          onChange={onChange}
          placeholder={tr(
            "account.postal_code",
          )}
          required
        />

        <div className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-7 md:col-span-2">
          <h4 className="text-2xl font-extrabold">
            {tr("demographic.title")}
          </h4>

          <p className="mt-3 leading-relaxed text-gray-600">
            {tr("demographic.description")}
          </p>

          <select
            name="race_ethnicity"
            value={form.race_ethnicity}
            onChange={onChange}
            className="mt-5 w-full rounded-2xl border bg-white p-4"
          >
            <option value="">
              {tr(
                "demographic.race_ethnicity",
              )}
            </option>

            {RACE_ETHNICITY_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {tr(
                    `options.race_ethnicity.${option.key}`,
                  )}
                </option>
              ),
            )}
          </select>

          {form.race_ethnicity ===
            "Another race or ethnicity" && (
            <Input
              name="race_ethnicity_other"
              value={
                form.race_ethnicity_other
              }
              onChange={onChange}
              placeholder={tr(
                "demographic.other",
              )}
              className="mt-4"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function IndividualSection({
  form,
  onChange,
  tr,
}: {
  form: IndividualForm;
  onChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  tr: (key: string) => string;
}) {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-2xl md:p-10">
      <h3 className="text-3xl font-extrabold md:text-4xl">
        {tr("individual.title")}
      </h3>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Input
          name="business_name"
          value={form.business_name}
          onChange={onChange}
          placeholder={tr(
            "individual.business_name",
          )}
          required
        />

        <Input
          name="business_type"
          value={form.business_type}
          onChange={onChange}
          placeholder={tr(
            "individual.business_type",
          )}
        />

        <textarea
          name="business_description"
          value={form.business_description}
          onChange={onChange}
          placeholder={tr(
            "individual.business_description",
          )}
          required
          className="h-36 w-full rounded-2xl border p-4 md:col-span-2"
        />

        <div className="md:col-span-2">
          <label className="mb-3 block text-xl font-bold">
            {tr(
              "individual.affiliation_question",
            )}
          </label>

          <select
            name="organization_affiliation"
            value={
              form.organization_affiliation
            }
            onChange={onChange}
            className="w-full rounded-2xl border p-4"
          >
            <option value="">
              {tr(
                "classification.question",
              )}
            </option>
            <option value="No">
              {tr(
                "individual.affiliation_no",
              )}
            </option>
            <option value="Yes">
              {tr(
                "individual.affiliation_yes",
              )}
            </option>
          </select>
        </div>

        {form.organization_affiliation ===
          "Yes" && (
          <>
            <select
              name="organization_type"
              value={
                form.organization_type
              }
              onChange={onChange}
              required
              className="w-full rounded-2xl border p-4"
            >
              <option value="">
                {tr(
                  "individual.affiliation_type",
                )}
              </option>

              {[
                "nonprofit",
                "religious",
                "political",
                "community",
                "professional",
                "other",
              ].map((key) => (
                <option
                  key={key}
                  value={tr(
                    `individual.affiliation_types.${key}`,
                  )}
                >
                  {tr(
                    `individual.affiliation_types.${key}`,
                  )}
                </option>
              ))}
            </select>

            <Input
              name="organization_name"
              value={
                form.organization_name
              }
              onChange={onChange}
              placeholder={tr(
                "individual.affiliation_name",
              )}
              required
            />
          </>
        )}
      </div>
    </section>
  );
}

function OrganizationSection({
  form,
  onChange,
  tr,
}: {
  form: OrganizationForm;
  onChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  tr: (key: string) => string;
}) {
  return (
    <section className="space-y-8 rounded-3xl bg-white p-8 shadow-2xl md:p-10">
      <h3 className="text-3xl font-extrabold md:text-4xl">
        {tr("organization.title")}
      </h3>

      <FormGroup
        title={tr(
          "organization.identity_title",
        )}
      >
        <Input
          name="legal_name"
          value={form.legal_name}
          onChange={onChange}
          placeholder={tr(
            "organization.legal_name",
          )}
          required
        />

        <Input
          name="display_name"
          value={form.display_name}
          onChange={onChange}
          placeholder={tr(
            "organization.display_name",
          )}
        />

        <Input
          name="organization_type"
          value={form.organization_type}
          onChange={onChange}
          placeholder={tr(
            "organization.organization_type",
          )}
        />

        <Input
          name="registration_number"
          value={
            form.registration_number
          }
          onChange={onChange}
          placeholder={tr(
            "organization.registration_number",
          )}
        />

        <Input
          type="number"
          name="year_established"
          value={form.year_established}
          onChange={onChange}
          placeholder={tr(
            "organization.year_established",
          )}
        />

        <Input
          type="url"
          name="website"
          value={form.website}
          onChange={onChange}
          placeholder={tr(
            "organization.website",
          )}
        />

        <Input
          name="organization_street_address"
          value={
            form.organization_street_address
          }
          onChange={onChange}
          placeholder={tr(
            "organization.street_address",
          )}
          required
          className="md:col-span-2"
        />

        <Input
          name="organization_city"
          value={
            form.organization_city
          }
          onChange={onChange}
          placeholder={tr(
            "organization.city",
          )}
          required
        />

        <Input
          name="organization_state_region"
          value={
            form.organization_state_region
          }
          onChange={onChange}
          placeholder={tr(
            "organization.state_region",
          )}
          required
        />

        <Input
          name="organization_postal_code"
          value={
            form.organization_postal_code
          }
          onChange={onChange}
          placeholder={tr(
            "organization.postal_code",
          )}
          required
        />
      </FormGroup>

      <FormGroup
        title={tr(
          "organization.primary_title",
        )}
      >
        <Input
          name="primary_representative_name"
          value={
            form.primary_representative_name
          }
          onChange={onChange}
          placeholder={tr(
            "organization.primary_name",
          )}
          required
        />

        <Input
          name="primary_representative_title"
          value={
            form.primary_representative_title
          }
          onChange={onChange}
          placeholder={tr(
            "organization.primary_role",
          )}
        />

        <Input
          type="email"
          name="primary_representative_email"
          value={
            form.primary_representative_email
          }
          onChange={onChange}
          placeholder={tr(
            "organization.primary_email",
          )}
          required
        />

        <Input
          type="tel"
          name="primary_representative_phone"
          value={
            form.primary_representative_phone
          }
          onChange={onChange}
          placeholder={tr(
            "organization.primary_phone",
          )}
        />
      </FormGroup>

      <FormGroup
        title={tr(
          "organization.secondary_title",
        )}
      >
        <Input
          name="secondary_representative_name"
          value={
            form.secondary_representative_name
          }
          onChange={onChange}
          placeholder={tr(
            "organization.secondary_name",
          )}
        />

        <Input
          name="secondary_representative_title"
          value={
            form.secondary_representative_title
          }
          onChange={onChange}
          placeholder={tr(
            "organization.secondary_role",
          )}
        />

        <Input
          type="email"
          name="secondary_representative_email"
          value={
            form.secondary_representative_email
          }
          onChange={onChange}
          placeholder={tr(
            "organization.secondary_email",
          )}
        />

        <Input
          type="tel"
          name="secondary_representative_phone"
          value={
            form.secondary_representative_phone
          }
          onChange={onChange}
          placeholder={tr(
            "organization.secondary_phone",
          )}
        />
      </FormGroup>

      <FormGroup
        title={tr(
          "organization.project_title",
        )}
      >
        <Input
          name="project_name"
          value={form.project_name}
          onChange={onChange}
          placeholder={tr(
            "organization.project_name",
          )}
          required
        />

        <Input
          name="project_category"
          value={form.project_category}
          onChange={onChange}
          placeholder={tr(
            "organization.project_category",
          )}
        />

        <textarea
          name="project_description"
          value={
            form.project_description
          }
          onChange={onChange}
          placeholder={tr(
            "organization.project_description",
          )}
          required
          className="h-32 w-full rounded-2xl border p-4 md:col-span-2"
        />

        <Input
          name="product_service"
          value={form.product_service}
          onChange={onChange}
          placeholder={tr(
            "organization.product_service",
          )}
        />

        <Input
          name="community_market_served"
          value={
            form.community_market_served
          }
          onChange={onChange}
          placeholder={tr(
            "organization.community_market",
          )}
        />

        <Input
          name="project_location"
          value={form.project_location}
          onChange={onChange}
          placeholder={tr(
            "organization.project_location",
          )}
        />

        <Input
          name="project_stage"
          value={form.project_stage}
          onChange={onChange}
          placeholder={tr(
            "organization.project_stage",
          )}
        />

        <textarea
          name="existing_operations"
          value={
            form.existing_operations
          }
          onChange={onChange}
          placeholder={tr(
            "organization.existing_operations",
          )}
          className="h-28 w-full rounded-2xl border p-4 md:col-span-2"
        />

        <Input
          type="number"
          name="expected_jobs"
          value={form.expected_jobs}
          onChange={onChange}
          placeholder={tr(
            "organization.expected_jobs",
          )}
        />

        <Input
          name="resources_required"
          value={
            form.resources_required
          }
          onChange={onChange}
          placeholder={tr(
            "organization.resources_required",
          )}
        />

        <Input
          name="facility_requirements"
          value={
            form.facility_requirements
          }
          onChange={onChange}
          placeholder={tr(
            "organization.facility_requirements",
          )}
        />

        <Input
          name="licenses_permits"
          value={
            form.licenses_permits
          }
          onChange={onChange}
          placeholder={tr(
            "organization.licenses_permits",
          )}
        />

        <Input
          type="number"
          name="estimated_project_cost"
          value={
            form.estimated_project_cost
          }
          onChange={onChange}
          placeholder={tr(
            "organization.estimated_cost",
          )}
        />

        <Input
          type="number"
          name="requested_financing"
          value={
            form.requested_financing
          }
          onChange={onChange}
          placeholder={tr(
            "organization.requested_financing",
          )}
          max={100000}
          required
        />

        <div className="rounded-2xl border-l-8 border-green-600 bg-green-50 p-5 text-lg leading-relaxed text-gray-700 md:col-span-2">
          {tr(
            "organization.financing_notice",
          )}
        </div>

        <textarea
          name="intended_use_of_financing"
          value={
            form.intended_use_of_financing
          }
          onChange={onChange}
          placeholder={tr(
            "organization.use_of_financing",
          )}
          required
          className="h-32 w-full rounded-2xl border p-4 md:col-span-2"
        />
      </FormGroup>
    </section>
  );
}

function ParticipantsSection({
  participants,
  updateParticipant,
  addParticipant,
  removeParticipant,
  tr,
}: {
  participants: Participant[];
  updateParticipant: (
    index: number,
    field: keyof Participant,
    value: string | boolean,
  ) => void;
  addParticipant: () => void;
  removeParticipant: (
    index: number,
  ) => void;
  tr: (key: string) => string;
}) {
  const roleKeys = [
    "president",
    "vice_president",
    "secretary",
    "treasurer",
    "counselor",
    "project_manager",
    "operations",
    "marketing",
    "sales",
    "production",
    "technology",
    "community_relations",
    "member",
    "other",
  ];

  return (
    <section className="rounded-3xl bg-white p-8 shadow-2xl md:p-10">
      <h3 className="text-3xl font-extrabold md:text-4xl">
        {tr("participants.title")}
      </h3>

      <p className="mt-4 text-lg leading-relaxed text-gray-700">
        {tr("participants.description")}
      </p>

      <div className="mt-8 space-y-8">
        {participants.map(
          (participant, index) => (
            <div
              key={index}
              className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-6"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h4 className="text-2xl font-extrabold">
                  {tr(
                    "participants.participant",
                  )}{" "}
                  {index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() =>
                    removeParticipant(index)
                  }
                  className="rounded-xl bg-red-100 px-5 py-3 font-bold text-red-700"
                >
                  {tr(
                    "participants.remove",
                  )}
                </button>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Input
                  value={
                    participant.full_name
                  }
                  onChange={(event) =>
                    updateParticipant(
                      index,
                      "full_name",
                      event.target.value,
                    )
                  }
                  placeholder={tr(
                    "participants.full_name",
                  )}
                  required
                />

                <Input
                  type="email"
                  value={participant.email}
                  onChange={(event) =>
                    updateParticipant(
                      index,
                      "email",
                      event.target.value,
                    )
                  }
                  placeholder={tr(
                    "participants.email",
                  )}
                />

                <Input
                  type="tel"
                  value={participant.phone}
                  onChange={(event) =>
                    updateParticipant(
                      index,
                      "phone",
                      event.target.value,
                    )
                  }
                  placeholder={tr(
                    "participants.phone",
                  )}
                />

                <select
                  value={
                    participant.organizational_title
                  }
                  onChange={(event) =>
                    updateParticipant(
                      index,
                      "organizational_title",
                      event.target.value,
                    )
                  }
                  required
                  className="w-full rounded-2xl border bg-white p-4"
                >
                  <option value="">
                    {tr(
                      "participants.organizational_title",
                    )}
                  </option>

                  {roleKeys.map((key) => (
                    <option
                      key={key}
                      value={tr(
                        `participants.roles.${key}`,
                      )}
                    >
                      {tr(
                        `participants.roles.${key}`,
                      )}
                    </option>
                  ))}
                </select>

                <Input
                  value={
                    participant.project_role
                  }
                  onChange={(event) =>
                    updateParticipant(
                      index,
                      "project_role",
                      event.target.value,
                    )
                  }
                  placeholder={tr(
                    "participants.project_role",
                  )}
                  required
                />

                <Input
                  value={
                    participant.project_responsibility
                  }
                  onChange={(event) =>
                    updateParticipant(
                      index,
                      "project_responsibility",
                      event.target.value,
                    )
                  }
                  placeholder={tr(
                    "participants.project_responsibility",
                  )}
                  required
                />

                <label className="flex items-center gap-3 rounded-2xl border bg-white p-4 font-semibold">
                  <input
                    type="checkbox"
                    checked={
                      participant.is_primary_representative
                    }
                    onChange={(event) =>
                      updateParticipant(
                        index,
                        "is_primary_representative",
                        event.target.checked,
                      )
                    }
                    className="h-5 w-5"
                  />
                  {tr(
                    "participants.primary_rep",
                  )}
                </label>

                <label className="flex items-center gap-3 rounded-2xl border bg-white p-4 font-semibold">
                  <input
                    type="checkbox"
                    checked={
                      participant.is_secondary_representative
                    }
                    onChange={(event) =>
                      updateParticipant(
                        index,
                        "is_secondary_representative",
                        event.target.checked,
                      )
                    }
                    className="h-5 w-5"
                  />
                  {tr(
                    "participants.secondary_rep",
                  )}
                </label>
              </div>
            </div>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={addParticipant}
        className="mt-8 rounded-2xl bg-green-700 px-7 py-4 text-lg font-extrabold text-white hover:bg-[#06245c]"
      >
        {tr("participants.add")}
      </button>
    </section>
  );
}

function AgreementSection({
  applicantType,
  agreementAccepted,
  setAgreementAccepted,
  acknowledgmentAccepted,
  setAcknowledgmentAccepted,
  tr,
}: {
  applicantType: ApplicantType;
  agreementAccepted: boolean;
  setAgreementAccepted: (
    value: boolean,
  ) => void;
  acknowledgmentAccepted: boolean;
  setAcknowledgmentAccepted: (
    value: boolean,
  ) => void;
  tr: (key: string) => string;
}) {
  const organization =
    applicantType === "organization";

  return (
    <section className="rounded-3xl bg-white p-8 shadow-2xl md:p-10">
      <h3 className="text-3xl font-extrabold md:text-4xl">
        {organization
          ? tr(
              "agreements.organization_title",
            )
          : tr(
              "agreements.individual_title",
            )}
      </h3>

      <div className="mt-8 max-h-[480px] space-y-7 overflow-y-auto rounded-3xl border bg-[#f5f7fb] p-7 text-lg leading-relaxed text-gray-700">
        {[
          ["purpose", "purpose"],
          ["role", "role"],
          ["qualification", "qualification"],
          ["entity", "entity"],
          ["risk", "risk"],
          ["disclaimer", "disclaimer"],
        ].map(([titleKey, textKey]) => (
          <div key={titleKey}>
            <h4 className="text-xl font-extrabold text-[#06245c]">
              {tr(
                `agreements.${titleKey}_title`,
              )}
            </h4>

            <p className="mt-2">
              {tr(
                `agreements.${textKey}_text`,
              )}
            </p>
          </div>
        ))}

        {organization && (
          <>
            <div>
              <h4 className="text-xl font-extrabold text-[#06245c]">
                {tr(
                  "agreements.organization_governance_title",
                )}
              </h4>
              <p className="mt-2">
                {tr(
                  "agreements.organization_governance_text",
                )}
              </p>
            </div>

            <div>
              <h4 className="text-xl font-extrabold text-[#06245c]">
                {tr(
                  "agreements.organization_funding_title",
                )}
              </h4>
              <p className="mt-2">
                {tr(
                  "agreements.organization_funding_text",
                )}
              </p>
            </div>
          </>
        )}
      </div>

      <label className="mt-7 flex items-start gap-4 text-lg leading-relaxed text-gray-700">
        <input
          type="checkbox"
          checked={agreementAccepted}
          onChange={(event) =>
            setAgreementAccepted(
              event.target.checked,
            )
          }
          className="mt-1 h-6 w-6"
        />

        <span>
          {organization
            ? tr(
                "agreements.accept_organization",
              )
            : tr(
                "agreements.accept_individual",
              )}
        </span>
      </label>

      <label className="mt-6 flex items-start gap-4 text-lg leading-relaxed text-gray-700">
        <input
          type="checkbox"
          checked={
            acknowledgmentAccepted
          }
          onChange={(event) =>
            setAcknowledgmentAccepted(
              event.target.checked,
            )
          }
          className="mt-1 h-6 w-6"
        />

        <span>
          {tr(
            "agreements.application_acknowledgment",
          )}
        </span>
      </label>
    </section>
  );
}

function VerificationSection({
  governmentIdFile,
  setGovernmentIdFile,
  selfieFile,
  setSelfieFile,
  tr,
}: {
  governmentIdFile: File | null;
  setGovernmentIdFile: (
    file: File | null,
  ) => void;
  selfieFile: File | null;
  setSelfieFile: (
    file: File | null,
  ) => void;
  tr: (key: string) => string;
}) {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-2xl md:p-10">
      <h3 className="text-3xl font-extrabold md:text-4xl">
        {tr("verification.title")}
      </h3>

      <div className="mt-8 grid gap-7 md:grid-cols-2">
        <div>
          <label className="mb-3 block text-xl font-extrabold">
            {tr(
              "verification.government_id",
            )}
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) =>
              setGovernmentIdFile(
                event.target.files?.[0] ??
                  null,
              )
            }
            className="w-full rounded-2xl border-2 border-gray-300 p-4"
          />

          <p className="mt-3 leading-relaxed text-gray-600">
            {tr(
              "verification.government_id_help",
            )}
          </p>

          {governmentIdFile && (
            <p className="mt-3 font-bold text-green-700">
              ✓ {governmentIdFile.name}
            </p>
          )}
        </div>

        <div>
          <label className="mb-3 block text-xl font-extrabold">
            {tr("verification.selfie")}
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            onChange={(event) =>
              setSelfieFile(
                event.target.files?.[0] ??
                  null,
              )
            }
            className="w-full rounded-2xl border-2 border-gray-300 p-4"
          />

          <p className="mt-3 leading-relaxed text-gray-600">
            {tr(
              "verification.selfie_help",
            )}
          </p>

          {selfieFile && (
            <p className="mt-3 font-bold text-green-700">
              ✓ {selfieFile.name}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function SpecialRequestFormSection({
  form,
  onChange,
  onSubmit,
  isSubmitting,
  message,
  tr,
}: {
  form: SpecialRequestForm;
  onChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  isSubmitting: boolean;
  message: string;
  tr: (key: string) => string;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-10 rounded-3xl bg-white p-8 shadow-2xl md:p-10"
    >
      <h3 className="text-3xl font-extrabold md:text-4xl">
        {tr(
          "international_special_request.title",
        )}
      </h3>

      <p className="mt-5 text-lg leading-relaxed text-gray-700">
        {tr(
          "international_special_request.intro",
        )}
      </p>

      <div className="mt-6 rounded-2xl border-l-8 border-amber-500 bg-amber-50 p-6 text-lg leading-relaxed text-gray-700">
        {tr(
          "international_special_request.notice",
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Input
          name="full_name"
          value={form.full_name}
          onChange={onChange}
          placeholder={tr(
            "international_special_request.full_name",
          )}
          required
        />

        <Input
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder={tr(
            "international_special_request.email",
          )}
          required
        />

        <Input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={onChange}
          placeholder={tr(
            "international_special_request.phone",
          )}
        />

        <Input
          name="business_name"
          value={form.business_name}
          onChange={onChange}
          placeholder={tr(
            "international_special_request.business_name",
          )}
          required
        />

        <Input
          name="country"
          value={form.country}
          onChange={onChange}
          placeholder={tr(
            "international_special_request.country",
          )}
          required
        />

        <Input
          type="number"
          name="years_operating"
          value={form.years_operating}
          onChange={onChange}
          placeholder={tr(
            "international_special_request.years_operating",
          )}
          min={1}
          required
        />

        <Input
          name="registration_status"
          value={
            form.registration_status
          }
          onChange={onChange}
          placeholder={tr(
            "international_special_request.registration_status",
          )}
          required
        />

        <Input
          name="registration_number"
          value={
            form.registration_number
          }
          onChange={onChange}
          placeholder={tr(
            "international_special_request.registration_number",
          )}
        />

        <Input
          name="business_address"
          value={
            form.business_address
          }
          onChange={onChange}
          placeholder={tr(
            "international_special_request.business_address",
          )}
          required
          className="md:col-span-2"
        />

        <Input
          name="website"
          value={form.website}
          onChange={onChange}
          placeholder={tr(
            "international_special_request.website",
          )}
          className="md:col-span-2"
        />

        <Input
          name="product_service"
          value={form.product_service}
          onChange={onChange}
          placeholder={tr(
            "international_special_request.product_service",
          )}
          className="md:col-span-2"
          required
        />

        <textarea
          name="current_operations"
          value={
            form.current_operations
          }
          onChange={onChange}
          placeholder={tr(
            "international_special_request.current_operations",
          )}
          required
          className="h-32 w-full rounded-2xl border p-4 md:col-span-2"
        />

        <textarea
          name="request_reason"
          value={form.request_reason}
          onChange={onChange}
          placeholder={tr(
            "international_special_request.request_reason",
          )}
          required
          className="h-32 w-full rounded-2xl border p-4 md:col-span-2"
        />

        <textarea
          name="supporting_evidence"
          value={
            form.supporting_evidence
          }
          onChange={onChange}
          placeholder={tr(
            "international_special_request.supporting_evidence",
          )}
          className="h-28 w-full rounded-2xl border p-4 md:col-span-2"
        />
      </div>

      {message && (
        <div className="mt-7 rounded-2xl border-2 border-red-500 bg-red-50 p-5 font-bold text-red-700">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 w-full rounded-2xl bg-[#06245c] py-5 text-2xl font-extrabold text-white hover:bg-green-600 disabled:bg-gray-500"
      >
        {isSubmitting
          ? tr(
              "international_special_request.submitting",
            )
          : tr(
              "international_special_request.submit",
            )}
      </button>
    </form>
  );
}

function SuccessPanel({
  message,
  tr,
  specialRequest,
}: {
  message: string;
  tr: (key: string) => string;
  specialRequest: boolean;
}) {
  if (specialRequest) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
        <h3 className="text-4xl font-extrabold text-green-700">
          {tr(
            "international_special_request.success_title",
          )}
        </h3>

        <p className="mt-6 text-xl leading-relaxed text-gray-700">
          {message ||
            tr(
              "international_special_request.success_message",
            )}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-10 shadow-2xl">
      <h3 className="text-4xl font-extrabold text-green-700">
        {tr("success.title")}
      </h3>

      <p className="mt-5 text-xl leading-relaxed text-gray-700">
        {message || tr("success.message")}
      </p>

      <p className="mt-5 text-lg leading-relaxed text-gray-700">
        {tr(
          "success.account_confirmation",
        )}
      </p>

      <div className="mt-9 rounded-3xl bg-[#f5f7fb] p-7">
        <h4 className="text-3xl font-extrabold">
          {tr("success.next_title")}
        </h4>

        <div className="mt-6 space-y-4 text-lg leading-relaxed text-gray-700">
          <p>✅ {tr("success.communication")}</p>
          <p>✅ {tr("success.questionnaire")}</p>
          <p>✅ {tr("success.review")}</p>
          <p>✅ {tr("success.interview")}</p>
          <p>✅ {tr("success.qualification")}</p>
          <p>✅ {tr("success.coach")}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row">
        <Link
          href="/entrepreneurs/communication-preferences"
          className="flex-1 rounded-2xl bg-green-700 px-6 py-4 text-center text-lg font-extrabold text-white hover:bg-[#06245c]"
        >
          {tr(
            "success.communication_button",
          )}
        </Link>

        <Link
          href="/entrepreneurs/questionnaire"
          className="flex-1 rounded-2xl bg-[#06245c] px-6 py-4 text-center text-lg font-extrabold text-white hover:bg-green-700"
        >
          {tr(
            "success.questionnaire_button",
          )}
        </Link>

        <Link
          href="/entrepreneurs/login"
          className="flex-1 rounded-2xl border-2 border-[#06245c] px-6 py-4 text-center text-lg font-extrabold text-[#06245c] hover:bg-[#06245c] hover:text-white"
        >
          {tr("success.login_button")}
        </Link>
      </div>

      <p className="mt-8 text-center text-xl font-extrabold">
        {tr("success.welcome")}
      </p>
    </div>
  );
}

function FormGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-7">
      <h4 className="text-2xl font-extrabold">
        {title}
      </h4>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function CountrySelect({
  name,
  value,
  onChange,
  placeholder,
  tr,
}: {
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
  placeholder: string;
  tr: (key: string) => string;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      required
      className="w-full rounded-2xl border bg-white p-4"
    >
      <option value="">
        {placeholder}
      </option>

      {COUNTRIES.map((country) => (
        <option
          key={country.value}
          value={country.value}
        >
          {tr(
            `options.countries.${country.key}`,
          )}
        </option>
      ))}
    </select>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border bg-white p-4 ${className}`}
    />
  );
}
