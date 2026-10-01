import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function programContext(profileCode: string) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user || profileCode !== "EMANON-001") throw new Error("Program management access denied.");
  const { data: member } = await client.from("emanon_staff_members")
    .select("organization_id,role_code").eq("user_id", user.id).eq("status", "active")
    .eq("role_code", "program_director").maybeSingle();
  if (!member) throw new Error("Program Director access required.");
  const { data: organization } = await client.from("emanon_organizations")
    .select("organization_code").eq("id", member.organization_id).maybeSingle();
  if (organization?.organization_code !== "EMANON-INSTITUTE") throw new Error("Organization access denied.");
  const { data: portal } = await client.from("organization_portal_profiles")
    .select("entity_id").eq("auth_user_id", user.id).eq("profile_code", profileCode).eq("status", "active").maybeSingle();
  if (!portal) throw new Error("Active Emanon dashboard access required.");
  return { client, entityId: portal.entity_id };
}

async function updateProgram(profileCode: string, formData: FormData) {
  "use server";
  const { client, entityId } = await programContext(profileCode);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const nextAction = String(formData.get("next_action") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || !status || status.length > 80 || nextAction.length > 4000) throw new Error("Invalid program update.");
  const { data, error } = await client.from("organization_projects")
    .update({ status, next_action: nextAction || null, updated_at: new Date().toISOString() })
    .eq("id", id).eq("entity_id", entityId).select("id").maybeSingle();
  if (error || !data) throw new Error("Unable to save this Emanon program.");
  const path = `/organizations/${profileCode}/program-management`;
  revalidatePath(path);
  redirect(`${path}?saved=1`);
}

export default async function ProgramManagement({ params, searchParams }: {
  params: Promise<{ profileCode: string }>; searchParams: Promise<{ saved?: string }>;
}) {
  const { profileCode } = await params;
  let context: Awaited<ReturnType<typeof programContext>>;
  try { context = await programContext(profileCode); }
  catch { return <main className="p-8"><h1 className="text-2xl font-bold">Program Director access required</h1></main>; }
  const { data: programs, error } = await context.client.from("organization_projects")
    .select("id,name,description,status,next_action").eq("entity_id", context.entityId).order("name");
  if (error) throw new Error("Unable to load Emanon programs.");
  const { saved } = await searchParams;
  return <main className="min-h-screen bg-slate-100 p-6 text-slate-900"><div className="mx-auto max-w-5xl space-y-6">
    <Link href={`/organizations/${profileCode}/dashboard`} className="font-bold text-blue-800">Back to Emanon Dashboard</Link>
    <h1 className="text-4xl font-extrabold">Program Management</h1>
    <p>Review Emanon programs and projects, update their status, and record the next action. Use the staff workspace for assignments, follow-ups and reports.</p>
    <Link href="/emanon/communication-center" className="inline-block font-bold text-blue-800">Open Staff Workspace</Link>
    {saved === "1" && <p role="status" className="rounded-xl bg-green-100 p-4">Program updated.</p>}
    {programs?.map(program => <form key={program.id} action={updateProgram.bind(null, profileCode)} className="space-y-4 rounded-2xl bg-white p-6 shadow">
      <h2 className="text-2xl font-bold">{program.name}</h2>
      {program.description && <p>{program.description}</p>}
      <input type="hidden" name="id" value={program.id}/>
      <label className="block font-semibold">Status<input name="status" defaultValue={program.status} required maxLength={80} className="mt-1 block w-full rounded-lg border p-3"/></label>
      <label className="block font-semibold">Next action<textarea name="next_action" defaultValue={program.next_action ?? ""} maxLength={4000} rows={3} className="mt-1 block w-full rounded-lg border p-3"/></label>
      <button className="rounded-xl bg-blue-900 px-5 py-3 font-bold text-white">Save Program</button>
    </form>)}
    {!programs?.length && <p>No programs have been recorded.</p>}
  </div></main>;
}
