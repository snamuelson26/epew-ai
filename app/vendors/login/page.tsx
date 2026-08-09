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

export default function VendorLoginPage() {
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
        data: vendorRole,
        error: vendorRoleError,
      } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "vendor")
        .maybeSingle();

      if (vendorRoleError) {
        await supabase.auth.signOut();

        setMessage(
          `${translate(
            "vendor.verifyError",
          )} ${vendorRoleError.message}`,
        );

        return;
      }

      if (!vendorRole) {
        await supabase.auth.signOut();

        setMessage(
          translate(
            "vendor.accessDenied",
          ),
        );

        return;
      }

      router.push("/vendors/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <EnterpriseLoginCard
      title={translate(
        "vendor.title",
      )}
      description={translate(
        "vendor.description",
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
        "vendor.button",
      )}
      loadingLabel={translate(
        "common.signingIn",
      )}
      loading={loading}
      message={message}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
      icon="🏪"
      footer={
        <Link
          href="/"
          className="text-lg font-bold text-[#06245c] transition hover:text-green-600"
        >
          {translate(
            "common.returnToEpew",
          )}
        </Link>
      }
    />
  );
}