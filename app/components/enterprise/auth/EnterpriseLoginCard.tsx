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
    <main className="flex min-h-[100svh] w-full items-center justify-center bg-[#f5f7fb] px-4 py-5 sm:px-6 sm:py-10 md:py-16">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-8 md:p-10 md:shadow-2xl">
        <div className="mb-5 text-center sm:mb-8 md:mb-10">
          {icon ? (
            <div className="mb-3 text-4xl sm:mb-5 sm:text-5xl md:text-6xl">
              {icon}
            </div>
          ) : null}

          <h1 className="mb-3 text-3xl font-extrabold leading-tight text-[#06245c] sm:mb-4 sm:text-4xl md:mb-5 md:text-5xl">
            {title}
          </h1>

          {description ? (
            <p className="text-base leading-relaxed text-gray-700 sm:text-lg md:text-xl">
              {description}
            </p>
          ) : null}
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 sm:space-y-5 md:space-y-6"
        >
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-base font-bold text-[#06245c] sm:mb-2 sm:text-lg"
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
              className="w-full rounded-xl border-2 border-gray-300 p-3.5 text-base outline-none transition focus:border-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 sm:rounded-2xl sm:p-4 sm:text-lg md:text-xl"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-base font-bold text-[#06245c] sm:mb-2 sm:text-lg"
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
              className="w-full rounded-xl border-2 border-gray-300 p-3.5 text-base outline-none transition focus:border-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 sm:rounded-2xl sm:p-4 sm:text-lg md:text-xl"
            />
          </div>

          {message ? (
            <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-center text-base font-bold text-red-700 sm:rounded-2xl sm:p-4 sm:text-lg">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#06245c] py-3.5 text-lg font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:py-4 sm:text-xl md:py-5 md:text-2xl"
          >
            {loading
              ? loadingLabel
              : submitLabel}
          </button>
        </form>

        {footer ? (
          <div className="mt-5 text-center sm:mt-7 md:mt-8">
            {footer}
          </div>
        ) : null}
      </div>
    </main>
  );
}
