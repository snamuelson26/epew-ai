// =======================================================
// EPEW – EDE – IBOS
// Coach Assignment API
// =======================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CoachAssignmentService } from "@/lib/services/CoachAssignmentService";

export async function GET() {
  try {
    const supabase = await createClient();

    const service =
      new CoachAssignmentService(supabase);

    const assignments =
      await service.getAll();

    return NextResponse.json({
      success: true,
      data: assignments,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const supabase = await createClient();

    const service =
      new CoachAssignmentService(supabase);

    await service.assign(body);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}