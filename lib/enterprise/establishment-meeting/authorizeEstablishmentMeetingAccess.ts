import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type AuthorizedEstablishmentMeetingContext = {
  userId: string;
  email: string;
  role: string;
  coach: {
    id: string;
    full_name: string;
    email: string | null;
    status: string;
  } | null;
  isAdmin: boolean;
};

function normalizeRole(role: string | null | undefined) {
  return role?.trim().toLowerCase() ?? "";
}

function isCoachRole(role: string) {
  return (
    role === "coach" ||
    role === "personal coach" ||
    role === "personal_coach"
  );
}

function isAdminRole(role: string) {
  return role === "admin" || role === "administrator";
}

export async function authorizeEstablishmentMeetingAccess(): Promise<
  | {
      ok: true;
      context: AuthorizedEstablishmentMeetingContext;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  const email = user.email?.trim().toLowerCase();

  if (!email) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "The authenticated account does not have an email address.",
        },
        { status: 400 }
      ),
    };
  }

  const { data: roleRows, error: roleError } =
    await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

  if (roleError) {
    throw roleError;
  }

  const roles = (roleRows ?? [])
    .map((row) => normalizeRole(row.role))
    .filter(Boolean);

  const adminRole = roles.find(isAdminRole);
  const coachRole = roles.find(isCoachRole);

  if (!adminRole && !coachRole) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Coach or administrator access is required.",
        },
        { status: 403 }
      ),
    };
  }

  const isAdmin = Boolean(adminRole);

  let coach: AuthorizedEstablishmentMeetingContext["coach"] =
    null;

  if (!isAdmin || coachRole) {
    const {
      data: coachRecord,
      error: coachError,
    } = await supabaseAdmin
      .from("epew_coaches")
      .select("id, full_name, email, status")
      .ilike("email", email)
      .maybeSingle();

    if (coachError) {
      throw coachError;
    }

    if (!isAdmin && !coachRecord) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            message:
              "No EPEW Coach profile is connected to this account.",
          },
          { status: 404 }
        ),
      };
    }

    if (
      !isAdmin &&
      coachRecord &&
      coachRecord.status !== "active" &&
      coachRecord.status !== "available"
    ) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            message:
              "This Coach profile is not currently active or available.",
          },
          { status: 403 }
        ),
      };
    }

    coach = coachRecord ?? null;
  }

  return {
    ok: true,
    context: {
      userId: user.id,
      email,
      role: adminRole ?? coachRole ?? "",
      coach,
      isAdmin,
    },
  };
}
