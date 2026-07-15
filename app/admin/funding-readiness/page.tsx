"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminFundingReadinessPage() {
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
      setApplications([]);
      setLoading(false);
      return;
    }

    setApplications(data || []);
    setLoading(false);
  }

  async function updateApplication(id: number, updates: any) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadApplications();
  }

  async function approveForFundingQueue(id: number) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        status: "Funding Queue",
      })
      .eq("id", id);

    if (error) {
      console.log(error);
      alert("Unable to approve entrepreneur.");
      return;
    }

    alert("Entrepreneur approved for Funding Queue.");
    window.location.href = "/admin/funding-allocation";
  }

  function badgeColor(status: string) {
    if (
      status === "Ready for Funding Queue" ||
      status === "Funding Approved" ||
      status === "Approved"
    ) {
      return "bg-green-100 text-green-800";
    }

    if (status === "Ready for Funding Review") {
      return "bg-blue-100 text-blue-800";
    }

    if (
      status === "Needs Improvement" ||
      status === "Ready for Annual Meeting"
    ) {
      return "bg-yellow-100 text-yellow-800";
    }

    if (status === "Rejected" || status === "On Hold" || status === "Not Ready") {
      return "bg-red-100 text-red-800";
    }

    return "bg-gray-100 text-gray-800";
  }

  function calculateReadiness(app: any) {
    const preparation = Number(app.preparation_score || 0);
    const organization = Number(app.organization_score || 0);
    const commitment = Number(app.commitment_score || 0);
    const compliance = Number(app.compliance_score || 0);

    const unitsSupported = Number(app.units_supported || 0);
    const communityTrust = unitsSupported >= 20 ? 100 : Math.round((unitsSupported / 20) * 100);

    const overall = Math.round(
      (preparation + organization + commitment + compliance + communityTrust) / 5
    );

    return {
      preparation,
      organization,
      commitment,
      compliance,
      communityTrust,
      overall,
    };
  }

  function readinessStatus(app: any) {
    const unitsSupported = Number(app.units_supported || 0);

    if (app.funding_readiness_status) return app.funding_readiness_status;

    if (unitsSupported < 20) return "Not Ready";

    if (app.annual_meeting_attended === "Yes") {
      return "Ready for Funding Review";
    }

    return "Ready for Annual Meeting";
  }

  const readyForReview = applications.filter(
    (app) => readinessStatus(app) === "Ready for Funding Review"
  ).length;

  const readyForQueue = applications.filter(
    (app) => readinessStatus(app) === "Ready for Funding Queue"
  ).length;

  const notReady = applications.filter(
    (app) => readinessStatus(app) === "Not Ready"
  ).length;

  const needsImprovement = applications.filter(
    (app) => readinessStatus(app) === "Needs Improvement"
  ).length;

  const highRisk = applications.filter(
    (app) => app.ai_risk_level === "High Risk"
  ).length;

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Funding Readiness Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Funding Readiness Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Final readiness gateway before entrepreneurs enter the Funding Queue.
        Review 20 units supported, annual meeting attendance, coach
        recommendation, compliance, AI review, and admin decision.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <Card title="Ready for Review" value={readyForReview} color="text-blue-700" />
        <Card title="Ready for Queue" value={readyForQueue} color="text-green-700" />
        <Card title="Needs Improvement" value={needsImprovement} color="text-yellow-700" />
        <Card title="Not Ready" value={notReady} color="text-red-700" />
        <Card title="High Risk" value={highRisk} color="text-red-700" />
      </div>

      <div className="bg-yellow-50 border-l-8 border-yellow-500 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          20 Units Supported Rule
        </h2>

        <p className="mt-2 text-gray-700">
          Before an entrepreneur qualifies for the Annual Meeting or moves
          toward funding readiness, the entrepreneur must secure support for at
          least 20 contribution units. This serves as a community trust
          validation process.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No entrepreneurs available for readiness review yet.
          </h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {applications.map((app) => {
            const score = calculateReadiness(app);
            const status = readinessStatus(app);
            const unitsSupported = Number(app.units_supported || 0);

            return (
              <div key={app.id} className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex flex-col md:flex-row md:justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-4xl font-extrabold text-[#06245c]">
                      {app.business_name || "Unnamed Business"}
                    </h2>

                    <p className="text-lg text-gray-700 mt-2">
                      Entrepreneur:{" "}
                      <span className="font-bold">{app.full_name || "-"}</span>
                    </p>
                  </div>

                  <span className={`px-4 py-2 rounded-xl font-bold h-fit ${badgeColor(status)}`}>
                    {status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                  <ScoreCard title="Preparation" value={score.preparation} />
                  <ScoreCard title="Organization" value={score.organization} />
                  <ScoreCard title="Commitment" value={score.commitment} />
                  <ScoreCard title="Community Trust" value={score.communityTrust} />
                  <ScoreCard title="Compliance" value={score.compliance} />
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-[#06245c] mb-3">
                    Overall Readiness Score
                  </h3>

                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-green-600 h-8 text-white font-bold text-center"
                      style={{ width: `${score.overall}%` }}
                    >
                      {score.overall}%
                    </div>
                  </div>
                </div>

                <div className="overflow-auto rounded-2xl border mb-8">
                  <table className="w-full min-w-[1000px] bg-white">
                    <thead>
                      <tr className="border-b bg-[#f5f7fb]">
                        <th className="text-left p-4">Requirement</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Meaning</th>
                      </tr>
                    </thead>

                    <tbody>
                      <Requirement
                        label="20 Units Supported"
                        complete={unitsSupported >= 20}
                        value={`${unitsSupported}/20`}
                        meaning="Community trust validation requirement."
                      />

                      <Requirement
                        label="Annual Meeting Qualified"
                        complete={app.annual_meeting_qualified === "Yes"}
                        value={app.annual_meeting_qualified || "Pending"}
                        meaning="Entrepreneur qualifies after community support."
                      />

                      <Requirement
                        label="Annual Meeting Attended"
                        complete={app.annual_meeting_attended === "Yes"}
                        value={app.annual_meeting_attended || "Pending"}
                        meaning="Required before funding readiness review."
                      />

                      <Requirement
                        label="Coach Recommendation"
                        complete={app.coach_recommendation === "Recommend Funding"}
                        value={app.coach_recommendation || "Pending"}
                        meaning="Coach confirms entrepreneur readiness."
                      />

                      <Requirement
                        label="Compliance Review"
                        complete={app.compliance_review_status === "Approved"}
                        value={app.compliance_review_status || "Pending"}
                        meaning="Compliance must be approved before funding queue."
                      />
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="bg-blue-50 border-l-8 border-blue-600 p-6 rounded-2xl">
                    <h3 className="font-bold text-xl text-[#06245c] mb-4">
                      Coach Recommendation
                    </h3>

                    <select
                      className="border rounded-xl p-4 w-full mb-4"
                      defaultValue={app.coach_recommendation || "Pending"}
                      onChange={(e) =>
                        updateApplication(app.id, {
                          coach_recommendation: e.target.value,
                        })
                      }
                    >
                      <option>Pending</option>
                      <option>Recommend Funding</option>
                      <option>Needs More Preparation</option>
                      <option>Delay Funding Review</option>
                      <option>Do Not Recommend</option>
                    </select>

                    <textarea
                      id={`coach-notes-${app.id}`}
                      className="border rounded-xl p-4 w-full min-h-[120px]"
                      defaultValue={app.coach_readiness_notes || ""}
                      placeholder="Coach readiness notes..."
                    />

                    <button
                      onClick={() => {
                        const input = document.getElementById(
                          `coach-notes-${app.id}`
                        ) as HTMLTextAreaElement;

                        updateApplication(app.id, {
                          coach_readiness_notes: input.value,
                        });
                      }}
                      className="bg-blue-700 text-white px-6 py-3 rounded-xl font-bold mt-4"
                    >
                      Save Coach Notes
                    </button>
                  </div>

                  <div className="bg-purple-50 border-l-8 border-purple-600 p-6 rounded-2xl">
                    <h3 className="font-bold text-xl text-[#06245c] mb-4">
                      AI Admin Review
                    </h3>

                    <select
                      className="border rounded-xl p-4 w-full mb-4"
                      defaultValue={app.ai_risk_level || "Low Risk"}
                      onChange={(e) =>
                        updateApplication(app.id, {
                          ai_risk_level: e.target.value,
                        })
                      }
                    >
                      <option>Low Risk</option>
                      <option>Medium Risk</option>
                      <option>High Risk</option>
                    </select>

                    <textarea
                      id={`ai-notes-${app.id}`}
                      className="border rounded-xl p-4 w-full min-h-[120px]"
                      defaultValue={app.ai_readiness_notes || ""}
                      placeholder="AI missing items, readiness notes, or risks..."
                    />

                    <button
                      onClick={() => {
                        const input = document.getElementById(
                          `ai-notes-${app.id}`
                        ) as HTMLTextAreaElement;

                        updateApplication(app.id, {
                          ai_readiness_notes: input.value,
                        });
                      }}
                      className="bg-purple-700 text-white px-6 py-3 rounded-xl font-bold mt-4"
                    >
                      Save AI Notes
                    </button>
                  </div>

                  <div className="bg-green-50 border-l-8 border-green-600 p-6 rounded-2xl">
                    <h3 className="font-bold text-xl text-[#06245c] mb-4">
                      Admin Decision
                    </h3>

                    <textarea
                      id={`admin-notes-${app.id}`}
                      className="border rounded-xl p-4 w-full min-h-[120px]"
                      defaultValue={app.funding_readiness_notes || ""}
                      placeholder="Admin funding readiness notes..."
                    />

                    <button
                      onClick={() => {
                        const input = document.getElementById(
                          `admin-notes-${app.id}`
                        ) as HTMLTextAreaElement;

                        updateApplication(app.id, {
                          funding_readiness_notes: input.value,
                        });
                      }}
                      className="bg-[#06245c] text-white px-6 py-3 rounded-xl font-bold mt-4"
                    >
                      Save Admin Notes
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-5">
  <div>
    <label className="block font-bold text-[#06245c] mb-2">
      Annual Meeting Qualified
    </label>
    <select
      className="border rounded-xl p-3"
      value={app.annual_meeting_qualified || "Pending"}
      onChange={(e) =>
        updateApplication(app.id, {
          annual_meeting_qualified: e.target.value,
        })
      }
    >
      <option>Pending</option>
      <option>Yes</option>
      <option>No</option>
    </select>
  </div>

  <div>
    <label className="block font-bold text-[#06245c] mb-2">
      Annual Meeting Attended
    </label>
    <select
      className="border rounded-xl p-3"
      value={app.annual_meeting_attended || "Pending"}
      onChange={(e) =>
        updateApplication(app.id, {
          annual_meeting_attended: e.target.value,
        })
      }
    >
      <option>Pending</option>
      <option>Yes</option>
      <option>No</option>
    </select>
  </div>

  <button
  onClick={() => approveForFundingQueue(app.id)}
  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold"
>
  Approve for Funding Queue
</button>

  <button
    onClick={() =>
      updateApplication(app.id, {
        funding_readiness_status: "Needs Improvement",
      })
    }
    className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-bold"
  >
    Return to Coach
  </button>

  <button
    onClick={() =>
      updateApplication(app.id, {
        funding_readiness_status: "On Hold",
      })
    }
    className="bg-gray-700 text-white px-6 py-3 rounded-xl font-bold"
  >
    Hold
  </button>

  <button
    onClick={() =>
      updateApplication(app.id, {
        funding_readiness_status: "Rejected",
      })
    }
    className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold"
  >
    Reject
  </button>
</div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h2 className="text-lg font-bold text-gray-600">{title}</h2>
      <p className={`text-4xl font-extrabold mt-4 ${color}`}>{value}</p>
    </div>
  );
}

function ScoreCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-[#f5f7fb] rounded-2xl p-6">
      <h3 className="font-bold text-gray-600">{title}</h3>
      <p className="text-3xl font-extrabold text-[#06245c] mt-3">
        {value}/100
      </p>
    </div>
  );
}

function Requirement({
  label,
  complete,
  value,
  meaning,
}: {
  label: string;
  complete: boolean;
  value: string;
  meaning: string;
}) {
  return (
    <tr className="border-b">
      <td className="p-4 font-bold">{label}</td>
      <td className="p-4">
        <span
          className={`px-4 py-2 rounded-xl font-bold ${
            complete
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {value}
        </span>
      </td>
      <td className="p-4">{meaning}</td>
    </tr>
  );
}