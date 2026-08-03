"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const countries = [
  "United States",
  "Haiti",
  "Canada",
  "Dominican Republic",
  "France",
  "Mexico",
  "Brazil",
  "Colombia",
  "Jamaica",
  "Bahamas",
  "United Kingdom",
  "Germany",
  "Spain",
  "Philippines",
  "Italy",
  "Nigeria",
  "Ghana",
  "South Africa",
  "Other",
];

export default function SupporterSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [supporter, setSupporter] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryOfCitizenship, setCountryOfCitizenship] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zipCode, setZipCode] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/supporters/login";
      return;
    }

    const { data } = await supabase
      .from("supporters")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data) {
      window.location.href = "/supporters/login";
      return;
    }

    setSupporter(data);
    setFullName(data.full_name || "");
    setPhone(data.phone || "");
    setCountryOfCitizenship(data.country_of_citizenship || "");
    setDateOfBirth(data.date_of_birth || "");
    setPlaceOfBirth(data.place_of_birth || "");
    setCountry(data.country || "");
    setStreetAddress(data.street_address || "");
    setCity(data.city || "");
    setStateName(data.state || "");
    setZipCode(data.zip_code || "");
    setLoading(false);
  }

  async function saveProfile() {
    if (!supporter) {
      alert("Supporter profile not found.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("supporters")
      .update({
        full_name: fullName,
        phone,
        country_of_citizenship: countryOfCitizenship,
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth,
        country,
        address_country: country,
        street_address: streetAddress,
        city,
        state: stateName,
        zip_code: zipCode,
      })
      .eq("id", supporter.id);

    setSaving(false);

    if (error) {
      alert("Unable to update profile.\n\n" + error.message);
      return;
    }

    alert("Profile updated successfully.");
    window.location.reload();
  }

  async function handlePasswordReset() {
    if (!supporter?.email) {
      alert("Email not found.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      supporter.email,
      {
        redirectTo: "http://localhost:3000/supporters/update-password",
      }
    );

    if (error) {
      alert("Unable to send password reset email.\n\n" + error.message);
      return;
    }

    alert("Password reset email sent.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <p className="text-2xl font-bold">Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">Settings</h1>

        <p className="text-xl text-gray-700">
          Manage your supporter profile, contact information, and account
          preferences.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8">
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-3xl font-bold mb-6">Profile Information</h2>

          <div className="grid md:grid-cols-2 gap-5">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="border rounded-2xl p-4 text-lg"
            />

            <input
              value={supporter?.email || ""}
              disabled
              className="border rounded-2xl p-4 text-lg bg-gray-100"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="border rounded-2xl p-4 text-lg"
            />

            <select
              value={countryOfCitizenship}
              onChange={(e) => setCountryOfCitizenship(e.target.value)}
              className="border rounded-2xl p-4 text-lg"
            >
              <option value="">Country of Citizenship</option>
              {countries.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="border rounded-2xl p-4 text-lg"
            />

            <input
              value={placeOfBirth}
              onChange={(e) => setPlaceOfBirth(e.target.value)}
              placeholder="Place of Birth"
              className="border rounded-2xl p-4 text-lg"
            />

            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="border rounded-2xl p-4 text-lg"
            >
              <option value="">Country</option>
              {countries.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <input
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Street Address"
              className="border rounded-2xl p-4 text-lg"
            />

            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="border rounded-2xl p-4 text-lg"
            />

            <input
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              placeholder="State / Province"
              className="border rounded-2xl p-4 text-lg"
            />

            <input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Zip Code"
              className="border rounded-2xl p-4 text-lg"
            />
          </div>

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="mt-8 bg-green-700 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] transition"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <h2 className="text-3xl font-bold mb-6">Account Details</h2>

            <div className="space-y-4 text-lg">
              <p>
                <strong>Supporter ID:</strong>{" "}
                {supporter?.supporter_id || "Not Assigned"}
              </p>

              <p>
                <strong>Status:</strong> {supporter?.status || "active"}
              </p>

              <p>
                <strong>Email:</strong> {supporter?.email}
              </p>

              <p>
                <strong>Member Since:</strong>{" "}
                {supporter?.created_at
                  ? new Date(supporter.created_at).toLocaleDateString()
                  : "Not Available"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-10">
            <h2 className="text-3xl font-bold mb-6">Password</h2>

            <p className="text-lg text-gray-700 mb-6">
              Send a password reset link to your registered email address.
            </p>

            <button
              type="button"
              onClick={handlePasswordReset}
              className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold"
            >
              Send Password Reset Email
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}