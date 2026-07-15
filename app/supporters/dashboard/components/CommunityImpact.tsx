"use client";

interface Props {
  entrepreneurGroup?: number;
  communities?: number;
  countries?: number;
  jobsCreated?: number;
}

export default function CommunityImpact({
  entrepreneurGroup = 50,
  communities = 8,
  countries = 3,
  jobsCreated = 50,
}: Props) {
  return (
    <section className="mb-10">

      <div className="bg-white rounded-3xl shadow-2xl p-10">

        <h2 className="text-5xl font-extrabold text-[#06245c] mb-6">
          🌍 Your Community Impact
        </h2>

        <p className="text-2xl leading-relaxed text-gray-700 mb-10">
          Your participation is currently helping an entrepreneur group of up to{" "}
          <span className="font-extrabold text-[#06245c]">
            {entrepreneurGroup} entrepreneurs
          </span>{" "}
          build businesses across multiple communities and countries.

          Together these entrepreneurs are preparing to establish{" "}
          <span className="font-extrabold text-green-700">
            {entrepreneurGroup} businesses
          </span>
          , strengthen local economies, and create employment opportunities
          through the EPEW Entrepreneur Development Ecosystem.
        </p>

        <div className="grid md:grid-cols-4 gap-6 mb-10">

          <ImpactBox
            emoji="👨‍💼"
            title="Entrepreneur Group"
            value={`${entrepreneurGroup}`}
          />

          <ImpactBox
            emoji="🏘️"
            title="Communities"
            value={`${communities}`}
          />

          <ImpactBox
            emoji="🌎"
            title="Countries"
            value={`${countries}`}
          />

          <ImpactBox
            emoji="💼"
            title="Jobs Expected"
            value={`${jobsCreated}+`}
          />

        </div>

        <div className="bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 rounded-3xl p-10 text-white">

          <h3 className="text-4xl font-extrabold mb-6">
            Why Your Participation Matters
          </h3>

          <div className="space-y-5 text-2xl leading-relaxed">

            <p>
              Every participation unit helps entrepreneurs move one step
              closer to business ownership.
            </p>

            <p>
              Every business that opens strengthens its community by creating
              jobs, serving customers, supporting families, and generating
              economic activity.
            </p>

            <p className="font-bold text-lime-300">
              Your impact extends beyond one entrepreneur—you are helping build
              an ecosystem of entrepreneurs who will strengthen communities and
              create lasting prosperity for future generations.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}

function ImpactBox({
  emoji,
  title,
  value,
}: {
  emoji: string;
  title: string;
  value: string;
}) {
  return (
    <div className="bg-[#f5f7fb] rounded-3xl shadow-lg p-7 text-center">

      <div className="text-5xl mb-4">
        {emoji}
      </div>

      <h4 className="text-xl font-bold text-gray-600">
        {title}
      </h4>

      <p className="mt-3 text-5xl font-extrabold text-[#06245c]">
        {value}
      </p>

    </div>
  );
}