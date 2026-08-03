"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const statusSteps = [
  "Application Submitted",
  "Assigned",
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

function getProgress(status: string) {
  const index = statusSteps.indexOf(status);
  if (index === -1) return 0;
  return Math.round(((index + 1) / statusSteps.length) * 100);
}

export default function CoachEntrepreneursPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setApplications(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">
          Loading entrepreneurs...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h1 className="text-6xl font-extrabold mb-5">
            Assigned Entrepreneurs
          </h1>

          <p className="text-2xl text-gray-700">
            Review entrepreneur applications, business information, funding
            progress, questionnaire status, and coaching readiness.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <Card title="Total Entrepreneurs" value={applications.length} />
          <Card
            title="Pending Review"
            value={
              applications.filter(
                (app) => !app.status || app.status === "Pending Review"
              ).length
            }
          />
          <Card
            title="Questionnaires"
            value={
              applications.filter(
                (app) => app.questionnaire_status === "Completed"
              ).length
            }
          />
          <Card
            title="Funding Queue"
            value={
              applications.filter((app) => app.status === "Funding Queue")
                .length
            }
          />
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Entrepreneur List
          </h2>

          {applications.length === 0 ? (
            <p className="text-2xl text-gray-600">
              No entrepreneur applications found.
            </p>
          ) : (
            <div className="space-y-6">
              {applications.map((app) => {
                const progress = getProgress(app.status || "");

                return (
                  <div
                    key={app.id}
                    className="bg-[#f5f7fb] border rounded-3xl p-6 shadow"
                  >
                    <div className="grid lg:grid-cols-4 gap-6 items-center">
                      <div>
                        <h3 className="text-3xl font-bold">
                          {app.full_name || "Unnamed Entrepreneur"}
                        </h3>
                        <p className="text-xl text-gray-700 mt-2">
                          {app.business_name || "No business name"}
                        </p>
                        <p className="text-lg text-gray-500 mt-1">
                          {app.email || "No email"}
                        </p>
                        <p className="text-lg text-red-600 font-bold mt-1">
                        Application ID: {String(app.id)}
                        </p>
                      </div>

                      <div>
                        <p className="text-lg text-gray-500 font-bold">
                          Funding Goal
                        </p>
                        <p className="text-2xl font-extrabold text-green-700">
                          {app.funding_request
                            ? `$${Number(app.funding_request).toLocaleString()}`
                            : "Pending"}
                        </p>
                      </div>

                      <div>
                        <p className="text-lg text-gray-500 font-bold">
                          Status
                        </p>
                        <span className="inline-block mt-2 px-4 py-2 rounded-xl bg-yellow-100 text-yellow-700 font-bold">
                          {app.status || "Pending Review"}
                        </span>

                        <div className="mt-4">
                          <div className="flex justify-between text-sm font-bold">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                            <div
                              className="bg-green-600 h-4 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-lg text-gray-600">
                          <strong>Coach:</strong>{" "}
                          {app.assigned_coach_name ||
                            app.coach_name ||
                            "Not Assigned"}
                        </p>

                        <p className="text-lg text-red-600 font-bold">
  Application ID: {app.id ? String(app.id) : "NO ID FOUND"}
</p>

<Link
  href={`/coaches/entrepreneurs/${String(app.id)}`}
  className="block text-center bg-[#06245c] text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-green-600 transition"
>
  View File
</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
      <p className="text-5xl font-extrabold text-green-700">{value}</p>
      <p className="text-xl font-bold text-gray-700 mt-3">{title}</p>
    </div>
  );
}