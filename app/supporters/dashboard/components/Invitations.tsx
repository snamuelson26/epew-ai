"use client";

interface PersonalInvitation {
  id: number;
  event: string;
  business: string;
  entrepreneur: string;
  date: string;
  location: string;
  status: string;
}

interface EcosystemInvitation {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  status: string;
}

interface Props {
  personalInvitations?: PersonalInvitation[];
  ecosystemInvitations?: EcosystemInvitation[];
}

export default function Invitations({
  personalInvitations = [],
  ecosystemInvitations = [],
}: Props) {
  return (
    <section className="mb-10">

      <div className="bg-white rounded-3xl shadow-2xl p-10">

        <h2 className="text-5xl font-extrabold text-[#06245c] mb-6">
          📅 My Invitations
        </h2>

        <p className="text-2xl text-gray-700 leading-relaxed mb-10">
          As an EPEW supporter, you receive invitations to major entrepreneur
          milestones and ecosystem events.
        </p>

        {/* PERSONAL INVITATIONS */}

        <div className="mb-12">

          <h3 className="text-4xl font-extrabold text-[#06245c] mb-2">
            🎯 Personal Invitations
          </h3>

          <p className="text-xl text-gray-600 mb-6">
            Exclusive invitations for the entrepreneur(s) you directly support.
          </p>

          {personalInvitations.length === 0 ? (

            <EmptyInvitation
              title="No Personal Invitations Yet"
              message="When your entrepreneur schedules a Grand Opening, Anniversary, or Major Business Milestone, your invitation will appear here."
            />

          ) : (

            <div className="grid xl:grid-cols-2 gap-6">

              {personalInvitations.map((item) => (

                <PersonalCard key={item.id} item={item} />

              ))}

            </div>

          )}

        </div>

        {/* ECOSYSTEM INVITATIONS */}

        <div>

          <h3 className="text-4xl font-extrabold text-[#06245c] mb-2">
            🌍 Ecosystem Invitations
          </h3>

          <p className="text-xl text-gray-600 mb-6">
            Invitations shared with every supporter participating in the same
            annual entrepreneur cohort.
          </p>

          {ecosystemInvitations.length === 0 ? (

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

              <DefaultCard
                title="Annual Meeting"
                description="Meet the entrepreneurs, supporters, coaches, and leadership while learning the approximate funding schedule."
              />

              <DefaultCard
                title="Entrepreneur Graduation"
                description="Celebrate entrepreneurs completing the EPEW development journey."
              />

              <DefaultCard
                title="EPEW Conference"
                description="Annual ecosystem conference with entrepreneurs, partners, supporters and community leaders."
              />

              <DefaultCard
                title="Annual Celebration"
                description="Celebrate another successful year of entrepreneur development."
              />

              <DefaultCard
                title="Recognition Ceremony"
                description="Recognizing entrepreneurs, supporters, coaches and partners for their contribution."
              />

            </div>

          ) : (

            <div className="grid xl:grid-cols-2 gap-6">

              {ecosystemInvitations.map((item) => (

                <EcosystemCard key={item.id} item={item} />

              ))}

            </div>

          )}

        </div>

      </div>

    </section>
  );
}

function PersonalCard({ item }: { item: PersonalInvitation }) {
  return (
    <div className="bg-[#f5f7fb] rounded-3xl shadow-lg p-8">

      <span className="inline-block bg-green-700 text-white px-4 py-2 rounded-full font-bold mb-4">
        {item.event}
      </span>

      <h3 className="text-3xl font-extrabold text-[#06245c]">
        {item.business}
      </h3>

      <p className="text-xl mt-2">
        {item.entrepreneur}
      </p>

      <div className="mt-6 space-y-2 text-lg text-gray-700">

        <p>
          <strong>Date:</strong> {item.date}
        </p>

        <p>
          <strong>Location:</strong> {item.location}
        </p>

        <p>
          <strong>Status:</strong> {item.status}
        </p>

      </div>

      <div className="flex flex-wrap gap-3 mt-8">

        <button className="bg-green-700 text-white px-5 py-3 rounded-2xl font-bold hover:bg-green-800">
          Accept Invitation
        </button>

        <button className="bg-[#06245c] text-white px-5 py-3 rounded-2xl font-bold hover:bg-blue-700">
          Watch Live
        </button>

        <button className="border-2 border-[#06245c] px-5 py-3 rounded-2xl font-bold text-[#06245c] hover:bg-[#06245c] hover:text-white">
          Send Congratulations
        </button>

      </div>

    </div>
  );
}

function EcosystemCard({ item }: { item: EcosystemInvitation }) {
  return (
    <div className="bg-[#f5f7fb] rounded-3xl shadow-lg p-8">

      <h3 className="text-3xl font-extrabold text-[#06245c]">
        {item.title}
      </h3>

      <p className="text-xl mt-4 text-gray-700 leading-relaxed">
        {item.description}
      </p>

      <div className="mt-6 text-lg space-y-2">

        <p>
          <strong>Date:</strong> {item.date}
        </p>

        <p>
          <strong>Location:</strong> {item.location}
        </p>

        <p>
          <strong>Status:</strong> {item.status}
        </p>

      </div>

      <button className="mt-8 bg-[#06245c] text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700">
        Reserve My Seat
      </button>

    </div>
  );
}

function DefaultCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gradient-to-r from-[#06245c] to-green-700 rounded-3xl p-8 text-white">

      <h3 className="text-3xl font-extrabold mb-4">
        {title}
      </h3>

      <p className="text-xl leading-relaxed text-blue-100">
        {description}
      </p>

      <button className="mt-8 bg-white text-[#06245c] px-6 py-3 rounded-2xl font-bold hover:bg-lime-300">
        Learn More
      </button>

    </div>
  );
}

function EmptyInvitation({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="bg-[#f5f7fb] rounded-3xl p-10 text-center">

      <h3 className="text-3xl font-extrabold text-[#06245c] mb-4">
        {title}
      </h3>

      <p className="text-xl text-gray-700 leading-relaxed">
        {message}
      </p>

    </div>
  );
}