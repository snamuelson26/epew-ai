import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function ensureConversations(organizationId: string, organizationCode: string) {
  const { data: members, error } = await supabaseAdmin
    .from("emanon_staff_members")
    .select("id,role_code,display_name")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  if (error || !members) return;

  const pairs = organizationCode === "ORGDH-NETWORK"
    ? (() => {
        const director = members.find((member) => member.role_code === "general_marketing_director");
        if (!director) return [];
        return members
          .filter((member) => member.role_code !== "general_marketing_director")
          .map((vendor) => ({
            title: `Dorian Noslen and ${vendor.display_name}`,
            members: [director, vendor],
            createdBy: director.id,
          }));
      })()
    : (() => {
        const director = members.find((member) => member.role_code === "program_director");
        const partnerships = members.find((member) => member.role_code === "strategic_partnerships_director");
        return director && partnerships
          ? [{
              title: "Program Director and Strategic Partnerships",
              members: [director, partnerships],
              createdBy: director.id,
            }]
          : [];
      })();

  for (const pair of pairs) {
    const { data: existing } = await supabaseAdmin
      .from("emanon_conversations")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("conversation_type", "direct")
      .eq("title", pair.title)
      .maybeSingle();
    let conversationId = existing?.id;
    if (!conversationId) {
      const { data: created, error: createError } = await supabaseAdmin
        .from("emanon_conversations")
        .insert({
          organization_id: organizationId,
          conversation_type: "direct",
          title: pair.title,
          created_by: pair.createdBy,
        })
        .select("id")
        .single();
      if (createError) throw createError;
      conversationId = created.id;
    }
    const { error: memberError } = await supabaseAdmin
      .from("emanon_conversation_members")
      .upsert(
        pair.members.map((member) => ({ conversation_id: conversationId, member_id: member.id })),
        { onConflict: "conversation_id,member_id" },
      );
    if (memberError) throw memberError;
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("invite")?.trim() ?? "";
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });
  const { data } = await supabaseAdmin.from("emanon_staff_invites")
    .select("email,full_name,title,role_code,expires_at,status,organization:emanon_organizations!organization_id(organization_code,display_name)")
    .eq("token_hash", hashToken(token)).maybeSingle();
  const valid = Boolean(data && data.status === "pending" && new Date(data.expires_at).getTime() > Date.now());
  return NextResponse.json(valid ? { valid: true, invite: data } : { valid: false }, { status: valid ? 200 : 404 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { invite?: string; password?: string } | null;
  const token = body?.invite?.trim() ?? "";
  const password = body?.password ?? "";
  if (!token || password.length < 12) return NextResponse.json({ error: "A valid invitation and a password of at least 12 characters are required." }, { status: 400 });

  const { data: invite, error: inviteError } = await supabaseAdmin.from("emanon_staff_invites")
    .select("*").eq("token_hash", hashToken(token)).eq("status", "pending").maybeSingle();
  if (inviteError || !invite || new Date(invite.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: "This invitation is invalid or expired." }, { status: 400 });

  const { data: organization, error: organizationError } = await supabaseAdmin
    .from("emanon_organizations")
    .select("organization_code,display_name,profile_metadata")
    .eq("id", invite.organization_id)
    .single();
  if (organizationError || !organization) {
    return NextResponse.json({ error: "The invitation organization could not be resolved." }, { status: 400 });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: invite.email, password, email_confirm: true,
    user_metadata: {
      full_name: invite.full_name,
      organization: organization.display_name,
      organization_role: invite.role_code,
    },
    app_metadata: {
      organization_role: invite.role_code,
      organization_code: organization.organization_code,
    },
  });
  if (authError || !authData.user) return NextResponse.json({ error: authError?.message ?? "Unable to create the account." }, { status: 400 });

  const { data: identity } = await supabaseAdmin.from("epew_communication_sender_identities")
    .select("id").eq("email_address", invite.email).eq("is_active", true).maybeSingle();
  const { error: memberError } = await supabaseAdmin.from("emanon_staff_members").insert({
    organization_id: invite.organization_id, user_id: authData.user.id, sender_identity_id: identity?.id ?? null,
    email: invite.email, display_name: invite.full_name, title: invite.title, role_code: invite.role_code, permissions: invite.permissions,
  });
  if (memberError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: "Unable to attach the account to Emanon Institute." }, { status: 500 });
  }
  const accessRole = invite.permissions?.access_role === "partner"
    ? "partner"
    : invite.permissions?.access_role === "vendor"
      ? "vendor"
      : "emanon_staff";
  await supabaseAdmin.from("user_roles").upsert(
    { user_id: authData.user.id, email: invite.email, role: accessRole },
    { onConflict: "user_id,role" },
  );

  if (organization.organization_code === "ORGDH-NETWORK") {
    if (accessRole === "partner") {
      const partnerActorId = organization.profile_metadata?.epew_partner_actor_id;
      if (typeof partnerActorId === "string") {
        await supabaseAdmin.from("etvmc_actor_user_access").upsert({
          actor_id: partnerActorId,
          user_id: authData.user.id,
          access_role: "partner",
          status: "active",
          metadata: { responsibility: "sole_orgdh_epew_partner", title: invite.title },
        }, { onConflict: "actor_id,user_id,access_role" });
      }
    } else if (accessRole === "vendor") {
      const { data: vendor } = await supabaseAdmin
        .from("etvmc_vendor_profiles")
        .update({ user_id: authData.user.id, updated_at: new Date().toISOString() })
        .eq("primary_email", invite.email)
        .select("actor_id")
        .single();
      if (vendor) {
        await supabaseAdmin.from("etvmc_actor_user_access").upsert({
          actor_id: vendor.actor_id,
          user_id: authData.user.id,
          access_role: "vendor",
          status: "active",
          metadata: {
            organization: "ORGDH Network",
            supervised_by_email: "marketingdirector@orgdh.org",
          },
        }, { onConflict: "actor_id,user_id,access_role" });
      }
    }
  }
  await supabaseAdmin.from("emanon_staff_invites").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invite.id);
  await ensureConversations(invite.organization_id, organization.organization_code);
  return NextResponse.json({
    ok: true,
    loginUrl: organization.organization_code === "ORGDH-NETWORK" ? "/orgdh/login" : "/emanon/login",
  });
}
