"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function AdminRecoveryConfirmPage() {
  const searchParams = useSearchParams();

  const confirmationUrl = useMemo(() => {
    const value = searchParams.get("confirmation_url");

    if (!value) {
      return null;
    }

    try {
      const decoded = decodeURIComponent(value);

      const url = new URL(decoded);

      if (
        url.protocol !== "https:" &&
        url.hostname !== "localhost"
      ) {
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 py-20">
      <div className="w-full max-w-xl rounded-3xl bg-white p-10 text-center shadow-2xl">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">
          EPEW Admin Control Center
        </p>

        <h1 className="mt-4 text-4xl font-extrabold text-[#06245c] md:text-5xl">
          Confirm Password Reset
        </h1>

        <p className="mt-6 text-xl leading-relaxed text-gray-700">
          You requested to reset your EPEW Administrator password.
        </p>

        <p className="mt-4 text-lg leading-relaxed text-gray-600">
          Click the button below to continue securely to the password reset page.
        </p>

        {confirmationUrl ? (
          <a
            href={confirmationUrl}
            className="mt-10 inline-block w-full rounded-2xl bg-[#06245c] px-8 py-5 text-xl font-extrabold text-white transition hover:bg-green-600"
          >
            Continue to Reset Password
          </a>
        ) : (
          <div className="mt-8 rounded-2xl bg-red-50 p-5 text-lg font-semibold text-red-800">
            This password recovery link is invalid or incomplete. Please request a new reset link.
          </div>
        )}
      </div>
    </main>
  );
}
