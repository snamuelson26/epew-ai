"use client";

import {
  Suspense,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PartnerRegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
          <p className="text-3xl font-bold text-[#06245c]">
            Verifying invitation...
          </p>
        </main>
      }
    >
      <PartnerRegisterContent />
    </Suspense>
  );
}

function PartnerRegisterContent() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [invite, setInvite] = useState<any>(null);

  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "error" | "success"
  >("error");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadInvite();
  }, [inviteCode]);

  function generatePartnerId() {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(
      100000 + Math.random() * 900000,
    );

    return `PAR-${year}-${randomNumber}`;
  }

  async function loadInvite() {
    setLoadingInvite(true);
    setMessage("");
    setMessageType("error");

    if (!inviteCode) {
      setLoadingInvite(false);
      setMessage(
        "Invalid invitation. Please contact EPEW.",
      );
      return;
    }

    const { data, error } = await supabase
      .from("partner_invites")
      .select("*")
      .eq("invite_code", inviteCode)
      .maybeSingle();

    setLoadingInvite(false);

    if (error) {
      console.error(error);
      setMessage(
        "Unable to verify invitation. Please contact EPEW.",
      );
      return;
    }

    if (!data) {
      setMessage(
        "Invalid invitation. Please contact EPEW.",
      );
      return;
    }

    if (data.status === "Accepted") {
      setMessage(
        "This invitation has already been accepted.",
      );
      return;
    }

    setInvite(data);
    setBusinessName(data.business_name || "");
    setContactName(data.contact_name || "");
    setEmail(data.email || "");
  }

  async function registerPartner(e: FormEvent) {
    e.preventDefault();

    setMessage("");
    setMessageType("error");

    const cleanEmail = email.trim().toLowerCase();

    if (!businessName.trim()) {
      setMessage("Please enter the business name.");
      return;
    }

    if (!contactName.trim()) {
      setMessage("Please enter the contact name.");
      return;
    }

    if (!cleanEmail) {
      setMessage("Please enter the email address.");
      return;
    }

    if (!phone.trim()) {
      setMessage("Please enter the phone number.");
      return;
    }

    if (!password) {
      setMessage("Please create a password.");
      return;
    }

    if (!confirmPassword) {
      setMessage("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters.",
      );
      return;
    }

    if (!invite || !inviteCode) {
      setMessage(
        "Invalid invitation. Please contact EPEW.",
      );
      return;
    }

    setSubmitting(true);

    const { data: existingPartner, error: existingError } =
      await supabase
        .from("partners")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

    if (existingError) {
      console.error(existingError);
      setSubmitting(false);
      setMessage(
        "Unable to verify the partner account.",
      );
      return;
    }

    if (existingPartner) {
      setSubmitting(false);
      setMessage(
        "You already have a partner account. Please sign in.",
      );
      return;
    }

    let userId = "";

    const { data: existingAuth } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (existingAuth?.user) {
      userId = existingAuth.user.id;
    } else {
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

      if (authError || !authData.user) {
        setSubmitting(false);
        setMessage(
          "Unable to create or access partner login. " +
            (authError?.message || ""),
        );
        return;
      }

      userId = authData.user.id;
    }

    const partnerId = generatePartnerId();

    const { error: partnerError } = await supabase
      .from("partners")
      .insert({
        user_id: userId,
        partner_id: partnerId,
        business_name: businessName.trim(),
        contact_name: contactName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        status: "Active",
      });

    if (partnerError) {
      setSubmitting(false);

      if (
        partnerError.message
          .toLowerCase()
          .includes("duplicate") ||
        partnerError.message.includes(
          "partners_email_key",
        )
      ) {
        setMessage(
          "You already have a partner account. Please sign in.",
        );
        return;
      }

      setMessage(
        "Unable to create partner account. " +
          partnerError.message,
      );
      return;
    }

    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        email: cleanEmail,
        role: "partner",
      });

    if (roleError) {
      console.error(roleError);
    }

    const { error: inviteUpdateError } =
      await supabase
        .from("partner_invites")
        .update({
          status: "Accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("invite_code", inviteCode);

    if (inviteUpdateError) {
      console.error(inviteUpdateError);
    }

    setSubmitting(false);
    setMessageType("success");
    setMessage(
      "Congratulations! Your Partner Account has been created successfully. You can now access your Partner Dashboard.",
    );
  }

  if (loadingInvite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <p className="text-3xl font-bold text-[#06245c]">
          Verifying invitation...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-2xl">
        <h1 className="mb-5 text-center text-5xl font-extrabold">
          Partner Registration
        </h1>

        <p className="mb-10 text-center text-xl text-gray-700">
          Create your official EPEW Partner account using
          your private invitation.
        </p>

        {message && (
          <div
            className={`mb-8 rounded-2xl border-2 p-5 text-center text-xl font-bold ${
              messageType === "success"
                ? "border-green-500 bg-green-100 text-green-800"
                : "border-red-500 bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {messageType === "success" && (
          <div className="mb-8 text-center">
            <a
              href="/partners/login"
              className="text-xl font-bold text-blue-700 underline"
            >
              Sign in to your Partner Dashboard
            </a>
          </div>
        )}

        {invite && messageType !== "success" && (
          <form
            onSubmit={registerPartner}
            className="space-y-6"
          >
            <input
              type="text"
              placeholder="Business Name"
              value={businessName}
              onChange={(e) =>
                setBusinessName(e.target.value)
              }
              className="w-full rounded-2xl border p-5 text-xl"
            />

            <input
              type="text"
              placeholder="Contact Name"
              value={contactName}
              onChange={(e) =>
                setContactName(e.target.value)
              }
              className="w-full rounded-2xl border p-5 text-xl"
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              readOnly
              className="w-full rounded-2xl border bg-gray-100 p-5 text-xl"
            />

            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              className="w-full rounded-2xl border p-5 text-xl"
            />

            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full rounded-2xl border p-5 text-xl"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className="w-full rounded-2xl border p-5 text-xl"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#06245c] py-5 text-2xl font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Creating Partner Account..."
                : "Create Partner Account"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}