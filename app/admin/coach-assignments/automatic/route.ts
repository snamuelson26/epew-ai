// =======================================================
// EPEW – EDE – IBOS
// Automatic Coach Assignment API
// =======================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AutomaticCoachAssignmentService } from "@/lib/services/AutomaticCoachAssignmentService";

interface AutomaticAssignmentRequest {
  entrepreneurId?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export async function POST(request: NextRequest) {
  try {
    const body =
      (await request.json()) as AutomaticAssignmentRequest;

    const entrepreneurId = body.entrepreneurId?.trim();

    if (!entrepreneurId) {
      return NextResponse.json(
        {
          success: false,
          message: "Entrepreneur ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = await createClient();

    // Confirm the entrepreneur exists before assigning a coach.
    const { data: entrepreneur, error: entrepreneurError } =
      await supabase
        .from("entrepreneurs")
        .select("id")
        .eq("id", entrepreneurId)
        .maybeSingle();

    if (entrepreneurError) {
      throw entrepreneurError;
    }

    if (!entrepreneur) {
      return NextResponse.json(
        {
          success: false,
          message: "Entrepreneur not found.",
        },
        {
          status: 404,
        }
      );
    }

    const service =
      new AutomaticCoachAssignmentService(supabase);

    const result =
      await service.assignEntrepreneur(entrepreneurId);

    if (!result.success) {
      const isExistingAssignment =
        result.message
          .toLowerCase()
          .includes("already has");

      const isNoCoachAvailable =
        result.message
          .toLowerCase()
          .includes("no coach");

      return NextResponse.json(
        result,
        {
          status: isExistingAssignment
            ? 409
            : isNoCoachAvailable
              ? 503
              : 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: {
          coach: result.coach,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    console.error(
      "Automatic coach assignment API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      {
        status: 500,
      }
    );
  }
}