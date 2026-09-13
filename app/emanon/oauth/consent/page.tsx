import { redirect } from "next/navigation";
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
    redirect(`/emanon/login?redirect=${encodeURIComponent(target)}`);
  }

  const { data: member } = await supabase
    .from("emanon_staff_members")
    .select("display_name,title,email,status")
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!member) redirect("/emanon/login");

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
        <p className="text-sm font-bold uppercase tracking-widest text-green-700">Emanon Institute · EPEW</p>
        <h1 className="mt-2 text-3xl font-extrabold">Authorize Communication Center</h1>
        <p className="mt-4 text-gray-700"><strong>{authDetails.client.name}</strong> is requesting access to the authenticated Emanon account below.</p>
        <div className="my-6 rounded-2xl bg-blue-50 p-4">
          <p className="font-bold">{member.display_name}</p>
          <p>{member.title}</p>
          <p className="text-sm text-gray-600">{member.email}</p>
        </div>
        <p className="font-bold">Requested permissions</p>
        <ul className="mt-2 list-disc pl-6 text-gray-700">
          {scopes.map((scope) => <li key={scope}>{scope}</li>)}
          <li>Read and send messages in this user&apos;s authorized Emanon conversations</li>
        </ul>
        <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Only approve this on the correct staff member&apos;s ChatGPT account. Access remains limited by Emanon row-level security.</p>
        <form action="/api/emanon/oauth/decision" method="POST" className="mt-6 flex gap-3">
          <input type="hidden" name="authorization_id" value={authorizationId} />
          <button type="submit" name="decision" value="deny" className="flex-1 rounded-xl border-2 border-[#06245c] p-3 font-bold">Deny</button>
          <button type="submit" name="decision" value="approve" className="flex-1 rounded-xl bg-[#06245c] p-3 font-bold text-white">Approve</button>
        </form>
      </section>
    </main>
  );
}
