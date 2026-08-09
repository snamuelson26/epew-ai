"use client";

import type {
  FormEvent,
  ReactNode,
} from "react";

interface EnterpriseLoginCardProps {
  title: string;
  description?: string;

  email: string;
  password: string;

  emailLabel: string;
  passwordLabel: string;

  emailPlaceholder?: string;
  passwordPlaceholder?: string;

  submitLabel: string;
  loadingLabel: string;

  loading?: boolean;
  message?: string;

  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;

  icon?: ReactNode;
  footer?: ReactNode;
}

export default function EnterpriseLoginCard({
  title,
  description,

  email,
  password,

  emailLabel,
  passwordLabel,

  emailPlaceholder,
  passwordPlaceholder,

  submitLabel,
  loadingLabel,

  loading = false,
  message,

  onEmailChange,
  onPasswordChange,
  onSubmit,

  icon,
  footer,
}: EnterpriseLoginCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 py-20">
      <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-2xl">
        <div className="mb-10 text-center">
          {icon ? (
            <div className="mb-5 text-6xl">
              {icon}
            </div>
          ) : null}

          <h1 className="mb-5 text-4xl font-extrabold text-[#06245c] md:text-5xl">
            {title}
          </h1>

          {description ? (
            <p className="text-lg leading-relaxed text-gray-700 md:text-xl">
              {description}
            </p>
          ) : null}
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-lg font-bold text-[#06245c]"
            >
              {emailLabel}
            </label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) =>
                onEmailChange(
                  event.target.value,
                )
              }
              placeholder={emailPlaceholder}
              required
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-2xl border-2 border-gray-300 p-4 text-lg outline-none transition focus:border-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 md:text-xl"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-lg font-bold text-[#06245c]"
            >
              {passwordLabel}
            </label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) =>
                onPasswordChange(
                  event.target.value,
                )
              }
              placeholder={
                passwordPlaceholder
              }
              required
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded-2xl border-2 border-gray-300 p-4 text-lg outline-none transition focus:border-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 md:text-xl"
            />
          </div>

          {message ? (
            <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-center text-lg font-bold text-red-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#06245c] py-4 text-xl font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60 md:py-5 md:text-2xl"
          >
            {loading
              ? loadingLabel
              : submitLabel}
          </button>
        </form>

        {footer ? (
          <div className="mt-8 text-center">
            {footer}
          </div>
        ) : null}
      </div>
    </main>
  );
}