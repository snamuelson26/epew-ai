import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { signUploadReceipt, verifyUploadReceipt, validateDocumentMetadata, type OrganizationDocument } from "@/lib/entrepreneurs/organizationUploadReceipt";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    // First person is the account holder, followed by every listed member.
    if (!email || password.length < 8 || !Array.isArray(body.people) || body.people.length < 4) {
      return NextResponse.json({ error: "An account and at least three members are required." }, { status: 400 });
    }
    for (const person of body.people) {
      if (!person || typeof person.name !== "string" || !person.name.trim()) throw new Error("Every person must have a full name.");
      validateDocumentMetadata(person.governmentId?.size, person.governmentId?.type, false);
      validateDocumentMetadata(person.selfie?.size, person.selfie?.type, true);
    }
    const supabase = await createClient();
    let userId: string | undefined;
    if (typeof body.receipt === "string" && body.receipt) {
      const previous = verifyUploadReceipt(body.receipt);
      if (previous.email === email) userId = previous.userId;
    }
    if (!userId) {
      const { data: signedIn } = await supabase.auth.signInWithPassword({ email, password });
      userId = signedIn.user?.id;
    }
    if (!userId) {
      const signupStarted = Date.now();
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${request.nextUrl.origin}/entrepreneurs/login` } });
      // Existing accounts can return an obfuscated user. Never grant uploads for one.
      if (error || !data.user || data.user.identities?.length === 0 || Date.parse(data.user.created_at) < signupStarted) {
        return NextResponse.json({ error: "Please sign in with your existing account or confirm your email before submitting." }, { status: 401 });
      }
      userId = data.user.id;
    }
    const documents: OrganizationDocument[] = [];
    const uploads: { signedUrl: string }[] = [];
    for (const person of body.people) {
      for (const kind of ["governmentId", "selfie"] as const) {
        const file = person[kind];
        const bucket = kind === "selfie" ? "entrepreneur-selfies" : "entrepreneur-government-ids";
        const path = `${userId}/organization-${crypto.randomUUID()}`;
        const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
        if (error || !data) throw new Error("Unable to prepare private document uploads. Please try again.");
        documents.push({ bucket, path, size: file.size, type: file.type });
        uploads.push({ signedUrl: data.signedUrl });
      }
    }
    const receipt = signUploadReceipt({ userId, email, expires: Date.now() + 2 * 60 * 60 * 1000, names: body.people.map((person: { name: string }) => person.name.trim()), documents });
    return NextResponse.json({ receipt, uploads }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to prepare document uploads." }, { status: 400 });
  }
}
