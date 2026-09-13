import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Member = { id:string; organization_id:string; email:string; display_name:string; title:string; role_code:string; permissions:Record<string,boolean> };
type Context = { params: Promise<{ path: string[] }> };
const TYPES = ["message","report","assignment","follow_up","proposal","urgent_update"];

function env(name:string,fallback?:string){const value=process.env[name]??fallback;if(!value)throw new Error(`Missing ${name}.`);return value;}
function client(token:string){return createClient(env("NEXT_PUBLIC_SUPABASE_URL"),env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});}
function json(value:unknown,status=200){return NextResponse.json(value,{status,headers:{"Cache-Control":"no-store","Access-Control-Allow-Origin":"*"}});}
function date(value:unknown){if(value===null||value===undefined||value==="")return null;if(typeof value!=="string")throw new Error("Date must be ISO-8601 text.");const d=new Date(value);if(Number.isNaN(d.valueOf()))throw new Error("Invalid date.");return d.toISOString();}
async function auth(request:NextRequest){
 const token=request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return null;
 const supabase=client(token);const {data:userData,error}=await supabase.auth.getUser(token);if(error||!userData.user)return null;
 const {data}=await supabase.from("emanon_staff_members").select("id,organization_id,email,display_name,title,role_code,permissions").eq("user_id",userData.user.id).eq("status","active").maybeSingle();
 return data?{supabase,member:data as Member}:null;
}
function denied(){return new NextResponse(JSON.stringify({error:"OAuth authentication required."}),{status:401,headers:{"content-type":"application/json","WWW-Authenticate":'Bearer resource_metadata="https://www.epew.us/.well-known/oauth-protected-resource", scope="openid email profile offline_access"',"Access-Control-Allow-Origin":"*"}});}
async function conversationIds(supabase:ReturnType<typeof client>,member:Member){
 const {data,error}=await supabase.from("emanon_conversation_members").select("conversation_id").eq("member_id",member.id);if(error)throw error;return (data??[]).map(x=>x.conversation_id);
}
async function contacts(supabase:ReturnType<typeof client>,member:Member){
 const ids=await conversationIds(supabase,member);if(!ids.length)return [];
 const {data:convs,error:ce}=await supabase.from("emanon_conversations").select("id").in("id",ids).eq("organization_id",member.organization_id).eq("conversation_type","direct");if(ce)throw ce;
 const direct=(convs??[]).map(x=>x.id);if(!direct.length)return [];
 const {data,error}=await supabase.from("emanon_conversation_members").select("conversation_id,member:emanon_staff_members!member_id(id,email,display_name,title,role_code)").in("conversation_id",direct).neq("member_id",member.id);if(error)throw error;
 return (data??[]).flatMap(link=>{const other=Array.isArray(link.member)?link.member[0]:link.member;return other?[{...other,conversation_id:link.conversation_id}]:[];});
}
async function authorizedConversation(supabase:ReturnType<typeof client>,member:Member,id:string){
 const ids=await conversationIds(supabase,member);if(!ids.includes(id))return null;
 const {data}=await supabase.from("emanon_conversations").select("id,organization_id,conversation_type,subject,created_at,updated_at").eq("id",id).eq("organization_id",member.organization_id).maybeSingle();return data;
}
async function messageWithAttachment(supabase:ReturnType<typeof client>,conversationIds:string[],path:string){
 if(!conversationIds.length)return null;
 const {data,error}=await supabase.from("emanon_messages").select("id,conversation_id,attachments").in("conversation_id",conversationIds);if(error)throw error;
 return (data??[]).find(m=>Array.isArray(m.attachments)&&m.attachments.some((a:unknown)=>typeof a==="object"&&a!==null&&"path" in a&&(a as {path:unknown}).path===path))??null;
}

export async function OPTIONS(){return new NextResponse(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,content-type","Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS"}});}

export async function GET(request:NextRequest,context:Context){
 const session=await auth(request);if(!session)return denied();const {supabase,member}=session;const path=(await context.params).path??[];
 try{
  if(path[0]==="identity")return json({organization:"Emanon Institute",authenticated:true,identity:member});
  if(path[0]==="contacts")return json({contacts:await contacts(supabase,member)});
  if(path[0]==="conversations"){
   if(path.length===1){
    const ids=await conversationIds(supabase,member);if(!ids.length)return json({conversations:[]});
    const {data,error}=await supabase.from("emanon_conversations").select("id,organization_id,conversation_type,subject,created_at,updated_at").in("id",ids).eq("organization_id",member.organization_id).order("updated_at",{ascending:false});if(error)throw error;
    const people=await contacts(supabase,member);return json({conversations:(data??[]).map(c=>({...c,other_participants:people.filter(p=>p.conversation_id===c.id)}))});
   }
   if(path.length===3&&path[2]==="messages"){
    const conversation=await authorizedConversation(supabase,member,path[1]);if(!conversation)return json({error:"Conversation not found."},404);
    const limit=Math.min(200,Math.max(1,Number(request.nextUrl.searchParams.get("limit"))||100));
    const {data,error}=await supabase.from("emanon_messages").select("id,conversation_id,sender_member_id,message_type,subject,body,parent_message_id,assignment_due_at,follow_up_at,attachments,created_at,updated_at,sender:emanon_staff_members!sender_member_id(id,email,display_name,title),receipts:emanon_message_receipts(member_id,delivered_at,opened_at,member:emanon_staff_members!member_id(email,display_name))").eq("conversation_id",path[1]).order("created_at").limit(limit);if(error)throw error;
    return json({conversation,messages:data??[]});
   }
  }
  if(path[0]==="attachments"){
   const objectPath=request.nextUrl.searchParams.get("path")??"";if(!objectPath)return json({error:"Attachment path is required."},400);
   const ids=await conversationIds(supabase,member);if(!await messageWithAttachment(supabase,ids,objectPath))return json({error:"Attachment not found in an authorized conversation."},404);
   const {data,error}=await supabase.storage.from("emanon-communications").createSignedUrl(objectPath,120);if(error)throw error;return json({path:objectPath,signed_url:data.signedUrl,expires_in:120});
  }
  if(path[0]==="follow-up"){
   const messageId=request.nextUrl.searchParams.get("message_id")??"";if(!messageId)return json({error:"message_id is required."},400);
   const ids=await conversationIds(supabase,member);const {data,error}=await supabase.from("emanon_messages").select("id,conversation_id,follow_up_at,updated_at").eq("id",messageId).in("conversation_id",ids).maybeSingle();if(error)throw error;if(!data)return json({error:"Message not found."},404);return json({follow_up:data});
  }
  return json({error:"Endpoint not found."},404);
 }catch(error){return json({error:error instanceof Error?error.message:"Request failed."},400);}
}

export async function POST(request:NextRequest,context:Context){
 const session=await auth(request);if(!session)return denied();const {supabase,member}=session;const path=(await context.params).path??[];const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
 try{
  if(!body)return json({error:"JSON body required."},400);
  if(path[0]==="attachments"){
   const conversationId=typeof body.conversation_id==="string"?body.conversation_id:"";if(!await authorizedConversation(supabase,member,conversationId))return json({error:"Conversation not found."},404);
   if(typeof body.name!=="string"||typeof body.mime_type!=="string"||typeof body.base64!=="string")return json({error:"name, mime_type, and base64 are required."},400);
   const bytes=Buffer.from(body.base64,"base64");if(!bytes.length||bytes.length>2*1024*1024)return json({error:"Attachment must be between 1 byte and 2 MB."},413);
   const safe=body.name.replace(/[^a-zA-Z0-9._-]/g,"_");const objectPath=`${member.organization_id}/${member.id}/${crypto.randomUUID()}-${safe}`;
   const {error}=await supabase.storage.from("emanon-communications").upload(objectPath,bytes,{contentType:body.mime_type});if(error)throw error;
   return json({attachment:{name:body.name,path:objectPath,mime_type:body.mime_type,size:bytes.length}},201);
  }
  if(path[0]==="messages"){
   const conversationId=typeof body.conversation_id==="string"?body.conversation_id:"";if(!await authorizedConversation(supabase,member,conversationId))return json({error:"Conversation not found."},404);
   const type=typeof body.message_type==="string"?body.message_type:"message";if(!TYPES.includes(type))return json({error:"Invalid message_type."},400);
   if((type==="assignment"||type==="follow_up")&&member.role_code!=="program_director")return json({error:"Only the Program Director may issue assignments or follow-up instructions."},403);
   if(type==="report"&&member.role_code!=="strategic_partnerships_director")return json({error:"Reports must be submitted by the authorized partnerships director."},403);
   const text=typeof body.body==="string"?body.body.trim():"";if(!text)return json({error:"Message body is required."},400);
   const attachments=Array.isArray(body.attachments)?body.attachments:[];
   for(const a of attachments){const item=a as {path?:unknown};if(typeof item.path!=="string"||!item.path.startsWith(`${member.organization_id}/${member.id}/`))return json({error:"An attachment was not uploaded by this authenticated sender."},403);}
   let parent:string|null=null;if(typeof body.parent_message_id==="string"){const {data:p}=await supabase.from("emanon_messages").select("id").eq("id",body.parent_message_id).eq("conversation_id",conversationId).maybeSingle();if(!p)return json({error:"Reply target is not in this conversation."},400);parent=p.id;}
   const {data,error}=await supabase.from("emanon_messages").insert({organization_id:member.organization_id,conversation_id:conversationId,sender_member_id:member.id,message_type:type,subject:typeof body.subject==="string"&&body.subject.trim()?body.subject.trim():null,body:text,parent_message_id:parent,assignment_due_at:type==="assignment"?date(body.assignment_due_at):null,follow_up_at:date(body.follow_up_at),attachments}).select("id,conversation_id,message_type,subject,body,parent_message_id,assignment_due_at,follow_up_at,attachments,created_at").single();if(error)throw error;
   return json({sent:true,sender:member,message:data},201);
  }
  if(path[0]==="follow-up")return updateFollowUp(supabase,member,body);
  return json({error:"Endpoint not found."},404);
 }catch(error){return json({error:error instanceof Error?error.message:"Request failed."},400);}
}

async function updateFollowUp(supabase:ReturnType<typeof client>,member:Member,body:Record<string,unknown>){
 const messageId=typeof body.message_id==="string"?body.message_id:"";if(!messageId)return json({error:"message_id is required."},400);
 const followUp=date(body.follow_up_at);const {data,error}=await supabase.from("emanon_messages").update({follow_up_at:followUp,updated_at:new Date().toISOString()}).eq("id",messageId).eq("sender_member_id",member.id).select("id,conversation_id,follow_up_at,updated_at").maybeSingle();if(error)throw error;if(!data)return json({error:"Only the original sender may update this message's follow-up date."},403);return json({updated:true,follow_up:data});
}
export async function PATCH(request:NextRequest,context:Context){
 const session=await auth(request);if(!session)return denied();const path=(await context.params).path??[];if(path[0]!=="follow-up")return json({error:"Endpoint not found."},404);
 const body=await request.json().catch(()=>null) as Record<string,unknown>|null;if(!body)return json({error:"JSON body required."},400);
 try{return await updateFollowUp(session.supabase,session.member,body);}catch(error){return json({error:error instanceof Error?error.message:"Request failed."},400);}
}
