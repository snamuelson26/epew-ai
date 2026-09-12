import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function ensureConversation(organizationId: string) {
  const { data: members, error } = await supabaseAdmin
    .from("emanon_staff_members")
    .select("id,role_code")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role_code", ["program_director", "strategic_partnerships_director"]);
  if (error || !members || members.length < 2) return;

  const { data: existing } = await supabaseAdmin
    .from("emanon_conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("conversation_type", "direct")
    .eq("title", "Program Director and Strategic Partnerships")
    .maybeSingle();
  let conversationId = existing?.id;
  if (!conversationId) {
    const director = members.find((member) => member.role_code === "program_director");
    const { data: created, error: createError } = await supabaseAdmin
      .from("emanon_conversations")
      .insert({ organization_id: organizationId, conversation_type: "direct", title: "Program Director and Strategic Partnerships", created_by: director?.id ?? members[0].id })
      .select("id")
      .single();
    if (createError) throw createError;
    conversationId = created.id;
  }
  const { error: memberError } = await supabaseAdmin.from("emanon_conversation_members").upsert(
    members.map((member) => ({ conversation_id: conversationId, member_id: member.id })),
    { onConflict: "conversation_id,member_id" },
  );
  if (memberError) throw memberError;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("invite")?.trim() ?? "";
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });
  const { data } = await supabaseAdmin.from("emanon_staff_invites")
    .select("email,full_name,title,role_code,expires_at,status")
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

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: invite.email, password, email_confirm: true,
    user_metadata: { full_name: invite.full_name, organization: "Emanon Institute", emanon_role: invite.role_code },
    app_metadata: { emanon_role: invite.role_code, organization_code: "EMANON-INSTITUTE" },
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
  await supabaseAdmin.from("user_roles").upsert({ user_id: authData.user.id, email: invite.email, role: "emanon_staff" }, { onConflict: "user_id,role" });
  await supabaseAdmin.from("emanon_staff_invites").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invite.id);
  await ensureConversation(invite.organization_id);
  return NextResponse.json({ ok: true, loginUrl: "/emanon/login" });
}
