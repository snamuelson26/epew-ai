"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

import EnterpriseLoginCard from "@/app/components/enterprise/auth/EnterpriseLoginCard";

const NAMESPACE = "login";

export default function LoginPage() {
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

  function redirectByRole(role: string) {
    if (role === "entrepreneur") {
      router.push("/entrepreneurs/dashboard");
      return;
    }

    if (role === "supporter") {
      router.push("/supporters/dashboard");
      return;
    }

    if (role === "coach") {
      router.push("/coaches/dashboard");
      return;
    }

    if (role === "admin") {
      router.push("/admin/dashboard");
      return;
    }

    if (role === "vendor") {
      router.push("/vendors/dashboard");
      return;
    }

    setMessage(
      translate("general.noValidPortal"),
    );
  }

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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(
          translate("common.loginFailed"),
        );
        return;
      }

      const {
        data: roles,
        error: roleError,
      } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (roleError) {
        setMessage(roleError.message);
        return;
      }

      if (!roles || roles.length === 0) {
        setMessage(
          translate("general.noPortalRole"),
        );
        return;
      }

      if (roles.length === 1) {
        redirectByRole(roles[0].role);
        return;
      }

      router.push("/select-portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <EnterpriseLoginCard
      title={translate("general.title")}
      description={translate(
        "general.description",
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
    />
  );
}