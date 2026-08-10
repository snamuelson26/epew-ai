import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPPORTED_LANGUAGES = [
  "English",
  "French",
  "Haitian Creole",
  "Spanish",
] as const;

const PRIORITY_CHANNELS = ["email", "text"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const communicationLanguage =
      typeof body.communication_language === "string"
        ? body.communication_language.trim()
        : "";

    const additionalPreferredLanguage =
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

    const priorityChannel =
      typeof body.priority_channel === "string"
        ? body.priority_channel.trim().toLowerCase()
        : "";

    const consent = body.weekly_information_consent === true;

    if (
      !SUPPORTED_LANGUAGES.includes(
        communicationLanguage as (typeof SUPPORTED_LANGUAGES)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select your EPEW communication language.",
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

    if (
      !PRIORITY_CHANNELS.includes(
        priorityChannel as (typeof PRIORITY_CHANNELS)[number],
      )
    ) {
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

    if (priorityChannel === "text" && !phone) {
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
      const { data: application } = await adminSupabase
        .from("entrepreneur_applications")
        .select("id,user_id")
        .eq("email", email)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (application) {
        applicationId = application.id;
        userId = application.user_id;
        applicationRemindersActive = false;
      }
    }

    const contactData = {
      user_id: userId,
      application_id: applicationId,
      email: email || null,
      phone: phone || null,
      communication_language: communicationLanguage,
      additional_preferred_language:
        additionalPreferredLanguage || null,
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
      const { data: existingByEmail } = await adminSupabase
        .from("entrepreneur_reminder_contacts")
        .select("id")
        .eq("email", email)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      existingContactId = existingByEmail?.id ?? null;
    }

    if (!existingContactId && phone) {
      const { data: existingByPhone } = await adminSupabase
        .from("entrepreneur_reminder_contacts")
        .select("id")
        .eq("phone", phone)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

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
      message: applicationId
        ? "Your EPEW communication preferences have been saved."
        : "Thank you. EPEW will remind you once a week and share valuable information in your selected language.",
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
