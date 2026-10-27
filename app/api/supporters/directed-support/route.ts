import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { independentCheckout } from '@/lib/enterprise/supporters/IndependentSupportPaymentService';
import { directedTerms } from '@/lib/enterprise/supporters/directedSupportRules';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please sign in to your supporter account.' }, { status: 401 });
    const { data: supporter, error: ownerError } = await supabaseAdmin.from('supporters')
      .select('id,email,status,account_status').eq('user_id', user.id).maybeSingle();
    if (ownerError) throw ownerError;
    if (!supporter || [supporter.status, supporter.account_status].includes('inactive'))
      return NextResponse.json({ error: 'An active supporter account is required.' }, { status: 403 });
    const body = await request.json();
    // This flow is intentionally limited to Samuel's flexible Food Fans campaign.
    if (body.businessId !== 'FFR-002') return NextResponse.json({ error: 'Flexible support is available for FFR-002 only.' }, { status: 400 });
    if (body.accepted !== true) return NextResponse.json({ error: 'Please confirm the payment terms.' }, { status: 400 });
    let terms;
    try { terms = directedTerms(body); } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
    if (terms.frequency === 'annual') return NextResponse.json({ url: `${new URL(request.url).origin}/support/FFR-002/checkout?annual=full&units=${terms.units}` });
    const { data: business, error: businessError } = await supabaseAdmin.from('entrepreneurs')
      .select('id,business_name,public_business_id').eq('public_business_id', 'FFR-002')
      .eq('qualified', true).eq('marketplace_visibility', true).eq('campaign_status', 'Campaign Active').maybeSingle();
    if (businessError) throw businessError;
    if (!business) return NextResponse.json({ error: 'This campaign is not accepting support yet.' }, { status: 409 });
    const { data: plan, error: planError } = await supabaseAdmin.from('epew_independent_support_plans')
      .insert({ supporter_id: supporter.id, selected_entrepreneur_id: business.id,
        frequency: terms.frequency, units: terms.units, base_cents: terms.baseCents, additional_cents: 0 })
      .select('id').single();
    if (planError || !plan) throw new Error('Unable to save the support request.');
    const recurring = terms.interval !== null;
    const metadata = { support_flow: 'independent', independent_plan_id: plan.id, supporter_id: supporter.id, public_business_id: 'FFR-002' };
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: recurring ? 'subscription' : 'payment', customer_email: supporter.email,
      client_reference_id: plan.id, metadata,
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: terms.baseCents,
        product_data: { name: `${business.business_name} — FFR-002 ${terms.frequency} support`, description: 'Support is assigned to Food Fans Restaurant, FFR-002.' },
        ...(terms.interval ? { recurring: { interval: terms.interval } } : {}) } }],
      ...(recurring ? { subscription_data: { metadata } } : {}),
      success_url: `${origin}/support/FFR-002/checkout?payment=submitted&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/support/FFR-002/checkout?payment=cancelled`,
    }, { idempotencyKey: `directed-${plan.id}` });
    const saved = await supabaseAdmin.from('epew_independent_support_plans').update({ stripe_session_id: session.id }).eq('id', plan.id);
    if (saved.error || !session.url) {
      await stripe.checkout.sessions.expire(session.id);
      throw new Error('Unable to save the checkout.');
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Directed support checkout failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to open secure checkout. Please try again.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    const { data: supporter, error } = await supabaseAdmin.from('supporters').select('id').eq('user_id', user.id).maybeSingle();
    if (error || !supporter) return NextResponse.json({ error: 'Supporter not found.' }, { status: 403 });
    const id = new URL(request.url).searchParams.get('session_id');
    if (!id || !/^cs_[a-zA-Z0-9_]+$/.test(id)) return NextResponse.json({ error: 'Invalid checkout.' }, { status: 400 });
    const { data: plan, error: planError } = await supabaseAdmin.from('epew_independent_support_plans')
      .select('id,selected_entrepreneur_id').eq('stripe_session_id', id).eq('supporter_id', supporter.id).not('selected_entrepreneur_id', 'is', null).maybeSingle();
    if (planError || !plan) return NextResponse.json({ error: 'Checkout not found.' }, { status: 404 });
    const session = await stripe.checkout.sessions.retrieve(id);
    if (session.metadata?.supporter_id !== supporter.id || session.metadata?.independent_plan_id !== plan.id)
      return NextResponse.json({ error: 'Checkout mismatch.' }, { status: 403 });
    if (session.payment_status === 'paid') await independentCheckout(session);
    const payment = await supabaseAdmin.from('epew_independent_support_payments').select('id').eq('plan_id', plan.id).eq('initial_payment', true).maybeSingle();
    if (payment.error) throw payment.error;
    return NextResponse.json({ recorded: !!payment.data }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Payment confirmation pending.' }, { status: 500 }); }
}
