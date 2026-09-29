import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { independentTerms } from "@/lib/enterprise/supporters/independentSupportRules";

async function account() {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabaseAdmin
    .from("supporters")
    .select("id,email,status,account_status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function GET() {
  try {
    const supporter = await account();
    if (!supporter)
      return NextResponse.json(
        { error: "Please sign in to your supporter account." },
        { status: 401 },
      );
    const { data: plans, error } = await supabaseAdmin
      .from("epew_independent_support_plans")
      .select(
        "id,frequency,units,base_cents,additional_cents,status,created_at",
      )
      .eq("supporter_id", supporter.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { data: payments, error: paymentError } = plans?.length
      ? await supabaseAdmin
          .from("epew_independent_support_payments")
          .select(
            "id,plan_id,amount_cents,additional_cents,business_name,allocated_at,paid_at",
          )
          .in(
            "plan_id",
            plans.map((p) => p.id),
          )
          .order("paid_at", { ascending: false })
      : { data: [], error: null };
    if (paymentError) throw paymentError;
    return NextResponse.json({ plans, payments });
  } catch {
    return NextResponse.json(
      { error: "Unable to load contributions." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const supporter = await account();
    if (!supporter)
      return NextResponse.json(
        { error: "Please sign in to your supporter account." },
        { status: 401 },
      );
    if (
      supporter.status === "inactive" ||
      supporter.account_status === "inactive"
    )
      return NextResponse.json(
        { error: "This account is inactive." },
        { status: 403 },
      );
    const body = await request.json();
    if (body.action === "cancel") {
      const { data: plan, error } = await supabaseAdmin
        .from("epew_independent_support_plans")
        .select("id,stripe_subscription_id")
        .eq("id", body.planId)
        .eq("supporter_id", supporter.id)
        .maybeSingle();
      if (error || !plan?.stripe_subscription_id)
        return NextResponse.json(
          { error: "Active contribution plan not found." },
          { status: 404 },
        );
      await stripe.subscriptions.cancel(plan.stripe_subscription_id);
      const { error: updateError } = await supabaseAdmin
        .from("epew_independent_support_plans")
        .update({ status: "cancelled" })
        .eq("id", plan.id);
      if (updateError) throw updateError;
      return NextResponse.json({ success: true });
    }
    let terms;
    try {
      terms = independentTerms(body);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 },
      );
    }
    if (body.accepted !== true)
      return NextResponse.json(
        { error: "Please confirm your contribution and EPEW selection." },
        { status: 400 },
      );
    const { data: plan, error } = await supabaseAdmin
      .from("epew_independent_support_plans")
      .insert({
        supporter_id: supporter.id,
        frequency: terms.frequency,
        units: terms.units,
        base_cents: terms.baseCents,
        additional_cents: terms.additionalCents,
      })
      .select("id")
      .single();
    if (error || !plan) throw new Error("Plan creation failed");
    const recurring = terms.frequency !== "one-time";
    const metadata = {
      support_flow: "independent",
      independent_plan_id: plan.id,
      supporter_id: supporter.id,
    };
    const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: terms.baseCents,
          product_data: {
            name: `EPEW independent support — ${terms.frequency}`,
            description:
              "EPEW selects the entrepreneur receiving this support.",
          },
          ...(recurring
            ? {
                recurring: {
                  interval:
                    terms.frequency === "weekly"
                      ? ("week" as const)
                      : ("month" as const),
                },
              }
            : {}),
        },
      },
    ];
    if (terms.additionalCents)
      items.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: terms.additionalCents,
          product_data: { name: "Optional additional support — one time only" },
        },
      });
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create(
      {
        mode: recurring ? "subscription" : "payment",
        payment_method_types: ["card"],
        customer_email: supporter.email,
        client_reference_id: plan.id,
        metadata,
        line_items: items,
        ...(recurring ? { subscription_data: { metadata } } : {}),
        success_url: `${origin}/supporters/independent-support?payment=submitted`,
        cancel_url: `${origin}/supporters/independent-support?payment=cancelled`,
      },
      { idempotencyKey: `independent-${plan.id}` },
    );
    const { error: sessionError } = await supabaseAdmin
      .from("epew_independent_support_plans")
      .update({ stripe_session_id: session.id })
      .eq("id", plan.id);
    if (sessionError) {
      await stripe.checkout.sessions.expire(session.id);
      throw sessionError;
    }
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "Unable to process this request. Please try again." },
      { status: 500 },
    );
  }
}
