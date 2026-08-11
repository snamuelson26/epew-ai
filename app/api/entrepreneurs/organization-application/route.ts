import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";

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

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: unknown) {
  return cleanString(value).toLowerCase();
}

function cleanBoolean(value: unknown) {
  return value === true;
}

function cleanNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function POST(request: NextRequest) {
  let createdApplicationId: number | null = null;

  try {
    const body = await request.json();

    const supabase = await createClient();

    const fullName = cleanString(body.full_name);
    const email = cleanEmail(body.email);
    const password = cleanString(body.password);
    const phone = cleanString(body.phone);

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email address and password are required.",
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

    const countryOfCitizenship = cleanString(body.country_of_citizenship);
    const dateOfBirth = cleanString(body.date_of_birth);
    const placeOfBirth = cleanString(body.place_of_birth);

    const addressCountry = cleanString(body.address_country);
    const streetAddress = cleanString(body.street_address);
    const city = cleanString(body.city);
    const state = cleanString(body.state);
    const zipCode = cleanString(body.zip_code);

    const raceEthnicity = cleanString(body.race_ethnicity);
    const raceEthnicityOther = cleanString(body.race_ethnicity_other);

    const governmentIdPath = cleanString(body.government_id_path);
    const selfieVerificationPath = cleanString(
      body.selfie_verification_path,
    );

    const legalName = cleanString(body.legal_name);
    const displayName = cleanString(body.display_name);
    const organizationType = cleanString(body.organization_type);
    const registrationNumber = cleanString(body.registration_number);

    const enterpriseCountry = cleanString(body.enterprise_country);
    const organizationStreetAddress = cleanString(
      body.organization_street_address,
    );
    const organizationCity = cleanString(body.organization_city);
    const organizationStateRegion = cleanString(
      body.organization_state_region,
    );
    const organizationPostalCode = cleanString(
      body.organization_postal_code,
    );

    const yearEstablished = cleanNumber(body.year_established);
    const website = cleanString(body.website);

    const primaryRepresentativeName = cleanString(
      body.primary_representative_name,
    );
    const primaryRepresentativeTitle = cleanString(
      body.primary_representative_title,
    );
    const primaryRepresentativeEmail = cleanEmail(
      body.primary_representative_email,
    );
    const primaryRepresentativePhone = cleanString(
      body.primary_representative_phone,
    );

    const secondaryRepresentativeName = cleanString(
      body.secondary_representative_name,
    );
    const secondaryRepresentativeTitle = cleanString(
      body.secondary_representative_title,
    );
    const secondaryRepresentativeEmail = cleanEmail(
      body.secondary_representative_email,
    );
    const secondaryRepresentativePhone = cleanString(
      body.secondary_representative_phone,
    );

    const projectName = cleanString(body.project_name);
    const projectCategory = cleanString(body.project_category);
    const projectDescription = cleanString(body.project_description);
    const productService = cleanString(body.product_service);
    const communityMarketServed = cleanString(
      body.community_market_served,
    );
    const projectLocation = cleanString(body.project_location);
    const projectStage = cleanString(body.project_stage);
    const existingOperations = cleanString(body.existing_operations);

    const expectedJobs = cleanNumber(body.expected_jobs);
    const resourcesRequired = cleanString(body.resources_required);
    const facilityRequirements = cleanString(body.facility_requirements);
    const licensesPermits = cleanString(body.licenses_permits);

    const estimatedProjectCost = cleanNumber(body.estimated_project_cost);
    const requestedFinancing = cleanNumber(body.requested_financing);
    const intendedUseOfFinancing = cleanString(
      body.intended_use_of_financing,
    );

    const participantsRaw = Array.isArray(body.participants)
      ? body.participants
      : [];

    const participants: Array<{
      full_name: string;
      email: string;
      phone: string;
      organizational_title: string;
      project_role: string;
      project_responsibility: string;
      is_primary_representative: boolean;
      is_secondary_representative: boolean;
    }> = participantsRaw.map(
      (participant: ParticipantInput) => ({
        full_name: cleanString(participant.full_name),
        email: cleanEmail(participant.email),
        phone: cleanString(participant.phone),
        organizational_title: cleanString(
          participant.organizational_title,
        ),
        project_role: cleanString(participant.project_role),
        project_responsibility: cleanString(
          participant.project_responsibility,
        ),
        is_primary_representative: cleanBoolean(
          participant.is_primary_representative,
        ),
        is_secondary_representative: cleanBoolean(
          participant.is_secondary_representative,
        ),
      }),
    );

    if (
      !fullName ||
      !email ||
      !phone ||
      !countryOfCitizenship ||
      !dateOfBirth ||
      !placeOfBirth ||
      !addressCountry ||
      !streetAddress ||
      !city ||
      !state ||
      !zipCode ||
      !governmentIdPath ||
      !selfieVerificationPath ||
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
      !requestedFinancing ||
      !intendedUseOfFinancing
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please complete all required organization application fields.",
        },
        { status: 400 },
      );
    }

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
      requestedFinancing === null ||
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

    if (estimatedProjectCost !== null && estimatedProjectCost < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Estimated project cost cannot be negative.",
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

    if (yearEstablished !== null && yearEstablished < 1800) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid year established.",
        },
        { status: 400 },
      );
    }

    const applicationPath =
      enterpriseCountry.toLowerCase() === "united states" ||
      enterpriseCountry.toLowerCase() === "united states of america" ||
      enterpriseCountry.toLowerCase() === "usa" ||
      enterpriseCountry.toLowerCase() === "us" ||
      enterpriseCountry.toLowerCase() === "canada"
        ? "domestic_organization"
        : "international_organization";

    const { data: duplicateApplication, error: duplicateCheckError } =
      await supabaseAdmin
        .from("entrepreneur_applications")
        .select("id")
        .or(
          `email.eq.${email},phone.eq.${phone},business_name.eq.${projectName}`,
        )
        .limit(1)
        .maybeSingle();

    if (duplicateCheckError) {
      console.error(
        "Organization application duplicate check failed:",
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

    if (duplicateApplication) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An entrepreneur application already exists with this email address, phone number, or project name.",
        },
        { status: 409 },
      );
    }

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
          race_ethnicity_other: raceEthnicityOther || null,

          government_id_path: governmentIdPath,
          selfie_verification_path: selfieVerificationPath,

          business_name: projectName,
          business_type: projectCategory || organizationType || null,
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

      return NextResponse.json(
        {
          success: false,
          error: "Unable to create the organization application.",
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
          registration_number: registrationNumber || null,

          country: enterpriseCountry,
          street_address: organizationStreetAddress,
          city: organizationCity,
          state_region: organizationStateRegion,
          postal_code: organizationPostalCode,

          year_established: yearEstablished,
          website: website || null,

          primary_representative_name: primaryRepresentativeName,
          primary_representative_title:
            primaryRepresentativeTitle || null,
          primary_representative_email: primaryRepresentativeEmail,
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
          community_market_served: communityMarketServed || null,
          project_location: projectLocation || null,
          project_stage: projectStage || null,
          existing_operations: existingOperations || null,
          expected_jobs: expectedJobs,

          resources_required: resourcesRequired || null,
          facility_requirements: facilityRequirements || null,
          licenses_permits: licensesPermits || null,

          estimated_project_cost: estimatedProjectCost,
          requested_financing: requestedFinancing,
          intended_use_of_financing: intendedUseOfFinancing,

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

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save the organization application details.",
        },
        { status: 500 },
      );
    }

    const participantRows = participants.map((participant) => ({
      organization_application_id: organization.id,
      full_name: participant.full_name,
      email: participant.email || null,
      phone: participant.phone || null,
      organizational_title: participant.organizational_title,
      project_role: participant.project_role,
      project_responsibility: participant.project_responsibility,
      is_primary_representative:
        participant.is_primary_representative,
      is_secondary_representative:
        participant.is_secondary_representative,
      participation_status: "active",
    }));

    const { error: participantError } = await supabaseAdmin
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

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save the organization participants.",
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
      const { error: roleError } = await supabaseAdmin
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

    return NextResponse.json({
      success: true,
      application_id: createdApplicationId,
      organization_application_id: organization.id,
      applicant_type: "organization",
      application_path: applicationPath,
      participant_count: participants.length,
      message:
        "Your EPEW Organization / Group Enterprise Application has been received.",
    });
  } catch (error) {
    console.error("Organization application API error:", error);

    if (createdApplicationId !== null) {
      await supabaseAdmin
        .from("entrepreneur_applications")
        .delete()
        .eq("id", createdApplicationId);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process your organization application.",
      },
      { status: 500 },
    );
  }
}
