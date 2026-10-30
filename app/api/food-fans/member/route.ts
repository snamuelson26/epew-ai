import { NextResponse } from "next/server";
import {createClient} from "@/lib/supabase/server";
import {supabaseAdmin} from "@/lib/supabaseAdmin";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(){
 try{
 const client=await createClient(),{data,error}=await client.auth.getUser();
 if(error||!data.user?.email_confirmed_at)return reply({error:"Sign in with your verified EPEW account."},401);
 // Server-derived user ID only. No member ID, email or caller-controlled ownership claims.
 const link=await supabaseAdmin.from('epew_ffr_network_records').select('data').eq('kind','portal_link').eq('data->>auth_user_id',data.user.id).maybeSingle();
 if(link.error)return reply({error:"Member service unavailable."},503);
 if(!link.data)return reply({error:"Your Food Fans membership has not been linked to this account. Ask the restaurant manager to verify and link your member ID."},404);
 const id=String(link.data.data.member_id);
 const rows=await Promise.all([
 supabaseAdmin.from('epew_ffr_members').select('member_id,restaurant_unit_id,membership_status,zip_code,preferred_language').eq('member_id',id).single(),
 supabaseAdmin.from('epew_ffr_reward_balances').select('*').eq('member_id',id).single(),
 supabaseAdmin.from('epew_ffr_orders').select('order_id,restaurant_unit_id,created_at,qualifying_quantity,reversed_quantity').eq('member_id',id).eq('payment_status','paid').eq('order_status','completed').gt('qualifying_quantity',0).order('created_at',{ascending:false}).limit(20),
 supabaseAdmin.from('epew_ffr_raffle_status').select('restaurant_unit_id,raffle_year,drawing_id,eligible,opted_in,entry_confirmed,expires_at,expired,current_confirmed_tickets').eq('member_id',id),
 supabaseAdmin.from('epew_ffr_network_records').select('data').eq('kind','membership').eq('data->>member_id',id).maybeSingle()
 ]);
 if(rows.some(r=>r.error))return reply({error:"Member records could not be loaded."},503);
 const tier=rows[4].data?.data,active=tier&&Date.parse(tier.starts_at)<=Date.now()&&Date.parse(tier.expires_at)>Date.now();
 return reply({profile:rows[0].data,balance:rows[1].data,orders:rows[2].data,raffles:rows[3].data,membership:active?{level:tier.level,state_code:tier.state_code,expires_at:tier.expires_at}:null});
 }catch{return reply({error:"Member service unavailable."},503);}
}
