"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminAnnualMeetingsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [groupName, setGroupName] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [location, setLocation] = useState("");
 const [capacity, setCapacity] = useState("50");

  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadAnnualMeetings();
  }, []);

  async function loadAnnualMeetings() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_annual_meetings")
      .select("*")
      .order("meeting_date", { ascending: true });

    if (error) {
      console.log(error);
      setRecords([]);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);
  }

  async function createMeeting() {
    if (!groupName || !meetingDate || !meetingTime || !location) {
      alert("Please enter group name, date, time, and location.");
      return;
    }

    const { error } = await supabase.from("admin_annual_meetings").insert([
      {
        group_name: groupName,
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        location,
        capacity: Number(capacity || 0),
        confirmed_attendees: 0,
        guests_registered: 0,
        status: "Scheduled",
        notes,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setGroupName("");
    setMeetingDate("");
    setMeetingTime("");
    setLocation("");
    setCapacity("");
    setNotes("");

    loadAnnualMeetings();
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from("admin_annual_meetings")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadAnnualMeetings();
  }

  function statusColor(status: string) {
    if (status === "Completed") return "bg-green-100 text-green-800";
    if (status === "Scheduled") return "bg-blue-100 text-blue-800";
    if (status === "In Progress") return "bg-purple-100 text-purple-800";
    if (status === "Cancelled") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  }

  const totalMeetings = records.length;
  const scheduled = records.filter((r) => r.status === "Scheduled").length;
  const completed = records.filter((r) => r.status === "Completed").length;
  const totalConfirmed = records.reduce(
    (sum, r) => sum + Number(r.confirmed_attendees || 0),
    0
  );
  const totalGuests = records.reduce(
    (sum, r) => sum + Number(r.guests_registered || 0),
    0
  );
  const totalCapacity = records.reduce(
    (sum, r) => sum + Number(r.capacity || 0),
    0
  );
  const availableSeats = totalCapacity - totalConfirmed - totalGuests;

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Annual Meetings...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
     <section className="mb-10 overflow-hidden rounded-[2rem] bg-gradient-to-r from-black via-[#06245c] to-green-900 text-white shadow-2xl">

  <div className="p-10">

    <p className="text-lg font-black uppercase tracking-[0.45em] text-lime-300">
      EPEW Administration
    </p>

    <h1 className="mt-4 text-6xl font-extrabold leading-tight">
      Annual Meeting
      <br />
      Administration Center
    </h1>

    <p className="mt-6 max-w-6xl text-2xl leading-relaxed text-blue-100">
      Official Certification • Registration • ORGDH Gives Back Raffle •
      Funding Queue • Certificate Presentation • Public Verification
    </p>

  </div>

</section>

<div className="mb-10 rounded-3xl border-l-[10px] border-green-600 bg-white p-8 shadow-xl">

    <div className="flex items-center justify-between">

        <div>

            <p className="text-sm font-black uppercase tracking-[0.25em] text-gray-500">
                Event Status
            </p>

            <h2 className="mt-2 text-4xl font-extrabold text-[#06245c]">
                🟢 Registration Open
            </h2>

            <p className="mt-3 text-lg text-gray-600">
                Entrepreneurs and guests may register for the Annual Meeting.
            </p>

        </div>

        <button className="rounded-2xl bg-[#06245c] px-8 py-4 text-lg font-bold text-white">
            Change Status
        </button>

    </div>

</div>

      <p className="text-lg text-gray-700 mb-10">
    
      </p>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
  <Card title="Meeting Year" value="2026" color="text-[#06245c]" />
  <Card title="Meeting Date" value={records[0]?.meeting_date || "Not Set"} color="text-blue-700" />
  <Card title="Qualified Entrepreneurs" value="50" color="text-green-700" />
  <Card title="Registered Entrepreneurs" value={totalConfirmed} color="text-purple-700" />
  <Card title="Registered Guests" value={totalGuests} color="text-yellow-700" />
  <Card title="Remaining Seats" value={availableSeats} color="text-red-700" />
  <Card title="Priority Positions" value="0 / 10" color="text-[#06245c]" />
  <Card title="Certificates Generated" value="0" color="text-green-700" />
</div>

     <div className="mb-10 rounded-3xl border-l-[10px] border-yellow-500 bg-white p-8 shadow-xl">
  <h2 className="text-2xl font-extrabold text-[#06245c]">
    Annual Meeting Policy
  </h2>

  <p className="mt-3 text-lg leading-relaxed text-gray-700">
    Each Annual Meeting recognizes up to{" "}
    <span className="font-black text-[#06245c]">50 qualified entrepreneurs</span>.
    Each entrepreneur may invite{" "}
    <span className="font-black text-[#06245c]">one official guest</span>.
    Registration closes at the beginning of the ceremony. Up to{" "}
    <span className="font-black text-[#06245c]">10 Priority Funding Positions</span>{" "}
    may be assigned before the live{" "}
    <span className="font-black text-green-700">ORGDH Gives Back raffle</span>.
    The raffle determines the remaining funding queue positions for all
    qualified entrepreneurs in attendance.
  </p>
</div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="mb-2 text-4xl font-extrabold text-[#06245c]">
  Event Setup
</h2>

<p className="mb-8 text-lg text-gray-600">
  Configure the official Annual Meeting, registration rules, event capacity,
  and certification settings.
</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <input
            className="border rounded-xl p-4"
            placeholder="Annual Meeting Name (Example: EPEW Annual Meeting 2026)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <input
            type="date"
            className="border rounded-xl p-4"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
          />

          <input
            type="time"
            className="border rounded-xl p-4"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
          />

          <input
            className="border rounded-xl p-4"
           placeholder="Venue / Meeting Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <input
            type="number"
            className="border rounded-xl p-4"
            placeholder="Maximum Qualified Entrepreneurs"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />

          <div>
  <label className="mb-2 block text-lg font-bold text-[#06245c]">
    Maximum Official Guests
  </label>

  <input
    type="number"
    value="50"
    readOnly
    className="w-full rounded-xl border border-gray-300 bg-gray-100 p-4 font-bold"
  />
</div>

<div>
  <label className="mb-2 block text-lg font-bold text-[#06245c]">
    Registration Deadline
  </label>

  <input
    type="datetime-local"
    className="w-full rounded-xl border border-gray-300 p-4"
  />
</div>
        </div>

        <textarea
          className="border rounded-xl p-4 w-full min-h-[140px] mb-6"
          placeholder="Meeting notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={createMeeting}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
         Save Event Configuration
        </button>
      </div>

<div className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
  <div className="mb-8 flex items-start justify-between">
    <div>
      <h2 className="text-4xl font-extrabold text-[#06245c]">
        Qualified Entrepreneurs
      </h2>

      <p className="mt-2 text-lg text-gray-600">
        Entrepreneurs approved to participate in the Annual Meeting.
      </p>
    </div>

    <button className="rounded-2xl bg-green-700 px-8 py-4 font-bold text-white hover:bg-green-800">
      Refresh List
    </button>
  </div>

  <div className="mb-8 grid gap-4 md:grid-cols-4">
    <input
      placeholder="Search entrepreneur..."
      className="rounded-xl border p-4"
    />

    <select className="rounded-xl border p-4">
      <option>All Coaches</option>
    </select>

    <select className="rounded-xl border p-4">
      <option>Qualification Status</option>
      <option>Qualified</option>
      <option>Pending</option>
    </select>

    <select className="rounded-xl border p-4">
      <option>Attendance</option>
      <option>Present</option>
      <option>Absent</option>
    </select>
  </div>

  <div className="overflow-x-auto rounded-2xl border">
    <table className="min-w-full">
      <thead className="bg-[#06245c] text-white">
        <tr>
          <th className="p-4">Photo</th>
          <th className="p-4">Entrepreneur</th>
          <th className="p-4">Business</th>
          <th className="p-4">Coach</th>
          <th className="p-4">Qualified</th>
          <th className="p-4">Guest</th>
          <th className="p-4">Attendance</th>
          <th className="p-4">Certificate</th>
          <th className="p-4">Priority</th>
          <th className="p-4">Queue</th>
          <th className="p-4">Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr className="border-b">
          <td className="p-4 text-center text-3xl">👤</td>
          <td className="p-4 font-bold">Samuel Nelson</td>
          <td className="p-4">Kleernest LLC</td>
          <td className="p-4">Coach Pending</td>

          <td className="p-4">
            <span className="rounded-xl bg-green-100 px-3 py-2 font-bold text-green-700">
              Qualified
            </span>
          </td>

          <td className="p-4">No</td>
          <td className="p-4">Not Registered</td>
          <td className="p-4">Generated</td>
          <td className="p-4">—</td>
          <td className="p-4">—</td>

          <td className="flex gap-2 p-4">
            <button className="rounded-lg bg-[#06245c] px-4 py-2 text-white">
              View
            </button>

            <button className="rounded-lg bg-green-700 px-4 py-2 text-white">
              Certificate
            </button>

            <button className="rounded-lg bg-purple-700 px-4 py-2 text-white">
              Attendance
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
    </main>
  );
}

function Card({
  title,           
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h2 className="text-lg font-bold text-gray-600">{title}</h2>
      <p className={`text-4xl font-extrabold mt-4 ${color}`}>{value}</p>
    </div>
  );
}  