"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function RecoveryConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");

  const validRecoveryRequest =
    Boolean(tokenHash) && type === "recovery";

  async function continueToReset() {
    if (!tokenHash || type !== "recovery") {
      setMessage(
        "This password recovery link is invalid or incomplete. Please request a new reset link."
      );
      return;
    }

    setVerifying(true);
    setMessage("");

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    setVerifying(false);

    if (error) {
      console.error(
        "Admin password recovery verification failed:",
        error
      );

      setMessage(
        "This password recovery link is invalid or has expired. Please request a new reset link."
      );
      return;
    }

    router.replace("/admin/reset-password");
  }

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

        {message ? (
          <div className="mt-8 rounded-2xl bg-red-50 p-5 text-lg font-semibold text-red-800">
            {message}
          </div>
        ) : null}

        {validRecoveryRequest ? (
          <button
            type="button"
            onClick={continueToReset}
            disabled={verifying}
            className="mt-10 w-full rounded-2xl bg-[#06245c] px-8 py-5 text-xl font-extrabold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying
              ? "Verifying..."
              : "Continue to Reset Password"}
          </button>
        ) : (
          <div className="mt-8 rounded-2xl bg-red-50 p-5 text-lg font-semibold text-red-800">
            This password recovery link is invalid or incomplete. Please request a new reset link.
          </div>
        )}
      </div>
    </main>
  );
}

export default function AdminRecoveryConfirmPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 py-20">
          <div className="text-xl font-bold text-[#06245c]">
            Loading secure password reset...
          </div>
        </main>
      }
    >
      <RecoveryConfirmContent />
    </Suspense>
  );
}
