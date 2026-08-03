"use client";

import Link from "next/link";

export default function GuestRegistrationPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">

      {/* HERO */}

      <section className="mb-8 rounded-[2rem] bg-gradient-to-r from-black via-[#06245c] to-green-900 p-10 text-white shadow-2xl">

        <Link
          href="/admin/ibos-centers/event-center/sessions/1"
          className="text-lg font-black text-lime-300"
        >
          ← Back to Event Command Center
        </Link>

        <p className="mt-8 text-xl font-black uppercase tracking-[0.45em] text-lime-300">
          OFFICIAL GUEST REGISTRATION
        </p>

        <h1 className="mt-4 text-6xl font-extrabold">
          Guest Management
          <br />
          Center
        </h1>

        <p className="mt-6 max-w-6xl text-2xl leading-relaxed text-blue-100">
          Register, verify, manage, and prepare every official guest attending
          this EPEW event.
        </p>

      </section>

      {/* STATISTICS */}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">

        <Stat title="Invited" value="18" note="Eligible Guests" />

        <Stat title="Registered" value="11" note="Completed" />

        <Stat title="Pending" value="7" note="Invitation Sent" />

        <Stat title="Badges" value="11" note="Generated" />

        <Stat title="QR Codes" value="11" note="Ready" />

        <Stat title="Checked In" value="0" note="Attendance" />

      </section>

      {/* EVENT */}

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">

        <p className="text-sm font-black uppercase tracking-[0.2em] text-green-700">
          Current Session
        </p>

        <div className="mt-4 grid gap-6 md:grid-cols-5">

          <Info title="Event" value="Annual Meeting" />

          <Info title="Session" value="Queens Session" />

          <Info title="Capacity" value="50 Guests" />

          <Info title="Remaining" value="39 Seats" />

          <Info title="Status" value="Registration Open" green />

        </div>

      </section>

      {/* SEARCH */}

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-4xl font-extrabold">
              Guest Registration
            </h2>

            <p className="mt-2 text-lg text-gray-600">
              Manage official guests invited by qualified entrepreneurs.
            </p>

          </div>

          <button className="rounded-2xl bg-green-700 px-8 py-4 font-black text-white">
            Register Guest
          </button>

        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">

          <input
            placeholder="Search guest..."
            className="rounded-xl border p-4 font-bold"
          />

          <select className="rounded-xl border p-4 font-bold">
            <option>Entrepreneur</option>
          </select>

          <select className="rounded-xl border p-4 font-bold">
            <option>Status</option>
          </select>

          <select className="rounded-xl border p-4 font-bold">
            <option>Attendance</option>
          </select>

        </div>

      </section>

      {/* TABLE */}

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">

        <h2 className="text-4xl font-extrabold">
          Official Guests
        </h2>

        <div className="mt-8 overflow-x-auto rounded-2xl border">

          <table className="min-w-full">

            <thead className="bg-[#06245c] text-white">

              <tr>

                <th className="p-4 text-left">Photo</th>

                <th className="p-4 text-left">Guest</th>

                <th className="p-4 text-left">Entrepreneur</th>

                <th className="p-4 text-left">Business</th>

                <th className="p-4 text-left">Badge</th>

                <th className="p-4 text-left">QR</th>

                <th className="p-4 text-left">Attendance</th>

                <th className="p-4 text-left">Actions</th>

              </tr>

            </thead>

            <tbody>

              <tr className="border-b">

                <td className="p-4 text-3xl">👤</td>

                <td className="p-4 font-black">
                  Guest Name
                </td>

                <td className="p-4">
                  Samuel Nelson
                </td>

                <td className="p-4">
                  Kleernest LLC
                </td>

                <td className="p-4">

                  <span className="rounded-xl bg-green-100 px-3 py-2 font-bold text-green-700">
                    Ready
                  </span>

                </td>

                <td className="p-4">

                  <span className="rounded-xl bg-blue-100 px-3 py-2 font-bold text-blue-700">
                    Generated
                  </span>

                </td>

                <td className="p-4">

                  <span className="rounded-xl bg-yellow-100 px-3 py-2 font-bold text-yellow-700">
                    Pending
                  </span>

                </td>

                <td className="flex gap-2 p-4">

                  <button className="rounded-lg bg-[#06245c] px-4 py-2 font-bold text-white">
                    View
                  </button>

                  <button className="rounded-lg bg-green-700 px-4 py-2 font-bold text-white">
                    Badge
                  </button>

                  <button className="rounded-lg bg-purple-700 px-4 py-2 font-bold text-white">
                    QR
                  </button>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </section>

    </main>
  );
}

function Stat({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">
        {title}
      </p>
      <h2 className="mt-4 text-4xl font-extrabold">
        {value}
      </h2>
      <p className="mt-2 font-bold text-gray-600">
        {note}
      </p>
    </div>
  );
}

function Info({
  title,
  value,
  green,
}: {
  title: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-black uppercase text-gray-500">
        {title}
      </p>

      <p
        className={`mt-2 text-xl font-extrabold ${
          green ? "text-green-700" : "text-[#06245c]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}