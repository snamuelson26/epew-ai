import {NextResponse} from "next/server";
import {coachAccess,coachOperation} from "@/lib/coaches/agentAccess";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const a=await coachAccess();if(!a)return NextResponse.json({error:"Verified coach access required"},{status:403});
 try{const assignment=new URL(request.url).searchParams.get("assignment");return NextResponse.json(assignment?await coachOperation(a.user.id,"record",{assignment}):{profile:a.profile,assignments:await coachOperation(a.user.id,"assignments"),referrals:await coachOperation(a.user.id,"referrals")},{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({error:"Current assignment access required"},{status:403});}
}
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const a=await coachAccess();if(!a)return NextResponse.json({error:"Verified coach access required"},{status:403});
 try{const b=await request.json();if(!["message","note","task","refer_to_samuel"].includes(b.action)||typeof b.body!=="string"||b.body.length>10000)return NextResponse.json({error:"Invalid action"},{status:400});return NextResponse.json(await coachOperation(a.user.id,b.action,{assignment:b.assignment,body:b.body,due:b.due??undefined}),{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({error:"Operation denied or unavailable"},{status:403});}
}
