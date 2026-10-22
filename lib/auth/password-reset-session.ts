import type { SupabaseClient } from "@supabase/supabase-js";

/** Wait for SDK URL/session initialization, then verify the current user with Auth. */
export async function hasVerifiedPasswordResetSession(
  auth: Pick<SupabaseClient["auth"], "getSession" | "getUser">,
): Promise<boolean> {
  try {
    const sessionResult = await auth.getSession();
    const session = sessionResult.data.session;
    if (sessionResult.error || !session?.user?.id) return false;
    const userResult = await auth.getUser();
    return !userResult.error && userResult.data.user?.id === session.user.id;
  } catch {
    return false;
  }
}
