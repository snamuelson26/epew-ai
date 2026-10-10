import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { communicationAccess,accessibleThread,communicationLog } from "@/lib/communications/supporterAccess";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const a=await communicationAccess();if(!a)return NextResponse.json({error:"Please sign in."},{status:401});
  const form=await request.formData();const file=form.get("file");const threadId=String(form.get("threadId") || "");
  if(!(file instanceof File) || file.size===0 || file.size>10*1024*1024)return NextResponse.json({error:"Choose a file up to 10 MB."},{status:400});
  const allowed:Record<string,string>={"application/pdf":"pdf","image/png":"png","image/jpeg":"jpg"};
  if(!allowed[file.type])return NextResponse.json({error:"Upload a PDF, PNG or JPEG."},{status:400});
  const bytes=Buffer.from(await file.arrayBuffer());
  const signature=file.type==="application/pdf"?bytes.subarray(0,5).toString()==="%PDF-":file.type==="image/png"?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(!signature)return NextResponse.json({error:"The file format does not match its type."},{status:400});
  let supporterId=a.supporter?.id || null;let internal=false;
  if(threadId){const thread=await accessibleThread(threadId,a);if(!thread)return NextResponse.json({error:"Conversation not found."},{status:404});supporterId=thread.supporter_id;internal=thread.internal;}
  else if(a.staff)return NextResponse.json({error:"Open a conversation before uploading."},{status:400});
  const id=randomUUID();const storagePath=`${supporterId || "internal"}/${id}.${allowed[file.type]}`;
  const upload=await supabaseAdmin.storage.from("epew-supporter-communications").upload(storagePath,bytes,{contentType:file.type,upsert:false});if(upload.error)throw upload.error;
  const saved=await supabaseAdmin.from("epew_supporter_documents").insert({id,supporter_id:supporterId,thread_id:threadId || null,internal,name:file.name.slice(0,200),storage_path:storagePath,uploaded_by:a.user.id}).select("id").single();
  if(saved.error){await supabaseAdmin.storage.from("epew-supporter-communications").remove([storagePath]);throw saved.error;}
  await communicationLog(a.user.id,"document_uploaded",id);
  return NextResponse.json({id},{status:201});
 }catch{return NextResponse.json({error:"Unable to upload document."},{status:500});}
}
export async function GET(request:Request){
 try{
  const a=await communicationAccess();if(!a)return NextResponse.json({error:"Please sign in."},{status:401});
  let q=supabaseAdmin.from("epew_supporter_documents").select("id,supporter_id,internal,storage_path").eq("id",new URL(request.url).searchParams.get("id") || "");
  if(a.supporter)q=q.eq("supporter_id",a.supporter.id).eq("internal",false);
  const doc=await q.maybeSingle();if(!doc.data)return NextResponse.json({error:"Document not found."},{status:404});
  const url=await supabaseAdmin.storage.from("epew-supporter-communications").createSignedUrl(doc.data.storage_path,60);if(url.error)throw url.error;
  await communicationLog(a.user.id,"document_opened",doc.data.id);
  return NextResponse.redirect(url.data.signedUrl,{headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
 }catch{return NextResponse.json({error:"Unable to open document."},{status:500});}
}
