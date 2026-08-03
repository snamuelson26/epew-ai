"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [submittedBy, setSubmittedBy] = useState("");
  const [userType, setUserType] = useState("Entrepreneur");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setTickets([]);
      setLoading(false);
      return;
    }

    setTickets(data || []);
    setLoading(false);
  }

  async function createTicket() {
    if (!submittedBy || !subject || !message) {
      alert("Please enter submitted by, subject, and message.");
      return;
    }

    const { error } = await supabase.from("admin_support_tickets").insert([
      {
        submitted_by: submittedBy,
        user_type: userType,
        subject,
        priority,
        message,
        status: "Open",
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setSubmittedBy("");
    setUserType("Entrepreneur");
    setSubject("");
    setPriority("Normal");
    setMessage("");

    loadTickets();
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from("admin_support_tickets")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadTickets();
  }

  function statusColor(status: string) {
    if (status === "Open") return "bg-yellow-100 text-yellow-800";
    if (status === "In Progress") return "bg-blue-100 text-blue-800";
    if (status === "Resolved") return "bg-green-100 text-green-800";
    if (status === "Closed") return "bg-gray-200 text-gray-800";
    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Support Tickets...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Support Tickets
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage member questions, technical issues, payment concerns, platform
        problems, and support requests.
      </p>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Create Support Ticket
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <input
            className="border rounded-xl p-4"
            placeholder="Submitted By"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
          >
            <option>Entrepreneur</option>
            <option>Supporter</option>
            <option>Coach</option>
            <option>Partner</option>
            <option>Admin</option>
            <option>Guest</option>
          </select>

          <input
            className="border rounded-xl p-4"
            placeholder="Ticket Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option>Low</option>
            <option>Normal</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </div>

        <textarea
          className="border rounded-xl p-4 w-full min-h-[180px] mb-6"
          placeholder="Describe the issue or request..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          onClick={createTicket}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No support tickets yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Submitted By</th>
                <th className="text-left p-4">User Type</th>
                <th className="text-left p-4">Subject</th>
                <th className="text-left p-4">Priority</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b">
                  <td className="p-4">
                    {ticket.created_at
                      ? new Date(ticket.created_at).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="p-4 font-bold">
                    {ticket.submitted_by || "-"}
                  </td>

                  <td className="p-4">{ticket.user_type || "-"}</td>

                  <td className="p-4 max-w-[300px]">
                    {ticket.subject || "-"}
                  </td>

                  <td className="p-4">{ticket.priority || "Normal"}</td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status || "Open"}
                    </span>
                  </td>

                  <td className="p-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateStatus(ticket.id, "In Progress")}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                    >
                      In Progress
                    </button>

                    <button
                      onClick={() => updateStatus(ticket.id, "Resolved")}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Resolved
                    </button>

                    <button
                      onClick={() => updateStatus(ticket.id, "Closed")}
                      className="bg-gray-700 text-white px-4 py-2 rounded-xl"
                    >
                      Closed
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}