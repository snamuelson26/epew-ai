import { sendEpewEmail } from "@/lib/email/sendEpewEmail";

type SendCoachAssignmentWelcomeEmailInput = {
  applicationId?: number | null;
  assignmentId: string;
  entrepreneurEmail: string;
  entrepreneurName: string;
  businessName?: string | null;
  coachName: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendCoachAssignmentWelcomeEmail(
  input: SendCoachAssignmentWelcomeEmailInput
) {
  const {
    applicationId = null,
    assignmentId,
    entrepreneurEmail,
    entrepreneurName,
    businessName = null,
    coachName,
  } = input;

  const safeName = escapeHtml(
    entrepreneurName.trim() || "Entrepreneur"
  );

  const safeCoachName = escapeHtml(
    coachName.trim() || "your Personal Coach"
  );

  const safeBusinessName = businessName?.trim()
    ? escapeHtml(businessName.trim())
    : null;

  const businessParagraph = safeBusinessName
    ? `
      <p>
        Your Personal Coach is reviewing the information you
        provided about <strong>${safeBusinessName}</strong>,
        including your Entrepreneur Questionnaire, your business
        goals, your current preparation, and the areas where EPEW
        may be able to support your development.
      </p>
    `
    : `
      <p>
        Your Personal Coach is reviewing your Entrepreneur
        Questionnaire, your business goals, your current
        preparation, and the areas where EPEW may be able to
        support your development.
      </p>
    `;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.7;color:#1f2937;max-width:680px;margin:0 auto;">
      <h1 style="font-size:26px;margin-bottom:8px;">
        Welcome to EPEW
      </h1>

      <p style="margin-top:0;font-weight:600;">
        EPEW – EDE – IBOS
      </p>

      <p>Dear ${safeName},</p>

      <p>
        Welcome to EPEW – EDE – IBOS.
      </p>

      <p>
        We are pleased to let you know that your entrepreneur
        application has moved to the next stage of the EPEW
        Enterprise Development process.
      </p>

      <p>
        <strong>${safeCoachName}</strong> has been assigned as
        your <strong>EPEW Personal Coach</strong>.
      </p>

      ${businessParagraph}

      <p>
        Within the next <strong>24 to 48 hours</strong>, your
        Personal Coach will contact you directly to introduce
        himself and arrange your introductory interview,
        also called your <strong>Establishment Meeting</strong>.
      </p>

      <p>
        During your meeting, you and your Personal Coach will
        review what you understand about the EPEW program and
        how the EPEW support system works.
      </p>

      <p>
        Before the meeting, we encourage you to review the EPEW
        website so you can become more familiar with the program,
        its purpose, and the way entrepreneurs and supporters
        work together.
      </p>

      <p>
        You will also begin reviewing your business goals,
        identify the work that may be required, establish the
        immediate next steps in your EPEW business-development
        journey, and receive answers to any questions you may
        have.
      </p>

      <p>
        Please watch your email and your EPEW platform for
        communication from your Personal Coach.
      </p>

      <p>
        We are excited to support you as you continue building
        your business and moving toward becoming your own boss.
      </p>

      <p style="margin-top:28px;">
        Sincerely,<br />
        <strong>The EPEW – EDE – IBOS Family</strong>
      </p>

      <p style="font-style:italic;">
        Build Your Community. Build Your Business. Build Your Wealth.
      </p>
    </div>
  `;

  return sendEpewEmail({
    applicationId,
    recipientEmail: entrepreneurEmail,
    recipientName: entrepreneurName,
    messageType: "coach_assignment_welcome",
    subject: "Welcome to EPEW — Your Personal Coach Has Been Assigned",
    html,
    idempotencyKey: `coach-assignment-welcome:${assignmentId}`,
    metadata: {
      assignmentId,
      coachName,
      businessName,
      communicationStage: "coach_assigned",
      senderIdentity: "EPEW-EDE-IBOS",
    },
  });
}
