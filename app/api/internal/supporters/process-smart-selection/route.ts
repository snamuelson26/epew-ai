import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  processSmartSupportSelection,
} from "@/lib/enterprise/supporters/SmartSupportSelectionService";

export const dynamic =
  "force-dynamic";

async function processPendingSelections() {
  const now =
    new Date().toISOString();

  /*
   * Process paid EPEW-selected support as soon as possible.
   *
   * The 48-hour selection_due_at value is the maximum
   * fulfillment deadline. We do not intentionally wait
   * until that deadline.
   */
  const {
    data: selectionCases,
    error: selectionCasesError,
  } = await supabaseAdmin
    .from(
      "epew_support_selection_cases"
    )
    .select(
      "id,support_intent_id,status,paid_at,selection_due_at,requested_units"
    )
    .in("status", [
      "paid_selection_pending",
      "selection_in_progress",
    ])
    .order(
      "paid_at",
      { ascending: true }
    )
    .limit(20);

  if (selectionCasesError) {
    throw selectionCasesError;
  }

  let completed = 0;
  let manualReview = 0;
  let failed = 0;
  let overdue = 0;

  const results: Array<{
    selectionCaseId: string;
    supportIntentId: string;
    result:
      | "allocation_completed"
      | "manual_review"
      | "already_completed"
      | "failed";
    entrepreneurId?: string | null;
    allocationId?: string | null;
    reason?: string;
    error?: string;
  }> = [];

  for (
    const selectionCase of
    selectionCases ?? []
  ) {
    if (
      selectionCase.selection_due_at &&
      new Date(
        selectionCase.selection_due_at
      ).getTime() <
        new Date(now).getTime()
    ) {
      overdue += 1;
    }

    try {
      const result =
        await processSmartSupportSelection(
          selectionCase.id
        );

      if (
        result.status ===
          "allocation_completed" ||
        result.status ===
          "already_completed"
      ) {
        completed += 1;
      }

      if (
        result.status ===
        "manual_review"
      ) {
        manualReview += 1;
      }

      results.push({
        selectionCaseId:
          selectionCase.id,
        supportIntentId:
          selectionCase.support_intent_id,
        result:
          result.status,
        entrepreneurId:
          result.entrepreneurId,
        allocationId:
          result.allocationId,
        reason:
          result.reason,
      });
    } catch (error) {
      failed += 1;

      const message =
        error instanceof Error
          ? error.message
          : "Unknown Smart Selection error.";

      console.error(
        `[EPEW Supporter Smart Selection] Unable to process case ${selectionCase.id}:`,
        error
      );

      /*
       * A technical failure is different from a legitimate
       * "no eligible entrepreneur" result.
       *
       * Keep the case available for another processor run
       * unless another process already completed it.
       */
      const {
        data: currentCase,
      } = await supabaseAdmin
        .from(
          "epew_support_selection_cases"
        )
        .select("status")
        .eq(
          "id",
          selectionCase.id
        )
        .maybeSingle();

      if (
        currentCase?.status ===
        "selection_in_progress"
      ) {
        await supabaseAdmin
          .from(
            "epew_support_selection_cases"
          )
          .update({
            status:
              "paid_selection_pending",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            selectionCase.id
          )
          .eq(
            "status",
            "selection_in_progress"
          );
      }

      results.push({
        selectionCaseId:
          selectionCase.id,
        supportIntentId:
          selectionCase.support_intent_id,
        result:
          "failed",
        error:
          message,
      });
    }
  }

  return {
    processed:
      selectionCases?.length ?? 0,

    completed,
    manualReview,
    failed,
    overdue,

    results,
  };
}

export async function GET(
  request: NextRequest
) {
  const secret =
    process.env.CRON_SECRET;

  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !secret ||
    authorization !==
      `Bearer ${secret}`
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const result =
      await processPendingSelections();

    return NextResponse.json({
      success: true,
      processedAt:
        new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error(
      "EPEW Supporter Smart Selection processor failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to process EPEW Supporter Smart Selection.",
      },
      { status: 500 }
    );
  }
}
