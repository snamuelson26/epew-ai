"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { advanceIBOSStage } from "@/lib/ibos/engine";
import { IBOS_STAGES } from "@/lib/ibos/stages";

type Application = {
  id: string | number;
  full_name?: string | null;
  name?: string | null;
  entrepreneur_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  language?: string | null;

  business_category?: string | null;
  category?: string | null;
  business_description?: string | null;
  business_stage?: string | null;
  funding_goal?: number | null;
  campaign_goal?: number | null;
  units_required?: number | null;
  weekly_unit_goal?: number | null;

  review_status?: string | null;
  orientation_date?: string | null;
  orientation_time?: string | null;
  orientation_status?: string | null;
  meeting_link?: string | null;
  meeting_id?: string | null;
  meeting_passcode?: string | null;

  commitment_score?: number | null;
  organization_score?: number | null;
  communication_score?: number | null;
  leadership_score?: number | null;
  business_potential_score?: number | null;
  readiness_score?: number | null;
  qualification_score?: number | null;
  qualification_notes?: string | null;
  checklist?: Record<string, boolean> | null;
  application_decision?: string | null;
  activated_at?: string | null;
  created_at?: string | null;
};

const ZOOM_LINK = "https://us06web.zoom.us/j/89871094165";
const ZOOM_ID = "898 7109 4165";
const ZOOM_PASSCODE = "EPEW2026";

const checklistItems = [
  "Identity Verified",
  "Email Verified",
  "Phone Verified",
  "Business Name Approved",
  "Business Category Approved",
  "Business Description Reviewed",
  "Funding Goal Reviewed",
  "Questionnaire Reviewed",
  "Orientation Completed",
  "Ready for Activation",
];

export default function ProfessionalQualificationActivationCenter() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [formById, setFormById] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setApplications(data || []);

    const initialForms: Record<string, any> = {};
    (data || []).forEach((app: Application) => {
      initialForms[String(app.id)] = {
        review_status: app.review_status || "Pending Review",
        orientation_date: app.orientation_date || "",
        orientation_time: app.orientation_time || "",
        orientation_status: app.orientation_status || "Pending",
        commitment_score: app.commitment_score || 0,
        organization_score: app.organization_score || 0,
        communication_score: app.communication_score || 0,
        leadership_score: app.leadership_score || 0,
        business_potential_score: app.business_potential_score || 0,
        readiness_score: app.readiness_score || 0,
        qualification_notes: app.qualification_notes || "",
        checklist: app.checklist || {},
      };
    });

    setFormById(initialForms);
    setSelectedId((data && data[0]?.id ? String(data[0].id) : ""));
    setLoading(false);
  }

  const selectedApplication =
    applications.find((app) => String(app.id) === String(selectedId)) || null;

  function applicantName(app?: Application | null) {
    return app?.full_name || app?.entrepreneur_name || app?.name || "Name Pending";
  }

  function businessName(app?: Application | null) {
    return app?.business_name || "Business Name Pending";
  }

  function businessCategory(app?: Application | null) {
    return app?.business_category || app?.category || "Not provided";
  }

  function fundingGoal(app?: Application | null) {
    return Number(app?.funding_goal || app?.campaign_goal || 0);
  }

  function updateForm(id: string | number, field: string, value: any) {
    setFormById((prev) => ({
      ...prev,
      [String(id)]: {
        ...prev[String(id)],
        [field]: value,
      },
    }));
  }

  function toggleChecklist(id: string | number, item: string) {
    const current = formById[String(id)]?.checklist || {};
    updateForm(id, "checklist", {
      ...current,
      [item]: !current[item],
    });
  }

  function calculateScore(form: any) {
    const scores = [
      Number(form.commitment_score || 0),
      Number(form.organization_score || 0),
      Number(form.communication_score || 0),
      Number(form.leadership_score || 0),
      Number(form.business_potential_score || 0),
      Number(form.readiness_score || 0),
    ];

    const total = scores.reduce((sum, score) => sum + score, 0);
    return Math.round((total / 60) * 100);
  }

  function checklistProgress(form: any) {
    const checklist = form?.checklist || {};
    const completed = checklistItems.filter((item) => checklist[item]).length;
    const percent = Math.round((completed / checklistItems.length) * 100);
    return { completed, total: checklistItems.length, percent };
  }

  function generateEntrepreneurCode() {
    return `EPEW-ENT-${Date.now().toString().slice(-6)}`;
  }

  function generateBusinessCode() {
    return `EPEW-BIZ-${Date.now().toString().slice(-6)}`;
  }

  async function saveReview(app: Application) {
    const form = formById[String(app.id)];
    const score = calculateScore(form);

    setSavingId(app.id);
    setMessage("");

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        review_status: form.review_status,
        orientation_date: form.orientation_date || null,
        orientation_time: form.orientation_time || null,
        orientation_status: form.orientation_status,
        meeting_link: ZOOM_LINK,
        meeting_id: ZOOM_ID,
        meeting_passcode: ZOOM_PASSCODE,
        commitment_score: Number(form.commitment_score || 0),
        organization_score: Number(form.organization_score || 0),
        communication_score: Number(form.communication_score || 0),
        leadership_score: Number(form.leadership_score || 0),
        business_potential_score: Number(form.business_potential_score || 0),
        readiness_score: Number(form.readiness_score || 0),
        qualification_score: score,
        qualification_notes: form.qualification_notes || "",
        checklist: form.checklist || {},
      })
      .eq("id", app.id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setMessage("Application review saved successfully.");
    await loadApplications();
    setSavingId(null);
  }

  async function scheduleOrientation(app: Application) {
    const form = formById[String(app.id)];

    if (!form.orientation_date || !form.orientation_time) {
      setMessage("Please enter orientation date and time.");
      return;
    }

    setSavingId(app.id);
    setMessage("");

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        orientation_date: form.orientation_date,
        orientation_time: form.orientation_time,
        orientation_status: "Scheduled",
        review_status: "Orientation Scheduled",
        meeting_link: ZOOM_LINK,
        meeting_id: ZOOM_ID,
        meeting_passcode: ZOOM_PASSCODE,
        application_decision: "Orientation Scheduled",
      })
      .eq("id", app.id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setMessage("Orientation meeting scheduled.");
    await loadApplications();
    setSavingId(null);
  }

  async function completeOrientation(app: Application) {
    const form = formById[String(app.id)];
    const score = calculateScore(form);

    setSavingId(app.id);
    setMessage("");

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        orientation_status: "Completed",
        review_status: "Orientation Completed",
        qualification_score: score,
        qualification_notes: form.qualification_notes || "",
        checklist: {
          ...(form.checklist || {}),
          "Orientation Completed": true,
        },
        application_decision: "Orientation Completed",
      })
      .eq("id", app.id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setMessage("Orientation meeting marked completed.");
    await loadApplications();
    setSavingId(null);
  }

  async function approveAndActivate(app: Application) {
  const form = formById[String(app.id)];
  const progress = checklistProgress(form);
  const score = calculateScore(form);

  if (progress.percent < 100) {
    setMessage("Complete the qualification checklist before activation.");
    return;
  }

  setSavingId(app.id);
  setMessage("");

  const entrepreneurCode = generateEntrepreneurCode();
  const businessCode = generateBusinessCode();

  const { data: existing } = await supabase
    .from("entrepreneurs")
    .select("id")
    .eq("email", app.email || "")
    .maybeSingle();

  if (existing) {
    const engineResult = await advanceIBOSStage({
      entrepreneurId: existing.id,
      requestedStage: IBOS_STAGES.APPROVED,
      requestedBy: "Professional Qualification Center",
      notes: form?.qualification_notes || "Professional qualification approved.",
    });

    setMessage(engineResult.message);
    await loadApplications();
    setSavingId(null);
    return;
  }

  const { data: newEntrepreneur, error: insertError } = await supabase
    .from("entrepreneurs")
    .insert({
      entrepreneur_code: entrepreneurCode,
      business_code: businessCode,
      full_name: applicantName(app),
      business_name: businessName(app),
      email: app.email || null,
      phone: app.phone || null,
      business_category: businessCategory(app),
      city: app.city || null,
      state: app.state || null,
      country: app.country || null,
      business_description: app.business_description || null,
      funding_goal: fundingGoal(app),
      units_supported: 0,
      units_required: Number(app.units_required || app.weekly_unit_goal || 20),
      coach_status: "Approved",
      current_stage: IBOS_STAGES.APPROVED,
      previous_stage: IBOS_STAGES.QUALIFIED,
      next_stage: IBOS_STAGES.ANNUAL_MEETING_PENDING,
      ibos_status: "Limited Portal",
      funding_queue_active: false,
      daily_transactions_active: false,
      quarterly_reporting_active: false,
      automation_active: false,
      business_intelligence_active: false,
      interview_date: form.orientation_date || null,
      interview_time: form.orientation_time || null,
      interview_status: "Completed",
      interview_type: "Zoom",
      meeting_link: ZOOM_LINK,
      meeting_id: ZOOM_ID,
      meeting_passcode: ZOOM_PASSCODE,
      qualification_score: score,
      qualification_notes: form.qualification_notes || "",
      funding_status: "Annual Meeting Required",
      marketplace_status: "Hidden",
      video_status: "Pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !newEntrepreneur) {
    setMessage(insertError?.message || "Unable to create entrepreneur.");
    setSavingId(null);
    return;
  }

  const engineResult = await advanceIBOSStage({
    entrepreneurId: newEntrepreneur.id,
    requestedStage: IBOS_STAGES.APPROVED,
    requestedBy: "Professional Qualification Center",
    notes: form?.qualification_notes || "Professional qualification approved.",
  });

  if (!engineResult.success) {
    setMessage(engineResult.message);
    setSavingId(null);
    return;
  }

  const { error: updateError } = await supabase
    .from("entrepreneur_applications")
    .update({
      review_status: "Approved",
      orientation_status: "Completed",
      qualification_score: score,
      qualification_notes: form.qualification_notes || "",
      checklist: form.checklist || {},
      application_decision: "Approved",
      activated_at: new Date().toISOString(),
    })
    .eq("id", app.id);

  if (updateError) {
    setMessage(updateError.message);
    setSavingId(null);
    return;
  }

  setMessage(
    `Business approved successfully. Entrepreneur ID: ${entrepreneurCode} | Business ID: ${businessCode}`
  );

  await loadApplications();
  setSavingId(null);
}


  async function rejectApplication(app: Application) {
    const form = formById[String(app.id)];

    setSavingId(app.id);
    setMessage("");

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        review_status: "Rejected",
        application_decision: "Rejected",
        qualification_notes: form?.qualification_notes || "",
      })
      .eq("id", app.id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setMessage("Application rejected.");
    await loadApplications();
    setSavingId(null);
  }

  const stats = useMemo(() => {
    return {
      received: applications.length,
      pending: applications.filter(
        (a) => !a.review_status || a.review_status === "Pending Review"
      ).length,
      meetings: applications.filter(
        (a) => a.orientation_status === "Scheduled"
      ).length,
      qualified: applications.filter(
        (a) => Number(a.qualification_score || 0) >= 80
      ).length,
      activated: applications.filter((a) => a.application_decision === "Approved")
        .length,
      rejected: applications.filter((a) => a.application_decision === "Rejected")
        .length,
    };
  }, [applications]);

  const form = selectedApplication ? formById[String(selectedApplication.id)] || {} : {};
  const score = calculateScore(form);
  const progress = checklistProgress(form);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Professional Qualification & Activation Center
          </h1>
          <p className="mt-2 text-slate-600">
            EPEW IBOS gateway for reviewing applications, completing orientation,
            evaluating professional readiness, and activating businesses.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
            {message}
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <SummaryCard label="Applications Received" value={stats.received} />
          <SummaryCard label="Pending Review" value={stats.pending} color="text-orange-700" />
          <SummaryCard label="Orientation Meetings" value={stats.meetings} color="text-blue-700" />
          <SummaryCard label="Qualified" value={stats.qualified} color="text-green-700" />
          <SummaryCard label="Activated" value={stats.activated} color="text-purple-700" />
          <SummaryCard label="Rejected" value={stats.rejected} color="text-red-700" />
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Select Application
          </h2>

          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-xl border p-3"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {businessName(app)} — {applicantName(app)}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <p className="text-slate-500">Loading applications...</p>
        ) : !selectedApplication ? (
          <p className="text-slate-500">No applications found.</p>
        ) : (
          <>
            <section className="mb-6 rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                1. Review Panel
              </h2>

              <div className="grid gap-6 xl:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-bold text-slate-800">
                    Entrepreneur Information
                  </h3>
                  <InfoLine label="Name" value={applicantName(selectedApplication)} />
                  <InfoLine label="Email" value={selectedApplication.email || "Not provided"} />
                  <InfoLine label="Phone" value={selectedApplication.phone || "Not provided"} />
                  <InfoLine label="Address" value={selectedApplication.address || "Not provided"} />
                  <InfoLine label="City / State" value={`${selectedApplication.city || "—"} / ${selectedApplication.state || "—"}`} />
                  <InfoLine label="Language" value={selectedApplication.language || "Not provided"} />
                </div>

                <div>
                  <h3 className="mb-3 font-bold text-slate-800">
                    Business Information
                  </h3>
                  <InfoLine label="Business Name" value={businessName(selectedApplication)} />
                  <InfoLine label="Category" value={businessCategory(selectedApplication)} />
                  <InfoLine label="Description" value={selectedApplication.business_description || "Not provided"} />
                  <InfoLine label="Business Stage" value={selectedApplication.business_stage || "Not provided"} />
                  <InfoLine label="Funding Goal" value={`$${fundingGoal(selectedApplication).toLocaleString()}`} />
                  <InfoLine label="Units Required" value={selectedApplication.units_required || selectedApplication.weekly_unit_goal || 20} />
                </div>
              </div>
            </section>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                2. Operations Panel
              </h2>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <InfoBox label="Zoom Meeting ID" value={ZOOM_ID} />
                <InfoBox label="Passcode" value={ZOOM_PASSCODE} />
                <a
                  href={ZOOM_LINK}
                  target="_blank"
                  className="rounded-xl bg-slate-800 p-4 text-center font-bold text-white hover:bg-slate-900"
                >
                  Open Zoom
                </a>
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block font-bold text-slate-700">
                    Review Status
                  </label>
                  <select
                    value={form.review_status || "Pending Review"}
                    onChange={(e) =>
                      updateForm(selectedApplication.id, "review_status", e.target.value)
                    }
                    className="w-full rounded-xl border p-3"
                  >
                    <option>Pending Review</option>
                    <option>Under Review</option>
                    <option>Orientation Scheduled</option>
                    <option>Orientation Completed</option>
                    <option>Activated</option>
                    <option>Needs Correction</option>
                    <option>Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-bold text-slate-700">
                    Orientation Date
                  </label>
                  <input
                    type="date"
                    value={form.orientation_date || ""}
                    onChange={(e) =>
                      updateForm(selectedApplication.id, "orientation_date", e.target.value)
                    }
                    className="w-full rounded-xl border p-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-bold text-slate-700">
                    Orientation Time
                  </label>
                  <input
                    type="time"
                    value={form.orientation_time || ""}
                    onChange={(e) =>
                      updateForm(selectedApplication.id, "orientation_time", e.target.value)
                    }
                    className="w-full rounded-xl border p-3"
                  />
                </div>
              </div>

              <h3 className="mb-3 font-bold text-slate-800">
                Professional Evaluation
              </h3>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                {[
                  ["commitment_score", "Commitment"],
                  ["organization_score", "Organization"],
                  ["communication_score", "Communication"],
                  ["leadership_score", "Leadership"],
                  ["business_potential_score", "Business Potential"],
                  ["readiness_score", "Readiness"],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="mb-2 block font-bold text-slate-700">
                      {label} (0–10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={form[field] || 0}
                      onChange={(e) =>
                        updateForm(
                          selectedApplication.id,
                          field,
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded-xl border p-3"
                    />
                  </div>
                ))}
              </div>

              <h3 className="mb-3 font-bold text-slate-800">
                Qualification Checklist
              </h3>

              <div className="mb-4 grid gap-3 md:grid-cols-2">
                {checklistItems.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-3 rounded-xl border p-3"
                  >
                    <input
                      type="checkbox"
                      checked={!!form.checklist?.[item]}
                      onChange={() => toggleChecklist(selectedApplication.id, item)}
                    />
                    <span className="font-semibold text-slate-700">{item}</span>
                  </label>
                ))}
              </div>

              <div className="mb-6 rounded-xl bg-slate-50 p-4">
                <p className="font-bold text-slate-800">
                  Qualification Progress: {progress.completed} / {progress.total} completed ({progress.percent}%)
                </p>
                <div className="mt-3 h-3 rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-green-600"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block font-bold text-slate-700">
                  Qualification Notes
                </label>
                <textarea
                  value={form.qualification_notes || ""}
                  onChange={(e) =>
                    updateForm(selectedApplication.id, "qualification_notes", e.target.value)
                  }
                  className="min-h-28 w-full rounded-xl border p-3"
                  placeholder="Professional observations, readiness, risks, recommendations, missing items..."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => saveReview(selectedApplication)}
                  disabled={savingId === selectedApplication.id}
                  className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  Save Review
                </button>

                <button
                  onClick={() => scheduleOrientation(selectedApplication)}
                  disabled={savingId === selectedApplication.id}
                  className="rounded-xl bg-indigo-700 px-5 py-3 font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
                >
                  Schedule Orientation
                </button>

                <button
                  onClick={() => completeOrientation(selectedApplication)}
                  disabled={savingId === selectedApplication.id}
                  className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-50"
                >
                  Complete Meeting
                </button>

                <button
                  onClick={() => approveAndActivate(selectedApplication)}
                  disabled={savingId === selectedApplication.id || progress.percent < 100}
                  className="rounded-xl bg-purple-700 px-5 py-3 font-bold text-white hover:bg-purple-800 disabled:opacity-50"
                >
                  Approve & Activate Business
                </button>

                <button
                  onClick={() => rejectApplication(selectedApplication)}
                  disabled={savingId === selectedApplication.id}
                  className="rounded-xl bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-800 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </section>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                3. Intelligence Panel
              </h2>

              <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard label="Qualification Score" value={`${score}%`} color="text-purple-700" />
                <SummaryCard label="Business Readiness" value={score >= 80 ? "Strong" : score >= 60 ? "Moderate" : "Needs Work"} />
                <SummaryCard label="Funding Readiness" value={progress.percent === 100 ? "Ready" : "Incomplete"} />
                <SummaryCard label="Recommended Next Step" value={progress.percent === 100 ? "Activate" : "Complete Checklist"} />
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                4. Timeline
              </h2>

              <div className="grid gap-3 md:grid-cols-4">
                <TimelineItem label="Application Submitted" done={!!selectedApplication.created_at} />
                <TimelineItem label="Application Reviewed" done={form.review_status !== "Pending Review"} />
                <TimelineItem label="Orientation Scheduled" done={form.orientation_status === "Scheduled" || !!form.orientation_date} />
                <TimelineItem label="Orientation Completed" done={selectedApplication.orientation_status === "Completed"} />
                <TimelineItem label="Qualified" done={score >= 80} />
                <TimelineItem label="Activated" done={selectedApplication.application_decision === "Approved"} />
                <TimelineItem label="Funding Queue" done={selectedApplication.application_decision === "Approved"} />
                <TimelineItem label="Business Opening" done={false} />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  color = "text-slate-900",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <h2 className={`mt-2 text-xl font-bold ${color}`}>{value}</h2>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="font-bold text-slate-900">{value}</h3>
    </div>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="mb-3 rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TimelineItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        done ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className={`font-bold ${done ? "text-green-700" : "text-slate-500"}`}>
        {done ? "✓" : "○"} {label}
      </p>
    </div>
  );
}