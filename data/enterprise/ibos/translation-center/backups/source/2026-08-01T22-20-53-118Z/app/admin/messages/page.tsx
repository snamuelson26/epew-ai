"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [recipientType, setRecipientType] = useState("All");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setMessages([]);
      setLoading(false);
      return;
    }

    setMessages(data || []);
    setLoading(false);
  }

  async function createMessage() {
    if (!subject || !messageBody) {
      alert("Please enter a subject and message.");
      return;
    }

    const { error } = await supabase.from("admin_messages").insert([
      {
        recipient_type: recipientType,
        subject,
        message: messageBody,
        status: "Sent",
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setRecipientType("All");
    setSubject("");
    setMessageBody("");
    loadMessages();
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Messages Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Messages Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Send and manage internal messages between EPEW administrators,
        entrepreneurs, supporters, coaches, and partners.
      </p>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Send Message
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <select
            className="border rounded-xl p-4"
            value={recipientType}
            onChange={(e) => setRecipientType(e.target.value)}
          >
            <option>All</option>
            <option>Entrepreneurs</option>
            <option>Supporters</option>
            <option>Coaches</option>
            <option>Partners</option>
            <option>Admins</option>
          </select>

          <input
            className="border rounded-xl p-4"
            placeholder="Message Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <textarea
          className="border rounded-xl p-4 w-full min-h-[180px] mb-6"
          placeholder="Write message here..."
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
        />

        <button
          onClick={createMessage}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Send Message
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No messages sent yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Recipient</th>
                <th className="text-left p-4">Subject</th>
                <th className="text-left p-4">Message</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id} className="border-b">
                  <td className="p-4">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="p-4 font-bold">
                    {msg.recipient_type || "-"}
                  </td>

                  <td className="p-4">{msg.subject || "-"}</td>

                  <td className="p-4 max-w-[400px]">
                    {msg.message || "-"}
                  </td>

                  <td className="p-4">
                    {msg.status || "Sent"}
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