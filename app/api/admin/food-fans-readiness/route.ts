import {NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabaseAdmin';
import {restaurantAdministrator} from '@/lib/restaurant-operations/authorize';
import {operationSchemas,validateOperation} from '@/lib/food-fans-operations/schema';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){try{
 if(!await restaurantAdministrator())return reply({error:'Administrator sign-in required.'},403);
 const url=new URL(request.url),unit=url.searchParams.get('unit')||'FFR-001',kind=url.searchParams.get('kind')||'gate',page=Number(url.searchParams.get('page')||0);
 if(!/^FFR-[0-9]{3,}$/.test(unit)||!operationSchemas[kind]||!Number.isSafeInteger(page)||page<0||page>100000)return reply({error:'Invalid filter.'},400);
 const result=await Promise.all([
 supabaseAdmin.from('epew_ffr_operations_records').select('*',{count:'exact'}).eq('restaurant_unit_id',unit).eq('kind',kind).order('record_key',{ascending:kind!=='daily'}).range(page*100,page*100+99),
 supabaseAdmin.from('epew_ffr_operations_records').select('*').eq('restaurant_unit_id',unit).in('kind',['gate','role','opening']).order('record_key'),
 supabaseAdmin.from('epew_ffr_operations_revisions').select('kind,record_key,version,reason,created_at').eq('restaurant_unit_id',unit).order('created_at',{ascending:false}).limit(25)]);
 if(result.some(r=>r.error))return reply({error:'Operating records unavailable.'},503);
 return reply({records:result[0].data,total:result[0].count,readiness:result[1].data,history:result[2].data});
 }catch{return reply({error:'Operating records unavailable.'},503);}}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Invalid origin.'},403);
 try{const actor=await restaurantAdministrator();if(!actor)return reply({error:'Administrator sign-in required.'},403);
 const raw=await request.json();if(!/^FFR-[0-9]{3,}$/.test(raw.restaurant_unit_id||''))return reply({error:'Invalid restaurant.'},400);
 const input=raw.action==='initialize'?{action:'initialize',request_id:raw.request_id,reason:raw.reason}:validateOperation(raw);
 if(!input||typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>4000||!/^[a-f0-9-]{36}$/i.test(input.request_id||''))return reply({error:'Check required fields and record values.'},400);
 const {data,error}=await supabaseAdmin.rpc('epew_ffr_operations_save',{p_actor:actor.id,p_email:actor.email,p_unit:raw.restaurant_unit_id,p_input:input});
 if(error)return reply({error:error.code==='40001'?'Record changed. Reload before saving.':'Save rejected. Verify gate prerequisites, assigned owners, evidence, dates, opening confirmation and daily totals.'},error.code==='40001'?409:['22023','22P02','23514','23503','23505','22007','22008'].includes(error.code)?400:503);
 return data?.saved?reply(data):reply({error:'Save not confirmed.'},503);
 }catch{return reply({error:'Invalid request or unavailable service.'},400);}}
