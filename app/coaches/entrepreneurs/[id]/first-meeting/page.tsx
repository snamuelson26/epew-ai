"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type MeetingData = {
  application: any;
  assignment: any;
  communication: any;
  meeting: any;
  coach: any;
  accessRole: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: MeetingData | any;
};

function asTextArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item ?? "")).filter(Boolean)
    : [];
}

function arrayToTextarea(value: unknown) {
  return asTextArray(value).join("\n");
}

function textareaToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function EntrepreneurFirstMeetingPage() {
  const params = useParams();
  const router = useRouter();

  const applicationId = String(params.id ?? "");

  const [data, setData] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");

  const [missionPresented, setMissionPresented] = useState(false);
  const [unitySupportExplained, setUnitySupportExplained] =
    useState(false);
  const [missionAcknowledged, setMissionAcknowledged] =
    useState(false);

  const [entrepreneurSummary, setEntrepreneurSummary] =
    useState("");
  const [businessSummary, setBusinessSummary] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [businessStatusSummary, setBusinessStatusSummary] =
    useState("");
  const [marketCustomerSummary, setMarketCustomerSummary] =
    useState("");
  const [revenueStatusSummary, setRevenueStatusSummary] =
    useState("");
  const [fundingNeedSummary, setFundingNeedSummary] =
    useState("");

  const [majorObstacles, setMajorObstacles] = useState("");
  const [businessNeeds, setBusinessNeeds] = useState("");
  const [missingDocuments, setMissingDocuments] = useState("");
  const [complianceIssues, setComplianceIssues] = useState("");
  const [risksAndConcerns, setRisksAndConcerns] = useState("");
  const [verificationItems, setVerificationItems] =
    useState("");
  const [potentialTasks, setPotentialTasks] = useState("");

  const [coachNotes, setCoachNotes] = useState("");
  const [meetingSummary, setMeetingSummary] = useState("");
  const [nextRequiredAction, setNextRequiredAction] =
    useState("");
  const [followUpAt, setFollowUpAt] = useState("");

  const [commitmentScore, setCommitmentScore] = useState("");
  const [preparationScore, setPreparationScore] = useState("");
  const [organizationScore, setOrganizationScore] =
    useState("");
  const [communicationScore, setCommunicationScore] =
    useState("");
  const [businessPotentialScore, setBusinessPotentialScore] =
    useState("");
  const [readinessScore, setReadinessScore] = useState("");

  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    loadMeeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function loadMeeting() {
    try {
      setLoading(true);
      setErrorMessage("");
      setActionMessage("");

      const response = await fetch(
        `/api/coaches/entrepreneurs/${applicationId}/first-meeting`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.data) {
        setErrorMessage(
          result.message || "Unable to load the First Meeting."
        );
        setData(null);
        return;
      }

      const meetingData = result.data as MeetingData;
      const meeting = meetingData.meeting;

      setData(meetingData);

      setScheduledAt(
        meeting?.scheduled_at
          ? String(meeting.scheduled_at).slice(0, 16)
          : ""
      );

      setMissionPresented(Boolean(meeting?.mission_presented));
      setUnitySupportExplained(
        Boolean(meeting?.unity_support_explained)
      );
      setMissionAcknowledged(
        Boolean(meeting?.mission_acknowledged)
      );

      setEntrepreneurSummary(
        meeting?.entrepreneur_summary || ""
      );
      setBusinessSummary(meeting?.business_summary || "");
      setPrimaryGoal(meeting?.primary_goal || "");
      setBusinessStatusSummary(
        meeting?.business_status_summary || ""
      );
      setMarketCustomerSummary(
        meeting?.market_customer_summary || ""
      );
      setRevenueStatusSummary(
        meeting?.revenue_status_summary || ""
      );
      setFundingNeedSummary(
        meeting?.funding_need_summary || ""
      );

      setMajorObstacles(
        arrayToTextarea(meeting?.major_obstacles)
      );
      setBusinessNeeds(arrayToTextarea(meeting?.business_needs));
      setMissingDocuments(
        arrayToTextarea(meeting?.missing_documents)
      );
      setComplianceIssues(
        arrayToTextarea(meeting?.compliance_issues)
      );
      setRisksAndConcerns(
        arrayToTextarea(meeting?.risks_and_concerns)
      );
      setVerificationItems(
        arrayToTextarea(meeting?.verification_items)
      );
      setPotentialTasks(
        arrayToTextarea(meeting?.potential_tasks)
      );

      setCoachNotes(meeting?.coach_notes || "");
      setMeetingSummary(meeting?.meeting_summary || "");
      setNextRequiredAction(
        meeting?.next_required_action || ""
      );

      setFollowUpAt(
        meeting?.follow_up_at
          ? String(meeting.follow_up_at).slice(0, 16)
          : ""
      );

      setCommitmentScore(
        meeting?.commitment_score?.toString() || ""
      );
      setPreparationScore(
        meeting?.preparation_score?.toString() || ""
      );
      setOrganizationScore(
        meeting?.organization_score?.toString() || ""
      );
      setCommunicationScore(
        meeting?.communication_score?.toString() || ""
      );
      setBusinessPotentialScore(
        meeting?.business_potential_score?.toString() || ""
      );
      setReadinessScore(
        meeting?.readiness_score?.toString() || ""
      );
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load the First Meeting."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateMeeting(
    action:
      | "prepare"
      | "schedule"
      | "start"
      | "save"
      | "complete"
  ) {
    try {
      setSaving(true);
      setActionMessage("");
      setErrorMessage("");

      const body: Record<string, unknown> = {
        action,

        missionPresented,
        unitySupportExplained,
        missionAcknowledged,

        entrepreneurSummary,
        businessSummary,
        primaryGoal,
        businessStatusSummary,
        marketCustomerSummary,
        revenueStatusSummary,
        fundingNeedSummary,

        majorObstacles: textareaToArray(majorObstacles),
        businessNeeds: textareaToArray(businessNeeds),
        missingDocuments: textareaToArray(missingDocuments),
        complianceIssues: textareaToArray(complianceIssues),
        risksAndConcerns: textareaToArray(risksAndConcerns),
        verificationItems: textareaToArray(verificationItems),
        potentialTasks: textareaToArray(potentialTasks),

        coachNotes,
        meetingSummary,
        nextRequiredAction,

        followUpAt: followUpAt
          ? new Date(followUpAt).toISOString()
          : null,

        commitmentScore:
          commitmentScore === ""
            ? null
            : Number(commitmentScore),

        preparationScore:
          preparationScore === ""
            ? null
            : Number(preparationScore),

        organizationScore:
          organizationScore === ""
            ? null
            : Number(organizationScore),

        communicationScore:
          communicationScore === ""
            ? null
            : Number(communicationScore),

        businessPotentialScore:
          businessPotentialScore === ""
            ? null
            : Number(businessPotentialScore),

        readinessScore:
          readinessScore === ""
            ? null
            : Number(readinessScore),

        assessmentNotes: {
          source: "CoachPortal",
          updatedAt: new Date().toISOString(),
        },
      };

      if (action === "schedule") {
        if (!scheduledAt) {
          setErrorMessage(
            "Please choose a meeting date and time."
          );
          return;
        }

        body.scheduledAt =
          new Date(scheduledAt).toISOString();
      }

      const response = await fetch(
        `/api/coaches/entrepreneurs/${applicationId}/first-meeting`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        setErrorMessage(
          result.message || "Unable to update the meeting."
        );
        return;
      }

      setActionMessage(
        result.message || "First Meeting updated successfully."
      );

      await loadMeeting();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the meeting."
      );
    } finally {
      setSaving(false);
    }
  }

  const preliminaryAverage = useMemo(() => {
    const values = [
      commitmentScore,
      preparationScore,
      organizationScore,
      communicationScore,
      businessPotentialScore,
      readinessScore,
    ]
      .filter((value) => value !== "")
      .map(Number)
      .filter((value) => Number.isFinite(value));

    if (values.length === 0) {
      return null;
    }

    return Math.round(
      values.reduce((total, value) => total + value, 0) /
        values.length
    );
  }, [
    commitmentScore,
    preparationScore,
    organizationScore,
    communicationScore,
    businessPotentialScore,
    readinessScore,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <h1 className="text-4xl font-extrabold text-[#06245c]">
            Preparing First Meeting...
          </h1>
          <p className="text-xl text-gray-600 mt-4">
            EMCC is loading the entrepreneur file and meeting brief.
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage && !data) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">
          <h1 className="text-4xl font-extrabold text-red-700">
            First Meeting Unavailable
          </h1>

          <p className="text-xl text-gray-700 mt-5">
            {errorMessage}
          </p>

          <button
            onClick={() =>
              router.push(
                `/coaches/entrepreneurs/${applicationId}`
              )
            }
            className="mt-8 bg-[#06245c] text-white px-7 py-4 rounded-2xl text-xl font-bold"
          >
            Back to Entrepreneur File
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const { application, assignment, communication, meeting } =
    data;

  const entrepreneurSnapshot =
    meeting?.entrepreneur_snapshot || {};

  const businessSnapshot =
    meeting?.business_snapshot || {};

  const aiPreparation =
    meeting?.ai_preparation || {};

  const missingInformation =
    asTextArray(meeting?.missing_information);

  const recommendedQuestions =
    asTextArray(meeting?.recommended_questions);

  const entrepreneurGoals =
    asTextArray(meeting?.entrepreneur_goals);

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-6 md:p-8 text-[#06245c]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() =>
              router.push(
                `/coaches/entrepreneurs/${applicationId}`
              )
            }
            className="bg-[#06245c] text-white px-6 py-3 rounded-xl text-lg font-bold"
          >
            ← Entrepreneur File
          </button>

          <div className="flex flex-wrap gap-3">
            <span className="bg-white border px-4 py-2 rounded-xl font-bold">
              Status: {meeting.meeting_status}
            </span>

            <span className="bg-white border px-4 py-2 rounded-xl font-bold">
              Preparation: {meeting.preparation_status}
            </span>
          </div>
        </div>

        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <p className="text-lg font-bold text-green-700">
            EPEW — Enterprise Meeting & Coordination Center
          </p>

          <h1 className="text-4xl md:text-6xl font-extrabold mt-3">
            Establishment Meeting
          </h1>

          <p className="text-xl md:text-2xl text-gray-700 mt-5">
            Establish the Coach relationship, understand the entrepreneur and business,
            assess readiness, identify needs, and define the immediate next stage.
          </p>
        </section>

        {actionMessage && (
          <div className="bg-green-50 border border-green-300 rounded-2xl p-5 text-green-800 text-lg font-bold">
            {actionMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-300 rounded-2xl p-5 text-red-800 text-lg font-bold">
            {errorMessage}
          </div>
        )}

        <section className="grid lg:grid-cols-3 gap-6">
          <InfoCard
            title="Entrepreneur"
            lines={[
              application.full_name || "No name",
              application.email || "No email",
              application.phone || "No phone",
            ]}
          />

          <InfoCard
            title="Business"
            lines={[
              application.business_name || "No business name",
              application.business_type || "Business type pending",
              application.status || "Pending Review",
            ]}
          />

          <InfoCard
            title="Coach Assignment"
            lines={[
              assignment.coach_name || data.coach?.full_name || "Assigned Coach",
              assignment.assignment_status || "assigned",
              assignment.acknowledgment_status || "pending",
            ]}
          />
        </section>

        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Meeting Schedule
          </h2>

          <p className="text-lg text-gray-600 mt-3">
            Current scheduled time:{" "}
            <strong>{formatDateTime(meeting.scheduled_at)}</strong>
          </p>

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) =>
                setScheduledAt(event.target.value)
              }
              className="border rounded-2xl px-5 py-4 text-lg flex-1"
            />

            <button
              disabled={saving}
              onClick={() => updateMeeting("schedule")}
              className="bg-[#06245c] text-white px-7 py-4 rounded-2xl text-lg font-bold"
            >
              Schedule Meeting
            </button>

            <button
              disabled={saving}
              onClick={() => updateMeeting("start")}
              className="bg-green-700 text-white px-7 py-4 rounded-2xl text-lg font-bold"
            >
              Start Meeting
            </button>
          </div>
        </section>

        <section className="bg-[#06245c] text-white rounded-3xl shadow-xl p-8 md:p-10">
          <p className="text-lg font-bold text-green-300">
            Mandatory Mission Opening
          </p>

          <h2 className="text-3xl md:text-4xl font-extrabold mt-3">
            EPEW Mission — Unity and Support
          </h2>

          <div className="space-y-5 text-lg md:text-xl leading-relaxed mt-6">
            <p>
              EPEW was created as a tool that everyone can use to help
              individuals, families, businesses, and communities grow
              financially.
            </p>

            <p>
              Our larger goal is to reduce poverty and expand financial
              opportunity for people from all economic backgrounds through
              entrepreneurship, participation, and community economic
              development.
            </p>

            <p>
              The <strong>US</strong> in <strong>EPEW.US</strong> means{" "}
              <strong>Unity and Support</strong>. EPEW promotes unity,
              mutual support, and community participation because lasting
              economic progress becomes stronger when people help one
              another succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <CheckBoxCard
              label="Mission Presented"
              checked={missionPresented}
              onChange={setMissionPresented}
            />

            <CheckBoxCard
              label="Unity & Support Explained"
              checked={unitySupportExplained}
              onChange={setUnitySupportExplained}
            />

            <CheckBoxCard
              label="Entrepreneur Acknowledged"
              checked={missionAcknowledged}
              onChange={setMissionAcknowledged}
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            AI First Meeting Brief
          </h2>

          <p className="text-lg text-gray-600 mt-3">
            Review the information EPEW already knows before asking new
            questions.
          </p>

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <BriefCard title="Entrepreneur Snapshot">
              <SnapshotLine
                label="Name"
                value={
                  entrepreneurSnapshot.name ||
                  application.full_name
                }
              />
              <SnapshotLine
                label="Email"
                value={
                  entrepreneurSnapshot.email ||
                  application.email
                }
              />
              <SnapshotLine
                label="Phone"
                value={
                  entrepreneurSnapshot.phone ||
                  application.phone
                }
              />
              <SnapshotLine
                label="Preferred Language"
                value={
                  communication?.communication_language ||
                  entrepreneurSnapshot.preferredLanguage ||
                  "Not provided"
                }
              />
              <SnapshotLine
                label="Priority Channel"
                value={
                  communication?.priority_channel ||
                  entrepreneurSnapshot.preferredCommunicationChannel ||
                  "Not provided"
                }
              />
            </BriefCard>

            <BriefCard title="Business Snapshot">
              <SnapshotLine
                label="Business"
                value={
                  businessSnapshot.businessName ||
                  application.business_name
                }
              />
              <SnapshotLine
                label="Type"
                value={
                  businessSnapshot.businessType ||
                  application.business_type
                }
              />
              <SnapshotLine
                label="Funding Request"
                value={
                  businessSnapshot.statedFundingRequest
                    ? `$${Number(
                        businessSnapshot.statedFundingRequest
                      ).toLocaleString()}`
                    : "Not provided"
                }
              />

              <p className="mt-4 text-gray-700 whitespace-pre-wrap">
                {businessSnapshot.description ||
                  application.business_description ||
                  "No business description provided."}
              </p>
            </BriefCard>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <ListCard
              title="Entrepreneur Goals"
              items={entrepreneurGoals}
              emptyText="No goals extracted yet."
            />

            <ListCard
              title="Missing Information"
              items={missingInformation}
              emptyText="No major missing information identified."
            />

            <ListCard
              title="Recommended Questions"
              items={recommendedQuestions}
              emptyText="No questions prepared."
            />
          </div>

          {aiPreparation?.instructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
              <h3 className="text-2xl font-bold">
                AI Guidance for the Coach
              </h3>

              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                {asTextArray(aiPreparation.instructions).map(
                  (instruction) => (
                    <li key={instruction}>{instruction}</li>
                  )
                )}
              </ul>
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Business Discovery Record
          </h2>

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <TextAreaField
              label="Entrepreneur Summary"
              value={entrepreneurSummary}
              onChange={setEntrepreneurSummary}
              placeholder="Summarize the entrepreneur, motivation, background, and current situation."
            />

            <TextAreaField
              label="Business Summary"
              value={businessSummary}
              onChange={setBusinessSummary}
              placeholder="Summarize the business concept, existing operations, or proposed enterprise."
            />

            <TextAreaField
              label="Primary Goal"
              value={primaryGoal}
              onChange={setPrimaryGoal}
              placeholder="What is the entrepreneur's most important goal?"
            />

            <TextAreaField
              label="Current Business Status"
              value={businessStatusSummary}
              onChange={setBusinessStatusSummary}
              placeholder="Describe the current stage of the business."
            />

            <TextAreaField
              label="Market / Customers"
              value={marketCustomerSummary}
              onChange={setMarketCustomerSummary}
              placeholder="Who are the target customers and what market will the business serve?"
            />

            <TextAreaField
              label="Revenue Status"
              value={revenueStatusSummary}
              onChange={setRevenueStatusSummary}
              placeholder="Describe current or expected revenue generation."
            />

            <TextAreaField
              label="Funding Need"
              value={fundingNeedSummary}
              onChange={setFundingNeedSummary}
              placeholder="Record the stated funding need and why it is needed. Do not promise funding."
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Needs, Risks & Verification
          </h2>

          <p className="text-gray-600 mt-3">
            Enter one item per line.
          </p>

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <TextAreaField
              label="Major Obstacles"
              value={majorObstacles}
              onChange={setMajorObstacles}
              placeholder={"Example:\nBusiness not registered\nNo operating budget"}
            />

            <TextAreaField
              label="Business Needs"
              value={businessNeeds}
              onChange={setBusinessNeeds}
              placeholder={"Example:\nBusiness registration\nBranding\nWebsite"}
            />

            <TextAreaField
              label="Missing Documents"
              value={missingDocuments}
              onChange={setMissingDocuments}
              placeholder={"Example:\nGovernment ID\nLease\nBusiness registration"}
            />

            <TextAreaField
              label="Compliance Issues"
              value={complianceIssues}
              onChange={setComplianceIssues}
              placeholder={"Example:\nEIN required\nPermit needs verification"}
            />

            <TextAreaField
              label="Risks / Concerns"
              value={risksAndConcerns}
              onChange={setRisksAndConcerns}
              placeholder={"Example:\nUnclear startup cost\nRevenue assumptions need validation"}
            />

            <TextAreaField
              label="Verification Items"
              value={verificationItems}
              onChange={setVerificationItems}
              placeholder={"Example:\nVerify registration status\nConfirm business location"}
            />

            <TextAreaField
              label="Potential ETVMC Tasks"
              value={potentialTasks}
              onChange={setPotentialTasks}
              placeholder={"Example:\nBusiness Registration\nLogo Design\nWebsite Development"}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-5 mt-6">
            <p className="font-bold text-yellow-900">
              Potential tasks are recommendations only. They do not become
              Vendor assignments until validated and transferred into ETVMC.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Six-Dimension Assessment
          </h2>

          <p className="text-gray-600 mt-3">
            Use 0–100. These scores support development planning and do not
            independently approve or reject an entrepreneur.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <ScoreField
              label="Commitment"
              value={commitmentScore}
              onChange={setCommitmentScore}
            />

            <ScoreField
              label="Preparation"
              value={preparationScore}
              onChange={setPreparationScore}
            />

            <ScoreField
              label="Organization"
              value={organizationScore}
              onChange={setOrganizationScore}
            />

            <ScoreField
              label="Communication"
              value={communicationScore}
              onChange={setCommunicationScore}
            />

            <ScoreField
              label="Business Potential"
              value={businessPotentialScore}
              onChange={setBusinessPotentialScore}
            />

            <ScoreField
              label="Readiness"
              value={readinessScore}
              onChange={setReadinessScore}
            />
          </div>

          <div className="bg-[#f5f7fb] rounded-2xl p-6 mt-6">
            <p className="font-bold text-gray-600">
              Current Assessment Average
            </p>

            <p className="text-5xl font-extrabold text-green-700 mt-2">
              {preliminaryAverage === null
                ? "—"
                : `${preliminaryAverage}%`}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Coach Notes & Meeting Outcome
          </h2>

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <TextAreaField
              label="Private Coach Notes"
              value={coachNotes}
              onChange={setCoachNotes}
              placeholder="Internal Coach notes for this meeting."
            />

            <TextAreaField
              label="Meeting Summary"
              value={meetingSummary}
              onChange={setMeetingSummary}
              placeholder="Summarize the meeting outcome and important findings."
            />

            <TextAreaField
              label="Immediate Next Stage / Action"
              value={nextRequiredAction}
              onChange={setNextRequiredAction}
              placeholder="Explain the immediate next stage, what the entrepreneur should do next, and who is responsible."
            />

            <div>
              <label className="block text-xl font-bold mb-3">
                Follow-Up Meeting / Action Date
              </label>

              <input
                type="datetime-local"
                value={followUpAt}
                onChange={(event) =>
                  setFollowUpAt(event.target.value)
                }
                className="w-full border rounded-2xl p-5 text-lg"
              />

              <p className="text-sm text-gray-500 mt-2">
                Leave empty if no follow-up is required.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
            <h3 className="text-2xl font-bold text-[#06245c]">
              Coach Conclusion Guidance
            </h3>
            <p className="text-gray-700 mt-3">
              Conclude by explaining only the entrepreneur&apos;s immediate next
              stage and what should happen next. Do not present the full internal
              Coach meeting roadmap.
            </p>
            <p className="text-gray-700 mt-3">
              If the entrepreneur asks how long the process takes, explain that
              timing depends on the entrepreneur&apos;s activity, preparation,
              responsiveness, and progress, but the process usually takes about
              three months. Do not present this timeframe as a guarantee.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <h2 className="text-3xl font-extrabold">
            Meeting Controls
          </h2>

          <div className="flex flex-col md:flex-row flex-wrap gap-4 mt-6">
            <button
              disabled={saving}
              onClick={() => updateMeeting("save")}
              className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-lg font-bold"
            >
              {saving ? "Saving..." : "Save Meeting Progress"}
            </button>

            <button
              disabled={saving}
              onClick={() => updateMeeting("complete")}
              className="bg-green-700 text-white px-8 py-4 rounded-2xl text-lg font-bold"
            >
              Complete Establishment Meeting
            </button>

            <button
              onClick={loadMeeting}
              disabled={saving}
              className="bg-gray-200 text-gray-800 px-8 py-4 rounded-2xl text-lg font-bold"
            >
              Refresh
            </button>
          </div>

          <p className="text-gray-600 mt-5">
            The meeting cannot be completed until the entrepreneur has
            acknowledged the EPEW mission and Unity and Support orientation.
          </p>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-7">
      <h2 className="text-2xl font-extrabold">{title}</h2>

      <div className="space-y-2 mt-4 text-gray-700">
        {lines.map((line, index) => (
          <p key={`${title}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function BriefCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#f5f7fb] border rounded-2xl p-6">
      <h3 className="text-2xl font-extrabold">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SnapshotLine({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <p className="text-gray-700 mb-3">
      <strong>{label}:</strong>{" "}
      {value === null ||
      value === undefined ||
      value === ""
        ? "Not provided"
        : String(value)}
    </p>
  );
}

function ListCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="bg-[#f5f7fb] border rounded-2xl p-6">
      <h3 className="text-2xl font-extrabold">{title}</h3>

      {items.length === 0 ? (
        <p className="text-gray-600 mt-4">{emptyText}</p>
      ) : (
        <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CheckBoxCard({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-4 bg-white/10 border border-white/30 rounded-2xl p-5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="w-6 h-6"
      />

      <span className="text-lg font-bold">{label}</span>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xl font-bold mb-3">
        {label}
      </label>

      <textarea
        rows={6}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full border rounded-2xl p-5 text-lg"
      />
    </div>
  );
}

function ScoreField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="bg-[#f5f7fb] border rounded-2xl p-5">
      <label className="block text-xl font-bold mb-3">
        {label}
      </label>

      <input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full border rounded-xl p-4 text-lg bg-white"
        placeholder="0 - 100"
      />
    </div>
  );
}
