"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface EntrepreneurFormData {
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

  business_name: string;
  business_type: string;
  business_description: string;

  organization_affiliation: string;
  organization_name: string;
}

const INITIAL_FORM_DATA: EntrepreneurFormData = {
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

  business_name: "",
  business_type: "",
  business_description: "",

  organization_affiliation: "",
  organization_name: "",
};

const COUNTRIES = [
  "United States",
  "Canada",
  "Haiti",
  "Dominican Republic",
  "France",
  "United Kingdom",
  "Mexico",
  "Jamaica",
  "Bahamas",
  "Brazil",
  "Germany",
  "Spain",
  "Italy",
  "China",
  "India",
  "Japan",
];

const RACE_ETHNICITY_OPTIONS = [
  "Black or African American",
  "Hispanic or Latino",
  "White",
  "Asian",
  "American Indian or Alaska Native",
  "Middle Eastern or North African",
  "Native Hawaiian or Pacific Islander",
  "Another race or ethnicity",
  "Prefer not to answer",
];

export default function EntrepreneurEnrollPage() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [governmentIdFile, setGovernmentIdFile] =
  useState<File | null>(null);

  const [selfieFile, setSelfieFile] =
  useState<File | null>(null);

  const [formData, setFormData] =
    useState<EntrepreneurFormData>(INITIAL_FORM_DATA);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "race_ethnicity" &&
      value !== "Another race or ethnicity"
        ? { race_ethnicity_other: "" }
        : {}),
      ...(name === "organization_affiliation" && value !== "Yes"
        ? { organization_name: "" }
        : {}),
    }));
  };

  async function uploadVerificationDocuments(userId: string) {
  if (!governmentIdFile) {
    throw new Error("Government ID is required.");
  }

  if (!selfieFile) {
    throw new Error("Selfie verification photo is required.");
  }

  const uploadFormData = new FormData();

  uploadFormData.append("userId", userId);
  uploadFormData.append("governmentId", governmentIdFile);
  uploadFormData.append("selfie", selfieFile);

  const response = await fetch(
    "/api/entrepreneurs/upload-verification",
    {
      method: "POST",
      body: uploadFormData,
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result?.error?.message ||
        "Unable to upload your verification documents.",
    );
  }

  return {
    governmentIdPath: String(
      result.data.governmentIdPath,
    ),
    selfieVerificationPath: String(
      result.data.selfieVerificationPath,
    ),
  };
}

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setMessage("");

    if (!governmentIdFile) {
  setMessage("Government ID is required.");
  return;
}

if (!selfieFile) {
  setMessage("Selfie verification photo is required.");
  return;
}

    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedPhone = formData.phone.trim();
    const normalizedBusinessName = formData.business_name.trim();

    if (formData.password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (
      formData.race_ethnicity === "Another race or ethnicity" &&
      !formData.race_ethnicity_other.trim()
    ) {
      setMessage(
        "Please describe your race or ethnicity, or select another option.",
      );
      return;
    }

    if (
      formData.organization_affiliation === "Yes" &&
      !formData.organization_name.trim()
    ) {
      setMessage(
        "Please provide the name and type of the organization.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: existingApplications, error: duplicateCheckError } =
        await supabase
          .from("entrepreneur_applications")
          .select("id")
          .or(
            `email.eq.${normalizedEmail},phone.eq.${normalizedPhone},business_name.eq.${normalizedBusinessName}`,
          )
          .limit(1);

      if (duplicateCheckError) {
        setMessage(
          `Unable to verify your application information. ${duplicateCheckError.message}`,
        );
        return;
      }

      if (existingApplications && existingApplications.length > 0) {
        setMessage(
          "An application already exists with this email, phone number, or proposed business name. Please sign in below to continue.",
        );
        return;
      }
let userId = "";

const { data: existingAuth } =
  await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: formData.password,
  });

if (existingAuth.user) {
  userId = existingAuth.user.id;
} else {
  const { data: authData, error: authError } =
    await supabase.auth.signUp({
      email: normalizedEmail,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/entrepreneurs/login`,
      },
    });

  if (authError || !authData.user) {
    setMessage(
      `Unable to create your entrepreneur login. ${
        authError?.message ?? "Please try again."
      }`,
    );
    return;
  }

  userId = authData.user.id;
}

const {
  governmentIdPath,
  selfieVerificationPath,
} = await uploadVerificationDocuments(userId);

const { error: applicationError } = await supabase
  .from("entrepreneur_applications")
  .insert([
    {
      user_id: userId,

      full_name: formData.full_name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,

      country_of_citizenship:
        formData.country_of_citizenship,
      date_of_birth: formData.date_of_birth,
      place_of_birth: formData.place_of_birth,

      address_country: formData.address_country,
      street_address: formData.street_address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zip_code: formData.zip_code.trim(),

      government_id_path: governmentIdPath,
      selfie_verification_path: selfieVerificationPath,

      race_ethnicity:
        formData.race_ethnicity || null,
      race_ethnicity_other:
        formData.race_ethnicity_other.trim() || null,

      business_name: normalizedBusinessName,
      business_type:
        formData.business_type.trim() || null,
      business_description:
        formData.business_description.trim(),

      organization_affiliation:
        formData.organization_affiliation || null,
      organization_name:
        formData.organization_name.trim() || null,

      status: "Pending Review",
      units_supported: 0,
      units_required: 20,
      funding_queue_position: null,
      funding_round: "Not Assigned",
      estimated_funding_date: null,
    },
  ]);
      if (applicationError) {
        setMessage(applicationError.message);
        return;
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([
          {
            user_id: userId,
            email: normalizedEmail,
            role: "entrepreneur",
          },
        ]);

      if (roleError) {
        console.error(
          "Unable to create entrepreneur role:",
          roleError,
        );
      }

      setMessage(
        "Congratulations! Your application has been received successfully. Please check your email and follow the confirmation link to activate your account.",
      );

      setSubmitted(true);
      setFormData(INITIAL_FORM_DATA);
      setGovernmentIdFile(null);
      setSelfieFile(null);
    } catch (error) {
      console.error("Entrepreneur enrollment error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      {/* APPLICATION ANNOUNCEMENT */}
      <section className="bg-green-600 px-6 py-4 text-center text-white">
        <p className="text-lg font-extrabold md:text-2xl">
          Applications are now open for the First Founding
          Entrepreneur Cohort.
        </p>
      </section>

      {/* HERO SECTION */}
      <section className="bg-[#f5f7fb] py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-8 md:grid-cols-2">
          <div className="text-center md:text-left">
            <p className="mb-4 text-xl font-extrabold uppercase tracking-wider text-green-700">
              Welcome to EPEW-EDE-IBOSS
            </p>

            <h1 className="mb-8 text-5xl font-extrabold leading-tight md:text-7xl">
              Bring Your Business Idea.
            </h1>

            <div className="space-y-5 text-xl leading-relaxed text-gray-700 md:text-2xl">
              <p>
                <strong>EPEW</strong> develops your business idea
                and provides you with a structured funding system.
              </p>

              <p>
                <strong>EDE</strong> organizes the resources and
                services needed to help launch your business.
              </p>

              <p>
                <strong>IBOSS</strong> prepares you to become a
                successful entrepreneur.
              </p>
            </div>

            <div className="mt-9 rounded-3xl border border-green-200 bg-green-50 p-6">
              <p className="text-xl font-extrabold leading-relaxed text-[#06245c] md:text-2xl">
                No credit requirement. No collateral requirement.
                No job requirement. Just you and your business idea.
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
              EPEW is not a lender, bank, broker-dealer, or
              investment company, and this is not a loan program.
              Entrepreneur support is generated through structured
              community participation and depends on entrepreneur
              preparation, qualification, supporter participation,
              business readiness, and ecosystem conditions.
            </p>
          </div>
        </div>
      </section>

      {/* PROCESS OVERVIEW */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-8 text-5xl font-bold md:text-6xl">
              Before You Begin
            </h2>

            <div className="mx-auto max-w-6xl space-y-6 text-xl leading-relaxed text-gray-700 md:text-3xl">
              <p>
                Please complete your enrollment request carefully.
                After your application is received, our team will
                review it and assign you a personal coach within
                approximately <strong>3 to 15 days</strong>.
              </p>

              <p>
                Your personal coach will guide you through the
                Entrepreneur Development Program, help you organize
                and develop your business idea, prepare you for your
                interview, and support you throughout the
                qualification process.
              </p>

              <p className="font-extrabold text-[#06245c]">
                Your business idea and your commitment to learn,
                prepare, and grow are all that you need to begin.
              </p>
            </div>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            <div className="rounded-3xl bg-[#f5f7fb] p-10 text-center shadow-xl">
              <div className="mb-8 text-7xl">📝</div>

              <h3 className="mb-6 text-3xl font-bold">
                1. Submit Your Application
              </h3>

              <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
                Create your entrepreneur account and tell us about
                yourself, your goals, and the business idea you want
                to develop.
              </p>
            </div>

            <div className="rounded-3xl bg-[#f5f7fb] p-10 text-center shadow-xl">
              <div className="mb-8 text-7xl">🔎</div>

              <h3 className="mb-6 text-3xl font-bold">
                2. Application Review
              </h3>

              <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
                Our team reviews your application and prepares your
                entrepreneur record for assignment to a personal
                coach.
              </p>
            </div>

            <div className="rounded-3xl bg-[#f5f7fb] p-10 text-center shadow-xl">
              <div className="mb-8 text-7xl">🤝</div>

              <h3 className="mb-6 text-3xl font-bold">
                3. Coach and Qualification
              </h3>

              <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
                Your coach schedules your first interview, helps you
                develop your business idea, and prepares you for
                successful qualification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WELCOME NOTICE */}
      <section className="bg-[#06245c] py-24 text-white">
        <div className="mx-auto max-w-6xl px-8 text-center">
          <h2 className="mb-5 text-5xl font-bold md:text-6xl">
            Welcome to the EPEW-EDE-IBOSS Program
          </h2>

          <p className="mb-10 text-2xl font-bold text-green-300 md:text-3xl">
            The Leading Path to Business Development and Structured
            Funding
          </p>

          <p className="mb-12 text-xl leading-relaxed text-gray-200 md:text-3xl">
            Thank you for your interest in becoming part of our
            worldwide entrepreneurship program. We are excited to
            help you develop your business idea and guide you on your
            journey to becoming a successful entrepreneur.
          </p>

          <div className="rounded-3xl bg-white p-10 text-[#06245c] shadow-2xl">
            <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
              Every application is reviewed individually. Please
              allow approximately <strong>3 to 15 days</strong> for
              our team to review your application and assign you a
              personal coach who will guide you through the
              Entrepreneur Development Program.
            </p>
          </div>
        </div>
      </section>

      {/* ENROLLMENT SECTION */}
      <section className="bg-[#f5f7fb] py-24">
        <div className="mx-auto max-w-6xl px-8">
          <div className="mb-12">
            <h2 className="mb-8 text-5xl font-bold md:text-6xl">
              Apply to Become an EPEW Entrepreneur
            </h2>

            <p className="max-w-5xl text-xl leading-relaxed text-gray-700 md:text-3xl">
              Your entrepreneurial journey begins with one business
              idea and a commitment to learn, prepare, and grow.
              Complete the application below to begin your journey
              with EPEW-EDE-IBOSS.
            </p>
          </div>

          {submitted ? (
            <div className="mt-10 rounded-3xl bg-white p-10 shadow-2xl">
              <div className="mb-10 rounded-2xl border-2 border-green-600 bg-green-50 p-6 text-xl font-bold leading-relaxed text-green-800 md:text-2xl">
                {message}
              </div>

              <div className="rounded-3xl bg-white p-10 shadow-xl">
                <h3 className="mb-6 text-4xl font-extrabold">
                  What Happens Next?
                </h3>

                <div className="space-y-5 text-xl leading-relaxed text-gray-700">
                  <p>
                    ✅ Check your email and follow the confirmation
                    link to activate your entrepreneur account.
                  </p>

                  <p>
                    ✅ Our team will review your application.
                  </p>

                  <p>
                    ✅ A personal coach will be assigned within
                    approximately 3 to 15 days.
                  </p>

                  <p>
                    ✅ Your coach will schedule your first interview.
                  </p>

                  <p>
                    ✅ Together, you will develop your business idea
                    and prepare for qualification.
                  </p>
                </div>

                <div className="mt-10 rounded-2xl border-l-8 border-green-600 bg-[#f5f7fb] p-7">
                  <h4 className="mb-3 text-2xl font-extrabold text-[#06245c]">
                    Please Note
                  </h4>

                  <p className="text-xl leading-relaxed text-gray-700">
                    Your personal invitation link will become
                    available after your interview and successful
                    qualification.
                  </p>
                </div>

                <p className="mt-10 text-xl font-bold text-[#06245c]">
                  Welcome to the EPEW-EDE-IBOSS Program.
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-700">
                  The EPEW-EDE-IBOSS Team
                </p>

                <div className="mt-10">
                  <Link
                    href="/entrepreneurs/login"
                    className="inline-flex rounded-2xl bg-[#06245c] px-8 py-4 text-xl font-bold text-white transition hover:bg-green-600"
                  >
                    Go to Entrepreneur Login
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl bg-white p-10 shadow-2xl"
            >
              <h3 className="mb-10 text-center text-4xl font-bold md:text-5xl">
                Create Your Entrepreneur Account
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                <input
                  type="text"
                  name="full_name"
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4"
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4"
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4"
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Create Password — Minimum 8 Characters"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={8}
                  required
                  className="w-full rounded-2xl border p-4"
                />

                <select
                  name="country_of_citizenship"
                  value={formData.country_of_citizenship}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4"
                >
                  <option value="">Country of Citizenship</option>

                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>

                <div>
                  <label className="mb-2 block font-semibold">
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border p-4"
                  />
                </div>

                <select
                  name="place_of_birth"
                  value={formData.place_of_birth}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4"
                >
                  <option value="">Country of Birth</option>

                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>

                <select
                  name="address_country"
                  value={formData.address_country}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4"
                >
                  <option value="">Country of Residence</option>

                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  name="street_address"
                  placeholder="Street Address"
                  value={formData.street_address}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4 md:col-span-2"
                />

                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4"
                />

                <input
                  type="text"
                  name="state"
                  placeholder="State / Province"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4"
                />

                <input
                  type="text"
                  name="zip_code"
                  placeholder="ZIP / Postal Code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4"
                />

                <div className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-7 md:col-span-2">
                  <h4 className="mb-2 text-2xl font-extrabold text-[#06245c]">
                    Optional Demographic Information
                  </h4>

                  <p className="mb-6 leading-relaxed text-gray-600">
                    EPEW collects this information only to understand
                    the communities we serve and improve community
                    outreach. Your answer is optional and will not
                    affect your application, qualification, funding
                    eligibility, or access to services.
                  </p>

                  <select
                    name="race_ethnicity"
                    value={formData.race_ethnicity}
                    onChange={handleChange}
                    className="w-full rounded-2xl border bg-white p-4"
                  >
                    <option value="">
                      Race or Ethnicity — Optional
                    </option>

                    {RACE_ETHNICITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  {formData.race_ethnicity ===
                    "Another race or ethnicity" && (
                    <input
                      type="text"
                      name="race_ethnicity_other"
                      placeholder="Please describe — Optional"
                      value={formData.race_ethnicity_other}
                      onChange={handleChange}
                      className="mt-4 w-full rounded-2xl border bg-white p-4"
                    />
                  )}
                </div>

                <input
                  type="text"
                  name="business_name"
                  placeholder="Business Idea or Proposed Business Name"
                  value={formData.business_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border p-4"
                />

                <input
                  type="text"
                  name="business_type"
                  placeholder="Business Category — Optional"
                  value={formData.business_type}
                  onChange={handleChange}
                  className="w-full rounded-2xl border p-4"
                />

                <textarea
                  name="business_description"
                  placeholder="Describe your business idea in a few sentences."
                  value={formData.business_description}
                  onChange={handleChange}
                  required
                  className="h-32 w-full rounded-2xl border p-4 md:col-span-2"
                />

                <div className="md:col-span-2">
                  <label className="mb-3 block text-xl font-semibold">
                    Are you currently affiliated with any
                    organization?
                  </label>

                  <select
                    name="organization_affiliation"
                    value={formData.organization_affiliation}
                    onChange={handleChange}
                    className="w-full rounded-2xl border p-4"
                  >
                    <option value="">Select an option</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {formData.organization_affiliation === "Yes" && (
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="organization_name"
                      placeholder="Organization name and type — nonprofit, political, religious, professional, community, or other"
                      value={formData.organization_name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border p-4"
                    />
                  </div>
                )}
              </div>

              {/* PARTICIPATION AGREEMENT */}
              <div className="mt-10 rounded-3xl border-l-8 border-green-600 bg-[#f5f7fb] p-8 shadow-xl">
                <h4 className="mb-8 text-3xl font-bold text-[#06245c] md:text-4xl">
                  Entrepreneur Participation Agreement
                </h4>

                <div className="max-h-[420px] space-y-6 overflow-y-auto rounded-3xl border border-gray-300 bg-white p-8 text-lg leading-relaxed text-gray-700">
                  <p>
                    This Entrepreneur Participation Agreement defines
                    the terms under which the entrepreneur
                    participates in the EPEW entrepreneur development
                    platform.
                  </p>

                  <div>
                    <h5 className="mb-3 text-2xl font-bold">
                      1. Purpose of the Program
                    </h5>

                    <p>
                      The EPEW program supports entrepreneurs through
                      coaching, business-idea development, preparation
                      assistance, partner services, campaign
                      organization, platform coordination, and
                      structured community participation.
                    </p>
                  </div>

                  <div>
                    <h5 className="mb-3 text-2xl font-bold">
                      2. Role of EPEW
                    </h5>

                    <p>
                      EPEW provides platform organization,
                      entrepreneur preparation, coaching coordination,
                      communication tools, and campaign preparation.
                      EPEW does not guarantee qualification, campaign
                      completion, funding, business success,
                      profitability, supporter participation, or
                      marketplace approval.
                    </p>
                  </div>

                  <div>
                    <h5 className="mb-3 text-2xl font-bold">
                      3. Coach Assignment
                    </h5>

                    <p>
                      After registration and application review, the
                      entrepreneur may be assigned a personal coach to
                      guide the interview, business-idea development,
                      preparation, and qualification process.
                    </p>
                  </div>

                  <div>
                    <h5 className="mb-3 text-2xl font-bold">
                      4. Business Entity Requirement
                    </h5>

                    <p>
                      Before business launch, the entrepreneur may be
                      required to establish a valid legal business
                      entity and complete applicable registration,
                      identification, licensing, banking, insurance,
                      and related preparation requirements.
                    </p>
                  </div>

                  <div>
                    <h5 className="mb-3 text-2xl font-bold">
                      5. Risk Acknowledgment
                    </h5>

                    <p>
                      The entrepreneur understands that qualification,
                      community participation, campaign completion,
                      funding, business success, and profitability are
                      not guaranteed. Results depend on preparation,
                      qualification, supporter participation, business
                      readiness, and ecosystem conditions.
                    </p>
                  </div>

                  <div>
                    <h5 className="mb-3 text-2xl font-bold">
                      6. EPEW Disclaimer
                    </h5>

                    <p>
                      EPEW acts as a platform coordinator and
                      administrative organizer. EPEW is not a lender,
                      bank, broker-dealer, investment company, or
                      investment adviser.
                    </p>
                  </div>
                </div>

                <label className="mt-8 flex items-start gap-4 text-xl leading-relaxed text-gray-700">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 h-6 w-6"
                  />

                  <span>
                    I have read, understand, and agree to the
                    Entrepreneur Participation Agreement.
                  </span>
                </label>
              </div>

              {/* ID AND PHOTO */}
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-2xl font-bold">
                    Government ID Upload
                  </label>

                 <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
                onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setGovernmentIdFile(file);
          }}
            className="w-full rounded-2xl border-2 border-gray-300 px-6 py-5"
          />

          <p className="mt-3 text-base leading-relaxed text-gray-600">
                Required. Upload a clear photograph or PDF of a valid
                government-issued identification document. Maximum size: 10 MB.
          </p>
          {governmentIdFile && (
  <p className="mt-3 font-semibold text-green-700">
    ✓ Selected: {governmentIdFile.name}
  </p>
)}
                </div>

                <div>
                  <label className="mb-3 block text-2xl font-bold">
                    Selfie Verification Photo
                  </label>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="user"
                    required
                    onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                  setSelfieFile(file);
              }}
                  className="w-full rounded-2xl border-2 border-gray-300 px-6 py-5"
            />

          <p className="mt-3 text-lg leading-relaxed text-gray-600">
              Required. Take or upload a clear photograph of yourself for
              entrepreneur identity verification. Maximum size: 6 MB.
          </p>
          {selfieFile && (
  <p className="mt-3 font-semibold text-green-700">
    ✓ Selected: {selfieFile.name}
  </p>
)}
                </div>
              </div>

              <label className="mt-10 flex items-start gap-4 text-xl leading-relaxed text-gray-700">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-6 w-6"
                />

                <span>
                  I understand that this is an application and
                  enrollment request, not a guarantee of
                  qualification, public listing, funding, campaign
                  completion, or business approval. I agree to follow
                  the EPEW preparation and qualification process.
                </span>
              </label>

              {message && (
                <div className="mt-6 rounded-2xl border-2 border-red-500 bg-red-100 p-4 text-xl font-bold text-red-700">
                  {message}
                </div>
              )}

              <div className="mt-8 text-center">
                <p className="font-bold text-gray-700">
                  Already applied or registered?
                </p>

                <Link
                  href="/entrepreneurs/login"
                  className="font-bold text-blue-700 underline"
                >
                  Sign in to your entrepreneur account
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-10 w-full rounded-2xl bg-[#06245c] py-5 text-2xl font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-500"
              >
                {isSubmitting
                  ? "Submitting Your Application..."
                  : "Submit My Application"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}