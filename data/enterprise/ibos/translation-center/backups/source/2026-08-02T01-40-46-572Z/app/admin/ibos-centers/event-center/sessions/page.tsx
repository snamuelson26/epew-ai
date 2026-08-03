"use client";

import { useState } from "react";
import Link from "next/link";

export default function EventSessionsPage() {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Annual Meeting");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [venue, setVenue] = useState("");
  const [location, setLocation] = useState("");
  const [entrepreneurCapacity, setEntrepreneurCapacity] = useState("50");
  const [guestCapacity, setGuestCapacity] = useState("50");
  const [registrationDeadline, setRegistrationDeadline] = useState("");

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
      <section className="mb-8 rounded-[2rem] bg-gradient-to-r from-black via-[#06245c] to-green-900 p-10 text-white shadow-2xl">
        <Link
          href="/admin/ibos-centers/event-center"
          className="text-lg font-black text-lime-300"
        >
          ← Back to Event Center
        </Link>

        <p className="mt-8 text-xl font-black uppercase tracking-[0.45em] text-lime-300">
          Event Sessions
        </p>

        <h1 className="mt-4 text-6xl font-extrabold">
          Create & Manage
          <br />
          Official Event Sessions
        </h1>

        <p className="mt-6 max-w-6xl text-2xl leading-relaxed text-blue-100">
          Create Annual Meetings, Business Launch Ceremonies, certification
          events, community recognition programs, and accreditation sessions.
        </p>
      </section>

      <section className="grid gap-8 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-extrabold text-[#06245c]">
            Create Event Session
          </h2>

          <div className="mt-8 space-y-5">
            <Field
              label="Event Session Name"
              value={eventName}
              onChange={setEventName}
              placeholder="Example: EPEW Annual Meeting – Queens"
            />

            <label className="block">
              <span className="text-lg font-black">Event Type</span>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-4 font-bold"
              >
                <option>Annual Meeting</option>
                <option>Business Launch Ceremony</option>
                <option>Coach Certification</option>
                <option>Partner Certification</option>
                <option>Community Recognition</option>
                <option>Accreditation</option>
                <option>International Summit</option>
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Event Date"
                value={eventDate}
                onChange={setEventDate}
                type="date"
              />

              <Field
                label="Start Time"
                value={startTime}
                onChange={setStartTime}
                type="time"
              />
            </div>

            <Field
              label="Venue"
              value={venue}
              onChange={setVenue}
              placeholder="Venue name"
            />

            <Field
              label="Location"
              value={location}
              onChange={setLocation}
              placeholder="City, State / Country"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Entrepreneur Capacity"
                value={entrepreneurCapacity}
                onChange={setEntrepreneurCapacity}
                type="number"
              />

              <Field
                label="Guest Capacity"
                value={guestCapacity}
                onChange={setGuestCapacity}
                type="number"
              />
            </div>

            <Field
              label="Registration Deadline"
              value={registrationDeadline}
              onChange={setRegistrationDeadline}
              type="datetime-local"
            />

            <button className="w-full rounded-2xl bg-green-700 px-8 py-4 text-lg font-black text-white hover:bg-green-800">
              Save Event Session
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-extrabold text-[#06245c]">
            Event Sessions List
          </h2>

          <div className="mt-8 overflow-x-auto rounded-2xl border">
            <table className="min-w-full">
              <thead className="bg-[#06245c] text-white">
                <tr>
                  <th className="p-4 text-left">Session</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left">Capacity</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-bold">EPEW Annual Meeting – Queens</td>
                  <td className="p-4">Annual Meeting</td>
                  <td className="p-4">Not Set</td>
                  <td className="p-4">Queens, NY</td>
                  <td className="p-4">50 Entrepreneurs / 50 Guests</td>
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
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-lg font-black">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-300 bg-[#f8fafc] p-4 font-bold"
      />
    </label>
  );
}