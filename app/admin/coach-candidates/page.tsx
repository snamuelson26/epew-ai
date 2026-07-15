"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminCoachCandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    setLoading(true);

    const { data, error } = await supabase
      .from("coach_candidates")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      console.log(error);
      alert("Unable to load coach candidates: " + error.message);
      return;
    }

    setCandidates(data || []);
  }

  async function updateCandidate(id: string, updates: any) {
    setSavingId(id);

    const { error } = await supabase
      .from("coach_candidates")
      .update(updates)
      .eq("id", id);

    setSavingId(null);

    if (error) {
      console.log(error);
      alert("Unable to update candidate: " + error.message);
      return;
    }

    loadCandidates();
  }

  async function generateInvite(candidate: any) {
    const inviteCode = `COACH-${Date.now()}`;

    setSavingId(candidate.id);

    const { error: inviteError } = await supabase
      .from("coach_invites")
      .insert({
        invite_code: inviteCode,
        email: candidate.email,
        full_name: candidate.full_name,
        status: "Pending",
      });

    if (inviteError) {
      setSavingId(null);
      console.log(inviteError);
      alert("Unable to generate invitation: " + inviteError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("coach_candidates")
      .update({
        status: "Invitation Sent",
      })
      .eq("id", candidate.id);

    setSavingId(null);

    if (updateError) {
      console.log(updateError);
      alert("Invitation created, but candidate status was not updated.");
      return;
    }

    alert(`Invitation created:\n/coaches/register?invite=${inviteCode}`);
    loadCandidates();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">
          Loading coach candidates...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
        <h1 className="text-6xl font-extrabold mb-5">
          Coach Candidates
        </h1>

        <p className="text-2xl text-gray-700">
          Review coach applications, schedule interviews, approve, reject,
          and generate private invitation links.
        </p>
      </div>

      <div className="grid gap-8">
        {candidates.length === 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
            <p className="text-2xl font-bold">
              No coach candidates submitted yet.
            </p>
          </div>
        )}

        {candidates.map((candidate) => (
          <div key={candidate.id} className="bg-white rounded-3xl shadow-xl p-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div>
                <h2 className="text-4xl font-bold mb-3">
                  {candidate.full_name}
                </h2>

                <p className="text-xl text-gray-700">
                  <strong>Email:</strong> {candidate.email}
                </p>

                <p className="text-xl text-gray-700">
                  <strong>Phone:</strong> {candidate.phone || "Not provided"}
                </p>

                <p className="text-xl text-gray-700 mt-3">
                  <strong>Status:</strong>{" "}
                  <span className="font-bold text-green-700">
                    {candidate.status}
                  </span>
                </p>
              </div>

              <div className="bg-[#f5f7fb] rounded-2xl p-6 min-w-[260px]">
                <p className="text-xl font-bold mb-3">Interview Date</p>

                <input
                  type="date"
                  defaultValue={candidate.coach_interview_date || ""}
                  onChange={(e) =>
                    updateCandidate(candidate.id, {
                      coach_interview_date: e.target.value,
                      status: "Interview Scheduled",
                    })
                  }
                  className="w-full border rounded-xl p-3 text-lg"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <InfoBox
                title="Language 1"
                value={`${candidate.language1 || "N/A"} | Speak: ${
                  candidate.language1_speaking || "N/A"
                } | Write: ${candidate.language1_writing || "N/A"}`}
              />

              <InfoBox
                title="Language 2"
                value={`${candidate.language2 || "N/A"} | Speak: ${
                  candidate.language2_speaking || "N/A"
                } | Write: ${candidate.language2_writing || "N/A"}`}
              />

              <InfoBox
                title="Language 3"
                value={`${candidate.language3 || "N/A"} | Speak: ${
                  candidate.language3_speaking || "N/A"
                } | Write: ${candidate.language3_writing || "N/A"}`}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <InfoBox
                title="Industry Expertise"
                value={candidate.industry_expertise || "Not provided"}
              />

              <InfoBox
                title="Certifications"
                value={candidate.certifications || "Not provided"}
              />

              <InfoBox
                title="Availability"
                value={candidate.availability || "Not provided"}
              />

              <InfoBox
                title="Coverage Area"
                value={candidate.coverage_area || "Not provided"}
              />
            </div>

            <div className="mt-8 bg-[#f5f7fb] rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-3">Experience</h3>
              <p className="text-xl text-gray-700 whitespace-pre-wrap">
                {candidate.experience || "Not provided"}
              </p>
            </div>

            <div className="mt-8 bg-[#f5f7fb] rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-3">Why Join EPEW?</h3>
              <p className="text-xl text-gray-700 whitespace-pre-wrap">
                {candidate.why_join || "Not provided"}
              </p>
            </div>

            <div className="mt-8">
              <label className="text-2xl font-bold block mb-3">
                Interview Notes
              </label>

              <textarea
                defaultValue={candidate.coach_interview_notes || ""}
                onBlur={(e) =>
                  updateCandidate(candidate.id, {
                    coach_interview_notes: e.target.value,
                  })
                }
                className="w-full border rounded-2xl p-5 text-xl min-h-[140px]"
                placeholder="Add admin interview notes..."
              />
            </div>

            <div className="grid md:grid-cols-4 gap-5 mt-8">
              <button
                disabled={savingId === candidate.id}
                onClick={() =>
                  updateCandidate(candidate.id, { status: "Approved" })
                }
                className="bg-green-600 text-white py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]"
              >
                Approve
              </button>

              <button
                disabled={savingId === candidate.id}
                onClick={() =>
                  updateCandidate(candidate.id, { status: "Rejected" })
                }
                className="bg-red-600 text-white py-4 rounded-2xl text-xl font-bold hover:bg-red-700"
              >
                Reject
              </button>

              <button
                disabled={savingId === candidate.id}
                onClick={() => generateInvite(candidate)}
                className="bg-[#06245c] text-white py-4 rounded-2xl text-xl font-bold hover:bg-green-600"
              >
                Send Invite
              </button>

              <button
                disabled={savingId === candidate.id}
                onClick={() =>
                  updateCandidate(candidate.id, { status: "Active" })
                }
                className="border-2 border-[#06245c] text-[#06245c] py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] hover:text-white"
              >
                Activate
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-[#f5f7fb] rounded-2xl p-6">
      <p className="text-xl font-bold mb-2">{title}</p>
      <p className="text-lg text-gray-700">{value}</p>
    </div>
  );
}