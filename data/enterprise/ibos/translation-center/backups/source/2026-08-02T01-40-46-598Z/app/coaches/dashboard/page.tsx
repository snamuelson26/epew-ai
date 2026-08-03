"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CoachDashboardPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const [coachName, setCoachName] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [coachNotes, setCoachNotes] = useState("");

  const [queuePosition, setQueuePosition] = useState("");
  const [fundingRound, setFundingRound] = useState("");
  const [unitsRequired, setUnitsRequired] = useState("20");
  const [unitsSupported, setUnitsSupported] = useState("0");
  const [estimatedFundingDate, setEstimatedFundingDate] = useState("");

  const [supportCategory, setSupportCategory] = useState("");
  const [yearlySupportCompleted, setYearlySupportCompleted] = useState(false);
  const [fundingPath, setFundingPath] = useState("");
  const [marketplaceListed, setMarketplaceListed] = useState(false);
  const [projectedFundingStartDate, setProjectedFundingStartDate] = useState("");
  const [videoDescription, setVideoDescription] = useState("");

  const statusSteps = [
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

function getProgress(status: string) {
  const index = statusSteps.indexOf(status);
  if (index === -1) return 0;
  return Math.round(((index + 1) / statusSteps.length) * 100);
}
  useEffect(() => {
  loadApplications();
  loadAppointments();
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

async function loadAppointments() {
  const { data, error } = await supabase
    .from("entrepreneur_applications")
    .select("*")
    .not("interview_date", "is", null)
    .order("interview_date", { ascending: true });

  if (error) {
    console.log(error);
    return;
  }

  setAppointments(data || []);
}

  async function updateApplicationStatus(
    id: number,
    status: string
  ) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        status: status,
      })
      .eq("id", id);

    if (error) {
      console.log(error);
      alert("Unable to update status.");
      return;
    }

    loadApplications();
  }

  async function assignCoachToApplication(id: number) {
  console.log("Assigning application ID:", id);

  const { data, error } = await supabase
    .from("entrepreneur_applications")
    .update({
      assigned_coach_id: "EPEW-COACH-001",
      assigned_coach_name: "Samuel Nelson",
      assigned_date: new Date().toISOString(),
      coach_name: "Samuel Nelson",
      status: "Assigned",
    })
    .eq("id", Number(id))
    .select();

      console.log(
      "UPDATED RECORD:",
      JSON.stringify(data, null, 2)
    );

    console.log(
      "ERROR:",
      JSON.stringify(error, null, 2)
    );

    if (error) {
    alert("Unable to assign coach.");
    return;
  }

  if (!data || data.length === 0) {
    alert("No application was updated. Check the application ID.");
    return;
  }

  alert("Coach assigned successfully.");
  loadApplications();
  }
  async function scheduleInterview(id: number) {

  if (!interviewDate) {
    alert("Please select an interview date first.");
    return;
  }

  const { data, error } = await supabase
    .from("entrepreneur_applications")
    .update({
      interview_date: interviewDate,
      status: "Interview Scheduled",
    })
    .eq("id", id)
    .select();

  console.log("INTERVIEW UPDATE:", data);
  console.log("ERROR:", error);

  if (error) {
    alert("Unable to schedule interview.");
    return;
  }

  alert("Interview scheduled successfully.");
  loadApplications();
}
async function approveApplication(id: number) {

  const { data, error } = await supabase
    .from("entrepreneur_applications")
    .update({
      status: "Approved",
    })
    .eq("id", id)
    .select();

  console.log(
    "APPROVED RECORD:",
    JSON.stringify(data, null, 2)
  );

  console.log(
    "ERROR:",
    JSON.stringify(error, null, 2)
  );

  if (error) {
    alert("Unable to approve application.");
    return;
  }

  if (!data || data.length === 0) {
    alert("No application updated.");
    return;
  }

  alert("Application approved successfully.");

  loadApplications();
  }
  async function saveCoachInfo(id: number) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
    support_category: supportCategory,

yearly_support_completed: yearlySupportCompleted,

funding_path: fundingPath,

marketplace_listed: marketplaceListed,

projected_funding_start_date:
  projectedFundingStartDate &&
  projectedFundingStartDate.trim() !== ""
    ? projectedFundingStartDate
    : null,

video_description: videoDescription || null,

coach_name: coachName,

interview_date:
  interviewDate && interviewDate.trim() !== ""
    ? interviewDate
    : null,

coach_notes: coachNotes,

funding_queue_position: queuePosition
  ? parseInt(queuePosition)
  : null,

funding_round: fundingRound,

units_required: unitsRequired
  ? parseInt(unitsRequired)
  : 20,

units_supported: unitsSupported
  ? parseInt(unitsSupported)
  : 0,

estimated_funding_date:
  estimatedFundingDate &&
  estimatedFundingDate.trim() !== ""
    ? estimatedFundingDate
    : null,
})
      .eq("id", id);

   if (error) {
  console.log(error);
  alert(JSON.stringify(error));
  return;
}

    alert("Coach information saved.");
    loadApplications();
  }

  return (
    <main className="bg-[#f5f7fb] min-h-screen p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
        <h2 className="text-4xl font-bold mb-8">
          New Entrepreneur Applications
        </h2>

        {loading ? (
          <p className="text-xl">
            Loading applications...
          </p>
        ) : applications.length === 0 ? (
          <p className="text-xl">
            No entrepreneur applications found.
          </p>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="border rounded-2xl p-6 bg-[#f5f7fb]"
              >
                <h3 className="text-2xl font-bold">
                  {app.full_name}
                </h3>

                <p className="text-xl">
                  {app.business_name}
                </p>

                <p className="text-lg text-gray-600">
                  {app.email}
                </p>

                <p className="text-lg text-gray-600">
                  {app.phone}
                </p>

                <p className="text-lg text-gray-700 mt-3">
                  <strong>Business Type:</strong>{" "}
                  {app.business_type}
                </p>

                <p className="text-lg text-gray-700">
                  <strong>Submitted:</strong>{" "}
                  {app.created_at
                    ? new Date(
                        app.created_at
                      ).toLocaleDateString()
                    : "Not available"}
                </p>

                <div className="mt-3">
                  <span className="font-bold">
                    Status:
                  </span>

                  <span
                    className={`ml-2 px-4 py-2 rounded-xl font-bold ${
                  app.status === "Assigned"
                    ? "bg-blue-100 text-blue-700"
                    : app.status === "Approved"
                    ? "bg-green-100 text-green-700"
                    : app.status === "Funding Queue"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {app.status || "Pending Review"}
              </span>
            </div>

<div className="mt-4">
  <div className="flex justify-between text-sm font-semibold">
    <span>Progress</span>
    <span>{getProgress(app.status)}%</span>
  </div>

  <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
    <div
      className="bg-green-600 h-4 rounded-full"
      style={{
        width: `${getProgress(app.status)}%`,
      }}
    />
  </div>
</div>
                <div className="mt-3">
                  <span className="font-bold">
                    Assigned Coach:
                  </span>

                  <span className="ml-2">
                    {app.assigned_coach_name ||
                      "Not Assigned"}
                  </span>
                </div>

                <div className="text-lg mt-5">
                  {app.business_description}
                </div>

                <div className="mt-6">
                  <label className="block font-bold mb-2">
                    Coach Name
                  </label>

                  <input
                    type="text"
                    value={coachName}
                    onChange={(e) =>
                      setCoachName(
                        e.target.value
                      )
                    }
                    placeholder="Assigned Coach"
                    className="w-full border rounded-xl p-3"
                  />
                </div>

                <div className="mt-4">
                  <label className="block font-bold mb-2">
                    Interview Date
                  </label>

                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) =>
                      setInterviewDate(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-xl p-3"
                  />
                </div>

                <div className="mt-4">
                  <label className="block font-bold mb-2">
                    Coach Notes
                  </label>

                  <textarea
                    rows={4}
                    value={coachNotes}
                    onChange={(e) =>
                      setCoachNotes(
                        e.target.value
                      )
                    }
                    placeholder="Interview notes..."
                    className="w-full border rounded-xl p-3"
                  />
                </div>

<div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
  <div>
    <label className="block font-bold mb-2">
      Queue Position
    </label>
    <input
      type="number"
      value={queuePosition}
      onChange={(e) => setQueuePosition(e.target.value)}
      placeholder="Example: 4"
      className="w-full border rounded-xl p-3"
    />
  </div>

  <div>
    <label className="block font-bold mb-2">
      Funding Round
    </label>
    <input
      type="text"
      value={fundingRound}
      onChange={(e) => setFundingRound(e.target.value)}
      placeholder="Example: Round 27"
      className="w-full border rounded-xl p-3"
    />
  </div>

  <div>
    <label className="block font-bold mb-2">
      Units Required
    </label>
    <input
      type="number"
      value={unitsRequired}
      onChange={(e) => setUnitsRequired(e.target.value)}
      placeholder="20"
      className="w-full border rounded-xl p-3"
    />
  </div>

  <div>
    <label className="block font-bold mb-2">
      Units Supported
    </label>
    <input
      type="number"
      value={unitsSupported}
      onChange={(e) => setUnitsSupported(e.target.value)}
      placeholder="0"
      className="w-full border rounded-xl p-3"
    />
  </div>

  <div>
    <label className="block font-bold mb-2">
      Estimated Funding Date
    </label>
    <input
      type="date"
      value={estimatedFundingDate}
      onChange={(e) => setEstimatedFundingDate(e.target.value)}
      className="w-full border rounded-xl p-3"
    />
  </div>
</div>
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">

  <div>
    <label className="block font-bold mb-2">
      Support Category
    </label>

    <select
      value={supportCategory}
      onChange={(e) =>
        setSupportCategory(e.target.value)
      }
      className="w-full border rounded-xl p-3"
    >
      <option value="">
        Select Category
      </option>

      <option value="Weekly">
        Weekly Support
      </option>

      <option value="Monthly">
        Monthly Support
      </option>

      <option value="Yearly">
        Yearly Support
      </option>
    </select>
  </div>

  <div>
    <label className="block font-bold mb-2">
      Funding Path
    </label>

    <select
      value={fundingPath}
      onChange={(e) =>
        setFundingPath(e.target.value)
      }
      className="w-full border rounded-xl p-3"
    >
      <option value="">
        Select Path
      </option>

      <option value="Queue Funding">
        Queue Funding
      </option>

      <option value="Direct Funding">
        Direct Funding
      </option>
    </select>
  </div>

  <div>
    <label className="block font-bold mb-2">
      Projected Funding Start Date
    </label>

    <input
      type="date"
      value={projectedFundingStartDate}
      onChange={(e) =>
        setProjectedFundingStartDate(
          e.target.value
        )
      }
      className="w-full border rounded-xl p-3"
    />
  </div>

</div>

<div className="mt-4">
  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={yearlySupportCompleted}
      onChange={(e) =>
        setYearlySupportCompleted(
          e.target.checked
        )
      }
    />

    <span className="font-bold">
      Yearly Support Completed
    </span>
  </label>
</div>

<div className="mt-4">
  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={marketplaceListed}
      onChange={(e) =>
        setMarketplaceListed(
          e.target.checked
        )
      }
    />

    <span className="font-bold">
      Listed In Public Business Marketplace
    </span>
  </label>
</div>

<div className="mt-4">
  <label className="block font-bold mb-2">
    Video Description
  </label>

  <textarea
    rows={4}
    value={videoDescription}
    onChange={(e) =>
      setVideoDescription(
        e.target.value
      )
    }
    className="w-full border rounded-xl p-3"
  />
</div>
                <div className="flex flex-wrap gap-4 mt-6">

                  <button
                    type="button"
                    onClick={() =>
                      saveCoachInfo(app.id)
                    }
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-bold"
                  >
                    Save Coach Info
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      assignCoachToApplication(
                        app.id
                      )
                    }
                    className="bg-[#06245c] text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-green-600 transition"
                  >
                    Assign Coach
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      scheduleInterview(app.id)
                    }
                    className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg font-bold"
                  >
                    Interview Scheduled
                  </button>

                 <button
                    type="button"
                    onClick={() =>
                    approveApplication(app.id)
                  }
                    className="border-2 border-blue-900 text-blue-900 px-6 py-3 rounded-xl text-lg font-bold"
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateApplicationStatus(
                        app.id,
                        "Questionnaire Completed"
                      )
                    }
                    className="bg-yellow-500 text-white px-6 py-3 rounded-xl text-lg font-bold"
                  >
                    Questionnaire Complete
                  </button>

                 <button
  type="button"
  onClick={() =>
    updateApplicationStatus(app.id, "Funding Queue")
  }
  className="bg-purple-600 text-white px-6 py-3 rounded-xl text-lg font-bold"
>
  Funding Queue
</button>

<button
  type="button"
  onClick={() =>
    updateApplicationStatus(app.id, "Annual Meeting Qualified")
  }
  className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-lg font-bold"
>
  Annual Meeting Qualified
</button>

<button
  type="button"
  onClick={() =>
    updateApplicationStatus(app.id, "Annual Meeting Attended")
  }
  className="bg-cyan-600 text-white px-6 py-3 rounded-xl text-lg font-bold"
>
  Annual Meeting Attended
</button>

<button
  type="button"
  onClick={() =>
    updateApplicationStatus(app.id, "Funding Readiness Review")
  }
  className="bg-orange-600 text-white px-6 py-3 rounded-xl text-lg font-bold"
>
  Funding Readiness Review
</button>

<button
  type="button"
  onClick={() =>
    updateApplicationStatus(app.id, "Funding Committee Approved")
  }
  className="bg-emerald-700 text-white px-6 py-3 rounded-xl text-lg font-bold"
>
  Funding Committee Approval
</button>

  <button
  type="button"
  onClick={() =>
    updateApplicationStatus(
      app.id,
      "Funding Approved"
    )
  }
  className="bg-green-700 text-white px-6 py-3 rounded-xl text-lg font-bold"
>
  Funding Approved ($100,000)
</button>

<button
  type="button"
  onClick={() =>
    updateApplicationStatus(
      app.id,
      "Business Opened"
    )
  }
  className="bg-blue-700 text-white px-6 py-3 rounded-xl text-lg font-bold"
>
  Business Opened
</button>

<button
  type="button"
  onClick={() =>
    updateApplicationStatus(
      app.id,
      "Quarterly Reporting"
    )
  }
  className="bg-slate-700 text-white px-6 py-3 rounded-xl text-lg font-bold"
>
  Quarterly Reporting
</button>
                
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOP HEADER */}
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

          <div>
            <h1 className="text-6xl font-extrabold mb-4">
              Coach Dashboard
            </h1>

            <p className="text-2xl text-gray-700 leading-relaxed">
              Manage entrepreneur assignments, meetings, communication,
              concerns, preparation progress, and marketplace readiness.
            </p>
          </div>

          <div className="bg-[#f5f7fb] rounded-3xl p-6 flex items-center gap-5 shadow-lg">
            <div className="w-24 h-24 rounded-full bg-green-600 text-white flex items-center justify-center text-4xl font-bold">
              SJ
            </div>

            <div>
              <p className="text-2xl font-bold">
                Coach Sarah Johnson
              </p>

              <p className="text-xl text-gray-600">
                Coach ID: EPEW-COACH-001
              </p>

              <p className="text-lg text-green-700 font-bold mt-1">
                Active Coach Session
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-8 mb-10">

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-4xl font-bold mb-3">12</h2>
          <p className="text-2xl text-gray-700">Assigned Entrepreneurs</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="text-4xl font-bold mb-3">5</h2>
          <p className="text-2xl text-gray-700">Scheduled Meetings</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-5xl mb-4">❓</div>
          <h2 className="text-4xl font-bold mb-3">4</h2>
          <p className="text-2xl text-gray-700">Pending Concerns</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-4xl font-bold mb-3">7</h2>
          <p className="text-2xl text-gray-700">Marketplace Ready</p>
        </div>

      </div>

      {/* APPOINTMENTS + FOLLOW UP */}
      <div className="grid lg:grid-cols-2 gap-10 mb-10">

        {/* APPOINTMENTS */}
        <div className="bg-white rounded-3xl shadow-xl p-10">

          <h2 className="text-4xl font-bold mb-8">
            Appointment Schedule
          </h2>

         <div className="space-y-6">
  {appointments.length === 0 ? (
    <div className="bg-gray-50 rounded-2xl p-6">
      <p className="text-xl text-gray-700">
        No interviews scheduled yet.
      </p>
    </div>
  ) : (
    appointments.map((item) => (
      <div
        key={item.id}
        className="border-l-8 border-green-600 bg-gray-50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-5 mb-5">
          <div className="w-20 h-20 rounded-full bg-[#06245c] text-white flex items-center justify-center text-3xl font-bold">
            {(item.full_name || "E")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div>
            <h3 className="text-2xl font-bold">
              {item.full_name || "Unnamed Entrepreneur"} —{" "}
              {item.business_name || "Unnamed Business"}
            </h3>

            <p className="text-lg text-gray-600">
              Entrepreneur ID: {item.entrepreneur_id || "Pending"}
            </p>
          </div>
        </div>

        <p className="text-xl text-gray-700">
          {item.interview_date || "No date"} —{" "}
          {item.interview_time || "No time"}
        </p>

        <p className="text-lg text-gray-600 mt-2 mb-5">
          {item.interview_type || "Interview scheduled"}
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <a
            href={`/coaches/entrepreneurs/${item.id}`}
            className="bg-[#06245c] text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-green-600 transition"
          >
            Open Entrepreneur File
          </a>

          {item.meeting_link && (
            <a
              href={item.meeting_link}
              target="_blank"
              className="border-2 border-[#06245c] text-[#06245c] px-6 py-3 rounded-xl text-lg font-bold hover:bg-[#06245c] hover:text-white transition"
            >
              View Meeting Link
            </a>
          )}
        </div>
      </div>
    ))
  )}
</div>

        </div>

        {/* FOLLOW UP */}
        <div className="bg-white rounded-3xl shadow-xl p-10">

          <h2 className="text-4xl font-bold mb-8">
            Follow-Up Tasks
          </h2>

          <div className="space-y-5 text-2xl">

            <label className="flex items-center gap-4">
              <input type="checkbox" className="w-6 h-6" />
              <span>Review entrepreneur questionnaire</span>
            </label>

            <label className="flex items-center gap-4">
              <input type="checkbox" className="w-6 h-6" />
              <span>Approve presentation preparation</span>
            </label>

            <label className="flex items-center gap-4">
              <input type="checkbox" className="w-6 h-6" />
              <span>Schedule next business coaching meeting</span>
            </label>

            <label className="flex items-center gap-4">
              <input type="checkbox" className="w-6 h-6" />
              <span>Review supporter engagement strategy</span>
            </label>

          </div>

        </div>

      </div>
{/* FOLLOW-UP ACTIVITY PROTOCOL */}
<div className="bg-white rounded-3xl shadow-xl p-10 mb-10">

  <h2 className="text-4xl font-bold mb-8">
    Follow-Up Activity Protocol
  </h2>

  <p className="text-2xl text-gray-700 leading-relaxed mb-8">
    Track follow-up actions by date, purpose, responsible party, and completion status.
  </p>

  <div className="space-y-6">

    <div className="bg-[#f5f7fb] rounded-2xl p-6 grid md:grid-cols-4 gap-6 items-center">
      <div>
        <p className="text-xl font-bold text-green-700">May 30, 2026</p>
        <p className="text-lg text-gray-600">Scheduled</p>
      </div>

      <div className="md:col-span-2">
        <p className="text-2xl font-bold">Review questionnaire responses</p>
        <p className="text-xl text-gray-700">
          Confirm missing information before first interview.
        </p>
      </div>

      <div className="text-xl font-bold text-[#06245c]">
        Coach Action
      </div>
    </div>

    <div className="bg-[#f5f7fb] rounded-2xl p-6 grid md:grid-cols-4 gap-6 items-center">
      <div>
        <p className="text-xl font-bold text-yellow-700">June 1, 2026</p>
        <p className="text-lg text-gray-600">Pending</p>
      </div>

      <div className="md:col-span-2">
        <p className="text-2xl font-bold">Send business preparation instructions</p>
        <p className="text-xl text-gray-700">
          Provide entrepreneur with next-step preparation checklist.
        </p>
      </div>

      <div className="text-xl font-bold text-[#06245c]">
        Message Follow-Up
      </div>
    </div>

    <div className="bg-[#f5f7fb] rounded-2xl p-6 grid md:grid-cols-4 gap-6 items-center">
      <div>
        <p className="text-xl font-bold text-[#06245c]">June 3, 2026</p>
        <p className="text-lg text-gray-600">Next Discussion</p>
      </div>

      <div className="md:col-span-2">
        <p className="text-2xl font-bold">Discuss unresolved entrepreneur concerns</p>
        <p className="text-xl text-gray-700">
          Review pending questions and provide clarified answers.
        </p>
      </div>

      <div className="text-xl font-bold text-[#06245c]">
        Meeting Agenda
      </div>
    </div>

  </div>

</div>
      {/* COMMUNICATION */}
      <div className="grid lg:grid-cols-2 gap-10 mb-10">

        <div className="bg-white rounded-3xl shadow-xl p-10">

          <h2 className="text-4xl font-bold mb-6">
            Messages & Questions
          </h2>

          <div className="bg-green-50 border-l-8 border-green-600 rounded-2xl p-6 mb-8">

            <h3 className="text-2xl font-bold text-green-700 mb-3">
              Coach Response Standard
            </h3>

            <p className="text-xl text-gray-700 leading-relaxed">
              Coaches should respond within 2 hours during business hours.
              Messages received after business hours should be answered by the
              next business day.
            </p>

          </div>

          <div className="space-y-5 mb-8">
  {appointments.length === 0 ? (
    <div className="bg-[#f5f7fb] rounded-2xl p-6 text-xl text-gray-600">
      No interviews scheduled.
    </div>
  ) : (
    appointments.map((appointment) => (
      <div
        key={appointment.id}
        className="bg-[#f5f7fb] rounded-2xl p-6"
      >
        <p className="text-xl font-bold text-[#06245c] mb-2">
          {appointment.full_name}
        </p>

        <p className="text-lg text-gray-700">
          Business:
          {" "}
          {appointment.business_name || "Not provided"}
        </p>

        <p className="text-lg text-gray-700">
          Interview Date:
          {" "}
          {appointment.interview_date}
        </p>

        <p className="text-lg text-gray-700">
          Interview Time:
          {" "}
          {appointment.interview_time || "Not scheduled"}
        </p>

        <div className="flex gap-4 mt-5">
          <button
            onClick={() =>
              router.push(
                `/coaches/entrepreneurs/${appointment.id}`
              )
            }
            className="bg-[#06245c] text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600"
          >
            Open Entrepreneur File
          </button>

          <button
            onClick={() =>
              router.push(
                `/marketplace/${appointment.id}`
              )
            }
            className="border-2 border-[#06245c] text-[#06245c] px-6 py-3 rounded-xl font-bold hover:bg-[#06245c] hover:text-white"
          >
            View Marketplace
          </button>
        </div>
      </div>
    ))
  )}
</div>

          <textarea
            placeholder="Write a coach reply or guidance message..."
            className="w-full h-48 border-2 border-gray-300 rounded-2xl p-6 text-xl"
          ></textarea>

          <button
            type="button"
            className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition mt-6"
          >
            Send Coach Reply
          </button>

        </div>

        {/* CONCERNS */}
        <div className="bg-white rounded-3xl shadow-xl p-10">

          <h2 className="text-4xl font-bold mb-6">
            Entrepreneur Concerns & Pending Answers
          </h2>

          <div className="bg-yellow-50 border-l-8 border-yellow-500 rounded-2xl p-6 mb-8">

            <p className="text-xl text-gray-700 leading-relaxed">
              If a coach does not immediately have an answer to an entrepreneur
              concern or question, the concern should be documented and followed
              up during the next discussion or through direct messaging after
              clarification is obtained.
            </p>

          </div>

          <div className="grid gap-6">

            <input
              className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-xl"
              placeholder="Concern Title"
            />

            <textarea
              className="w-full h-40 border-2 border-gray-300 rounded-2xl p-6 text-xl"
              placeholder="Entrepreneur question or concern..."
            ></textarea>

            <select className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-xl">
              <option>Pending Research</option>
              <option>Waiting Internal Guidance</option>
              <option>Ready for Next Discussion</option>
              <option>Resolved</option>
            </select>

            <input
              type="date"
              className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-xl"
            />

            <textarea
              className="w-full h-40 border-2 border-gray-300 rounded-2xl p-6 text-xl"
              placeholder="Coach follow-up notes or response plan..."
            ></textarea>

            <button
              type="button"
              className="w-full bg-green-600 text-white py-5 rounded-2xl text-2xl font-bold hover:bg-[#06245c] transition"
            >
              Save Concern & Follow-Up Plan
            </button>

          </div>

        </div>

      </div>

      {/* NOTES + FEEDBACK */}
      <div className="grid lg:grid-cols-2 gap-10 mb-10">

        <div className="bg-white rounded-3xl shadow-xl p-10">

          <h2 className="text-4xl font-bold mb-8">
            Coach Notes
          </h2>

          <textarea
            placeholder="Write entrepreneur preparation notes..."
            className="w-full h-72 border-2 border-gray-300 rounded-2xl p-6 text-xl"
          ></textarea>

        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">

          <h2 className="text-4xl font-bold mb-8">
            Entrepreneur Feedback
          </h2>

          <textarea
            placeholder="Provide feedback and development guidance..."
            className="w-full h-72 border-2 border-gray-300 rounded-2xl p-6 text-xl"
          ></textarea>

        </div>

      </div>

      {/* RECOMMENDATION + NEXT MEETING */}
      <div className="grid lg:grid-cols-2 gap-10">

        <div className="bg-white rounded-3xl shadow-xl p-10">

          <h2 className="text-4xl font-bold mb-8">
            Coach Recommendation
          </h2>

          <textarea
            placeholder="Write recommendations for entrepreneur readiness..."
            className="w-full h-72 border-2 border-gray-300 rounded-2xl p-6 text-xl"
          ></textarea>

        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">

          <h2 className="text-4xl font-bold mb-8">
            Next Meeting Preparation Discussion
          </h2>

          <textarea
            placeholder="Prepare discussion topics and next meeting objectives..."
            className="w-full h-72 border-2 border-gray-300 rounded-2xl p-6 text-xl"
          ></textarea>

        </div>

      </div>

    </main>
  );
}