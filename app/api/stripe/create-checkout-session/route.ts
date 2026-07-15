import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import {
  getStripePlan,
} from "@/lib/enterprise/financial/stripeConfig";

import {
  EPEW_FINANCIAL_STANDARD,
  calculateAnnualCommitmentCents,
  centsToDollars,
  type ContributionFrequency,
} from "@/lib/enterprise/financial/financialRules";

interface CheckoutRequestBody {
  entrepreneurId?: string;
  entrepreneurName?: string;
  businessId?: string;
  businessName?: string;
  supporterId?: string;
  units?: number;
  frequency?: ContributionFrequency;
}

const VALID_FREQUENCIES: ContributionFrequency[] = [
  "weekly",
  "monthly",
  "annual",
];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;

    const entrepreneurId = body.entrepreneurId?.trim() || "";
    const entrepreneurName = body.entrepreneurName?.trim() || "";
    const businessId = body.businessId?.trim() || "";
    const businessName = body.businessName?.trim() || "";
    const supporterId = body.supporterId?.trim() || "";

    const unitCount = Math.floor(Number(body.units || 0));
    const frequency = body.frequency;

    if (
      !entrepreneurId ||
      !businessName ||
      !supporterId ||
      !frequency
    ) {
      return NextResponse.json(
        {
          error:
            "Entrepreneur, business, supporter, and payment frequency are required.",
        },
        { status: 400 }
      );
    }

    if (!VALID_FREQUENCIES.includes(frequency)) {
      return NextResponse.json(
        {
          error:
            "Invalid payment frequency. Select weekly, monthly, or annual.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(unitCount) || unitCount < 1) {
      return NextResponse.json(
        {
          error: "Please select at least one support unit.",
        },
        { status: 400 }
      );
    }

    /*
     * Confirm that the supporter exists.
     */
    const { data: supporter, error: supporterError } =
      await supabaseAdmin
        .from("supporters")
        .select("id,email")
        .eq("id", supporterId)
        .maybeSingle();

    if (supporterError) {
      console.error(
        "Supporter validation error:",
        supporterError
      );

      return NextResponse.json(
        {
          error: "Unable to validate the supporter account.",
        },
        { status: 500 }
      );
    }

    if (!supporter) {
      return NextResponse.json(
        {
          error:
            "Supporter profile not found. Please sign in again.",
        },
        { status: 404 }
      );
    }

    /*
     * Load the entrepreneur and verify available units.
     */
    const { data: entrepreneur, error: entrepreneurError } =
      await supabaseAdmin
        .from("entrepreneurs")
        .select(
          "id,business_name,full_name,units_supported,units_required"
        )
        .eq("id", entrepreneurId)
        .maybeSingle();

    if (entrepreneurError) {
      console.error(
        "Entrepreneur validation error:",
        entrepreneurError
      );

      return NextResponse.json(
        {
          error: "Unable to validate the entrepreneur.",
        },
        { status: 500 }
      );
    }

    if (!entrepreneur) {
      return NextResponse.json(
        {
          error: "Entrepreneur not found.",
        },
        { status: 404 }
      );
    }

    const unitsAvailable =
      Number(entrepreneur.units_required || 0) > 0
        ? Number(entrepreneur.units_required)
        : EPEW_FINANCIAL_STANDARD.UNITS_AVAILABLE_PER_ENTREPRENEUR;

    const unitsAlreadySupported = Math.max(
      Number(entrepreneur.units_supported || 0),
      0
    );

    const unitsRemaining = Math.max(
      unitsAvailable - unitsAlreadySupported,
      0
    );

    if (unitCount > unitsRemaining) {
      return NextResponse.json(
        {
          error:
            unitsRemaining === 0
              ? "This entrepreneur has already received commitments for all available units."
              : `Only ${unitsRemaining} unit${
                  unitsRemaining === 1 ? "" : "s"
                } remain available for this entrepreneur.`,
          unitsRemaining,
        },
        { status: 400 }
      );
    }

    const plan = getStripePlan(frequency);

    const annualCommitmentCents =
      calculateAnnualCommitmentCents(unitCount);

    const annualCommitment =
      centsToDollars(annualCommitmentCents);

    const fundingGoal = centsToDollars(
      EPEW_FINANCIAL_STANDARD.FUNDING_GOAL_CENTS
    );

    const finalEntrepreneurName =
      entrepreneurName ||
      entrepreneur.full_name ||
      "EPEW Entrepreneur";

    const finalBusinessName =
      businessName ||
      entrepreneur.business_name ||
      "EPEW Business";

    const finalBusinessId =
      businessId || entrepreneurId;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    /*
     * Metadata is stored on both the Checkout Session and the
     * Stripe Subscription. Subscription metadata is necessary
     * so future weekly, monthly, and annual renewal invoices can
     * be linked back to the correct EPEW records.
     */
    const metadata: Record<string, string> = {
      supporter_id: supporterId,
      entrepreneur_id: entrepreneurId,
      entrepreneur_name: finalEntrepreneurName,
      business_id: finalBusinessId,
      business_name: finalBusinessName,

      units: String(unitCount),
      frequency,

      funding_goal: String(fundingGoal),
      annual_commitment: String(annualCommitment),

      payment_schedule:
        frequency === "weekly"
          ? "Automatic Weekly"
          : frequency === "monthly"
          ? "Automatic Monthly"
          : "Automatic Annual",

      auto_renew: "true",

      platform: "EPEW",
      model: "EDE",
      system: "EOS",
      financial_standard_version: "1.0",
    };

    const session =
      await stripe.checkout.sessions.create({
        mode: "subscription",

        payment_method_types: ["card"],

        customer_email:
          supporter.email || undefined,

        line_items: [
          {
            price_data: {
              currency: "usd",

              product_data: {
                name: `${finalBusinessName} — EPEW Support Unit`,

                description:
                  "Participation in the EPEW Entrepreneur Development Ecosystem community development program. This is not an investment, bank deposit, security, or guaranteed financial product.",

                metadata: {
                  entrepreneur_id: entrepreneurId,
                  business_id: finalBusinessId,
                  platform: "EPEW",
                },
              },

              unit_amount: plan.amount,

              recurring: {
                interval: plan.interval,
              },
            },

            /*
             * One Stripe quantity equals one EPEW support unit.
             * Stripe automatically calculates:
             *
             * Weekly: $100.00 × units
             * Monthly: $433.34 × units
             * Annual: $5,200.00 × units
             */
            quantity: unitCount,
          },
        ],

        metadata,

        subscription_data: {
          metadata,
        },

        success_url:
          `${siteUrl}/supporters/payment-success` +
          `?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${siteUrl}/support/${finalBusinessId}/checkout` +
          `?cancelled=true`,
      });

    if (!session.url) {
      return NextResponse.json(
        {
          error:
            "Stripe did not return a checkout URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
      checkoutSessionId: session.id,

      summary: {
        entrepreneurId,
        businessId: finalBusinessId,
        businessName: finalBusinessName,
        supporterId,
        units: unitCount,
        frequency,
        amountPerUnit: centsToDollars(plan.amount),
        annualCommitment,
        fundingGoal,
        autoRenew: true,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Stripe checkout failed.";

    console.error(
      "EOS Stripe checkout error:",
      error
    );

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}