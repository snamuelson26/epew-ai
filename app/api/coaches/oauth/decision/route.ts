import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {coachAccess,coachOperation} from "@/lib/coaches/agentAccess";
export async function POST(request:Request){
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const access=await coachAccess();if(!access)return NextResponse.json({error:"Verified bound coach access required"},{status:403});
 const f=await request.formData();const id=f.get("authorization_id"),decision=f.get("decision");if(typeof id!=="string"||!id||!["approve","deny"].includes(String(decision)))return NextResponse.json({error:"Invalid authorization"},{status:400});
 const client=await createClient();const r=decision==="approve"?await client.auth.oauth.approveAuthorization(id):await client.auth.oauth.denyAuthorization(id);
 if(r.error||!r.data)return NextResponse.json({error:"Authorization failed"},{status:400});
 await coachOperation(access.user.id,decision==="approve"?"connection_approved":"connection_denied");
 return NextResponse.redirect(r.data.redirect_url,{status:303});
}
