"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const alreadyRegisteredMessage =
  "You are already registered as a Coach. Please sign in to your coach account.";

export default function CoachRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [coachId, setCoachId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!fullName.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    const { data: existingCoach, error: existingCoachError } = await supabase
      .from("coaches")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingCoachError) {
      console.log(existingCoachError);
      setLoading(false);
      setMessage("Unable to check coach registration.");
      return;
    }

    if (existingCoach) {
      setLoading(false);
      setMessage(alreadyRegisteredMessage);
      return;
    }

    let user: any = null;

    const signInRes = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (signInRes.data?.user) {
      user = signInRes.data.user;
    } else {
      const signUpRes = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (signUpRes.error || !signUpRes.data?.user) {
        setLoading(false);
        setMessage(
          "Unable to create or access coach account. " +
            (signUpRes.error?.message || "")
        );
        return;
      }

      user = signUpRes.data.user;
    }

    const finalCoachId = coachId || `COACH-${Date.now()}`;

    const { error: insertError } = await supabase.from("coaches").insert({
      user_id: user?.id || null,
      full_name: fullName.trim(),
      coach_id: finalCoachId,
      email: cleanEmail,
      phone: phone.trim(),
      status: "Active",
      coach_type: "Human Coach",
    });

    if (insertError) {
      console.log(insertError);
      setLoading(false);

      if (
        insertError.message.toLowerCase().includes("duplicate") ||
        insertError.message.includes("coaches_email_unique") ||
        insertError.message.includes("coaches_email_key")
      ) {
        setMessage(alreadyRegisteredMessage);
        return;
      }

      setMessage(
        "Coach account was created, but the coach profile was not saved. " +
          insertError.message
      );
      return;
    }

    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: user?.id || null,
      email: cleanEmail,
      role: "coach",
    });

    if (roleError) {
      console.log(roleError);
    }

    setLoading(false);
    router.push("/coaches/login");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full">
        <h1 className="text-5xl font-extrabold text-center mb-8">
          Coach Registration
        </h1>

        <p className="text-xl text-gray-700 text-center mb-8">
          Create an EPEW coach account. Existing coaches should login.
        </p>

        <form onSubmit={handleRegister} className="space-y-6">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full border rounded-2xl p-5 text-xl"
          />

          <input
            type="text"
            placeholder="Coach ID optional"
            value={coachId}
            onChange={(e) => setCoachId(e.target.value)}
            className="w-full border rounded-2xl p-5 text-xl"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-2xl p-5 text-xl"
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-2xl p-5 text-xl"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-2xl p-5 text-xl"
          />

          {message && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 rounded-2xl p-5 text-xl font-bold text-center">
              {message}
            </div>
          )}

          {message === alreadyRegisteredMessage && (
            <div className="text-center">
              <a
                href="/coaches/login"
                className="text-blue-700 underline font-bold text-lg"
              >
                Sign in to your coach account
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#06245c] text-white py-5 rounded-2xl text-2xl font-bold hover:bg-green-600 transition"
          >
            {loading ? "Creating..." : "Create Coach Account"}
          </button>
        </form>

        <div className="text-center mt-10">
          <p className="text-xl text-gray-700 mb-4">
            Already have an account?
          </p>

          <button
            type="button"
            onClick={() => router.push("/coaches/login")}
            className="bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] transition"
          >
            Login
          </button>
        </div>
      </div>
    </main>
  );
}