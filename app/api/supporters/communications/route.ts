import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { communicationAccess, accessibleThread, communicationLog } from "@/lib/communications/supporterAccess";
import { certificateEligible } from "@/lib/enterprise/supporters/certificateEligibility";
const recipients = ["Yamiley Noslen", "EPEW Admin", "Technical Support", "Payment Support", "Assigned Coach"];
export async function GET(request: Request) {
 try {
  const a = await communicationAccess();
  if (!a) return NextResponse.json({ error: "Please sign in to an authorized account." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("threadId");
  if (id) {
   const thread = await accessibleThread(id,a);
   if (!thread) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
   const messages = await supabaseAdmin.from("epew_supporter_thread_messages").select("id,sender_name,sender_user_id,body,created_at").eq("thread_id",id).order("created_at");
   const docs = await supabaseAdmin.from("epew_supporter_documents").select("id,name,created_at").eq("thread_id",id);
   if (messages.error || docs.error) throw messages.error || docs.error;
   return NextResponse.json({ thread,messages:messages.data,documents:docs.data },{headers:{"Cache-Control":"private, no-store"}});
  }
  let q = supabaseAdmin.from("epew_supporter_threads").select("*").order("updated_at",{ascending:false}).limit(200);
  if(a.supporter) q=q.eq("supporter_id",a.supporter.id).eq("internal",false);
  const threads=await q;
  let d = supabaseAdmin.from("epew_supporter_documents").select("id,name,created_at,thread_id").eq("internal",false).order("created_at",{ascending:false}).limit(200);
  if(a.supporter) d=d.eq("supporter_id",a.supporter.id);
  const documents=await d;
  if(threads.error || documents.error) throw threads.error || documents.error;
  const sent = await supabaseAdmin.from("epew_supporter_thread_messages").select("thread_id").eq("sender_user_id",a.user.id).in("thread_id",(threads.data || []).map(t=>t.id));
  if(sent.error)throw sent.error;
  const sentIds=new Set((sent.data || []).map(m=>m.thread_id));
  let supporters=null;
  if(a.staff){const result=await supabaseAdmin.from("supporters").select("id,full_name").order("full_name").limit(1000);if(result.error)throw result.error;supporters=result.data;}
  let issued=false;
  if(a.supporter){const payment=await supabaseAdmin.from("supporter_transactions").select("id,status,amount,units,entrepreneur_id").eq("supporter_id",a.supporter.id).eq("id","bf1ef08b-fbda-4e33-84d6-9a20bd8006dd").maybeSingle();if(payment.error)throw payment.error;issued=!!payment.data && certificateEligible(payment.data);}
  return NextResponse.json({ identity:{userId:a.user.id,name:a.staff?.display_name || a.supporter?.full_name,staff:!!a.staff,role:a.staff?.role},threads:(threads.data || []).map(t=>({...t,sentByMe:sentIds.has(t.id)})),documents:documents.data,issuedDocuments:issued,supporters },{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"Unable to load communications."},{status:500});}
}
export async function POST(request:Request){
 try{
  const a=await communicationAccess();if(!a)return NextResponse.json({error:"Please sign in."},{status:401});
  const input=await request.json();const body=typeof input.body==="string"?input.body.trim():"";
  if(!body || body.length>10000)return NextResponse.json({error:"Enter a message of up to 10,000 characters."},{status:400});
  let thread;
  if(input.threadId){thread=await accessibleThread(String(input.threadId),a);if(!thread)return NextResponse.json({error:"Conversation not found."},{status:404});}
  else{
   const subject=typeof input.subject==="string"?input.subject.trim():"";
   if(!subject || subject.length>200)return NextResponse.json({error:"Enter a subject of up to 200 characters."},{status:400});
   const internal=!!input.internal;
   if(internal && !a.staff)return NextResponse.json({error:"Staff access required."},{status:403});
   let supporterId=a.supporter?.id || null;
   if(a.staff && !internal){supporterId=String(input.supporterId || "");const target=await supabaseAdmin.from("supporters").select("id").eq("id",supporterId).maybeSingle();if(!target.data)return NextResponse.json({error:"Choose an existing supporter."},{status:400});}
   const recipient=internal?"EPEW Admin":String(input.recipient || "Yamiley Noslen");
   if(!recipients.includes(recipient))return NextResponse.json({error:"Choose a valid contact."},{status:400});
   const result=await supabaseAdmin.from("epew_supporter_threads").insert({supporter_id:supporterId,subject,recipient,internal,created_by:a.user.id}).select().single();if(result.error)throw result.error;thread=result.data;
  }
  const result=await supabaseAdmin.from("epew_supporter_thread_messages").insert({thread_id:thread.id,sender_user_id:a.user.id,sender_name:a.staff?.display_name || a.supporter?.full_name || "EPEW",body}).select("id").single();
  if(result.error)throw result.error;
  const update=await supabaseAdmin.from("epew_supporter_threads").update({updated_at:new Date().toISOString()}).eq("id",thread.id);if(update.error)throw update.error;
  await communicationLog(a.user.id,"message_sent",thread.id);
  return NextResponse.json({threadId:thread.id},{status:201});
 }catch{return NextResponse.json({error:"Unable to send message. Please retry."},{status:500});}
}
