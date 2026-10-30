import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { restaurantAdministrator } from "@/lib/restaurant-operations/authorize";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
const types: Record<string,string> = { pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",txt:"text/plain",csv:"text/csv",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
export async function POST(request: Request, context: { params: Promise<{unit:string}> }) {
 if(request.headers.get("origin")!==new URL(request.url).origin) return reply({error:"Invalid request origin."},403);
 try {
  const actor=await restaurantAdministrator(); if(!actor) return reply({error:"Administrator sign-in required."},403);
  const {unit}=await context.params;if(!/^FFR-\d{3,}$/.test(unit))return reply({error:"Invalid restaurant unit."},400);
  const body=await request.formData(),file=body.get("file"),task=String(body.get("task_id")||""),reason=String(body.get("reason")||"").trim();
  if(!(file instanceof File)||!file.size||file.size>20971520||!reason||reason.length>4000||! /^[a-f0-9-]{36}$/i.test(task))return reply({error:"Choose a task, file up to 20 MB, and evidence description."},400);
  const ext=file.name.split(".").pop()?.toLowerCase()||"",mime=types[ext]; if(!mime)return reply({error:"Use PDF, PNG, JPEG, WebP, TXT, CSV, DOCX, or XLSX."},400);
  const {data:work,error:workError}=await supabaseAdmin.from("epew_restaurant_work_items").select("id").eq("id",task).eq("restaurant_unit_id",unit).maybeSingle();
  if(workError||!work)return reply({error:"Task not found for this restaurant."},400);
  const key=`${unit}/${task}/${randomUUID()}.${ext}`;
  const {error:uploadError}=await supabaseAdmin.storage.from("epew-restaurant-evidence").upload(key,await file.arrayBuffer(),{contentType:mime,upsert:false});
  if(uploadError)return reply({error:"Private evidence upload failed."},503);
  const {data:id,error}=await supabaseAdmin.rpc("epew_restaurant_attach_file",{p_actor:actor.id,p_email:actor.email,p_unit:unit,p_task:task,p_object_key:key,p_name:file.name.slice(0,250),p_mime:mime,p_size:file.size,p_reason:reason});
  if(error||!id){await supabaseAdmin.storage.from("epew-restaurant-evidence").remove([key]);return reply({error:"Evidence registration failed; no saved attachment was confirmed."},503);}
  return reply({saved:true,file_id:id});
 }catch{return reply({error:"Evidence upload unavailable."},503);}
}
