import {NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabaseAdmin';
import {restaurantAdministrator} from '@/lib/restaurant-operations/authorize';
import {validateWorkforce,workforceSchemas,csvCell} from '@/lib/food-fans-workforce/schema';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){try{
 if(!await restaurantAdministrator())return reply({error:'Administrator sign-in required.'},403);
 const url=new URL(request.url),unit=url.searchParams.get('unit')||'FFR-001',kind=url.searchParams.get('kind')||'training_plan',page=Number(url.searchParams.get('page')||0);
 if(!/^FFR-[0-9]{3,}$/.test(unit)||!workforceSchemas[kind]||!Number.isSafeInteger(page)||page<0||page>100000)return reply({error:'Invalid filter.'},400);
 const exportId=url.searchParams.get('export_id');
 if(exportId){const {data,error}=await supabaseAdmin.from('epew_ffr_payroll_exports').select('id,lines').eq('restaurant_unit_id',unit).eq('id',exportId).single();if(error||!data)return reply({error:'Export unavailable.'},404);
 const keys=['payroll_record_id','employee_id','provider_employee_id','period_start','period_end','regular_hours','overtime_hours','rate_cents','approval_evidence'];
 const csv=[keys.map(csvCell).join(','),...(data.lines as Record<string,unknown>[]).map(r=>keys.map(k=>csvCell(r[k])).join(','))].join('\r\n');
 return new Response(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="food-fans-payroll-${data.id}.csv"`,'Cache-Control':'private, no-store'}});}
 const result=await Promise.all([supabaseAdmin.from('epew_ffr_workforce_records').select('*',{count:'exact'}).eq('restaurant_unit_id',unit).eq('kind',kind).order('record_key').range(page*100,page*100+99),supabaseAdmin.from('epew_ffr_workforce_revisions').select('kind,record_key,version,reason,created_at').eq('restaurant_unit_id',unit).eq('kind',kind).order('created_at',{ascending:false}).limit(20),supabaseAdmin.from('epew_ffr_payroll_exports').select('id,period_start,period_end,provider,created_at').eq('restaurant_unit_id',unit).order('created_at',{ascending:false}).limit(30)]);
 if(result.some(r=>r.error))return reply({error:'Workforce records unavailable.'},503);
 return reply({records:result[0].data,total:result[0].count,history:result[1].data,exports:result[2].data});
 }catch{return reply({error:'Workforce service unavailable.'},503);}}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Invalid origin.'},403);
 try{const actor=await restaurantAdministrator();if(!actor)return reply({error:'Administrator sign-in required.'},403);
 const raw=await request.json();if(!/^FFR-[0-9]{3,}$/.test(raw.restaurant_unit_id||''))return reply({error:'Invalid restaurant.'},400);
 let input;
 if(raw.action==='export') {if(!/^\d{4}-\d{2}-\d{2}$/.test(raw.period_start)||!/^\d{4}-\d{2}-\d{2}$/.test(raw.period_end)||typeof raw.provider!=='string'||!raw.provider.trim()||raw.provider.length>200||typeof raw.reason!=='string'||!raw.reason.trim()||raw.reason.length>4000||!/^[a-f0-9-]{36}$/i.test(raw.request_id||''))return reply({error:'Export period, provider and review reason required.'},400);input={action:'export',period_start:raw.period_start,period_end:raw.period_end,provider:raw.provider,reason:raw.reason,request_id:raw.request_id};}
 else {input=validateWorkforce(raw);if(!input)return reply({error:'Check required fields and values.'},400);}
 const {data,error}=await supabaseAdmin.rpc('epew_ffr_workforce_save',{p_actor:actor.id,p_email:actor.email,p_unit:raw.restaurant_unit_id,p_input:input});
 if(error)return reply({error:error.code==='40001'?'Record changed. Reload before saving.':'Unable to save. Check employee/role references, dates, training evidence, approved time and payroll totals. Exported time/payroll records are locked.'},error.code==='40001'?409:['22023','22P02','23514','23503','23505','22007','22008'].includes(error.code)?400:503);
 return data?.saved?reply(data):reply({error:'Save not confirmed.'},503);
 }catch{return reply({error:'Invalid request or unavailable service.'},400);}}
