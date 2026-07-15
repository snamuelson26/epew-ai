"use client";

interface EntrepreneurParticipant {
  id: string;
  entrepreneur_name?: string;
  business_name?: string;
  public_business_id?: string;
  coach_name?: string;
  units_supported?: number;
  units_required?: number;
  attendance_type?: string;
  rsvp_status?: string;
  checked_in?: boolean;
  status?: string;
  qualification_status?: string;
}

interface SupporterParticipant {
  id: string;
  supporter_name?: string;
  supporter_email?: string;
  entrepreneur_name?: string;
  business_name?: string;
  public_business_id?: string;
  units_supported?: number;
  attendance_type?: string;
  rsvp_status?: string;
  checked_in?: boolean;
  support_type?: string;
}

export default function ParticipantsCenter({
  entrepreneurs,
  supporters,
}: {
  entrepreneurs: EntrepreneurParticipant[];
  supporters: SupporterParticipant[];
}) {
  const checkedInEntrepreneurs = entrepreneurs.filter((x) => x.checked_in).length;
  const checkedInSupporters = supporters.filter((x) => x.checked_in).length;

  return (
    <section className="mb-10">
      <div className="rounded-3xl bg-gradient-to-r from-[#06245c] to-green-700 p-10 text-white shadow-2xl">
        <p className="text-xl font-black uppercase tracking-widest text-lime-300">
          IBOS Participants Center
        </p>

        <h2 className="mt-4 text-6xl font-extrabold">
          Annual Meeting Participants
        </h2>

        <p className="mt-5 max-w-5xl text-2xl leading-relaxed text-blue-100">
          Manage entrepreneurs, supporters, coaches, partners, guests,
          attendance type, RSVP status, and check-in for the Annual Meeting.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <SummaryCard title="Entrepreneurs" value={entrepreneurs.length} icon="👨‍💼" />
        <SummaryCard title="Supporters" value={supporters.length} icon="💚" />
        <SummaryCard title="Entrepreneurs Checked In" value={checkedInEntrepreneurs} icon="✅" />
        <SummaryCard title="Supporters Checked In" value={checkedInSupporters} icon="🎟️" />
      </div>

      <div className="mt-10 rounded-3xl bg-white p-10 shadow-xl">
        <h3 className="text-4xl font-extrabold text-[#06245c]">
          👨‍💼 Entrepreneur Participants
        </h3>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#06245c] text-white">
              <tr>
                <th className="px-6 py-5 text-left">Entrepreneur</th>
                <th className="px-6 py-5 text-left">Business</th>
                <th className="px-6 py-5 text-left">Coach</th>
                <th className="px-6 py-5 text-center">CSUs</th>
                <th className="px-6 py-5 text-center">Attendance</th>
                <th className="px-6 py-5 text-center">RSVP</th>
                <th className="px-6 py-5 text-center">Check-In</th>
              </tr>
            </thead>

            <tbody>
              {entrepreneurs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-2xl font-bold text-gray-500">
                    No entrepreneur participants found.
                  </td>
                </tr>
              ) : (
                entrepreneurs.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-5 font-black text-[#06245c]">
                      {item.entrepreneur_name || "Pending"}
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-bold">{item.business_name || "Pending"}</p>
                      <p className="text-sm font-bold text-green-700">
                        {item.public_business_id || "Business ID Pending"}
                      </p>
                    </td>

                    <td className="px-6 py-5">{item.coach_name || "Not Assigned"}</td>

                    <td className="px-6 py-5 text-center font-black">
                      {Number(item.units_supported || 0)} / {Number(item.units_required || 20)}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <Badge value={item.attendance_type || "Pending"} color="blue" />
                    </td>

                    <td className="px-6 py-5 text-center">
                      <Badge value={item.rsvp_status || "Pending"} color="orange" />
                    </td>

                    <td className="px-6 py-5 text-center">
                      <Badge value={item.checked_in ? "Checked In" : "Not Checked In"} color={item.checked_in ? "green" : "gray"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 rounded-3xl bg-white p-10 shadow-xl">
        <h3 className="text-4xl font-extrabold text-[#06245c]">
          💚 Supporter Participants
        </h3>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-green-700 text-white">
              <tr>
                <th className="px-6 py-5 text-left">Supporter</th>
                <th className="px-6 py-5 text-left">Supporting</th>
                <th className="px-6 py-5 text-left">Business</th>
                <th className="px-6 py-5 text-center">CSUs</th>
                <th className="px-6 py-5 text-center">Participation</th>
                <th className="px-6 py-5 text-center">Attendance</th>
                <th className="px-6 py-5 text-center">RSVP</th>
                <th className="px-6 py-5 text-center">Check-In</th>
              </tr>
            </thead>

            <tbody>
              {supporters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-2xl font-bold text-gray-500">
                    No supporter participants found.
                  </td>
                </tr>
              ) : (
                supporters.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-green-50">
                    <td className="px-6 py-5">
                      <p className="font-black text-[#06245c]">
                        {item.supporter_name || "Pending"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.supporter_email || ""}
                      </p>
                    </td>

                    <td className="px-6 py-5">{item.entrepreneur_name || "Pending"}</td>

                    <td className="px-6 py-5">
                      <p className="font-bold">{item.business_name || "Pending"}</p>
                      <p className="text-sm font-bold text-green-700">
                        {item.public_business_id || "Business ID Pending"}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-center font-black">
                      {item.units_supported || 0}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <Badge value={item.support_type || "Pending"} color="purple" />
                    </td>

                    <td className="px-6 py-5 text-center">
                      <Badge value={item.attendance_type || "Pending"} color="blue" />
                    </td>

                    <td className="px-6 py-5 text-center">
                      <Badge value={item.rsvp_status || "Pending"} color="orange" />
                    </td>

                    <td className="px-6 py-5 text-center">
                      <Badge value={item.checked_in ? "Checked In" : "Not Checked In"} color={item.checked_in ? "green" : "gray"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border-l-8 border-green-600 bg-green-50 p-8 shadow-xl">
        <h3 className="text-3xl font-extrabold text-[#06245c]">
          Participant Rule
        </h3>

        <p className="mt-4 text-xl leading-relaxed text-gray-700">
          Every entrepreneur admitted to the Annual Meeting must have completed
          the required 20 Community Support Units. Supporters connected to those
          entrepreneurs are automatically included in the Annual Meeting
          participant list and may attend in person, by Zoom, or through the
          official live broadcast when available.
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

function Badge({
  value,
  color,
}: {
  value: string;
  color: "green" | "blue" | "orange" | "purple" | "gray";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-gray-200 text-gray-700",
  };

  return (
    <span className={`rounded-full px-4 py-2 text-sm font-black ${styles[color]}`}>
      {value}
    </span>
  );
}