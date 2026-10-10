import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { certificateEligible } from "@/lib/enterprise/supporters/certificateEligibility";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    const params = new URL(request.url).searchParams;
    const language = params.get("language");
    const kind = params.get("kind") || "certificate";
    if (!["certificate", "letter"].includes(kind)) return NextResponse.json({error:"Document not found."},{status:404});
    if (!["en", "ht"].includes(language || "")) return NextResponse.json({ error: "Choose English or Haitian Creole." }, { status: 400 });
    const profile = await supabaseAdmin.from("supporters").select("id").eq("user_id", user.id).maybeSingle();
    if (profile.error) throw profile.error;
    if (!profile.data) return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    const payment = await supabaseAdmin.from("supporter_transactions").select("id,status,amount,units,entrepreneur_id").eq("id", params.get("transactionId") || "").eq("supporter_id", profile.data.id).maybeSingle();
    if (payment.error) throw payment.error;
    if (!payment.data || !certificateEligible(payment.data)) return NextResponse.json({ error: "Certificate not available for this payment." }, { status: 404 });
    const document = await supabaseAdmin.storage.from("epew-supporter-communications").download(`issued/maryse-${kind === "letter" ? "letter-" : ""}${language}.pdf`);
    if (document.error) throw document.error;
    const pdf = Buffer.from(await document.data.arrayBuffer());
    return new NextResponse(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="EPEW-Support-${kind}-${language}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Unable to open your certificate. Please retry." }, { status: 500 });
  }
}
