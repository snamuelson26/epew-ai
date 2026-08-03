"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EntrepreneurBusinessProfilePage() {
  const router = useRouter();

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  async function loadBusinessProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("Current user ID:", user?.id);
console.log("Current user email:", user?.email);

    if (!user) {
      router.push("/entrepreneurs/login");
      return;
    }

  const { data, error } = await supabase
  .from("entrepreneur_applications")
  .select("*")
  .ilike("email", `%${user.email}%`);

      console.log("Application data:", data);
console.log("Application error:", error);

    if (error) {
      console.log("Business Profile error:", error);
      setLoading(false);
      return;
    }

    if (!data) {
      console.log("No entrepreneur application found for user:", user.id);
      setLoading(false);
      return;
    }

   setApplication(data?.[0] || null);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">
          Loading business profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
          <h1 className="text-6xl font-extrabold mb-5">
            Business Profile
          </h1>

          <p className="text-2xl text-gray-700">
            Review the business information connected to your EPEW entrepreneur
            account.
          </p>
        </div>

        {/* BUSINESS INFORMATION */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
          <h2 className="text-4xl font-bold mb-8">
            Business Information
          </h2>

          <div className="grid md:grid-cols-2 gap-6 text-2xl text-gray-700">
            <p>
              <strong>Business Name:</strong>{" "}
              {application?.business_name || "Not Available"}
            </p>

            <p>
              <strong>Business Type:</strong>{" "}
              {application?.business_type || "Not Available"}
            </p>

            <p>
              <strong>Entrepreneur:</strong>{" "}
              {application?.full_name || "Not Available"}
            </p>

            <p>
              <strong>Entrepreneur ID:</strong>{" "}
              {application?.entrepreneur_id || "Pending"}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {application?.email || "Not Available"}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {application?.phone || "Not Available"}
            </p>

            <p>
              <strong>City:</strong>{" "}
              {application?.city || "Not Available"}
            </p>

            <p>
              <strong>State:</strong>{" "}
              {application?.state || "Not Available"}
            </p>

            <p>
              <strong>Country:</strong>{" "}
              {application?.address_country || "Not Available"}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {application?.status || "Pending Review"}
            </p>
          </div>
        </div>

        {/* BUSINESS DESCRIPTION */}
        <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
          <h2 className="text-4xl font-bold mb-6">
            Business Description
          </h2>

          <p className="text-2xl text-gray-700 leading-relaxed">
            {application?.business_description ||
              "No business description submitted yet."}
          </p>
        </div>

        {/* ORGANIZATION AFFILIATION */}
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-6">
            Organization Affiliation
          </h2>

          <div className="space-y-4 text-2xl text-gray-700">
            <p>
              <strong>Affiliated with an organization:</strong>{" "}
              {application?.organization_affiliation || "Not Answered"}
            </p>

            <p>
              <strong>Organization Name / Type:</strong>{" "}
              {application?.organization_name || "Not Provided"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}