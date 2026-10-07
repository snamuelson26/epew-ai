"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Role = "entrepreneur" | "supporter" | "coach" | "partner";
type Goal = "yes" | "partly" | "no";

const destinations: Record<Role, { login: string; home: string }> = {
  entrepreneur: { login: "/entrepreneurs/login", home: "/entrepreneurs/dashboard" },
  supporter: { login: "/supporters/login", home: "/supporters/dashboard" },
  coach: { login: "/coaches/login", home: "/coaches/dashboard" },
  partner: { login: "/partners/login", home: "/partners" },
};

const scaleLabels = ["Very low", "Low", "Neutral", "High", "Very high"];

export default function AccountCreationSurveyPage() {
  return (
    <Suspense fallback={<main className="p-8">Loading survey...</main>}>
      <AccountCreationSurvey />
    </Suspense>
  );
}

function AccountCreationSurvey() {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = params.get("role");
  const role: Role = roleParam && Object.prototype.hasOwnProperty.call(destinations, roleParam)
    ? roleParam as Role : "entrepreneur";
  const requestedNext = params.get("next");
  // Only these local destinations are allowed; no external or arbitrary redirect.
  const next = requestedNext && (
    requestedNext === destinations[role].home ||
    requestedNext === destinations[role].login ||
    (role === "entrepreneur" && /^\/entrepreneurs\/dashboard\?applicationId=\d+$/.test(requestedNext)) ||
    (role === "entrepreneur" && /^\/organizations\/[a-zA-Z0-9_-]+\/dashboard$/.test(requestedNext)) ||
    (role === "supporter" && /^\/supporters\/login\?ref=[a-zA-Z0-9_-]+$/.test(requestedNext)) ||
    (role === "supporter" && /^\/support\/[a-zA-Z0-9_-]+\/participation-agreement(?:\?ref=[a-zA-Z0-9_-]+)?$/.test(requestedNext))
  ) ? requestedNext : destinations[role].home;
  const surveyPath = `/feedback/account-creation?role=${role}&next=${encodeURIComponent(next)}`;
  const loginHref = role === "supporter"
    ? `${destinations[role].login}?next=${encodeURIComponent(surveyPath)}`
    : `${destinations[role].login}?survey=account_creation`;
  const continueHref = role === "supporter" && next.startsWith("/support/")
    ? `${destinations[role].login}?next=${encodeURIComponent(next)}`
    : destinations[role].login;

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [overall, setOverall] = useState(0);
  const [goal, setGoal] = useState<Goal | "">("");
  const [nextStep, setNextStep] = useState(0);
  const [help, setHelp] = useState(0);
  const [recommendation, setRecommendation] = useState<number | null>(null);
  const [discussion, setDiscussion] = useState(0);
  const [comments, setComments] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !auth.user) {
        setLoading(false);
        return;
      }
      setUserId(auth.user.id);
      const { data, error: readError } = await supabase
        .from("epew_interaction_survey_responses")
        .select("id")
        .eq("user_id", auth.user.id)
        .eq("interaction_type", "account_creation")
        .eq("account_role", role)
        .maybeSingle();
      if (!active) return;
      if (readError) setError("We could not load your survey. You can continue to your account.");
      setFinished(Boolean(data));
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [role]);

  async function save(status: "submitted" | "skipped") {
    if (!userId || saving) return;
    if (status === "submitted" && (!overall || !goal || !nextStep || !help || recommendation === null || !discussion)) {
      setError("Please answer questions 1 through 6, or choose Skip survey.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: writeError } = await supabase.from("epew_interaction_survey_responses").insert({
      user_id: userId,
      interaction_type: "account_creation",
      account_role: role,
      status,
      ...(status === "submitted" ? {
        overall_satisfaction: overall,
        goal_reached: goal,
        next_step_clarity: nextStep,
        help_satisfaction: help,
        recommendation_score: recommendation,
        discussion_clarity: discussion,
        comments: comments.trim() || null,
      } : {}),
    });
    setSaving(false);
    if (writeError && writeError.code !== "23505") {
      setError("Your response could not be saved. Please try again or continue to your account.");
      return;
    }
    setFinished(true);
    router.replace(next);
  }

  function scale(question: string, value: number, onChange: (value: number) => void) {
    return <fieldset className="space-y-3 rounded-2xl border p-5">
      <legend className="px-1 font-semibold">{question}</legend>
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4, 5].map((number) => <label key={number} className="cursor-pointer rounded-lg border px-3 py-2">
          <input type="radio" className="mr-2" name={question} checked={value === number} onChange={() => onChange(number)} />
          {number}
        </label>)}
      </div>
      <p className="text-sm text-slate-600">1 = {scaleLabels[0]}; 5 = {scaleLabels[4]}</p>
    </fieldset>;
  }

  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-10 text-[#06245c]">
    <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl sm:p-10">
      <h1 className="text-3xl font-extrabold">Tell us about your registration</h1>
      <p className="mt-3 text-slate-700">This seven-question survey is optional. Your account is ready whether you answer or skip it.</p>
      {loading ? <p className="mt-8">Loading...</p> : !userId ? <div className="mt-8 space-y-4">
        <p>Confirm your email if requested, then sign in to answer the survey. You can continue without it.</p>
        <Link className="inline-block rounded-xl bg-green-700 px-5 py-3 font-bold text-white" href={loginHref}>Sign in and return to survey</Link>
        <Link className="ml-4 inline-block font-semibold underline" href={continueHref}>Continue without survey</Link>
      </div> : finished ? <div className="mt-8 space-y-4">
        <p>Thank you. Your registration survey has already been recorded.</p>
        <Link href={next} className="font-bold text-green-700 underline">Continue to your account</Link>
      </div> : <form className="mt-8 space-y-6" onSubmit={(event) => { event.preventDefault(); void save("submitted"); }}>
        {scale("1. How satisfied were you with creating your account?", overall, setOverall)}
        <fieldset className="space-y-3 rounded-2xl border p-5">
          <legend className="px-1 font-semibold">2. Were you able to create your account and do what you came here to do?</legend>
          <div className="flex gap-4">{(["yes", "partly", "no"] as Goal[]).map((answer) => <label key={answer} className="capitalize"><input className="mr-2" type="radio" name="goal" checked={goal === answer} onChange={() => setGoal(answer)} />{answer}</label>)}</div>
        </fieldset>
        {scale("3. How clearly do you understand your next step?", nextStep, setNextStep)}
        {scale("4. How satisfied were you with the help and communication you received?", help, setHelp)}
        <fieldset className="space-y-3 rounded-2xl border p-5">
          <legend className="px-1 font-semibold">5. How likely are you to recommend EPEW to someone else?</legend>
          <select className="rounded-lg border p-3" value={recommendation ?? ""} onChange={(event) => setRecommendation(Number(event.target.value))}>
            <option value="">Select 0–10</option>{Array.from({ length: 11 }, (_, score) => <option key={score} value={score}>{score}</option>)}
          </select>
          <p className="text-sm text-slate-600">0 = not at all likely; 10 = extremely likely</p>
        </fieldset>
        {scale("6. How clearly do you understand what we discussed today?", discussion, setDiscussion)}
        <label className="block space-y-3 rounded-2xl border p-5">
          <span className="block font-semibold">7. In your own words, what satisfied or dissatisfied you? What would you recommend we improve? (Optional)</span>
          <textarea className="w-full rounded-lg border p-3" rows={4} maxLength={2000} value={comments} onChange={(event) => setComments(event.target.value)} />
        </label>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-4">
          <button disabled={saving} className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Submit survey"}</button>
          <button disabled={saving} type="button" onClick={() => void save("skipped")} className="rounded-xl border px-5 py-3 font-bold disabled:opacity-50">Skip survey</button>
          <Link href={next} className="self-center font-semibold underline">Continue to your account</Link>
        </div>
      </form>}
      {error && (loading || !userId || finished) && <p role="alert" className="mt-4 text-red-700">{error}</p>}
    </div>
  </main>;
}
