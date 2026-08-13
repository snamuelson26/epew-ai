"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function SupporterForgotPasswordPage() {
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
      setMessage("Please enter your email address.");
      return;
    }

    setSending(true);

    const redirectTo =
      `${window.location.origin}/supporters/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo,
      },
    );

    setSending(false);

    if (error) {
      console.error("Supporter password recovery error:", error);

      setMessage(
        "Unable to send the password reset link. Please try again.",
      );
      return;
    }

    setIsSuccess(true);
    setMessage(
      "A secure password reset link has been sent. Please check your email and follow the link to create a new password.",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 py-20">
      <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-green-600">
            EPEW Supporter Portal
          </p>

          <h1 className="mt-4 text-4xl font-extrabold text-[#06245c] md:text-5xl">
            Forgot Password
          </h1>

          <p className="mt-6 text-xl leading-relaxed text-gray-700">
            Enter the email address associated with your EPEW supporter
            account. We will send you a secure link to verify your email
            and create a new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-lg font-bold text-gray-700"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@example.com"
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-gray-300 p-4 text-lg outline-none transition focus:border-[#06245c]"
            />
          </div>

          {message && (
            <div
              className={`rounded-2xl p-5 text-lg font-semibold ${
                isSuccess
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {!isSuccess && (
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-2xl bg-[#06245c] px-8 py-5 text-xl font-extrabold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          )}
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/supporters/login"
            className="font-bold text-[#06245c] hover:underline"
          >
            Return to Supporter Login
          </Link>
        </div>
      </div>
    </main>
  );
}
