"use client";

export default function AnnualMeetingCenter({
  cohort,
  meeting,
  entrepreneurs,
}: {
  cohort: any;
  meeting: any;
  entrepreneurs: any[];
}) {
  const qualified = entrepreneurs.filter(
    (e) =>
      e.status === "Qualified" ||
      e.qualification_status === "Qualified"
  ).length;

  const ready = entrepreneurs.filter(
    (e) => Number(e.units_supported || 0) >= Number(e.units_required || 20)
  ).length;

  const attendance = entrepreneurs.length;

  return (
    <section id="annual-meeting" className="mb-10">

      <div className="rounded-3xl bg-gradient-to-r from-[#06245c] to-green-700 p-10 text-white shadow-2xl">

        <p className="text-xl font-black uppercase tracking-widest text-lime-300">
          IBOS Annual Meeting Center
        </p>

        <h2 className="mt-4 text-6xl font-extrabold">
          Annual Meeting
        </h2>

        <p className="mt-5 text-2xl text-blue-100">
          Coordinate every activity required before, during, and after the
          Annual Meeting.
        </p>

      </div>

      {/* Meeting Overview */}

      <div className="mt-8 grid gap-6 md:grid-cols-4">

        <Card
          title="Meeting"
          value={meeting?.meeting_title || "Not Created"}
          icon="⭐"
        />

        <Card
          title="Cohort"
          value={cohort?.cohort_number || "-"}
          icon="👥"
        />

        <Card
          title="Status"
          value={meeting?.meeting_status || "Preparing"}
          icon="📋"
        />

        <Card
          title="Meeting Type"
          value={meeting?.meeting_type || "Hybrid"}
          icon="🌍"
        />

        <Card
          title="Qualified"
          value={`${qualified} / ${cohort?.target_entrepreneurs || 50}`}
          icon="✅"
        />

        <Card
          title="Ready"
          value={ready}
          icon="🟢"
        />

        <Card
          title="Participants"
          value={attendance}
          icon="🎤"
        />

        <Card
          title="Registration"
          value="Open"
          icon="📝"
        />

      </div>

      {/* Meeting Configuration */}

      <div className="mt-10 rounded-3xl bg-white p-10 shadow-xl">

        <h3 className="text-4xl font-extrabold text-[#06245c]">
          Meeting Configuration
        </h3>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <Info
            title="Meeting Date"
            value={
              meeting?.meeting_date
                ? new Date(meeting.meeting_date).toLocaleDateString()
                : "Pending"
            }
          />

          <Info
            title="Format"
            value={meeting?.meeting_type || "Hybrid"}
          />

          <Info
            title="Location"
            value={meeting?.location || "Pending"}
          />

          <Info
            title="Registration Deadline"
            value="Pending"
          />

          <Info
            title="Zoom"
            value={
              meeting?.zoom_link
                ? "Configured"
                : "Not Configured"
            }
          />

          <Info
            title="YouTube Live"
            value={
              meeting?.youtube_live_link
                ? "Configured"
                : "Not Configured"
            }
          />

          <Info
            title="Capacity"
            value="Unlimited"
          />

          <Info
            title="Readiness"
            value={`${ready} Entrepreneurs Ready`}
          />

        </div>

      </div>

      {/* Qualification Board */}

      <div className="mt-10 rounded-3xl bg-white p-10 shadow-xl">

        <h3 className="text-4xl font-extrabold text-[#06245c]">
          Entrepreneur Qualification Board
        </h3>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {entrepreneurs.map((item) => {

            const units =
              Number(item.units_supported || 0);

            const required =
              Number(item.units_required || 20);

            const ready = units >= required;

            return (

              <div
                key={item.id}
                className="rounded-3xl border bg-[#f8fafc] p-7 shadow"
              >

                <div className="flex items-center gap-4">

                  <div className="h-16 w-16 rounded-full bg-[#06245c] text-white flex items-center justify-center text-2xl font-black">
                    {item.entrepreneur_name?.charAt(0) || "E"}
                  </div>

                  <div>

                    <h4 className="text-2xl font-black text-[#06245c]">
                      {item.entrepreneur_name}
                    </h4>

                    <p className="text-gray-600">
                      {item.business_name}
                    </p>

                  </div>

                </div>

                <div className="mt-6 space-y-3 text-lg">

                  <Row
                    label="Coach"
                    value={item.coach_name || "Pending"}
                  />

                  <Row
                    label="Support Units"
                    value={`${units}/${required}`}
                  />

                  <Row
                    label="Marketplace"
                    value={item.marketplace_status || "Pending"}
                  />

                  <Row
                    label="Branding"
                    value="Pending"
                  />

                  <Row
                    label="Marketing"
                    value="Pending"
                  />

                  <Row
                    label="Media"
                    value="Pending"
                  />

                </div>

                <div className="mt-8">

                  {ready ? (

                    <span className="rounded-full bg-green-100 px-5 py-3 text-lg font-black text-green-700">
                      🟢 Ready
                    </span>

                  ) : (

                    <span className="rounded-full bg-yellow-100 px-5 py-3 text-lg font-black text-yellow-700">
                      🟡 Needs Attention
                    </span>

                  )}

                </div>

              </div>

            );

          })}

        </div>

      </div>

    </section>
  );
}

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-7 text-center shadow-xl">

      <div className="text-5xl">
        {icon}
      </div>

      <p className="mt-4 text-lg font-bold text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-black text-[#06245c]">
        {value}
      </p>

    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f5f7fb] p-6">

      <p className="font-bold text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-xl font-black text-[#06245c]">
        {value}
      </p>

    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between">

      <span className="font-bold text-gray-500">
        {label}
      </span>

      <span className="font-black">
        {value}
      </span>

    </div>
  );
}