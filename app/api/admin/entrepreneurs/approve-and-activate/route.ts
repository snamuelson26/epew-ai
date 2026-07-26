// =======================================================
// EPEW – EDE – IBOS
// Approve and Activate Entrepreneur API
//
// All official entrepreneur creation and lifecycle
// transitions must run securely on the server.
// =======================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EntrepreneurLifecycleOrchestrator } from "@/lib/workflows/EntrepreneurLifecycleOrchestrator";

// =======================================================
// Request types
// =======================================================

interface ApproveAndActivateRequest {
  applicationId?: string | number;

  fullName: string;
  businessName: string;

  email?: string | null;
  phone?: string | null;

  businessCategory?: string | null;
  businessDescription?: string | null;

  city?: string | null;
  state?: string | null;
  country?: string | null;

  fundingGoal?: number | null;
  unitsRequired?: number | null;

  orientationDate?: string | null;
  orientationTime?: string | null;

  qualificationScore?: number | null;
  qualificationNotes?: string | null;

  meetingLink?: string | null;
  meetingId?: string | null;
  meetingPasscode?: string | null;

  requestedBy?: string | null;
}

// =======================================================
// Helpers
// =======================================================

function generateEntrepreneurCode(): string {
  const year = new Date().getFullYear();

  const randomPart = Math.floor(
    100000 + Math.random() * 900000
  );

  return `ENT-${year}-${randomPart}`;
}

function generateBusinessCode(): string {
  const year = new Date().getFullYear();

  const randomPart = Math.floor(
    100000 + Math.random() * 900000
  );

  return `BUS-${year}-${randomPart}`;
}

function normalizeText(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function normalizeNumber(
  value: unknown,
  fallback = 0
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

// =======================================================
// POST
// =======================================================

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        ApproveAndActivateRequest;

    // ===================================================
    // Step 1 — Validate request
    // ===================================================

    const fullName =
      normalizeText(body.fullName);

    const businessName =
      normalizeText(body.businessName);

    const email =
      normalizeText(body.email)?.toLowerCase() ??
      null;

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Entrepreneur name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!businessName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Business name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Entrepreneur email is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // Step 2 — Establish trusted workflow authority
    // ===================================================
     const requestedBy =
       normalizeText(body.requestedBy) ??
       "Professional Qualification Center";
    // ===================================================
    // Step 4 — Find existing entrepreneur
    // ===================================================

    const {
      data: existingEntrepreneur,
      error: lookupError,
    } = await supabaseAdmin
      .from("entrepreneurs")
      .select(
        `
          id,
          entrepreneur_code,
          business_code,
          status,
          current_stage
        `
      )
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error(
        "Entrepreneur lookup failed:",
        lookupError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            lookupError.message ||
            "Unable to check the entrepreneur record.",
        },
        {
          status: 500,
        }
      );
    }

    const now =
      new Date().toISOString();

    let entrepreneurId: string;
    let entrepreneurCode: string;
    let businessCode: string;
    let created = false;

    // ===================================================
    // Step 5 — Create or update entrepreneur
    // ===================================================

    if (existingEntrepreneur) {
      entrepreneurId =
        existingEntrepreneur.id;

      entrepreneurCode =
        existingEntrepreneur.entrepreneur_code ||
        generateEntrepreneurCode();

      businessCode =
        existingEntrepreneur.business_code ||
        generateBusinessCode();

      const {
        error: updateError,
      } = await supabaseAdmin
        .from("entrepreneurs")
        .update({
          entrepreneur_code:
            entrepreneurCode,

          business_code:
            businessCode,

          full_name:
            fullName,

          business_name:
            businessName,

          email,

          phone:
            normalizeText(body.phone),

          business_category:
            normalizeText(
              body.businessCategory
            ),

          business_description:
            normalizeText(
              body.businessDescription
            ),

          city:
            normalizeText(body.city),

          state:
            normalizeText(body.state),

          country:
            normalizeText(body.country),

          funding_goal:
            normalizeNumber(
              body.fundingGoal,
              0
            ),

          units_required:
            normalizeNumber(
              body.unitsRequired,
              20
            ),

          interview_date:
            normalizeText(
              body.orientationDate
            ),

          interview_time:
            normalizeText(
              body.orientationTime
            ),

          interview_status:
            "Completed",

          interview_type:
            "Zoom",

          meeting_link:
            normalizeText(
              body.meetingLink
            ),

          meeting_id:
            normalizeText(
              body.meetingId
            ),

          meeting_passcode:
            normalizeText(
              body.meetingPasscode
            ),

          qualification_score:
            normalizeNumber(
              body.qualificationScore,
              0
            ),

          qualification_notes:
            normalizeText(
              body.qualificationNotes
            ) ?? "",

          updated_at:
            now,
        })
        .eq(
          "id",
          entrepreneurId
        );

      if (updateError) {
        console.error(
          "Entrepreneur update failed:",
          updateError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              updateError.message ||
              "Unable to update the entrepreneur.",
          },
          {
            status: 500,
          }
        );
      }
    } else {
      entrepreneurCode =
        generateEntrepreneurCode();

      businessCode =
        generateBusinessCode();

      const {
        data: newEntrepreneur,
        error: insertError,
      } = await supabaseAdmin
        .from("entrepreneurs")
        .insert({
          entrepreneur_code:
            entrepreneurCode,

          business_code:
            businessCode,

          full_name:
            fullName,

          business_name:
            businessName,

          email,

          phone:
            normalizeText(body.phone),

          business_category:
            normalizeText(
              body.businessCategory
            ),

          business_description:
            normalizeText(
              body.businessDescription
            ),

          city:
            normalizeText(body.city),

          state:
            normalizeText(body.state),

          country:
            normalizeText(body.country),

          funding_goal:
            normalizeNumber(
              body.fundingGoal,
              0
            ),

          units_supported:
            0,

          units_required:
            normalizeNumber(
              body.unitsRequired,
              20
            ),

          status:
            "pending_review",

          coach_status:
            "Pending Assignment",

          current_stage:
            "pending_review",

          previous_stage:
            null,

          next_stage:
            "qualified",

          ibos_status:
            "Limited Portal",

          funding_queue_active:
            false,

          daily_transactions_active:
            false,

          quarterly_reporting_active:
            false,

          automation_active:
            false,

          business_intelligence_active:
            false,

          interview_date:
            normalizeText(
              body.orientationDate
            ),

          interview_time:
            normalizeText(
              body.orientationTime
            ),

          interview_status:
            "Completed",

          interview_type:
            "Zoom",

          meeting_link:
            normalizeText(
              body.meetingLink
            ),

          meeting_id:
            normalizeText(
              body.meetingId
            ),

          meeting_passcode:
            normalizeText(
              body.meetingPasscode
            ),

          qualification_score:
            normalizeNumber(
              body.qualificationScore,
              0
            ),

          qualification_notes:
            normalizeText(
              body.qualificationNotes
            ) ?? "",

          funding_status:
            "Qualification Pending",

          marketplace_status:
            "Hidden",

          video_status:
            "Pending",

          created_at:
            now,

          updated_at:
            now,
        })
        .select(
          `
            id,
            entrepreneur_code,
            business_code
          `
        )
        .single();

      if (
        insertError ||
        !newEntrepreneur
      ) {
        console.error(
          "Entrepreneur insert failed:",
          insertError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              insertError?.message ||
              "Unable to create the entrepreneur.",
          },
          {
            status: 500,
          }
        );
      }

      entrepreneurId =
        newEntrepreneur.id;

      entrepreneurCode =
        newEntrepreneur
          .entrepreneur_code ||
        entrepreneurCode;

      businessCode =
        newEntrepreneur.business_code ||
        businessCode;

      created = true;
    }

    // ===================================================
    // Step 6 — Execute centralized lifecycle orchestration
    // ===================================================

    const orchestrator =
      new EntrepreneurLifecycleOrchestrator(
        supabaseAdmin
      );

    const qualificationResult =
      await orchestrator.qualify(
        entrepreneurId
      );

    // ===================================================
    // Step 7 — Activate marketplace/campaign lifecycle
    // ===================================================

    const activationResult =
      await orchestrator.activateMarketplace(
        entrepreneurId
      );

    // ===================================================
    // Step 8 — Record source application decision
    //
    // This only runs when an application ID is supplied.
    // Change "entrepreneur_applications" here only if your
    // actual applications table has a different name.
    // ===================================================

    if (
      body.applicationId !== undefined &&
      body.applicationId !== null
    ) {
      const {
        error: applicationUpdateError,
      } = await supabaseAdmin
        .from("entrepreneur_applications")
        .update({
          review_status:
            "Activated",

          application_decision:
            "Approved",

          activated_at:
            now,

          qualification_score:
            normalizeNumber(
              body.qualificationScore,
              0
            ),

          qualification_notes:
          normalizeText(
               body.qualificationNotes
        ) ?? "",
      })
        .eq(
          "id",
          body.applicationId
        );

      if (applicationUpdateError) {
        console.warn(
          "Entrepreneur was activated, but the application record could not be updated:",
          applicationUpdateError
        );
      }
    }

    // ===================================================
    // Step 9 — Return official result
    // ===================================================

    return NextResponse.json(
      {
        success: true,

        message:
          qualificationResult.message,

        created,

        entrepreneur: {
          id:
            entrepreneurId,

          entrepreneurCode,

          businessCode,

          fullName,

          businessName,

          email,
        },

        qualification:
          qualificationResult,

        activation:
          activationResult,

        coach:
          qualificationResult
            .coachAssignment
            .coach,

        coachAssigned:
          qualificationResult
            .coachAssignment
            .assigned,

        requestedBy,

        completedAt:
          now,
      },
      {
        status: created
          ? 201
          : 200,
      }
    );
  } catch (error) {
    console.error(
      "Approve and activate workflow failed:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected approval error occurred.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    );
  }
}