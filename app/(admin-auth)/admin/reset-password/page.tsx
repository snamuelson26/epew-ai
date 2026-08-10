"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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
      setMessage(error.message);
      return;
    }

    setIsSuccess(true);
    setMessage("Password updated successfully. Redirecting to login...");

    setTimeout(() => {
      router.push("/admin/login");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-12">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-xl md:p-10">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">
            EPEW Admin Control Center
          </p>

          <h1 className="text-4xl font-extrabold text-[#06245c]">
            Reset Administrator Password
          </h1>

          <p className="mt-4 text-lg text-gray-700">
            Enter and confirm your new administrator password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block font-bold text-gray-700">
              New Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              className="w-full rounded-2xl border border-gray-300 p-4 text-lg outline-none transition focus:border-[#06245c]"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
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
            disabled={updating}
            className="w-full rounded-2xl bg-[#06245c] py-4 text-xl font-extrabold text-white transition hover:bg-[#0a3478] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? "Updating..." : "Update Password"}
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
