"use client";

import { FormEvent, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const LANGUAGES = [
  "English",
  "French",
  "Haitian Creole",
  "Spanish",
];

export default function CommunicationPreferencesPage() {
  const [communicationLanguage, setCommunicationLanguage] = useState("");
  const [additionalPreferredLanguage, setAdditionalPreferredLanguage] =
    useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [priorityChannel, setPriorityChannel] = useState("");
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/entrepreneurs/reminder-contact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            communication_language: communicationLanguage,
            additional_preferred_language:
              additionalPreferredLanguage,
            email,
            phone,
            priority_channel: priorityChannel,
            weekly_information_consent: consent,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Unable to save your communication preferences.",
        );
      }

      setSuccessMessage(
        result.message ||
          "Your EPEW communication preferences have been successfully submitted.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your communication preferences.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] px-6 py-12 text-[#06245c]">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-8 shadow-xl md:p-12">
            {!successMessage ? (
              <>
                <div className="text-center">
                  <p className="text-lg font-black uppercase tracking-widest text-green-600">
                    EPEW Entrepreneur Communication Center
                  </p>

                  <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
                    Communication Preferences
                  </h1>

                  <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-gray-700">
                    Thank you for submitting your EPEW Entrepreneur Application.
                    While your application is under review, please complete this
                    short form so EPEW can communicate with you in your preferred
                    language and send you important application updates,
                    reminders, and entrepreneurship information.
                  </p>

                  <p className="mx-auto mt-4 max-w-3xl text-lg font-semibold text-green-700">
                    You do not need to submit another entrepreneur application.
                  </p>
                </div>

                {errorMessage && (
                  <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-lg font-semibold text-red-700">
                    {errorMessage}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="mt-10 space-y-8"
                >
                  <div>
                    <label
                      htmlFor="communicationLanguage"
                      className="block text-xl font-bold"
                    >
                      Preferred EPEW Communication Language *
                    </label>

                    <select
                      id="communicationLanguage"
                      value={communicationLanguage}
                      onChange={(event) =>
                        setCommunicationLanguage(event.target.value)
                      }
                      required
                      className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg text-gray-900"
                    >
                      <option value="">Select a language</option>

                      {LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="additionalPreferredLanguage"
                      className="block text-xl font-bold"
                    >
                      Additional Preferred Language
                    </label>

                    <select
                      id="additionalPreferredLanguage"
                      value={additionalPreferredLanguage}
                      onChange={(event) =>
                        setAdditionalPreferredLanguage(
                          event.target.value,
                        )
                      }
                      className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg text-gray-900"
                    >
                      <option value="">None</option>

                      {LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xl font-bold"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="yourname@example.com"
                      className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg text-gray-900"
                    />

                    <p className="mt-2 text-sm text-gray-600">
                      If you already submitted an EPEW Entrepreneur Application,
                      please use the same email address.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xl font-bold"
                    >
                      Phone Number
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                      placeholder="Your phone number"
                      className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg text-gray-900"
                    />
                  </div>

                  <fieldset>
                    <legend className="text-xl font-bold">
                      Preferred Contact Method *
                    </legend>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-300 p-5">
                        <input
                          type="radio"
                          name="priorityChannel"
                          value="email"
                          checked={priorityChannel === "email"}
                          onChange={(event) =>
                            setPriorityChannel(event.target.value)
                          }
                          required
                          className="h-5 w-5"
                        />

                        <span className="text-lg font-semibold">
                          Email
                        </span>
                      </label>

                      <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-300 p-5">
                        <input
                          type="radio"
                          name="priorityChannel"
                          value="text"
                          checked={priorityChannel === "text"}
                          onChange={(event) =>
                            setPriorityChannel(event.target.value)
                          }
                          required
                          className="h-5 w-5"
                        />

                        <span className="text-lg font-semibold">
                          Text Message
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  <label className="flex items-start gap-4 rounded-2xl bg-blue-50 p-6">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) =>
                        setConsent(event.target.checked)
                      }
                      required
                      className="mt-1 h-5 w-5"
                    />

                    <span className="text-base leading-relaxed text-gray-700">
                      I agree to receive EPEW application reminders,
                      weekly entrepreneurship information, program updates,
                      and related communications using the contact information
                      and preferred method I selected.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-green-600 px-8 py-5 text-xl font-black text-white transition hover:bg-[#06245c] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? "Saving..."
                      : "Submit Communication Preferences"}
                  </button>
                </form>
              </>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
                  ✓
                </div>

                <p className="mt-8 text-lg font-black uppercase tracking-widest text-green-600">
                  Successfully Submitted
                </p>

                <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
                  Communication Preferences Successfully Submitted
                </h1>

                <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-gray-700">
                  Thank you. Your EPEW communication preferences have been
                  saved successfully.
                </p>

                <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-green-200 bg-green-50 p-8">
                  <h2 className="text-2xl font-extrabold text-[#06245c]">
                    Your Next Step
                  </h2>

                  <p className="mt-4 text-lg leading-relaxed text-gray-700">
                    Please complete your Entrepreneur Questionnaire so EPEW
                    can learn more about you, your business, your goals,
                    your experience, and the support you may need.
                  </p>

                  <p className="mt-4 text-lg font-semibold text-[#06245c]">
                    This information will help EPEW prepare for your first
                    entrepreneur meeting.
                  </p>

                  <a
                    href="/entrepreneurs/questionnaire"
                    className="mt-8 inline-block rounded-2xl bg-green-600 px-8 py-5 text-xl font-black text-white transition hover:bg-[#06245c]"
                  >
                    Complete Entrepreneur Questionnaire
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
