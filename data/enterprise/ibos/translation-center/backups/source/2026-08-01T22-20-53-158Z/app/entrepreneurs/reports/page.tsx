"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EntrepreneurReportsPage() {
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsPage();
  }, []);

  async function loadReportsPage() {
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
          Loading reports...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h1 className="text-6xl font-extrabold mb-5">
            Quarterly Reports
          </h1>
          <p className="text-2xl text-gray-700">
            After funding and launch, you will submit business progress reports
            here to maintain your standing within the EPEW ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Info title="Business Name" value={application?.business_name} />
          <Info title="Funding Status" value={application?.status || "Pending"} />
          <Info title="Grade Status" value={application?.grade_status || "Not Started"} />
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-6">
            Report Center
          </h2>

          <div className="bg-gray-100 border rounded-3xl p-10 text-center">
            <p className="text-3xl font-bold text-[#06245c]">
              No reports available yet.
            </p>
            <p className="text-2xl text-gray-600 mt-4">
              Quarterly reports begin after your business receives funding and
              officially launches.
            </p>
          </div>
        </div>

        <div className="bg-[#06245c] text-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-6">
            Future Report Requirements
          </h2>

          <ul className="space-y-4 text-2xl text-gray-200">
            <li>✅ Business revenue progress</li>
            <li>✅ Expenses and use of funds</li>
            <li>✅ Jobs created or maintained</li>
            <li>✅ Photos, videos, or proof of activity</li>
            <li>✅ Challenges and improvement plans</li>
            <li>✅ Coach or admin review</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function Info({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
      <p className="text-xl text-gray-500 font-bold">{title}</p>
      <p className="text-3xl font-extrabold text-green-700 mt-3">
        {value || "Pending"}
      </p>
    </div>
  );
}