import { NextResponse } from "next/server";
import { restaurantAdministrator } from "@/lib/restaurant-operations/authorize";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic="force-dynamic";
export async function GET(_request:Request,context:{params:Promise<{unit:string;fileId:string}>}){
 const headers={"Cache-Control":"private, no-store"};
 try{
  if(!await restaurantAdministrator())return NextResponse.json({error:"Administrator sign-in required."},{status:403,headers});
  const {unit,fileId}=await context.params;
  if(!/^FFR-\d{3,}$/.test(unit)||! /^[a-f0-9-]{36}$/i.test(fileId))return NextResponse.json({error:"Invalid attachment."},{status:400,headers});
  const {data:file,error}=await supabaseAdmin.from("epew_restaurant_work_files").select("bucket,object_key,file_name").eq("id",fileId).eq("restaurant_unit_id",unit).maybeSingle();
  if(error||!file)return NextResponse.json({error:"Attachment not found."},{status:404,headers});
  const {data,error:linkError}=await supabaseAdmin.storage.from(file.bucket).createSignedUrl(file.object_key,300,{download:file.file_name});
  if(linkError||!data?.signedUrl)return NextResponse.json({error:"Attachment unavailable."},{status:503,headers});
  return new NextResponse(null,{status:302,headers:{...headers,Location:data.signedUrl,"Referrer-Policy":"no-referrer"}});
 }catch{return NextResponse.json({error:"Attachment unavailable."},{status:503,headers});}
}
