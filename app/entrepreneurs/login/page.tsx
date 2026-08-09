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

export default function EntrepreneurLoginPage() {
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

    setMessage("");
    setLoading(true);

    try {
      const cleanEmail =
        email.trim().toLowerCase();

      const { error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.push(
        "/entrepreneurs/dashboard",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <EnterpriseLoginCard
      title={translate(
        "entrepreneur.title",
      )}
      description={translate(
        "entrepreneur.description",
      )}
      email={email}
      password={password}
      emailLabel={translate(
        "common.email",
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
        <Link
          href="/entrepreneurs/forgot-password"
          className="text-xl font-bold text-blue-700 transition hover:text-green-600"
        >
          {translate(
            "entrepreneur.forgotPassword",
          )}
        </Link>
      }
    />
  );
}