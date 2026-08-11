import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";
import {
  removeVerificationDocuments,
  uploadVerificationDocuments,
  type VerificationDocumentPaths,
} from "@/lib/entrepreneurs/verificationDocuments";

export const runtime = "nodejs";

const DOMESTIC_COUNTRIES = new Set([
  "united states",
  "united states of america",
  "usa",
  "us",
  "canada",
]);

function cleanString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: FormDataEntryValue | null): string {
  return cleanString(value).toLowerCase();
}

function getFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  let uploadedDocuments: VerificationDocumentPaths | null = null;
  let createdApplicationId: number | null = null;

  try {
    const formData = await request.formData();

    const fullName = cleanString(formData.get("full_name"));
    const email = cleanEmail(formData.get("email"));
    const phone = cleanString(formData.get("phone"));
    const password = cleanString(formData.get("password"));

    const countryOfCitizenship = cleanString(
      formData.get("country_of_citizenship"),
    );
    const dateOfBirth = cleanString(formData.get("date_of_birth"));
    const placeOfBirth = cleanString(formData.get("place_of_birth"));

    const addressCountry = cleanString(
      formData.get("address_country"),
    );
    const streetAddress = cleanString(
      formData.get("street_address"),
    );
    const city = cleanString(formData.get("city"));
    const state = cleanString(formData.get("state"));
    const zipCode = cleanString(formData.get("zip_code"));

    const raceEthnicity = cleanString(
      formData.get("race_ethnicity"),
    );
    const raceEthnicityOther = cleanString(
      formData.get("race_ethnicity_other"),
    );

    const businessName = cleanString(
      formData.get("business_name"),
    );
    const businessType = cleanString(
      formData.get("business_type"),
    );
    const businessDescription = cleanString(
      formData.get("business_description"),
    );

    const organizationAffiliation = cleanString(
      formData.get("organization_affiliation"),
    );
    const organizationType = cleanString(
      formData.get("organization_type"),
    );
    const organizationName = cleanString(
      formData.get("organization_name"),
    );

    const enterpriseCountry = cleanString(
      formData.get("enterprise_country"),
    );

    const governmentId = getFile(
      formData.get("government_id"),
    );
    const selfie = getFile(
      formData.get("selfie"),
    );

    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||
      !countryOfCitizenship ||
      !dateOfBirth ||
      !placeOfBirth ||
      !addressCountry ||
      !streetAddress ||
      !city ||
      !state ||
      !zipCode ||
      !businessName ||
      !businessDescription ||
      !enterpriseCountry
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please complete all required individual application fields.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters.",
        },
        { status: 400 },
      );
    }

    if (!DOMESTIC_COUNTRIES.has(enterpriseCountry.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Individual Entrepreneur applications are currently available directly only in the United States and Canada. Established business owners in other countries must use the International Individual Special Request process.",
        },
        { status: 400 },
      );
    }

    if (!governmentId) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid government-issued identification document is required.",
        },
        { status: 400 },
      );
    }

    if (!selfie) {
      return NextResponse.json(
        {
          success: false,
          error: "A selfie verification photo is required.",
        },
        { status: 400 },
      );
    }

    if (
      raceEthnicity === "Another race or ethnicity" &&
      !raceEthnicityOther
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please describe your race or ethnicity, or select another option.",
        },
        { status: 400 },
      );
    }

    if (
      organizationAffiliation === "Yes" &&
      (!organizationType || !organizationName)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please provide the organization type and organization name.",
        },
        { status: 400 },
      );
    }

    const duplicateChecks = await Promise.all([
      supabaseAdmin
        .from("entrepreneur_applications")
        .select("id")
        .ilike("email", email)
        .limit(1),

      supabaseAdmin
        .from("entrepreneur_applications")
        .select("id")
        .eq("phone", phone)
        .limit(1),

      supabaseAdmin
        .from("entrepreneur_applications")
        .select("id")
        .ilike("business_name", businessName)
        .limit(1),
    ]);

    const duplicateCheckError = duplicateChecks.find(
      (result) => result.error,
    )?.error;

    if (duplicateCheckError) {
      console.error(
        "Individual application duplicate check failed:",
        duplicateCheckError,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify the application information.",
        },
        { status: 500 },
      );
    }

    const duplicateExists = duplicateChecks.some(
      (result) => (result.data?.length ?? 0) > 0,
    );

    if (duplicateExists) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An entrepreneur application already exists with this email address, phone number, or business name.",
        },
        { status: 409 },
      );
    }

    const supabase = await createClient();

    let userId = "";

    const { data: existingAuth } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (existingAuth.user) {
      userId = existingAuth.user.id;
    } else {
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              `${request.nextUrl.origin}/entrepreneurs/login`,
          },
        });

      if (authError || !authData.user) {
        return NextResponse.json(
          {
            success: false,
            error:
              authError?.message ||
              "Unable to create your entrepreneur account.",
          },
          { status: 400 },
        );
      }

      userId = authData.user.id;
    }

    uploadedDocuments =
      await uploadVerificationDocuments(
        userId,
        governmentId,
        selfie,
      );

    const storedOrganizationName =
      organizationAffiliation === "Yes"
        ? organizationType
          ? `${organizationType}: ${organizationName}`
          : organizationName
        : null;

    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("entrepreneur_applications")
        .insert({
          user_id: userId,

          full_name: fullName,
          email,
          phone,

          country_of_citizenship: countryOfCitizenship,
          date_of_birth: dateOfBirth,
          place_of_birth: placeOfBirth,

          address_country: addressCountry,
          street_address: streetAddress,
          city,
          state,
          zip_code: zipCode,

          race_ethnicity: raceEthnicity || null,
          race_ethnicity_other:
            raceEthnicityOther || null,

          government_id_path:
            uploadedDocuments.governmentIdPath,
          selfie_verification_path:
            uploadedDocuments.selfieVerificationPath,

          business_name: businessName,
          business_type: businessType || null,
          business_description: businessDescription,

          organization_affiliation:
            organizationAffiliation || "No",
          organization_name: storedOrganizationName,

          applicant_type: "individual",
          enterprise_country: enterpriseCountry,
          application_path: "domestic_individual",

          status: "Pending Review",
          review_status: "Pending Review",
          qualification_status: "Pending Review",
          application_decision: "Pending",

          units_supported: 0,
          units_required: 20,
          funding_queue_position: null,
          funding_round: "Not Assigned",
          estimated_funding_date: null,
        })
        .select("id")
        .single();

    if (applicationError || !application) {
      console.error(
        "Unable to create individual entrepreneur application:",
        applicationError,
      );

      await removeVerificationDocuments(
        uploadedDocuments,
      );

      uploadedDocuments = null;

      return NextResponse.json(
        {
          success: false,
          error: "Unable to create your entrepreneur application.",
        },
        { status: 500 },
      );
    }

    createdApplicationId = application.id;

    const { data: existingRole, error: roleLookupError } =
      await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("user_id", userId)
        .eq("role", "entrepreneur")
        .limit(1)
        .maybeSingle();

    if (roleLookupError) {
      console.error(
        "Unable to verify entrepreneur role:",
        roleLookupError,
      );
    } else if (!existingRole) {
      const { error: roleError } =
        await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: userId,
            email,
            role: "entrepreneur",
          });

      if (roleError) {
        console.error(
          "Unable to create entrepreneur role:",
          roleError,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        application_id: createdApplicationId,
        applicant_type: "individual",
        application_path: "domestic_individual",
        message:
          "Your EPEW Individual Entrepreneur Application has been received.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Individual entrepreneur application API error:",
      error,
    );

    if (createdApplicationId !== null) {
      await supabaseAdmin
        .from("entrepreneur_applications")
        .delete()
        .eq("id", createdApplicationId);
    }

    if (uploadedDocuments) {
      await removeVerificationDocuments(
        uploadedDocuments,
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to process your entrepreneur application.",
      },
      { status: 500 },
    );
  }
}
