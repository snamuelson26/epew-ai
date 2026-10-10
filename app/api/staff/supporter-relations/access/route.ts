import { NextResponse } from "next/server";
import { communicationAccess } from "@/lib/communications/supporterAccess";
export async function GET(){const a=await communicationAccess();return NextResponse.json({authorized:!!a?.staff,name:a?.staff?.display_name},{status:a?.staff?200:403,headers:{"Cache-Control":"private, no-store"}});}
