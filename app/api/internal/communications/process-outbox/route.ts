import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEpewEmail } from "@/lib/email/sendEpewEmail";

function buildChooseTimeUrl(applicationId: number) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.epew.us";

  return `${baseUrl}/entrepreneurs/availability?applicationId=${applicationId}`;
}

function buildEmailHtml(
  templateKey: string,
  recipientName: string | null,
  applicationId: number,
  payload: Record<string, any>
) {
  const name = recipientName?.trim() || "EPEW Entrepreneur";
  const chooseTimeUrl = buildChooseTimeUrl(applicationId);

  if (templateKey === "establishment_meeting_no_show") {
    return `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;">
        <h2>We Missed You at Your EPEW Establishment Meeting</h2>

        <p>Dear ${name},</p>

        <p>
          We noticed that you were unable to attend your scheduled
          Establishment Meeting. We understand that schedules and
          circumstances can change.
        </p>

        <p>
          Your EPEW process is still active. You have
          <strong>7 days</strong> to select new availability and continue
          your application.
        </p>

        <p>
          Please tell us when you are available during the next seven days.
          EPEW will privately compare your availability with your Personal
          Coach's schedule and show you the appointment times that work for
          both of you.
        </p>

        <p style="margin:28px 0;">
          <a
            href="${chooseTimeUrl}"
            style="display:inline-block;padding:14px 22px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;"
          >
            Choose Your Best Time
          </a>
        </p>

        <p>
          If your work schedule, family responsibilities, or other
          circumstances make scheduling difficult, you may also tell us
          about your availability so your Personal Coach can better
          understand your situation and support you.
        </p>

        <p>
          EPEW — EDE — IBOS<br />
          Unity and Support
        </p>
      </div>
    `;
  }

  if (templateKey === "establishment_meeting_recovery_reminder") {
    const daysRemaining = Number(payload.daysRemaining ?? 1);

    return `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;">
        <h2>
          ${
            daysRemaining === 1
              ? "Final Reminder — 1 Day Remaining"
              : `${daysRemaining} Days Remaining to Reschedule`
          }
        </h2>

        <p>Dear ${name},</p>

        <p>
          Your EPEW application is still waiting for you to reschedule your
          Establishment Meeting.
        </p>

        <p>
          You currently have <strong>${daysRemaining} day${
            daysRemaining === 1 ? "" : "s"
          } remaining</strong> in your recovery period.
        </p>

        <p>
          This is not a penalty. We want to give you an opportunity to
          continue your EPEW process when your schedule allows.
        </p>

        <p style="margin:28px 0;">
          <a
            href="${chooseTimeUrl}"
            style="display:inline-block;padding:14px 22px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;"
          >
            Choose Your Best Time
          </a>
        </p>

        ${
          daysRemaining === 1
            ? `<p><strong>
                If no action is taken before the recovery period expires,
                your current application will be closed and you will need
                to submit a new application to restart the process.
               </strong></p>`
            : ""
        }

        <p>
          EPEW — EDE — IBOS<br />
          Unity and Support
        </p>
      </div>
    `;
  }

  if (templateKey === "application_closed_due_to_inactivity") {
    return `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;">
        <h2>Your EPEW Application Has Been Closed</h2>

        <p>Dear ${name},</p>

        <p>
          We did not receive a response or a request to reschedule your
          Establishment Meeting during the seven-day recovery period.
          Your current EPEW application has therefore been closed.
        </p>

        <p>
          You are welcome to apply again when you are ready to continue
          the process.
        </p>

        <p>
          EPEW — EDE — IBOS<br />
          Unity and Support
        </p>
      </div>
    `;
  }

  throw new Error(`Unsupported outbox template: ${templateKey}`);
}

async function processOutbox() {
  const now = new Date().toISOString();

  const { data: messages, error } = await supabaseAdmin
    .from("epew_communication_outbox")
    .select("*")
    .eq("status", "pending")
    .lte("due_at", now)
    .order("due_at", { ascending: true })
    .limit(20);

  if (error) throw error;

  let sent = 0;
  let failed = 0;

  for (const message of messages ?? []) {
    const { data: claimed } = await supabaseAdmin
      .from("epew_communication_outbox")
      .update({
        status: "processing",
        attempt_count: Number(message.attempt_count ?? 0) + 1,
        last_attempt_at: now,
      })
      .eq("id", message.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (!claimed) continue;

    try {
      const html = buildEmailHtml(
        message.template_key,
        message.recipient_name,
        message.application_id,
        message.payload ?? {}
      );

      const result = await sendEpewEmail({
        applicationId: message.application_id,
        recipientEmail: message.recipient_email,
        recipientName: message.recipient_name,
        messageType: message.message_type,
        subject: message.subject,
        html,
        idempotencyKey: `outbox:${message.idempotency_key}`,
        metadata: {
          recoveryCaseId: message.recovery_case_id,
          outboxId: message.id,
          ...(message.payload ?? {}),
        },
      });

      if (!result.ok && result.status !== "sent") {
        throw new Error(
          `Email delivery returned status ${result.status}.`
        );
      }

      await supabaseAdmin
        .from("epew_communication_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", message.id);

      sent += 1;
    } catch (sendError) {
      await supabaseAdmin
        .from("epew_communication_outbox")
        .update({
          status: "failed",
          error_message:
            sendError instanceof Error
              ? sendError.message
              : "Unknown email delivery error.",
        })
        .eq("id", message.id);

      failed += 1;
    }
  }

  return {
    processed: (messages ?? []).length,
    sent,
    failed,
  };
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (
    !secret ||
    authorization !== `Bearer ${secret}`
  ) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const result = await processOutbox();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("EPEW communication outbox processor failed:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to process communication outbox.",
      },
      { status: 500 }
    );
  }
}
