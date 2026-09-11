import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function easternLocalToUtc(dateValue: string, timeValue: string) {
  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeValue.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!dateMatch || !timeMatch) return null;

  const [, y, m, d] = dateMatch;
  const [, hh, mm, ss = "00"] = timeMatch;
  const wantedAsUtc = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));

  function offsetAt(instantMs: number) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(instantMs));

    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    const shownAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return shownAsUtc - instantMs;
  }

  let instant = wantedAsUtc - offsetAt(wantedAsUtc);
  instant = wantedAsUtc - offsetAt(instant);
  return new Date(instant);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const applicationId = Number(body.applicationId);
    const requestedStartAt = String(body.requestedStartAt ?? "").trim();
    const requestedLocalDate = String(body.appointmentDate ?? "").trim();
    const requestedLocalTime = String(body.appointmentTime ?? "").trim();
    const meetingProvider = String(body.meetingProvider ?? "phone").trim().toLowerCase();

    if (!Number.isInteger(applicationId) || applicationId <= 0 || (!requestedStartAt && !(requestedLocalDate && requestedLocalTime))) {
      return NextResponse.json(
        { success: false, message: "Please choose the date and time for your Pre-Qualification Interview." },
        { status: 400 },
      );
    }

    if (meetingProvider !== "phone") {
      return NextResponse.json(
        { success: false, message: "Pre-Qualification Interviews are currently conducted by phone." },
        { status: 400 },
      );
    }

    const scheduledDate = requestedLocalDate && requestedLocalTime
      ? easternLocalToUtc(requestedLocalDate, requestedLocalTime)
      : new Date(requestedStartAt);

    if (!scheduledDate || Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json(
        { success: false, message: "Please choose a valid future appointment date and time." },
        { status: 400 },
      );
    }

    const { data: application, error: applicationError } = await supabaseAdmin
      .from("entrepreneur_applications")
      .select("id,user_id,full_name,business_name,phone,questionnaire_status,interview_status")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .single();

    if (applicationError || !application) {
      return NextResponse.json({ success: false, message: "Entrepreneur application not found." }, { status: 404 });
    }

    if (String(application.questionnaire_status ?? "").toLowerCase() !== "completed") {
      return NextResponse.json(
        { success: false, message: "Please complete your Entrepreneur Questionnaire before scheduling the Pre-Qualification Interview." },
        { status: 409 },
      );
    }

    if (!application.phone) {
      return NextResponse.json(
        { success: false, message: "A registered phone number is required for the Pre-Qualification Interview." },
        { status: 409 },
      );
    }

    const easternDate = requestedLocalDate || new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(scheduledDate);

    let easternTime = requestedLocalTime ? `${requestedLocalTime}:00`.replace(/:00:00$/, ":00") : "";
    if (!requestedLocalTime) {
      const easternTimeParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).formatToParts(scheduledDate);
      const getPart = (type: string) => easternTimeParts.find((part) => part.type === type)?.value ?? "00";
      easternTime = `${getPart("hour")}:${getPart("minute")}:${getPart("second")}`;
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("entrepreneur_applications")
      .update({
        interview_date: easternDate,
        interview_time: easternTime,
        interview_type: "phone",
        interview_status: "Scheduled",
      })
      .eq("id", applicationId)
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    await supabaseAdmin.from("epew_operational_history").insert({
      application_id: applicationId,
      entrepreneur_user_id: user.id,
      event_type: "prequalification_interview_scheduled",
      event_name: "Pre-Qualification Interview Scheduled",
      event_description: "Entrepreneur selected a date and time for the EPEW Pre-Qualification Interview.",
      previous_status: application.interview_status ?? null,
      new_status: "Scheduled",
      occurred_at: now,
      actor_user_id: user.id,
      actor_role: "entrepreneur",
      actor_type: "participant",
      actor_name: application.full_name,
      decision_made_by_user_id: user.id,
      decision_made_by_role: "entrepreneur",
      decision_made_by_type: "participant",
      decision_made_by_name: application.full_name,
      decision_organization: "EPEW",
      decision_reason: "Entrepreneur selected the appointment date and time.",
      decision_at: now,
      executed_by: "EPEW Pre-Qualification Scheduling",
      recorded_by: "EPEW EDE / IBOS",
      source_system: "Entrepreneur Portal",
      communication_channel: "web",
      reference_type: "entrepreneur_application",
      reference_id: String(applicationId),
      metadata: {
        appointmentType: "prequalification_interview",
        provider: "phone",
        scheduledAt: scheduledDate.toISOString(),
        easternDate,
        easternTime,
      },
    });

    return NextResponse.json({
      success: true,
      appointment: {
        applicationId,
        type: "Pre-Qualification Interview",
        provider: "phone",
        scheduledAt: scheduledDate.toISOString(),
        easternDate,
        easternTime,
        status: "scheduled",
      },
      message: "Your EPEW Pre-Qualification Interview has been scheduled successfully.",
    });
  } catch (error) {
    console.error("Unable to schedule Pre-Qualification Interview:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to schedule your Pre-Qualification Interview right now.",
      },
      { status: 500 },
    );
  }
}
