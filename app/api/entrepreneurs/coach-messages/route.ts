import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {supabaseAdmin} from "@/lib/supabaseAdmin";
import {coachOperation} from "@/lib/coaches/agentAccess";
export const dynamic="force-dynamic";
async function identity(){const c=await createClient();const {data:{user},error}=await c.auth.getUser();return !error&&user?.email_confirmed_at?user:null;}
export async function GET(request:Request){
 const user=await identity();if(!user)return NextResponse.json({error:"Verified login required"},{status:401});
 try{
  const document=new URL(request.url).searchParams.get("document");
  if(document){const d=await coachOperation(user.id,"entrepreneur_open_document",{document});const r=await supabaseAdmin.storage.from("epew-coach-documents").createSignedUrl(d.storage_path,60);if(r.error)throw r.error;return NextResponse.json({url:r.data.signedUrl},{headers:{"Cache-Control":"no-store"}});}
  const apps=await supabaseAdmin.from("entrepreneur_applications").select("id").eq("user_id",user.id);if(apps.error)throw apps.error;
  const assignments=await supabaseAdmin.from("coach_assignments").select("id,application_id").in("application_id",(apps.data??[]).map(x=>x.id)).in("assignment_status",["assigned","accepted","active"]).is("ended_at",null);if(assignments.error)throw assignments.error;
  const conversations=[];for(const a of assignments.data??[])conversations.push({assignment_id:a.id,application_id:a.application_id,...await coachOperation(user.id,"entrepreneur_messages",{assignment:a.id})});
  return NextResponse.json({conversations},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Conversation access unavailable"},{status:403});}
}
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const user=await identity();if(!user)return NextResponse.json({error:"Verified login required"},{status:401});
 try{const b=await request.json();if(typeof b.body!=="string"||b.body.length>10000)throw new Error();return NextResponse.json(await coachOperation(user.id,"entrepreneur_send_message",{assignment:b.assignment,body:b.body}),{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({error:"Message denied or unavailable"},{status:403});}
}
