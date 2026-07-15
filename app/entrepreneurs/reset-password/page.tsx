"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepareSession() {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const code = searchParams.get("code");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setMessage(error.message);
          return;
        }
      } else {
        setMessage("Reset session missing. Please request a new password reset link.");
        return;
      }

      setReady(true);
    }

    prepareSession();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated successfully. Redirecting to login...");

    setTimeout(() => {
      router.push("/entrepreneurs/login");
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-6 py-20">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-xl w-full">
        <h1 className="text-5xl font-extrabold text-[#06245c] mb-6 text-center">
          Reset Password
        </h1>

        <p className="text-xl text-gray-700 text-center mb-10">
          Enter your new password below.
        </p>

        {message && (
          <p
            className={`text-center text-xl font-bold mb-6 ${
              message.includes("successfully")
                ? "text-green-700"
                : "text-red-700"
            }`}
          >
            {message}
          </p>
        )}

        {ready && (
          <form onSubmit={handleReset} className="space-y-6">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border rounded-2xl p-4 w-full text-xl"
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border rounded-2xl p-4 w-full text-xl"
            />

            <button
              type="submit"
              className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
            >
              Update Password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}