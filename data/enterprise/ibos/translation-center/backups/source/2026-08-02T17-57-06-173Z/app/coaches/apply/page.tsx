"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CoachApplyPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [language1, setLanguage1] = useState("");
  const [language1Speaking, setLanguage1Speaking] = useState("");
  const [language1Writing, setLanguage1Writing] = useState("");

  const [language2, setLanguage2] = useState("");
  const [language2Speaking, setLanguage2Speaking] = useState("");
  const [language2Writing, setLanguage2Writing] = useState("");

  const [language3, setLanguage3] = useState("");
  const [language3Speaking, setLanguage3Speaking] = useState("");
  const [language3Writing, setLanguage3Writing] = useState("");

  const [industryExpertise, setIndustryExpertise] = useState("");
  const [experience, setExperience] = useState("");
  const [certifications, setCertifications] = useState("");
  const [availability, setAvailability] = useState("");
  const [coverageArea, setCoverageArea] = useState("");
  const [whyJoin, setWhyJoin] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.from("coach_candidates").insert({
      full_name: fullName,
      email: email.trim().toLowerCase(),
      phone,

      language1,
      language1_speaking: language1Speaking,
      language1_writing: language1Writing,

      language2,
      language2_speaking: language2Speaking,
      language2_writing: language2Writing,

      language3,
      language3_speaking: language3Speaking,
      language3_writing: language3Writing,

      industry_expertise: industryExpertise,
      experience,
      certifications,
      availability,
      coverage_area: coverageArea,
      why_join: whyJoin,
      status: "Pending",
    });

    setLoading(false);

    if (error) {
  console.log(error);
  setMessage("Unable to submit coach application: " + error.message);
  return;
}

    setMessage("Coach application submitted successfully.");

    setFullName("");
    setEmail("");
    setPhone("");

    setLanguage1("");
    setLanguage1Speaking("");
    setLanguage1Writing("");

    setLanguage2("");
    setLanguage2Speaking("");
    setLanguage2Writing("");

    setLanguage3("");
    setLanguage3Speaking("");
    setLanguage3Writing("");

    setIndustryExpertise("");
    setExperience("");
    setCertifications("");
    setAvailability("");
    setCoverageArea("");
    setWhyJoin("");
  }

  return (
    <>
      {/* NAVBAR */}
      <header className="bg-[#06245c] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">
          <Image
            src="/images/epew-logo.png"
            alt="EPEW Logo"
            width={220}
            height={90}
            style={{ width: "auto", height: "auto" }}
            priority
          />

          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-8">
              <a href="/" className="text-white text-xl font-semibold hover:text-green-400 transition">Home</a>
              <a href="/about" className="text-white text-xl font-semibold hover:text-green-400 transition">About</a>
              <a href="/entrepreneurs" className="text-white text-xl font-semibold hover:text-green-400 transition">Entrepreneurs</a>
              <a href="/supporters" className="text-white text-xl font-semibold hover:text-green-400 transition">Supporters</a>
              <a href="/coaches" className="text-green-400 text-xl font-semibold transition">Coaches</a>
              <a href="/partners" className="text-white text-xl font-semibold hover:text-green-400 transition">Partners</a>
            </nav>

            <select
              className="bg-white text-[#06245c] px-4 py-2 rounded-xl text-lg font-bold outline-none cursor-pointer"
              defaultValue="EN"
            >
              <option value="EN">English (EN)</option>
              <option value="FR">French (FR)</option>
              <option value="HT">Haitian Creole (HT)</option>
              <option value="ES">Spanish (ES)</option>
              <option value="TL">Tagalog (TL)</option>
            </select>
          </div>

          <a
            href="/login"
            className="bg-white text-[#06245c] px-7 py-3 rounded-xl text-xl font-bold hover:bg-green-500 hover:text-white transition"
          >
            Login
          </a>
        </div>
      </header>

      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-10">
          <h1 className="text-5xl font-extrabold text-center mb-6">
            Candidate Coach Application
          </h1>

          <p className="text-2xl text-gray-700 text-center mb-10">
            Apply to become an EPEW coach. Approved candidates will receive a
            private invitation link to create an official coach account.
          </p>

          <form onSubmit={submitApplication} className="space-y-6">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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

            <h2 className="text-3xl font-bold pt-8">
              Languages
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Language 1"
                value={language1}
                onChange={(e) => setLanguage1(e.target.value)}
                className="border rounded-2xl p-5 text-xl"
              />

              <select
                value={language1Speaking}
                onChange={(e) => setLanguage1Speaking(e.target.value)}
                className="border rounded-2xl p-5 text-xl"
              >
                <option value="">Speaking Ability</option>
                <option>Native</option>
                <option>Fluent</option>
                <option>Intermediate</option>
                <option>Basic</option>
              </select>

              <select
                value={language1Writing}
                onChange={(e) => setLanguage1Writing(e.target.value)}
                className="border rounded-2xl p-5 text-xl"
              >
                <option value="">Writing Ability</option>
                <option>Native</option>
                <option>Fluent</option>
                <option>Intermediate</option>
                <option>Basic</option>
              </select>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Language 2"
                value={language2}
                onChange={(e) => setLanguage2(e.target.value)}
                className="border rounded-2xl p-5 text-xl"
              />

              <select
                value={language2Speaking}
                onChange={(e) => setLanguage2Speaking(e.target.value)}
                className="border rounded-2xl p-5 text-xl"
              >
                <option value="">Speaking Ability</option>
                <option>Native</option>
                <option>Fluent</option>
                <option>Intermediate</option>
                <option>Basic</option>
              </select>

              <select
                value={language2Writing}
                onChange={(e) => setLanguage2Writing(e.target.value)}
                className="border rounded-2xl p-5 text-xl"
              >
                <option value="">Writing Ability</option>
                <option>Native</option>
                <option>Fluent</option>
                <option>Intermediate</option>
                <option>Basic</option>
              </select>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Language 3"
                value={language3}
                onChange={(e) => setLanguage3(e.target.value)}
                className="border rounded-2xl p-5 text-xl"
              />

              <select
                value={language3Speaking}
                onChange={(e) => setLanguage3Speaking(e.target.value)}
                className="border rounded-2xl p-5 text-xl"
              >
                <option value="">Speaking Ability</option>
                <option>Native</option>
                <option>Fluent</option>
                <option>Intermediate</option>
                <option>Basic</option>
              </select>

              <select
                value={language3Writing}
                onChange={(e) => setLanguage3Writing(e.target.value)}
                className="border rounded-2xl p-5 text-xl"
              >
                <option value="">Writing Ability</option>
                <option>Native</option>
                <option>Fluent</option>
                <option>Intermediate</option>
                <option>Basic</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Industry Expertise"
              value={industryExpertise}
              onChange={(e) => setIndustryExpertise(e.target.value)}
              className="w-full border rounded-2xl p-5 text-xl"
            />

            <textarea
              rows={5}
              placeholder="Describe your coaching or business experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
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
              placeholder="Availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
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
              placeholder="Why do you want to become an EPEW coach?"
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
              {loading ? "Submitting..." : "Submit Coach Application"}
            </button>
          </form>
        </div>
      </main>

      <footer className="bg-[#04163d] text-white py-20">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-4 gap-14">
          <div>
            <h3 className="text-3xl font-bold mb-8">Contact Us</h3>
            <p className="text-xl text-gray-300 leading-relaxed">
              EPEW – Ekero Partners Empower Wealth
            </p>
            <p className="text-xl text-gray-300 mt-4">Phone: (866) 720-0014</p>
            <p className="text-xl text-gray-300 mt-4">Email: support@epew.us</p>
            <p className="text-xl text-gray-300 mt-4">United States</p>
          </div>

          <div>
            <h3 className="text-3xl font-bold mb-8">Quick Links</h3>
            <div className="flex flex-col gap-5 text-xl">
              <a href="/" className="text-gray-300 hover:text-green-400 transition">Home</a>
              <a href="/about" className="text-gray-300 hover:text-green-400 transition">About</a>
              <a href="/entrepreneurs" className="text-gray-300 hover:text-green-400 transition">Entrepreneurs</a>
              <a href="/supporters" className="text-gray-300 hover:text-green-400 transition">Supporters</a>
              <a href="/coaches" className="text-gray-300 hover:text-green-400 transition">Coaches</a>
              <a href="/partners" className="text-gray-300 hover:text-green-400 transition">Partners</a>
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-bold mb-8">Follow Us</h3>
            <div className="flex flex-col gap-5 text-xl">
              <a href="https://facebook.com" target="_blank" className="text-gray-300 hover:text-green-400 transition">Facebook</a>
              <a href="https://instagram.com" target="_blank" className="text-gray-300 hover:text-green-400 transition">Instagram</a>
              <a href="https://youtube.com" target="_blank" className="text-gray-300 hover:text-green-400 transition">YouTube</a>
              <a href="https://linkedin.com" target="_blank" className="text-gray-300 hover:text-green-400 transition">LinkedIn</a>
              <a href="https://tiktok.com" target="_blank" className="text-gray-300 hover:text-green-400 transition">TikTok</a>
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-bold mb-8">Legal</h3>
            <div className="flex flex-col gap-5 text-xl">
              <a href="#" className="text-gray-300 hover:text-green-400 transition">Privacy Policy</a>
              <a href="#" className="text-gray-300 hover:text-green-400 transition">Terms of Use</a>
              <a href="#" className="text-gray-300 hover:text-green-400 transition">Disclaimer</a>
              <a href="#" className="text-gray-300 hover:text-green-400 transition">Supporter Agreement</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-16 pt-10 text-center">
          <p className="text-xl text-gray-400">
            © 2026 EPEW – Ekero Partners Empower Wealth. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}