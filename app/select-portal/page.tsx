"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SelectPortalPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setRoles(data || []);
    setLoading(false);
  }

  function goToPortal(role: string) {
    if (role === "entrepreneur") router.push("/entrepreneurs/dashboard");
    if (role === "supporter") router.push("/supporters/dashboard");
    if (role === "coach") router.push("/coaches/dashboard");
    if (role === "partner") router.push("/partners/dashboard");
    if (role === "admin") router.push("/admin/dashboard");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">
          Loading your portals...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center mb-10">
          <h1 className="text-6xl font-extrabold mb-6">
            Select Your Portal
          </h1>

          <p className="text-2xl text-gray-700">
            Choose which EPEW portal you want to access.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {roles.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goToPortal(item.role)}
              className="bg-white rounded-3xl shadow-xl p-10 text-left hover:shadow-2xl hover:-translate-y-1 transition"
            >
              <h2 className="text-4xl font-bold mb-4 capitalize">
                {item.role} Portal
              </h2>

              <p className="text-xl text-gray-700">
                Continue to your {item.role} dashboard.
              </p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}