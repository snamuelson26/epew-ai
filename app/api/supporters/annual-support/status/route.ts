import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    /*
     * SECURITY:
     * Only the signed-in Supporter may inspect a Checkout Session.
     */
    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to view this support payment.",
        },
        { status: 401 }
      );
    }

    const {
      data: supporter,
      error: supporterError,
    } = await supabaseAdmin
      .from("supporters")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (supporterError) {
      console.error(
        "Annual support status supporter ownership error:",
        supporterError
      );

      return NextResponse.json(
        {
          error:
            "Unable to validate your supporter account.",
        },
        { status: 500 }
      );
    }

    if (!supporter) {
      return NextResponse.json(
        {
          error:
            "Supporter profile not found for this account.",
        },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);

    const sessionId =
      searchParams.get("session_id")?.trim() || "";

    if (!sessionId) {
      return NextResponse.json(
        {
          error:
            "Stripe checkout session ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: transaction,
      error: transactionError,
    } = await supabaseAdmin
      .from("supporter_transactions")
      .select(
        "id,supporter_id,entrepreneur_id,amount,units,status,support_intent_id,selection_method,selection_due_at"
      )
      .eq(
        "stripe_checkout_session_id",
        sessionId
      )
      .eq(
        "supporter_id",
        supporter.id
      )
      .maybeSingle();

    if (transactionError) {
      console.error(
        "Annual support status transaction error:",
        transactionError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load annual support payment status.",
        },
        { status: 500 }
      );
    }

    if (!transaction) {
      return NextResponse.json(
        {
          found: false,
          pending: true,
        }
      );
    }

    const supportIntentId =
      transaction.support_intent_id;

    const {
      data: supportIntent,
      error: supportIntentError,
    } = supportIntentId
      ? await supabaseAdmin
          .from("epew_support_intents")
          .select(
            "id,selection_method,status,supporter_selected_entrepreneur_id,paid_at"
          )
          .eq("id", supportIntentId)
          .maybeSingle()
      : {
          data: null,
          error: null,
        };

    if (supportIntentError) {
      console.error(
        "Annual support status intent error:",
        supportIntentError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load annual support request.",
        },
        { status: 500 }
      );
    }

    const entrepreneurId =
      transaction.entrepreneur_id ||
      supportIntent?.supporter_selected_entrepreneur_id ||
      null;

    let entrepreneur: {
      id: string;
      full_name: string | null;
      business_name: string | null;
      public_business_id: string | null;
    } | null = null;

    if (entrepreneurId) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("entrepreneurs")
        .select(
          "id,full_name,business_name,public_business_id"
        )
        .eq("id", entrepreneurId)
        .maybeSingle();

      if (error) {
        console.error(
          "Annual support status entrepreneur error:",
          error
        );
      } else {
        entrepreneur = data;
      }
    }

    return NextResponse.json({
      found: true,
      pending: false,

      transactionId:
        transaction.id,

      supportIntentId,

      paymentStatus:
        transaction.status,

      selectionMethod:
        transaction.selection_method ||
        supportIntent?.selection_method ||
        null,

      supportStatus:
        supportIntent?.status ||
        null,

      units:
        Number(transaction.units || 0),

      amount:
        Number(transaction.amount || 0),

      selectionDueAt:
        transaction.selection_due_at ||
        null,

      entrepreneur,
    });
  } catch (error) {
    console.error(
      "Annual support status failure:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load annual support payment status.",
      },
      { status: 500 }
    );
  }
}
