import { redirect } from "next/navigation";
import { coachAccess } from "@/lib/coaches/agentAccess";
import { communicationAccess } from "@/lib/communications/supporterAccess";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>;
}) {
  const authorizationId = (await searchParams).authorization_id;
  if (!authorizationId) {
    return <main className="min-h-screen bg-[#f5f7fb] p-8 text-center text-red-700">Missing authorization request.</main>;
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    const target = `/emanon/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
    return <main className="mx-auto max-w-xl p-8"><h1 className="text-3xl font-bold">Sign in to authorize your connection</h1><p className="my-4">Choose the account workspace for this connection.</p><a className="block my-4 underline" href={`/staff/supporter-relations/login?authorization_id=${encodeURIComponent(authorizationId)}`}>EPEW Supporter Relations — Yamiley Noslen</a><a className="block my-4 underline" href={`/coaches/login?authorization_id=${encodeURIComponent(authorizationId)}`}>EPEW Entrepreneur Coaches</a><a className="block my-4 underline" href={`/emanon/login?redirect=${encodeURIComponent(target)}`}>Emanon / ORGDH staff</a></main>;
  }

  const { data: member } = await supabase
    .from("emanon_staff_members")
    .select("display_name,title,email,status,organization_id")
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();
  const coach = !member ? await coachAccess() : null;
  if (coach) {
    const {data: details,error} = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
    if(error || !details) return <main className="p-8">Invalid authorization request.</main>;
    if (!("authorization_id" in details)) redirect(details.redirect_url);
    return <main className="mx-auto max-w-xl p-8"><h1 className="text-3xl font-bold">Authorize EPEW Entrepreneur Coach</h1><p className="my-6">{details.client.name} requests access as <strong>{coach.profile.name}</strong> ({coach.profile.email}).</p><p>Only your current assigned entrepreneurs, portal conversations, private notes, tasks, documents and referrals to Samuel are accessible. Financial approvals, account changes and platform administration are excluded. Approve only in the intended coach’s ChatGPT account.</p><form action="/api/coaches/oauth/decision" method="POST" className="mt-6 flex gap-6"><input type="hidden" name="authorization_id" value={authorizationId}/><button name="decision" value="deny">Deny</button><button name="decision" value="approve">Approve connection</button></form></main>;
  }
  const access = await communicationAccess();
  if (!member && access?.staff && access.staff.user_id === userData.user.id) {
    const {data: details,error} = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
    if(error || !details) return <main className="p-8">Invalid authorization request.</main>;
    if (!("authorization_id" in details)) redirect(details.redirect_url);
    return <main className="mx-auto max-w-xl p-8"><h1 className="text-3xl font-bold">Authorize EPEW Supporter Relations</h1><p className="my-6">{details.client.name} requests access as <strong>{access.staff.display_name}</strong> ({access.staff.email}).</p><p>Access includes supporter conversations, portal messages, private documents, team referrals and activity history. Financial approvals, account changes and platform administration are excluded. Only approve in the intended agent’s ChatGPT account.</p><form action="/api/epew/oauth/decision" method="POST" className="mt-6 flex gap-6"><input type="hidden" name="authorization_id" value={authorizationId}/><button name="decision" value="deny">Deny</button><button name="decision" value="approve">Approve connection</button></form></main>;
  }
  if (!member) redirect(`/staff/supporter-relations/login?authorization_id=${encodeURIComponent(authorizationId)}`);
  const { data: organization } = await supabase
    .from("emanon_organizations")
    .select("organization_code,display_name")
    .eq("id", member.organization_id)
    .maybeSingle();
  if (!organization) redirect("/emanon/login");

  const { data: authDetails, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error || !authDetails) {
    return <main className="min-h-screen bg-[#f5f7fb] p-8 text-center text-red-700">{error?.message ?? "Invalid authorization request."}</main>;
  }
  if (!("authorization_id" in authDetails)) redirect(authDetails.redirect_url);

  const scopes = authDetails.scope?.split(" ").filter(Boolean) ?? [];
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-12 text-[#06245c]">
      <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-sm font-bold uppercase tracking-widest text-green-700">{organization.display_name} · EPEW</p>
        <h1 className="mt-2 text-3xl font-extrabold">Authorize Communication Center</h1>
        <p className="mt-4 text-gray-700"><strong>{authDetails.client.name}</strong> is requesting access to the authenticated {organization.display_name} account below.</p>
        <div className="my-6 rounded-2xl bg-blue-50 p-4">
          <p className="font-bold">{member.display_name}</p>
          <p>{member.title}</p>
          <p className="text-sm text-gray-600">{member.email}</p>
        </div>
        <p className="font-bold">Requested permissions</p>
        <ul className="mt-2 list-disc pl-6 text-gray-700">
          {scopes.map((scope) => <li key={scope}>{scope}</li>)}
          <li>Read and send messages in this user&apos;s authorized {organization.display_name} conversations</li>
        </ul>
        <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Only approve this on the correct staff member&apos;s ChatGPT account. Access remains limited by organization-scoped row-level security.</p>
        <form action="/api/emanon/oauth/decision" method="POST" className="mt-6 flex gap-3">
          <input type="hidden" name="authorization_id" value={authorizationId} />
          <button type="submit" name="decision" value="deny" className="flex-1 rounded-xl border-2 border-[#06245c] p-3 font-bold">Deny</button>
          <button type="submit" name="decision" value="approve" className="flex-1 rounded-xl bg-[#06245c] p-3 font-bold text-white">Approve</button>
        </form>
      </section>
    </main>
  );
}
