import {supabaseAdmin} from "@/lib/supabaseAdmin";
import {createClient} from "@/lib/supabase/server";
export async function coachOperation(actor:string,action:string,options:{assignment?:string,body?:string,due?:string,path?:string,document?:string}={}) {
 const {data,error}=await supabaseAdmin.rpc("epew_coach_agent_operation",{p_actor:actor,p_action:action,p_assignment:options.assignment??null,p_body:options.body??null,p_due:options.due??null,p_path:options.path??null,p_document:options.document??null});
 if(error) throw new Error("Operation denied or unavailable. Check your current coach account and assignment.");
 return data;
}
export async function coachAccess(){
 const client=await createClient();const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.email_confirmed_at)return null;
 try{return {user,profile:await coachOperation(user.id,"profile")};}catch{return null;}
}
