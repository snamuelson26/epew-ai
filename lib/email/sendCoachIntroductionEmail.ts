import { sendEpewEmail } from "@/lib/email/sendEpewEmail";

type SendCoachIntroductionEmailInput = {
  applicationId: number;
  assignmentId: string;
  zoomMeetingId?: string | null;
  entrepreneurEmail: string;
  entrepreneurName: string;
  businessName: string;
  coachName: string;
  coachEmail: string;
  proposedMeetingDate?: string | null;
  proposedMeetingTime?: string | null;
  zoomJoinUrl?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendCoachIntroductionEmail(
  input: SendCoachIntroductionEmailInput
) {
  const {
    applicationId,
    assignmentId,
    zoomMeetingId = null,
    entrepreneurEmail,
    entrepreneurName,
    businessName,
    coachName,
    coachEmail,
    proposedMeetingDate = null,
    proposedMeetingTime = null,
    zoomJoinUrl = null,
  } = input;

  const safeEntrepreneurName =
    escapeHtml(entrepreneurName);

  const safeBusinessName =
    escapeHtml(businessName);

  const safeCoachName =
    escapeHtml(coachName);

  const safeCoachEmail =
    escapeHtml(coachEmail);

  const meetingSection =
    proposedMeetingDate && proposedMeetingTime
      ? `
        <p>
          I would like to schedule your
          <strong>Establishment Meeting</strong> for:
        </p>

        <p>
          <strong>Date:</strong> ${escapeHtml(proposedMeetingDate)}<br />
          <strong>Time:</strong> ${escapeHtml(proposedMeetingTime)}<br />
          <strong>Meeting Method:</strong> Zoom
        </p>

        ${
          zoomJoinUrl
            ? `
              <p style="margin:24px 0;">
                <a
                  href="${escapeHtml(zoomJoinUrl)}"
                  style="
                    display:inline-block;
                    background:#111827;
                    color:#ffffff;
                    text-decoration:none;
                    font-weight:700;
                    padding:14px 22px;
                    border-radius:8px;
                  "
                >
                  Join Establishment Meeting
                </a>
              </p>

              <p style="font-size:14px;color:#4b5563;">
                Zoom Meeting Link:<br />
                <a href="${escapeHtml(zoomJoinUrl)}">
                  ${escapeHtml(zoomJoinUrl)}
                </a>
              </p>
            `
            : ""
        }

        <p>
          Please review the proposed meeting time and confirm it
          through EPEW. If the proposed time does not work for you,
          you will be able to request another available time.
        </p>
      `
      : `
        <p>
          I would now like to arrange your
          <strong>Establishment Meeting</strong>.
          You will receive the available meeting date and time
          through EPEW so that you can confirm your appointment.
        </p>
      `;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.7;color:#1f2937;max-width:680px;margin:0 auto;">
      <h1 style="font-size:26px;margin-bottom:8px;">
        Welcome — I’m Your EPEW Personal Coach
      </h1>

      <p>Dear ${safeEntrepreneurName},</p>

      <p>
        Welcome to EPEW.
      </p>

      <p>
        My name is <strong>${safeCoachName}</strong>, and I have
        been assigned as your <strong>EPEW Personal Coach</strong>.
      </p>

      <p>
        I am currently reviewing your Entrepreneur Questionnaire
        and the information you submitted for
        <strong>${safeBusinessName}</strong> so I can better
        understand your goals, your current preparation, and the
        areas where EPEW can help you move forward.
      </p>

      <p>
        During our Establishment Meeting, we will talk about how
        EPEW works and how entrepreneurs, supporters, coaches,
        partners, and communities can support one another in unity.
      </p>

      <p>
        We will also discuss your business, your current level of
        preparation, your objectives, and the immediate next steps
        for <strong>${safeBusinessName}</strong>.
      </p>

      <p>
        I will also ask you to think about your long-term vision for
        the business, including where you would like
        <strong>${safeBusinessName}</strong> to be within the next
        <strong>three years</strong>.
      </p>

      <p>
        This will help us understand not only what you want to
        accomplish now, but also the level of growth, development,
        and success you would like your business to reach.
      </p>

      ${meetingSection}

      <p>
        During the meeting, you will also have the opportunity to
        ask questions about the EPEW program and your
        business-development journey.
      </p>

      <p>
        I look forward to meeting you and working with you.
      </p>

      <p style="margin-top:28px;">
        Sincerely,<br />
        <strong>${safeCoachName}</strong><br />
        EPEW Personal Coach<br />
        ${safeCoachEmail}
      </p>

      <p style="font-size:13px;color:#6b7280;margin-top:24px;">
        EPEW – Enterprise Development Environment – IBOS
      </p>
    </div>
  `;

  return sendEpewEmail({
    applicationId,
    recipientEmail: entrepreneurEmail,
    recipientName: entrepreneurName,
    messageType: "coach_introduction",
    subject: `${coachName} — Your EPEW Personal Coach`,
    html,
    idempotencyKey:
      zoomMeetingId
        ? `coach-introduction:${assignmentId}:${zoomMeetingId}`
        : `coach-introduction:${assignmentId}`,
    from:
      `${coachName} <${coachEmail}>`,
    metadata: {
      assignmentId,
      zoomMeetingId,
      coachName,
      coachEmail,
      businessName,
      zoomJoinUrl,
      communicationStage:
        "coach_introduction",
      senderIdentity:
        "EPEW_PERSONAL_COACH",
    },
  });
}
