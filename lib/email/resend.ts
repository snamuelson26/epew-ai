import { Resend } from "resend";

const resendApiKey =
  process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn(
    "RESEND_API_KEY is not configured. EPEW email delivery is disabled."
  );
}

export const resend =
  resendApiKey
    ? new Resend(resendApiKey)
    : null;

export const EPEW_EMAIL_FROM =
  "EPEW <welcome@epew.us>";
