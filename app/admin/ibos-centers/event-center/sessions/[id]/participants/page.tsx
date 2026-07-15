"use client";

import Link from "next/link";

export default function EventParticipantsPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
      <section className="mb-8 rounded-[2rem] bg-gradient-to-r from-black via-[#06245c] to-green-900 p-10 text-white shadow-2xl">
        <Link
          href="/admin/ibos-centers/event-center/sessions/1"
          className="text-lg font-black text-lime-300"
        >
          ← Back to Event Command Center
        </Link>

        <p className="mt-8 text-xl font-black uppercase tracking-[0.45em] text-lime-300">
          IBOS Event Participants
        </p>

        <h1 className="mt-4 text-6xl font-extrabold">
          Official Participant
          <br />
          Management
        </h1>

        <p className="mt-6 max-w-6xl text-2xl leading-relaxed text-blue-100">
          Assign qualified entrepreneurs, verify attendance eligibility, manage
          guest invitations, and prepare every participant for the official
          event.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
        <Stat title="Qualified" value="50" note="Entrepreneurs" />
        <Stat title="Assigned" value="18" note="Already Assigned" />
        <Stat title="Remaining" value="32" note="Available Seats" />
        <Stat title="Guests Registered" value="11" note="Official Guests" />
        <Stat title="Certificates Ready" value="18" note="Generated" />
        <Stat title="Attendance" value="0" note="Checked In" />
      </section>

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-green-700">
          Current Session
        </p>

        <div className="mt-4 grid gap-6 md:grid-cols-5">
          <Info title="Event" value="EPEW Annual Meeting" />
          <Info title="Session" value="Queens Session" />
          <Info title="Date" value="July 18, 2026" />
          <Info title="Capacity" value="50 Entrepreneurs / 50 Guests" />
          <Info title="Status" value="Registration Open" green />
        </div>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-extrabold">
                  Search Qualified Entrepreneurs
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  Search, filter, and assign eligible entrepreneurs to this
                  event session.
                </p>
              </div>

              <button className="rounded-2xl bg-green-700 px-8 py-4 font-black text-white hover:bg-green-800">
                Auto Fill Session
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <input
                placeholder="Search entrepreneur..."
                className="rounded-xl border p-4 font-bold"
              />

              <select className="rounded-xl border p-4 font-bold">
                <option>Coach</option>
              </select>

              <select className="rounded-xl border p-4 font-bold">
                <option>Business Category</option>
              </select>

              <select className="rounded-xl border p-4 font-bold">
                <option>Funding Status</option>
              </select>

              <select className="rounded-xl border p-4 font-bold">
                <option>Qualification Score</option>
                <option>100%</option>
                <option>90%+</option>
                <option>80%+</option>
              </select>

              <select className="rounded-xl border p-4 font-bold">
                <option>Marketplace Ready</option>
                <option>Ready</option>
                <option>Not Ready</option>
              </select>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <button className="rounded-xl bg-[#06245c] px-8 py-3 font-black text-white">
                Search
              </button>

              <button className="rounded-xl bg-gray-200 px-8 py-3 font-black text-[#06245c]">
                Clear
              </button>

              <button className="rounded-xl bg-green-700 px-8 py-3 font-black text-white">
                Assign Selected
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-4xl font-extrabold">
              Available Entrepreneurs
            </h2>

            <div className="mt-8 overflow-x-auto rounded-2xl border">
              <table className="min-w-full">
                <thead className="bg-[#06245c] text-white">
                  <tr>
                    <th className="p-4 text-left">Photo</th>
                    <th className="p-4 text-left">Entrepreneur</th>
                    <th className="p-4 text-left">Business</th>
                    <th className="p-4 text-left">Coach</th>
                    <th className="p-4 text-left">Qualification</th>
                    <th className="p-4 text-left">Units</th>
                    <th className="p-4 text-left">Marketplace</th>
                    <th className="p-4 text-left">Guest</th>
                    <th className="p-4 text-left">Assigned</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b">
                    <td className="p-4 text-3xl">👤</td>
                    <td className="p-4 font-black">Samuel Nelson</td>
                    <td className="p-4">Kleernest LLC</td>
                    <td className="p-4">Coach Smith</td>
                    <td className="p-4">
                      <span className="rounded-xl bg-green-100 px-3 py-2 font-bold text-green-700">
                        100%
                      </span>
                    </td>
                    <td className="p-4">20 Units</td>
                    <td className="p-4">
                      <span className="rounded-xl bg-green-100 px-3 py-2 font-bold text-green-700">
                        Ready
                      </span>
                    </td>
                    <td className="p-4">No Guest</td>
                    <td className="p-4">
                      <span className="rounded-xl bg-blue-100 px-3 py-2 font-bold text-blue-700">
                        Assigned
                      </span>
                    </td>
                    <td className="flex gap-2 p-4">
                      <button className="rounded-lg bg-[#06245c] px-4 py-2 font-bold text-white">
                        Open
                      </button>
                      <button className="rounded-lg bg-green-700 px-4 py-2 font-bold text-white">
                        Assign
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-3xl font-extrabold">Session Summary</h2>

            <div className="mt-6 space-y-4">
              <Summary label="Capacity" value="50" />
              <Summary label="Assigned" value="18" />
              <Summary label="Remaining" value="32" />
              <Summary label="Certificates" value="18" />
              <Summary label="Guests" value="11" />
              <Summary label="Attendance" value="0" />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-3xl font-extrabold">Recently Assigned</h2>

            <div className="mt-6 rounded-2xl border p-5">
              <p className="font-black">Samuel Nelson</p>
              <p className="text-gray-600">Kleernest LLC</p>
              <p className="mt-3 rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-700">
                Assigned 2 minutes ago
              </p>
              <p className="mt-3 text-sm font-bold text-gray-600">
                Coach Smith
              </p>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-3xl font-extrabold">Assignment Progress</h2>

            <div className="mt-6 h-5 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-[36%] rounded-full bg-green-700" />
            </div>

            <p className="mt-4 text-3xl font-extrabold text-green-700">
              36%
            </p>

            <p className="mt-1 font-bold text-gray-600">
              18 / 50 Assigned
            </p>
          </section>
        </aside>
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
      <h2 className="mt-4 text-4xl font-extrabold">{value}</h2>
      <p className="mt-2 font-bold text-gray-600">{note}</p>
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
      <p className="text-sm font-black uppercase text-gray-500">{title}</p>
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-3">
      <p className="font-bold text-gray-600">{label}</p>
      <p className="text-xl font-black text-[#06245c]">{value}</p>
    </div>
  );
}