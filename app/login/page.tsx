"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function redirectByRole(role: string) {
    if (role === "entrepreneur") router.push("/entrepreneurs/dashboard");
    else if (role === "supporter") router.push("/supporters/dashboard");
    else if (role === "coach") router.push("/coaches/dashboard");
    else if (role === "partner") router.push("/partners/dashboard");
    else if (role === "admin") router.push("/admin/dashboard");
    else setMessage("No valid portal found for this account.");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Login failed. Please try again.");
      return;
    }

    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id);

    if (roleError) {
      setMessage(roleError.message);
      return;
    }

    if (!roles || roles.length === 0) {
      setMessage("No portal role is connected to this account.");
      return;
    }

    if (roles.length === 1) {
      redirectByRole(roles[0].role);
      return;
    }

    router.push("/select-portal");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-6 py-20">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-xl w-full">
        <h1 className="text-5xl font-extrabold text-[#06245c] mb-6 text-center">
          EPEW Login
        </h1>

        <p className="text-xl text-gray-700 text-center mb-10">
          Sign in once and access your available EPEW portals.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded-2xl p-4 w-full text-xl"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border rounded-2xl p-4 w-full text-xl"
          />

          {message && (
            <p className="text-red-700 text-center text-xl font-bold">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}