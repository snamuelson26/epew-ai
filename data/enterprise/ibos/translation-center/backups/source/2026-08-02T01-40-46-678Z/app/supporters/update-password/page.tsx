"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupporterUpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  async function updatePassword() {
    if (!password || !confirmPassword) {
      alert("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setUpdating(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setUpdating(false);

    if (error) {
      alert("Unable to update password.\n\n" + error.message);
      return;
    }

    alert("Password updated successfully.");
    window.location.href = "/supporters/login";
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-lg">
        <h1 className="text-4xl font-extrabold mb-4">
          Update Password
        </h1>

        <p className="text-lg text-gray-700 mb-8">
          Enter your new password below.
        </p>

        <div className="space-y-5">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-2xl p-4 text-lg w-full"
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border rounded-2xl p-4 text-lg w-full"
          />

          <button
            type="button"
            onClick={updatePassword}
            disabled={updating}
            className="w-full bg-green-700 text-white py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] transition"
          >
            {updating ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </main>
  );
}