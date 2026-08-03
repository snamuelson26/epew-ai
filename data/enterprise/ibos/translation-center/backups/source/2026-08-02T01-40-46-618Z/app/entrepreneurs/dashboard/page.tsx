"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Entrepreneur = {
  id: string | number;
  user_id?: string | null;
  entrepreneur_code?: string | null;
  business_code?: string | null;
  full_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  coach_name?: string | null;
  assigned_coach_name?: string | null;
  current_stage?: string | null;
  ibos_status?: string | null;
  funding_goal?: number | null;

  status?: string | null;
  application_decision?: string | null;
  qualification_status?: string | null;
  interview_status?: string | null;

  campaign_slug?: string | null;
  campaign_status?: string | null;
  campaign_visitors?: number | null;
  campaign_shares?: number | null;
  community_units_supported?: number | null;
  community_units_required?: number | null;
  units_supported?: number | null;
  units_required?: number | null;
  leadership_credit?: number | null;
  referred_supporters?: number | null;
  referred_units_for_others?: number | null;
  vision_score?: number | null;
  community_leader_status?: string | null;
};

export default function EntrepreneurDashboardPage() {
  const [entrepreneur, setEntrepreneur] =
    useState<Entrepreneur | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadEntrepreneur();
  }, []);

  async function loadEntrepreneur() {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setMessage(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setMessage(
          "Please log in to access your entrepreneur dashboard.",
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("entrepreneur_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("Entrepreneur application record:", data);
      console.log("Supabase error:", error);

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setMessage(
          "We could not find your entrepreneur application. Please contact welcome@epew.us for assistance.",
        );
        setLoading(false);
        return;
      }

      setEntrepreneur(data as Entrepreneur);
      setLoading(false);
    } catch (error) {
      console.error("Unable to load entrepreneur dashboard:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your entrepreneur dashboard.",
      );

      setLoading(false);
    }
  }

  const campaignSlug =
    entrepreneur?.campaign_slug ||
    entrepreneur?.entrepreneur_code ||
    entrepreneur?.id ||
    "";

  const campaignUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/campaign/${campaignSlug}`
      : `/campaign/${campaignSlug}`;

  const unitsSupported = Number(
    entrepreneur?.community_units_supported ??
      entrepreneur?.units_supported ??
      0,
  );

  const unitsRequired = Number(
    entrepreneur?.community_units_required ??
      entrepreneur?.units_required ??
      20,
  );

  const progress =
    unitsRequired > 0
      ? Math.min(
          100,
          Math.round((unitsSupported / unitsRequired) * 100),
        )
      : 0;

  const hasReachedGoal = unitsSupported >= unitsRequired;

  const visionScore = useMemo(() => {
    if (!entrepreneur) {
      return 0;
    }

    const shares = Number(entrepreneur.campaign_shares || 0);
    const visitors = Number(entrepreneur.campaign_visitors || 0);
    const units = Number(
      entrepreneur.community_units_supported ??
        entrepreneur.units_supported ??
        0,
    );
    const credit = Number(entrepreneur.leadership_credit || 0);

    const calculatedScore =
      shares * 5 + visitors + units * 10 + credit * 2;

    return Math.min(
      100,
      Math.max(
        calculatedScore,
        Number(entrepreneur.vision_score || 0),
      ),
    );
  }, [entrepreneur]);

  async function copyCampaignLink() {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setMessage("Campaign link copied successfully.");
    } catch {
      setMessage(
        "Unable to copy the link. Please copy it manually.",
      );
    }
  }

  async function recordShare() {
    if (!entrepreneur) {
      return;
    }

    const newShares =
      Number(entrepreneur.campaign_shares || 0) + 1;

    const newVisionScore = Math.min(100, visionScore + 5);

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        campaign_shares: newShares,
        vision_score: newVisionScore,
      })
      .eq("id", entrepreneur.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setEntrepreneur({
      ...entrepreneur,
      campaign_shares: newShares,
      vision_score: newVisionScore,
    });

    setMessage(
      "Campaign share recorded. Keep building your community.",
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <p className="text-slate-600">
          Loading entrepreneur dashboard...
        </p>
      </main>
    );
  }

  if (!entrepreneur) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-slate-900">
            Entrepreneur Dashboard
          </h1>

          <p className="mt-3 text-slate-600">
            {message}
          </p>

          <Link
            href="/entrepreneurs/login"
            className="mt-6 inline-flex rounded-xl bg-[#10246f] px-6 py-3 font-bold text-white transition hover:bg-green-700"
          >
            Login to Your Entrepreneur Portal
          </Link>
        </div>
      </main>
    );
  }

  const applicationStatus =
    entrepreneur.status ?? "Pending Review";

  const isPreQualification =
    applicationStatus === "Pending Review" ||
    applicationStatus === "Application Received" ||
    applicationStatus === "Application Under Review" ||
    applicationStatus === "Coach Assigned" ||
    applicationStatus === "Personal Coach Assigned" ||
    applicationStatus === "Interview Scheduled" ||
    applicationStatus === "Business Idea Development" ||
    applicationStatus === "Qualification Review";

  /*
   * PRE-QUALIFICATION DASHBOARD
   *
   * This experience is shown to new applicants before their
   * interview, qualification, campaign activation, and funding
   * approval.
   */
  if (isPreQualification) {
    const coachAssigned =
      applicationStatus === "Coach Assigned" ||
      applicationStatus === "Personal Coach Assigned" ||
      applicationStatus === "Interview Scheduled" ||
      applicationStatus === "Business Idea Development" ||
      applicationStatus === "Qualification Review";

    const interviewScheduled =
      applicationStatus === "Interview Scheduled" ||
      applicationStatus === "Business Idea Development" ||
      applicationStatus === "Qualification Review";

    const businessIdeaDevelopment =
      applicationStatus === "Business Idea Development" ||
      applicationStatus === "Qualification Review";

    const qualificationReview =
      applicationStatus === "Qualification Review";

    const journeySteps = [
      {
        label: "Application Received",
        complete: true,
      },
      {
        label: "Application Under Review",
        complete: true,
      },
      {
        label: "Personal Coach Assigned",
        complete: coachAssigned,
      },
      {
        label: "Interview Scheduled",
        complete: interviewScheduled,
      },
      {
        label: "Business Idea Development",
        complete: businessIdeaDevelopment,
      },
      {
        label: "Qualification Review",
        complete: qualificationReview,
      },
      {
        label: "Campaign Activated",
        complete: false,
      },
      {
        label: "Invitation Link Available",
        complete: false,
      },
    ];

    return (
      <main className="min-h-screen bg-[#f4f7fb] p-6 md:p-10">
        <div className="mx-auto max-w-6xl space-y-6">
          {message && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
              {message}
            </div>
          )}

          <section className="rounded-3xl bg-gradient-to-r from-[#10246f] to-[#078443] p-8 text-white shadow-xl md:p-10">
            <p className="mb-2 text-lg font-extrabold tracking-widest text-lime-300">
              WELCOME TO THE EPEW-EDE-IBOS PROGRAM
            </p>

            <h1 className="text-3xl font-extrabold md:text-5xl">
              Your Entrepreneur Development Ecosystem (EDE)
              Journey
            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-relaxed text-white/90">
              Your application has been received successfully and
              is currently under review. Please allow approximately
              3 to 15 days for a Personal Coach to be assigned and
              guide you through the next steps.
            </p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-5 text-2xl font-extrabold text-[#10246f]">
              Your Current Journey
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {journeySteps.map((step) => (
                <div
                  key={step.label}
                  className={`rounded-2xl border p-4 font-bold ${
                    step.complete
                      ? "border-green-300 bg-green-50 text-green-800"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {step.complete ? "✅" : "⬜"} {step.label}
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow">
              <h2 className="text-2xl font-extrabold text-[#10246f]">
                Your Current Status
              </h2>

              <p className="mt-4 text-lg font-bold text-green-700">
                {applicationStatus}
              </p>

              <p className="mt-3 leading-relaxed text-gray-600">
                Our team is reviewing your application and
                verification documents.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow">
              <h2 className="text-2xl font-extrabold text-[#10246f]">
                Your Next Action
              </h2>

              <p className="mt-4 leading-relaxed text-gray-700">
                Complete your Entrepreneur Questionnaire and begin
                thinking about your business idea, your goals, and
                the impact you want to create.
              </p>

              <Link
                href="/entrepreneurs/questionnaire"
                className="mt-6 inline-flex rounded-xl bg-[#10246f] px-6 py-3 font-bold text-white transition hover:bg-green-700"
              >
                Complete Entrepreneur Questionnaire
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border-l-8 border-green-600 bg-white p-6 shadow">
            <h2 className="text-2xl font-extrabold text-[#10246f]">
              Invitation Link
            </h2>

            <p className="mt-3 text-lg leading-relaxed text-gray-700">
              Your personal invitation link will become available
              after your interview and successful qualification.
            </p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-2xl font-extrabold text-[#10246f]">
              While You Wait
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-bold text-[#10246f]">
                  Explore Your Dashboard
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Review your current application status and follow
                  the progress of your journey.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-bold text-[#10246f]">
                  Develop Your Vision
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Begin organizing your business idea, goals,
                  customers, and community impact.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-bold text-[#10246f]">
                  Prepare for Your Interview
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Your Personal Coach will guide you through your
                  first interview and qualification process.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  /*
   * POST-QUALIFICATION DASHBOARD
   *
   * This is the complete campaign and community leadership portal
   * shown after interview, qualification, and campaign activation.
   */
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {message && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
            {message}
          </div>
        )}

        <section className="rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-green-700 p-10 text-white shadow-2xl">
          <p className="text-3xl font-black uppercase tracking-widest text-lime-300">
            WELCOME TO IBOS
          </p>

          <h1 className="mt-2 text-4xl font-extrabold leading-none">
            I Am My Own Boss
          </h1>

          <p className="mt-3 text-3xl font-semibold text-white">
            Community →
            <span className="text-lime-300">
              {" "}
              Leadership
            </span>{" "}
            →
            <span className="text-white"> Business</span> →
            <span className="text-lime-300"> Wealth</span>
          </p>

          <div className="mt-10 rounded-3xl border border-lime-400 bg-gradient-to-r from-slate-900/40 to-green-800/40 p-8">
            <h2 className="text-4xl font-black text-lime-300">
              🎉 CONGRATULATIONS!
            </h2>

            <p className="mt-5 text-2xl font-semibold">
              Your business has been approved for funding of up to
            </p>

            <div className="mt-2 text-6xl font-black text-lime-200 drop-shadow-lg">
              $100,000
            </div>

            <p className="text-2xl font-semibold">
              through the Ekero Partners Empower Wealth Program.
            </p>

            <div className="mt-8 rounded-2xl border border-lime-400 bg-black/20 p-6">
              <h3 className="text-3xl font-extrabold uppercase tracking-wide">
                YOU ARE NOW READY TO
              </h3>

              <h2 className="mt-2 text-4xl font-black leading-tight text-lime-200">
                BEGIN BUILDING YOUR COMMUNITY!
              </h2>

              <div className="mt-6 text-2xl font-bold leading-10">
                📣 Share your campaign.
                <br />
                👥 Invite Founding Supporters.
                <br />
                🎯 Move toward your Community Leadership Goal.
              </div>

              <p className="mt-6 text-xl text-blue-100">
                Your community is your strength. Your leadership
                creates opportunity. Your vision builds the future.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Your Entrepreneur Journey
          </h2>

          <div className="grid gap-3 md:grid-cols-4">
            <JourneyStep
              label="Registration Completed"
              done
            />

            <JourneyStep
              label="Interview Completed"
              done
            />

            <JourneyStep
              label="Business Approved"
              done
            />

            <JourneyStep
              label="Campaign Ready"
              done
            />

            <JourneyStep
              label="Community Leadership Goal"
              done={hasReachedGoal}
              active={!hasReachedGoal}
            />

            <JourneyStep
              label="Funding Management"
              done={false}
            />

            <JourneyStep
              label="Business Opening"
              done={false}
            />

            <JourneyStep
              label="Business Operations"
              done={false}
            />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl bg-white p-6 shadow xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Community Leadership Goal
                </h2>

                <p className="mt-2 text-slate-600">
                  Build your community by reaching 20 Community
                  Support Units.
                </p>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  hasReachedGoal
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {hasReachedGoal
                  ? "Community Leader"
                  : "Campaign Ready"}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm font-bold text-slate-700">
                <span>
                  {unitsSupported} / {unitsRequired} Community
                  Support Units
                </span>

                <span>{progress}%</span>
              </div>

              <div className="h-4 rounded-full bg-slate-200">
                <div
                  className="h-4 rounded-full bg-green-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {hasReachedGoal ? (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
                <h3 className="text-xl font-bold">
                  🎉 You achieved your Community Leadership Goal!
                </h3>

                <p className="mt-2">
                  Your campaign remains active. Every new Founding
                  Supporter introduced through your link can now help
                  another entrepreneur in your funding group while
                  increasing your Community Leadership Credit.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800">
                <h3 className="text-xl font-bold">
                  🎯 Next Action
                </h3>

                <p className="mt-2">
                  Share your campaign with family, friends,
                  businesses, churches, organizations, and everyone
                  who believes in your vision.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-slate-900">
              Vision Score
            </h2>

            <div className="mt-5 text-center">
              <div className="text-5xl font-extrabold text-purple-700">
                {visionScore}%
              </div>

              <p className="mt-2 font-bold text-slate-700">
                {visionScore >= 80
                  ? "Excellent"
                  : visionScore >= 50
                    ? "Growing"
                    : "Preparing Campaign"}
              </p>

              <p className="mt-3 text-sm text-slate-500">
                Your activity shows how actively you are building
                your community.
              </p>
            </div>
          </section>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Campaign Center
          </h2>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-500">
              Your Campaign Link
            </p>

            <p className="mt-2 break-all font-semibold text-blue-700">
              {campaignUrl}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/campaign/${campaignSlug}`}
              className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
            >
              🌐 View My Campaign
            </Link>

            <button
              type="button"
              onClick={copyCampaignLink}
              className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800"
            >
              🔗 Copy Campaign Link
            </button>

            <button
              type="button"
              onClick={recordShare}
              className="rounded-xl bg-purple-700 px-5 py-3 font-bold text-white hover:bg-purple-800"
            >
              📤 Share My Vision
            </button>

            <Link
              href="/entrepreneurs/supporters"
              className="rounded-xl bg-slate-800 px-5 py-3 font-bold text-white hover:bg-slate-900"
            >
              👥 Founding Supporters
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Campaign Visitors"
            value={entrepreneur.campaign_visitors || 0}
          />

          <MetricCard
            label="Campaign Shares"
            value={entrepreneur.campaign_shares || 0}
          />

          <MetricCard
            label="Leadership Credit"
            value={entrepreneur.leadership_credit || 0}
          />

          <MetricCard
            label="Referred Units for Others"
            value={entrepreneur.referred_units_for_others || 0}
          />
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-slate-900">
            Community Leadership Credit
          </h2>

          <p className="mt-3 text-slate-600">
            Your campaign link continues helping other entrepreneurs
            even after you reach your goal. Every Founding Supporter
            who joins EPEW through your link increases your Community
            Leadership Credit and strengthens your record for future
            growth opportunities.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-slate-900">
            My EPEW Team
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <TeamCard
              title="EPEW Advisor"
              value={
                entrepreneur.assigned_coach_name ||
                entrepreneur.coach_name ||
                "Pending Assignment"
              }
            />

            <TeamCard
              title="Kleernest Financial Center"
              value="Financial Support"
            />

            <TeamCard
              title="ORGDH Promotion Center"
              value="Community Promotion"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function JourneyStep({
  label,
  done,
  active = false,
}: {
  label: string;
  done: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        done
          ? "border-green-200 bg-green-50 text-green-700"
          : active
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      <p className="font-bold">
        {done ? "✅" : active ? "🟢" : "⬜"} {label}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{label}</p>

      <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
        {value}
      </h3>
    </div>
  );
}

function TeamCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{title}</p>

      <h3 className="mt-1 font-bold text-slate-900">
        {value}
      </h3>
    </div>
  );
}