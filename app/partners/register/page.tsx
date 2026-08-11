"use client";

import Navbar from "@/app/components/Navbar";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PartnerApplyPage() {
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");

  const [language1, setLanguage1] = useState("");
  const [language1Speaking, setLanguage1Speaking] = useState("");
  const [language1Writing, setLanguage1Writing] = useState("");

  const [language2, setLanguage2] = useState("");
  const [language2Speaking, setLanguage2Speaking] = useState("");
  const [language2Writing, setLanguage2Writing] = useState("");

  const [language3, setLanguage3] = useState("");
  const [language3Speaking, setLanguage3Speaking] = useState("");
  const [language3Writing, setLanguage3Writing] = useState("");

  const [certifications, setCertifications] = useState("");
  const [coverageArea, setCoverageArea] = useState("");
  const [whyJoin, setWhyJoin] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    const { data: existingCandidate } = await supabase
  .from("partner_candidates")
  .select("id")
  .or(`email.eq.${cleanEmail},business_name.eq.${businessName}`)
  .maybeSingle();

if (existingCandidate) {
  setLoading(false);
  setMessage(
  "A partner application already exists with this email or business name. Please wait for admin review."
);
  return;
}


    const { error } = await supabase.from("partner_candidates").insert({
      business_name: businessName,
      contact_name: contactName,
      email: cleanEmail,
      phone,
      website,
      service_category: serviceCategory,
      years_in_business: yearsInBusiness,

      language1,
      language1_speaking: language1Speaking,
      language1_writing: language1Writing,

      language2,
      language2_speaking: language2Speaking,
      language2_writing: language2Writing,

      language3,
      language3_speaking: language3Speaking,
      language3_writing: language3Writing,

      certifications,
      coverage_area: coverageArea,
      why_join: whyJoin,
      status: "Pending",
    });

    setLoading(false);

    if (error) {
  console.log(error);
  setMessage("Unable to submit partner application: " + error.message);
  return;
}

    setMessage("Partner application submitted successfully.");

    setBusinessName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setWebsite("");
    setServiceCategory("");
    setYearsInBusiness("");

    setLanguage1("");
    setLanguage1Speaking("");
    setLanguage1Writing("");

    setLanguage2("");
    setLanguage2Speaking("");
    setLanguage2Writing("");

    setLanguage3("");
    setLanguage3Speaking("");
    setLanguage3Writing("");

    setCertifications("");
    setCoverageArea("");
    setWhyJoin("");
  }

  return (
    <>
      {/* OFFICIAL EPEW NAVBAR */}
      <Navbar />

      {/* PAGE */}
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-10">
          <h1 className="text-5xl font-extrabold text-center mb-6">
            Candidate Partner Application
          </h1>

          <p className="text-2xl text-gray-700 text-center mb-10">
            Apply to become an EPEW partner. Approved candidates will receive a
            private invitation link to create an official partner account.
          </p>

          <form onSubmit={submitApplication} className="space-y-6">

            <input
              type="text"
              placeholder="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="w-full border rounded-2xl p-5 text-xl"
            />

            <input
              type="text"
              placeholder="Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              className="w-full border rounded-2xl p-5 text-xl"
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded-2xl p-5 text-xl"
            />

            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-2xl p-5 text-xl"
            />

            <input
              type="text"
              placeholder="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full border rounded-2xl p-5 text-xl"
            />

            <input
              type="text"
              placeholder="Service Category"
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              className="w-full border rounded-2xl p-5 text-xl"
            />

            <input
              type="text"
              placeholder="Years in Business"
              value={yearsInBusiness}
              onChange={(e) => setYearsInBusiness(e.target.value)}
              className="w-full border rounded-2xl p-5 text-xl"
            />

            <input
              type="text"
              placeholder="Certifications and Licenses"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              className="w-full border rounded-2xl p-5 text-xl"
            />

            <input
              type="text"
              placeholder="Coverage Area"
              value={coverageArea}
              onChange={(e) => setCoverageArea(e.target.value)}
              className="w-full border rounded-2xl p-5 text-xl"
            />

            <textarea
              rows={5}
              placeholder="Why do you want to become an EPEW partner?"
              value={whyJoin}
              onChange={(e) => setWhyJoin(e.target.value)}
              className="w-full border rounded-2xl p-5 text-xl"
            />

            {message && (
              <p className="text-center text-xl font-bold text-green-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
            >
              {loading ? "Submitting..." : "Submit Partner Application"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}