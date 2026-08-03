"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupporterMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<any>(null);
  const [recipientType, setRecipientType] = useState("EPEW Admin");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSupporter();
  }, []);

  async function loadSupporter() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/supporters/login";
      return;
    }

    const { data } = await supabase
      .from("supporters")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data) {
      window.location.href = "/supporters/login";
      return;
    }

    setSupporter(data);
    setLoading(false);
  }

  async function sendMessage() {
    if (!supporter) {
      alert("Supporter profile not found.");
      return;
    }

    if (!subject || !message) {
      alert("Please enter a subject and message.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("supporter_messages").insert([
      {
        supporter_id: supporter.supporter_id,
        supporter_email: supporter.email,
        supporter_name: supporter.full_name,
        recipient_type: recipientType,
        subject,
        message,
        status: "New",
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.log(error);
      alert("Unable to send message.\n\n" + error.message);
      return;
    }

    alert("Message sent successfully.");
    setSubject("");
    setMessage("");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <p className="text-2xl font-bold">Loading messages...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">Messages</h1>

        <p className="text-xl text-gray-700">
          Contact EPEW administration, coaches, or entrepreneur support teams.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-3xl font-bold mb-6">Message Center</h2>

          <div className="space-y-5">
            <div>
              <label className="font-bold block mb-2">Recipient</label>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                className="border rounded-2xl p-4 text-lg w-full"
              >
                <option>EPEW Admin</option>
                <option>Assigned Coach</option>
                <option>Entrepreneur Support Team</option>
                <option>Payment Support</option>
                <option>Technical Support</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter message subject"
                className="border rounded-2xl p-4 text-lg w-full"
              />
            </div>

            <div>
              <label className="font-bold block mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                rows={8}
                className="border rounded-2xl p-4 text-lg w-full"
              />
            </div>

            <button
              type="button"
              onClick={sendMessage}
              disabled={submitting}
              className="w-full bg-green-700 text-white py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] transition"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-3xl font-bold mb-6">Message History</h2>

          <p className="text-xl text-gray-700 mb-6">
            Your submitted messages and responses will appear here once the full
            messaging system is activated.
          </p>

          <div className="space-y-4">
            <div className="bg-[#f5f7fb] rounded-2xl p-6">
              <p className="font-bold text-lg">Message Status</p>
              <p className="text-gray-700">
                New messages will be reviewed by EPEW administration.
              </p>
            </div>

            <div className="bg-[#f5f7fb] rounded-2xl p-6">
              <p className="font-bold text-lg">Typical Response</p>
              <p className="text-gray-700">
                EPEW support will respond through the portal or by email.
              </p>
            </div>

            <div className="bg-[#f5f7fb] rounded-2xl p-6">
              <p className="font-bold text-lg">Support Areas</p>
              <p className="text-gray-700">
                Contribution plans, entrepreneur support, payment questions,
                reports, and technical support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}