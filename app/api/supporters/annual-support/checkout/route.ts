import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";

import {
  EPEW_FINANCIAL_STANDARD,
  calculateAnnualCommitmentCents,
  centsToDollars,
} from "@/lib/enterprise/financial/financialRules";

type SelectionMethod =
  | "self_selected"
  | "epew_selected";

type AllocationPreference =
  | "one_business"
  | "multiple_businesses";

interface AnnualSupportCheckoutRequest {
  supporterId?: string;
  units?: number;

  selectionMethod?: SelectionMethod;
  allocationPreference?: AllocationPreference;

  referrerName?: string;
  referredEntrepreneurId?: string | null;
  referredBusinessName?: string;
  referralSource?: string;

  selectedEntrepreneurId?: string | null;
}

const VALID_SELECTION_METHODS: SelectionMethod[] = [
  "self_selected",
  "epew_selected",
];

const VALID_ALLOCATION_PREFERENCES: AllocationPreference[] = [
  "one_business",
  "multiple_businesses",
];

export async function POST(req: Request) {
  try {
    const body =
      (await req.json()) as AnnualSupportCheckoutRequest;

    /*
     * SECURITY:
     * The authenticated Supabase user is the source of truth.
     * Never trust a Supporter UUID supplied by the browser.
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
            "You must be signed in to continue.",
        },
        { status: 401 }
      );
    }

    const {
      data: supporter,
      error: supporterError,
    } = await supabaseAdmin
      .from("supporters")
      .select(
        "id,user_id,email,full_name,status,account_status"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (supporterError) {
      console.error(
        "Annual support checkout supporter ownership error:",
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

    const requestedSupporterId =
      body.supporterId?.trim() || "";

    if (
      requestedSupporterId &&
      requestedSupporterId !== supporter.id
    ) {
      return NextResponse.json(
        {
          error:
            "This supporter account does not belong to the signed-in user.",
        },
        { status: 403 }
      );
    }

    const supporterId =
      supporter.id;

    const unitCount =
      Math.floor(Number(body.units || 0));

    const selectionMethod =
      body.selectionMethod || "epew_selected";

    const allocationPreference =
      body.allocationPreference || "one_business";

    if (!supporterId) {
      return NextResponse.json(
        {
          error:
            "A valid supporter account is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(unitCount) ||
      unitCount < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Please select at least one support unit.",
        },
        { status: 400 }
      );
    }

    if (
      !VALID_SELECTION_METHODS.includes(
        selectionMethod
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid business selection method.",
        },
        { status: 400 }
      );
    }

    if (
      !VALID_ALLOCATION_PREFERENCES.includes(
        allocationPreference
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid allocation preference.",
        },
        { status: 400 }
      );
    }

    if (
      supporter.status === "inactive" ||
      supporter.account_status === "inactive"
    ) {
      return NextResponse.json(
        {
          error:
            "This supporter account is not currently active.",
        },
        { status: 403 }
      );
    }

    const selectedEntrepreneurId =
      body.selectedEntrepreneurId?.trim() || null;

    if (
      selectionMethod === "self_selected" &&
      !selectedEntrepreneurId
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a business before continuing.",
        },
        { status: 400 }
      );
    }

    let selectedPublicBusinessId = "";

    /*
     * If the supporter chooses the business directly,
     * confirm the entrepreneur application exists.
     *
     * If EPEW is choosing, no entrepreneur is assigned
     * before payment.
     */
    if (
      selectionMethod === "self_selected" &&
      selectedEntrepreneurId
    ) {
      const {
        data: selectedEntrepreneur,
        error: selectedEntrepreneurError,
      } = await supabaseAdmin
        .from("entrepreneurs")
        .select(
          "id,public_business_id,business_name,status,qualified,marketplace_visibility,units_required,units_supported,funding_status,campaign_status"
        )
        .eq(
          "id",
          selectedEntrepreneurId
        )
        .maybeSingle();

      if (selectedEntrepreneurError) {
        console.error(
          "Annual support selected entrepreneur validation error:",
          selectedEntrepreneurError
        );

        return NextResponse.json(
          {
            error:
              "Unable to validate the selected business.",
          },
          { status: 500 }
        );
      }

      if (!selectedEntrepreneur) {
        return NextResponse.json(
          {
            error:
              "The selected business could not be found.",
          },
          { status: 404 }
        );
      }

      selectedPublicBusinessId =
        selectedEntrepreneur.public_business_id || "";

      const campaignAuthorized =
        selectedEntrepreneur.qualified === true &&
        selectedEntrepreneur.marketplace_visibility === true &&
        selectedEntrepreneur.campaign_status === "Campaign Active";

      if (!campaignAuthorized) {
        return NextResponse.json(
          {
            error:
              "This business has not yet been authorized to accept EPEW support.",
          },
          { status: 403 }
        );
      }

      const unitsRequired =
        Number(
          selectedEntrepreneur.units_required ||
            EPEW_FINANCIAL_STANDARD
              .UNITS_AVAILABLE_PER_ENTREPRENEUR
        );

      const unitsSupported =
        Math.max(
          Number(
            selectedEntrepreneur.units_supported || 0
          ),
          0
        );

      const unitsRemaining =
        Math.max(
          unitsRequired - unitsSupported,
          0
        );

      if (unitCount > unitsRemaining) {
        return NextResponse.json(
          {
            error:
              unitsRemaining === 0
                ? "This business is no longer accepting additional support units."
                : `Only ${unitsRemaining} unit${
                    unitsRemaining === 1
                      ? ""
                      : "s"
                  } remain available for this business.`,
            unitsRemaining,
          },
          { status: 400 }
        );
      }
    }

    const annualAmountCents =
      calculateAnnualCommitmentCents(
        unitCount
      );

    const annualAmount =
      centsToDollars(
        annualAmountCents
      );

    const unitPrice =
      centsToDollars(
        EPEW_FINANCIAL_STANDARD
          .ANNUAL_UNIT_AMOUNT_CENTS
      );

    /*
     * Create the annual support intent BEFORE
     * creating Stripe Checkout.
     *
     * For EPEW-selected support, this record contains
     * no final entrepreneur assignment.
     */
    const {
      data: supportIntent,
      error: supportIntentError,
    } = await supabaseAdmin
      .from("epew_support_intents")
      .insert({
        supporter_id: supporterId,

        unit_count: unitCount,
        unit_price: unitPrice,
        total_amount: annualAmount,

        support_term_months: 12,
        payment_frequency: "one_time",
        participation_benefit_rate: 8,

        selection_method: selectionMethod,

        referrer_name:
          body.referrerName?.trim() ||
          null,

        referred_entrepreneur_id:
          body.referredEntrepreneurId?.trim() || null,

        referred_business_name:
          body.referredBusinessName?.trim() ||
          null,

        referral_source:
          body.referralSource?.trim() ||
          null,

        supporter_selected_entrepreneur_id:
          selectionMethod ===
            "self_selected"
            ? selectedEntrepreneurId
            : null,

        allocation_preference:
          allocationPreference,

        status: "payment_pending",

        payment_started_at:
          new Date().toISOString(),
      })
      .select("id")
      .single();

    if (
      supportIntentError ||
      !supportIntent
    ) {
      console.error(
        "Annual support intent creation error:",
        supportIntentError
      );

      return NextResponse.json(
        {
          error:
            "Unable to create the support request.",
        },
        { status: 500 }
      );
    }

    const siteUrl = new URL(req.url).origin;

    const metadata: Record<
      string,
      string
    > = {
      platform: "EPEW",
      model: "EDE",
      system: "EOS",

      support_flow:
        "annual_one_time",

      support_intent_id:
        supportIntent.id,

      supporter_id:
        supporterId,

      units:
        String(unitCount),

      unit_price:
        String(unitPrice),

      total_amount:
        String(annualAmount),

      payment_frequency:
        "one_time",

      support_term_months:
        "12",

      participation_benefit_rate:
        "8",

      selection_method:
        selectionMethod,

      allocation_preference:
        allocationPreference,

      financial_standard_version:
        "1.0",
    };

    if (
      body.referrerName?.trim()
    ) {
      metadata.referrer_name =
        body.referrerName.trim();
    }

    if (
      body.referredBusinessName?.trim()
    ) {
      metadata.referred_business_name =
        body.referredBusinessName.trim();
    }

    if (
      body.referredEntrepreneurId?.trim()
    ) {
      metadata.referred_entrepreneur_id =
        body.referredEntrepreneurId.trim();
    }

    if (
      selectionMethod ===
        "self_selected" &&
      selectedEntrepreneurId
    ) {
      metadata.selected_entrepreneur_id =
        selectedEntrepreneurId;
    }

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        payment_method_types: [
          "us_bank_account",
          "card",
        ],

        customer_email:
          supporter.email ||
          undefined,

        line_items: [
          {
            price_data: {
              currency: "usd",

              product_data: {
                name:
                  "EPEW Annual Support Unit",

                description:
                  "One-year EPEW Support participation. One support unit is $5,200. Participation benefit may be up to 8% for the year, subject to EPEW program terms.",

                metadata: {
                  platform: "EPEW",
                  support_flow:
                    "annual_one_time",
                },
              },

              unit_amount:
                EPEW_FINANCIAL_STANDARD
                  .ANNUAL_UNIT_AMOUNT_CENTS,
            },

            quantity:
              unitCount,
          },
        ],

        metadata,

        payment_intent_data: {
          metadata,
        },

        success_url:
          `${siteUrl}/supporters/payment-success` +
          `?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          selectionMethod === "self_selected" &&
          selectedPublicBusinessId
            ? `${siteUrl}/support/${encodeURIComponent(
                selectedPublicBusinessId
              )}/checkout?cancelled=true`
            : `${siteUrl}/supporters/support?cancelled=true`,
      });

    if (!session.url) {
      await supabaseAdmin
        .from(
          "epew_support_intents"
        )
        .update({
          status:
            "payment_failed",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          supportIntent.id
        );

      return NextResponse.json(
        {
          error:
            "Stripe did not return a checkout URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl:
        session.url,

      sessionId:
        session.id,

      supportIntentId:
        supportIntent.id,

      units:
        unitCount,

      unitPrice,

      totalAmount:
        annualAmount,

      paymentFrequency:
        "one_time",

      supportTermMonths:
        12,

      participationBenefitRate:
        8,

      selectionMethod,

      allocationPreference,
    });
  } catch (error) {
    console.error(
      "Annual support checkout error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to start annual support checkout.",
      },
      { status: 500 }
    );
  }
}
