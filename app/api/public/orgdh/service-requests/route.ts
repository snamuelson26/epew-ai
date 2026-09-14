import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function clean(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = clean(body.name, 200);
    const email = clean(body.email, 320).toLowerCase();
    const phone = clean(body.phone, 50);
    const businessName = clean(body.businessName, 250);
    const serviceInterest = clean(body.serviceInterest, 150);
    const goalDescription = clean(body.goalDescription, 5000);
    const website = clean(body.website, 200);

    if (website) return NextResponse.json({ success: true, message: "Your service request was submitted successfully." });
    if (!name || !email || !serviceInterest || goalDescription.length < 20) {
      return NextResponse.json({ error: "Please provide your name, email, service area, and a project description of at least 20 characters." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("orgdh_service_requests").insert({
      requester_name: name,
      requester_email: email,
      requester_phone: phone || null,
      business_name: businessName || null,
      service_interest: serviceInterest,
      goal_description: goalDescription,
      source_page: "/services/orgdh-network",
      status: "new",
    });

    if (error) {
      console.error("ORGDH service request insert error:", error);
      return NextResponse.json({ error: "Unable to submit your request. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "ORGDH Network received your request. The promotion and design team will follow up using the contact information you provided." });
  } catch (error) {
    console.error("ORGDH service request error:", error);
    return NextResponse.json({ error: "Unable to submit your request. Please try again." }, { status: 500 });
  }
}
