"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const questions = [
  "Describe your business idea and explain why you want to start this business.",
  "What language are you most comfortable using during your interview and coaching sessions?",
  "What do you expect from the EPEW team and your assigned coach?",
  "Where do you see yourself and your business in five years?",
  "What problem does your business solve?",
  "Who are your target customers?",
  "What industry are you entering?",
  "Are you starting completely from scratch, buying an existing business, or expanding an existing business?",
  "What product or service will you offer?",
  "How much funding do you need and why?",
  "How will you use the funding received?",
  "How will your business generate income?",
  "How much time can you commit weekly to building this business?",
  "Who will help you promote or support your business?",
  "Do you currently have a profession or specialized skills?",
  "Are you currently employed or self-employed?",
  "Approximately how much income do you earn per year?",
  "What experience or skills do you have that will help you succeed?",
  "Are you prepared for the possibility of failure, changes, or business pivots?",
  "What are your next three steps before launching?",
];

export default function CoachEntrepreneurFilePage() {
  const params = useParams();
  const router = useRouter();
  const routeId = String(params.id);

  const [application, setApplication] = useState<any>(null);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [coachNotes, setCoachNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [interviewLanguage, setInterviewLanguage] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [introductionMessage, setIntroductionMessage] = useState("");
  const [savingInterview, setSavingInterview] = useState(false);

  const [preparationScore, setPreparationScore] = useState("");
  const [organizationScore, setOrganizationScore] = useState("");
  const [commitmentScore, setCommitmentScore] = useState("");
  const [savingEvaluation, setSavingEvaluation] = useState(false);

  const [presentationStatus, setPresentationStatus] = useState("");
  const [videoStatus, setVideoStatus] = useState("");
  const [marketplaceVisibility, setMarketplaceVisibility] = useState("");
  const [savingMarketplace, setSavingMarketplace] = useState(false);

 const [groupNumber, setGroupNumber] = useState("");
const [groupType, setGroupType] = useState("");
const [annualMeetingDate, setAnnualMeetingDate] = useState("");
const [annualMeetingStatus, setAnnualMeetingStatus] = useState("");
const [attendanceStatus, setAttendanceStatus] = useState("");
const [savingAnnualMeeting, setSavingAnnualMeeting] = useState(false);

const [legalStructureStatus, setLegalStructureStatus] = useState("");
const [einStatus, setEinStatus] = useState("");
const [bankAccountStatus, setBankAccountStatus] = useState("");
const [committeeRecommendation, setCommitteeRecommendation] = useState("");
const [savingFundingReview, setSavingFundingReview] = useState(false);

const [approvedAmount, setApprovedAmount] = useState("");
const [committeeComments, setCommitteeComments] = useState("");
const [savingFundingApproval, setSavingFundingApproval] = useState(false);

const [businessOpeningDate, setBusinessOpeningDate] = useState("");
const [grandOpeningDate, setGrandOpeningDate] = useState("");
const [businessWebsite, setBusinessWebsite] = useState("");
const [marketplaceCategory, setMarketplaceCategory] = useState("");
const [operatingStatus, setOperatingStatus] = useState("");
const [firstQuarterlyReportDate, setFirstQuarterlyReportDate] = useState("");
const [savingBusinessOpening, setSavingBusinessOpening] = useState(false);

  useEffect(() => {
    loadApplication();
  }, []);

  async function loadApplication() {
    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*");

    if (error) {
      console.log("Supabase error:", error);
      setLoading(false);
      return;
    }

    setAllApplications(data || []);

    const found = data?.find(
      (item) => String(item.id).trim() === routeId.trim()
    );

    setApplication(found || null);

    setCoachNotes(found?.coach_notes || "");

    setInterviewDate(found?.interview_date || "");
    setInterviewTime(found?.interview_time || "");
    setInterviewType(found?.interview_type || "");
    setInterviewLanguage(found?.interview_language || "");
    setMeetingLink(found?.meeting_link || "");
   setIntroductionMessage(
  found?.introduction_message ||
    `Congratulations on taking this important step toward entrepreneurship.

I have received your application and questionnaire. I am excited to work with you and help guide you through the EPEW preparation and interview process.

I will review your information and look forward to meeting with you on the scheduled interview date.

Welcome to the EPEW family.`
);

setGroupNumber(found?.group_number || "");
setGroupType(found?.group_type || "");
setAnnualMeetingDate(found?.annual_meeting_date || "");
setAnnualMeetingStatus(found?.annual_meeting_status || "");
setAttendanceStatus(found?.attendance_status || "");

setLegalStructureStatus(found?.legal_structure_status || "");
setEinStatus(found?.ein_status || "");
setBankAccountStatus(found?.bank_account_status || "");
setCommitteeRecommendation(found?.committee_recommendation || "");

setApprovedAmount(found?.approved_amount?.toString() || "");
setCommitteeComments(found?.committee_comments || "");

setBusinessOpeningDate(found?.business_opening_date || "");
setGrandOpeningDate(found?.grand_opening_date || "");
setBusinessWebsite(found?.business_website || "");
setMarketplaceCategory(found?.marketplace_category || "");
setOperatingStatus(found?.operating_status || "");
setFirstQuarterlyReportDate(found?.first_quarterly_report_date || "");

    setPreparationScore(found?.preparation_score?.toString() || "");
    setOrganizationScore(found?.organization_score?.toString() || "");
    setCommitmentScore(found?.commitment_score?.toString() || "");

    setPresentationStatus(found?.presentation_status || "");
    setVideoStatus(found?.video_status || "");
    setMarketplaceVisibility(found?.marketplace_visibility || "");

    setLoading(false);
  }

  async function updateStatus(newStatus: string) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({ status: newStatus })
      .eq("id", application.id);

    if (error) {
      console.log(error);
      alert("Unable to update status.");
      return;
    }

    alert(`Status updated to: ${newStatus}`);
    loadApplication();
  }

  async function saveCoachNotes() {
    setSavingNotes(true);

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({ coach_notes: coachNotes })
      .eq("id", application.id);

    setSavingNotes(false);

    if (error) {
      console.log(error);
      alert("Unable to save notes.");
      return;
    }

    alert("Coach notes saved successfully.");
    loadApplication();
  }

  async function saveInterviewSchedule() {
    if (!interviewDate || !interviewTime) {
      alert("Please select both an interview date and time.");
      return;
    }

    setSavingInterview(true);

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        interview_date: interviewDate,
        interview_time: interviewTime,
        interview_type: interviewType,
        interview_language: interviewLanguage,
        meeting_link: meetingLink,
        introduction_message: introductionMessage,
        interview_status: "Scheduled",
      })
      .eq("id", application.id);

    setSavingInterview(false);

    if (error) {
      console.log(error);
      alert("Unable to save interview schedule.");
      return;
    }

    alert("Interview scheduled successfully.");
    loadApplication();
  }

  async function saveReadinessEvaluation() {
    setSavingEvaluation(true);

    const preparation = Number(preparationScore || 0);
    const organization = Number(organizationScore || 0);
    const commitment = Number(commitmentScore || 0);
    const overall = Math.round((preparation + organization + commitment) / 3);

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        preparation_score: preparation,
        organization_score: organization,
        commitment_score: commitment,
        readiness_score: overall,
      })
      .eq("id", application.id);

    setSavingEvaluation(false);

    if (error) {
      console.log(error);
      alert("Unable to save readiness evaluation.");
      return;
    }

    alert("Readiness evaluation saved successfully.");
    loadApplication();
  }

  async function saveMarketplaceApproval() {
  
    setSavingMarketplace(true);

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        presentation_status: presentationStatus,
        video_status: videoStatus,
        marketplace_visibility: marketplaceVisibility,
      })
      .eq("id", application.id);

    setSavingMarketplace(false);

    if (error) {
      console.log(error);
      alert("Unable to save marketplace approval.");
      return;
    }

    alert("Marketplace information saved.");
    loadApplication();
  }

  async function saveAnnualMeetingInfo() {
  setSavingAnnualMeeting(true);

  const { error } = await supabase
    .from("entrepreneur_applications")
    .update({
      group_number: groupNumber,
      group_type: groupType,
      annual_meeting_date: annualMeetingDate,
      annual_meeting_status: annualMeetingStatus,
      attendance_status: attendanceStatus,
    })
    .eq("id", application.id);

  setSavingAnnualMeeting(false);

  if (error) {
    console.log(error);
    alert("Unable to save annual meeting information.");
    return;
  }

  alert("Annual meeting information saved.");

  loadApplication();
}

async function saveFundingReadinessReview() {
  setSavingFundingReview(true);

  const { error } = await supabase
    .from("entrepreneur_applications")
    .update({
      legal_structure_status: legalStructureStatus,
      ein_status: einStatus,
      bank_account_status: bankAccountStatus,
      committee_recommendation: committeeRecommendation,
    })
    .eq("id", application.id);

  setSavingFundingReview(false);

  if (error) {
    console.log(error);
    alert("Unable to save funding readiness review.");
    return;
  }

  alert("Funding readiness review saved.");

  loadApplication();
}
async function saveFundingApproval() {
  setSavingFundingApproval(true);

  const { error } = await supabase
    .from("entrepreneur_applications")
    .update({
      approved_amount: Number(approvedAmount || 0),
      committee_comments:
  committeeComments ||
  `Funding Committee Decision: ${committeeRecommendation}.
Approved Amount: $${Number(approvedAmount || 0).toLocaleString()}.
Status reviewed by EPEW Funding Committee.`,
    })
    .eq("id", application.id);

  setSavingFundingApproval(false);

  if (error) {
    console.log(error);
    alert("Unable to save funding approval.");
    return;
  }

  alert("Funding approval saved successfully.");

  loadApplication();
}
function addMonths(dateString: string, months: number) {
  if (!dateString) return null;

  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);

  return date.toISOString().split("T")[0];
}

async function saveBusinessOpening() {
  setSavingBusinessOpening(true);

  const q1Date = addMonths(businessOpeningDate, 3);
  const q2Date = addMonths(businessOpeningDate, 6);
  const q3Date = addMonths(businessOpeningDate, 9);
  const q4Date = addMonths(businessOpeningDate, 12);

  const { error } = await supabase
    .from("entrepreneur_applications")
    .update({
      business_opening_date: businessOpeningDate,
      grand_opening_date: grandOpeningDate,
      business_website: businessWebsite,
      marketplace_category: marketplaceCategory,
      operating_status: operatingStatus,

      first_quarterly_report_date: q1Date,
      q1_report_due_date: q1Date,
      q2_report_due_date: q2Date,
      q3_report_due_date: q3Date,
      q4_report_due_date: q4Date,

      opening_notes: `Business officially opened on ${businessOpeningDate}.
Category: ${marketplaceCategory}.
Operating Status: ${operatingStatus}.

Quarterly Report:
First Quarterly Report Due Date: ${q1Date}.
Second Quarterly Report Due Date: ${q2Date}.
Third Quarterly Report Due Date: ${q3Date}.
Fourth Quarterly Report Due Date: ${q4Date}.`,
    })
    .eq("id", application.id);

  setSavingBusinessOpening(false);

  if (error) {
    console.log(error);
    alert("Unable to save business opening.");
    return;
  }

  alert("Business opening information saved.");
  loadApplication();
}
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">
          Loading entrepreneur file...
        </p>
      </main>
    );
  }

  if (!application) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-10">
          <h1 className="text-4xl font-bold text-red-600 mb-6">
            Entrepreneur not found
          </h1>

          <p className="text-2xl mb-4">
            <strong>Route ID received:</strong> {routeId}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            Available Application IDs
          </h2>

          <div className="space-y-3 text-xl">
            {allApplications.map((app) => (
              <p key={app.id} className="bg-gray-100 p-4 rounded-xl">
                ID: <strong>{String(app.id)}</strong> — {app.full_name || "No Name"} — {app.email || "No Email"}
              </p>
            ))}
          </div>

          <button
            onClick={() => router.push("/coaches/entrepreneurs")}
            className="mt-8 bg-[#06245c] text-white px-6 py-3 rounded-xl text-xl font-bold"
          >
            Back to Entrepreneurs
          </button>
        </div>
      </main>
    );
  }

  const overallScore = Math.round(
    (Number(preparationScore || 0) +
      Number(organizationScore || 0) +
      Number(commitmentScore || 0)) /
      3
  );

  return (
    <main className="bg-[#f5f7fb] min-h-screen p-8 text-[#06245c]">
      <div className="max-w-7xl mx-auto space-y-10">
        <button
          onClick={() => router.push("/coaches/entrepreneurs")}
          className="bg-[#06245c] text-white px-6 py-3 rounded-xl text-xl font-bold"
        >
          ← Back to Entrepreneurs
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h1 className="text-5xl font-extrabold mb-5">
            Entrepreneur File
          </h1>
          <p className="text-2xl text-gray-700">
            Complete review of entrepreneur preparation and readiness.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Entrepreneur Information
          </h2>

          <div className="grid md:grid-cols-2 gap-6 text-2xl text-gray-700">
            <p><strong>ID:</strong> {application.id}</p>
            <p><strong>Name:</strong> {application.full_name || "Pending"}</p>
            <p><strong>Email:</strong> {application.email || "Pending"}</p>
            <p><strong>Phone:</strong> {application.phone || "Pending"}</p>
            <p><strong>Business Name:</strong> {application.business_name || "Pending"}</p>
            <p><strong>Business Type:</strong> {application.business_type || "Pending"}</p>
            <p><strong>Status:</strong> {application.status || "Pending Review"}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-6">Business Description</h2>
          <p className="text-2xl text-gray-700 leading-relaxed">
            {application.business_description ||
              "No business description available."}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Entrepreneur Questionnaire
          </h2>

          {!application.questionnaire_answers ? (
            <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-8">
              <p className="text-2xl text-yellow-700 font-bold">
                Questionnaire has not been submitted yet.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="bg-[#f5f7fb] rounded-2xl border p-8"
                >
                  <h3 className="text-2xl font-bold text-[#06245c] mb-4">
                    Question {index + 1}
                  </h3>

                  <p className="text-xl font-semibold text-gray-700 mb-5">
                    {question}
                  </p>

                  <div className="bg-white border rounded-xl p-6">
                    <p className="text-xl text-gray-700 whitespace-pre-wrap">
                      {application.questionnaire_answers[index] ||
                        "No answer provided."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">Coach Notes</h2>

          <textarea
            rows={8}
            value={coachNotes}
            onChange={(e) => setCoachNotes(e.target.value)}
            className="w-full border rounded-2xl p-5 text-xl"
            placeholder="Write coach notes here..."
          />

          <button
            onClick={saveCoachNotes}
            disabled={savingNotes}
            className="mt-6 bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]"
          >
            {savingNotes ? "Saving..." : "Save Coach Notes"}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Interview Information
          </h2>

          <div className="grid md:grid-cols-2 gap-8 text-2xl text-gray-700">
            <p><strong>Interview Date:</strong> {application.interview_date || "Not Scheduled"}</p>
            <p><strong>Interview Time:</strong> {application.interview_time || "Pending"}</p>
            <p><strong>Interview Type:</strong> {application.interview_type || "Pending"}</p>
            <p><strong>Interview Language:</strong> {application.interview_language || "Pending"}</p>
            <p><strong>Interview Status:</strong> {application.interview_status || "Pending"}</p>
            <p><strong>Readiness Score:</strong> {application.readiness_score || 0}%</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Funding Information
          </h2>

          <div className="grid md:grid-cols-2 gap-8 text-2xl text-gray-700">
            <p><strong>Funding Goal:</strong> ${Number(application.funding_request || 0).toLocaleString()}</p>
            <p><strong>Units Required:</strong> {application.units_required || 20}</p>
            <p><strong>Units Supported:</strong> {application.units_supported || 0}</p>
            <p><strong>Funding Queue Position:</strong> {application.funding_queue_position || "Pending"}</p>
            <p><strong>Projected Funding Start Date:</strong> {application.estimated_funding_date || "Pending"}</p>
            <p><strong>Status:</strong> {application.status || "Pending Review"}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
          <h2 className="text-4xl font-bold mb-8">Coach Actions</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
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
            ].map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                className="bg-[#06245c] text-white rounded-2xl p-5 text-xl font-bold hover:bg-green-700"
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
          <h2 className="text-4xl font-bold mb-8">
            Interview Scheduler
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="md:col-span-2 bg-[#f5f7fb] rounded-2xl p-8">
  <h3 className="text-3xl font-bold mb-6">
    Quarterly Report
  </h3>

  <div className="grid md:grid-cols-2 gap-6 text-2xl text-gray-700">
    <p>
      <strong>First Quarterly Report Due Date:</strong>{" "}
      {addMonths(businessOpeningDate, 3) || "Pending"}
    </p>

    <p>
      <strong>Second Quarterly Report Due Date:</strong>{" "}
      {addMonths(businessOpeningDate, 6) || "Pending"}
    </p>

    <p>
      <strong>Third Quarterly Report Due Date:</strong>{" "}
      {addMonths(businessOpeningDate, 9) || "Pending"}
    </p>

    <p>
      <strong>Fourth Quarterly Report Due Date:</strong>{" "}
      {addMonths(businessOpeningDate, 12) || "Pending"}
    </p>
  </div>
</div>
            </div>

            <div>
              <label className="block text-xl font-bold mb-3">
                Interview Time
              </label>
              <input
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
              />
            </div>

            <div>
              <label className="block text-xl font-bold mb-3">
                Interview Type
              </label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
              >
                <option value="">Select Type</option>
                <option value="Zoom">Zoom</option>
                <option value="Phone">Phone</option>
                <option value="In Person">In Person</option>
              </select>
            </div>

            <div>
              <label className="block text-xl font-bold mb-3">
                Interview Language
              </label>
              <select
                value={interviewLanguage}
                onChange={(e) => setInterviewLanguage(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
              >
                <option value="">Select Language</option>
                <option value="English">English</option>
                <option value="Haitian Creole">Haitian Creole</option>
                <option value="French">French</option>
                <option value="Spanish">Spanish</option>
                <option value="Tagalog">Tagalog</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xl font-bold mb-3">
                Zoom / Meeting Link
              </label>
              <input
                type="text"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xl font-bold mb-3">
                Warm Introduction Message
              </label>
              <textarea
                rows={6}
                value={introductionMessage}
                onChange={(e) => setIntroductionMessage(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
              />
            </div>
          </div>

          <button
            onClick={saveInterviewSchedule}
            disabled={savingInterview}
            className="mt-8 bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]"
          >
            {savingInterview ? "Saving..." : "Save Interview Schedule"}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
          <h2 className="text-4xl font-bold mb-8">
            Readiness Evaluation
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <label className="block text-xl font-bold mb-3">
                Preparation Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={preparationScore}
                onChange={(e) => setPreparationScore(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
                placeholder="0 - 100"
              />
            </div>

            <div>
              <label className="block text-xl font-bold mb-3">
                Organization Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={organizationScore}
                onChange={(e) => setOrganizationScore(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
                placeholder="0 - 100"
              />
            </div>

            <div>
              <label className="block text-xl font-bold mb-3">
                Commitment Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={commitmentScore}
                onChange={(e) => setCommitmentScore(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
                placeholder="0 - 100"
              />
            </div>
          </div>

          <div className="bg-[#f5f7fb] rounded-2xl p-8 mt-8">
            <h3 className="text-2xl font-bold">
              Overall Readiness Score
            </h3>
            <p className="text-5xl font-extrabold text-green-700 mt-4">
              {overallScore}%
            </p>
          </div>

          <button
            onClick={saveReadinessEvaluation}
            disabled={savingEvaluation}
            className="mt-8 bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]"
          >
            {savingEvaluation ? "Saving..." : "Save Evaluation"}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
          <h2 className="text-4xl font-bold mb-8">
            Marketplace Approval
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <label className="block text-xl font-bold mb-3">
                Presentation Status
              </label>
              <select
                value={presentationStatus}
                onChange={(e) => setPresentationStatus(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
              >
                <option value="">Select</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            <div>
              <label className="block text-xl font-bold mb-3">
                Video Status
              </label>
              <select
                value={videoStatus}
                onChange={(e) => setVideoStatus(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
              >
                <option value="">Select</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            <div>
              <label className="block text-xl font-bold mb-3">
                Marketplace Visibility
              </label>
              <select
                value={marketplaceVisibility}
                onChange={(e) => setMarketplaceVisibility(e.target.value)}
                className="w-full border rounded-2xl p-5 text-xl"
              >
                <option value="">Hidden</option>
                <option value="Visible">Visible</option>
              </select>
            </div>
          </div>

          <button
            onClick={saveMarketplaceApproval}
            disabled={savingMarketplace}
            className="mt-8 bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]"
          >
            {savingMarketplace ? "Saving..." : "Approve Marketplace Listing"}
          </button>
        </div>
        {/* ANNUAL MEETING QUALIFICATION */}
<div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
  <h2 className="text-4xl font-bold mb-8">
    Annual Meeting Qualification
  </h2>

  <div className="grid md:grid-cols-2 gap-8">
    <div>
      <label className="block text-xl font-bold mb-3">
        Group Number
      </label>
      <input
        type="text"
        value={groupNumber}
        onChange={(e) => setGroupNumber(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
        placeholder="Example: Group 1"
      />
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Group Type
      </label>
      <select
        value={groupType}
        onChange={(e) => setGroupType(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      >
        <option value="">Select Type</option>
        <option value="Weekly">Weekly</option>
        <option value="Monthly">Monthly</option>
        <option value="Annual">Annual</option>
      </select>
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Annual Meeting Date
      </label>
      <input
        type="date"
        value={annualMeetingDate}
        onChange={(e) => setAnnualMeetingDate(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      />
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Annual Meeting Status
      </label>
      <select
        value={annualMeetingStatus}
        onChange={(e) => setAnnualMeetingStatus(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      >
        <option value="">Select Status</option>
        <option value="Pending">Pending</option>
        <option value="Qualified">Qualified</option>
        <option value="Scheduled">Scheduled</option>
        <option value="Completed">Completed</option>
      </select>
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Attendance Status
      </label>
      <select
        value={attendanceStatus}
        onChange={(e) => setAttendanceStatus(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      >
        <option value="">Select Attendance</option>
        <option value="Pending">Pending</option>
        <option value="Attended">Attended</option>
        <option value="Absent">Absent</option>
      </select>
    </div>
  </div>

  <button
    onClick={saveAnnualMeetingInfo}
    disabled={savingAnnualMeeting}
    className="mt-8 bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]"
  >
    {savingAnnualMeeting
      ? "Saving..."
      : "Save Annual Meeting Information"}
  </button>
</div>
{/* FUNDING READINESS REVIEW */}
<div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
  <h2 className="text-4xl font-bold mb-8">
    Funding Readiness Review
  </h2>

  <div className="grid md:grid-cols-2 gap-8">
    <div>
      <label className="block text-xl font-bold mb-3">
        Legal Structure Status
      </label>
      <select
        value={legalStructureStatus}
        onChange={(e) => setLegalStructureStatus(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      >
        <option value="">Select Status</option>
        <option value="Pending">Pending</option>
        <option value="Completed">Completed</option>
        <option value="Needs Correction">Needs Correction</option>
      </select>
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        EIN Status
      </label>
      <select
        value={einStatus}
        onChange={(e) => setEinStatus(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      >
        <option value="">Select Status</option>
        <option value="Pending">Pending</option>
        <option value="Completed">Completed</option>
        <option value="Needs Correction">Needs Correction</option>
      </select>
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Business Bank Account Status
      </label>
      <select
        value={bankAccountStatus}
        onChange={(e) => setBankAccountStatus(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      >
        <option value="">Select Status</option>
        <option value="Pending">Pending</option>
        <option value="Completed">Completed</option>
        <option value="Needs Correction">Needs Correction</option>
      </select>
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Committee Recommendation
      </label>
      <select
        value={committeeRecommendation}
        onChange={(e) => setCommitteeRecommendation(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      >
        <option value="">Select Recommendation</option>
        <option value="Recommend Approval">Recommend Approval</option>
        <option value="Needs More Preparation">Needs More Preparation</option>
        <option value="Not Recommended Yet">Not Recommended Yet</option>
      </select>
    </div>
  </div>

  <button
    onClick={saveFundingReadinessReview}
    disabled={savingFundingReview}
    className="mt-8 bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]"
  >
    {savingFundingReview
      ? "Saving..."
      : "Save Funding Readiness Review"}
  </button>
</div>
{/* FUNDING COMMITTEE APPROVAL */}
<div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
  <h2 className="text-4xl font-bold mb-8">
    Funding Committee Approval
  </h2>

  <div className="grid md:grid-cols-2 gap-8">
    <div>
      <label className="block text-xl font-bold mb-3">
        Approved Amount
      </label>
      <input
        type="number"
        value={approvedAmount}
        onChange={(e) => setApprovedAmount(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
        placeholder="Example: 100000"
      />
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Committee Decision
      </label>
      <select
        value={committeeRecommendation}
        onChange={(e) => setCommitteeRecommendation(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      >
        <option value="">Select Decision</option>
        <option value="Approved">Approved</option>
        <option value="Approved With Conditions">Approved With Conditions</option>
        <option value="Needs More Preparation">Needs More Preparation</option>
        <option value="Not Approved Yet">Not Approved Yet</option>
      </select>
    </div>

    <div className="md:col-span-2">
      <label className="block text-xl font-bold mb-3">
        Committee Comments
      </label>
      <textarea
        rows={6}
        value={committeeComments}
        onChange={(e) => setCommitteeComments(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
        placeholder="Write committee comments, conditions, approval notes, or funding instructions..."
      />
    </div>
  </div>

  <button
    onClick={saveFundingApproval}
    disabled={savingFundingApproval}
    className="mt-8 bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]"
  >
    {savingFundingApproval
      ? "Saving..."
      : "Save Funding Approval"}
  </button>
</div>
{/* BUSINESS OPENING */}
<div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
  <h2 className="text-4xl font-bold mb-8">
    Business Opening
  </h2>

  <div className="grid md:grid-cols-2 gap-8">
    <div>
      <label className="block text-xl font-bold mb-3">
        Business Opening Date
      </label>
      <input
        type="date"
        value={businessOpeningDate}
        onChange={(e) => setBusinessOpeningDate(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      />
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Grand Opening Date
      </label>
      <input
        type="date"
        value={grandOpeningDate}
        onChange={(e) => setGrandOpeningDate(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      />
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Business Website
      </label>
      <input
        type="text"
        value={businessWebsite}
        onChange={(e) => setBusinessWebsite(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
        placeholder="https://..."
      />
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Marketplace Category
      </label>
      <input
        type="text"
        value={marketplaceCategory}
        onChange={(e) => setMarketplaceCategory(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
        placeholder="Restaurant, Retail, Technology, Service..."
      />
    </div>

    <div>
      <label className="block text-xl font-bold mb-3">
        Operating Status
      </label>
      <select
        value={operatingStatus}
        onChange={(e) => setOperatingStatus(e.target.value)}
        className="w-full border rounded-2xl p-5 text-xl"
      >
        <option value="">Select Status</option>
        <option value="Preparing to Open">Preparing to Open</option>
        <option value="Open">Open</option>
        <option value="Active">Active</option>
        <option value="Temporarily Closed">Temporarily Closed</option>
      </select>
    </div>
  </div>

  <button
    onClick={saveBusinessOpening}
    disabled={savingBusinessOpening}
    className="mt-8 bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]"
  >
    {savingBusinessOpening
      ? "Saving..."
      : "Save Business Opening"}
  </button>
</div>

<div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
  <h2 className="text-4xl font-bold mb-8">
    Quarterly Report Status
  </h2>

  <div className="grid md:grid-cols-2 gap-8">
    <ReportStatusCard
      title="First Quarterly Report"
      dueDate={application.q1_report_due_date}
      status={application.q1_report_status}
    />

    <ReportStatusCard
      title="Second Quarterly Report"
      dueDate={application.q2_report_due_date}
      status={application.q2_report_status}
    />

    <ReportStatusCard
      title="Third Quarterly Report"
      dueDate={application.q3_report_due_date}
      status={application.q3_report_status}
    />

    <ReportStatusCard
      title="Fourth Quarterly Report"
      dueDate={application.q4_report_due_date}
      status={application.q4_report_status}
    />
  </div>
</div>
      </div>
    </main>
  );
} // closes CoachEntrepreneurFilePage

function ReportStatusCard({
  title,
  dueDate,
  status,
}: {
  title: string;
  dueDate: string | null;
  status: string | null;
}) {

  const today = new Date();
  const due = dueDate ? new Date(dueDate) : null;

  let colorClass = "bg-yellow-100 text-yellow-800 border-yellow-300";
  let label = "Pending";

  if (status === "Submitted") {
    colorClass = "bg-green-100 text-green-800 border-green-300";
    label = "Submitted";
  } else if (due && due < today) {
    colorClass = "bg-red-100 text-red-800 border-red-300";
    label = "Past Due";
  } else if (due) {
    const daysRemaining = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 30) {
      colorClass = "bg-blue-100 text-blue-800 border-blue-300";
      label = `Due in ${daysRemaining} days`;
    }
  }

  return (
    <div className={`border rounded-3xl p-8 ${colorClass}`}>
      <h3 className="text-3xl font-bold mb-4">
        {title}
      </h3>

      <p className="text-2xl mb-3">
        <strong>Due Date:</strong>{" "}
        {dueDate || "Pending"}
      </p>

      <p className="text-2xl font-bold">
        <strong>Status:</strong> {label}
      </p>
    </div>
  );
}