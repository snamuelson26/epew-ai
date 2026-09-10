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

type BusinessAccount = {
  id: number;
  business_name: string | null;
  code: string;
};

function embeddedBusinessCode(name: string | null) {
  const match = String(name || "").match(/\b[A-Z]{2,6}-\d{2,6}\b/i);
  return match ? match[0].toUpperCase() : null;
}

function cleanBusinessName(name: string | null, code: string) {
  return String(name || "Business")
    .replace(new RegExp(`\\s*[—–-]?\\s*${code.replace("-", "\\-")}\\s*$`, "i"), "")
    .trim();
}

export default function EntrepreneurLoginPage() {
  const router = useRouter();

  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<BusinessAccount[]>([]);

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const translate = (key: string) =>
    t(key, {
      namespace: NAMESPACE,
    });

  async function loadBusinessAccounts(userId: string) {
    const { data: applications, error: applicationError } = await supabase
      .from("entrepreneur_applications")
      .select("id,business_name,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (applicationError) throw applicationError;

    const rows = applications || [];
    if (!rows.length) return [];

    const applicationIds = rows.map((row) => row.id);
    const { data: businesses } = await supabase
      .from("entrepreneurs")
      .select("source_application_id,public_business_id,business_code,entrepreneur_code")
      .in("source_application_id", applicationIds);

    const codeByApplication = new Map<number, string>();
    for (const business of businesses || []) {
      const sourceId = Number(business.source_application_id);
      const code = String(
        business.public_business_id ||
          business.business_code ||
          business.entrepreneur_code ||
          "",
      ).trim();
      if (sourceId && code) codeByApplication.set(sourceId, code);
    }

    return rows.map((row) => {
      const embedded = embeddedBusinessCode(row.business_name);
      const code =
        embedded ||
        codeByApplication.get(Number(row.id)) ||
        `Application ${row.id}`;

      return {
        id: Number(row.id),
        business_name: cleanBusinessName(row.business_name, code),
        code,
      };
    });
  }

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const user = data.user;
      if (!user) {
        setMessage("Unable to load your entrepreneur account.");
        return;
      }

      const businessAccounts = await loadBusinessAccounts(user.id);

      if (!businessAccounts.length) {
        setMessage("We could not find an entrepreneur business account for this login.");
        return;
      }

      if (businessAccounts.length === 1) {
        router.push(
          `/entrepreneurs/dashboard?applicationId=${encodeURIComponent(String(businessAccounts[0].id))}`,
        );
        return;
      }

      setAccounts(businessAccounts);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to open your entrepreneur account.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openAccount(account: BusinessAccount) {
    router.push(
      `/entrepreneurs/dashboard?applicationId=${encodeURIComponent(String(account.id))}`,
    );
  }

  if (accounts.length > 1) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl md:p-10">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-[#10246f] md:text-4xl">
              Choose Your Business Account
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              You have more than one EPEW business account. Choose the account you want to open.
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => openAccount(account)}
                className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-6 py-5 text-left shadow-sm transition hover:border-green-500 hover:bg-green-50"
              >
                <div>
                  <p className="text-2xl font-extrabold text-[#10246f]">
                    {account.code}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {account.business_name}
                  </p>
                </div>
                <span className="rounded-xl bg-[#10246f] px-5 py-3 font-extrabold text-white">
                  Open
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              setAccounts([]);
              setPassword("");
            }}
            className="mt-8 w-full rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
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
