// =======================================================
// EPEW – EDE – IBOS
// Entrepreneur Qualification API
// =======================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { QualificationWorkflowService } from "@/lib/workflows/QualificationWorkflowService";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Entrepreneur ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const workflow = new QualificationWorkflowService(
      supabase
    );

    const result =
      await workflow.qualifyEntrepreneur(id);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Qualification failed.",
      },
      {
        status: 500,
      }
    );
  }
}