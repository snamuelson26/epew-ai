"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import Link from "next/link";

export default function EntrepreneurLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

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

    router.push("/entrepreneurs/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-6 py-20">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-xl w-full">
        <h1 className="text-5xl font-extrabold text-[#06245c] mb-6 text-center">
          Entrepreneur Login
        </h1>

        <p className="text-xl text-gray-700 text-center mb-10">
          Sign in to access your EPEW Entrepreneur Dashboard.
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

<div className="text-center mt-6">
  <Link
    href="/entrepreneurs/forgot-password"
    className="text-blue-700 text-xl font-bold hover:text-green-600 transition"
  >
    Forgot Password?
  </Link>
</div>
        </form>
      </div>
    </main>
  );
}