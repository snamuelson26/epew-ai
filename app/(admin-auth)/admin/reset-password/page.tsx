"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AdminResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let recoveryDetected = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session?.user) {
        recoveryDetected = true;
        setMessage("");
        setReady(true);
      }
    });

    const timer = window.setTimeout(() => {
      if (!recoveryDetected) {
        setReady(false);
        setMessage(
          "Your password reset session is missing or has expired. Please request a new password reset link.",
        );
      }
    }, 2500);

    return () => {
      window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setIsSuccess(false);

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setUpdating(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setUpdating(false);

    if (error) {
      console.error("Admin password update error:", {
        message: error.message,
        name: error.name,
        status: "status" in error ? error.status : undefined,
        code: "code" in error ? error.code : undefined,
      });

      setMessage(
        `Password update failed: ${error.message}`
      );
      return;
    }

    setIsSuccess(true);
    setReady(false);
    setMessage("Password updated successfully. Redirecting to login...");

    setTimeout(() => {
      router.push("/admin/login");
    }, 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 py-20">
      <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">
            EPEW Admin Control Center
          </p>

          <h1 className="mt-4 text-4xl font-extrabold text-[#06245c] md:text-5xl">
            Reset Administrator Password
          </h1>

          <p className="mt-6 text-xl leading-relaxed text-gray-700">
            Enter and confirm your new administrator password.
          </p>
        </div>

        {message && (
          <div
            className={`mt-8 rounded-2xl p-5 text-lg font-semibold ${
              isSuccess
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-lg font-bold text-gray-700"
              >
                New Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                autoComplete="new-password"
                className="w-full rounded-2xl border border-gray-300 p-4 text-lg outline-none transition focus:border-[#06245c]"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-lg font-bold text-gray-700"
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
                className="w-full rounded-2xl border border-gray-300 p-4 text-lg outline-none transition focus:border-[#06245c]"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full rounded-2xl bg-[#06245c] px-8 py-5 text-xl font-extrabold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updating ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        )}

        {!ready && !isSuccess && (
          <div className="mt-8 text-center">
            <Link
              href="/admin/forgot-password"
              className="font-bold text-[#06245c] hover:underline"
            >
              Request a New Reset Link
            </Link>
          </div>
        )}

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
