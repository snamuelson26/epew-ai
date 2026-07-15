"use client";

interface Props {
  currentStage?: string;
}

const journeySteps = [
  {
    key: "Marketplace Approved",
    icon: "✅",
    title: "Marketplace Approved",
    description:
      "The entrepreneur has been approved to appear in the EPEW Marketplace.",
  },
  {
    key: "Qualified",
    icon: "✅",
    title: "Qualified",
    description:
      "The entrepreneur has reached qualification and is building support units.",
  },
  {
    key: "Annual Meeting",
    icon: "⭐",
    title: "Annual Meeting",
    description:
      "Supporters and entrepreneurs meet together, and the opening schedule is introduced.",
  },
  {
    key: "Funding Scheduled",
    icon: "🟡",
    title: "Funding Scheduled",
    description:
      "The entrepreneur receives an approximate funding and business opening timeline.",
  },
  {
    key: "Grand Opening",
    icon: "🎉",
    title: "Grand Opening",
    description:
      "The business officially opens and connected supporters receive special invitations.",
  },
  {
    key: "Quarterly Reporting",
    icon: "📄",
    title: "Quarterly Reporting",
    description:
      "The entrepreneur provides quarterly business progress reports to supporters.",
  },
];

export default function JourneyTimeline({
  currentStage = "Annual Meeting",
}: Props) {
  const currentIndex = Math.max(
    journeySteps.findIndex((step) => step.key === currentStage),
    2
  );

  return (
    <section className="mb-10">
      <div className="rounded-3xl bg-white p-10 shadow-2xl">
        <div className="mb-10">
          <h2 className="text-5xl font-extrabold text-[#06245c]">
            🚀 Entrepreneur Journey Progress
          </h2>

          <p className="mt-4 text-2xl leading-relaxed text-gray-700">
            Follow the progress of the entrepreneur group you are helping
            develop through the EPEW Entrepreneur Development Ecosystem.
          </p>
        </div>

        <div className="mb-10 rounded-3xl bg-[#f5f7fb] p-8">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <h3 className="text-3xl font-extrabold text-[#06245c]">
              Overall Journey Progress
            </h3>

            <p className="text-2xl font-black text-green-700">
              {currentIndex + 1} of {journeySteps.length} Milestones Completed
            </p>
          </div>

          <div className="h-6 overflow-hidden rounded-full bg-gray-300">
            <div
              className="h-full rounded-full bg-green-600"
              style={{
                width: `${((currentIndex + 1) / journeySteps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {journeySteps.map((step, index) => {
            const completed = index <= currentIndex;
            const current = index === currentIndex;

            return (
              <div
                key={step.key}
                className={`rounded-3xl border-2 p-7 shadow-lg ${
                  completed
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-[#f5f7fb]"
                } ${current ? "ring-4 ring-lime-300" : ""}`}
              >
                <div className="mb-5 text-6xl">{step.icon}</div>

                <p
                  className={`mb-3 inline-block rounded-full px-4 py-2 text-sm font-black uppercase tracking-wide ${
                    completed
                      ? "bg-green-700 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {completed ? "Completed / Active" : "Upcoming"}
                </p>

                <h3 className="text-3xl font-extrabold text-[#06245c]">
                  {step.title}
                </h3>

                <p className="mt-4 text-xl leading-relaxed text-gray-700">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-3xl bg-gradient-to-r from-[#06245c] to-green-700 p-8 text-white">
          <h3 className="text-3xl font-extrabold">
            Every milestone matters.
          </h3>

          <p className="mt-4 text-2xl leading-relaxed text-blue-100">
            Your support helps entrepreneurs move from marketplace approval to
            qualification, annual meeting, funding schedule, grand opening, and
            quarterly reporting.
          </p>
        </div>
      </div>
    </section>
  );
}