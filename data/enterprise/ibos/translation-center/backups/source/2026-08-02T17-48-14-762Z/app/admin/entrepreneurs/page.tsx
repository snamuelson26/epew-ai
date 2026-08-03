"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminEntrepreneursPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      alert("Unable to load entrepreneurs: " + error.message);
      setLoading(false);
      return;
    }

    setApplications(data || []);
    setLoading(false);
  }

  function getInitials(name: string) {
    if (!name) return "E";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getPhase(app: any) {
    return (
      app.status ||
      app.current_phase ||
      app.pipeline_status ||
      "Application Submitted"
    );
  }

  function getPhaseColor(status: string) {
    const value = status.toLowerCase();

    if (
      value.includes("approved") ||
      value.includes("opened") ||
      value.includes("active") ||
      value.includes("complete")
    ) {
      return "bg-green-50 border-green-600 text-green-700";
    }

    if (
      value.includes("annual") ||
      value.includes("meeting") ||
      value.includes("invited")
    ) {
      return "bg-yellow-50 border-yellow-500 text-yellow-700";
    }

    return "bg-blue-50 border-[#06245c] text-[#06245c]";
  }

  async function moveToNextPhase(app: any) {
    const phases = [
      "Application Submitted",
      "Interview Scheduled",
      "Approved",
      "Questionnaire Completed",
      "Funding Queue",
      "Annual Meeting Qualified",
      "Annual Meeting Attended",
      "Funding Readiness Review",
      "Funding Committee Approved",
      "Funding Approved",
      "Business Opened",
      "Quarterly Reporting",
    ];

    const currentStatus = app.status || "Application Submitted";
    const currentIndex = phases.indexOf(currentStatus);
    const nextStatus =
      currentIndex >= 0 && currentIndex < phases.length - 1
        ? phases[currentIndex + 1]
        : currentStatus;

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({ status: nextStatus })
      .eq("id", app.id);

    if (error) {
      console.log(error);
      alert("Unable to move entrepreneur to next phase.");
      return;
    }

    loadApplications();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.log(error);
      alert("Unable to update status.");
      return;
    }

    loadApplications();
  }

  const appliedCount = applications.length;
  const qualifiedCount = applications.filter((app) =>
    String(app.status || "").toLowerCase().includes("approved")
  ).length;
  const annualMeetingCount = applications.filter((app) =>
    String(app.status || "").toLowerCase().includes("annual")
  ).length;
  const disbursementCount = applications.filter((app) =>
    String(app.status || "").toLowerCase().includes("funding")
  ).length;
  const fundingQueueCount = applications.filter((app) =>
    String(app.status || "").toLowerCase().includes("queue")
  ).length;
  const activeBusinessCount = applications.filter((app) =>
    String(app.status || "").toLowerCase().includes("business opened")
  ).length;

  return (
    <main className="bg-[#f5f7fb] min-h-screen p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-2xl p-12 mb-10">
        <h1 className="text-6xl font-extrabold mb-5">
          Entrepreneur Pipeline Manager
        </h1>

        <p className="text-2xl text-gray-700 leading-relaxed">
          Track entrepreneurs from application to meetings, annual event,
          partner coordination, funding queue, disbursement review, and business
          launch.
        </p>
      </div>

      <div className="grid md:grid-cols-6 gap-6 mb-10">
        {[
          [appliedCount, "Applied"],
          [qualifiedCount, "Qualified"],
          [annualMeetingCount, "Annual Meeting"],
          [disbursementCount, "Disbursement Review"],
          [fundingQueueCount, "Funding Queue"],
          [activeBusinessCount, "Active Business"],
        ].map(([number, label]) => (
          <div
            key={label}
            className="bg-white rounded-3xl p-6 shadow-xl text-center"
          >
            <p className="text-5xl font-bold text-green-700 mb-3">
              {number}
            </p>
            <p className="text-xl text-gray-700 font-bold">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
        <h2 className="text-5xl font-bold mb-8">
          EPEW Entrepreneur Journey Status
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            "Applied",
            "Interview 1 Completed",
            "Business Idea Development",
            "Annual Meeting Invited",
            "Annual Meeting Attended",
            "Coach Funding Meeting",
            "ORGDH Representative Assigned",
            "Kleernest Representative Assigned",
            "Disbursement Planning",
            "Funding Queue",
            "Approved for Disbursement",
            "Business Operating",
          ].map((phase, index) => (
            <div key={phase} className="bg-[#f5f7fb] rounded-2xl p-6 shadow">
              <p className="text-2xl font-bold text-[#06245c]">
                {index + 1}. {phase}
              </p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <p className="text-2xl font-bold">Loading entrepreneurs...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <p className="text-2xl font-bold">No entrepreneurs submitted yet.</p>
        </div>
      ) : (
        <div className="grid gap-10">
          {applications.map((app) => {
            const phase = getPhase(app);
            const phaseColor = getPhaseColor(phase);

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl shadow-2xl p-10 grid lg:grid-cols-4 gap-10"
              >
                <div>
                  <div className="w-32 h-32 rounded-full bg-[#06245c] text-white flex items-center justify-center text-5xl font-extrabold mb-6">
                    {getInitials(app.full_name)}
                  </div>

                  <h2 className="text-4xl font-extrabold mb-3">
                    {app.full_name || "Unnamed Entrepreneur"}
                  </h2>

                  <p className="text-2xl text-gray-700 mb-3">
                    {app.business_name || "Business name pending"}
                  </p>

                  <p className="text-xl text-gray-600">
                    Entrepreneur ID: {app.entrepreneur_id || "Pending"}
                  </p>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-3xl font-bold mb-5">
                    Current Pipeline Status
                  </h3>

                  <div
                    className={`border-l-8 rounded-2xl p-6 mb-6 ${phaseColor}`}
                  >
                    <p className="text-2xl font-bold">
                      Current Phase: {phase}
                    </p>
                    <p className="text-xl text-gray-700 mt-2">
                      {app.coach_notes ||
                        app.admin_notes ||
                        "Entrepreneur record is active in the EPEW pipeline."}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5 text-xl text-gray-700">
                    <p>
                      <strong>Email:</strong> {app.email || "Not provided"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {app.phone || "Not provided"}
                    </p>
                    <p>
                      <strong>Coach:</strong>{" "}
                      {app.coach_name ||
                        app.assigned_coach_name ||
                        "Not assigned"}
                    </p>
                    <p>
                      <strong>Annual Meeting:</strong>{" "}
                      {app.annual_meeting_status || "Not scheduled"}
                    </p>
                    <p>
                      <strong>ORGDH Rep:</strong>{" "}
                      {app.orgdh_rep || "Not assigned"}
                    </p>
                    <p>
                      <strong>Kleernest Rep:</strong>{" "}
                      {app.kleernest_rep || "Not assigned"}
                    </p>
                    <p>
                      <strong>Requested Funding:</strong>{" "}
                      {app.requested_funding
                        ? `$${app.requested_funding}`
                        : "Not provided"}
                    </p>
                    <p>
                      <strong>Disbursement Status:</strong>{" "}
                      {app.disbursement_status || "Not started"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-3xl font-bold mb-5">Admin Actions</h3>

                  <div className="grid gap-4">
                    <a
                      href={`/admin/entrepreneurs/${app.id}`}
                      className="bg-[#06245c] text-white text-center py-4 rounded-2xl text-xl font-bold hover:bg-green-600 transition"
                    >
                      Open File
                    </a>

                    <button
                      onClick={() => moveToNextPhase(app)}
                      className="bg-green-600 text-white py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] transition"
                    >
                      Move to Next Phase
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(app.id, "ORGDH Representative Assigned")
                      }
                      className="border-2 border-[#06245c] text-[#06245c] py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] hover:text-white transition"
                    >
                      Assign ORGDH Rep
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(app.id, "Kleernest Representative Assigned")
                      }
                      className="border-2 border-[#06245c] text-[#06245c] py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] hover:text-white transition"
                    >
                      Assign Kleernest Rep
                    </button>

                    <a
                      href="/admin/disbursements"
                      className="border-2 border-green-600 text-green-700 text-center py-4 rounded-2xl text-xl font-bold hover:bg-green-600 hover:text-white transition"
                    >
                      Review Disbursement
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}