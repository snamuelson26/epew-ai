// =======================================================
// EPEW – EDE – IBOS
// Admin Coach API
// =======================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CoachService } from "@/lib/services/CoachService";

export async function GET() {
  try {
    const supabase = await createClient();

    const service = new CoachService(supabase);

    const coaches = await service.getCards();

    return NextResponse.json({
      success: true,
      data: coaches,
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

export async function PATCH(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const supabase = await createClient();

    const service = new CoachService(supabase);

    await service.updateStatus(
      body.coachId,
      body.status
    );

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