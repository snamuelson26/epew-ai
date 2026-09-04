"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

import EnterpriseLoginCard from "@/app/components/enterprise/auth/EnterpriseLoginCard";

const NAMESPACE = "login";

export default function SupporterLoginPage() {
  const router = useRouter();

  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [businessId, setBusinessId] = useState("");
  const [nextPath, setNextPath] = useState("");
  const [referrerCode, setReferrerCode] = useState("");

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);

    const search = new URLSearchParams(window.location.search);
    const incomingBusinessId = (search.get("business_id") || "").trim();
    const incomingNext = (search.get("next") || "").trim();
    const incomingRef = (search.get("ref") || "").trim();

    let resolvedBusinessId = incomingBusinessId;

    if (!resolvedBusinessId && incomingNext) {
      const match = incomingNext.match(/^\/support\/([^/]+)(?:\/|$)/);
      if (match?.[1]) {
        resolvedBusinessId = decodeURIComponent(match[1]);
      }
    }

    setBusinessId(resolvedBusinessId);
    setNextPath(incomingNext);
    setReferrerCode(incomingRef);
  }, [loadNamespaces]);

  const translate = (key: string) =>
    t(key, {
      namespace: NAMESPACE,
    });

  const registerHref = useMemo(() => {
    const params = new URLSearchParams();

    if (businessId) params.set("business_id", businessId);
    if (nextPath) params.set("next", nextPath);
    if (referrerCode) params.set("ref", referrerCode);

    const query = params.toString();
    return query ? `/supporters/register?${query}` : "/supporters/register";
  }, [businessId, nextPath, referrerCode]);

  async function resendConfirmation() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Please enter your email address first.");
      return;
    }

    setResending(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/supporters/login`,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        "A new confirmation email has been sent. Please open it, confirm your email address, then return here to sign in.",
      );
    } finally {
      setResending(false);
    }
  }

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setEmailNotConfirmed(false);

    try {
      const cleanEmail =
        email.trim().toLowerCase();

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) {
        const isEmailNotConfirmed =
          error.code === "email_not_confirmed" ||
          error.message.toLowerCase().includes("email not confirmed");

        if (isEmailNotConfirmed) {
          setEmailNotConfirmed(true);
          setMessage(
            "Your email address has not been confirmed yet. Please check your email for the EPEW confirmation link, or use the button below to resend it.",
          );
        } else {
          setMessage(error.message);
        }

        return;
      }

      const user = data.user;

      const {
        data: supporter,
        error: supporterError,
      } = await supabase
        .from("supporters")
        .select("*")
        .or(
          `user_id.eq.${user.id},email.eq.${cleanEmail}`,
        )
        .maybeSingle();

      if (supporterError) {
        setMessage(
          supporterError.message,
        );
        return;
      }

      if (!supporter) {
        await supabase.auth.signOut();

        setMessage(
          translate(
            "supporter.noAccount",
          ),
        );

        return;
      }

      if (businessId && supporter.selected_business_id !== businessId) {
        const { error: businessUpdateError } = await supabase
          .from("supporters")
          .update({ selected_business_id: businessId })
          .eq("id", supporter.id);

        if (businessUpdateError) {
          console.error(
            "Unable to preserve selected business on supporter login:",
            businessUpdateError,
          );
        }
      }

      if (nextPath.startsWith("/") && !nextPath.startsWith("//")) {
        router.push(nextPath);
      } else {
        router.push(
          "/supporters/dashboard",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <EnterpriseLoginCard
      title={translate(
        "supporter.title",
      )}
      description={translate(
        "supporter.description",
      )}
      email={email}
      password={password}
      emailLabel={translate(
        "common.emailShort",
      )}
      passwordLabel={translate(
        "common.password",
      )}
      emailPlaceholder={translate(
        "common.enterEmail",
      )}
      passwordPlaceholder={translate(
        "common.enterPassword",
      )}
      submitLabel={translate(
        "common.signIn",
      )}
      loadingLabel={translate(
        "common.signingIn",
      )}
      loading={loading}
      message={message}
      onEmailChange={(value) => {
        setEmail(value);
        setEmailNotConfirmed(false);
      }}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
      footer={
        <div className="space-y-4">
          {emailNotConfirmed ? (
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={resending}
              className="w-full rounded-xl bg-green-700 px-4 py-3 text-base font-bold text-white transition hover:bg-[#06245c] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
            >
              {resending ? "Sending Confirmation Email..." : "Resend Confirmation Email"}
            </button>
          ) : null}

          <Link
            href="/supporters/forgot-password"
            className="block text-base font-bold text-[#06245c] transition hover:underline sm:text-lg"
          >
            Forgot Password?
          </Link>

          <Link
            href={registerHref}
            className="block text-base font-bold text-green-700 transition hover:underline sm:text-lg"
          >
            {translate(
              "supporter.createAccount",
            )}
          </Link>
        </div>
      }
    />
  );
}
