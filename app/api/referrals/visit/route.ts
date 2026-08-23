import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const VISITOR_COOKIE = "epew_referral_visitor_id";
const REFERRAL_COOKIE = "epew_referral_code";

const NINETY_DAYS_MS =
  90 * 24 * 60 * 60 * 1000;

const NINETY_DAYS_SECONDS =
  90 * 24 * 60 * 60;

type ReferralMember = {
  id: string;
  referral_code: string;
  member_type: string;
  status: string;
};

async function resolveReferralMember(
  incomingCode: string
): Promise<ReferralMember | null> {
  if (!incomingCode) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("epew_referral_members")
    .select(
      "id,referral_code,member_type,status"
    )
    .ilike("referral_code", incomingCode)
    .maybeSingle();

  if (error) {
    console.error(
      "Referral member resolution error:",
      error
    );

    return null;
  }

  if (!data || data.status !== "active") {
    return null;
  }

  return data as ReferralMember;
}

function applyVisitorCookies(
  response: NextResponse,
  visitorId: string,
  referralCode?: string | null
) {
  response.cookies.set(
    VISITOR_COOKIE,
    visitorId,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: NINETY_DAYS_SECONDS,
      path: "/",
    }
  );

  if (referralCode) {
    response.cookies.set(
      REFERRAL_COOKIE,
      referralCode,
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: NINETY_DAYS_SECONDS,
        path: "/",
      }
    );
  } else {
    response.cookies.set(
      REFERRAL_COOKIE,
      "",
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
        path: "/",
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const incomingReferrerCode =
      typeof body?.referrerCode === "string"
        ? body.referrerCode.trim().toUpperCase()
        : "";

    const landingPath =
      typeof body?.landingPath === "string"
        ? body.landingPath.trim()
        : null;

    const businessId =
      typeof body?.businessId === "string"
        ? body.businessId.trim()
        : null;

    const referrer =
      await resolveReferralMember(
        incomingReferrerCode
      );

    const cookieStore = await cookies();

    let visitorId =
      cookieStore.get(VISITOR_COOKIE)?.value || "";

    if (!visitorId) {
      visitorId = crypto.randomUUID();
    }

    const now = new Date();

    const { data: visitor, error: visitorError } =
      await supabaseAdmin
        .from("epew_referral_visitors")
        .select(
          `
          visitor_id,
          first_seen_at,
          last_seen_at,
          cycle_started_at,
          cycle_source,
          cycle_referrer_member_id,
          cycle_referrer_code,
          visit_count,
          converted_supporter_id
          `
        )
        .eq("visitor_id", visitorId)
        .maybeSingle();

    if (visitorError) {
      throw visitorError;
    }

    /*
     * NEW VISITOR
     *
     * First visit determines the cycle source.
     */
    if (!visitor) {
      const cycleSource =
        referrer ? "referral" : "direct";

      const { error: insertError } =
        await supabaseAdmin
          .from("epew_referral_visitors")
          .insert({
            visitor_id: visitorId,
            first_seen_at: now.toISOString(),
            last_seen_at: now.toISOString(),
            cycle_started_at: now.toISOString(),
            cycle_source: cycleSource,
            cycle_referrer_member_id:
              referrer?.id || null,
            cycle_referrer_code:
              referrer?.referral_code || null,
            visit_count: 1,
            last_landing_path: landingPath,
            last_business_id: businessId,
            updated_at: now.toISOString(),
          });

      if (insertError) {
        throw insertError;
      }

      /*
       * A referral attribution is created only
       * when the person's first visit in this
       * 90-day cycle came from a valid referrer.
       */
      if (referrer) {
        const { error: attributionError } =
          await supabaseAdmin
            .from("epew_referral_attributions")
            .insert({
              visitor_id: visitorId,
              referrer_member_id: referrer.id,
              referrer_code:
                referrer.referral_code,
              landing_business_id: businessId,
              landing_path: landingPath,
              first_seen_at: now.toISOString(),
              expires_at: new Date(
                now.getTime() + NINETY_DAYS_MS
              ).toISOString(),
              status: "active",
            });

        if (attributionError) {
          throw attributionError;
        }
      }

      const response = NextResponse.json({
        success: true,
        visitorStatus: "new",
        referralEligible: true,
        cycleSource,
        referralAttributed: Boolean(referrer),
        referrerCode:
          referrer?.referral_code || null,
      });

      applyVisitorCookies(
        response,
        visitorId,
        referrer?.referral_code || null
      );

      return response;
    }

    const lastSeenAt =
      new Date(visitor.last_seen_at);

    const inactiveForMs =
      now.getTime() - lastSeenAt.getTime();

    const newCycle =
      inactiveForMs >= NINETY_DAYS_MS;

    /*
     * 90-DAY RESET
     *
     * After 90 consecutive days without a visit,
     * the next visit starts a brand-new referral
     * eligibility cycle.
     */
    if (newCycle) {
      const cycleSource =
        referrer ? "referral" : "direct";

      /*
       * Close any old active attribution before
       * creating the new referral cycle.
       */
      const { error: expireError } =
        await supabaseAdmin
          .from("epew_referral_attributions")
          .update({
            status: "expired",
            updated_at: now.toISOString(),
          })
          .eq("visitor_id", visitorId)
          .eq("status", "active");

      if (expireError) {
        throw expireError;
      }

      const { error: resetError } =
        await supabaseAdmin
          .from("epew_referral_visitors")
          .update({
            last_seen_at: now.toISOString(),
            cycle_started_at: now.toISOString(),
            cycle_source: cycleSource,
            cycle_referrer_member_id:
              referrer?.id || null,
            cycle_referrer_code:
              referrer?.referral_code || null,
            visit_count:
              Number(visitor.visit_count || 0) + 1,
            last_landing_path: landingPath,
            last_business_id: businessId,
            updated_at: now.toISOString(),
          })
          .eq("visitor_id", visitorId);

      if (resetError) {
        throw resetError;
      }

      if (referrer) {
        const { error: attributionError } =
          await supabaseAdmin
            .from("epew_referral_attributions")
            .insert({
              visitor_id: visitorId,
              referrer_member_id: referrer.id,
              referrer_code:
                referrer.referral_code,
              landing_business_id: businessId,
              landing_path: landingPath,
              first_seen_at: now.toISOString(),
              expires_at: new Date(
                now.getTime() + NINETY_DAYS_MS
              ).toISOString(),
              status: "active",
            });

        if (attributionError) {
          throw attributionError;
        }
      }

      const response = NextResponse.json({
        success: true,
        visitorStatus: "new_cycle",
        referralEligible: true,
        cycleSource,
        referralAttributed: Boolean(referrer),
        referrerCode:
          referrer?.referral_code || null,
      });

      applyVisitorCookies(
        response,
        visitorId,
        referrer?.referral_code || null
      );

      return response;
    }

    /*
     * EXISTING VISITOR WITHIN 90 DAYS
     *
     * Preserve the original cycle.
     *
     * If the cycle began directly, a referral
     * link cannot claim this visitor.
     *
     * If it began through a referral, a different
     * referral link cannot replace the original
     * referrer.
     */
    const preservedReferralCode =
      visitor.cycle_source === "referral"
        ? visitor.cycle_referrer_code
        : null;

    const { error: updateError } =
      await supabaseAdmin
        .from("epew_referral_visitors")
        .update({
          last_seen_at: now.toISOString(),
          visit_count:
            Number(visitor.visit_count || 0) + 1,
          last_landing_path: landingPath,
          last_business_id: businessId,
          updated_at: now.toISOString(),
        })
        .eq("visitor_id", visitorId);

    if (updateError) {
      throw updateError;
    }

    /*
     * Refresh the active referral attribution's
     * expiration because the 90-day period is
     * based on the visitor's most recent EPEW visit.
     */
    if (
      visitor.cycle_source === "referral" &&
      visitor.cycle_referrer_member_id
    ) {
      const { error: refreshError } =
        await supabaseAdmin
          .from("epew_referral_attributions")
          .update({
            expires_at: new Date(
              now.getTime() + NINETY_DAYS_MS
            ).toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("visitor_id", visitorId)
          .eq("status", "active");

      if (refreshError) {
        throw refreshError;
      }
    }

    const response = NextResponse.json({
      success: true,
      visitorStatus: "existing",
      referralEligible: false,
      cycleSource: visitor.cycle_source,
      referralAttributed:
        visitor.cycle_source === "referral",
      referrerCode: preservedReferralCode,
    });

    applyVisitorCookies(
      response,
      visitorId,
      preservedReferralCode
    );

    return response;
  } catch (error) {
    console.error(
      "EPEW referral visit tracking failure:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to record EPEW visitor activity.",
      },
      { status: 500 }
    );
  }
}
