import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const AGREEMENT_TYPE = "supporter_epew";
const AGREEMENT_TITLE = "EPEW Supporter Platform Participation Agreement";
const AGREEMENT_VERSION = "1.0";
const LEGAL_ENTITY = "EPEW (EKERO Partners Empower Wealth LLC)";
const COUNTERPARTY_TYPE = "epew";

function acceptanceStorageUnavailable(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };

  const code = String(candidate.code || "");
  const text = `${candidate.message || ""} ${candidate.details || ""}`.toLowerCase();

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    text.includes("epew_agreement_acceptances") &&
      (text.includes("does not exist") ||
        text.includes("schema cache") ||
        text.includes("could not find"))
  );
}

function pendingPersistenceResponse() {
  return NextResponse.json({
    accepted: true,
    alreadyAccepted: false,
    persistencePending: true,
    agreementType: AGREEMENT_TYPE,
    agreementVersion: AGREEMENT_VERSION,
  });
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to accept the EPEW Supporter Platform Participation Agreement.",
        },
        { status: 401 }
      );
    }

    const {
      data: supporter,
      error: supporterError,
    } = await supabaseAdmin
      .from("supporters")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (supporterError) {
      console.error("Supporter agreement supporter lookup error:", supporterError);

      return NextResponse.json(
        { error: "Unable to validate your supporter account." },
        { status: 500 }
      );
    }

    if (!supporter) {
      return NextResponse.json(
        { error: "Supporter profile not found for this account." },
        { status: 404 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      accepted?: boolean;
    };

    if (body.accepted !== true) {
      return NextResponse.json(
        { error: "Agreement acceptance is required before continuing." },
        { status: 400 }
      );
    }

    const {
      data: existingAcceptance,
      error: existingAcceptanceError,
    } = await supabaseAdmin
      .from("epew_agreement_acceptances")
      .select("id,accepted,accepted_at")
      .eq("user_id", user.id)
      .eq("agreement_type", AGREEMENT_TYPE)
      .eq("agreement_version", AGREEMENT_VERSION)
      .eq("counterparty_id", LEGAL_ENTITY)
      .eq("accepted", true)
      .limit(1)
      .maybeSingle();

    if (existingAcceptanceError) {
      console.error(
        "Supporter agreement existing acceptance lookup error:",
        existingAcceptanceError
      );

      if (acceptanceStorageUnavailable(existingAcceptanceError)) {
        return pendingPersistenceResponse();
      }

      return NextResponse.json(
        { error: "Unable to verify your agreement acceptance." },
        { status: 500 }
      );
    }

    if (existingAcceptance) {
      return NextResponse.json({
        accepted: true,
        alreadyAccepted: true,
        acceptanceId: existingAcceptance.id,
        acceptedAt: existingAcceptance.accepted_at,
        agreementType: AGREEMENT_TYPE,
        agreementVersion: AGREEMENT_VERSION,
      });
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;
    const acceptedAt = new Date().toISOString();

    const {
      data: acceptance,
      error: acceptanceError,
    } = await supabaseAdmin
      .from("epew_agreement_acceptances")
      .insert({
        user_id: user.id,
        supporter_id: supporter.id,
        agreement_type: AGREEMENT_TYPE,
        agreement_title: AGREEMENT_TITLE,
        agreement_version: AGREEMENT_VERSION,
        legal_entity: LEGAL_ENTITY,
        counterparty_type: COUNTERPARTY_TYPE,
        counterparty_id: LEGAL_ENTITY,
        accepted: true,
        accepted_at: acceptedAt,
        acceptance_method: "authenticated_electronic_checkbox",
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select("id,accepted_at")
      .single();

    if (acceptanceError) {
      console.error("Supporter agreement acceptance insert error:", acceptanceError);

      if (acceptanceStorageUnavailable(acceptanceError)) {
        return pendingPersistenceResponse();
      }

      return NextResponse.json(
        { error: "Unable to record your agreement acceptance." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accepted: true,
      alreadyAccepted: false,
      acceptanceId: acceptance.id,
      acceptedAt: acceptance.accepted_at,
      agreementType: AGREEMENT_TYPE,
      agreementVersion: AGREEMENT_VERSION,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to record agreement acceptance.";

    console.error(
      "Supporter platform participation agreement acceptance error:",
      error
    );

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
