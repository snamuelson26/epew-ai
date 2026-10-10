import { redirect } from "next/navigation";
import { communicationAccess } from "@/lib/communications/supporterAccess";
import SupporterCommunications from "@/app/components/SupporterCommunications";
import StaffSignout from "./signout";
export const dynamic="force-dynamic";
export default async function StaffPage(){const a=await communicationAccess();if(!a?.staff)redirect("/staff/supporter-relations/login");return <main className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto mb-4 flex max-w-6xl justify-between"><a href={a.staff.role==="director"?"/admin/dashboard":"/staff/supporter-relations"}>EPEW</a><StaffSignout/></div><SupporterCommunications staff/></main>;}
