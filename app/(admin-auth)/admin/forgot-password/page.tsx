"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setIsSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setMessage("Please enter your administrator email address.");
      return;
    }

    setSending(true);

    const redirectTo =
      `${window.location.origin}/admin/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo,
      }
    );

    setSending(false);

    if (error) {
      console.error(
        "Administrator password recovery error:",
        error
      );

      setMessage(
        "Unable to send the password reset link. Please try again."
      );
      return;
    }

    setIsSuccess(true);
    setMessage(
      "Password reset instructions have been sent. Please check your email."
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-12">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-xl md:p-10">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">
            EPEW Admin Control Center
          </p>

          <h1 className="text-4xl font-extrabold text-[#06245c]">
            Forgot Password
          </h1>

          <p className="mt-4 text-lg text-gray-700">
            Enter your administrator email address. We will send you a secure
            password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block font-bold text-gray-700">
              Administrator Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full rounded-2xl border border-gray-300 p-4 text-lg outline-none transition focus:border-[#06245c]"
            />
          </div>

          {message ? (
            <div
              className={`rounded-2xl p-4 font-bold ${
                isSuccess
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-2xl bg-[#06245c] py-4 text-xl font-extrabold text-white transition hover:bg-[#0a3478] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/admin/login"
            className="font-bold text-[#06245c] hover:underline"
          >
            Return to Administrator Login
          </Link>
        </div>
      </div>
    </main>
  );
}
