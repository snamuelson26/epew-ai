import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DOMESTIC_COUNTRIES = new Set([
  "united states",
  "united states of america",
  "usa",
  "us",
  "canada",
]);

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const fullName = cleanString(body.full_name);
    const email = cleanString(body.email).toLowerCase();
    const phone = cleanString(body.phone);

    const businessName = cleanString(body.business_name);
    const country = cleanString(body.country);

    const yearsOperatingRaw = body.years_operating;
    const yearsOperating =
      yearsOperatingRaw === "" ||
      yearsOperatingRaw === null ||
      yearsOperatingRaw === undefined
        ? null
        : Number(yearsOperatingRaw);

    const registrationStatus = cleanString(body.registration_status);
    const registrationNumber = cleanString(body.registration_number);
    const businessAddress = cleanString(body.business_address);
    const website = cleanString(body.website);

    const productService = cleanString(body.product_service);
    const currentOperations = cleanString(body.current_operations);
    const requestReason = cleanString(body.request_reason);
    const supportingEvidence = cleanString(body.supporting_evidence);

    if (
      !fullName ||
      !email ||
      !businessName ||
      !country ||
      yearsOperating === null ||
      !registrationStatus ||
      !businessAddress ||
      !productService ||
      !currentOperations ||
      !requestReason
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please complete all required fields.",
        },
        { status: 400 },
      );
    }

    if (DOMESTIC_COUNTRIES.has(country.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Applicants based in the United States or Canada do not need an International Individual Special Request. Please use the regular Individual Entrepreneur application.",
        },
        { status: 400 },
      );
    }

    if (
      yearsOperating !== null &&
      (!Number.isFinite(yearsOperating) || yearsOperating <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid number of years in operation.",
        },
        { status: 400 },
      );
    }

    const { data: existingRequest, error: duplicateCheckError } =
      await supabaseAdmin
        .from("entrepreneur_international_special_requests")
        .select("id,status")
        .eq("email", email)
        .eq("business_name", businessName)
        .in("status", [
          "Pending Review",
          "Additional Information Requested",
          "Approved",
          "Application Invitation Sent",
        ])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (duplicateCheckError) {
      console.error(
        "International special request duplicate check failed:",
        duplicateCheckError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify your existing request. Please try again.",
        },
        { status: 500 },
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A current International Individual Special Request already exists for this email address and business.",
          status: existingRequest.status,
        },
        { status: 409 },
      );
    }

    const { data: insertedRequest, error: insertError } =
      await supabaseAdmin
        .from("entrepreneur_international_special_requests")
        .insert({
          full_name: fullName,
          email,
          phone: phone || null,
          business_name: businessName,
          country,
          years_operating: yearsOperating,
          registration_status: registrationStatus || null,
          registration_number: registrationNumber || null,
          business_address: businessAddress || null,
          website: website || null,
          product_service: productService,
          current_operations: currentOperations || null,
          request_reason: requestReason,
          supporting_evidence: supportingEvidence || null,
          status: "Pending Review",
        })
        .select("id,status,created_at")
        .single();

    if (insertError) {
      console.error(
        "Unable to create International Individual Special Request:",
        insertError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to submit your International Individual Special Request.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      request_id: insertedRequest.id,
      status: insertedRequest.status,
      created_at: insertedRequest.created_at,
      message:
        "Your International Individual Special Request has been received and is pending EPEW review.",
    });
  } catch (error) {
    console.error(
      "International Individual Special Request API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process your request. Please try again.",
      },
      { status: 500 },
    );
  }
}
