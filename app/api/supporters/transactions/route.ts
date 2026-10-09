import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";
import { findIntentCheckout, verifyOwnedCheckout } from "@/lib/enterprise/supporters/checkoutVerification";
import { benefitSchedule } from "@/lib/enterprise/supporters/paymentPresentation";
import { certificateEligible } from "@/lib/enterprise/supporters/certificateEligibility";

async function owner() {
  const client = await createClient();
  const {data:{user},error} = await client.auth.getUser();
  if (error || !user) return null;
  const profile = await supabaseAdmin.from("supporters").select("id").eq("user_id",user.id).maybeSingle();
  if (profile.error) throw profile.error;
  return profile.data;
}
export async function GET() {
  try {
    const supporter = await owner();
    if (!supporter) return NextResponse.json({error:"Please sign in."},{status:401});
    const [payments,intents] = await Promise.all([
      supabaseAdmin.from("supporter_transactions").select("id,entrepreneur_id,amount,units,frequency,status,created_at,annual_benefit_rate,support_intent_id").eq("supporter_id",supporter.id).order("created_at",{ascending:false}),
      supabaseAdmin.from("epew_support_intents").select("id,supporter_id,total_amount,unit_count,payment_frequency,status,paid_at,created_at,supporter_selected_entrepreneur_id,support_term_months,participation_benefit_rate").eq("supporter_id",supporter.id).order("created_at",{ascending:false})
    ]);
    if (payments.error || intents.error) throw payments.error || intents.error;
    const checkoutStates: Record<string,string> = {};
    let reconciled = false;
    await Promise.all((intents.data||[]).filter(i=>!i.paid_at && i.status !== "cancelled").slice(0,10).map(async i=>{
      try {
        const session = await findIntentCheckout(i);
        const result = await verifyOwnedCheckout(session,supporter.id);
        checkoutStates[i.id] = result.state;
        if(result.recorded) reconciled=true;
      } catch { checkoutStates[i.id]="unverified"; }
    }));
    if(reconciled) {
      const latest = await supabaseAdmin.from("supporter_transactions").select("id,entrepreneur_id,amount,units,frequency,status,created_at,annual_benefit_rate,support_intent_id").eq("supporter_id",supporter.id).order("created_at",{ascending:false});
      if(latest.error) throw latest.error;
      payments.data=latest.data;
    }
    const ids = [...new Set([...(payments.data||[]).map(p=>p.entrepreneur_id),...(intents.data||[]).map(i=>i.supporter_selected_entrepreneur_id)].filter(Boolean))];
    const businesses = ids.length ? await supabaseAdmin.from("entrepreneurs").select("id,business_name").in("id",ids) : {data:[],error:null};
    if (businesses.error) throw businesses.error;
    const name = (id:string) => businesses.data?.find(b=>b.id===id)?.business_name || "EPEW-selected business";
    return NextResponse.json({
      transactions:(payments.data||[]).map(p=>{
        const intent = intents.data?.find(i=>i.id===p.support_intent_id);
        const paidDate = intent?.paid_at || p.created_at;
        const rate = Number(p.units) > 0
          ? (["weekly","monthly"].includes(p.frequency) ? 6 : Number(p.annual_benefit_rate || intent?.participation_benefit_rate || 8))
          : 0; // Independent additional funds have no confirmed unit-benefit terms here.
        return {...p,certificateAvailable:certificateEligible(p),businessName:name(p.entrepreneur_id),paidDate,schedule:p.status==="paid" ? benefitSchedule(Number(p.amount),rate,paidDate) : null};
      }),
      requests:(intents.data||[]).filter(i=>!i.paid_at && !(payments.data||[]).some(p=>p.support_intent_id===i.id && p.status==="paid")).map(i=>({...i,checkoutState:checkoutStates[i.id]||"unverified",businessName:name(i.supporter_selected_entrepreneur_id)}))
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch {return NextResponse.json({error:"Unable to load payment records. Please retry."},{status:500});}
}
export async function POST(req:Request) {
  try {
    if (req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({error:"Invalid request origin."},{status:403});
    const supporter = await owner();
    if (!supporter) return NextResponse.json({error:"Please sign in."},{status:401});
    const {intentId,action} = await req.json();
    if (typeof intentId!=="string" || !["check","finish","cancel"].includes(action)) return NextResponse.json({error:"Invalid action."},{status:400});
    const {data:intent,error} = await supabaseAdmin.from("epew_support_intents").select("id,supporter_id,status,created_at,paid_at").eq("id",intentId).eq("supporter_id",supporter.id).maybeSingle();
    if (error) throw error;
    if (!intent) return NextResponse.json({error:"Request not found."},{status:404});
    const session = await findIntentCheckout(intent);
    const verified = await verifyOwnedCheckout(session,supporter.id);
    if (verified.state==="paid") return NextResponse.json({message:verified.recorded?"Payment confirmed and recorded in your portal.":"Stripe confirmed payment. EPEW is synchronizing the record. Do not pay again."});
    if (verified.state==="processing") return NextResponse.json({message:"Payment submitted; awaiting bank/payment confirmation. Do not pay again. Cancellation here is unavailable after submission."});
    if (action==="cancel") {
      if(session.status==="open") await stripe.checkout.sessions.expire(session.id);
      const result = await supabaseAdmin.from("epew_support_intents").update({status:"cancelled",cancelled_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",intent.id).eq("supporter_id",supporter.id).is("paid_at",null).in("status",["payment_pending","payment_failed"]);
      if(result.error) throw result.error;
      return NextResponse.json({message:"Unpaid checkout cancelled. This does not refund or cancel a submitted payment."});
    }
    if (action==="finish" && session.status==="open" && session.url && intent.status!=="cancelled") return NextResponse.json({url:session.url});
    return NextResponse.json({message:session.status==="expired"?"Checkout expired. No payment was confirmed for this request. You may start a new checkout after checking your other requests.":"Finish your transaction or cancel this unpaid checkout."});
  } catch(error) {
    console.error("Supporter payment action failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({error:"We could not safely verify this checkout. Please contact EPEW before paying again."},{status:409});
  }
}
