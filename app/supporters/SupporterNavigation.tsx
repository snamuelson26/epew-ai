"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
export default function SupporterNavigation() {
  const [signedIn,setSignedIn]=useState(false);
  useEffect(()=>{let active=true;void supabase.auth.getUser().then(async ({data})=>{if(!data.user)return;const profile=await supabase.from("supporters").select("id").eq("user_id",data.user.id).maybeSingle();if(active)setSignedIn(!!profile.data);});return()=>{active=false;};},[]);
  if(!signedIn)return null;
  return <nav aria-label="Supporter navigation" className="sticky top-0 z-40 flex flex-wrap items-center gap-4 bg-[#06245c] px-5 py-3 text-white">
    <Link href="/supporters/dashboard">Dashboard</Link><Link href="/supporters/payment-center">My transactions</Link><Link href="/supporters/my-supported-businesses">My businesses</Link><Link href="/supporters/messages">Communications</Link><Link href="/supporters/settings">Settings</Link>
    <button className="rounded border px-3 py-1" onClick={async()=>{const {error}=await supabase.auth.signOut();if(error){window.alert("Unable to sign out. Please try again.");return;}window.location.assign("/supporters/login");}}>Sign out</button>
  </nav>;
}
