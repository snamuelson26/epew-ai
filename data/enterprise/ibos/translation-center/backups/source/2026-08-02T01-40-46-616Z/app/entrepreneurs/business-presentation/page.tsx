"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function BusinessPresentationPage() {
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresentation();
  }, []);

  async function loadPresentation() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/entrepreneurs/login");
      return;
    }

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setApplication(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">
          Loading business presentation...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h1 className="text-6xl font-extrabold mb-5">
            Business Presentation
          </h1>
          <p className="text-2xl text-gray-700">
            This page presents your business profile, funding request, video,
            and presentation readiness for the EPEW review process.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Info title="Business Name" value={application?.business_name} />
          <Info title="Category" value={application?.business_type || application?.category} />
          <Info
            title="Funding Goal"
            value={
              application?.funding_request
                ? `$${Number(application.funding_request).toLocaleString()}`
                : "Pending"
            }
          />
          <Info title="Presentation Status" value={application?.presentation_status || "In Preparation"} />
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-6">Business Description</h2>
          <p className="text-2xl text-gray-700 leading-relaxed">
            {application?.business_description || "No business description available yet."}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-6">Business Video</h2>

          {application?.video_url ? (
            <video controls className="w-full rounded-3xl shadow-lg">
              <source src={application.video_url} />
            </video>
          ) : (
            <div className="bg-gray-100 border rounded-3xl p-10 text-center">
              <p className="text-2xl text-gray-700">
                No business video uploaded yet.
              </p>
              <p className="text-xl text-gray-500 mt-3">
                Future feature: entrepreneurs will upload their pitch video here.
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#06245c] text-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-6">Coach Review</h2>
          <p className="text-2xl text-gray-200">
            <strong>Readiness Score:</strong>{" "}
            {application?.readiness_score ? `${application.readiness_score}%` : "Pending"}
          </p>
          <p className="text-2xl text-gray-200 mt-4">
            <strong>Coach Notes:</strong>{" "}
            {application?.coach_notes || "No coach review added yet."}
          </p>
        </div>
      </div>
    </main>
  );
}

function Info({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <p className="text-xl text-gray-500 font-bold">{title}</p>
      <p className="text-3xl font-extrabold text-green-700 mt-3">
        {value || "Pending"}
      </p>
    </div>
  );
}