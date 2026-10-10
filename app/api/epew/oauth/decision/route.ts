import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { communicationAccess, communicationLog } from "@/lib/communications/supporterAccess";
export async function POST(request:Request){
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const access=await communicationAccess();if(!access?.staff||access.staff.user_id!==access.user.id)return NextResponse.json({error:"Confirmed EPEW staff access required"},{status:403});
 const f=await request.formData();const id=f.get("authorization_id"),decision=f.get("decision");if(typeof id!=="string"||!id||!["approve","deny"].includes(String(decision)))return NextResponse.json({error:"Invalid authorization"},{status:400});
 const client=await createClient();const result=decision==="approve"?await client.auth.oauth.approveAuthorization(id):await client.auth.oauth.denyAuthorization(id);
 if(result.error||!result.data)return NextResponse.json({error:"Authorization failed"},{status:400});
 await communicationLog(access.user.id,decision==="approve"?"agent_connection_approved":"agent_connection_denied",access.user.id);
 return NextResponse.redirect(result.data.redirect_url,{status:303});
}
