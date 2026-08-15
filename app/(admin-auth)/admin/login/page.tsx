"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

const NAMESPACE = "login";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [rememberMe, setRememberMe] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const translate = (key: string) =>
    t(key, {
      namespace: NAMESPACE,
    });

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    try {
      const {
        data: signInData,
        error: signInError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: email.trim(),
            password,
          },
        );

      if (
        signInError ||
        !signInData.user
      ) {
        setErrorMessage(
          signInError?.message ??
            translate(
              "admin.unableToSignIn",
            ),
        );

        return;
      }

      const {
        data: adminRole,
        error: roleError,
      } = await supabase
        .from("user_roles")
        .select("role")
        .eq(
          "user_id",
          signInData.user.id,
        )
        .eq("role", "administrator")
        .maybeSingle();

      if (
        roleError ||
        !adminRole
      ) {
        await supabase.auth.signOut();

        setErrorMessage(
          translate(
            "admin.notAuthorized",
          ),
        );

        return;
      }

      if (!rememberMe) {
        window.sessionStorage.setItem(
          "epew_admin_session_only",
          "true",
        );
      } else {
        window.sessionStorage.removeItem(
          "epew_admin_session_only",
        );
      }

      router.replace(
        "/admin/dashboard",
      );
      router.refresh();
    } catch (error) {
      console.error(
        "Administrator login error:",
        error,
      );

      setErrorMessage(
        translate(
          "admin.unexpectedError",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="bg-[#06245c] px-8 py-10 text-center text-white">
            <h1 className="text-4xl font-extrabold tracking-tight">
              EPEW
            </h1>

            <p className="mt-2 text-sm font-semibold text-blue-100">
              {translate(
                "admin.controlCenter",
              )}
            </p>
          </div>

          <div className="px-8 py-9">
            {/* Page Heading */}
            <div className="mb-7 text-center">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {translate(
                  "admin.title",
                )}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {translate(
                  "admin.description",
                )}
              </p>
            </div>

            {/* Error */}
            {errorMessage ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  {translate(
                    "admin.email",
                  )}
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder={translate(
                    "admin.emailPlaceholder",
                  )}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  {translate(
                    "common.password",
                  )}
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder={translate(
                      "common.enterPassword",
                    )}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 px-4 text-sm font-bold text-[#06245c] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword
                      ? translate(
                          "common.hide",
                        )
                      : translate(
                          "common.show",
                        )}
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(
                        event.target
                          .checked,
                      )
                    }
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  {translate(
                    "common.rememberMe",
                  )}
                </label>

                <Link
                  href="/admin/forgot-password"
                  className="text-sm font-bold text-[#06245c] hover:underline"
                >
                  {translate(
                    "common.forgotPasswordLower",
                  )}
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl bg-[#06245c] px-5 py-3.5 font-extrabold text-white transition hover:bg-[#0a3478] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                    {translate(
                      "admin.verifying",
                    )}
                  </>
                ) : (
                  translate(
                    "admin.button",
                  )
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-7 border-t border-slate-200 pt-6 text-center">
              <p className="text-xs leading-5 text-slate-500">
                {translate(
                  "admin.notice",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}