import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createEnterpriseContext } from "@/lib/enterprise/core/context";
import { ENGINES } from "@/lib/enterprise/core/constants";
import { financialEngine } from "@/lib/enterprise/financial/financialEngine";
import { contributionFromCheckoutSession } from "@/lib/enterprise/financial/webhookProcessor";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    console.error("Stripe webhook signature error:", error.message);

    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session: any = event.data.object;

        const context = createEnterpriseContext({
          source: ENGINES.FINANCIAL,
          metadata: {
            stripeEventId: event.id,
            stripeEventType: event.type,
          },
        });

        const contribution =
          contributionFromCheckoutSession(session);

        const result = await financialEngine.run(
          context,
          contribution
        );

        if (!result.success) {
          throw new Error(result.message);
        }

        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Financial Engine error:", error);

    return NextResponse.json(
      { error: error.message || "Financial Engine failed." },
      { status: 500 }
    );
  }
}