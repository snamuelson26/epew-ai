"use client";

import Navbar from "@/app/components/Navbar";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const LANGUAGE_LEVELS = [
  "Native",
  "Fluent",
  "Intermediate",
  "Basic",
];

const SERVICE_CATEGORIES = [
  "Business Registration & Compliance",
  "Accounting & Bookkeeping",
  "Tax Services",
  "Legal Services",
  "Insurance",
  "Real Estate & Commercial Space",
  "Construction & Renovation",
  "Equipment & Machinery",
  "Inventory & Supplies",
  "Technology & IT Services",
  "Website & Software Development",
  "Marketing & Promotion",
  "Graphic Design & Branding",
  "Printing & Signage",
  "Transportation & Delivery",
  "Food & Restaurant Services",
  "Beauty & Personal Care",
  "Professional Consulting",
  "Training & Education",
  "Other",
];

export default function VendorApplyPage() {
  const [legalName, setLegalName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactName, setContactName] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");

  const [language1, setLanguage1] = useState("");
  const [language1Speaking, setLanguage1Speaking] = useState("");
  const [language1Writing, setLanguage1Writing] = useState("");

  const [language2, setLanguage2] = useState("");
  const [language2Speaking, setLanguage2Speaking] = useState("");
  const [language2Writing, setLanguage2Writing] = useState("");

  const [language3, setLanguage3] = useState("");
  const [language3Speaking, setLanguage3Speaking] = useState("");
  const [language3Writing, setLanguage3Writing] = useState("");

  const [serviceCategory, setServiceCategory] = useState("");
  const [serviceDetails, setServiceDetails] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [certifications, setCertifications] = useState("");
  const [coverageArea, setCoverageArea] = useState("");

  const [maximumActiveJobs, setMaximumActiveJobs] = useState("5");
  const [acceptsAutomaticMatching, setAcceptsAutomaticMatching] =
    useState(true);

  const [whyJoin, setWhyJoin] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setLegalName("");
    setBusinessName("");
    setDisplayName("");
    setContactName("");

    setEmail("");
    setPhone("");
    setWebsite("");

    setCountry("");
    setStateRegion("");
    setCity("");

    setLanguage1("");
    setLanguage1Speaking("");
    setLanguage1Writing("");

    setLanguage2("");
    setLanguage2Speaking("");
    setLanguage2Writing("");

    setLanguage3("");
    setLanguage3Speaking("");
    setLanguage3Writing("");

    setServiceCategory("");
    setServiceDetails("");
    setYearsInBusiness("");
    setCertifications("");
    setCoverageArea("");

    setMaximumActiveJobs("5");
    setAcceptsAutomaticMatching(true);

    setWhyJoin("");
  }

  async function submitApplication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");
    setLoading(true);

    const maxJobs = Number.parseInt(maximumActiveJobs, 10);

    const { error } = await supabase.from("vendor_candidates").insert({
      legal_name: legalName.trim(),
      business_name: businessName.trim(),
      display_name: displayName.trim(),
      contact_name: contactName.trim(),

      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      website: website.trim(),

      country: country.trim(),
      state_region: stateRegion.trim(),
      city: city.trim(),

      language1: language1.trim(),
      language1_speaking: language1Speaking,
      language1_writing: language1Writing,

      language2: language2.trim(),
      language2_speaking: language2Speaking,
      language2_writing: language2Writing,

      language3: language3.trim(),
      language3_speaking: language3Speaking,
      language3_writing: language3Writing,

      service_category: serviceCategory,
      service_details: serviceDetails.trim(),
      years_in_business: yearsInBusiness.trim(),
      certifications: certifications.trim(),
      coverage_area: coverageArea.trim(),

      maximum_active_jobs:
        Number.isFinite(maxJobs) && maxJobs > 0 ? maxJobs : 5,

      accepts_automatic_matching: acceptsAutomaticMatching,

      why_join: whyJoin.trim(),

      status: "Pending",
    });

    setLoading(false);

    if (error) {
      console.error("Vendor application error:", error);

      setErrorMessage(
        "Unable to submit your Vendor application. Please review your information and try again.",
      );

      return;
    }

    setMessage(
      "Your EPEW Vendor application has been submitted successfully. Your application is now pending review.",
    );

    resetForm();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="bg-[#06245c] px-6 py-14 text-center text-white">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-lg font-extrabold uppercase tracking-[0.18em] text-green-400">
              EPEW Enterprise Task & Vendor Management Center
            </p>

            <h1 className="text-4xl font-extrabold md:text-6xl">
              Vendor Application
            </h1>

            <p className="mx-auto mt-6 max-w-4xl text-xl leading-relaxed text-gray-200 md:text-2xl">
              Apply to provide professional services, products, equipment,
              supplies, technology, construction, promotion, or other approved
              business support within the EPEW ecosystem.
            </p>
          </div>
        </section>

        <section className="px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 rounded-3xl border-l-8 border-green-600 bg-green-50 p-7">
              <h2 className="text-2xl font-extrabold">
                How Vendor participation works
              </h2>

              <p className="mt-3 text-lg leading-relaxed text-gray-700">
                Submitting this application does not automatically make an
                applicant an approved EPEW Vendor. Applications are reviewed
                before Vendor access, qualification, job matching, bidding, or
                assignment becomes available.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-2xl md:p-12">
              <h2 className="mb-3 text-4xl font-extrabold">
                Candidate Vendor Application
              </h2>

              <p className="mb-10 text-xl text-gray-600">
                Fields marked required must be completed before submission.
              </p>

              {message && (
                <div className="mb-8 rounded-2xl border-2 border-green-500 bg-green-50 p-6 text-xl font-bold text-green-800">
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="mb-8 rounded-2xl border-2 border-red-500 bg-red-50 p-6 text-xl font-bold text-red-700">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={submitApplication} className="space-y-10">
                <section>
                  <h3 className="mb-6 text-3xl font-bold">
                    Business Information
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Legal Business or Professional Name *"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      required
                      className="rounded-2xl border p-5 text-xl"
                    />

                    <input
                      type="text"
                      placeholder="Business Name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="rounded-2xl border p-5 text-xl"
                    />

                    <input
                      type="text"
                      placeholder="Display / Trade Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="rounded-2xl border p-5 text-xl"
                    />

                    <input
                      type="text"
                      placeholder="Primary Contact Name *"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="rounded-2xl border p-5 text-xl"
                    />

                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-2xl border p-5 text-xl"
                    />

                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="rounded-2xl border p-5 text-xl"
                    />

                    <input
                      type="url"
                      placeholder="Website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="rounded-2xl border p-5 text-xl md:col-span-2"
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-6 text-3xl font-bold">
                    Primary Service Location
                  </h3>

                  <div className="grid gap-5 md:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Country *"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      className="rounded-2xl border p-5 text-xl"
                    />

                    <input
                      type="text"
                      placeholder="State / Region"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      className="rounded-2xl border p-5 text-xl"
                    />

                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="rounded-2xl border p-5 text-xl"
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-6 text-3xl font-bold">
                    Service Expertise
                  </h3>

                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    required
                    className="mb-5 w-full rounded-2xl border p-5 text-xl"
                  >
                    <option value="">
                      Select Primary Service Category *
                    </option>

                    {SERVICE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <textarea
                    rows={5}
                    placeholder="Describe the products or services you can provide to EPEW businesses *"
                    value={serviceDetails}
                    onChange={(e) => setServiceDetails(e.target.value)}
                    required
                    className="mb-5 w-full rounded-2xl border p-5 text-xl"
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Years in Business / Professional Experience"
                      value={yearsInBusiness}
                      onChange={(e) => setYearsInBusiness(e.target.value)}
                      className="rounded-2xl border p-5 text-xl"
                    />

                    <input
                      type="text"
                      placeholder="Coverage Area"
                      value={coverageArea}
                      onChange={(e) => setCoverageArea(e.target.value)}
                      className="rounded-2xl border p-5 text-xl"
                    />
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Licenses, Certifications, Credentials, or Professional Qualifications"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    className="mt-5 w-full rounded-2xl border p-5 text-xl"
                  />
                </section>

                <section>
                  <h3 className="mb-6 text-3xl font-bold">
                    Languages
                  </h3>

                  {[
                    {
                      number: 1,
                      language: language1,
                      setLanguage: setLanguage1,
                      speaking: language1Speaking,
                      setSpeaking: setLanguage1Speaking,
                      writing: language1Writing,
                      setWriting: setLanguage1Writing,
                    },
                    {
                      number: 2,
                      language: language2,
                      setLanguage: setLanguage2,
                      speaking: language2Speaking,
                      setSpeaking: setLanguage2Speaking,
                      writing: language2Writing,
                      setWriting: setLanguage2Writing,
                    },
                    {
                      number: 3,
                      language: language3,
                      setLanguage: setLanguage3,
                      speaking: language3Speaking,
                      setSpeaking: setLanguage3Speaking,
                      writing: language3Writing,
                      setWriting: setLanguage3Writing,
                    },
                  ].map((item) => (
                    <div
                      key={item.number}
                      className="mb-5 grid gap-4 md:grid-cols-3"
                    >
                      <input
                        type="text"
                        placeholder={`Language ${item.number}`}
                        value={item.language}
                        onChange={(e) =>
                          item.setLanguage(e.target.value)
                        }
                        className="rounded-2xl border p-5 text-xl"
                      />

                      <select
                        value={item.speaking}
                        onChange={(e) =>
                          item.setSpeaking(e.target.value)
                        }
                        className="rounded-2xl border p-5 text-xl"
                      >
                        <option value="">Speaking Ability</option>

                        {LANGUAGE_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>

                      <select
                        value={item.writing}
                        onChange={(e) =>
                          item.setWriting(e.target.value)
                        }
                        className="rounded-2xl border p-5 text-xl"
                      >
                        <option value="">Writing Ability</option>

                        {LANGUAGE_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </section>

                <section>
                  <h3 className="mb-6 text-3xl font-bold">
                    ETVMC Job Capacity
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="maximum-active-jobs"
                        className="mb-2 block text-lg font-bold"
                      >
                        Maximum Active Jobs
                      </label>

                      <input
                        id="maximum-active-jobs"
                        type="number"
                        min="1"
                        max="100"
                        value={maximumActiveJobs}
                        onChange={(e) =>
                          setMaximumActiveJobs(e.target.value)
                        }
                        className="w-full rounded-2xl border p-5 text-xl"
                      />
                    </div>

                    <label className="flex items-start gap-4 rounded-2xl border bg-[#f5f7fb] p-6">
                      <input
                        type="checkbox"
                        checked={acceptsAutomaticMatching}
                        onChange={(e) =>
                          setAcceptsAutomaticMatching(e.target.checked)
                        }
                        className="mt-1 h-6 w-6"
                      />

                      <span className="text-lg leading-relaxed">
                        <strong>
                          Participate in automatic Vendor matching
                        </strong>
                        <br />
                        ETVMC may identify my business as a potential
                        match when qualified jobs become available.
                      </span>
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="mb-6 text-3xl font-bold">
                    Why EPEW?
                  </h3>

                  <textarea
                    rows={6}
                    placeholder="Why do you want to become an EPEW Vendor?"
                    value={whyJoin}
                    onChange={(e) => setWhyJoin(e.target.value)}
                    className="w-full rounded-2xl border p-5 text-xl"
                  />
                </section>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                  <p className="text-lg leading-relaxed text-gray-700">
                    By submitting this application, you confirm that the
                    information provided is accurate. EPEW may request
                    additional documentation, credentials, insurance,
                    licenses, tax information, or other compliance records
                    before approving Vendor participation.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#06245c] py-5 text-2xl font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-500"
                >
                  {loading
                    ? "Submitting Vendor Application..."
                    : "Submit Vendor Application"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
