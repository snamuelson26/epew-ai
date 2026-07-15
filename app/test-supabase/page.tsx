import { supabase } from "@/lib/supabase";

export default async function TestSupabasePage() {
  const { data: users, error: usersError } =
    await supabase.from("users").select("*");

  const { data: entrepreneurs, error: entrepreneursError } =
    await supabase.from("entrepreneurs").select("*");

  const { data: supporters, error: supportersError } =
    await supabase.from("supporters").select("*");

  const { data: coaches, error: coachesError } =
    await supabase.from("coaches").select("*");

  const { data: admins, error: adminsError } =
    await supabase.from("admins").select("*");

  return (
    <main className="p-10">
      <h1 className="text-6xl font-bold mb-10">
        EPEW Database Test
      </h1>

      <pre className="bg-gray-100 p-6 rounded-xl overflow-auto">
        {JSON.stringify(
          {
            users,
            entrepreneurs,
            supporters,
            coaches,
            admins,
            usersError,
            entrepreneursError,
            supportersError,
            coachesError,
            adminsError,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}