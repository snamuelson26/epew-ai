import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESOURCE = "https://www.epew.us/api/emanon/mcp";
const METADATA = "https://www.epew.us/.well-known/oauth-protected-resource";
const allowedTypes = ["message", "report", "assignment", "follow_up", "proposal", "urgent_update"] as const;

type JsonRpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };
type Member = { id: string; organization_id: string; email: string; display_name: string; title: string; role_code: string };
type Contact = { id: string; email: string; display_name: string; title: string; conversation_id: string };

function rpc(id: JsonRpc["id"], result: unknown, status = 200) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result }, { status });
}
function rpcError(id: JsonRpc["id"], code: number, message: string, status = 200) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status });
}
function unauthorized(id: JsonRpc["id"]) {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code: -32001, message: "OAuth authentication required." } },
    { status: 401, headers: { "WWW-Authenticate": `Bearer resource_metadata="${METADATA}", scope="openid email profile offline_access"` } },
  );
}
function textResult(value: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value };
}
function env(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing ${name} environment variable.`);
  return value;
}
function bearerClient(token: string) {
  return createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } },
  );
}
async function identity(supabase: ReturnType<typeof bearerClient>, token: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return null;
  const { data } = await supabase.from("emanon_staff_members")
    .select("id,organization_id,email,display_name,title,role_code")
    .eq("user_id", userData.user.id).eq("status", "active").maybeSingle();
  return (data ?? null) as Member | null;
}
async function contactsFor(supabase: ReturnType<typeof bearerClient>, member: Member) {
  const { data: ownLinks, error } = await supabase.from("emanon_conversation_members")
    .select("conversation_id").eq("member_id", member.id);
  if (error) throw error;
  const ids = (ownLinks ?? []).map((x) => x.conversation_id);
  if (!ids.length) return [] as Contact[];
  const { data: conversations, error: conversationError } = await supabase.from("emanon_conversations")
    .select("id").in("id", ids).eq("organization_id", member.organization_id).eq("conversation_type", "direct");
  if (conversationError) throw conversationError;
  const directIds = (conversations ?? []).map((x) => x.id);
  if (!directIds.length) return [] as Contact[];
  const { data: links, error: linkError } = await supabase.from("emanon_conversation_members")
    .select("conversation_id,member:emanon_staff_members!member_id(id,email,display_name,title)")
    .in("conversation_id", directIds).neq("member_id", member.id);
  if (linkError) throw linkError;
  return (links ?? []).flatMap((link) => {
    const raw = Array.isArray(link.member) ? link.member[0] : link.member;
    return raw ? [{ ...(raw as Omit<Contact, "conversation_id">), conversation_id: link.conversation_id }] : [];
  }) as Contact[];
}
async function selectedContact(supabase: ReturnType<typeof bearerClient>, member: Member, email?: string) {
  const contacts = await contactsFor(supabase, member);
  if (!email && contacts.length === 1) return contacts[0];
  return contacts.find((x) => x.email.toLowerCase() === (email ?? "").trim().toLowerCase()) ?? null;
}
function iso(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error("Date must be a valid ISO-8601 date/time.");
  return date.toISOString();
}

const toolDefinitions = [
  { name: "emanon_get_identity", description: "Show the authenticated Emanon Institute staff identity used by this connector.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "emanon_list_direct_contacts", description: "List staff members with whom the authenticated user has a private one-to-one Emanon conversation.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "emanon_read_messages", description: "Read the full direct Emanon conversation with one authorized staff member, including sender, recipient, subject, type, dates, follow-ups, assignments, and attachment metadata.", inputSchema: { type: "object", properties: { recipient_email: { type: "string", description: "Other staff member's Emanon email. Optional when only one direct contact exists." }, limit: { type: "integer", minimum: 1, maximum: 200, default: 100 } }, additionalProperties: false } },
  { name: "emanon_send_message", description: "Send a direct internal Emanon message, report, assignment, follow-up instruction, proposal, or urgent update. The authenticated staff member is always recorded as sender.", inputSchema: { type: "object", required: ["message_type", "body"], properties: { recipient_email: { type: "string", description: "Recipient Emanon email. Optional when only one direct contact exists." }, message_type: { type: "string", enum: allowedTypes }, subject: { type: "string" }, body: { type: "string" }, assignment_due_at: { type: "string", description: "Optional ISO-8601 date/time; assignment messages only." }, follow_up_at: { type: "string", description: "Optional ISO-8601 follow-up date/time." }, attachments: { type: "array", maxItems: 3, description: "Optional small attachments encoded as base64; each must be 2 MB or less.", items: { type: "object", required: ["name", "mime_type", "base64"], properties: { name: { type: "string" }, mime_type: { type: "string" }, base64: { type: "string" } }, additionalProperties: false } } }, additionalProperties: false } },
  { name: "emanon_list_conversations", description: "List the authenticated user's private one-to-one Emanon conversations and participants.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "emanon_get_attachment", description: "Create a short-lived secure download URL for an attachment that belongs to the selected authorized conversation.", inputSchema: { type: "object", required: ["path"], properties: { recipient_email: { type: "string" }, path: { type: "string" } }, additionalProperties: false } },
  { name: "emanon_update_follow_up", description: "Create, change, or clear the follow-up date on a message sent by the authenticated user.", inputSchema: { type: "object", required: ["message_id"], properties: { recipient_email: { type: "string" }, message_id: { type: "string" }, follow_up_at: { type: ["string", "null"], description: "ISO-8601 date/time, or null to clear." } }, additionalProperties: false } },
  { name: "emanon_mark_read", description: "Mark all incoming messages in a direct Emanon conversation as opened by the authenticated user.", inputSchema: { type: "object", properties: { recipient_email: { type: "string" } }, additionalProperties: false } },
];
const tools = toolDefinitions.map((tool) => ({
  ...tool,
  securitySchemes: [{ type: "oauth2", scopes: ["openid", "email", "profile", "offline_access"] }],
}));

async function callTool(name: string, args: Record<string, unknown>, supabase: ReturnType<typeof bearerClient>, member: Member) {
  if (name === "emanon_get_identity") return textResult({ organization: "Emanon Institute", ...member });
  if (name === "emanon_list_direct_contacts") return textResult({ contacts: await contactsFor(supabase, member) });
  if (name === "emanon_list_conversations") {
    const contacts = await contactsFor(supabase, member);
    return textResult({ organization: "Emanon Institute", conversations: contacts.map((contact) => ({ conversation_id: contact.conversation_id, conversation_type: "direct", participants: [member, contact] })) });
  }

  const contact = await selectedContact(supabase, member, typeof args.recipient_email === "string" ? args.recipient_email : undefined);
  if (!contact) throw new Error("No authorized direct conversation was found for that recipient.");

  if (name === "emanon_read_messages") {
    const limit = Math.min(200, Math.max(1, Number(args.limit) || 100));
    const { data, error } = await supabase.from("emanon_messages")
      .select("id,sender_member_id,message_type,subject,body,assignment_due_at,follow_up_at,attachments,created_at,updated_at,sender:emanon_staff_members!sender_member_id(display_name,title,email),receipts:emanon_message_receipts(member_id,delivered_at,opened_at,member:emanon_staff_members!member_id(email,display_name))")
      .eq("conversation_id", contact.conversation_id).order("created_at", { ascending: true }).limit(limit);
    if (error) throw error;
    const messages = (data ?? []).map((item) => {
      const sender = Array.isArray(item.sender) ? item.sender[0] : item.sender;
      const fromSelf = item.sender_member_id === member.id;
      return { id: item.id, sender: sender ?? (fromSelf ? member : contact), recipient: fromSelf ? contact : member, message_type: item.message_type, subject: item.subject, body: item.body, assignment_due_at: item.assignment_due_at, follow_up_at: item.follow_up_at, attachments: item.attachments, delivery_status: item.receipts, created_at: item.created_at, updated_at: item.updated_at };
    });
    return textResult({ organization: "Emanon Institute", conversation_id: contact.conversation_id, participants: [member, contact], messages });
  }

  if (name === "emanon_get_attachment") {
    const path = typeof args.path === "string" ? args.path : "";
    const { data: rows, error } = await supabase.from("emanon_messages").select("attachments").eq("conversation_id", contact.conversation_id);
    if (error) throw error;
    const found = (rows ?? []).some((row) => Array.isArray(row.attachments) && row.attachments.some((item: unknown) => typeof item === "object" && item !== null && "path" in item && (item as { path: unknown }).path === path));
    if (!found) throw new Error("Attachment was not found in this authorized conversation.");
    const { data, error: signedError } = await supabase.storage.from("emanon-communications").createSignedUrl(path, 120);
    if (signedError) throw signedError;
    return textResult({ path, signed_url: data.signedUrl, expires_in: 120 });
  }

  if (name === "emanon_update_follow_up") {
    const messageId = typeof args.message_id === "string" ? args.message_id : "";
    if (!messageId) throw new Error("message_id is required.");
    const followUp = args.follow_up_at === null ? null : iso(args.follow_up_at);
    const { data, error } = await supabase.from("emanon_messages").update({ follow_up_at: followUp, updated_at: new Date().toISOString() }).eq("id", messageId).eq("conversation_id", contact.conversation_id).eq("sender_member_id", member.id).select("id,conversation_id,follow_up_at,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Only the original sender may update this message's follow-up date.");
    return textResult({ updated: true, follow_up: data });
  }

  if (name === "emanon_mark_read") {
    const { data: incoming, error } = await supabase.from("emanon_messages").select("id")
      .eq("conversation_id", contact.conversation_id).neq("sender_member_id", member.id);
    if (error) throw error;
    const openedAt = new Date().toISOString();
    const rows = (incoming ?? []).map((x) => ({ message_id: x.id, member_id: member.id, opened_at: openedAt }));
    if (rows.length) {
      const { error: receiptError } = await supabase.from("emanon_message_receipts").upsert(rows, { onConflict: "message_id,member_id" });
      if (receiptError) throw receiptError;
    }
    return textResult({ marked_read: rows.length, conversation_id: contact.conversation_id, opened_at: openedAt });
  }

  if (name === "emanon_send_message") {
    const messageType = typeof args.message_type === "string" ? args.message_type : "";
    if (!allowedTypes.includes(messageType as typeof allowedTypes[number])) throw new Error("Unsupported message_type.");
    if ((messageType === "assignment" || messageType === "follow_up") && member.role_code !== "program_director") {
      throw new Error("Only the Program Director may issue assignments or follow-up instructions.");
    }
    const body = typeof args.body === "string" ? args.body.trim() : "";
    if (!body) throw new Error("Message body is required.");
    const uploaded: Array<{ name: string; path: string; mime_type: string }> = [];
    const attachments = Array.isArray(args.attachments) ? args.attachments : [];
    for (const raw of attachments) {
      const file = raw as { name?: unknown; mime_type?: unknown; base64?: unknown };
      if (typeof file.name !== "string" || typeof file.mime_type !== "string" || typeof file.base64 !== "string") throw new Error("Each attachment requires name, mime_type, and base64.");
      const bytes = Buffer.from(file.base64, "base64");
      if (bytes.length > 2 * 1024 * 1024) throw new Error(`Attachment ${file.name} is larger than 2 MB.`);
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${member.organization_id}/${member.id}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from("emanon-communications").upload(path, bytes, { contentType: file.mime_type });
      if (error) throw error;
      uploaded.push({ name: file.name, path, mime_type: file.mime_type });
    }
    const { data, error } = await supabase.from("emanon_messages").insert({
      organization_id: member.organization_id,
      conversation_id: contact.conversation_id,
      sender_member_id: member.id,
      message_type: messageType,
      subject: typeof args.subject === "string" && args.subject.trim() ? args.subject.trim() : null,
      body,
      assignment_due_at: messageType === "assignment" ? iso(args.assignment_due_at) : null,
      follow_up_at: iso(args.follow_up_at),
      attachments: uploaded,
    }).select("id,created_at").single();
    if (error) throw error;
    return textResult({ sent: true, organization: "Emanon Institute", conversation_id: contact.conversation_id, message_id: data.id, sender: member, recipient: contact, created_at: data.created_at, attachments: uploaded.map(({ name, mime_type }) => ({ name, mime_type })) });
  }

  throw new Error("Unknown tool.");
}

export async function GET() {
  return NextResponse.json({ name: "Emanon Communication Center MCP", authenticated: true, resource: RESOURCE });
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,content-type,mcp-protocol-version", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" } });
}
export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as JsonRpc | null;
  if (!payload?.method) return rpcError(payload?.id, -32700, "Invalid JSON-RPC request.", 400);
  if (payload.method === "initialize") return rpc(payload.id, { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "Emanon Communication Center", version: "1.0.0" }, instructions: "Use these tools only for authenticated one-to-one Emanon Institute communication. Confirm before sending messages." });
  if (payload.method === "notifications/initialized") return new NextResponse(null, { status: 202 });
  if (payload.method === "ping") return rpc(payload.id, {});
  if (payload.method === "tools/list") return rpc(payload.id, { tools });

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return unauthorized(payload.id);
  const supabase = bearerClient(token);
  const member = await identity(supabase, token);
  if (!member) return unauthorized(payload.id);

  if (payload.method === "tools/call") {
    const name = payload.params?.name ?? "";
    try {
      return rpc(payload.id, await callTool(name, payload.params?.arguments ?? {}, supabase, member));
    } catch (error) {
      return rpc(payload.id, { content: [{ type: "text", text: error instanceof Error ? error.message : "Tool call failed." }], isError: true });
    }
  }
  return rpcError(payload.id, -32601, "Method not found.");
}
