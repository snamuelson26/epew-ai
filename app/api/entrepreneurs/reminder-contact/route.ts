import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const rawPriorityChannel =
      typeof body.priority_channel === "string"
        ? body.priority_channel.trim().toLowerCase()
        : "";

    const consent = body.weekly_information_consent === true;

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

    if (!consent) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please agree to receive weekly EPEW communications before continuing.",
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
    let userId: string | null = null;
    let applicationRemindersActive = true;

    if (email) {
      const {
        data: application,
        error: applicationLookupError,
      } = await adminSupabase
        .from("entrepreneur_applications")
        .select("id,user_id")
        .ilike("email", email)
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

        if (application.user_id) {
          const { data: authUserData, error: authUserError } =
            await adminSupabase.auth.admin.getUserById(
              application.user_id,
            );

          if (authUserError) {
            console.warn(
              "Application references an unavailable Auth user. Saving communication preferences without user_id:",
              authUserError,
            );
          } else if (authUserData?.user) {
            userId = authUserData.user.id;
          }
        }
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
      weekly_information_consent: true,
      application_reminders_active: applicationRemindersActive,
      consented_at: new Date().toISOString(),
      source: applicationId
        ? "entrepreneur_applicant_language_campaign"
        : "entrepreneur_enrollment_reminder",
      status: "active",
      updated_at: new Date().toISOString(),
    };

    let existingContactId: string | null = null;

    if (email) {
      const {
        data: existingByEmail,
        error: emailLookupError,
      } = await adminSupabase
        .from("entrepreneur_reminder_contacts")
        .select("id")
        .eq("email", email)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (emailLookupError) {
        console.error(
          "Unable to search communication preference by email:",
          emailLookupError,
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to save your communication preference.",
          },
          { status: 500 },
        );
      }

      existingContactId = existingByEmail?.id ?? null;
    }

    if (!existingContactId && phone) {
      const {
        data: existingByPhone,
        error: phoneLookupError,
      } = await adminSupabase
        .from("entrepreneur_reminder_contacts")
        .select("id")
        .eq("phone", phone)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (phoneLookupError) {
        console.error(
          "Unable to search communication preference by phone:",
          phoneLookupError,
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to save your communication preference.",
          },
          { status: 500 },
        );
      }

      existingContactId = existingByPhone?.id ?? null;
    }

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
