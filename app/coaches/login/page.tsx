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

export default function CoachLoginPage() {
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
        data: coachData,
        error: coachError,
      } = await supabase
        .from("coaches")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (coachError) {
        setMessage(
          `${translate(
            "coach.verifyError",
          )} ${coachError.message}`,
        );
        return;
      }

      if (!coachData) {
        await supabase.auth.signOut();

        setMessage(
          translate(
            "coach.accessDenied",
          ),
        );

        return;
      }

      router.push(
        "/coaches/dashboard",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <EnterpriseLoginCard
      title={translate(
        "coach.title",
      )}
      description={translate(
        "coach.description",
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
        "coach.button",
      )}
      loadingLabel={translate(
        "common.loggingIn",
      )}
      loading={loading}
      message={message}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
      footer={
        <div className="space-y-4">
          <Link
            href="/coaches/forgot-password"
            className="block text-lg font-bold text-[#06245c] transition hover:underline"
          >
            Forgot Password?
          </Link>

          <p className="text-lg text-gray-600">
            {translate(
              "coach.notice",
            )}
          </p>
        </div>
      }
    />
  );
}