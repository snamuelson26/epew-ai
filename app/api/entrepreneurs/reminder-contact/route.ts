import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { consentRecord, normalizeSmsPhone, SMS_DISCLOSURE_VERSION } from "@/lib/communications/smsConsentPolicy";

const LANGUAGE_MAP: Record<string, "en" | "fr" | "ht" | "es"> = {
  English: "en",
  French: "fr",
  "Haitian Creole": "ht",
  Spanish: "es",
  en: "en",
  fr: "fr",
  ht: "ht",
  es: "es",
};

const PRIORITY_CHANNEL_MAP: Record<string, "email" | "sms"> = {
  email: "email",
  text: "sms",
  sms: "sms",
};

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return NextResponse.json({ success: false, error: "Invalid request origin." }, { status: 403 });
    }
    const session = await createSessionClient();
    const { data: { user: actor }, error: authError } = await session.auth.getUser();
    if (authError || !actor?.email || !actor.email_confirmed_at) {
      return NextResponse.json({ success: false, error: "Please sign in with your verified EPEW account to save preferences." }, { status: 401 });
    }
    const body = await request.json();

    const rawCommunicationLanguage =
      typeof body.communication_language === "string"
        ? body.communication_language.trim()
        : "";

    const rawAdditionalPreferredLanguage =
      typeof body.additional_preferred_language === "string"
        ? body.additional_preferred_language.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone = normalizeSmsPhone(typeof body.phone === "string" ? body.phone : "");

    const rawPriorityChannel =
      typeof body.priority_channel === "string"
        ? body.priority_channel.trim().toLowerCase()
        : "";

    // Legacy general communications consent never grants SMS consent.
    const smsConsent = body.sms_consent === true;
    const emailConsent = body.email_information_consent === true;
    if (email && email !== actor.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Use the email address of your signed-in account." }, { status: 403 });
    }
    if (smsConsent && (!phone || body.sms_disclosure_version !== SMS_DISCLOSURE_VERSION)) {
      return NextResponse.json({ success: false, error: "Enter a valid phone number including country code and review the current SMS disclosure." }, { status: 400 });
    }
    if (emailConsent && !email) {
      return NextResponse.json({ success: false, error: "Please provide your email address for email updates." }, { status: 400 });
    }

    const communicationLanguage =
      LANGUAGE_MAP[rawCommunicationLanguage] ?? null;

    const additionalPreferredLanguage = rawAdditionalPreferredLanguage
      ? LANGUAGE_MAP[rawAdditionalPreferredLanguage] ?? null
      : null;

    const priorityChannel =
      PRIORITY_CHANNEL_MAP[rawPriorityChannel] ?? null;

    if (!communicationLanguage) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select your EPEW communication language.",
        },
        { status: 400 },
      );
    }

    if (
      rawAdditionalPreferredLanguage &&
      !additionalPreferredLanguage
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select a valid additional preferred language.",
        },
        { status: 400 },
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide an email address or phone number.",
        },
        { status: 400 },
      );
    }

    if (!priorityChannel) {
      return NextResponse.json(
        {
          success: false,
          error: "Please choose your preferred contact method.",
        },
        { status: 400 },
      );
    }

    if (priorityChannel === "email" && !email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please provide an email address if Email is your priority contact method.",
        },
        { status: 400 },
      );
    }

    if (priorityChannel === "sms" && !phone) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please provide a phone number if Text Message is your priority contact method.",
        },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Reminder contact API is missing Supabase server configuration.",
      );

      return NextResponse.json(
        {
          success: false,
          error: "Communication service is temporarily unavailable.",
        },
        { status: 500 },
      );
    }

    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    let applicationId: number | null = null;
    const userId = actor.id;
    let applicationRemindersActive = true;

    if (email) {
      const {
        data: application,
        error: applicationLookupError,
      } = await adminSupabase
        .from("entrepreneur_applications")
        .select("id,user_id")
        .eq("email", email)
        .eq("user_id", actor.id)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (applicationLookupError) {
        console.error(
          "Unable to locate entrepreneur application:",
          applicationLookupError,
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to verify your entrepreneur application at this time.",
          },
          { status: 500 },
        );
      }

      if (application) {
        applicationId = application.id;
        applicationRemindersActive = false;
      }
    }

    const contactData = {
      user_id: userId,
      application_id: applicationId,
      email: email || null,
      phone: phone || null,
      communication_language: communicationLanguage,
      additional_preferred_language: additionalPreferredLanguage,
      priority_channel: priorityChannel,
      weekly_information_consent: emailConsent,
      email_information_consent: emailConsent,
      ...consentRecord(smsConsent, phone),
      application_reminders_active: applicationRemindersActive,
      consented_at: emailConsent ? new Date().toISOString() : null,
      source: applicationId
        ? "entrepreneur_applicant_language_campaign"
        : "entrepreneur_enrollment_reminder",
      status: "active",
      updated_at: new Date().toISOString(),
    };

    // One current preference record per verified actor, including when their phone changes.
    const { data: existing, error: lookupError } = await adminSupabase
      .from("entrepreneur_reminder_contacts")
      .select("id")
      .eq("user_id", actor.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) {
      return NextResponse.json({ success: false, error: "Unable to save your communication preference." }, { status: 500 });
    }
    const existingContactId = existing?.id ?? null;

    if (existingContactId) {
      const { error: updateError } = await adminSupabase
        .from("entrepreneur_reminder_contacts")
        .update(contactData)
        .eq("id", existingContactId);

      if (updateError) {
        console.error(
          "Unable to update entrepreneur reminder contact:",
          updateError,
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to save your communication preference.",
          },
          { status: 500 },
        );
      }
    } else {
      const { error: insertError } = await adminSupabase
        .from("entrepreneur_reminder_contacts")
        .insert(contactData);

      if (insertError) {
        console.error(
          "Unable to create entrepreneur reminder contact:",
          insertError,
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to save your communication preference.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      applicant: Boolean(applicationId),
      message:
        "Your EPEW communication preferences have been successfully submitted.",
      next_step: "/entrepreneurs/questionnaire",
    });
  } catch (error) {
    console.error("Entrepreneur reminder contact error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process your request. Please try again.",
      },
      { status: 500 },
    );
  }
}
