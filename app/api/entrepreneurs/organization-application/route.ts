import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";
import {
  removeVerificationDocuments,
  uploadVerificationDocuments,
  type VerificationDocumentPaths,
} from "@/lib/entrepreneurs/verificationDocuments";

export const runtime = "nodejs";

type ParticipantInput = {
  full_name?: unknown;
  email?: unknown;
  phone?: unknown;
  organizational_title?: unknown;
  project_role?: unknown;
  project_responsibility?: unknown;
  is_primary_representative?: unknown;
  is_secondary_representative?: unknown;
};

type Participant = {
  full_name: string;
  email: string;
  phone: string;
  organizational_title: string;
  project_role: string;
  project_responsibility: string;
  is_primary_representative: boolean;
  is_secondary_representative: boolean;
};

const DOMESTIC_COUNTRIES = new Set([
  "united states",
  "united states of america",
  "usa",
  "us",
  "canada",
]);

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: unknown): string {
  return cleanString(value).toLowerCase();
}

function cleanBoolean(value: unknown): boolean {
  return value === true;
}

function cleanNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

function parseParticipants(value: string): Participant[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(
      "Unable to read the organization participant information.",
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Organization participant information must be provided as a list.",
    );
  }

  return parsed.map((item: ParticipantInput) => ({
    full_name: cleanString(item.full_name),
    email: cleanEmail(item.email),
    phone: cleanString(item.phone),
    organizational_title: cleanString(item.organizational_title),
    project_role: cleanString(item.project_role),
    project_responsibility: cleanString(
      item.project_responsibility,
    ),
    is_primary_representative: cleanBoolean(
      item.is_primary_representative,
    ),
    is_secondary_representative: cleanBoolean(
      item.is_secondary_representative,
    ),
  }));
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
    const dateOfBirth = cleanString(
      formData.get("date_of_birth"),
    );
    const placeOfBirth = cleanString(
      formData.get("place_of_birth"),
    );

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

    const legalName = cleanString(
      formData.get("legal_name"),
    );
    const displayName = cleanString(
      formData.get("display_name"),
    );
    const organizationType = cleanString(
      formData.get("organization_type"),
    );
    const registrationNumber = cleanString(
      formData.get("registration_number"),
    );

    const enterpriseCountry = cleanString(
      formData.get("enterprise_country"),
    );
    const organizationStreetAddress = cleanString(
      formData.get("organization_street_address"),
    );
    const organizationCity = cleanString(
      formData.get("organization_city"),
    );
    const organizationStateRegion = cleanString(
      formData.get("organization_state_region"),
    );
    const organizationPostalCode = cleanString(
      formData.get("organization_postal_code"),
    );

    const yearEstablished = cleanNumber(
      formData.get("year_established"),
    );
    const website = cleanString(
      formData.get("website"),
    );

    const primaryRepresentativeName = cleanString(
      formData.get("primary_representative_name"),
    );
    const primaryRepresentativeTitle = cleanString(
      formData.get("primary_representative_title"),
    );
    const primaryRepresentativeEmail = cleanEmail(
      formData.get("primary_representative_email"),
    );
    const primaryRepresentativePhone = cleanString(
      formData.get("primary_representative_phone"),
    );

    const secondaryRepresentativeName = cleanString(
      formData.get("secondary_representative_name"),
    );
    const secondaryRepresentativeTitle = cleanString(
      formData.get("secondary_representative_title"),
    );
    const secondaryRepresentativeEmail = cleanEmail(
      formData.get("secondary_representative_email"),
    );
    const secondaryRepresentativePhone = cleanString(
      formData.get("secondary_representative_phone"),
    );

    const projectName = cleanString(
      formData.get("project_name"),
    );
    const projectCategory = cleanString(
      formData.get("project_category"),
    );
    const projectDescription = cleanString(
      formData.get("project_description"),
    );
    const productService = cleanString(
      formData.get("product_service"),
    );
    const communityMarketServed = cleanString(
      formData.get("community_market_served"),
    );
    const projectLocation = cleanString(
      formData.get("project_location"),
    );
    const projectStage = cleanString(
      formData.get("project_stage"),
    );
    const existingOperations = cleanString(
      formData.get("existing_operations"),
    );

    const expectedJobs = cleanNumber(
      formData.get("expected_jobs"),
    );
    const resourcesRequired = cleanString(
      formData.get("resources_required"),
    );
    const facilityRequirements = cleanString(
      formData.get("facility_requirements"),
    );
    const licensesPermits = cleanString(
      formData.get("licenses_permits"),
    );

    const estimatedProjectCost = cleanNumber(
      formData.get("estimated_project_cost"),
    );
    const requestedFinancing = cleanNumber(
      formData.get("requested_financing"),
    );
    const intendedUseOfFinancing = cleanString(
      formData.get("intended_use_of_financing"),
    );

    const participantsValue = cleanString(
      formData.get("participants"),
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
      !legalName ||
      !enterpriseCountry ||
      !organizationStreetAddress ||
      !organizationCity ||
      !organizationStateRegion ||
      !organizationPostalCode ||
      !primaryRepresentativeName ||
      !primaryRepresentativeEmail ||
      !projectName ||
      !projectDescription ||
      requestedFinancing === null ||
      !intendedUseOfFinancing ||
      !participantsValue
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please complete all required organization application fields.",
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

    if (!governmentId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid government-issued identification document is required.",
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

    const participants = parseParticipants(participantsValue);

    if (participants.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Organization applications require at least 3 active participants.",
        },
        { status: 400 },
      );
    }

    if (
      participants.some(
        (participant) =>
          !participant.full_name ||
          !participant.organizational_title ||
          !participant.project_role ||
          !participant.project_responsibility,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Each organization participant must include a name, organization title, project role, and project responsibility.",
        },
        { status: 400 },
      );
    }

    if (
      requestedFinancing <= 0 ||
      requestedFinancing > 100000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Organization requested financing must be greater than $0 and cannot exceed $100,000.",
        },
        { status: 400 },
      );
    }

    if (
      estimatedProjectCost !== null &&
      estimatedProjectCost < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Estimated project cost cannot be negative.",
        },
        { status: 400 },
      );
    }

    if (expectedJobs !== null && expectedJobs < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Expected jobs cannot be negative.",
        },
        { status: 400 },
      );
    }

    const currentYear = new Date().getFullYear();

    if (
      yearEstablished !== null &&
      (yearEstablished < 1800 ||
        yearEstablished > currentYear)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid year established.",
        },
        { status: 400 },
      );
    }

    const applicationPath =
      DOMESTIC_COUNTRIES.has(
        enterpriseCountry.toLowerCase(),
      )
        ? "domestic_organization"
        : "international_organization";

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
        .ilike("business_name", projectName)
        .limit(1),
    ]);

    const duplicateCheckError = duplicateChecks.find(
      (result) => result.error,
    )?.error;

    if (duplicateCheckError) {
      console.error(
        "Organization application duplicate check failed:",
        duplicateCheckError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify the application information.",
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
            "An entrepreneur application already exists with this email address, phone number, or project name.",
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

          business_name: projectName,
          business_type:
            projectCategory || organizationType || null,
          business_description: projectDescription,

          applicant_type: "organization",
          enterprise_country: enterpriseCountry,
          application_path: applicationPath,

          status: "Pending Review",
          review_status: "Pending Review",
          qualification_status: "Pending Review",
          application_decision: "Pending",

          units_supported: 0,
          units_required: 20,
          funding_queue_position: null,
          funding_round: "Not Assigned",
          estimated_funding_date: null,
          funding_request: requestedFinancing,
        })
        .select("id")
        .single();

    if (applicationError || !application) {
      console.error(
        "Unable to create organization entrepreneur application:",
        applicationError,
      );

      await removeVerificationDocuments(
        uploadedDocuments,
      );

      uploadedDocuments = null;

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to create the organization application.",
        },
        { status: 500 },
      );
    }

    createdApplicationId = application.id;

    const { data: organization, error: organizationError } =
      await supabaseAdmin
        .from("entrepreneur_organization_applications")
        .insert({
          application_id: createdApplicationId,

          legal_name: legalName,
          display_name: displayName || null,
          organization_type: organizationType || null,
          registration_number:
            registrationNumber || null,

          country: enterpriseCountry,
          street_address: organizationStreetAddress,
          city: organizationCity,
          state_region: organizationStateRegion,
          postal_code: organizationPostalCode,

          year_established: yearEstablished,
          website: website || null,

          primary_representative_name:
            primaryRepresentativeName,
          primary_representative_title:
            primaryRepresentativeTitle || null,
          primary_representative_email:
            primaryRepresentativeEmail,
          primary_representative_phone:
            primaryRepresentativePhone || null,

          secondary_representative_name:
            secondaryRepresentativeName || null,
          secondary_representative_title:
            secondaryRepresentativeTitle || null,
          secondary_representative_email:
            secondaryRepresentativeEmail || null,
          secondary_representative_phone:
            secondaryRepresentativePhone || null,

          project_name: projectName,
          project_category: projectCategory || null,
          project_description: projectDescription,
          product_service: productService || null,
          community_market_served:
            communityMarketServed || null,
          project_location: projectLocation || null,
          project_stage: projectStage || null,
          existing_operations:
            existingOperations || null,
          expected_jobs: expectedJobs,

          resources_required:
            resourcesRequired || null,
          facility_requirements:
            facilityRequirements || null,
          licenses_permits:
            licensesPermits || null,

          estimated_project_cost:
            estimatedProjectCost,
          requested_financing: requestedFinancing,
          intended_use_of_financing:
            intendedUseOfFinancing,

          participant_count: participants.length,
          status: "Pending Review",
        })
        .select("id")
        .single();

    if (organizationError || !organization) {
      console.error(
        "Unable to create organization application details:",
        organizationError,
      );

      await supabaseAdmin
        .from("entrepreneur_applications")
        .delete()
        .eq("id", createdApplicationId);

      createdApplicationId = null;

      await removeVerificationDocuments(
        uploadedDocuments,
      );

      uploadedDocuments = null;

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to save the organization application details.",
        },
        { status: 500 },
      );
    }

    const participantRows = participants.map(
      (participant) => ({
        organization_application_id: organization.id,
        full_name: participant.full_name,
        email: participant.email || null,
        phone: participant.phone || null,
        organizational_title:
          participant.organizational_title,
        project_role: participant.project_role,
        project_responsibility:
          participant.project_responsibility,
        is_primary_representative:
          participant.is_primary_representative,
        is_secondary_representative:
          participant.is_secondary_representative,
        participation_status: "active",
      }),
    );

    const { error: participantError } =
      await supabaseAdmin
        .from("entrepreneur_organization_members")
        .insert(participantRows);

    if (participantError) {
      console.error(
        "Unable to create organization participant records:",
        participantError,
      );

      await supabaseAdmin
        .from("entrepreneur_organization_applications")
        .delete()
        .eq("id", organization.id);

      await supabaseAdmin
        .from("entrepreneur_applications")
        .delete()
        .eq("id", createdApplicationId);

      createdApplicationId = null;

      await removeVerificationDocuments(
        uploadedDocuments,
      );

      uploadedDocuments = null;

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to save the organization participants.",
        },
        { status: 500 },
      );
    }

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
        "Unable to verify entrepreneur role for organization applicant:",
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
          "Unable to create entrepreneur role for organization applicant:",
          roleError,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        application_id: createdApplicationId,
        organization_application_id:
          organization.id,
        applicant_type: "organization",
        application_path: applicationPath,
        participant_count: participants.length,
        message:
          "Your EPEW Organization / Group Enterprise Application has been received.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Organization application API error:",
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
            : "Unable to process your organization application.",
      },
      { status: 500 },
    );
  }
}
