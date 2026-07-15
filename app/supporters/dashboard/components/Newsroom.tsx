"use client";

export default function Newsroom() {
  return (
    <section className="mb-10">
      <div className="rounded-3xl bg-white p-10 shadow-2xl">
        <h2 className="mb-6 text-5xl font-extrabold text-[#06245c]">
          📰 EPEW Ecosystem Newsroom
        </h2>

        <p className="mb-10 text-2xl leading-relaxed text-gray-700">
          Receive curated updates about the entrepreneur group you are helping
          develop, major ecosystem achievements, upcoming annual meetings, grand
          openings, and public EPEW news.
        </p>

        <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <NewsStat icon="✅" title="Entrepreneurs Qualified This Week" value="3" />
          <NewsStat icon="🏢" title="Businesses Preparing to Open" value="2" />
          <NewsStat icon="🎉" title="Grand Openings Scheduled" value="1" />
          <NewsStat icon="🌍" title="Communities Represented" value="8" />
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <NewsCard
            emoji="🌍"
            title="My Entrepreneur Group"
            subtitle="Cohort Progress"
            text="Your entrepreneur group is moving through the EPEW development journey. The Annual Meeting will come first, followed by the funding schedule, projected business openings, grand openings, and quarterly reporting."
            button="View Group Progress"
            href="/supporters/cohort"
          />

          <NewsCard
            emoji="⭐"
            title="Featured Entrepreneur"
            subtitle="Weekly Highlight"
            text="Each week, EPEW may highlight one entrepreneur from the ecosystem to share their business journey, preparation progress, and community impact."
            button="Read Featured Story"
            href="/news/featured-entrepreneur"
          />

          <NewsCard
            emoji="📅"
            title="Upcoming Events"
            subtitle="Annual Meeting & Grand Openings"
            text="Major events such as the Annual Meeting, entrepreneur graduations, EPEW celebrations, and Grand Opening invitations will appear here when scheduled."
            button="View Events"
            href="/events"
          />

          <NewsCard
            emoji="🌐"
            title="Explore More"
            subtitle="Public EPEW Website"
            text="Visit the public EPEW website for ecosystem news, success stories, blogs, videos, press releases, community projects, and upcoming public events."
            button="Explore the EPEW Website"
            href="/"
          />
        </div>

        <div className="mt-10 rounded-3xl bg-[#f5f7fb] p-8">
          <h3 className="text-3xl font-extrabold text-[#06245c]">
            Simple, meaningful updates only.
          </h3>

          <p className="mt-4 text-xl leading-relaxed text-gray-700">
            EPEW will not overwhelm supporters with unnecessary news. You will
            receive general ecosystem achievements, updates about your
            entrepreneur group, and invitations to major events such as the
            Annual Meeting and Grand Openings.
          </p>
        </div>
      </div>
    </section>
  );
}

function NewsStat({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-6 text-center shadow-md">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-gray-600">{title}</h3>
      <p className="mt-3 text-5xl font-black text-[#06245c]">{value}</p>
    </div>
  );
}

function NewsCard({
  emoji,
  title,
  subtitle,
  text,
  button,
  href,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  text: string;
  button: string;
  href: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
      <div className="text-6xl">{emoji}</div>

      <p className="mt-5 text-lg font-black uppercase tracking-wide text-green-700">
        {subtitle}
      </p>

      <h3 className="mt-2 text-3xl font-extrabold text-[#06245c]">
        {title}
      </h3>

      <p className="mt-4 text-xl leading-relaxed text-gray-700">{text}</p>

      <a
        href={href}
        className="mt-8 inline-block rounded-2xl bg-[#06245c] px-7 py-4 text-lg font-black text-white hover:bg-green-700"
      >
        {button}
      </a>
    </div>
  );
}