import { NextRequest } from "next/server";
import twilio from "twilio";

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function validateTwilioWebhook(
  request: NextRequest
) {
  const signature =
    request.headers.get("x-twilio-signature")?.trim() ?? "";

  const formData = await request.formData();

  const params: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  if (!signature) {
    return {
      valid: false,
      params,
    };
  }

  const authToken =
    requireEnvironment("TWILIO_AUTH_TOKEN");

  const publicBaseUrl =
    requireEnvironment("EPEW_PUBLIC_BASE_URL");

  const incomingUrl = new URL(request.url);

  const validationUrl = new URL(
    `${incomingUrl.pathname}${incomingUrl.search}`,
    publicBaseUrl
  ).toString();

  const valid = twilio.validateRequest(
    authToken,
    signature,
    validationUrl,
    params
  );

  return {
    valid,
    params,
  };
}