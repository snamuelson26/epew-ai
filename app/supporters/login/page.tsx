"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SupporterLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

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

    const { data: supporter, error: supporterError } = await supabase
      .from("supporters")
      .select("*")
      .or(`user_id.eq.${user.id},email.eq.${cleanEmail}`)
      .maybeSingle();

    if (supporterError) {
      setLoading(false);
      setMessage(supporterError.message);
      return;
    }

    if (!supporter) {
      setLoading(false);
      setMessage(
        "No supporter account was found for this email. Please register as a supporter first."
      );
      return;
    }

    router.push("/supporters/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md">

        <h1 className="text-4xl font-extrabold text-[#06245c] mb-4">
          Supporter Login
        </h1>

        <p className="text-gray-600 mb-8">
          Sign in to access your EPEW Supporter Dashboard.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="font-bold text-[#06245c]">
              Email
            </label>

            <input
              type="email"
              className="w-full mt-2 p-4 border rounded-2xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-bold text-[#06245c]">
              Password
            </label>

            <input
              type="password"
              className="w-full mt-2 p-4 border rounded-2xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && (
  <div className="bg-red-100 border-2 border-red-500 text-red-700 rounded-2xl p-4 mt-6 text-xl font-bold">
    {message}
  </div>
)}

{message.includes("already registered") && (
  <div className="mt-6 text-center">
    <p className="text-gray-700 font-bold">
      Already registered?
    </p>

    <a
      href="/supporters/login"
      className="text-blue-700 underline font-bold text-lg"
    >
      Sign in to your supporter account
    </a>
  </div>
)}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#06245c] text-white py-4 rounded-2xl text-xl font-bold hover:bg-green-600 transition"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </form>

        <div className="mt-6 text-center">
          <a
            href="/supporters/register"
            className="text-green-700 font-bold hover:underline"
          >
            Create Supporter Account
          </a>
        </div>

      </div>
    </main>
  );
}