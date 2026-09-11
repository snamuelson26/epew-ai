import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    const user = userData.user;
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const profileCode = String(body.profileCode || "").trim();
    const message = String(body.message || "").trim();
    const instruction = String(body.instruction || "professionalize").trim();
    const targetLanguage = String(body.targetLanguage || "").trim();
    if (!profileCode || !message) return NextResponse.json({ error: "Profile and message are required." }, { status: 400 });

    const { data: profile } = await supabaseAdmin
      .from("organization_portal_profiles")
      .select("display_name,external_sender")
      .eq("auth_user_id", user.id)
      .eq("profile_code", profileCode)
      .eq("status", "active")
      .maybeSingle();

    if (!profile) return NextResponse.json({ error: "Organization profile not available." }, { status: 403 });

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: "Message assistant is not configured." }, { status: 503 });

    const instructionMap: Record<string, string> = {
      professionalize: "Make the message professional, warm, clear, concise, and institutionally appropriate while preserving every important fact and request.",
      improve: "Improve clarity, structure, grammar, and persuasiveness while preserving the sender's intent and facts.",
      shorten: "Shorten the message substantially while preserving all essential facts, requests, dates, amounts, and commitments.",
      translate: `Translate the message into ${targetLanguage || "English"}. Preserve names, organizations, dates, amounts, links, and meaning exactly.`,
    };

    const api = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.EPEW_COMMUNICATION_MODEL?.trim() || "gpt-5.6-luna",
        input: `You are the Emanon Institute Communication Assistant. External identity is ${profile.display_name} <${profile.external_sender}>. ${instructionMap[instruction] || instructionMap.professionalize}\n\nReturn only the revised message, with no commentary.\n\nMESSAGE:\n${message}`,
        max_output_tokens: 1200,
        text: { verbosity: "low" },
      }),
    });

    if (!api.ok) return NextResponse.json({ error: `Message assistant failed (${api.status}).` }, { status: 502 });
    const payload = await api.json();
    const arranged = typeof payload.output_text === "string"
      ? payload.output_text
      : Array.isArray(payload.output)
        ? payload.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []).map((part: any) => part?.text || "").join("")
        : "";

    return NextResponse.json({ arranged: arranged.trim() });
  } catch (error) {
    console.error("Organization arrange message error:", error);
    return NextResponse.json({ error: "Unable to arrange this message." }, { status: 500 });
  }
}
