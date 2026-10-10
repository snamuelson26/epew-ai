"use client";
import {supabase} from "@/lib/supabase";
export default function StaffSignout(){return <button onClick={async()=>{const r=await supabase.auth.signOut();if(!r.error)window.location.assign("/staff/supporter-relations/login");}}>Sign out</button>;}
