"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const LAUNCH_DATE = new Date("2026-07-29T00:00:00-04:00");

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

const alreadyRegisteredMessage =
  "You are already registered as a supporter. Please sign in to your supporter account.";

export default function SupporterRegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <p className="text-xl font-bold text-[#06245c]">
              Loading supporter registration...
            </p>
          </div>
        </main>
      }
    >
      <SupporterRegistrationGate />
    </Suspense>
  );
}

function SupporterRegistrationGate() {
  const launchOpen = new Date() >= LAUNCH_DATE;

  if (!launchOpen) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6">
        <div className="max-w-3xl rounded-3xl bg-white p-12 text-center shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
            EPEW Public Preview
          </p>

          <h1 className="mt-4 text-4xl font-black text-[#06245c] md:text-5xl">
            Supporter Registration Opens July 29, 2026
          </h1>

          <p className="mt-6 text-xl leading-relaxed text-slate-700">
            Thank you for your interest in becoming an EPEW Founding Supporter.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            The platform is currently available for public preview. Supporter
            registration is not open yet.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/supporters"
              className="rounded-xl bg-green-700 px-8 py-4 text-xl font-bold text-white transition hover:bg-[#06245c]"
            >
              Explore the Supporter Program
            </Link>

            <Link
              href="/"
              className="rounded-xl border-2 border-[#06245c] px-8 py-4 text-xl font-bold text-[#06245c] transition hover:bg-[#06245c] hover:text-white"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <SupporterRegisterContent />;
}

function SupporterRegisterContent() {
  const searchParams = useSearchParams();
  const selectedBusinessId = searchParams.get("business_id") || "";
  const campaign = searchParams.get("campaign") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [originState, setOriginState] = useState("");
  const [originCommunity, setOriginCommunity] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function generateSupporterId() {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return `SUP-${year}-${randomNumber}`;
  }

  async function uploadPhoto(file: File) {
    setUploading(true);

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const fileName = `supporter-${Date.now()}-${safeFileName}`;

    const { error } = await supabase.storage
      .from("supporter-photos")
      .upload(fileName, file);

    setUploading(false);

    if (error) {
      alert("Photo upload failed: " + error.message);
      return;
    }

    const { data } = supabase.storage
      .from("supporter-photos")
      .getPublicUrl(fileName);

    setPhotoUrl(data.publicUrl);
    alert("Photo uploaded successfully.");
  }

  async function registerSupporter() {
    if (new Date() < LAUNCH_DATE) {
      alert("Supporter registration opens July 29, 2026.");
      return;
    }

    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!fullName.trim()) return alert("Please enter your full name.");
    if (!cleanEmail) return alert("Please enter your email address.");
    if (!phone.trim()) return alert("Please enter your phone number.");
    if (!password) return alert("Please create a password.");
    if (!confirmPassword) return alert("Please confirm your password.");
    if (!countryOfOrigin) return alert("Please select your country of origin.");
    if (!originCommunity.trim())
      return alert("Please enter your community or city of origin.");
    if (!dateOfBirth) return alert("Please enter your date of birth.");
    if (!addressCountry)
      return alert("Please select your country of residence.");
    if (!streetAddress.trim()) return alert("Please enter your street address.");
    if (!city.trim()) return alert("Please enter your city.");
    if (!state.trim()) return alert("Please enter your state or province.");
    if (!zipCode.trim()) return alert("Please enter your ZIP or postal code.");
    if (password !== confirmPassword) return alert("Passwords do not match.");
    if (password.length < 6)
      return alert("Password must be at least 6 characters.");

    setSubmitting(true);

    const { data: existingSupporter, error: existingSupporterError } =
      await supabase
        .from("supporters")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

    if (existingSupporterError) {
      console.error(existingSupporterError);
      setSubmitting(false);
      alert("Unable to check supporter registration.");
      return;
    }

    if (existingSupporter) {
      setSubmitting(false);
      setMessage(alreadyRegisteredMessage);
      return;
    }

    const supporterId = generateSupporterId();
    let userId = "";

    const { data: existingAuth } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (existingAuth?.user) {
      userId = existingAuth.user.id;
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (authError || !authData.user) {
        setSubmitting(false);
        alert(
          "Unable to create or access supporter login.\n\n" +
            (authError?.message || ""),
        );
        return;
      }

      userId = authData.user.id;
    }

    const { error: insertError } = await supabase.from("supporters").insert([
      {
        user_id: userId,
        supporter_id: supporterId,
        full_name: fullName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        country_of_origin: countryOfOrigin,
        origin_state: originState.trim(),
        origin_community: originCommunity.trim(),
        date_of_birth: dateOfBirth,
        country: addressCountry,
        address_country: addressCountry,
        country_of_residence: addressCountry,
        street_address: streetAddress.trim(),
        city: city.trim(),
        residence_city: city.trim(),
        state: state.trim(),
        residence_state: state.trim(),
        zip_code: zipCode.trim(),
        postal_code: zipCode.trim(),
        selected_business_id: selectedBusinessId || null,
        campaign_source: campaign || null,
        photo_url: photoUrl || "",
        status: "active",
      },
    ]);

    if (insertError) {
      console.error(insertError);
      setSubmitting(false);

      if (
        insertError.message.includes("supporters_email_key") ||
        insertError.message.toLowerCase().includes("duplicate")
      ) {
        setMessage(alreadyRegisteredMessage);
        return;
      }

      alert("Unable to register supporter.\n\n" + insertError.message);
      return;
    }

    const { error: roleError } = await supabase.from("user_roles").insert([
      {
        user_id: userId,
        email: cleanEmail,
        role: "supporter",
      },
    ]);

    setSubmitting(false);

    if (roleError) console.error(roleError);

    alert(
      "Supporter registered successfully. Please check your email if confirmation is required, then sign in to continue.",
    );

    if (selectedBusinessId) {
      window.location.href =
        `/support/${selectedBusinessId}/participation-agreement`;
    } else {
      window.location.href = "/supporters/login";
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="mb-8 rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="mb-3 text-5xl font-extrabold">
          Become an EPEW Supporter
        </h1>
        <p className="text-xl text-gray-700">
          Register as a supporter and begin participating in the EPEW
          Entrepreneur Development Ecosystem.
        </p>
      </div>

      <div className="max-w-5xl rounded-3xl bg-white p-10 shadow-xl">
        <h2 className="mb-6 text-3xl font-bold">Supporter Registration</h2>

        {selectedBusinessId && (
          <div className="mb-6 rounded-2xl border-l-8 border-green-600 bg-green-50 p-6">
            <p className="text-xl font-bold">Selected Business</p>
            <p className="mt-2 text-2xl font-extrabold">
              Business ID: {selectedBusinessId}
            </p>
            <p className="mt-2 text-lg text-gray-700">
              Your supporter account will be connected to this entrepreneur
              support journey.
            </p>
          </div>
        )}

        {campaign && (
          <div className="mb-6 rounded-2xl border-l-8 border-blue-600 bg-blue-50 p-6">
            <p className="text-xl font-bold">Campaign Connection Preserved</p>
            <p className="mt-2 text-lg text-gray-700">
              Campaign source: {campaign}
            </p>
          </div>
        )}

        <div className="mb-8 rounded-2xl bg-[#f5f7fb] p-6">
          <h3 className="mb-5 text-2xl font-extrabold">Personal Information</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="rounded-xl border p-4" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="rounded-xl border p-4" />
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="rounded-xl border p-4" />
            <div>
              <label className="mb-2 block font-semibold">Date of Birth</label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full rounded-xl border p-4" />
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl bg-green-50 p-6">
          <h3 className="mb-3 text-2xl font-extrabold">Origin Information</h3>
          <p className="mb-5 text-lg text-gray-700">
            Your origin helps EPEW measure the communities represented
            throughout the Entrepreneur Development Ecosystem.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            <select value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} className="rounded-xl border p-4">
              <option value="">Country of Origin</option>
              {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
            <input type="text" value={originState} onChange={(e) => setOriginState(e.target.value)} placeholder="State / Province / Department of Origin" className="rounded-xl border p-4" />
            <input type="text" value={originCommunity} onChange={(e) => setOriginCommunity(e.target.value)} placeholder="Community / City of Origin" className="rounded-xl border p-4" />
          </div>
        </div>

        <div className="mb-8 rounded-2xl bg-[#f5f7fb] p-6">
          <h3 className="mb-5 text-2xl font-extrabold">Current Residence</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <select value={addressCountry} onChange={(e) => setAddressCountry(e.target.value)} className="rounded-xl border p-4">
              <option value="">Country of Residence</option>
              {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
            <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Street Address" className="rounded-xl border p-4" />
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-xl border p-4" />
            <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State / Province" className="rounded-xl border p-4" />
            <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="ZIP / Postal Code" className="rounded-xl border p-4" />
          </div>
        </div>

        <div className="mb-8 rounded-2xl bg-[#f5f7fb] p-6">
          <h3 className="mb-5 text-2xl font-extrabold">Account Security</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create Password" className="rounded-xl border p-4" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="rounded-xl border p-4" />
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-gray-50 p-6">
          <p className="mb-2 font-bold">Upload Profile Self Photo</p>
          <p className="mb-3 text-sm text-red-600">
            Optional for testing. Please upload a clear photo of yourself only.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadPhoto(file);
            }}
          />
          {uploading && <p className="mt-3 font-bold text-blue-600">Uploading photo...</p>}
          {photoUrl && (
            <div className="mt-5">
              <p className="mb-2 font-bold">Preview</p>
              <img src={photoUrl} alt="Supporter" className="h-40 w-40 rounded-2xl border object-cover" />
            </div>
          )}
        </div>

        <div className="mb-6 rounded-2xl border-l-8 border-green-600 bg-green-50 p-6">
          <p className="text-xl font-bold">Participation Benefit Notice</p>
          <p className="mt-2 text-lg">
            Eligible supporters may qualify for participation benefits of up to
            6% annually based on program performance, participation level, and
            EPEW policies. Benefits are not guaranteed.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border-2 border-red-500 bg-red-100 p-4 text-center text-xl font-bold text-red-700">
            {message}
          </div>
        )}

        {message === alreadyRegisteredMessage && (
          <div className="mb-6 text-center">
            <Link href="/supporters/login" className="text-lg font-bold text-blue-700 underline">
              Sign in to your supporter account
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={() => void registerSupporter()}
          disabled={submitting}
          className="rounded-2xl bg-green-700 px-8 py-4 text-xl font-bold text-white transition hover:bg-[#06245c] disabled:opacity-60"
        >
          {submitting ? "Registering..." : "Register Supporter"}
        </button>
      </div>
    </main>
  );
}