"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const translate = (key: string) =>
    t(key, {
      namespace: NAMESPACE,
    });

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const cleanEmail =
        email.trim().toLowerCase();

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) {
        setMessage(error.message);
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

      router.push(
        "/supporters/dashboard",
      );
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
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
      footer={
        <div className="space-y-4">
          <Link
            href="/supporters/forgot-password"
            className="block text-lg font-bold text-[#06245c] transition hover:underline"
          >
            Forgot Password?
          </Link>

          <Link
            href="/supporters/register"
            className="block text-lg font-bold text-green-700 transition hover:underline"
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