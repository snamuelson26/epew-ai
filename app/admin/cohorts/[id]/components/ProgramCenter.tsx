"use client";

const defaultProgramItems = [
  {
    time: "09:00 AM",
    title: "Welcome",
    type: "Opening",
    status: "Pending",
    stage: "MC at podium. Leadership seated. Audience welcomed.",
    display: "Annual Meeting welcome screen with cohort number.",
    production: "Intro music, camera 1, house lights 70%.",
    media: "Wide room photo and opening video recording.",
  },
  {
    time: "09:10 AM",
    title: "National Anthem of EPEW",
    type: "Ceremony",
    status: "Pending",
    stage: "Audience stands. MC steps aside. Anthem screen displayed.",
    display: "EPEW anthem lyrics and official visual background.",
    production: "Anthem audio, camera 2, stage lights focused.",
    media: "Audience standing photo and anthem video recording.",
  },
  {
    time: "09:20 AM",
    title: "IBOS Presentation",
    type: "Presentation",
    status: "Pending",
    stage: "Presenter center stage. Screen shows IBOS journey.",
    display: "EPEW → EDE → IBOS entrepreneur journey.",
    production: "Slide deck, microphone, livestream active.",
    media: "Presenter photo, short highlight clip.",
  },
  {
    time: "09:45 AM",
    title: "Business Launch Certification",
    type: "Certification",
    status: "Pending",
    stage: "MC calls entrepreneur. Leadership presents certificate.",
    display: "Business name, entrepreneur photo, Business ID, disbursement start date.",
    production: "Recognition music, spotlight, lower-third graphic.",
    media: "Certificate photo, handshake photo, short social media clip.",
  },
  {
    time: "11:30 AM",
    title: "Cohort Certification",
    type: "Certification",
    status: "Pending",
    stage: "All certified entrepreneurs return to stage for cohort recognition.",
    display: "Cohort certification screen with total businesses and CSUs.",
    production: "Celebration music, full stage lighting, cameras 1 and 2.",
    media: "Group photo, official cohort photo, press image.",
  },
  {
    time: "12:00 PM",
    title: "Funding Schedule Announcement",
    type: "Launch",
    status: "Pending",
    stage: "Leadership announces projected disbursement and launch schedule.",
    display: "Business launch calendar and disbursement start dates.",
    production: "Funding calendar slides, recording, livestream.",
    media: "Announcement clip and ORGDH news story notes.",
  },
  {
    time: "12:30 PM",
    title: "Closing Ceremony",
    type: "Closing",
    status: "Pending",
    stage: "Founder closes. Entrepreneurs and supporters acknowledged.",
    display: "EPEW mission statement and next steps.",
    production: "Closing music, camera wide shot.",
    media: "Final room photo and closing clip.",
  },
];

export default function ProgramCenter({
  cohort,
  entrepreneurs,
}: {
  cohort: any;
  entrepreneurs: any[];
}) {
  const firstEntrepreneur = entrepreneurs[0];

  return (
    <section className="mb-10">
      <div className="rounded-3xl bg-gradient-to-r from-[#06245c] to-green-700 p-10 text-white shadow-2xl">
        <p className="text-xl font-black uppercase tracking-widest text-lime-300">
          IBOS Program Center
        </p>

        <h2 className="mt-4 text-6xl font-extrabold">
          Annual Meeting Program & Stage Choreography
        </h2>

        <p className="mt-5 max-w-5xl text-2xl leading-relaxed text-blue-100">
          Coordinate the ceremony, stage movement, live display, production,
          media coverage, and completion tracking for the Annual Meeting.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <SummaryCard title="Program Items" value={defaultProgramItems.length} icon="🎤" />
        <SummaryCard title="Certified Entrepreneurs" value={entrepreneurs.length} icon="👨‍💼" />
        <SummaryCard title="Cohort" value={cohort?.cohort_number || "-"} icon="👥" />
        <SummaryCard title="Live Display" value="Ready" icon="🖥️" />
      </div>

      <div className="mt-10 rounded-3xl bg-white p-10 shadow-xl">
        <h3 className="text-4xl font-extrabold text-[#06245c]">
          Program Director View
        </h3>

        <div className="mt-8 rounded-3xl bg-[#f5f7fb] p-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-lg font-black uppercase tracking-wide text-green-700">
                Current Item
              </p>

              <h4 className="mt-2 text-4xl font-extrabold text-[#06245c]">
                Business Launch Certification
              </h4>

              <p className="mt-3 text-2xl text-gray-700">
                {firstEntrepreneur?.entrepreneur_name || "Entrepreneur Pending"}
              </p>

              <p className="mt-1 text-xl font-bold text-green-700">
                {firstEntrepreneur?.business_name || "Business Pending"}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow">
              <h4 className="text-3xl font-extrabold text-[#06245c]">
                Current Status
              </h4>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <CheckItem label="MC Ready" />
                <CheckItem label="Leadership Ready" />
                <CheckItem label="Entrepreneur Ready" />
                <CheckItem label="Certificate Ready" />
                <CheckItem label="Lighting Ready" />
                <CheckItem label="Music Ready" />
                <CheckItem label="Live Screen Ready" />
                <CheckItem label="Camera Ready" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <ControlButton label="Start Item" color="green" />
            <ControlButton label="Next" color="blue" />
            <ControlButton label="Pause" color="orange" />
            <ControlButton label="Hold" color="purple" />
            <ControlButton label="Complete" color="gray" />
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl bg-white p-10 shadow-xl">
        <h3 className="text-4xl font-extrabold text-[#06245c]">
          Program Timeline
        </h3>

        <div className="mt-8 space-y-6">
          {defaultProgramItems.map((item) => (
            <ProgramItem key={`${item.time}-${item.title}`} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-3xl bg-white p-10 shadow-xl">
        <h3 className="text-4xl font-extrabold text-[#06245c]">
          Stage Choreography for Business Launch Certification
        </h3>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <ChoreographyCard
            title="Stage Movement"
            icon="🎭"
            items={[
              "MC calls entrepreneur to stage.",
              "Entrepreneur enters from stage left.",
              "Leadership moves to certificate position.",
              "Photographer moves to front center.",
              "Media team prepares stage-left camera.",
              "Entrepreneur exits stage right after photos.",
            ]}
          />

          <ChoreographyCard
            title="Live Display"
            icon="🖥️"
            items={[
              "Business logo displayed.",
              "Entrepreneur photo displayed.",
              "Business name and Business ID displayed.",
              "Certification status updated.",
              "Disbursement start date displayed.",
              "Projected grand opening date displayed.",
            ]}
          />

          <ChoreographyCard
            title="Production & Media"
            icon="🎥"
            items={[
              "Recognition music begins.",
              "Stage spotlight turns on.",
              "Lower-third graphic appears.",
              "Certificate photo captured.",
              "Handshake photo captured.",
              "Short social media clip recorded.",
            ]}
          />
        </div>
      </div>

      <div className="mt-10 rounded-3xl border-l-8 border-green-600 bg-green-50 p-8 shadow-xl">
        <h3 className="text-3xl font-extrabold text-[#06245c]">
          IBOS Program Principle
        </h3>

        <p className="mt-4 text-xl leading-relaxed text-gray-700">
          The Program Center does not simply display an agenda. It coordinates
          the ceremony, stage choreography, live display, production, media, and
          completion tracking so that the Annual Meeting becomes both an
          operational certification and a meaningful celebration of entrepreneur
          achievement.
        </p>
      </div>
    </section>
  );
}

function SummaryCard({
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
      <div className="text-5xl">{icon}</div>
      <p className="mt-4 text-lg font-bold text-gray-600">{title}</p>
      <p className="mt-3 text-4xl font-black text-[#06245c]">{value}</p>
    </div>
  );
}

function CheckItem({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-green-50 p-4">
      <p className="font-black text-green-700">✅ {label}</p>
    </div>
  );
}

function ControlButton({
  label,
  color,
}: {
  label: string;
  color: "green" | "blue" | "orange" | "purple" | "gray";
}) {
  const styles = {
    green: "bg-green-700 hover:bg-green-800",
    blue: "bg-[#06245c] hover:bg-blue-900",
    orange: "bg-orange-500 hover:bg-orange-600",
    purple: "bg-purple-700 hover:bg-purple-800",
    gray: "bg-gray-700 hover:bg-gray-800",
  };

  return (
    <button
      type="button"
      className={`${styles[color]} rounded-2xl px-8 py-4 text-xl font-black text-white`}
    >
      {label}
    </button>
  );
}

function ProgramItem({
  item,
}: {
  item: {
    time: string;
    title: string;
    type: string;
    status: string;
    stage: string;
    display: string;
    production: string;
    media: string;
  };
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-8 shadow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-lg font-black text-green-700">{item.time}</p>

          <h4 className="mt-2 text-3xl font-extrabold text-[#06245c]">
            {item.title}
          </h4>

          <p className="mt-1 text-lg font-bold text-gray-500">{item.type}</p>
        </div>

        <span className="rounded-full bg-orange-100 px-5 py-3 text-lg font-black text-orange-700">
          {item.status}
        </span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DetailBox title="Stage" value={item.stage} />
        <DetailBox title="Live Display" value={item.display} />
        <DetailBox title="Production" value={item.production} />
        <DetailBox title="Media" value={item.media} />
      </div>
    </div>
  );
}

function DetailBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-wide text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-lg leading-relaxed text-gray-700">{value}</p>
    </div>
  );
}

function ChoreographyCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-8 shadow">
      <div className="text-6xl">{icon}</div>

      <h4 className="mt-5 text-3xl font-extrabold text-[#06245c]">
        {title}
      </h4>

      <ul className="mt-5 space-y-3 text-lg leading-relaxed text-gray-700">
        {items.map((item) => (
          <li key={item}>✅ {item}</li>
        ))}
      </ul>
    </div>
  );
}