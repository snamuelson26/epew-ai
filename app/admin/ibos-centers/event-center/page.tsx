"use client";

export default function IBOSEventCenterPage() {
  const stats = [
    { title: "Active Sessions", value: "0", subtitle: "Currently running" },
    { title: "Upcoming Events", value: "0", subtitle: "Scheduled" },
    {
      title: "Registered Participants",
      value: "0",
      subtitle: "Entrepreneurs & Guests",
    },
    { title: "Checked-In Participants", value: "0", subtitle: "Attendance" },
    {
      title: "Certificates Generated",
      value: "0",
      subtitle: "Official Certificates",
    },
    { title: "Certificates Issued", value: "0", subtitle: "Presented" },
    { title: "Stage Queue", value: "0", subtitle: "Waiting" },
    { title: "Archived Events", value: "0", subtitle: "Completed" },
  ];

  const actions = [
    "Create Event Session",
    "Manage Sessions",
    "Participants",
    "Certificates",
    "Stage Manager",
    "ORGDH Gives Back",
    "Statistics",
    "Archive",
  ];

  const timeline = [
    "Create Session",
    "Registration",
    "Participant Assignment",
    "Certificate Generation",
    "Check-In",
    "ORGDH Gives Back",
    "Funding Queue",
    "Stage Presentation",
    "Archive",
  ];

  const eventTypes = [
    {
      title: "Annual Meeting",
      features: ["Certificates", "Stage", "Raffle"],
    },
    {
      title: "Business Launch Ceremony",
      features: ["Certificates", "Stage"],
    },
    {
      title: "Coach Certification",
      features: ["Certificates", "Stage"],
    },
    {
      title: "Partner Certification",
      features: ["Certificates", "Stage"],
    },
    {
      title: "Community Recognition",
      features: ["Certificates", "Stage"],
    },
    {
      title: "Accreditation",
      features: ["Certificates", "Stage"],
    },
  ];

  const engineStatus = [
    "Certificates",
    "Stage Queue",
    "Raffle",
    "Verification",
    "Archive",
    "Statistics",
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
      <section className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-r from-black via-[#06245c] to-green-900 p-10 text-white shadow-2xl">
        <p className="text-xl font-black uppercase tracking-[0.45em] text-lime-300">
          IBOS EVENT CENTER
        </p>

        <h1 className="mt-4 text-6xl font-extrabold">
          Official Event
          <br />
          Management Platform
        </h1>

        <p className="mt-6 max-w-6xl text-2xl leading-relaxed text-blue-100">
          Manage every official event within the Entrepreneur Development
          Ecosystem—from planning and participant registration to certificates,
          stage presentation, funding queue, and event archives.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            subtitle={item.subtitle}
          />
        ))}
      </section>

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-green-700">
            Quick Action Center
          </p>

          <h2 className="mt-2 text-4xl font-extrabold text-[#06245c]">
            Event Operations
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {actions.map((action, index) => (
            <button
              key={action}
              type="button"
              className={`rounded-2xl px-6 py-5 text-left text-lg font-black shadow-lg transition hover:scale-[1.02] ${
                index === 0
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-[#06245c] text-white hover:bg-blue-900"
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-green-700">
          Event Timeline
        </p>

        <h2 className="mt-2 text-4xl font-extrabold text-[#06245c]">
          Official Event Workflow
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-9">
          {timeline.map((step, index) => (
            <div key={step} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06245c] text-xl font-black text-white shadow">
                {index + 1}
              </div>

              <p className="mt-3 text-sm font-black uppercase text-[#06245c]">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-green-700">
          Event Types
        </p>

        <h2 className="mt-2 text-4xl font-extrabold text-[#06245c]">
          Official EPEW Events
        </h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {eventTypes.map((event) => (
            <div
              key={event.title}
              className="rounded-3xl border border-gray-200 bg-[#f8fafc] p-6 shadow"
            >
              <h3 className="text-2xl font-extrabold text-[#06245c]">
                {event.title}
              </h3>

              <div className="mt-5 flex flex-wrap gap-3">
                {event.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
        <h2 className="text-4xl font-extrabold text-[#06245c]">
          Recent Event Sessions
        </h2>

        <div className="mt-8 overflow-x-auto rounded-2xl border">
          <table className="min-w-full">
            <thead className="bg-[#06245c] text-white">
              <tr>
                <th className="p-4 text-left">Session</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Location</th>
                <th className="p-4 text-left">Participants</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b">
                <td className="p-4 font-bold">
                  EPEW Annual Meeting – Queens
                </td>
                <td className="p-4">Annual Meeting</td>
                <td className="p-4">Not Set</td>
                <td className="p-4">Queens, NY</td>
                <td className="p-4">50 / 50</td>
                <td className="p-4">
                  <span className="rounded-xl bg-green-100 px-4 py-2 font-bold text-green-700">
                    Registration Open
                  </span>
                </td>
                <td className="flex gap-2 p-4">
                  <button className="rounded-lg bg-[#06245c] px-4 py-2 font-bold text-white">
                    Open
                  </button>
                  <button className="rounded-lg bg-green-700 px-4 py-2 font-bold text-white">
                    Edit
                  </button>
                  <button className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white">
                    Archive
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
        <h2 className="text-4xl font-extrabold text-[#06245c]">
          Event Engine Status
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {engineStatus.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center"
            >
              <p className="text-3xl">🟢</p>
              <p className="mt-2 font-black text-green-800">{item}</p>
              <p className="mt-1 text-sm font-bold text-green-700">
                Operational
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">
        {title}
      </p>

      <h2 className="mt-4 text-5xl font-extrabold text-[#06245c]">
        {value}
      </h2>

      <p className="mt-3 text-lg text-gray-600">{subtitle}</p>
    </div>
  );
}