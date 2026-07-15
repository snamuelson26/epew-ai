"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AssignedCoachPage() {
  const [loading, setLoading] = useState(true);
  const [entrepreneur, setEntrepreneur] = useState<any>(null);
  const [coach, setCoach] = useState<any>(null);

  useEffect(() => {
    loadAssignedCoach();
  }, []);

  async function loadAssignedCoach() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: entrepreneurData } = await supabase
      .from("entrepreneurs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setEntrepreneur(entrepreneurData);

    if (entrepreneurData?.coach_id) {
      const { data: coachData } = await supabase
        .from("coaches")
        .select("*")
        .eq("id", entrepreneurData.coach_id)
        .single();

      setCoach(coachData);
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="p-6">Loading assigned coach...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-700">
          Assigned Coach
        </h1>
        <p className="text-gray-600 mt-2">
          Your coach will guide you through the preparation, interview,
          questionnaire, and funding readiness process.
        </p>
      </div>

      {!coach ? (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-yellow-800">
            Coach Not Assigned Yet
          </h2>
          <p className="text-yellow-700 mt-2">
            Your application has been received. A coach will be assigned within
            24 hours.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-6 border space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Coach Information
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Info label="Coach Name" value={coach.full_name} />
            <Info label="Coach ID" value={coach.coach_id || coach.id} />
            <Info label="Email" value={coach.email} />
            <Info label="Phone" value={coach.phone || "Not provided"} />
            <Info label="Status" value={coach.status || "Active"} />
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">
              Notes from Coach
            </h3>
            <div className="bg-gray-50 border rounded-lg p-4 text-gray-700 min-h-[120px]">
              {entrepreneur?.coach_notes ||
                "No coach notes have been added yet."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800 mt-1">{value || "Pending"}</p>
    </div>
  );
}