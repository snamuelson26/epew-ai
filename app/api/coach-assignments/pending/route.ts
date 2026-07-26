// =======================================================
// EPEW – EDE – IBOS
// Pending Coach Assignment API
// =======================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
          data: [],
        },
        { status: 401 }
      );
    }

    const coachEmail = user.email
      ?.trim()
      .toLowerCase();

    if (!coachEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The authenticated coach does not have an email address.",
          data: [],
        },
        { status: 400 }
      );
    }

    const { data: assignments, error } =
      await supabase
        .from("coach_assignments")
        .select(`
          id,
          entrepreneur_id,
          coach_id,
          coach_name,
          coach_email,
          assigned_at,
          acknowledgment_deadline,
          acknowledgment_status,
          assignment_status,
          first_contact_due_at
        `)
        .eq("coach_email", coachEmail)
        .eq(
          "acknowledgment_status",
          "pending"
        )
        .order(
          "acknowledgment_deadline",
          { ascending: true }
        );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: assignments ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve pending coach assignments.";

    return NextResponse.json(
      {
        success: false,
        message,
        data: [],
      },
      { status: 500 }
    );
  }
}