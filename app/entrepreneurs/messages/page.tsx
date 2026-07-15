"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EntrepreneurMessagesPage() {
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessagesPage();
  }, []);

  async function loadMessagesPage() {
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
          Loading messages...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h1 className="text-6xl font-extrabold mb-5">Messages</h1>
          <p className="text-2xl text-gray-700">
            This page will help you communicate with your assigned coach during
            your preparation and interview process.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-8">Assigned Coach</h2>

          <div className="grid md:grid-cols-2 gap-6 text-2xl text-gray-700">
            <p>
              <strong>Coach Name:</strong>{" "}
              {application?.coach_name || "Not assigned yet"}
            </p>
            <p>
              <strong>Coach Email:</strong>{" "}
              {application?.coach_email || "Pending"}
            </p>
            <p>
              <strong>Coach Phone:</strong>{" "}
              {application?.coach_phone || "Pending"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {application?.status || "Pending Review"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-6">Message Center</h2>

          <div className="bg-gray-100 border rounded-3xl p-10 text-center">
            <p className="text-3xl font-bold text-[#06245c]">
              No messages yet.
            </p>
            <p className="text-2xl text-gray-600 mt-4">
              Your assigned coach will contact you within 24 hours after
              reviewing your questionnaire.
            </p>
          </div>
        </div>

        <div className="bg-[#06245c] text-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-6">What Happens Next?</h2>

          <ul className="space-y-4 text-2xl text-gray-200">
            <li>✅ Your coach reviews your questionnaire.</li>
            <li>✅ Your coach introduces himself or herself within 24 hours.</li>
            <li>✅ Your interview date and time will be scheduled.</li>
            <li>✅ You begin the entrepreneur preparation and vetting process.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}