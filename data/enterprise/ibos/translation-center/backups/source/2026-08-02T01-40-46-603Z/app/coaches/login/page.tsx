"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CoachLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    const user = data.user;

    const { data: coachData, error: coachError } = await supabase
      .from("coaches")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    setLoading(false);

    if (coachError) {
      console.log(coachError);
      setMessage("Unable to verify coach account. " + coachError.message);
      return;
    }

    console.log("Logged in user:", user);
console.log("Coach record:", coachData);
console.log("Coach error:", coachError);

if (!coachData) {
  await supabase.auth.signOut();
  setMessage(
    "Access denied. This email is not registered as an EPEW coach."
  );
  return;
}

    router.push("/coaches/dashboard");
  }

  return (
    <main className="bg-[#f5f7fb] min-h-screen text-[#06245c] flex items-center justify-center px-8">
      <div className="bg-white rounded-3xl shadow-2xl p-14 max-w-3xl w-full">
        <h1 className="text-6xl font-extrabold text-center mb-8">
          Coach Login
        </h1>

        <p className="text-2xl text-gray-700 text-center leading-relaxed mb-12">
          Authorized EPEW coaches can log in to manage assigned entrepreneurs,
          interviews, notes, and marketplace readiness.
        </p>

        <form onSubmit={handleLogin} className="space-y-8">
          <div>
            <label className="block text-2xl font-bold mb-3">
              Email Address
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl"
            />
          </div>

          <div>
            <label className="block text-2xl font-bold mb-3">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl"
            />
          </div>

          {message && (
            <p className="text-center text-xl font-bold text-red-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
          >
            {loading ? "Logging in..." : "Login to Coach Dashboard"}
          </button>
        </form>

        <p className="text-center text-xl text-gray-600 mt-10">
          Coach access is limited to authorized EPEW coaches only.
        </p>
      </div>
    </main>
  );
}