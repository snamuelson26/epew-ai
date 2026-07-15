"use client";

export default function Legacy() {
  return (
    <section className="mb-10">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 p-12 text-white shadow-2xl">

        <div className="max-w-5xl mx-auto text-center">

          <div className="text-7xl mb-8">
            🌟
          </div>

          <h2 className="text-5xl md:text-6xl font-extrabold mb-8">
            My Legacy
          </h2>

          <p className="text-2xl md:text-3xl leading-relaxed text-blue-100 mb-10">
            Since joining the EPEW Entrepreneur Development Ecosystem,
            you have become part of something much bigger than a financial
            contribution.
          </p>

          <div className="grid md:grid-cols-4 gap-6 mb-12">

            <LegacyCard
              icon="👨‍💼"
              title="Entrepreneurs"
              text="Helping entrepreneurs prepare for business ownership."
            />

            <LegacyCard
              icon="🏢"
              title="Businesses"
              text="Supporting the creation of sustainable businesses."
            />

            <LegacyCard
              icon="🌍"
              title="Communities"
              text="Strengthening local economies and communities."
            />

            <LegacyCard
              icon="💼"
              title="Jobs"
              text="Creating employment opportunities for families."
            />

          </div>

          <div className="bg-white/10 rounded-3xl p-10 backdrop-blur-sm">

            <h3 className="text-4xl font-extrabold mb-6 text-lime-300">
              Your Legacy
            </h3>

            <p className="text-2xl leading-relaxed mb-6">
              Every entrepreneur you help...
            </p>

            <p className="text-2xl leading-relaxed mb-6">
              Every business that opens...
            </p>

            <p className="text-2xl leading-relaxed mb-6">
              Every job that is created...
            </p>

            <p className="text-3xl font-extrabold leading-relaxed text-white">
              becomes part of your lasting contribution to stronger
              communities through entrepreneurship.
            </p>

          </div>

          <div className="mt-12">

            <p className="text-3xl font-extrabold text-lime-300 leading-relaxed">
              EPEW develops entrepreneurs.
              <br />
              Entrepreneurs build businesses.
              <br />
              Businesses strengthen communities.
              <br />
              Communities create lasting prosperity.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}

function LegacyCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-sm">

      <div className="text-6xl mb-5">
        {icon}
      </div>

      <h3 className="text-2xl font-extrabold mb-4">
        {title}
      </h3>

      <p className="text-lg leading-relaxed text-blue-100">
        {text}
      </p>

    </div>
  );
}