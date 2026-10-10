import { NextResponse } from "next/server";
import { communicationAccess,communicationLog } from "@/lib/communications/supporterAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export async function POST(){
 const a=await communicationAccess();if(a?.staff?.role!=="director")return NextResponse.json({error:"Director access required."},{status:403});
 const {data,error}=await supabaseAdmin.auth.admin.inviteUserByEmail("ynoslen@epew.us",{redirectTo:"https://www.epew.us/staff/supporter-relations/set-password",data:{full_name:"Yamiley Noslen"}});
 if(error)return NextResponse.json({error:"Invitation could not be delivered. Check whether the account already exists and use password reset."},{status:400});
 await supabaseAdmin.from("epew_supporter_staff").update({user_id:data.user.id}).eq("email","ynoslen@epew.us");
 await communicationLog(a.user.id,"staff_invited",data.user.id);
 return NextResponse.json({sent:true});
}
