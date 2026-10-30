import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { restaurantAdministrator } from "@/lib/restaurant-operations/authorize";
import { validateNetworkRecord,networkSchemas } from "@/lib/restaurant-operations/network-schema";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){
 try {
 if(!await restaurantAdministrator())return reply({error:"Administrator sign-in required."},403);
 const url=new URL(request.url),kind=url.searchParams.get('kind')||'menu',unit=url.searchParams.get('unit')||'FFR-001',page=Number(url.searchParams.get('page')||0);
 if(!networkSchemas[kind]||!/^FFR-[0-9]{3,}$/.test(unit)||!Number.isSafeInteger(page)||page<0||page>100000)return reply({error:"Invalid filter."},400);
 const results=await Promise.all([
 supabaseAdmin.from('epew_ffr_network_records').select('*',{count:'exact'}).eq('restaurant_unit_id',unit).eq('kind',kind).order('record_key').range(page*100,page*100+99),
 supabaseAdmin.from('epew_ffr_management_summary').select('*').order('restaurant_unit_id'),
 supabaseAdmin.from('epew_ffr_expansion_report').select('*').eq('restaurant_unit_id',unit).order('member_count',{ascending:false}).range(page*100,page*100+99),
 supabaseAdmin.from('epew_ffr_member_segments').select('*').eq('restaurant_unit_id',unit).order('members',{ascending:false}).range(page*100,page*100+99),
 supabaseAdmin.from('epew_ffr_network_revisions').select('id,kind,record_key,version,reason,created_at').eq('restaurant_unit_id',unit).eq('kind',kind).order('created_at',{ascending:false}).limit(30),
 supabaseAdmin.from('epew_ffr_translation_readiness').select('*').eq('restaurant_unit_id',unit).order('page_id').order('translation_key').range(page*100,page*100+99)
 ]);
 if(results.some(r=>r.error))return reply({error:"Network records could not be loaded."},503);
 return reply({records:results[0].data,total:results[0].count,summary:results[1].data,expansion:results[2].data,segments:results[3].data,history:results[4].data,translations:results[5].data,page});
 }catch{return reply({error:"Network service unavailable."},503);}
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:"Invalid origin."},403);
 try{
 const actor=await restaurantAdministrator();if(!actor)return reply({error:"Administrator sign-in required."},403);
 const raw=await request.json(),input=validateNetworkRecord(raw);
 if(!input||!/^FFR-[0-9]{3,}$/.test(raw.restaurant_unit_id||''))return reply({error:"Check required fields and record identity."},400);
 if(input.kind==='portal_link'){
 const {data,error}=await supabaseAdmin.auth.admin.getUserById(String(input.data.auth_user_id));
 if(error||!data.user?.email_confirmed_at)return reply({error:"A verified EPEW account is required."},400);
 }
 const {data,error}=await supabaseAdmin.rpc('epew_ffr_network_save',{p_actor:actor.id,p_actor_email:actor.email,p_unit:raw.restaurant_unit_id,p_input:input});
 if(error)return reply({error:error.code==='40001'?"Record changed. Reload before saving.":"Record could not be saved. Check IDs, dates, scope, references and ORGDH confirmation requirements."},error.code==='40001'?409:['22023','22P02','23514','23505','23503'].includes(error.code)?400:503);
 return data?.saved?reply(data):reply({error:"Save not confirmed."},503);
 }catch{return reply({error:"Invalid request or unavailable service."},400);}
}
